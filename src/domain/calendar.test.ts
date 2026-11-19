import { describe, expect, it } from 'vitest';
import { dayTotals, heatLevel, monthGrid } from './calendar';
import { walletState } from '../ui/Wallet';
import type { Tx } from './types';

describe('ay takvimi', () => {
  it('pazartesiyle başlar; ay dışı hücreler boş', () => {
    // 1 Kasım 2026 pazar
    const g = monthGrid('2026-11');
    expect(g[0]).toEqual([null, null, null, null, null, null, '2026-11-01']);
    expect(g[1][0]).toBe('2026-11-02');
    expect(g.at(-1)).toEqual(['2026-11-30', null, null, null, null, null, null]);
    expect(g.flat().filter(Boolean)).toHaveLength(30);
    // Şubat 2027: 1'i pazartesi, 4 tam hafta
    expect(monthGrid('2027-02')).toHaveLength(4);
  });
  it('günlük toplamlar ve yoğunluk', () => {
    const tx = (date: string, type: Tx['type'], amount: number) => ({ id: date + type + amount, seq: 0, createdAt: 0, accountId: 'a', type, amount, date }) as Tx;
    const m = dayTotals([tx('2026-11-03', 'expense', 500), tx('2026-11-03', 'refund', 100), tx('2026-11-03', 'income', 900), tx('2026-11-04', 'transfer', 50)]);
    expect(m.get('2026-11-03')).toEqual({ spending: 400, income: 900, count: 3 });
    expect(m.get('2026-11-04')).toEqual({ spending: 0, income: 0, count: 1 });
    expect([0, -5, 1, 10, 30, 70, 100, 200].map((v) => heatLevel(v, 100))).toEqual([0, 0, 1, 2, 3, 4, 4, 4]);
    expect(heatLevel(5, 0)).toBe(0);
  });
});

describe('maskotun cüzdanı', () => {
  it('kalan bütçe oranına göre', () => {
    expect(walletState(null, 1000)).toBeNull();
    expect(walletState(500, null)).toBeNull();
    expect([800, 610, 600, 400, 300, 1, 0, -50].map((r) => walletState(r, 1000))).toEqual(['full', 'full', 'mid', 'mid', 'thin', 'thin', 'empty', 'empty']);
  });
});
