/**
 * Özel günler (maskot kutlar): kullanıcının doğum günü (Ayarlar'dan, isteğe bağlı) ve uygulamayı kullanmaya
 * başlamanın yıl dönümü (ilk hesabın açıldığı gün). Örnek veri modunda yok. 29 Şubat artık olmayan yıllarda 28'i.
 */
import type { Data } from './types';
import { daysInMonth, type ISODate } from './dates';

export type SpecialDay = { kind: 'birthday' } | { kind: 'anniversary'; years: number; txCount: number } | null;

/** "MM-DD" geçerli mi (29 Şubat dahil). */
export function isBirthday(v: unknown): v is string {
  if (typeof v !== 'string' || !/^\d{2}-\d{2}$/.test(v)) return false;
  const [m, d] = v.split('-').map(Number);
  return m >= 1 && m <= 12 && d >= 1 && d <= daysInMonth(`2024-${String(m).padStart(2, '0')}`);
}

/** Bu yılda o günün karşılığı: 29 Şubat, artık olmayan yılda 28 Şubat. */
function observed(md: string, year: number): string {
  if (md !== '02-29') return md;
  return daysInMonth(`${year}-02`) === 29 ? md : '02-28';
}

const localISO = (ms: number) => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export function specialDay(data: Data, today: ISODate, mode: 'real' | 'demo' = 'real'): SpecialDay {
  if (mode !== 'real') return null;
  const year = Number(today.slice(0, 4));
  const md = today.slice(5);
  const b = data.settings.birthday;
  if (isBirthday(b) && observed(b, year) === md) return { kind: 'birthday' };
  if (data.accounts.length) {
    const start = localISO(Math.min(...data.accounts.map((a) => a.createdAt)));
    const years = year - Number(start.slice(0, 4));
    if (years >= 1 && observed(start.slice(5), year) === md) return { kind: 'anniversary', years, txCount: data.txs.length };
  }
  return null;
}
