/**
 * Altın/döviz ve hisse fiyatlarını internetten alır ve bu cihazda önbelleğe yazar (yedeğe girmez).
 *
 * Hisseler (src/domain/stocks.ts): yalnız bir hesapta elde olan hisselerin (ve formda yeni seçilenin)
 * fiyatı istenir; istekte yalnız hisse kodu bulunur. BIST: Yahoo → İş Yatırım; ABD: Nasdaq → Yahoo.
 * Kotasyon kendi para biriminde saklanır; `book` (TL fiyat kitabı) her değişiklikte yeniden türetilir.
 *
 * Gizlilik: yalnız kimlik bilgisi, çerez ya da kullanıcı verisi içermeyen GET istekleri atılır.
 * Ağ: Android uygulamasında CapacitorHttp (yerel HTTP, WebView CORS'una takılmaz), tarayıcıda fetch.
 * Yenileme: uygulama açılışında ve Yatırım ekranında, son fiyat 15 dakikadan eskiyse. Otomatik fiyat
 * kapalıysa hiç istek atılmaz; yalnız elle girilen fiyatlar kullanılır.
 */
import { useEffect, useSyncExternalStore } from 'react';
import { getState, useStore } from './store';
import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { isStockUnit, stockCurrency, stockMarket, type FixedUnit, type StockUnit } from '../domain/assets';
import type { Money } from '../domain/money';
import type { Data } from '../domain/types';
import { FALLBACK_URLS, PRIMARY_URL, mergeBooks, parseCurrencyApi, parseTruncgil, sanitizeBook, updateBook, type PriceBook } from '../domain/prices';
import {
  isyatirimUrl, nasdaqUrls, parseIsYatirim, parseNasdaq, parseYahooChart, sanitizeQuotes, withStockPrices, yahooUrls,
  type QuoteBook, type StockQuote,
} from '../domain/stocks';

export const PRICES_KEY = 'cep-defteri:prices';
export const STALE_MS = 15 * 60 * 1000;
const TIMEOUT_MS = 8000;

export interface PriceState {
  /** TL fiyat kitabı: altın/döviz + hisselerden türetilen TL fiyatlar (değer hesapları bunu okur). */
  book: PriceBook;
  /** Altın/döviz fiyatları (kaynaktan geldiği gibi). */
  base: PriceBook;
  /** Hisse kotasyonları (kendi para biriminde). */
  quotes: QuoteBook;
  /** Son başarılı ağdan alma (ms). */
  fetchedAt: number | null;
  /** Otomatik fiyat alma açık mı (cihaz tercihi). */
  auto: boolean;
  /** Bellekte: şu an alınıyor mu, son deneme başarısız mı. */
  loading: boolean;
  failed: boolean;
}

function load(): PriceState {
  const empty: PriceState = { book: {}, base: {}, quotes: {}, fetchedAt: null, auto: true, loading: false, failed: false };
  try {
    const raw = localStorage.getItem(PRICES_KEY);
    if (!raw) return empty;
    const o = JSON.parse(raw) as Record<string, unknown>;
    // Önceki sürüm altın/döviz fiyatlarını "book" anahtarında saklıyordu.
    const base = sanitizeBook(o.base ?? o.book);
    const quotes = sanitizeQuotes(o.quotes);
    return {
      ...empty,
      base,
      quotes,
      book: withStockPrices(base, quotes),
      fetchedAt: typeof o.fetchedAt === 'number' ? o.fetchedAt : null,
      auto: typeof o.auto === 'boolean' ? o.auto : true,
    };
  } catch {
    return empty;
  }
}

let state: PriceState = load();
const listeners = new Set<() => void>();

type Patch = Partial<Omit<PriceState, 'book'>>;

function set(patch: Patch) {
  const next = { ...state, ...patch };
  if (patch.base || patch.quotes) next.book = withStockPrices(next.base, next.quotes);
  state = next;
  try {
    // "book" (yalnız altın/döviz) önceki sürümün okuduğu anahtardır: sürüm geri alınsa da fiyatlar kaybolmaz.
    localStorage.setItem(PRICES_KEY, JSON.stringify({ base: state.base, book: state.base, quotes: state.quotes, fetchedAt: state.fetchedAt, auto: state.auto }));
  } catch {
    // Depolama yoksa fiyatlar yalnız bu oturumda kalır.
  }
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const getPrices = () => state;
export function usePrices(): PriceState {
  return useSyncExternalStore(subscribe, () => state);
}

/** Yalnız fiyat JSON'u ister: çerez/kimlik/yönlendiren bilgisi gönderilmez. */
async function getJson(url: string): Promise<unknown> {
  if (Capacitor.isNativePlatform()) {
    const r = await CapacitorHttp.get({ url, headers: { Accept: 'application/json' }, connectTimeout: TIMEOUT_MS, readTimeout: TIMEOUT_MS });
    if (r.status < 200 || r.status >= 300) throw new Error('HTTP ' + r.status);
    return typeof r.data === 'string' ? JSON.parse(r.data) : r.data;
  }
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(url, { method: 'GET', credentials: 'omit', referrerPolicy: 'no-referrer', cache: 'no-store', signal: ctl.signal });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return await r.json();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchBook(now: number): Promise<PriceBook> {
  let primary: PriceBook = {};
  try {
    primary = parseTruncgil(await getJson(PRIMARY_URL), now);
  } catch {
    // Birincil kaynak erişilemez: yedeğe geç.
  }
  // Birincil tüm birimleri verdiyse yedeğe hiç gidilmez.
  if (Object.keys(primary).length >= 9) return primary;
  for (const url of FALLBACK_URLS) {
    try {
      const fb = parseCurrencyApi(await getJson(url), now);
      if (Object.keys(fb).length) return mergeBooks(primary, fb);
    } catch {
      // sıradaki ayna
    }
  }
  return primary;
}

// ───────────────────────── Hisseler ─────────────────────────

/** Bir hissenin fiyatını kaynak sırasıyla dener. `skipYahoo`: bu turda Yahoo zaten reddettiyse atla. */
async function fetchQuote(u: StockUnit, now: number, ctx: { skipYahoo: boolean }): Promise<StockQuote | null> {
  const yahoo = async () => {
    if (ctx.skipYahoo) return null;
    for (const url of yahooUrls(u)) {
      try {
        const q = parseYahooChart(await getJson(url), u, now);
        if (q) return q;
      } catch (e) {
        // 429 (çok istek) ya da 403: bu turda Yahoo'yu bir daha deneme, yedek kaynağa geç.
        if (/HTTP (429|403)/.test(String(e))) {
          ctx.skipYahoo = true;
          return null;
        }
      }
    }
    return null;
  };
  const nasdaq = async () => {
    for (const url of nasdaqUrls(u)) {
      try {
        const q = parseNasdaq(await getJson(url), u, now);
        if (q) return q;
      } catch {
        // sıradaki sınıf / kaynak
      }
    }
    return null;
  };
  const isy = async () => {
    try {
      return parseIsYatirim(await getJson(isyatirimUrl(u, now)), u, now);
    } catch {
      return null;
    }
  };
  const chain = stockMarket(u) === 'BIST' ? [yahoo, isy] : [nasdaq, yahoo];
  for (const src of chain) {
    const q = await src();
    if (q) return q;
  }
  return null;
}

/** Elde olan hisseler: arşivlenmemiş varlık hesaplarındaki açılış kalemleri ve işlemlerdeki birimler. */
export function heldStocks(data: Data): StockUnit[] {
  const out = new Set<StockUnit>();
  const ids = new Set(data.accounts.filter((a) => a.kind === 'investment' && a.asset && !a.archived).map((a) => a.id));
  for (const a of data.accounts) if (ids.has(a.id)) for (const l of a.asset!.opening) if (isStockUnit(l.unit)) out.add(l.unit);
  for (const t of data.txs) if (t.unit && isStockUnit(t.unit) && (ids.has(t.accountId) || ids.has(t.toAccountId ?? ''))) out.add(t.unit);
  return [...out].sort();
}

/** Birkaç hisseyi aynı anda (en fazla 3 istek) çeker. */
async function fetchQuotes(units: StockUnit[], now: number): Promise<QuoteBook> {
  const out: QuoteBook = {};
  const ctx = { skipYahoo: false };
  const queue = [...units];
  const worker = async () => {
    for (let u = queue.shift(); u; u = queue.shift()) {
      const q = await fetchQuote(u, now, ctx);
      if (q) out[u] = q;
    }
  };
  await Promise.all([worker(), worker(), worker()]);
  return out;
}

/** Yeni kotasyonları ekler; elle girilen fiyat, kendisinden yeni bir canlı fiyat gelene kadar kalır. */
function mergeQuotes(old: QuoteBook, fresh: QuoteBook): QuoteBook {
  return { ...old, ...fresh };
}

const pendingOne = new Map<StockUnit, Promise<StockQuote | null>>();

/**
 * Formda seçilen tek bir hissenin fiyatını hemen ister (elde olmasa da). Yoksa/alınamazsa null.
 * Otomatik fiyat kapalıysa ağa çıkmaz (force hariç). Kod doğrulamada da kullanılır.
 */
export function fetchStockQuote(u: StockUnit, opts: { force?: boolean; now?: number } = {}): Promise<StockQuote | null> {
  const now = opts.now ?? Date.now();
  const have = state.quotes[u];
  if (!opts.force && (!state.auto || (have && have.source !== 'manual' && now - have.at < STALE_MS))) return Promise.resolve(have ?? null);
  const p = pendingOne.get(u);
  if (p) return p;
  const run = fetchQuote(u, now, { skipYahoo: false })
    .then((q) => {
      if (q) set({ quotes: mergeQuotes(state.quotes, { [u]: q }) });
      return q ?? state.quotes[u] ?? null;
    })
    .catch(() => state.quotes[u] ?? null)
    .finally(() => pendingOne.delete(u));
  pendingOne.set(u, run);
  return run;
}

/** Elle hisse fiyatı (hissenin kendi para biriminde, kuruş/sent). */
export function setManualQuote(u: StockUnit, price: number, now = Date.now()) {
  set({ quotes: { ...state.quotes, [u]: { price, ccy: stockCurrency(u), at: now, source: 'manual', name: state.quotes[u]?.name } } });
}

let inflight: Promise<void> | null = null;
let lastAttempt: number | null = null;
const RETRY_MS = 60 * 1000;

/**
 * Fiyatları yeniler. `force` değilse yalnız otomatik açıkken ve son fiyat 15 dk'dan eskiyse ağa çıkar.
 * `force` (Yenile düğmesi) otomatik kapalıyken de bir kez çeker.
 */
export function refreshPrices(opts: { force?: boolean; now?: number } = {}): Promise<void> {
  const now = opts.now ?? Date.now();
  if (!opts.force && (!state.auto || (state.fetchedAt && now - state.fetchedAt < STALE_MS))) return Promise.resolve();
  // Çevrimdışıyken her ekran açılışında yeniden denememek için: başarısız denemeden sonra 1 dk bekle.
  if (!opts.force && lastAttempt && now - lastAttempt < RETRY_MS) return Promise.resolve();
  if (inflight) return inflight;
  lastAttempt = now;
  set({ loading: true });
  const stocks = heldStocks(getState().data);
  inflight = Promise.all([fetchBook(now), stocks.length ? fetchQuotes(stocks, now) : Promise.resolve({} as QuoteBook)])
    .then(([fresh, quotes]) => {
      const gotBase = Object.keys(fresh).length > 0;
      const gotStocks = Object.keys(quotes).length > 0;
      // Hisse varken hiçbiri gelmediyse de "alınamadı" denir (son bilinen fiyat gösterilir).
      const failed = !gotBase || (stocks.length > 0 && !gotStocks);
      set({
        ...(gotBase ? { base: updateBook(state.base, fresh) } : {}),
        ...(gotStocks ? { quotes: mergeQuotes(state.quotes, quotes) } : {}),
        ...(gotBase || gotStocks ? { fetchedAt: now } : {}),
        failed,
        loading: false,
      });
    })
    .catch(() => set({ failed: true, loading: false }))
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/** Elle fiyat (altın/döviz, TL): alış = satış = girilen; o birimin önbellekteki fiyatının yerine geçer. */
export function setManualPrice(unit: FixedUnit, buy: Money, now = Date.now()) {
  set({ base: { ...state.base, [unit]: { buy, sell: buy, at: now, source: 'manual' } } });
}

export function setAutoPrices(auto: boolean) {
  set({ auto });
  if (auto) void refreshPrices();
}

/** Ne kadar önce: "az önce", "5 dk önce", "3 saat önce", "2 gün önce" için parçalar. */
export function agoParts(at: number, now = Date.now()): { key: 'now' | 'min' | 'hour' | 'day'; n: number } {
  const m = Math.max(0, Math.floor((now - at) / 60000));
  if (m < 1) return { key: 'now', n: 0 };
  if (m < 60) return { key: 'min', n: m };
  if (m < 48 * 60) return { key: 'hour', n: Math.floor(m / 60) };
  return { key: 'day', n: Math.floor(m / 1440) };
}

/** Uygulama açılışında: altın/döviz/hisse hesabı varsa ve fiyat 15 dk'dan eskiyse yenile. */
export function usePriceRefreshOnOpen() {
  const hasAsset = useStore((s) => s.data.accounts.some((a) => a.kind === 'investment' && !!a.asset));
  useEffect(() => {
    if (hasAsset) void refreshPrices();
  }, [hasAsset]);
}
