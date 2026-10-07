import { CalendarClock } from 'lucide-react';
import type { Account, ID } from '../domain/types';
import type { ISODate } from '../domain/dates';
import { dueLabel, formatMoney, shortDate } from '../i18n/format';
import { useT } from '../i18n';
import { installmentNo, planIsInflow, type Occurrence } from '../domain/ledger';
import { openSheet } from './nav';

/** Bekleyen planlı kalem satırı. Satıra dokununca menü (gerçekleşti/atla/düzenle/iptal), düğme hızlı onay. */
export function DueRow({ o, today, accounts, reserved }: { o: Occurrence; today: ISODate; accounts: Map<ID, Account>; reserved?: boolean }) {
  const t = useT();
  const inflow = planIsInflow(o.plan, accounts);
  const n = installmentNo(o.plan, o.due);
  return (
    <li className={o.due < today ? 'is-overdue' : ''}>
      <button className="due-list__open" onClick={() => openSheet({ kind: 'occurrence', planId: o.plan.id, due: o.due })} aria-label={`${o.plan.title}, ${shortDate(o.due, today)}: ${t('due.options')}`}>
        <CalendarClock size={18} aria-hidden />
        <span className="due-list__main">
          <span className="due-list__title">
            {o.plan.title}
            {n && <> <span className="tag">{n}/{o.plan.installments}</span></>}
          </span>
          <span className="due-list__sub">
            {shortDate(o.due, today)} · {dueLabel(o.due, today)}
            {inflow ? ` · ${t('due.expected')}` : o.plan.kind === 'transfer' ? ` · ${t('due.transfer')}` : ''}
            {reserved && !inflow ? ` · ${t('due.reserved')}` : ''}
          </span>
        </span>
        <span className={`due-list__amt ${inflow ? 'tone-pos' : o.plan.kind === 'transfer' ? 'tone-invest' : ''}`}>
          {inflow ? '+' : ''}
          {formatMoney(o.amount)}
        </span>
      </button>
      <button className="btn btn--small btn--secondary" onClick={() => openSheet({ kind: 'confirm', planId: o.plan.id, due: o.due })}>
        {o.plan.kind === 'income' ? t('due.received') : o.plan.kind === 'transfer' ? t('due.moved') : t('due.paid')}
      </button>
    </li>
  );
}
