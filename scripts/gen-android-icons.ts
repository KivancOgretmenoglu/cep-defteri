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
 *   drawable-nodpi/widget_mascot_<anahtar>.png, widget_preview.png             ana ekran aracı
 *   drawable-nodpi/widget_anim_<anahtar>_*.png, widget_pose_<anahtar>_*.png    büyük araç sahnesi/kareleri, pozlar
 * ve public/icon-180.png, icon-192.png, icon-512.png, icon.svg (web/PWA simgesi: Fıstık).
 *
 * Maskot pikselleri keskin kalır (yumuşatma yok); yalnız zemin şekillerinin (daire, yuvarlak köşe) kenarı yumuşatılır.
 */
import { deflateSync } from 'node:zlib';
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CHARACTERS, INK, MASCOT_KEYS, bodyGrid, type Grid, type MascotKey } from '../src/mascot/characters';
import { CW, compose, type MascotLive, type R } from '../src/mascot/render';

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

/** Araç önizlemesi (Android 11 ve öncesi; 12+ canlı düzeni gösterir): kart, maskot, metin yerine çubuklar, "+" düğmesi. */
function widgetPreview(): Buffer {
  const W = 870, H = 276, k = 3; // ≈ 3 px / dp
  const c = new Canvas(W, H);
  c.roundRect(1, 1, W - 2, H - 2, 22 * k, '#E2D9C8');
  c.roundRect(1 + k, 1 + k, W - 2 - 2 * k, H - 2 - 2 * k, 21 * k, PAPER);
  const g = iconGrid(DEFAULT_KEY);
  c.grid(g, 14 * k + 22 * k, H / 2, fitCell(g, 999, 44 * k));
  const tx = 14 * k + 44 * k + 10 * k;
  c.roundRect(tx, 76, 220, 22, 11, '#B9B0A2'); // "Kullanılabilir"
  c.roundRect(tx, 112, 330, 46, 14, '#23201B'); // tutar
  c.roundRect(tx, 172, 280, 22, 11, '#B9B0A2'); // dönem
  const bw = 150, bh = 40 * k, bx = W - 14 * k - bw, by = (H - bh) / 2;
  c.roundRect(bx, by, bw, bh, 20 * k, '#C4542F');
  const pcx = bx + bw / 2, pcy = by + bh / 2, arm = 22, th = 9;
  c.rect(Math.round(pcx - arm), Math.round(pcy - th / 2), arm * 2, th, '#FFFFFF');
  c.rect(Math.round(pcx - th / 2), Math.round(pcy - arm), th, arm * 2, '#FFFFFF');
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

// ── Büyük araç: sahne + canlandırma kareleri ───────────
/*
 * Büyük araçta (4×3 ve üstü) maskot kendi sahnesinde durur ve ViewFlipper ile birkaç karelik bir döngü oynar.
 * Her kare sahneyle birlikte tek PNG'dir (hizalama kayması olmaz):
 *   drawable-nodpi/widget_anim_<anahtar>_<0..5>.png   döngü kareleri (0 = canlandırma kapalıyken sabit kare)
 *   drawable-nodpi/widget_anim_<anahtar>_write.png    "yazmaya gidiyorum" (Gider/Gelir'e dokununca)
 *   drawable-nodpi/widget_anim_<anahtar>_noted.png    "Not aldım! ✓" (kayıt eklenince)
 *   drawable-nodpi/widget_pose_<anahtar>_write.png    aynı iki poz, saydam zeminde (küçük/orta araç)
 *   drawable-nodpi/widget_pose_<anahtar>_noted.png
 * Karelerin sayısı CepWidgetProvider.java'daki dizilerle aynı olmalı (ANIM_FRAMES).
 */
const ANIM_FRAMES = 6;
const U = 6; // birim başına piksel
const SW = 40, SH = 36; // sahne (birim)
const GROUND = 30; // sahnede zemin çizgisi (birim); maskotun ayakları bunun hemen üstünde
type Live = MascotLive & { dx?: number; dy?: number };

/** Birim koordinatlı boyama yardımcısı. */
function painter(c: Canvas) {
  return (x: number, y: number, w: number, h: number, col: string) => c.rect(x * U, y * U, w * U, h * U, col);
}

/** Yuvarlak köşe maskesi (kenarı yumuşatılmış). */
function roundMask(c: Canvas, r: number) {
  const N = 4;
  for (let y = 0; y < c.h; y++)
    for (let x = 0; x < c.w; x++) {
      const cx = Math.min(Math.max(x, r), c.w - r), cy = Math.min(Math.max(y, r), c.h - r);
      if (cx === x || cy === y) {
        if (x >= r && x < c.w - r) continue;
        if (y >= r && y < c.h - r) continue;
      }
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

const SCENES: Record<MascotKey, (p: ReturnType<typeof painter>, t: number) => void> = {
  // Kedi: sıcak oda, duvarda çerçeve, ahşap zemin, desenli kilim
  fistik(p) {
    p(0, 0, SW, GROUND, '#F6E5CF');
    for (let x = 0; x < SW; x += 4) p(x, 0, 2, GROUND, '#F2DDC2');
    p(4, 5, 9, 7, '#A0785A');
    p(5, 6, 7, 5, '#CFE3EE');
    p(5, 9, 7, 2, '#8DBF7A');
    p(8, 7, 2, 2, '#F4C95D');
    p(29, 6, 6, 1, '#A0785A');
    p(30, 3, 2, 3, '#6E9E5B');
    p(32, 4, 2, 2, '#8DBF7A');
    p(0, GROUND, SW, SH - GROUND, '#C99A6B');
    for (let y = GROUND + 1; y < SH; y += 2) p(0, y, SW, 1, '#B98A5D');
    p(5, GROUND + 1, 30, 4, '#C2453E');
    p(6, GROUND + 2, 28, 2, '#E5B94A');
    for (let x = 7; x < 34; x += 3) p(x, GROUND + 2, 1, 2, '#C2453E');
    for (let x = 5; x < 35; x += 2) p(x, GROUND + 5, 1, 1, '#E5B94A');
  },
  // Baykuş: gece penceresi (ay, yıldızlar), kitap rafı
  bilge(p, t) {
    p(0, 0, SW, SH, '#2E3560');
    p(3, 3, 14, 13, '#1E2347');
    p(4, 4, 12, 11, '#3B4A8A');
    p(9, 4, 1, 11, '#1E2347');
    p(4, 9, 12, 1, '#1E2347');
    p(11, 5, 3, 3, '#F4E9B8');
    p(12, 5, 2, 1, '#3B4A8A');
    const stars: [number, number][] = [[5, 6], [7, 11], [14, 12], [6, 13], [12, 11]];
    stars.forEach(([x, y], i) => p(x, y, 1, 1, (i + t) % 3 === 0 ? '#3B4A8A' : '#FFFFFF'));
    for (const [x, y] of [[24, 4], [33, 8], [28, 12], [36, 3]] as const) p(x, y, 1, 1, (x + t) % 2 ? '#8E9BEA' : '#5867B5');
    p(0, GROUND, SW, 1, '#7A5236');
    p(0, GROUND + 1, SW, SH - GROUND - 1, '#5A3B26');
    const spines = ['#C2453E', '#E5B94A', '#3E8A8C', '#9B7BC6', '#F2EAD8', '#6F9D7E', '#4A6FA5', '#D97757'];
    let x = 1;
    for (let i = 0; x < SW - 1; i++) {
      const w = 1 + (i % 3 === 0 ? 2 : 1);
      const h = 4 - (i % 2);
      p(x, SH - h, w, h, spines[i % spines.length]);
      x += w;
    }
  },
  // Sincap: gökyüzü, yapraklar, kalın dal ve meşe palamutları
  ceviz(p) {
    p(0, 0, SW, SH, '#CFE8F2');
    p(26, 4, 8, 2, '#FFFFFF');
    p(28, 3, 4, 1, '#FFFFFF');
    const leaf = (x: number, y: number, w: number, h: number) => {
      p(x, y, w, h, '#6F9D5B');
      p(x + 1, y + 1, Math.max(1, w - 2), Math.max(1, h - 2), '#8DBF6A');
    };
    leaf(0, 0, 8, 6);
    leaf(5, 0, 6, 3);
    leaf(33, 10, 7, 6);
    leaf(0, 14, 4, 5);
    p(0, GROUND, SW, 3, '#7E4A26');
    p(0, GROUND, SW, 1, '#A8683A');
    for (let x = 2; x < SW; x += 6) p(x, GROUND + 1, 2, 1, '#6A3D1F');
    p(30, GROUND + 3, 3, 3, '#7E4A26');
    for (const ax of [4, 34]) {
      p(ax, GROUND + 3, 3, 1, '#7A4A22');
      p(ax, GROUND + 4, 3, 2, '#C98B4A');
    }
    p(0, GROUND + 3, SW, SH - GROUND - 3, '#BFDDE9');
    for (const ax of [5, 35]) {
      p(ax, GROUND + 3, 1, 1, '#6A3D1F');
      p(ax - 1, GROUND + 4, 3, 1, '#7A4A22');
      p(ax - 1, GROUND + 5, 3, 1, '#C98B4A');
    }
  },
  // Kirpi: sakin, yapraklı toprak; küçük mantar
  diken(p) {
    p(0, 0, SW, GROUND, '#E7EDD2');
    p(3, 4, 6, 2, '#F6F8EC');
    p(27, 7, 8, 2, '#F6F8EC');
    for (const [x, h] of [[2, 6], [6, 9], [33, 7], [37, 5]] as const) {
      p(x, GROUND - h, 1, h, '#8DAA5B');
      p(x - 1, GROUND - h + 1, 1, 2, '#A8C46E');
      p(x + 1, GROUND - h + 3, 1, 2, '#A8C46E');
    }
    p(0, GROUND, SW, SH - GROUND, '#8C6A4F');
    p(0, GROUND, SW, 1, '#A07D5E');
    const leaves: [number, number, string][] = [[2, 32, '#D97757'], [9, 34, '#E5B94A'], [15, 31, '#6F9D5B'], [22, 33, '#D97757'], [28, 31, '#E5B94A'], [34, 34, '#C2553C'], [37, 32, '#6F9D5B']];
    for (const [x, y, c] of leaves) {
      p(x, y, 2, 1, c);
      p(x + 1, y - 1, 1, 1, c);
    }
    p(31, GROUND - 3, 4, 2, '#C2453E');
    p(32, GROUND - 3, 1, 1, '#FFFFFF');
    p(32, GROUND - 1, 2, 1, '#F2EAD8');
  },
  // Köpek: gökyüzü, bulut, çit ve çimen
  karamel(p) {
    p(0, 0, SW, GROUND, '#D7E9F6');
    p(5, 5, 9, 2, '#FFFFFF');
    p(7, 4, 5, 1, '#FFFFFF');
    p(31, 3, 3, 3, '#F4C95D');
    for (let x = 1; x < SW; x += 5) {
      p(x, GROUND - 8, 2, 8, '#F2EAD8');
      p(x, GROUND - 9, 1, 1, '#F2EAD8');
    }
    p(0, GROUND - 6, SW, 1, '#E3D9C6');
    p(0, GROUND - 3, SW, 1, '#E3D9C6');
    p(0, GROUND, SW, SH - GROUND, '#7DBA62');
    p(0, GROUND, SW, 1, '#6F9D5B');
    for (let x = 1; x < SW; x += 3) p(x, GROUND - 1, 1, 1, '#6F9D5B');
    for (let x = 3; x < SW; x += 7) p(x, GROUND + 3, 1, 1, '#F2EAD8');
  },
};

const ox0 = (SW - CW) / 2; // 4
const oy0 = GROUND - 27; // ayaklar (tuval y=26) zeminin hemen üstünde

function drawR(c: Canvas, rects: R[], ox: number, oy: number, flip = false) {
  for (const [x, y, w, h, col] of rects) {
    const xx = flip ? CW - x - w : x;
    c.rect(Math.round((ox + xx) * U), Math.round((oy + y) * U), w * U, h * U, col);
  }
}

function drawMascot(c: Canvas, key: MascotKey, L: Live, ox: number, oy: number, outfit = 'plain') {
  const s = compose(key, 'calm', outfit, L);
  const x = ox + (L.dx ?? 0), y = oy + (L.dy ?? 0);
  drawR(c, s.extras, x, y);
  drawR(c, s.figure, x, y, L.flip);
  drawR(c, s.over, ox, oy);
}

/** Tuval birimi kısayolları (maskot tuvali 32×30; sahnede ox0/oy0 kadar kayık). */
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

function sceneFrame(key: MascotKey, L: Live, t: number, outfit = 'plain'): Buffer {
  const c = new Canvas(SW * U, SH * U);
  SCENES[key](painter(c), t);
  drawMascot(c, key, L, ox0, oy0, outfit);
  roundMask(c, 4 * U);
  return c.png();
}

/** Saydam zeminde poz (küçük/orta araçtaki maskot görselinin yerine). widget_mascot_* ile aynı ölçek: 26×26 birim, 8 px. */
function poseOnly(key: MascotKey, L: Live, outfit = 'plain'): Buffer {
  const k = 8;
  const c = new Canvas(CW * k, CW * k);
  const s = compose(key, 'calm', outfit, L);
  const ox = (L.dx ?? 0), oy = 1 + (L.dy ?? 0);
  const put = (rects: R[], dx: number, dy: number) => {
    for (const [x, y, w, h, col] of rects) c.rect((x + dx) * k, (y + dy) * k, w * k, h * k, col);
  };
  put(s.extras, ox, oy);
  put(s.figure, ox, oy);
  put(s.over, 0, 1);
  return c.png();
}

function widgetAnimations() {
  for (const k of MASCOT_KEYS) {
    const frames = ANIMS[k];
    if (frames.length !== ANIM_FRAMES) throw new Error(`${k}: ${ANIM_FRAMES} kare olmalı`);
    frames.forEach((L, i) => write(join(RES, `drawable-nodpi/widget_anim_${k}_${i}.png`), sceneFrame(k, L, i)));
    write(join(RES, `drawable-nodpi/widget_anim_${k}_write.png`), sceneFrame(k, WRITE, 0, 'planner'));
    write(join(RES, `drawable-nodpi/widget_anim_${k}_noted.png`), sceneFrame(k, NOTED, 0));
    write(join(RES, `drawable-nodpi/widget_pose_${k}_write.png`), poseOnly(k, { ...WRITE, dx: 0 }, 'planner'));
    write(join(RES, `drawable-nodpi/widget_pose_${k}_noted.png`), poseOnly(k, NOTED));
  }
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
  write(join(RES, 'drawable-nodpi/widget_preview.png'), widgetPreview());
  widgetAnimations();
  for (const f of readdirSync(join(RES, 'drawable-nodpi'))) if (f.startsWith('widget_clawd')) rmSync(join(RES, 'drawable-nodpi', f));

  // Web / PWA
  write(join(PUBLIC, 'icon-180.png'), webIcon(180));
  write(join(PUBLIC, 'icon-192.png'), webIcon(192));
  write(join(PUBLIC, 'icon-512.png'), webIcon(512));
  write(join(PUBLIC, 'icon.svg'), webSvg());

  console.log(`${written} dosya yazıldı.`);
}

main();
