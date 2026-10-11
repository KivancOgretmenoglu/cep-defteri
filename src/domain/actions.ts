/**
 * Veriyi değiştiren tüm işlemler. Her fonksiyon yeni bir Data döndürür (değişmezlik);
 * geçersiz girişte ActionError fırlatır. Bakiye/rapor gibi türetilmiş değerler saklanmaz,
 * bu yüzden düzenleme ve silme her şeyi kendiliğinden tutarlı günceller.
 */
import type { Account, Category, Data, Goal, ID, Lang, Plan, PlanRef, Settings, Tx, TxType, Valuation } from './types';
import { translate, type Key, type Vars } from '../i18n/core';
import { isMoney, type Money } from './money';
import { isISODate, type ISODate } from './dates';
import { accountIndex, assetOverdraft, assetQuantities, availableQty, cashBalance, installmentEnd, isDaily, isInvestment, isPerson, occKey, occurrences } from './ledger';
import { addDays } from './dates';
import { isAssetLot, isAssetUnit, isQty, roundQty, unitOrder, valueOf, type AssetLot, type AssetUnit } from './assets';

/**
 * Doğrulama hatası. Mesaj bir sözlük anahtarı + değişkenler olarak taşınır; arayüz sınırında
 * `localize(lang)` ile seçili dile çevrilir. `message` Türkçedir (günlükler ve testler için).
 */
export class ActionError extends Error {
  readonly key: Key;
  readonly vars?: Vars;
  constructor(key: Key, vars?: Vars) {
    super(translate('tr', key, vars));
    this.key = key;
    this.vars = vars;
  }
  localize(lang: Lang): string {
    return translate(lang, this.key, this.vars);
  }
}
const fail = (key: Key, vars?: Vars): never => {
  throw new ActionError(key, vars);
};

export function newId(): ID {
  const c = globalThis.crypto as Crypto | undefined;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
}

const positive = (m: unknown, label: Key = 'err.amountPositive') => {
  if (!isMoney(m) || m <= 0) fail(label);
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
  tags?: string[];
  /** Altın/döviz hesabı transferinde alınan/satılan birim, miktar ve birim fiyat (zorunlu). */
  unit?: AssetUnit;
  qty?: number;
  unitPrice?: Money;
}

/** Transferin altın/döviz tutan yatırım tarafı (varsa). */
export function assetSideOf(data: Data, d: { type: TxType; accountId: ID; toAccountId?: ID }): Account | undefined {
  if (d.type !== 'transfer') return undefined;
  const accounts = accountIndex(data);
  const to = accounts.get(d.toAccountId ?? '');
  const from = accounts.get(d.accountId);
  if (to?.kind === 'investment' && to.asset) return to;
  if (from?.kind === 'investment' && from.asset) return from;
  return undefined;
}

/** Varlık hesabındaki bir birimin güncel miktarı (isteğe bağlı olarak bir işlem hariç). */
export function heldQty(data: Data, account: Account, unit: AssetUnit, exceptTxId?: ID): number {
  return assetQuantities(data, account, exceptTxId).get(unit) ?? 0;
}

/** Bu değişiklikten sonra varlık hesaplarından birinde, bir anda, elde olandan fazlası satılmış olur mu? */
function overdraws(next: Data, accountIds: (ID | undefined)[]): boolean {
  const accounts = accountIndex(next);
  return accountIds.some((id) => {
    const a = id ? accounts.get(id) : undefined;
    return !!a?.asset && !!assetOverdraft(next, a);
  });
}

/** Etiketleri temizler: küçük harf, baştaki # yok, boşluk tekil, en fazla 5 etiket × 24 karakter. */
export function normalizeTags(tags: string[] | undefined): string[] {
  const out: string[] = [];
  for (const raw of tags ?? []) {
    const t = raw.trim().replace(/^#+/, '').replace(/\s+/g, ' ').toLocaleLowerCase('tr').slice(0, 24);
    if (t && !out.includes(t)) out.push(t);
    if (out.length >= 5) break;
  }
  return out;
}

export function validateTx(data: Data, d: TxDraft, today: ISODate, editingId?: ID): void {
  positive(d.amount);
  if (!isISODate(d.date)) fail('err.validDate');
  if (d.date > today) fail('err.futureDate');
  const accounts = accountIndex(data);
  const acc = accounts.get(d.accountId) ?? fail('err.pickAccount');
  const existing = editingId ? data.txs.find((t) => t.id === editingId) : undefined;
  if (editingId && !existing) fail('err.txNotFound');
  if (acc.archived && existing?.accountId !== acc.id) fail('err.accountArchived', { name: acc.name });
  if (d.date < acc.openingDate) fail('err.beforeOpening', { name: acc.name, date: acc.openingDate });

  if (d.type === 'transfer') {
    const to = accounts.get(d.toAccountId ?? '') ?? fail('err.pickToAccount');
    if (to.id === acc.id) fail('err.sameAccount');
    if (to.archived && existing?.toAccountId !== to.id) fail('err.accountArchived', { name: to.name });
    if (isInvestment(acc) && isInvestment(to)) fail('err.invToInv');
    if ((isPerson(acc) || isPerson(to)) && (isInvestment(acc) || isInvestment(to))) fail('err.personInv');
    if (isPerson(acc) && isPerson(to)) fail('err.personPerson');
    if (d.date < to.openingDate) fail('err.toBeforeOpening', { name: to.name, date: to.openingDate });
    if (d.categoryId || d.refundOf) fail('err.transferNoCat');
    const asset = assetSideOf(data, d);
    if (asset) {
      if (!isAssetUnit(d.unit)) fail('err.assetUnit');
      if (!isQty(d.qty)) fail('err.assetQty');
      if (!isMoney(d.unitPrice) || d.unitPrice! <= 0) fail('err.assetPrice');
      if (asset.id === d.accountId) {
        // Çekim: o tarihte (ve sonraki çekimleri karşılıksız bırakmadan) o birimden elde olan kadar.
        const held = availableQty(data, asset, d.unit!, { date: d.date, seq: existing?.seq ?? data.nextSeq }, editingId);
        if (roundQty(d.qty!, d.unit!) > held) fail('err.assetTooMuch', { held: String(held) });
      }
    }
  } else {
    // "Başkası ödedi": gider bir kişinin hesabından girilebilir (sen ona borçlanırsın).
    if (!isDaily(acc) && !(d.type === 'expense' && isPerson(acc)))
      fail(isPerson(acc) ? 'err.personOnlyExpense' : 'err.invOnlyTransfer');
    const cat = data.categories.find((c) => c.id === d.categoryId) ?? fail('err.pickCategory');
    const wantKind = d.type === 'income' ? 'income' : 'expense';
    if (cat.kind !== wantKind) fail('err.catKindTx');
  }

  if (d.type === 'refund') {
    const orig = data.txs.find((t) => t.id === d.refundOf);
    if (d.refundOf === editingId) fail('err.refundSelf');
    if (!orig || orig.type !== 'expense') fail('err.refundNeedsExpense');
    if (d.date < orig!.date) fail('err.refundBeforeExpense');
    const others = data.txs
      .filter((t) => t.type === 'refund' && t.refundOf === d.refundOf && t.id !== editingId)
      .reduce((a, t) => a + t.amount, 0);
    if (others + d.amount > orig!.amount) fail('err.refundTooMuch');
  } else if (d.refundOf) fail('err.onlyRefundLinks');

  if (existing && existing.type === 'expense') {
    const refunded = data.txs.filter((t) => t.type === 'refund' && t.refundOf === existing.id).reduce((a, t) => a + t.amount, 0);
    if (refunded > 0 && d.type !== 'expense') fail('err.hasRefundType');
    if (refunded > d.amount) fail('err.amountBelowRefunds');
    const firstRefund = data.txs.filter((t) => t.type === 'refund' && t.refundOf === existing.id).map((t) => t.date).sort()[0];
    if (firstRefund && d.date > firstRefund) fail('err.expenseAfterRefund');
  }

  // Katkıyı küçültmek/silmek ya da birimini değiştirmek sonraki bir çekimi karşılıksız bırakamaz.
  const oldAsset = existing ? assetSideOf(data, existing) : undefined;
  const newAsset = assetSideOf(data, d);
  if (oldAsset || newAsset) {
    const sim: Tx = { id: editingId ?? '\u0000new', seq: existing?.seq ?? data.nextSeq, createdAt: 0, ...cleanDraft(d, data) };
    const next = { ...data, txs: [...data.txs.filter((t) => t.id !== editingId), sim] };
    if (overdraws(next, [oldAsset?.id, newAsset?.id])) fail('err.assetWouldOverdraw');
  }

  if (d.planRef) {
    const plan = data.plans.find((p) => p.id === d.planRef!.planId);
    if (plan) {
      const key = occKey(plan, d.planRef.due);
      const clash = data.txs.find((t) => t.id !== editingId && t.planRef && t.planRef.planId === plan.id && occKey(plan, t.planRef.due) === key);
      if (clash) fail('err.occAlreadyDone');
      const kindOk = plan.kind === d.type;
      if (!kindOk) fail('err.planKindTx');
    } else if (!existing?.planRef) fail('err.planNotFound');
  }
}

function cleanDraft(d: TxDraft, data: Data): TxDraft {
  const out: TxDraft = { type: d.type, amount: d.amount, date: d.date, accountId: d.accountId };
  if (d.type === 'transfer') out.toAccountId = d.toAccountId;
  const asset = assetSideOf(data, d);
  if (asset) {
    out.unit = d.unit;
    out.qty = d.unit && isQty(d.qty) ? roundQty(d.qty, d.unit) : d.qty;
    out.unitPrice = d.unitPrice;
  }
  else out.categoryId = d.categoryId;
  if (d.type === 'refund') out.refundOf = d.refundOf;
  const note = d.note?.trim();
  if (note) out.note = note.slice(0, 200);
  if (d.planRef) out.planRef = { ...d.planRef };
  const tags = normalizeTags(d.tags);
  if (tags.length) out.tags = tags;
  return out;
}

export function addTx(data: Data, draft: TxDraft, today: ISODate, now = Date.now()): { data: Data; tx: Tx } {
  validateTx(data, draft, today);
  const d = cleanDraft(draft, data);
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
  const d = cleanDraft(draft, data);
  if (d.type === 'refund') d.categoryId = data.txs.find((t) => t.id === d.refundOf)!.categoryId;
  // Sıra (seq) korunur: aynı günlü değerleme ile ilişkisi düzenlemeyle değişmez.
  const tx: Tx = { id: old.id, seq: old.seq, createdAt: old.createdAt, ...d };
  return { ...data, txs: data.txs.map((t) => (t.id === id ? tx : t)) };
}

/** İşlemi siler; bir gider siliniyorsa ona bağlı iadeler de silinir. Silinenleri de döndürür (geri alma için). */
export function deleteTx(data: Data, id: ID): { data: Data; removed: Tx[] } {
  const removed = data.txs.filter((t) => t.id === id || (t.type === 'refund' && t.refundOf === id));
  if (!removed.some((t) => t.id === id)) fail('err.txNotFound');
  const ids = new Set(removed.map((t) => t.id));
  const next = { ...data, txs: data.txs.filter((t) => !ids.has(t.id)) };
  // Altın/döviz alımı silinirse sonraki bir satış karşılıksız kalmamalı.
  if (overdraws(next, removed.map((t) => assetSideOf(data, t)?.id))) fail('err.assetWouldOverdraw');
  return { data: next, removed };
}

// ───────────────────────── Hesaplar ─────────────────────────

export interface AccountDraft {
  name: string;
  kind: Account['kind'];
  openingBalance: Money;
  openingDate: ISODate;
  priorContribution?: Money | null;
  /**
   * Yalnız yatırım: altın/döviz modu ve takip başlangıcındaki kalemler (birim başına miktar + o günkü
   * birim fiyat; boş olabilir). Yoksa/null ise TL hesabı. openingBalance kalemlerden hesaplanır.
   */
  asset?: { opening: AssetLot[] } | null;
}

/** Varlık hesabında açılış değeri Σ miktar × fiyattır; taslaktaki openingBalance yok sayılır. */
function assetFields(d: AccountDraft): Pick<Account, 'asset'> & { openingBalance: Money } | null {
  if (d.kind !== 'investment' || !d.asset) return null;
  const opening = d.asset.opening
    .map((l) => ({ unit: l.unit, qty: roundQty(l.qty, l.unit), price: l.price }))
    .filter((l) => l.qty > 0)
    .sort((a, b) => unitOrder(a.unit, b.unit));
  return { asset: { opening }, openingBalance: opening.reduce((s, l) => s + valueOf(l.qty, l.price), 0) };
}

function validateAccount(data: Data, d: AccountDraft, editing?: Account) {
  const name = d.name.trim();
  if (!name) fail('err.accountName');
  if (data.accounts.some((a) => a.id !== editing?.id && a.name.toLocaleLowerCase('tr') === name.toLocaleLowerCase('tr')))
    fail('err.accountExists');
  if (!isMoney(d.openingBalance)) fail('err.openingInvalid');
  if (d.kind === 'person' && !name) fail('err.personName');
  if (d.kind === 'investment' && d.openingBalance < 0) fail('err.invNegative');
  if (!isISODate(d.openingDate)) fail('err.startDateInvalid');
  if (d.priorContribution != null && (!isMoney(d.priorContribution) || d.priorContribution < 0))
    fail('err.priorInvalid');
  if (d.asset) {
    if (d.kind !== 'investment' || !Array.isArray(d.asset.opening)) fail('err.assetInvalid');
    for (const l of d.asset.opening) {
      if (!isAssetUnit(l.unit)) fail('err.assetInvalid');
      if (!isQty(l.qty)) fail('err.assetQty');
      if (!isMoney(l.price) || l.price <= 0) fail('err.assetPrice');
      if (!isAssetLot(l)) fail('err.assetInvalid');
    }
    if (new Set(d.asset.opening.map((l) => l.unit)).size !== d.asset.opening.length) fail('err.assetDupUnit');
  }
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
  const af = assetFields(d);
  if (af) Object.assign(account, af);
  const settings = !data.settings.lastAccountId && (d.kind === 'bank' || d.kind === 'cash') ? { ...data.settings, lastAccountId: account.id } : data.settings;
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
  const acc = data.accounts.find((a) => a.id === id) ?? fail('err.accountNotFound');
  validateAccount(data, d, acc);
  if (d.kind !== acc.kind && isAccountUsed(data, id))
    fail('err.accountKindLocked');
  const first = earliestUse(data, id);
  if (first && d.openingDate > first) fail('err.openingAfterUse', { date: first });
  // TL ↔ altın/döviz modu, kaydı olan hesapta değişemez (birimler ve açılış kalemleri değişebilir).
  const nextIsAsset = d.kind === 'investment' && !!d.asset;
  if (!!acc.asset !== nextIsAsset && (data.txs.some((t) => t.accountId === id || t.toAccountId === id) || data.valuations.some((v) => v.accountId === id)))
    fail('err.assetLocked');
  const next: Account = { ...acc, name: d.name.trim(), kind: d.kind, openingBalance: d.openingBalance, openingDate: d.openingDate };
  if (d.kind === 'investment') next.priorContribution = d.priorContribution ?? null;
  else delete next.priorContribution;
  delete next.asset;
  const af = assetFields(d);
  if (af) {
    Object.assign(next, af);
    if (assetOverdraft({ ...data, accounts: data.accounts.map((a) => (a.id === id ? next : a)) }, next)) fail('err.assetOpeningTooLow');
  }
  return { ...data, accounts: data.accounts.map((a) => (a.id === id ? next : a)) };
}

export function setAccountArchived(data: Data, id: ID, archived: boolean): Data {
  const settings = archived && data.settings.lastAccountId === id ? { ...data.settings, lastAccountId: null } : data.settings;
  return { ...data, settings, accounts: data.accounts.map((a) => (a.id === id ? { ...a, archived } : a)) };
}

export function deleteAccount(data: Data, id: ID): Data {
  if (isAccountUsed(data, id)) fail('err.accountUsed');
  const settings = data.settings.lastAccountId === id ? { ...data.settings, lastAccountId: null } : data.settings;
  return { ...data, settings, accounts: data.accounts.filter((a) => a.id !== id) };
}

/** Hesapla birlikte silinecek kayıtlar (yalnız yatırım ve kişi hesapları; günlük hesaplarda giderler de silineceği için yok). */
export interface AccountCascade {
  /** Silinecek işlemler: hesaba/hesaptan aktarımlar, hesabın kendi kayıtları ve bunlara bağlı iadeler. */
  txIds: Set<ID>;
  /** Bunların aktarım olanları (sayım için). */
  transfers: number;
  valuationIds: Set<ID>;
  planIds: Set<ID>;
  goalIds: Set<ID>;
  /** Günlük hesap kimliği → silmeden sonra bakiyesindeki değişim (yalnız sıfırdan farklı olanlar). */
  dailyEffects: { accountId: ID; delta: Money }[];
}

function cascadeSets(data: Data, id: ID) {
  const txIds = new Set(data.txs.filter((t) => t.accountId === id || t.toAccountId === id).map((t) => t.id));
  // Silinen bir gidere bağlı iadeler de gider (iade yalnız gidere bağlanır, zincir tek basamaklıdır).
  for (const t of data.txs) if (t.type === 'refund' && t.refundOf && txIds.has(t.refundOf)) txIds.add(t.id);
  const valuationIds = new Set(data.valuations.filter((v) => v.accountId === id).map((v) => v.id));
  const planIds = new Set(data.plans.filter((p) => p.accountId === id || p.toAccountId === id).map((p) => p.id));
  const goalIds = new Set(data.goals.filter((g) => g.accountId === id).map((g) => g.id));
  return { txIds, valuationIds, planIds, goalIds };
}

function applyCascade(data: Data, id: ID, s: ReturnType<typeof cascadeSets>): Data {
  const txs = data.txs
    .filter((t) => !s.txIds.has(t.id))
    .map((t) => {
      if (!t.planRef || !s.planIds.has(t.planRef.planId)) return t;
      const { planRef: _drop, ...rest } = t;
      return rest as Tx;
    });
  const settings = data.settings.lastAccountId === id ? { ...data.settings, lastAccountId: null } : data.settings;
  return {
    ...data,
    settings,
    accounts: data.accounts.filter((a) => a.id !== id),
    txs,
    valuations: data.valuations.filter((v) => !s.valuationIds.has(v.id)),
    plans: data.plans.filter((p) => !s.planIds.has(p.id)),
    goals: data.goals.filter((g) => !s.goalIds.has(g.id)),
  };
}

/** Silmeden önce kullanıcıya gösterilecek özet: kaç kayıt gider ve günlük hesap bakiyeleri nasıl değişir. */
export function accountCascadePreview(data: Data, id: ID): AccountCascade {
  const acc = data.accounts.find((a) => a.id === id) ?? fail('err.accountNotFound');
  if (isDaily(acc)) fail('accdel.err.daily');
  const s = cascadeSets(data, id);
  const after = applyCascade(data, id, s);
  const dailyEffects = data.accounts
    .filter(isDaily)
    .map((a) => ({ accountId: a.id, delta: cashBalance(after, a.id) - cashBalance(data, a.id) }))
    .filter((e) => e.delta !== 0);
  const transfers = data.txs.filter((t) => s.txIds.has(t.id) && t.type === 'transfer').length;
  return { ...s, transfers, dailyEffects };
}

/**
 * Yatırım ya da kişi hesabını tüm geçmişiyle siler: hesaba/hesaptan bütün işlemler (ve onlara bağlı iadeler),
 * değerlemeler, planlar ve hedefler. Silinen bir plana bağlı kalan işlemlerin plan bağı kaldırılır.
 * Günlük hesaplar için yoktur: onların geçmişi giderlerdir, arşivlenir.
 */
export function deleteAccountCascade(data: Data, id: ID): Data {
  const acc = data.accounts.find((a) => a.id === id) ?? fail('err.accountNotFound');
  if (isDaily(acc)) fail('accdel.err.daily');
  return applyCascade(data, id, cascadeSets(data, id));
}

// ───────────────────────── Yatırım değerlemesi ─────────────────────────

export function addValuation(data: Data, v: { accountId: ID; date: ISODate; value: Money; note?: string }, today: ISODate, now = Date.now()) {
  const acc = data.accounts.find((a) => a.id === v.accountId);
  if (!acc || acc.kind !== 'investment') fail('err.valuationOnlyInv');
  if (!isMoney(v.value) || v.value < 0) fail('err.valueNegative');
  if (!isISODate(v.date) || v.date > today) fail('err.valueFuture');
  if (v.date < acc!.openingDate) fail('err.valueBeforeStart');
  const val: Valuation = { id: newId(), seq: data.nextSeq, accountId: v.accountId, date: v.date, value: v.value, createdAt: now };
  if (v.note?.trim()) val.note = v.note.trim().slice(0, 200);
  return { data: { ...data, valuations: [...data.valuations, val], nextSeq: data.nextSeq + 1 }, valuation: val };
}

export function deleteValuation(data: Data, id: ID): Data {
  return { ...data, valuations: data.valuations.filter((v) => v.id !== id) };
}

// ───────────────────────── Planlar ─────────────────────────

export type PlanDraft = Omit<Plan, 'id' | 'skipped' | 'createdAt'>;

function validatePlan(data: Data, d: PlanDraft, old?: Plan) {
  if (!d.title.trim()) fail('err.planName');
  positive(d.amount);
  if (!isISODate(d.startDate)) fail('err.validDate');
  if (d.installments != null) {
    if (!Number.isInteger(d.installments) || d.installments < 2 || d.installments > 60) fail('err.installmentsRange');
    if (d.freq !== 'monthly' || d.kind !== 'expense') fail('err.installmentsMonthly');
  }
  // İptal edilmiş planın bitişi başlangıçtan önce olabilir (hiç vadesi kalmamış); yalnız bu değişmiyorsa kabul edilir.
  if (d.endDate && (!isISODate(d.endDate) || (d.endDate < d.startDate && !(old && old.endDate === d.endDate && old.startDate === d.startDate))))
    fail('err.endBeforeStart');
  const accounts = accountIndex(data);
  const acc = accounts.get(d.accountId) ?? fail('err.pickAccount');
  if (d.kind === 'transfer') {
    const to = accounts.get(d.toAccountId ?? '') ?? fail('err.pickTarget');
    if (to.id === acc.id) fail('err.sameAccount');
    if (isInvestment(acc) && isInvestment(to)) fail('err.invToInv');
    if (isPerson(acc) || isPerson(to)) fail('err.planPerson');
  } else {
    if (!isDaily(acc)) fail('err.planDaily');
    const cat = data.categories.find((c) => c.id === d.categoryId) ?? fail('err.pickCategory');
    if (cat.kind !== d.kind) fail('err.catKindPlan');
  }
}

function cleanPlan(d: PlanDraft): PlanDraft {
  const out: PlanDraft = { kind: d.kind, title: d.title.trim().slice(0, 60), amount: d.amount, accountId: d.accountId, freq: d.freq, startDate: d.startDate };
  if (d.kind === 'transfer') out.toAccountId = d.toAccountId;
  else out.categoryId = d.categoryId;
  if (d.freq === 'monthly' && d.kind === 'expense' && d.installments) {
    out.installments = d.installments;
    out.endDate = installmentEnd(d.startDate, d.installments);
  } else if (d.endDate && d.freq !== 'once') out.endDate = d.endDate;
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
  const old = data.plans.find((p) => p.id === id) ?? fail('err.planNotFound');
  validatePlan(data, d, old);
  if (planHasHistory(data, id) && (d.freq !== old.freq || d.kind !== old.kind))
    fail('err.planLocked');
  const plan: Plan = { id, skipped: old.skipped, createdAt: old.createdAt, ...cleanPlan(d) };
  // İptal edilmiş taksitli plan düzenlenince bitiş, taksit sayısından yeniden hesaplanıp iptali geri almasın.
  if (old.installments && old.endDate && plan.endDate && old.endDate < plan.endDate && old.startDate === plan.startDate && old.installments === plan.installments)
    plan.endDate = old.endDate;
  return { ...data, plans: data.plans.map((p) => (p.id === id ? plan : p)) };
}

/**
 * Planı belirtilen günden itibaren iptal eder: o gün ve sonrası vadeler oluşmaz.
 * Geçmişte gerçekleşenler ve raporlar korunur. İstenirse ondan önceki bekleyen (gecikmiş) vadeler de atlanır.
 */
export function cancelPlan(data: Data, id: ID, from: ISODate, skipEarlierPending = false): Data {
  const plan = data.plans.find((p) => p.id === id) ?? fail('err.planNotFound');
  if (!isISODate(from)) fail('err.validDate');
  let next: Data = { ...data, plans: data.plans.map((p) => (p.id === id ? { ...p, endDate: addDays(from, -1), installments: p.installments } : p)) };
  if (skipEarlierPending) {
    const pend = occurrences(next, plan.startDate, addDays(from, -1), [next.plans.find((p) => p.id === id)!]).filter((o) => o.status === 'pending');
    for (const o of pend) next = skipOccurrence(next, id, o.due, true);
  }
  return next;
}

/** İptal edilmiş/bitmiş bir planı belirtilen tarihten yeni bir plan olarak yeniden başlatır (eski geçmiş korunur). */
export function restartPlan(data: Data, id: ID, startDate: ISODate, now = Date.now()) {
  const p = data.plans.find((x) => x.id === id) ?? fail('err.planNotFound');
  return addPlan(data, { kind: p.kind, title: p.title, amount: p.amount, accountId: p.accountId, toAccountId: p.toAccountId, categoryId: p.categoryId, freq: p.freq, startDate }, now);
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
  over: { amount?: Money; date?: ISODate; accountId?: ID; note?: string; unit?: AssetUnit; qty?: number; unitPrice?: Money },
  today: ISODate,
  now = Date.now(),
) {
  const plan = data.plans.find((p) => p.id === planId) ?? fail('err.planNotFound');
  const occ = occurrences(data, due, due, [plan]).find((o) => o.due === due);
  if (!occ) fail('err.noOccurrence');
  if (occ!.status === 'done') fail('err.occDone');
  const draft: TxDraft = {
    type: plan.kind,
    amount: over.amount ?? plan.amount,
    date: over.date ?? (due <= today ? due : today),
    accountId: over.accountId ?? plan.accountId,
    note: over.note ?? plan.title,
    planRef: { planId, due },
  };
  if (plan.kind === 'transfer') {
    draft.toAccountId = plan.toAccountId;
    draft.unit = over.unit;
    draft.qty = over.qty;
    draft.unitPrice = over.unitPrice;
  }
  else draft.categoryId = plan.categoryId;
  let next = occ!.status === 'skipped' ? skipOccurrence(data, planId, due, false) : data;
  // Atlanmış vade, başka bir tarihle kaydedilmiş olabilir; dönem anahtarına göre temizle.
  next = { ...next, plans: next.plans.map((p) => (p.id === planId ? { ...p, skipped: p.skipped.filter((d) => occKey(p, d) !== occKey(p, due)) } : p)) };
  return addTx(next, draft, today, now);
}

// ───────────────────────── Hedefler ─────────────────────────

export function addGoal(data: Data, d: { title: string; target: Money; accountId: ID }, now = Date.now()) {
  if (!d.title.trim()) fail('err.goalName');
  positive(d.target, 'err.goalTargetPositive');
  if (!isInvestment(data.accounts.find((a) => a.id === d.accountId))) fail('err.goalInv');
  const goal: Goal = { id: newId(), title: d.title.trim().slice(0, 60), target: d.target, accountId: d.accountId, createdAt: now };
  return { data: { ...data, goals: [...data.goals, goal] }, goal };
}
export function updateGoal(data: Data, id: ID, d: { title: string; target: Money }): Data {
  if (!d.title.trim()) fail('err.goalName');
  positive(d.target, 'err.goalTargetPositive');
  return { ...data, goals: data.goals.map((g) => (g.id === id ? { ...g, title: d.title.trim().slice(0, 60), target: d.target } : g)) };
}
export function deleteGoal(data: Data, id: ID): Data {
  return { ...data, goals: data.goals.filter((g) => g.id !== id) };
}

// ───────────────────────── Kategoriler ─────────────────────────

export function addCategory(data: Data, d: Omit<Category, 'id'>): { data: Data; category: Category } {
  const name = d.name.trim();
  if (!name) fail('err.categoryName');
  if (data.categories.some((c) => !c.archived && c.kind === d.kind && c.name.toLocaleLowerCase('tr') === name.toLocaleLowerCase('tr')))
    fail('err.categoryExists');
  if (d.limit != null) positive(d.limit, 'err.limitPositive');
  const category: Category = { ...d, name: name.slice(0, 40), id: newId() };
  return { data: { ...data, categories: [...data.categories, category] }, category };
}

export function updateCategory(data: Data, id: ID, patch: Partial<Pick<Category, 'name' | 'icon' | 'color' | 'limit' | 'archived'>>): Data {
  const cat = data.categories.find((c) => c.id === id) ?? fail('err.categoryNotFound');
  if (patch.name !== undefined) {
    const name = patch.name.trim();
    if (!name) fail('err.categoryName');
    if (data.categories.some((c) => c.id !== id && !c.archived && c.kind === cat.kind && c.name.toLocaleLowerCase('tr') === name.toLocaleLowerCase('tr')))
      fail('err.categoryExists');
    patch = { ...patch, name: name.slice(0, 40) };
  }
  if (patch.limit != null) positive(patch.limit, 'err.limitPositive');
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
  if (patch.monthlyBudget != null && (!isMoney(patch.monthlyBudget) || patch.monthlyBudget <= 0)) fail('err.budgetPositive');
  if (patch.reserve !== undefined && (!isMoney(patch.reserve) || patch.reserve < 0)) fail('err.reserveNegative');
  if (patch.monthEndFloor != null && (!isMoney(patch.monthEndFloor) || patch.monthEndFloor < 0)) fail('err.floorNegative');
  return { ...data, settings: { ...data.settings, ...patch } };
}
