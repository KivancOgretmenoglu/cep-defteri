/**
 * Harcama grafiği: dönem başından bugüne birikimli harcama (düz, basamaklı + alan) ve
 * 0'dan dönem harcama hakkına çıkan plan çizgisi (kesik). x ekseni tüm dönemi kapsar.
 * Dokun/üzerine gel → o günün harcaması ve plan değeri; klavyede ← →.
 */
import { useMemo, useRef, useState } from 'react';
import type { Money } from '../domain/money';
import type { SpendPoint } from '../domain/spendingPlan';
import { addDays, diffDays, type ISODate } from '../domain/dates';
import { formatMoney, hiddenMoney, relativeDay, shortDate } from '../i18n/format';
import { useT } from '../i18n';

interface Props {
  from: ISODate;
  to: ISODate;
  spending: SpendPoint[];
  plan?: SpendPoint[];
  today: ISODate;
  hide?: boolean;
  height?: number;
  compact?: boolean;
  label: string;
}

const W = 640;

function niceTicks(max: number, count = 4): number[] {
  const raw = (max || 100) / count;
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= raw) ?? raw;
  const out: number[] = [];
  for (let v = 0; v <= max + step * 0.999; v += step) out.push(Math.round(v));
  return out;
}

export function SpendingChart({ from, to, spending, plan = [], today, hide = false, height = 220, compact = false, label }: Props) {
  const tt = useT();
  const H = height;
  const pad = compact ? { l: 2, r: 2, t: 6, b: 4 } : { l: 8, r: 8, t: 14, b: 26 };
  const n = diffDays(to, from) + 1;
  const [hover, setHover] = useState<number | null>(null);
  const ref = useRef<SVGSVGElement>(null);

  const { x, y, ticks } = useMemo(() => {
    let max = Math.max(1, ...spending.map((p) => p.value), ...plan.map((p) => p.value));
    const t = niceTicks(max);
    max = Math.max(max, t[t.length - 1]);
    return {
      // Gün i'nin sonu x(i + 1); dönem başı x(0).
      x: (i: number) => pad.l + (i / n) * (W - pad.l - pad.r),
      y: (v: Money) => pad.t + (1 - Math.max(v, 0) / max) * (H - pad.t - pad.b),
      ticks: compact ? [] : t,
    };
  }, [spending, plan, n, H, pad.l, pad.r, pad.t, pad.b, compact]);

  const f = (v: number) => v.toFixed(1);
  let spendPath = `M${f(x(0))},${f(y(0))}`;
  spending.forEach((p, i) => {
    spendPath += `V${f(y(p.value))}H${f(x(i + 1))}`;
  });
  const lastI = spending.length;
  const last = spending[spending.length - 1];
  const area = spending.length ? `${spendPath}V${f(y(0))}H${f(x(0))}Z` : '';
  const planPath = plan.length ? `M${f(x(0))},${f(y(0))}` + plan.map((p, i) => `L${f(x(i + 1))},${f(y(p.value))}`).join('') : '';

  function pick(clientX: number) {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const sx = ((clientX - r.left) / r.width) * W;
    const i = Math.floor(((sx - pad.l) / (W - pad.l - pad.r)) * n);
    setHover(Math.max(0, Math.min(n - 1, i)));
  }
  const money = (v: Money) => (hide ? hiddenMoney() : formatMoney(v));
  const hDate = hover !== null ? addDays(from, hover) : null;
  const hSpend = hover !== null ? spending[hover] : undefined;
  const hPlan = hover !== null ? plan[hover] : undefined;
  const todayPlan = plan.find((p) => p.date === today);

  return (
    <figure className={`bchart schart ${compact ? 'bchart--compact' : ''}`}>
      <svg
        ref={ref}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="bchart__svg"
        style={compact ? undefined : { aspectRatio: `${W} / ${H}` }}
        role="img"
        aria-label={`${label}. ${last ? `${tt('spend.actual')} ${money(last.value)}` : ''}${todayPlan ? `; ${tt('spend.target')} ${money(todayPlan.value)}` : ''}.`}
        tabIndex={compact ? -1 : 0}
        onPointerMove={(e) => !compact && pick(e.clientX)}
        onPointerDown={(e) => !compact && pick(e.clientX)}
        onPointerLeave={() => setHover(null)}
        onKeyDown={(e) => {
          if (compact) return;
          if (e.key === 'ArrowLeft') setHover((h) => Math.max(0, (h ?? lastI - 1) - 1));
          if (e.key === 'ArrowRight') setHover((h) => Math.min(n - 1, (h ?? lastI - 1) + 1));
          if (e.key === 'Escape') setHover(null);
        }}
        onBlur={() => setHover(null)}
      >
        {ticks.map((t) => (
          <line key={t} x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} className={t === 0 ? 'bchart__zero' : 'bchart__grid'} vectorEffect="non-scaling-stroke" />
        ))}
        {compact && <line x1={0} x2={W} y1={y(0)} y2={y(0)} className="bchart__zero" vectorEffect="non-scaling-stroke" />}
        {area && <path d={area} className="bchart__area schart__area" />}
        {planPath && <path d={planPath} className="bchart__line schart__plan" vectorEffect="non-scaling-stroke" />}
        {spending.length > 0 && <path d={spendPath} className="bchart__line schart__line" vectorEffect="non-scaling-stroke" />}
        {hover !== null && <line x1={x(hover + 0.5)} x2={x(hover + 0.5)} y1={pad.t} y2={H - pad.b} className="bchart__cross" vectorEffect="non-scaling-stroke" />}
      </svg>
      <div className="bchart__dots" aria-hidden>
        {last && <span className="bchart__dot schart__dot" style={{ left: `${(x(lastI) / W) * 100}%`, top: `${(y(last.value) / H) * 100}%` }} />}
      </div>
      {!compact && !hide && (
        <div className="bchart__yl" aria-hidden>
          {ticks.map((t) => (
            <span key={t} style={{ top: `${(y(t) / H) * 100}%` }}>{formatMoney(t, { unit: false })}</span>
          ))}
        </div>
      )}
      {!compact && (
        <div className="bchart__xl" aria-hidden>
          <span>{shortDate(from, today)}</span>
          {lastI < n && <span style={{ left: `${(x(lastI) / W) * 100}%` }} className="bchart__today">{tt('chart.today')}</span>}
          <span>{shortDate(to, today)}</span>
        </div>
      )}
      {hDate && (
        <div className="bchart__tip" role="status" style={{ left: `${Math.min(Math.max((x(hover! + 0.5) / W) * 100, 18), 82)}%` }}>
          <b>{relativeDay(hDate, today)}</b>
          {hSpend && (
            <span>
              <i className="bchart__key schart__key" />
              {money(hSpend.value)}
            </span>
          )}
          {hPlan && (
            <span>
              <i className="bchart__key schart__key is-plan" />
              {tt('spend.tipPlan')}
              {money(hPlan.value)}
            </span>
          )}
        </div>
      )}
    </figure>
  );
}
