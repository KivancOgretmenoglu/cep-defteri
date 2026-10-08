import { describe, expect, it } from 'vitest';
import { emptyData } from './defaults';
import * as A from './actions';
import { planGap, planLine, planPeriod, suggestedFloor } from './planLine';
import { mascotMood } from './mood';
import { parseBackup, serializeBackup } from './backup';
import type { Data } from './types';

const TODAY = '2026-10-15';
const TL = (n: number) => Math.round(n * 100);

function setup(opening = '2026-09-01') {
  let d = emptyData();
  const bank = A.addAccount(d, { name: 'Banka', kind: 'bank', openingBalance: TL(10000), openingDate: opening });
  d = bank.data;
  const inv = A.addAccount(d, { name: 'Yatırım', kind: 'investment', openingBalance: 0, openingDate: opening });
  d = inv.data;
  return { d, bank: bank.account.id, inv: inv.account.id };
}

/** Kira (10'u, 3.000) ve burs (20'si, 1.500) planlı; taban 2.000. */
function withPlans() {
  const s = setup();
  let d = s.d;
  const rent = A.addPlan(d, { kind: 'expense', title: 'Kira', amount: TL(3000), accountId: s.bank, categoryId: 'e-housing', freq: 'monthly', startDate: '2026-10-10' });
  d = rent.data;
  d = A.addPlan(d, { kind: 'income', title: 'Burs', amount: TL(1500), accountId: s.bank, categoryId: 'i-scholarship', freq: 'monthly', startDate: '2026-10-20' }).data;
  d = A.updateSettings(d, { monthEndFloor: TL(2000) });
  return { ...s, d, rent: rent.plan.id };
}
const at = (d: Data, date: string) => planLine(d, TODAY)!.points.find((p) => p.date === date)!.balance;

describe('harcama planı çizgisi', () => {
  it('başlangıçtan tabana iner; planlı kalemler vade gününde basamak olur', () => {
    const { d } = withPlans();
    const l = planLine(d, TODAY)!;
    expect(l.from).toBe('2026-10-01');
    expect(l.to).toBe('2026-10-31');
    expect(l.start).toBe(TL(10000));
    expect(l.plannedNetOut).toBe(TL(1500));
    expect(l.discretionary).toBe(TL(6500));
    expect(l.reachable).toBe(true);
    expect(l.points).toHaveLength(31);
    const perDay = TL(6500) / 31;
    expect(at(d, '2026-10-01')).toBe(Math.round((TL(10000) - perDay) / 100) * 100);
    // Kira günü: bir günlük esnek pay + 3.000 TL basamak
    expect(at(d, '2026-10-09') - at(d, '2026-10-10')).toBeCloseTo(perDay + TL(3000), -3);
    // Burs günü yukarı basamak
    expect(at(d, '2026-10-20') - at(d, '2026-10-19')).toBeCloseTo(TL(1500) - perDay, -3);
    expect(at(d, '2026-10-31')).toBe(TL(2000));
  });

  it('atlanan vade basamak olmaz; gerçekleşen vade işlem gününe konur', () => {
    let { d, rent } = withPlans();
    d = A.skipOccurrence(d, rent, '2026-10-10');
    expect(planLine(d, TODAY)!.plannedNetOut).toBe(-TL(1500));
    d = A.skipOccurrence(d, rent, '2026-10-10', false);
    d = A.confirmOccurrence(d, rent, '2026-10-10', { date: '2026-10-12' }, TODAY).data;
    const l = planLine(d, TODAY)!;
    expect(l.plannedNetOut).toBe(TL(1500));
    expect(at(d, '2026-10-11') - at(d, '2026-10-12')).toBeGreaterThan(TL(3000));
    expect(at(d, '2026-10-09') - at(d, '2026-10-10')).toBeLessThan(TL(300));
  });

  it('kira günü kullanıcıyı planın altında göstermez', () => {
    let { d, rent } = withPlans();
    d = A.confirmOccurrence(d, rent, '2026-10-10', {}, TODAY).data;
    const g = planGap(d, TODAY)!;
    expect(g.actual).toBe(TL(7000));
    expect(g.state).toBe('above');
    expect(mascotMood(d, TODAY).mood).not.toBe('thoughtful');
  });

  it('taban, planlardan sonra bile başlangıçtan yüksekse çizgi düz ve ulaşılamaz', () => {
    let { d } = withPlans();
    d = A.updateSettings(d, { monthEndFloor: TL(20000) });
    const l = planLine(d, TODAY)!;
    expect(l.reachable).toBe(false);
    expect(l.discretionary).toBe(0);
    expect(at(d, '2026-10-05')).toBe(TL(10000));
    expect(at(d, '2026-10-31')).toBe(TL(8500));
  });

  it('30 günlük mod: ilk hesaptan itibaren art arda 30 günlük dilimler', () => {
    let { d } = withPlans();
    d = A.updateSettings(d, { periodMode: 'days30' });
    expect(planPeriod(d, TODAY)).toEqual({ from: '2026-10-01', to: '2026-10-30' });
    expect(planPeriod(d, '2026-09-30')).toEqual({ from: '2026-09-01', to: '2026-09-30' });
    expect(planLine(d, TODAY)!.points.at(-1)!.balance).toBe(TL(2000));
  });

  it('dönem ortasında açılan hesap: ilk veri gününden başlar, sonraki açılışlar basamak olur', () => {
    let { d } = setup('2026-10-05');
    d = A.addAccount(d, { name: 'Nakit', kind: 'cash', openingBalance: TL(500), openingDate: '2026-10-12' }).data;
    d = A.updateSettings(d, { monthEndFloor: TL(1000) });
    const l = planLine(d, TODAY)!;
    expect(l.from).toBe('2026-10-05');
    expect(l.start).toBe(TL(10000));
    expect(l.plannedNetOut).toBe(-TL(500));
    expect(l.points.at(-1)!.balance).toBe(TL(1000));
  });

  it('taban yoksa ya da günlük hesap yoksa çizgi yok', () => {
    expect(planLine(setup().d, TODAY)).toBeNull();
    const d = A.updateSettings(emptyData(), { monthEndFloor: TL(100) });
    expect(planLine(d, TODAY)).toBeNull();
    expect(planGap(d, TODAY)).toBeNull();
  });

  it('öneri: bütçe varsa başlangıç − bütçe + beklenen gelir (100 TL’ye yuvarlı)', () => {
    let { d } = withPlans();
    expect(suggestedFloor(d, TODAY)).toBeNull();
    d = A.updateSettings(d, { monthlyBudget: TL(7000) });
    expect(suggestedFloor(d, TODAY)).toBe(TL(4500));
    d = A.updateSettings(d, { monthlyBudget: TL(20000) });
    expect(suggestedFloor(d, TODAY)).toBe(0);
  });
});

describe('ayar doğrulama', () => {
  it('negatif taban reddedilir, null kabul edilir', () => {
    const d = emptyData();
    expect(() => A.updateSettings(d, { monthEndFloor: -1 })).toThrow();
    expect(() => A.updateSettings(d, { monthEndFloor: 1.5 })).toThrow();
    expect(A.updateSettings(d, { monthEndFloor: 0 }).settings.monthEndFloor).toBe(0);
    expect(A.updateSettings(d, { monthEndFloor: null }).settings.monthEndFloor).toBeNull();
  });
  it('yedekte taban: null ya da negatif olmayan tutar', () => {
    const { d } = withPlans();
    const r = parseBackup(serializeBackup(d));
    expect(r.ok && r.data.settings.monthEndFloor).toBe(TL(2000));
    const bad = JSON.parse(serializeBackup(d));
    bad.data.settings.monthEndFloor = -5;
    expect(parseBackup(JSON.stringify(bad)).ok).toBe(false);
    delete bad.data.settings.monthEndFloor;
    const old = parseBackup(JSON.stringify(bad));
    expect(old.ok && old.data.settings.monthEndFloor).toBeNull();
  });
});

describe('maskot: plan çizgisi kuralı', () => {
  function spent() {
    let { d, bank, rent } = withPlans();
    d = A.confirmOccurrence(d, rent, '2026-10-10', {}, TODAY).data;
    d = A.addTx(d, { type: 'expense', amount: TL(6000), date: '2026-10-13', accountId: bank, categoryId: 'e-food' }, TODAY).data;
    return d;
  }
  it('çizginin belirgin altında: düşünceli, tek kısa cümle, gerekçe ve kural why içinde', () => {
    const m = mascotMood(spent(), TODAY);
    expect(m.mood).toBe('thoughtful');
    expect(m.text).toContain('Plan çizgisinin altına');
    expect(m.text).not.toMatch(/\d/);
    expect(m.why).toContain('1.000 TL');
    expect(m.why).toContain('Kural');
    expect(mascotMood(spent(), TODAY, 'en').text).toContain('plan line');
  });
  it('bakiye gizliyken tutarlar görünmez', () => {
    const d = A.updateSettings(spent(), { hideTotals: true });
    const m = mascotMood(d, TODAY);
    expect(m.mood).toBe('thoughtful');
    expect(m.text).toContain('Plan çizgisinin altına');
    expect(m.why).not.toContain('1.000 TL');
    expect(m.why).not.toContain('3.855');
  });
  it('fark küçükse (eşik altında) bu kural tetiklenmez', () => {
    let { d, bank, rent } = withPlans();
    d = A.confirmOccurrence(d, rent, '2026-10-10', {}, TODAY).data;
    // hedef ≈ 3.855 TL; eşik 800 TL. 3.400 TL harcama → bakiye 3.600 (≈255 TL altında)
    d = A.addTx(d, { type: 'expense', amount: TL(3400), date: '2026-10-13', accountId: bank, categoryId: 'e-food' }, TODAY).data;
    expect(planGap(d, TODAY)!.state).toBe('on');
    expect(mascotMood(d, TODAY).text).not.toContain('Plan çizgisi');
  });
  it('ulaşılamaz tabanda yargı yok', () => {
    const d = A.updateSettings(spent(), { monthEndFloor: TL(20000) });
    expect(mascotMood(d, TODAY).text).not.toContain('Plan çizgisi');
  });
  it('ödemeler bakiyeyi aşıyorsa o uyarı önce gelir', () => {
    let d = spent();
    const bank = d.accounts.find((a) => a.kind === 'bank')!.id;
    d = A.addPlan(d, { kind: 'expense', title: 'Fatura', amount: TL(5000), accountId: bank, categoryId: 'e-bills', freq: 'once', startDate: '2026-10-25' }).data;
    expect(mascotMood(d, TODAY).text).toContain('Yaklaşan ödemeler');
  });
});
