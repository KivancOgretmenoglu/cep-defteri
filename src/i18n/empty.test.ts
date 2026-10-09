import { describe, expect, it } from 'vitest';
import { tr } from './tr';
import { en } from './en';
import { emptyTr } from './empty.tr';
import { emptyEn } from './empty.en';
import { EMPTY_SCENES, EMPTY_SCENE_NAMES, sceneKeys } from '../mascot/emptyScenes';
import { buildAction } from '../mascot/actions';
import { OUTFITS } from '../mascot/render';
import { MASCOT_KEYS } from '../mascot/characters';

const TURKISH = /[ğüşıöçİĞÜŞÖÇ]/;

describe('boş durumlar', () => {
  it('her sahnenin başlık, satır ve düğme metni iki dilde de var', () => {
    for (const s of EMPTY_SCENE_NAMES) {
      for (const k of Object.values(sceneKeys(s))) {
        expect([k, typeof tr[k]]).toEqual([k, 'string']);
        expect([k, typeof en[k]]).toEqual([k, 'string']);
        expect((tr[k] as string).trim().length, k).toBeGreaterThan(0);
        expect((en[k] as string).trim().length, k).toBeGreaterThan(0);
      }
    }
  });
  it('empty.tr ve empty.en aynı anahtarları içerir; İngilizcede Türkçe harf yok', () => {
    expect(Object.keys(emptyEn).sort()).toEqual(Object.keys(emptyTr).sort());
    for (const [k, v] of Object.entries(emptyEn)) expect([k, TURKISH.test(v)]).toEqual([k, false]);
  });
  it('kısa kalır (360 px telefonda): başlık ≤ 40, düğme ≤ 28 karakter', () => {
    for (const s of EMPTY_SCENE_NAMES) {
      const k = sceneKeys(s);
      for (const d of [tr, en]) {
        expect((d[k.title] as string).length, k.title).toBeLessThanOrEqual(40);
        expect((d[k.cta] as string).length, k.cta).toBeLessThanOrEqual(28);
      }
    }
  });
  it('sahnelerin kıyafeti ve hareketleri her maskotta çizilebilir', () => {
    for (const s of EMPTY_SCENE_NAMES) {
      const def = EMPTY_SCENES[s];
      expect(OUTFITS[def.outfit], s).toBeTruthy();
      expect(def.acts.length, s).toBeGreaterThan(0);
      for (const who of MASCOT_KEYS) for (const a of def.acts) expect(buildAction(a, { who, outfit: def.outfit, sprout: 0 }).length, `${s}/${who}/${a}`).toBeGreaterThan(0);
    }
  });
});
