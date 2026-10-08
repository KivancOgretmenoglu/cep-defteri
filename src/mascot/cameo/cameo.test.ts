import { describe, expect, it } from 'vitest';
import { MASCOT_KEYS } from '../characters';
import { blockedReason, CHANCE, markShown, MIN_GAP_MS, MIN_OPENS, parseCounters, PITY_OPENS, planOpen, registerOpen, sceneForScreen, showDelayMs, stayMs, FRESH } from './logic';
import { CAMEO_SCREENS, captionFor, guestsFor, hourFits, SCENES, SCENE_IDS } from './scenes';

const base = { opens: 10, sinceLast: 5, lastAt: 0, pending: false };
const NOW = 10 * 60 * 60_000;

describe('saat tablosu', () => {
  it('uyku sahnesi 12:00 öncesinde asla çıkmaz', () => {
    for (let h = 0; h < 15; h++) expect(hourFits(SCENES.sleep, h)).toBe(false);
    for (const h of [15, 18, 22, 23]) expect(hourFits(SCENES.sleep, h)).toBe(true);
  });
  it('kahve yalnız sabah ve akşam', () => {
    expect([5, 10, 11, 14, 16, 21, 23].some((h) => hourFits(SCENES.coffee, h))).toBe(false);
    expect([6, 9, 17, 20].every((h) => hourFits(SCENES.coffee, h))).toBe(true);
  });
  it('gece yarısından sabaha hiçbir sahne çıkmaz (00–05)', () => {
    for (let h = 0; h < 6; h++) expect(planOpen(h, Math.random)).toEqual([]);
  });
  it('planOpen yalnız saate uyanları, rastgele sırada verir', () => {
    const morning = planOpen(9, () => 0.5);
    expect(morning).not.toContain('sleep');
    expect(morning).not.toContain('cards');
    expect(morning).toContain('coffee');
  });
  it('06–24 arası her okunur ekranda en az bir sahne çıkabilir', () => {
    for (let h = 6; h < 24; h++)
      for (const s of CAMEO_SCREENS) expect(SCENE_IDS.some((id) => hourFits(SCENES[id], h) && SCENES[id].screens.includes(s)), `${s} ${h}`).toBe(true);
    const evening = planOpen(19, () => 0.1);
    expect(evening).toContain('sleep');
    expect(new Set(evening).size).toBe(evening.length);
    for (const id of evening) expect(hourFits(SCENES[id], 19)).toBe(true);
  });
});

describe('açılış sayacı ve aralık', () => {
  it('ilk açılışlarda kurulmaz', () => {
    let c = FRESH;
    for (let i = 1; i < MIN_OPENS; i++) {
      const r = registerOpen(c, NOW, () => 0);
      expect(r.armed).toBe(false);
      c = r.counters;
    }
    expect(registerOpen(c, NOW, () => 0).armed).toBe(true);
  });
  it('yaklaşık %10: zar eşiğin altındaysa kurulur', () => {
    expect(registerOpen(base, NOW, () => CHANCE - 0.001).armed).toBe(true);
    expect(registerOpen(base, NOW, () => CHANCE).armed).toBe(false);
    expect(registerOpen(base, NOW, () => 0.9).armed).toBe(false);
  });
  it('son sahneden 5 dakika dolmadan kurulmaz, dolunca kurulur', () => {
    const c = { ...base, lastAt: NOW - (MIN_GAP_MS - 1) };
    expect(registerOpen(c, NOW, () => 0).armed).toBe(false);
    expect(registerOpen({ ...base, lastAt: NOW - MIN_GAP_MS }, NOW, () => 0).armed).toBe(true);
  });
  it('sayaçlar her açılışta artar; sahne gösterilince sinceLast sıfırlanır', () => {
    const r = registerOpen(base, NOW, () => 0.99);
    expect(r.counters).toEqual({ opens: 11, sinceLast: 6, lastAt: 0, pending: false });
    expect(markShown({ ...r.counters, pending: true }, NOW)).toEqual({ opens: 11, sinceLast: 0, lastAt: NOW, pending: false });
  });
  it('tutan ama gösterilemeyen zar sonraki açılışa devreder', () => {
    const r = registerOpen(base, NOW, () => 0);
    expect(r.counters.pending).toBe(true);
    expect(registerOpen(r.counters, NOW, () => 0.99).armed).toBe(true);
  });
  it('uzun şanssız seri sonunda kesin kurulur (gap uygunsa)', () => {
    expect(registerOpen({ ...base, sinceLast: PITY_OPENS - 1 }, NOW, () => 0.99).armed).toBe(true);
  });
  it('bozuk localStorage içeriği sıfıra döner', () => {
    expect(parseCounters(null)).toEqual(FRESH);
    expect(parseCounters('{oops')).toEqual(FRESH);
    expect(parseCounters('{"opens":"x","sinceLast":-3,"lastAt":5}')).toEqual({ opens: 0, sinceLast: 0, lastAt: 5, pending: false });
  });
  it('gösterim gecikmesi 3–6 sn, kalma 12–20 sn', () => {
    expect(showDelayMs(() => 0)).toBe(3000);
    expect(showDelayMs(() => 0.9999)).toBeLessThanOrEqual(6000);
    expect(stayMs(() => 0)).toBe(12000);
    expect(stayMs(() => 0.9999)).toBeLessThanOrEqual(20000);
  });
});

describe('ekrana uygun sahne', () => {
  it('yalnız kendi ekranlarında', () => {
    expect(sceneForScreen(['sleep'], 'reports')).toBe('sleep');
    expect(sceneForScreen(['sleep'], 'home')).toBeNull();
    expect(sceneForScreen(['cards', 'coins'], 'invest')).toBe('coins');
    expect(sceneForScreen(['ball'], 'tx')).toBe('ball');
    expect(sceneForScreen(['hide', 'coffee'], 'home')).toBe('hide');
  });
  it('okunur olmayan ekranlarda hiçbir sahne yok', () => {
    for (const s of ['settings', 'balance', 'people'] as const) expect(sceneForScreen(SCENE_IDS, s)).toBeNull();
  });
});

describe('yasak durumlar', () => {
  const free = { enabled: true, noAccounts: false, sheetOpen: false, typing: false, hidden: false, busy: false };
  it('serbest', () => expect(blockedReason(free)).toBeNull());
  it('kapalı ayar, ilk kurulum, açık sayfa, yazı alanı, gizli sekme', () => {
    expect(blockedReason({ ...free, enabled: false })).toBe('off');
    expect(blockedReason({ ...free, noAccounts: true })).toBe('onboarding');
    expect(blockedReason({ ...free, sheetOpen: true })).toBe('sheet');
    expect(blockedReason({ ...free, typing: true })).toBe('typing');
    expect(blockedReason({ ...free, hidden: true })).toBe('hidden');
    expect(blockedReason({ ...free, busy: true })).toBe('busy');
  });
});

describe('misafir seçimi ve metinler', () => {
  it('seçili maskot asla misafir olmaz; çiftte iki farklı misafir', () => {
    for (const main of MASCOT_KEYS)
      for (const id of SCENE_IDS) {
        const g = guestsFor(id, main);
        expect(g).toHaveLength(SCENES[id].guests);
        expect(g).not.toContain(main);
        expect(new Set(g).size).toBe(g.length);
      }
  });
  it('her sahnenin iki dilde dolu cümlesi var', () => {
    for (const id of SCENE_IDS)
      for (const lang of ['tr', 'en'] as const)
        for (const hour of [9, 19]) for (const main of MASCOT_KEYS) expect(captionFor(id, guestsFor(id, main), lang, hour).length).toBeGreaterThan(5);
  });
  it('saklanma cümlesi misafire göre değişir', () => {
    expect(captionFor('hide', ['ceviz'], 'tr', 12)).toContain('Cevizi');
    expect(captionFor('hide', ['karamel'], 'en', 12)).toContain('bone');
  });
});
