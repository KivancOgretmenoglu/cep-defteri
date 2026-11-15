/**
 * Bildirim planı: veriden, bugünden ve tercihlerden saf olarak hesaplanır (test edilebilir).
 * Yan etkiler (izin, zamanlama) notifications.ts içinde.
 */
import type { Data, ID } from '../domain/types';
import type { NotificationPrefs } from '../store/device';
import { accountIndex, pendingUntil, planIsOutflow, rangeSummary } from '../domain/ledger';
import { addDays, weekStart, type ISODate } from '../domain/dates';
import { formatMoney } from '../domain/money';
import { categoryName } from '../domain/defaults';
import { translator } from '../i18n/core';

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
/** Haftalık özet: pazar 20:00. */
export const WEEKLY_HOUR = 20;

export type NotifExtra = { open: 'confirm'; planId: ID; due: ISODate } | { open: 'add' } | { open: 'reports' };

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
  // Bildirim metinleri verideki dilde (settings.lang).
  const lang = data.settings.lang ?? 'tr';
  const t = translator(lang);
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
      const money = formatMoney(o.amount, { lang });
      if (prefs.payments && planIsOutflow(o.plan, accounts)) {
        const key = `pay|${o.plan.id}|${o.due}`;
        const p = place(key, localAt(addDays(o.due, -1), PAYMENT_HOUR));
        if (!p) continue;
        const when = o.due === today ? t('notif.today') : t('notif.tomorrow');
        out.push({
          key,
          ...p,
          title: `${when}: ${o.plan.title} ${money}`,
          body: o.plan.kind === 'transfer' ? t('notif.transferBody') : t('notif.payBody'),
          extra: { open: 'confirm', planId: o.plan.id, due: o.due },
        });
      } else if (prefs.income && o.plan.kind === 'income') {
        const key = `inc|${o.plan.id}|${o.due}`;
        const p = place(key, localAt(o.due, INCOME_HOUR));
        if (!p) continue;
        out.push({
          key,
          ...p,
          title: t('notif.incomeTitle', { title: o.plan.title }),
          body: t('notif.incomeBody', { amount: money }),
          extra: { open: 'confirm', planId: o.plan.id, due: o.due },
        });
      }
    }
  }

  if (prefs.dailyReminder) {
    const hour = Math.min(23, Math.max(0, Math.round(prefs.reminderHour)));
    const txDays = new Set(data.txs.map((t) => t.date));
    const examUntil = data.settings.examUntil ?? null;
    for (let i = 0; i < REMINDER_DAYS; i++) {
      const d = addDays(today, i);
      if (txDays.has(d)) continue;
      // Sınav haftasında "bugün kayıt girdin mi?" hatırlatması susar; ödeme hatırlatmaları sürer.
      if (examUntil && d <= examUntil) continue;
      const at = localAt(d, hour);
      if (at.getTime() <= nowMs) continue;
      out.push({ key: `rem|${d}`, at, title: t('notif.remTitle'), body: t('notif.remBody'), extra: { open: 'add' } });
    }
  }

  if (prefs.weekly) {
    const w = weeklySummary(data, today, t, lang);
    // Saati geçtiyse gönderilmez (geç kalmış "haftanın özeti" anlamsız).
    if (w && w.at.getTime() > nowMs) out.push(w);
  }

  return out
    .sort((a, b) => a.at.getTime() - b.at.getTime() || a.key.localeCompare(b.key))
    .slice(0, MAX_NOTIFICATIONS)
    .map((n, i) => ({ ...n, id: NOTIF_ID_BASE + i }));
}

/**
 * Bu haftanın (pazartesi–pazar) özeti, pazar 20:00 için: toplam harcama, geçen haftayla farkı, en çok
 * harcanan kategori. Haftada hiç harcama yoksa null. Metin zamanlama anında hesaplanır; veri her
 * değiştiğinde bildirimler yeniden planlandığı için gönderildiğinde günceldir.
 */
export function weeklySummary(data: Data, today: ISODate, t: ReturnType<typeof translator>, lang: 'tr' | 'en'): Omit<PlannedNotification, 'id'> | null {
  const mon = weekStart(today);
  const sun = addDays(mon, 6);
  const cur = rangeSummary(data, mon, sun);
  if (cur.spending <= 0) return null;
  const prev = rangeSummary(data, addDays(mon, -7), addDays(mon, -1));
  let cmp = '';
  if (prev.spending > 0) {
    const ch = Math.round((Math.abs(cur.spending - prev.spending) / prev.spending) * 100);
    const p = lang === 'en' ? `${ch}%` : `%${ch}`;
    if (ch >= 5) cmp = t(cur.spending < prev.spending ? 'notif.weekLess' : 'notif.weekMore', { pct: p });
  }
  let topId: ID | null = null;
  let topAmt = 0;
  for (const [id, v] of cur.spendingByCategory) if (v > topAmt) [topId, topAmt] = [id, v];
  const cat = topId ? data.categories.find((c) => c.id === topId) : undefined;
  const top = cat ? t('notif.weekTop', { cat: categoryName(cat, lang) }) : '';
  return {
    key: `week|${sun}`,
    at: localAt(sun, WEEKLY_HOUR),
    title: t('notif.weekTitle'),
    body: t('notif.weekBody', { amount: formatMoney(cur.spending, { lang }), cmp, top }),
    extra: { open: 'reports' },
  };
}

/** Gönderim kaydını günceller: yeni planlananları ekler, 40 günden eski kayıtları atar. */
export function updateSent(sent: Readonly<Record<string, number>>, planned: PlannedNotification[], nowMs: number): Record<string, number> {
  const out: Record<string, number> = {};
  const cutoff = nowMs - 40 * 86_400_000;
  for (const [k, v] of Object.entries(sent)) if (v >= cutoff) out[k] = v;
  for (const n of planned) out[n.key] = n.at.getTime();
  return out;
}
