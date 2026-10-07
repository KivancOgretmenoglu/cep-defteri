/** Tarihler yerel takvim günü olarak 'YYYY-MM-DD' metni şeklinde tutulur; saat dilimi kayması olmaz. */
export type ISODate = string;
/** Ay anahtarı: 'YYYY-MM' */
export type MonthKey = string;

const pad = (n: number) => String(n).padStart(2, '0');

export function todayISO(now: Date = new Date()): ISODate {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export const isISODate = (s: unknown): s is ISODate =>
  typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && fromParts(s) !== null;

function fromParts(d: string): number | null {
  const [y, m, day] = d.split('-').map(Number);
  const t = Date.UTC(y, m - 1, day);
  const back = new Date(t);
  if (back.getUTCFullYear() !== y || back.getUTCMonth() !== m - 1 || back.getUTCDate() !== day) return null;
  return t;
}

const DAY = 86_400_000;
const toUTC = (d: ISODate) => fromParts(d) as number;
const fromUTC = (t: number): ISODate => {
  const x = new Date(t);
  return `${x.getUTCFullYear()}-${pad(x.getUTCMonth() + 1)}-${pad(x.getUTCDate())}`;
};

export const addDays = (d: ISODate, n: number): ISODate => fromUTC(toUTC(d) + n * DAY);
export const diffDays = (a: ISODate, b: ISODate): number => Math.round((toUTC(a) - toUTC(b)) / DAY);
export const monthOf = (d: ISODate): MonthKey => d.slice(0, 7);
export const daysInMonth = (m: MonthKey): number => {
  const [y, mo] = m.split('-').map(Number);
  return new Date(Date.UTC(y, mo, 0)).getUTCDate();
};
export const monthStart = (m: MonthKey): ISODate => `${m}-01`;
export const monthEnd = (m: MonthKey): ISODate => `${m}-${pad(daysInMonth(m))}`;
export function addMonths(m: MonthKey, n: number): MonthKey {
  const [y, mo] = m.split('-').map(Number);
  const idx = y * 12 + (mo - 1) + n;
  return `${Math.floor(idx / 12)}-${pad((idx % 12) + 1)}`;
}
/** Belirli bir ayın belirli gününe denk gelen tarih; ayda o gün yoksa ayın son günü (31 → 30/28). */
export function dayInMonth(m: MonthKey, day: number): ISODate {
  return `${m}-${pad(Math.min(day, daysInMonth(m)))}`;
}
export const dayOfMonth = (d: ISODate): number => Number(d.slice(8, 10));
export const inRange = (d: ISODate, from: ISODate, to: ISODate) => d >= from && d <= to;
export const minDate = (a: ISODate, b: ISODate) => (a < b ? a : b);
export const maxDate = (a: ISODate, b: ISODate) => (a > b ? a : b);

/** Biçimlendirme dili ('tr' varsayılan). */
export type DateLang = 'tr' | 'en';

const MONTHS = {
  tr: ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
};
const MONTHS_SHORT = {
  tr: ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};
const WEEKDAYS = {
  tr: ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
};

export const monthName = (m: MonthKey, lang: DateLang = 'tr') => MONTHS[lang][Number(m.slice(5, 7)) - 1];
export const monthLabel = (m: MonthKey, lang: DateLang = 'tr') => `${monthName(m, lang)} ${m.slice(0, 4)}`;
export const monthShort = (m: MonthKey, lang: DateLang = 'tr') => MONTHS_SHORT[lang][Number(m.slice(5, 7)) - 1];
export const weekday = (d: ISODate, lang: DateLang = 'tr') => WEEKDAYS[lang][new Date(toUTC(d)).getUTCDay()];

/** "3 Eki" veya yıl farklıysa "3 Eki 2025" (en: "Oct 3", "Oct 3, 2025") */
export function shortDate(d: ISODate, today?: ISODate, lang: DateLang = 'tr'): string {
  const mon = MONTHS_SHORT[lang][Number(d.slice(5, 7)) - 1];
  const otherYear = !!today && today.slice(0, 4) !== d.slice(0, 4);
  if (lang === 'en') return `${mon} ${dayOfMonth(d)}${otherYear ? `, ${d.slice(0, 4)}` : ''}`;
  const s = `${dayOfMonth(d)} ${mon}`;
  return otherYear ? `${s} ${d.slice(0, 4)}` : s;
}

/** Gün başlığı: "Bugün", "Dün", "Yarın" veya "3 Ekim, Cuma" (en: "Today", "Friday, October 3") */
export function relativeDay(d: ISODate, today: ISODate, lang: DateLang = 'tr'): string {
  const diff = diffDays(d, today);
  const en = lang === 'en';
  if (diff === 0) return en ? 'Today' : 'Bugün';
  if (diff === -1) return en ? 'Yesterday' : 'Dün';
  if (diff === 1) return en ? 'Tomorrow' : 'Yarın';
  const otherYear = d.slice(0, 4) !== today.slice(0, 4);
  if (en) return `${weekday(d, lang)}, ${monthName(monthOf(d), lang)} ${dayOfMonth(d)}${otherYear ? `, ${d.slice(0, 4)}` : ''}`;
  const y = otherYear ? ` ${d.slice(0, 4)}` : '';
  return `${dayOfMonth(d)} ${monthName(monthOf(d))}${y}, ${weekday(d)}`;
}

/** "3 gün sonra", "bugün", "2 gün gecikti" (en: "in 3 days", "today", "2 days overdue") */
export function dueLabel(d: ISODate, today: ISODate, lang: DateLang = 'tr'): string {
  const diff = diffDays(d, today);
  if (lang === 'en') {
    if (diff === 0) return 'today';
    if (diff === 1) return 'tomorrow';
    if (diff > 1) return `in ${diff} days`;
    return -diff === 1 ? '1 day overdue' : `${-diff} days overdue`;
  }
  if (diff === 0) return 'bugün';
  if (diff === 1) return 'yarın';
  if (diff > 1) return `${diff} gün sonra`;
  return `${-diff} gün gecikti`;
}

/** Haftanın pazartesisi. */
export function weekStart(d: ISODate): ISODate {
  const dow = new Date(toUTC(d)).getUTCDay(); // 0=Pazar
  return addDays(d, -((dow + 6) % 7));
}
