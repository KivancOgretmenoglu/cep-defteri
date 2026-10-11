/**
 * Altın/döviz fiyatlarının ayrıştırılması (saf; ağ erişimi src/store/prices.ts'te).
 *
 * Birincil kaynak: finans.truncgil.com/today.json — Türk altın türleri (gram, çeyrek, yarım, tam,
 * cumhuriyet, 22 ayar bilezik) ve USD/EUR/GBP için TL alış/satış; anahtar gerektirmez.
 * Yedek kaynak: fawazahmed0 currency-api (jsDelivr CDN) — TRY bazlı orta kur; altın, ons (XAU)
 * fiyatından has gram karşılığıyla TAHMİN edilir (işçilik/makas yok, "tahmini" diye gösterilir).
 *
 * Ayrıştırıcılar savunmacıdır: bilinmeyen/bozuk alanlar atlanır, saçma değerler (≤0, NaN) alınmaz.
 */
import type { Money } from './money';
import { FX_UNITS, GOLD_UNITS, PURE_GRAMS, type AssetUnit } from './assets';

export type PriceSource = 'live' | 'estimate' | 'manual';

export interface UnitPrice {
  /** Alış: satıcının senden alacağı fiyat (değer hesabında kullanılır). */
  buy: Money;
  /** Satış: satıcıdan alırken ödediğin fiyat (katkı formunda öneri). */
  sell: Money;
  /** Fiyatın alındığı an (ms). */
  at: number;
  source: PriceSource;
}

export type PriceBook = Partial<Record<AssetUnit, UnitPrice>>;

export const PRIMARY_URL = 'https://finans.truncgil.com/today.json';
export const FALLBACK_URLS = [
  'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/try.min.json',
  'https://latest.currency-api.pages.dev/v1/currencies/try.min.json',
];

/** 1 ons = 31,1035 gram */
export const TROY_OZ_GRAMS = 31.1034768;

/**
 * Türkçe/İngilizce sayı metnini sayıya çevirir: "3.245,67" → 3245.67, "29,8160" → 29.816,
 * "1,945.47" → 1945.47, "$1.234,5 TL" → 1234.5, 42 → 42. Ayrıştırılamazsa null.
 */
export function parseNumberLoose(v: unknown): number | null {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v !== 'string') return null;
  let s = v.replace(/[^\d.,-]/g, '');
  if (!s || !/\d/.test(s)) return null;
  const lastComma = s.lastIndexOf(',');
  const lastDot = s.lastIndexOf('.');
  if (lastComma > -1 && lastDot > -1) {
    // Sondaki ayraç ondalıktır.
    s = lastComma > lastDot ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
  } else if (lastComma > -1) {
    s = (s.match(/,/g) ?? []).length > 1 ? s.replace(/,/g, '') : s.replace(',', '.');
  } else if ((s.match(/\./g) ?? []).length > 1) {
    s = s.replace(/\./g, '');
  } else if (/^-?\d{1,3}\.\d{3}$/.test(s)) {
    // "3.245" tek noktalı ve tam 3 haneli: bu kaynaklarda TL fiyatı binlik ayırıcıyla yazılır.
    s = s.replace('.', '');
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

const toMoney = (n: number | null): Money | null => (n !== null && n > 0 && n < 1e10 ? Math.round(n * 100) : null);

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Kaynaktaki olası anahtarlar (eski "today.json" ve v4 biçimi). */
const TRUNCGIL_KEYS: Record<AssetUnit, string[]> = {
  gram: ['gram-altin', 'GRA', 'gram altın'],
  ceyrek: ['ceyrek-altin', 'CEYREKALTIN'],
  yarim: ['yarim-altin', 'YARIMALTIN'],
  tam: ['tam-altin', 'TAMALTIN'],
  cumhuriyet: ['cumhuriyet-altini', 'CUMHURIYETALTINI'],
  bilezik22: ['22-ayar-bilezik', 'YIA', 'BILEZIK22'],
  USD: ['USD'],
  EUR: ['EUR'],
  GBP: ['GBP'],
};
const BUY_FIELDS = ['Alış', 'Alis', 'alis', 'alış', 'Buying', 'buying', 'buy'];
const SELL_FIELDS = ['Satış', 'Satis', 'satis', 'satış', 'Selling', 'selling', 'sell'];

const field = (o: Record<string, unknown>, names: string[]) => {
  for (const n of names) if (n in o) return o[n];
  // Kodlaması bozulmuş "AlÄ±Å" gibi anahtarlar için gevşek eşleşme.
  const k = Object.keys(o).find((x) => names.some((n) => x.toLowerCase().startsWith(n.slice(0, 2).toLowerCase())));
  return k ? o[k] : undefined;
};

/** finans.truncgil.com today.json → PriceBook. */
export function parseTruncgil(json: unknown, now: number): PriceBook {
  const book: PriceBook = {};
  if (!isObj(json)) return book;
  for (const unit of [...GOLD_UNITS, ...FX_UNITS]) {
    const key = TRUNCGIL_KEYS[unit].find((k) => isObj(json[k]));
    if (!key) continue;
    const row = json[key] as Record<string, unknown>;
    const buy = toMoney(parseNumberLoose(field(row, BUY_FIELDS)));
    const sell = toMoney(parseNumberLoose(field(row, SELL_FIELDS)));
    if (buy === null && sell === null) continue;
    const b = buy ?? sell!;
    const s = sell ?? buy!;
    // Makas ters gelirse küçük olan alıştır; uçuk fark (×2) bozuk veridir.
    const lo = Math.min(b, s), hi = Math.max(b, s);
    if (hi > lo * 2) continue;
    book[unit] = { buy: lo, sell: hi, at: now, source: 'live' };
  }
  return book;
}

/**
 * currency-api `{ try: { usd: 0.029, eur: …, xau: 0.0000067 } }` (1 TL = x birim) → PriceBook.
 * Döviz orta kurdur (alış = satış). Altın onstan türetilir ve 'estimate' işaretlenir.
 */
export function parseCurrencyApi(json: unknown, now: number): PriceBook {
  const book: PriceBook = {};
  if (!isObj(json) || !isObj(json.try)) return book;
  const r = json.try;
  for (const unit of FX_UNITS) {
    const per = parseNumberLoose(r[unit.toLowerCase()]);
    const p = per && per > 0 ? toMoney(1 / per) : null;
    if (p) book[unit] = { buy: p, sell: p, at: now, source: 'live' };
  }
  const xau = parseNumberLoose(r.xau);
  if (xau && xau > 0) {
    const gram = 1 / xau / TROY_OZ_GRAMS;
    for (const unit of GOLD_UNITS) {
      const p = toMoney(gram * PURE_GRAMS[unit]);
      if (p) book[unit] = { buy: p, sell: p, at: now, source: 'estimate' };
    }
  }
  return book;
}

/** Birincil kaynakta olmayan birimleri yedekten tamamlar. */
export function mergeBooks(primary: PriceBook, fallback: PriceBook): PriceBook {
  return { ...fallback, ...primary };
}

/** Yeni çekilen fiyatlar eskilerin üzerine yazılır; yeni kaynakta olmayan birimin eski fiyatı kalır. */
export function updateBook(old: PriceBook, fresh: PriceBook): PriceBook {
  return { ...old, ...fresh };
}

/** Önbellekten okunan kitabı doğrular (bozuk girişleri atar). */
export function sanitizeBook(v: unknown): PriceBook {
  const out: PriceBook = {};
  if (!isObj(v)) return out;
  for (const unit of [...GOLD_UNITS, ...FX_UNITS]) {
    const p = v[unit];
    if (!isObj(p)) continue;
    const { buy, sell, at, source } = p;
    if (Number.isSafeInteger(buy) && (buy as number) > 0 && Number.isSafeInteger(sell) && (sell as number) > 0 && typeof at === 'number' && ['live', 'estimate', 'manual'].includes(source as string))
      out[unit] = { buy: buy as Money, sell: sell as Money, at, source: source as PriceSource };
  }
  return out;
}
