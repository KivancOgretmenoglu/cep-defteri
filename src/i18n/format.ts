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
