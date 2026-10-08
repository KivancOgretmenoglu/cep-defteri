import { useMemo } from 'react';
import { useStore } from '../store/store';
import type { Data, ID, Tx } from '../domain/types';
import { accountIndex, cashBalance, isDaily } from '../domain/ledger';
import { addDays, type ISODate } from '../domain/dates';
import { rankCategories } from '../domain/smart';

export function useData() {
  const data = useStore((s) => s.data);
  const today = useStore((s) => s.today);
  return { data, today };
}

export function useLookups(data: Data) {
  return useMemo(() => {
    const accounts = accountIndex(data);
    const cats = new Map(data.categories.map((c) => [c.id, c]));
    const txById = new Map(data.txs.map((t) => [t.id, t]));
    return { accounts, cats, txById };
  }, [data]);
}

/** Yeni kayıt için uygun günlük hesaplar (arşivdekiler hariç), bakiyeleriyle. */
export function dailyAccounts(data: Data) {
  return data.accounts.filter((a) => isDaily(a) && !a.archived).map((a) => ({ account: a, balance: cashBalance(data, a.id) }));
}

/** Son kullanılan kategoriler (en yeni önce). */
export function recentCategories(data: Data, kind: 'expense' | 'income'): ID[] {
  const seen: ID[] = [];
  const sorted = [...data.txs].filter((t) => t.type === kind && t.categoryId).sort((a, b) => b.seq - a.seq);
  for (const t of sorted) {
    if (!seen.includes(t.categoryId!)) seen.push(t.categoryId!);
    if (seen.length >= 6) break;
  }
  return seen;
}

/**
 * Kategori ızgarası sırası: kendi kullanımına göre (son 90 gün, yakın tarih ve şu anki saat dilimi ağır).
 * Son 90 günde kayıt yoksa daha eski son kullanılanlara düşer; hiç geçmiş yoksa boş (varsayılan sıra).
 */
export function categoryOrder(data: Data, kind: 'expense' | 'income', today: ISODate, hour: number): ID[] {
  const ranked = rankCategories(data, kind, today, hour);
  return ranked.length ? ranked : recentCategories(data, kind);
}

export interface Template {
  key: string;
  categoryId: ID;
  amount: number;
  accountId: ID;
  note?: string;
  count: number;
}

/** Son 60 günde en az 3 kez tekrarlanan (aynı kategori+tutar+not) kayıtlar: tek dokunuşla doldurma için. */
export function frequentTemplates(data: Data, kind: 'expense' | 'income', today: ISODate): Template[] {
  const from = addDays(today, -60);
  const groups = new Map<string, Template & { last: number }>();
  for (const t of data.txs as Tx[]) {
    if (t.type !== kind || t.date < from || !t.categoryId || t.planRef) continue;
    const note = t.note?.trim() || undefined;
    const key = `${t.categoryId}|${t.amount}|${note ?? ''}`;
    const g = groups.get(key);
    if (g) {
      g.count++;
      if (t.seq > g.last) {
        g.last = t.seq;
        g.accountId = t.accountId;
      }
    } else groups.set(key, { key, categoryId: t.categoryId, amount: t.amount, accountId: t.accountId, note, count: 1, last: t.seq });
  }
  return [...groups.values()]
    .filter((g) => g.count >= 3 && data.accounts.find((a) => a.id === g.accountId && !a.archived))
    .sort((a, b) => b.count - a.count || b.last - a.last)
    .slice(0, 4);
}
