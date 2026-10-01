/**
 * Uygulama ile telefon arasındaki eşitleme: bildirimleri yeniden planlar, ana ekran aracını günceller,
 * otomatik yedek alır, derin bağlantıları ve bildirim dokunuşlarını karşılar, arka plandan dönüşü yakalar.
 * App içinde bir kez çağrılır.
 */
import { useEffect, useRef } from 'react';
import { getState, refreshToday, showToast, useStore } from '../store/store';
import { getDevice, useDevice } from '../store/device';
import { openSheet } from '../ui/nav';
import { isNative } from '../platform';
import { rescheduleNotifications, onNotificationTap } from './notifications';
import { updateWidget } from './widget';
import { runAutoBackup } from './autoBackup';
import { backedUpToday, backupNudgeDue } from './backupPlan';
import { todayISO } from '../domain/dates';
import type { NotifExtra } from './schedule';

export const DEEP_LINK_SCHEME = 'io.github.kivancogretmenoglu.cepdefteri';
const NUDGE_KEY = 'cep-defteri:backup-nudge';

/** "io.github.kivancogretmenoglu.cepdefteri://add" → ekleme sayfası. */
export function handleDeepLink(url: string | undefined | null): boolean {
  if (!url) return false;
  const m = /^io\.github\.kivancogretmenoglu\.cepdefteri:\/\/([^/?#]*)/i.exec(url);
  if (!m) return false;
  if (m[1].toLowerCase() === 'add' || m[1].toLowerCase() === 'ekle') {
    openSheet({ kind: 'add' });
    return true;
  }
  return false;
}

function handleNotif(ex: NotifExtra) {
  if (ex.open === 'add') return openSheet({ kind: 'add' });
  const { data } = getState();
  if (data.plans.some((p) => p.id === ex.planId)) openSheet({ kind: 'confirm', planId: ex.planId, due: ex.due });
}

/** Gün içinde bir kez, nazik bir yedek hatırlatması (tarayıcıda ya da otomatik yedek kapalıysa). */
function maybeNudge() {
  const { data, mode } = getState();
  if (mode !== 'real') return;
  if (isNative() && getDevice().autoBackup.enabled) return;
  if (!backupNudgeDue(data, Date.now())) return;
  const today = todayISO();
  try {
    if (localStorage.getItem(NUDGE_KEY) === today) return;
    localStorage.setItem(NUDGE_KEY, today);
  } catch {
    return;
  }
  setTimeout(() => showToast('Son yedek dosyan 14 günden eski. Ayarlar → Yedek indir ile bir kopya almaya ne dersin?', { ms: 7000 }), 2500);
}

let setupDone = false;
let backupTimer: ReturnType<typeof setTimeout> | undefined;
let backupPending = false;

function syncNow(opts: { backupIfStale?: boolean } = {}) {
  const { data, today, mode } = getState();
  rescheduleNotifications(data, today, mode);
  updateWidget(data, today, mode, true);
  if (opts.backupIfStale && !backedUpToday(getDevice().autoBackup.lastAt, today)) runAutoBackup(data, mode);
}

function flushBackup() {
  if (!backupPending) return;
  clearTimeout(backupTimer);
  backupPending = false;
  const { data, mode } = getState();
  runAutoBackup(data, mode);
}

function setupOnce() {
  if (setupDone || typeof window === 'undefined') return;
  setupDone = true;
  if (isNative()) {
    import('@capacitor/app')
      .then(async ({ App }) => {
        App.addListener('appUrlOpen', ({ url }) => handleDeepLink(url));
        App.addListener('appStateChange', ({ isActive }) => {
          if (isActive) {
            refreshToday();
            syncNow({ backupIfStale: true });
          } else flushBackup();
        });
        const launch = await App.getLaunchUrl().catch(() => undefined);
        handleDeepLink(launch?.url);
      })
      .catch(() => undefined);
    onNotificationTap(handleNotif).catch(() => undefined);
  } else {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') flushBackup();
      else syncNow({ backupIfStale: true });
    });
  }
  // Açılışta: bugün yedek alınmadıysa al; hatırlatmayı değerlendir.
  setTimeout(() => {
    syncNow({ backupIfStale: true });
    maybeNudge();
  }, 1200);
}

export function useNativeSync(): void {
  const data = useStore((s) => s.data);
  const today = useStore((s) => s.today);
  const mode = useStore((s) => s.mode);
  const notif = useDevice((p) => p.notifications);
  const abEnabled = useDevice((p) => p.autoBackup.enabled);
  const first = useRef(true);

  useEffect(() => setupOnce(), []);

  // Bildirim + araç: veri ya da tercih değişince (kısa gecikmeyle, art arda değişiklikler birleşir).
  useEffect(() => {
    const t = setTimeout(() => {
      rescheduleNotifications(data, today, mode);
      updateWidget(data, today, mode);
    }, 1500);
    return () => clearTimeout(t);
  }, [data, today, mode, notif]);

  // Otomatik yedek: veri değişikliğinden 15 sn sonra (açılıştaki ilk değer hariç; o setupOnce'ta).
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (mode !== 'real' || !abEnabled) return;
    backupPending = true;
    clearTimeout(backupTimer);
    backupTimer = setTimeout(flushBackup, 15_000);
  }, [data, mode, abEnabled]);
}
