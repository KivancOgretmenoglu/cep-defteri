import { describe, expect, it } from 'vitest';
import { emptyData } from './defaults';
import type { Data, Tx } from './types';
import { hourBand, isRoundAmount, quickAmounts, rankCategories } from './smart';

const TODAY = '2026-10-15';
let seq = 0;
/** Kayıt; `hour` verilirse o gün o saatte girilmiş sayılır, verilmezse geçmişe dönük girilmiş (saat bilgisi yok). */
function tx(p: Partial<Tx> & { date: string; hour?: number }): Tx {
  const { hour, ...rest } = p;
  const [y, m, d] = p.date.split('-').map(Number);
  const createdAt = hour === undefined ? new Date(2020, 0, 1, 12).getTime() : new Date(y, m - 1, d, hour, 10).getTime();
  return { id: `t${++seq}`, seq, type: 'expense', amount: 10000, accountId: 'a', categoryId: 'food', createdAt, ...rest };
}
const withTxs = (txs: Tx[]): Data => ({ ...emptyData(), txs });

describe('hourBand', () => {
  it('saatleri dilimlere ayırır', () => {
    expect(hourBand(7)).toBe('morning');
    expect(hourBand(12)).toBe('noon');
    expect(hourBand(19)).toBe('evening');
    expect(hourBand(23)).toBe('night');
    expect(hourBand(3)).toBe('night');
  });
});

describe('rankCategories', () => {
  it('geçmiş yoksa boş döner (varsayılan sıra korunur)', () => {
    expect(rankCategories(withTxs([]), 'expense', TODAY, 12)).toEqual([]);
  });

  it('sıklığa göre sıralar, 90 günden eskiyi ve diğer türü saymaz', () => {
    const d = withTxs([
      tx({ date: '2026-10-10', categoryId: 'food' }),
      tx({ date: '2026-10-11', categoryId: 'transport' }),
      tx({ date: '2026-10-12', categoryId: 'transport' }),
      tx({ date: '2026-05-01', categoryId: 'old' }),
      tx({ date: '2026-10-12', categoryId: 'salary', type: 'income' }),
    ]);
    expect(rankCategories(d, 'expense', TODAY, 12)).toEqual(['transport', 'food']);
    expect(rankCategories(d, 'income', TODAY, 12)).toEqual(['salary']);
  });

  it('yakın tarihli kullanım eskisinden ağır basar', () => {
    const d = withTxs([
      tx({ date: '2026-08-01', categoryId: 'gift' }),
      tx({ date: '2026-08-02', categoryId: 'gift' }),
      tx({ date: '2026-10-14', categoryId: 'food' }),
    ]);
    expect(rankCategories(d, 'expense', TODAY, 12)[0]).toBe('food');
  });

  it('şu anki saat diliminde kullanılan kategoriyi öne alır', () => {
    const d = withTxs([
      tx({ date: '2026-10-14', categoryId: 'coffee', hour: 8 }),
      tx({ date: '2026-10-14', categoryId: 'dinner', hour: 20 }),
    ]);
    expect(rankCategories(d, 'expense', TODAY, 9)[0]).toBe('coffee');
    expect(rankCategories(d, 'expense', TODAY, 19)[0]).toBe('dinner');
  });

  it('saat payı hafiftir: çok daha sık kullanılan kategoriyi geçemez', () => {
    const d = withTxs([
      tx({ date: '2026-10-14', categoryId: 'coffee', hour: 8 }),
      tx({ date: '2026-10-13', categoryId: 'food', hour: 13 }),
      tx({ date: '2026-10-14', categoryId: 'food', hour: 13 }),
    ]);
    expect(rankCategories(d, 'expense', TODAY, 9)[0]).toBe('food');
  });

  it('geçmişe dönük girilen kaydın saati dikkate alınmaz', () => {
    const d = withTxs([
      // 10 Ekim için 14 Ekim sabahı girilmiş: saat bilgisi harcamanın saati değil.
      { ...tx({ date: '2026-10-10', categoryId: 'coffee' }), createdAt: new Date(2026, 9, 14, 8).getTime() },
      tx({ date: '2026-10-10', categoryId: 'dinner' }),
    ]);
    // Eşit puan → en son girilen önce.
    expect(rankCategories(d, 'expense', TODAY, 9)).toEqual(['dinner', 'coffee']);
  });
});

describe('quickAmounts', () => {
  it('geçmiş yoksa öneri yok', () => {
    expect(quickAmounts(withTxs([]), 'expense', TODAY)).toEqual([]);
  });

  it('en sık yuvarlak tutarlar, en fazla 4, küçükten büyüğe', () => {
    const amts = [5000, 5000, 5000, 15000, 15000, 3750, 3750, 3750, 2000, 2000, 10000, 10000, 25000, 25000, 25000, 99900];
    const d = withTxs(amts.map((amount, i) => tx({ date: addDay(i), amount })));
    // 37,50 TL yuvarlak değil; 999 TL tek kez. 20/100/150 TL ikişer: en yeni girilenler (20 ve 100) kazanır.
    expect(quickAmounts(d, 'expense', TODAY)).toEqual([2000, 5000, 10000, 25000]);
  });

  it('planlı kalemleri, diğer türü ve tek seferlikleri saymaz', () => {
    const d = withTxs([
      tx({ date: '2026-10-01', amount: 450000, planRef: { planId: 'p', due: '2026-10-01' } }),
      tx({ date: '2026-09-01', amount: 450000, planRef: { planId: 'p', due: '2026-09-01' } }),
      tx({ date: '2026-10-02', amount: 700000, type: 'income' }),
      tx({ date: '2026-09-02', amount: 700000, type: 'income' }),
      tx({ date: '2026-10-03', amount: 8000 }),
    ]);
    expect(quickAmounts(d, 'expense', TODAY)).toEqual([]);
    expect(quickAmounts(d, 'income', TODAY)).toEqual([700000]);
  });

  it('yuvarlak tutar tanımı', () => {
    expect(isRoundAmount(5000)).toBe(true);
    expect(isRoundAmount(4500)).toBe(true);
    expect(isRoundAmount(3700)).toBe(false);
    expect(isRoundAmount(5050)).toBe(false);
  });
});

function addDay(i: number) {
  return `2026-10-${String(1 + (i % 14)).padStart(2, '0')}`;
}
