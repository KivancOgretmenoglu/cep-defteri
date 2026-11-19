/**
 * Maskot çizici: gövde + yüz + aksesuarlar + canlı kare → dikdörtgen listesi.
 * Tuval 32×30 birimdir; 24×24'lük gövde (OX, OY) kadar içeride durur, böylece şapka ve
 * eldeki eşyalar sığar. Saf modül: tarayıcıya dokunmaz (simge üretici ve testler de kullanır).
 */
import type { Mood } from '../domain/mood';
import { bodyGrid, CHARACTERS, INK, unitGrid, type Character, type Grid, type MascotKey } from './characters';

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
export function gridRects(g: Grid, ox = OX, oy = OY, res = 1): R[] {
  const out: R[] = [];
  const k = 1 / res;
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
      out.push([x * k + ox, y * k + oy, w * k, k, c]);
      x += w;
    }
  }
  return out;
}

const at = (x: number, y: number, w: number, h: number, c: string): R => [x + OX, y + OY, w, h, c];

// ── Yüz ────────────────────────────────────────────────
/**
 * Ayrıntılı yüz (res 2): göz akı gövdede; burada bebekler, kapaklar ve duyguya göre ağız çizilir.
 * Kapalı/yarım gözlerde göz akının üstü kapak rengiyle örtülür (kontur gövdede kalır).
 */
function hiFaceRects(ch: Character, mood: Mood, style: EyeStyle, look: [number, number] | undefined): R[] {
  const f = ch.hiFace!;
  const res = ch.res ?? 2;
  const k = 1 / res;
  const out: R[] = [];
  const h = (x: number, y: number, w: number, hh: number, c: string) => out.push([x * k + OX, y * k + OY, w * k, hh * k, c]);
  const [lx, ly] = look ?? [0, 0];
  let s = style;
  if (s === 'mood') s = mood === 'happy' || mood === 'celebrate' ? 'happy' : 'mood';
  // Göz akının piksel satırları (gövdedeki elipsle aynı kural)
  const rows = (cx: number, cy: number) => {
    const r: [y: number, x0: number, x1: number][] = [];
    for (let y = Math.floor(cy - f.ry); y <= Math.ceil(cy + f.ry); y++) {
      let x0 = Infinity, x1 = -Infinity;
      for (let x = Math.floor(cx - f.rx); x <= Math.ceil(cx + f.rx); x++)
        if (((x + 0.5 - cx) / f.rx) ** 2 + ((y + 0.5 - cy) / f.ry) ** 2 <= 1) {
          x0 = Math.min(x0, x);
          x1 = Math.max(x1, x);
        }
      if (x1 >= x0) r.push([y, x0, x1]);
    }
    return r;
  };
  /** Göz akının `upTo` satırına kadar (dahil değil) olan kısmını kapakla ört; alt kenara koyu kirpik çizgisi. */
  const lid = (cx: number, cy: number, upTo: number, lash = true) => {
    for (const [y, x0, x1] of rows(cx, cy)) if (y < upTo) h(x0, y, x1 - x0 + 1, 1, f.lid);
    if (lash) for (const [y, x0, x1] of rows(cx, cy)) if (y === upTo - 1) h(x0, y, x1 - x0 + 1, 1, INK);
  };
  const pupil = (cx: number, cy: number, w: number, hh: number, dx: number, dy: number) => {
    const x = Math.round(cx - w / 2 + dx), y = Math.round(cy - hh / 2 + dy);
    h(x, y, w, hh, INK);
    h(x, y, 1, 1, '#FFFFFF');
  };
  for (const [cx, cy] of f.eyes) {
    const top = Math.floor(cy - f.ry);
    switch (s) {
      case 'closed':
        lid(cx, cy, Math.ceil(cy + f.ry) + 1, false);
        h(Math.round(cx - f.rx) + 1, Math.round(cy) + 1, Math.round(f.rx * 2) - 2, 1, INK);
        break;
      case 'half':
        lid(cx, cy, Math.round(cy));
        pupil(cx, cy, 3, 2, lx * 1.5, 2);
        break;
      case 'happy':
        // Gülen göz: alt kapak yukarı kıvrılır, bebek yukarıda
        pupil(cx, cy, 3, 4, lx * 1.5, -1);
        for (const [y, x0, x1] of rows(cx, cy)) if (y >= Math.round(cy) + 2) h(x0, y, x1 - x0 + 1, 1, f.lid);
        for (const [y, x0, x1] of rows(cx, cy)) if (y === Math.round(cy) + 2) h(x0 + 1, y, x1 - x0 - 1, 1, INK);
        break;
      case 'squeeze': {
        lid(cx, cy, Math.ceil(cy + f.ry) + 1, false);
        const left = cx < 24;
        const xs = left ? [-2, -1, 0, 1, 2] : [2, 1, 0, -1, -2];
        xs.forEach((d, i) => h(Math.round(cx) + (i < 3 ? d : xs[4 - i]) - 1, top + 2 + i, 2, 1, INK));
        break;
      }
      case 'x':
        for (let i = -2; i <= 2; i++) {
          h(Math.round(cx) + i - 1, Math.round(cy) + i - 1, 2, 1, INK);
          h(Math.round(cx) - i - 1, Math.round(cy) + i - 1, 2, 1, INK);
        }
        break;
      case 'wide':
        pupil(cx, cy, 4, 6, lx * 1.5, ly * 1.5);
        break;
      case 'none':
        break;
      default:
        if (mood === 'thoughtful') pupil(cx, cy, 3, 4, 1.5, -2);
        else if (mood === 'curious') pupil(cx, cy, 4, 5, lx * 1.5, ly * 1.5);
        else pupil(cx, cy, 3, 4, lx * 1.5, ly * 1.5 + 1);
    }
  }
  // Ağız: sevinçte kocaman açık sırıtış (dişler + dil), düşüncelide yamuk
  const [mx, my] = f.mouth;
  if (mood === 'happy' || mood === 'celebrate') {
    h(mx - 5, my - 1, 11, 1, INK);
    h(mx - 4, my, 9, 2, '#5A1E16');
    h(mx - 4, my, 9, 1, '#FFFFFF');
    h(mx - 1, my + 1, 3, 1, '#E86A7A');
    h(mx - 3, my + 2, 7, 1, INK);
  } else if (mood === 'thoughtful') {
    h(mx - 4, my, 8, 1, f.lid);
    h(mx - 3, my, 5, 1, INK);
  }
  return out;
}

export function eyeRects(ch: Character, mood: Mood, style: EyeStyle, look: [number, number] | undefined): R[] {
  if (ch.hiFace) return hiFaceRects(ch, mood, style, look);
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

type Hat = 'beanie' | 'cap' | 'straw' | 'fedora' | 'hardhat' | 'santa' | 'visor' | 'headphones' | 'nightcap' | 'pjcap' | 'party';
type Neck = 'scarf' | 'scarfRed' | 'bowtie' | 'bowtieGold' | 'collar' | 'pjcollar' | 'suit' | 'pinksuit';
type Face = 'glasses' | 'sunglasses';
type Item = 'receipt' | 'notebook' | 'clipboard' | 'pot' | 'box' | 'book' | 'icecream' | 'briefcase';

export interface Outfit {
  name: { tr: string; en: string };
  hat?: Hat;
  neck?: Neck;
  face?: Face;
  hold?: { side: 'l' | 'r'; item: Item };
  /** Sabit ışıltı (bayram) */
  sparkle?: boolean;
  /** Yalnız bu maskota özel (dolapta yalnız onda görünür; başkası giyemez, sade görünür) */
  only?: MascotKey;
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
  /** Doğum günü ve kullanım yıl dönümü (bkz. domain/special.ts) */
  party: { name: { tr: 'Doğum günü', en: 'Birthday' }, hat: 'party', neck: 'bowtieGold', sparkle: true },
  /** Gece 22:00–05:59, ana ekranda (bkz. seasonal.homeOutfit) */
  pajama: { name: { tr: 'Pijama', en: 'Pajamas' }, hat: 'pjcap', neck: 'pjcollar' },
  /** Yatırım ekranı: takım elbise + kravat + evrak çantası */
  suit: { name: { tr: 'Takım elbise', en: 'Suit' }, neck: 'suit', hold: { side: 'l', item: 'briefcase' } },
  /** Hamamcan'a özel: pembe takım, siyah gömlek, altın zincir */
  pinksuit: { name: { tr: 'Pembe takım', en: 'Pink suit' }, neck: 'pinksuit', only: 'karafatma' },
};
export const HOME_OUTFITS = ['plain', 'winter', 'cap', 'headphones', 'bowtie'] as const;

/** Dolapta (Ayarlar) bu maskotun seçebileceği ana ekran kıyafetleri: ortak olanlar + yalnız ona özel olanlar. */
export function wardrobeFor(key: MascotKey): string[] {
  return [...HOME_OUTFITS, ...Object.keys(OUTFITS).filter((o) => OUTFITS[o].only === key)];
}

/** Kıyafet çözümü: başka maskota özel kıyafet sade görünür; Hamamcan takım elbiseyi hep pembe giyer. */
export function outfitFor(key: MascotKey, outfitKey: string): Outfit {
  const o = OUTFITS[outfitKey] ?? OUTFITS.plain;
  if (o.only && o.only !== key) return OUTFITS.plain;
  if (key === 'karafatma' && o.neck === 'suit') return { ...o, neck: 'pinksuit' };
  return o;
}

function hatRects(ch: Character, hat: Hat, lift: boolean): R[] {
  const { x: cx, y: hy, w } = ch.anchors.head;
  const l = Math.round(cx - w / 2);
  const y = hy - (lift ? 1 : 0);
  const r: R[] = [];
  const box = (x: number, yy: number, ww: number, hh: number, c: string) => r.push(at(x, yy, ww, hh, c));
  switch (hat) {
    case 'party': {
      // Çizgili külah + ponpon: kafanın ortasında hafif yana yatık durur.
      const a = '#E86A92';
      const b = '#F5C451';
      const top = Math.round(cx);
      box(top - 3, y - 1, 6, 1, shade(a, -0.2));
      // Noel Baba şapkasıyla aynı yükseklik (tuvalden taşmaz): 4 sıra külah + 1 sıra ponpon.
      const rows: [number, string][] = [[3, a], [2, b], [2, a], [1, b]];
      rows.forEach(([half, c], i) => box(top - half + (i >= 2 ? 1 : 0), y - 2 - i, half * 2, 1, c));
      box(top + 1, y - 6, 2, 1, CREAM);
      break;
    }
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

/**
 * Takım elbise: boyundan aşağı gövde pikselleri (kontur hariç) ceket rengine boyanır, ortada V yaka (gömlek),
 * iki yanda açık renk yaka kenarı ve kravat. Gövde sütun aralığı karaktere göre (kuyruk/kanat/palamut dışarıda kalır).
 */
const SUIT_FIT: Record<MascotKey, { x0: number; x1: number; tie: string; sleeve?: string[]; keep?: string[] }> = {
  // Kanatlar kol olur (o renkler ceketin koyu tonuyla boyanır); bacaklar boyanmaz
  karafatma: { x0: 3, x1: 20, tie: '#C2453E', sleeve: ['#7A3A16', '#A8622F', '#D49A64'], keep: ['#3A1A0A', '#8A5230'] },
  fistik: { x0: 5, x1: 18, tie: '#C2453E' },
  bilge: { x0: 6, x1: 17, tie: '#C2453E' },
  ceviz: { x0: 5, x1: 15, tie: '#3E8A8C' },
  diken: { x0: 6, x1: 17, tie: '#C2453E' },
  karamel: { x0: 5, x1: 18, tie: '#C2453E' },
  pamuk: { x0: 5, x1: 17, tie: '#D9487A' },
};
interface SuitColors {
  jacket: string;
  lapel: string;
  shirt: string;
  button: string;
  /** Kravat yerine zincir (pembe takım) */
  chain?: string;
}
const NAVY_SUIT: SuitColors = { jacket: '#454E6B', lapel: '#7581A6', shirt: '#FFFFFF', button: '#2C3247' };
export const PINK_SUIT: SuitColors = { jacket: '#E0679B', lapel: '#A8326A', shirt: '#2B2530', button: '#A63A6B', chain: GOLD };

function suitRects(ch: Character, colors: SuitColors = NAVY_SUIT): R[] {
  const fit = SUIT_FIT[ch.key];
  const { jacket: SUIT, lapel: LAPEL, shirt: SHIRT } = colors;
  const res = ch.res ?? 1;
  if (res > 1) return hiSuitRects(ch, colors, fit);
  const hi = bodyGrid(ch.key);
  const g = unitGrid(ch.key);
  const y0 = ch.anchors.neck.y;
  const m = Math.round(ch.anchors.neck.x);
  const r: R[] = [];
  let last = y0;
  // Ceket: gövdenin kendi çözünürlüğünde boyanır (ayrıntılı gövdede kontur ince kalır)
  for (let y = y0 * res; y < hi.length; y++) {
    for (let x = fit.x0 * res; x < (fit.x1 + 1) * res; x++) {
      const c = hi[y][x];
      if (!c || c === INK || fit.keep?.includes(c)) continue;
      r.push(at(x / res, y / res, 1 / res, 1 / res, fit.sleeve?.includes(c) ? shade(SUIT, -0.2) : SUIT));
      last = Math.floor(y / res);
    }
  }
  // V yaka: gömlek üçgeni, açık renk yaka kenarları, kravat (düğüm + uç)
  const shirt: [number, number, number][] = [[0, m - 2, 4], [1, m - 2, 4], [2, m - 1, 2]];
  for (const [dy, x, w] of shirt) if (y0 + dy <= last) r.push(at(x, y0 + dy, w, 1, SHIRT));
  const lapel: [number, number][] = [[0, m - 3], [0, m + 2], [1, m - 3], [1, m + 2], [2, m - 2], [2, m + 1]];
  for (const [dy, x] of lapel) if (y0 + dy <= last && g[y0 + dy][x] && g[y0 + dy][x] !== INK) r.push(at(x, y0 + dy, 1, 1, LAPEL));
  if (colors.chain) {
    // Açık yaka, altın zincir: V'nin içinde sarkan üç halka ve madalyon
    r.push(at(m - 2, y0, 1, 1, colors.chain), at(m + 1, y0, 1, 1, colors.chain), at(m - 1, y0 + 1, 2, 1, colors.chain));
    if (y0 + 2 <= last) r.push(at(m - 1, y0 + 2, 1, 1, shade(colors.chain, 0.35)));
  } else {
    r.push(at(m - 1, y0, 2, 1, shade(fit.tie, -0.2)));
    const tipEnd = Math.min(last, y0 + 4);
    if (tipEnd > y0) r.push(at(m - 1, y0 + 1, 2, tipEnd - y0, fit.tie));
    if (tipEnd < last) r.push(at(m - 1, tipEnd + 1, 2, 1, shade(fit.tie, -0.2)));
  }
  // Düğme
  if (last - y0 >= 5) r.push(at(m - 1, last - 1, 1, 1, colors.button));
  return r;
}

/**
 * Ayrıntılı gövdede (res 2) takım elbise, gövde ızgarasının kendi pikselleriyle:
 * ince çizgili kumaş, sol üstten ışık / sağ alttan gölge, ayrı tonda kollar (kanatlar) ve kol dikişi,
 * kenarı koyu, çentikli geniş yakalar, V'de gömlek (kravat ya da altın zincir), orta dikiş ve altın düğmeler,
 * göğüs cebinde mendil, iki yan cep kapağı. Bacaklar (`keep`) boyanmaz.
 */
function hiSuitRects(ch: Character, colors: SuitColors, fit: (typeof SUIT_FIT)[MascotKey]): R[] {
  const res = ch.res ?? 2;
  const g = bodyGrid(ch.key);
  const n = g.length;
  const Y = ch.anchors.neck.y * res;
  const M = Math.round(ch.anchors.neck.x * res); // orta çizgi: M-1 | M
  const x0 = fit.x0 * res, x1 = (fit.x1 + 1) * res;
  const J = colors.jacket;
  const tone = {
    base: J, light: shade(J, 0.22), dark: shade(J, -0.18), deep: shade(J, -0.36), pin: shade(J, 0.09),
    sleeve: shade(J, -0.1), sleeveLight: shade(J, 0.1), sleeveDark: shade(J, -0.28),
    // Saten yaka: ceketten koyu, dış kenarında ince parlak çizgi
    lapel: colors.lapel, lapelEdge: shade(colors.lapel, 0.45),
  };
  const isJ = (x: number, y: number) => {
    const c = g[y]?.[x];
    return y >= Y && x >= x0 && x < x1 && !!c && c !== INK && !fit.keep?.includes(c);
  };
  const isSleeve = (x: number, y: number) => isJ(x, y) && !!fit.sleeve?.includes(g[y][x]!);
  const out: Grid = Array.from({ length: n }, () => Array<string | null>(n).fill(null));
  const set = (x: number, y: number, c: string) => {
    if (isJ(x, y)) out[y][x] = c;
  };
  let last = Y;
  // Kumaş: ışık, gölge, ince çizgi; kollar ayrı tonda, gövdeyle birleştiği yerde dikiş
  for (let y = Y; y < n; y++)
    for (let x = x0; x < x1; x++) {
      if (!isJ(x, y)) continue;
      last = Math.max(last, y);
      const sl = isSleeve(x, y);
      let c: string;
      if (!isJ(x - 1, y) || !isJ(x, y - 1)) c = sl ? tone.sleeveLight : tone.light;
      else if (!isJ(x + 1, y) || !isJ(x, y + 1)) c = sl ? tone.sleeveDark : tone.dark;
      else if (!sl && (isSleeve(x - 1, y) || isSleeve(x + 1, y))) c = tone.deep;
      else if (sl) c = (x + y) % 7 === 0 ? tone.sleeveLight : tone.sleeve;
      else c = (x - M) % 4 === 0 ? tone.pin : tone.base;
      out[y][x] = c;
    }
  // Orta dikiş ve düğmeler (yakaların birleştiği yerin altından eteğe)
  for (let y = Y + 8; y < last; y++) set(M, y, tone.deep);
  for (const y of [Y + 9, Y + 13]) {
    set(M - 1, y, GOLD);
    set(M, y, shade(GOLD, -0.25));
  }
  // Yan cep kapakları
  for (const [a, b] of [[M - 10, M - 5], [M + 4, M + 9]] as const) {
    for (let x = a; x <= b; x++) set(x, Y + 14, tone.deep);
    for (let x = a; x <= b; x++) set(x, Y + 13, tone.light);
  }
  // Göğüs cebi + mendil (giyenin solu, bakanın sağı)
  for (let x = M + 5; x <= M + 9; x++) set(x, Y + 9, tone.deep);
  const sq: [number, number, string][] = [
    [M + 6, Y + 8, '#FFFFFF'], [M + 7, Y + 8, '#FFFFFF'], [M + 8, Y + 8, '#F3E6EC'],
    [M + 7, Y + 7, '#FFFFFF'], [M + 8, Y + 7, GOLD], [M + 6, Y + 7, '#F3E6EC'], [M + 8, Y + 6, '#F6D36B'],
  ];
  for (const [x, y, c] of sq) set(x, y, c);
  // Yakalar: dış kenar omuzdan V'nin dibine iner; dışı koyu kenar, 2. satırda çentik
  for (let d = 0; d <= 8; d++) {
    const outer = M - 9 + d;
    const half = Math.max(1, 5 - d);
    const inner = d <= 5 ? M - half - 1 : M - 1;
    for (let x = outer; x <= inner; x++) {
      const c = x === outer ? tone.lapelEdge : tone.lapel;
      set(x, Y + d, c);
      set(2 * M - 1 - x, Y + d, c);
    }
    if (d === 2) {
      set(outer, Y + d, tone.base);
      set(2 * M - 1 - outer, Y + d, tone.base);
      set(outer + 1, Y + d, tone.lapelEdge);
      set(2 * M - 2 - outer, Y + d, tone.lapelEdge);
    }
  }
  const r = gridRects(out, OX, OY, res);
  // V'de gömlek; kravat ya da altın zincir
  const k = 1 / res;
  const h = (x: number, y: number, w: number, hh: number, c: string) => r.push(at(x * k, y * k, w * k, hh * k, c));
  for (let d = 0; d < 6; d++) {
    const half = Math.max(1, 5 - d);
    h(M - half, Y + d, half * 2, 1, colors.shirt);
  }
  if (colors.chain) {
    const c = colors.chain, hl = shade(c, 0.4);
    for (let d = 0; d < 4; d++) {
      h(M - 4 + d, Y + d, 1, 1, d % 2 ? hl : c);
      h(M + 3 - d, Y + d, 1, 1, d % 2 ? hl : c);
    }
    h(M - 1, Y + 4, 2, 2, c);
    h(M - 1, Y + 4, 1, 1, hl);
  } else {
    h(M - 1, Y, 2, 1, shade(fit.tie, -0.2));
    h(M - 1, Y + 1, 2, 7, fit.tie);
  }
  return r;
}

function neckRects(ch: Character, neck: Neck): R[] {
  if (neck === 'suit') return suitRects(ch);
  if (neck === 'pinksuit') return suitRects(ch, PINK_SUIT);
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
    case 'briefcase':
      // Elde sarkan evrak çantası: tutma noktasının biraz altında, gövdeye yaslı
      return [r(0, 5, 6, 5, '#7A4A2A'), r(0, 5, 6, 1, '#9C6238'), r(0, 9, 6, 1, '#5E3820'), r(1, 4, 1, 1, '#3B2A20'), r(4, 4, 1, 1, '#3B2A20'), r(1, 3, 4, 1, '#3B2A20'), r(2, 7, 2, 1, GOLD)];
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
  const row = unitGrid(key)[Math.max(0, Math.min(23, y))];
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
  const res = CHARACTERS[key].res ?? 1;
  const out: R[] = [];
  for (const [x0, y0, x1, y1] of boxes)
    for (let y = y0 * res; y < Math.min(y1, maxY) * res; y++)
      for (let x = x0 * res; x < x1 * res; x++) {
        const c = g[y]?.[x];
        if (c) out.push(at(x / res, y / res, 1 / res, 1 / res, c));
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
  const o = outfitFor(key, L.outfit ?? outfitKey);
  const body = gridRects(bodyGrid(key), OX, OY, ch.res ?? 1);
  const sq = L.squash ? 1 : 0;
  // Nefes/kıkırdama: gövdenin üst yarısı 1 px aşağı (alt satırlar yerinde)
  const squashY = OY + 12;
  const shiftUp = (r: R): R => (sq && r[1] < squashY ? [r[0], r[1] + sq, r[2], r[3], r[4]] : r);
  const figure: R[] = [];
  figure.push(...body.map(shiftUp));
  figure.push(...blushRects(ch, mood, L.blush).map(shiftUp));
  if ((mood === 'happy' || mood === 'celebrate') && !ch.hiFace) figure.push(...(ch.anchors.smile ?? []).map(([x, y]) => shiftUp(at(x, y, 1, 1, '#E86A7A'))));
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
