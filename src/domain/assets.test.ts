import { describe, expect, it } from 'vitest';
import { emptyData } from './defaults';
import * as A from './actions';
import * as L from './ledger';
import { parseBackup, serializeBackup, transactionsCSV } from './backup';
import { migrateRawData } from './migrate';
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
    asset: { opening: opening ? [{ unit: 'gram', qty: opening.qty, price: TL(opening.price) }] : [] },
    priorContribution: opening ? TL(opening.qty * opening.price) : null,
  });
  d = gold.data;
  const tlInv = A.addAccount(d, { name: 'Fon', kind: 'investment', openingBalance: 0, openingDate: '2026-09-01' });
  d = tlInv.data;
  return { d, bank: bank.account.id, gold: gold.account.id, fon: tlInv.account.id };
}
const add = (d: Data, draft: A.TxDraft) => A.addTx(d, draft, TODAY).data;
/** Tek birimli hesap testleri için: birim belirtilmemişse gram. */
const addG = (d: Data, draft: A.TxDraft) => add(d, draft.qty !== undefined && !draft.unit ? { ...draft, unit: 'gram' } : draft);
const gramQty = (d: Data, id: string, b?: PriceBook) => L.investmentState(d, id, b)!.asset!.positions.find((p) => p.unit === 'gram')?.qty ?? 0;
const gramPos = (d: Data, id: string, b?: PriceBook) => L.investmentState(d, id, b)!.asset!.positions.find((p) => p.unit === 'gram')!;
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
    d = addG(d, { type: 'transfer', amount: TL(10000), date: '2026-10-01', accountId: bank, toAccountId: gold, qty: 2, unitPrice: TL(5000) });
    d = addG(d, { type: 'transfer', amount: TL(5200), date: '2026-10-10', accountId: bank, toAccountId: gold, qty: 1, unitPrice: TL(5200) });
    d = A.addGoal(d, { title: 'Hedef', target: TL(20000), accountId: gold }).data;
    const st = L.investmentState(d, gold, book(5100, 5150))!;
    expect(gramQty(d, gold, book(5100, 5150))).toBe(3);
    expect(st.currentValue).toBe(TL(15300));
    expect(st.netContribution).toBe(TL(15200));
    expect(st.valueDiff).toBe(TL(100));
    expect(gramPos(d, gold, book(5100, 5150)).priceSource).toBe('live');
    // Fiyat yoksa son işlem fiyatı
    const off = L.investmentState(d, gold)!;
    expect(gramPos(d, gold).priceSource).toBe('last-tx');
    expect(off.currentValue).toBe(TL(15600));
    expect(L.goalProgress(d, d.goals[0])!.current).toBe(TL(15200));
    // Günlük bakiye TL tutar kadar azalır
    expect(L.cashBalance(d, bank)).toBe(TL(100000 - 15200));
    expect(L.investmentTotal(d, book(5100))).toBe(TL(15300));
  });

  it('çekim miktarı azaltır; eldekinden fazlası çekilemez', () => {
    let { d, bank, gold } = setup();
    d = addG(d, { type: 'transfer', amount: TL(10000), date: '2026-10-01', accountId: bank, toAccountId: gold, qty: 2, unitPrice: TL(5000) });
    expect(() => addG(d, { type: 'transfer', amount: TL(16000), date: '2026-10-05', accountId: gold, toAccountId: bank, qty: 3, unitPrice: TL(5333) })).toThrow(A.ActionError);
    d = addG(d, { type: 'transfer', amount: TL(2600), date: '2026-10-05', accountId: gold, toAccountId: bank, qty: 0.5, unitPrice: TL(5200) });
    const st = L.investmentState(d, gold, book(5000))!;
    expect(gramQty(d, gold)).toBe(1.5);
    expect(st.currentValue).toBe(TL(7500));
    expect(st.withdrawn).toBe(TL(2600));
  });

  it('varlık hesabına transfer miktar ve fiyat ister; TL hesabında saklanmaz', () => {
    let { d, bank, gold, fon } = setup();
    expect(() => addG(d, { type: 'transfer', amount: TL(1000), date: '2026-10-01', accountId: bank, toAccountId: gold })).toThrow(/türünü/);
    expect(() => addG(d, { type: 'transfer', amount: TL(1000), date: '2026-10-01', accountId: bank, toAccountId: gold, unit: 'gram' })).toThrow(/Miktar/);
    expect(() => addG(d, { type: 'transfer', amount: TL(1000), date: '2026-10-01', accountId: bank, toAccountId: gold, unit: 'kilo' as never, qty: 1, unitPrice: 5 })).toThrow(/türünü/);
    expect(() => addG(d, { type: 'transfer', amount: TL(1000), date: '2026-10-01', accountId: bank, toAccountId: gold, qty: 1 })).toThrow(/fiyat/);
    d = addG(d, { type: 'transfer', amount: TL(1000), date: '2026-10-01', accountId: bank, toAccountId: fon, qty: 1, unitPrice: 5 });
    const t = d.txs[d.txs.length - 1];
    expect(t.qty).toBeUndefined();
    expect(t.unitPrice).toBeUndefined();
  });

  it('açılış miktarı (mevcut birikim) açılış değerini belirler, gelir sayılmaz', () => {
    const { d, gold } = setup({ qty: 10, price: 5000 });
    const acc = d.accounts.find((a) => a.id === gold)!;
    expect(acc.openingBalance).toBe(TL(50000));
    const st = L.investmentState(d, gold, book(5100))!;
    expect(gramQty(d, gold)).toBe(10);
    expect(st.currentValue).toBe(TL(51000));
    expect(st.valueDiff).toBe(TL(1000));
    expect(L.monthSummary(d, '2026-09').income).toBe(0);
  });

  it('kaydı olan hesapta TL ↔ altın/döviz modu değişemez; açılış kalemleri değişebilir', () => {
    let { d, bank, gold } = setup();
    const draft = (opening: { unit: 'gram' | 'ceyrek'; qty: number; price: number }[]): A.AccountDraft => ({ name: 'Altın', kind: 'investment', openingBalance: 0, openingDate: '2026-09-01', asset: { opening } });
    d = A.updateAccount(d, gold, draft([{ unit: 'ceyrek', qty: 2, price: TL(8000) }]));
    expect(d.accounts.find((a) => a.id === gold)!.asset!.opening).toEqual([{ unit: 'ceyrek', qty: 2, price: TL(8000) }]);
    expect(d.accounts.find((a) => a.id === gold)!.openingBalance).toBe(TL(16000));
    d = add(d, { type: 'transfer', amount: TL(8400), date: '2026-10-01', accountId: bank, toAccountId: gold, unit: 'ceyrek', qty: 1, unitPrice: TL(8400) });
    expect(() => A.updateAccount(d, gold, { ...draft([]), asset: null })).toThrow(A.ActionError);
    // Ad değişikliği ve yeni açılış türü serbest
    d = A.updateAccount(d, gold, { ...draft([{ unit: 'ceyrek', qty: 2, price: TL(8000) }, { unit: 'gram', qty: 1, price: TL(5000) }]), name: 'Çeyrekler' });
    expect(d.accounts.find((a) => a.id === gold)!.name).toBe('Çeyrekler');
    expect(d.accounts.find((a) => a.id === gold)!.asset!.opening.map((l) => l.unit)).toEqual(['gram', 'ceyrek']);
    // Aynı tür iki kez olamaz
    expect(() => A.updateAccount(d, gold, draft([{ unit: 'ceyrek', qty: 1, price: 1 }, { unit: 'ceyrek', qty: 1, price: 1 }]))).toThrow(/iki kez/);
  });

  it('planlı aktarım onayı miktarı taşır', () => {
    let { d, bank, gold } = setup();
    const p = A.addPlan(d, { kind: 'transfer', title: 'Altın', amount: TL(5000), accountId: bank, toAccountId: gold, freq: 'monthly', startDate: '2026-10-01' });
    d = p.data;
    expect(() => A.confirmOccurrence(d, p.plan.id, '2026-10-01', {}, TODAY)).toThrow(A.ActionError);
    d = A.confirmOccurrence(d, p.plan.id, '2026-10-01', { unit: 'gram', qty: 1, unitPrice: TL(5000) }, TODAY).data;
    expect(gramQty(d, gold)).toBe(1);
  });
});

describe('geriye uyumluluk ve yedek', () => {
  it('TL yatırım hesabı fiyatlardan etkilenmez', () => {
    let { d, bank, fon } = setup();
    d = addG(d, { type: 'transfer', amount: TL(3000), date: '2026-10-01', accountId: bank, toAccountId: fon });
    const a = L.investmentState(d, fon)!;
    const b = L.investmentState(d, fon, book(5000))!;
    expect(b).toEqual(a);
    expect(a.asset).toBeUndefined();
    expect(a.currentValue).toBe(TL(3000));
  });

  it('eski yedek (varlık alanları yok) geri yüklenir; CSV sütunları değişmez', () => {
    let { d, bank, fon } = setup();
    d = { ...d, accounts: d.accounts.filter((a) => !a.asset) };
    d = addG(d, { type: 'transfer', amount: TL(3000), date: '2026-10-01', accountId: bank, toAccountId: fon });
    const r = parseBackup(serializeBackup(d));
    expect(r.ok).toBe(true);
    expect(transactionsCSV(d).split('\r\n')[0].split(';')).toHaveLength(9);
  });

  it('varlık hesabı yedekte gidip gelir; bozuk miktar reddedilir', () => {
    let { d, bank, gold } = setup({ qty: 2, price: 5000 });
    d = addG(d, { type: 'transfer', amount: TL(10000), date: '2026-10-01', accountId: bank, toAccountId: gold, qty: 1.25, unitPrice: TL(8000) });
    const r = parseBackup(serializeBackup(d));
    expect(r.ok).toBe(true);
    if (r.ok) expect(gramQty(r.data, gold)).toBe(3.25);
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

describe('çok türlü altın/döviz hesabı', () => {
  /** 5 g 24 ayar + 10 g 22 ayar bilezik + 2 çeyrek ile açılan hesap. */
  function mixed() {
    let d = emptyData();
    const bank = A.addAccount(d, { name: 'Banka', kind: 'bank', openingBalance: TL(100000), openingDate: '2026-09-01' });
    d = bank.data;
    const acc = A.addAccount(d, {
      name: 'Altınlar', kind: 'investment', openingBalance: 999, openingDate: '2026-09-01', priorContribution: null,
      asset: { opening: [{ unit: 'ceyrek', qty: 2, price: TL(8000) }, { unit: 'gram', qty: 5, price: TL(5000) }, { unit: 'bilezik22', qty: 10, price: TL(4500) }] },
    });
    return { d: acc.data, bank: bank.account.id, gold: acc.account.id };
  }
  const prices: PriceBook = {
    gram: { buy: TL(5100), sell: TL(5150), at: NOW, source: 'live' },
    bilezik22: { buy: TL(4600), sell: TL(4900), at: NOW, source: 'live' },
    ceyrek: { buy: TL(8300), sell: TL(8500), at: NOW, source: 'live' },
  };

  it('açılış kalemleri: sıralı saklanır, açılış değeri toplamdır, gelir sayılmaz', () => {
    const { d, gold } = mixed();
    const a = d.accounts.find((x) => x.id === gold)!;
    expect(a.asset!.opening.map((l) => l.unit)).toEqual(['gram', 'ceyrek', 'bilezik22']);
    expect(a.openingBalance).toBe(TL(5 * 5000 + 2 * 8000 + 10 * 4500));
    expect(L.monthSummary(d, '2026-09').income).toBe(0);
  });

  it('değer = Σ miktar × o türün güncel alış fiyatı; fiyatı olmayan tür son işlem fiyatıyla', () => {
    let { d, bank, gold } = mixed();
    d = add(d, { type: 'transfer', amount: TL(8500), date: '2026-10-01', accountId: bank, toAccountId: gold, unit: 'ceyrek', qty: 1, unitPrice: TL(8500) });
    d = add(d, { type: 'transfer', amount: TL(4100), date: '2026-10-02', accountId: bank, toAccountId: gold, unit: 'USD', qty: 100, unitPrice: 4100 });
    const st = L.investmentState(d, gold, prices)!;
    expect(st.asset!.positions.map((p) => [p.unit, p.qty])).toEqual([['gram', 5], ['ceyrek', 3], ['bilezik22', 10], ['USD', 100]]);
    const usd = st.asset!.positions.find((p) => p.unit === 'USD')!;
    expect(usd.priceSource).toBe('last-tx');
    expect(st.currentValue).toBe(TL(5 * 5100 + 3 * 8300 + 10 * 4600 + 100 * 41));
    expect(st.netContribution).toBe(TL(8500 + 4100));
    expect(L.investmentTotal(d, prices)).toBe(st.currentValue);
    // Geçmiş: her işlemden sonra tüm türler o ana kadarki son fiyatla
    expect(st.history.map((h) => h.value)).toEqual([
      TL(5 * 5000 + 2 * 8000 + 10 * 4500),
      TL(5 * 5000 + 3 * 8500 + 10 * 4500),
      TL(5 * 5000 + 3 * 8500 + 10 * 4500 + 100 * 41),
    ]);
  });

  it('çekim: türü seçilir; o türden eldekinden fazlası satılamaz (o tarihte de)', () => {
    let { d, bank, gold } = mixed();
    // 2 g 24 ayar sat
    d = add(d, { type: 'transfer', amount: TL(10200), date: '2026-10-05', accountId: gold, toAccountId: bank, unit: 'gram', qty: 2, unitPrice: TL(5100) });
    expect(A.heldQty(d, d.accounts.find((a) => a.id === gold)!, 'gram')).toBe(3);
    // 24 ayardan 4 g yok (3 var) — bilezikteki 10 g sayılmaz
    expect(() => add(d, { type: 'transfer', amount: TL(20000), date: '2026-10-06', accountId: gold, toAccountId: bank, unit: 'gram', qty: 4, unitPrice: TL(5000) })).toThrow(/3/);
    // Hiç olmayan tür satılamaz
    expect(() => add(d, { type: 'transfer', amount: TL(4000), date: '2026-10-06', accountId: gold, toAccountId: bank, unit: 'USD', qty: 1, unitPrice: 4000 })).toThrow(A.ActionError);
    // Daha önceki bir tarihe, sonraki satışı karşılıksız bırakacak satış girilemez (5 − 2 sonra = en fazla 3)
    expect(() => add(d, { type: 'transfer', amount: TL(20000), date: '2026-10-01', accountId: gold, toAccountId: bank, unit: 'gram', qty: 4, unitPrice: TL(5000) })).toThrow(A.ActionError);
    d = add(d, { type: 'transfer', amount: TL(15000), date: '2026-10-01', accountId: gold, toAccountId: bank, unit: 'gram', qty: 3, unitPrice: TL(5000) });
    expect(A.heldQty(d, d.accounts.find((a) => a.id === gold)!, 'gram')).toBe(0);
  });

  it('alımı silmek/küçültmek sonraki satışı karşılıksız bırakamaz', () => {
    let { d, bank, gold } = mixed();
    const buy = A.addTx(d, { type: 'transfer', amount: TL(1000), date: '2026-10-01', accountId: bank, toAccountId: gold, unit: 'EUR', qty: 20, unitPrice: 5000 }, TODAY);
    d = buy.data;
    d = add(d, { type: 'transfer', amount: TL(750), date: '2026-10-03', accountId: gold, toAccountId: bank, unit: 'EUR', qty: 15, unitPrice: 5000 });
    expect(() => A.deleteTx(d, buy.tx.id)).toThrow(A.ActionError);
    const draft = { type: 'transfer' as const, amount: TL(500), date: '2026-10-01', accountId: bank, toAccountId: gold, unit: 'EUR' as const, qty: 10, unitPrice: 5000 };
    expect(() => A.updateTx(d, buy.tx.id, draft, TODAY)).toThrow(/karşılıksız/);
    expect(() => A.updateTx(d, buy.tx.id, { ...draft, qty: 20, unit: 'GBP' }, TODAY)).toThrow(/karşılıksız/);
    expect(A.updateTx(d, buy.tx.id, { ...draft, qty: 15 }, TODAY).txs.find((t) => t.id === buy.tx.id)!.qty).toBe(15);
    // Açılış kalemini satılandan aza indirmek de olmaz
    const draftAcc = (qty: number): A.AccountDraft => ({ name: 'Altınlar', kind: 'investment', openingBalance: 0, openingDate: '2026-09-01', asset: { opening: [{ unit: 'gram', qty, price: TL(5000) }] } });
    d = add(d, { type: 'transfer', amount: TL(20000), date: '2026-10-04', accountId: gold, toAccountId: bank, unit: 'gram', qty: 4, unitPrice: TL(5000) });
    expect(() => A.updateAccount(d, gold, draftAcc(3))).toThrow(A.ActionError);
    expect(A.updateAccount(d, gold, draftAcc(4)).accounts.find((a) => a.id === gold)!.openingBalance).toBe(TL(20000));
  });

  it('yedek: gidip gelir; tutarsızlar reddedilir; CSV birim sütunu taşır', () => {
    let { d, bank, gold } = mixed();
    d = add(d, { type: 'transfer', amount: TL(8500), date: '2026-10-01', accountId: bank, toAccountId: gold, unit: 'ceyrek', qty: 1, unitPrice: TL(8500) });
    d = add(d, { type: 'transfer', amount: TL(10200), date: '2026-10-05', accountId: gold, toAccountId: bank, unit: 'gram', qty: 2, unitPrice: TL(5100) });
    const r = parseBackup(serializeBackup(d));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.accounts).toEqual(d.accounts);
      expect(r.data.txs).toEqual(d.txs);
      expect(L.investmentState(r.data, gold, prices)).toEqual(L.investmentState(d, gold, prices));
    }
    const bad = (mut: (x: Data) => unknown) => parseBackup(JSON.stringify({ app: 'cep-defteri', version: 1, data: mut(structuredClone(d)) }));
    const setAsset = (x: Data, asset: unknown) => ({ ...x, accounts: x.accounts.map((a) => (a.id === gold ? { ...a, asset } : a)) });
    expect(bad((x) => setAsset(x, { opening: [{ unit: 'kilo', qty: 1, price: 100 }] })).ok).toBe(false);
    expect(bad((x) => setAsset(x, { opening: [{ unit: 'gram', qty: 0, price: 100 }] })).ok).toBe(false);
    expect(bad((x) => setAsset(x, { opening: [{ unit: 'gram', qty: 1, price: 100 }, { unit: 'gram', qty: 2, price: 100 }] })).ok).toBe(false);
    expect(bad((x) => setAsset(x, { opening: 'x' })).ok).toBe(false);
    expect(bad((x) => ({ ...x, txs: x.txs.map((t) => ({ ...t, unit: 'TRY' })) })).ok).toBe(false);
    expect(bad((x) => ({ ...x, txs: x.txs.map((t) => { const { unit: _u, ...rest } = t; return rest; }) })).ok).toBe(false);
    // Elde olandan fazlası satılmış (açılışta 5 g vardı; 6 g satış)
    expect(bad((x) => ({ ...x, txs: x.txs.map((t) => (t.unit === 'gram' ? { ...t, qty: 6 } : t)) })).ok).toBe(false);
    // Elde olmayan tür satılmış
    expect(bad((x) => ({ ...x, txs: x.txs.map((t) => (t.unit === 'gram' ? { ...t, unit: 'USD' } : t)) })).ok).toBe(false);

    const csv = transactionsCSV(d).split('\r\n');
    const head = csv[0].replace('﻿', '').split(';');
    expect(head.slice(-3)).toEqual(['Miktar', 'Birim', 'Birim fiyat']);
    expect(csv[1].split(';').slice(-3)).toEqual(['1', 'Çeyrek altın', '8500,00']);
    expect(csv[2].split(';').slice(-3)).toEqual(['2', 'Gram altın (24 ayar)', '5100,00']);
    const en = transactionsCSV(d, 'en').split('\r\n');
    expect(en[0].split(',').slice(-3)).toEqual(['Quantity', 'Unit', 'Unit price']);
  });
});

describe('eski tek birimli hesaplardan geçiş', () => {
  /** Önceki sürümün yazdığı biçim: asset { kind, unit } + openingQty/openingPrice; işlemlerde birim yok. */
  function legacyFile() {
    const bank = { id: 'b', name: 'Banka', kind: 'bank', openingBalance: TL(100000), openingDate: '2026-09-01', createdAt: 1 };
    const gold = { id: 'g', name: 'Çeyrekler', kind: 'investment', openingBalance: TL(2 * 8000), openingDate: '2026-09-01', priorContribution: TL(15000), asset: { kind: 'gold', unit: 'ceyrek' }, openingQty: 2, openingPrice: TL(8000), createdAt: 2 };
    const usd = { id: 'u', name: 'Dolar', kind: 'investment', openingBalance: 0, openingDate: '2026-09-01', priorContribution: null, asset: { kind: 'fx', unit: 'USD' }, createdAt: 3 };
    const txs = [
      { id: 't1', seq: 1, type: 'transfer', amount: TL(8500), date: '2026-10-01', accountId: 'b', toAccountId: 'g', qty: 1, unitPrice: TL(8500), createdAt: 1 },
      { id: 't2', seq: 2, type: 'transfer', amount: TL(4150), date: '2026-10-02', accountId: 'b', toAccountId: 'u', qty: 100, unitPrice: 4150, createdAt: 2 },
      { id: 't3', seq: 3, type: 'transfer', amount: TL(8300), date: '2026-10-03', accountId: 'g', toAccountId: 'b', qty: 1.5, unitPrice: TL(5533.33), createdAt: 3 },
    ];
    const base = emptyData();
    return JSON.stringify({ app: 'cep-defteri', version: 1, exportedAt: '2026-10-10T00:00:00Z', data: { ...base, accounts: [bank, gold, usd], txs, nextSeq: 4 } });
  }

  it('saf geçiş: açılış kalemine ve işlem birimine çevirir; güncel veride hiçbir şey değişmez', () => {
    const raw = JSON.parse(legacyFile()).data;
    const m = migrateRawData(raw) as unknown as Data;
    const g = m.accounts.find((a) => a.id === 'g')!;
    expect(g.asset).toEqual({ opening: [{ unit: 'ceyrek', qty: 2, price: TL(8000) }] });
    expect('openingQty' in g || 'openingPrice' in g).toBe(false);
    expect(g.openingBalance).toBe(TL(16000));
    expect(m.accounts.find((a) => a.id === 'u')!.asset).toEqual({ opening: [] });
    expect(m.txs.map((t) => t.unit)).toEqual(['ceyrek', 'USD', 'ceyrek']);
    expect(migrateRawData(m as unknown as Record<string, unknown>)).toBe(m);
    // Giriş nesnesi değiştirilmez
    expect(raw.accounts[1].openingQty).toBe(2);
  });

  it('eski yedek ve eski depolama yüklenir; değerler eski hesaplamayla aynı', () => {
    const r = parseBackup(legacyFile());
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const b: PriceBook = { ceyrek: { buy: TL(8400), sell: TL(8600), at: NOW, source: 'live' }, USD: { buy: 4160, sell: 4170, at: NOW, source: 'live' } };
    // Eski kural: değer = (açılış + alınan − satılan) × güncel alış; fiyat yoksa son işlem fiyatı.
    const g = L.investmentState(r.data, 'g', b)!;
    expect(g.asset!.positions).toEqual([{ unit: 'ceyrek', qty: 1.5, price: TL(8400), priceAt: NOW, priceSource: 'live', value: TL(1.5 * 8400) }]);
    expect(g.currentValue).toBe(TL(12600));
    expect(g.netContribution).toBe(TL(8500 - 8300));
    expect(g.valueDiff).toBe(TL(12600 - 15000 - 200));
    expect(L.investmentState(r.data, 'g')!.currentValue).toBe(Math.round(1.5 * TL(5533.33)));
    expect(L.investmentState(r.data, 'u', b)!.currentValue).toBe(100 * 4160);
    expect(g.history.map((h) => h.value)).toEqual([TL(16000), TL(3 * 8500), Math.round(1.5 * TL(5533.33))]);
    // Yeniden yazılan yedek yeni biçimde ve tekrar yüklenince aynı
    const again = parseBackup(serializeBackup(r.data));
    expect(again.ok && again.data).toEqual(r.data);
    // Geçişten sonra eski sınırlar korunur: 1,5 çeyrekten fazlası satılamaz
    expect(() => A.addTx(r.data, { type: 'transfer', amount: TL(17000), date: '2026-10-05', accountId: 'g', toAccountId: 'b', unit: 'ceyrek', qty: 2, unitPrice: TL(8500) }, TODAY)).toThrow(A.ActionError);
  });

  it('eski biçimde bozuk birim ya da fazla satış yine reddedilir', () => {
    const f = JSON.parse(legacyFile());
    f.data.accounts[1].asset.unit = 'kilo';
    expect(parseBackup(JSON.stringify(f)).ok).toBe(false);
    const f2 = JSON.parse(legacyFile());
    f2.data.txs[2].qty = 4;
    expect(parseBackup(JSON.stringify(f2)).ok).toBe(false);
    const f3 = JSON.parse(legacyFile());
    delete f3.data.accounts[1].asset;
    expect(parseBackup(JSON.stringify(f3)).ok).toBe(false);
  });
});
