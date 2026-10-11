import { describe, expect, it } from 'vitest';
import * as A from '../domain/actions';
import { emptyData } from '../domain/defaults';
import { parseBackup, serializeBackup } from '../domain/backup';
import { MASCOT_KEYS } from '../mascot/characters';
import { GUIDE_STEPS, GUIDE_VERSION, filterSteps, guideOutdated, nextPresent, shouldAutoStart, shouldInvite } from './steps';
import { GUIDE_LINES } from './lines';
import { placeBubble } from './layout';

const ids = (s: { id: string }[]) => s.map((x) => x.id);

describe('rehber adımları', () => {
  it('kutucuk adımı yalnız APK’da; tarayıcıda baştan elenir', () => {
    expect(ids(filterSteps(GUIDE_STEPS, { native: true }))).toContain('tile');
    expect(ids(filterSteps(GUIDE_STEPS, { native: false }))).not.toContain('tile');
    expect(filterSteps(GUIDE_STEPS, { native: false })).toHaveLength(GUIDE_STEPS.length - 1);
  });

  it('sıra: + → tutar → yeni kategori → … → widget → ayarlar (son)', () => {
    const s = ids(GUIDE_STEPS);
    expect(s[0]).toBe('add');
    expect(s.slice(1, 3)).toEqual(['amount', 'newCat']);
    expect(s.at(-1)).toBe('settings');
    expect(s.indexOf('widget')).toBeLessThan(s.indexOf('tile'));
    // Sayfa adımları ardışık: arada kapanıp açılmaz
    expect(GUIDE_STEPS.filter((x) => x.sheet).map((x) => x.id)).toEqual(['amount', 'newCat']);
  });

  it('hedefi olmayan adımlar atlanır (ileri ve geri)', () => {
    const steps = filterSteps(GUIDE_STEPS, { native: false });
    const absent = new Set(['why', 'eye', 'reports', 'rings']);
    const present = (s: { id: string }) => !absent.has(s.id);
    const why = steps.findIndex((s) => s.id === 'why');
    expect(steps[nextPresent(steps, why, 1, present)].id).toBe('floor');
    expect(steps[nextPresent(steps, why, -1, present)].id).toBe('newCat');
    expect(nextPresent(steps, steps.length - 1, 1, () => false)).toBe(-1);
    expect(nextPresent(steps, 0, -1, () => false)).toBe(-1);
  });

  it('yatırım adımı Yatırım sekmesini, raporlar adımı Özet başlığındaki simgeyi gösterir', () => {
    const inv = GUIDE_STEPS.find((x) => x.id === 'invest')!;
    expect(inv.target?.names).toEqual(['invest-tab']);
    const rep = GUIDE_STEPS.find((x) => x.id === 'reports')!;
    expect(rep.screen).toBe('home');
    expect(rep.target?.names).toEqual(['reports']);
    // Başlıkta göz ile yan yana: art arda gelir
    const s = ids(GUIDE_STEPS);
    expect(s.indexOf('reports')).toBe(s.indexOf('eye') + 1);
  });

  it('her adımın her maskotta tr ve en satırı var, kısa', () => {
    for (const k of MASCOT_KEYS) {
      for (const s of GUIDE_STEPS) {
        const l = GUIDE_LINES[k][s.id];
        expect(l.tr.length).toBeGreaterThan(5);
        expect(l.en.length).toBeGreaterThan(5);
        expect(l.tr.length).toBeLessThan(140);
      }
    }
  });
});

describe('rehber kapısı (guideVersion)', () => {
  const base = { mode: 'real' as const, hasAccounts: true, guideVersion: null };
  it('görmemiş ya da eski sürümü görmüş gerçek kullanıcı', () => {
    expect(guideOutdated(base)).toBe(true);
    expect(guideOutdated({ ...base, guideVersion: 1 })).toBe(true);
    expect(guideOutdated({ ...base, guideVersion: GUIDE_VERSION })).toBe(false);
    expect(guideOutdated({ ...base, guideVersion: undefined })).toBe(true);
    expect(guideOutdated({ ...base, mode: 'demo' })).toBe(false);
    expect(guideOutdated({ ...base, hasAccounts: false })).toBe(false);
  });
  it('yeni kurulum: kart yok, rehber kendiliğinden (meşgul değilken) başlar', () => {
    expect(shouldInvite({ ...base, pendingAuto: true, active: false })).toBe(false);
    expect(shouldAutoStart({ ...base, pendingAuto: true, busy: false })).toBe(true);
    expect(shouldAutoStart({ ...base, pendingAuto: true, busy: true })).toBe(false);
    expect(shouldAutoStart({ ...base, pendingAuto: false, busy: false })).toBe(false);
  });
  it('mevcut kullanıcı: bir kez kart; rehber açıkken ya da sürüm güncelse yok', () => {
    expect(shouldInvite({ ...base, pendingAuto: false, active: false })).toBe(true);
    expect(shouldInvite({ ...base, pendingAuto: false, active: true })).toBe(false);
    expect(shouldInvite({ ...base, guideVersion: GUIDE_VERSION, pendingAuto: false, active: false })).toBe(false);
  });
  it('yedekte guideVersion: sayı ya da null; eski yedekte null', () => {
    let d = A.updateSettings(emptyData(), { guideVersion: GUIDE_VERSION });
    const r = parseBackup(serializeBackup(d));
    expect(r.ok && r.data.settings.guideVersion).toBe(GUIDE_VERSION);
    const bad = JSON.parse(serializeBackup(d));
    bad.data.settings.guideVersion = 'x';
    expect(parseBackup(JSON.stringify(bad)).ok).toBe(false);
    bad.data.settings.guideVersion = -1;
    expect(parseBackup(JSON.stringify(bad)).ok).toBe(false);
    delete bad.data.settings.guideVersion;
    const old = parseBackup(JSON.stringify(bad));
    expect(old.ok && old.data.settings.guideVersion).toBeNull();
    d = emptyData();
    expect(d.settings.guideVersion).toBeNull();
  });
});

describe('balon yerleşimi', () => {
  const f = { vw: 390, vh: 844, top: 34, bottom: 760 };
  it('hedefin altına sığarsa altta, ekrana sıkıştırılmış', () => {
    const p = placeBubble({ x: 330, y: 40, w: 50, h: 50 }, f, 180);
    expect(p.side).toBe('below');
    expect(p.left + p.w).toBeLessThanOrEqual(390 - 16);
    expect(p.arrow).toBeGreaterThan(p.w / 2);
  });
  it('tab çubuğundaki + için üstte', () => {
    const p = placeBubble({ x: 160, y: 770, w: 70, h: 70 }, f, 180);
    expect(p.side).toBe('above');
    expect(p.top).toBeGreaterThanOrEqual(f.top);
  });
  it('dev hedefte ve hedefsiz adımda ekran içinde kalır', () => {
    const p = placeBubble({ x: 8, y: 20, w: 374, h: 700 }, f, 220);
    expect(p.top).toBeGreaterThanOrEqual(f.top);
    expect(p.top + 220).toBeLessThanOrEqual(f.bottom);
    const c = placeBubble(null, f, 400);
    expect(c.side).toBe('none');
    expect(c.top).toBeGreaterThanOrEqual(f.top);
  });
});
