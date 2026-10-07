import { ArrowLeftRight, Sprout, RotateCcw, CalendarCheck, HandCoins } from 'lucide-react';
import type { Account, Category, Data, ID, Tx } from '../domain/types';
import { catName, formatMoney } from '../i18n/format';
import { t as tr_, useT } from '../i18n';
import { refundCategory, transferKind } from '../domain/ledger';
import { CatIcon } from './icons';
import { openSheet } from './nav';

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

export function TxRow({ t, data, lookups, showDate }: { t: Tx; data: Data; lookups: { accounts: Map<ID, Account>; cats: Map<ID, Category>; txById: Map<ID, Tx> }; showDate?: string }) {
  const tt = useT();
  const v = txView(t, lookups.accounts, lookups.cats, lookups.txById);
  const refunded = t.type === 'expense' ? data.txs.filter((r) => r.refundOf === t.id).reduce((a, r) => a + r.amount, 0) : 0;
  return (
    <li>
      <button className="tx-row" onClick={() => openSheet(t.type === 'refund' ? { kind: 'refund', txId: t.id } : { kind: 'edit', txId: t.id })}>
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
