/**
 * Altın/döviz fiyatlarını internetten alır ve bu cihazda önbelleğe yazar (yedeğe girmez).
 *
 * Gizlilik: yalnız kimlik bilgisi, çerez ya da kullanıcı verisi içermeyen GET istekleri atılır.
 * Ağ: Android uygulamasında CapacitorHttp (yerel HTTP, WebView CORS'una takılmaz), tarayıcıda fetch.
 * Yenileme: uygulama açılışında ve Yatırım ekranında, son fiyat 15 dakikadan eskiyse. Otomatik fiyat
 * kapalıysa hiç istek atılmaz; yalnız elle girilen fiyatlar kullanılır.
 */
import { useEffect, useSyncExternalStore } from 'react';
import { useStore } from './store';
import { Capacitor, CapacitorHttp } from '@capacitor/core';
import type { AssetUnit } from '../domain/assets';
import type { Money } from '../domain/money';
import { FALLBACK_URLS, PRIMARY_URL, mergeBooks, parseCurrencyApi, parseTruncgil, sanitizeBook, updateBook, type PriceBook } from '../domain/prices';

export const PRICES_KEY = 'cep-defteri:prices';
export const STALE_MS = 15 * 60 * 1000;
const TIMEOUT_MS = 8000;

export interface PriceState {
  book: PriceBook;
  /** Son başarılı ağdan alma (ms). */
  fetchedAt: number | null;
  /** Otomatik fiyat alma açık mı (cihaz tercihi). */
  auto: boolean;
  /** Bellekte: şu an alınıyor mu, son deneme başarısız mı. */
  loading: boolean;
  failed: boolean;
}

function load(): PriceState {
  const base: PriceState = { book: {}, fetchedAt: null, auto: true, loading: false, failed: false };
  try {
    const raw = localStorage.getItem(PRICES_KEY);
    if (!raw) return base;
    const o = JSON.parse(raw) as Record<string, unknown>;
    return {
      ...base,
      book: sanitizeBook(o.book),
      fetchedAt: typeof o.fetchedAt === 'number' ? o.fetchedAt : null,
      auto: typeof o.auto === 'boolean' ? o.auto : true,
    };
  } catch {
    return base;
  }
}

let state: PriceState = load();
const listeners = new Set<() => void>();

function set(patch: Partial<PriceState>) {
  state = { ...state, ...patch };
  try {
    localStorage.setItem(PRICES_KEY, JSON.stringify({ book: state.book, fetchedAt: state.fetchedAt, auto: state.auto }));
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
  inflight = fetchBook(now)
    .then((fresh) => {
      if (Object.keys(fresh).length) set({ book: updateBook(state.book, fresh), fetchedAt: now, failed: false, loading: false });
      else set({ failed: true, loading: false });
    })
    .catch(() => set({ failed: true, loading: false }))
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/** Elle fiyat: alış = satış = girilen; o birimin önbellekteki fiyatının yerine geçer. */
export function setManualPrice(unit: AssetUnit, buy: Money, now = Date.now()) {
  set({ book: { ...state.book, [unit]: { buy, sell: buy, at: now, source: 'manual' } } });
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

/** Uygulama açılışında: altın/döviz hesabı varsa ve fiyat 15 dk'dan eskiyse yenile. */
export function usePriceRefreshOnOpen() {
  const hasAsset = useStore((s) => s.data.accounts.some((a) => a.kind === 'investment' && !!a.asset));
  useEffect(() => {
    if (hasAsset) void refreshPrices();
  }, [hasAsset]);
}
