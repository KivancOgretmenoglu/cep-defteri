import { describe, expect, it } from 'vitest';
import { emptyData } from './defaults';
import * as A from './actions';
import * as L from './ledger';
import { mascotMood } from './mood';
import { spendingPlan } from './spendingPlan';
import { parseBackup, serializeBackup, transactionsCSV } from './backup';
import type { Data } from './types';

/** "Bütçe dışı" gider: biriktirip alınan gitar aylık bütçeyi %200 aşmış göstermesin. */
const TODAY = '2026-10-15';
const TL = (n: number) => Math.round(n * 100);

function setup() {
  let d = emptyData();
  const bank = A.addAccount(d, { name: 'Banka', kind: 'bank', openingBalance: TL(60000), openingDate: '2026-09-01' });
  d = bank.data;
  d = { ...d, settings: { ...d.settings, monthlyBudget: TL(12000) } };
  const hobi = d.categories.find((c) => c.kind === 'expense')!.id;
  return { d, bank: bank.account.id, cat: hobi };
}
const add = (d: Data, draft: A.TxDraft) => A.addTx(d, draft, TODAY);

describe('bütçe dışı gider', () => {
  it('bütçeye, tempoya ve maskot yargısına sayılmaz; bakiyeden düşer, raporda görünür', () => {
    const s = setup();
    let d = add(s.d, { type: 'expense', amount: TL(3000), date: '2026-10-05', accountId: s.bank, categoryId: s.cat }).data;
    const g = add(d, { type: 'expense', amount: TL(25000), date: '2026-10-10', accountId: s.bank, categoryId: s.cat, note: 'Gitar', offBudget: true });
    d = g.data;
    expect(g.tx.offBudget).toBe(true);

    const b = L.budgetStatus(d, '2026-10', TODAY);
    expect(b.spent).toBe(TL(3000));
    expect(b.offBudget).toBe(TL(25000));
    expect(b.usedPct).toBe(25);
    expect(b.state).not.toBe('over');
    expect(mascotMood(d, TODAY).mood).not.toBe('thoughtful');

    // Gerçek para: bakiye ve "bu ay harcama" toplamı gitarı içerir.
    expect(L.cashBalance(d, s.bank)).toBe(TL(60000 - 28000));
    expect(L.monthSummary(d, '2026-10').spending).toBe(TL(28000));

    // Aynı gider bütçe dışı değilse bütçe aşılmış görünür.
    const plain = add(add(s.d, { type: 'expense', amount: TL(3000), date: '2026-10-05', accountId: s.bank, categoryId: s.cat }).data,
      { type: 'expense', amount: TL(25000), date: '2026-10-10', accountId: s.bank, categoryId: s.cat }).data;
    expect(L.budgetStatus(plain, '2026-10', TODAY).state).toBe('over');
  });

  it('kategori limitine sayılmaz; iadesi de bütçe dışıdır', () => {
    const s = setup();
    let d = { ...s.d, categories: s.d.categories.map((c) => (c.id === s.cat ? { ...c, limit: TL(1000) } : c)) };
    d = add(d, { type: 'expense', amount: TL(500), date: '2026-10-02', accountId: s.bank, categoryId: s.cat }).data;
    const g = add(d, { type: 'expense', amount: TL(25000), date: '2026-10-10', accountId: s.bank, categoryId: s.cat, offBudget: true });
    d = g.data;
    expect(L.budgetStatus(d, '2026-10', TODAY).categories.find((c) => c.category.id === s.cat)).toMatchObject({ used: TL(500), level: 'ok' });
    // Gitarın 2.000 TL'si iade edildi: bütçedeki harcama değişmez, bütçe dışı tutar azalır.
    d = add(d, { type: 'refund', amount: TL(2000), date: '2026-10-12', accountId: s.bank, categoryId: s.cat, refundOf: g.tx.id }).data;
    const b = L.budgetStatus(d, '2026-10', TODAY);
    expect(b.spent).toBe(TL(500));
    expect(b.offBudget).toBe(TL(23000));
    expect(b.categories.find((c) => c.category.id === s.cat)!.used).toBe(TL(500));
  });

  it('harcama eğrisine (bütçe çizgisi) girmez; düzenlemeyle açılıp kapanır; yalnız giderde saklanır', () => {
    const s = setup();
    const g = add(s.d, { type: 'expense', amount: TL(25000), date: '2026-10-10', accountId: s.bank, categoryId: s.cat, offBudget: true });
    let d = g.data;
    const last = (x: Data) => spendingPlan(x, TODAY)!.spending.at(-1)!.value;
    expect(last(d)).toBe(0);
    d = A.updateTx(d, g.tx.id, { type: 'expense', amount: TL(25000), date: '2026-10-10', accountId: s.bank, categoryId: s.cat, offBudget: false }, TODAY);
    expect(d.txs[0].offBudget).toBeUndefined();
    expect(last(d)).toBe(TL(25000));
    const inc = add(d, { type: 'income', amount: TL(100), date: '2026-10-10', accountId: s.bank, categoryId: d.categories.find((c) => c.kind === 'income')!.id, offBudget: true });
    expect(inc.tx.offBudget).toBeUndefined();
  });

  it('yedekte gidip gelir; bozuk değer reddedilir; CSV sütunu yalnız gerektiğinde', () => {
    const s = setup();
    expect(transactionsCSV(add(s.d, { type: 'expense', amount: TL(10), date: '2026-10-10', accountId: s.bank, categoryId: s.cat }).data).split('\r\n')[0]).not.toContain('Bütçe dışı');
    const d = add(s.d, { type: 'expense', amount: TL(25000), date: '2026-10-10', accountId: s.bank, categoryId: s.cat, offBudget: true }).data;
    const r = parseBackup(serializeBackup(d));
    expect(r.ok && r.data.txs[0].offBudget).toBe(true);
    const bad = (v: unknown) => parseBackup(JSON.stringify({ app: 'cep-defteri', version: 1, data: { ...d, txs: d.txs.map((t) => ({ ...t, offBudget: v })) } })).ok;
    expect(bad('evet')).toBe(false);
    expect(bad(false)).toBe(false);
    const csv = transactionsCSV(d).split('\r\n');
    expect(csv[0].split(';').at(-1)).toBe('Bütçe dışı');
    expect(csv[1].split(';').at(-1)).toBe('Evet');
  });
});
