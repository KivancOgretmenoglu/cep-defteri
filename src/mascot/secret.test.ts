/** Gizli maskot (Karafatma): kod, seçici görünürlüğü, kıyafet kuralları ve maskot başına tabloların tamlığı. */
// @ts-expect-error -- node:fs vitest altında mevcut
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { bodyGrid, CHARACTERS, MASCOT_KEYS, SECRET_KEYS, characterOf, unitGrid } from './characters';
import { pickable, redeemCode, unlockedOf } from './secret';
import { compose, CH, CW, OUTFITS, outfitFor, PINK_SUIT, wardrobeFor, type EyeStyle } from './render';
import { buildAction, reduceFrames, type ActionName } from './actions';
import { eventPool, greetFor, VOICES } from './quips';
import { GUIDE_LINES } from '../guide/lines';
import { GUIDE_STEPS } from '../guide/steps';
import { SCENES, SCENE_IDS } from './cameo/scenes';
import { emptyData } from '../domain/defaults';
import { parseBackup, serializeBackup } from '../domain/backup';

describe('gizli kod', () => {
  it('hamamcan Karafatma’yı açar; büyük harf ve boşluk fark etmez', () => {
    for (const c of ['hamamcan', 'HAMAMCAN', ' HamamCan ', 'hamam can']) expect(redeemCode(c), c).toBe('karafatma');
    for (const c of ['', '   ', 'karafatma', 'hamamca', 'hamamcann', 'hamambocegi']) expect(redeemCode(c), c).toBeNull();
  });

  it('kod kaynakta düz yazılmaz', () => {
    const src: string = readFileSync(new URL('./secret.ts', import.meta.url), 'utf8');
    expect(src.toLowerCase()).not.toContain('hamamcan');
  });

  it('seçicide yalnız açıldıysa görünür', () => {
    expect(pickable('fistik', [])).toBe(true);
    expect(pickable('karafatma', [])).toBe(false);
    expect(pickable('karafatma', ['karafatma'])).toBe(true);
    expect(unlockedOf(['karafatma', 'bilinmeyen', 3])).toEqual(['karafatma']);
    expect(unlockedOf('karafatma')).toEqual([]);
  });

  it('açılan maskot yedekte taşınır; bozuk değerler elenir', () => {
    const d = emptyData();
    d.settings.unlockedMascots = ['karafatma'];
    d.settings.mascot = { key: 'karafatma', name: null, outfit: 'pinksuit' };
    const r = parseBackup(serializeBackup(d));
    expect(r.ok && r.data.settings.unlockedMascots).toEqual(['karafatma']);
    expect(r.ok && r.data.settings.mascot.key).toBe('karafatma');
    const bad = JSON.parse(serializeBackup(d));
    bad.data.settings.unlockedMascots = ['x', 'karafatma', null];
    const r2 = parseBackup(JSON.stringify(bad));
    expect(r2.ok && r2.data.settings.unlockedMascots).toEqual(['karafatma']);
  });
});

describe('Karafatma', () => {
  const k = 'karafatma' as const;
  const ch = CHARACTERS[k];

  it('herkese açık listede yok (misafir, Android simgesi ve araç onu kullanmaz)', () => {
    expect(SECRET_KEYS).toContain(k);
    expect(MASCOT_KEYS as string[]).not.toContain(k);
    for (const id of SCENE_IDS) expect(SCENES[id].pref as string[]).not.toContain(k);
    expect(characterOf(k).key).toBe(k);
  });

  it('48×48 ayrıntılı gövde; birim ızgarası 24×24', () => {
    expect(ch.res).toBe(2);
    const g = bodyGrid(k);
    expect(g).toHaveLength(48);
    expect(g.every((r) => r.length === 48)).toBe(true);
    const u = unitGrid(k);
    expect(u).toHaveLength(24);
    expect(u.every((r) => r.length === 24)).toBe(true);
  });

  it('her kıyafet × duygu × göz biçimi tuvale sığar', () => {
    const eyes: EyeStyle[] = ['mood', 'closed', 'half', 'happy', 'squeeze', 'x', 'wide', 'none'];
    for (const o of Object.keys(OUTFITS))
      for (const mood of ['calm', 'happy', 'thoughtful', 'curious', 'celebrate'] as const)
        for (const e of eyes) {
          const sc = compose(k, mood, o, { coffee: 'r', nightcap: true, zzz: true, eyes: e, look: [1, -1] });
          const bad = [...sc.figure, ...sc.extras].filter(([x, y, w, h]) => !Number.isFinite(x + y + w + h) || x < -2 || x + w > CW + 2 || y < -2 || y + h > CH + 1);
          expect(bad, `${o} ${mood} ${e}`).toEqual([]);
        }
  });

  it('pembe takım yalnız onda; dolapta yalnız onda; takım elbiseyi pembe giyer', () => {
    const pink = (key: Parameters<typeof compose>[0], o: string) => compose(key, 'calm', o).figure.some((r) => r[4] === PINK_SUIT.jacket);
    expect(pink(k, 'pinksuit')).toBe(true);
    expect(pink(k, 'suit')).toBe(true);
    expect(compose(k, 'calm', 'suit').figure.some((r) => r[4] === '#7A4A2A')).toBe(true); // evrak çantası durur
    expect(wardrobeFor(k)).toContain('pinksuit');
    for (const other of MASCOT_KEYS) {
      expect(pink(other, 'pinksuit'), other).toBe(false);
      expect(outfitFor(other, 'pinksuit')).toBe(OUTFITS.plain);
      expect(wardrobeFor(other), other).not.toContain('pinksuit');
    }
    // Ceket boyundan yukarı taşmaz, bacaklar boyanmaz
    const jacket = compose(k, 'calm', 'pinksuit').figure.filter((r) => r[4] === PINK_SUIT.jacket);
    expect(jacket.every((r) => r[1] >= ch.anchors.neck.y + 4)).toBe(true);
  });

  it('imza hareketleri kısa ve tek kareye iner', () => {
    for (const s of ch.signature) {
      const fs = buildAction(s as ActionName, { who: k, outfit: 'plain', sprout: 0 });
      expect(fs.length, s).toBeGreaterThan(0);
      expect(fs.reduce((a, f) => a + f.ms, 0), s).toBeLessThanOrEqual(1700);
      expect(reduceFrames(fs)).toHaveLength(1);
    }
  });

  it('kendi ağzı, selamları ve rehber satırları tam', () => {
    const v = VOICES[k];
    for (const pool of [v.expense, v.income, v.jokes, v.pops, v.invest ?? [], v.debt ?? []]) expect(pool.length).toBeGreaterThan(0);
    for (const kind of ['morning', 'monday', 'night', 'monthStart', 'spy', 'exam', 'newyear', 'bayram', 'summer'] as const) expect(greetFor(k, kind)).toBe(v.greet![kind]);
    expect(greetFor('fistik', 'morning')).not.toBe(v.greet!.morning);
    for (const step of GUIDE_STEPS) expect(GUIDE_LINES[k][step.id].tr && GUIDE_LINES[k][step.id].en, step.id).toBeTruthy();
    expect(eventPool({ type: 'valuation' }, k)).toBeNull();
    expect(eventPool({ type: 'expense', amount: 1, categoryId: 'e-food' }, k)).not.toBeNull();
    // Küfürbaz ama kullanıcıyı aşağılamaz: kimse "sen" diye azarlanmaz
    for (const l of [...v.expense, ...v.income, ...v.jokes]) expect(l.tr).not.toMatch(/\b(salak|aptal|gerizekalı)\b/i);
  });

  it('tema CSS’i ve rehber aracı önizlemesi var', () => {
    const art: string = readFileSync(new URL('./themeArt.css', import.meta.url), 'utf8');
    const guide: string = readFileSync(new URL('../guide/guide.css', import.meta.url), 'utf8');
    expect(art).toContain(`html[data-mascot='${k}']`);
    expect(guide).toContain(`.widget-mock--${k}`);
  });
});
