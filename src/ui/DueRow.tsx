import { CalendarClock } from 'lucide-react';
import type { Account, ID } from '../domain/types';
import { formatMoney } from '../domain/money';
import { dueLabel, shortDate, type ISODate } from '../domain/dates';
import { installmentNo, planIsInflow, type Occurrence } from '../domain/ledger';
import { openSheet } from './nav';

/** Bekleyen planlı kalem satırı. Satıra dokununca menü (gerçekleşti/atla/düzenle/iptal), düğme hızlı onay. */
export function DueRow({ o, today, accounts, reserved }: { o: Occurrence; today: ISODate; accounts: Map<ID, Account>; reserved?: boolean }) {
  const inflow = planIsInflow(o.plan, accounts);
  const n = installmentNo(o.plan, o.due);
  return (
    <li className={o.due < today ? 'is-overdue' : ''}>
      <button className="due-list__open" onClick={() => openSheet({ kind: 'occurrence', planId: o.plan.id, due: o.due })} aria-label={`${o.plan.title}, ${shortDate(o.due, today)}: seçenekler`}>
        <CalendarClock size={18} aria-hidden />
        <span className="due-list__main">
          <span className="due-list__title">
            {o.plan.title}
            {n && <> <span className="tag">{n}/{o.plan.installments}</span></>}
          </span>
          <span className="due-list__sub">
            {shortDate(o.due, today)} · {dueLabel(o.due, today)}
            {inflow ? ' · beklenen' : o.plan.kind === 'transfer' ? ' · aktarım' : ''}
            {reserved && !inflow ? ' · ayrıldı' : ''}
          </span>
        </span>
        <span className={`due-list__amt ${inflow ? 'tone-pos' : o.plan.kind === 'transfer' ? 'tone-invest' : ''}`}>
          {inflow ? '+' : ''}
          {formatMoney(o.amount)}
        </span>
      </button>
      <button className="btn btn--small btn--secondary" onClick={() => openSheet({ kind: 'confirm', planId: o.plan.id, due: o.due })}>
        {o.plan.kind === 'income' ? 'Geldi' : o.plan.kind === 'transfer' ? 'Aktarıldı' : 'Ödendi'}
      </button>
    </li>
  );
}
