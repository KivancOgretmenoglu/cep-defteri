import { describe, expect, it } from 'vitest';
import { peekBlock, PEEK_GAP_MS, type PeekCtx } from './logic';

const base: PeekCtx = {
  enabled: true, reduced: false, onboarding: false, screen: 'home', sheetOpen: false, busy: false, hidden: false,
  usedThisVisit: false, luckyVisit: true, scrollY: 600, noteVisible: false, now: 1_000_000, lastPeekAt: -Infinity,
};

describe('kaydırma bakışı', () => {
  it('koşullar uygunsa bakar', () => expect(peekBlock(base)).toBeNull());
  it('kurallar', () => {
    expect(peekBlock({ ...base, enabled: false })).toBe('disabled');
    expect(peekBlock({ ...base, reduced: true })).toBe('reduced');
    expect(peekBlock({ ...base, onboarding: true })).toBe('onboarding');
    expect(peekBlock({ ...base, screen: 'settings' })).toBe('screen');
    expect(peekBlock({ ...base, sheetOpen: true })).toBe('sheet');
    expect(peekBlock({ ...base, busy: true })).toBe('busy');
    expect(peekBlock({ ...base, noteVisible: true })).toBe('note');
    expect(peekBlock({ ...base, usedThisVisit: true })).toBe('used');
    expect(peekBlock({ ...base, luckyVisit: false })).toBe('unlucky');
    expect(peekBlock({ ...base, scrollY: 400 })).toBe('scroll');
    expect(peekBlock({ ...base, lastPeekAt: base.now - PEEK_GAP_MS + 1 })).toBe('gap');
    expect(peekBlock({ ...base, lastPeekAt: base.now - PEEK_GAP_MS })).toBeNull();
  });
  it('hata ayıklama zorlaması zaman/şans kurallarını atlar ama güvenlik kurallarını değil', () => {
    const f = { ...base, forced: true, usedThisVisit: true, luckyVisit: false, scrollY: 200, lastPeekAt: base.now };
    expect(peekBlock(f)).toBeNull();
    expect(peekBlock({ ...f, sheetOpen: true })).toBe('sheet');
    expect(peekBlock({ ...f, reduced: true })).toBe('reduced');
  });
});
