/**
 * Yalnız bu cihaza ait tercihler (yedeğe girmez): uygulama kilidi, bildirimler, otomatik yedek.
 * Veriden ayrı bir anahtarda tutulur; yedek başka cihaza taşındığında PIN taşınmaz.
 */
import { useSyncExternalStore } from 'react';

export interface LockPrefs {
  /** PBKDF2-SHA256 ile türetilmiş PIN özeti (hex). null = kilit kapalı. */
  pinHash: string | null;
  salt: string | null;
  /** Parmak izi / yüz ile açma (yalnız Android uygulamasında). */
  biometric: boolean;
  /** Uygulama arka plandayken bu kadar saniye geçince yeniden kilitlenir. */
  relockAfterSec: number;
}

export interface NotificationPrefs {
  enabled: boolean;
  /** Yaklaşan ödemeden bir gün önce hatırlat. */
  payments: boolean;
  /** Beklenen gelirin günü "geldi mi?" diye sor. */
  income: boolean;
  /** Akşam "bugünkü harcamalarını girdin mi?" (o gün kayıt yoksa). */
  dailyReminder: boolean;
  /** Akşam hatırlatmasının saati (0–23). */
  reminderHour: number;
}

export interface AutoBackupPrefs {
  enabled: boolean;
  /** Son otomatik yedek zamanı (ms). */
  lastAt: number | null;
  /** Son otomatik yedeğin yeri (kullanıcıya gösterim için). */
  lastPath: string | null;
}

export interface DevicePrefs {
  lock: LockPrefs;
  notifications: NotificationPrefs;
  autoBackup: AutoBackupPrefs;
}

const KEY = 'cep-defteri:device';

export const DEFAULT_DEVICE: DevicePrefs = {
  lock: { pinHash: null, salt: null, biometric: false, relockAfterSec: 60 },
  notifications: { enabled: false, payments: true, income: true, dailyReminder: true, reminderHour: 21 },
  autoBackup: { enabled: true, lastAt: null, lastPath: null },
};

function read(): DevicePrefs {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_DEVICE;
    const p = JSON.parse(raw);
    return {
      lock: { ...DEFAULT_DEVICE.lock, ...p.lock },
      notifications: { ...DEFAULT_DEVICE.notifications, ...p.notifications },
      autoBackup: { ...DEFAULT_DEVICE.autoBackup, ...p.autoBackup },
    };
  } catch {
    return DEFAULT_DEVICE;
  }
}

let prefs = read();
const ls = new Set<() => void>();

export const getDevice = () => prefs;

export function setDevice(fn: (p: DevicePrefs) => DevicePrefs) {
  prefs = fn(prefs);
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {
    /* depolama yoksa yalnız bellekte kalır */
  }
  ls.forEach((l) => l());
}

export function useDevice<T>(sel: (p: DevicePrefs) => T): T {
  return useSyncExternalStore(
    (l) => {
      ls.add(l);
      return () => ls.delete(l);
    },
    () => sel(prefs),
  );
}
