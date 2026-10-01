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

const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const MONTHS_SHORT = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
const WEEKDAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

export const monthName = (m: MonthKey) => MONTHS[Number(m.slice(5, 7)) - 1];
export const monthLabel = (m: MonthKey) => `${monthName(m)} ${m.slice(0, 4)}`;
export const monthShort = (m: MonthKey) => MONTHS_SHORT[Number(m.slice(5, 7)) - 1];
export const weekday = (d: ISODate) => WEEKDAYS[new Date(toUTC(d)).getUTCDay()];

/** "3 Eki" veya yıl farklıysa "3 Eki 2025" */
export function shortDate(d: ISODate, today?: ISODate): string {
  const s = `${dayOfMonth(d)} ${MONTHS_SHORT[Number(d.slice(5, 7)) - 1]}`;
  return today && today.slice(0, 4) !== d.slice(0, 4) ? `${s} ${d.slice(0, 4)}` : s;
}

/** Gün başlığı: "Bugün", "Dün", "Yarın" veya "3 Ekim, Cuma" */
export function relativeDay(d: ISODate, today: ISODate): string {
  const diff = diffDays(d, today);
  if (diff === 0) return 'Bugün';
  if (diff === -1) return 'Dün';
  if (diff === 1) return 'Yarın';
  const y = d.slice(0, 4) !== today.slice(0, 4) ? ` ${d.slice(0, 4)}` : '';
  return `${dayOfMonth(d)} ${monthName(monthOf(d))}${y}, ${weekday(d)}`;
}

/** "3 gün sonra", "bugün", "2 gün gecikti" */
export function dueLabel(d: ISODate, today: ISODate): string {
  const diff = diffDays(d, today);
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
