import { describe, expect, it } from 'vitest';
import { emptyData } from './defaults';
import * as A from './actions';
import { newlyReachedGoals } from './rings';

const TODAY = '2026-10-15';
const TL = (n: number) => Math.round(n * 100);

function setup() {
  let d = emptyData();
  const bank = A.addAccount(d, { name: 'Banka', kind: 'bank', openingBalance: TL(10000), openingDate: '2026-09-01' });
  d = bank.data;
  const inv = A.addAccount(d, { name: 'Yatırım', kind: 'investment', openingBalance: 0, openingDate: '2026-09-01' });
  d = A.addGoal(inv.data, { title: 'Tatil', target: TL(1000), accountId: inv.account.id }).data;
  return { d, bank: bank.account.id, inv: inv.account.id };
}

describe('hedef kutlaması', () => {
  it('yalnız eşiği geçen kayıtta bir kez kutlanır', () => {
    const { d, bank, inv } = setup();
    const half = A.addTx(d, { type: 'transfer', amount: TL(600), date: TODAY, accountId: bank, toAccountId: inv }, TODAY).data;
    expect(newlyReachedGoals(d, half)).toEqual([]);
    const full = A.addTx(half, { type: 'transfer', amount: TL(500), date: TODAY, accountId: bank, toAccountId: inv }, TODAY).data;
    expect(newlyReachedGoals(half, full)).toEqual([full.goals[0].id]);
    // Zaten tamamken yeni katkı ya da sıradan gider kutlama değildir.
    const more = A.addTx(full, { type: 'transfer', amount: TL(50), date: TODAY, accountId: bank, toAccountId: inv }, TODAY).data;
    expect(newlyReachedGoals(full, more)).toEqual([]);
  });
  it('dolu olarak oluşturulan hedef kutlanmaz', () => {
    const { d, bank, inv } = setup();
    const funded = A.addTx(d, { type: 'transfer', amount: TL(2000), date: TODAY, accountId: bank, toAccountId: inv }, TODAY).data;
    const withNew = A.addGoal(funded, { title: 'Yeni', target: TL(500), accountId: inv }).data;
    expect(newlyReachedGoals(funded, withNew)).toEqual([]);
  });
});
