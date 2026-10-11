import { useMemo, useState } from 'react';
import { ArrowLeft, Eye, EyeOff, Pencil, Plus } from 'lucide-react';
import type { ID } from '../domain/types';
import { addDays, monthEnd, monthOf, type ISODate } from '../domain/dates';
import { formatMoney, hiddenMoney, shortDate } from '../i18n/format';
import { useT } from '../i18n';
import type { Key } from '../i18n/core';
import { balanceProjection, balanceSeries, isDaily, periodEndFor, trackingStart } from '../domain/ledger';
import * as A from '../domain/actions';
import { spendingGap, spendingPlan, type SpendingPlan, type SpendingGap } from '../domain/spendingPlan';
import { commit } from '../store/store';
import { mascotEvent } from '../mascot/events';
import { BalanceChart } from '../ui/BalanceChart';
import { SpendingChart } from '../ui/SpendingChart';
import { Chip, HIDDEN } from '../ui/kit';
import { go, openSheet } from '../ui/nav';
import { useData } from '../ui/hooks';
import { EmptyState } from '../mascot/MascotNote';

type Range = '1m' | '3m' | '6m' | 'all';
type View = 'spend' | 'balance';
const VIEW_KEY = 'cep.chartView';
function initialView(): View {
  try {
    return localStorage.getItem(VIEW_KEY) === 'balance' ? 'balance' : 'spend';
  } catch {
    return 'spend';
  }
}
const RANGES: { v: Range; label: Key; days: number | null }[] = [
  { v: '1m', label: 'bal.1m', days: 30 },
  { v: '3m', label: 'bal.3m', days: 91 },
  { v: '6m', label: 'bal.6m', days: 182 },
  { v: 'all', label: 'common.all', days: null },
];

export function Balance() {
  const t = useT();
  const { data, today } = useData();
  const hide = data.settings.hideTotals;
  const daily = data.accounts.filter(isDaily);
  const [range, setRange] = useState<Range>('1m');
  const [acc, setAcc] = useState<ID | 'all'>('all');
  const [showProj, setShowProj] = useState(true);
  const [mode, setModeState] = useState<View>(initialView);
  const setMode = (v: View) => {
    setModeState(v);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {
      /* yalnız kolaylık */
    }
  };
  const start = trackingStart(data);
  const sp = useMemo(() => spendingPlan(data, today), [data, today]);

  const view = useMemo(() => {
    if (!start) return null;
    const r = RANGES.find((x) => x.v === range)!;
    let from = r.days ? addDays(today, -(r.days - 1)) : start;
    if (from < start) from = start;
    const ids = acc === 'all' ? undefined : [acc];
    const history = balanceSeries(data, from, today, ids);
    const end = data.settings.periodMode === 'days30' ? periodEndFor(data, today) : monthEnd(monthOf(today));
    const projection = balanceProjection(data, today, end, ids);
    const txCount = new Map<ISODate, number>();
    const idSet = new Set(ids ?? daily.map((a) => a.id));
    for (const t of data.txs) if (idSet.has(t.accountId) || idSet.has(t.toAccountId ?? '')) txCount.set(t.date, (txCount.get(t.date) ?? 0) + 1);
    const low = history.reduce((m, p) => (p.balance < m.balance ? p : m), history[0]);
    const projLow = projection.reduce((m, p) => (p.balance < m.balance ? p : m), projection[0]);
    return { history, projection, txCount, from, end, low, projLow };
  }, [data, today, range, acc, start, daily]);

  if (!view || daily.length === 0) {
    return (
      <div className="screen">
        <header className="screen-head"><h1>{t('spend.screenTitle')}</h1></header>
        <section className="card">
          <EmptyState outfit="scholar" title={t('bal.emptyTitle')}>{t('bal.emptyBody')}</EmptyState>
        </section>
      </div>
    );
  }
  const first = view.history[0], last = view.history[view.history.length - 1];
  const change = last.balance - first.balance;
  const projEnd = view.projection[view.projection.length - 1];
  const money = (v: number, sign = false) => (hide ? hiddenMoney() : formatMoney(v, { sign }));
  // Tablo görünümü: haftalık örnekler + son gün
  const rows = view.history.filter((_, i) => i % 7 === 0 || i === view.history.length - 1);

  return (
    <div className="screen">
      <header className="screen-head">
        <div className="head-with-back">
          <button className="icon-btn" onClick={() => go('home')} aria-label={t('common.backHome')}><ArrowLeft size={20} /></button>
          <h1>{t('spend.screenTitle')}</h1>
        </div>
        <button
          className="icon-btn"
          aria-pressed={hide}
          aria-label={hide ? t('home.showBalances') : t('home.hideBalances')}
          onClick={() => {
            commit((d) => A.updateSettings(d, { hideTotals: !hide }));
            mascotEvent({ type: 'hide-totals', hidden: !hide });
          }}
        >
          {hide ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </header>

      <div className="segmented spend-view" role="radiogroup" aria-label={t('spend.view')}>
        {(['spend', 'balance'] as const).map((v) => (
          <button key={v} role="radio" aria-checked={mode === v} className={mode === v ? 'is-on' : ''} onClick={() => setMode(v)}>
            {t(v === 'spend' ? 'spend.tabSpend' : 'spend.tabBalance')}
          </button>
        ))}
      </div>

      {mode === 'spend' && sp && <SpendingCard sp={sp} gap={spendingGap(data, today, sp)} hide={hide} today={today} floor={data.settings.monthEndFloor ?? null} />}

      {mode === 'balance' && <>
      <div className="chip-row" role="group" aria-label={t('csv.account')}>
        <Chip on={acc === 'all'} onClick={() => setAcc('all')}>{t('bal.allDaily')}</Chip>
        {daily.map((a) => (
          <Chip key={a.id} on={acc === a.id} onClick={() => setAcc(a.id)}>{a.name}</Chip>
        ))}
      </div>

      <section className="card">
        <div className="bal-head">
          <div>
            <p className="label">{acc === 'all' ? t('bal.daily') : daily.find((a) => a.id === acc)?.name} · {t('chart.today')}</p>
            <p className="bal-head__now">{money(last.balance)}</p>
            <p className="note-line">
              {t('bal.since', { date: shortDate(first.date, today), amount: hide ? HIDDEN : formatMoney(change, { sign: true }) })}
            </p>
          </div>
          <div className="segmented segmented--sm bal-range" role="radiogroup" aria-label={t('bal.range')}>
            {RANGES.map((r) => (
              <button key={r.v} role="radio" aria-checked={range === r.v} className={range === r.v ? 'is-on' : ''} onClick={() => setRange(r.v)}>
                {t(r.label)}
              </button>
            ))}
          </div>
        </div>
        <BalanceChart
          history={view.history}
          projection={showProj ? view.projection : []}
          today={today}
          hide={hide}
          txCount={view.txCount}
          label={t('bal.chartLabel')}
        />
        <div className="bal-legend">
          <span><i className="bchart__key" /> {t('bal.actual')}</span>
          <label className="bal-legend__toggle">
            <input type="checkbox" checked={showProj} onChange={(e) => setShowProj(e.target.checked)} />
            <i className="bchart__key is-proj" /> {t('bal.projection', { date: shortDate(view.end, today) })}
          </label>
        </div>
        <dl className="kv">
          <div><dt>{t('bal.lowest')}</dt><dd>{money(view.low.balance)} <small className="muted">{shortDate(view.low.date, today)}</small></dd></div>
          {showProj && view.projection.length > 1 && (
            <>
              <div><dt>{t('bal.periodEnd')} <small>{t('bal.periodEndHint')}</small></dt><dd>{money(projEnd.balance)}</dd></div>
              <div><dt>{t('bal.projLowest')}</dt><dd>{money(view.projLow.balance)} <small className="muted">{shortDate(view.projLow.date, today)}</small></dd></div>
            </>
          )}
        </dl>
        <p className="note-line">{t('bal.dashedNote')}</p>
        <details className="details">
          <summary>{t('bal.asTable')}</summary>
          <table className="cmp-table">
            <thead><tr><th scope="col">{t('csv.date')}</th><th scope="col">{t('bal.balance')}</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.date}><th scope="row">{shortDate(r.date, today)}</th><td>{money(r.balance)}</td></tr>
              ))}
            </tbody>
          </table>
        </details>
      </section>
      </>}
    </div>
  );
}

/** Harcama görünümü: birikimli harcama eğrisi, plan çizgisi ve bugünkü farkın metin özeti. */
function SpendingCard({ sp, gap, hide, today, floor }: { sp: SpendingPlan; gap: SpendingGap | null; hide: boolean; today: ISODate; floor: number | null }) {
  const t = useT();
  const total = sp.spending[sp.spending.length - 1]?.value ?? 0;
  const money = (v: number) => (hide ? hiddenMoney() : formatMoney(v));
  return (
    <section className="card">
      <div className="spend-head">
        <div>
          <p className="label">{t('spend.label')} · {t('spend.period', { from: shortDate(sp.from), to: shortDate(sp.to) })}</p>
          <p className="bal-head__now">{money(total)}</p>
        </div>
      </div>
      <SpendingChart from={sp.from} to={sp.to} spending={sp.spending} plan={sp.plan} today={today} hide={hide} label={t('spend.chartLabel')} />
      <div className="bal-legend">
        <span><i className="bchart__key" /> {t('spend.actual')}</span>
        {sp.plan.length > 0 && <span><i className="bchart__key schart__key is-plan" /> {t('spend.legendPlan')}</span>}
      </div>
      {gap ? <SpendSummary gap={gap} hide={hide} floor={floor} /> : (
        <div className="plan-cta">
          <p className="note-line">{t('spend.ctaHint')}</p>
          <div className="btn-row" style={{ alignItems: "center" }}>
            <button className="btn btn--secondary btn--small" onClick={() => go('budget')}><Plus size={16} /> {t('spend.cta')}</button>
            <button className="link" onClick={() => openSheet({ kind: 'floor' })}>{t('spend.ctaFloor')}</button>
          </div>
        </div>
      )}
    </section>
  );
}

function SpendSummary({ gap, hide, floor }: { gap: SpendingGap; hide: boolean; floor: number | null }) {
  const t = useT();
  const amount = formatMoney(Math.abs(gap.diff));
  const text =
    Math.abs(gap.diff) < 100
      ? t('spend.on')
      : gap.diff > 0
        ? hide ? t('spend.overHidden') : t('spend.over', { amount })
        : hide ? t('spend.underHidden') : t('spend.under', { amount });
  const fromFloor = gap.sp.source === 'floor';
  return (
    <div className="plan-summary">
      <p className={`plan-summary__text ${gap.state === 'over' ? 'is-over' : ''}`} role="status">{text}</p>
      <p className="note-line">
        {t('spend.target')}: {hide ? hiddenMoney() : formatMoney(gap.target)} · {t('spend.allowance')} ({t(fromFloor ? 'spend.fromFloor' : 'spend.fromBudget')}): {hide ? hiddenMoney() : formatMoney(gap.sp.allowance)}{' '}
        <button className="link" onClick={() => (fromFloor ? openSheet({ kind: 'floor' }) : go('budget'))}><Pencil size={14} /> {t('spend.edit')}</button>
      </p>
      {!gap.sp.reachable && <p className="note-line plan-summary__warn">{t('spend.unreachable')}</p>}
      <p className="note-line">{t('spend.note')}</p>
      {fromFloor && floor !== null && <p className="note-line">{t('spend.noteFloor', { floor: hide ? hiddenMoney() : formatMoney(floor) })}</p>}
    </div>
  );
}
