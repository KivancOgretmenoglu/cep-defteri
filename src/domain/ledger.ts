/**
 * Tüm finansal hesaplamaların tek kaynağı. Saf fonksiyonlardır: aynı kayıtlar → aynı sonuç.
 * Arayüz hiçbir tutarı kendi hesaplamaz; buradan okur.
 */
import type { Account, Category, Data, Goal, ID, Plan, Tx, Valuation } from './types';
import { sum, type Money } from './money';
import {
  addDays, addMonths, dayInMonth, weekStart, dayOfMonth, daysInMonth, diffDays, inRange, monthEnd, monthOf, monthStart,
  type ISODate, type MonthKey,
} from './dates';

// ───────────────────────── Hesaplar ─────────────────────────

export const isDaily = (a: Account | undefined): boolean => !!a && a.kind !== 'investment';
export const isInvestment = (a: Account | undefined): boolean => !!a && a.kind === 'investment';

export function accountIndex(data: Data): Map<ID, Account> {
  return new Map(data.accounts.map((a) => [a.id, a]));
}

export type TransferKind = 'internal' | 'contribution' | 'withdrawal' | 'investment-internal';

/** Transferin anlamı, hesap türlerinden türetilir (tek doğruluk kaynağı). */
export function transferKind(tx: Tx, accounts: Map<ID, Account>): TransferKind {
  const from = accounts.get(tx.accountId);
  const to = accounts.get(tx.toAccountId ?? '');
  if (isDaily(from) && isInvestment(to)) return 'contribution';
  if (isInvestment(from) && isDaily(to)) return 'withdrawal';
  if (isInvestment(from) && isInvestment(to)) return 'investment-internal';
  return 'internal';
}

/** Bir işlemin bir hesabın nakit bakiyesine etkisi (kuruş, işaretli). */
export function txEffectOn(tx: Tx, accountId: ID): Money {
  switch (tx.type) {
    case 'income':
    case 'refund':
      return tx.accountId === accountId ? tx.amount : 0;
    case 'expense':
      return tx.accountId === accountId ? -tx.amount : 0;
    case 'transfer': {
      let e = 0;
      if (tx.accountId === accountId) e -= tx.amount;
      if (tx.toAccountId === accountId) e += tx.amount;
      return e;
    }
  }
}

/** Günlük (nakit/banka) hesabın güncel bakiyesi: açılış + tüm hareketler. */
export function cashBalance(data: Data, accountId: ID): Money {
  const acc = data.accounts.find((a) => a.id === accountId);
  if (!acc) return 0;
  return acc.openingBalance + sum(data.txs.map((t) => txEffectOn(t, accountId)));
}

/** Harcanabilir hesapların (nakit + banka) toplam bakiyesi. Yatırım hariç. */
export function dailyBalance(data: Data): Money {
  return sum(data.accounts.filter(isDaily).map((a) => cashBalance(data, a.id)));
}

// ───────────────────────── Yatırım ─────────────────────────

interface Point {
  date: ISODate;
  seq: number;
}
/** a, b'den sonra mı? (tarih, sonra oluşturulma sırası) */
const after = (a: Point, b: Point) => a.date > b.date || (a.date === b.date && a.seq > b.seq);

export interface ValuationPoint extends Point {
  value: Money;
  isOpening: boolean;
  id?: ID;
}

export interface InvestmentState {
  account: Account;
  /** Kayıt kapsamındaki toplam katkı (günlük hesaptan yatırıma). */
  contributed: Money;
  /** Kayıt kapsamındaki toplam çekim (yatırımdan günlük hesaba). */
  withdrawn: Money;
  /** contributed − withdrawn */
  netContribution: Money;
  /** Takipten önceki net katkı; null = bilinmiyor. */
  priorContribution: Money | null;
  /** Son değerleme (açılış değeri dahil). */
  lastValuation: ValuationPoint;
  /** Son değerlemeden sonra yapılan net para hareketi. */
  flowsSinceValuation: Money;
  /** Son değer + sonraki net hareket. Değerleme sonrasında hareket yoksa son değerin kendisi. */
  currentValue: Money;
  /** Katkı tabanı biliniyorsa (önceki katkı + net katkı). */
  basis: Money | null;
  /** currentValue − basis (taban biliniyorsa). Getiri oranı uydurulmaz. */
  valueDiff: Money | null;
  history: ValuationPoint[];
}

export function investmentState(data: Data, accountId: ID): InvestmentState | null {
  const accounts = accountIndex(data);
  const account = accounts.get(accountId);
  if (!account || account.kind !== 'investment') return null;

  const flows: { date: ISODate; seq: number; amount: Money }[] = [];
  let contributed = 0;
  let withdrawn = 0;
  for (const t of data.txs) {
    if (t.type !== 'transfer') continue;
    const kind = transferKind(t, accounts);
    if (t.toAccountId === accountId && kind === 'contribution') {
      contributed += t.amount;
      flows.push({ date: t.date, seq: t.seq, amount: t.amount });
    } else if (t.accountId === accountId && kind === 'withdrawal') {
      withdrawn += t.amount;
      flows.push({ date: t.date, seq: t.seq, amount: -t.amount });
    } else if (kind === 'investment-internal' && (t.accountId === accountId || t.toAccountId === accountId)) {
      flows.push({ date: t.date, seq: t.seq, amount: t.toAccountId === accountId ? t.amount : -t.amount });
    }
  }

  const opening: ValuationPoint = { date: account.openingDate, seq: 0, value: account.openingBalance, isOpening: true };
  const history: ValuationPoint[] = [
    opening,
    ...data.valuations
      .filter((v) => v.accountId === accountId)
      .map((v) => ({ date: v.date, seq: v.seq, value: v.value, isOpening: false, id: v.id })),
  ].sort((a, b) => (a.date === b.date ? a.seq - b.seq : a.date < b.date ? -1 : 1));
  const lastValuation = history[history.length - 1];
  const flowsSinceValuation = sum(flows.filter((f) => after(f, lastValuation)).map((f) => f.amount));
  const currentValue = lastValuation.value + flowsSinceValuation;

  // Açılış değeri 0 ise takip öncesi katkı da yok sayılabilir.
  const prior = account.priorContribution ?? (account.openingBalance === 0 ? 0 : null);
  const netContribution = contributed - withdrawn;
  const basis = prior === null ? null : prior + netContribution;
  return {
    account,
    contributed,
    withdrawn,
    netContribution,
    priorContribution: prior,
    lastValuation,
    flowsSinceValuation,
    currentValue,
    basis,
    valueDiff: basis === null ? null : currentValue - basis,
    history,
  };
}

export function investmentAccounts(data: Data): Account[] {
  return data.accounts.filter(isInvestment);
}

/** Tüm yatırım hesaplarının güncel değer toplamı. */
export function investmentTotal(data: Data): Money {
  return sum(investmentAccounts(data).map((a) => investmentState(data, a.id)?.currentValue ?? 0));
}

/** Bir değerlemenin, o hesap için hangi hareketleri kapsadığını açıklamak için: değerlemeden sonraki net akış. */
export function flowsAfter(data: Data, accountId: ID, v: Valuation): Money {
  const accounts = accountIndex(data);
  if (!isInvestment(accounts.get(accountId))) return 0;
  return sum(
    data.txs
      .filter((t) => t.type === 'transfer' && (t.accountId === accountId || t.toAccountId === accountId))
      .filter((t) => after(t, v))
      .map((t) => {
        const k = transferKind(t, accounts);
        if (k === 'internal') return 0;
        return t.toAccountId === accountId ? t.amount : -t.amount;
      }),
  );
}

// ───────────────────────── Dönem özetleri ─────────────────────────

/** İadenin ait olduğu kategori: bağlı olduğu giderin (güncel) kategorisi. */
export function refundCategory(tx: Tx, txById: Map<ID, Tx>): ID | undefined {
  if (tx.refundOf) {
    const orig = txById.get(tx.refundOf);
    if (orig) return orig.categoryId;
  }
  return tx.categoryId;
}

export interface RangeSummary {
  from: ISODate;
  to: ISODate;
  /** Gerçekleşmiş gelir (transfer, açılış bakiyesi, iade ve yatırımdan çekim hariç). */
  income: Money;
  incomeBySource: Map<ID, Money>;
  /** Tüketim harcaması = giderler − iadeler. Transfer ve yatırım katkısı hariç. */
  spending: Money;
  spendingByCategory: Map<ID, Money>;
  /** Bu aralıkta planlı ödemelere bağlı harcama (iadeleri düşülmüş). */
  plannedSpending: Money;
  refunds: Money;
  contributions: Money;
  withdrawals: Money;
  /** Aralıktaki gerçek kayıt sayısı (değerlemeler hariç). */
  txCount: number;
}

export function rangeSummary(data: Data, from: ISODate, to: ISODate): RangeSummary {
  const accounts = accountIndex(data);
  const txById = new Map(data.txs.map((t) => [t.id, t]));
  const incomeBySource = new Map<ID, Money>();
  const spendingByCategory = new Map<ID, Money>();
  const add = (m: Map<ID, Money>, k: ID | undefined, v: Money) => {
    const key = k ?? 'none';
    m.set(key, (m.get(key) ?? 0) + v);
  };
  let income = 0, spending = 0, plannedSpending = 0, refunds = 0, contributions = 0, withdrawals = 0, txCount = 0;
  for (const t of data.txs) {
    if (!inRange(t.date, from, to)) continue;
    txCount++;
    switch (t.type) {
      case 'income':
        income += t.amount;
        add(incomeBySource, t.categoryId, t.amount);
        break;
      case 'expense':
        spending += t.amount;
        add(spendingByCategory, t.categoryId, t.amount);
        if (t.planRef) plannedSpending += t.amount;
        break;
      case 'refund': {
        spending -= t.amount;
        refunds += t.amount;
        add(spendingByCategory, refundCategory(t, txById), -t.amount);
        const orig = t.refundOf ? txById.get(t.refundOf) : undefined;
        if (orig?.planRef) plannedSpending -= t.amount;
        break;
      }
      case 'transfer': {
        const k = transferKind(t, accounts);
        if (k === 'contribution') contributions += t.amount;
        else if (k === 'withdrawal') withdrawals += t.amount;
        break;
      }
    }
  }
  return { from, to, income, incomeBySource, spending, spendingByCategory, plannedSpending, refunds, contributions, withdrawals, txCount };
}

export const monthSummary = (data: Data, m: MonthKey) => rangeSummary(data, monthStart(m), monthEnd(m));

/** Takibin başladığı ilk gün (en erken hesap açılışı). Hesap yoksa null. */
export function trackingStart(data: Data): ISODate | null {
  if (data.accounts.length === 0) return null;
  return data.accounts.map((a) => a.openingDate).reduce((a, b) => (a < b ? a : b));
}

// ───────────────────────── Planlar ─────────────────────────

/** Bir planın [from, to] aralığına düşen vade tarihleri (başlangıç/bitiş dahil). */
export function planDueDates(plan: Plan, from: ISODate, to: ISODate): ISODate[] {
  const end = plan.endDate && plan.endDate < to ? plan.endDate : to;
  const out: ISODate[] = [];
  if (plan.startDate > end) return out;
  const push = (d: ISODate) => {
    if (d >= from && d <= end && d >= plan.startDate) out.push(d);
  };
  switch (plan.freq) {
    case 'once':
      push(plan.startDate);
      break;
    case 'weekly': {
      let d = plan.startDate;
      if (d < from) d = addDays(d, Math.floor(diffDays(from, d) / 7) * 7);
      for (; d <= end; d = addDays(d, 7)) push(d);
      break;
    }
    case 'monthly': {
      const day = dayOfMonth(plan.startDate);
      let m = monthOf(plan.startDate > from ? plan.startDate : from);
      for (let d = dayInMonth(m, day); d <= end; m = addMonths(m, 1), d = dayInMonth(m, day)) push(d);
      break;
    }
    case 'yearly': {
      const md = plan.startDate.slice(5, 7);
      const day = dayOfMonth(plan.startDate);
      let y = Number((plan.startDate > from ? plan.startDate : from).slice(0, 4));
      for (let d = dayInMonth(`${y}-${md}`, day); d <= end; y++, d = dayInMonth(`${y}-${md}`, day)) push(d);
      break;
    }
  }
  return out;
}

export type OccStatus = 'pending' | 'done' | 'skipped';

export interface Occurrence {
  plan: Plan;
  due: ISODate;
  /** Bekleyen için planlanan tutar; gerçekleşen için gerçek işlemin tutarı. */
  amount: Money;
  status: OccStatus;
  tx?: Tx;
}

/**
 * Bir vadenin dönem anahtarı. Gerçekleşme ve atlama bu anahtarla eşleşir; böylece planın günü
 * sonradan değişse bile (5'i → 10'u) aynı ayın ödemesi iki kez beklenmez.
 */
export function periodKey(freq: Plan['freq'], due: ISODate): string {
  switch (freq) {
    case 'once':
      return 'once';
    case 'weekly':
      return weekStart(due);
    case 'monthly':
      return monthOf(due);
    case 'yearly':
      return due.slice(0, 4);
  }
}
export const occKey = (plan: Plan, due: ISODate) => `${plan.id}|${periodKey(plan.freq, due)}`;

/** Planların [from, to] aralığındaki vadeleri ve durumları. Gerçekleşme, planRef taşıyan işlemden türetilir. */
export function occurrences(data: Data, from: ISODate, to: ISODate, plans: Plan[] = data.plans): Occurrence[] {
  const planById = new Map(data.plans.map((p) => [p.id, p]));
  const doneTx = new Map<string, Tx>();
  for (const t of data.txs) {
    const p = t.planRef && planById.get(t.planRef.planId);
    if (p) doneTx.set(occKey(p, t.planRef!.due), t);
  }
  const out: Occurrence[] = [];
  for (const plan of plans) {
    const skipped = new Set(plan.skipped.map((d) => periodKey(plan.freq, d)));
    for (const due of planDueDates(plan, from, to)) {
      const tx = doneTx.get(occKey(plan, due));
      if (tx) out.push({ plan, due, amount: tx.amount, status: 'done', tx });
      else if (skipped.has(periodKey(plan.freq, due))) out.push({ plan, due, amount: 0, status: 'skipped' });
      else out.push({ plan, due, amount: plan.amount, status: 'pending' });
    }
  }
  return out.sort((a, b) => (a.due === b.due ? a.plan.title.localeCompare(b.plan.title, 'tr') : a.due < b.due ? -1 : 1));
}

/** Plan, günlük hesaplardan para çıkışı mı (ayrılması gereken tutar)? */
export function planIsOutflow(plan: Plan, accounts: Map<ID, Account>): boolean {
  if (plan.kind === 'expense') return true;
  if (plan.kind === 'transfer') return isDaily(accounts.get(plan.accountId)) && isInvestment(accounts.get(plan.toAccountId ?? ''));
  return false;
}
/** Plan, günlük hesaplara beklenen para girişi mi? */
export function planIsInflow(plan: Plan, accounts: Map<ID, Account>): boolean {
  if (plan.kind === 'income') return true;
  if (plan.kind === 'transfer') return isInvestment(accounts.get(plan.accountId)) && isDaily(accounts.get(plan.toAccountId ?? ''));
  return false;
}

/** Tüm bekleyen vadeler (en eski plan başlangıcından verilen tarihe kadar). */
export function pendingUntil(data: Data, to: ISODate): Occurrence[] {
  if (data.plans.length === 0) return [];
  const from = data.plans.map((p) => p.startDate).reduce((a, b) => (a < b ? a : b));
  return occurrences(data, from, to).filter((o) => o.status === 'pending');
}

// ───────────────────────── Kullanılabilir para ─────────────────────────

export interface Availability {
  dailyBalance: Money;
  periodEnd: ISODate;
  daysLeft: number;
  /** Dönem sonuna kadar (gecikmişler dahil) bekleyen ödemeler. */
  payments: Occurrence[];
  paymentsTotal: Money;
  /** Dönem sonuna kadar bekleyen planlı yatırım aktarımları. */
  transfers: Occurrence[];
  transfersTotal: Money;
  /** Hesapta tutulan birikim payı. */
  reserve: Money;
  /** dailyBalance − ödemeler − planlı aktarımlar − birikim payı */
  available: Money;
  /** Bilgi amaçlı: dönem içinde beklenen ama henüz gelmemiş para. Hesaba katılmaz. */
  expected: Occurrence[];
  expectedTotal: Money;
  perDay: Money;
  /** none: hesap yok; partial: plan girilmemiş (tutar eksik olabilir); ok */
  confidence: 'none' | 'partial' | 'ok';
}

export function periodEndFor(data: Data, today: ISODate): ISODate {
  return data.settings.periodMode === 'days30' ? addDays(today, 29) : monthEnd(monthOf(today));
}

export function availability(data: Data, today: ISODate): Availability {
  const accounts = accountIndex(data);
  const periodEnd = periodEndFor(data, today);
  const pend = pendingUntil(data, periodEnd);
  const payments = pend.filter((o) => o.plan.kind === 'expense');
  const transfers = pend.filter((o) => o.plan.kind === 'transfer' && planIsOutflow(o.plan, accounts));
  const expected = pend.filter((o) => planIsInflow(o.plan, accounts));
  const balance = dailyBalance(data);
  const paymentsTotal = sum(payments.map((o) => o.amount));
  const transfersTotal = sum(transfers.map((o) => o.amount));
  const reserve = data.settings.reserve;
  const available = balance - paymentsTotal - transfersTotal - reserve;
  const daysLeft = diffDays(periodEnd, today) + 1;
  const hasDaily = data.accounts.some(isDaily);
  return {
    dailyBalance: balance,
    periodEnd,
    daysLeft,
    payments,
    paymentsTotal,
    transfers,
    transfersTotal,
    reserve,
    available,
    expected,
    expectedTotal: sum(expected.map((o) => o.amount)),
    perDay: available > 0 ? Math.floor(available / daysLeft) : 0,
    confidence: !hasDaily ? 'none' : data.plans.length === 0 ? 'partial' : 'ok',
  };
}

/** Önümüzdeki n gün içindeki (bugün dahil) ve gecikmiş bekleyen çıkışlar. */
export function upcomingOutflows(data: Data, today: ISODate, days = 7) {
  const accounts = accountIndex(data);
  const items = pendingUntil(data, addDays(today, days - 1)).filter((o) => planIsOutflow(o.plan, accounts));
  return {
    items,
    total: sum(items.map((o) => o.amount)),
    overdue: items.filter((o) => o.due < today),
  };
}

// ───────────────────────── Bütçe ─────────────────────────

export type BudgetState =
  | 'none' // bütçe tanımlı değil: yargı yok
  | 'on-track' // esnek harcama ayın akışına uygun
  | 'watch' // biraz önde
  | 'tight' // belirgin şekilde önde ya da esnek pay aşıldı
  | 'over' // toplam bütçe aşıldı
  | 'planned-full' // planlı ödemeler bütçenin tamamını kaplıyor (bilgi)
  | 'closed-within' // geçmiş ay, bütçe içinde kaldı
  | 'future';

export interface CategoryLimitStatus {
  category: Category;
  limit: Money;
  used: Money;
  pct: number;
  level: 'ok' | 'near' | 'over';
}

export interface BudgetStatus {
  month: MonthKey;
  budget: Money | null;
  /** Ayın toplam tüketim harcaması (iadeler düşülmüş). */
  spent: Money;
  /** Planlı ödemelere bağlı gerçekleşen harcama. */
  plannedSpent: Money;
  /** Bu ay vadesi gelen ama henüz ödenmemiş planlı ödemeler. */
  plannedPending: Money;
  /** Planlı olmayan (esnek) harcama. */
  flexibleSpent: Money;
  /** Bütçe − planlı ödemeler (ödenen + bekleyen). */
  flexibleBudget: Money | null;
  /** Bütçe − harcanan − bekleyen planlı ödemeler. */
  remaining: Money | null;
  usedPct: number | null;
  flexUsedPct: number | null;
  /** Ayın geçen kısmı (%) */
  elapsedPct: number;
  state: BudgetState;
  categories: CategoryLimitStatus[];
}

export function budgetStatus(data: Data, month: MonthKey, today: ISODate): BudgetStatus {
  const s = monthSummary(data, month);
  const current = monthOf(today);
  const isCurrent = month === current;
  const elapsedPct = isCurrent ? Math.round((dayOfMonth(today) / daysInMonth(month)) * 100) : month < current ? 100 : 0;
  const accounts = accountIndex(data);
  const plannedPending =
    month >= current
      ? sum(
          occurrences(data, monthStart(month), monthEnd(month))
            .filter((o) => o.status === 'pending' && o.plan.kind === 'expense' && planIsOutflow(o.plan, accounts))
            .map((o) => o.amount),
        )
      : 0;
  const plannedSpent = s.plannedSpending;
  const flexibleSpent = s.spending - plannedSpent;

  const categories: CategoryLimitStatus[] = data.categories
    .filter((c) => c.kind === 'expense' && c.limit && c.limit > 0 && !c.archived)
    .map((c) => {
      const used = s.spendingByCategory.get(c.id) ?? 0;
      const pct = Math.round((used / (c.limit as Money)) * 100);
      return { category: c, limit: c.limit as Money, used, pct, level: pct >= 100 ? 'over' : pct >= 70 ? 'near' : 'ok' };
    });

  const B = data.settings.monthlyBudget;
  if (B === null || B <= 0) {
    return {
      month, budget: null, spent: s.spending, plannedSpent, plannedPending, flexibleSpent,
      flexibleBudget: null, remaining: null, usedPct: null, flexUsedPct: null, elapsedPct, state: 'none', categories,
    };
  }
  const flexibleBudget = B - plannedSpent - plannedPending;
  const remaining = B - s.spending - plannedPending;
  const usedPct = Math.round((s.spending / B) * 100);
  const flexUsedPct = flexibleBudget > 0 ? Math.round((Math.max(flexibleSpent, 0) / flexibleBudget) * 100) : null;
  let state: BudgetState;
  // Planlı ödemeler bütçeyi tek başına dolduruyorsa bu bir aşım değil, bilgidir.
  if (month > current) state = 'future';
  else if (flexibleBudget <= 0) state = 'planned-full';
  else if (s.spending > B) state = 'over';
  else if (!isCurrent) state = 'closed-within';
  else if ((flexUsedPct ?? 0) > 100) state = 'tight';
  else {
    const lead = (flexUsedPct ?? 0) - elapsedPct;
    state = lead <= 10 ? 'on-track' : lead <= 25 ? 'watch' : 'tight';
  }
  return {
    month, budget: B, spent: s.spending, plannedSpent, plannedPending, flexibleSpent,
    flexibleBudget, remaining, usedPct, flexUsedPct, elapsedPct, state, categories,
  };
}

// ───────────────────────── Hedefler ─────────────────────────

export interface GoalProgress {
  goal: Goal;
  current: Money;
  pct: number;
  reached: boolean;
  /** Hedefe en son ulaşıldığı (eşiği yukarı geçtiği) tarih. */
  reachedAt: ISODate | null;
  /** Takip öncesi katkı bilinmiyorsa yalnız kayıtlı katkı sayılır. */
  priorKnown: boolean;
}

export function goalProgress(data: Data, goal: Goal): GoalProgress | null {
  const st = investmentState(data, goal.accountId);
  if (!st) return null;
  const accounts = accountIndex(data);
  const base = st.priorContribution ?? 0;
  const flows = data.txs
    .filter((t) => t.type === 'transfer')
    .map((t) => {
      const k = transferKind(t, accounts);
      if (k === 'contribution' && t.toAccountId === goal.accountId) return { t, a: t.amount };
      if (k === 'withdrawal' && t.accountId === goal.accountId) return { t, a: -t.amount };
      return null;
    })
    .filter((x): x is { t: Tx; a: Money } => x !== null)
    .sort((x, y) => (x.t.date === y.t.date ? x.t.seq - y.t.seq : x.t.date < y.t.date ? -1 : 1));
  let running = base;
  // Takip öncesi katkıyla zaten ulaşılmışsa kutlanacak yeni bir an yoktur.
  let reachedAt: ISODate | null = null;
  for (const f of flows) {
    const before = running;
    running += f.a;
    if (before < goal.target && running >= goal.target) reachedAt = f.t.date;
  }
  const reached = running >= goal.target;
  return {
    goal,
    current: running,
    pct: goal.target > 0 ? Math.min(100, Math.round((Math.max(running, 0) / goal.target) * 100)) : 100,
    reached,
    reachedAt: reached ? reachedAt : null,
    priorKnown: st.priorContribution !== null,
  };
}

// ───────────────────────── Karşılaştırma ─────────────────────────

export interface Comparison {
  current: RangeSummary;
  previous: RangeSummary;
  /** Devam eden ay, önceki ayın aynı gün aralığıyla karşılaştırılır. */
  partial: boolean;
  /** Önceki dönemin tamamı takip kapsamında mı? Değilse sonuç çıkarılmaz. */
  previousComplete: boolean;
  /** Karşılaştırma anlamlı mı (iki dönemde de kayıt var ve önceki dönem tam)? */
  meaningful: boolean;
}

export function compareMonth(data: Data, month: MonthKey, today: ISODate): Comparison {
  const prev = addMonths(month, -1);
  const isCurrent = month === monthOf(today);
  let curTo = monthEnd(month);
  let prevTo = monthEnd(prev);
  if (isCurrent) {
    curTo = today;
    const d = dayOfMonth(today);
    prevTo = dayInMonth(prev, d);
    // Bugün ayın son günüyse önceki ayın da tamamı alınır (31 Eki ↔ 30 Eyl).
    if (d === daysInMonth(month)) prevTo = monthEnd(prev);
  }
  const current = rangeSummary(data, monthStart(month), curTo);
  const previous = rangeSummary(data, monthStart(prev), prevTo);
  const start = trackingStart(data);
  const previousComplete = start !== null && start <= monthStart(prev);
  return {
    current,
    previous,
    partial: isCurrent,
    previousComplete,
    meaningful: previousComplete && current.txCount > 0 && previous.txCount > 0,
  };
}

/** Son n ayın özetleri (eskiden yeniye). */
export function monthTrend(data: Data, endMonth: MonthKey, n: number) {
  const start = trackingStart(data);
  return Array.from({ length: n }, (_, i) => {
    const m = addMonths(endMonth, i - (n - 1));
    const tracked = start !== null && start <= monthEnd(m);
    return { month: m, tracked, partialTracking: tracked && start! > monthStart(m), summary: monthSummary(data, m) };
  });
}
