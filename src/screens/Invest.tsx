import { useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Plus, RefreshCw, Target, Pencil, Trash2 } from 'lucide-react';
import type { ID } from '../domain/types';
import type { Money } from '../domain/money';
import { monthEnd, monthOf, monthStart } from '../domain/dates';
import { formatMoney, hiddenMoney, pctForm, pctPlain, shortDate } from '../i18n/format';
import { useT } from '../i18n';
import { accountIndex, goalProgress, investmentState, isInvestment, rangeSummary, transferKind } from '../domain/ledger';
import * as A from '../domain/actions';
import { commit } from '../store/store';
import { Amount, Chip, Progress, SectionHead } from '../ui/kit';
import { openSheet } from '../ui/nav';
import { useData } from '../ui/hooks';
import { MascotNote, EmptyState } from '../mascot/MascotNote';

export function Invest() {
  const t = useT();
  const { data, today } = useData();
  const invAccounts = data.accounts.filter((a) => isInvestment(a) && (!a.archived || investmentState(data, a.id)!.currentValue !== 0));
  const [sel, setSel] = useState<ID | null>(null);
  const accountId = sel && invAccounts.some((a) => a.id === sel) ? sel : invAccounts[0]?.id;
  const month = monthOf(today);

  const view = useMemo(() => {
    if (!accountId) return null;
    const st = investmentState(data, accountId)!;
    const accounts = accountIndex(data);
    const only = { ...data, txs: data.txs.filter((t) => t.type === 'transfer' && (t.accountId === accountId || t.toAccountId === accountId)) };
    const m = rangeSummary(only, monthStart(month), monthEnd(month));
    const events = [
      ...only.txs.map((t) => ({ kind: transferKind(t, accounts), date: t.date, seq: t.seq, amount: t.amount, id: t.id, note: t.note, other: accounts.get(t.accountId === accountId ? t.toAccountId! : t.accountId)?.name })),
      ...st.history.map((v) => ({ kind: v.isOpening ? 'opening' : 'value', date: v.date, seq: v.seq, amount: v.value, id: v.id ?? 'opening', note: undefined, other: undefined })),
    ].sort((a, b) => (a.date === b.date ? b.seq - a.seq : a.date < b.date ? 1 : -1));
    const goals = data.goals.filter((g) => g.accountId === accountId).map((g) => goalProgress(data, g)!);
    return { st, m, events, goals };
  }, [data, accountId, month]);

  if (!accountId || !view) {
    return (
      <div className="screen">
        <header className="screen-head"><h1>{t('nav.invest')}</h1></header>
        <section className="card">
          <EmptyState outfit="gardener" mood="curious" title={t('inv.emptyTitle')} action={<button className="btn btn--primary" onClick={() => openSheet({ kind: 'account', kindPreset: 'investment' })}>{t('home.addInvestAccount')}</button>}>
            {t('inv.emptyBody')}
          </EmptyState>
        </section>
      </div>
    );
  }
  const { st, m, events, goals } = view;
  const reached = goals.find((g) => g.reached);
  const near = goals.find((g) => !g.reached && g.pct >= 80);

  return (
    <div className="screen">
      <header className="screen-head">
        <h1>{t('nav.invest')}</h1>
        {invAccounts.length > 1 && (
          <div className="chip-row">
            {invAccounts.map((a) => <Chip key={a.id} on={a.id === accountId} onClick={() => setSel(a.id)}>{a.name}</Chip>)}
          </div>
        )}
      </header>

      <div className="invest-grid">
        <section className="card invest-hero" aria-labelledby="inv-h">
          <div className="invest-hero__top">
            <h2 id="inv-h" className="label">{st.account.name} · {t('inv.currentValue')}</h2>
            <button className="icon-btn" onClick={() => openSheet({ kind: 'account', accountId })} aria-label={t('inv.editAccount')}><Pencil size={18} /></button>
          </div>
          <Amount value={st.currentValue} size="xl" tone="invest" hide={data.settings.hideTotals} />
          <p className="invest-hero__date">
            {st.lastValuation.isOpening ? t('inv.openingValue') : t('inv.lastValue')}: {data.settings.hideTotals ? hiddenMoney() : formatMoney(st.lastValuation.value)} · {shortDate(st.lastValuation.date, today)}
            {st.flowsSinceValuation !== 0 && <> · {t('inv.flowsAdded', { amount: formatMoney(st.flowsSinceValuation, { sign: true }) })}</>}
          </p>
          <div className="btn-row">
            <button className="btn btn--primary" onClick={() => openSheet({ kind: 'valuation', accountId })}><RefreshCw size={17} /> {t('inv.updateValue')}</button>
            <button className="btn btn--secondary" onClick={() => openSheet({ kind: 'add', preset: { type: 'invest', direction: 'in', accountId } })}><ArrowDownLeft size={17} /> {t('inv.moveIn')}</button>
            <button className="btn btn--ghost" onClick={() => openSheet({ kind: 'add', preset: { type: 'invest', direction: 'out', accountId } })}><ArrowUpRight size={17} /> {t('inv.withdraw')}</button>
          </div>
        </section>

        <section className="card" aria-labelledby="contrib-h">
          <SectionHead id="contrib-h" title={t('inv.yourMoney')} />
          <dl className="kv">
            <div><dt>{t('inv.thisMonth')}</dt><dd className="tone-invest">{formatMoney(m.contributions)}</dd></div>
            <div><dt>{t('inv.totalIn')} <small>{t('inv.totalInHint', { date: shortDate(st.account.openingDate, today) })}</small></dt><dd>{formatMoney(st.contributed)}</dd></div>
            <div><dt>{t('inv.withdrawn')}</dt><dd>{formatMoney(st.withdrawn)}</dd></div>
            <div className="kv__strong"><dt>{t('inv.net')} <small>{t('inv.netHint')}</small></dt><dd>{formatMoney(st.netContribution)}</dd></div>
            <div><dt>{t('inv.prior')}</dt><dd>{st.account.priorContribution != null ? formatMoney(st.account.priorContribution) : st.account.openingBalance === 0 ? '—' : t('inv.unknown')}</dd></div>
          </dl>
          <ValueDiff diff={st.valueDiff} basis={st.basis} onFix={() => openSheet({ kind: 'account', accountId })} />
        </section>

        <section className="card" aria-labelledby="goal-h">
          <SectionHead id="goal-h" title={t('inv.goals')} action={<button className="link" onClick={() => openSheet({ kind: 'goal', accountId })}><Plus size={16} /> {t('inv.goal')}</button>} />
          {(reached || near) && (
            <MascotNote
              compact
              size={64}
              outfit="gardener"
              mood={reached ? 'celebrate' : 'happy'}
              text={reached ? t('inv.goalDone', { goal: reached.goal.title, amount: formatMoney(reached.current) }) : t('inv.goalNear', { goal: near!.goal.title, pct: pctForm(near!.pct, 'locYou') })}
              why={t('inv.goalWhy')}
            />
          )}
          {goals.length === 0 ? (
            <p className="muted"><Target size={15} aria-hidden /> {t('inv.goalsEmpty', { amount: formatMoney(1000000) })}</p>
          ) : (
            <ul className="goal-list">
              {goals.map((g) => (
                <li key={g.goal.id}>
                  <button className="goal-row" onClick={() => openSheet({ kind: 'goal', goalId: g.goal.id })}>
                    <span className="goal-row__head">
                      <span>{g.goal.title}</span>
                      <span>{formatMoney(g.current)} / {formatMoney(g.goal.target)}</span>
                    </span>
                    <Progress value={g.current} max={g.goal.target} tone={g.reached ? 'pos' : 'invest'} label={t('inv.goalLabel', { goal: g.goal.title })} />
                    <small>{g.reached ? t('inv.reached') : `${pctPlain(g.pct)} · ${t('inv.left', { amount: formatMoney(g.goal.target - g.current) })}`}{!g.priorKnown ? t('inv.priorUnknownNote') : ''}</small>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card" aria-labelledby="chart-h">
          <SectionHead id="chart-h" title={t('inv.chartTitle')} />
          <ValueChart history={st.history.map((h) => ({ date: h.date, value: h.value }))} />
          <p className="note-line">{t('inv.chartNote')}</p>
        </section>

        <section className="card card--span" aria-labelledby="hist-h">
          <SectionHead id="hist-h" title={t('inv.history')} />
          <ul className="inv-events">
            {events.map((e) => (
              <li key={e.kind + e.id} className={`inv-ev inv-ev--${e.kind}`}>
                <span className="inv-ev__date">{shortDate(e.date, today)}</span>
                <span className="inv-ev__main">
                  {e.kind === 'contribution' && <>{t('inv.ev.contribution')} <small>{t('inv.ev.from', { name: e.other ?? '' })}{e.note ? ` · ${e.note}` : ''}</small></>}
                  {e.kind === 'withdrawal' && <>{t('inv.ev.withdrawal')} <small>{t('inv.ev.to', { name: e.other ?? '' })}{e.note ? ` · ${e.note}` : ''}</small></>}
                  {e.kind === 'investment-internal' && <>{t('inv.ev.internal')}</>}
                  {e.kind === 'value' && <>{t('inv.ev.value')} <small>{t('inv.ev.valueHint')}</small></>}
                  {e.kind === 'opening' && <>{t('inv.ev.opening')} <small>{t('inv.ev.openingHint')}</small></>}
                </span>
                <span className="inv-ev__amt">
                  {e.kind === 'contribution' ? '+' : e.kind === 'withdrawal' ? '−' : ''}
                  {formatMoney(e.amount)}
                </span>
                {(e.kind === 'contribution' || e.kind === 'withdrawal') && (
                  <button className="icon-btn icon-btn--small" aria-label={t('common.edit')} onClick={() => openSheet({ kind: 'edit', txId: e.id })}><Pencil size={15} /></button>
                )}
                {e.kind === 'value' && (
                  <button className="icon-btn icon-btn--small" aria-label={t('inv.deleteValue')} onClick={() => commit((d) => A.deleteValuation(d, e.id), t('inv.valueDeleted'))}><Trash2 size={15} /></button>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function ValueDiff({ diff, basis, onFix }: { diff: Money | null; basis: Money | null; onFix: () => void }) {
  const t = useT();
  if (diff === null || basis === null)
    return (
      <p className="callout callout--quiet">
        {t('inv.diffUnknown')} <button className="link link--small" onClick={onFix}>{t('inv.addInfo')}</button>
      </p>
    );
  return (
    <p className="callout callout--quiet">
      {t('inv.diffPre')} <b>{t(diff >= 0 ? 'inv.diffMore' : 'inv.diffLess', { amount: formatMoney(Math.abs(diff)) })}</b> {t('inv.diffPost', { basis: formatMoney(basis) })}
    </p>
  );
}

function ValueChart({ history }: { history: { date: string; value: number }[] }) {
  const t = useT();
  if (history.length < 2) return <p className="muted">{t('inv.chartEmpty')}</p>;
  const W = 320, H = 132, P = 8, B = 22;
  const vals = history.map((h) => h.value);
  const min = Math.min(...vals), max = Math.max(...vals);
  const span = max - min || 1;
  const pts = history.map((h, i) => [P + (i / (history.length - 1)) * (W - 2 * P), H - B - ((h.value - min) / span) * (H - B - P)] as const);
  return (
    <svg className="value-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${t('inv.chartAria')}: ${history.map((h) => `${shortDate(h.date)} ${formatMoney(h.value)}`).join(', ')}`}>
      <polyline points={pts.map((p) => p.join(',')).join(' ')} fill="none" stroke="var(--invest)" strokeWidth="2" strokeLinejoin="round" />
      {pts.map(([x, y], i) => <rect key={i} x={x - 3} y={y - 3} width="6" height="6" fill="var(--surface)" stroke="var(--invest)" strokeWidth="2" />)}
      <text x={0} y={H - 2} className="value-chart__lbl">{shortDate(history[0].date)}</text>
      <text x={W} y={H - 2} textAnchor="end" className="value-chart__lbl">{shortDate(history[history.length - 1].date)}</text>
    </svg>
  );
}
