import { useEffect, useMemo, useState } from 'react';
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
import { MascotNote, SceneEmpty, LiveMascot } from '../mascot/MascotNote';
import { refreshPrices, usePrices } from '../store/prices';
import { agoText, formatQty, unitName, unitShort } from '../sheets/AssetFields';
import type { AssetHolding, AssetPosition } from '../domain/ledger';
import { roundQty, unitOrder, type AssetLot, type AssetUnit } from '../domain/assets';

export function Invest() {
  const t = useT();
  const { data, today } = useData();
  const prices = usePrices();
  const book = prices.book;
  const hasAsset = data.accounts.some((a) => isInvestment(a) && a.asset);
  // Altın/döviz hesabı varsa ekran açılınca fiyatlar (15 dk'dan eskiyse) yenilenir.
  useEffect(() => {
    if (hasAsset) void refreshPrices();
  }, [hasAsset]);
  const invAccounts = data.accounts.filter((a) => isInvestment(a) && (!a.archived || investmentState(data, a.id, book)!.currentValue !== 0));
  const [sel, setSel] = useState<ID | null>(null);
  const accountId = sel && invAccounts.some((a) => a.id === sel) ? sel : invAccounts[0]?.id;
  const month = monthOf(today);

  const view = useMemo(() => {
    if (!accountId) return null;
    const st = investmentState(data, accountId, book)!;
    const accounts = accountIndex(data);
    const only = { ...data, txs: data.txs.filter((t) => t.type === 'transfer' && (t.accountId === accountId || t.toAccountId === accountId)) };
    const m = rangeSummary(only, monthStart(month), monthEnd(month));
    const events = [
      ...only.txs.map((t) => ({ kind: transferKind(t, accounts), date: t.date, seq: t.seq, amount: t.amount, id: t.id, note: t.note, other: accounts.get(t.accountId === accountId ? t.toAccountId! : t.accountId)?.name, unit: t.unit, qty: t.qty, unitPrice: t.unitPrice, lots: undefined as AssetLot[] | undefined })),
      // Altın/döviz hesabında elle değer kaydı yoktur; geçmiş noktaları işlemlerin kendisidir.
      ...st.history.filter((v) => !st.asset || v.isOpening).map((v) => ({ kind: v.isOpening ? 'opening' : 'value', date: v.date, seq: v.seq, amount: v.value, id: v.id ?? 'opening', note: undefined, other: undefined, unit: undefined, qty: undefined, unitPrice: undefined, lots: v.isOpening ? st.account.asset?.opening : undefined })),
    ].sort((a, b) => (a.date === b.date ? b.seq - a.seq : a.date < b.date ? 1 : -1));
    const goals = data.goals.filter((g) => g.accountId === accountId).map((g) => goalProgress(data, g)!);
    return { st, m, events, goals };
  }, [data, accountId, month, book]);
  // Tüm altın/döviz hesaplarındaki miktarlar, tür tür toplanmış: "15 gram · 3 çeyrek · 150 USD"
  const totals = new Map<AssetUnit, number>();
  for (const a of data.accounts) {
    if (!isInvestment(a) || !a.asset || a.archived) continue;
    for (const p of investmentState(data, a.id, book)!.asset!.positions) totals.set(p.unit, (totals.get(p.unit) ?? 0) + p.qty);
  }
  const holdings = [...totals].sort((a, b) => unitOrder(a[0], b[0])).map(([unit, qty]) => ({ unit, qty: roundQty(qty, unit) }));

  if (!accountId || !view) {
    return (
      <div className="screen">
        <header className="screen-head"><h1>{t('nav.invest')}</h1></header>
        <section className="card">
          <SceneEmpty scene="invest" onAction={() => openSheet({ kind: 'account', kindPreset: 'investment' })} />
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
        <div className="head-with-back invest-head">
          <h1>{t('nav.invest')}</h1>
          {/* Yatırım ekranının maskotu takım elbiseli; toplamlar gizliyse gizli ajan */}
          <LiveMascot outfit={data.settings.hideTotals ? 'spy' : 'suit'} mood="happy" size={56} />
        </div>
        {invAccounts.length > 1 && (
          <div className="chip-row">
            {invAccounts.map((a) => <Chip key={a.id} on={a.id === accountId} onClick={() => setSel(a.id)}>{a.name}</Chip>)}
          </div>
        )}
        {holdings.length > 0 && !data.settings.hideTotals && (
          <p className="muted invest-holdings">{t('asset.holding')}: {holdings.map((h) => formatQty(t, h.qty, h.unit)).join(' · ')}</p>
        )}
      </header>

      <div className="invest-grid">
        <section className="card invest-hero" aria-labelledby="inv-h">
          <div className="invest-hero__top">
            <h2 id="inv-h" className="label">{st.account.name} · {t('inv.currentValue')}</h2>
            <button className="icon-btn" onClick={() => openSheet({ kind: 'account', accountId })} aria-label={t('inv.editAccount')}><Pencil size={18} /></button>
          </div>
          <Amount value={st.currentValue} size="xl" tone="invest" hide={data.settings.hideTotals} />
          {st.asset ? (
            <AssetBreakdown asset={st.asset} failed={prices.failed} loading={prices.loading} hide={data.settings.hideTotals} />
          ) : (
          <p className="invest-hero__date">
            {st.lastValuation.isOpening ? t('inv.openingValue') : t('inv.lastValue')}: {data.settings.hideTotals ? hiddenMoney() : formatMoney(st.lastValuation.value)} · {shortDate(st.lastValuation.date, today)}
            {st.flowsSinceValuation !== 0 && <> · {t('inv.flowsAdded', { amount: formatMoney(st.flowsSinceValuation, { sign: true }) })}</>}
          </p>
          )}
          <div className="btn-row">
            <button className="btn btn--primary" onClick={() => openSheet({ kind: 'valuation', accountId })}><RefreshCw size={17} /> {st.asset ? t('asset.setPrice') : t('inv.updateValue')}</button>
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
              outfit={data.settings.hideTotals ? 'spy' : 'suit'}
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
          <ValueChart history={[...st.history.map((h) => ({ date: h.date, value: h.value })), ...(st.asset && st.asset.positions.some((p) => p.price !== null) ? [{ date: today, value: st.currentValue }] : [])]} />
          <p className="note-line">{st.asset ? t('asset.chartNote') : t('inv.chartNote')}</p>
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
                  {st.asset && e.unit && e.qty !== undefined && e.unitPrice !== undefined && (
                    <small className="inv-ev__qty">{unitName(t, e.unit)}: {t('asset.ev.qty', { qty: formatQty(t, e.qty, e.unit), unit: unitShort(t, e.unit), price: formatMoney(e.unitPrice) })}</small>
                  )}
                  {st.asset && e.lots && e.lots.length > 0 && (
                    <small className="inv-ev__qty">{t('asset.ev.openingQty', { qty: e.lots.map((l) => formatQty(t, l.qty, l.unit)).join(' + ') })}</small>
                  )}
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

/** Altın/döviz hesabı: tür tür miktar ve değer, toplam, fiyatların yaşı ve kaynağı, yenile. */
function AssetBreakdown({ asset, failed, loading, hide }: { asset: AssetHolding; failed: boolean; loading: boolean; hide: boolean }) {
  const t = useT();
  const srcText = (p: AssetPosition) => (p.priceSource === 'estimate' ? t('asset.src.estimate') : p.priceSource === 'manual' ? t('asset.src.manual') : p.priceSource === 'last-tx' ? t('asset.src.lastTx') : '');
  // En eski güncel fiyat zamanı: "Fiyatlar: 5 dk önce"
  const liveAts = asset.positions.map((p) => p.priceAt).filter((x): x is number => typeof x === 'number');
  const oldest = liveAts.length ? Math.min(...liveAts) : null;
  if (asset.positions.length === 0) return <p className="note-line">{t('asset.noHoldingsYet')}</p>;
  return (
    <>
      <ul className="asset-breakdown" aria-label={t('asset.breakdown')}>
        {asset.positions.map((p) => {
          const src = p.priceSource !== 'live' ? srcText(p) : '';
          return (
            <li key={p.unit} className="asset-breakdown__row">
              <span className="asset-breakdown__name">
                {unitName(t, p.unit)}
                <small>
                  {p.price !== null ? t('asset.ev.qty', { qty: hide ? '•••' : formatQty(t, p.qty, p.unit), unit: unitShort(t, p.unit), price: formatMoney(p.price) }) : `${hide ? '•••' : formatQty(t, p.qty, p.unit)} · ${t('asset.noPriceShort')}`}
                  {src && <> · {src}</>}
                </small>
              </span>
              <span className="asset-breakdown__val">{hide ? hiddenMoney() : p.price !== null ? formatMoney(p.value) : '—'}</span>
            </li>
          );
        })}
        {asset.positions.length > 1 && (
          <li className="asset-breakdown__row asset-breakdown__row--total">
            <span className="asset-breakdown__name">{t('asset.total')}</span>
            <span className="asset-breakdown__val">{hide ? hiddenMoney() : formatMoney(asset.value)}</span>
          </li>
        )}
      </ul>
      <p className="invest-hero__date">
        {oldest !== null && <>{t('asset.pricesAgo', { ago: agoText(t, oldest) })} </>}
        <button className="link link--small" disabled={loading} onClick={() => void refreshPrices({ force: true })}>{loading ? t('asset.refreshing') : t('asset.refresh')}</button>
      </p>
      {failed && <p className="note-line">{t('asset.fetchFailed')}</p>}
      <p className="note-line">{t('asset.valueNote')}</p>
    </>
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
