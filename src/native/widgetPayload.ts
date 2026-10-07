/**
 * Ana ekran aracının (widget) göstereceği metinler ve maskot. Biçimlendirme (dil dahil) burada yapılır;
 * Java tarafı (CepWidgetProvider) yalnız yazar ve `mascot` anahtarına göre widget_mascot_<anahtar> görselini seçer.
 */
import type { Data, Lang } from '../domain/types';
import { availability } from '../domain/ledger';
import { dayOfMonth, monthName, monthOf, type ISODate, type MonthKey } from '../domain/dates';
import { formatMoney } from '../domain/money';
import { DEFAULT_MASCOT, MASCOT_KEYS, type MascotKey } from '../mascot/characters';

export interface WidgetPayload {
  /** "1.234 TL", "•••• TL" ya da "—" */
  amount: string;
  /** "Ekim sonuna kadar" / "until end of October" */
  label: string;
  /** Küçük not: "örnek veri" / "hesap ekleyince görünür" / "" */
  note: string;
  negative: boolean;
  /** Başlık: "Kullanılabilir" / "Available" */
  title: string;
  /** Düğme: "+ Ekle" / "+ Add" */
  add: string;
  /** Seçili maskot anahtarı (drawable-nodpi/widget_mascot_<anahtar>.png) */
  mascot: MascotKey;
  lang: Lang;
  updatedAt: number;
}

const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** Araca özel küçük sözlük (uygulama genelindeki çeviri altyapısından bağımsız). */
const STR = {
  tr: {
    title: 'Kullanılabilir',
    add: '+ Ekle',
    demo: 'örnek veri',
    noAccount: 'Hesap ekleyince görünür',
    emptyLabel: 'Kullanılabilir para',
    monthEnd: (m: MonthKey) => `${monthName(m)} sonuna kadar`,
    until: (d: ISODate) => `${dayOfMonth(d)} ${monthName(monthOf(d))} tarihine kadar`,
  },
  en: {
    title: 'Available',
    add: '+ Add',
    demo: 'demo data',
    noAccount: 'Add an account to see it',
    emptyLabel: 'Available money',
    monthEnd: (m: MonthKey) => `until end of ${MONTHS_EN[Number(m.slice(5, 7)) - 1]}`,
    until: (d: ISODate) => `until ${dayOfMonth(d)} ${MONTHS_EN[Number(d.slice(5, 7)) - 1]}`,
  },
} as const;

export function widgetLang(data: Data): Lang {
  return data.settings.lang === 'en' ? 'en' : 'tr';
}

export function widgetMascot(data: Data): MascotKey {
  const k = data.settings.mascot?.key;
  return (MASCOT_KEYS as string[]).includes(k ?? '') ? (k as MascotKey) : DEFAULT_MASCOT;
}

export function periodLabel(data: Data, today: ISODate, periodEnd: ISODate, lang: Lang = widgetLang(data)): string {
  const s = STR[lang];
  if (data.settings.periodMode === 'month') return s.monthEnd(monthOf(today));
  return s.until(periodEnd);
}

export function widgetPayload(data: Data, today: ISODate, mode: 'real' | 'demo', now = Date.now()): WidgetPayload {
  const lang = widgetLang(data);
  const s = STR[lang];
  const base = { title: s.title, add: s.add, mascot: widgetMascot(data), lang, updatedAt: now };
  const av = availability(data, today);
  const demo = mode === 'demo';
  if (av.confidence === 'none') {
    return { amount: '—', label: s.emptyLabel, note: demo ? s.demo : s.noAccount, negative: false, ...base };
  }
  const hidden = data.settings.hideTotals;
  return {
    amount: hidden ? '•••• TL' : formatMoney(av.available),
    label: periodLabel(data, today, av.periodEnd, lang),
    note: demo ? s.demo : '',
    negative: !hidden && av.available < 0,
    ...base,
  };
}
