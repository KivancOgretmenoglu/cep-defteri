/**
 * İşlem sayfasından "+ Yeni kategori/hesap" açılınca yazılanları korur.
 * nav.ts'te tek bir sheet yuvası var; ikinci sayfa ilkinin yerine geçer. Bu yüzden form
 * burada saklanır, ikinci sayfa kapanınca (App'teki SheetHost) işlem sayfası yeniden açılır
 * ve TxSheet taslağı geri yükler; yeni oluşturulan kategori/hesap otomatik seçilir.
 */
import type { ID, PlanRef } from '../domain/types';
import { openSheet, type SheetState } from '../ui/nav';

export interface TxSnap {
  tab: string;
  dir: 'in' | 'out';
  amount: string;
  categoryId: ID | null;
  personId: ID;
  split: boolean;
  splitPerson: ID;
  splitShare: string;
  tags: string[];
  tagInput: string;
  accountId: ID;
  toAccountId: ID;
  invId: ID;
  date: string;
  note: string;
  showNote: boolean;
  planRef?: PlanRef;
  /** Yeni hesap açılırsa hangi alana yerleşeceği */
  target: 'accountId' | 'toAccountId' | 'personId' | 'splitPerson' | 'invId';
  /** Sayfa açılmadan önceki kimlikler: yeni olanı bulmak için */
  catIds: ID[];
  accIds: ID[];
}

let draft: { snap: TxSnap; back: SheetState; ready: boolean } | null = null;

/** Formu sakla, ikinci sayfayı aç. */
export function stashTxDraft(snap: TxSnap, back: SheetState, next: SheetState) {
  draft = { snap, back, ready: false };
  openSheet(next);
}

/** Sayfa yuvası boşaldıysa ve bekleyen taslak varsa işlem sayfasını geri aç. */
export function resumeTxDraft() {
  if (!draft || draft.ready) return;
  draft.ready = true;
  openSheet(draft.back);
}

/** TxSheet açılışında: dönüşse taslak, değilse null. */
export function takeTxDraft(): TxSnap | null {
  return draft?.ready ? draft.snap : null;
}

export function discardTxDraft() {
  draft = null;
}

/**
 * Bir kaydın kopyasını yeni kayıt olarak açar (satırı sağa kaydırma): form, "+ Yeni" dönüşündeki
 * taslak geri yükleme yoluyla doldurulur; TxSheet'e ek bir dal gerekmez. Otomatik kaydedilmez.
 */
export function openTxPrefilled(snap: Omit<TxSnap, 'target' | 'catIds' | 'accIds'>, ids: { catIds: ID[]; accIds: ID[] }) {
  draft = { snap: { ...snap, target: 'accountId', ...ids }, back: { kind: 'add' }, ready: true };
  openSheet({ kind: 'add' });
}
