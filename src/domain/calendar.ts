/**
 * İşlemler ekranındaki ay takvimi için saf yardımcılar: pazartesiyle başlayan hafta satırları ve
 * günlük toplamlar (harcama = giderler − iadeler, rangeSummary ile aynı tanım; gelir; kayıt sayısı).
 */
import type { Tx } from './types';
import type { Money } from './money';
import { addDays, daysInMonth, monthStart, weekStart, type ISODate, type MonthKey } from './dates';

/** Ayın haftaları: her satır 7 hücre (pazartesi → pazar); ay dışındaki hücreler null. */
export function monthGrid(month: MonthKey): (ISODate | null)[][] {
  const first = monthStart(month);
  const n = daysInMonth(month);
  const weeks: (ISODate | null)[][] = [];
  let d = weekStart(first);
  const last = addDays(first, n - 1);
  while (d <= last) {
    const row: (ISODate | null)[] = [];
    for (let i = 0; i < 7; i++, d = addDays(d, 1)) row.push(d >= first && d <= last ? d : null);
    weeks.push(row);
  }
  return weeks;
}

export interface DayTotal {
  spending: Money;
  income: Money;
  count: number;
}

export function dayTotals(txs: Tx[]): Map<ISODate, DayTotal> {
  const m = new Map<ISODate, DayTotal>();
  for (const t of txs) {
    const x = m.get(t.date) ?? { spending: 0, income: 0, count: 0 };
    x.count++;
    if (t.type === 'expense') x.spending += t.amount;
    else if (t.type === 'refund') x.spending -= t.amount;
    else if (t.type === 'income') x.income += t.amount;
    m.set(t.date, x);
  }
  return m;
}

/**
 * Yoğunluk seviyesi 0–4: 0 = yok; diğerleri ayın en yüksek değerine göre karekök ölçekte (birkaç büyük
 * gün geri kalanları silikleştirmesin). Tek renk, açıktan koyuya.
 */
export function heatLevel(v: number, max: number): 0 | 1 | 2 | 3 | 4 {
  if (!(v > 0) || !(max > 0)) return 0;
  const r = Math.sqrt(Math.min(v, max) / max);
  return r > 0.75 ? 4 : r > 0.5 ? 3 : r > 0.25 ? 2 : 1;
}
