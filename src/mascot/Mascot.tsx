/**
 * Maskot SVG bileşeni. Saf çizim: canlılık (göz kırpma, hareketler) `live` karesiyle dışarıdan gelir.
 * `idle={false}` → tamamen durağan (simge, önizleme, sunucu tarafı çizim).
 */
import type { CSSProperties } from 'react';
import type { Mood } from '../domain/mood';
import { characterOf, type Lang } from './characters';
import { compose, CH, CW, type MascotLive, type R } from './render';

const MOOD_LABEL: Record<Lang, Record<Mood, string>> = {
  tr: { curious: 'meraklı', calm: 'sakin', happy: 'keyifli', thoughtful: 'düşünceli', celebrate: 'kutluyor' },
  en: { curious: 'curious', calm: 'calm', happy: 'happy', thoughtful: 'thoughtful', celebrate: 'celebrating' },
};

export interface MascotProps {
  who?: string;
  mood?: Mood;
  outfit?: string;
  size?: number;
  idle?: boolean;
  live?: MascotLive | null;
  /** Kırpma tanımı için benzersiz kimlik (canlı kullanımda) */
  uid?: string;
  lang?: Lang;
  /** Ekran okuyucu etiketi (verilmezse "Fıstık, keyifli") */
  label?: string;
  name?: string | null;
  className?: string;
  style?: CSSProperties;
}

const rects = (rs: R[], k: string) => rs.map(([x, y, w, h, f], i) => <rect key={k + i} x={x} y={y} width={w} height={h} fill={f} />);

export function Mascot({ who, mood = 'calm', outfit = 'plain', size = 96, idle = true, live = null, uid = 'm', lang = 'tr', label, name, className = '', style }: MascotProps) {
  const ch = characterOf(who);
  const L = live ?? {};
  const scene = compose(ch.key, mood, outfit, L);
  const flip = L.flip ? `translate(${CW} 0) scale(-1 1)` : undefined;
  const shift = L.dx || L.dy ? `translate(${L.dx ?? 0} ${L.dy ?? 0})` : undefined;
  const clip = L.clipY != null ? `${uid}-clip` : undefined;
  return (
    <svg
      viewBox={`0 0 ${CW} ${CH}`}
      width={size}
      height={(size * CH) / CW}
      shapeRendering="crispEdges"
      role="img"
      aria-label={label ?? `${name || ch.name[lang]}, ${MOOD_LABEL[lang][mood]}`}
      className={`mascot ${idle ? 'mascot--idle' : ''} ${live ? 'mascot--live' : ''} ${L.acting ? 'mascot--acting' : ''} ${className}`}
      data-mood={mood}
      data-who={ch.key}
      style={style}
    >
      {clip && (
        <defs>
          <clipPath id={clip}>
            <rect x={-8} y={-8} width={CW + 16} height={8 + (L.clipY ?? CH)} />
          </clipPath>
        </defs>
      )}
      <g className="mascot__all" clipPath={clip ? `url(#${clip})` : undefined}>
        <g transform={shift}>
          <g transform={flip}>
            <g className="mascot__figure">{rects(scene.figure, 'f')}</g>
          </g>
        </g>
      </g>
      <g className="mascot__extras">{rects(scene.extras, 'x')}</g>
      {scene.over.length > 0 && <g className="mascot__over">{rects(scene.over, 'o')}</g>}
      {scene.zzz.length > 0 && (
        <g className="mascot__zzz">
          <g className="mascot__z1">{rects(scene.zzz[0], 'z1')}</g>
          <g className="mascot__z2">{rects(scene.zzz[1], 'z2')}</g>
        </g>
      )}
    </svg>
  );
}
