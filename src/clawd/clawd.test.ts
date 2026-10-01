import { describe, expect, it } from 'vitest';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Clawd, HOME_OUTFITS, OUTFITS } from './Clawd';
import { buildAction, type ActionName } from './actions';
import { allLines, eventPool, JOKES, TIPS } from './quips';
import { dayPhase } from './timeOfDay';

describe('Clawd canlılık', () => {
  it('statik çizim tarayıcısız çalışır ve canlı sınıf taşımaz', () => {
    const svg = renderToStaticMarkup(h(Clawd, { mood: 'happy', outfit: 'plain', size: 48, idle: false }));
    expect(svg).toContain('<svg');
    expect(svg).not.toContain('clawd--live');
    expect(svg).toContain('crispEdges');
  });

  it('ajan kıyafeti var ama dolapta seçilmez', () => {
    expect(OUTFITS.spy).toBeDefined();
    expect((HOME_OUTFITS as readonly string[]).includes('spy')).toBe(false);
  });

  it('hareketler kısa (≤ 1,5 sn)', () => {
    const names: ActionName[] = ['stretch', 'hop', 'wave', 'turn', 'peek', 'sneeze', 'yawn', 'dance', 'lookaround', 'glasses', 'water', 'write', 'pages', 'music', 'shiver', 'capflip', 'spylook', 'glint', 'psst', 'giggle', 'jump', 'spin', 'hey', 'dizzy', 'tickle', 'note', 'coins', 'sprout', 'confetti', 'wiggle', 'shrug', 'disguise', 'undisguise', 'nod'];
    for (const n of names) {
      const total = buildAction(n, { outfit: 'plain', sprout: 0 }).reduce((s, f) => s + f.ms, 0);
      expect(total, n).toBeLessThanOrEqual(1500);
    }
  });

  it('günün saati', () => {
    expect(dayPhase(new Date(2026, 9, 5, 7, 0)).morning).toBe(true); // pazartesi sabahı
    expect(dayPhase(new Date(2026, 9, 5, 7, 0)).mondayMorning).toBe(true);
    expect(dayPhase(new Date(2026, 9, 6, 23, 30)).night).toBe(true);
    expect(dayPhase(new Date(2026, 9, 6, 3, 0)).night).toBe(true);
    expect(dayPhase(new Date(2026, 9, 6, 14, 0))).toEqual({ morning: false, night: false, mondayMorning: false, monthStart: false });
    expect(dayPhase(new Date(2026, 9, 2, 14, 0)).monthStart).toBe(true);
  });

  it('espriler yeterince çeşitli, değer girişi yorumlanmaz', () => {
    expect(new Set(allLines()).size).toBeGreaterThanOrEqual(40);
    expect(TIPS.length + JOKES.length).toBeGreaterThanOrEqual(12);
    expect(eventPool({ type: 'valuation' })).toBeNull();
    expect(eventPool({ type: 'withdraw', amount: 1 })).toBeNull();
    expect(eventPool({ type: 'income', categoryId: 'i-scholarship', amount: 1 })?.length).toBeGreaterThan(0);
  });
});
