/**
 * Bakiye çizgi grafiği: geçmiş düz çizgi, tahmin kesik çizgi. Tek seri, tek eksen.
 * Dokun/üzerine gel → dikey çizgi en yakın güne oturur, o günün bakiyesi ve işlem sayısı görünür.
 * Klavye: grafiğe odaklanıp ← → ile gün gün gezilir.
 * İsteğe bağlı `plan`: harcama planı çizgisi (noktalı, ayrı renk); tarihine göre x eksenine oturur.
 */
import { useMemo, useRef, useState } from 'react';
import type { BalancePoint } from '../domain/ledger';
import type { Money } from '../domain/money';
import { diffDays, type ISODate } from '../domain/dates';
import { formatMoney, hiddenMoney, relativeDay, shortDate } from '../i18n/format';
import { useT } from '../i18n';

interface Props {
  history: BalancePoint[];
  projection?: BalancePoint[];
  /** Harcama planı çizgisi (gün sonu hedefleri); grafiğin tarih aralığı dışındaki noktalar çizilmez. */
  plan?: BalancePoint[];
  today: ISODate;
  hide?: boolean;
  /** Gün başına işlem sayısı (tooltip için) */
  txCount?: Map<ISODate, number>;
  height?: number;
  compact?: boolean;
  label: string;
}

const W = 640;

function niceTicks(min: number, max: number, count = 4): number[] {
  const span = max - min || Math.abs(max) || 100;
  const raw = span / count;
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= raw) ?? raw;
  const start = Math.floor(min / step) * step;
  const out: number[] = [];
  for (let v = start; v <= max + step * 0.001; v += step) out.push(Math.round(v));
  return out;
}

export function BalanceChart({ history, projection = [], plan = [], today, hide = false, txCount, height = 220, compact = false, label }: Props) {
  const tt = useT();
  const H = height;
  const pad = compact ? { l: 2, r: 2, t: 6, b: 6 } : { l: 8, r: 8, t: 14, b: 26 };
  const all = useMemo(() => [...history, ...projection.slice(1)], [history, projection]);
  const [hover, setHover] = useState<number | null>(null);
  const ref = useRef<SVGSVGElement>(null);
  // Plan noktaları tarihine göre x indeksine eşlenir (yalnız görünen aralıktakiler).
  const planIdx = useMemo(() => {
    if (!all.length) return [] as { i: number; p: BalancePoint }[];
    const d0 = all[0].date;
    return plan.map((p) => ({ i: diffDays(p.date, d0), p })).filter(({ i }) => i >= 0 && i < all.length);
  }, [plan, all]);
  const planAt = useMemo(() => new Map(planIdx.map(({ i, p }) => [i, p.balance])), [planIdx]);

  const { x, y, ticks } = useMemo(() => {
    const vals = [...all.map((p) => p.balance), ...planIdx.map(({ p }) => p.balance)];
    let min = Math.min(0, ...vals), max = Math.max(...vals, 1);
    if (min === max) max = min + 100;
    const t = niceTicks(min, max);
    min = Math.min(min, t[0]);
    max = Math.max(max, t[t.length - 1]);
    const n = Math.max(all.length - 1, 1);
    return {
      x: (i: number) => pad.l + (i / n) * (W - pad.l - pad.r),
      y: (v: Money) => pad.t + (1 - (v - min) / (max - min)) * (H - pad.t - pad.b),
      ticks: compact ? [] : t,
    };
  }, [all, planIdx, H, pad.l, pad.r, pad.t, pad.b, compact]);

  if (all.length < 2) return <p className="muted">{tt('chart.needTwoDays')}</p>;

  const histPath = history.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.balance).toFixed(1)}`).join('');
  const off = history.length - 1;
  const projPath = projection.length > 1 ? projection.map((p, i) => `${i ? 'L' : 'M'}${x(off + i).toFixed(1)},${y(p.balance).toFixed(1)}`).join('') : '';
  const planPath = planIdx.length > 1 ? planIdx.map(({ i, p }, k) => `${k ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.balance).toFixed(1)}`).join('') : '';
  const area = `${histPath}L${x(off).toFixed(1)},${y(Math.max(0, ticks[0] ?? 0)).toFixed(1)}L${x(0).toFixed(1)},${y(Math.max(0, ticks[0] ?? 0)).toFixed(1)}Z`;
  const zeroY = y(0);
  const last = history[history.length - 1];

  function pick(clientX: number) {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const sx = ((clientX - r.left) / r.width) * W;
    const n = all.length - 1;
    const i = Math.round(((sx - pad.l) / (W - pad.l - pad.r)) * n);
    setHover(Math.max(0, Math.min(n, i)));
  }
  const hp = hover !== null ? all[hover] : null;
  const isProj = hover !== null && hover > off;
  const money = (v: Money) => (hide ? hiddenMoney() : formatMoney(v));

  return (
    <figure className={`bchart ${compact ? 'bchart--compact' : ''}`}>
      <svg
        ref={ref}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="bchart__svg"
        role="img"
        aria-label={`${label}. ${tt('chart.lastValue', { day: relativeDay(last.date, today), amount: money(last.balance) })}${projection.length > 1 ? `; ${tt('chart.projectedOn', { date: shortDate(projection[projection.length - 1].date), amount: money(projection[projection.length - 1].balance) })}` : ''}.`}
        tabIndex={compact ? -1 : 0}
        onPointerMove={(e) => !compact && pick(e.clientX)}
        onPointerDown={(e) => !compact && pick(e.clientX)}
        onPointerLeave={() => setHover(null)}
        onKeyDown={(e) => {
          if (compact) return;
          if (e.key === 'ArrowLeft') setHover((h) => Math.max(0, (h ?? off) - 1));
          if (e.key === 'ArrowRight') setHover((h) => Math.min(all.length - 1, (h ?? off) + 1));
          if (e.key === 'Escape') setHover(null);
        }}
        onBlur={() => setHover(null)}
      >
        {ticks.map((t) => (
          <line key={t} x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} className={t === 0 ? 'bchart__zero' : 'bchart__grid'} vectorEffect="non-scaling-stroke" />
        ))}
        {compact && zeroY > pad.t && zeroY < H - pad.b && <line x1={0} x2={W} y1={zeroY} y2={zeroY} className="bchart__zero" vectorEffect="non-scaling-stroke" />}
        {!hide && <path d={area} className="bchart__area" />}
        <path d={histPath} className="bchart__line" vectorEffect="non-scaling-stroke" />
        {projPath && <path d={projPath} className="bchart__line bchart__line--proj" vectorEffect="non-scaling-stroke" />}
        {planPath && <path d={planPath} className="bchart__line bchart__line--plan" vectorEffect="non-scaling-stroke" />}
        {hp && hover !== null && <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={H - pad.b} className="bchart__cross" vectorEffect="non-scaling-stroke" />}
      </svg>
      {/* Noktalar SVG ölçeğinden bağımsız daire kalsın diye HTML katmanında */}
      <div className="bchart__dots" aria-hidden>
        <span className="bchart__dot" style={{ left: `${(x(off) / W) * 100}%`, top: `${(y(last.balance) / H) * 100}%` }} />
        {hp && hover !== null && <span className={`bchart__dot bchart__dot--hover ${isProj ? 'is-proj' : ''}`} style={{ left: `${(x(hover) / W) * 100}%`, top: `${(y(hp.balance) / H) * 100}%` }} />}
      </div>
      {!compact && !hide && (
        <div className="bchart__yl" aria-hidden>
          {ticks.map((t) => (
            <span key={t} style={{ top: `${(y(t) / H) * 100}%` }}>{formatMoney(t * 1, { unit: false })}</span>
          ))}
        </div>
      )}
      {!compact && (
        <div className="bchart__xl" aria-hidden>
          <span>{shortDate(all[0].date, today)}</span>
          {projection.length > 1 && <span style={{ left: `${(x(off) / W) * 100}%` }} className="bchart__today">{tt('chart.today')}</span>}
          <span>{shortDate(all[all.length - 1].date, today)}</span>
        </div>
      )}
      {hp && (
        <div className="bchart__tip" role="status" style={{ left: `${Math.min(Math.max((x(hover!) / W) * 100, 18), 82)}%` }}>
          <b>{relativeDay(hp.date, today)}</b>
          <span>
            <i className={`bchart__key ${isProj ? 'is-proj' : ''}`} />
            {isProj ? tt('chart.projectedPrefix') : ''}
            {money(hp.balance)}
          </span>
          {planAt.has(hover!) && (
            <span>
              <i className="bchart__key is-plan" />
              {tt('plan.tipPrefix')}
              {money(planAt.get(hover!)!)}
            </span>
          )}
          {!isProj && txCount && <small>{tt('chart.txCount', { n: txCount.get(hp.date) ?? 0 })}</small>}
        </div>
      )}
    </figure>
  );
}
