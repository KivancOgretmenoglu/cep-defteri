import { useEffect, useRef } from 'react';
import { ArrowLeftRight, Sprout, RotateCcw, CalendarCheck, HandCoins, Trash2, CopyPlus } from 'lucide-react';
import type { Account, Category, Data, ID, Tx } from '../domain/types';
import { catName, formatMoney } from '../i18n/format';
import { t as tr_, useT } from '../i18n';
import { refundCategory, transferKind } from '../domain/ledger';
import * as A from '../domain/actions';
import { commit, getState, showToast } from '../store/store';
import { mascotEvent } from '../mascot/events';
import { haptic } from '../native/haptics';
import { openTxPrefilled } from '../sheets/txDraft';
import { CatIcon } from './icons';
import { inputFromMoney } from './kit';
import { prefersReducedMotion } from './motion';
import { openSheet } from './nav';
import './polish.css';

export function txView(t: Tx, accounts: Map<ID, Account>, cats: Map<ID, Category>, txById: Map<ID, Tx>) {
  const T = tr_;
  const acc = accounts.get(t.accountId)?.name ?? '?';
  if (t.type === 'transfer') {
    const to = accounts.get(t.toAccountId!)?.name ?? '?';
    const k = transferKind(t, accounts);
    if (k === 'contribution') return { title: t.note || T('tx.contribution'), sub: `${acc} → ${to}`, amount: formatMoney(t.amount), tone: 'invest', icon: 'invest', color: undefined };
    if (k === 'withdrawal') return { title: t.note || T('tx.withdrawal'), sub: `${acc} → ${to}`, amount: formatMoney(t.amount), tone: 'invest', icon: 'invest', color: undefined };
    if (k === 'debt') {
      const toPerson = accounts.get(t.toAccountId!)?.kind === 'person';
      return { title: t.note || (toPerson ? T('tx.gaveTo', { name: to }) : T('tx.gotFrom', { name: acc })), sub: `${acc} → ${to} · ${T('tx.debtTag')}`, amount: formatMoney(t.amount), tone: 'muted', icon: 'debt', color: undefined };
    }
    return { title: t.note || T('tx.transfer'), sub: `${acc} → ${to}`, amount: formatMoney(t.amount), tone: 'muted', icon: 'transfer', color: undefined };
  }
  const cat = cats.get((t.type === 'refund' ? refundCategory(t, txById) : t.categoryId) ?? '');
  const cn = catName(cat);
  if (t.type === 'refund') return { title: t.note || `${T('tx.refund')} · ${cn}`, sub: `${acc} · ${T('tx.refundOf', { cat: cn })}`, amount: '+' + formatMoney(t.amount), tone: 'pos', icon: 'refund', color: cat?.color };
  if (t.type === 'income') return { title: t.note || cn || T('tx.income'), sub: `${acc} · ${cn}`, amount: '+' + formatMoney(t.amount), tone: 'pos', icon: cat?.icon ?? 'dots', color: cat?.color };
  if (accounts.get(t.accountId)?.kind === 'person') return { title: t.note || cn || T('tx.expense'), sub: `${T('tx.paidBy', { name: acc })} · ${cn}`, amount: '−' + formatMoney(t.amount), tone: 'neg', icon: cat?.icon ?? 'dots', color: cat?.color };
  return { title: t.note || cn || T('tx.expense'), sub: `${acc} · ${cn}`, amount: '−' + formatMoney(t.amount), tone: 'neg', icon: cat?.icon ?? 'dots', color: cat?.color };
}

/** Satır silme: düzenleme sayfasındaki silme ile aynı yol (geri al bildirimiyle). */
export function deleteTxWithUndo(tx: Tx): string | null {
  const T = tr_;
  const refunds = getState().data.txs.filter((r) => r.refundOf === tx.id).length;
  const msg = tx.type === 'refund' ? T('ref.deleted') : refunds ? T('txs.deletedWithRefunds', { n: refunds }) : T('txs.deleted');
  const e = commit((d) => A.deleteTx(d, tx.id).data, msg);
  if (e) showToast(e, { tone: 'error' });
  else mascotEvent({ type: 'deleted' });
  return e;
}

/** Kopyalanabilir mi: iadeler ve yatırım (katkı/çekim) kayıtları birim/miktar taşıdığı için kopyalanmaz. */
export function canDuplicate(tx: Tx, accounts: Map<ID, Account>): boolean {
  if (tx.type === 'refund') return false;
  if (tx.type === 'transfer') {
    const k = transferKind(tx, accounts);
    return k === 'internal' || k === 'debt';
  }
  return true;
}

/** Aynı tür/tutar/kategori/hesap/not ile bugünün tarihli yeni kayıt sayfasını açar (kaydetmez). */
export function duplicateTx(tx: Tx, data: Data, accounts: Map<ID, Account>, today: string) {
  const k = tx.type === 'transfer' ? transferKind(tx, accounts) : null;
  const firstPerson = data.accounts.find((a) => a.kind === 'person' && !a.archived)?.id ?? '';
  let tab = tx.type === 'income' ? 'income' : 'expense';
  let dir: 'in' | 'out' = 'in';
  let accountId = tx.accountId;
  let toAccountId = '';
  let personId = firstPerson;
  if (k === 'internal') {
    tab = 'transfer';
    toAccountId = tx.toAccountId ?? '';
  } else if (k === 'debt') {
    tab = 'debt';
    const toPerson = accounts.get(tx.toAccountId ?? '')?.kind === 'person';
    dir = toPerson ? 'out' : 'in';
    personId = toPerson ? tx.toAccountId! : tx.accountId;
    accountId = toPerson ? tx.accountId : tx.toAccountId!;
  }
  openTxPrefilled(
    {
      tab, dir, amount: inputFromMoney(tx.amount), categoryId: tx.categoryId ?? null, personId,
      split: false, splitPerson: firstPerson, splitShare: '', tags: tx.tags ?? [], tagInput: '',
      accountId, toAccountId, invId: '', date: today, note: tx.note ?? '', showNote: !!tx.note || !!tx.tags?.length,
    },
    { catIds: data.categories.map((c) => c.id), accIds: data.accounts.map((a) => a.id) },
  );
}

const AXIS_LOCK = 8;

/**
 * Dokunmatik kaydırma: sola → sil (geri al bildirimiyle), sağa → bugünün tarihiyle kopya aç.
 * Eksen 8 px'ten sonra kilitlenir; dikey kaydırma tarayıcıda kalır (touch-action: pan-y).
 * Eşik aşılmadan bırakılırsa satır yerine döner; dokunup bırakmak düzenleme sayfasını açar.
 */
function useSwipe(opts: { onDelete: () => void; onDuplicate?: () => void }) {
  const liRef = useRef<HTMLLIElement>(null);
  const rowRef = useRef<HTMLButtonElement>(null);
  const optsRef = useRef(opts);
  optsRef.current = opts;
  const swipedAt = useRef(0);

  useEffect(() => {
    const li = liRef.current;
    const row = rowRef.current;
    if (!li || !row) return;
    let x0 = 0, y0 = 0, dx = 0, axis: 'x' | 'y' | null = null, armed = false, active = false;
    const threshold = () => Math.min(110, li.clientWidth * 0.3);
    const set = (x: number, animate: boolean) => {
      const still = prefersReducedMotion();
      row.style.transition = animate && !still ? 'transform 200ms cubic-bezier(0.2, 0.7, 0.3, 1)' : 'none';
      row.style.transform = x ? `translate3d(${x}px, 0, 0)` : '';
      li.dataset.swipe = x < 0 ? 'left' : x > 0 ? 'right' : '';
    };
    const reset = (animate = true) => {
      set(0, animate);
      li.classList.remove('is-swiping', 'is-armed');
      axis = null;
      armed = false;
      active = false;
    };
    const start = (e: TouchEvent) => {
      if (e.touches.length !== 1) return reset(false);
      x0 = e.touches[0].clientX;
      y0 = e.touches[0].clientY;
      dx = 0;
      axis = null;
      armed = false;
      active = true;
    };
    const move = (e: TouchEvent) => {
      if (!active) return;
      if (e.touches.length !== 1) return reset();
      const mx = e.touches[0].clientX - x0;
      const my = e.touches[0].clientY - y0;
      if (axis === null) {
        if (Math.abs(mx) < AXIS_LOCK && Math.abs(my) < AXIS_LOCK) return;
        axis = Math.abs(mx) > Math.abs(my) ? 'x' : 'y';
        if (axis === 'y') return void (active = false);
        li.classList.add('is-swiping');
        x0 += mx > 0 ? AXIS_LOCK : -AXIS_LOCK; // kilit payı kadar sıçramasın
      }
      if (e.cancelable) e.preventDefault();
      dx = e.touches[0].clientX - x0;
      const T = threshold();
      const allowed = dx < 0 || !!optsRef.current.onDuplicate;
      const abs = Math.abs(dx);
      // Lastik etkisi: eşikten sonra yavaşlar; izin verilmeyen yönde baştan sert direnç.
      const eased = !allowed ? Math.min(abs * 0.18, 28) : abs <= T ? abs : T + (abs - T) * 0.35;
      set(Math.sign(dx) * eased, false);
      const nowArmed = allowed && abs >= T;
      if (nowArmed !== armed) {
        armed = nowArmed;
        li.classList.toggle('is-armed', armed);
        if (armed) haptic('light');
      }
    };
    const end = () => {
      if (!active || axis !== 'x') return reset();
      swipedAt.current = Date.now();
      const fire = armed;
      const left = dx < 0;
      if (fire && left) {
        // Satır sola kayıp gider, sonra silinir (geri al bildirimi çıkar).
        set(-li.clientWidth, true);
        li.classList.remove('is-armed');
        active = false;
        const done = () => {
          optsRef.current.onDelete();
          // Silme başarısızsa (ya da geri alınırsa aynı satır yeniden kullanılırsa) satır yerine döner.
          requestAnimationFrame(() => liRef.current && reset(false));
        };
        if (prefersReducedMotion()) done();
        else setTimeout(done, 180);
        return;
      }
      reset();
      if (fire && !left) optsRef.current.onDuplicate?.();
    };
    li.addEventListener('touchstart', start, { passive: true });
    li.addEventListener('touchmove', move, { passive: false });
    li.addEventListener('touchend', end);
    const cancel = () => reset();
    li.addEventListener('touchcancel', cancel);
    return () => {
      li.removeEventListener('touchstart', start);
      li.removeEventListener('touchmove', move);
      li.removeEventListener('touchend', end);
      li.removeEventListener('touchcancel', cancel);
    };
  }, []);

  /** Kaydırmanın hemen ardından gelen tıklama düzenleme sayfasını açmasın. */
  const justSwiped = () => Date.now() - swipedAt.current < 350;
  return { liRef, rowRef, justSwiped };
}

export function TxRow({ t, data, lookups, showDate }: { t: Tx; data: Data; lookups: { accounts: Map<ID, Account>; cats: Map<ID, Category>; txById: Map<ID, Tx> }; showDate?: string }) {
  const tt = useT();
  const v = txView(t, lookups.accounts, lookups.cats, lookups.txById);
  const refunded = t.type === 'expense' ? data.txs.filter((r) => r.refundOf === t.id).reduce((a, r) => a + r.amount, 0) : 0;
  const dup = canDuplicate(t, lookups.accounts);
  const { liRef, rowRef, justSwiped } = useSwipe({
    onDelete: () => deleteTxWithUndo(t),
    onDuplicate: dup ? () => duplicateTx(t, getState().data, lookups.accounts, getState().today) : undefined,
  });
  return (
    <li data-tx={t.id} ref={liRef} className="swipe-row">
      <span className="swipe-row__bg swipe-row__bg--dup" aria-hidden>
        {dup && <><CopyPlus size={20} /> <span>{tt('swipe.duplicate')}</span></>}
      </span>
      <span className="swipe-row__bg swipe-row__bg--del" aria-hidden>
        <span>{tt('swipe.delete')}</span> <Trash2 size={20} />
      </span>
      <button ref={rowRef} className="tx-row" onClick={() => { if (!justSwiped()) openSheet(t.type === 'refund' ? { kind: 'refund', txId: t.id } : { kind: 'edit', txId: t.id }); }}>
        <span className={`tx-row__icon ${v.icon === 'invest' ? 'is-invest' : v.icon === 'transfer' || v.icon === 'debt' ? 'is-transfer' : ''}`} style={v.color ? ({ '--cat': v.color } as React.CSSProperties) : undefined}>
          {v.icon === 'debt' ? <HandCoins size={18} /> : v.icon === 'invest' ? <Sprout size={18} /> : v.icon === 'transfer' ? <ArrowLeftRight size={18} /> : v.icon === 'refund' ? <RotateCcw size={18} /> : <CatIcon icon={v.icon} />}
        </span>
        <span className="tx-row__main">
          <span className="tx-row__title">{v.title}</span>
          <span className="tx-row__sub">
            {showDate && <>{showDate} · </>}
            {v.sub}
            {t.planRef && (
              <span className="tag" title={tt('tx.plannedItem')}>
                <CalendarCheck size={12} aria-hidden /> {tt('tx.planned')}
              </span>
            )}
            {refunded > 0 && <span className="tag">{tt('tx.refundedTag', { amount: formatMoney(refunded) })}</span>}
            {t.tags?.map((tag) => <span key={tag} className="tag tag--hash">#{tag}</span>)}
          </span>
        </span>
        <span className={`tx-row__amount tone-${v.tone}`}>{v.amount}</span>
      </button>
    </li>
  );
}
