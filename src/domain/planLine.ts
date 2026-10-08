/**
 * Harcama planı çizgisi: dönem başındaki günlük bakiyeden, kullanıcının "ay sonunda en az şu kadar kalsın"
 * dediği tutara (settings.monthEndFloor) inen hedef çizgi. Saf fonksiyonlar; arayüz tutarı kendisi hesaplamaz.
 *
 * Esnek (planlı olmayan) harcama dönem boyunca doğrusal dağıtılır; planlı ödemeler ve beklenen gelirler
 * (dönemdeki plan vadeleri, bekleyen ya da gerçekleşmiş) vade günlerinde BASAMAK olarak uygulanır.
 * Böylece kira günü kullanıcı "planın altında" görünmez.
 *
 *   hedef(d) = başlangıç − esnekPay × geçenOran(d) − planlıNetÇıkış(≤ d)
 *   esnekPay = başlangıç − taban − dönemdekiPlanlıNetÇıkış   (negatifse 0: hedef ulaşılamaz)
 */
import type { Data, ID } from './types';
import type { Money } from './money';
import { addDays, diffDays, maxDate, monthEnd, monthOf, monthStart, type ISODate } from './dates';
import { accountIndex, balanceSeries, isDaily, occurrences, planIsInflow, type BalancePoint } from './ledger';

export interface PlanLine {
  /** Çizginin ilk günü (dönem başı ya da ilk günlük hesabın açıldığı gün). */
  from: ISODate;
  /** Dönemin son günü (tabana ulaşılması istenen gün). */
  to: ISODate;
  /** `from` gününün başındaki günlük bakiye. */
  start: Money;
  floor: Money;
  /** Dönemdeki planlı kalemlerin (ve dönem içinde açılan hesapların) günlük hesaplara net çıkışı; giriş ağırlıklıysa negatif. */
  plannedNetOut: Money;
  /** Esnek harcamaya ayrılan pay (≥ 0). */
  discretionary: Money;
  /** false: planlı kalemlerden sonra bile taban başlangıçtan yüksek; çizgi düz tutulur. */
  reachable: boolean;
  /** Her günün sonundaki hedef bakiye (`from`..`to`). */
  points: BalancePoint[];
}

/**
 * Plan çizgisinin dönemi. Aylık modda takvim ayı; 30 günlük modda ilk günlük hesabın açılışından itibaren
 * art arda gelen 30 günlük dilimler (kayan pencere her gün kayacağı için çizgi anlamsızlaşırdı).
 */
export function planPeriod(data: Data, today: ISODate): { from: ISODate; to: ISODate } | null {
  const daily = data.accounts.filter(isDaily);
  if (daily.length === 0) return null;
  const first = daily.map((a) => a.openingDate).reduce((a, b) => (a < b ? a : b));
  if (first > today) return null;
  if (data.settings.periodMode === 'days30') {
    const k = Math.floor(diffDays(today, first) / 30);
    const from = addDays(first, k * 30);
    return { from, to: addDays(from, 29) };
  }
  const m = monthOf(today);
  return { from: maxDate(monthStart(m), first), to: monthEnd(m) };
}

/** Planlı kalemin günlük hesaplara etkisi (+ giriş, − çıkış). */
function dailyEffect(kind: 'expense' | 'income' | 'transfer', from: ID, to: ID | undefined, amount: Money, ids: Set<ID>): Money {
  let e = 0;
  if (kind === 'expense' && ids.has(from)) e -= amount;
  if (kind === 'income' && ids.has(from)) e += amount;
  if (kind === 'transfer') {
    if (ids.has(from)) e -= amount;
    if (to && ids.has(to)) e += amount;
  }
  return e;
}

/** Bugünkü dönem için plan çizgisi. Taban tanımlı değilse ya da günlük hesap yoksa null. */
export function planLine(data: Data, today: ISODate, floor: Money | null = data.settings.monthEndFloor ?? null): PlanLine | null {
  if (floor === null || floor < 0) return null;
  const period = planPeriod(data, today);
  if (!period) return null;
  const { from, to } = period;
  const daily = data.accounts.filter(isDaily);
  const ids = new Set(daily.map((a) => a.id));

  // `from` gününün başı: önceki günün sonu + o gün açılan hesapların açılış bakiyesi.
  const prev = balanceSeries(data, addDays(from, -1), addDays(from, -1))[0]?.balance ?? 0;
  const start = prev + daily.filter((a) => a.openingDate === from).reduce((s, a) => s + a.openingBalance, 0);

  // Basamaklar: dönemdeki plan vadeleri (atlananlar hariç) ve dönem içinde sonradan açılan hesaplar.
  const steps = new Map<ISODate, Money>();
  const addStep = (d: ISODate, v: Money) => v && steps.set(d, (steps.get(d) ?? 0) + v);
  for (const o of occurrences(data, from, to)) {
    if (o.status === 'skipped') continue;
    // Gerçekleşen kalem bakiyeyi işlem gününde değiştirir; basamak da o güne (dönem içine sıkıştırılarak) konur.
    const day = o.status === 'done' && o.tx ? (o.tx.date < from ? from : o.tx.date > to ? to : o.tx.date) : o.due;
    addStep(day, dailyEffect(o.plan.kind, o.plan.accountId, o.plan.toAccountId, o.amount, ids));
  }
  for (const a of daily) if (a.openingDate > from && a.openingDate <= to) addStep(a.openingDate, a.openingBalance);

  const plannedNetOut = -[...steps.values()].reduce((s, v) => s + v, 0);
  const rawDisc = start - floor - plannedNetOut;
  const reachable = rawDisc >= 0;
  const discretionary = Math.max(rawDisc, 0);

  const n = diffDays(to, from) + 1;
  const points: BalancePoint[] = [];
  let stepSum = 0;
  for (let i = 0, d = from; i < n; i++, d = addDays(d, 1)) {
    stepSum += steps.get(d) ?? 0;
    // Hedefler tam liraya yuvarlanır (kuruşlu hedef sahte kesinlik olurdu); son gün tam olarak tabandır.
    const v = start - (discretionary * (i + 1)) / n + stepSum;
    points.push({ date: d, balance: i === n - 1 ? Math.round(v) : Math.round(v / 100) * 100 });
  }
  return { from, to, start, floor, plannedNetOut, discretionary, reachable, points };
}

export interface PlanGap {
  line: PlanLine;
  /** Bugünün sonu için hedef bakiye. */
  target: Money;
  /** Bugünkü gerçek günlük bakiye. */
  actual: Money;
  /** actual − target: pozitifse çizginin üstünde. */
  diff: Money;
  /** "Belirgin" sayılan fark: max(esnek payın %10'u, 250 TL). */
  threshold: Money;
  state: 'below' | 'on' | 'above';
}

export const PLAN_MIN_THRESHOLD: Money = 25000;

/** Bugün plan çizgisinin ne kadar üstünde/altında olunduğu. */
export function planGap(data: Data, today: ISODate): PlanGap | null {
  const line = planLine(data, today);
  if (!line) return null;
  const p = line.points.find((x) => x.date === today);
  if (!p) return null;
  const actual = balanceSeries(data, today, today)[0].balance;
  const diff = actual - p.balance;
  const threshold = Math.max(Math.round(Math.max(line.start - line.floor, 0) * 0.1), PLAN_MIN_THRESHOLD);
  return { line, target: p.balance, actual, diff, threshold, state: diff < -threshold ? 'below' : diff > threshold ? 'above' : 'on' };
}

/**
 * Taban düzenleyicisi için öneri: aylık bütçe varsa, dönem başı bakiye − bütçe − planlı yatırım aktarımları
 * + beklenen gelirler (≥ 0). Planlı giderler zaten bütçenin içinde olduğundan ikinci kez düşülmez.
 * Bütçe yoksa öneri yok.
 */
export function suggestedFloor(data: Data, today: ISODate): Money | null {
  const B = data.settings.monthlyBudget;
  if (B === null || B <= 0) return null;
  const line = planLine(data, today, 0);
  if (!line) return null;
  const accounts = accountIndex(data);
  const ids = new Set(data.accounts.filter(isDaily).map((a) => a.id));
  let net = 0;
  for (const o of occurrences(data, line.from, line.to)) {
    if (o.status === 'skipped') continue;
    if (o.plan.kind === 'transfer' || planIsInflow(o.plan, accounts)) net += dailyEffect(o.plan.kind, o.plan.accountId, o.plan.toAccountId, o.amount, ids);
  }
  // Yuvarlak bir öneri: 100 TL'ye aşağı yuvarlanır.
  return Math.max(Math.floor((line.start - B + net) / 10000) * 10000, 0);
}
