/**
 * Cep Defteri'nin maskotları: beş özgün hayvan karakter.
 * Her biri 24×24 piksellik bir gövde çizimi, yüz ve aksesuarlar için bağlantı noktaları (anchors),
 * renk teması ve kişilik bilgisinden oluşur. Bu dosya saftır (tarayıcıya dokunmaz):
 * uygulama, Android simge üretici ve testler aynı tanımı kullanır.
 */

export type MascotKey = 'fistik' | 'bilge' | 'ceviz' | 'diken' | 'karamel';
export const MASCOT_KEYS: MascotKey[] = ['fistik', 'bilge', 'ceviz', 'diken', 'karamel'];
export const DEFAULT_MASCOT: MascotKey = 'fistik';

export type Lang = 'tr' | 'en';
export type L10n = Record<Lang, string>;

/** Piksel ızgarası: [y][x] = renk ya da null */
export type Grid = (string | null)[][];
export const S = 24;
export const INK = '#2A1E1A';
const W = '#FFFFFF';

export interface Anchors {
  /** Sol gözün sol üst pikseli; gözler 2×2 */
  eye: [number, number];
  /** Gözler arası mesafe (sol gözden sağ göze) */
  eyeGap: number;
  /** Baykuş: gözler beyaz disk içinde, bebek 2×2 */
  owlEyes?: boolean;
  /** Gözün çevresinde kapak çizerken kullanılan ton */
  lid: string;
  /** Başın üstü: şapkanın oturacağı satır ve ortası, genişlik */
  head: { x: number; y: number; w: number };
  /** Boyun: atkı/papyon satırı */
  neck: { x: number; y: number; w: number };
  /** Eşya tutma noktaları (sol/sağ), gövdenin yanında */
  hold: { l: [number, number]; r: [number, number] };
  /** Yanak pembeleri */
  blush: [number, number][];
  /** Sevinçte dil/ağız pikselleri (isteğe bağlı) */
  smile?: [number, number][];
}

export interface Palette {
  /** Vurgu (düğme, seçili öğe); beyaz yazıyla ≥ 4.5 kontrast */
  accent: string;
  soft: string;
  line: string;
  /** Kâğıt zemin tonu */
  paper: string;
  /** Koyu temada vurgu (koyu yazıyla ≥ 4.5) */
  darkAccent: string;
  darkSoft: string;
  darkLine: string;
  /** Simge zemini */
  iconBg: string;
}

export interface Character {
  key: MascotKey;
  name: L10n;
  species: L10n;
  /** Seçim ekranında kendini tanıtma cümlesi */
  intro: L10n;
  traits: L10n;
  palette: Palette;
  /** Patilerin/kanatların rengi (kaldırılmış patiler çizilirken) */
  fur: string;
  /** Espri olasılığı (0–1): kişiliğe göre */
  quipChance: number;
  /** Sürpriz havuzunda daha sık görülen imza hareketleri */
  signature: string[];
  anchors: Anchors;
  /** Gövde (göz/ifade hariç) */
  body: () => Grid;
}

// ── Izgara yardımcıları ───────────────────────────────
export const grid = (): Grid => Array.from({ length: S }, () => Array<string | null>(S).fill(null));
const inEll = (x: number, y: number, cx: number, cy: number, rx: number, ry: number) => ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1;
function ell(g: Grid, cx: number, cy: number, rx: number, ry: number, c: string) {
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) if (inEll(x, y, cx, cy, rx, ry)) g[y][x] = c;
}
function rect(g: Grid, x: number, y: number, w: number, h: number, c: string) {
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (i >= 0 && j >= 0 && i < S && j < S) g[j][i] = c;
}
function px(g: Grid, pts: [number, number][], c: string) {
  for (const [x, y] of pts) if (x >= 0 && y >= 0 && x < S && y < S) g[y][x] = c;
}
function ring(g: Grid, cx: number, cy: number, R: number, r: number, c: string) {
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++) {
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      if (d <= R && d >= r) g[y][x] = c;
    }
}
/** Siluetin dışına 1 px kontur. */
function outline(g: Grid): Grid {
  const out = g.map((r) => r.slice());
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++) {
      if (g[y][x]) continue;
      if (([[1, 0], [-1, 0], [0, 1], [0, -1]] as const).some(([dx, dy]) => g[y + dy]?.[x + dx])) out[y][x] = INK;
    }
  return out;
}
/** Bir rengin sağ/alt kenarını koyulaştırır (hacim). */
function shadeEdge(g: Grid, color: string, dark: string): Grid {
  const out = g.map((r) => r.slice());
  for (let y = 0; y < S - 1; y++) for (let x = 0; x < S; x++) if (g[y][x] === color && (g[y + 1][x] !== color || g[y][x + 1] !== color)) out[y][x] = dark;
  return out;
}

// ── Karakterler ───────────────────────────────────────
export const CHARACTERS: Record<MascotKey, Character> = {
  fistik: {
    key: 'fistik',
    fur: '#E9893C',
    name: { tr: 'Fıstık', en: 'Peanut' },
    species: { tr: 'Sokak kedisi', en: 'Street cat' },
    intro: { tr: 'Selam! Ben Fıstık. Kahve paramı da ben tutarım, seninkini de.', en: "Hi! I'm Peanut. I keep track of my coffee money, and yours too." },
    traits: { tr: 'Şakacı, biraz ukala ama kalbi altın. Kısa ve esprili konuşur.', en: 'Playful, a little cheeky, heart of gold. Short and witty.' },
    palette: { accent: '#AE4716', soft: '#F8DCC8', line: '#E9AE8C', paper: '#F6EEE6', darkAccent: '#F0874F', darkSoft: '#4A2A1C', darkLine: '#7E4430', iconBg: '#F8DCC8' },
    quipChance: 0.4,
    signature: ['tailwag', 'stretch', 'hop'],
    anchors: { eye: [8, 9], eyeGap: 7, lid: '#C46A26', head: { x: 12, y: 4, w: 10 }, neck: { x: 12, y: 15, w: 11 }, hold: { l: [2, 15], r: [20, 16] }, blush: [[7, 12], [16, 12]] },
    body() {
      let g = grid();
      const O = '#E9893C', D = '#C46A26', C = '#FFF0DA', P = '#F2A3A3';
      px(g, [[19, 15], [20, 14], [21, 13], [21, 12], [21, 11], [20, 10], [20, 15], [21, 14], [22, 13], [22, 12], [22, 11]], O); // kuyruk
      ell(g, 12, 17.5, 7.5, 5, O);
      ell(g, 12, 10, 8, 6.2, O);
      for (let r = 0; r < 5; r++) for (let i = 0; i <= r; i++) px(g, [[5 + i, 2 + r], [18 - i, 2 + r]], O); // kulaklar
      g = outline(g);
      px(g, [[6, 5], [6, 6], [7, 6], [17, 5], [17, 6], [16, 6]], P);
      px(g, [[11, 5], [11, 6], [13, 5], [13, 6], [12, 5]], D);
      ell(g, 12, 12.6, 3.4, 2, C);
      ell(g, 12, 18.5, 3.5, 3.2, C);
      px(g, [[11, 12], [12, 12]], P);
      px(g, [[10, 13], [13, 13]], INK);
      rect(g, 7, 21, 3, 1, C);
      rect(g, 14, 21, 3, 1, C);
      px(g, [[3, 12], [4, 12], [3, 14], [4, 13], [19, 12], [20, 12], [19, 13], [20, 14]], INK);
      return shadeEdge(g, O, D);
    },
  },
  bilge: {
    key: 'bilge',
    fur: '#3E4A8C',
    name: { tr: 'Bilge', en: 'Sage' },
    species: { tr: 'Baykuş', en: 'Owl' },
    intro: { tr: 'Merhaba, ben Bilge. Rakamlar konuşur, ben de onları dinlerim.', en: "Hello, I'm Sage. Numbers talk, and I listen." },
    traits: { tr: 'Sakin, meraklı, rakamları sever. Az konuşur, çok ipucu verir.', en: 'Calm, curious, loves numbers. Speaks little, tips a lot.' },
    palette: { accent: '#4351A3', soft: '#DEE2F6', line: '#AEB6E4', paper: '#F0F0F2', darkAccent: '#8E9BEA', darkSoft: '#262B4A', darkLine: '#3E4677', iconBg: '#DEE2F6' },
    quipChance: 0.18,
    signature: ['glasses', 'tilt', 'lookaround'],
    anchors: { eye: [7, 9], eyeGap: 7, owlEyes: true, lid: '#5867B5', head: { x: 12, y: 5, w: 11 }, neck: { x: 12, y: 14, w: 11 }, hold: { l: [1, 15], r: [21, 15] }, blush: [[6, 13], [17, 13]] },
    body() {
      let g = grid();
      const B = '#5867B5', D = '#3E4A8C', C = '#F5E9CF', Y = '#E6B23C';
      ell(g, 12, 13.5, 8.2, 9, B);
      px(g, [[5, 4], [6, 4], [6, 5], [17, 4], [18, 4], [17, 5]], B);
      g = outline(g);
      ell(g, 4.6, 15, 1.8, 4.5, D);
      ell(g, 19.4, 15, 1.8, 4.5, D);
      ell(g, 12, 17, 4.8, 4.6, C);
      px(g, [[10, 15], [11, 16], [12, 15], [13, 16], [14, 15], [10, 18], [11, 19], [12, 18], [13, 19], [14, 18]], '#D9C8A3');
      ell(g, 8.5, 10, 3.2, 3.2, W);
      ell(g, 15.5, 10, 3.2, 3.2, W);
      ring(g, 8.5, 10, 3.6, 3.15, INK);
      ring(g, 15.5, 10, 3.6, 3.15, INK);
      px(g, [[11, 12], [12, 12], [11, 13], [12, 13]], Y);
      px(g, [[11, 14]], '#B5862A');
      px(g, [[8, 22], [9, 22], [10, 22], [13, 22], [14, 22], [15, 22]], Y);
      return g;
    },
  },
  ceviz: {
    key: 'ceviz',
    fur: '#A8683A',
    name: { tr: 'Ceviz', en: 'Walnut' },
    species: { tr: 'Sincap', en: 'Squirrel' },
    intro: { tr: 'Ben Ceviz! Her kuruşu bir ceviz gibi saklarım. Kış gelir, biliyorsun.', en: "I'm Walnut! I stash every coin like a nut. Winter's coming, you know." },
    traits: { tr: 'Tutumlu, hareketli, sabırlı. Birikim hedeflerine bayılır.', en: 'Thrifty, lively, patient. Loves savings goals.' },
    palette: { accent: '#7A5418', soft: '#F1E2C6', line: '#D8BB86', paper: '#F5EFE4', darkAccent: '#E0B060', darkSoft: '#3D2E16', darkLine: '#6A5226', iconBg: '#F1E2C6' },
    quipChance: 0.3,
    signature: ['stash', 'hop', 'lookaround'],
    anchors: { eye: [7, 8], eyeGap: 6, lid: '#A8683A', head: { x: 10, y: 4, w: 9 }, neck: { x: 11, y: 14, w: 9 }, hold: { l: [2, 15], r: [10, 15] }, blush: [[6, 11], [15, 11]] },
    body() {
      let g = grid();
      const B = '#A8683A', D = '#7E4A26', C = '#F6E3C8', T = '#C27F48', N = '#8A5A2B';
      ell(g, 18.5, 10, 4.5, 7.5, T);
      ell(g, 11, 17.5, 6.5, 5, B);
      ell(g, 10.5, 9.5, 6.5, 5.5, B);
      px(g, [[5, 3], [5, 4], [6, 4], [6, 5], [5, 5], [15, 3], [15, 4], [14, 4], [14, 5], [15, 5]], B);
      px(g, [[5, 2], [15, 2]], D);
      g = outline(g);
      px(g, [[18, 5], [19, 7], [17, 9], [20, 11], [18, 13], [19, 15]], '#D9995F');
      ell(g, 10.5, 12, 3.2, 1.8, C);
      ell(g, 11, 18.5, 3.3, 3, C);
      px(g, [[10, 11], [11, 11]], INK);
      ell(g, 11, 16, 2.2, 1.8, N);
      px(g, [[10, 15], [12, 16]], '#B98450');
      rect(g, 8, 16, 1, 1, B);
      rect(g, 13, 16, 1, 1, B);
      return shadeEdge(g, B, D);
    },
  },
  diken: {
    key: 'diken',
    fur: '#F2DCC0',
    name: { tr: 'Diken', en: 'Spike' },
    species: { tr: 'Kirpi', en: 'Hedgehog' },
    intro: { tr: 'Diken ben. Gereksizse alma, gerekliyse yaz. Bu kadar.', en: "Spike here. If you don't need it, skip it. If you buy it, log it. That's it." },
    traits: { tr: 'Sakin, minimalist, kuru mizahlı. Asla telaşlanmaz.', en: 'Calm, minimalist, dry humor. Never in a hurry.' },
    palette: { accent: '#56661B', soft: '#E4EBCB', line: '#BFCB8F', paper: '#F0F0E6', darkAccent: '#B5C95E', darkSoft: '#2F361A', darkLine: '#4E5A27', iconBg: '#E4EBCB' },
    quipChance: 0.25,
    signature: ['curl', 'leaf', 'lookaround'],
    anchors: { eye: [8, 13], eyeGap: 7, lid: '#8C6A4F', head: { x: 12, y: 4, w: 12 }, neck: { x: 12, y: 19, w: 11 }, hold: { l: [0, 15], r: [21, 15] }, blush: [[7, 16], [16, 16]] },
    body() {
      let g = grid();
      const Sp = '#8C6A4F', SD = '#5E4636', F = '#F2DCC0', Lf = '#5BAA5E';
      ell(g, 12, 13, 9.5, 8, Sp);
      for (let i = 0; i < 9; i++) {
        const x = 4 + i * 2;
        px(g, [[x, 5 - (i % 2)], [x, 6 - (i % 2)]], Sp);
      }
      px(g, [[2, 10], [2, 13], [21, 10], [21, 13]], Sp);
      g = outline(g);
      for (let y = 6; y < 13; y += 2) for (let x = 4 + (y % 4); x < 21; x += 4) px(g, [[x, y]], SD);
      ell(g, 12, 15.5, 6.5, 5.2, F);
      px(g, [[11, 16], [12, 16]], INK);
      px(g, [[11, 17], [12, 17]], '#C98F7A');
      px(g, [[7, 21], [8, 21], [15, 21], [16, 21]], SD);
      px(g, [[15, 3], [16, 3], [16, 2], [17, 2], [14, 4], [15, 4], [16, 4]], Lf);
      px(g, [[14, 5]], '#3E7F43');
      return g;
    },
  },
  karamel: {
    key: 'karamel',
    fur: '#E2A75A',
    name: { tr: 'Karamel', en: 'Caramel' },
    species: { tr: 'Sokak köpeği', en: 'Street dog' },
    intro: { tr: 'Hav! Ben Karamel. Hesabı bölüşürüz, borcu unutmayız, söz!', en: "Woof! I'm Caramel. We split the bill and never forget who owes what. Promise!" },
    traits: { tr: 'Neşeli, sadık, herkesle arkadaş. Bölüşmeyi ve arkadaş hesaplarını sever.', en: 'Cheerful, loyal, friends with everyone. Loves splitting bills.' },
    palette: { accent: '#1F5F96', soft: '#D7E6F3', line: '#A5C4E2', paper: '#EEF1F3', darkAccent: '#79B4E6', darkSoft: '#1C2E40', darkLine: '#30506F', iconBg: '#D7E6F3' },
    quipChance: 0.38,
    signature: ['tailwag', 'earflap', 'hop'],
    anchors: { eye: [8, 8], eyeGap: 7, lid: '#B97C37', head: { x: 12, y: 3, w: 10 }, neck: { x: 12, y: 15, w: 11 }, hold: { l: [2, 16], r: [20, 17] }, blush: [[6, 11], [17, 11]], smile: [[12, 14], [13, 14]] },
    body() {
      let g = grid();
      const Y = '#E2A75A', D = '#B97C37', C = '#FBEBD0', E = '#8A5626', BL = '#2F6FAE';
      px(g, [[19, 16], [20, 15], [21, 14], [21, 13], [20, 16]], Y);
      ell(g, 12, 17.5, 7, 5, Y);
      ell(g, 12, 9.5, 7, 6, Y);
      ell(g, 4.8, 9.5, 2.2, 4.2, E);
      ell(g, 19.2, 9.5, 2.2, 4.2, E);
      g = outline(g);
      ell(g, 12, 12.5, 3.6, 2.4, C);
      ell(g, 12, 19, 3.5, 2.8, C);
      px(g, [[11, 11], [12, 11], [11, 12], [12, 12]], INK);
      px(g, [[11, 11]], '#5A4A44');
      rect(g, 6, 15, 12, 1, BL);
      px(g, [[9, 16], [10, 16], [11, 16], [12, 16], [13, 16], [14, 16], [10, 17], [11, 17], [12, 17], [13, 17], [11, 18], [12, 18]], BL);
      px(g, [[8, 15], [12, 16], [15, 15]], '#9CC3E8');
      rect(g, 7, 21, 3, 1, C);
      rect(g, 14, 21, 3, 1, C);
      return shadeEdge(g, Y, D);
    },
  },
};

export const characterOf = (k: string | null | undefined): Character => CHARACTERS[(k as MascotKey) in CHARACTERS ? (k as MascotKey) : DEFAULT_MASCOT];

const bodyCache = new Map<MascotKey, Grid>();
/** Gövde ızgarası (önbellekli). */
export function bodyGrid(k: MascotKey): Grid {
  let g = bodyCache.get(k);
  if (!g) bodyCache.set(k, (g = CHARACTERS[k].body()));
  return g;
}
