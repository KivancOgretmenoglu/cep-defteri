import { describe, expect, it } from 'vitest';
import { emptyData } from './defaults';
import * as A from './actions';
import { spendingGap, spendingPlan } from './spendingPlan';
import { mascotMood } from './mood';
import type { Data } from './types';

const TODAY = '2026-10-15';
const TL = (n: number) => Math.round(n * 100);

function setup(opening = '2026-09-01') {
  let d = emptyData();
  const bank = A.addAccount(d, { name: 'Banka', kind: 'bank', openingBalance: TL(10000), openingDate: opening });
  d = bank.data;
  const cash = A.addAccount(d, { name: 'Nakit', kind: 'cash', openingBalance: TL(500), openingDate: opening });
  d = cash.data;
  const inv = A.addAccount(d, { name: 'Yatırım', kind: 'investment', openingBalance: 0, openingDate: opening });
  d = inv.data;
  return { d, bank: bank.account.id, cash: cash.account.id, inv: inv.account.id };
}
const expense = (d: Data, accountId: string, amount: number, date: string) =>
  A.addTx(d, { type: 'expense', amount: TL(amount), date, accountId, categoryId: 'e-food' }, TODAY);

/** Kira (10'u, 3.000 TL) ve burs (20'si, 1.500 TL) planlı. */
function withPlans() {
  const s = setup();
  let d = s.d;
  const rent = A.addPlan(d, { kind: 'expense', title: 'Kira', amount: TL(3000), accountId: s.bank, categoryId: 'e-housing', freq: 'monthly', startDate: '2026-10-10' });
  d = rent.data;
  d = A.addPlan(d, { kind: 'income', title: 'Burs', amount: TL(1500), accountId: s.bank, categoryId: 'i-scholarship', freq: 'monthly', startDate: '2026-10-20' }).data;
  return { ...s, d, rent: rent.plan.id };
}
const planAt = (d: Data, date: string) => spendingPlan(d, TODAY)!.plan.find((p) => p.date === date)!.value;

describe('harcama eğrisi', () => {
  it('giderler − iadeler; yatırım aktarımı ve transfer harcama sayılmaz', () => {
    let { d, bank, cash, inv } = setup();
    const e = expense(d, bank, 200, '2026-10-03');
    d = e.data;
    d = A.addTx(d, { type: 'refund', amount: TL(50), date: '2026-10-05', accountId: bank, categoryId: 'e-food', refundOf: e.tx.id }, TODAY).data;
    d = A.addTx(d, { type: 'transfer', amount: TL(1000), date: '2026-10-04', accountId: bank, toAccountId: inv }, TODAY).data;
    d = A.addTx(d, { type: 'transfer', amount: TL(100), date: '2026-10-06', accountId: bank, toAccountId: cash }, TODAY).data;
    d = expense(d, cash, 80, '2026-09-30').data; // önceki dönem
    const sp = spendingPlan(d, TODAY)!;
    expect(sp.from).toBe('2026-10-01');
    expect(sp.to).toBe('2026-10-31');
    expect(sp.spending).toHaveLength(15);
    expect(sp.spending[0].value).toBe(0);
    expect(sp.spending.find((p) => p.date === '2026-10-03')!.value).toBe(TL(200));
    expect(sp.spending.find((p) => p.date === '2026-10-04')!.value).toBe(TL(200));
    expect(sp.spending.at(-1)!.value).toBe(TL(150));
  });

  it('bütçe ve taban yoksa plan yok; eğri yine var', () => {
    let { d, bank } = setup();
    d = expense(d, bank, 100, '2026-10-02').data;
    const sp = spendingPlan(d, TODAY)!;
    expect(sp.source).toBeNull();
    expect(sp.plan).toEqual([]);
    expect(sp.spending.at(-1)!.value).toBe(TL(100));
    expect(spendingGap(d, TODAY)).toBeNull();
    expect(spendingPlan(emptyData(), TODAY)).toBeNull();
  });
});

describe('harcama planı', () => {
  it('bütçe: 0’dan bütçeye; planlı giderler vade gününde basamak, gerisi doğrusal', () => {
    let { d } = withPlans();
    d = A.updateSettings(d, { monthlyBudget: TL(7000) });
    const sp = spendingPlan(d, TODAY)!;
    expect(sp.source).toBe('budget');
    expect(sp.allowance).toBe(TL(7000));
    expect(sp.planned).toBe(TL(3000));
    expect(sp.discretionary).toBe(TL(4000));
    expect(sp.plan).toHaveLength(31);
    const perDay = TL(4000) / 31;
    expect(planAt(d, '2026-10-01')).toBe(Math.round(perDay / 100) * 100);
    expect(planAt(d, '2026-10-10') - planAt(d, '2026-10-09')).toBeCloseTo(TL(3000) + perDay, -3);
    // Beklenen gelir harcama planında basamak değildir.
    expect(planAt(d, '2026-10-20') - planAt(d, '2026-10-19')).toBeCloseTo(perDay, -3);
    expect(planAt(d, '2026-10-31')).toBe(TL(7000));
  });

  it('atlanan vade basamak olmaz; gerçekleşen vade işlem gününe ve gerçek tutarına konur', () => {
    let { d, rent } = withPlans();
    d = A.updateSettings(d, { monthlyBudget: TL(7000) });
    d = A.skipOccurrence(d, rent, '2026-10-10');
    expect(spendingPlan(d, TODAY)!.planned).toBe(0);
    d = A.skipOccurrence(d, rent, '2026-10-10', false);
    d = A.confirmOccurrence(d, rent, '2026-10-10', { date: '2026-10-12', amount: TL(2800) }, TODAY).data;
    const sp = spendingPlan(d, TODAY)!;
    expect(sp.planned).toBe(TL(2800));
    expect(planAt(d, '2026-10-12') - planAt(d, '2026-10-11')).toBeGreaterThan(TL(2800));
    expect(planAt(d, '2026-10-10') - planAt(d, '2026-10-09')).toBeLessThan(TL(300));
  });

  it('kira günü kullanıcıyı planın üstünde göstermez', () => {
    let { d, rent } = withPlans();
    d = A.updateSettings(d, { monthlyBudget: TL(7000) });
    d = A.confirmOccurrence(d, rent, '2026-10-10', {}, TODAY).data;
    const g = spendingGap(d, TODAY)!;
    expect(g.actual).toBe(TL(3000));
    expect(g.state).toBe('under');
    expect(mascotMood(d, TODAY).mood).not.toBe('thoughtful');
  });

  it('planlı giderler bütçeyi aşarsa esnek pay 0 ve ulaşılamaz', () => {
    let { d } = withPlans();
    d = A.updateSettings(d, { monthlyBudget: TL(2000) });
    const sp = spendingPlan(d, TODAY)!;
    expect(sp.reachable).toBe(false);
    expect(sp.discretionary).toBe(0);
    expect(planAt(d, '2026-10-09')).toBe(0);
    expect(planAt(d, '2026-10-31')).toBe(TL(3000));
  });

  it('taban: hak = başlangıç + beklenen gelir − planlı yatırım aktarımı − taban', () => {
    let { d, bank, inv } = withPlans();
    d = A.addPlan(d, { kind: 'transfer', title: 'Fon', amount: TL(1000), accountId: bank, toAccountId: inv, freq: 'monthly', startDate: '2026-10-25' }).data;
    d = A.updateSettings(d, { monthEndFloor: TL(2000) });
    const sp = spendingPlan(d, TODAY)!;
    expect(sp.source).toBe('floor');
    // 10.500 + 1.500 − 1.000 − 2.000
    expect(sp.allowance).toBe(TL(9000));
    expect(sp.discretionary).toBe(TL(6000));
    expect(planAt(d, '2026-10-31')).toBe(TL(9000));
    // Bütçe varsa bütçe önceliklidir.
    d = A.updateSettings(d, { monthlyBudget: TL(5000) });
    expect(spendingPlan(d, TODAY)!.source).toBe('budget');
  });

  it('taban çok yüksekse hak 0 olur (negatif değil)', () => {
    let { d } = setup();
    d = A.updateSettings(d, { monthEndFloor: TL(50000) });
    const sp = spendingPlan(d, TODAY)!;
    expect(sp.allowance).toBe(0);
    expect(sp.plan.at(-1)!.value).toBe(0);
  });

  it('30 günlük mod: ilk hesaptan itibaren 30 günlük dilim', () => {
    let { d } = setup();
    d = A.updateSettings(d, { periodMode: 'days30', monthlyBudget: TL(3000) });
    const sp = spendingPlan(d, TODAY)!;
    expect(sp.from).toBe('2026-10-01');
    expect(sp.to).toBe('2026-10-30');
    expect(sp.plan).toHaveLength(30);
    expect(sp.plan[0].value).toBe(TL(100));
    expect(sp.plan.at(-1)!.value).toBe(TL(3000));
  });

  it('ay ortasında başlayan takip: ilk günden başlar, esnek pay kapsanan günlere oranlanır', () => {
    let { d } = setup('2026-10-11');
    d = A.updateSettings(d, { monthlyBudget: TL(3100) });
    const sp = spendingPlan(d, TODAY)!;
    expect(sp.from).toBe('2026-10-11');
    expect(sp.spending).toHaveLength(5);
    expect(sp.plan).toHaveLength(21);
    expect(sp.plan[0].value).toBe(TL(100));
    expect(sp.plan.at(-1)!.value).toBe(TL(2100));
  });
});

describe('maskot: harcama planı kuralı', () => {
  function budgeted(spent: number) {
    let { d, bank } = setup();
    d = A.updateSettings(d, { monthlyBudget: TL(3100) });
    if (spent) d = expense(d, bank, spent, '2026-10-13').data;
    return d;
  }
  it('planın belirgin üstünde: düşünceli, tek cümle, sayılar ve kural why içinde', () => {
    const d = budgeted(2000); // plan 1.500, eşik 310
    expect(spendingGap(d, TODAY)!.state).toBe('over');
    const m = mascotMood(d, TODAY);
    expect(m.mood).toBe('thoughtful');
    expect(m.text).toContain('plandan');
    expect(m.text).not.toMatch(/\d/);
    expect(m.why).toContain('500 TL');
    expect(m.why).toContain('Kural');
    expect(mascotMood(d, TODAY, 'en').text).toContain('ahead of plan');
  });
  it('fark eşiğin altındaysa tetiklenmez', () => {
    const d = budgeted(1700);
    expect(spendingGap(d, TODAY)!.state).toBe('on');
    expect(mascotMood(d, TODAY).text).not.toContain('plandan');
  });
  it('rahatça altında: mutlu satır', () => {
    const d = budgeted(500);
    expect(spendingGap(d, TODAY)!.state).toBe('under');
    expect(mascotMood(d, TODAY).mood).toBe('happy');
  });
  it('taban modunda gizli bakiyede tutar görünmez; yatırım aktarımı tetiklemez', () => {
    let { d, bank, inv } = setup();
    d = A.updateSettings(d, { monthEndFloor: TL(2500), hideTotals: true });
    const withInvest = A.addTx(d, { type: 'transfer', amount: TL(5000), date: '2026-10-13', accountId: bank, toAccountId: inv }, TODAY).data;
    expect(mascotMood(withInvest, TODAY).text).not.toContain('plandan');
    d = expense(d, bank, 5000, '2026-10-13').data; // hak 8.000, plan ≈ 3.871, eşik 800
    const m = mascotMood(d, TODAY);
    expect(m.mood).toBe('thoughtful');
    expect(m.text).toContain('plandan');
    expect(m.why).not.toContain('5.000');
  });
  it('ödemeler bakiyeyi aşıyorsa o uyarı önce gelir', () => {
    let d = budgeted(2000);
    const bank = d.accounts.find((a) => a.kind === 'bank')!.id;
    d = A.addPlan(d, { kind: 'expense', title: 'Fatura', amount: TL(9000), accountId: bank, categoryId: 'e-bills', freq: 'once', startDate: '2026-10-25' }).data;
    expect(mascotMood(d, TODAY).text).toContain('Yaklaşan ödemeler');
  });
});
