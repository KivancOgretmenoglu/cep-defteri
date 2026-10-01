import { ArrowLeftRight, Sprout, RotateCcw, CalendarCheck } from 'lucide-react';
import type { Account, Category, Data, ID, Tx } from '../domain/types';
import { formatMoney } from '../domain/money';
import { refundCategory, transferKind } from '../domain/ledger';
import { CatIcon } from './icons';
import { openSheet } from './nav';

export function txView(t: Tx, accounts: Map<ID, Account>, cats: Map<ID, Category>, txById: Map<ID, Tx>) {
  const acc = accounts.get(t.accountId)?.name ?? '?';
  if (t.type === 'transfer') {
    const to = accounts.get(t.toAccountId!)?.name ?? '?';
    const k = transferKind(t, accounts);
    if (k === 'contribution') return { title: t.note || 'Yatırıma aktarım', sub: `${acc} → ${to}`, amount: formatMoney(t.amount), tone: 'invest', icon: 'invest', color: undefined };
    if (k === 'withdrawal') return { title: t.note || 'Yatırımdan çekim', sub: `${acc} → ${to}`, amount: formatMoney(t.amount), tone: 'invest', icon: 'invest', color: undefined };
    return { title: t.note || 'Transfer', sub: `${acc} → ${to}`, amount: formatMoney(t.amount), tone: 'muted', icon: 'transfer', color: undefined };
  }
  const cat = cats.get((t.type === 'refund' ? refundCategory(t, txById) : t.categoryId) ?? '');
  if (t.type === 'refund') return { title: t.note || `İade · ${cat?.name ?? ''}`, sub: `${acc} · ${cat?.name ?? ''} iadesi`, amount: '+' + formatMoney(t.amount), tone: 'pos', icon: 'refund', color: cat?.color };
  if (t.type === 'income') return { title: t.note || cat?.name || 'Gelir', sub: `${acc} · ${cat?.name ?? ''}`, amount: '+' + formatMoney(t.amount), tone: 'pos', icon: cat?.icon ?? 'dots', color: cat?.color };
  return { title: t.note || cat?.name || 'Gider', sub: `${acc} · ${cat?.name ?? ''}`, amount: '−' + formatMoney(t.amount), tone: 'neg', icon: cat?.icon ?? 'dots', color: cat?.color };
}

export function TxRow({ t, data, lookups, showDate }: { t: Tx; data: Data; lookups: { accounts: Map<ID, Account>; cats: Map<ID, Category>; txById: Map<ID, Tx> }; showDate?: string }) {
  const v = txView(t, lookups.accounts, lookups.cats, lookups.txById);
  const refunded = t.type === 'expense' ? data.txs.filter((r) => r.refundOf === t.id).reduce((a, r) => a + r.amount, 0) : 0;
  return (
    <li>
      <button className="tx-row" onClick={() => openSheet(t.type === 'refund' ? { kind: 'refund', txId: t.id } : { kind: 'edit', txId: t.id })}>
        <span className={`tx-row__icon ${v.icon === 'invest' ? 'is-invest' : v.icon === 'transfer' ? 'is-transfer' : ''}`} style={v.color ? ({ '--cat': v.color } as React.CSSProperties) : undefined}>
          {v.icon === 'invest' ? <Sprout size={18} /> : v.icon === 'transfer' ? <ArrowLeftRight size={18} /> : v.icon === 'refund' ? <RotateCcw size={18} /> : <CatIcon icon={v.icon} />}
        </span>
        <span className="tx-row__main">
          <span className="tx-row__title">{v.title}</span>
          <span className="tx-row__sub">
            {showDate && <>{showDate} · </>}
            {v.sub}
            {t.planRef && (
              <span className="tag" title="Planlı kalem">
                <CalendarCheck size={12} aria-hidden /> planlı
              </span>
            )}
            {refunded > 0 && <span className="tag">{formatMoney(refunded)} iade</span>}
          </span>
        </span>
        <span className={`tx-row__amount tone-${v.tone}`}>{v.amount}</span>
      </button>
    </li>
  );
}
