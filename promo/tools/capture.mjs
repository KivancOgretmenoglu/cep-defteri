/* Uygulamanın güncel ekranlarını örnek veriyle çeker → promo/assets/ui2/
 * Önce uygulamayı çalıştır: npx vite --port 5173   Sonra: node promo/tools/capture.mjs
 */
import { chromium } from 'playwright-core';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'ui2') + '/';
fs.mkdirSync(OUT, { recursive: true });
const URL = 'http://127.0.0.1:5173/';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });

async function page({ dpr = 3, when = null, mascot = 'fistik', exam = false } = {}) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: dpr, locale: 'tr-TR', timezoneId: 'Europe/Istanbul', reducedMotion: 'reduce' });
  if (when) await ctx.clock.install({ time: new Date(when) });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => console.log('ERR', e.message));
  await p.goto(URL);
  await p.evaluate(async ({ mascot, exam }) => {
    const { buildDemo } = await import('/src/domain/demo.ts');
    const d = new Date();
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const demo = buildDemo(iso, 'tr');
    const plus = (n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); };
    demo.settings = { ...demo.settings, lang: 'tr', mascot: { ...demo.settings.mascot, who: mascot }, cameos: false, quips: false, hintsSeen: Array.from({ length: 60 }, (_, i) => 'h' + i), reportCardSeen: iso.slice(0, 7), examUntil: exam ? plus(6) : null };
    const { serializeBackup } = await import('/src/domain/backup.ts');
    localStorage.setItem('cep-defteri:v1:demo', serializeBackup(demo));
    localStorage.setItem('cep-defteri:v1:mode', 'demo');
  }, { mascot, exam });
  await p.reload();
  await p.waitForTimeout(1800);
  await p.addStyleTag({ content: '.banner--demo,.hint-region,.tour,.guide{display:none!important}' });
  return p;
}
const go = async (p, slug) => { await p.evaluate((s) => { location.hash = '#' + s; }, slug); await p.waitForTimeout(1200); };
async function full(p, slug, name) {
  await go(p, slug);
  await p.screenshot({ path: `${OUT}nav-${name}.png`, clip: { x: 0, y: 844 - 84, width: 390, height: 84 } });
  await p.evaluate(() => { const t = document.querySelector('.tabbar'); if (t) t.style.display = 'none'; document.body.style.paddingBottom = '0'; const a = document.querySelector('.app'); if (a) a.style.paddingBottom = '0'; });
  await p.screenshot({ path: `${OUT}full-${name}.png`, fullPage: true });
  await p.evaluate(() => { const t = document.querySelector('.tabbar'); if (t) t.style.display = ''; });
}

const only = process.argv[2];
const want = (k) => !only || only.split(',').includes(k);

if (want('home')) { const p = await page(); await p.screenshot({ path: OUT + 'home.png' }); }
if (want('full')) { const p = await page({ dpr: 2.5 }); for (const [s, n] of [['ozet', 'ozet'], ['butce', 'butce'], ['borclar', 'borclar'], ['islemler', 'islemler']]) await full(p, s, n); }
if (want('home30')) { const p = await page({ when: '2026-10-30T15:00:00+03:00' }); await p.screenshot({ path: OUT + 'home-30.png' }); }
if (want('settings')) {
  const p = await page({ dpr: 2.5 });
  await full(p, 'ayarlar', 'ayarlar');
}
await b.close();
console.log('bitti →', OUT);
