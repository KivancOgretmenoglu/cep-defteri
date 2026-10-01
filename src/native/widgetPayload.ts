/** Ana ekran aracının (widget) göstereceği metinler. Biçimlendirme burada yapılır; Java tarafı yalnız yazar. */
import type { Data } from '../domain/types';
import { availability } from '../domain/ledger';
import { dayOfMonth, monthName, monthOf, type ISODate } from '../domain/dates';
import { formatMoney } from '../domain/money';

export interface WidgetPayload {
  /** "1.234 TL", "•••• TL" ya da "—" */
  amount: string;
  /** "Ekim sonuna kadar" */
  label: string;
  /** Küçük not: "örnek veri" / "hesap ekleyince görünür" / "" */
  note: string;
  negative: boolean;
  updatedAt: number;
}

export function periodLabel(data: Data, today: ISODate, periodEnd: ISODate): string {
  if (data.settings.periodMode === 'month') return `${monthName(monthOf(today))} sonuna kadar`;
  return `${dayOfMonth(periodEnd)} ${monthName(monthOf(periodEnd))} tarihine kadar`;
}

export function widgetPayload(data: Data, today: ISODate, mode: 'real' | 'demo', now = Date.now()): WidgetPayload {
  const av = availability(data, today);
  const demo = mode === 'demo';
  if (av.confidence === 'none') {
    return { amount: '—', label: 'Kullanılabilir para', note: demo ? 'örnek veri' : 'Hesap ekleyince görünür', negative: false, updatedAt: now };
  }
  const hidden = data.settings.hideTotals;
  return {
    amount: hidden ? '•••• TL' : formatMoney(av.available),
    label: periodLabel(data, today, av.periodEnd),
    note: demo ? 'örnek veri' : '',
    negative: !hidden && av.available < 0,
    updatedAt: now,
  };
}
