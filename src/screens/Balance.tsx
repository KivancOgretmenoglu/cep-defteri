import { useMemo, useState } from 'react';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import type { ID } from '../domain/types';
import { addDays, monthEnd, monthOf, type ISODate } from '../domain/dates';
import { formatMoney, hiddenMoney, shortDate } from '../i18n/format';
import { useT } from '../i18n';
import type { Key } from '../i18n/core';
import { balanceProjection, balanceSeries, isDaily, periodEndFor, trackingStart } from '../domain/ledger';
import * as A from '../domain/actions';
import { commit } from '../store/store';
import { mascotEvent } from '../mascot/events';
import { BalanceChart } from '../ui/BalanceChart';
import { Chip, HIDDEN } from '../ui/kit';
import { go } from '../ui/nav';
import { useData } from '../ui/hooks';
import { EmptyState } from '../mascot/MascotNote';

type Range = '1m' | '3m' | '6m' | 'all';
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
  const start = trackingStart(data);

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
        <header className="screen-head"><h1>{t('balance.title')}</h1></header>
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
          <h1>{t('balance.title')}</h1>
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
    </div>
  );
}
