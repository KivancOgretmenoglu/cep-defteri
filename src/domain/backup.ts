/** Yedek (JSON) ve CSV dışa aktarma. Geri yükleme, veriyi kullanmadan önce baştan sona doğrular. */
import type { Data, Lang, Tx } from './types';
import { translator, type Key, type Vars } from '../i18n/core';
import { categoryName } from './defaults';
import { isMoney } from './money';
import { isISODate } from './dates';
import { DEFAULT_SETTINGS } from './defaults';
import { accountIndex, assetOverdraft, refundCategory, transferKind } from './ledger';
import { isAssetAccount, isAssetUnit, isQty, type AssetUnit } from './assets';
import { migrateRawData } from './migrate';

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

/** Yedek dosyasını ayrıştırır ve tüm alanları/ilişkileri doğrular. Hata metni `lang` dilindedir. */
export function parseBackup(text: string, lang: Lang = 'tr'): Result {
  const t = translator(lang);
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: t('bk.notJson') };
  }
  if (!isObj(raw) || raw.app !== APP_ID || !isObj(raw.data))
    return { ok: false, error: t('bk.notBackup') };
  if (raw.version !== 1) return { ok: false, error: t('bk.version') };
  // Eski biçimler (ör. tek birimli altın hesabı) doğrulamadan önce güncel biçime çevrilir.
  const d = migrateRawData(raw.data);
  const err = (m: Key, vars?: Vars): Result => ({ ok: false, error: t('bk.corrupt', { detail: t(m, vars) }) });
  if (d.schema !== 1) return err('bk.schema');
  for (const k of ['accounts', 'categories', 'txs', 'valuations', 'plans', 'goals'] as const)
    if (!Array.isArray(d[k])) return err('bk.listMissing', { list: k });
  if (!isObj(d.settings)) return err('bk.settings');
  if (!Number.isSafeInteger(d.nextSeq)) return err('bk.seqCounter');

  const accounts = d.accounts as Record<string, unknown>[];
  const accIds = new Set<string>();
  for (const a of accounts) {
    if (!isObj(a) || !isStr(a.id) || !isStr(a.name) || !['cash', 'bank', 'investment', 'person'].includes(a.kind as string)) return err('bk.account');
    if (!isMoney(a.openingBalance) || !isISODate(a.openingDate)) return err('bk.opening', { name: String(a.name) });
    if (a.priorContribution != null && !isMoney(a.priorContribution)) return err('bk.prior');
    // Altın/döviz hesabı (isteğe bağlı; eski tek birimli biçim yukarıda çevrildi)
    if (a.asset !== undefined && (!isAssetAccount(a.asset) || a.kind !== 'investment')) return err('bk.asset');
    if (a.openingQty !== undefined || a.openingPrice !== undefined) return err('bk.asset');
    if (accIds.has(a.id)) return err('bk.dupAccount');
    accIds.add(a.id);
  }
  const catIds = new Set<string>();
  for (const c of d.categories as unknown[]) {
    if (!isObj(c) || !isStr(c.id) || !isStr(c.name) || !['expense', 'income'].includes(c.kind as string) || !isStr(c.icon) || !isStr(c.color))
      return err('bk.category');
    if (c.limit != null && !isMoney(c.limit)) return err('bk.catLimit');
    catIds.add(c.id);
  }
  const txIds = new Set<string>();
  let maxSeq = 0;
  for (const t of d.txs as unknown[]) {
    if (!isObj(t) || !isStr(t.id) || !['expense', 'income', 'transfer', 'refund'].includes(t.type as string)) return err('bk.tx');
    if (!isMoney(t.amount) || (t.amount as number) <= 0 || !isISODate(t.date) || !Number.isSafeInteger(t.seq)) return err('bk.txAmountDate');
    if (!isStr(t.accountId) || !accIds.has(t.accountId)) return err('bk.txAccount');
    if (t.type === 'transfer' ? !isStr(t.toAccountId) || !accIds.has(t.toAccountId) : !isStr(t.categoryId) || !catIds.has(t.categoryId))
      return err('bk.txTarget');
    if (!optStr(t.note) || !optStr(t.refundOf)) return err('bk.txNote');
    if (t.tags !== undefined && (!Array.isArray(t.tags) || !t.tags.every((x) => isStr(x) && x.length > 0 && x.length <= 24) || t.tags.length > 5)) return err('bk.tags');
    if (t.planRef !== undefined && (!isObj(t.planRef) || !isStr(t.planRef.planId) || !isISODate(t.planRef.due))) return err('bk.planRef');
    if ((t.qty !== undefined && !isQty(t.qty)) || (t.unitPrice !== undefined && (!isMoney(t.unitPrice) || (t.unitPrice as number) <= 0)) || (t.unit !== undefined && !isAssetUnit(t.unit))) return err('bk.assetTx');
    txIds.add(t.id);
    maxSeq = Math.max(maxSeq, t.seq as number);
  }
  for (const t of d.txs as Record<string, unknown>[]) if (t.type === 'refund' && t.refundOf !== undefined && !txIds.has(t.refundOf as string)) return err('bk.refundMissing');
  for (const v of d.valuations as unknown[]) {
    if (!isObj(v) || !isStr(v.id) || !isStr(v.accountId) || !accIds.has(v.accountId) || !isMoney(v.value) || !isISODate(v.date) || !Number.isSafeInteger(v.seq))
      return err('bk.valuation');
    maxSeq = Math.max(maxSeq, v.seq as number);
  }
  for (const p of d.plans as unknown[]) {
    if (!isObj(p) || !isStr(p.id) || !isStr(p.title) || !['expense', 'income', 'transfer'].includes(p.kind as string)) return err('bk.plan');
    if (!isMoney(p.amount) || !isISODate(p.startDate) || !['once', 'weekly', 'monthly', 'yearly'].includes(p.freq as string)) return err('bk.planDetail');
    if (!isStr(p.accountId) || !accIds.has(p.accountId) || !Array.isArray(p.skipped) || !p.skipped.every(isISODate)) return err('bk.planAccount');
    if (p.endDate != null && !isISODate(p.endDate)) return err('bk.planEnd');
    if (p.installments != null && (!Number.isInteger(p.installments) || (p.installments as number) < 2 || (p.installments as number) > 60)) return err('bk.installments');
  }
  for (const g of d.goals as unknown[]) {
    if (!isObj(g) || !isStr(g.id) || !isStr(g.title) || !isMoney(g.target) || !isStr(g.accountId) || !accIds.has(g.accountId)) return err('bk.goal');
  }
  const semantic = semanticCheck(d as unknown as Data);
  if (semantic) return err(semantic);
  const s = d.settings;
  if (s.monthlyBudget != null && (!isMoney(s.monthlyBudget) || (s.monthlyBudget as number) <= 0)) return err('bk.budget');
  if (s.reserve !== undefined && (!isMoney(s.reserve) || (s.reserve as number) < 0)) return err('bk.reserve');
  if (s.monthEndFloor != null && (!isMoney(s.monthEndFloor) || (s.monthEndFloor as number) < 0)) return err('bk.floor');
  if (s.guideVersion != null && (!Number.isSafeInteger(s.guideVersion) || (s.guideVersion as number) < 0)) return err('bk.guide');
  if (s.periodMode !== undefined && !['month', 'days30'].includes(s.periodMode as string)) return err('bk.period');
  if (s.theme !== undefined && !['system', 'light', 'dark'].includes(s.theme as string)) return err('bk.theme');
  if (s.lang !== undefined && !['tr', 'en'].includes(s.lang as string)) return err('bk.lang');
  if (s.examUntil != null && !isISODate(s.examUntil)) return err('bk.exam');
  // Eski sürümden kalan Clawd ayarları taşınmaz.
  const { clawd: _oldClawd, clawdQuips: _oldQuips, ...rest } = s;
  const settings = {
    ...DEFAULT_SETTINGS,
    ...rest,
    mascot: { ...DEFAULT_SETTINGS.mascot, ...(isObj(s.mascot) ? s.mascot : {}) },
    // Eski sürümden: Clawd espri ayarı
    quips: typeof s.quips === 'boolean' ? s.quips : typeof s.clawdQuips === 'boolean' ? s.clawdQuips : DEFAULT_SETTINGS.quips,
  };
  const data = { ...(d as unknown as Data), settings, nextSeq: Math.max(d.nextSeq as number, maxSeq + 1) };
  return { ok: true, data, exportedAt: isStr(raw.exportedAt) ? raw.exportedAt : null };
}

/**
 * Yapısal olarak doğru ama anlamca bozuk yedekleri yakalar (uygulamanın kendisinin asla üretmeyeceği durumlar):
 * negatif değerler, yinelenen kimlikler, kendine transfer, kuralsız iadeler, yanlış hesap türü vb.
 */
function semanticCheck(d: Data): Key | null {
  const dup = (xs: { id: string }[]) => new Set(xs.map((x) => x.id)).size !== xs.length;
  if (dup(d.accounts) || dup(d.categories) || dup(d.txs) || dup(d.valuations) || dup(d.plans) || dup(d.goals)) return 'bk.dupId';
  const seqs = [...d.txs.map((t) => t.seq), ...d.valuations.map((v) => v.seq)];
  if (new Set(seqs).size !== seqs.length || seqs.some((q) => q < 1)) return 'bk.seq';
  const acc = accountIndex(d);
  const cat = new Map(d.categories.map((c) => [c.id, c]));
  for (const a of d.accounts) {
    if (a.kind === 'investment' && a.openingBalance < 0) return 'bk.invOpeningNeg';
    if (a.priorContribution != null && a.priorContribution < 0) return 'bk.priorNeg';
  }
  for (const c of d.categories) if (c.limit != null && c.limit <= 0) return 'bk.catLimit';
  const txById = new Map(d.txs.map((t) => [t.id, t]));
  const refunded = new Map<string, number>();
  for (const t of d.txs) {
    const a = acc.get(t.accountId)!;
    if (t.date < a.openingDate) return 'bk.beforeStart';
    if (t.type === 'transfer') {
      const to = acc.get(t.toAccountId!)!;
      if (to.id === a.id) return 'bk.selfTransfer';
      if (a.kind === 'investment' && to.kind === 'investment') return 'bk.invInv';
      if ((a.kind === 'person' || to.kind === 'person') && (a.kind === 'investment' || to.kind === 'investment' || a.kind === to.kind)) return 'bk.personTransfer';
      if (t.date < to.openingDate) return 'bk.beforeStart';
      // Altın/döviz hesabına giren/çıkan transfer miktar ve fiyat taşır; diğerleri taşımaz.
      const assetSide = (to.kind === 'investment' && to.asset) || (a.kind === 'investment' && a.asset);
      if (assetSide ? t.unit === undefined || t.qty === undefined || t.unitPrice === undefined : t.unit !== undefined || t.qty !== undefined || t.unitPrice !== undefined) return 'bk.assetTx';
    } else {
      if (t.unit !== undefined || t.qty !== undefined || t.unitPrice !== undefined) return 'bk.assetTx';
      if (a.kind === 'investment') return 'bk.invIncomeExpense';
      if (a.kind === 'person' && t.type !== 'expense') return 'bk.personIncome';
      if (cat.get(t.categoryId!)!.kind !== (t.type === 'income' ? 'income' : 'expense')) return 'bk.catKind';
    }
    if (t.type === 'refund') {
      const o = t.refundOf ? txById.get(t.refundOf) : undefined;
      if (!o || o.type !== 'expense' || o.id === t.id) return 'bk.refundLink';
      if (t.date < o.date) return 'bk.refundBefore';
      const sumR = (refunded.get(o.id) ?? 0) + t.amount;
      if (sumR > o.amount) return 'bk.refundTooMuch';
      refunded.set(o.id, sumR);
    } else if (t.refundOf !== undefined) return 'bk.onlyRefundLinks';
  }
  // Altın/döviz: hiçbir anda bir birimden elde olandan fazlası satılmış olamaz.
  for (const a of d.accounts) if (a.asset && assetOverdraft(d, a)) return 'bk.assetOverdraw';
  for (const v of d.valuations) {
    if (v.value < 0) return 'bk.negValue';
    if (acc.get(v.accountId)!.kind !== 'investment') return 'bk.valNotInv';
  }
  for (const p of d.plans) {
    if (p.amount <= 0) return 'bk.planAmount';
    const a = acc.get(p.accountId)!;
    if (p.kind === 'transfer') {
      const to = p.toAccountId ? acc.get(p.toAccountId) : undefined;
      if (!to || to.id === a.id || (a.kind === 'investment' && to.kind === 'investment') || a.kind === 'person' || to.kind === 'person') return 'bk.planTarget';
    } else {
      const c = p.categoryId ? cat.get(p.categoryId) : undefined;
      if (!c || c.kind !== p.kind || a.kind === 'investment' || a.kind === 'person') return 'bk.planCatAcc';
    }
  }
  for (const g of d.goals) {
    if (g.target <= 0 || acc.get(g.accountId)!.kind !== 'investment') return 'bk.goalInvalid';
  }
  return null;
}

// ───────────────────────── CSV ─────────────────────────

/** Ayraç: Türkçede noktalı virgül (Türkçe Excel), İngilizcede virgül. */
const csvSep = (lang: Lang) => (lang === 'en' ? ',' : ';');
const csvCell = (v: string, lang: Lang = 'tr') => ((lang === 'en' ? /[",\n\r]/ : /[";\n\r]/).test(v) ? `"${v.replace(/"/g, '""')}"` : v);
const csvRows = (rows: string[][], lang: Lang) => '﻿' + rows.map((r) => r.map((c) => csvCell(c, lang)).join(csvSep(lang))).join('\r\n') + '\r\n';
/** Tutar, Excel'in sayı olarak tanıyacağı biçimde: binlik ayırıcısız; Türkçede virgüllü, İngilizcede noktalı ondalık. */
const csvAmount = (k: number, lang: Lang = 'tr') => {
  const sign = k < 0 ? '-' : '';
  const a = Math.abs(k);
  return `${sign}${Math.floor(a / 100)}${lang === 'en' ? '.' : ','}${String(a % 100).padStart(2, '0')}`;
};

export function txTypeLabel(t: Tx, data: Data, lang: Lang = 'tr'): string {
  const T = translator(lang);
  if (t.type === 'expense') return accountIndex(data).get(t.accountId)?.kind === 'person' ? T('csv.type.expenseOther') : T('csv.type.expense');
  if (t.type === 'income') return T('csv.type.income');
  if (t.type === 'refund') return T('csv.type.refund');
  const k = transferKind(t, accountIndex(data));
  if (k === 'debt') return T('csv.type.debt');
  return k === 'contribution' ? T('csv.type.contribution') : k === 'withdrawal' ? T('csv.type.withdrawal') : T('csv.type.transfer');
}

/**
 * İşlemleri CSV olarak verir (UTF-8 BOM'lu). Türkçede noktalı virgül ayraçlı (Türkçe Excel doğrudan açar),
 * İngilizcede virgül ayraçlı ve noktalı ondalık.
 */
export function transactionsCSV(data: Data, lang: Lang = 'tr'): string {
  const T = translator(lang);
  const acc = accountIndex(data);
  const cats = new Map(data.categories.map((c) => [c.id, c]));
  const txById = new Map(data.txs.map((t) => [t.id, t]));
  // Altın/döviz işlemi varsa miktar, birim ve birim fiyat sütunları eklenir (yoksa CSV eskisiyle aynı).
  const withQty = data.txs.some((t) => t.qty !== undefined);
  const qtyCell = (q: number) => (lang === 'en' ? String(q) : String(q).replace('.', ','));
  const unitCell = (u: AssetUnit | undefined) => (u ? T(`asset.unit.${u}`) : '');
  const header = [T('csv.date'), T('csv.type'), T('csv.amount'), T('csv.account'), T('csv.toAccount'), T('csv.category'), T('csv.note'), T('csv.planned'), T('csv.tags'), ...(withQty ? [T('csv.qty'), T('csv.unit'), T('csv.unitPrice')] : [])];
  const rows = [...data.txs]
    .sort((a, b) => (a.date === b.date ? a.seq - b.seq : a.date < b.date ? -1 : 1))
    .map((t) => {
      const catId = t.type === 'refund' ? refundCategory(t, txById) : t.categoryId;
      return [
        t.date,
        txTypeLabel(t, data, lang),
        csvAmount(t.amount, lang),
        acc.get(t.accountId)?.name ?? '',
        t.toAccountId ? acc.get(t.toAccountId)?.name ?? '' : '',
        catId ? (cats.get(catId) ? categoryName(cats.get(catId)!, lang) : '') : '',
        t.note ?? '',
        t.planRef ? T('csv.yes') : '',
        (t.tags ?? []).join(', '),
        ...(withQty ? [t.qty !== undefined ? qtyCell(t.qty) : '', unitCell(t.unit), t.unitPrice !== undefined ? csvAmount(t.unitPrice, lang) : ''] : []),
      ];
    });
  return csvRows([header, ...rows], lang);
}

export function valuationsCSV(data: Data, lang: Lang = 'tr'): string {
  const T = translator(lang);
  const acc = accountIndex(data);
  const rows = [...data.valuations]
    .sort((a, b) => (a.date === b.date ? a.seq - b.seq : a.date < b.date ? -1 : 1))
    .map((v) => [v.date, acc.get(v.accountId)?.name ?? '', csvAmount(v.value, lang), v.note ?? '']);
  return csvRows([[T('csv.date'), T('csv.invAccount'), T('csv.value'), T('csv.note')], ...rows], lang);
}
