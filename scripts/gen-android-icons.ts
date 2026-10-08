/**
 * Android ve web simgelerini maskot tanımlarından (src/mascot/characters.ts) üretir.
 * Tarayıcı ya da ek paket gerekmez: pikseller elle çizilir, PNG node:zlib ile kodlanır.
 *
 *   npx tsx scripts/gen-android-icons.ts
 *
 * Ürettikleri (android/app/src/main/res altında):
 *   mipmap-<yoğunluk>/ic_launcher_<anahtar>.png, _round.png, _foreground.png   her maskot için (başlatıcı takma adları)
 *   mipmap-anydpi-v26/ic_launcher_<anahtar>.xml, _round.xml                   uyarlanabilir simge (zemin: palette.iconBg)
 *   values/ic_launcher_mascots.xml                                             zemin renkleri
 *   mipmap-<yoğunluk>/ic_launcher.png, _round.png, _foreground.png            varsayılan simge: Fıstık, kâğıt zemin
 *   drawable, drawable-port-…, drawable-land-… içinde splash.png               açılış ekranı: Fıstık
 *   drawable-nodpi/widget_mascot_<anahtar>.png, widget_preview.png             ana ekran aracı (simge, seçici önizlemesi)
 *   drawable-nodpi/widget_scene_<anahtar>_strip|wide|tall.png                  araç zemini: maskotun sahnesi
 *   drawable-nodpi/widget_anim_<anahtar>_*.png, widget_bust_<anahtar>*.png     maskot kareleri/pozları, küçük araç büstü
 *   drawable/widget_btn|btn_soft|chip|fab_<anahtar>.xml, values(-night)/widget_mascot_colors.xml   maskot renginde düğmeler
 * ve public/icon-180.png, icon-192.png, icon-512.png, icon.svg (web/PWA simgesi: Fıstık).
 *
 * Maskot pikselleri keskin kalır (yumuşatma yok); yalnız zemin şekillerinin (daire, yuvarlak köşe) kenarı yumuşatılır.
 */
import { deflateSync } from 'node:zlib';
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CHARACTERS, INK, MASCOT_KEYS, bodyGrid, type Grid, type MascotKey } from '../src/mascot/characters';
import { CW, OY, compose, type MascotLive, type R } from '../src/mascot/render';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const RES = join(ROOT, 'android/app/src/main/res');
const PUBLIC = join(ROOT, 'public');
const PAPER = '#F4EFE6';
const DEFAULT_KEY: MascotKey = 'fistik';
const DENSITIES: [string, number][] = [
  ['mdpi', 1],
  ['hdpi', 1.5],
  ['xhdpi', 2],
  ['xxhdpi', 3],
  ['xxxhdpi', 4],
];

// ── Maskot ızgarası ───────────────────────────────────
/** Gövde + mutlu gözler: 2×2 mürekkep, sol üstte 1 px beyaz parıltı. */
export function iconGrid(key: MascotKey): Grid {
  const g = bodyGrid(key).map((r) => r.slice());
  const { eye, eyeGap } = CHARACTERS[key].anchors;
  for (const ex of [eye[0], eye[0] + eyeGap]) {
    const ey = eye[1];
    for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) if (g[ey + dy]?.[ex + dx] !== undefined) g[ey + dy][ex + dx] = INK;
    if (g[ey]?.[ex] !== undefined) g[ey][ex] = '#FFFFFF';
  }
  return g;
}

interface Box {
  x0: number;
  y0: number;
  x1: number; // dahil değil
  y1: number;
}
function bbox(g: Grid): Box {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  g.forEach((row, y) =>
    row.forEach((c, x) => {
      if (!c) return;
      x0 = Math.min(x0, x);
      y0 = Math.min(y0, y);
      x1 = Math.max(x1, x + 1);
      y1 = Math.max(y1, y + 1);
    }),
  );
  return { x0, y0, x1, y1 };
}
/** İçeriğin, kutu merkezinden en uzak köşesinin uzaklığı (ızgara birimi). */
function contentRadius(g: Grid, b: Box): number {
  const cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2;
  let r = 0;
  g.forEach((row, y) =>
    row.forEach((c, x) => {
      if (!c) return;
      for (const [px, py] of [[x, y], [x + 1, y], [x, y + 1], [x + 1, y + 1]]) r = Math.max(r, Math.hypot(px - cx, py - cy));
    }),
  );
  return r;
}
/** Hücre boyu (px): yarıçap ve kutu sınırına sığan en büyük değer; 2 ve üstü tam sayıya yuvarlanır (eşit pikseller). */
function fitCell(g: Grid, maxRadius: number, maxBox: number): number {
  const b = bbox(g);
  const c = Math.min(maxRadius / contentRadius(g, b), maxBox / Math.max(b.x1 - b.x0, b.y1 - b.y0));
  return c >= 2 ? Math.floor(c) : c;
}

// ── Tuval ─────────────────────────────────────────────
type RGBA = [number, number, number, number];
const hex = (h: string, a = 255): RGBA => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16), a];

class Canvas {
  readonly px: Uint8ClampedArray;
  constructor(readonly w: number, readonly h: number, bg?: string) {
    this.px = new Uint8ClampedArray(w * h * 4);
    if (bg) this.rect(0, 0, w, h, bg);
  }
  /** Kaynak-üstü karışım; a: 0–1 kapsama. */
  blend(x: number, y: number, c: RGBA, a = 1) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = (y * this.w + x) * 4;
    const sa = (c[3] / 255) * a;
    if (sa <= 0) return;
    const da = this.px[i + 3] / 255;
    const oa = sa + da * (1 - sa);
    for (let k = 0; k < 3; k++) this.px[i + k] = Math.round((c[k] * sa + this.px[i + k] * da * (1 - sa)) / oa);
    this.px[i + 3] = Math.round(oa * 255);
  }
  rect(x: number, y: number, w: number, h: number, color: string) {
    const c = hex(color);
    for (let j = Math.max(0, y); j < Math.min(this.h, y + h); j++) for (let i = Math.max(0, x); i < Math.min(this.w, x + w); i++) this.blend(i, j, c);
  }
  /** Yumuşak kenarlı şekil: inside(x, y) alt piksel örneklemesiyle (4×4). */
  shape(inside: (x: number, y: number) => boolean, color: string, box = { x: 0, y: 0, w: this.w, h: this.h }) {
    const c = hex(color);
    const N = 4;
    for (let y = Math.floor(box.y); y < Math.ceil(box.y + box.h); y++)
      for (let x = Math.floor(box.x); x < Math.ceil(box.x + box.w); x++) {
        let n = 0;
        for (let sy = 0; sy < N; sy++) for (let sx = 0; sx < N; sx++) if (inside(x + (sx + 0.5) / N, y + (sy + 0.5) / N)) n++;
        if (n) this.blend(x, y, c, n / (N * N));
      }
  }
  circle(cx: number, cy: number, r: number, color: string) {
    this.shape((x, y) => (x - cx) ** 2 + (y - cy) ** 2 <= r * r, color, { x: cx - r - 1, y: cy - r - 1, w: 2 * r + 2, h: 2 * r + 2 });
  }
  roundRect(x: number, y: number, w: number, h: number, r: number, color: string) {
    this.shape(
      (px, py) => {
        if (px < x || py < y || px > x + w || py > y + h) return false;
        const qx = Math.max(x + r - px, 0, px - (x + w - r));
        const qy = Math.max(y + r - py, 0, py - (y + h - r));
        return qx * qx + qy * qy <= r * r;
      },
      color,
      { x: x - 1, y: y - 1, w: w + 2, h: h + 2 },
    );
  }
  /** Izgarayı, içerik kutusunun merkezi (cx, cy)'ye gelecek şekilde keskin piksellerle çizer. */
  grid(g: Grid, cx: number, cy: number, cell: number) {
    const b = bbox(g);
    const ox = cx - ((b.x1 - b.x0) * cell) / 2;
    const oy = cy - ((b.y1 - b.y0) * cell) / 2;
    // Tam sayı hücrede de tam piksele otursun.
    const bx = cell >= 1 && Number.isInteger(cell) ? Math.round(ox) : ox;
    const by = cell >= 1 && Number.isInteger(cell) ? Math.round(oy) : oy;
    g.forEach((row, y) =>
      row.forEach((c, x) => {
        if (!c) return;
        const x0 = Math.round(bx + (x - b.x0) * cell), x1 = Math.round(bx + (x - b.x0 + 1) * cell);
        const y0 = Math.round(by + (y - b.y0) * cell), y1 = Math.round(by + (y - b.y0 + 1) * cell);
        this.rect(x0, y0, Math.max(1, x1 - x0), Math.max(1, y1 - y0), c);
      }),
    );
  }
  png(): Buffer {
    return encodePng(this.w, this.h, this.px);
  }
}

// ── PNG ───────────────────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function encodePng(w: number, h: number, rgba: Uint8ClampedArray): Buffer {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0; // filtre yok
    Buffer.from(rgba.buffer, rgba.byteOffset + y * w * 4, w * 4).copy(raw, y * (w * 4 + 1) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit derinliği
  ihdr[9] = 6; // RGBA
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

// ── Çıktılar ──────────────────────────────────────────
let written = 0;
function write(path: string, data: Buffer | string) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, data);
  written++;
}

/** Eski tarz kare simge (48 dp): yuvarlak köşeli zemin + maskot. */
function legacySquare(key: MascotKey, bg: string, d: number): Buffer {
  const s = Math.round(48 * d);
  const c = new Canvas(s, s);
  const m = 1 * d;
  c.roundRect(m, m, s - 2 * m, s - 2 * m, 9 * d, bg);
  const g = iconGrid(key);
  c.grid(g, s / 2, s / 2, fitCell(g, 21 * d, 38 * d));
  return c.png();
}
/** Eski tarz yuvarlak simge (48 dp). */
function legacyRound(key: MascotKey, bg: string, d: number): Buffer {
  const s = Math.round(48 * d);
  const c = new Canvas(s, s);
  c.circle(s / 2, s / 2, s / 2 - d, bg);
  const g = iconGrid(key);
  c.grid(g, s / 2, s / 2, fitCell(g, 19 * d, 34 * d));
  return c.png();
}
/** Uyarlanabilir simge ön katmanı (108 dp, saydam). Güvenli bölge: merkezde 66 dp çaplı daire. */
function adaptiveForeground(key: MascotKey, d: number): Buffer {
  const s = Math.round(108 * d);
  const c = new Canvas(s, s);
  const g = iconGrid(key);
  c.grid(g, s / 2, s / 2, fitCell(g, 31 * d, 56 * d));
  return c.png();
}
function adaptiveXml(name: string, bgColorRes: string): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<!-- scripts/gen-android-icons.ts tarafından üretildi; elle düzenleme. -->
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/${bgColorRes}"/>
    <foreground android:drawable="@mipmap/${name}_foreground"/>
</adaptive-icon>
`;
}

function launcherSet(name: string, key: MascotKey, bg: string, bgColorRes: string) {
  for (const [dn, d] of DENSITIES) {
    write(join(RES, `mipmap-${dn}/${name}.png`), legacySquare(key, bg, d));
    write(join(RES, `mipmap-${dn}/${name}_round.png`), legacyRound(key, bg, d));
    write(join(RES, `mipmap-${dn}/${name}_foreground.png`), adaptiveForeground(key, d));
  }
  write(join(RES, `mipmap-anydpi-v26/${name}.xml`), adaptiveXml(name, bgColorRes));
  write(join(RES, `mipmap-anydpi-v26/${name}_round.xml`), adaptiveXml(name, bgColorRes));
}

function splash(w: number, h: number): Buffer {
  const c = new Canvas(w, h, PAPER);
  const g = iconGrid(DEFAULT_KEY);
  c.grid(g, w / 2, h / 2, Math.max(2, Math.floor((Math.min(w, h) * 0.34) / 24)));
  return c.png();
}

function widgetMascot(key: MascotKey): Buffer {
  const c = new Canvas(208, 208);
  c.grid(iconGrid(key), 104, 104, 8);
  return c.png();
}

/** Web simgesi (kare, kâğıt zemin). Maskeli (maskable) kullanıma uygun: maskot merkezdeki %80 dairenin içinde. */
function webIcon(s: number): Buffer {
  const c = new Canvas(s, s, PAPER);
  const g = iconGrid(DEFAULT_KEY);
  c.grid(g, s / 2, s / 2, fitCell(g, s * 0.36, s * 0.66));
  return c.png();
}
function webSvg(): string {
  const g = iconGrid(DEFAULT_KEY);
  const b = bbox(g);
  const S = 32;
  const ox = (S - (b.x1 - b.x0)) / 2 - b.x0, oy = (S - (b.y1 - b.y0)) / 2 - b.y0;
  const rects: string[] = [];
  g.forEach((row, y) => {
    for (let x = 0; x < row.length; ) {
      const col = row[x];
      let e = x + 1;
      while (e < row.length && row[e] === col) e++;
      if (col) rects.push(`<rect x="${x + ox}" y="${y + oy}" width="${e - x}" height="1" fill="${col}"/>`);
      x = e;
    }
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" shape-rendering="crispEdges"><rect width="${S}" height="${S}" rx="7" fill="${PAPER}"/>${rects.join('')}</svg>\n`;
}

// ── Ana ekran aracı: sahne zeminleri, maskot kareleri, düğme renkleri ───────────
/*
 * Araç "önce sahne" düzenindedir: maskotun sahnesi aracın tamamını kaplar (centerCrop, yuvarlak köşe kırpması
 * Android 12+'da clipToOutline ile), maskot ayrı ve büyük bir görsel olarak sahnenin zemin bandında durur; metin
 * yarı saydam bir panelde, düğmeler maskotun renginde.
 *   drawable-nodpi/widget_scene_<anahtar>_strip.png  küçük + geniş araç zemini (110×28 birim ≈ 4:1)
 *   drawable-nodpi/widget_scene_<anahtar>_wide.png   orta araç zemini (110×54 birim ≈ 2:1)
 *   drawable-nodpi/widget_scene_<anahtar>_tall.png   büyük araç zemini (88×74 birim ≈ 1.2:1)
 *   drawable-nodpi/widget_anim_<anahtar>_<0..5>.png  maskot döngü kareleri, saydam (0 = sabit kare; geniş/orta araçta da)
 *   drawable-nodpi/widget_anim_<anahtar>_write.png   "yazmaya gidiyorum" (Gider/Gelir/kutucuk ile açılınca)
 *   drawable-nodpi/widget_anim_<anahtar>_noted.png   "Not aldım! ✓" (kayıt eklenince)
 *   drawable-nodpi/widget_bust_<anahtar>[_write|_noted].png  küçük araç: alttan bakan büst
 *   drawable/widget_btn_<anahtar>.xml (ana düğme), widget_btn_soft_<anahtar>.xml (ikincil), widget_chip_<anahtar>.xml,
 *   widget_fab_<anahtar>.xml (geniş araçtaki yuvarlak "+"), values(-night)/widget_mascot_colors.xml
 * Hepsi küçük bir birim ızgarasında çizilip tam sayı katla (en yakın komşu) büyütülür ve renk sayısı az olduğundan
 * dizinli (palet) PNG olarak yazılır. Kare sayısı CepWidgetProvider.java'daki dizilerle aynı olmalı (ANIM_FRAMES).
 * Ayaklar karenin alt kenarına oturur: düzende maskot zemine hizalanınca sahnenin zemin bandında durur.
 */
const ANIM_FRAMES = 6;
/** Sahne: birim başına piksel. Orta araç (≈ 330 dp × 3 px/dp ≈ 1000 px) için başlatıcı neredeyse hiç büyütmez. */
const SCENE_K = 10;
/** Maskot kareleri: birim başına piksel (büyük araçta ≈ 150 dp genişlik). */
const SPRITE_K = 12;
/** [genişlik, yükseklik, zemin çizgisi] (birim). Zemin bandı yüksekliğin ≈ %32–38'i: maskotun ayakları bu bantta. */
const SCENE_SIZES = { strip: [110, 28, 19], wide: [110, 54, 36], tall: [88, 74, 46] } as const;
type SceneSize = keyof typeof SCENE_SIZES;
/** Kare tuvali (maskot tuvali koordinatları): x 0–36 (sağda yumak/top payı), y 0–27 (ayaklar y=26'da biter). */
const SPRITE_W = 36, SPRITE_H = 27;
type Live = MascotLive & { dx?: number; dy?: number };
type P = (x: number, y: number, w: number, h: number, col: string) => void;

/** Düğme renkleri (maskotun kendi rengi) ve üstündeki yazı rengi. İkincil düğme/çip bunun saydam tonudur. */
export const WIDGET_BTN: Record<MascotKey, { btn: string; ink: string }> = {
  fistik: { btn: '#E9893C', ink: '#2A1A0E' }, // turuncu kedi
  bilge: { btn: '#5867B5', ink: '#FFFFFF' }, // mavi baykuş
  ceviz: { btn: '#9A5E33', ink: '#FFFFFF' }, // kahve sincap
  diken: { btn: '#5F7A26', ink: '#FFFFFF' }, // adaçayı yeşili (kirpinin yaprağı)
  karamel: { btn: '#E2A75A', ink: '#2A1A0E' }, // karamel köpek
};
const WIDGET_INK = { light: '#23201B', dark: '#F1EBE0' }; // values(-night)/widget_colors.xml widget_ink
const SOFT_BASE = { light: '#FFF9F0', dark: '#1F1C18' };
const SOFT_MIX = { light: 0.2, dark: 0.32 };
const SOFT_ALPHA = 'E6';

function mix(a: string, b: string, t: number): string {
  const A = hex(a), B = hex(b);
  return '#' + [0, 1, 2].map((i) => Math.round(A[i] * (1 - t) + B[i] * t).toString(16).padStart(2, '0')).join('').toUpperCase();
}
function luminance(h: string): number {
  const [r, g, b] = hex(h).slice(0, 3).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a: string, b: string): number {
  const x = luminance(a), y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

/** Tekrarlanabilir sözde rastgele (sahne süsleri her üretimde aynı yerde). */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/** Birim ızgarasında dolu daire. */
function disk(p: P, cx: number, cy: number, r: number, col: string) {
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++)
    for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) if ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= r * r) p(x, y, 1, 1, col);
}
function cloud(p: P, x: number, y: number, w: number, col: string) {
  p(x, y + 1, w, 2, col);
  p(x + 1, y, Math.max(1, w - 4), 1, col);
  p(x + 2, y - 1, Math.max(1, Math.round(w / 3)), 1, col);
}

const SCENES: Record<MascotKey, (p: P, W: number, H: number, G: number) => void> = {
  // Kedi: sıcak oda; pencere, tablo, raf, ahşap zemin, desenli kilim
  fistik(p, W, H, G) {
    p(0, 0, W, G, '#F6E5CF');
    for (let x = 0; x < W; x += 4) p(x, 0, 2, G, '#F2DDC2');
    const wh = Math.min(16, G - 8), ww = Math.round(wh * 1.3), wx = 4, wy = 2;
    if (wh >= 6) {
      p(wx - 1, wy - 1, ww + 2, wh + 2, '#A0785A');
      p(wx, wy, ww, wh, '#CFE3EE');
      disk(p, wx + ww - 4, wy + 3.5, Math.max(1.5, wh / 7), '#F4C95D');
      cloud(p, wx + 2, wy + 3, Math.round(ww / 3), '#FFFFFF');
      p(wx, wy + wh - 3, ww, 3, '#8DBF7A');
      p(wx + 2, wy + wh - 4, Math.round(ww / 3), 1, '#8DBF7A');
      p(wx, wy + wh - 1, ww, 1, '#6E9E5B');
      p(wx + (ww >> 1), wy, 1, wh, '#A0785A');
      p(wx - 2, wy + wh + 1, ww + 4, 1, '#8A6448');
    }
    const fx = Math.round(W * 0.43);
    if (G >= 16) {
      p(fx, 3, 9, 7, '#A0785A');
      p(fx + 1, 4, 7, 5, '#F4D6A0');
      disk(p, fx + 4.5, 6.5, 1.6, '#D97757');
      p(fx + 1, 8, 7, 1, '#8DBF7A');
    }
    const sx = W - 16;
    p(sx, 8, 12, 1, '#A0785A');
    p(sx + 1, 5, 3, 3, '#C98B4A');
    p(sx + 1, 3, 1, 2, '#6E9E5B');
    p(sx + 2, 2, 2, 2, '#8DBF7A');
    p(sx + 3, 4, 1, 1, '#6E9E5B');
    for (const [i, c] of ['#C2453E', '#E5B94A', '#3E8A8C', '#9B7BC6'].entries()) p(sx + 6 + i, 4 + (i % 2), 1, 4 - (i % 2), c);
    p(0, G - 3, W, 3, '#EBCFAA');
    p(0, G - 3, W, 1, '#D9B48A');
    p(0, G, W, H - G, '#C99A6B');
    for (let y = G + 2; y < H; y += 2) p(0, y, W, 1, '#B98A5D');
    for (let y = G, i = 0; y < H; y += 2, i++) for (let x = (i % 2) * 7 + 3; x < W; x += 14) p(x, y, 1, 2, '#B07F52');
    p(0, G, W, 1, '#A87A50');
    const rx = 3, rw = Math.round(W * 0.5), ry = G + Math.max(2, Math.round((H - G) * 0.3)), rh = Math.max(3, H - ry - 1);
    p(rx, ry, rw, rh, '#C2453E');
    p(rx + 1, ry + 1, rw - 2, rh - 2, '#E5B94A');
    if (rh > 4) p(rx + 2, ry + 2, rw - 4, rh - 4, '#C2453E');
    for (let x = rx + 4; x < rx + rw - 3; x += 4) p(x, ry + (rh >> 1), 1, 1, '#E5B94A');
    for (let x = rx; x < rx + rw; x += 2) {
      p(x, ry - 1, 1, 1, '#E5B94A');
      if (ry + rh < H) p(x, ry + rh, 1, 1, '#E5B94A');
    }
  },
  // Baykuş: gece; aylı pencere, kitaplık, koyu ahşap zemin, kilim
  bilge(p, W, H, G) {
    p(0, 0, W, G, '#2E3560');
    for (let y = 3; y < G - 2; y += 4) for (let x = (y % 8 === 3 ? 1 : 3); x < W; x += 4) p(x, y, 1, 1, '#36407A');
    const wh = Math.min(18, G - 6), ww = Math.round(wh * 1.15), wx = 4, wy = 2;
    p(wx - 1, wy - 1, ww + 2, wh + 2, '#1E2347');
    p(wx, wy, ww, wh, '#3B4A8A');
    const mr = Math.max(2, wh / 5), mx = wx + ww - mr - 2, my = wy + mr + 1;
    disk(p, mx, my, mr, '#F4E9B8');
    disk(p, mx - mr * 0.55, my - mr * 0.35, mr * 0.85, '#3B4A8A');
    const r = rng(7);
    for (let i = 0; i < 7; i++) p(wx + 1 + Math.floor(r() * (ww - 2)), wy + 1 + Math.floor(r() * (wh - 2)), 1, 1, i % 3 ? '#FFFFFF' : '#8E9BEA');
    p(wx + (ww >> 1), wy, 1, wh, '#1E2347');
    p(wx, wy + (wh >> 1), ww, 1, '#1E2347');
    p(wx - 2, wy + wh + 1, ww + 4, 1, '#5A3B26');
    // kitaplık (sağ duvar)
    const bx = Math.round(W * 0.56), bw = W - bx - 2, top = 3;
    p(bx, top, bw, G - top, '#4A3020');
    const spines = ['#C2453E', '#E5B94A', '#3E8A8C', '#9B7BC6', '#F2EAD8', '#6F9D7E', '#4A6FA5', '#D97757'];
    let n = 0;
    for (let sy = top + 1; sy + 5 <= G; sy += 6) {
      for (let x = bx + 1; x < bx + bw - 1; ) {
        const w = 1 + ((n * 7) % 3 === 0 ? 1 : 0);
        const h = 3 + ((n * 5) % 3 === 0 ? 1 : 0);
        if ((n * 11) % 9 !== 4) p(x, sy + 4 - h, Math.min(w, bx + bw - 1 - x), h, spines[n % spines.length]);
        x += w;
        n++;
      }
      p(bx, sy + 4, bw, 1, '#6B4A30');
    }
    p(0, G, W, H - G, '#5A3B26');
    p(0, G, W, 1, '#7A5236');
    for (let y = G + 3; y < H; y += 3) p(0, y, W, 1, '#4E331F');
    const rx = 3, rw = Math.round(W * 0.5), ry = G + Math.max(2, Math.round((H - G) * 0.3)), rh = Math.max(3, H - ry - 1);
    p(rx, ry, rw, rh, '#C9A24A');
    p(rx + 1, ry + 1, rw - 2, rh - 2, '#7A2E3A');
    for (let x = rx + 3; x < rx + rw - 2; x += 3) p(x, ry + (rh >> 1), 1, 1, '#C9A24A');
  },
  // Sincap: gökyüzü, yapraklar, kalın meşe dalı (zemin), palamutlar
  ceviz(p, W, H, G) {
    p(0, 0, W, G, '#CFE8F2');
    const r = rng(3);
    cloud(p, Math.round(W * 0.38), 4, 12, '#FFFFFF');
    cloud(p, W - 22, Math.max(3, Math.round(G * 0.35)), 9, '#FFFFFF');
    if (G > 24) cloud(p, Math.round(W * 0.22), Math.round(G * 0.55), 8, '#E6F3F8');
    const leaf = (x: number, y: number, w: number, h: number) => {
      p(x, y, w, h, '#6F9D5B');
      p(x + 1, y + 1, Math.max(1, w - 2), Math.max(1, h - 2), '#8DBF6A');
      p(x + 2, y + 1, 1, 1, '#A8D27F');
    };
    leaf(0, 0, 12, 6);
    leaf(8, 0, 8, 3);
    leaf(-1, 5, 6, 5);
    leaf(W - 9, 0, 10, 4);
    leaf(W - 5, 3, 6, 5);
    // sarkan palamut
    p(13, 3, 1, 2, '#5A3B26');
    p(12, 5, 3, 1, '#7A4A22');
    p(12, 6, 3, 2, '#C98B4A');
    // dal (zemin)
    p(0, G, W, H - G, '#7E4A26');
    p(0, G, W, 1, '#A8683A');
    p(0, G + 1, W, 1, '#96592F');
    for (let y = G + 3; y < H; y += 2)
      for (let x = Math.floor(r() * 6); x < W; x += 6 + Math.floor(r() * 8)) p(x, y, 2 + Math.floor(r() * 4), 1, '#6A3D1F');
    if (H - G > 6) {
      const kx = Math.round(W * 0.5), ky = G + Math.round((H - G) * 0.55);
      p(kx, ky, 4, 2, '#5A3218');
      p(kx + 1, ky - 1, 2, 1, '#5A3218');
    }
    if (H - G > 10) p(0, H - 2, W, 2, '#6E4022');
    // daldan çıkan yapraklar ve palamutlar
    for (const lx of [Math.round(W * 0.47), W - 12]) {
      p(lx, G - 2, 3, 2, '#6F9D5B');
      p(lx + 1, G - 3, 2, 1, '#8DBF6A');
    }
    for (const ax of [Math.round(W * 0.55), W - 6]) {
      p(ax + 1, G - 4, 1, 1, '#5A3B26');
      p(ax, G - 3, 3, 1, '#7A4A22');
      p(ax, G - 2, 3, 2, '#C98B4A');
    }
  },
  // Kirpi: sakin çayır; tepeler, ot öbekleri, yapraklı toprak, mantar
  diken(p, W, H, G) {
    p(0, 0, W, G, '#E7EDD2');
    cloud(p, 6, 4, 9, '#F6F8EC');
    cloud(p, Math.round(W * 0.45), 3, 12, '#F6F8EC');
    cloud(p, W - 18, Math.max(3, Math.round(G * 0.4)), 8, '#F6F8EC');
    for (let x = 0; x < W; x++) {
      const h = Math.round(3 + 2 * Math.sin(x / 7) + 1.5 * Math.sin(x / 3.1 + 1));
      p(x, G - h, 1, h, '#D3DEB0');
    }
    for (let x = 0; x < W; x++) {
      const h = Math.max(0, Math.round(1.5 + 1.5 * Math.sin(x / 5 + 2)));
      if (h) p(x, G - h, 1, h, '#C3D29A');
    }
    const r = rng(11);
    for (let x = 2; x < W; x += 5 + Math.floor(r() * 6)) {
      const h = 2 + Math.floor(r() * 4);
      p(x, G - h, 1, h, '#8DAA5B');
      p(x - 1, G - h + 1, 1, Math.min(2, h - 1), '#A8C46E');
      p(x + 1, G - h + 2, 1, Math.max(1, h - 2), '#A8C46E');
    }
    p(0, G, W, H - G, '#8C6A4F');
    p(0, G, W, 1, '#A07D5E');
    const cols = ['#D97757', '#E5B94A', '#6F9D5B', '#C2553C'];
    for (let i = 0; i < Math.round((W * (H - G)) / 40); i++) {
      const x = Math.floor(r() * W), y = G + 2 + Math.floor(r() * Math.max(1, H - G - 3));
      const c = cols[i % cols.length];
      p(x, y, 2, 1, c);
      p(x + 1, y - 1, 1, 1, c);
    }
    for (let i = 0; i < Math.round(W / 9); i++) p(Math.floor(r() * W), G + 2 + Math.floor(r() * Math.max(1, H - G - 3)), 1, 1, '#B59A80');
    const mx = Math.round(W * 0.47);
    p(mx, G - 3, 4, 2, '#C2453E');
    p(mx + 1, G - 4, 2, 1, '#C2453E');
    p(mx + 1, G - 3, 1, 1, '#FFFFFF');
    p(mx + 3, G - 2, 1, 1, '#FFFFFF');
    p(mx + 1, G - 1, 2, 1, '#F2EAD8');
  },
  // Köpek: güneşli park; bulutlar, çit, çimen, çiçekler, kemik
  karamel(p, W, H, G) {
    p(0, 0, W, G, '#D7E9F6');
    const sr = Math.max(2, Math.min(4, G / 7));
    disk(p, 8, sr + 2.5, sr, '#F4C95D');
    if (G > 18) {
      p(7, 0, 1, 1, '#F4C95D');
      p(Math.round(8 + sr + 2), Math.round(sr + 2), 1, 1, '#F4C95D');
      p(Math.round(8 - sr - 3), Math.round(sr + 2), 1, 1, '#F4C95D');
    }
    cloud(p, Math.round(W * 0.3), 4, 12, '#FFFFFF');
    cloud(p, W - 20, Math.max(3, Math.round(G * 0.3)), 10, '#FFFFFF');
    const fh = Math.min(9, G - 5);
    for (let x = 1; x < W; x += 5) {
      p(x, G - fh, 2, fh, '#F2EAD8');
      p(x, G - fh - 1, 1, 1, '#F2EAD8');
      p(x + 1, G - fh, 1, fh, '#E3D9C6');
    }
    p(0, G - fh + 2, W, 1, '#E3D9C6');
    p(0, G - 3, W, 1, '#E3D9C6');
    // çalı
    const bx = Math.round(W * 0.5);
    p(bx, G - 5, 9, 5, '#6F9D5B');
    p(bx + 1, G - 6, 7, 1, '#6F9D5B');
    p(bx + 2, G - 5, 3, 2, '#8DBF6A');
    p(bx + 6, G - 4, 1, 1, '#E86A5F');
    p(0, G, W, H - G, '#7DBA62');
    p(0, G, W, 1, '#6F9D5B');
    const r = rng(5);
    for (let x = 1; x < W; x += 3) p(x, G - 1, 1, 1, '#6F9D5B');
    for (let y = G + 2; y < H; y += 2) for (let x = Math.floor(r() * 5); x < W; x += 5 + Math.floor(r() * 6)) p(x, y, 1, 1, '#6AA552');
    const flowers = ['#F2EAD8', '#F4C95D', '#E86A5F'];
    for (let i = 0; i < Math.round((W * (H - G)) / 60); i++) {
      const x = 1 + Math.floor(r() * (W - 2)), y = G + 2 + Math.floor(r() * Math.max(1, H - G - 3));
      p(x, y, 1, 1, flowers[i % 3]);
    }
    // kemik
    const kx = Math.round(W * 0.47), ky = Math.min(H - 3, G + 2 + Math.round((H - G) * 0.3));
    p(kx, ky, 5, 1, '#FBF6EC');
    p(kx - 1, ky - 1, 2, 1, '#FBF6EC');
    p(kx - 1, ky + 1, 2, 1, '#FBF6EC');
    p(kx + 4, ky - 1, 2, 1, '#FBF6EC');
    p(kx + 4, ky + 1, 2, 1, '#FBF6EC');
  },
};

function sceneBg(key: MascotKey, size: SceneSize): Canvas {
  const [W, H, G] = SCENE_SIZES[size];
  const c = new Canvas(W * SCENE_K, H * SCENE_K);
  SCENES[key]((x, y, w, h, col) => c.rect(Math.round(x * SCENE_K), Math.round(y * SCENE_K), Math.round(w * SCENE_K), Math.round(h * SCENE_K), col), W, H, G);
  return c;
}

function drawR(c: Canvas, rects: R[], ox: number, oy: number, k: number, flip = false) {
  for (const [x, y, w, h, col] of rects) {
    const xx = flip ? CW - x - w : x;
    c.rect(Math.round((ox + xx) * k), Math.round((oy + y) * k), w * k, h * k, col);
  }
}

/** Maskot + eşyaları, saydam zeminde, kare tuvalinde (SPRITE_W × SPRITE_H birim). pad: denetim için çevresine boşluk. */
function spriteFull(key: MascotKey, L: Live, k: number, outfit = 'plain', pad = 0): Canvas {
  const c = new Canvas((SPRITE_W + 2 * pad) * k, (SPRITE_H + 2 * pad) * k);
  const s = compose(key, 'calm', outfit, L);
  const x = pad + (L.dx ?? 0), y = pad + (L.dy ?? 0);
  drawR(c, s.extras, x, y, k);
  drawR(c, s.figure, x, y, k, L.flip);
  drawR(c, s.over, pad, pad, k);
  return c;
}
/** Dolu piksellerin kutusu (birim; k px/birim). */
function alphaBox(c: Canvas, k: number): Box {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (let y = 0; y < c.h; y++)
    for (let x = 0; x < c.w; x++)
      if (c.px[(y * c.w + x) * 4 + 3]) {
        x0 = Math.min(x0, x);
        y0 = Math.min(y0, y);
        x1 = Math.max(x1, x + 1);
        y1 = Math.max(y1, y + 1);
      }
  return { x0: Math.floor(x0 / k), y0: Math.floor(y0 / k), x1: Math.ceil(x1 / k), y1: Math.ceil(y1 / k) };
}
function union(a: Box, b: Box): Box {
  return { x0: Math.min(a.x0, b.x0), y0: Math.min(a.y0, b.y0), x1: Math.max(a.x1, b.x1), y1: Math.max(a.y1, b.y1) };
}
function crop(c: Canvas, b: Box, k: number): Canvas {
  const out = new Canvas((b.x1 - b.x0) * k, (b.y1 - b.y0) * k);
  for (let y = 0; y < out.h; y++) {
    const sy = y + b.y0 * k;
    if (sy < 0 || sy >= c.h) continue;
    for (let x = 0; x < out.w; x++) {
      const sx = x + b.x0 * k;
      if (sx < 0 || sx >= c.w) continue;
      const si = (sy * c.w + sx) * 4, di = (y * out.w + x) * 4;
      for (let q = 0; q < 4; q++) out.px[di + q] = c.px[si + q];
    }
  }
  return out;
}

/** Tuval birimi kısayolları (maskot tuvali 32×30; kare tuvali SPRITE_W × SPRITE_H aynı koordinatlarda). */
const box = (x: number, y: number, w: number, h: number, c: string): R => [x, y, w, h, c];
const yarn = (x: number, y: number): R[] => [box(x, y + 1, 3, 1, '#D9566B'), box(x + 1, y, 1, 3, '#D9566B'), box(x, y, 1, 1, '#B23A50'), box(x + 2, y + 2, 1, 1, '#B23A50'), box(x + 1, y + 1, 1, 1, '#F08A9A'), box(x - 2, y + 2, 2, 1, '#D9566B')];
const acorn = (x: number, y: number): R[] => [box(x + 1, y - 1, 1, 1, '#5A3B26'), box(x, y, 3, 1, '#7A4A22'), box(x, y + 1, 3, 2, '#C98B4A'), box(x + 1, y + 3, 1, 1, '#A8703A')];
const ball = (x: number, y: number): R[] => [box(x, y, 3, 3, '#D2423A'), box(x, y + 1, 3, 1, '#FFFFFF'), box(x, y, 1, 1, '#E86A5F')];
const crumbs = (x: number, y: number): R[] => [box(x, y, 1, 1, '#C98B4A'), box(x + 2, y + 2, 1, 1, '#A8703A')];
const sniff = (x: number, y: number, n: number): R[] => Array.from({ length: n }, (_, i) => box(x - i * 2, y + (i % 2 ? -1 : 1), 1, 1, '#8A857C'));

/** Maskota özgü döngü: her öğe bir kare. */
const ANIMS: Record<MascotKey, Live[]> = {
  // Kedi yün yumağını kovalar
  fistik: [
    { look: [1, 0], over: yarn(29, 24) },
    { dx: 1, look: [1, 0], paws: 'face', over: yarn(31, 24) },
    { dx: 1, look: [1, -1], eyes: 'wide', over: yarn(32, 21) },
    { dx: 2, look: [1, 0], squash: true, paws: 'wave', over: yarn(33, 24) },
    { dx: 1, look: [1, 0], over: yarn(31, 24) },
    { dx: 0, look: [1, 0], squash: true, paws: 'face', over: yarn(29, 24) },
  ],
  // Baykuş başını çevirir, göz kırpar
  bilge: [
    { look: [0, 0] },
    { look: [1, 0] },
    { look: [1, 0], dx: 1 },
    { eyes: 'half' },
    { eyes: 'closed', squash: true },
    { look: [-1, 0], dx: -1 },
  ],
  // Sincap palamut kemirir
  ceviz: [
    { props: acorn(12, 18) },
    { dy: 0, squash: true, props: acorn(12, 17), eyes: 'happy' },
    { props: acorn(12, 16), eyes: 'happy', over: crumbs(11, 22) },
    { squash: true, props: acorn(12, 17), eyes: 'closed', over: crumbs(12, 24) },
    { props: acorn(12, 16), eyes: 'happy', over: crumbs(10, 23) },
    { look: [1, 0], props: acorn(12, 18) },
  ],
  // Kirpi yerleri koklar
  diken: [
    { look: [-1, 0] },
    { dx: -1, look: [-1, 1], over: sniff(10, 21, 2) },
    { dx: -1, squash: true, look: [-1, 1], over: sniff(10, 21, 3) },
    { look: [0, 0] },
    { dx: 1, look: [1, 1], over: sniff(26, 21, 2).map((r) => box(52 - r[0], r[1], 1, 1, r[4])) },
    { dx: 1, squash: true, look: [1, 0] },
  ],
  // Köpek kuyruk sallar, top zıplatır
  karamel: [
    { look: [1, 0], eyes: 'happy', over: ball(29, 24) },
    { look: [1, -1], squash: true, over: ball(29, 20), props: [box(25, 15, 2, 2, '#E2A75A'), box(25, 14, 2, 1, INK), box(27, 15, 1, 2, INK)] },
    { look: [1, -1], over: ball(29, 17) },
    { look: [1, -1], squash: true, over: ball(29, 20), props: [box(25, 15, 2, 2, '#E2A75A'), box(25, 14, 2, 1, INK), box(27, 15, 1, 2, INK)] },
    { look: [1, 0], eyes: 'happy', over: ball(29, 24) },
    { dx: 1, eyes: 'happy', squash: true, paws: 'wave', over: ball(30, 24) },
  ],
};

/** "Yazmaya gidiyorum": ajanda kolunun altında, yana bakıp yola koyulmuş. */
const WRITE: Live = { look: [1, 0], dx: 2, over: [box(30, 6, 1, 1, '#8A857C'), box(32, 5, 1, 1, '#8A857C'), box(34, 4, 1, 1, '#8A857C')] };
/** "Not aldım! ✓": mutlu gözler, kalkık patiler, yeşil onay işareti. */
const CHECK: R[] = [box(25, 5, 1, 1, '#3F8F6B'), box(26, 6, 1, 1, '#3F8F6B'), box(27, 7, 1, 1, '#3F8F6B'), box(28, 6, 1, 1, '#3F8F6B'), box(29, 5, 1, 1, '#3F8F6B'), box(30, 4, 1, 1, '#3F8F6B'), box(31, 3, 1, 1, '#3F8F6B'), box(26, 5, 1, 1, '#5DB58A'), box(28, 5, 1, 1, '#5DB58A'), box(30, 3, 1, 1, '#5DB58A')];
const NOTED: Live = { eyes: 'happy', paws: 'up', blush: true, over: [...CHECK, box(2, 6, 1, 1, '#E5B94A'), box(4, 2, 1, 1, '#E5B94A')] };

/** Dizinli (palet) PNG: ≤ 256 renkte RGBA'dan çok daha küçük. Satırlar "Up" süzgeciyle (tekrarlanan satırlar sıfırlanır). */
function encodePngIndexed(w: number, h: number, rgba: Uint8ClampedArray): Buffer | null {
  const index = new Map<number, number>();
  const colors: number[] = [];
  const idx = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const a = rgba[i * 4 + 3];
    // Tam saydam piksellerin rengi önemsiz: hepsi tek girdi.
    const key = a === 0 ? 0 : ((rgba[i * 4] << 24) | (rgba[i * 4 + 1] << 16) | (rgba[i * 4 + 2] << 8) | a) >>> 0;
    let n = index.get(key);
    if (n === undefined) {
      if (colors.length >= 256) return null;
      n = colors.length;
      index.set(key, n);
      colors.push(key);
    }
    idx[i] = n;
  }
  // Saydam girdiler başa: tRNS yalnız onları taşır.
  const order = colors.map((_, i) => i).sort((a, b) => ((colors[a] & 255) === 255 ? 1 : 0) - ((colors[b] & 255) === 255 ? 1 : 0) || a - b);
  const remap = new Uint8Array(colors.length);
  order.forEach((old, i) => (remap[old] = i));
  const plte = Buffer.alloc(colors.length * 3);
  const alphas: number[] = [];
  order.forEach((old, i) => {
    const c = colors[old];
    plte[i * 3] = c >>> 24;
    plte[i * 3 + 1] = (c >>> 16) & 255;
    plte[i * 3 + 2] = (c >>> 8) & 255;
    if ((c & 255) !== 255) alphas.push(c & 255);
  });
  const raw = Buffer.alloc((w + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w + 1)] = 2; // Up
    for (let x = 0; x < w; x++) {
      const cur = remap[idx[y * w + x]];
      const up = y ? remap[idx[(y - 1) * w + x]] : 0;
      raw[y * (w + 1) + 1 + x] = (cur - up) & 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 3; // palet
  const parts = [Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('PLTE', plte)];
  if (alphas.length) parts.push(chunk('tRNS', Buffer.from(alphas)));
  parts.push(chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0)));
  return Buffer.concat(parts);
}
/** Araç görselleri: palete sığarsa dizinli, sığmazsa RGBA. */
function pngSmall(c: Canvas): Buffer {
  return encodePngIndexed(c.w, c.h, c.px) ?? c.png();
}

/** Yuvarlak köşe maskesi (kenarı yumuşatılmış). */
function roundMask(c: Canvas, r: number) {
  const N = 4;
  for (let y = 0; y < c.h; y++)
    for (let x = 0; x < c.w; x++) {
      if ((x >= r && x < c.w - r) || (y >= r && y < c.h - r)) continue;
      let n = 0;
      for (let sy = 0; sy < N; sy++)
        for (let sx = 0; sx < N; sx++) {
          const px = x + (sx + 0.5) / N, py = y + (sy + 0.5) / N;
          const qx = Math.max(r - px, 0, px - (c.w - r));
          const qy = Math.max(r - py, 0, py - (c.h - r));
          if (qx * qx + qy * qy <= r * r) n++;
        }
      const i = (y * c.w + x) * 4 + 3;
      c.px[i] = Math.round((c.px[i] * n) / (N * N));
    }
}

/** Bir maskotun tüm kareleri ve büstleri. Kareler aynı kutuyla kırpılır (ViewFlipper'da kayma olmaz). */
function widgetSprites(k: MascotKey) {
  const frames = ANIMS[k];
  if (frames.length !== ANIM_FRAMES) throw new Error(`${k}: ${ANIM_FRAMES} kare olmalı`);
  const items: [string, Live, string][] = [...frames.map((L, i): [string, Live, string] => [String(i), L, 'plain']), ['write', WRITE, 'planner'], ['noted', NOTED, 'plain']];
  let b: Box | null = null;
  for (const [, L, o] of items) {
    const PAD = 6;
    const raw = alphaBox(spriteFull(k, L, 1, o, PAD), 1);
    const bb: Box = { x0: raw.x0 - PAD, y0: raw.y0 - PAD, x1: raw.x1 - PAD, y1: raw.y1 - PAD };
    b = b ? union(b, bb) : bb;
  }
  if (!b || b.x0 < 0 || b.y0 < 0 || b.x1 > SPRITE_W || b.y1 > SPRITE_H) throw new Error(`${k}: kare tuvale sığmıyor ${JSON.stringify(b)}`);
  const fb: Box = { x0: Math.max(0, b.x0 - 1), y0: Math.max(0, b.y0 - 1), x1: Math.min(SPRITE_W, b.x1 + 1), y1: SPRITE_H };
  for (const [name, L, o] of items) write(join(RES, `drawable-nodpi/widget_anim_${k}_${name}.png`), pngSmall(crop(spriteFull(k, L, SPRITE_K, o), fb, SPRITE_K)));

  // Büst (küçük araç): boynun biraz altında kesilir, aracın alt kenarından bakar.
  const bottom = OY + CHARACTERS[k].anchors.neck.y + 3;
  const busts: [string, Live, string][] = [['', frames[0], 'plain'], ['_write', WRITE, 'planner'], ['_noted', NOTED, 'plain']];
  const top: Box = { x0: 0, y0: 0, x1: SPRITE_W, y1: bottom };
  let bb: Box | null = null;
  for (const [, L, o] of busts) {
    // Kutu yalnız figürden: yandaki parçacıklar (onay, iz) büstü genişletmesin, taşan kısmı kırpılır.
    const x = alphaBox(crop(spriteFull(k, { ...L, over: [] }, 1, o), top, 1), 1);
    bb = bb ? union(bb, x) : x;
  }
  const cb: Box = { x0: Math.max(0, bb!.x0 - 1), y0: Math.max(0, bb!.y0 - 1), x1: Math.min(SPRITE_W, bb!.x1 + 1), y1: bottom };
  for (const [suffix, L, o] of busts) write(join(RES, `drawable-nodpi/widget_bust_${k}${suffix}.png`), pngSmall(crop(spriteFull(k, L, SPRITE_K, o), cb, SPRITE_K)));
}

const GEN_NOTE = '<!-- scripts/gen-android-icons.ts tarafından üretildi; elle düzenleme. -->';
function shapeXml(body: string, oval = false): string {
  return `<?xml version="1.0" encoding="utf-8"?>\n${GEN_NOTE}\n<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="${oval ? 'oval' : 'rectangle'}">\n${body}</shape>\n`;
}

/** Maskot renginde düğmeler: renk kaynakları + şekil çizilebilirleri. Kontrast ≥ 4.5 değilse üretim durur. */
function widgetButtons() {
  const light: string[] = [], dark: string[] = [];
  for (const k of MASCOT_KEYS) {
    const { btn, ink } = WIDGET_BTN[k];
    const softL = mix(SOFT_BASE.light, btn, SOFT_MIX.light), softD = mix(SOFT_BASE.dark, btn, SOFT_MIX.dark);
    const checks: [string, string, string][] = [[btn, ink, 'düğme'], [softL, WIDGET_INK.light, 'açık ikincil'], [softD, WIDGET_INK.dark, 'koyu ikincil']];
    for (const [a, c, n] of checks) if (contrast(a, c) < 4.5) throw new Error(`${k}: ${n} kontrastı düşük (${contrast(a, c).toFixed(2)})`);
    light.push(`    <color name="widget_btn_${k}">${btn}</color>`, `    <color name="widget_btn_ink_${k}">${ink}</color>`, `    <color name="widget_soft_${k}">#${SOFT_ALPHA}${softL.slice(1)}</color>`);
    dark.push(`    <color name="widget_soft_${k}">#${SOFT_ALPHA}${softD.slice(1)}</color>`);
    const edge = '    <stroke android:width="1dp" android:color="#38FFFFFF" />\n';
    write(join(RES, `drawable/widget_btn_${k}.xml`), shapeXml(`    <solid android:color="@color/widget_btn_${k}" />\n${edge}    <corners android:radius="100dp" />\n`));
    write(join(RES, `drawable/widget_fab_${k}.xml`), shapeXml(`    <solid android:color="@color/widget_btn_${k}" />\n${edge}`, true));
    write(join(RES, `drawable/widget_btn_soft_${k}.xml`), shapeXml(`    <solid android:color="@color/widget_soft_${k}" />\n    <stroke android:width="1.5dp" android:color="@color/widget_btn_${k}" />\n    <corners android:radius="100dp" />\n`));
    write(join(RES, `drawable/widget_chip_${k}.xml`), shapeXml(`    <solid android:color="@color/widget_soft_${k}" />\n    <stroke android:width="1dp" android:color="@color/widget_btn_${k}" />\n    <corners android:radius="100dp" />\n`));
  }
  const res = (comment: string, lines: string[]) => `<?xml version="1.0" encoding="utf-8"?>\n<!-- scripts/gen-android-icons.ts tarafından üretildi: ${comment} -->\n<resources>\n${lines.join('\n')}\n</resources>\n`;
  write(join(RES, 'values/widget_mascot_colors.xml'), res('araç düğmeleri maskotun renginde (WIDGET_BTN); ikincil düğme/çip saydam tonu.', light));
  write(join(RES, 'values-night/widget_mascot_colors.xml'), res('koyu temada ikincil düğme/çip tonu.', dark));
}

/** Araç önizlemesi (Android 11 ve öncesi araç seçicisi; 12+ previewLayout'u gösterir): orta düzen, Fıstık. */
function widgetPreview(): Buffer {
  const K = 8, k = 3; // sahne birimi 8 px; ≈ 3 px / dp
  const [W, H, G] = SCENE_SIZES.wide;
  const c = new Canvas(W * K, H * K);
  SCENES[DEFAULT_KEY]((x, y, w, h, col) => c.rect(Math.round(x * K), Math.round(y * K), Math.round(w * K), Math.round(h * K), col), W, H, G);
  const sk = 11;
  const sprite = spriteFull(DEFAULT_KEY, ANIMS[DEFAULT_KEY][0], sk);
  const sb = alphaBox(sprite, sk);
  const sx = 14 * k, sy = c.h - 8 * k - (SPRITE_H - sb.y0) * sk;
  for (let y = sb.y0 * sk; y < SPRITE_H * sk; y++)
    for (let x = sb.x0 * sk; x < sb.x1 * sk; x++) {
      const i = (y * sprite.w + x) * 4;
      if (sprite.px[i + 3]) c.rect(sx + x - sb.x0 * sk, sy + y - sb.y0 * sk, 1, 1, '#' + [0, 1, 2].map((q) => sprite.px[i + q].toString(16).padStart(2, '0')).join(''));
    }
  const px = Math.round(c.w * 0.5), pw = c.w - px - 10 * k;
  c.roundRect(px, 10 * k, pw, 70 * k, 16 * k, '#FBF6EE');
  c.roundRect(px + 12 * k, 22 * k, 70 * k, 9 * k, 4 * k, '#B9B0A2');
  c.roundRect(px + 12 * k, 36 * k, Math.min(pw - 24 * k, 120 * k), 20 * k, 7 * k, '#23201B');
  c.roundRect(px + 12 * k, 61 * k, 90 * k, 9 * k, 4 * k, '#B9B0A2');
  const by = c.h - 10 * k - 36 * k, bw = (pw - 8 * k) / 2;
  c.roundRect(px, by, bw, 36 * k, 18 * k, WIDGET_BTN[DEFAULT_KEY].btn);
  c.roundRect(px + bw + 8 * k, by, bw, 36 * k, 18 * k, WIDGET_BTN[DEFAULT_KEY].btn);
  c.roundRect(px + bw + 8 * k + 2 * k, by + 2 * k, bw - 4 * k, 32 * k, 16 * k, mix(SOFT_BASE.light, WIDGET_BTN[DEFAULT_KEY].btn, SOFT_MIX.light));
  roundMask(c, 22 * k);
  return c.png();
}

function widgetAssets() {
  for (const k of MASCOT_KEYS) {
    for (const size of Object.keys(SCENE_SIZES) as SceneSize[]) write(join(RES, `drawable-nodpi/widget_scene_${k}_${size}.png`), pngSmall(sceneBg(k, size)));
    widgetSprites(k);
  }
  widgetButtons();
  write(join(RES, 'drawable-nodpi/widget_preview.png'), widgetPreview());
}

function main() {
  if (!existsSync(RES)) throw new Error(`Android projesi bulunamadı: ${RES}`);

  // Maskot başına başlatıcı simgeleri + zemin renkleri
  const colors = MASCOT_KEYS.map((k) => `    <color name="ic_launcher_bg_${k}">${CHARACTERS[k].palette.iconBg}</color>`).join('\n');
  write(join(RES, 'values/ic_launcher_mascots.xml'), `<?xml version="1.0" encoding="utf-8"?>\n<!-- scripts/gen-android-icons.ts tarafından üretildi: maskot simgelerinin zemini (palette.iconBg). -->\n<resources>\n${colors}\n</resources>\n`);
  for (const k of MASCOT_KEYS) launcherSet(`ic_launcher_${k}`, k, CHARACTERS[k].palette.iconBg, `ic_launcher_bg_${k}`);

  // Varsayılan simge (uygulama bilgisi, eski başlatıcılar): Fıstık, kâğıt zemin (@color/ic_launcher_background)
  launcherSet('ic_launcher', DEFAULT_KEY, PAPER, 'ic_launcher_background');

  // Açılış ekranı
  // Yatay boyutlar (Capacitor şablonundakiyle aynı); dikey olanlar bunların tersi.
  const LAND: Record<string, [number, number]> = { mdpi: [480, 320], hdpi: [800, 480], xhdpi: [1280, 720], xxhdpi: [1600, 960], xxxhdpi: [1920, 1280] };
  const splashSizes: [string, number, number][] = [['drawable', 480, 320]];
  for (const [dn] of DENSITIES) {
    const [lw, lh] = LAND[dn];
    splashSizes.push([`drawable-land-${dn}`, lw, lh], [`drawable-port-${dn}`, lh, lw]);
  }
  for (const [dir, w, h] of splashSizes) write(join(RES, `${dir}/splash.png`), splash(w, h));

  // Ana ekran aracı
  for (const k of MASCOT_KEYS) write(join(RES, `drawable-nodpi/widget_mascot_${k}.png`), widgetMascot(k));
  widgetAssets();
  // Eski düzenin artık kullanılmayan görselleri
  for (const f of readdirSync(join(RES, 'drawable-nodpi'))) if (f.startsWith('widget_clawd') || f.startsWith('widget_pose_')) rmSync(join(RES, 'drawable-nodpi', f));

  // Web / PWA
  write(join(PUBLIC, 'icon-180.png'), webIcon(180));
  write(join(PUBLIC, 'icon-192.png'), webIcon(192));
  write(join(PUBLIC, 'icon-512.png'), webIcon(512));
  write(join(PUBLIC, 'icon.svg'), webSvg());

  console.log(`${written} dosya yazıldı.`);
}

main();
