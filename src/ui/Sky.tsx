/**
 * Ana ekran başlığının arkasındaki gökyüzü bandı: günün saatine göre yumuşak bir renk, gece minik yıldızlar
 * ve saate göre yükselip alçalan piksel güneş/ay. Renkler kâğıt zeminiyle ve maskotun vurgusuyla karıştırılır
 * (sky.css), böylece her karakter paletinde ve iki temada da metin okunur kalır.
 */
import { useEffect, useState } from 'react';
import { skyBand, skyBody, type SkyBand } from '../mascot/seasonal';
import './sky.css';

/** Bant tonları: `a` üst, `b` orta renk; `p` kâğıda karışım oranı (%). Testler kontrastı bu değerlerle doğrular. */
export const SKY_TINTS: Record<SkyBand, { light: { a: string; b: string; p: number }; dark: { a: string; b: string; p: number } }> = {
  dawn: { light: { a: '#F6A57E', b: '#F7C98F', p: 42 }, dark: { a: '#B9603E', b: '#A8763F', p: 34 } },
  day: { light: { a: '#A9D6F0', b: '#CFE8F2', p: 46 }, dark: { a: '#3A6C8E', b: '#2F5D6E', p: 38 } },
  golden: { light: { a: '#F2A04E', b: '#EE9AA6', p: 44 }, dark: { a: '#B0632A', b: '#9C4860', p: 38 } },
  evening: { light: { a: '#B7A2E6', b: '#9DB4E4', p: 44 }, dark: { a: '#5A46A0', b: '#2F4C8C', p: 44 } },
  night: { light: { a: '#7B7FC8', b: '#A4A8DC', p: 28 }, dark: { a: '#1A1F66', b: '#1B2250', p: 72 } },
};

/** Accent'in bant rengine katkısı (%). */
export const SKY_ACCENT = 12;

/** Dakikada bir (dakika başında) güncellenen saat; sekmeye geri dönünce de tazelenir. */
export function useNow(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const tick = () => {
      const d = new Date();
      setNow((p) => (p.getHours() === d.getHours() && p.getMinutes() === d.getMinutes() ? p : d));
      t = setTimeout(tick, 60_000 - (d.getSeconds() * 1000 + d.getMilliseconds()) + 50);
    };
    tick();
    const wake = () => {
      if (document.visibilityState !== 'visible') return;
      clearTimeout(t);
      tick();
    };
    document.addEventListener('visibilitychange', wake);
    return () => {
      clearTimeout(t);
      document.removeEventListener('visibilitychange', wake);
    };
  }, []);
  return now;
}

const SUN = ['..y..y..', '...yy...', '.yyyyyy.', 'yyyyyyyy', 'yyyyyyyy', '.yyyyyy.', '...yy...', '..y..y..'];
const MOON = ['...mmm..', '..mm....', '.mm.....', '.mm.....', '.mm.....', '.mm.....', '..mm....', '...mmm..'];

function Pixel({ rows, cls }: { rows: string[]; cls: string }) {
  return (
    <svg className={`sky-body__art ${cls}`} viewBox="0 0 8 8" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
      {rows.flatMap((row, y) => [...row].map((c, x) => (c === '.' ? null : <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" />)))}
    </svg>
  );
}

/** Bant; başlığın (position: relative) ilk çocuğu olarak konur. */
export function Sky() {
  const now = useNow();
  const band = skyBand(now.getHours());
  const body = skyBody(now);
  const tint = SKY_TINTS[band];
  const style = {
    '--sky-a-l': tint.light.a,
    '--sky-b-l': tint.light.b,
    '--sky-p-l': `${tint.light.p}%`,
    '--sky-a-d': tint.dark.a,
    '--sky-b-d': tint.dark.b,
    '--sky-p-d': `${tint.dark.p}%`,
    '--sky-x': body.x,
    '--sky-y': body.y,
  } as React.CSSProperties;
  return (
    <div className="sky" data-band={band} style={style} aria-hidden="true">
      <span className="sky__stars" />
      <span className={`sky-body sky-body--${body.kind}`}>
        <Pixel rows={body.kind === 'sun' ? SUN : MOON} cls={body.kind} />
      </span>
    </div>
  );
}
