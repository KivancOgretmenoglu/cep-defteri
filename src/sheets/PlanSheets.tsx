import { useState } from 'react';
import { CheckCircle2, SkipForward, Pencil, Ban, Undo2 } from 'lucide-react';
import type { ID } from '../domain/types';
import * as A from '../domain/actions';
import { addDays, type ISODate } from '../domain/dates';
import { dueLabel, formatMoney, shortDate } from '../i18n/format';
import { t as tNow, useT } from '../i18n';
import { installmentNo, occurrences, planIsInflow } from '../domain/ledger';
import { commit } from '../store/store';
import { closeSheet, openSheet } from '../ui/nav';
import { Field, Sheet } from '../ui/kit';
import { useData, useLookups } from '../ui/hooks';

const verbOf = (k: string) => (k === 'income' ? tNow('due.received') : k === 'transfer' ? tNow('due.moved') : tNow('due.paid'));

/** Yaklaşan bir vadeye dokununca açılan menü: gerçekleşti / atla / düzenle / iptal. */
export function OccurrenceSheet({ planId, due }: { planId: ID; due: ISODate }) {
  const t = useT();
  const { data, today } = useData();
  const { accounts } = useLookups(data);
  const plan = data.plans.find((p) => p.id === planId);
  if (!plan) return null;
  const occ = occurrences(data, due, due, [plan])[0];
  const skipped = occ?.status === 'skipped';
  const n = installmentNo(plan, due);
  return (
    <Sheet title={plan.title} onClose={closeSheet}>
      <p className="muted">
        {shortDate(due, today)} · {dueLabel(due, today)} · {planIsInflow(plan, accounts) ? '+' : ''}
        {formatMoney(plan.amount)}
        {n ? ` · ${t('occ.installmentNo', { n, of: plan.installments ?? '' })}` : ''}
      </p>
      <div className="menu-list">
        <button className="menu-item" onClick={() => openSheet({ kind: 'confirm', planId, due })}>
          <CheckCircle2 size={20} aria-hidden />
          <span>{verbOf(plan.kind)}<small>{t('occ.confirmHint')}</small></span>
        </button>
        <button
          className="menu-item"
          onClick={() => {
            commit((d) => A.skipOccurrence(d, planId, due, !skipped), skipped ? t('bud.unskipped') : t('conf.skipped', { title: plan.title, date: shortDate(due) }));
            closeSheet();
          }}
        >
          {skipped ? <Undo2 size={20} aria-hidden /> : <SkipForward size={20} aria-hidden />}
          <span>{skipped ? t('conf.unskip') : t('occ.skipOnce')}<small>{t('occ.skipHint')}</small></span>
        </button>
        <button className="menu-item" onClick={() => openSheet({ kind: 'plan', planId })}>
          <Pencil size={20} aria-hidden />
          <span>{t('plan.editTitle')}<small>{t('occ.editHint')}</small></span>
        </button>
        <button className="menu-item menu-item--warn" onClick={() => openSheet({ kind: 'cancelPlan', planId })}>
          <Ban size={20} aria-hidden />
          <span>{t('occ.cancelTitle')}<small>{t('occ.cancelHint')}</small></span>
        </button>
      </div>
    </Sheet>
  );
}

/** Planı belirli bir günden itibaren iptal etme. */
export function CancelPlanSheet({ planId }: { planId: ID }) {
  const t = useT();
  const { data, today } = useData();
  const plan = data.plans.find((p) => p.id === planId);
  const [from, setFrom] = useState<ISODate>(today);
  const [skipEarlier, setSkipEarlier] = useState(true);
  if (!plan) return null;
  const earlier = occurrences(data, plan.startDate, addDays(from, -1), [plan]).filter((o) => o.status === 'pending');
  const done = occurrences(data, plan.startDate, '9999-12-31', [plan]).filter((o) => o.status === 'done').length;
  function apply() {
    commit((d) => A.cancelPlan(d, planId, from, skipEarlier), t('occ.cancelled', { title: plan!.title }));
    closeSheet();
  }
  return (
    <Sheet
      title={t('occ.cancelTitle')}
      onClose={closeSheet}
      footer={
        <div className="sheet-actions">
          <button className="btn btn--ghost" onClick={closeSheet}>{t('occ.keep')}</button>
          <button className="btn btn--primary btn--grow" onClick={apply}>{t('plan.cancel')}</button>
        </div>
      }
    >
      <p>
        {t('occ.cancelBodyPre')}<b>{plan.title}</b>{t('occ.cancelBody')}{done ? t('occ.cancelDone', { n: done }) : ''} {t('occ.cancelRestart')}
      </p>
      <Field label={t('occ.fromWhen')}>
        <input className="input" type="date" value={from} min={plan.startDate} onChange={(e) => e.target.value && setFrom(e.target.value)} />
      </Field>
      {earlier.length > 0 && (
        <label className="check-row">
          <input type="checkbox" checked={skipEarlier} onChange={(e) => setSkipEarlier(e.target.checked)} />
          <span>
            {t('occ.closeEarlier', { n: earlier.length, dates: earlier.map((o) => shortDate(o.due, today)).join(', ') })}
            <small>{t('occ.closeEarlierHint')}</small>
          </span>
        </label>
      )}
      <p className="note-line">{t('occ.deleteHint')}</p>
    </Sheet>
  );
}
