/**
 * Veriyi değiştiren tüm işlemler. Her fonksiyon yeni bir Data döndürür (değişmezlik);
 * geçersiz girişte ActionError fırlatır. Bakiye/rapor gibi türetilmiş değerler saklanmaz,
 * bu yüzden düzenleme ve silme her şeyi kendiliğinden tutarlı günceller.
 */
import type { Account, Category, Data, Goal, ID, Plan, PlanRef, Settings, Tx, TxType, Valuation } from './types';
import { isMoney, type Money } from './money';
import { isISODate, type ISODate } from './dates';
import { accountIndex, isDaily, isInvestment, occKey, occurrences } from './ledger';

export class ActionError extends Error {}
const fail = (msg: string): never => {
  throw new ActionError(msg);
};

export function newId(): ID {
  const c = globalThis.crypto as Crypto | undefined;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
}

const positive = (m: unknown, label = 'Tutar') => {
  if (!isMoney(m) || m <= 0) fail(`${label} sıfırdan büyük olmalı.`);
};

// ───────────────────────── İşlemler ─────────────────────────

export interface TxDraft {
  type: TxType;
  amount: Money;
  date: ISODate;
  accountId: ID;
  toAccountId?: ID;
  categoryId?: ID;
  note?: string;
  refundOf?: ID;
  planRef?: PlanRef;
}

export function validateTx(data: Data, d: TxDraft, today: ISODate, editingId?: ID): void {
  positive(d.amount);
  if (!isISODate(d.date)) fail('Geçerli bir tarih seç.');
  if (d.date > today) fail('Gelecek tarihli kayıt girilemez. Yaklaşan ödemeler için plan ekleyebilirsin.');
  const accounts = accountIndex(data);
  const acc = accounts.get(d.accountId) ?? fail('Bir hesap seç.');
  const existing = editingId ? data.txs.find((t) => t.id === editingId) : undefined;
  if (editingId && !existing) fail('Kayıt bulunamadı.');
  if (acc.archived && existing?.accountId !== acc.id) fail(`"${acc.name}" arşivde; başka bir hesap seç.`);
  if (d.date < acc.openingDate) fail(`"${acc.name}" ${acc.openingDate} tarihinden itibaren takip ediliyor; daha eski kayıt girilemez.`);

  if (d.type === 'transfer') {
    const to = accounts.get(d.toAccountId ?? '') ?? fail('Paranın gideceği hesabı seç.');
    if (to.id === acc.id) fail('Kaynak ve hedef hesap aynı olamaz.');
    if (to.archived && existing?.toAccountId !== to.id) fail(`"${to.name}" arşivde; başka bir hesap seç.`);
    if (isInvestment(acc) && isInvestment(to)) fail('İki yatırım hesabı arasında aktarım desteklenmiyor.');
    if (d.date < to.openingDate) fail(`"${to.name}" ${to.openingDate} tarihinden itibaren takip ediliyor.`);
    if (d.categoryId || d.refundOf) fail('Transferin kategorisi olmaz.');
  } else {
    if (!isDaily(acc)) fail('Yatırım hesabıyla yalnızca aktarım yapılabilir; gelir ve gider günlük hesaplardan girilir.');
    const cat = data.categories.find((c) => c.id === d.categoryId) ?? fail('Bir kategori seç.');
    const wantKind = d.type === 'income' ? 'income' : 'expense';
    if (cat.kind !== wantKind) fail('Kategori türü işlem türüyle uyuşmuyor.');
  }

  if (d.type === 'refund') {
    const orig = data.txs.find((t) => t.id === d.refundOf);
    if (d.refundOf === editingId) fail('Bir kayıt kendisinin iadesi olamaz.');
    if (!orig || orig.type !== 'expense') fail('İade, var olan bir gidere bağlanmalı.');
    if (d.date < orig!.date) fail('İade tarihi, giderin tarihinden önce olamaz.');
    const others = data.txs
      .filter((t) => t.type === 'refund' && t.refundOf === d.refundOf && t.id !== editingId)
      .reduce((a, t) => a + t.amount, 0);
    if (others + d.amount > orig!.amount) fail('Toplam iade, giderin tutarını geçemez.');
  } else if (d.refundOf) fail('Yalnızca iade bir gidere bağlanabilir.');

  if (existing && existing.type === 'expense') {
    const refunded = data.txs.filter((t) => t.type === 'refund' && t.refundOf === existing.id).reduce((a, t) => a + t.amount, 0);
    if (refunded > 0 && d.type !== 'expense') fail('Bu gidere bağlı iade var; türü değiştirilemez.');
    if (refunded > d.amount) fail('Tutar, bu gidere yapılmış iadelerin toplamından az olamaz.');
    const firstRefund = data.txs.filter((t) => t.type === 'refund' && t.refundOf === existing.id).map((t) => t.date).sort()[0];
    if (firstRefund && d.date > firstRefund) fail('Bu giderin iadesi daha önceki bir tarihte; gider tarihi iadeden sonra olamaz.');
  }

  if (d.planRef) {
    const plan = data.plans.find((p) => p.id === d.planRef!.planId);
    if (plan) {
      const key = occKey(plan, d.planRef.due);
      const clash = data.txs.find((t) => t.id !== editingId && t.planRef && t.planRef.planId === plan.id && occKey(plan, t.planRef.due) === key);
      if (clash) fail('Bu planlı kalem zaten gerçekleşmiş olarak işaretli.');
      const kindOk = plan.kind === d.type;
      if (!kindOk) fail('Plan türü işlem türüyle uyuşmuyor.');
    } else if (!existing?.planRef) fail('Plan bulunamadı.');
  }
}

function cleanDraft(d: TxDraft): TxDraft {
  const out: TxDraft = { type: d.type, amount: d.amount, date: d.date, accountId: d.accountId };
  if (d.type === 'transfer') out.toAccountId = d.toAccountId;
  else out.categoryId = d.categoryId;
  if (d.type === 'refund') out.refundOf = d.refundOf;
  const note = d.note?.trim();
  if (note) out.note = note.slice(0, 200);
  if (d.planRef) out.planRef = { ...d.planRef };
  return out;
}

export function addTx(data: Data, draft: TxDraft, today: ISODate, now = Date.now()): { data: Data; tx: Tx } {
  validateTx(data, draft, today);
  const d = cleanDraft(draft);
  // İadenin kategorisi her zaman bağlı olduğu gidere uyar.
  if (d.type === 'refund') d.categoryId = data.txs.find((t) => t.id === d.refundOf)!.categoryId;
  const tx: Tx = { id: newId(), seq: data.nextSeq, createdAt: now, ...d };
  const lastAccountId = d.type === 'transfer' || !isDaily(data.accounts.find((a) => a.id === d.accountId)) ? data.settings.lastAccountId : d.accountId;
  return {
    data: { ...data, txs: [...data.txs, tx], nextSeq: data.nextSeq + 1, settings: { ...data.settings, lastAccountId } },
    tx,
  };
}

export function updateTx(data: Data, id: ID, draft: TxDraft, today: ISODate): Data {
  validateTx(data, draft, today, id);
  const old = data.txs.find((t) => t.id === id)!;
  const d = cleanDraft(draft);
  if (d.type === 'refund') d.categoryId = data.txs.find((t) => t.id === d.refundOf)!.categoryId;
  // Sıra (seq) korunur: aynı günlü değerleme ile ilişkisi düzenlemeyle değişmez.
  const tx: Tx = { id: old.id, seq: old.seq, createdAt: old.createdAt, ...d };
  return { ...data, txs: data.txs.map((t) => (t.id === id ? tx : t)) };
}

/** İşlemi siler; bir gider siliniyorsa ona bağlı iadeler de silinir. Silinenleri de döndürür (geri alma için). */
export function deleteTx(data: Data, id: ID): { data: Data; removed: Tx[] } {
  const removed = data.txs.filter((t) => t.id === id || (t.type === 'refund' && t.refundOf === id));
  if (!removed.some((t) => t.id === id)) fail('Kayıt bulunamadı.');
  const ids = new Set(removed.map((t) => t.id));
  return { data: { ...data, txs: data.txs.filter((t) => !ids.has(t.id)) }, removed };
}

// ───────────────────────── Hesaplar ─────────────────────────

export interface AccountDraft {
  name: string;
  kind: Account['kind'];
  openingBalance: Money;
  openingDate: ISODate;
  priorContribution?: Money | null;
}

function validateAccount(data: Data, d: AccountDraft, editing?: Account) {
  const name = d.name.trim();
  if (!name) fail('Hesaba bir ad ver.');
  if (data.accounts.some((a) => a.id !== editing?.id && a.name.toLocaleLowerCase('tr') === name.toLocaleLowerCase('tr')))
    fail('Bu adda bir hesap zaten var.');
  if (!isMoney(d.openingBalance)) fail('Başlangıç bakiyesi geçersiz.');
  if (d.kind === 'investment' && d.openingBalance < 0) fail('Yatırım değeri negatif olamaz.');
  if (!isISODate(d.openingDate)) fail('Başlangıç tarihi geçersiz.');
  if (d.priorContribution != null && (!isMoney(d.priorContribution) || d.priorContribution < 0))
    fail('Önceki katkı geçersiz.');
}

export function addAccount(data: Data, d: AccountDraft, now = Date.now()): { data: Data; account: Account } {
  validateAccount(data, d);
  const account: Account = {
    id: newId(),
    name: d.name.trim(),
    kind: d.kind,
    openingBalance: d.openingBalance,
    openingDate: d.openingDate,
    createdAt: now,
  };
  if (d.kind === 'investment') account.priorContribution = d.priorContribution ?? null;
  const settings = !data.settings.lastAccountId && d.kind !== 'investment' ? { ...data.settings, lastAccountId: account.id } : data.settings;
  return { data: { ...data, accounts: [...data.accounts, account], settings }, account };
}

/** Hesabın kayıtlarındaki en erken tarih (işlem, değerleme veya plan). */
function earliestUse(data: Data, id: ID): ISODate | null {
  const dates = [
    ...data.txs.filter((t) => t.accountId === id || t.toAccountId === id).map((t) => t.date),
    ...data.valuations.filter((v) => v.accountId === id).map((v) => v.date),
  ];
  return dates.length ? dates.reduce((a, b) => (a < b ? a : b)) : null;
}

export function isAccountUsed(data: Data, id: ID): boolean {
  return (
    data.txs.some((t) => t.accountId === id || t.toAccountId === id) ||
    data.valuations.some((v) => v.accountId === id) ||
    data.plans.some((p) => p.accountId === id || p.toAccountId === id) ||
    data.goals.some((g) => g.accountId === id)
  );
}

export function updateAccount(data: Data, id: ID, d: AccountDraft): Data {
  const acc = data.accounts.find((a) => a.id === id) ?? fail('Hesap bulunamadı.');
  validateAccount(data, d, acc);
  if (d.kind !== acc.kind && isAccountUsed(data, id))
    fail('Kaydı olan bir hesabın türü değiştirilemez; geçmiş raporlar bozulurdu.');
  const first = earliestUse(data, id);
  if (first && d.openingDate > first) fail(`Bu hesapta ${first} tarihli kayıt var; başlangıç tarihi bundan sonra olamaz.`);
  const next: Account = { ...acc, name: d.name.trim(), kind: d.kind, openingBalance: d.openingBalance, openingDate: d.openingDate };
  if (d.kind === 'investment') next.priorContribution = d.priorContribution ?? null;
  else delete next.priorContribution;
  return { ...data, accounts: data.accounts.map((a) => (a.id === id ? next : a)) };
}

export function setAccountArchived(data: Data, id: ID, archived: boolean): Data {
  const settings = archived && data.settings.lastAccountId === id ? { ...data.settings, lastAccountId: null } : data.settings;
  return { ...data, settings, accounts: data.accounts.map((a) => (a.id === id ? { ...a, archived } : a)) };
}

export function deleteAccount(data: Data, id: ID): Data {
  if (isAccountUsed(data, id)) fail('Bu hesabın kayıtları var. Silmek yerine arşivleyebilirsin.');
  const settings = data.settings.lastAccountId === id ? { ...data.settings, lastAccountId: null } : data.settings;
  return { ...data, settings, accounts: data.accounts.filter((a) => a.id !== id) };
}

// ───────────────────────── Yatırım değerlemesi ─────────────────────────

export function addValuation(data: Data, v: { accountId: ID; date: ISODate; value: Money; note?: string }, today: ISODate, now = Date.now()) {
  const acc = data.accounts.find((a) => a.id === v.accountId);
  if (!acc || acc.kind !== 'investment') fail('Değer yalnızca yatırım hesabı için girilir.');
  if (!isMoney(v.value) || v.value < 0) fail('Değer negatif olamaz.');
  if (!isISODate(v.date) || v.date > today) fail('Değer tarihi bugünden sonra olamaz.');
  if (v.date < acc!.openingDate) fail('Değer tarihi hesabın takip başlangıcından önce olamaz.');
  const val: Valuation = { id: newId(), seq: data.nextSeq, accountId: v.accountId, date: v.date, value: v.value, createdAt: now };
  if (v.note?.trim()) val.note = v.note.trim().slice(0, 200);
  return { data: { ...data, valuations: [...data.valuations, val], nextSeq: data.nextSeq + 1 }, valuation: val };
}

export function deleteValuation(data: Data, id: ID): Data {
  return { ...data, valuations: data.valuations.filter((v) => v.id !== id) };
}

// ───────────────────────── Planlar ─────────────────────────

export type PlanDraft = Omit<Plan, 'id' | 'skipped' | 'createdAt'>;

function validatePlan(data: Data, d: PlanDraft) {
  if (!d.title.trim()) fail('Plana bir ad ver.');
  positive(d.amount);
  if (!isISODate(d.startDate)) fail('Geçerli bir tarih seç.');
  if (d.endDate && (!isISODate(d.endDate) || d.endDate < d.startDate)) fail('Bitiş tarihi başlangıçtan önce olamaz.');
  const accounts = accountIndex(data);
  const acc = accounts.get(d.accountId) ?? fail('Bir hesap seç.');
  if (d.kind === 'transfer') {
    const to = accounts.get(d.toAccountId ?? '') ?? fail('Hedef hesabı seç.');
    if (to.id === acc.id) fail('Kaynak ve hedef hesap aynı olamaz.');
    if (isInvestment(acc) && isInvestment(to)) fail('İki yatırım hesabı arasında aktarım desteklenmiyor.');
  } else {
    if (!isDaily(acc)) fail('Planlı gelir ve ödemeler günlük hesaplardan yapılır.');
    const cat = data.categories.find((c) => c.id === d.categoryId) ?? fail('Bir kategori seç.');
    if (cat.kind !== d.kind) fail('Kategori türü plan türüyle uyuşmuyor.');
  }
}

function cleanPlan(d: PlanDraft): PlanDraft {
  const out: PlanDraft = { kind: d.kind, title: d.title.trim().slice(0, 60), amount: d.amount, accountId: d.accountId, freq: d.freq, startDate: d.startDate };
  if (d.kind === 'transfer') out.toAccountId = d.toAccountId;
  else out.categoryId = d.categoryId;
  if (d.endDate && d.freq !== 'once') out.endDate = d.endDate;
  return out;
}

export function addPlan(data: Data, d: PlanDraft, now = Date.now()): { data: Data; plan: Plan } {
  validatePlan(data, d);
  const plan: Plan = { id: newId(), skipped: [], createdAt: now, ...cleanPlan(d) };
  return { data: { ...data, plans: [...data.plans, plan] }, plan };
}

export function planHasHistory(data: Data, id: ID): boolean {
  return data.txs.some((t) => t.planRef?.planId === id);
}

export function updatePlan(data: Data, id: ID, d: PlanDraft): Data {
  const old = data.plans.find((p) => p.id === id) ?? fail('Plan bulunamadı.');
  validatePlan(data, d);
  if (planHasHistory(data, id) && (d.freq !== old.freq || d.kind !== old.kind))
    fail('Gerçekleşmiş kaydı olan planın türü ve sıklığı değiştirilemez. Bunu bitirip yeni plan oluşturabilirsin.');
  const plan: Plan = { id, skipped: old.skipped, createdAt: old.createdAt, ...cleanPlan(d) };
  return { ...data, plans: data.plans.map((p) => (p.id === id ? plan : p)) };
}

/** Planı siler. Gerçekleşmiş işlemler gerçek kayıt olarak kalır. */
export function deletePlan(data: Data, id: ID): Data {
  return { ...data, plans: data.plans.filter((p) => p.id !== id) };
}

export function skipOccurrence(data: Data, planId: ID, due: ISODate, skip = true): Data {
  return {
    ...data,
    plans: data.plans.map((p) => {
      if (p.id !== planId) return p;
      // Dönem anahtarıyla eşleştir: plan günü sonradan değişse de atlama geri alınabilsin.
      const rest = p.skipped.filter((d) => occKey(p, d) !== occKey(p, due));
      return { ...p, skipped: skip ? [...rest, due] : rest };
    }),
  };
}

/**
 * Planlı bir kalemin gerçekleştiğini kaydeder: gerçek bir işlem oluşturur.
 * Tutar ve tarih düzeltilebilir. Vade artık bekleyen sayılmaz, böylece iki kez düşülmez.
 */
export function confirmOccurrence(
  data: Data,
  planId: ID,
  due: ISODate,
  over: { amount?: Money; date?: ISODate; accountId?: ID; note?: string },
  today: ISODate,
  now = Date.now(),
) {
  const plan = data.plans.find((p) => p.id === planId) ?? fail('Plan bulunamadı.');
  const occ = occurrences(data, due, due, [plan]).find((o) => o.due === due);
  if (!occ) fail('Bu tarihte planlı kalem yok.');
  if (occ!.status === 'done') fail('Bu kalem zaten gerçekleşmiş.');
  const draft: TxDraft = {
    type: plan.kind,
    amount: over.amount ?? plan.amount,
    date: over.date ?? (due <= today ? due : today),
    accountId: over.accountId ?? plan.accountId,
    note: over.note ?? plan.title,
    planRef: { planId, due },
  };
  if (plan.kind === 'transfer') draft.toAccountId = plan.toAccountId;
  else draft.categoryId = plan.categoryId;
  let next = occ!.status === 'skipped' ? skipOccurrence(data, planId, due, false) : data;
  // Atlanmış vade, başka bir tarihle kaydedilmiş olabilir; dönem anahtarına göre temizle.
  next = { ...next, plans: next.plans.map((p) => (p.id === planId ? { ...p, skipped: p.skipped.filter((d) => occKey(p, d) !== occKey(p, due)) } : p)) };
  return addTx(next, draft, today, now);
}

// ───────────────────────── Hedefler ─────────────────────────

export function addGoal(data: Data, d: { title: string; target: Money; accountId: ID }, now = Date.now()) {
  if (!d.title.trim()) fail('Hedefe bir ad ver.');
  positive(d.target, 'Hedef tutarı');
  if (!isInvestment(data.accounts.find((a) => a.id === d.accountId))) fail('Hedef bir yatırım hesabına bağlanır.');
  const goal: Goal = { id: newId(), title: d.title.trim().slice(0, 60), target: d.target, accountId: d.accountId, createdAt: now };
  return { data: { ...data, goals: [...data.goals, goal] }, goal };
}
export function updateGoal(data: Data, id: ID, d: { title: string; target: Money }): Data {
  if (!d.title.trim()) fail('Hedefe bir ad ver.');
  positive(d.target, 'Hedef tutarı');
  return { ...data, goals: data.goals.map((g) => (g.id === id ? { ...g, title: d.title.trim().slice(0, 60), target: d.target } : g)) };
}
export function deleteGoal(data: Data, id: ID): Data {
  return { ...data, goals: data.goals.filter((g) => g.id !== id) };
}

// ───────────────────────── Kategoriler ─────────────────────────

export function addCategory(data: Data, d: Omit<Category, 'id'>): { data: Data; category: Category } {
  const name = d.name.trim();
  if (!name) fail('Kategoriye bir ad ver.');
  if (data.categories.some((c) => !c.archived && c.kind === d.kind && c.name.toLocaleLowerCase('tr') === name.toLocaleLowerCase('tr')))
    fail('Bu adda bir kategori zaten var.');
  if (d.limit != null) positive(d.limit, 'Limit');
  const category: Category = { ...d, name: name.slice(0, 40), id: newId() };
  return { data: { ...data, categories: [...data.categories, category] }, category };
}

export function updateCategory(data: Data, id: ID, patch: Partial<Pick<Category, 'name' | 'icon' | 'color' | 'limit' | 'archived'>>): Data {
  const cat = data.categories.find((c) => c.id === id) ?? fail('Kategori bulunamadı.');
  if (patch.name !== undefined) {
    const name = patch.name.trim();
    if (!name) fail('Kategoriye bir ad ver.');
    if (data.categories.some((c) => c.id !== id && !c.archived && c.kind === cat.kind && c.name.toLocaleLowerCase('tr') === name.toLocaleLowerCase('tr')))
      fail('Bu adda bir kategori zaten var.');
    patch = { ...patch, name: name.slice(0, 40) };
  }
  if (patch.limit != null) positive(patch.limit, 'Limit');
  return { ...data, categories: data.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)) };
}

export const isCategoryUsed = (data: Data, id: ID) =>
  data.txs.some((t) => t.categoryId === id) || data.plans.some((p) => p.categoryId === id);

/** Kullanılmayan kategori silinir; kullanılan kategori raporlar bozulmasın diye arşivlenir. */
export function removeCategory(data: Data, id: ID): Data {
  if (isCategoryUsed(data, id)) return updateCategory(data, id, { archived: true });
  return { ...data, categories: data.categories.filter((c) => c.id !== id) };
}

// ───────────────────────── Ayarlar ─────────────────────────

export function updateSettings(data: Data, patch: Partial<Settings>): Data {
  if (patch.monthlyBudget != null && (!isMoney(patch.monthlyBudget) || patch.monthlyBudget <= 0)) fail('Bütçe sıfırdan büyük olmalı.');
  if (patch.reserve !== undefined && (!isMoney(patch.reserve) || patch.reserve < 0)) fail('Birikim payı negatif olamaz.');
  return { ...data, settings: { ...data.settings, ...patch } };
}
