/**
 * Google Play bağlantıları (yalnız Play'den kurulmuş Android uygulamasında çalışır):
 *  - Uygulama içi güncelleme: açılışta (ve uygulamaya dönüldüğünde, en fazla 6 saatte bir) Play'de yeni
 *    sürüm var mı diye bakılır; varsa Google'ın tam ekran "Güncelle" penceresi açılır (immediate update).
 *    Kullanıcı vazgeçerse bir sonraki kontrolde yeniden sorulur. İzin verilmiyorsa arka planda indirip
 *    bitince "Yeniden başlat" bildirimi gösterilir (flexible update).
 *  - Puanlama isteği: en az 2 gündür kullanılan, en az 5 kaydı olan gerçek veride ve iyi bir anda
 *    (kayıt kaydedildi, maskot keyifli; ya da ay karnesi açıldı) Google'ın uygulama içi puanlama penceresi.
 *    En fazla 120 günde bir istenir; pencerenin gerçekten gösterilip gösterilmeyeceğine Google karar verir
 *    (kota). Google'ın kuralı gereği önce "beğendin mi?" diye sorulmaz.
 * Tarayıcıda ve Play dışından kurulan APK'da hiçbir şey yapmaz (hatalar sessizce yutulur).
 */
import type { Data } from '../domain/types';
import { isNative } from '../platform';

const KEY = 'cep-defteri:play';
const DAY = 86_400_000;
export const REVIEW_MIN_DAYS = 2;
export const REVIEW_MIN_TXS = 5;
export const REVIEW_COOLDOWN_DAYS = 120;
const UPDATE_CHECK_EVERY_MS = 6 * 60 * 60 * 1000;

interface PlayState {
  reviewAskedAt: number | null;
  updateCheckedAt: number | null;
}

function read(): PlayState {
  try {
    const o = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<PlayState>;
    return { reviewAskedAt: typeof o.reviewAskedAt === 'number' ? o.reviewAskedAt : null, updateCheckedAt: typeof o.updateCheckedAt === 'number' ? o.updateCheckedAt : null };
  } catch {
    return { reviewAskedAt: null, updateCheckedAt: null };
  }
}
function write(patch: Partial<PlayState>) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...read(), ...patch }));
  } catch {
    /* yok say */
  }
}

/**
 * Puanlama istemenin sırası geldi mi (saf). Kullanım başlangıcı: ilk hesabın açıldığı an (sürüm
 * yükselten eski kullanıcılar için de doğru).
 */
export function reviewDue(data: Data, mode: 'real' | 'demo', askedAt: number | null, now: number): boolean {
  if (mode !== 'real' || data.accounts.length === 0) return false;
  const since = Math.min(...data.accounts.map((a) => a.createdAt));
  if (now - since < REVIEW_MIN_DAYS * DAY) return false;
  if (data.txs.length < REVIEW_MIN_TXS) return false;
  return askedAt === null || now - askedAt >= REVIEW_COOLDOWN_DAYS * DAY;
}

/** İyi bir anda çağrılır; koşullar uygunsa Google'ın puanlama penceresini ister. */
export async function maybeAskReview(data: Data, mode: 'real' | 'demo', now = Date.now()): Promise<void> {
  if (!isNative() || !reviewDue(data, mode, read().reviewAskedAt, now)) return;
  write({ reviewAskedAt: now });
  try {
    const { AppReview } = await import('@capawesome/capacitor-app-review');
    // Kayıt sayfası kapanırken araya girmesin diye kısa bir gecikme.
    await new Promise((r) => setTimeout(r, 1200));
    await AppReview.requestReview();
  } catch {
    // Play Hizmetleri yok / kota doldu: sessiz.
  }
}

let checking = false;

/**
 * Play'de yeni sürüm varsa güncelleme penceresini açar. `onDownloaded`: esnek güncelleme indirildiğinde
 * (ör. "Yeniden başlat" düğmeli bildirim göstermek için); düğmeye basılınca completeUpdate() çağrılmalı.
 */
export async function checkForUpdate(onDownloaded: () => void, opts: { force?: boolean; now?: number } = {}): Promise<void> {
  const now = opts.now ?? Date.now();
  if (!isNative() || checking) return;
  const last = read().updateCheckedAt;
  if (!opts.force && last && now - last < UPDATE_CHECK_EVERY_MS) return;
  checking = true;
  write({ updateCheckedAt: now });
  try {
    const { AppUpdate, AppUpdateAvailability, FlexibleUpdateInstallStatus } = await import('@capawesome/capacitor-app-update');
    const info = await AppUpdate.getAppUpdateInfo();
    if (info.updateAvailability === AppUpdateAvailability.UPDATE_IN_PROGRESS) {
      // Önceki tam ekran güncelleme yarıda kaldıysa sürdür.
      if (info.immediateUpdateAllowed) await AppUpdate.performImmediateUpdate();
      return;
    }
    if (info.installStatus === FlexibleUpdateInstallStatus.DOWNLOADED) {
      onDownloaded();
      return;
    }
    if (info.updateAvailability !== AppUpdateAvailability.UPDATE_AVAILABLE) return;
    if (info.immediateUpdateAllowed) {
      await AppUpdate.performImmediateUpdate();
    } else if (info.flexibleUpdateAllowed) {
      await AppUpdate.addListener('onFlexibleUpdateStateChange', (s) => {
        if (s.installStatus === FlexibleUpdateInstallStatus.DOWNLOADED) onDownloaded();
      });
      await AppUpdate.startFlexibleUpdate();
    }
  } catch {
    // Play'den kurulmamış (APK) ya da Play Hizmetleri yok: sessiz.
  } finally {
    checking = false;
  }
}

/** İndirilen esnek güncellemeyi kurar (uygulama yeniden başlar). */
export async function completeUpdate(): Promise<void> {
  try {
    const { AppUpdate } = await import('@capawesome/capacitor-app-update');
    await AppUpdate.completeFlexibleUpdate();
  } catch {
    /* yok say */
  }
}
