/**
 * Abonelik avcısı: her ay aşağı yukarı aynı gün, aynı tutarda tekrar eden ama plan olarak eklenmemiş
 * giderleri bulur ("Spotify her ay 59,99 TL — plan yapalım mı?"). Saf fonksiyon; öneri kabul edilirse
 * aylık plan açılır, böylece kullanılabilir para bir sonraki ödemeyi önceden düşer.
 *
 * Kurallar (yanlış pozitif azaltmak için temkinli):
 *  - Son 4 ayın giderleri; planlı, bütçe dışı ve kişi hesabından ("o ödedi") girilenler hariç.
 *  - Gruplama: kategori + not (küçük harf, boşluksuz). Not yoksa kategori + tam tutar.
 *  - En az 3 farklı ay; ya da notlu ve tutarı birebir aynı 2 ardışık ay.
 *  - Ay başına tek kayıt (aynı ay içinde birden çok kayıt varsa düzenli abonelik değildir).
 *  - Tutarlar arasında en fazla %10 fark; ayın günleri arasında en fazla 6 gün fark.
 *  - Son kayıt en fazla 45 gün önce (abonelik hâlâ sürüyor).
 *  - Aynı kategoride tutarı ±%10 olan aktif bir aylık gider planı varsa önerilmez.
 */
import type { Data, ID, Tx } from './types';
import type { Money } from './money';
import { addMonths, dayInMonth, dayOfMonth, daysInMonth, diffDays, monthOf, addDays, type ISODate } from './dates';
import { isDaily } from './ledger';

export interface RecurringSuggestion {
  /** Kalıcı anahtar (reddedilen öneriler bununla hatırlanır). */
  key: string;
  categoryId: ID;
  /** Notu (varsa); plan başlığına önerilir. */
  note?: string;
  /** Son kaydın tutarı. */
  amount: Money;
  /** Ödendiği hesap (son kayıt). */
  accountId: ID;
  /** Ödemelerin ayın kaçında yapıldığı (son kayıt). */
  day: number;
  /** Bulunan ay sayısı. */
  months: number;
  lastDate: ISODate;
  /** Önerilen planın başlangıcı: son kayıttan bir ay sonrası. */
  nextDue: ISODate;
  txIds: ID[];
}

const LOOKBACK_DAYS = 125;
const norm = (s: string | undefined) => (s ?? '').trim().toLocaleLowerCase('tr').replace(/\s+/g, ' ');

/** Reddedilen öneri anahtarları settings.hintsSeen içinde bu önekle tutulur. */
export const RECURRING_DISMISS_PREFIX = 'rec:';

export function recurringSuggestions(data: Data, today: ISODate): RecurringSuggestion[] {
  const from = addDays(today, -LOOKBACK_DAYS);
  const daily = new Set(data.accounts.filter(isDaily).map((a) => a.id));
  const groups = new Map<string, Tx[]>();
  for (const t of data.txs) {
    if (t.type !== 'expense' || t.date < from || t.date > today || t.planRef || t.offBudget || !t.categoryId || !daily.has(t.accountId)) continue;
    const n = norm(t.note);
    const key = `${t.categoryId}|${n || '#' + t.amount}`;
    const g = groups.get(key);
    if (g) g.push(t);
    else groups.set(key, [t]);
  }
  const dismissed = new Set(data.settings.hintsSeen.filter((h) => h.startsWith(RECURRING_DISMISS_PREFIX)).map((h) => h.slice(RECURRING_DISMISS_PREFIX.length)));
  const plans = data.plans.filter((p) => p.kind === 'expense' && p.freq === 'monthly' && (!p.endDate || p.endDate >= today));
  const out: RecurringSuggestion[] = [];

  for (const [key, txs] of groups) {
    if (dismissed.has(key)) continue;
    txs.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.seq - b.seq));
    const months = txs.map((t) => monthOf(t.date));
    if (new Set(months).size !== months.length) continue; // ay başına tek kayıt
    const amounts = txs.map((t) => t.amount);
    const min = Math.min(...amounts), max = Math.max(...amounts);
    if (max > min * 1.1) continue;
    const days = txs.map((t) => dayOfMonth(t.date));
    if (Math.max(...days) - Math.min(...days) > 6) continue;
    const last = txs[txs.length - 1];
    if (diffDays(today, last.date) > 45) continue;
    // Aylar ardışık olmalı (arada boş ay yok).
    const consecutive = months.every((m, i) => i === 0 || addMonths(months[i - 1], 1) === m);
    if (!consecutive) continue;
    const strong = txs.length >= 3 || (txs.length === 2 && !!norm(last.note) && min === max);
    if (!strong) continue;
    if (plans.some((p) => p.categoryId === last.categoryId && Math.abs(p.amount - last.amount) <= last.amount * 0.1)) continue;
    const nextMonth = addMonths(monthOf(last.date), 1);
    const day = dayOfMonth(last.date);
    out.push({
      key,
      categoryId: last.categoryId!,
      note: last.note?.trim() || undefined,
      amount: last.amount,
      accountId: last.accountId,
      day,
      months: txs.length,
      lastDate: last.date,
      nextDue: dayInMonth(nextMonth, Math.min(day, daysInMonth(nextMonth))),
      txIds: txs.map((t) => t.id),
    });
  }
  // Büyük tutar önce.
  return out.sort((a, b) => b.amount - a.amount);
}
