/**
 * Ana ekrana araç sabitleme ve hızlı ayarlar kutucuğu ekleme istekleri (yalnız Android uygulaması).
 * Yerel eklenti: android/.../ShortcutsPlugin.java (araç: Android 8+ ve başlatıcı desteği, kutucuk: Android 13+).
 * Eşzamanlı sorgular (pinWidgetSupported / addTileSupported), açılışta bir kez çağrılan initShortcuts()'un
 * önbelleğe aldığı bayrakları döndürür; init bitmeden ve tarayıcıda false. İstek fonksiyonları asla hata fırlatmaz.
 */
import { Capacitor, registerPlugin } from '@capacitor/core';

export type PinWidgetResult = 'ok' | 'unsupported' | 'error';
export type AddTileResult = 'ok' | 'already' | 'dismissed' | 'unsupported' | 'error';

interface ShortcutsPlugin {
  isPinWidgetSupported(): Promise<{ supported: boolean }>;
  isAddTileSupported(): Promise<{ supported: boolean }>;
  /** 'ok' yalnız sistem isteğinin gösterildiğini söyler; kullanıcının aracı bırakıp bırakmadığı bilinmez. */
  requestPinWidget(): Promise<{ result: PinWidgetResult }>;
  requestAddTile(): Promise<{ result: AddTileResult }>;
}

const Shortcuts = registerPlugin<ShortcutsPlugin>('Shortcuts');

const isAndroid = () => Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';

let pinOk = false;
let tileOk = false;
let initPromise: Promise<void> | null = null;

/** Ana ekrana araç sabitleme isteği bu cihazda açılabilir mi (initShortcuts sonrası kesinleşir). */
export function pinWidgetSupported(): boolean {
  return pinOk;
}

/** Hızlı ayarlara kutucuk ekleme isteği bu cihazda açılabilir mi (Android 13+; initShortcuts sonrası kesinleşir). */
export function addTileSupported(): boolean {
  return tileOk;
}

/** Destek bayraklarını yerel taraftan bir kez okur. Tarayıcıda / eski APK'da (eklenti yok) bayraklar false kalır. */
export function initShortcuts(): Promise<void> {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    if (!isAndroid()) return;
    const [pin, tile] = await Promise.all([
      Shortcuts.isPinWidgetSupported().catch(() => ({ supported: false })),
      Shortcuts.isAddTileSupported().catch(() => ({ supported: false })),
    ]);
    pinOk = pin?.supported === true;
    tileOk = tile?.supported === true;
  })();
  return initPromise;
}

const PIN_RESULTS: readonly PinWidgetResult[] = ['ok', 'unsupported', 'error'];
const TILE_RESULTS: readonly AddTileResult[] = ['ok', 'already', 'dismissed', 'unsupported', 'error'];

export async function requestPinWidget(): Promise<PinWidgetResult> {
  if (!isAndroid()) return 'unsupported';
  try {
    const r = (await Shortcuts.requestPinWidget())?.result;
    return PIN_RESULTS.includes(r) ? r : 'error';
  } catch {
    return 'error';
  }
}

export async function requestAddTile(): Promise<AddTileResult> {
  if (!isAndroid()) return 'unsupported';
  try {
    const r = (await Shortcuts.requestAddTile())?.result;
    return TILE_RESULTS.includes(r) ? r : 'error';
  } catch {
    return 'error';
  }
}
