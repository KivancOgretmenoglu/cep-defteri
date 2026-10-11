import { describe, expect, it } from 'vitest';
import { reactionFor, ICON_REACTIONS, type CategoryReaction } from './categoryReact';
import { buildAction } from './actions';
import { DEFAULT_CATEGORIES } from '../domain/defaults';
import { CATEGORY_ICONS } from '../ui/icons';
import { MASCOT_KEYS } from './characters';
import { CW, CH } from './render';

describe('kategori → maskot tepkisi', () => {
  it('varsayılan kategoriler anlamlı tepkiler alır', () => {
    const by = (id: string) => {
      const c = DEFAULT_CATEGORIES.find((x) => x.id === id)!;
      return reactionFor({ type: c.kind, icon: c.icon, name: c.name });
    };
    expect(by('e-food')).toBe('munch');
    expect(by('e-market')).toBe('bag');
    expect(by('e-transport')).toBe('drive');
    expect(by('e-housing')).toBe('house');
    expect(by('e-bills')).toBe('bulb');
    expect(by('e-subs')).toBe('buzz');
    expect(by('e-phone')).toBe('buzz');
    expect(by('e-school')).toBe('read');
    expect(by('e-fun')).toBe('groove');
    expect(by('e-clothes')).toBe('tryhat');
    expect(by('e-health')).toBe('heart');
    expect(by('e-gift')).toBe('gift');
    expect(by('e-other')).toBe('note');
  });

  it('gelir cebe, iade mutlu baş sallama', () => {
    expect(reactionFor({ type: 'income', icon: 'grad' })).toBe('pocket');
    expect(reactionFor({ type: 'income' })).toBe('pocket');
    expect(reactionFor({ type: 'refund' })).toBe('happynod');
  });

  it('özel kategoriler simge anahtarıyla eşlenir; genel simgede ada bakılır', () => {
    expect(reactionFor({ type: 'expense', icon: 'coffee', name: 'Sabah' })).toBe('sip');
    expect(reactionFor({ type: 'expense', icon: 'car', name: 'X' })).toBe('zoom');
    expect(reactionFor({ type: 'expense', icon: 'plane' })).toBe('fly');
    expect(reactionFor({ type: 'expense', icon: 'pet' })).toBe('tailwag');
    expect(reactionFor({ type: 'expense', icon: 'dots', name: 'Kahve' })).toBe('sip');
    expect(reactionFor({ type: 'expense', icon: 'dots', name: 'Metro kart' })).toBe('drive');
    expect(reactionFor({ type: 'expense', icon: 'dots', name: 'Rent' })).toBe('house');
    expect(reactionFor({ type: 'expense', icon: 'dots', name: 'Parent stuff' })).toBe('note');
    expect(reactionFor({ type: 'expense', icon: 'dots', name: 'Refund fund' })).toBe('note');
    expect(reactionFor({ type: 'expense', icon: 'unknown-key' }, 'write')).toBe('write');
    expect(reactionFor({ type: 'expense' })).toBe('note');
  });

  it('eşlemedeki her simge gerçekten var', () => {
    for (const k of Object.keys(ICON_REACTIONS)) expect(CATEGORY_ICONS[k]).toBeTruthy();
  });

  it('her tepki kısa, dolu ve sayısal olarak geçerli', () => {
    const all = [...new Set(Object.values(ICON_REACTIONS)), 'pocket', 'happynod'] as CategoryReaction[];
    for (const who of MASCOT_KEYS)
      for (const n of all) {
        const fs = buildAction(n, { who, outfit: 'plain', sprout: 0 });
        expect(fs.length).toBeGreaterThan(1);
        expect(fs.reduce((a, f) => a + f.ms, 0)).toBeLessThanOrEqual(1250);
        for (const f of fs)
          for (const r of [...(f.props ?? []), ...(f.over ?? []), ...(f.under ?? [])]) {
            expect(r.slice(0, 4).every(Number.isFinite)).toBe(true);
            // Taşan araçlar (otobüs/uçak) tuvalin biraz dışına çıkabilir ama makul sınırda kalır
            expect(r[0]).toBeGreaterThan(-16);
            expect(r[0]).toBeLessThan(CW + 12);
            expect(r[1]).toBeGreaterThan(-8);
            expect(r[1]).toBeLessThan(CH + 2);
          }
      }
  });
});
