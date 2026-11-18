/**
 * Ayın ilk günlerinde maskottan gelen kısa mektup: biten ayın 3–5 cümlelik, sıcak bir özeti. Ay karnesinin
 * (monthReport) verisini kullanır; yargılamaz, yalnız olanı söyler. Metinler sözlükten (translator).
 */
import type { Data } from './types';
import { monthReport } from './ledger';
import { addMonths, monthName, type ISODate, type MonthKey } from './dates';
import { categoryName } from './defaults';
import { formatMoney } from './money';
import type { TFn } from '../i18n/core';
import { properSuffix } from './tr';

export interface Letter {
  month: MonthKey;
  lines: string[];
  /** Bütçe içinde mi (mektup kâğıdına küçük bir yıldız) */
  star: boolean;
}

export function monthLetter(data: Data, month: MonthKey, today: ISODate, T: TFn, lang: 'tr' | 'en'): Letter {
  const r = monthReport(data, month, today);
  const s = r.summary;
  const m = monthName(month, lang);
  const money = (v: number) => formatMoney(v, { lang });
  const lines: string[] = [T('letter.hello')];
  const cat = r.topCategory ? data.categories.find((c) => c.id === r.topCategory!.id) : undefined;
  lines.push(
    cat
      ? T('letter.spent', { inMonth: lang === 'en' ? m : properSuffix(m, 'loc'), amount: money(Math.max(0, s.spending)), cat: categoryName(cat, lang), catAmount: money(r.topCategory!.amount) })
      : T('letter.spentNoCat', { inMonth: lang === 'en' ? m : properSuffix(m, 'loc'), amount: money(Math.max(0, s.spending)) }),
  );
  if (r.spendingChange !== null && s.spending > 0) {
    const prev = s.spending - r.spendingChange;
    const pct = prev > 0 ? Math.round((Math.abs(r.spendingChange) / prev) * 100) : 0;
    const pm = monthName(addMonths(month, -1), lang);
    const p = lang === 'en' ? `${pct}%` : `%${pct}`;
    if (pct >= 5) lines.push(T(r.spendingChange < 0 ? 'letter.less' : 'letter.more', { toPrev: lang === 'en' ? pm : properSuffix(pm, 'dat'), pct: p }));
  }
  if (s.income > 0) lines.push(T('letter.income', { amount: money(s.income) }));
  const b = r.budget;
  const star = b.budget !== null && b.spent <= b.budget;
  if (b.budget !== null) lines.push(star ? T('letter.within') : T('letter.over', { amount: money(b.spent - b.budget) }));
  if (s.offBudget > 0) lines.push(T('letter.offBudget', { amount: money(s.offBudget) }));
  lines.push(T('letter.days', { n: r.activeDays }));
  return { month, lines, star };
}
