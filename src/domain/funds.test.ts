import { describe, expect, it } from 'vitest';
import { emptyData } from './defaults';
import * as A from './actions';
import * as L from './ledger';
import { isFundUnit, isUnitPrice, priceFromQty, toStockUnit, unitOrder, type AssetUnit } from './assets';
import { parseBackup, serializeBackup, transactionsCSV } from './backup';
import { sanitizeQuotes, withStockPrices } from './stocks';

/** Yatırım fonları (TEFAS): "FON:GTL"; fiyat 6 ondalıklı TL = kuruşta 4 ondalık. */
const TODAY = '2026-11-17';
const TL = (n: number) => Math.round(n * 100);

function setup() {
  let d = emptyData();
  const bank = A.addAccount(d, { name: 'Banka', kind: 'bank', openingBalance: TL(100000), openingDate: '2026-10-01' });
  d = bank.data;
  const inv = A.addAccount(d, {
    name: 'Fonlarım', kind: 'investment', openingBalance: 0, openingDate: '2026-10-01',
    // 10.000 pay, pay fiyatı 0,034567 TL → 345,67 TL
    asset: { opening: [{ unit: 'FON:GTL', qty: 10000, price: 3.4567 }] },
  });
  return { d: inv.data, bank: bank.account.id, inv: inv.account.id };
}

describe('yatırım fonu birimi', () => {
  it('kod ve fiyat hassasiyeti', () => {
    expect(toStockUnit('FON', ' gtl ')).toBe('FON:GTL');
    expect(toStockUnit('FON', 'ISX30')).toBeNull();
    expect(isFundUnit('FON:GTL')).toBe(true);
    expect(isFundUnit('BIST:GTL')).toBe(false);
    expect(isUnitPrice(3.4567, 'FON:GTL')).toBe(true);
    expect(isUnitPrice(3.45678, 'FON:GTL')).toBe(false);
    expect(isUnitPrice(3.4567, 'BIST:THYAO')).toBe(false);
    expect(isUnitPrice(345, 'gram')).toBe(true);
    // 1.000 TL ile 28.929 pay: pay fiyatı 0,034567... TL
    expect(priceFromQty(TL(1000), 28929, 'FON:GTL')).toBe(3.4567);
    expect(priceFromQty(TL(1000), 28929)).toBe(3);
    const u: AssetUnit[] = ['FON:AFT', 'US:AAPL', 'gram', 'BIST:THYAO'];
    expect([...u].sort(unitOrder)).toEqual(['gram', 'BIST:THYAO', 'US:AAPL', 'FON:AFT']);
  });

  it('değer = pay × elle girilen fiyat; fiyat yoksa son işlem fiyatı (kuruşa yuvarlanmadan)', () => {
    let { d, bank, inv } = setup();
    expect(d.accounts.find((a) => a.id === inv)!.openingBalance).toBe(TL(345.67));
    d = A.addTx(d, { type: 'transfer', amount: TL(1000), date: '2026-11-10', accountId: bank, toAccountId: inv, unit: 'FON:GTL', qty: 28929, unitPrice: 3.4567 }, TODAY).data;
    const st = L.investmentState(d, inv)!;
    expect(st.asset!.positions[0]).toMatchObject({ unit: 'FON:GTL', qty: 38929, price: 3.4567, priceSource: 'last-tx' });
    expect(st.currentValue).toBe(Math.round(38929 * 3.4567));
    const book = withStockPrices({}, { 'FON:GTL': { price: 3.6012, ccy: 'TRY', at: 1, source: 'manual' } });
    expect(L.investmentState(d, inv, book)!.currentValue).toBe(Math.round(38929 * 3.6012));
  });

  it('geçersiz fiyat reddedilir; yedekte gidip gelir; CSV 6 ondalık', () => {
    const { d, bank, inv } = setup();
    expect(() => A.addTx(d, { type: 'transfer', amount: TL(10), date: '2026-11-10', accountId: bank, toAccountId: inv, unit: 'FON:GTL', qty: 3, unitPrice: 3.33333 }, TODAY)).toThrow();
    const x = A.addTx(d, { type: 'transfer', amount: TL(1000), date: '2026-11-10', accountId: bank, toAccountId: inv, unit: 'FON:GTL', qty: 28929, unitPrice: 3.4567 }, TODAY).data;
    const r = parseBackup(serializeBackup(x));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.txs).toEqual(x.txs);
    const bad = parseBackup(JSON.stringify({ app: 'cep-defteri', version: 1, data: { ...x, txs: x.txs.map((t) => ({ ...t, unitPrice: 3.45678 })) } }));
    expect(bad.ok).toBe(false);
    expect(transactionsCSV(x).split('\r\n')[1].split(';').slice(-3)).toEqual(['28929', 'GTL (Fon)', '0,034567']);
    expect(transactionsCSV(x, 'en').split('\r\n')[1].split(',').slice(-3)).toEqual(['28929', 'GTL (Fund)', '0.034567']);
  });

  it('önbellekteki fon fiyatı 4 ondalık kuruşa kadar kabul edilir', () => {
    expect(sanitizeQuotes({ 'FON:GTL': { price: 3.4567, ccy: 'TRY', at: 1, source: 'manual' }, 'FON:AFT': { price: 3.45678, ccy: 'TRY', at: 1, source: 'manual' } })).toEqual({
      'FON:GTL': { price: 3.4567, ccy: 'TRY', at: 1, source: 'manual' },
    });
  });
});

