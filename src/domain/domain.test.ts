import { describe, expect, it } from 'vitest';
import { emptyData } from './defaults';
import * as A from './actions';
import * as L from './ledger';
import { clawdMood } from './mood';
import { parseMoney, formatMoney } from './money';
import { parseBackup, serializeBackup, transactionsCSV } from './backup';
import type { Data } from './types';

const TODAY = '2026-10-15';
const TL = (n: number) => Math.round(n * 100);

function setup() {
  let d = emptyData();
  const bank = A.addAccount(d, { name: 'Banka', kind: 'bank', openingBalance: TL(10000), openingDate: '2026-09-01' });
  d = bank.data;
  const cash = A.addAccount(d, { name: 'Nakit', kind: 'cash', openingBalance: 0, openingDate: '2026-09-01' });
  d = cash.data;
  const inv = A.addAccount(d, { name: 'Yatırım', kind: 'investment', openingBalance: 0, openingDate: '2026-09-01' });
  d = inv.data;
  return { d, bank: bank.account.id, cash: cash.account.id, inv: inv.account.id };
}
const add = (d: Data, draft: A.TxDraft) => A.addTx(d, draft, TODAY);

describe('para', () => {
  it('Türkçe yazılmış tutarları kuruşa çevirir', () => {
    expect(parseMoney('1.234,56')).toBe(123456);
    expect(parseMoney('45,5')).toBe(4550);
    expect(parseMoney('1.250')).toBe(125000);
    expect(parseMoney('12.5')).toBe(1250);
    expect(parseMoney('0,1')).toBe(10);
    expect(parseMoney('3000')).toBe(300000);
    expect(parseMoney('0')).toBeNull();
    expect(parseMoney('-5')).toBeNull();
    expect(parseMoney('1,234,5')).toBeNull();
    expect(parseMoney('12,345')).toBeNull();
    expect(parseMoney('abc')).toBeNull();
  });
  it('kayan nokta hatası olmadan toplar', () => {
    let { d, bank } = setup();
    for (let i = 0; i < 10; i++) d = add(d, { type: 'expense', amount: parseMoney('0,1')!, date: TODAY, accountId: bank, categoryId: 'e-food' }).data;
    // 10 × 0,10 TL = tam 1,00 TL
    expect(L.monthSummary(d, '2026-10').spending).toBe(100);
    expect(formatMoney(100)).toBe('1 TL');
    expect(formatMoney(-123456, { compact: false })).toBe('−1.234,56 TL');
  });
});

describe('hesap ve özet kuralları', () => {
  it('açılış bakiyesi gelir sayılmaz', () => {
    const { d, bank } = setup();
    expect(L.cashBalance(d, bank)).toBe(TL(10000));
    expect(L.monthSummary(d, '2026-09').income).toBe(0);
    expect(L.dailyBalance(d)).toBe(TL(10000));
  });

  it('gelir ve gider doğru hesabı, dönemi ve raporu günceller', () => {
    let { d, bank, cash } = setup();
    d = add(d, { type: 'income', amount: TL(2500), date: '2026-10-05', accountId: bank, categoryId: 'i-scholarship' }).data;
    d = add(d, { type: 'expense', amount: TL(120), date: '2026-10-06', accountId: cash, categoryId: 'e-food' }).data;
    d = add(d, { type: 'expense', amount: TL(80), date: '2026-09-20', accountId: bank, categoryId: 'e-market' }).data;
    expect(L.cashBalance(d, bank)).toBe(TL(10000 + 2500 - 80));
    expect(L.cashBalance(d, cash)).toBe(TL(-120));
    const oct = L.monthSummary(d, '2026-10');
    expect(oct.income).toBe(TL(2500));
    expect(oct.spending).toBe(TL(120));
    expect(oct.incomeBySource.get('i-scholarship')).toBe(TL(2500));
    expect(oct.spendingByCategory.get('e-food')).toBe(TL(120));
    expect(L.monthSummary(d, '2026-09').spending).toBe(TL(80));
  });

  it('10.000 TL bankadan 3.000 TL yatırıma: banka 7.000, katkı 3.000, tüketim 0, toplam 10.000', () => {
    let { d, bank, inv } = setup();
    d = add(d, { type: 'transfer', amount: TL(3000), date: '2026-10-10', accountId: bank, toAccountId: inv }).data;
    const st = L.investmentState(d, inv)!;
    expect(L.cashBalance(d, bank)).toBe(TL(7000));
    expect(st.currentValue).toBe(TL(3000));
    const oct = L.monthSummary(d, '2026-10');
    expect(oct.contributions).toBe(TL(3000));
    expect(oct.spending).toBe(0);
    expect(oct.income).toBe(0);
    expect(L.dailyBalance(d) + L.investmentTotal(d)).toBe(TL(10000));
    expect(st.netContribution).toBe(TL(3000));
  });

  it('hesaplar arası transfer ve yatırımdan çekim gelir üretmez', () => {
    let { d, bank, cash, inv } = setup();
    d = add(d, { type: 'transfer', amount: TL(500), date: '2026-10-02', accountId: bank, toAccountId: cash }).data;
    d = add(d, { type: 'transfer', amount: TL(3000), date: '2026-10-03', accountId: bank, toAccountId: inv }).data;
    d = add(d, { type: 'transfer', amount: TL(1000), date: '2026-10-08', accountId: inv, toAccountId: bank }).data;
    const oct = L.monthSummary(d, '2026-10');
    expect(oct.income).toBe(0);
    expect(oct.spending).toBe(0);
    expect(oct.withdrawals).toBe(TL(1000));
    expect(L.cashBalance(d, bank)).toBe(TL(10000 - 500 - 3000 + 1000));
    expect(L.cashBalance(d, cash)).toBe(TL(500));
    const st = L.investmentState(d, inv)!;
    expect(st.contributed).toBe(TL(3000));
    expect(st.withdrawn).toBe(TL(1000));
    expect(st.netContribution).toBe(TL(2000));
    expect(st.currentValue).toBe(TL(2000));
    expect(L.dailyBalance(d) + L.investmentTotal(d)).toBe(TL(10000));
  });

  it('yatırım değeri güncellemesi katkıyı ve harcanabilir bakiyeyi değiştirmez', () => {
    let { d, bank, inv } = setup();
    d = add(d, { type: 'transfer', amount: TL(3000), date: '2026-10-01', accountId: bank, toAccountId: inv }).data;
    const before = L.dailyBalance(d);
    d = A.addValuation(d, { accountId: inv, date: '2026-10-10', value: TL(3300) }, TODAY).data;
    const st = L.investmentState(d, inv)!;
    expect(st.currentValue).toBe(TL(3300));
    expect(st.contributed).toBe(TL(3000));
    expect(st.valueDiff).toBe(TL(300));
    expect(L.dailyBalance(d)).toBe(before);
    expect(L.monthSummary(d, '2026-10').income).toBe(0);
  });

  it('değerlemeden sonraki katkı/çekim eski değere eklenir (tutarsız toplam yok)', () => {
    let { d, bank, inv } = setup();
    d = add(d, { type: 'transfer', amount: TL(3000), date: '2026-10-01', accountId: bank, toAccountId: inv }).data;
    d = A.addValuation(d, { accountId: inv, date: '2026-10-05', value: TL(2800) }, TODAY).data;
    // aynı gün, değerlemeden SONRA girilen katkı
    d = add(d, { type: 'transfer', amount: TL(1000), date: '2026-10-05', accountId: bank, toAccountId: inv }).data;
    d = add(d, { type: 'transfer', amount: TL(500), date: '2026-10-07', accountId: inv, toAccountId: bank }).data;
    let st = L.investmentState(d, inv)!;
    expect(st.lastValuation.value).toBe(TL(2800));
    expect(st.flowsSinceValuation).toBe(TL(500));
    expect(st.currentValue).toBe(TL(3300));
    // geçmiş tarihli (değerlemeden önceki) katkı değerlemenin içinde sayılır
    d = add(d, { type: 'transfer', amount: TL(200), date: '2026-10-02', accountId: bank, toAccountId: inv }).data;
    st = L.investmentState(d, inv)!;
    expect(st.currentValue).toBe(TL(3300));
    expect(st.contributed).toBe(TL(4200));
    // Değer düşüşü harcama ya da gelir yaratmaz
    expect(L.monthSummary(d, '2026-10').spending).toBe(0);
  });

  it('takip öncesi yatırım: açılış değeri ve geçmiş katkı ayrı; katkı bilinmiyorsa kâr hesaplanmaz', () => {
    let d = emptyData();
    d = A.addAccount(d, { name: 'Banka', kind: 'bank', openingBalance: TL(1000), openingDate: '2026-10-01' }).data;
    const r = A.addAccount(d, { name: 'Fon', kind: 'investment', openingBalance: TL(5500), openingDate: '2026-10-01', priorContribution: null });
    d = r.data;
    let st = L.investmentState(d, r.account.id)!;
    expect(st.currentValue).toBe(TL(5500));
    expect(st.contributed).toBe(0);
    expect(st.valueDiff).toBeNull();
    expect(L.monthSummary(d, '2026-10').income).toBe(0);
    d = A.updateAccount(d, r.account.id, { name: 'Fon', kind: 'investment', openingBalance: TL(5500), openingDate: '2026-10-01', priorContribution: TL(5000) });
    st = L.investmentState(d, r.account.id)!;
    expect(st.basis).toBe(TL(5000));
    expect(st.valueDiff).toBe(TL(500));
  });

  it('iade özgün giderin kategorisini azaltır, gelir yaratmaz', () => {
    let { d, bank } = setup();
    const e = add(d, { type: 'expense', amount: TL(600), date: '2026-10-03', accountId: bank, categoryId: 'e-clothes' });
    d = e.data;
    d = add(d, { type: 'refund', amount: TL(200), date: '2026-10-09', accountId: bank, categoryId: 'e-clothes', refundOf: e.tx.id }).data;
    const oct = L.monthSummary(d, '2026-10');
    expect(oct.spending).toBe(TL(400));
    expect(oct.spendingByCategory.get('e-clothes')).toBe(TL(400));
    expect(oct.income).toBe(0);
    expect(L.cashBalance(d, bank)).toBe(TL(10000 - 400));
    expect(() => add(d, { type: 'refund', amount: TL(401), date: '2026-10-09', accountId: bank, categoryId: 'e-clothes', refundOf: e.tx.id })).toThrow();
    // Gider düzenlenip kategorisi değişirse iade de onu izler
    d = A.updateTx(d, e.tx.id, { type: 'expense', amount: TL(600), date: '2026-10-03', accountId: bank, categoryId: 'e-gift' }, TODAY);
    const oct2 = L.monthSummary(d, '2026-10');
    expect(oct2.spendingByCategory.get('e-gift')).toBe(TL(400));
    expect(oct2.spendingByCategory.get('e-clothes') ?? 0).toBe(0);
    // Gider silinirse iadesi de silinir: bakiye eski haline döner
    const del = A.deleteTx(d, e.tx.id);
    expect(del.removed).toHaveLength(2);
    expect(L.cashBalance(del.data, bank)).toBe(TL(10000));
    expect(L.monthSummary(del.data, '2026-10').spending).toBe(0);
  });

  it('düzenleme ve silme bakiyeleri ve raporları tutarlı günceller', () => {
    let { d, bank, cash } = setup();
    const e = add(d, { type: 'expense', amount: TL(100), date: '2026-10-03', accountId: bank, categoryId: 'e-food' });
    d = e.data;
    d = A.updateTx(d, e.tx.id, { type: 'expense', amount: TL(150), date: '2026-09-28', accountId: cash, categoryId: 'e-market' }, TODAY);
    expect(L.cashBalance(d, bank)).toBe(TL(10000));
    expect(L.cashBalance(d, cash)).toBe(TL(-150));
    expect(L.monthSummary(d, '2026-10').spending).toBe(0);
    expect(L.monthSummary(d, '2026-09').spendingByCategory.get('e-market')).toBe(TL(150));
    d = A.deleteTx(d, e.tx.id).data;
    expect(L.cashBalance(d, cash)).toBe(0);
    expect(L.monthSummary(d, '2026-09').spending).toBe(0);
  });

  it('geçersiz kayıtları reddeder', () => {
    const { d, bank, inv } = setup();
    expect(() => add(d, { type: 'expense', amount: 0, date: TODAY, accountId: bank, categoryId: 'e-food' })).toThrow();
    expect(() => add(d, { type: 'expense', amount: 100, date: '2026-10-16', accountId: bank, categoryId: 'e-food' })).toThrow(/Gelecek/);
    expect(() => add(d, { type: 'expense', amount: 100, date: '2026-08-31', accountId: bank, categoryId: 'e-food' })).toThrow(/takip/);
    expect(() => add(d, { type: 'expense', amount: 100, date: TODAY, accountId: inv, categoryId: 'e-food' })).toThrow(/Yatırım/);
    expect(() => add(d, { type: 'income', amount: 100, date: TODAY, accountId: bank, categoryId: 'e-food' })).toThrow(/Kategori/);
    expect(() => add(d, { type: 'transfer', amount: 100, date: TODAY, accountId: bank, toAccountId: bank })).toThrow();
  });
});

describe('planlar ve kullanılabilir para', () => {
  function withPlans() {
    let { d, bank, cash, inv } = setup();
    const yurt = A.addPlan(d, { kind: 'expense', title: 'Yurt', amount: TL(4000), accountId: bank, categoryId: 'e-housing', freq: 'monthly', startDate: '2026-09-20' });
    d = yurt.data;
    const burs = A.addPlan(d, { kind: 'income', title: 'Burs', amount: TL(3000), accountId: bank, categoryId: 'i-scholarship', freq: 'monthly', startDate: '2026-10-25' });
    d = burs.data;
    return { d, bank, cash, inv, yurt: yurt.plan, burs: burs.plan };
  }

  it('beklenen gelir bakiyeyi artırmaz; vadesi gelen ödeme kendiliğinden gerçekleşmez', () => {
    const { d, bank } = withPlans();
    expect(L.cashBalance(d, bank)).toBe(TL(10000));
    expect(L.monthSummary(d, '2026-10').income).toBe(0);
    const av = L.availability(d, TODAY);
    // Eylül (gecikmiş) ve Ekim yurt ödemeleri bekliyor
    expect(av.payments.map((o) => o.due)).toEqual(['2026-09-20', '2026-10-20']);
    expect(av.available).toBe(TL(10000 - 8000));
    expect(av.expectedTotal).toBe(TL(3000));
  });

  it('öngörülen ödeme gerçekleşince kullanılabilir paradan iki kez düşülmez', () => {
    let { d, yurt } = withPlans();
    d = A.skipOccurrence(d, yurt.id, '2026-09-20');
    const before = L.availability(d, TODAY);
    expect(before.available).toBe(TL(6000));
    // Ödeme farklı tutarla erken gerçekleşti
    d = A.confirmOccurrence(d, yurt.id, '2026-10-20', { amount: TL(4200) }, TODAY).data;
    const after = L.availability(d, TODAY);
    expect(after.dailyBalance).toBe(TL(10000 - 4200));
    expect(after.payments).toHaveLength(0);
    expect(after.available).toBe(TL(5800));
    // Aynı vade ikinci kez onaylanamaz
    expect(() => A.confirmOccurrence(d, yurt.id, '2026-10-20', {}, TODAY)).toThrow();
    // İşlem silinirse vade yeniden beklemeye döner
    const tx = d.txs.find((t) => t.planRef)!;
    d = A.deleteTx(d, tx.id).data;
    expect(L.availability(d, TODAY).available).toBe(TL(6000));
  });

  it('planın günü değişse de aynı ayın ödemesi tekrar beklenmez', () => {
    let { d, yurt, bank } = withPlans();
    d = A.confirmOccurrence(d, yurt.id, '2026-09-20', {}, TODAY).data;
    d = A.confirmOccurrence(d, yurt.id, '2026-10-20', {}, TODAY).data;
    d = A.updatePlan(d, yurt.id, { kind: 'expense', title: 'Yurt', amount: TL(4000), accountId: bank, categoryId: 'e-housing', freq: 'monthly', startDate: '2026-09-25' });
    expect(L.availability(d, TODAY).payments).toHaveLength(0);
  });

  it('ayın 31i olmayan aylarda son güne kayar; haftalık plan doğru üretilir', () => {
    const plan = { id: 'p', kind: 'expense', title: 'x', amount: 1, accountId: 'a', categoryId: 'c', freq: 'monthly', startDate: '2026-01-31', skipped: [], createdAt: 0 } as const;
    expect(L.planDueDates({ ...plan, skipped: [] }, '2026-01-01', '2026-04-30')).toEqual(['2026-01-31', '2026-02-28', '2026-03-31', '2026-04-30']);
    expect(L.planDueDates({ ...plan, skipped: [], freq: 'weekly', startDate: '2026-10-01' }, '2026-10-10', '2026-10-31')).toEqual(['2026-10-15', '2026-10-22', '2026-10-29']);
  });

  it('birikim payı ve planlı yatırım aktarımı ayrı düşülür; yapılmış aktarım tekrar düşülmez', () => {
    let { d, bank, inv } = setup();
    d = A.updateSettings(d, { reserve: TL(1000) });
    const p = A.addPlan(d, { kind: 'transfer', title: 'Aylık yatırım', amount: TL(2000), accountId: bank, toAccountId: inv, freq: 'monthly', startDate: '2026-10-28' });
    d = p.data;
    expect(L.availability(d, TODAY).available).toBe(TL(10000 - 1000 - 2000));
    d = A.confirmOccurrence(d, p.plan.id, '2026-10-28', {}, TODAY).data;
    const av = L.availability(d, TODAY);
    expect(av.dailyBalance).toBe(TL(8000));
    expect(av.available).toBe(TL(8000 - 1000));
    expect(L.monthSummary(d, '2026-10').spending).toBe(0);
    expect(L.investmentState(d, inv)!.contributed).toBe(TL(2000));
  });
});

describe('bütçe', () => {
  it('planlı ödemeyi esnek tempodan ayırır', () => {
    let { d, bank } = setup();
    d = A.updateSettings(d, { monthlyBudget: TL(6000) });
    const yurt = A.addPlan(d, { kind: 'expense', title: 'Yurt', amount: TL(3000), accountId: bank, categoryId: 'e-housing', freq: 'monthly', startDate: '2026-10-02' });
    d = yurt.data;
    d = A.confirmOccurrence(d, yurt.plan.id, '2026-10-02', {}, TODAY).data;
    d = add(d, { type: 'expense', amount: TL(1200), date: '2026-10-10', accountId: bank, categoryId: 'e-food' }).data;
    const b = L.budgetStatus(d, '2026-10', TODAY);
    expect(b.spent).toBe(TL(4200));
    expect(b.plannedSpent).toBe(TL(3000));
    expect(b.flexibleBudget).toBe(TL(3000));
    expect(b.flexUsedPct).toBe(40);
    expect(b.elapsedPct).toBe(48);
    expect(b.state).toBe('on-track');
    expect(clawdMood(d, TODAY).mood).toBe('happy');
  });

  it('kategori limiti %70 ve %100 eşiklerinde uyarır', () => {
    let { d, bank } = setup();
    d = A.updateCategory(d, 'e-food', { limit: TL(1000) });
    d = add(d, { type: 'expense', amount: TL(700), date: '2026-10-10', accountId: bank, categoryId: 'e-food' }).data;
    expect(L.budgetStatus(d, '2026-10', TODAY).categories[0]).toMatchObject({ pct: 70, level: 'near' });
    d = add(d, { type: 'expense', amount: TL(400), date: '2026-10-11', accountId: bank, categoryId: 'e-food' }).data;
    expect(L.budgetStatus(d, '2026-10', TODAY).categories[0]).toMatchObject({ pct: 110, level: 'over' });
  });
});

describe('Clawd', () => {
  it('veri yokken meraklı, bütçe yokken yargısız', () => {
    expect(clawdMood(emptyData(), TODAY).mood).toBe('curious');
    let { d, bank } = setup();
    expect(clawdMood(d, TODAY).mood).toBe('curious');
    d = add(d, { type: 'expense', amount: TL(9000), date: '2026-10-10', accountId: bank, categoryId: 'e-fun' }).data;
    const m = clawdMood(d, TODAY);
    expect(m.mood).toBe('calm');
    expect(m.why).toMatch(/Bütçe tanımlı olmadığı/);
  });

  it('planlı büyük ödeme ve yatırım katkısı nedeniyle olumsuz olmaz', () => {
    let { d, bank, inv } = setup();
    d = A.updateSettings(d, { monthlyBudget: TL(8000) });
    const yurt = A.addPlan(d, { kind: 'expense', title: 'Yurt', amount: TL(5000), accountId: bank, categoryId: 'e-housing', freq: 'once', startDate: '2026-10-03' });
    d = A.confirmOccurrence(yurt.data, yurt.plan.id, '2026-10-03', {}, TODAY).data;
    d = add(d, { type: 'transfer', amount: TL(4000), date: '2026-10-04', accountId: bank, toAccountId: inv }).data;
    d = add(d, { type: 'expense', amount: TL(500), date: '2026-10-05', accountId: bank, categoryId: 'e-food' }).data;
    const m = clawdMood(d, TODAY);
    expect(m.mood).not.toBe('thoughtful');
  });

  it('yatırım değeri düşüşü olumsuz yorum üretmez; aynı veriyle aynı sonuç', () => {
    let { d, bank, inv } = setup();
    d = add(d, { type: 'transfer', amount: TL(3000), date: '2026-10-01', accountId: bank, toAccountId: inv }).data;
    d = A.addValuation(d, { accountId: inv, date: '2026-10-10', value: TL(1500) }, TODAY).data;
    const a = clawdMood(d, TODAY);
    expect(a.mood).not.toBe('thoughtful');
    expect(clawdMood(d, TODAY)).toEqual(a);
  });

  it('hedefe yeni ulaşıldığında kutlar', () => {
    let { d, bank, inv } = setup();
    d = A.addGoal(d, { title: 'Acil durum fonu', target: TL(3000), accountId: inv }).data;
    d = add(d, { type: 'transfer', amount: TL(3000), date: '2026-10-12', accountId: bank, toAccountId: inv }).data;
    expect(clawdMood(d, TODAY).mood).toBe('celebrate');
    expect(clawdMood(d, '2026-10-25').mood).not.toBe('celebrate');
  });

  it('ödemeler bakiyeyi aşınca düşünceli ve gerekçeli', () => {
    let { d, bank } = setup();
    d = add(d, { type: 'expense', amount: TL(100), date: TODAY, accountId: bank, categoryId: 'e-food' }).data;
    d = A.addPlan(d, { kind: 'expense', title: 'Kurs', amount: TL(12000), accountId: bank, categoryId: 'e-school', freq: 'once', startDate: '2026-10-28' }).data;
    const m = clawdMood(d, TODAY);
    expect(m.mood).toBe('thoughtful');
    expect(m.focus).toBe('upcoming');
  });
});

describe('karşılaştırma', () => {
  it('devam eden ayı önceki ayın aynı gün aralığıyla, eksik takip dönemini anlamsız sayar', () => {
    let { d, bank } = setup();
    d = add(d, { type: 'expense', amount: TL(100), date: '2026-09-10', accountId: bank, categoryId: 'e-food' }).data;
    d = add(d, { type: 'expense', amount: TL(900), date: '2026-09-25', accountId: bank, categoryId: 'e-food' }).data;
    d = add(d, { type: 'expense', amount: TL(150), date: '2026-10-10', accountId: bank, categoryId: 'e-food' }).data;
    const c = L.compareMonth(d, '2026-10', TODAY);
    expect(c.partial).toBe(true);
    expect(c.previous.to).toBe('2026-09-15');
    expect(c.previous.spending).toBe(TL(100));
    expect(c.meaningful).toBe(true);
    const c2 = L.compareMonth(d, '2026-09', TODAY);
    expect(c2.previousComplete).toBe(false);
    expect(c2.meaningful).toBe(false);
  });
});

describe('yedek', () => {
  it('yedek → geri yükleme verinin aynısını verir; bozuk dosyayı reddeder', () => {
    let { d, bank, inv } = setup();
    d = add(d, { type: 'expense', amount: TL(45.5), date: TODAY, accountId: bank, categoryId: 'e-food', note: 'Kahve; "latte"' }).data;
    d = add(d, { type: 'transfer', amount: TL(3000), date: TODAY, accountId: bank, toAccountId: inv }).data;
    d = A.addValuation(d, { accountId: inv, date: TODAY, value: TL(3100) }, TODAY).data;
    const r = parseBackup(serializeBackup(d));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toEqual(d);
    expect(parseBackup('{"foo":1}').ok).toBe(false);
    expect(parseBackup('not json').ok).toBe(false);
    const broken = JSON.parse(serializeBackup(d));
    broken.data.txs[0].accountId = 'yok';
    expect(parseBackup(JSON.stringify(broken)).ok).toBe(false);
    const csv = transactionsCSV(d);
    expect(csv).toContain('45,50');
    expect(csv).toContain('"Kahve; ""latte"""');
    expect(csv).toContain('Yatırıma aktarım');
  });
});

describe('örnek veri', () => {
  it('her gün için tutarlı ve doğrulamadan geçen veri üretir', async () => {
    const { buildDemo } = await import('./demo');
    for (const day of ['2026-10-01', '2026-10-15', '2026-02-28', '2027-01-31']) {
      const d = buildDemo(day);
      expect(d.txs.length).toBeGreaterThan(30);
      expect(d.txs.every((t) => t.date <= day)).toBe(true);
      const r = parseBackup(serializeBackup(d));
      expect(r.ok).toBe(true);
      expect(L.dailyBalance(d)).toBeGreaterThan(0);
    }
  });
});

describe('Türkçe yüzde ekleri', () => {
  it('sayının okunuşuna göre eki seçer', async () => {
    const { pct } = await import('./tr');
    expect(pct(55, 'poss')).toBe("%55'i");
    expect(pct(48, 'poss')).toBe("%48'i");
    expect(pct(40, 'poss')).toBe("%40'ı");
    expect(pct(30, 'poss')).toBe("%30'u");
    expect(pct(100, 'poss')).toBe("%100'ü");
    expect(pct(62, 'poss')).toBe("%62'si");
    expect(pct(70, 'acc')).toBe("%70'ini");
    expect(pct(104, 'acc')).toBe("%104'ünü");
    expect(pct(96, 'acc')).toBe("%96'sını");
    expect(pct(9, 'acc')).toBe("%9'unu");
    expect(pct(80, 'dat')).toBe("%80'ine");
    expect(pct(90, 'dat')).toBe("%90'ına");
    expect(pct(85, 'locYou')).toBe("%85'indesin");
    expect(pct(86, 'locYou')).toBe("%86'sındasın");
  });
});
