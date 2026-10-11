import { describe, expect, it } from 'vitest';
import { emptyData } from './defaults';
import * as A from './actions';
import * as L from './ledger';
import { parseBackup, serializeBackup } from './backup';
import { buildDemo } from './demo';
import type { Data } from './types';

const TODAY = '2026-10-15';
const TL = (n: number) => Math.round(n * 100);
const add = (d: Data, draft: A.TxDraft) => A.addTx(d, draft, TODAY);

/** Banka + nakit + iki yatırım hesabı + bir kişi; yatırım hesabına her türden bağlı kayıt. */
function setup() {
  let d = emptyData();
  const bank = A.addAccount(d, { name: 'Banka', kind: 'bank', openingBalance: TL(100000), openingDate: '2026-09-01' });
  d = bank.data;
  const cash = A.addAccount(d, { name: 'Nakit', kind: 'cash', openingBalance: TL(1000), openingDate: '2026-09-01' });
  d = cash.data;
  const inv = A.addAccount(d, { name: 'Fon', kind: 'investment', openingBalance: TL(5000), openingDate: '2026-09-01' });
  d = inv.data;
  const inv2 = A.addAccount(d, { name: 'Diğer fon', kind: 'investment', openingBalance: 0, openingDate: '2026-09-01' });
  d = inv2.data;
  const person = A.addAccount(d, { name: 'Ayşe', kind: 'person', openingBalance: 0, openingDate: '2026-09-01' });
  d = person.data;
  const ids = { bank: bank.account.id, cash: cash.account.id, inv: inv.account.id, inv2: inv2.account.id, person: person.account.id };
  // Yatırıma 60.000 + 2.000 (nakitten) katkı, 10.000 çekim → banka net −50.000, nakit −2.000
  d = add(d, { type: 'transfer', amount: TL(60000), date: '2026-09-05', accountId: ids.bank, toAccountId: ids.inv }).data;
  d = add(d, { type: 'transfer', amount: TL(10000), date: '2026-09-20', accountId: ids.inv, toAccountId: ids.bank }).data;
  d = add(d, { type: 'transfer', amount: TL(2000), date: '2026-09-21', accountId: ids.cash, toAccountId: ids.inv }).data;
  d = A.addValuation(d, { accountId: ids.inv, date: '2026-10-01', value: TL(58000) }, TODAY).data;
  const plan = A.addPlan(d, { kind: 'transfer', title: 'Aylık', amount: TL(1000), accountId: ids.bank, toAccountId: ids.inv, freq: 'monthly', startDate: '2026-10-10' });
  d = plan.data;
  d = A.confirmOccurrence(d, plan.plan.id, '2026-10-10', {}, TODAY).data;
  d = A.addGoal(d, { title: 'Ev', target: TL(500000), accountId: ids.inv }).data;
  // Dokunulmaması gereken kayıtlar
  d = add(d, { type: 'expense', amount: TL(300), date: '2026-10-02', accountId: ids.bank, categoryId: 'e-food' }).data;
  d = add(d, { type: 'transfer', amount: TL(700), date: '2026-10-03', accountId: ids.bank, toAccountId: ids.inv2 }).data;
  d = A.addGoal(d, { title: 'Tatil', target: TL(20000), accountId: ids.inv2 }).data;
  d = A.updateSettings(d, { lastAccountId: ids.bank });
  return { d, ...ids, planId: plan.plan.id };
}

const refsTo = (d: Data, id: string) =>
  d.txs.filter((t) => t.accountId === id || t.toAccountId === id).length +
  d.valuations.filter((v) => v.accountId === id).length +
  d.plans.filter((p) => p.accountId === id || p.toAccountId === id).length +
  d.goals.filter((g) => g.accountId === id).length;

describe('hesabı hareketleriyle silme', () => {
  it('hesaba bağlı her şeyi siler, gerisine dokunmaz', () => {
    const { d, inv, inv2, bank } = setup();
    expect(A.isAccountUsed(d, inv)).toBe(true);
    const out = A.deleteAccountCascade(d, inv);
    expect(out.accounts.some((a) => a.id === inv)).toBe(false);
    expect(refsTo(out, inv)).toBe(0);
    expect(out.txs.length).toBe(2); // gıda gideri + diğer fona aktarım
    expect(out.goals.map((g) => g.title)).toEqual(['Tatil']);
    expect(out.plans.length).toBe(0);
    expect(out.valuations.length).toBe(0);
    expect(L.investmentState(out, inv2)!.currentValue).toBe(L.investmentState(d, inv2)!.currentValue);
    expect(out.categories).toBe(d.categories);
    expect(out.settings.lastAccountId).toBe(bank);
    expect(out.nextSeq).toBe(d.nextSeq);
  });

  it('günlük bakiyedeki değişim, önizlemede gösterilen net etkiye eşittir', () => {
    const { d, inv, bank, cash } = setup();
    const p = A.accountCascadePreview(d, inv);
    expect(p.transfers).toBe(4);
    expect(p.txIds.size).toBe(4);
    expect(p.valuationIds.size).toBe(1);
    expect(p.planIds.size).toBe(1);
    expect(p.goalIds.size).toBe(1);
    // Aktarımların toplamı: bankadan 60.000 + 1.000 çıktı, 10.000 girdi; nakitten 2.000 çıktı.
    const eff = new Map(p.dailyEffects.map((e) => [e.accountId, e.delta]));
    expect(eff.get(bank)).toBe(TL(51000));
    expect(eff.get(cash)).toBe(TL(2000));
    const out = A.deleteAccountCascade(d, inv);
    expect(L.cashBalance(out, bank) - L.cashBalance(d, bank)).toBe(eff.get(bank));
    expect(L.cashBalance(out, cash) - L.cashBalance(d, cash)).toBe(eff.get(cash));
    expect(L.dailyBalance(out) - L.dailyBalance(d)).toBe(p.dailyEffects.reduce((s, e) => s + e.delta, 0));
  });

  it('silme sonrası veri yedek doğrulamasından (anlamsal denetim dahil) geçer', () => {
    const { d, inv, person } = setup();
    for (const out of [A.deleteAccountCascade(d, inv), A.deleteAccountCascade(d, person)]) {
      const r = parseBackup(serializeBackup(out));
      expect(r.ok).toBe(true);
    }
    // Örnek verilerdeki her yatırım/kişi hesabı için de
    const demo = buildDemo(TODAY);
    for (const a of demo.accounts.filter((x) => !L.isDaily(x))) {
      const r = parseBackup(serializeBackup(A.deleteAccountCascade(demo, a.id)));
      expect([a.name, r.ok]).toEqual([a.name, true]);
    }
  });

  it('kişi hesabı: borç aktarımları, kişinin ödediği gider ve ona bağlı iade gider', () => {
    let { d, person, bank } = setup();
    d = add(d, { type: 'transfer', amount: TL(500), date: '2026-10-04', accountId: bank, toAccountId: person }).data;
    const e = add(d, { type: 'expense', amount: TL(400), date: '2026-10-05', accountId: person, categoryId: 'e-food' });
    d = e.data;
    d = add(d, { type: 'refund', amount: TL(100), date: '2026-10-06', accountId: bank, categoryId: 'e-food', refundOf: e.tx.id }).data;
    const p = A.accountCascadePreview(d, person);
    expect(p.txIds.size).toBe(3);
    expect(p.transfers).toBe(1);
    // 500 borç verme geri gelir, 100 iade düşer
    expect(p.dailyEffects).toEqual([{ accountId: bank, delta: TL(400) }]);
    const out = A.deleteAccountCascade(d, person);
    expect(out.txs.some((t) => t.refundOf === e.tx.id)).toBe(false);
    expect(parseBackup(serializeBackup(out)).ok).toBe(true);
  });

  it('silinen plana bağlı kalan işlemin plan bağı kaldırılır', () => {
    let { d, inv, bank, cash } = setup();
    const p = A.addPlan(d, { kind: 'transfer', title: 'Çekim', amount: TL(500), accountId: inv, toAccountId: bank, freq: 'once', startDate: '2026-10-12' });
    d = p.data;
    // Elle kurulan uç durum: plana bağlı ama hesaba dokunmayan bir işlem
    d = add(d, { type: 'transfer', amount: TL(500), date: '2026-10-12', accountId: cash, toAccountId: bank, planRef: { planId: p.plan.id, due: '2026-10-12' } }).data;
    const out = A.deleteAccountCascade(d, inv);
    const kept = out.txs.find((t) => t.accountId === cash && t.toAccountId === bank)!;
    expect(kept).toBeDefined();
    expect(kept.planRef).toBeUndefined();
  });

  it('son seçili hesap silinen hesapsa temizlenir; günlük hesaplar geçmişiyle silinemez', () => {
    const { d, inv, bank } = setup();
    const withLast = { ...d, settings: { ...d.settings, lastAccountId: inv } };
    expect(A.deleteAccountCascade(withLast, inv).settings.lastAccountId).toBeNull();
    expect(() => A.deleteAccountCascade(d, bank)).toThrow(A.ActionError);
    expect(() => A.accountCascadePreview(d, bank)).toThrow(A.ActionError);
  });
});

describe('arşivlenen yatırım hesabı', () => {
  it('yatırım listesinden ve toplamdan çıkar, arşiv bölümünde görünür; geri alınınca döner', () => {
    const { d, inv, inv2 } = setup();
    const before = L.investmentTotal(d);
    const value = L.investmentState(d, inv)!.currentValue;
    expect(value).not.toBe(0);
    const arch = A.setAccountArchived(d, inv, true);
    const lists = L.investmentLists(arch);
    expect(lists.active.map((a) => a.id)).toEqual([inv2]);
    expect(lists.archived.map((a) => a.id)).toEqual([inv]);
    expect(L.investmentTotal(arch)).toBe(before - value);
    // Geçmişi korunur
    expect(L.investmentState(arch, inv)!.currentValue).toBe(value);
    const back = A.setAccountArchived(arch, inv, false);
    expect(L.investmentLists(back).archived).toEqual([]);
    expect(L.investmentTotal(back)).toBe(before);
  });
});
