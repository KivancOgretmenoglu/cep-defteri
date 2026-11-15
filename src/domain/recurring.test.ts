import { describe, expect, it } from 'vitest';
import { emptyData } from './defaults';
import * as A from './actions';
import { recurringSuggestions, RECURRING_DISMISS_PREFIX } from './recurring';
import type { Data } from './types';

const TODAY = '2026-11-15';
const TL = (n: number) => Math.round(n * 100);

function setup() {
  let d = emptyData();
  const bank = A.addAccount(d, { name: 'Banka', kind: 'bank', openingBalance: TL(50000), openingDate: '2026-06-01' });
  d = bank.data;
  const cat = d.categories.find((c) => c.kind === 'expense')!.id;
  return { d, bank: bank.account.id, cat };
}
const add = (d: Data, date: string, amount: number, extra: Partial<A.TxDraft> & { categoryId: string; accountId: string }) =>
  A.addTx(d, { type: 'expense', amount: TL(amount), date, ...extra }, TODAY).data;

describe('abonelik avcısı', () => {
  it('3 ay aynı gün aynı tutar → öneri; plan eklenince kaybolur', () => {
    const s = setup();
    let d = s.d;
    for (const m of ['2026-08-14', '2026-09-15', '2026-10-14', '2026-11-14']) d = add(d, m, 59.99, { categoryId: s.cat, accountId: s.bank, note: 'Spotify' });
    const [sug] = recurringSuggestions(d, TODAY);
    expect(sug).toMatchObject({ note: 'Spotify', amount: TL(59.99), months: 4, lastDate: '2026-11-14', nextDue: '2026-12-14', accountId: s.bank });
    d = A.addPlan(d, { kind: 'expense', title: 'Spotify', amount: TL(59.99), accountId: s.bank, categoryId: s.cat, freq: 'monthly', startDate: sug.nextDue, endDate: null, installments: null }).data;
    expect(recurringSuggestions(d, TODAY)).toEqual([]);
  });

  it('notlu ve birebir aynı tutarlı 2 ardışık ay yeter; notsuz 2 ay yetmez', () => {
    const s = setup();
    const noted = add(add(s.d, '2026-10-03', 199, { categoryId: s.cat, accountId: s.bank, note: 'Spor salonu' }), '2026-11-03', 199, { categoryId: s.cat, accountId: s.bank, note: 'spor  salonu' });
    expect(recurringSuggestions(noted, TODAY)).toHaveLength(1);
    const plain = add(add(s.d, '2026-10-03', 199, { categoryId: s.cat, accountId: s.bank }), '2026-11-03', 199, { categoryId: s.cat, accountId: s.bank });
    expect(recurringSuggestions(plain, TODAY)).toEqual([]);
  });

  it('düzensiz olanlar önerilmez: farklı günler, değişken tutar, ayda birden çok, boş ay, eski', () => {
    const s = setup();
    const o = { categoryId: s.cat, accountId: s.bank, note: 'Market' };
    const days = add(add(add(s.d, '2026-09-02', 100, o), '2026-10-20', 100, o), '2026-11-10', 100, o);
    expect(recurringSuggestions(days, TODAY)).toEqual([]);
    const amounts = add(add(add(s.d, '2026-09-05', 100, o), '2026-10-05', 150, o), '2026-11-05', 120, o);
    expect(recurringSuggestions(amounts, TODAY)).toEqual([]);
    const many = add(add(add(add(s.d, '2026-09-05', 100, o), '2026-10-05', 100, o), '2026-11-05', 100, o), '2026-11-07', 100, o);
    expect(recurringSuggestions(many, TODAY)).toEqual([]);
    const gap = add(add(add(s.d, '2026-07-05', 100, o), '2026-09-05', 100, o), '2026-11-05', 100, o);
    expect(recurringSuggestions(gap, TODAY)).toEqual([]);
    const old = add(add(add(s.d, '2026-07-05', 100, o), '2026-08-05', 100, o), '2026-09-05', 100, o);
    expect(recurringSuggestions(old, TODAY)).toEqual([]);
  });

  it('reddedilen öneri bir daha gösterilmez', () => {
    const s = setup();
    let d = s.d;
    for (const m of ['2026-09-01', '2026-10-01', '2026-11-01']) d = add(d, m, 300, { categoryId: s.cat, accountId: s.bank, note: 'Netflix' });
    const [sug] = recurringSuggestions(d, TODAY);
    d = A.updateSettings(d, { hintsSeen: [...d.settings.hintsSeen, RECURRING_DISMISS_PREFIX + sug.key] });
    expect(recurringSuggestions(d, TODAY)).toEqual([]);
  });
});
