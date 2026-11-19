import { describe, expect, it } from 'vitest';
import { emptyData } from './defaults';
import * as A from './actions';
import * as L from './ledger';
import { withStockPrices } from './stocks';
import type { PriceBook } from './prices';
import type { Data } from './types';

const TODAY = '2026-11-18';
const TL = (n: number) => Math.round(n * 100);
const NOW = Date.UTC(2026, 10, 18, 12);

function setup() {
  let d = emptyData();
  const bank = A.addAccount(d, { name: 'Banka', kind: 'bank', openingBalance: TL(100000), openingDate: '2026-09-01' });
  d = bank.data;
  const inv = A.addAccount(d, {
    name: 'Midas', kind: 'investment', openingBalance: 0, openingDate: '2026-09-01',
    asset: { opening: [{ unit: 'BIST:THYAO', qty: 10, price: TL(300) }] },
  });
  d = inv.data;
  const fon = A.addAccount(d, { name: 'Fon', kind: 'investment', openingBalance: TL(5000), openingDate: '2026-09-01' });
  return { d: fon.data, bank: bank.account.id, inv: inv.account.id };
}
const buy = (d: Data, s: { bank: string; inv: string }, date: string, unit: 'BIST:THYAO' | 'US:AAPL' | 'gram', qty: number, amount: number) =>
  A.addTx(d, { type: 'transfer', amount: TL(amount), date, accountId: s.bank, toAccountId: s.inv, unit, qty, unitPrice: Math.round(TL(amount) / qty) }, TODAY).data;
const sell = (d: Data, s: { bank: string; inv: string }, date: string, unit: 'BIST:THYAO', qty: number, amount: number) =>
  A.addTx(d, { type: 'transfer', amount: TL(amount), date, accountId: s.inv, toAccountId: s.bank, unit, qty, unitPrice: Math.round(TL(amount) / qty) }, TODAY).data;

describe('ortalama maliyet ve kâr/zarar', () => {
  it('ağırlıklı ortalama; satış maliyeti oranla düşer, gerçekleşen kâr ayrı', () => {
    const s = setup();
    // 10 @ 300 (açılış) + 10 @ 340 → 20 adet, maliyet 6.400, ortalama 320
    let d = buy(s.d, s, '2026-10-01', 'BIST:THYAO', 10, 3400);
    let c = L.assetCosts(d, d.accounts.find((a) => a.id === s.inv)!).get('BIST:THYAO')!;
    expect(c).toEqual({ qty: 20, cost: TL(6400), realized: 0 });
    // 5 adet 350'den satıldı: maliyet 5 × 320 = 1.600 düşer, kâr 1.750 − 1.600 = 150
    d = sell(d, s, '2026-11-01', 'BIST:THYAO', 5, 1750);
    c = L.assetCosts(d, d.accounts.find((a) => a.id === s.inv)!).get('BIST:THYAO')!;
    expect(c).toEqual({ qty: 15, cost: TL(4800), realized: TL(150) });

    const book: PriceBook = { 'BIST:THYAO': { buy: TL(330), sell: TL(330), at: NOW, source: 'live', prevBuy: TL(325) } };
    const p = L.investmentState(d, s.inv, book)!.asset!.positions[0];
    expect(p).toMatchObject({ qty: 15, value: TL(4950), cost: TL(4800), avgCost: TL(320), pnl: TL(150), realized: TL(150), dayChange: TL(75) });
    expect(p.pnlPct).toBeCloseTo(3.125, 6);
    // Fiyat yoksa (son işlem fiyatı) kâr/zarar ve günlük değişim gösterilmez; maliyet yine bilinir.
    expect(L.investmentState(d, s.inv)!.asset!.positions[0]).toMatchObject({ cost: TL(4800), pnl: null, dayChange: null });
  });

  it('hepsi satılınca maliyet sıfırlanır; elle fiyatta günlük değişim yok', () => {
    const s = setup();
    const d = sell(s.d, s, '2026-11-01', 'BIST:THYAO', 10, 3500);
    expect(L.assetCosts(d, d.accounts.find((a) => a.id === s.inv)!).get('BIST:THYAO')).toEqual({ qty: 0, cost: 0, realized: TL(500) });
    const manual: PriceBook = { 'BIST:THYAO': { buy: TL(330), sell: TL(330), at: NOW, source: 'manual', prevBuy: TL(325) } };
    expect(L.investmentState(s.d, s.inv, manual)!.asset!.positions[0].dayChange).toBeNull();
  });

  it('ABD hissesinin günlük değişimi kurdaki değişimi de içerir', () => {
    const s = setup();
    const d = buy(s.d, s, '2026-10-01', 'US:AAPL', 2, 34000);
    const book = withStockPrices(
      { USD: { buy: TL(50), sell: TL(50.1), at: NOW, source: 'live', prevBuy: TL(49) } },
      { 'US:AAPL': { price: 36000, ccy: 'USD', at: NOW, source: 'nasdaq', prevClose: 35000 } },
    );
    const p = L.investmentState(d, s.inv, book)!.asset!.positions.find((x) => x.unit === 'US:AAPL')!;
    // Şimdi 2 × 360 × 50 = 36.000; dün 2 × 350 × 49 = 34.300
    expect(p.value).toBe(TL(36000));
    expect(p.dayChange).toBe(TL(36000 - 34300));
  });
});

describe('portföy dağılımı ve günlük değişim', () => {
  it('TL hesap + türler; sıfırlar atlanır; arşiv hariç', () => {
    const s = setup();
    let d = buy(s.d, s, '2026-10-01', 'gram', 2, 10000);
    const book: PriceBook = {
      'BIST:THYAO': { buy: TL(330), sell: TL(330), at: NOW, source: 'live', prevBuy: TL(300) },
      gram: { buy: TL(5200), sell: TL(5300), at: NOW, source: 'live' },
    };
    expect(L.portfolioMix(d, book)).toEqual([
      { key: 'tl', value: TL(5000) },
      { key: 'gold', value: TL(10400) },
      { key: 'BIST', value: TL(3300) },
    ]);
    expect(L.portfolioDayChange(d, book)).toEqual({ change: TL(300), base: TL(3000) });
    d = A.setAccountArchived(d, s.inv, true);
    expect(L.portfolioMix(d, book)).toEqual([{ key: 'tl', value: TL(5000) }]);
    expect(L.portfolioDayChange(d, book)).toBeNull();
  });
});

describe('fon fiyatı hatırlatması', () => {
  it('7 günden eski elle fiyat ya da son işlem fiyatı', () => {
    let d = emptyData();
    const bank = A.addAccount(d, { name: 'Banka', kind: 'bank', openingBalance: TL(1000), openingDate: '2026-11-01' });
    d = bank.data;
    const inv = A.addAccount(d, { name: 'Fon', kind: 'investment', openingBalance: 0, openingDate: '2026-11-01', asset: { opening: [{ unit: 'FON:GTL', qty: 1000, price: 3.4567 }, { unit: 'FON:AFT', qty: 10, price: 100 }] } });
    d = inv.data;
    const h = (b?: PriceBook) => L.investmentState(d, inv.account.id, b)!.asset!;
    // Açılış 1 Kasım; bugün 18 Kasım → ikisi de eski
    expect(L.staleFunds(h(), NOW).map((x) => [x.unit, x.ageDays])).toEqual([['FON:AFT', 17], ['FON:GTL', 17]]);
    const fresh: PriceBook = { 'FON:GTL': { buy: 3.6, sell: 3.6, at: NOW - 2 * 86_400_000, source: 'manual' } };
    expect(L.staleFunds(h(fresh), NOW).map((x) => x.unit)).toEqual(['FON:AFT']);
  });
});
