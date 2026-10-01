/**
 * Clawd — piksel çizimli maskot. 32×26'lık bir ızgarada dikdörtgenlerle çizilir.
 * Gövde, yüz dili (gözler) ve ölçü her varyantta aynıdır; kıyafet ve aksesuarlar katman olarak eklenir.
 * Duygu (mood) ile kıyafet (outfit) birbirinden bağımsızdır.
 */
import type { CSSProperties } from 'react';
import type { Mood } from '../domain/mood';

type R = [x: number, y: number, w: number, h: number, fill: string];

export const BODY_COLORS: Record<string, { name: string; base: string }> = {
  coral: { name: 'Mercan', base: '#D97757' },
  peach: { name: 'Şeftali', base: '#E59A6B' },
  plum: { name: 'Erik', base: '#A56E98' },
  sea: { name: 'Deniz', base: '#4F98A6' },
  sand: { name: 'Kum', base: '#C49A6C' },
};

const INK = '#2A1E1A';
const CREAM = '#FBF6EC';

/** #rrggbb rengini açar (+) ya da koyulaştırır (−). */
function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) => Math.max(0, Math.min(255, Math.round(amt >= 0 ? v + (255 - v) * amt : v * (1 + amt))));
  const r = ch(n >> 16), g = ch((n >> 8) & 255), b = ch(n & 255);
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

// ── Gövde ──────────────────────────────────────────────
function bodyRects(base: string, pose: 'down' | 'up' | 'wave'): R[] {
  const hi = shade(base, 0.22);
  const lo = shade(base, -0.18);
  const r: R[] = [
    [9, 10, 14, 9, base],
    [10, 10, 12, 1, hi], // üst parlaklık
    [9, 11, 1, 6, hi],
    [9, 18, 14, 1, lo], // alt gölge
    [22, 11, 1, 7, lo],
    // bacaklar
    [10, 19, 1, 2, lo], [12, 19, 1, 2, lo], [19, 19, 1, 2, lo], [21, 19, 1, 2, lo],
  ];
  if (pose === 'up') r.push([7, 12, 2, 2, base], [6, 10, 2, 2, base], [23, 12, 2, 2, base], [24, 10, 2, 2, base]);
  else if (pose === 'wave') r.push([7, 14, 2, 2, base], [23, 12, 2, 2, base], [24, 10, 2, 2, base]);
  else r.push([7, 14, 2, 2, base], [23, 14, 2, 2, base]);
  return r;
}

// ── Yüz ────────────────────────────────────────────────
function eyeRects(mood: Mood): R[] {
  switch (mood) {
    case 'happy':
    case 'celebrate':
      return [
        [11, 13, 1, 1, INK], [12, 12, 1, 1, INK], [13, 13, 1, 1, INK],
        [18, 13, 1, 1, INK], [19, 12, 1, 1, INK], [20, 13, 1, 1, INK],
      ];
    case 'thoughtful':
      return [[13, 11, 1, 2, INK], [20, 11, 1, 2, INK]];
    case 'curious':
      return [[12, 11, 1, 3, INK], [19, 11, 1, 3, INK]];
    default:
      return [[12, 12, 1, 2, INK], [19, 12, 1, 2, INK]];
  }
}
function blushRects(mood: Mood, base: string): R[] {
  if (mood === 'thoughtful' || mood === 'curious') return [];
  const b = shade(base, -0.08);
  const p = mix(b, '#E8577A', 0.35);
  return [[10, 15, 2, 1, p], [20, 15, 2, 1, p]];
}
function mix(a: string, b: string, t: number) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const c = (s: number) => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t);
  return '#' + ((c(16) << 16) | (c(8) << 8) | c(0)).toString(16).padStart(6, '0');
}
function moodExtras(mood: Mood): R[] {
  if (mood === 'thoughtful') return [[25, 8, 1, 1, INK], [27, 6, 2, 2, INK], [29, 3, 2, 2, INK]];
  if (mood === 'curious')
    return [[26, 2, 2, 1, INK], [25, 3, 1, 1, INK], [28, 3, 1, 2, INK], [27, 5, 1, 1, INK], [27, 7, 1, 1, INK]];
  if (mood === 'celebrate')
    return [[3, 4, 1, 1, '#E8577A'], [28, 2, 1, 1, '#3E8A8C'], [1, 9, 1, 1, '#E5B94A'], [30, 10, 1, 1, '#9B7BC6'], [6, 1, 1, 1, '#6F9D7E'], [25, 0, 1, 1, '#E5B94A'], [12, 3, 1, 1, '#4A6FA5'], [21, 2, 1, 1, '#E8577A']];
  return [];
}

// ── Kıyafetler ─────────────────────────────────────────
export interface Outfit {
  name: string;
  /** Duruş: aksesuar tutan kollar */
  pose?: 'down' | 'wave';
  /** Gövdenin önüne çizilenler */
  front: R[];
  /** Gövdenin arkasına çizilenler */
  back?: R[];
  /** Gözlerin üstüne çizilenler (gözlük gibi) */
  face?: R[];
}

const hoodie = (c: string): R[] => {
  const d = shade(c, -0.2);
  return [
    [9, 15, 14, 4, c], [9, 15, 14, 1, d], [12, 17, 8, 1, d],
    [14, 16, 1, 1, CREAM], [17, 16, 1, 1, CREAM],
    [7, 14, 2, 2, c], [23, 14, 2, 2, c],
  ];
};
const beanie = (c: string): R[] => [[10, 7, 12, 2, c], [11, 6, 10, 1, c], [9, 9, 14, 2, shade(c, -0.22)], [15, 4, 2, 2, CREAM]];
const scarf = (c: string, s: string): R[] => [
  [9, 15, 14, 2, c], [11, 15, 1, 2, s], [15, 15, 1, 2, s], [19, 15, 1, 2, s],
  [18, 17, 2, 3, c], [18, 18, 2, 1, s],
];

export const OUTFITS: Record<string, Outfit> = {
  // Ana ekran seçenekleri (dolap)
  hoodie: { name: 'Kapüşonlu', front: hoodie('#6F9D7E') },
  winter: { name: 'Kışlık', front: [...beanie('#3E8A8C'), ...scarf('#E5B94A', '#C2553C')] },
  cap: {
    name: 'Kep',
    front: [[10, 7, 12, 3, '#4A6FA5'], [19, 9, 7, 1, shade('#4A6FA5', -0.25)], [15, 6, 2, 1, '#E5B94A'], ...hoodie('#E9E1D3').slice(0, 3)],
  },
  headphones: {
    name: 'Kulaklık',
    front: [[9, 7, 14, 1, '#9B7BC6'], [8, 8, 1, 3, '#9B7BC6'], [23, 8, 1, 3, '#9B7BC6'], [7, 10, 2, 3, shade('#9B7BC6', -0.25)], [23, 10, 2, 3, shade('#9B7BC6', -0.25)]],
  },
  plain: { name: 'Sade', front: [] },

  // Ekrana özgü varyantlar
  ledger: {
    name: 'Fiş defterli',
    front: [
      // omuz askısı ve çanta
      [23, 9, 1, 5, '#6B4630'], [24, 15, 5, 4, '#8A5A3B'], [24, 15, 5, 2, '#6B4630'], [26, 16, 1, 1, '#E5B94A'],
      // fiş
      [3, 8, 4, 7, CREAM], [3, 14, 1, 1, '#E3D9C6'], [5, 14, 1, 1, '#E3D9C6'],
      [4, 9, 2, 1, '#B9AE9B'], [4, 11, 2, 1, '#B9AE9B'], [4, 13, 1, 1, '#D97757'],
      // yeşil vizör
      [10, 8, 12, 2, '#5E9E6E'], [9, 9, 14, 1, shade('#5E9E6E', -0.25)],
    ],
  },
  planner: {
    name: 'Ajandalı',
    front: [
      [24, 10, 6, 8, '#3D4E8C'], [25, 11, 4, 6, '#4F62A8'], [26, 12, 2, 1, CREAM], [26, 14, 2, 1, CREAM],
      [24, 11, 1, 1, '#C9CED8'], [24, 13, 1, 1, '#C9CED8'], [24, 15, 1, 1, '#C9CED8'],
      // kulak arkasında kalem
      [18, 8, 6, 1, '#E5B94A'], [24, 8, 1, 1, INK], [17, 8, 1, 1, '#E8577A'],
    ],
  },
  gardener: {
    name: 'Bahçıvan',
    front: [
      // hasır şapka
      [7, 9, 18, 1, '#C9A55A'], [11, 6, 10, 3, '#E4C47E'], [11, 8, 10, 1, '#6F9D7E'],
      // saksıda filiz
      [0, 15, 7, 1, '#9E4F31'], [1, 16, 5, 4, '#C0643F'], [2, 17, 1, 2, shade('#C0643F', 0.2)],
      [3, 11, 1, 4, '#4E8A42'], [1, 11, 2, 2, '#5E9E4E'], [4, 10, 2, 2, '#7DBA62'], [2, 10, 1, 1, '#7DBA62'],
      // madeni para
      [5, 6, 2, 2, '#E5B94A'], [5, 6, 1, 1, '#F3D98A'],
    ],
  },
  scholar: {
    name: 'Gözlüklü',
    pose: 'down',
    face: [
      [10, 11, 5, 1, '#7A5236'], [10, 14, 5, 1, '#7A5236'], [10, 11, 1, 4, '#7A5236'], [14, 11, 1, 4, '#7A5236'],
      [17, 11, 5, 1, '#7A5236'], [17, 14, 5, 1, '#7A5236'], [17, 11, 1, 4, '#7A5236'], [21, 11, 1, 4, '#7A5236'],
      [15, 12, 2, 1, '#7A5236'],
    ],
    front: [
      [24, 9, 6, 10, '#A57A52'], [25, 10, 4, 8, CREAM], [26, 8, 2, 2, '#8C8C8C'],
      [25, 15, 1, 2, '#D97757'], [26, 13, 1, 4, '#3E8A8C'], [27, 14, 1, 3, '#E5B94A'], [28, 12, 1, 5, '#6F9D7E'],
    ],
  },
  keeper: {
    name: 'Arşivci',
    front: [
      [10, 7, 12, 3, '#E5B94A'], [9, 9, 14, 1, '#C79A2E'], [15, 6, 2, 1, '#C79A2E'],
      [0, 12, 7, 6, '#A57A52'], [0, 12, 7, 1, '#8A6440'], [2, 14, 3, 2, CREAM], [3, 15, 1, 1, '#3E8A8C'],
    ],
  },
};

export type OutfitKey = keyof typeof OUTFITS;
export const HOME_OUTFITS = ['hoodie', 'winter', 'cap', 'headphones', 'plain'] as const;

export interface ClawdProps {
  mood?: Mood;
  outfit?: string;
  body?: string;
  size?: number;
  /** Tek seferlik hareket. Değeri değiştirince yeniden oynar. */
  play?: 'nod' | 'hop' | 'wiggle' | null;
  playKey?: number;
  idle?: boolean;
  label?: string;
  className?: string;
  style?: CSSProperties;
}

const MOOD_LABEL: Record<Mood, string> = {
  curious: 'meraklı',
  calm: 'sakin',
  happy: 'keyifli',
  thoughtful: 'düşünceli',
  celebrate: 'kutluyor',
};

export function Clawd({ mood = 'calm', outfit = 'plain', body = 'coral', size = 96, play = null, playKey, idle = true, label, className = '', style }: ClawdProps) {
  const base = (BODY_COLORS[body] ?? BODY_COLORS.coral).base;
  const o = OUTFITS[outfit] ?? OUTFITS.plain;
  const pose = mood === 'celebrate' ? 'up' : o.pose ?? 'down';
  const all = (rs: R[], k: string) => rs.map(([x, y, w, h, f], i) => <rect key={k + i} x={x} y={y} width={w} height={h} fill={f} />);
  // Kollar yukarıdayken (kutlama) yan aksesuarı tutan kol pozisyonları değişir; kolları kıyafetten sonra çizeriz.
  const front = pose === 'up' ? o.front.filter(([x, y]) => !((x === 7 || x === 23) && y === 14)) : o.front;
  return (
    <svg
      viewBox="0 0 32 26"
      width={size}
      height={(size * 26) / 32}
      shapeRendering="crispEdges"
      role="img"
      aria-label={label ?? `Clawd, ${MOOD_LABEL[mood]}`}
      className={`clawd ${idle ? 'clawd--idle' : ''} ${play ? `clawd--${play}` : ''} ${className}`}
      data-mood={mood}
      key={playKey}
      style={style}
    >
      <g className="clawd__all">
        {o.back && all(o.back, 'b')}
        <g className="clawd__body">{all(bodyRects(base, pose), 'g')}</g>
        {all(blushRects(mood, base), 'p')}
        {all(front, 'f')}
        <g className="clawd__eyes">{all(eyeRects(mood), 'e')}</g>
        {o.face && all(o.face, 'c')}
      </g>
      <g className="clawd__extras">{all(moodExtras(mood), 'x')}</g>
    </svg>
  );
}
