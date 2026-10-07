/**
 * Tamamlanma halkaları: gerçek ilerlemenin kapanan döngüler olarak gösterimi.
 * Puan/rozet/seri yok; değerler mevcut defter işlevlerinden (budgetStatus, goalProgress) türetilir.
 * Veri olmayan halka üretilmez.
 */
import type { Data } from './types';
import type { Money } from './money';
import type { ISODate } from './dates';
import { monthOf } from './dates';
import { budgetStatus, compareMonth, goalProgress } from './ledger';

export type RingKind = 'elapsed' | 'budget' | 'goal';

export interface Ring {
  kind: RingKind;
  /** 0..1 (halka doluluğu; aşımda 1'de kalır). */
  value: number;
  /** Tam sayı yüzde (aşımda 100'ü geçebilir). */
  pct: number;
  /** Sakin durum değişimi: 'over' = bütçe aşıldı, 'done' = hedefe ulaşıldı. */
  state: 'normal' | 'over' | 'done';
  /** Gösterilecek başlık verisi (tutarlar; arayüz gizlilik ayarına göre kullanır). */
  amount?: Money;
  of?: Money;
  /** Hedef halkası için hedef adı. */
  title?: string;
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

export function ringValues(data: Data, today: ISODate): Ring[] {
  const month = monthOf(today);
  const rings: Ring[] = [];
  const b = budgetStatus(data, month, today);
  if (b.budget !== null && b.budget > 0) {
    const over = b.spent > b.budget;
    rings.push({
      kind: 'budget',
      value: clamp01(b.spent / b.budget),
      pct: Math.round((b.spent / b.budget) * 100),
      state: over ? 'over' : 'normal',
      amount: b.spent,
      of: b.budget,
    });
  }
  // En yakın (tamamlanmamış, en yüksek yüzdeli) hedef; hepsi tamamsa ilki.
  const goals = data.goals.map((g) => goalProgress(data, g)).filter((g): g is NonNullable<typeof g> => g !== null && g.goal.target > 0);
  const open = goals.filter((g) => !g.reached).sort((x, y) => y.pct - x.pct)[0];
  const g = open ?? goals[0];
  if (g) {
    rings.push({
      kind: 'goal',
      value: clamp01(g.current / g.goal.target),
      pct: g.pct,
      state: g.reached ? 'done' : 'normal',
      amount: g.current,
      of: g.goal.target,
      title: g.goal.title,
    });
  }
  // Ay ilerlemesi yalnız bir ilerleme halkasıyla birlikte, tempo referansı olarak anlamlıdır.
  if (rings.length > 0) {
    rings.unshift({ kind: 'elapsed', value: clamp01(b.elapsedPct / 100), pct: b.elapsedPct, state: 'normal' });
  }
  return rings;
}

export interface Improvement {
  /** Geçen ayın aynı noktasına göre daha az harcanan tutar. */
  lessBy: Money;
  /** Geçen ayın aynı noktasındaki harcama. */
  previous: Money;
  current: Money;
}

/**
 * Ay içindeki gerçek iyileşme: bu ay, geçen ayın aynı gününe göre belirgin biçimde az harcandıysa.
 * Karşılaştırma anlamlı değilse (kayıt/kapsam yoksa), ayın ilk haftasında ya da fark küçükse null.
 */
export function spendingImprovement(data: Data, today: ISODate): Improvement | null {
  const month = monthOf(today);
  if (Number(today.slice(8, 10)) < 8) return null;
  const c = compareMonth(data, month, today);
  if (!c.meaningful || !c.partial) return null;
  const less = c.previous.spending - c.current.spending;
  // Anlamlı fark: en az %10 ve önceki harcamanın küçük bir kısmından fazla.
  if (c.previous.spending <= 0 || less <= 0 || less / c.previous.spending < 0.1) return null;
  return { lessBy: less, previous: c.previous.spending, current: c.current.spending };
}
