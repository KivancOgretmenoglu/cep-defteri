/**
 * Uygulama ile telefon arasındaki eşitleme: bildirimleri yeniden planlar, ana ekran aracını günceller,
 * otomatik yedek alır, derin bağlantıları ve bildirim dokunuşlarını karşılar, arka plandan dönüşü yakalar.
 * App içinde bir kez çağrılır.
 */
import { useEffect, useRef } from 'react';
import { getState, refreshToday, useStore } from '../store/store';
import { getDevice, useDevice } from '../store/device';
import { openSheet } from '../ui/nav';
import { isNative } from '../platform';
import { rescheduleNotifications, onNotificationTap } from './notifications';
import { updateWidget } from './widget';
import { ingestWidgetQueue } from './widgetQueue';
import { useWidgetPrefs } from './widgetPrefs';
import { runAutoBackup } from './autoBackup';
import { initShortcuts } from './shortcuts';
import { backedUpToday } from './backupPlan';
import type { NotifExtra } from './schedule';

export const DEEP_LINK_SCHEME = 'io.github.kivancogretmenoglu.cepdefteri';

/**
 * "io.github.kivancogretmenoglu.cepdefteri://add" → ekleme sayfası.
 * "?type=expense" / "?type=income" (araçtaki Gider / Gelir düğmeleri) sayfayı o sekmeyle açar.
 */
export function handleDeepLink(url: string | undefined | null): boolean {
  const target = parseDeepLink(url);
  if (!target) return false;
  openSheet(target.type ? { kind: 'add', preset: { type: target.type } } : { kind: 'add' });
  return true;
}

/** Saf ayrıştırıcı (test için): ekleme bağlantısıysa { type? }, değilse null. */
export function parseDeepLink(url: string | undefined | null): { type?: 'expense' | 'income' } | null {
  if (!url) return null;
  const m = /^io\.github\.kivancogretmenoglu\.cepdefteri:\/\/([^/?#]*)[^?#]*(?:\?([^#]*))?/i.exec(url);
  if (!m) return null;
  const host = m[1].toLowerCase();
  if (host !== 'add' && host !== 'ekle') return null;
  const type = new URLSearchParams(m[2] ?? '').get('type')?.toLowerCase();
  if (type === 'expense' || type === 'gider') return { type: 'expense' };
  if (type === 'income' || type === 'gelir') return { type: 'income' };
  return {};
}

function handleNotif(ex: NotifExtra) {
  if (ex.open === 'add') return openSheet({ kind: 'add' });
  const { data } = getState();
  if (data.plans.some((p) => p.id === ex.planId)) openSheet({ kind: 'confirm', planId: ex.planId, due: ex.due });
}

let setupDone = false;
let backupTimer: ReturnType<typeof setTimeout> | undefined;
let backupPending = false;
let widgetTimer: ReturnType<typeof setTimeout> | undefined;

function syncNow(opts: { backupIfStale?: boolean } = {}) {
  const { data, today, mode } = getState();
  rescheduleNotifications(data, today, mode);
  updateWidget(data, today, mode, true);
  if (opts.backupIfStale && !backedUpToday(getDevice().autoBackup.lastAt, today)) runAutoBackup(data, mode);
}

/** Aracı hemen güncelle (gecikmeli güncellemeyi iptal ederek). */
function syncWidgetNow() {
  clearTimeout(widgetTimer);
  const { data, today, mode } = getState();
  void updateWidget(data, today, mode);
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
    void initShortcuts();
    import('@capacitor/app')
      .then(async ({ App }) => {
        App.addListener('appUrlOpen', ({ url }) => handleDeepLink(url));
        App.addListener('appStateChange', ({ isActive }) => {
          if (isActive) {
            refreshToday();
            void ingestWidgetQueue();
            syncNow({ backupIfStale: true });
          } else {
            // Arka plana geçerken: bekleyen (gecikmeli) araç güncellemesini beklemeden en son veriyi gönder.
            syncWidgetNow();
            flushBackup();
          }
        });
        const launch = await App.getLaunchUrl().catch(() => undefined);
        handleDeepLink(launch?.url);
        // Araçtaki çiplerle uygulama kapalıyken eklenen kayıtlar
        void ingestWidgetQueue();
      })
      .catch(() => undefined);
    onNotificationTap(handleNotif).catch(() => undefined);
  } else {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') flushBackup();
      else syncNow({ backupIfStale: true });
    });
  }
  // Açılışta: bugün yedek alınmadıysa al. (Yedek hatırlatması ana ekrandaki BackupReminder kartında.)
  setTimeout(() => syncNow({ backupIfStale: true }), 1200);
}

export function useNativeSync(): void {
  const data = useStore((s) => s.data);
  const today = useStore((s) => s.today);
  const mode = useStore((s) => s.mode);
  const notif = useDevice((p) => p.notifications);
  const abEnabled = useDevice((p) => p.autoBackup.enabled);
  const widgetPrefs = useWidgetPrefs();
  const first = useRef(true);

  useEffect(() => setupOnce(), []);

  // Örnek veriden gerçek veriye dönünce bekleyen araç kayıtlarını al.
  useEffect(() => {
    if (mode === 'real' && isNative()) void ingestWidgetQueue();
  }, [mode]);

  // Araç: veri ya da araç tercihi değişince hemen sayılır (300 ms; art arda değişiklikler birleşir). Kayıt eklenince
  // tutar ve "Not aldım ✓" pozu ana ekrana dönmeden güncellenmiş olur; arka plana geçişte ayrıca beklemeden gönderilir.
  useEffect(() => {
    clearTimeout(widgetTimer);
    widgetTimer = setTimeout(() => void updateWidget(data, today, mode), 300);
    return () => clearTimeout(widgetTimer);
  }, [data, today, mode, widgetPrefs]);

  // Bildirimler: daha pahalı, 1.5 sn gecikmeyle.
  useEffect(() => {
    const t = setTimeout(() => rescheduleNotifications(data, today, mode), 1500);
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
