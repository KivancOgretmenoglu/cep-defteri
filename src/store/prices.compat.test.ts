import { afterEach, describe, expect, it, vi } from 'vitest';
import { sanitizeBook } from '../domain/prices';

/** Bellekte localStorage (Node'da yok). */
function fakeStorage(init: Record<string, string> = {}) {
  const m = new Map(Object.entries(init));
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k), dump: m };
}

describe('fiyat önbelleği: sürümler arası uyum', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('1.0 önbelleği ("book") 1.1 tarafından okunur', async () => {
    const old = { book: { gram: { buy: 520000, sell: 529000, at: 1, source: 'live' }, USD: { buy: 5036, sell: 5037, at: 1, source: 'live' } }, fetchedAt: 1, auto: false };
    vi.stubGlobal('localStorage', fakeStorage({ 'cep-defteri:prices': JSON.stringify(old) }));
    const P = await import('./prices');
    const s = P.getPrices();
    expect(s.base).toEqual(old.book);
    expect(s.book).toEqual(old.book);
    expect(s.quotes).toEqual({});
    expect(s.auto).toBe(false);
  });

  it('1.1 önbelleği 1.0 tarafından da okunabilir (hisse kotasyonları eski sürümü bozmaz)', async () => {
    const ls = fakeStorage();
    vi.stubGlobal('localStorage', ls);
    const P = await import('./prices');
    P.setManualPrice('gram', 510000, 5);
    P.setManualQuote('BIST:THYAO', 32025, 5);
    const saved = JSON.parse(ls.dump.get('cep-defteri:prices')!);
    // 1.0 yalnız "book" anahtarını sanitizeBook ile okur: altın fiyatı gelir, hisse hiç görünmez.
    expect(sanitizeBook(saved.book)).toEqual({ gram: { buy: 510000, sell: 510000, at: 5, source: 'manual' } });
    expect(saved.quotes['BIST:THYAO'].price).toBe(32025);
  });
});
