/** Otomatik yedeğin saf kuralları: dosya adları, hangi eski yedeklerin silineceği, tarayıcı anlık kopyaları. */
import type { Data } from '../domain/types';
import { todayISO, type ISODate } from '../domain/dates';

export const ANDROID_DIR = 'CepDefteri';
export const ANDROID_KEEP = 7;
export const WEB_KEEP = 5;
/** Tarayıcı deposu (localStorage) için güvenli üst sınır, karakter cinsinden (~5 milyon karakterlik sınırın altı). */
export const WEB_BUDGET_CHARS = 4_000_000;
export const NUDGE_DAYS = 14;

const NAME_RE = /^cep-defteri-otomatik-(\d{4}-\d{2}-\d{2})(?:-(\d+))?\.json$/;

export const autoBackupName = (day: ISODate, suffix?: number) => `cep-defteri-otomatik-${day}${suffix ? `-${suffix}` : ''}.json`;

export function parseAutoBackupName(name: string): { day: ISODate; suffix: number } | null {
  const m = NAME_RE.exec(name);
  return m ? { day: m[1], suffix: m[2] ? Number(m[2]) : 0 } : null;
}

/** Yeniden eskiye sıralı otomatik yedek dosyaları (başka dosyalar yok sayılır). */
export function sortAutoBackups(names: string[]): string[] {
  return names
    .map((n) => ({ n, p: parseAutoBackupName(n) }))
    .filter((x): x is { n: string; p: { day: string; suffix: number } } => !!x.p)
    .sort((a, b) => (a.p.day === b.p.day ? b.p.suffix - a.p.suffix : a.p.day < b.p.day ? 1 : -1))
    .map((x) => x.n);
}

/** En yeni `keep` gün dışında kalan otomatik yedekler (silinecekler). Aynı günün ek dosyaları o günle birlikte sayılır. */
export function filesToDelete(names: string[], keep = ANDROID_KEEP): string[] {
  const sorted = sortAutoBackups(names);
  const days: string[] = [];
  const out: string[] = [];
  for (const n of sorted) {
    const d = parseAutoBackupName(n)!.day;
    if (!days.includes(d)) days.push(d);
    if (days.indexOf(d) >= keep) out.push(n);
  }
  return out;
}

/** Yedeklenecek bir şey var mı? Boş veri, eski iyi bir yedeğin üzerine yazılmasın. */
export const hasContent = (d: Data) => d.accounts.length > 0 || d.txs.length > 0 || d.plans.length > 0;

export const backedUpToday = (lastAt: number | null, today: ISODate) => lastAt !== null && todayISO(new Date(lastAt)) === today;

// ───────── Tarayıcı ─────────

export interface WebSnapshot {
  day: ISODate;
  at: number;
  json: string;
}

/** Aynı günün kopyasını yenisiyle değiştirir; en yeni `keep` günü tutar. */
export function nextSnapshots(list: WebSnapshot[], snap: WebSnapshot, keep = WEB_KEEP): WebSnapshot[] {
  return [snap, ...list.filter((s) => s.day !== snap.day)].sort((a, b) => (a.day < b.day ? 1 : a.day > b.day ? -1 : b.at - a.at)).slice(0, keep);
}

/**
 * Depoya sığacak şekilde kopyaları azaltır. `otherChars`: yedekler dışındaki kullanımın karakter sayısı.
 * Yeni kopya bile sığmıyorsa null (yedek atlanır, mevcut kopyalar korunur).
 */
export function fitSnapshots(list: WebSnapshot[], otherChars: number, budget = WEB_BUDGET_CHARS): WebSnapshot[] | null {
  const size = (xs: WebSnapshot[]) => JSON.stringify(xs).length;
  let xs = list;
  while (xs.length > 1 && otherChars + size(xs) > budget) xs = xs.slice(0, -1);
  return otherChars + size(xs) > budget ? null : xs;
}

/** Elle yedek almayalı `NUDGE_DAYS` gün oldu mu? Hiç yedek yoksa ilk hesabın oluşturulmasından sayılır. */
export function backupNudgeDue(data: Data, nowMs: number, days = NUDGE_DAYS): boolean {
  if (!hasContent(data)) return false;
  let since = data.settings.lastBackupAt ?? Infinity;
  if (data.settings.lastBackupAt == null) for (const x of [...data.accounts, ...data.txs]) since = Math.min(since, x.createdAt);
  return Number.isFinite(since) && nowMs - since >= days * 86_400_000;
}
