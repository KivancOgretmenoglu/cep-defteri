/* Kullanım (reels adları reels.json'da):
 *   node promo/render.mjs still <reels> 1.5 4.2 ...  → promo/out/still-<reels>-<t>.png
 *   node promo/render.mjs video <reels>              → promo/out/<reels>.mp4 (ses: out/<reels>.wav varsa)
 */
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(DIR, 'out');
fs.mkdirSync(OUT, { recursive: true });
const FPS = 30;
const [mode, reel = 'tanitim', ...args] = process.argv.slice(2);

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  const f = path.join(DIR, decodeURIComponent(req.url.split('?')[0]).replace(/^\/$/, '/reel.html'));
  if (!f.startsWith(DIR) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(0);
const port = server.address().port;

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
const page = await (await browser.newContext({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 })).newPage();
page.on('pageerror', (e) => console.log('PAGE ERROR', e.message));
page.on('console', (m) => m.type() === 'error' && console.log('console.error', m.text()));
await page.goto(`http://127.0.0.1:${port}/?r=${encodeURIComponent(reel)}`);
await page.evaluate(() => window.ready);
const DURATION = await page.evaluate(() => window.REEL_END);

if (mode === 'still') {
  for (const t of args.map(Number)) {
    await page.evaluate((x) => window.renderAt(x), t);
    await page.screenshot({ path: path.join(OUT, `still-${reel}-${t.toFixed(2)}.png`) });
  }
} else {
  const wav = path.join(OUT, `${reel}.wav`);
  const audio = fs.existsSync(wav) ? wav : null;
  const outFile = path.join(OUT, `${reel}.mp4`);
  const ff = spawn('ffmpeg', [
    '-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    ...(audio ? ['-i', audio] : []),
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', String(FPS),
    ...(audio ? ['-c:a', 'aac', '-b:a', '192k', '-shortest'] : []), '-movflags', '+faststart', outFile,
  ], { stdio: ['pipe', 'inherit', 'inherit'] });
  const n = Math.round(DURATION * FPS);
  for (let i = 0; i < n; i++) {
    await page.evaluate((x) => window.renderAt(x), i / FPS);
    const buf = await page.screenshot({ type: 'jpeg', quality: 95 });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if (i % 60 === 0) console.log(`frame ${i}/${n}`);
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  console.log('yazıldı:', outFile);
}
await browser.close();
server.close();
