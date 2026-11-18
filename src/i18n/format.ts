/**
 * Arayüz için dile duyarlı biçimlendirme. src/domain'deki saf işlevleri o anki dil (settings.lang) ile çağırır.
 * Bileşenler dil değişince useT() sayesinde yeniden çizildiğinden burada okunan dil her zaman günceldir.
 */
import * as M from '../domain/money';
import * as D from '../domain/dates';
import type { Category } from '../domain/types';
import { categoryName } from '../domain/defaults';
import { ActionError } from '../domain/actions';
import { getLang } from './lang';
import { pct, type PctForm } from '../domain/tr';
import { priceDecimals, roundPrice, type AssetUnit } from '../domain/assets';

export type { Money } from '../domain/money';

export const formatMoney = (m: M.Money, opts: { sign?: boolean; compact?: boolean; unit?: boolean } = {}) => M.formatMoney(m, { ...opts, lang: getLang() });
export const moneyParts = (m: M.Money) => M.moneyParts(m, getLang());
export const moneyToInput = (m: M.Money) => M.moneyToInput(m, getLang());
export const parseMoney = (input: string) => M.parseMoney(input, getLang());
export const hiddenMoney = (mask?: string) => M.hiddenMoney(getLang(), mask);
export const decimalSep = () => M.decimalSep(getLang());
/** Tutar alanının birimi: "TL" ya da "₺". */
export const moneyUnit = () => (getLang() === 'en' ? '₺' : 'TL');

export const monthName = (m: D.MonthKey) => D.monthName(m, getLang());
export const monthLabel = (m: D.MonthKey) => D.monthLabel(m, getLang());
export const monthShort = (m: D.MonthKey) => D.monthShort(m, getLang());
export const weekday = (d: D.ISODate) => D.weekday(d, getLang());
export const shortDate = (d: D.ISODate, today?: D.ISODate) => D.shortDate(d, today, getLang());
export const relativeDay = (d: D.ISODate, today: D.ISODate) => D.relativeDay(d, today, getLang());
export const dueLabel = (d: D.ISODate, today: D.ISODate) => D.dueLabel(d, today, getLang());

/** Kategorinin seçili dildeki adı (varsayılan ve adı değiştirilmemişse çevrilir). */
export const catName = (c: Pick<Category, 'id' | 'name'> | undefined | null) => (c ? categoryName(c, getLang()) : '');

/** Domain hatasını o anki dilde metne çevirir. */
export const errorText = (e: unknown) => (e instanceof ActionError ? e.localize(getLang()) : e instanceof Error ? e.message : String(e));

/** Arama/karşılaştırma için dile uygun küçük harf. */
export const lower = (s: string) => s.toLocaleLowerCase(getLang() === 'en' ? 'en' : 'tr');

/** Yüzde: Türkçede "%55" / ekli "%55'i" (src/domain/tr.ts), İngilizcede "55%". */
export const pctPlain = (n: number) => (getLang() === 'en' ? `${n}%` : `%${n}`);
export const pctForm = (n: number, form: PctForm) => (getLang() === 'en' ? `${n}%` : pct(n, form));

/** Intl yerel ayarı (tarih/saat biçimleri için). */
export const intlLocale = () => (getLang() === 'en' ? 'en-US' : 'tr-TR');

/** Hisse fiyatı kendi para biriminde: TL → formatMoney, USD → "$356,27" (en: "$356.27"). */
export function formatQuote(minor: number, ccy: 'TRY' | 'USD'): string {
  if (ccy === 'TRY') return formatMoney(minor, { compact: false });
  return new Intl.NumberFormat(getLang() === 'en' ? 'en-US' : 'tr-TR', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(minor / 100);
}

/**
 * Birim fiyat: altın/döviz/hisse kuruş (formatMoney), fon 6 ondalıklı TL ("1,234567 TL"). Fon fiyatı
 * kuruş cinsinden 4 ondalıklı sayı olarak tutulur (src/domain/assets.ts priceDecimals).
 */
export function formatUnitPrice(p: number, u?: AssetUnit): string {
  const d = priceDecimals(u);
  if (d === 0) return formatMoney(Math.round(p), { compact: false });
  const lang = getLang();
  const n = new Intl.NumberFormat(lang === 'en' ? 'en-US' : 'tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 + d }).format(p / 100);
  return lang === 'en' ? `₺${n}` : `${n} TL`;
}

/** Birim fiyatı düzenleme alanına yazar. */
export function unitPriceToInput(p: number, u?: AssetUnit): string {
  const d = priceDecimals(u);
  if (d === 0) return moneyToInput(Math.round(p));
  const s = (p / 100).toFixed(2 + d).replace(/0+$/, '').replace(/\.$/, '');
  return getLang() === 'en' ? s : s.replace('.', ',');
}

/** Birim fiyatı ayrıştırır: fonlarda en fazla 6 ondalık TL (binlik ayırıcısız), diğerlerinde parseMoney. */
export function parseUnitPrice(raw: string, u?: AssetUnit): number | null {
  const d = priceDecimals(u);
  if (d === 0) return parseMoney(raw);
  let s = raw.trim().replace(/\s|₺|tl$/gi, '');
  if (getLang() === 'en') s = s.replace(/,/g, '');
  else s = s.replace(/\./g, '').replace(',', '.');
  if (!/^\d+(\.\d{1,6})?$/.test(s)) return null;
  const v = roundPrice(Number(s) * 100, u);
  return v > 0 ? v : null;
}

/** İşaretli yüzde (bir ondalık): TR "+%3,1" / "−%2", EN "+3.1%" / "−2%". */
export function pctSigned(n: number): string {
  const r = Math.round(Math.abs(n) * 10) / 10;
  const s = new Intl.NumberFormat(getLang() === 'en' ? 'en-US' : 'tr-TR', { maximumFractionDigits: 1 }).format(r);
  const sign = n > 0 && r > 0 ? '+' : n < 0 && r > 0 ? '−' : '';
  return getLang() === 'en' ? `${sign}${s}%` : `${sign}%${s}`;
}
