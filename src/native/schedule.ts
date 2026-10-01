/**
 * Bildirim planı: veriden, bugünden ve tercihlerden saf olarak hesaplanır (test edilebilir).
 * Yan etkiler (izin, zamanlama) notifications.ts içinde.
 */
import type { Data, ID } from '../domain/types';
import type { NotificationPrefs } from '../store/device';
import { accountIndex, pendingUntil, planIsOutflow } from '../domain/ledger';
import { addDays, type ISODate } from '../domain/dates';
import { formatMoney } from '../domain/money';

/** Bizim bildirimlerimiz bu aralıktaki kimlikleri kullanır; yeniden planlarken yalnız bunlar iptal edilir. */
export const NOTIF_ID_BASE = 71_000;
export const NOTIF_ID_MAX = 71_999;
export const MAX_NOTIFICATIONS = 60;
export const HORIZON_DAYS = 30;
export const REMINDER_DAYS = 14;
export const PAYMENT_HOUR = 10;
export const INCOME_HOUR = 12;
/** Saati geçmiş (ama vadesi geçmemiş) kalem için "hemen" bildirimi bu kadar sonra çıkar. */
export const LATE_DELAY_MS = 60_000;

export type NotifExtra = { open: 'confirm'; planId: ID; due: ISODate } | { open: 'add' };

export interface PlannedNotification {
  id: number;
  /** Kalemin kalıcı anahtarı: pay|plan|vade, inc|plan|vade, rem|gün */
  key: string;
  at: Date;
  title: string;
  body: string;
  extra: NotifExtra;
  /** Asıl saati geçtiği için kısa süre sonra gösterilecek (yalnız bir kez). */
  late?: boolean;
}

/** Yerel saatle belirli günün saati. */
export function localAt(d: ISODate, hour: number, minute = 0): Date {
  const [y, m, day] = d.split('-').map(Number);
  return new Date(y, m - 1, day, hour, minute, 0, 0);
}

/**
 * @param sent Daha önce zamanlanmış bildirimlerin anahtarı → zamanı (ms). Saati geçmiş bir kalem,
 *   daha önce zamanı geçmiş olarak kaydedildiyse (yani büyük ihtimalle gösterildiyse) tekrar gönderilmez.
 */
export function computeSchedule(
  data: Data,
  today: ISODate,
  prefs: NotificationPrefs,
  now: Date,
  sent: Readonly<Record<string, number>> = {},
): PlannedNotification[] {
  if (!prefs.enabled) return [];
  const nowMs = now.getTime();
  const horizon = addDays(today, HORIZON_DAYS);
  const out: Omit<PlannedNotification, 'id'>[] = [];

  /** Zamanı geldiyse/geçtiyse: daha önce gönderilmediyse bir kez "hemen". */
  const place = (key: string, at: Date): { at: Date; late?: boolean } | null => {
    if (at.getTime() > nowMs) return { at };
    const prev = sent[key];
    if (prev !== undefined && prev <= nowMs) return null;
    return { at: new Date(nowMs + LATE_DELAY_MS), late: true };
  };

  if ((prefs.payments || prefs.income) && data.plans.length) {
    const accounts = accountIndex(data);
    // Vadesi geçmişler bildirilmez; bugünden ufka kadar bekleyenler.
    const pend = pendingUntil(data, horizon).filter((o) => o.due >= today);
    for (const o of pend) {
      const money = formatMoney(o.amount);
      if (prefs.payments && planIsOutflow(o.plan, accounts)) {
        const key = `pay|${o.plan.id}|${o.due}`;
        const p = place(key, localAt(addDays(o.due, -1), PAYMENT_HOUR));
        if (!p) continue;
        const when = o.due === today ? 'Bugün' : 'Yarın';
        out.push({
          key,
          ...p,
          title: `${when}: ${o.plan.title} ${money}`,
          body: o.plan.kind === 'transfer' ? 'Aktarımı yapınca Cep Defteri’nde onayla.' : 'Ödeyince Cep Defteri’nde “Ödendi” ile kaydet.',
          extra: { open: 'confirm', planId: o.plan.id, due: o.due },
        });
      } else if (prefs.income && o.plan.kind === 'income') {
        const key = `inc|${o.plan.id}|${o.due}`;
        const p = place(key, localAt(o.due, INCOME_HOUR));
        if (!p) continue;
        out.push({
          key,
          ...p,
          title: `${o.plan.title} geldi mi?`,
          body: `Beklenen ${money}. Gelince kaydet.`,
          extra: { open: 'confirm', planId: o.plan.id, due: o.due },
        });
      }
    }
  }

  if (prefs.dailyReminder) {
    const hour = Math.min(23, Math.max(0, Math.round(prefs.reminderHour)));
    const txDays = new Set(data.txs.map((t) => t.date));
    for (let i = 0; i < REMINDER_DAYS; i++) {
      const d = addDays(today, i);
      if (txDays.has(d)) continue;
      const at = localAt(d, hour);
      if (at.getTime() <= nowMs) continue;
      out.push({ key: `rem|${d}`, at, title: 'Bugünkü harcamalarını girdin mi?', body: 'Bir dakikanı alır; Clawd defteri açık tutuyor.', extra: { open: 'add' } });
    }
  }

  return out
    .sort((a, b) => a.at.getTime() - b.at.getTime() || a.key.localeCompare(b.key))
    .slice(0, MAX_NOTIFICATIONS)
    .map((n, i) => ({ ...n, id: NOTIF_ID_BASE + i }));
}

/** Gönderim kaydını günceller: yeni planlananları ekler, 40 günden eski kayıtları atar. */
export function updateSent(sent: Readonly<Record<string, number>>, planned: PlannedNotification[], nowMs: number): Record<string, number> {
  const out: Record<string, number> = {};
  const cutoff = nowMs - 40 * 86_400_000;
  for (const [k, v] of Object.entries(sent)) if (v >= cutoff) out[k] = v;
  for (const n of planned) out[n.key] = n.at.getTime();
  return out;
}
