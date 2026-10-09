import { describe, expect, it } from 'vitest';
import { shouldCelebrateMonth } from './monthCelebrate';

describe('shouldCelebrateMonth', () => {
  it('celebrates an unseen within-budget month once', () => {
    expect(shouldCelebrateMonth('2026-09', { within: true, reportCardSeen: '2026-08', celebrated: [] })).toBe(true);
    expect(shouldCelebrateMonth('2026-09', { within: true, reportCardSeen: null, celebrated: [] })).toBe(true);
    expect(shouldCelebrateMonth('2026-09', { within: true, reportCardSeen: '2026-08', celebrated: ['2026-09'] })).toBe(false);
  });
  it('never celebrates over-budget or no-budget months', () => {
    expect(shouldCelebrateMonth('2026-09', { within: false, reportCardSeen: null, celebrated: [] })).toBe(false);
  });
  it('does not celebrate old months reopened from Reports', () => {
    expect(shouldCelebrateMonth('2026-05', { within: true, reportCardSeen: '2026-09', celebrated: [] })).toBe(false);
    expect(shouldCelebrateMonth('2026-09', { within: true, reportCardSeen: '2026-09', celebrated: [] })).toBe(false);
  });
});
