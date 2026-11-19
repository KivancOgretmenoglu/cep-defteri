/**
 * Uygulama simgesini seçili maskota çevirir (yalnız Android uygulaması).
 * Yerel eklenti: android/.../AppIconPlugin.java; AndroidManifest.xml'deki ".Icon_<anahtar>" activity-alias'larından
 * yalnız birini etkin bırakır. Tarayıcıda (PWA) simge değiştirilemez: fonksiyonlar hiçbir şey yapmaz.
 * Not: bazı başlatıcılar yeni simgeyi birkaç saniye sonra gösterir, ana ekrandaki kısayolu kaldırabilir (ANDROID.md).
 */
import { Capacitor, registerPlugin } from '@capacitor/core';
import { DEFAULT_MASCOT, MASCOT_KEYS, type MascotKey, type PublicMascotKey } from '../mascot/characters';

interface AppIconPlugin {
  setIcon(options: { key: PublicMascotKey }): Promise<{ key: PublicMascotKey; changed: boolean }>;
  getIcon(): Promise<{ key: string }>;
}

const AppIcon = registerPlugin<AppIconPlugin>('AppIcon');

/** Simge değiştirme bu ortamda destekleniyor mu (yalnız yerel Android). */
export function appIconSupported(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
}

/**
 * Simgeyi değiştirir. true: istenen simge artık etkin (zaten öyleyse de true). Tarayıcıda / hata olursa false.
 * Gizli maskotların simgesi yok (ana ekranda kimse görmesin): varsayılan (kedi) simgeye döner.
 */
export async function setAppIcon(key: MascotKey): Promise<boolean> {
  if (!appIconSupported()) return false;
  const target: PublicMascotKey = (MASCOT_KEYS as string[]).includes(key) ? (key as PublicMascotKey) : DEFAULT_MASCOT;
  try {
    const r = await AppIcon.setIcon({ key: target });
    return r.key === target;
  } catch {
    // Eski APK'da eklenti yoksa ya da sistem reddederse.
    return false;
  }
}

/** Etkin simgenin maskot anahtarı; tarayıcıda / bilinmiyorsa null. */
export async function getAppIcon(): Promise<MascotKey | null> {
  if (!appIconSupported()) return null;
  try {
    const { key } = await AppIcon.getIcon();
    return (MASCOT_KEYS as string[]).includes(key) ? (key as MascotKey) : null;
  } catch {
    return null;
  }
}
