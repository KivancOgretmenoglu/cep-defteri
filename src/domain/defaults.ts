import type { Category, Data, Settings } from './types';

/** Varsayılan kategoriler. Simge adları ui/icons.tsx içindeki eşlemeyle çözülür. */
export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'e-food', kind: 'expense', name: 'Yemek & kafe', icon: 'utensils', color: '#E0784F' },
  { id: 'e-market', kind: 'expense', name: 'Market', icon: 'basket', color: '#6E9E5B' },
  { id: 'e-transport', kind: 'expense', name: 'Ulaşım', icon: 'bus', color: '#4F86C6' },
  { id: 'e-housing', kind: 'expense', name: 'Yurt & kira', icon: 'home', color: '#8C6BB1' },
  { id: 'e-bills', kind: 'expense', name: 'Faturalar', icon: 'bolt', color: '#D9A33B' },
  { id: 'e-subs', kind: 'expense', name: 'Abonelikler', icon: 'repeat', color: '#C2577A' },
  { id: 'e-phone', kind: 'expense', name: 'Telefon & internet', icon: 'phone', color: '#3C9C9A' },
  { id: 'e-school', kind: 'expense', name: 'Okul & kitap', icon: 'book', color: '#5B6BBF' },
  { id: 'e-fun', kind: 'expense', name: 'Eğlence', icon: 'ticket', color: '#E2594B' },
  { id: 'e-clothes', kind: 'expense', name: 'Giyim', icon: 'shirt', color: '#A0785A' },
  { id: 'e-health', kind: 'expense', name: 'Sağlık & bakım', icon: 'heart', color: '#D2667A' },
  { id: 'e-gift', kind: 'expense', name: 'Hediye', icon: 'gift', color: '#B5884A' },
  { id: 'e-other', kind: 'expense', name: 'Diğer', icon: 'dots', color: '#8A857C' },
  { id: 'i-scholarship', kind: 'income', name: 'Burs', icon: 'grad', color: '#3F8F6B' },
  { id: 'i-family', kind: 'income', name: 'Aile desteği', icon: 'hand', color: '#D07A52' },
  { id: 'i-job', kind: 'income', name: 'İş geliri', icon: 'briefcase', color: '#4F7FB8' },
  { id: 'i-gift', kind: 'income', name: 'Hediye', icon: 'gift', color: '#B5884A' },
  { id: 'i-other', kind: 'income', name: 'Diğer gelir', icon: 'dots', color: '#8A857C' },
];

export const DEFAULT_SETTINGS: Settings = {
  monthlyBudget: null,
  reserve: 0,
  periodMode: 'month',
  theme: 'system',
  clawd: { body: 'coral', homeOutfit: 'hoodie' },
  lastAccountId: null,
  lastBackupAt: null,
};

export function emptyData(): Data {
  return {
    schema: 1,
    accounts: [],
    categories: DEFAULT_CATEGORIES.map((c) => ({ ...c })),
    txs: [],
    valuations: [],
    plans: [],
    goals: [],
    settings: { ...DEFAULT_SETTINGS, clawd: { ...DEFAULT_SETTINGS.clawd } },
    nextSeq: 1,
  };
}
