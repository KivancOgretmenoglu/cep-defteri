/**
 * Maskot çizici: gövde + yüz + aksesuarlar + canlı kare → dikdörtgen listesi.
 * Tuval 32×30 birimdir; 24×24'lük gövde (OX, OY) kadar içeride durur, böylece şapka ve
 * eldeki eşyalar sığar. Saf modül: tarayıcıya dokunmaz (simge üretici ve testler de kullanır).
 */
import type { Mood } from '../domain/mood';
import { bodyGrid, CHARACTERS, INK, type Character, type Grid, type MascotKey } from './characters';

export type R = [x: number, y: number, w: number, h: number, fill: string];
export const CW = 32;
export const CH = 30;
export const OX = 4;
export const OY = 4;

const CREAM = '#FBF6EC';
const GOLD = '#E5B94A';
const PINK = '#EE8C9A';

export type EyeStyle = 'mood' | 'closed' | 'half' | 'happy' | 'squeeze' | 'x' | 'wide' | 'none';
export type PawPose = 'up' | 'wave' | 'wave2' | 'stretch' | 'face' | null;

/** Canlı kare: duygu ve kıyafetin üstüne geçici, kozmetik değişiklikler (tuval birimi). */
export interface MascotLive {
  dx?: number;
  dy?: number;
  flip?: boolean;
  /** Gövde 1 px çöker (nefes, kıkırdama) */
  squash?: boolean;
  /** Göz bebeği kayması (−1..+1) */
  look?: [number, number];
  eyes?: EyeStyle;
  /** Kaldırılmış patiler/kanatlar */
  paws?: PawPose;
  /** Kıyafeti geçici olarak değiştir */
  outfit?: string;
  /** Gözlük/yüz katmanını kaydır; null = çıkar */
  faceDy?: number | null;
  /** Şapkayı 1 px kaldır (selam) */
  hatLift?: boolean;
  nightcap?: boolean;
  blush?: boolean;
  /** Figürle birlikte hareket eden eşyalar */
  props?: R[];
  /** Figürden bağımsız parçacıklar */
  over?: R[];
  /** Figürün ARKASINDA çizilen parçacıklar (ör. arkadan geçen otobüs) */
  under?: R[];
  /** Bu satırın altını kırp (saklanıp bakma) */
  clipY?: number;
  zzz?: boolean;
  coffee?: 'l' | 'r';
  acting?: boolean;
}

// ── Izgara → dikdörtgen (yatay koşuları birleştirir) ─────────
export function gridRects(g: Grid, ox = OX, oy = OY): R[] {
  const out: R[] = [];
  for (let y = 0; y < g.length; y++) {
    let x = 0;
    while (x < g[y].length) {
      const c = g[y][x];
      if (!c) {
        x++;
        continue;
      }
      let w = 1;
      while (x + w < g[y].length && g[y][x + w] === c) w++;
      out.push([x + ox, y + oy, w, 1, c]);
      x += w;
    }
  }
  return out;
}

const at = (x: number, y: number, w: number, h: number, c: string): R => [x + OX, y + OY, w, h, c];

// ── Yüz ────────────────────────────────────────────────
export function eyeRects(ch: Character, mood: Mood, style: EyeStyle, look: [number, number] | undefined): R[] {
  if (style === 'none') return [];
  const { eye: [ex, ey], eyeGap, owlEyes, lid } = ch.anchors;
  const [lx, ly] = look ?? [0, 0];
  const out: R[] = [];
  const both = (f: (x: number) => void) => {
    f(ex);
    f(ex + eyeGap);
  };
  let s = style;
  if (s === 'mood') s = mood === 'happy' || mood === 'celebrate' ? 'happy' : 'mood';
  if (s === 'happy') both((x) => out.push(at(x - 1, ey + 1, 1, 1, INK), at(x, ey, 2, 1, INK), at(x + 2, ey + 1, 1, 1, INK)));
  else if (s === 'closed') both((x) => out.push(at(x - 1, ey + 1, 4, 1, INK)));
  else if (s === 'half') both((x) => out.push(at(x, ey, 2, 1, owlEyes ? '#D9D2C4' : lid), at(x, ey + 1, 2, 1, INK)));
  else if (s === 'squeeze') {
    out.push(at(ex - 1, ey - 1, 1, 1, INK), at(ex, ey, 1, 1, INK), at(ex + 1, ey + 1, 1, 1, INK), at(ex, ey + 2, 1, 1, INK), at(ex - 1, ey + 3, 1, 1, INK));
    const r = ex + eyeGap;
    out.push(at(r + 2, ey - 1, 1, 1, INK), at(r + 1, ey, 1, 1, INK), at(r, ey + 1, 1, 1, INK), at(r + 1, ey + 2, 1, 1, INK), at(r + 2, ey + 3, 1, 1, INK));
  } else if (s === 'x') both((x) => out.push(at(x - 1, ey - 1, 1, 1, INK), at(x + 2, ey - 1, 1, 1, INK), at(x, ey, 2, 2, INK), at(x - 1, ey + 2, 1, 1, INK), at(x + 2, ey + 2, 1, 1, INK)));
  else if (s === 'wide') both((x) => out.push(at(x + lx, ey - 1 + ly, 2, 3, INK), at(x + lx, ey - 1 + ly, 1, 1, '#FFFFFF')));
  else if (mood === 'thoughtful') both((x) => out.push(at(x + 1, ey - 1, 1, 2, INK)));
  else if (mood === 'curious') both((x) => out.push(at(x + lx, ey - 1 + ly, 2, 3, INK), at(x + lx, ey - 1 + ly, 1, 1, '#FFFFFF')));
  else both((x) => out.push(at(x + lx, ey + ly, 2, 2, INK), at(x + lx, ey + ly, 1, 1, '#FFFFFF')));
  return out;
}

function blushRects(ch: Character, mood: Mood, force?: boolean): R[] {
  if (!force && mood !== 'happy' && mood !== 'celebrate' && mood !== 'calm') return [];
  return ch.anchors.blush.map(([x, y]) => at(x, y, 1, 1, PINK));
}

function moodExtras(mood: Mood): R[] {
  if (mood === 'thoughtful') return [[25, 6, 1, 1, INK], [27, 4, 2, 2, INK], [29, 1, 2, 2, INK]];
  if (mood === 'curious') return [[27, 0, 2, 1, INK], [26, 1, 1, 1, INK], [29, 1, 1, 2, INK], [28, 3, 1, 1, INK], [28, 5, 1, 1, INK]];
  if (mood === 'celebrate')
    return [[2, 3, 1, 1, '#E8577A'], [28, 2, 1, 1, '#3E8A8C'], [0, 10, 1, 1, GOLD], [31, 11, 1, 1, '#9B7BC6'], [6, 0, 1, 1, '#6F9D7E'], [24, 0, 1, 1, GOLD], [13, 1, 1, 1, '#4A6FA5'], [20, 1, 1, 1, '#E8577A']];
  return [];
}

// ── Aksesuarlar (gövde koordinatı; at() ile tuvale) ─────────
const shade = (hex: string, amt: number) => {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) => Math.max(0, Math.min(255, Math.round(amt >= 0 ? v + (255 - v) * amt : v * (1 + amt))));
  return '#' + ((ch(n >> 16) << 16) | (ch((n >> 8) & 255) << 8) | ch(n & 255)).toString(16).padStart(6, '0');
};

type Hat = 'beanie' | 'cap' | 'straw' | 'fedora' | 'hardhat' | 'santa' | 'visor' | 'headphones' | 'nightcap' | 'pjcap';
type Neck = 'scarf' | 'scarfRed' | 'bowtie' | 'bowtieGold' | 'collar' | 'pjcollar';
type Face = 'glasses' | 'sunglasses';
type Item = 'receipt' | 'notebook' | 'clipboard' | 'pot' | 'box' | 'book' | 'icecream';

export interface Outfit {
  name: { tr: string; en: string };
  hat?: Hat;
  neck?: Neck;
  face?: Face;
  hold?: { side: 'l' | 'r'; item: Item };
  /** Sabit ışıltı (bayram) */
  sparkle?: boolean;
}

export const OUTFITS: Record<string, Outfit> = {
  plain: { name: { tr: 'Sade', en: 'Plain' } },
  winter: { name: { tr: 'Kışlık', en: 'Winter' }, hat: 'beanie', neck: 'scarf' },
  cap: { name: { tr: 'Kep', en: 'Cap' }, hat: 'cap' },
  headphones: { name: { tr: 'Kulaklık', en: 'Headphones' }, hat: 'headphones' },
  bowtie: { name: { tr: 'Papyon', en: 'Bow tie' }, neck: 'bowtie' },
  // Ekrana özgü
  ledger: { name: { tr: 'Fiş defterli', en: 'Receipts' }, hat: 'visor', hold: { side: 'l', item: 'receipt' } },
  planner: { name: { tr: 'Ajandalı', en: 'Planner' }, hold: { side: 'r', item: 'notebook' } },
  gardener: { name: { tr: 'Bahçıvan', en: 'Gardener' }, hat: 'straw', hold: { side: 'l', item: 'pot' } },
  scholar: { name: { tr: 'Gözlüklü', en: 'Scholar' }, face: 'glasses', hold: { side: 'r', item: 'clipboard' } },
  keeper: { name: { tr: 'Arşivci', en: 'Archivist' }, hat: 'hardhat', hold: { side: 'l', item: 'box' } },
  // Özel durumlar (dolapta seçilmez)
  spy: { name: { tr: 'Gizli ajan', en: 'Secret agent' }, hat: 'fedora', face: 'sunglasses', neck: 'collar' },
  exam: { name: { tr: 'Sınav haftası', en: 'Exam week' }, face: 'glasses', hold: { side: 'r', item: 'book' } },
  newyear: { name: { tr: 'Yılbaşı', en: 'New Year' }, hat: 'santa', neck: 'scarfRed' },
  bayram: { name: { tr: 'Bayramlık', en: 'Holiday best' }, neck: 'bowtieGold', sparkle: true },
  summer: { name: { tr: 'Yaz', en: 'Summer' }, face: 'sunglasses', hold: { side: 'r', item: 'icecream' } },
  /** Gece 22:00–05:59, ana ekranda (bkz. seasonal.homeOutfit) */
  pajama: { name: { tr: 'Pijama', en: 'Pajamas' }, hat: 'pjcap', neck: 'pjcollar' },
};
export const HOME_OUTFITS = ['plain', 'winter', 'cap', 'headphones', 'bowtie'] as const;

function hatRects(ch: Character, hat: Hat, lift: boolean): R[] {
  const { x: cx, y: hy, w } = ch.anchors.head;
  const l = Math.round(cx - w / 2);
  const y = hy - (lift ? 1 : 0);
  const r: R[] = [];
  const box = (x: number, yy: number, ww: number, hh: number, c: string) => r.push(at(x, yy, ww, hh, c));
  switch (hat) {
    case 'beanie': {
      const c = '#3E8A8C';
      box(l, y - 1, w, 2, shade(c, -0.25));
      box(l + 1, y - 3, w - 2, 2, c);
      box(l + 2, y - 4, w - 4, 1, c);
      box(Math.round(cx) - 1, y - 6, 2, 2, CREAM);
      for (let i = 0; i < w; i += 2) box(l + i, y - 1, 1, 2, shade(c, -0.1));
      break;
    }
    case 'cap': {
      const c = '#4A6FA5';
      box(l + 1, y - 3, w - 2, 3, c);
      box(l + 2, y - 4, w - 4, 1, c);
      box(l + w - 1, y - 1, 5, 1, shade(c, -0.3));
      box(Math.round(cx) - 1, y - 4, 2, 1, GOLD);
      break;
    }
    case 'visor': {
      const c = '#5E9E6E';
      box(l, y - 1, w, 1, c);
      box(l + w - 2, y, 5, 1, shade(c, -0.3));
      break;
    }
    case 'straw': {
      box(l - 3, y, w + 6, 1, '#C9A55A');
      box(l + 1, y - 3, w - 2, 3, '#E4C47E');
      box(l + 1, y - 1, w - 2, 1, '#6F9D7E');
      break;
    }
    case 'fedora': {
      box(l - 2, y, w + 4, 1, '#26252B');
      box(l + 1, y - 3, w - 2, 3, '#4A4950');
      box(l + 1, y - 1, w - 2, 1, '#1E1D22');
      box(Math.round(cx) - 1, y - 3, 2, 1, '#3B3940');
      break;
    }
    case 'hardhat': {
      box(l - 1, y, w + 2, 1, '#C79A2E');
      box(l + 1, y - 3, w - 2, 3, GOLD);
      box(Math.round(cx) - 1, y - 3, 2, 3, '#C79A2E');
      break;
    }
    case 'santa': {
      const red = '#D2423A';
      box(l, y - 1, w, 2, CREAM);
      box(l + 1, y - 3, w - 2, 2, red);
      box(l + 3, y - 5, w - 4, 2, red);
      box(l + w - 1, y - 6, 3, 2, red);
      box(l + w + 1, y - 5, 2, 2, CREAM);
      break;
    }
    case 'nightcap': {
      const b = '#4A6FA5';
      box(l, y - 1, w, 1, CREAM);
      box(l + 1, y - 3, w - 2, 2, b);
      box(l + 4, y - 4, w - 4, 1, b);
      box(l + w - 1, y - 3, 3, 1, b);
      box(l + w + 1, y - 2, 2, 2, CREAM);
      break;
    }
    case 'pjcap': {
      // Çizgili, yana sarkan uyku şapkası + ponpon (pijamayla takım)
      const b = '#6F82C8';
      const st = '#B8C4EE';
      box(l, y - 1, w, 1, CREAM);
      box(l + 1, y - 3, w - 2, 2, b);
      for (let i = 2; i < w - 1; i += 3) box(l + i, y - 3, 1, 2, st);
      box(l + 3, y - 4, w - 4, 1, b);
      box(l + 5, y - 5, w - 6, 1, st);
      box(l + w - 1, y - 4, 2, 1, b);
      box(l + w + 1, y - 3, 1, 2, st);
      box(l + w + 1, y - 1, 2, 2, CREAM);
      box(l + w + 2, y - 1, 1, 1, '#E3D9C6');
      break;
    }
    case 'headphones': {
      const c = '#9B7BC6';
      box(l, y - 2, w, 1, c);
      box(l - 1, y - 1, 1, 3, c);
      box(l + w, y - 1, 1, 3, c);
      box(l - 2, y + 2, 2, 3, shade(c, -0.25));
      box(l + w, y + 2, 2, 3, shade(c, -0.25));
      break;
    }
  }
  return r;
}

function neckRects(ch: Character, neck: Neck): R[] {
  const { x: cx, y, w } = ch.anchors.neck;
  const l = Math.round(cx - w / 2);
  const r: R[] = [];
  if (neck === 'scarf' || neck === 'scarfRed') {
    const c = neck === 'scarf' ? '#E5B94A' : '#D2423A';
    const s = neck === 'scarf' ? '#C2553C' : CREAM;
    r.push(at(l, y, w, 2, c));
    for (let i = 1; i < w; i += 3) r.push(at(l + i, y, 1, 2, s));
    r.push(at(l + w - 4, y + 2, 2, 3, c), at(l + w - 4, y + 3, 2, 1, s));
  } else if (neck === 'bowtie' || neck === 'bowtieGold') {
    const c = neck === 'bowtie' ? '#C2453E' : GOLD;
    const m = Math.round(cx);
    r.push(at(m - 3, y, 2, 3, c), at(m + 1, y, 2, 3, c), at(m - 1, y + 1, 2, 1, shade(c, -0.3)));
  } else if (neck === 'pjcollar') {
    // Pijama yakası: açık mavi çizgiler + iki düğme
    const b = '#6F82C8';
    const m = Math.round(cx);
    r.push(at(l, y, w, 2, '#B8C4EE'));
    for (let i = 0; i < w; i += 2) r.push(at(l + i, y, 1, 2, b));
    r.push(at(m - 1, y + 1, 2, 1, CREAM), at(m - 1, y + 2, 1, 1, CREAM), at(m - 1, y + 4, 1, 1, CREAM));
  } else if (neck === 'collar') {
    const coat = '#B8976A';
    r.push(at(l, y, 3, 3, coat), at(l + w - 3, y, 3, 3, coat), at(l + 1, y + 1, 1, 2, shade(coat, -0.22)), at(l + w - 2, y + 1, 1, 2, shade(coat, -0.22)));
  }
  return r;
}

function faceRects(ch: Character, face: Face, dy: number): R[] {
  const { eye: [ex, ey], eyeGap } = ch.anchors;
  const r: R[] = [];
  const y = ey + dy;
  if (face === 'glasses') {
    const c = '#7A5236';
    for (const x of [ex - 1, ex - 1 + eyeGap]) r.push(at(x, y - 1, 4, 1, c), at(x, y + 2, 4, 1, c), at(x, y - 1, 1, 4, c), at(x + 3, y - 1, 1, 4, c));
    r.push(at(ex + 3, y, eyeGap - 4, 1, c));
  } else {
    const c = '#17161B';
    for (const x of [ex - 1, ex - 1 + eyeGap]) r.push(at(x, y, 4, 2, c), at(x + 2, y, 1, 1, '#55535F'));
    r.push(at(ex + 3, y, eyeGap - 4, 1, c));
  }
  return r;
}

/** Eldeki eşya, tutma noktasına göre (tuval birimi). */
export function itemRects(ch: Character, side: 'l' | 'r', item: Item): R[] {
  const [hx, hy] = ch.anchors.hold[side];
  const x0 = hx + OX + (side === 'l' ? -2 : 0);
  const y0 = hy + OY - 4;
  const r = (x: number, y: number, w: number, h: number, c: string): R => [x0 + x, y0 + y, w, h, c];
  switch (item) {
    case 'receipt':
      return [r(0, 0, 4, 7, CREAM), r(1, 1, 2, 1, '#B9AE9B'), r(1, 3, 2, 1, '#B9AE9B'), r(1, 5, 1, 1, '#D97757'), r(0, 6, 1, 1, '#E3D9C6'), r(2, 6, 1, 1, '#E3D9C6')];
    case 'notebook':
      return [r(0, 0, 5, 7, '#3D4E8C'), r(1, 1, 3, 5, '#4F62A8'), r(2, 2, 1, 1, CREAM), r(2, 4, 1, 1, CREAM), r(0, 1, 1, 1, '#C9CED8'), r(0, 3, 1, 1, '#C9CED8'), r(0, 5, 1, 1, '#C9CED8')];
    case 'clipboard':
      return [r(0, 0, 5, 8, '#A57A52'), r(1, 1, 3, 6, CREAM), r(1, -1, 3, 1, '#8C8C8C'), r(1, 5, 1, 2, '#D97757'), r(2, 3, 1, 4, '#3E8A8C'), r(3, 4, 1, 3, GOLD)];
    case 'pot':
      return [r(0, 3, 5, 1, '#9E4F31'), r(0, 4, 5, 4, '#C0643F'), r(1, 5, 1, 2, '#D88560'), r(2, 0, 1, 3, '#4E8A42'), r(0, -1, 2, 2, '#5E9E4E'), r(3, -2, 2, 2, '#7DBA62')];
    case 'box':
      return [r(-1, 1, 6, 6, '#A57A52'), r(-1, 1, 6, 1, '#8A6440'), r(0, 3, 3, 2, CREAM), r(1, 4, 1, 1, '#3E8A8C')];
    case 'book':
      return [r(-1, 2, 7, 5, '#5B4FA0'), r(0, 2, 2, 4, CREAM), r(3, 2, 2, 4, CREAM), r(2, 2, 1, 5, '#3E3480'), r(0, 3, 2, 1, '#B9AE9B'), r(3, 4, 2, 1, '#B9AE9B')];
    case 'icecream':
      return [r(1, 0, 3, 3, '#F2A3C0'), r(1, 0, 1, 1, '#FBD3E2'), r(1, 3, 3, 1, '#D9A86A'), r(2, 4, 1, 3, '#D9A86A')];
  }
}

const cup = (ch: Character, side: 'l' | 'r'): R[] => {
  const [hx, hy] = ch.anchors.hold[side];
  const x = hx + OX + (side === 'l' ? -1 : 0);
  const y = hy + OY - 2;
  return [[x, y, 3, 3, CREAM], [x, y + 1, 3, 1, '#D97757'], [x, y - 1, 3, 1, '#7A5A44'], [side === 'r' ? x + 3 : x - 1, y + 1, 1, 1, CREAM]];
};

/** Gövde ızgarasında bir satırın en sol/sağ dolu pikseli (kontur dahil). */
function rowEdges(key: MascotKey, y: number): [number, number] {
  const row = bodyGrid(key)[Math.max(0, Math.min(23, y))];
  let l = 24, r = -1;
  row.forEach((c, x) => {
    if (c) {
      l = Math.min(l, x);
      r = Math.max(r, x);
    }
  });
  return r < 0 ? [6, 17] : [l, r];
}

/** Kaldırılmış patiler: gövdenin dış kenarından çıkar (kontur sütunuyla örtüşür, yapışık görünür). */
function pawRects(ch: Character, pose: PawPose): R[] {
  if (!pose) return [];
  const ey = ch.anchors.eye[1];
  const paw = (side: 'l' | 'r', y: number, up = 0): R[] => {
    const [l, r] = rowEdges(ch.key, y);
    const x = side === 'l' ? l - 3 : r;
    const yy = y - up;
    return [at(x, yy, 4, 3, INK), at(x + 1, yy + 1, 2, 1, ch.fur), at(side === 'l' ? x + 1 : x + 1, yy - 1, 2, 1, INK), at(x + 1, yy, 2, 1, ch.fur)];
  };
  switch (pose) {
    case 'up':
      return [...paw('l', ey), ...paw('r', ey)];
    case 'stretch':
      return [...paw('l', ey - 2, 1), ...paw('r', ey - 2, 1)];
    case 'wave':
      return paw('r', ey);
    case 'wave2':
      return paw('r', ey - 2);
    case 'face':
      return paw('r', ey + 3);
  }
}

/** Gövde ızgarasından kulak bölgeleri (yalnız `maxY` satırının üstü), tuval biriminde. */
function earRects(key: MascotKey, boxes: [number, number, number, number][], maxY: number): R[] {
  const g = bodyGrid(key);
  const out: R[] = [];
  for (const [x0, y0, x1, y1] of boxes)
    for (let y = y0; y < Math.min(y1, maxY); y++)
      for (let x = x0; x < x1; x++) {
        const c = g[y]?.[x];
        if (c) out.push(at(x, y, 1, 1, c));
      }
  return out;
}

const NIGHT_Z = (x: number, y: number, c: string): R[] => [[x, y, 3, 1, c], [x + 1, y + 1, 1, 1, c], [x, y + 2, 1, 1, c], [x, y + 3, 3, 1, c]];

export interface Scene {
  /** Figür (kaydırma/ayna/kırpma uygulanır) */
  figure: R[];
  /** Bağımsız katman */
  extras: R[];
  over: R[];
  zzz: R[][];
}

/** Bir karenin tüm parçaları. */
export function compose(key: MascotKey, mood: Mood, outfitKey: string, L: MascotLive = {}): Scene {
  const ch = CHARACTERS[key];
  const o = OUTFITS[L.outfit ?? outfitKey] ?? OUTFITS.plain;
  const body = gridRects(bodyGrid(key));
  const sq = L.squash ? 1 : 0;
  // Nefes/kıkırdama: gövdenin üst yarısı 1 px aşağı (alt satırlar yerinde)
  const squashY = OY + 12;
  const shiftUp = (r: R): R => (sq && r[1] < squashY ? [r[0], r[1] + sq, r[2], r[3], r[4]] : r);
  const figure: R[] = [];
  figure.push(...body.map(shiftUp));
  figure.push(...blushRects(ch, mood, L.blush).map(shiftUp));
  if (mood === 'happy' || mood === 'celebrate') figure.push(...(ch.anchors.smile ?? []).map(([x, y]) => shiftUp(at(x, y, 1, 1, '#E86A7A'))));
  if (o.neck) figure.push(...neckRects(ch, o.neck));
  figure.push(...eyeRects(ch, mood, L.eyes ?? 'mood', L.look).map(shiftUp));
  if (o.face && L.faceDy !== null) figure.push(...faceRects(ch, o.face, L.faceDy ?? 0).map(shiftUp));
  const hat = L.nightcap && !o.hat ? 'nightcap' : o.hat;
  if (hat) {
    figure.push(...hatRects(ch, hat, !!L.hatLift).map(shiftUp));
    // Uzun kulaklar şapkanın önünde kalır (yalnız şapka satırının üstü; kenar kulak dibini örter).
    if (ch.anchors.ears) figure.push(...earRects(key, ch.anchors.ears, ch.anchors.head.y - 1).map(shiftUp));
  }
  if (o.hold) figure.push(...itemRects(ch, o.hold.side, o.hold.item));
  if (L.coffee && !(o.hold && o.hold.side === L.coffee)) figure.push(...cup(ch, L.coffee));
  figure.push(...pawRects(ch, L.paws ?? (mood === 'celebrate' ? 'up' : null)));
  if (L.props) figure.push(...L.props);
  const extras = moodExtras(mood);
  if (o.sparkle) extras.push([1, 6, 1, 1, GOLD], [30, 8, 1, 1, GOLD], [3, 20, 1, 1, GOLD], [28, 22, 1, 1, GOLD]);
  return {
    figure,
    extras,
    over: L.over ?? [],
    zzz: L.zzz ? [NIGHT_Z(26, 2, '#7A6FA0'), NIGHT_Z(29, -2, '#7A6FA0')] : [],
  };
}
