import { describe, expect, it } from 'vitest';
import { homeOutfit, pajamaTime, skyBand, skyBody } from './seasonal';
import { SKY_ACCENT, SKY_TINTS } from '../ui/Sky';
import { CHARACTERS, MASCOT_KEYS } from './characters';
import { compose, OUTFITS } from './render';
import { OUTFIT_ACTIONS } from './actions';

const at = (h: number, m = 0) => new Date(2026, 9, 8, h, m);

describe('gökyüzü bandı', () => {
  it('saat sınırları', () => {
    const want: [number, string][] = [
      [0, 'night'], [4, 'night'], [5, 'dawn'], [9, 'dawn'], [10, 'day'], [16, 'day'], [17, 'golden'], [18, 'golden'],
      [19, 'evening'], [21, 'evening'], [22, 'night'], [23, 'night'],
    ];
    for (const [h, b] of want) expect(skyBand(h), `${h}:00`).toBe(b);
    expect(skyBand(24)).toBe('night');
    expect(skyBand(-1)).toBe('night');
  });

  it('güneş gündüz, ay gece; öğlen tepede, ufukta alçakta', () => {
    expect(skyBody(at(13)).kind).toBe('sun');
    expect(skyBody(at(13)).y).toBe(0);
    expect(skyBody(at(6)).y).toBe(1);
    expect(skyBody(at(1)).kind).toBe('moon');
    expect(skyBody(at(1)).y).toBe(0);
    for (let h = 0; h < 24; h++) {
      const b = skyBody(at(h, 30));
      expect(b.x).toBeGreaterThanOrEqual(0);
      expect(b.x).toBeLessThanOrEqual(1);
      expect(b.y).toBeGreaterThanOrEqual(0);
      expect(b.y).toBeLessThanOrEqual(1);
    }
  });

  // color-mix(in srgb, …) sRGB bileşenlerinde doğrusal karışımdır
  const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const mix = (a: number[], b: number[], pa: number) => a.map((v, i) => v * pa + b[i] * (1 - pa));
  const lum = (c: number[]) => {
    const l = c.map((v) => v / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * l[0] + 0.7152 * l[1] + 0.0722 * l[2];
  };
  const contrast = (a: number[], b: number[]) => {
    const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
    return (x + 0.05) / (y + 0.05);
  };

  it('başlık metni her bantta, her palette ve iki temada AA (4.5:1) geçer', () => {
    const LIGHT = { ink: '#23201b', ink2: '#5b5448', paper: '#f4efe6' };
    const DARK = { ink: '#f1ebe0', ink2: '#c3b9a9', paper: '#1c1a17' };
    for (const k of MASCOT_KEYS) {
      const p = CHARACTERS[k].palette;
      for (const [band, t] of Object.entries(SKY_TINTS)) {
        for (const [mode, theme, tint, accent, paper] of [
          ['light', LIGHT, t.light, p.accent, p.paper],
          ['dark', DARK, t.dark, p.darkAccent, DARK.paper],
        ] as const) {
          for (const c of [tint.a, tint.b]) {
            const tone = mix(hex(c), hex(accent), 1 - SKY_ACCENT / 100);
            const bg = mix(tone, hex(paper), tint.p / 100);
            for (const fg of [theme.ink, theme.ink2]) expect(contrast(hex(fg), bg), `${k} ${band} ${mode} ${fg}`).toBeGreaterThanOrEqual(4.5);
          }
        }
      }
    }
  });
});

describe('gece pijaması', () => {
  it('22:00–05:59', () => {
    expect(pajamaTime(at(21, 59))).toBe(false);
    expect(pajamaTime(at(22))).toBe(true);
    expect(pajamaTime(at(3))).toBe(true);
    expect(pajamaTime(at(5, 59))).toBe(true);
    expect(pajamaTime(at(6))).toBe(false);
  });

  it('öncelik: ajan > sınav > özel gün > pijama > seçim', () => {
    const base = { spy: false, exam: false, season: null, night: false, user: 'cap' } as const;
    expect(homeOutfit(base)).toBe('cap');
    expect(homeOutfit({ ...base, night: true })).toBe('pajama');
    expect(homeOutfit({ ...base, night: true, season: 'newyear' })).toBe('newyear');
    expect(homeOutfit({ ...base, night: true, season: 'bayram', exam: true })).toBe('exam');
    expect(homeOutfit({ ...base, night: true, season: 'summer', exam: true, spy: true })).toBe('spy');
  });

  it('beş karakterde de şapka ve yaka çizilir; esneme pijamayla gelir', () => {
    expect(OUTFITS.pajama).toBeDefined();
    for (const k of MASCOT_KEYS) {
      const plain = compose(k, 'calm', 'plain').figure.length;
      expect(compose(k, 'calm', 'pajama').figure.length, k).toBeGreaterThan(plain + 10);
    }
    expect(OUTFIT_ACTIONS.pajama).toContain('yawn');
  });
});
