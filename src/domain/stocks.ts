/**
 * Hisse senedi fiyatları (saf fonksiyonlar; ağ erişimi src/store/prices.ts'te).
 *
 * Kapsam: Borsa İstanbul (BIST, TL) ve ABD borsaları (NYSE/Nasdaq, USD) hisseleri ve ETF'leri.
 * Kaynaklar (hepsi anahtarsız, yalnız fiyat okunur; kimlik/çerez gönderilmez):
 *  - BIST: 1) Yahoo Finance grafik uç noktası (THYAO.IS; ~15 dk gecikmeli gün içi fiyat)
 *          2) İş Yatırım günlük hisse verisi (son kapanış fiyatı) — Yahoo erişilemezse.
 *  - ABD:  1) Nasdaq'ın kendi kotasyon uç noktası (api.nasdaq.com; hisse, yoksa ETF sınıfı)
 *          2) Yahoo Finance grafik uç noktası — Nasdaq erişilemezse.
 * Fiyat hissenin kendi para biriminde saklanır (StockQuote). TL değeri, kullanılırken güncel kurla
 * hesaplanır: ABD hissesinin TL alış fiyatı = dolar fiyatı × USD alış kuru (bugün satıp TL'ye çevirsen),
 * satış fiyatı = dolar fiyatı × USD satış kuru (bugün TL ile alsan).
 *
 * Ayrıştırıcılar savunmacıdır: para birimi borsayla uyuşmayan, sıfır/negatif ya da saçma fiyat alınmaz.
 */
import type { Money } from './money';
import { isStockUnit, isUnitPrice, stockCurrency, stockMarket, stockSymbol, type StockUnit } from './assets';
import type { PriceBook, UnitPrice } from './prices';

export type StockCcy = 'TRY' | 'USD';
export type QuoteSource = 'yahoo' | 'nasdaq' | 'isyatirim' | 'manual';

export interface StockQuote {
  /** Hissenin kendi para biriminde, 1 adet fiyatı (kuruş ya da sent). */
  price: number;
  ccy: StockCcy;
  /** Fiyatın alındığı an (ms). */
  at: number;
  source: QuoteSource;
  /** Kaynağın verdiği şirket adı (varsa). */
  name?: string;
}

export type QuoteBook = Partial<Record<StockUnit, StockQuote>>;

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Fiyatı en küçük birime (kuruş/sent) çevirir; saçma değerlerde null. */
const toMinor = (n: unknown): number | null => (typeof n === 'number' && Number.isFinite(n) && n > 0 && n < 1e8 ? Math.round(n * 100) : null);

/** "$1,234.56", "1234.5", "$0.1234" → sayı (ABD biçimi: virgül binlik, nokta ondalık). */
export function parseUsNumber(v: unknown): number | null {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v !== 'string') return null;
  const s = v.replace(/[$,\s]/g, '');
  if (!/^\d+(\.\d+)?$/.test(s)) return null;
  return Number(s);
}

const cleanName = (s: unknown): string | undefined => (typeof s === 'string' && s.trim() ? s.trim().slice(0, 80) : undefined);

// ───────────────────────── Adresler ─────────────────────────

const YAHOO_HOSTS = ['https://query1.finance.yahoo.com', 'https://query2.finance.yahoo.com'];

/** Yahoo sembolü: BIST "THYAO.IS", ABD sınıf eki tireyle "BRK-B". */
export const yahooSymbol = (u: StockUnit): string => (stockMarket(u) === 'BIST' ? `${stockSymbol(u)}.IS` : stockSymbol(u).replace('.', '-'));

export const yahooUrls = (u: StockUnit): string[] =>
  YAHOO_HOSTS.map((h) => `${h}/v8/finance/chart/${encodeURIComponent(yahooSymbol(u))}?range=1d&interval=1d`);

/** Nasdaq: önce hisse, bulunamazsa ETF sınıfıyla. Sınıf eki noktayla ("BRK.B"). */
export const nasdaqUrls = (u: StockUnit): string[] =>
  ['stocks', 'etf'].map((c) => `https://api.nasdaq.com/api/quote/${encodeURIComponent(stockSymbol(u))}/info?assetclass=${c}`);

const ddmmyyyy = (d: Date) => `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;

/** İş Yatırım günlük veri: son 10 günün satırları istenir (hafta sonu/bayramda da son kapanış gelsin). */
export function isyatirimUrl(u: StockUnit, now: number): string {
  const end = new Date(now);
  const start = new Date(now - 10 * 86400000);
  return `https://www.isyatirim.com.tr/_layouts/15/Isyatirim.Website/Common/Data.aspx/HisseTekil?hisse=${encodeURIComponent(stockSymbol(u))}&startdate=${ddmmyyyy(start)}&enddate=${ddmmyyyy(end)}`;
}

// ───────────────────────── Ayrıştırıcılar ─────────────────────────

/**
 * Yahoo `{ chart: { result: [{ meta: { regularMarketPrice, currency, longName, … } }] } }` → kotasyon.
 * Para birimi borsayla uyuşmalı (BIST → TRY, ABD → USD); yanlış eşleşen sembol alınmaz.
 */
export function parseYahooChart(json: unknown, u: StockUnit, now: number): StockQuote | null {
  if (!isObj(json) || !isObj(json.chart) || !Array.isArray(json.chart.result)) return null;
  const meta = (json.chart.result[0] as Record<string, unknown> | undefined)?.meta;
  if (!isObj(meta)) return null;
  const ccy = stockCurrency(u);
  if (meta.currency !== ccy) return null;
  const price = toMinor(meta.regularMarketPrice) ?? toMinor(meta.previousClose) ?? toMinor(meta.chartPreviousClose);
  if (price === null) return null;
  return { price, ccy, at: now, source: 'yahoo', name: cleanName(meta.longName) ?? cleanName(meta.shortName) };
}

/** Nasdaq `{ data: { symbol, companyName, primaryData: { lastSalePrice: "$356.27" } } }` → kotasyon. */
export function parseNasdaq(json: unknown, u: StockUnit, now: number): StockQuote | null {
  if (!isObj(json) || !isObj(json.data)) return null;
  const d = json.data;
  if (typeof d.symbol === 'string' && d.symbol.toUpperCase() !== stockSymbol(u)) return null;
  const pd = isObj(d.primaryData) ? d.primaryData : null;
  if (!pd) return null;
  if (typeof pd.currency === 'string' && pd.currency && pd.currency !== 'USD') return null;
  const price = toMinor(parseUsNumber(pd.lastSalePrice));
  if (price === null) return null;
  return { price, ccy: 'USD', at: now, source: 'nasdaq', name: cleanStockName(cleanName(d.companyName)) };
}

/** İş Yatırım `{ ok: true, value: [{ HGDG_HS_KODU, HGDG_TARIH, HGDG_KAPANIS }, …] }` → son kapanış. */
export function parseIsYatirim(json: unknown, u: StockUnit, now: number): StockQuote | null {
  if (!isObj(json) || !Array.isArray(json.value)) return null;
  const sym = stockSymbol(u);
  const rows = json.value.filter((r): r is Record<string, unknown> => isObj(r) && (r.HGDG_HS_KODU === undefined || r.HGDG_HS_KODU === sym));
  for (let i = rows.length - 1; i >= 0; i--) {
    const price = toMinor(rows[i].HGDG_KAPANIS) ?? toMinor(rows[i].HG_KAPANIS);
    if (price !== null) return { price, ccy: 'TRY', at: now, source: 'isyatirim' };
  }
  return null;
}

/** Nasdaq adlarındaki hisse sınıfı eklerini kısaltır: "Apple Inc. Common Stock" → "Apple Inc.". */
export function cleanStockName(name: string | undefined): string | undefined {
  if (!name) return name;
  const s = name
    .replace(/\s+(American Depositary Shares?|ADS|Sponsored ADR|Ordinary Shares?|Common Stock|Capital Stock|Common Shares?|Shares of Beneficial Interest)\b.*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
  return s || name.trim();
}

// ───────────────────────── TL fiyat kitabı ─────────────────────────

/**
 * Kotasyonları TL fiyat kitabına ekler. BIST: alış = satış = fiyat. ABD: dolar fiyatı × USD alış/satış
 * kuru (`base.USD`); dolar kuru yoksa o hissenin TL fiyatı üretilmez (son işlem fiyatına düşülür).
 * Kaynak: elle girilen kotasyon 'manual', diğerleri 'live'.
 */
export function withStockPrices(base: PriceBook, quotes: QuoteBook): PriceBook {
  const out: PriceBook = { ...base };
  for (const [unit, q] of Object.entries(quotes) as [StockUnit, StockQuote][]) {
    const tl = quoteToTl(q, base);
    if (tl) out[unit] = tl;
  }
  return out;
}

export function quoteToTl(q: StockQuote, base: PriceBook): UnitPrice | null {
  const source = q.source === 'manual' ? 'manual' : 'live';
  if (q.ccy === 'TRY') return { buy: q.price, sell: q.price, at: q.at, source };
  const usd = base.USD;
  if (!usd) return null;
  const buy: Money = Math.round((q.price * usd.buy) / 100);
  const sell: Money = Math.round((q.price * usd.sell) / 100);
  return buy > 0 && sell > 0 ? { buy, sell, at: q.at, source } : null;
}

/** Önbellekten okunan kotasyonları doğrular. */
export function sanitizeQuotes(v: unknown): QuoteBook {
  const out: QuoteBook = {};
  if (!isObj(v)) return out;
  for (const [k, q] of Object.entries(v)) {
    if (!isStockUnit(k) || !isObj(q)) continue;
    const { price, ccy, at, source, name } = q;
    if (!isUnitPrice(price, k) || ccy !== stockCurrency(k) || typeof at !== 'number') continue;
    if (!['yahoo', 'nasdaq', 'isyatirim', 'manual'].includes(source as string)) continue;
    out[k] = { price: price as number, ccy: ccy as StockCcy, at, source: source as QuoteSource, ...(typeof name === 'string' ? { name: name.slice(0, 80) } : {}) };
  }
  return out;
}

// ───────────────────────── Hisse listesi araması ─────────────────────────

/** Gömülü listedeki bir kayıt: kod ve şirket adı. */
export interface StockEntry {
  unit: StockUnit;
  symbol: string;
  name: string;
  etf?: boolean;
}

const fold = (s: string) =>
  s
    .toLocaleLowerCase('tr')
    .replace(/ı/g, 'i')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

/**
 * Kod ya da ad ile arama (büyük/küçük harf ve Türkçe karakter duyarsız). Sıra: kod tam eşleşme, kod
 * başlangıcı, ad başlangıcı, ad içinde geçen; her grupta listedeki sıra (büyükten küçüğe) korunur.
 */
export function searchStocks(list: StockEntry[], query: string, limit = 20): StockEntry[] {
  const q = fold(query.trim());
  if (!q) return [];
  const qSym = q.toUpperCase().replace(/[-/]/g, '.');
  const buckets: StockEntry[][] = [[], [], [], []];
  for (const e of list) {
    const sym = e.symbol;
    const name = fold(e.name);
    if (sym === qSym) buckets[0].push(e);
    else if (sym.startsWith(qSym)) buckets[1].push(e);
    else if (name.startsWith(q) || name.split(/[\s.,&-]+/).some((w) => w.startsWith(q))) buckets[2].push(e);
    else if (q.length >= 3 && name.includes(q)) buckets[3].push(e);
  }
  return buckets.flat().slice(0, limit);
}
