/**
 * Para tutarları her yerde tam sayı kuruş olarak tutulur (1 TL = 100).
 * Böylece toplama/çıkarmada kayan nokta yuvarlama hatası oluşmaz.
 */
export type Money = number;

/** Biçimlendirme dili ('tr' varsayılan). Türkçe: "1.234,50 TL"; İngilizce: "₺1,234.50". */
export type MoneyLang = 'tr' | 'en';

export const isMoney = (v: unknown): v is Money => typeof v === 'number' && Number.isSafeInteger(v);

/**
 * Kullanıcının yazdığı tutarı kuruşa çevirir. Türkçe yazımı esas alır:
 *  "1.234,56" → 123456, "45,5" → 4550, "1.250" → 125000, "12.5" → 1250.
 * İngilizce (lang='en'): nokta ondalık, virgül binlik ayırıcı:
 *  "1,234.50" → 123450, "12.5" → 1250, "1,250" → 125000; tek virgül binlik gruplaması değilse ondalık sayılır ("45,5" → 4550).
 * Geçersiz, sıfır veya negatif girdide null döner.
 */
export function parseMoney(input: string, lang: MoneyLang = 'tr'): Money | null {
  let s = input.trim().replace(/\s|₺|tl$|try$/gi, '');
  if (!s) return null;
  if (lang === 'en') {
    if (/^\d{1,3}(,\d{3})+(\.\d*)?$/.test(s)) s = s.replace(/,/g, '');
    else if (/^\d+,\d{0,2}$/.test(s)) s = s.replace(',', '.');
  } else if (s.includes(',')) {
    // Virgül ondalık ayırıcıdır; noktalar binlik ayırıcıdır.
    if ((s.match(/,/g) ?? []).length > 1) return null;
    const [intPart, frac] = s.split(',');
    if (intPart.includes('.') && !/^\d{1,3}(\.\d{3})+$/.test(intPart)) return null;
    s = intPart.replace(/\./g, '') + '.' + frac;
  } else if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
    s = s.replace(/\./g, '');
  }
  if (!/^\d+(\.\d{0,2})?$/.test(s)) return null;
  const [lira, kurus = ''] = s.split('.');
  const value = Number(lira) * 100 + Number((kurus + '00').slice(0, 2));
  if (!Number.isSafeInteger(value) || value <= 0) return null;
  return value;
}

const groupFmt = { tr: new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }), en: new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }) };
/** Ondalık ayırıcı */
export const decimalSep = (lang: MoneyLang = 'tr') => (lang === 'en' ? '.' : ',');

/** Kuruşu "1.234,50 TL" (en: "₺1,234.50") biçiminde yazar. Kuruş sıfırsa ondalığı gizler (compact=true). */
export function formatMoney(m: Money, opts: { sign?: boolean; compact?: boolean; unit?: boolean; lang?: MoneyLang } = {}): string {
  const { sign = false, compact = true, unit = true, lang = 'tr' } = opts;
  const neg = m < 0;
  const abs = Math.abs(m);
  const lira = Math.floor(abs / 100);
  const kurus = abs % 100;
  let body = groupFmt[lang].format(lira);
  if (!compact || kurus !== 0) body += decimalSep(lang) + String(kurus).padStart(2, '0');
  const prefix = neg ? '−' : sign && m > 0 ? '+' : '';
  if (lang === 'en') return prefix + (unit ? '₺' : '') + body;
  return prefix + body + (unit ? ' TL' : '');
}

/** Gizli tutar: "••••• TL" (en: "₺•••••"). */
export const hiddenMoney = (lang: MoneyLang = 'tr', mask = '•••••') => (lang === 'en' ? '₺' + mask : mask + ' TL');

/** Büyük gösterim için lira ve kuruş parçaları. */
export function moneyParts(m: Money, lang: MoneyLang = 'tr'): { sign: string; lira: string; kurus: string } {
  const abs = Math.abs(m);
  return {
    sign: m < 0 ? '−' : '',
    lira: groupFmt[lang].format(Math.floor(abs / 100)),
    kurus: String(abs % 100).padStart(2, '0'),
  };
}

/** Kuruşu düzenleme alanına yazılacak metne çevirir: 123450 → "1234,50" (en: "1234.50"). */
export function moneyToInput(m: Money, lang: MoneyLang = 'tr'): string {
  const lira = Math.floor(m / 100);
  const kurus = m % 100;
  return kurus === 0 ? String(lira) : `${lira}${decimalSep(lang)}${String(kurus).padStart(2, '0')}`;
}

/** Yüzdeyi tam sayıya yuvarlar; payda sıfırsa null. */
export function percent(part: Money, whole: Money): number | null {
  if (whole <= 0) return null;
  return Math.round((part / whole) * 100);
}

export const sum = (xs: Money[]): Money => xs.reduce((a, b) => a + b, 0);
