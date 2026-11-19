/**
 * Yatırım hesabındaki tek bir türün (gram altın, THYAO, GTL…) ayrıntısı: elindeki miktar, güncel fiyat,
 * değer, ortalama maliyet, kâr/zarar (gerçekleşmemiş ve gerçekleşen), günlük değişim, birim fiyat grafiği
 * ve o türün alım-satımları. Al / Sat / Fiyatı gir düğmeleri türü seçili getirir.
 */
import { ArrowDownLeft, ArrowUpRight, Pencil, RefreshCw } from 'lucide-react';
import { isAssetUnit, isStockUnit, type AssetUnit } from '../domain/assets';
import { assetTxsOf, investmentState } from '../domain/ledger';
import type { ID } from '../domain/types';
import { useT } from '../i18n';
import { formatMoney, formatUnitPrice, hiddenMoney, pctSigned, shortDate } from '../i18n/format';
import { usePrices } from '../store/prices';
import { useStockList } from '../store/stockList';
import { useData } from '../ui/hooks';
import { Sheet } from '../ui/kit';
import { closeSheet, openSheet } from '../ui/nav';
import { agoText, formatQty, quoteSourceText, unitName, unitShort } from './AssetFields';

export function PositionSheet({ accountId, unit: raw }: { accountId: ID; unit: string }) {
  const t = useT();
  const { data, today } = useData();
  const prices = usePrices();
  useStockList();
  const account = data.accounts.find((a) => a.id === accountId);
  const st = account ? investmentState(data, accountId, prices.book) : null;
  if (!account || !st?.asset || !isAssetUnit(raw)) return null;
  const unit: AssetUnit = raw;
  const hide = data.settings.hideTotals;
  const p = st.asset.positions.find((x) => x.unit === unit);
  const u = unitShort(t, unit);
  const quote = isStockUnit(unit) ? prices.quotes[unit] : undefined;
  const M = (v: number, sign = false) => (hide ? hiddenMoney() : formatMoney(v, { sign }));
  const tone = (v: number | null) => (v === null || v === 0 ? '' : v > 0 ? 'tone-pos' : 'tone-warn');

  // Bu türün işlemleri (yeniden eskiye) ve grafik noktaları (eskiden yeniye).
  const txs = assetTxsOf(data, accountId).filter((x) => x.unit === unit);
  const lot = account.asset!.opening.find((l) => l.unit === unit);
  const points = [
    ...(lot ? [{ date: account.openingDate, price: lot.price }] : []),
    ...txs.filter((x) => x.unitPrice).map((x) => ({ date: x.date, price: x.unitPrice! })),
    ...(p && p.priceSource !== 'last-tx' && p.price !== null ? [{ date: today, price: p.price }] : []),
  ];

  const go = (dir: 'in' | 'out') => {
    closeSheet();
    openSheet({ kind: 'add', preset: { type: 'invest', direction: dir, accountId, unit } });
  };

  return (
    <Sheet
      title={unitName(t, unit)}
      onClose={closeSheet}
      footer={
        <div className="btn-row pos-actions">
          <button className="btn btn--secondary" onClick={() => go('in')}><ArrowDownLeft size={16} /> {t('pos.buy')}</button>
          {p && <button className="btn btn--ghost" onClick={() => go('out')}><ArrowUpRight size={16} /> {t('pos.sell')}</button>}
          <button className="btn btn--ghost" onClick={() => { closeSheet(); openSheet({ kind: 'valuation', accountId, unit }); }}><RefreshCw size={16} /> {t('fund.update')}</button>
        </div>
      }
    >
      <p className="muted">{account.name}</p>
      {!p ? (
        <p className="callout callout--quiet">{t('pos.none')}</p>
      ) : (
        <dl className="kv pos-kv">
          <div><dt>{t('pos.qty')}</dt><dd>{hide ? '•••' : formatQty(t, p.qty, unit)}</dd></div>
          <div>
            <dt>{t('pos.price')} {p.priceAt !== null && <small>{typeof p.priceAt === 'number' ? agoText(t, p.priceAt) : shortDate(p.priceAt, today)}{quote && quote.source !== 'manual' ? ` · ${quoteSourceText(t, quote.source)}` : p.priceSource === 'manual' ? ` · ${t('asset.src.manual')}` : p.priceSource === 'last-tx' ? ` · ${t('asset.src.lastTx')}` : ''}</small>}</dt>
            <dd>{p.price !== null ? formatUnitPrice(p.price, unit) : '—'}</dd>
          </div>
          <div className="kv__strong"><dt>{t('pos.value')}</dt><dd>{M(p.value)}</dd></div>
          {p.dayChange !== null && (
            <div><dt>{t('pos.dayChange')}</dt><dd className={tone(p.dayChange)}>{M(p.dayChange, true)} ({pctSigned((p.dayChange / Math.max(1, p.value - p.dayChange)) * 100)})</dd></div>
          )}
          <div><dt>{t('pos.avg')}</dt><dd>{p.cost > 0 ? formatUnitPrice(p.avgCost, unit) : '—'}</dd></div>
          <div><dt>{t('pos.cost')}</dt><dd>{M(p.cost)}</dd></div>
          <div className="kv__strong">
            <dt>{t('pos.unrealized')}</dt>
            <dd className={tone(p.pnl)}>{p.pnl !== null ? <>{M(p.pnl, true)} ({pctSigned(p.pnlPct!)})</> : '—'}</dd>
          </div>
          {p.realized !== 0 && <div><dt>{t('pos.realized')}</dt><dd className={tone(p.realized)}>{M(p.realized, true)}</dd></div>}
        </dl>
      )}
      {p && p.pnl === null && <p className="note-line">{t('pos.noLive')}</p>}
      <p className="note-line">{t('pos.costNote')}</p>

      {points.length >= 2 && (
        <section className="pos-chart" aria-label={t('pos.chart')}>
          <p className="field__label">{t('pos.chart')}</p>
          <PriceLine points={points} unit={unit} label={t('pos.chartAria', { name: u })} />
        </section>
      )}

      <p className="field__label">{t('pos.history')}</p>
      <ul className="pos-events">
        {[...txs].reverse().map((x) => {
          const isBuy = x.toAccountId === accountId;
          return (
            <li key={x.id}>
              <button className="pos-ev" onClick={() => { closeSheet(); openSheet({ kind: 'edit', txId: x.id }); }}>
                <span className="pos-ev__date">{shortDate(x.date, today)}</span>
                <span className="pos-ev__main">
                  {t(isBuy ? 'pos.ev.buy' : 'pos.ev.sell')} <small>{formatQty(t, x.qty!, unit)}{x.unitPrice ? ` · ${formatUnitPrice(x.unitPrice, unit)}` : ''}</small>
                </span>
                <span className={`pos-ev__amt ${isBuy ? '' : 'tone-pos'}`}>{isBuy ? '−' : '+'}{formatMoney(x.amount)}</span>
                <Pencil size={14} aria-hidden />
              </button>
            </li>
          );
        })}
        {lot && (
          <li>
            <div className="pos-ev">
              <span className="pos-ev__date">{shortDate(account.openingDate, today)}</span>
              <span className="pos-ev__main">{t('pos.ev.opening')} <small>{formatQty(t, lot.qty, unit)} · {formatUnitPrice(lot.price, unit)}</small></span>
              <span className="pos-ev__amt" />
            </div>
          </li>
        )}
      </ul>
    </Sheet>
  );
}

/** Birim fiyatın küçük çizgi grafiği: işlem noktaları + bugünkü fiyat; dokununca/üzerine gelince değer. */
function PriceLine({ points, unit, label }: { points: { date: string; price: number }[]; unit: AssetUnit; label: string }) {
  const W = 320, H = 110, P = 10, B = 20;
  const vals = points.map((x) => x.price);
  const min = Math.min(...vals), max = Math.max(...vals);
  const span = max - min || 1;
  const xy = points.map((x, i) => [P + (i / (points.length - 1)) * (W - 2 * P), H - B - ((x.price - min) / span) * (H - B - P)] as const);
  return (
    <svg className="value-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${label}: ${points.map((x) => `${shortDate(x.date)} ${formatUnitPrice(x.price, unit)}`).join(', ')}`}>
      <polyline points={xy.map((q) => q.join(',')).join(' ')} fill="none" stroke="var(--invest)" strokeWidth="2" strokeLinejoin="round" />
      {xy.map(([x, y], i) => (
        <g key={i}>
          <rect x={x - 4} y={y - 4} width="8" height="8" fill="var(--surface)" stroke="var(--invest)" strokeWidth="2" />
          {/* Geniş, görünmez dokunma alanı: tarayıcı ipucu (title) değeri gösterir */}
          <rect x={x - 14} y={0} width="28" height={H - B} fill="transparent"><title>{`${shortDate(points[i].date)} · ${formatUnitPrice(points[i].price, unit)}`}</title></rect>
        </g>
      ))}
      <text x={0} y={H - 4} className="value-chart__lbl">{shortDate(points[0].date)}</text>
      <text x={W} y={H - 4} textAnchor="end" className="value-chart__lbl">{shortDate(points[points.length - 1].date)}</text>
    </svg>
  );
}
