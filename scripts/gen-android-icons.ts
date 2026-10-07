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
 * ve public/icon-180.png, icon-192.png, icon-512.png, icon.svg (web/PWA simgesi: Fıstık).
 *
 * Maskot pikselleri keskin kalır (yumuşatma yok); yalnız zemin şekillerinin (daire, yuvarlak köşe) kenarı yumuşatılır.
 */
import { deflateSync } from 'node:zlib';
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CHARACTERS, INK, MASCOT_KEYS, bodyGrid, type Grid, type MascotKey } from '../src/mascot/characters';

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
  for (const f of readdirSync(join(RES, 'drawable-nodpi'))) if (f.startsWith('widget_clawd')) rmSync(join(RES, 'drawable-nodpi', f));

  // Web / PWA
  write(join(PUBLIC, 'icon-180.png'), webIcon(180));
  write(join(PUBLIC, 'icon-192.png'), webIcon(192));
  write(join(PUBLIC, 'icon-512.png'), webIcon(512));
  write(join(PUBLIC, 'icon.svg'), webSvg());

  console.log(`${written} dosya yazıldı.`);
}

main();
