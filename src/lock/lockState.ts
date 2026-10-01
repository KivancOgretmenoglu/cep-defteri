/**
 * Uygulama kilidinin durumu: açılışta ve arka plandan `relockAfterSec` sonra dönüşte kilitlenir.
 * Android'de Capacitor App `appStateChange`, tarayıcıda `visibilitychange` kullanılır.
 */
import { useSyncExternalStore } from 'react';
import { Capacitor } from '@capacitor/core';
import { getDevice, setDevice } from '../store/device';
import { lockoutMs, verifyPin } from './pin';

let locked = !!getDevice().lock.pinHash;
let hiddenAt: number | null = null;
/** Biyometrik pencere, dosya seçici gibi kısa ayrılışlarda kilitlenmesin. */
let suppressUntil = 0;
const ls = new Set<() => void>();
const emit = () => ls.forEach((l) => l());

export const isLocked = () => locked;
export function useLocked(): boolean {
  return useSyncExternalStore(
    (l) => {
      ls.add(l);
      return () => ls.delete(l);
    },
    () => locked,
  );
}

export function lockNow() {
  if (!getDevice().lock.pinHash) return;
  locked = true;
  emit();
}
export function unlock() {
  locked = false;
  emit();
}
/** Önümüzdeki `ms` boyunca arka plana geçiş kilidi tetiklemez. */
export function suppressRelock(ms = 4000) {
  suppressUntil = Date.now() + ms;
}

function onHidden() {
  if (Date.now() < suppressUntil) return;
  hiddenAt = Date.now();
}
function onVisible() {
  const since = hiddenAt;
  hiddenAt = null;
  const { pinHash, relockAfterSec } = getDevice().lock;
  if (!pinHash || since === null || locked) return;
  if (Date.now() - since >= relockAfterSec * 1000) lockNow();
}

let started = false;
/** Arka plan dinleyicilerini bir kez kurar. */
export function startLockWatch() {
  if (started || typeof window === 'undefined') return;
  started = true;
  if (Capacitor.isNativePlatform()) {
    import('@capacitor/app')
      .then(({ App }) => App.addListener('appStateChange', ({ isActive }) => (isActive ? onVisible() : onHidden())))
      .catch(() => undefined);
  } else {
    document.addEventListener('visibilitychange', () => (document.visibilityState === 'hidden' ? onHidden() : onVisible()));
  }
}

export type PinResult = { ok: true } | { ok: false; waitMs: number; error: string };

/** Kalan bekleme süresi (ms). */
export function remainingBlock(now = Date.now()): number {
  const u = getDevice().lock.blockedUntil;
  return u && u > now ? u - now : 0;
}

/** PIN denemesi: hız sınırı ve sayaç burada tutulur (uygulama yeniden açılınca da geçerli). */
export async function tryPin(pin: string): Promise<PinResult> {
  const wait = remainingBlock();
  if (wait > 0) return { ok: false, waitMs: wait, error: 'Biraz bekle.' };
  const { pinHash, salt } = getDevice().lock;
  if (await verifyPin(pin, pinHash, salt)) {
    setDevice((p) => ({ ...p, lock: { ...p.lock, failed: 0, blockedUntil: null } }));
    return { ok: true };
  }
  const failed = getDevice().lock.failed + 1;
  const ms = lockoutMs(failed);
  setDevice((p) => ({ ...p, lock: { ...p.lock, failed, blockedUntil: ms ? Date.now() + ms : null } }));
  return { ok: false, waitMs: ms, error: 'PIN yanlış.' };
}

/** PIN değişikliği ya da kapatma öncesi doğrulama (sayaç ve bekleme aynı kurala tabidir). */
export const checkCurrentPin = tryPin;

/**
 * "PIN'i unuttum" son çaresi: bu uygulamanın cihazdaki tüm verisini (kayıtlar, örnek veri, tarayıcıdaki
 * otomatik yedekler, cihaz tercihleri) siler ve yeniden yükler. Android'de Belgeler klasöründeki yedek dosyalarına dokunmaz.
 */
export function wipeAllAppData() {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('cep-defteri')) keys.push(k);
    }
    keys.forEach((k) => localStorage.removeItem(k));
  } catch {
    /* depolama erişilemiyor */
  }
  location.reload();
}
