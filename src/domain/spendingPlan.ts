/**
 * Harcama eğrisi ve harcama planı (bakiye tabanlı eski plan çizgisinin yerine).
 *
 * Harcama = tüketim harcaması: giderler − iadeler ("Bu ay harcama" ile aynı tanım, ledger.rangeSummary).
 * Yatırım aktarımları, hesaplar arası transferler ve borç hareketleri harcama DEĞİLDİR; bu yüzden yatırıma
 * para atmak eğriyi yükseltmez (bakiye tabanlı çizgide düşürüyordu).
 *
 * Plan çizgisi dönem başında 0'dan başlar ve dönem sonunda harcama hakkına (allowance) ulaşır:
 *   plan(d) = esnekPay × geçenGün(d) / dönemGünü + planlıGiderler(≤ d)
 *   esnekPay = harcamaHakkı − dönemdekiPlanlıGiderler   (negatifse 0)
 * Planlı giderler (kira vb.) vade gününde (gerçekleştiyse işlem gününde) BASAMAK olur; bütçe temposu
 * (ledger.budgetStatus) da planlı ödemeleri esnek bütçeden ayırır, yani "bütçe = planlı + esnek".
 *
 * Harcama hakkı:
 *  1. Aylık bütçe varsa → bütçe (planlı ödemeler dahil; budgetStatus ile aynı). Takip ayın ortasında
 *     başladıysa esnek pay, ayın kapsanan günlerine oranlanır.
 *  2. Yoksa ay sonu tabanı (settings.monthEndFloor) varsa →
 *     dönem başı günlük bakiye + dönemdeki beklenen gelirler − planlı yatırım aktarımları − taban (≥ 0).
 *     (Dönem içinde açılan günlük hesapların açılış bakiyesi de başlangıca eklenir.)
 *  3. İkisi de yoksa plan yok (yalnız eğri; arayüz bütçe belirleme çağrısı gösterir).
 */
import type { Data } from './types';
import type { Money } from './money';
import { addDays, daysInMonth, diffDays, minDate, monthOf, type ISODate } from './dates';
import { accountIndex, balanceSeries, isDaily, occurrences, planIsInflow, planIsOutflow } from './ledger';
import { planPeriod } from './planLine';

export interface SpendPoint {
  date: ISODate;
  /** O günün sonuna kadarki toplam harcama (kuruş). */
  value: Money;
}

export interface SpendingPlan {
  from: ISODate;
  to: ISODate;
  /** Gerçekleşen birikimli harcama: `from`..min(bugün, `to`). */
  spending: SpendPoint[];
  /** null: bütçe ya da taban yok → plan çizgisi yok. */
  source: 'budget' | 'floor' | null;
  /** Dönemin toplam harcama hakkı (plan çizgisinin son değeri). */
  allowance: Money;
  /** Dönemdeki planlı giderler (atlananlar hariç; gerçekleşenler gerçek tutarıyla). */
  planned: Money;
  /** Günlere yayılan esnek pay (≥ 0). */
  discretionary: Money;
  /** false: planlı giderler harcama hakkını tek başına aşıyor. */
  reachable: boolean;
  /** Her günün sonundaki plan değeri (`from`..`to`); plan yoksa boş. */
  plan: SpendPoint[];
}

/** Günlük harcama farkları (giderler + , iadeler −) — rangeSummary.spending ile aynı tanım. */
function spendingByDay(data: Data, from: ISODate, to: ISODate): Map<ISODate, Money> {
  const m = new Map<ISODate, Money>();
  for (const t of data.txs) {
    if (t.date < from || t.date > to) continue;
    if (t.type === 'expense') m.set(t.date, (m.get(t.date) ?? 0) + t.amount);
    else if (t.type === 'refund') m.set(t.date, (m.get(t.date) ?? 0) - t.amount);
  }
  return m;
}

/** Bugünkü dönemin harcama eğrisi ve planı. Günlük hesap yoksa null. */
export function spendingPlan(data: Data, today: ISODate): SpendingPlan | null {
  const period = planPeriod(data, today);
  if (!period) return null;
  const { from, to } = period;

  const byDay = spendingByDay(data, from, to);
  const spending: SpendPoint[] = [];
  const last = minDate(today, to);
  let acc = 0;
  for (let d = from; d <= last; d = addDays(d, 1)) {
    acc += byDay.get(d) ?? 0;
    spending.push({ date: d, value: acc });
  }

  const accounts = accountIndex(data);
  const occ = occurrences(data, from, to).filter((o) => o.status !== 'skipped');
  // Planlı gider basamakları: vade günü; gerçekleştiyse işlem günü (dönem içine sıkıştırılarak).
  const steps = new Map<ISODate, Money>();
  let planned = 0;
  for (const o of occ) {
    if (o.plan.kind !== 'expense' || !o.amount) continue;
    const day = o.status === 'done' && o.tx ? (o.tx.date < from ? from : o.tx.date > to ? to : o.tx.date) : o.due;
    steps.set(day, (steps.get(day) ?? 0) + o.amount);
    planned += o.amount;
  }

  const n = diffDays(to, from) + 1;
  const B = data.settings.monthlyBudget;
  const floor = data.settings.monthEndFloor ?? null;
  let source: SpendingPlan['source'] = null;
  let allowance = 0;
  // Esnek payın tam dönemdeki gün sayısı (ay ortasında başlayan takipte oranlama için).
  let fullDays = n;
  if (B !== null && B > 0) {
    source = 'budget';
    allowance = B;
    if (data.settings.periodMode !== 'days30') fullDays = daysInMonth(monthOf(to));
  } else if (floor !== null && floor >= 0) {
    source = 'floor';
    const daily = data.accounts.filter(isDaily);
    const prev = balanceSeries(data, addDays(from, -1), addDays(from, -1))[0]?.balance ?? 0;
    const start = prev + daily.filter((a) => a.openingDate >= from && a.openingDate <= to).reduce((s, a) => s + a.openingBalance, 0);
    let inflow = 0, invest = 0;
    for (const o of occ) {
      if (planIsInflow(o.plan, accounts)) inflow += o.amount;
      else if (o.plan.kind === 'transfer' && planIsOutflow(o.plan, accounts)) invest += o.amount;
    }
    allowance = Math.max(start + inflow - invest - floor, 0);
  }
  if (source === null) return { from, to, spending, source, allowance: 0, planned, discretionary: 0, reachable: true, plan: [] };

  const rawDisc = allowance - planned;
  const reachable = rawDisc >= 0;
  const discretionary = Math.max(rawDisc, 0);
  const plan: SpendPoint[] = [];
  let stepSum = 0;
  for (let i = 0, d = from; i < n; i++, d = addDays(d, 1)) {
    stepSum += steps.get(d) ?? 0;
    const v = (discretionary * (i + 1)) / fullDays + stepSum;
    // Tam liraya yuvarlanır (kuruşlu hedef sahte kesinlik olurdu); son gün tam değer.
    plan.push({ date: d, value: i === n - 1 ? Math.round(v) : Math.round(v / 100) * 100 });
  }
  return { from, to, spending, source, allowance, planned, discretionary, reachable, plan };
}

export const SPEND_MIN_THRESHOLD: Money = 25000;

export interface SpendingGap {
  sp: SpendingPlan;
  /** Bugünün sonu için plan değeri. */
  target: Money;
  /** Bugüne kadarki gerçek harcama. */
  actual: Money;
  /** actual − target: pozitifse plandan FAZLA harcanmış. */
  diff: Money;
  /** "Belirgin" fark: max(harcama hakkının %10'u, 250 TL). */
  threshold: Money;
  state: 'over' | 'on' | 'under';
}

/** Bugün plana göre ne kadar fazla/az harcandığı. Plan yoksa null. */
export function spendingGap(data: Data, today: ISODate, sp: SpendingPlan | null = spendingPlan(data, today)): SpendingGap | null {
  if (!sp || sp.source === null) return null;
  const p = sp.plan.find((x) => x.date === today);
  const a = sp.spending[sp.spending.length - 1];
  if (!p || !a) return null;
  const diff = a.value - p.value;
  const threshold = Math.max(Math.round(sp.allowance * 0.1), SPEND_MIN_THRESHOLD);
  return { sp, target: p.value, actual: a.value, diff, threshold, state: diff > threshold ? 'over' : diff < -threshold ? 'under' : 'on' };
}
