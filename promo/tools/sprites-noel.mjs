/* Pamuk'un yılbaşı pozları (pamuk@noel): uygulamanın kendi çizicisi (src/mascot/render.ts) + Noel Baba şapkası.
 * Uygulamadaki "newyear" kıyafetinde şapka Pamuk'un uzun kulaklarının arasında küçük kırmızı bir kutu gibi kalıyor;
 * burada şapka sol kulağın üstüne sarkar, ucunda ponpon olur. Atkı uygulamanınki (scarfRed).
 *   node promo/tools/sprites-noel.mjs   → promo/assets/sprites.json'a 'pamuk@noel|<duygu>|<pati>|<göz>' (175 poz) yazılır
 */
import { rolldown } from 'rolldown';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const bundle = await rolldown({ input: path.join(ROOT, 'src/mascot/render.ts'), logLevel: 'warn' });
const { output } = await bundle.generate({ format: 'esm' });
const tmp = path.join(os.tmpdir(), `render-${process.pid}.mjs`);
fs.writeFileSync(tmp, output[0].code);
const { compose, OUTFITS } = await import(pathToFileURL(tmp).href);
fs.unlinkSync(tmp);
OUTFITS.noelScarf = { name: { tr: 'Noel atkı', en: 'Noel scarf' }, neck: 'scarfRed' };

// şapka (tuval koordinatı, 32 sütun): R kırmızı, r koyu kırmızı, W krem kürk, w kürk gölgesi, o kontur
const HAT = {
  2: '......ooo.......................',
  3: '.....oRRRoo.....................',
  4: '...oooRRRRRoo...................',
  5: '..oWWooorRRRRo..................',
  6: '.oWWWWo.orRRRRo.................',
  7: '.oWWwWo..orRRRRo................',
  8: '..owwo....orRRRRo...............',
  9: '...oo.....orRRRRRo..............',
  10: '.........oWWwWWWwWo.............',
  11: '.........oWwWWwWWWo.............',
  12: '..........oooooooo..............',
};
const COL = { o: '#2A1E1A', R: '#D2423A', r: '#A8322C', W: '#FBF6EC', w: '#E3D9C6' };
const hat = Object.entries(HAT).flatMap(([y, row]) => [...row].map((c, x) => (c === '.' ? null : [x, +y, 1, 1, COL[c]])).filter(Boolean));

// katmanları ızgaraya basar, satır koşularına çevirir (sprites.json biçimi)
const runs = (rects) => {
  const g = new Map();
  for (const [x, y, w, h, f] of rects) for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) g.set(`${i},${j}`, f);
  const ys = [...new Set([...g.keys()].map((k) => +k.split(',')[1]))].sort((a, b) => a - b);
  const out = [];
  for (const y of ys) {
    const xs = [...g.keys()].filter((k) => +k.split(',')[1] === y).map((k) => +k.split(',')[0]).sort((a, b) => a - b);
    for (let k = 0; k < xs.length;) {
      const x0 = xs[k], c = g.get(`${x0},${y}`);
      let w = 1;
      while (k + w < xs.length && xs[k + w] === x0 + w && g.get(`${x0 + w},${y}`) === c) w++;
      out.push([x0, y, w, 1, c]);
      k += w;
    }
  }
  return out;
};

const file = path.join(ROOT, 'promo/assets/sprites.json');
const SP = JSON.parse(fs.readFileSync(file, 'utf8'));
let n = 0;
for (const mood of ['calm', 'celebrate', 'curious', 'happy', 'thoughtful'])
  for (const paws of [null, 'up', 'wave', 'wave2', 'face'])
    for (const eyes of ['mood', 'closed', 'wide', 'squeeze', 'half', 'x', 'happy']) {
      const sc = compose('pamuk', mood, 'noelScarf', { paws, eyes });
      SP[`pamuk@noel|${mood}|${paws}|${eyes}`] = runs([...sc.figure, ...sc.extras, ...hat]);
      n++;
    }
fs.writeFileSync(file, JSON.stringify(SP));
console.log(`pamuk@noel: ${n} poz yazıldı → ${path.relative(ROOT, file)}`);
