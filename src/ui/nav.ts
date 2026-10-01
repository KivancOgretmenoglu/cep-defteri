/** Ekran gezinmesi ve açık sayfa (sheet) durumu. Ekran adresi hash'te tutulur; yenileyince aynı ekranda kalınır. */
import { useSyncExternalStore } from 'react';
import type { ID, TxType } from '../domain/types';
import type { MonthKey } from '../domain/dates';

export type Screen = 'home' | 'tx' | 'budget' | 'invest' | 'reports' | 'settings';
export const SCREENS: Screen[] = ['home', 'tx', 'budget', 'invest', 'reports', 'settings'];
const SLUG: Record<Screen, string> = { home: 'ozet', tx: 'islemler', budget: 'butce', invest: 'yatirim', reports: 'raporlar', settings: 'ayarlar' };

export interface TxFilter {
  month?: MonthKey;
  kind?: 'all' | 'expense' | 'income' | 'transfer' | 'invest';
  categoryId?: ID;
  accountId?: ID;
}

export type SheetState =
  | { kind: 'add'; preset?: { type?: TxType | 'invest'; direction?: 'in' | 'out'; accountId?: ID } }
  | { kind: 'edit'; txId: ID }
  | { kind: 'refund'; txId: ID }
  | { kind: 'confirm'; planId: ID; due: string }
  | { kind: 'account'; accountId?: ID; kindPreset?: 'investment' }
  | { kind: 'plan'; planId?: ID; preset?: 'expense' | 'income' | 'transfer' }
  | { kind: 'valuation'; accountId: ID }
  | { kind: 'goal'; goalId?: ID; accountId?: ID }
  | { kind: 'category'; categoryId?: ID; catKind?: 'expense' | 'income' }
  | { kind: 'budget' }
  | { kind: 'limit'; categoryId?: ID };

interface NavState {
  screen: Screen;
  filter: TxFilter;
  reportMonth?: MonthKey;
  sheet: SheetState | null;
}

function fromHash(): Screen {
  const h = typeof location !== 'undefined' ? location.hash.replace(/^#\/?/, '') : '';
  return (Object.keys(SLUG) as Screen[]).find((s) => SLUG[s] === h) ?? 'home';
}

let nav: NavState = { screen: fromHash(), filter: {}, sheet: null };
const ls = new Set<() => void>();
const emit = (n: Partial<NavState>) => {
  nav = { ...nav, ...n };
  ls.forEach((l) => l());
};

export function useNav() {
  return useSyncExternalStore(
    (l) => {
      ls.add(l);
      return () => ls.delete(l);
    },
    () => nav,
  );
}

export const getNav = () => nav;

export function go(screen: Screen, opts: { filter?: TxFilter; reportMonth?: MonthKey } = {}) {
  emit({ screen, filter: opts.filter ?? (screen === 'tx' ? nav.filter : {}), reportMonth: opts.reportMonth ?? nav.reportMonth });
  const slug = '#/' + SLUG[screen];
  if (location.hash !== slug) history.pushState(null, '', slug);
  window.scrollTo({ top: 0 });
}
export function setFilter(f: TxFilter) {
  emit({ filter: f });
}
export function openSheet(s: SheetState) {
  emit({ sheet: s });
}
export function closeSheet() {
  emit({ sheet: null });
}

if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => {
    if (nav.sheet) emit({ sheet: null });
    emit({ screen: fromHash() });
  });
}
