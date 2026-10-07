/**
 * Uygulamadaki olayları maskot'a ileten basit yayın kanalı.
 * Ekranlar kayıttan sonra `mascotEvent(...)` çağırır; canlı maskot bileşenleri dinleyip tepki verir.
 * Tepki görseldir; duygu (mood) hâlâ yalnızca kayıtlardan, domain/mood.ts kurallarıyla belirlenir.
 */
export type MascotEvent =
  | { type: 'expense'; categoryId?: string; amount: number; note?: string }
  | { type: 'income'; categoryId?: string; amount: number }
  | { type: 'refund'; amount: number }
  | { type: 'transfer'; amount: number }
  | { type: 'invest'; amount: number }
  | { type: 'withdraw'; amount: number }
  | { type: 'debt'; amount: number }
  | { type: 'valuation' }
  | { type: 'plan-confirmed'; kind: 'expense' | 'income' | 'transfer'; amount: number }
  | { type: 'goal-reached'; title: string }
  | { type: 'hide-totals'; hidden: boolean }
  | { type: 'deleted' }
  | { type: 'undo' };

type L = (e: MascotEvent) => void;
const listeners = new Set<L>();

export function mascotEvent(e: MascotEvent) {
  listeners.forEach((l) => l(e));
}
export function onMascotEvent(l: L) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}
