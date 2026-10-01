/** Yedek (JSON) ve CSV dışa aktarma. Geri yükleme, veriyi kullanmadan önce baştan sona doğrular. */
import type { Data, Tx } from './types';
import { isMoney } from './money';
import { isISODate } from './dates';
import { DEFAULT_SETTINGS } from './defaults';
import { accountIndex, refundCategory, transferKind } from './ledger';

export const APP_ID = 'cep-defteri';

export interface BackupFile {
  app: typeof APP_ID;
  version: 1;
  exportedAt: string;
  data: Data;
}

export function serializeBackup(data: Data, now = new Date()): string {
  const file: BackupFile = { app: APP_ID, version: 1, exportedAt: now.toISOString(), data };
  return JSON.stringify(file, null, 2);
}

type Result = { ok: true; data: Data; exportedAt: string | null } | { ok: false; error: string };

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === 'string';
const optStr = (v: unknown) => v === undefined || isStr(v);

/** Yedek dosyasını ayrıştırır ve tüm alanları/ilişkileri doğrular. */
export function parseBackup(text: string): Result {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'Dosya okunamadı: geçerli bir JSON değil.' };
  }
  if (!isObj(raw) || raw.app !== APP_ID || !isObj(raw.data))
    return { ok: false, error: 'Bu dosya Cep Defteri yedeği gibi görünmüyor.' };
  if (raw.version !== 1) return { ok: false, error: 'Yedek sürümü desteklenmiyor.' };
  const d = raw.data;
  const err = (m: string): Result => ({ ok: false, error: `Yedek bozuk: ${m}` });
  if (d.schema !== 1) return err('şema sürümü tanınmadı.');
  for (const k of ['accounts', 'categories', 'txs', 'valuations', 'plans', 'goals'] as const)
    if (!Array.isArray(d[k])) return err(`"${k}" listesi eksik.`);
  if (!isObj(d.settings)) return err('ayarlar eksik.');
  if (!Number.isSafeInteger(d.nextSeq)) return err('sıra sayacı eksik.');

  const accounts = d.accounts as Record<string, unknown>[];
  const accIds = new Set<string>();
  for (const a of accounts) {
    if (!isObj(a) || !isStr(a.id) || !isStr(a.name) || !['cash', 'bank', 'investment', 'person'].includes(a.kind as string)) return err('hesap kaydı.');
    if (!isMoney(a.openingBalance) || !isISODate(a.openingDate)) return err(`"${a.name}" hesabının açılış bilgisi.`);
    if (a.priorContribution != null && !isMoney(a.priorContribution)) return err('önceki katkı.');
    if (accIds.has(a.id)) return err('yinelenen hesap.');
    accIds.add(a.id);
  }
  const catIds = new Set<string>();
  for (const c of d.categories as unknown[]) {
    if (!isObj(c) || !isStr(c.id) || !isStr(c.name) || !['expense', 'income'].includes(c.kind as string) || !isStr(c.icon) || !isStr(c.color))
      return err('kategori kaydı.');
    if (c.limit != null && !isMoney(c.limit)) return err('kategori limiti.');
    catIds.add(c.id);
  }
  const txIds = new Set<string>();
  let maxSeq = 0;
  for (const t of d.txs as unknown[]) {
    if (!isObj(t) || !isStr(t.id) || !['expense', 'income', 'transfer', 'refund'].includes(t.type as string)) return err('işlem kaydı.');
    if (!isMoney(t.amount) || (t.amount as number) <= 0 || !isISODate(t.date) || !Number.isSafeInteger(t.seq)) return err('işlem tutarı/tarihi.');
    if (!isStr(t.accountId) || !accIds.has(t.accountId)) return err('işlemin hesabı bulunamadı.');
    if (t.type === 'transfer' ? !isStr(t.toAccountId) || !accIds.has(t.toAccountId) : !isStr(t.categoryId) || !catIds.has(t.categoryId))
      return err('işlemin hedefi/kategorisi bulunamadı.');
    if (!optStr(t.note) || !optStr(t.refundOf)) return err('işlem notu.');
    if (t.tags !== undefined && (!Array.isArray(t.tags) || !t.tags.every((x) => isStr(x) && x.length > 0 && x.length <= 24) || t.tags.length > 5)) return err('etiketler.');
    if (t.planRef !== undefined && (!isObj(t.planRef) || !isStr(t.planRef.planId) || !isISODate(t.planRef.due))) return err('plan bağlantısı.');
    txIds.add(t.id);
    maxSeq = Math.max(maxSeq, t.seq as number);
  }
  for (const t of d.txs as Record<string, unknown>[]) if (t.type === 'refund' && t.refundOf !== undefined && !txIds.has(t.refundOf as string)) return err('iadenin bağlı olduğu gider yok.');
  for (const v of d.valuations as unknown[]) {
    if (!isObj(v) || !isStr(v.id) || !isStr(v.accountId) || !accIds.has(v.accountId) || !isMoney(v.value) || !isISODate(v.date) || !Number.isSafeInteger(v.seq))
      return err('değerleme kaydı.');
    maxSeq = Math.max(maxSeq, v.seq as number);
  }
  for (const p of d.plans as unknown[]) {
    if (!isObj(p) || !isStr(p.id) || !isStr(p.title) || !['expense', 'income', 'transfer'].includes(p.kind as string)) return err('plan kaydı.');
    if (!isMoney(p.amount) || !isISODate(p.startDate) || !['once', 'weekly', 'monthly', 'yearly'].includes(p.freq as string)) return err('plan ayrıntısı.');
    if (!isStr(p.accountId) || !accIds.has(p.accountId) || !Array.isArray(p.skipped) || !p.skipped.every(isISODate)) return err('plan hesabı.');
    if (p.endDate != null && !isISODate(p.endDate)) return err('plan bitişi.');
    if (p.installments != null && (!Number.isInteger(p.installments) || (p.installments as number) < 2 || (p.installments as number) > 60)) return err('taksit sayısı.');
  }
  for (const g of d.goals as unknown[]) {
    if (!isObj(g) || !isStr(g.id) || !isStr(g.title) || !isMoney(g.target) || !isStr(g.accountId) || !accIds.has(g.accountId)) return err('hedef kaydı.');
  }
  const semantic = semanticCheck(d as unknown as Data);
  if (semantic) return err(semantic);
  const s = d.settings;
  if (s.monthlyBudget != null && (!isMoney(s.monthlyBudget) || (s.monthlyBudget as number) <= 0)) return err('bütçe ayarı.');
  if (s.reserve !== undefined && (!isMoney(s.reserve) || (s.reserve as number) < 0)) return err('birikim payı ayarı.');
  if (s.periodMode !== undefined && !['month', 'days30'].includes(s.periodMode as string)) return err('dönem ayarı.');
  if (s.theme !== undefined && !['system', 'light', 'dark'].includes(s.theme as string)) return err('tema ayarı.');
  const settings = {
    ...DEFAULT_SETTINGS,
    ...s,
    clawd: { ...DEFAULT_SETTINGS.clawd, ...(isObj(s.clawd) ? s.clawd : {}) },
  };
  const data = { ...(d as unknown as Data), settings, nextSeq: Math.max(d.nextSeq as number, maxSeq + 1) };
  return { ok: true, data, exportedAt: isStr(raw.exportedAt) ? raw.exportedAt : null };
}

/**
 * Yapısal olarak doğru ama anlamca bozuk yedekleri yakalar (uygulamanın kendisinin asla üretmeyeceği durumlar):
 * negatif değerler, yinelenen kimlikler, kendine transfer, kuralsız iadeler, yanlış hesap türü vb.
 */
function semanticCheck(d: Data): string | null {
  const dup = (xs: { id: string }[]) => new Set(xs.map((x) => x.id)).size !== xs.length;
  if (dup(d.accounts) || dup(d.categories) || dup(d.txs) || dup(d.valuations) || dup(d.plans) || dup(d.goals)) return 'yinelenen kayıt kimliği.';
  const seqs = [...d.txs.map((t) => t.seq), ...d.valuations.map((v) => v.seq)];
  if (new Set(seqs).size !== seqs.length || seqs.some((q) => q < 1)) return 'kayıt sırası tutarsız.';
  const acc = accountIndex(d);
  const cat = new Map(d.categories.map((c) => [c.id, c]));
  for (const a of d.accounts) {
    if (a.kind === 'investment' && a.openingBalance < 0) return 'yatırım açılış değeri negatif.';
    if (a.priorContribution != null && a.priorContribution < 0) return 'önceki katkı negatif.';
  }
  for (const c of d.categories) if (c.limit != null && c.limit <= 0) return 'kategori limiti.';
  const txById = new Map(d.txs.map((t) => [t.id, t]));
  const refunded = new Map<string, number>();
  for (const t of d.txs) {
    const a = acc.get(t.accountId)!;
    if (t.date < a.openingDate) return 'hesabın takip başlangıcından önce işlem var.';
    if (t.type === 'transfer') {
      const to = acc.get(t.toAccountId!)!;
      if (to.id === a.id) return 'bir hesaptan kendisine transfer.';
      if (a.kind === 'investment' && to.kind === 'investment') return 'iki yatırım hesabı arasında transfer.';
      if ((a.kind === 'person' || to.kind === 'person') && (a.kind === 'investment' || to.kind === 'investment' || a.kind === to.kind)) return 'kişi hesabıyla geçersiz transfer.';
      if (t.date < to.openingDate) return 'hesabın takip başlangıcından önce işlem var.';
    } else {
      if (a.kind === 'investment') return 'yatırım hesabında gelir/gider kaydı.';
      if (a.kind === 'person' && t.type !== 'expense') return 'kişi hesabında gelir/iade kaydı.';
      if (cat.get(t.categoryId!)!.kind !== (t.type === 'income' ? 'income' : 'expense')) return 'kategori türü uyuşmuyor.';
    }
    if (t.type === 'refund') {
      const o = t.refundOf ? txById.get(t.refundOf) : undefined;
      if (!o || o.type !== 'expense' || o.id === t.id) return 'iade geçerli bir gidere bağlı değil.';
      if (t.date < o.date) return 'iade, giderden önce tarihli.';
      const sumR = (refunded.get(o.id) ?? 0) + t.amount;
      if (sumR > o.amount) return 'iade, giderin tutarını aşıyor.';
      refunded.set(o.id, sumR);
    } else if (t.refundOf !== undefined) return 'yalnız iade bir gidere bağlanabilir.';
  }
  for (const v of d.valuations) {
    if (v.value < 0) return 'negatif yatırım değeri.';
    if (acc.get(v.accountId)!.kind !== 'investment') return 'değer kaydı yatırım hesabında değil.';
  }
  for (const p of d.plans) {
    if (p.amount <= 0) return 'plan tutarı sıfır ya da negatif.';
    const a = acc.get(p.accountId)!;
    if (p.kind === 'transfer') {
      const to = p.toAccountId ? acc.get(p.toAccountId) : undefined;
      if (!to || to.id === a.id || (a.kind === 'investment' && to.kind === 'investment') || a.kind === 'person' || to.kind === 'person') return 'planlı aktarımın hedefi geçersiz.';
    } else {
      const c = p.categoryId ? cat.get(p.categoryId) : undefined;
      if (!c || c.kind !== p.kind || a.kind === 'investment' || a.kind === 'person') return 'planın kategorisi ya da hesabı geçersiz.';
    }
  }
  for (const g of d.goals) {
    if (g.target <= 0 || acc.get(g.accountId)!.kind !== 'investment') return 'hedef kaydı geçersiz.';
  }
  return null;
}

// ───────────────────────── CSV ─────────────────────────

const csvCell = (v: string) => (/[";\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
/** Tutar, Türkçe Excel'in sayı olarak tanıyacağı biçimde: binlik ayırıcısız, virgüllü ondalık. */
const csvAmount = (k: number) => {
  const sign = k < 0 ? '-' : '';
  const a = Math.abs(k);
  return `${sign}${Math.floor(a / 100)},${String(a % 100).padStart(2, '0')}`;
};

export function txTypeLabel(t: Tx, data: Data): string {
  if (t.type === 'expense') return accountIndex(data).get(t.accountId)?.kind === 'person' ? 'Gider (başkası ödedi)' : 'Gider';
  if (t.type === 'income') return 'Gelir';
  if (t.type === 'refund') return 'İade';
  const k = transferKind(t, accountIndex(data));
  if (k === 'debt') return 'Borç / alacak';
  return k === 'contribution' ? 'Yatırıma aktarım' : k === 'withdrawal' ? 'Yatırımdan çekim' : 'Hesaplar arası transfer';
}

/**
 * İşlemleri CSV olarak verir (noktalı virgül ayraçlı, UTF-8 BOM'lu; Türkçe Excel doğrudan açar).
 */
export function transactionsCSV(data: Data): string {
  const acc = accountIndex(data);
  const cats = new Map(data.categories.map((c) => [c.id, c]));
  const txById = new Map(data.txs.map((t) => [t.id, t]));
  const header = ['Tarih', 'Tür', 'Tutar', 'Hesap', 'Hedef hesap', 'Kategori', 'Not', 'Planlı', 'Etiketler'];
  const rows = [...data.txs]
    .sort((a, b) => (a.date === b.date ? a.seq - b.seq : a.date < b.date ? -1 : 1))
    .map((t) => {
      const catId = t.type === 'refund' ? refundCategory(t, txById) : t.categoryId;
      return [
        t.date,
        txTypeLabel(t, data),
        csvAmount(t.amount),
        acc.get(t.accountId)?.name ?? '',
        t.toAccountId ? acc.get(t.toAccountId)?.name ?? '' : '',
        catId ? cats.get(catId)?.name ?? '' : '',
        t.note ?? '',
        t.planRef ? 'Evet' : '',
        (t.tags ?? []).join(', '),
      ];
    });
  return '﻿' + [header, ...rows].map((r) => r.map(csvCell).join(';')).join('\r\n') + '\r\n';
}

export function valuationsCSV(data: Data): string {
  const acc = accountIndex(data);
  const rows = [...data.valuations]
    .sort((a, b) => (a.date === b.date ? a.seq - b.seq : a.date < b.date ? -1 : 1))
    .map((v) => [v.date, acc.get(v.accountId)?.name ?? '', csvAmount(v.value), v.note ?? '']);
  return '﻿' + [['Tarih', 'Yatırım hesabı', 'Güncel değer', 'Not'], ...rows].map((r) => r.map(csvCell).join(';')).join('\r\n') + '\r\n';
}
