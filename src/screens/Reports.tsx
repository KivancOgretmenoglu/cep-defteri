import { useMemo } from 'react';
import { Download, ChevronRight, ScrollText } from 'lucide-react';
import type { Data, ID } from '../domain/types';
import type { Money } from '../domain/money';
import { addMonths, dayOfMonth, monthOf, type MonthKey } from '../domain/dates';
import { catName as catLabel, formatMoney, monthLabel, monthName, monthShort, pctForm, pctPlain, shortDate } from '../i18n/format';
import { t as T, useT } from '../i18n';
import { allTags, budgetStatus, compareMonth, monthTrend, tagSummary, type Comparison } from '../domain/ledger';
import { monthEnd, monthStart } from '../domain/dates';
import { MonthSwitcher, SectionHead } from '../ui/kit';
import { go, openSheet, useNav } from '../ui/nav';
import { useData, useLookups } from '../ui/hooks';
import { MascotNote, EmptyState } from '../mascot/MascotNote';
import { CatIcon } from '../ui/icons';
import { downloadCSV } from './Settings';
import type { Mood } from '../domain/mood';

function rangeText(c: Comparison['current']) {
  const a = dayOfMonth(c.from), b = dayOfMonth(c.to);
  return T('rep.range', { a, b, mon: monthShort(monthOf(c.from)) });
}

/** Rapor yorumu: yalnızca gerçek kayıtlardan; karşılaştırma anlamlı değilse söylemez. */
function reportComment(data: Data, month: MonthKey, today: string, c: Comparison, catName: (id: ID) => string): { mood: Mood; text: string; why: string } {
  if (c.current.txCount === 0) return { mood: 'curious', text: T('rep.c.empty'), why: T('rep.c.emptyWhy') };
  const lines: string[] = [];
  const whys: string[] = [];
  if (!c.meaningful) {
    lines.push(c.previousComplete ? T('rep.c.noPrev') : T('rep.c.partialPrev', { month: monthName(addMonths(month, -1)) }));
  } else {
    const d = c.current.spending - c.previous.spending;
    if (c.previous.spending > 0) {
      const ch = Math.round((Math.abs(d) / c.previous.spending) * 100);
      lines.push(d === 0 ? T('rep.c.same') : T(d < 0 ? 'rep.c.less' : 'rep.c.more', { range: rangeText(c.previous), pct: pctPlain(ch), from: formatMoney(c.previous.spending), to: formatMoney(c.current.spending) }));
    }
    // En çok değişen kategori
    const ids = new Set([...c.current.spendingByCategory.keys(), ...c.previous.spendingByCategory.keys()]);
    let best: { id: ID; diff: Money } | null = null;
    for (const id of ids) {
      const diff = (c.current.spendingByCategory.get(id) ?? 0) - (c.previous.spendingByCategory.get(id) ?? 0);
      if (!best || Math.abs(diff) > Math.abs(best.diff)) best = { id, diff };
    }
    if (best && Math.abs(best.diff) >= 5000) lines.push(T('rep.c.biggest', { cat: catName(best.id), amount: formatMoney(best.diff, { sign: true }) }));
    whys.push(T('rep.c.ranges', { a: rangeText(c.current), b: rangeText(c.previous), partial: c.partial ? T('rep.c.rangesPartial') : '' }));
  }
  const b = budgetStatus(data, month, today);
  let mood: Mood = 'calm';
  if (b.budget !== null && b.usedPct !== null) {
    if (c.partial) lines.push(T('rep.c.budgetPace', { used: pctForm(b.usedPct, 'poss'), elapsed: pctForm(b.elapsedPct, 'poss') }));
    else lines.push(b.spent <= b.budget ? T('rep.c.closedUnder', { amount: formatMoney(b.budget - b.spent) }) : T('rep.c.closedOver', { amount: formatMoney(b.spent - b.budget) }));
    if (b.state === 'on-track' || b.state === 'closed-within') mood = 'happy';
    if (b.state === 'over' || b.state === 'tight') mood = 'thoughtful';
    whys.push(T('rep.c.budgetWhy'));
  } else whys.push(T('rep.c.noBudgetWhy'));
  return { mood, text: lines.join(' '), why: whys.join(' ') };
}

export function Reports() {
  const t = useT();
  const { data, today } = useData();
  const { cats } = useLookups(data);
  const nav = useNav();
  const current = monthOf(today);
  const month = nav.reportMonth ?? current;
  const setMonth = (m: MonthKey) => go('reports', { reportMonth: m });
  const c = useMemo(() => compareMonth(data, month, today), [data, month, today]);
  const trend = useMemo(() => monthTrend(data, month, 6), [data, month]);
  const catName = (id: ID) => (cats.get(id) ? catLabel(cats.get(id)) : t('rep.uncategorized'));
  const comment = reportComment(data, month, today, c, catName);
  const s = c.current;

  const spendRows = [...s.spendingByCategory.entries()].filter(([, v]) => v !== 0).sort((a, b) => b[1] - a[1]);
  const incomeRows = [...s.incomeBySource.entries()].sort((a, b) => b[1] - a[1]);
  const maxSpend = Math.max(1, ...spendRows.map(([, v]) => v));
  const maxInc = Math.max(1, ...incomeRows.map(([, v]) => v));
  const tagRows = allTags(data)
    .map((t) => ({ tag: t.tag, month: tagSummary(data, t.tag, monthStart(month), monthEnd(month)), all: tagSummary(data, t.tag) }))
    .filter((r) => r.month.txCount > 0 || r.all.txCount > 0)
    .sort((a, b) => b.month.spending - a.month.spending || b.all.spending - a.all.spending)
    .slice(0, 8);

  if (data.txs.length === 0) {
    return (
      <div className="screen">
        <header className="screen-head"><h1>{t('nav.reports')}</h1></header>
        <section className="card">
          <EmptyState outfit="scholar" title={t('rep.emptyTitle')}>{t('rep.emptyBody')}</EmptyState>
        </section>
      </div>
    );
  }

  return (
    <div className="screen">
      <header className="screen-head">
        <h1>{t('nav.reports')}</h1>
        <MonthSwitcher month={month} onChange={setMonth} max={current} />
      </header>

      <MascotNote mood={comment.mood} text={comment.text} why={comment.why} outfit="scholar" size={84} />
      {month < current && (
        <button className="report-prompt" onClick={() => openSheet({ kind: 'reportCard', month })}>
          <ScrollText size={20} aria-hidden />
          <span><b>{t('rep.cardTitle', { month: monthLabel(month) })}</b><small>{t('rep.cardSub')}</small></span>
          <ChevronRight size={18} aria-hidden />
        </button>
      )}

      <div className="report-grid">
        <section className="card" aria-labelledby="sum-h">
          <SectionHead id="sum-h" title={c.partial ? `${monthLabel(month)} · ${shortDate(s.from)}–${shortDate(s.to)}` : monthLabel(month)} />
          <table className="cmp-table">
            <thead>
              <tr>
                <th scope="col"></th>
                <th scope="col">{t('rep.thisPeriod')}<small>{rangeText(c.current)}</small></th>
                <th scope="col">{t('rep.previous')}<small>{rangeText(c.previous)}</small></th>
              </tr>
            </thead>
            <tbody>
              <tr><th scope="row">{t('tx.income')}</th><td className="tone-pos">{formatMoney(s.income)}</td><td>{c.previousComplete ? formatMoney(c.previous.income) : '—'}</td></tr>
              <tr><th scope="row">{t('txs.spending')}</th><td>{formatMoney(s.spending)}</td><td>{c.previousComplete ? formatMoney(c.previous.spending) : '—'}</td></tr>
              <tr><th scope="row">{t('home.statInvest')}</th><td className="tone-invest">{formatMoney(s.contributions)}</td><td>{c.previousComplete ? formatMoney(c.previous.contributions) : '—'}</td></tr>
              <tr><th scope="row">{t('rep.net')}</th><td>{formatMoney(s.income - s.spending, { sign: true })}</td><td>{c.previousComplete ? formatMoney(c.previous.income - c.previous.spending, { sign: true }) : '—'}</td></tr>
            </tbody>
          </table>
          {!c.previousComplete && <p className="note-line">{t('rep.prevHidden')}</p>}
          {c.partial && <p className="note-line">{t('rep.partialNote', { range: rangeText(c.previous) })}</p>}
        </section>

        <section className="card" aria-labelledby="cat-h">
          <SectionHead id="cat-h" title={t('rep.spendCats')} />
          {spendRows.length === 0 ? <p className="muted">{t('rep.noSpend')}</p> : (
            <ul className="bars">
              {spendRows.map(([id, v]) => {
                const cat = cats.get(id);
                const prev = c.previous.spendingByCategory.get(id) ?? 0;
                return (
                  <li key={id}>
                    <button className="bar-row" onClick={() => go('tx', { filter: { month, categoryId: id, kind: 'expense' } })}>
                      <span className="bar-row__head">
                        <span className="bar-row__name" style={{ '--cat': cat?.color } as React.CSSProperties}>
                          <CatIcon icon={cat?.icon ?? 'dots'} size={15} /> {catName(id)}
                        </span>
                        <span className="bar-row__val">
                          {formatMoney(v)}
                          {c.meaningful && <small className="bar-row__delta">{prev === 0 ? t('rep.prevZero') : `${formatMoney(v - prev, { sign: true })}`}</small>}
                        </span>
                      </span>
                      <span className="bar"><span className="bar__fill" style={{ width: `${(Math.max(v, 0) / maxSpend) * 100}%`, background: cat?.color }} /></span>
                      <ChevronRight size={16} className="bar-row__chev" aria-hidden />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {s.refunds > 0 && <p className="note-line">{t('rep.refundsNote', { amount: formatMoney(s.refunds) })}</p>}
        </section>

        <section className="card" aria-labelledby="inc-h">
          <SectionHead id="inc-h" title={t('rep.incomeSources')} />
          {incomeRows.length === 0 ? <p className="muted">{t('rep.noIncome')}</p> : (
            <ul className="bars">
              {incomeRows.map(([id, v]) => {
                const cat = cats.get(id);
                return (
                  <li key={id}>
                    <button className="bar-row" onClick={() => go('tx', { filter: { month, categoryId: id, kind: 'income' } })}>
                      <span className="bar-row__head">
                        <span className="bar-row__name" style={{ '--cat': cat?.color } as React.CSSProperties}><CatIcon icon={cat?.icon ?? 'dots'} size={15} /> {catName(id)}</span>
                        <span className="bar-row__val">{formatMoney(v)}</span>
                      </span>
                      <span className="bar"><span className="bar__fill" style={{ width: `${(v / maxInc) * 100}%`, background: cat?.color }} /></span>
                      <ChevronRight size={16} className="bar-row__chev" aria-hidden />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="note-line">{t('rep.incomeNote')}</p>
        </section>

        {tagRows.length > 0 && (
          <section className="card" aria-labelledby="tag-h">
            <SectionHead id="tag-h" title={t('csv.tags')} />
            <ul className="bars">
              {tagRows.map((r) => (
                <li key={r.tag}>
                  <button className="bar-row" onClick={() => go('tx', { filter: { tag: r.tag } })}>
                    <span className="bar-row__head">
                      <span className="bar-row__name">#{r.tag}</span>
                      <span className="bar-row__val">
                        {formatMoney(r.month.spending)}
                        <small className="bar-row__delta">{t('rep.allTime', { amount: formatMoney(r.all.spending) })}</small>
                      </span>
                    </span>
                    <ChevronRight size={16} className="bar-row__chev" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
            <p className="note-line">{t('rep.tagsNote')}</p>
          </section>
        )}

        <section className="card" aria-labelledby="trend-h">
          <SectionHead id="trend-h" title={t('rep.last6')} />
          <Trend trend={trend} current={current} onPick={setMonth} selected={month} />
        </section>

        <section className="card card--span">
          <SectionHead title={t('rep.export')} />
          <p className="muted">{t('rep.exportBody')}</p>
          <button className="btn btn--secondary" onClick={() => downloadCSV(data)}><Download size={17} /> {t('rep.exportBtn')}</button>
        </section>
      </div>
    </div>
  );
}

function Trend({ trend, current, onPick, selected }: { trend: ReturnType<typeof monthTrend>; current: MonthKey; onPick: (m: MonthKey) => void; selected: MonthKey }) {
  const tt = useT();
  const max = Math.max(1, ...trend.map((t) => Math.max(t.summary.income, t.summary.spending, t.summary.contributions)));
  return (
    <>
      <div className="trend" role="list">
        {trend.map((t) => (
          <button key={t.month} role="listitem" className={`trend__col ${t.month === selected ? 'is-on' : ''}`} onClick={() => onPick(t.month)} aria-label={`${monthLabel(t.month)}: ${tt('rep.trendAria', { inc: formatMoney(t.summary.income), sp: formatMoney(t.summary.spending), inv: formatMoney(t.summary.contributions) })}${!t.tracked ? tt('rep.trendNoTrack') : ''}`}>
            <span className="trend__bars">
              {t.tracked ? (
                <>
                  <span className="trend__bar trend__bar--inc" style={{ height: `${(t.summary.income / max) * 100}%` }} />
                  <span className="trend__bar trend__bar--sp" style={{ height: `${(Math.max(t.summary.spending, 0) / max) * 100}%` }} />
                  <span className="trend__bar trend__bar--inv" style={{ height: `${(t.summary.contributions / max) * 100}%` }} />
                </>
              ) : <span className="trend__none">—</span>}
            </span>
            <span className="trend__lbl">{monthShort(t.month)}{t.month === current ? '*' : ''}{t.partialTracking ? '°' : ''}</span>
          </button>
        ))}
      </div>
      <div className="trend-legend">
        <span><i className="sw sw--inc" /> {tt('tx.income')}</span>
        <span><i className="sw sw--sp" /> {tt('txs.spending')}</span>
        <span><i className="sw sw--inv" /> {tt('txs.kindInvest')}</span>
      </div>
      <p className="note-line">{tt('rep.trendNote')}</p>
    </>
  );
}
