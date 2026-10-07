import { describe, expect, it } from 'vitest';
import { CHARACTERS, MASCOT_KEYS, bodyGrid, S } from './characters';
import { compose, OUTFITS, HOME_OUTFITS, CW, CH } from './render';
import { buildAction, reduceFrames, type ActionName } from './actions';
import { allLines, eventPool, fill } from './quips';
import { seasonFor, examActive, dayPhase } from './seasonal';

const lum = (h: string) => {
  const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const contrast = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

describe('maskot karakterleri', () => {
  it('beş karakter; 24×24 gövde; tema renkleri okunabilir', () => {
    expect(MASCOT_KEYS).toHaveLength(5);
    for (const k of MASCOT_KEYS) {
      const g = bodyGrid(k);
      expect(g).toHaveLength(S);
      expect(g.every((r) => r.length === S)).toBe(true);
      const p = CHARACTERS[k].palette;
      expect(contrast('#FFFFFF', p.accent)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(p.accent, p.paper)).toBeGreaterThanOrEqual(4.5);
      expect(contrast('#1C1A17', p.darkAccent)).toBeGreaterThanOrEqual(4.5);
      expect(CHARACTERS[k].name.tr && CHARACTERS[k].name.en && CHARACTERS[k].intro.en).toBeTruthy();
    }
  });

  it('her karakter × kıyafet × duygu tuvale sığar ve sayısal olarak geçerli', () => {
    for (const k of MASCOT_KEYS)
      for (const o of Object.keys(OUTFITS))
        for (const mood of ['calm', 'happy', 'thoughtful', 'curious', 'celebrate'] as const) {
          const sc = compose(k, mood, o, { coffee: 'r', nightcap: true, zzz: true });
          for (const [x, y, w, h] of [...sc.figure, ...sc.extras]) {
            expect(Number.isFinite(x + y + w + h)).toBe(true);
            expect(x).toBeGreaterThanOrEqual(-2);
            expect(x + w).toBeLessThanOrEqual(CW + 2);
            expect(y).toBeGreaterThanOrEqual(-2);
            expect(y + h).toBeLessThanOrEqual(CH + 1);
          }
        }
    expect(HOME_OUTFITS.every((o) => o in OUTFITS)).toBe(true);
  });

  it('hareketler kısa ve hareket azaltmada tek kareye iner', () => {
    const names: ActionName[] = ['stretch', 'hop', 'wave', 'turn', 'peek', 'sneeze', 'yawn', 'dance', 'lookaround', 'glasses', 'water', 'write', 'pages', 'music', 'shiver', 'captip', 'spylook', 'glint', 'psst', 'study', 'tailwag', 'earflap', 'stash', 'curl', 'leaf', 'tilt', 'giggle', 'jump', 'spin', 'hey', 'dizzy', 'tickle', 'note', 'coins', 'sprout', 'confetti', 'wiggle', 'shrug', 'disguise', 'undisguise', 'nod'];
    for (const k of MASCOT_KEYS)
      for (const n of names) {
        const fs = buildAction(n, { who: k, outfit: 'gardener', sprout: 0 });
        const total = fs.reduce((a, f) => a + f.ms, 0);
        expect(total).toBeLessThanOrEqual(1700);
        expect(reduceFrames(fs)).toHaveLength(1);
      }
    for (const k of MASCOT_KEYS) for (const s of CHARACTERS[k].signature) expect(names).toContain(s);
  });
});

describe('espriler', () => {
  it('her satır iki dilde dolu, eski maskot adı geçmiyor', () => {
    for (const l of allLines()) {
      expect(l.tr.trim().length).toBeGreaterThan(0);
      expect(l.en.trim().length).toBeGreaterThan(0);
      expect(l.tr + l.en).not.toMatch(/clawd/i);
    }
    expect(fill('Ajan {name} görevde', 'Fıstık')).toBe('Ajan Fıstık görevde');
  });
  it('değer girişi, transfer ve çekim yorumlanmaz', () => {
    for (const k of MASCOT_KEYS) {
      expect(eventPool({ type: 'valuation' }, k)).toBeNull();
      expect(eventPool({ type: 'transfer', amount: 1 }, k)).toBeNull();
      expect(eventPool({ type: 'withdraw', amount: 1 }, k)).toBeNull();
      expect(eventPool({ type: 'expense', amount: 1, categoryId: 'e-food' }, k)).not.toBeNull();
    }
  });
});

describe('özel günler', () => {
  it('bayram, yılbaşı, yaz ve sınav haftası', () => {
    expect(seasonFor('2026-03-20')).toBe('bayram');
    expect(seasonFor('2026-05-30')).toBe('bayram');
    expect(seasonFor('2026-12-31')).toBe('newyear');
    expect(seasonFor('2027-01-02')).toBe('newyear');
    expect(seasonFor('2026-07-15')).toBe('summer');
    expect(seasonFor('2026-10-07')).toBeNull();
    expect(examActive('2026-10-10', '2026-10-10')).toBe(true);
    expect(examActive('2026-10-10', '2026-10-11')).toBe(false);
    expect(examActive(null, '2026-10-11')).toBe(false);
    expect(dayPhase(new Date(2026, 9, 5, 23, 30)).night).toBe(true);
  });
});
