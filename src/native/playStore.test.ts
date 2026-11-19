import { describe, expect, it } from 'vitest';
import { emptyData } from '../domain/defaults';
import * as A from '../domain/actions';
import { reviewDue, REVIEW_COOLDOWN_DAYS } from './playStore';

const DAY = 86_400_000;
const T0 = Date.UTC(2026, 10, 1, 9);

function withTxs(n: number) {
  let d = emptyData();
  const bank = A.addAccount(d, { name: 'Banka', kind: 'bank', openingBalance: 100000, openingDate: '2026-11-01' }, T0);
  d = bank.data;
  for (let i = 0; i < n; i++) d = A.addTx(d, { type: 'expense', amount: 1000, date: '2026-11-01', accountId: bank.account.id, categoryId: 'e-food' }, '2026-11-15').data;
  return d;
}

describe('puanlama isteği zamanı', () => {
  it('en az 2 gün ve 5 kayıt; gerçek veri; 120 günde bir', () => {
    const d = withTxs(5);
    expect(reviewDue(d, 'real', null, T0 + 1 * DAY)).toBe(false);
    expect(reviewDue(d, 'real', null, T0 + 2 * DAY)).toBe(true);
    expect(reviewDue(withTxs(4), 'real', null, T0 + 5 * DAY)).toBe(false);
    expect(reviewDue(d, 'demo', null, T0 + 5 * DAY)).toBe(false);
    expect(reviewDue(emptyData(), 'real', null, T0 + 5 * DAY)).toBe(false);
    const asked = T0 + 3 * DAY;
    expect(reviewDue(d, 'real', asked, asked + 30 * DAY)).toBe(false);
    expect(reviewDue(d, 'real', asked, asked + REVIEW_COOLDOWN_DAYS * DAY)).toBe(true);
  });
});
