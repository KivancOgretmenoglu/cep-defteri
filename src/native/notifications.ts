/** Yerel bildirimler (yalnız Android uygulaması). Plan schedule.ts'de saf olarak hesaplanır; burada uygulanır. */
import type { Data } from '../domain/types';
import { isNative } from '../platform';
import { getDevice } from '../store/device';
import { computeSchedule, NOTIF_ID_BASE, NOTIF_ID_MAX, updateSent, type NotifExtra, type PlannedNotification } from './schedule';
import type { ISODate } from '../domain/dates';
import { t } from '../i18n';

const SENT_KEY = 'cep-defteri:notif-sent';
const CHANNEL = 'cep-hatirlatma';

export function loadSent(): Record<string, number> {
  try {
    const raw = localStorage.getItem(SENT_KEY);
    const p = raw ? JSON.parse(raw) : {};
    return p && typeof p === 'object' ? p : {};
  } catch {
    return {};
  }
}
function saveSent(s: Record<string, number>) {
  try {
    localStorage.setItem(SENT_KEY, JSON.stringify(s));
  } catch {
    /* yok say */
  }
}

const plugin = () => import('@capacitor/local-notifications').then((m) => m.LocalNotifications);

export type NotifPermission = 'granted' | 'denied' | 'prompt' | 'unsupported';

export async function notificationPermission(): Promise<NotifPermission> {
  if (!isNative()) return 'unsupported';
  try {
    const r = await (await plugin()).checkPermissions();
    return r.display === 'granted' ? 'granted' : r.display === 'denied' ? 'denied' : 'prompt';
  } catch {
    return 'unsupported';
  }
}

/** Android 13+ izin penceresini açar. */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNative()) return false;
  try {
    const r = await (await plugin()).requestPermissions();
    return r.display === 'granted';
  } catch {
    return false;
  }
}

let channelReady = false;
let chain: Promise<unknown> = Promise.resolve();

/** Bizim bildirimlerimizi iptal edip yeniden planlar. Çağrılar sıraya girer (yarış olmaz). */
export function rescheduleNotifications(data: Data, today: ISODate, mode: 'real' | 'demo'): Promise<PlannedNotification[]> {
  const run = chain.then(() => doReschedule(data, today, mode)).catch(() => [] as PlannedNotification[]);
  chain = run;
  return run;
}

async function doReschedule(data: Data, today: ISODate, mode: 'real' | 'demo'): Promise<PlannedNotification[]> {
  if (!isNative()) return [];
  const LN = await plugin();
  const pending = await LN.getPending();
  const ours = pending.notifications.filter((n) => n.id >= NOTIF_ID_BASE && n.id <= NOTIF_ID_MAX);
  if (ours.length) await LN.cancel({ notifications: ours.map((n) => ({ id: n.id })) });

  const prefs = getDevice().notifications;
  // Örnek veriyle bildirim gönderilmez.
  if (!prefs.enabled || mode !== 'real') return [];
  if ((await LN.checkPermissions()).display !== 'granted') return [];
  if (!channelReady) {
    await LN.createChannel({ id: CHANNEL, name: t('notif.channel'), description: t('notif.channelDesc'), importance: 4, visibility: 0 }).catch(() => undefined);
    channelReady = true;
  }
  const now = new Date();
  const sent = loadSent();
  const planned = computeSchedule(data, today, prefs, now, sent);
  if (planned.length) {
    await LN.schedule({
      notifications: planned.map((n) => ({
        id: n.id,
        title: n.title,
        body: n.body,
        schedule: { at: n.at, allowWhileIdle: true },
        extra: n.extra,
        channelId: CHANNEL,
        smallIcon: 'ic_stat_cep',
        iconColor: '#C4542F',
        autoCancel: true,
      })),
    });
  }
  saveSent(updateSent(sent, planned, now.getTime()));
  return planned;
}

/** Bildirime dokunulunca çağrılır (uygulama kapalıyken dokunulduysa da açılışta iletilir). */
export async function onNotificationTap(handler: (extra: NotifExtra) => void) {
  if (!isNative()) return;
  const LN = await plugin();
  await LN.addListener('localNotificationActionPerformed', (a) => {
    const ex = a.notification?.extra as NotifExtra | undefined;
    if (ex && (ex.open === 'add' || ex.open === 'confirm')) handler(ex);
  });
}
