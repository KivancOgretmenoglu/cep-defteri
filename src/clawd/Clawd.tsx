/**
 * Clawd — piksel çizimli maskot. 32×26'lık bir ızgarada dikdörtgenlerle çizilir.
 * Gövde, yüz dili (gözler) ve ölçü her varyantta aynıdır; kıyafet ve aksesuarlar katman olarak eklenir.
 * Duygu (mood) ile kıyafet (outfit) birbirinden bağımsızdır.
 *
 * Bu dosya saf bir çizicidir: tarayıcıya (window, zaman) dokunmaz, sunucuda/statik olarak da çizilir.
 * Canlılık (göz kırpma, bakış, sürprizler) `live` karesiyle dışarıdan verilir; bkz. `lively.ts`.
 */
import type { CSSProperties } from 'react';
import type { Mood } from '../domain/mood';

export type R = [x: number, y: number, w: number, h: number, fill: string];

export const BODY_COLORS: Record<string, { name: string; base: string }> = {
  coral: { name: 'Mercan', base: '#D97757' },
  peach: { name: 'Şeftali', base: '#E59A6B' },
  plum: { name: 'Erik', base: '#A56E98' },
  sea: { name: 'Deniz', base: '#4F98A6' },
  sand: { name: 'Kum', base: '#C49A6C' },
};

export const INK = '#2A1E1A';
export const CREAM = '#FBF6EC';

/** #rrggbb rengini açar (+) ya da koyulaştırır (−). */
export function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) => Math.max(0, Math.min(255, Math.round(amt >= 0 ? v + (255 - v) * amt : v * (1 + amt))));
  const r = ch(n >> 16), g = ch((n >> 8) & 255), b = ch(n & 255);
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

// ── Gövde ──────────────────────────────────────────────
function torsoRects(base: string): R[] {
  const hi = shade(base, 0.22);
  const lo = shade(base, -0.18);
  return [
    [9, 10, 14, 9, base],
    [10, 10, 12, 1, hi], // üst parlaklık
    [9, 11, 1, 6, hi],
    [9, 18, 14, 1, lo], // alt gölge
    [22, 11, 1, 7, lo],
  ];
}
function legRects(base: string): R[] {
  const lo = shade(base, -0.18);
  return [[10, 19, 1, 2, lo], [12, 19, 1, 2, lo], [19, 19, 1, 2, lo], [21, 19, 1, 2, lo]];
}

/** Kol duruşları. Her kol 2×2'lik piksel öbekleridir; sol kol x≈7, sağ kol x≈23. */
export type ArmPose = 'down' | 'up' | 'wave' | 'wave2' | 'stretch' | 'shrug' | 'hold-r' | 'hold-l' | 'face-r' | 'out';
type Arm = [x: number, y: number][];
const ARMS: Record<ArmPose, [Arm, Arm]> = {
  down: [[[7, 14]], [[23, 14]]],
  up: [[[7, 12], [6, 10]], [[23, 12], [24, 10]]],
  wave: [[[7, 14]], [[23, 12], [24, 10]]],
  wave2: [[[7, 14]], [[23, 12], [25, 11]]],
  stretch: [[[7, 12], [7, 10], [7, 8]], [[23, 12], [23, 10], [23, 8]]],
  shrug: [[[7, 13], [5, 12]], [[23, 13], [25, 12]]],
  'hold-r': [[[7, 14]], [[23, 13]]],
  'hold-l': [[[7, 13]], [[23, 14]]],
  'face-r': [[[7, 14]], [[23, 12], [22, 11]]],
  out: [[[7, 13], [5, 13]], [[23, 13], [25, 13]]],
};

// ── Yüz ────────────────────────────────────────────────
/** Göz biçimi: duygudan gelir; canlı karelerde geçici olarak değişebilir. */
export type EyeStyle = 'mood' | 'closed' | 'half' | 'happy' | 'squeeze' | 'x' | 'wide' | 'none';

function moodEyes(mood: Mood): R[] {
  switch (mood) {
    case 'happy':
    case 'celebrate':
      return happyEyes();
    case 'thoughtful':
      return [[13, 11, 1, 2, INK], [20, 11, 1, 2, INK]];
    case 'curious':
      return [[12, 11, 1, 3, INK], [19, 11, 1, 3, INK]];
    default:
      return [[12, 12, 1, 2, INK], [19, 12, 1, 2, INK]];
  }
}
const happyEyes = (): R[] => [
  [11, 13, 1, 1, INK], [12, 12, 1, 1, INK], [13, 13, 1, 1, INK],
  [18, 13, 1, 1, INK], [19, 12, 1, 1, INK], [20, 13, 1, 1, INK],
];

function eyeRects(mood: Mood, style: EyeStyle, lid: string): R[] {
  if (style === 'none') return [];
  if (style === 'happy') return happyEyes();
  if (style === 'squeeze')
    return [[11, 11, 1, 1, INK], [12, 12, 1, 1, INK], [11, 13, 1, 1, INK], [20, 11, 1, 1, INK], [19, 12, 1, 1, INK], [20, 13, 1, 1, INK]];
  if (style === 'x')
    return [11, 19].flatMap((cx): R[] => [[cx, 11, 1, 1, INK], [cx + 2, 11, 1, 1, INK], [cx + 1, 12, 1, 1, INK], [cx, 13, 1, 1, INK], [cx + 2, 13, 1, 1, INK]]);
  if (style === 'wide') return [[12, 11, 1, 3, INK], [19, 11, 1, 3, INK]];
  const eyes = moodEyes(mood);
  // Mutlu gözler (^ ^) zaten kapalı görünür; kırpma/uyku onlara uygulanmaz.
  if (style === 'mood' || mood === 'happy' || mood === 'celebrate') return eyes;
  return eyes.flatMap(([x, y, , h]): R[] => {
    const lx = x < 16 ? x - 1 : x; // kapalı göz çizgisi iki piksel, yüze simetrik
    const bottom = y + h - 1;
    if (style === 'closed') return [[lx, bottom, 2, 1, INK]];
    // half: ağır göz kapağı (gövdenin koyu tonu) + altında yarım göz
    return [[lx, bottom - 1, 2, 1, lid], [lx, bottom, 2, 1, INK]];
  });
}
function blushRects(mood: Mood, base: string, force = false): R[] {
  if (!force && (mood === 'thoughtful' || mood === 'curious')) return [];
  const b = shade(base, -0.08);
  const p = mix(b, '#E8577A', 0.35);
  return [[10, 15, 2, 1, p], [20, 15, 2, 1, p]];
}
export function mix(a: string, b: string, t: number) {
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
  /** Başında şapka/bere var mı (gece takkesi bunun yerine geçmez). */
  hat?: boolean;
  /** Elleri dolu taraflar (kahve fincanı boş tarafa konur). */
  busy?: ('l' | 'r')[];
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

const CAP = '#4A6FA5';
/** Kep siperliği; "ters kep" hareketinde ayrı çizilir. */
export const CAP_BRIM: R = [19, 9, 7, 1, shade(CAP, -0.25)];

const COAT = '#B8976A';
const COAT_D = shade(COAT, -0.22);
const HAT_D = '#3B3940';
const LENS = '#17161B';

export const OUTFITS: Record<string, Outfit> = {
  // Ana ekran seçenekleri (dolap)
  hoodie: { name: 'Kapüşonlu', front: hoodie('#6F9D7E') },
  winter: { name: 'Kışlık', hat: true, front: [...beanie('#3E8A8C'), ...scarf('#E5B94A', '#C2553C')] },
  cap: {
    name: 'Kep',
    hat: true,
    front: [[10, 7, 12, 3, CAP], CAP_BRIM, [15, 6, 2, 1, '#E5B94A'], ...hoodie('#E9E1D3').slice(0, 3)],
  },
  headphones: {
    name: 'Kulaklık',
    hat: true,
    front: [[9, 7, 14, 1, '#9B7BC6'], [8, 8, 1, 3, '#9B7BC6'], [23, 8, 1, 3, '#9B7BC6'], [7, 10, 2, 3, shade('#9B7BC6', -0.25)], [23, 10, 2, 3, shade('#9B7BC6', -0.25)]],
  },
  plain: { name: 'Sade', front: [] },

  // Ekrana özgü varyantlar
  ledger: {
    name: 'Fiş defterli',
    hat: true,
    busy: ['l', 'r'],
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
    busy: ['r'],
    front: [
      [24, 10, 6, 8, '#3D4E8C'], [25, 11, 4, 6, '#4F62A8'], [26, 12, 2, 1, CREAM], [26, 14, 2, 1, CREAM],
      [24, 11, 1, 1, '#C9CED8'], [24, 13, 1, 1, '#C9CED8'], [24, 15, 1, 1, '#C9CED8'],
      // kulak arkasında kalem
      [18, 8, 6, 1, '#E5B94A'], [24, 8, 1, 1, INK], [17, 8, 1, 1, '#E8577A'],
    ],
  },
  gardener: {
    name: 'Bahçıvan',
    hat: true,
    busy: ['l'],
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
    busy: ['r'],
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
    hat: true,
    busy: ['l'],
    front: [
      [10, 7, 12, 3, '#E5B94A'], [9, 9, 14, 1, '#C79A2E'], [15, 6, 2, 1, '#C79A2E'],
      [0, 12, 7, 6, '#A57A52'], [0, 12, 7, 1, '#8A6440'], [2, 14, 3, 2, CREAM], [3, 15, 1, 1, '#3E8A8C'],
    ],
  },
  // Bakiyeler gizliyken ana ekranda kendiliğinden giyilir (dolapta seçilmez).
  spy: {
    name: 'Gizli ajan',
    hat: true,
    front: [
      // fötr şapka
      [11, 4, 10, 1, '#4A4950'], [10, 5, 12, 3, '#4A4950'], [14, 5, 4, 1, HAT_D], [10, 7, 12, 1, '#1E1D22'], [8, 8, 16, 1, HAT_D],
      // trençkot: kalkık yaka, kemer, düğmeler
      [9, 15, 14, 4, COAT], [9, 13, 2, 3, COAT], [21, 13, 2, 3, COAT], [11, 15, 1, 2, COAT_D], [20, 15, 1, 2, COAT_D],
      [15, 15, 2, 1, COAT_D], [9, 17, 14, 1, COAT_D], [15, 17, 2, 1, '#E5B94A'],
      [7, 14, 2, 2, COAT], [23, 14, 2, 2, COAT],
    ],
    face: [
      [10, 11, 5, 3, LENS], [17, 11, 5, 3, LENS], [15, 11, 2, 1, LENS],
      [13, 11, 1, 1, '#4E4D58'], [20, 11, 1, 1, '#4E4D58'],
    ],
  },
};

export type OutfitKey = keyof typeof OUTFITS;
export const HOME_OUTFITS = ['hoodie', 'winter', 'cap', 'headphones', 'plain'] as const;

/** Canlı kare: duygu ve kıyafetin üstüne geçici, kozmetik değişiklikler. Hepsi ızgara birimidir. */
export interface ClawdLive {
  /** Bütün figürün kayması */
  dx?: number;
  dy?: number;
  /** Yatay ayna (arkasını dönme) */
  flip?: boolean;
  /** Üst gövde 1 piksel çöker (nefes/kıkırdama) */
  squash?: boolean;
  /** Göz bebeği kayması (−1..+1) */
  look?: [number, number];
  eyes?: EyeStyle;
  arms?: ArmPose;
  /** Kıyafeti geçici olarak değiştir (kılık değiştirme sırasında). */
  outfit?: string;
  /** Kıyafetin yüz katmanını (gözlük) kaydır; null = çıkar. */
  faceDy?: number | null;
  /** Kepi ters çevir (siperlik görünmez). */
  capBack?: boolean;
  /** Şapkasızsa gece takkesi */
  nightcap?: boolean;
  /** Yanakları her duyguda göster */
  blush?: boolean;
  /** Figürle birlikte hareket eden eşyalar (fincan, kalem, not defteri) */
  props?: R[];
  /** Figürden bağımsız parçacıklar (para, nota, yıldız, konfeti) */
  over?: R[];
  /** Bu satırın altını kırp (saklanıp bakma) */
  clipY?: number;
  /** Uyku "zzz" balonları (CSS ile adım adım) */
  zzz?: boolean;
  /** Elinde kahve fincanı (sabah) */
  coffee?: 'l' | 'r';
  /** Bir hareket oynuyor: nefes/kol salınımı durur */
  acting?: boolean;
}

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
  /** Canlı kare (bkz. lively.ts). Verilince CSS göz kırpma yerine bu kullanılır. */
  live?: ClawdLive | null;
  /** Kırpma için benzersiz kimlik (yalnız canlı kullanımda gerekir). */
  uid?: string;
}

const MOOD_LABEL: Record<Mood, string> = {
  curious: 'meraklı',
  calm: 'sakin',
  happy: 'keyifli',
  thoughtful: 'düşünceli',
  celebrate: 'kutluyor',
};

const isSleeve = ([x, y, w, h]: R) => (x === 7 || x === 23) && y === 14 && w === 2 && h === 2;

const NIGHTCAP: R[] = [
  [9, 9, 14, 1, CREAM], [10, 7, 12, 2, '#4A6FA5'], [12, 6, 9, 1, '#4A6FA5'], [15, 5, 7, 1, '#4A6FA5'],
  [13, 7, 1, 2, '#7593CC'], [17, 6, 1, 3, '#7593CC'], [21, 7, 1, 2, '#7593CC'],
  [21, 4, 3, 1, '#4A6FA5'], [23, 5, 2, 1, '#4A6FA5'], [24, 6, 2, 2, CREAM],
];

const cup = (side: 'l' | 'r'): R[] => {
  const x = side === 'r' ? 25 : 4;
  return [[x, 12, 3, 3, CREAM], [x, 13, 3, 1, '#D97757'], [x, 11, 3, 1, '#7A5A44'], [side === 'r' ? 28 : 3, 13, 1, 1, CREAM]];
};
const steam = (side: 'l' | 'r'): R[] => {
  const x = side === 'r' ? 26 : 5;
  return [[x, 9, 1, 1, '#CFC6B8'], [x + 1, 8, 1, 1, '#CFC6B8']];
};

// Uyku balonları: iki küçük "z" sırayla yanıp söner (CSS).
const zGlyph = (x: number, y: number, c: string): R[] => [[x, y, 3, 1, c], [x + 1, y + 1, 1, 1, c], [x, y + 2, 1, 1, c], [x, y + 3, 3, 1, c]];

export function Clawd({ mood = 'calm', outfit = 'plain', body = 'coral', size = 96, play = null, playKey, idle = true, label, className = '', style, live = null, uid = 'c' }: ClawdProps) {
  const base = (BODY_COLORS[body] ?? BODY_COLORS.coral).base;
  const L = live ?? {};
  const o = OUTFITS[L.outfit ?? outfit] ?? OUTFITS.plain;
  const armPose: ArmPose = L.arms ?? (mood === 'celebrate' ? 'up' : o.pose ?? 'down');
  const all = (rs: R[], k: string) => rs.map(([x, y, w, h, f], i) => <rect key={k + i} x={x} y={y} width={w} height={h} fill={f} />);

  // Kol renkleri: kıyafetin kolluğu varsa onun rengi, yoksa gövde.
  const sleeveL = o.front.find((r) => isSleeve(r) && r[0] === 7)?.[4] ?? base;
  const sleeveR = o.front.find((r) => isSleeve(r) && r[0] === 23)?.[4] ?? base;
  let front = o.front.filter((r) => !isSleeve(r));
  if (L.capBack) front = front.filter((r) => r !== CAP_BRIM).concat([[14, 9, 4, 1, shade(CAP, -0.25)]]);
  const [armL, armR] = ARMS[armPose];
  const armRects = (arm: Arm, c: string): R[] => arm.map(([x, y]) => [x, y, 2, 2, c]);

  const flip = L.flip ? 'translate(32 0) scale(-1 1)' : undefined;
  const shift = L.dx || L.dy ? `translate(${L.dx ?? 0} ${L.dy ?? 0})` : undefined;
  const look = L.look && (L.look[0] || L.look[1]) ? `translate(${L.look[0]} ${L.look[1]})` : undefined;
  const face = L.faceDy === null ? null : o.face;
  const clip = L.clipY != null ? `${uid}-clip` : undefined;

  return (
    <svg
      viewBox="0 0 32 26"
      width={size}
      height={(size * 26) / 32}
      shapeRendering="crispEdges"
      role="img"
      aria-label={label ?? `Clawd, ${MOOD_LABEL[mood]}`}
      className={`clawd ${idle ? 'clawd--idle' : ''} ${live ? 'clawd--live' : ''} ${L.acting ? 'clawd--acting' : ''} ${play ? `clawd--${play}` : ''} ${className}`}
      data-mood={mood}
      key={playKey}
      style={style}
    >
      {clip && (
        <defs>
          <clipPath id={clip}>
            <rect x={-8} y={-8} width={48} height={8 + (L.clipY ?? 26)} />
          </clipPath>
        </defs>
      )}
      <g className="clawd__all" clipPath={clip ? `url(#${clip})` : undefined}>
        <g transform={shift}>
          <g transform={flip}>
            {o.back && all(o.back, 'b')}
            <g className="clawd__legs">{all(legRects(base), 'l')}</g>
            <g className="clawd__upper">
              <g transform={L.squash ? 'translate(0 1)' : undefined}>
                <g className="clawd__body">{all(torsoRects(base), 'g')}</g>
                <g className="clawd__arm clawd__arm--l">{all(armRects(armL, sleeveL), 'al')}</g>
                <g className="clawd__arm clawd__arm--r">{all(armRects(armR, sleeveR), 'ar')}</g>
                {all(blushRects(mood, base, L.blush), 'p')}
                {all(front, 'f')}
                {L.nightcap && !o.hat && all(NIGHTCAP, 'n')}
                <g className="clawd__eyes">
                  <g transform={look}>{all(eyeRects(mood, L.eyes ?? 'mood', shade(base, -0.3)), 'e')}</g>
                </g>
                {face && <g transform={L.faceDy ? `translate(0 ${L.faceDy})` : undefined}>{all(face, 'c')}</g>}
                {L.coffee && all(cup(L.coffee), 'cu')}
                {L.coffee && <g className="clawd__steam">{all(steam(L.coffee), 'st')}</g>}
                {L.props && all(L.props, 'pr')}
              </g>
            </g>
          </g>
        </g>
      </g>
      <g className="clawd__extras">{all(moodExtras(mood), 'x')}</g>
      {L.over && <g className="clawd__over">{all(L.over, 'o')}</g>}
      {L.zzz && (
        <g className="clawd__zzz">
          <g className="clawd__z1">{all(zGlyph(27, 4, '#7A6FA0'), 'z1')}</g>
          <g className="clawd__z2">{all(zGlyph(29, -1, '#7A6FA0'), 'z2')}</g>
        </g>
      )}
    </svg>
  );
}
