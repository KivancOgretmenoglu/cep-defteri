import { useEffect, useMemo, useState } from 'react';
import { ringValues, type Ring } from '../domain/rings';
import { formatMoney, hiddenMoney } from '../i18n/format';
import { useT } from '../i18n';
import { useData } from './hooks';

const RADII = [46, 35, 24]; // dıştan içe yarıçaplar
const circ = (r: number) => 2 * Math.PI * r;
// Açılış dolumu oturumda bir kez: ana ekrana her dönüşte yeniden oynamasın.
let introPlayed = false;

/** Ay ilerlemesi halkaları: dış ince halka ayın akışı, içtekiler bütçe ve hedef. Veri yoksa hiçbir şey çizilmez. */
export function Rings() {
  const t = useT();
  const { data, today } = useData();
  const hide = data.settings.hideTotals;
  const rings = useMemo(() => ringValues(data, today), [data, today]);
  // İlk görünüşte halkalar 0'dan dolar (CSS geçişi, sırayla); sonra değişimlerde yaylanır.
  const [drawn, setDrawn] = useState(introPlayed);
  const has = rings.length > 0;
  useEffect(() => {
    if (drawn || !has) return;
    // İki kare bekle: 0 değeri boyansın ki geçiş başlasın.
    let id = requestAnimationFrame(() => {
      id = requestAnimationFrame(() => {
        introPlayed = true;
        setDrawn(true);
      });
    });
    return () => cancelAnimationFrame(id);
  }, [drawn, has]);
  const [settled, setSettled] = useState(introPlayed);
  useEffect(() => {
    if (!drawn || settled) return;
    const id = setTimeout(() => setSettled(true), 1000);
    return () => clearTimeout(id);
  }, [drawn, settled]);
  if (!has) return null;
  const M = (v: number) => (hide ? hiddenMoney() : formatMoney(v));

  // Metin karşılığı; gizli toplamlarda tutar yok, yalnız yüzde.
  const alt = (r: Ring): string => {
    if (r.kind === 'elapsed') return t('rings.elapsedAlt', { pct: r.pct });
    if (r.kind === 'budget') {
      const v = { pct: r.pct, spent: M(r.amount!), budget: M(r.of!) };
      if (hide) return r.state === 'over' ? t('rings.budgetOver', v) : t('rings.budgetAlt', v);
      return r.state === 'over' ? t('rings.budgetOverAmt', v) : t('rings.budgetAltAmt', v);
    }
    if (r.state === 'done') return t('rings.goalDone', { goal: r.title! });
    return hide ? t('rings.goalAlt', { goal: r.title!, pct: r.pct }) : t('rings.goalAltAmt', { goal: r.title!, pct: r.pct, cur: M(r.amount!), target: M(r.of!) });
  };
  const name = (r: Ring) => (r.kind === 'goal' ? r.title ?? t('rings.goal') : t(r.kind === 'elapsed' ? 'rings.elapsed' : 'rings.budget'));

  return (
    <section className="rings card" data-tour="rings" aria-label={t('rings.label')}>
      <svg className={`rings__svg ${settled ? 'is-settled' : ''}`} viewBox="0 0 100 100" aria-hidden focusable="false">
        {rings.map((r, i) => (
          <g key={r.kind} className={`ring ring--${r.kind} ring--${r.state}`} transform="rotate(-90 50 50)">
            <circle className="ring__track" cx="50" cy="50" r={RADII[i]} />
            <circle
              className="ring__fill"
              cx="50"
              cy="50"
              r={RADII[i]}
              style={{ '--i': i, opacity: r.value > 0 ? 1 : 0 } as React.CSSProperties}
              strokeDasharray={`${drawn ? circ(RADII[i]) * r.value : 0} ${circ(RADII[i])}`}
            />
          </g>
        ))}
      </svg>
      <ul className="rings__legend">
        {rings.map((r) => (
          <li key={r.kind} className={`ring-key ring-key--${r.kind} ring-key--${r.state}`} aria-label={alt(r)}>
            <span className="ring-key__dot" aria-hidden />
            <span className="ring-key__name" aria-hidden>{name(r)}</span>
            <b aria-hidden>{t('rings.pctShort', { pct: r.pct })}</b>
          </li>
        ))}
      </ul>
    </section>
  );
}
