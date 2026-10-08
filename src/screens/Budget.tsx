import { useMemo, useState } from 'react';
import { Plus, Pencil, Repeat } from 'lucide-react';
import type { Plan } from '../domain/types';
import { addDays, daysInMonth, dayOfMonth, monthOf } from '../domain/dates';
import { catName, formatMoney, monthLabel, moneyUnit, parseMoney, pctForm, pctPlain, shortDate } from '../i18n/format';
import { t as tNow, useT } from '../i18n';
import type { Key } from '../i18n/core';
import { accountIndex, availability, budgetStatus, occurrences, pendingUntil, type BudgetState } from '../domain/ledger';
import * as A from '../domain/actions';
import { commit } from '../store/store';
import { Chip, Progress, SectionHead, Segmented, inputFromMoney } from '../ui/kit';
import { go, openSheet } from '../ui/nav';
import { useData, useLookups } from '../ui/hooks';
import { MascotNote, EmptyState } from '../mascot/MascotNote';
import { CatIcon } from '../ui/icons';
import { DueRow } from '../ui/DueRow';
import type { Mood } from '../domain/mood';

export const FREQ_LABEL: Record<Plan['freq'], Key> = { once: 'freq.once', weekly: 'freq.weekly', monthly: 'freq.monthly', yearly: 'freq.yearly' };

const STATE_TEXT: Record<BudgetState, { label: Key | null; mood: Mood }> = {
  none: { label: null, mood: 'calm' },
  'on-track': { label: 'bud.state.onTrack', mood: 'happy' },
  watch: { label: 'bud.state.watch', mood: 'calm' },
  tight: { label: 'bud.state.tight', mood: 'thoughtful' },
  over: { label: 'bud.state.over', mood: 'thoughtful' },
  'planned-full': { label: 'bud.state.plannedFull', mood: 'calm' },
  'closed-within': { label: 'bud.state.closedWithin', mood: 'happy' },
  future: { label: null, mood: 'calm' },
};

export function Budget() {
  const t = useT();
  const { data, today } = useData();
  const { accounts, cats } = useLookups(data);
  const month = monthOf(today);
  const b = useMemo(() => budgetStatus(data, month, today), [data, month, today]);
  const av = useMemo(() => availability(data, today), [data, today]);
  const upcoming = useMemo(() => pendingUntil(data, addDays(today, 45)), [data, today]);
  const accIdx = accountIndex(data);
  const doneThisMonth = useMemo(
    () => occurrences(data, `${month}-01`, today).filter((o) => o.status === 'done' || o.status === 'skipped').reverse().slice(0, 6),
    [data, month, today],
  );
  const left = daysInMonth(month) - dayOfMonth(today) + 1;
  const sortedPlans = [...data.plans].sort((a, b) => a.title.localeCompare(b.title, 'tr'));
  const activePlans = sortedPlans.filter((p) => !p.endDate || p.endDate >= today);
  const endedPlans = sortedPlans.filter((p) => p.endDate && p.endDate < today);
  const PlanRow = ({ p }: { p: Plan }) => (
    <li>
      <button className="plan-row" onClick={() => openSheet({ kind: 'plan', planId: p.id })}>
        <Repeat size={16} aria-hidden />
        <span className="plan-row__main">
          <span>{p.title}{p.installments ? <span className="tag">{t('bud.installmentsTag', { n: p.installments })}</span> : null}</span>
          <small>
            {t(FREQ_LABEL[p.freq])} · {p.kind === 'transfer' ? `${accounts.get(p.accountId)?.name} → ${accounts.get(p.toAccountId!)?.name}` : `${catName(cats.get(p.categoryId!))} · ${accounts.get(p.accountId)?.name ?? ''}`}
            {p.endDate ? (p.endDate < today ? ` · ${t('bud.endedOn', { date: shortDate(p.endDate, today) })}` : ` · ${t('bud.lastDue', { date: shortDate(p.endDate, today) })}`) : ''}
          </small>
        </span>
        <span className={p.kind === 'income' ? 'tone-pos' : p.kind === 'transfer' ? 'tone-invest' : ''}>{p.kind === 'income' ? '+' : ''}{formatMoney(p.amount)}</span>
      </button>
    </li>
  );

  let note: { text: string; why: string; mood: Mood } | null = null;
  if (b.budget !== null) {
    const st = STATE_TEXT[b.state];
    if (b.state === 'on-track' || b.state === 'watch' || b.state === 'tight')
      note = {
        mood: st.mood,
        // Balonda tek kısa cümle (kalan + günlük pay); tempo yüzdeleri "Neden böyle?" içinde.
        text: b.remaining !== null && b.remaining > 0 ? t('bud.note.left', { amount: formatMoney(b.remaining), perDay: formatMoney(Math.floor(b.remaining / left)) }) : t('bud.note.pace', { elapsed: pctForm(b.elapsedPct, 'poss'), used: pctForm(b.flexUsedPct ?? 0, 'acc') }),
        why: t('bud.note.paceWhy', { pace: t('bud.note.pace', { elapsed: pctForm(b.elapsedPct, 'poss'), used: pctForm(b.flexUsedPct ?? 0, 'acc') }) }),
      };
    else if (b.state === 'over')
      note = { mood: 'thoughtful', text: t('bud.note.over', { amount: formatMoney(b.spent - b.budget) }), why: t('bud.note.overWhy', { spent: formatMoney(b.spent), budget: formatMoney(b.budget) }) };
    else if (b.state === 'planned-full')
      note = { mood: 'calm', text: t('bud.note.full'), why: t('bud.note.fullWhy', { planned: formatMoney(b.plannedSpent + b.plannedPending), budget: formatMoney(b.budget) }) };
  }

  return (
    <div className="screen">
      <header className="screen-head">
        <div>
          <p className="eyebrow">{monthLabel(month)}</p>
          <h1>{t('bud.title')}</h1>
        </div>
      </header>

      {b.budget === null ? (
        <section className="card">
          <EmptyState outfit="planner" mood="calm" title={t('bud.emptyTitle')} action={<button className="btn btn--primary" onClick={() => openSheet({ kind: 'budget' })}>{t('bud.setBudget')}</button>}>
            {t('bud.emptyBody')}
          </EmptyState>
        </section>
      ) : (
        <section className="card budget-card" aria-labelledby="budget-h">
          <SectionHead id="budget-h" title={t('bud.monthly')} action={<button className="link" onClick={() => openSheet({ kind: 'budget' })}><Pencil size={15} /> {t('common.edit')}</button>} />
          <div className="budget-head">
            <span className="budget-head__spent">{formatMoney(b.spent)}</span>
            <span className="budget-head__of">/ {formatMoney(b.budget)}</span>
            {STATE_TEXT[b.state].label && <span className={`badge badge--${b.state}`}>{t(STATE_TEXT[b.state].label!)}</span>}
          </div>
          <BudgetBar spentPlanned={b.plannedSpent} spentFlex={Math.max(b.flexibleSpent, 0)} pending={b.plannedPending} budget={b.budget} elapsed={b.elapsedPct} />
          <dl className="legend">
            <div><dt><i className="sw sw--planned" />{t('bud.plannedPaid')}</dt><dd>{formatMoney(b.plannedSpent)}</dd></div>
            <div><dt><i className="sw sw--pending" />{t('bud.plannedPending')}</dt><dd>{formatMoney(b.plannedPending)}</dd></div>
            <div><dt><i className="sw sw--flex" />{t('bud.otherSpending')}</dt><dd>{formatMoney(b.flexibleSpent)}</dd></div>
            <div><dt><i className="sw sw--left" />{t('bud.remaining')}</dt><dd>{formatMoney(Math.max(b.remaining ?? 0, 0))}</dd></div>
          </dl>
          <p className="note-line">{t('bud.lineNote', { pct: pctPlain(b.elapsedPct) })}</p>
          {note && <MascotNote compact mood={note.mood} text={note.text} why={note.why} outfit="planner" size={64} />}
        </section>
      )}

      <section className="card" aria-labelledby="lim-h">
        <SectionHead id="lim-h" title={t('bud.limits')} action={<button className="link" onClick={() => openSheet({ kind: 'limit' })}><Plus size={16} /> {t('bud.limit')}</button>} />
        {b.categories.length === 0 ? (
          <p className="muted">{t('bud.limitsEmpty')}</p>
        ) : (
          <ul className="limit-list">
            {b.categories.map((c) => (
              <li key={c.category.id}>
                <button className="limit-row" onClick={() => openSheet({ kind: 'limit', categoryId: c.category.id })}>
                  <span className="limit-row__head">
                    <span className="limit-row__name" style={{ '--cat': c.category.color } as React.CSSProperties}>
                      <CatIcon icon={c.category.icon} size={16} /> {catName(c.category)}
                    </span>
                    <span className="limit-row__nums">{formatMoney(c.used)} / {formatMoney(c.limit)}</span>
                  </span>
                  <Progress value={c.used} max={c.limit} label={t('bud.limitOf', { cat: catName(c.category) })} tone={c.level === 'over' ? 'warn' : c.level === 'near' ? 'warn' : 'accent'} marker={b.elapsedPct} />
                  {c.level !== 'ok' && (
                    <span className={`limit-row__alert ${c.level === 'over' ? 'is-over' : ''}`}>
                      {c.level === 'over'
                        ? t('bud.limitOver', { cat: catName(c.category), amount: formatMoney(c.used - c.limit), pct: pctPlain(c.pct) })
                        : t('bud.limitNear', { cat: catName(c.category), pct: pctForm(c.pct, 'acc'), left: formatMoney(c.limit - c.used) })}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card" aria-labelledby="plans-h">
        <SectionHead id="plans-h" title={t('bud.upcomingTitle')} action={<button className="link" onClick={() => openSheet({ kind: 'plan' })}><Plus size={16} /> {t('bud.plan')}</button>} />
        {upcoming.length === 0 ? (
          <p className="muted">{t('bud.upcomingEmpty')}</p>
        ) : (
          <ul className="due-list">
            {upcoming.map((o) => <DueRow key={o.plan.id + o.due} o={o} today={today} accounts={accIdx} reserved={o.due <= av.periodEnd} />)}
          </ul>
        )}
        {doneThisMonth.length > 0 && (
          <details className="details">
            <summary>{t('bud.doneThisMonth', { n: doneThisMonth.length })}</summary>
            <ul className="due-list due-list--done">
              {doneThisMonth.map((o) => (
                <li key={o.plan.id + o.due}>
                  <span className="due-list__main">
                    <span className="due-list__title">{o.plan.title}</span>
                    <span className="due-list__sub">{shortDate(o.due)} · {o.status === 'done' ? `${t('bud.done')}${o.tx && o.tx.amount !== o.plan.amount ? ` (${t('bud.planAmount', { amount: formatMoney(o.plan.amount) })})` : ''}` : t('bud.skipped')}</span>
                  </span>
                  <span className="due-list__amt">{o.status === 'done' ? formatMoney(o.amount) : '—'}</span>
                  {o.status === 'skipped' ? (
                    <button className="btn btn--small btn--ghost" onClick={() => commit((d) => A.skipOccurrence(d, o.plan.id, o.due, false), t('bud.unskipped'))}>{t('common.undo')}</button>
                  ) : (
                    <button className="btn btn--small btn--ghost" onClick={() => o.tx && openSheet({ kind: 'edit', txId: o.tx.id })}>{t('bud.entry')}</button>
                  )}
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>

      <section className="card" aria-labelledby="allplans-h">
        <SectionHead id="allplans-h" title={t('bud.allPlans')} />
        {data.plans.length === 0 ? (
          <div className="chip-row">
            <Chip onClick={() => openSheet({ kind: 'plan', preset: 'expense' })}><Plus size={14} /> {t('bud.chipRent')}</Chip>
            <Chip onClick={() => openSheet({ kind: 'plan', preset: 'expense' })}><Plus size={14} /> {t('bud.chipSub')}</Chip>
            <Chip onClick={() => openSheet({ kind: 'plan', preset: 'income' })}><Plus size={14} /> {t('bud.chipScholarship')}</Chip>
            <Chip onClick={() => openSheet({ kind: 'plan', preset: 'transfer' })}><Plus size={14} /> {t('bud.chipInvest')}</Chip>
          </div>
        ) : (
          <>
            <ul className="plan-list">
              {activePlans.map((p) => <PlanRow key={p.id} p={p} />)}
            </ul>
            {endedPlans.length > 0 && (
              <details className="details">
                <summary>{t('bud.endedPlans', { n: endedPlans.length })}</summary>
                <ul className="plan-list plan-list--ended">
                  {endedPlans.map((p) => <PlanRow key={p.id} p={p} />)}
                </ul>
              </details>
            )}
          </>
        )}
      </section>

      <section className="card" aria-labelledby="avail-set-h">
        <SectionHead id="avail-set-h" title={t('bud.howTitle')} />
        <p className="muted">
          {t('bud.howBody')}
        </p>
        <div className="setting-row">
          <span>{t('bud.period')}</span>
          <Segmented
            size="sm"
            label={t('bud.period')}
            value={data.settings.periodMode}
            onChange={(v) => commit((d) => A.updateSettings(d, { periodMode: v }))}
            options={[
              { value: 'month', label: t('bud.periodMonth') },
              { value: 'days30', label: t('bud.period30') },
            ]}
          />
        </div>
        <ReserveRow />
        <button className="link" onClick={() => go('home')}>{t('common.backHome')}</button>
      </section>
    </div>
  );
}

function ReserveRow() {
  const t = useT();
  const { data } = useData();
  return (
    <div className="setting-row">
      <span>
        {t('bud.reserve')}
        <small>{t('bud.reserveHint')}</small>
      </span>
      <ReserveInput key={data.settings.reserve} value={data.settings.reserve} />
    </div>
  );
}

function ReserveInput({ value }: { value: number }) {
  const [raw, setRaw] = useState(inputFromMoney(value));
  const [err, setErr] = useState(false);
  const save = () => {
    const v = raw.trim() ? parseMoney(raw) : 0;
    if (v === null) return setErr(true);
    setErr(false);
    if (v !== value) commit((d) => A.updateSettings(d, { reserve: v }), v ? tNow('bud.reserveSet', { amount: formatMoney(v) }) : tNow('bud.reserveRemoved'));
  };
  return (
    <span className="inline-money">
      <input className={`input input--small ${err ? 'is-invalid' : ''}`} inputMode="decimal" value={raw} placeholder="0" onChange={(e) => setRaw(e.target.value.replace(/[^\d.,]/g, ''))} onBlur={save} onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()} aria-label={tNow('bud.reserveAria', { unit: moneyUnit() })} />
      <span>{moneyUnit()}</span>
    </span>
  );
}

function BudgetBar({ spentPlanned, spentFlex, pending, budget, elapsed }: { spentPlanned: number; spentFlex: number; pending: number; budget: number; elapsed: number }) {
  const total = Math.max(budget, spentPlanned + spentFlex + pending);
  const w = (v: number) => `${(v / total) * 100}%`;
  return (
    <div className="budget-bar" role="img" aria-label={tNow('bud.barAria', { paid: formatMoney(spentPlanned), pending: formatMoney(pending), other: formatMoney(spentFlex), budget: formatMoney(budget) })}>
      <span className="budget-bar__seg sw--planned" style={{ width: w(spentPlanned) }} />
      <span className="budget-bar__seg sw--flex" style={{ width: w(spentFlex) }} />
      <span className="budget-bar__seg sw--pending" style={{ width: w(pending) }} />
      {total > budget && <span className="budget-bar__limit" style={{ left: w(budget) }} />}
      <span className="budget-bar__marker" style={{ left: `${(elapsed / 100) * (budget / total) * 100}%` }} />
    </div>
  );
}
