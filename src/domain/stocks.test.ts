import { describe, expect, it } from 'vitest';
import { isAssetUnit, isStockUnit, qtyDecimals, roundQty, toStockUnit, unitKind, unitOrder, type AssetUnit } from './assets';
import {
  cleanStockName, isyatirimUrl, nasdaqUrls, parseIsYatirim, parseNasdaq, parseUsNumber, parseYahooChart, quoteToTl,
  sanitizeQuotes, searchStocks, withStockPrices, yahooSymbol, yahooUrls, type StockEntry,
} from './stocks';
import type { PriceBook } from './prices';
import { emptyData } from './defaults';
import * as A from './actions';
import * as L from './ledger';
import { parseBackup, serializeBackup, transactionsCSV } from './backup';
import type { Data } from './types';

const NOW = Date.UTC(2026, 10, 15, 12, 0);

describe('hisse birimi', () => {
  it('kodları doğrular ve normalleştirir', () => {
    expect(toStockUnit('BIST', ' thyao ')).toBe('BIST:THYAO');
    expect(toStockUnit('BIST', 'THYAO.IS')).toBe('BIST:THYAO');
    expect(toStockUnit('BIST', 'A1CAP')).toBe('BIST:A1CAP');
    expect(toStockUnit('US', 'aapl')).toBe('US:AAPL');
    expect(toStockUnit('US', 'BRK-B')).toBe('US:BRK.B');
    expect(toStockUnit('US', 'brk/b')).toBe('US:BRK.B');
    expect(toStockUnit('BIST', 'AB')).toBeNull();
    expect(toStockUnit('US', 'TOOLONG')).toBeNull();
    expect(toStockUnit('US', 'AB1')).toBeNull();
    expect(isStockUnit('BIST:THYAO')).toBe(true);
    expect(isStockUnit('NYSE:AAPL')).toBe(false);
    expect(isStockUnit('BIST:thyao')).toBe(false);
    expect(isAssetUnit('US:MSFT')).toBe(true);
    expect(isAssetUnit('gram')).toBe(true);
    expect(isAssetUnit('XAU')).toBe(false);
    expect(unitKind('US:MSFT')).toBe('stock');
    expect(unitKind('USD')).toBe('fx');
    expect(unitKind('ceyrek')).toBe('gold');
  });

  it('sıralama: altın, döviz, BIST, ABD; hisseler alfabetik', () => {
    const u: AssetUnit[] = ['US:AAPL', 'BIST:THYAO', 'USD', 'gram', 'BIST:ASELS', 'ceyrek'];
    expect([...u].sort(unitOrder)).toEqual(['gram', 'ceyrek', 'USD', 'BIST:ASELS', 'BIST:THYAO', 'US:AAPL']);
  });

  it('BIST tam adet, ABD kesirli adet', () => {
    expect(qtyDecimals('BIST:THYAO')).toBe(0);
    expect(qtyDecimals('US:AAPL')).toBe(6);
    expect(roundQty(3.4, 'BIST:THYAO')).toBe(3);
    expect(roundQty(0.1 + 0.2, 'US:AAPL')).toBe(0.3);
  });
});

describe('kaynak adresleri', () => {
  it('Yahoo sembolü', () => {
    expect(yahooSymbol('BIST:THYAO')).toBe('THYAO.IS');
    expect(yahooSymbol('US:BRK.B')).toBe('BRK-B');
    expect(yahooUrls('US:AAPL')[0]).toBe('https://query1.finance.yahoo.com/v8/finance/chart/AAPL?range=1d&interval=1d');
  });
  it('Nasdaq önce hisse sonra ETF', () => {
    expect(nasdaqUrls('US:VOO')).toEqual([
      'https://api.nasdaq.com/api/quote/VOO/info?assetclass=stocks',
      'https://api.nasdaq.com/api/quote/VOO/info?assetclass=etf',
    ]);
  });
  it('İş Yatırım son 10 gün', () => {
    expect(isyatirimUrl('BIST:THYAO', NOW)).toContain('hisse=THYAO&startdate=05-11-2026&enddate=15-11-2026');
  });
});

describe('ayrıştırıcılar', () => {
  it('Yahoo grafik yanıtı', () => {
    const json = { chart: { result: [{ meta: { currency: 'TRY', symbol: 'THYAO.IS', regularMarketPrice: 320.25, chartPreviousClose: 319, longName: 'Türk Hava Yollari Anonim Ortakligi' } }], error: null } };
    expect(parseYahooChart(json, 'BIST:THYAO', NOW)).toEqual({ price: 32025, ccy: 'TRY', at: NOW, source: 'yahoo', name: 'Türk Hava Yollari Anonim Ortakligi', prevClose: 31900 });
    // Para birimi borsayla uyuşmazsa alınmaz.
    expect(parseYahooChart({ chart: { result: [{ meta: { currency: 'USD', regularMarketPrice: 5 } }] } }, 'BIST:THYAO', NOW)).toBeNull();
    // Fiyat yoksa önceki kapanış.
    expect(parseYahooChart({ chart: { result: [{ meta: { currency: 'USD', previousClose: 10.5 } }] } }, 'US:X', NOW)?.price).toBe(1050);
    expect(parseYahooChart({ chart: { result: null, error: { code: 'Not Found' } } }, 'US:X', NOW)).toBeNull();
    expect(parseYahooChart('Too Many Requests', 'US:X', NOW)).toBeNull();
  });

  it('Nasdaq kotasyonu (gerçek yanıt biçimi)', () => {
    const json = {
      data: { symbol: 'AAPL', companyName: 'Apple Inc. Common Stock', stockType: 'Common Stock', primaryData: { lastSalePrice: '$356.27', netChange: '+1.39', lastTradeTimestamp: 'Nov 13, 2026', isRealTime: false, currency: null } },
      message: null,
      status: { rCode: 200 },
    };
    expect(parseNasdaq(json, 'US:AAPL', NOW)).toEqual({ price: 35627, ccy: 'USD', at: NOW, source: 'nasdaq', name: 'Apple Inc.', prevClose: 35488 });
    expect(parseNasdaq({ data: null, status: { rCode: 400, bCodeMessage: [{ code: 1001, errorMessage: 'Symbol not exists.' }] } }, 'US:AAPL', NOW)).toBeNull();
    expect(parseNasdaq({ data: { symbol: 'MSFT', primaryData: { lastSalePrice: '$1' } } }, 'US:AAPL', NOW)).toBeNull();
    // Binlik ayırıcı ve 4 ondalık ABD biçimidir.
    expect(parseNasdaq({ data: { symbol: 'BRK.A', primaryData: { lastSalePrice: '$884,460.00' } } }, 'US:BRK.A', NOW)?.price).toBe(88446000);
    expect(parseNasdaq({ data: { symbol: 'X', primaryData: { lastSalePrice: '$1.234' } } }, 'US:X', NOW)?.price).toBe(123);
  });

  it('İş Yatırım günlük veri: son kapanış', () => {
    const json = {
      ok: true,
      value: [
        { HGDG_HS_KODU: 'THYAO', HGDG_TARIH: '12-11-2026', HGDG_KAPANIS: 319.0 },
        { HGDG_HS_KODU: 'THYAO', HGDG_TARIH: '13-11-2026', HGDG_KAPANIS: 320.25 },
      ],
    };
    expect(parseIsYatirim(json, 'BIST:THYAO', NOW)).toEqual({ price: 32025, ccy: 'TRY', at: NOW, source: 'isyatirim', prevClose: 31900 });
    expect(parseIsYatirim({ ok: true, value: [] }, 'BIST:ZZZZZ', NOW)).toBeNull();
    expect(parseIsYatirim({ ok: true, value: [{ HGDG_HS_KODU: 'GARAN', HGDG_KAPANIS: 1 }] }, 'BIST:THYAO', NOW)).toBeNull();
  });

  it('ABD sayı biçimi ve şirket adı', () => {
    expect(parseUsNumber('$1,234.56')).toBe(1234.56);
    expect(parseUsNumber('N/A')).toBeNull();
    expect(cleanStockName('Alphabet Inc. Class C Capital Stock')).toBe('Alphabet Inc. Class C');
    expect(cleanStockName('Taiwan Semiconductor Manufacturing Company Ltd. American Depositary Shares')).toBe('Taiwan Semiconductor Manufacturing Company Ltd.');
  });
});

describe('TL fiyat kitabı', () => {
  const base: PriceBook = { USD: { buy: 5036, sell: 5037, at: NOW, source: 'live' } };

  it('ABD hissesi dolar kuruyla, BIST doğrudan', () => {
    const book = withStockPrices(base, {
      'US:AAPL': { price: 35627, ccy: 'USD', at: NOW, source: 'nasdaq' },
      'BIST:THYAO': { price: 32025, ccy: 'TRY', at: NOW, source: 'yahoo' },
    });
    expect(book['US:AAPL']).toEqual({ buy: Math.round((35627 * 5036) / 100), sell: Math.round((35627 * 5037) / 100), at: NOW, source: 'live' });
    expect(book['BIST:THYAO']).toEqual({ buy: 32025, sell: 32025, at: NOW, source: 'live' });
    expect(book.USD).toEqual(base.USD);
  });

  it('dolar kuru yoksa ABD hissesinin TL fiyatı üretilmez', () => {
    expect(quoteToTl({ price: 100, ccy: 'USD', at: NOW, source: 'nasdaq' }, {})).toBeNull();
    expect(quoteToTl({ price: 100, ccy: 'TRY', at: NOW, source: 'manual' }, {})?.source).toBe('manual');
  });

  it('önbellek doğrulaması bozuk kayıtları atar', () => {
    expect(
      sanitizeQuotes({
        'US:AAPL': { price: 100, ccy: 'USD', at: 1, source: 'nasdaq' },
        'BIST:THYAO': { price: 100, ccy: 'USD', at: 1, source: 'yahoo' },
        'XX:Y': { price: 1, ccy: 'TRY', at: 1, source: 'yahoo' },
        'US:MSFT': { price: -1, ccy: 'USD', at: 1, source: 'nasdaq' },
      }),
    ).toEqual({ 'US:AAPL': { price: 100, ccy: 'USD', at: 1, source: 'nasdaq' } });
  });
});

describe('hisse araması', () => {
  const list: StockEntry[] = [
    { unit: 'BIST:THYAO', symbol: 'THYAO', name: 'Türk Hava Yolları' },
    { unit: 'BIST:TUPRS', symbol: 'TUPRS', name: 'Tüpraş' },
    { unit: 'BIST:ISCTR', symbol: 'ISCTR', name: 'İş Bankası (C)' },
    { unit: 'US:AAPL', symbol: 'AAPL', name: 'Apple Inc.' },
    { unit: 'US:BRK.B', symbol: 'BRK.B', name: 'Berkshire Hathaway Inc.' },
    { unit: 'US:T', symbol: 'T', name: 'AT&T Inc.' },
  ];
  it('kod önce, sonra ad; Türkçe karakter duyarsız', () => {
    expect(searchStocks(list, 'thy').map((e) => e.symbol)).toEqual(['THYAO']);
    expect(searchStocks(list, 'hava').map((e) => e.symbol)).toEqual(['THYAO']);
    expect(searchStocks(list, 'tupras').map((e) => e.symbol)).toEqual(['TUPRS']);
    expect(searchStocks(list, 'is bank').map((e) => e.symbol)).toEqual(['ISCTR']);
    expect(searchStocks(list, 'brk-b').map((e) => e.symbol)).toEqual(['BRK.B']);
    // Tam kod eşleşmesi en önde.
    expect(searchStocks(list, 't').map((e) => e.symbol).slice(0, 3)).toEqual(['T', 'THYAO', 'TUPRS']);
    expect(searchStocks(list, '  ')).toEqual([]);
  });
});

// ───────────────────────── Defter, işlemler ve yedek ─────────────────────────

describe('hisse tutan yatırım hesabı', () => {
  const TODAY = '2026-11-15';
  const TL = (n: number) => Math.round(n * 100);
  function setup() {
    let d = emptyData();
    const bank = A.addAccount(d, { name: 'Banka', kind: 'bank', openingBalance: TL(200000), openingDate: '2026-10-01' });
    d = bank.data;
    // Altın ve hisseler aynı hesapta: açılışta 2 gram altın ve 10 THYAO.
    const inv = A.addAccount(d, {
      name: 'Midas', kind: 'investment', openingBalance: 0, openingDate: '2026-10-01',
      asset: { opening: [{ unit: 'BIST:THYAO', qty: 10, price: TL(300) }, { unit: 'gram', qty: 2, price: TL(5000) }] },
      priorContribution: TL(13000),
    });
    return { d: inv.data, bank: bank.account.id, inv: inv.account.id };
  }
  const add = (d: Data, draft: A.TxDraft) => A.addTx(d, draft, TODAY).data;

  it('altınla bir arada; değer = adet × TL fiyat (ABD hissesi dolar kuruyla)', () => {
    let { d, bank, inv } = setup();
    expect(d.accounts.find((a) => a.id === inv)!.asset!.opening.map((l) => l.unit)).toEqual(['gram', 'BIST:THYAO']);
    d = add(d, { type: 'transfer', amount: TL(17500), date: '2026-11-03', accountId: bank, toAccountId: inv, unit: 'US:AAPL', qty: 1, unitPrice: TL(17500) });
    const prices = withStockPrices(
      { USD: { buy: TL(50), sell: TL(50.1), at: NOW, source: 'live' }, gram: { buy: TL(5200), sell: TL(5300), at: NOW, source: 'live' } },
      { 'BIST:THYAO': { price: TL(320), ccy: 'TRY', at: NOW, source: 'yahoo' }, 'US:AAPL': { price: 35600, ccy: 'USD', at: NOW, source: 'nasdaq' } },
    );
    const st = L.investmentState(d, inv, prices)!;
    expect(st.asset!.positions.map((p) => [p.unit, p.qty, p.price])).toEqual([
      ['gram', 2, TL(5200)],
      ['BIST:THYAO', 10, TL(320)],
      ['US:AAPL', 1, TL(356 * 50)],
    ]);
    expect(st.currentValue).toBe(TL(2 * 5200 + 10 * 320 + 356 * 50));
    // Hisse fiyatı yoksa son işlem fiyatı.
    expect(L.investmentState(d, inv)!.asset!.positions.find((p) => p.unit === 'US:AAPL')).toMatchObject({ price: TL(17500), priceSource: 'last-tx' });
  });

  it('elde olandan fazla hisse satılamaz; geçersiz kod reddedilir', () => {
    const { d, bank, inv } = setup();
    expect(() => A.addTx(d, { type: 'transfer', amount: TL(3300), date: '2026-11-03', accountId: inv, toAccountId: bank, unit: 'BIST:THYAO', qty: 11, unitPrice: TL(300) }, TODAY)).toThrow();
    const ok = add(d, { type: 'transfer', amount: TL(3200), date: '2026-11-03', accountId: inv, toAccountId: bank, unit: 'BIST:THYAO', qty: 10, unitPrice: TL(320) });
    expect(L.assetQuantities(ok, ok.accounts.find((a) => a.id === inv)!).get('BIST:THYAO')).toBe(0);
    expect(() => A.addTx(d, { type: 'transfer', amount: TL(100), date: '2026-11-03', accountId: bank, toAccountId: inv, unit: 'NYSE:AAPL' as never, qty: 1, unitPrice: TL(100) }, TODAY)).toThrow();
  });

  it('yedekte gidip gelir; CSV birim sütununda kod ve borsa', () => {
    let { d, bank, inv } = setup();
    d = add(d, { type: 'transfer', amount: TL(500), date: '2026-11-03', accountId: bank, toAccountId: inv, unit: 'US:BRK.B', qty: 0.025, unitPrice: TL(20000) });
    const r = parseBackup(serializeBackup(d));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.accounts).toEqual(d.accounts);
      expect(r.data.txs).toEqual(d.txs);
    }
    const bad = parseBackup(JSON.stringify({ app: 'cep-defteri', version: 1, data: { ...d, txs: d.txs.map((t) => ({ ...t, unit: 'US:brk.b' })) } }));
    expect(bad.ok).toBe(false);
    const csv = transactionsCSV(d).split('\r\n');
    expect(csv[1].split(';').slice(-3)).toEqual(['0,025', 'BRK.B (ABD)', '20000,00']);
    expect(transactionsCSV(d, 'en').split('\r\n')[1].split(',').slice(-3)).toEqual(['0.025', 'BRK.B (US)', '20000.00']);
  });
});
