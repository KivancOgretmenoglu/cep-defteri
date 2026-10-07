/**
 * Otomatik yedek.
 * Android: Belgeler/CepDefteri/cep-defteri-otomatik-YYYY-AA-GG.json (son 7 gün). Bu klasör uygulama silinse de kalır.
 * Tarayıcı: son 5 günün kopyası localStorage'da ayrı bir anahtarda (tarayıcı verisi silinirse gider).
 * Her gün bir dosya; gün içinde veri değişirse o günün dosyası güncellenir. Örnek veri ve boş veri yedeklenmez.
 */
import type { Data } from '../domain/types';
import { serializeBackup } from '../domain/backup';
import { todayISO, type ISODate } from '../domain/dates';
import { isNative } from '../platform';
import { t } from '../i18n';
import { getDevice, setDevice } from '../store/device';
import { ANDROID_DIR, autoBackupName, filesToDelete, fitSnapshots, hasContent, nextSnapshots, parseAutoBackupName, sortAutoBackups, type WebSnapshot } from './backupPlan';

const WEB_KEY = 'cep-defteri:auto-backups';

function setAB(p: Partial<ReturnType<typeof getDevice>['autoBackup']>) {
  setDevice((d) => ({ ...d, autoBackup: { ...d.autoBackup, ...p } }));
}

// ───────── Tarayıcı ─────────

export function loadWebSnapshots(): WebSnapshot[] {
  try {
    const raw = localStorage.getItem(WEB_KEY);
    const xs = raw ? JSON.parse(raw) : [];
    return Array.isArray(xs) ? xs.filter((x) => x && typeof x.day === 'string' && typeof x.json === 'string' && typeof x.at === 'number') : [];
  } catch {
    return [];
  }
}

function otherStorageChars(): number {
  let n = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)!;
      if (k === WEB_KEY) continue;
      n += k.length + (localStorage.getItem(k)?.length ?? 0);
    }
  } catch {
    /* yok say */
  }
  return n;
}

function webBackup(data: Data, today: ISODate, now: number): boolean {
  const snap: WebSnapshot = { day: today, at: now, json: serializeBackup(data, new Date(now)) };
  const fitted = fitSnapshots(nextSnapshots(loadWebSnapshots(), snap), otherStorageChars());
  if (!fitted || !fitted.some((s) => s.at === now)) {
    setAB({ lastError: t('ab.nearlyFull') });
    return false;
  }
  try {
    localStorage.setItem(WEB_KEY, JSON.stringify(fitted));
  } catch {
    setAB({ lastError: t('ab.full') });
    return false;
  }
  setAB({ lastAt: now, lastPath: null, lastError: null });
  return true;
}

// ───────── Android ─────────

const fsMod = () => import('@capacitor/filesystem');

export async function storagePermissionGranted(): Promise<boolean> {
  if (!isNative()) return true;
  try {
    const { Filesystem } = await fsMod();
    return (await Filesystem.checkPermissions()).publicStorage === 'granted';
  } catch {
    return false;
  }
}

/** Yalnız eski Android sürümlerinde (≤ 10) dosya izni penceresi çıkar. */
export async function requestStoragePermission(): Promise<boolean> {
  if (!isNative()) return true;
  try {
    const { Filesystem } = await fsMod();
    return (await Filesystem.requestPermissions()).publicStorage === 'granted';
  } catch {
    return false;
  }
}

async function nativeBackup(data: Data, today: ISODate, now: number): Promise<boolean> {
  const { Filesystem, Directory, Encoding } = await fsMod();
  if (!(await storagePermissionGranted())) {
    setAB({ lastError: t('ab.needPerm') });
    return false;
  }
  const json = serializeBackup(data, new Date(now));
  // Bugün zaten bir dosya yazdıysak onu güncelle; yoksa yeni ad. Aynı adlı ama bize ait olmayan bir dosya
  // (ör. uygulama yeniden kurulduysa) yazılamazsa ek numaralı ad dene.
  const prevName = getDevice().autoBackup.lastPath?.split('/').pop() ?? '';
  const prev = parseAutoBackupName(prevName);
  const candidates = prev && prev.day === today ? [prevName] : [];
  candidates.push(autoBackupName(today), autoBackupName(today, 2), autoBackupName(today, 3), autoBackupName(today, (now % 9000) + 10));
  let written: string | null = null;
  let lastErr = '';
  for (const name of [...new Set(candidates)]) {
    try {
      await Filesystem.writeFile({ path: `${ANDROID_DIR}/${name}`, data: json, directory: Directory.Documents, encoding: Encoding.UTF8, recursive: true });
      written = name;
      break;
    } catch (e) {
      lastErr = e instanceof Error ? e.message : String(e);
    }
  }
  if (!written) {
    setAB({ lastError: t('ab.writeFailed', { detail: lastErr ? ` (${lastErr})` : '' }) });
    return false;
  }
  setAB({ lastAt: now, lastPath: `Belgeler/${ANDROID_DIR}/${written}`, lastError: null });
  // Eski dosyaları temizle (görebildiklerimizi; silinemeyen olursa sorun değil).
  try {
    const r = await Filesystem.readdir({ path: ANDROID_DIR, directory: Directory.Documents });
    for (const name of filesToDelete(r.files.map((f) => f.name))) {
      await Filesystem.deleteFile({ path: `${ANDROID_DIR}/${name}`, directory: Directory.Documents }).catch(() => undefined);
    }
  } catch {
    /* listeleme olmadı */
  }
  return true;
}

// ───────── Ortak ─────────

let running: Promise<boolean> | null = null;

/** Koşullar uygunsa yedek alır. `force`: kapalı olsa bile (Şimdi yedekle). */
export function runAutoBackup(data: Data, mode: 'real' | 'demo', opts: { force?: boolean } = {}): Promise<boolean> {
  if (mode !== 'real' || !hasContent(data)) return Promise.resolve(false);
  if (!opts.force && !getDevice().autoBackup.enabled) return Promise.resolve(false);
  const go = async () => {
    const now = Date.now();
    const today = todayISO(new Date(now));
    try {
      return isNative() ? await nativeBackup(data, today, now) : webBackup(data, today, now);
    } catch (e) {
      setAB({ lastError: t('ab.failed', { detail: e instanceof Error ? e.message : String(e) }) });
      return false;
    }
  };
  const p = (running ?? Promise.resolve(false)).then(go, go);
  running = p;
  return p;
}

export interface AutoBackupEntry {
  name: string;
  day: ISODate;
  at: number | null;
  read: () => Promise<string>;
}

/** Geri yükleme listesi: tarayıcıda anlık kopyalar, Android'de klasörde görebildiğimiz dosyalar. */
export async function listAutoBackups(): Promise<AutoBackupEntry[]> {
  if (!isNative()) {
    return loadWebSnapshots().map((s) => ({ name: `Otomatik yedek ${s.day}`, day: s.day, at: s.at, read: async () => s.json }));
  }
  try {
    const { Filesystem, Directory, Encoding } = await fsMod();
    const r = await Filesystem.readdir({ path: ANDROID_DIR, directory: Directory.Documents });
    const mtime = new Map(r.files.map((f) => [f.name, f.mtime ?? null]));
    return sortAutoBackups(r.files.map((f) => f.name)).map((name) => ({
      name,
      day: parseAutoBackupName(name)!.day,
      at: mtime.get(name) ?? null,
      read: async () => {
        const f = await Filesystem.readFile({ path: `${ANDROID_DIR}/${name}`, directory: Directory.Documents, encoding: Encoding.UTF8 });
        return typeof f.data === 'string' ? f.data : await f.data.text();
      },
    }));
  } catch {
    return [];
  }
}
