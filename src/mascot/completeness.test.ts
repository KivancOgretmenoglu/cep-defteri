/**
 * Yeni maskot yarım eklenmesin: her anahtar, maskot başına tutulan tüm tablolarda (uygulama, rehber, misafir sahneleri,
 * tema CSS'i, Android aracı ve simgeleri) yer almalı.
 */
// CSS dosyaları vitest'te ?raw ile boş gelir; düz metin olarak Node'dan okunur (tsconfig yalnız vite/client tiplerini içerir).
// @ts-expect-error -- node:fs vitest altında mevcut
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { bodyGrid, CHARACTERS, MASCOT_KEYS } from './characters';
import { VOICES } from './quips';
import { GUIDE_LINES } from '../guide/lines';
import { GUIDE_STEPS } from '../guide/steps';
import { captionFor, SCENES, SCENE_IDS } from './cameo/scenes';
import { compose, OX, OY } from './render';
import { buildAction, type ActionName } from './actions';

// Metin dosyaları (Vite ?raw) ve Android kaynaklarının listesi (yüklenmez, yalnız yollar).
const TEXT = import.meta.glob(['../../android/app/src/main/AndroidManifest.xml', '../../android/app/src/main/java/**/*.java', '../../android/app/src/main/res/values*/*.xml'], { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const RES_FILES = Object.keys(import.meta.glob('../../android/app/src/main/res/**/*.{png,xml}'));
const MAIN = '../../android/app/src/main';
const JAVA = `${MAIN}/java/io/github/kivancogretmenoglu/cepdefteri`;
const read = (p: string) => {
  const t = TEXT[p];
  if (t === undefined) throw new Error('yok: ' + p);
  return t;
};
const exists = (p: string) => RES_FILES.includes(`${MAIN}/${p}`);

describe('her maskot her tabloda', () => {
  it('karakter, ses, rehber satırları', () => {
    for (const k of MASCOT_KEYS) {
      const c = CHARACTERS[k];
      expect(c.key).toBe(k);
      expect(c.signature.length).toBeGreaterThan(0);
      for (const s of c.signature) expect(buildAction(s as ActionName, { who: k, outfit: 'plain', sprout: 0 }).length, `${k} ${s}`).toBeGreaterThan(0);
      const v = VOICES[k];
      expect(v, k).toBeDefined();
      for (const pool of [v.expense, v.income, v.jokes, v.pops]) expect(pool.length, k).toBeGreaterThan(0);
      for (const step of GUIDE_STEPS) expect(GUIDE_LINES[k]?.[step.id]?.tr && GUIDE_LINES[k][step.id].en, `${k} ${step.id}`).toBeTruthy();
    }
  });

  it('misafir sahneleri: her tercih listesinde ve saklanma cümlesinde', () => {
    for (const id of SCENE_IDS) expect([...SCENES[id].pref].sort(), id).toEqual([...MASCOT_KEYS].sort());
    for (const k of MASCOT_KEYS) for (const lang of ['tr', 'en'] as const) expect(captionFor('hide', [k], lang, 12)).not.toMatch(/undefined/);
  });

  it('tema: doku/şekil CSS kuralı ve rehberdeki araç önizlemesi', () => {
    const art: string = readFileSync(new URL('./themeArt.css', import.meta.url), 'utf8');
    const guide: string = readFileSync(new URL('../guide/guide.css', import.meta.url), 'utf8');
    for (const k of MASCOT_KEYS) {
      expect(art, k).toContain(`html[data-mascot='${k}']`);
      expect(guide, k).toContain(`.widget-mock--${k}`);
    }
  });

  it('uzun kulak bölgeleri şapkanın önüne çizilir', () => {
    for (const k of MASCOT_KEYS) {
      const ears = CHARACTERS[k].anchors.ears;
      if (!ears) continue;
      const [x0, , x1] = ears[0];
      const tipX = bodyGrid(k)[0].findIndex((c, x) => c && x >= x0 && x < x1);
      expect(tipX).toBeGreaterThanOrEqual(0);
      const figure = compose(k, 'calm', 'spy').figure;
      const lastHat = figure.findIndex((r) => r[4] === '#26252B'); // fötr kenarı
      const tip = figure.findIndex((r, i) => i > lastHat && r[0] === tipX + OX && r[1] === OY && r[2] === 1);
      expect(lastHat).toBeGreaterThanOrEqual(0);
      expect(tip, k).toBeGreaterThan(lastHat);
    }
  });

  it('Android: simge takma adı, eklenti anahtarı, araç dizileri ve renkleri', () => {
    const manifest = read(`${MAIN}/AndroidManifest.xml`);
    const plugin = read(`${JAVA}/AppIconPlugin.java`);
    const widget = read(`${JAVA}/CepWidgetProvider.java`);
    const colors = read(`${MAIN}/res/values/widget_mascot_colors.xml`);
    const night = read(`${MAIN}/res/values-night/widget_mascot_colors.xml`);
    const launcher = read(`${MAIN}/res/values/ic_launcher_mascots.xml`);
    const keys = plugin.match(/KEYS = \{([^}]*)\}/)![1].match(/"(\w+)"/g)!.map((s: string) => s.slice(1, -1));
    expect(keys).toEqual(MASCOT_KEYS);
    MASCOT_KEYS.forEach((k, i) => {
      expect(manifest, k).toContain(`android:name=".Icon_${k}"`);
      expect(colors, k).toContain(`name="widget_btn_${k}"`);
      expect(night, k).toContain(`name="widget_soft_${k}"`);
      expect(launcher, k).toContain(`name="ic_launcher_bg_${k}"`);
      if (i) expect(widget, k).toMatch(new RegExp(`case "${k}":\\s*return ${i};`));
      for (const n of [`widget_scene_${k}_tall`, `widget_anim_${k}_spy_5`, `widget_bust_${k}_spy_noted`, `widget_frame_${k}`, `widget_fab_${k}`]) expect(widget, n).toContain(`R.drawable.${n}`);
      for (const f of [`res/drawable-nodpi/widget_scene_${k}_mini.png`, `res/drawable-nodpi/widget_anim_${k}_0.png`, `res/mipmap-xxxhdpi/ic_launcher_${k}_foreground.png`, `res/mipmap-anydpi-v26/ic_launcher_${k}_round.xml`, `res/drawable/widget_btn_soft_${k}.xml`])
        expect(exists(f), f).toBe(true);
    });
    // Diziler maskot sırasıyla: her dizide anahtarlar MASCOT_KEYS sırasında geçer.
    for (const m of widget.matchAll(/static final int\[\](?:\[\])? (\w+) = \{([\s\S]*?)\n    \};/g)) {
      const seen = [...m[2].matchAll(/R\.\w+\.(\w+)/g)].map((x) => MASCOT_KEYS.find((k) => x[1].split('_').includes(k))).filter((x) => x !== undefined);
      if (!seen.length) continue;
      const order = seen.filter((x, i) => x !== seen[i - 1]);
      expect(order, m[1]).toEqual(MASCOT_KEYS);
    }
  });
});
