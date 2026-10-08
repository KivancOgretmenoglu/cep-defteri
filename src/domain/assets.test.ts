import { describe, expect, it } from 'vitest';
import { emptyData } from './defaults';
import * as A from './actions';
import * as L from './ledger';
import { parseBackup, serializeBackup, transactionsCSV } from './backup';
import { parseQty, priceFromQty, qtyFromAmount, qtyToInput, roundQty, valueOf } from './assets';
import { mergeBooks, parseCurrencyApi, parseNumberLoose, parseTruncgil, sanitizeBook, type PriceBook } from './prices';
import type { Data } from './types';

const TODAY = '2026-10-15';
const TL = (n: number) => Math.round(n * 100);
const NOW = Date.UTC(2026, 9, 15, 12);

function setup(opening?: { qty: number; price: number }) {
  let d = emptyData();
  const bank = A.addAccount(d, { name: 'Banka', kind: 'bank', openingBalance: TL(100000), openingDate: '2026-09-01' });
  d = bank.data;
  const gold = A.addAccount(d, {
    name: 'Altın', kind: 'investment', openingBalance: 0, openingDate: '2026-09-01',
    asset: { kind: 'gold', unit: 'gram' },
    openingQty: opening?.qty ?? null, openingPrice: opening ? TL(opening.price) : null,
    priorContribution: opening ? TL(opening.qty * opening.price) : null,
  });
  d = gold.data;
  const tlInv = A.addAccount(d, { name: 'Fon', kind: 'investment', openingBalance: 0, openingDate: '2026-09-01' });
  d = tlInv.data;
  return { d, bank: bank.account.id, gold: gold.account.id, fon: tlInv.account.id };
}
const add = (d: Data, draft: A.TxDraft) => A.addTx(d, draft, TODAY).data;
const book = (gramBuy: number, gramSell = gramBuy): PriceBook => ({ gram: { buy: TL(gramBuy), sell: TL(gramSell), at: NOW, source: 'live' } });

describe('varlık miktar matematiği', () => {
  it('tutar ÷ fiyat → miktar; miktar → fiyat; değer', () => {
    expect(qtyFromAmount(TL(5000), TL(3200), 'gram')).toBe(1.563);
    expect(qtyFromAmount(TL(20000), TL(5150), 'ceyrek')).toBe(3.88);
    expect(qtyFromAmount(TL(5000), 0, 'gram')).toBeNull();
    expect(priceFromQty(TL(5000), 1.5)).toBe(333333);
    expect(valueOf(12.5, TL(3245.67))).toBe(Math.round(12.5 * 324567));
    expect(roundQty(0.1 + 0.2, 'gram')).toBe(0.3);
    expect(roundQty(1.005, 'USD')).toBe(1.01);
  });
  it('miktar yazımını ayrıştırır (tr/en)', () => {
    expect(parseQty('1,5')).toBe(1.5);
    expect(parseQty('1.234')).toBe(1.234); // virgülsüz tek nokta: ondalık (gram)
    expect(parseQty('1.234,5')).toBe(1234.5);
    expect(parseQty('150.5', 'en')).toBe(150.5);
    expect(parseQty('1,234.5', 'en')).toBe(1234.5);
    expect(parseQty('0')).toBeNull();
    expect(parseQty('abc')).toBeNull();
    expect(qtyToInput(12.5, 'gram')).toBe('12,5');
    expect(qtyToInput(12.5, 'gram', 'en')).toBe('12.5');
  });
});

describe('fiyat ayrıştırma', () => {
  it('Türkçe/İngilizce sayı biçimleri', () => {
    expect(parseNumberLoose('3.245,67')).toBe(3245.67);
    expect(parseNumberLoose('29,8160')).toBe(29.816);
    expect(parseNumberLoose('1,945.47')).toBe(1945.47);
    expect(parseNumberLoose('3.245')).toBe(3245);
    expect(parseNumberLoose('12.135,50 TL')).toBe(12135.5);
    expect(parseNumberLoose(41.25)).toBe(41.25);
    expect(parseNumberLoose('')).toBeNull();
    expect(parseNumberLoose(null)).toBeNull();
  });

  it('truncgil today.json (eski biçim) — fikstür', () => {
    const fixture = {
      Update_Date: '2026-10-15 14:59:02',
      USD: { 'Alış': '41,6530', 'Satış': '41,7120', 'Tür': 'Döviz', 'Değişim': '%0,05' },
      EUR: { 'Alış': '48,3010', 'Satış': '48,4200', 'Tür': 'Döviz', 'Değişim': '%0,10' },
      GBP: { 'Alış': '55,1000', 'Satış': '55,3500', 'Tür': 'Döviz', 'Değişim': '%0,10' },
      'gram-altin': { 'Alış': '5.120,45', 'Satış': '5.125,99', 'Tür': 'Altın', 'Değişim': '%0,30' },
      'ceyrek-altin': { 'Alış': '8.290,00', 'Satış': '8.480,00', 'Tür': 'Altın', 'Değişim': '%0,30' },
      'yarim-altin': { 'Alış': '16.540,00', 'Satış': '16.910,00', 'Tür': 'Altın' },
      'tam-altin': { 'Alış': '33.020,00', 'Satış': '33.740,00', 'Tür': 'Altın' },
      'cumhuriyet-altini': { 'Alış': '34.100,00', 'Satış': '34.600,00', 'Tür': 'Altın' },
      '22-ayar-bilezik': { 'Alış': '4.650,10', 'Satış': '4.980,00', 'Tür': 'Altın' },
      'ons': { 'Alış': '$3.900,10', 'Satış': '$3.901,00' },
    };
    const b = parseTruncgil(fixture, NOW);
    expect(Object.keys(b).sort()).toEqual(['EUR', 'GBP', 'USD', 'bilezik22', 'ceyrek', 'cumhuriyet', 'gram', 'tam', 'yarim']);
    expect(b.gram).toEqual({ buy: 512045, sell: 512599, at: NOW, source: 'live' });
    expect(b.USD!.buy).toBe(4165);
    expect(b.ceyrek!.sell).toBe(848000);
  });

  it('truncgil v4 biçimi ve bozuk satırlar', () => {
    const b = parseTruncgil({ USD: { Buying: 41.65, Selling: 41.71 }, GRA: { Buying: 5120.45, Selling: 5125.99 }, EUR: { Buying: 'abc' }, GBP: { Buying: 1, Selling: 100 } }, NOW);
    expect(b.USD!.buy).toBe(4165);
    expect(b.gram!.buy).toBe(512045);
    expect(b.EUR).toBeUndefined(); // sayı yok
    expect(b.GBP).toBeUndefined(); // uçuk makas → bozuk veri
    expect(parseTruncgil('<html>', NOW)).toEqual({});
    expect(parseTruncgil(null, NOW)).toEqual({});
  });

  it('currency-api yedeği: döviz orta kur, altın onstan tahmini', () => {
    const b = parseCurrencyApi({ date: '2026-10-15', try: { usd: 0.024, eur: 0.0207, gbp: 0.0181, xau: 0.00000614 } }, NOW);
    expect(b.USD!.buy).toBe(Math.round((1 / 0.024) * 100));
    expect(b.gram!.source).toBe('estimate');
    expect(b.gram!.buy).toBe(Math.round((1 / 0.00000614 / 31.1034768) * 100));
    expect(b.ceyrek!.buy).toBeLessThan(b.gram!.buy * 2);
    const merged = mergeBooks({ USD: { buy: 1, sell: 2, at: NOW, source: 'live' } }, b);
    expect(merged.USD!.buy).toBe(1);
    expect(merged.gram!.source).toBe('estimate');
  });

  it('önbellekteki bozuk girişler atılır', () => {
    expect(sanitizeBook({ gram: { buy: 100, sell: 110, at: 1, source: 'live' }, USD: { buy: -1, sell: 1, at: 1, source: 'live' }, xx: {} })).toEqual({ gram: { buy: 100, sell: 110, at: 1, source: 'live' } });
    expect(sanitizeBook('junk')).toEqual({});
  });
});

describe('altın/döviz hesabı', () => {
  it('katkı miktar kaydeder; değer = miktar × güncel alış; hedef TL katkıyla', () => {
    let { d, bank, gold } = setup();
    d = add(d, { type: 'transfer', amount: TL(10000), date: '2026-10-01', accountId: bank, toAccountId: gold, qty: 2, unitPrice: TL(5000) });
    d = add(d, { type: 'transfer', amount: TL(5200), date: '2026-10-10', accountId: bank, toAccountId: gold, qty: 1, unitPrice: TL(5200) });
    d = A.addGoal(d, { title: 'Hedef', target: TL(20000), accountId: gold }).data;
    const st = L.investmentState(d, gold, book(5100, 5150))!;
    expect(st.asset!.qty).toBe(3);
    expect(st.currentValue).toBe(TL(15300));
    expect(st.netContribution).toBe(TL(15200));
    expect(st.valueDiff).toBe(TL(100));
    expect(st.asset!.priceSource).toBe('live');
    // Fiyat yoksa son işlem fiyatı
    const off = L.investmentState(d, gold)!;
    expect(off.asset!.priceSource).toBe('last-tx');
    expect(off.currentValue).toBe(TL(15600));
    expect(L.goalProgress(d, d.goals[0])!.current).toBe(TL(15200));
    // Günlük bakiye TL tutar kadar azalır
    expect(L.cashBalance(d, bank)).toBe(TL(100000 - 15200));
    expect(L.investmentTotal(d, book(5100))).toBe(TL(15300));
  });

  it('çekim miktarı azaltır; eldekinden fazlası çekilemez', () => {
    let { d, bank, gold } = setup();
    d = add(d, { type: 'transfer', amount: TL(10000), date: '2026-10-01', accountId: bank, toAccountId: gold, qty: 2, unitPrice: TL(5000) });
    expect(() => add(d, { type: 'transfer', amount: TL(16000), date: '2026-10-05', accountId: gold, toAccountId: bank, qty: 3, unitPrice: TL(5333) })).toThrow(A.ActionError);
    d = add(d, { type: 'transfer', amount: TL(2600), date: '2026-10-05', accountId: gold, toAccountId: bank, qty: 0.5, unitPrice: TL(5200) });
    const st = L.investmentState(d, gold, book(5000))!;
    expect(st.asset!.qty).toBe(1.5);
    expect(st.currentValue).toBe(TL(7500));
    expect(st.withdrawn).toBe(TL(2600));
  });

  it('varlık hesabına transfer miktar ve fiyat ister; TL hesabında saklanmaz', () => {
    let { d, bank, gold, fon } = setup();
    expect(() => add(d, { type: 'transfer', amount: TL(1000), date: '2026-10-01', accountId: bank, toAccountId: gold })).toThrow(/Miktar/);
    expect(() => add(d, { type: 'transfer', amount: TL(1000), date: '2026-10-01', accountId: bank, toAccountId: gold, qty: 1 })).toThrow(/fiyat/);
    d = add(d, { type: 'transfer', amount: TL(1000), date: '2026-10-01', accountId: bank, toAccountId: fon, qty: 1, unitPrice: 5 });
    const t = d.txs[d.txs.length - 1];
    expect(t.qty).toBeUndefined();
    expect(t.unitPrice).toBeUndefined();
  });

  it('açılış miktarı (mevcut birikim) açılış değerini belirler, gelir sayılmaz', () => {
    const { d, gold } = setup({ qty: 10, price: 5000 });
    const acc = d.accounts.find((a) => a.id === gold)!;
    expect(acc.openingBalance).toBe(TL(50000));
    const st = L.investmentState(d, gold, book(5100))!;
    expect(st.asset!.qty).toBe(10);
    expect(st.currentValue).toBe(TL(51000));
    expect(st.valueDiff).toBe(TL(1000));
    expect(L.monthSummary(d, '2026-09').income).toBe(0);
  });

  it('kaydı olan hesabın birimi değiştirilemez; kaydı yoksa değişebilir', () => {
    let { d, bank, gold } = setup();
    const draft = (unit: 'gram' | 'ceyrek'): A.AccountDraft => ({ name: 'Altın', kind: 'investment', openingBalance: 0, openingDate: '2026-09-01', asset: { kind: 'gold', unit } });
    d = A.updateAccount(d, gold, draft('ceyrek'));
    expect(d.accounts.find((a) => a.id === gold)!.asset!.unit).toBe('ceyrek');
    d = add(d, { type: 'transfer', amount: TL(8400), date: '2026-10-01', accountId: bank, toAccountId: gold, qty: 1, unitPrice: TL(8400) });
    expect(() => A.updateAccount(d, gold, draft('gram'))).toThrow(A.ActionError);
    expect(() => A.updateAccount(d, gold, { ...draft('gram'), asset: null })).toThrow(A.ActionError);
    // Ad değişikliği serbest
    expect(A.updateAccount(d, gold, { ...draft('ceyrek'), name: 'Çeyrekler' }).accounts.find((a) => a.id === gold)!.name).toBe('Çeyrekler');
  });

  it('planlı aktarım onayı miktarı taşır', () => {
    let { d, bank, gold } = setup();
    const p = A.addPlan(d, { kind: 'transfer', title: 'Altın', amount: TL(5000), accountId: bank, toAccountId: gold, freq: 'monthly', startDate: '2026-10-01' });
    d = p.data;
    expect(() => A.confirmOccurrence(d, p.plan.id, '2026-10-01', {}, TODAY)).toThrow(A.ActionError);
    d = A.confirmOccurrence(d, p.plan.id, '2026-10-01', { qty: 1, unitPrice: TL(5000) }, TODAY).data;
    expect(L.investmentState(d, gold)!.asset!.qty).toBe(1);
  });
});

describe('geriye uyumluluk ve yedek', () => {
  it('TL yatırım hesabı fiyatlardan etkilenmez', () => {
    let { d, bank, fon } = setup();
    d = add(d, { type: 'transfer', amount: TL(3000), date: '2026-10-01', accountId: bank, toAccountId: fon });
    const a = L.investmentState(d, fon)!;
    const b = L.investmentState(d, fon, book(5000))!;
    expect(b).toEqual(a);
    expect(a.asset).toBeUndefined();
    expect(a.currentValue).toBe(TL(3000));
  });

  it('eski yedek (varlık alanları yok) geri yüklenir; CSV sütunları değişmez', () => {
    let { d, bank, fon } = setup();
    d = { ...d, accounts: d.accounts.filter((a) => !a.asset) };
    d = add(d, { type: 'transfer', amount: TL(3000), date: '2026-10-01', accountId: bank, toAccountId: fon });
    const r = parseBackup(serializeBackup(d));
    expect(r.ok).toBe(true);
    expect(transactionsCSV(d).split('\r\n')[0].split(';')).toHaveLength(9);
  });

  it('varlık hesabı yedekte gidip gelir; bozuk miktar reddedilir', () => {
    let { d, bank, gold } = setup({ qty: 2, price: 5000 });
    d = add(d, { type: 'transfer', amount: TL(10000), date: '2026-10-01', accountId: bank, toAccountId: gold, qty: 1.25, unitPrice: TL(8000) });
    const r = parseBackup(serializeBackup(d));
    expect(r.ok).toBe(true);
    if (r.ok) expect(L.investmentState(r.data, gold)!.asset!.qty).toBe(3.25);
    const csv = transactionsCSV(d).split('\r\n');
    expect(csv[0]).toContain('Miktar');
    expect(csv[1]).toContain('1,25');

    const bad = (mut: (x: Data) => Data) => parseBackup(serializeBackup(mut(structuredClone(d))));
    expect(bad((x) => ({ ...x, txs: x.txs.map((t) => ({ ...t, qty: -1 })) })).ok).toBe(false);
    expect(bad((x) => ({ ...x, txs: x.txs.map((t) => { const { qty: _q, ...rest } = t; return rest; }) })).ok).toBe(false);
    expect(bad((x) => ({ ...x, accounts: x.accounts.map((a) => (a.asset ? { ...a, asset: { kind: 'gold', unit: 'kilo' } } : a)) } as unknown as Data)).ok).toBe(false);
    expect(bad((x) => ({ ...x, accounts: x.accounts.map((a) => (a.kind === 'bank' ? { ...a, asset: { kind: 'fx', unit: 'USD' } } : a)) } as Data)).ok).toBe(false);
  });
});
