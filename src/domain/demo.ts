/**
 * Örnek veri: uygulamayı denemek için, bugünden geriye ~2,5 aylık kurgusal bir öğrenci bütçesi.
 * Gerçek kayıtlardan ayrı bir alanda saklanır. Deterministiktir (sabit tohumlu üretici).
 */
import type { Data } from './types';
import { emptyData } from './defaults';
import * as A from './actions';
import { occurrences } from './ledger';
import { addDays, addMonths, dayInMonth, monthEnd, monthOf, monthStart, type ISODate } from './dates';

function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

export function buildDemo(today: ISODate): Data {
  const rand = rng(20261001);
  const between = (a: number, b: number) => Math.round((a + rand() * (b - a)) / 5) * 5 * 100; // 5 TL'ye yuvarlı
  const start = monthStart(addMonths(monthOf(today), -2));
  let d = emptyData();
  let t = 1_700_000_000_000;
  const now = () => (t += 1000);

  const bank = A.addAccount(d, { name: 'Banka', kind: 'bank', openingBalance: 650000, openingDate: start }, now());
  d = bank.data;
  const cash = A.addAccount(d, { name: 'Nakit', kind: 'cash', openingBalance: 40000, openingDate: start }, now());
  d = cash.data;
  const inv = A.addAccount(d, { name: 'Yatırım fonu', kind: 'investment', openingBalance: 400000, openingDate: start, priorContribution: 380000 }, now());
  d = inv.data;
  const B = bank.account.id, C = cash.account.id, I = inv.account.id;

  d = A.updateSettings(d, { monthlyBudget: 1000000, reserve: 100000, lastAccountId: B });
  d = A.updateCategory(d, 'e-food', { limit: 250000 });
  d = A.updateCategory(d, 'e-fun', { limit: 80000 });

  const plan = (p: A.PlanDraft) => {
    const r = A.addPlan(d, p, now());
    d = r.data;
    return r.plan;
  };
  plan({ kind: 'income', title: 'Aile desteği', amount: 700000, accountId: B, categoryId: 'i-family', freq: 'monthly', startDate: dayInMonth(monthOf(start), 1) });
  plan({ kind: 'income', title: 'KYK bursu', amount: 300000, accountId: B, categoryId: 'i-scholarship', freq: 'monthly', startDate: dayInMonth(monthOf(start), 8) });
  plan({ kind: 'expense', title: 'Yurt ödemesi', amount: 450000, accountId: B, categoryId: 'e-housing', freq: 'monthly', startDate: dayInMonth(monthOf(start), 5) });
  plan({ kind: 'expense', title: 'Müzik aboneliği', amount: 6000, accountId: B, categoryId: 'e-subs', freq: 'monthly', startDate: dayInMonth(monthOf(start), 12) });
  plan({ kind: 'expense', title: 'Telefon faturası', amount: 35000, accountId: B, categoryId: 'e-phone', freq: 'monthly', startDate: dayInMonth(monthOf(start), 20) });
  plan({ kind: 'transfer', title: 'Aylık yatırım', amount: 100000, accountId: B, toAccountId: I, freq: 'monthly', startDate: dayInMonth(monthOf(start), 10) });

  const add = (x: A.TxDraft) => {
    const r = A.addTx(d, x, today, now());
    d = r.data;
    return r.tx;
  };

  // Günlük akış: her gün için olası harcamalar + vadesi gelen planlar.
  for (let day = start; day <= today; day = addDays(day, 1)) {
    for (const o of occurrences(d, day, day)) {
      if (o.status !== 'pending') continue;
      // Telefon faturası bazen biraz farklı gelir.
      const amount = o.plan.title === 'Telefon faturası' ? o.plan.amount + Math.round(rand() * 4) * 1000 : undefined;
      d = A.confirmOccurrence(d, o.plan.id, o.due, { amount }, today, now()).data;
    }
    const dow = new Date(day + 'T12:00:00').getDay();
    if (rand() < 0.62) add({ type: 'expense', amount: between(40, 160), date: day, accountId: rand() < 0.7 ? B : C, categoryId: 'e-food', note: rand() < 0.4 ? 'Kafeterya' : undefined });
    if (dow !== 0 && dow !== 6 && rand() < 0.6) add({ type: 'expense', amount: between(20, 35), date: day, accountId: C, categoryId: 'e-transport', note: 'Dolmuş' });
    if (dow === 6) add({ type: 'expense', amount: between(250, 520), date: day, accountId: B, categoryId: 'e-market' });
    if (rand() < 0.07) add({ type: 'expense', amount: between(150, 420), date: day, accountId: B, categoryId: 'e-fun', note: rand() < 0.5 ? 'Sinema' : 'Konser' });
    if (rand() < 0.05) add({ type: 'expense', amount: between(120, 380), date: day, accountId: B, categoryId: 'e-school', note: 'Kitap' });
    if (day.endsWith('-02') || day.endsWith('-16')) add({ type: 'transfer', amount: 70000, date: day, accountId: B, toAccountId: C, note: 'ATM' });
    if (day.endsWith('-15') && rand() < 0.8) add({ type: 'income', amount: between(900, 1600), date: day, accountId: B, categoryId: 'i-job', note: 'Özel ders' });
    if (day === monthEnd(monthOf(day)) && day < today) {
      const st = d.valuations.length;
      d = A.addValuation(d, { accountId: I, date: day, value: 400000 + (st + 1) * 100000 + Math.round((rand() - 0.35) * 9000) * 10 }, today, now()).data;
    }
  }

  // İade örneği: geri gönderilen bir kıyafet.
  const buyDay = addDays(start, 18);
  const shirt = add({ type: 'expense', amount: 89000, date: buyDay, accountId: B, categoryId: 'e-clothes', note: 'Mont' });
  add({ type: 'refund', amount: 89000, date: addDays(buyDay, 6), accountId: B, categoryId: 'e-clothes', refundOf: shirt.id, note: 'Mont iadesi' });

  d = A.addGoal(d, { title: 'Yaz okulu fonu', target: 1000000, accountId: I }, now()).data;
  return d;
}
