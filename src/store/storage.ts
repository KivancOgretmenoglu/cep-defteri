/**
 * Kalıcı saklama: tarayıcının localStorage alanı (bu cihaz, bu tarayıcı).
 * Cihazlar arası eşitleme yoktur; taşıma için yedek dosyası kullanılır.
 * Okunamayan veri asla sessizce silinmez: ayrı bir anahtara kopyalanır.
 */
import type { Data } from '../domain/types';
import { emptyData } from '../domain/defaults';
import { parseBackup, serializeBackup } from '../domain/backup';

const PREFIX = 'cep-defteri:v1:';
export type Mode = 'real' | 'demo';
const key = (m: Mode) => PREFIX + m;
const MODE_KEY = PREFIX + 'mode';
const PRE_RESTORE_KEY = PREFIX + 'pre-restore';

function get(k: string): string | null {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
}
function set(k: string, v: string): boolean {
  try {
    localStorage.setItem(k, v);
    return true;
  } catch {
    return false;
  }
}
function del(k: string) {
  try {
    localStorage.removeItem(k);
  } catch {
    /* yok say */
  }
}

export interface Loaded {
  data: Data;
  /** Kayıtlı veri okunamadıysa uyarı metni */
  warning: string | null;
  isNew: boolean;
}

export function loadMode(): Mode {
  return get(MODE_KEY) === 'demo' ? 'demo' : 'real';
}
export function saveMode(m: Mode) {
  set(MODE_KEY, m);
}

export function load(mode: Mode): Loaded {
  const raw = get(key(mode));
  if (raw === null) return { data: emptyData(), warning: null, isNew: true };
  const parsed = parseBackup(raw);
  if (parsed.ok) return { data: parsed.data, warning: null, isNew: false };
  const backupKey = `${PREFIX}unreadable-${Date.now()}`;
  set(backupKey, raw);
  return {
    data: emptyData(),
    warning: 'Kayıtlı veriler okunamadı. Bozuk kopya cihazda saklandı; elindeki son yedeği geri yükleyebilirsin.',
    isNew: true,
  };
}

/** Yazar; başarısızsa (depolama dolu/engelli) false döner. */
export function save(mode: Mode, data: Data): boolean {
  return set(key(mode), serializeBackup(data));
}

export function clearDemo() {
  del(key('demo'));
}

/** Geri yüklemeden önceki veriyi saklar; geri yükleme geri alınabilsin. */
export function stashPreRestore(data: Data) {
  set(PRE_RESTORE_KEY, serializeBackup(data));
}
export function takePreRestore(): Data | null {
  const raw = get(PRE_RESTORE_KEY);
  if (!raw) return null;
  const p = parseBackup(raw);
  return p.ok ? p.data : null;
}
export function hasPreRestore(): boolean {
  return get(PRE_RESTORE_KEY) !== null;
}
export function dropPreRestore() {
  del(PRE_RESTORE_KEY);
}

export const STORAGE_KEY_PREFIX = PREFIX;

/** Tarayıcıdan, verinin kendiliğinden silinmemesini ister (destekleniyorsa). */
export async function requestPersistence(): Promise<boolean | null> {
  try {
    if (navigator.storage?.persist) {
      if (await navigator.storage.persisted()) return true;
      return await navigator.storage.persist();
    }
  } catch {
    /* desteklenmiyor */
  }
  return null;
}
