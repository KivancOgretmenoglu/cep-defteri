/**
 * Örnek veri: uygulamayı denemek için, bugünden geriye ~2,5 aylık kurgusal bir öğrenci bütçesi.
 * Gerçek kayıtlardan ayrı bir alanda saklanır. Deterministiktir (sabit tohumlu üretici).
 */
import type { Data, Lang } from './types';
import { defaultAccountNames, emptyData } from './defaults';
import { translator } from '../i18n/core';
import * as A from './actions';
import { occurrences } from './ledger';
import { addDays, addMonths, dayInMonth, monthEnd, monthOf, monthStart, type ISODate } from './dates';

function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

/** Metinler (notlar, plan adları, hesap adları) `lang` dilinde üretilir; tutarlar ve tarihler dilden bağımsızdır. */
export function buildDemo(today: ISODate, lang: Lang = 'tr'): Data {
  const T = translator(lang);
  const N = defaultAccountNames(lang);
  const rand = rng(20261001);
  const between = (a: number, b: number) => Math.round((a + rand() * (b - a)) / 5) * 5 * 100; // 5 TL'ye yuvarlı
  const start = monthStart(addMonths(monthOf(today), -2));
  let d = emptyData();
  d = { ...d, settings: { ...d.settings, lang } };
  let t = 1_700_000_000_000;
  const now = () => (t += 1000);

  const bank = A.addAccount(d, { name: N.bank, kind: 'bank', openingBalance: 650000, openingDate: start }, now());
  d = bank.data;
  const cash = A.addAccount(d, { name: N.cash, kind: 'cash', openingBalance: 40000, openingDate: start }, now());
  d = cash.data;
  const inv = A.addAccount(d, { name: N.fund, kind: 'investment', openingBalance: 400000, openingDate: start, priorContribution: 380000 }, now());
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
  plan({ kind: 'income', title: T('demo.family'), amount: 700000, accountId: B, categoryId: 'i-family', freq: 'monthly', startDate: dayInMonth(monthOf(start), 1) });
  plan({ kind: 'income', title: T('demo.scholarship'), amount: 300000, accountId: B, categoryId: 'i-scholarship', freq: 'monthly', startDate: dayInMonth(monthOf(start), 8) });
  plan({ kind: 'expense', title: T('demo.dorm'), amount: 450000, accountId: B, categoryId: 'e-housing', freq: 'monthly', startDate: dayInMonth(monthOf(start), 5) });
  plan({ kind: 'expense', title: T('demo.music'), amount: 6000, accountId: B, categoryId: 'e-subs', freq: 'monthly', startDate: dayInMonth(monthOf(start), 12) });
  plan({ kind: 'expense', title: T('demo.phone'), amount: 35000, accountId: B, categoryId: 'e-phone', freq: 'monthly', startDate: dayInMonth(monthOf(start), 20) });
  plan({ kind: 'transfer', title: T('demo.invest'), amount: 100000, accountId: B, toAccountId: I, freq: 'monthly', startDate: dayInMonth(monthOf(start), 10) });

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
      const amount = o.plan.title === T('demo.phone') ? o.plan.amount + Math.round(rand() * 4) * 1000 : undefined;
      d = A.confirmOccurrence(d, o.plan.id, o.due, { amount }, today, now()).data;
    }
    const dow = new Date(day + 'T12:00:00').getDay();
    if (rand() < 0.62) add({ type: 'expense', amount: between(40, 160), date: day, accountId: rand() < 0.7 ? B : C, categoryId: 'e-food', note: rand() < 0.4 ? T('demo.cafeteria') : undefined });
    if (dow !== 0 && dow !== 6 && rand() < 0.6) add({ type: 'expense', amount: between(20, 35), date: day, accountId: C, categoryId: 'e-transport', note: T('demo.minibus') });
    if (dow === 6) add({ type: 'expense', amount: between(250, 520), date: day, accountId: B, categoryId: 'e-market' });
    if (rand() < 0.04) add({ type: 'expense', amount: between(60, 140), date: day, accountId: C, categoryId: 'e-food', note: T('demo.coffee'), tags: [T('demo.campusTag')] });
    if (rand() < 0.07) add({ type: 'expense', amount: between(150, 420), date: day, accountId: B, categoryId: 'e-fun', note: rand() < 0.5 ? T('demo.cinema') : T('demo.concert') });
    if (rand() < 0.05) add({ type: 'expense', amount: between(120, 380), date: day, accountId: B, categoryId: 'e-school', note: T('demo.book') });
    if (day.endsWith('-02') || day.endsWith('-16')) add({ type: 'transfer', amount: 70000, date: day, accountId: B, toAccountId: C, note: T('demo.atm') });
    if (day.endsWith('-15') && rand() < 0.8) add({ type: 'income', amount: between(900, 1600), date: day, accountId: B, categoryId: 'i-job', note: T('demo.tutoring') });
    if (day === monthEnd(monthOf(day)) && day < today) {
      const st = d.valuations.length;
      d = A.addValuation(d, { accountId: I, date: day, value: 400000 + (st + 1) * 100000 + Math.round((rand() - 0.35) * 9000) * 10 }, today, now()).data;
    }
  }

  // Arkadaşlar: bölüşülen akşam yemeği, "o ödedi" sinema bileti, kısmi geri ödeme.
  const ali = A.addAccount(d, { name: 'Ali', kind: 'person', openingBalance: 0, openingDate: start }, now());
  d = ali.data;
  const zeynep = A.addAccount(d, { name: 'Zeynep', kind: 'person', openingBalance: 0, openingDate: start }, now());
  d = zeynep.data;
  const dinner = addDays(today, -9) < start ? start : addDays(today, -9);
  add({ type: 'expense', amount: 32000, date: dinner, accountId: B, categoryId: 'e-food', note: T('demo.dinner'), tags: [T('demo.birthdayTag')] });
  add({ type: 'transfer', amount: 32000, date: dinner, accountId: B, toAccountId: ali.account.id, note: T('demo.dinnerShare'), tags: [T('demo.birthdayTag')] });
  add({ type: 'expense', amount: 18000, date: addDays(dinner, 2), accountId: zeynep.account.id, categoryId: 'e-fun', note: T('demo.cinemaTicket'), tags: [T('demo.birthdayTag')] });
  add({ type: 'transfer', amount: 20000, date: addDays(dinner, 4) > today ? today : addDays(dinner, 4), accountId: ali.account.id, toAccountId: B, note: T('demo.aliPaidPart') });

  // Taksitli alışveriş: kulaklık, 6 taksit.
  const inst = dayInMonth(monthOf(start), 14);
  const ph = A.addPlan(d, { kind: 'expense', title: T('demo.headphones'), amount: 41500, accountId: B, categoryId: 'e-phone', freq: 'monthly', startDate: inst, installments: 6 }, now());
  d = ph.data;
  for (const o of occurrences(d, start, today, [ph.plan])) if (o.status === 'pending') d = A.confirmOccurrence(d, ph.plan.id, o.due, {}, today, now()).data;

  // İade örneği: geri gönderilen bir kıyafet.
  const buyDay = addDays(start, 18);
  const shirt = add({ type: 'expense', amount: 89000, date: buyDay, accountId: B, categoryId: 'e-clothes', note: T('demo.coat') });
  add({ type: 'refund', amount: 89000, date: addDays(buyDay, 6), accountId: B, categoryId: 'e-clothes', refundOf: shirt.id, note: T('demo.coatRefund') });

  d = A.addGoal(d, { title: T('demo.summerSchool'), target: 1000000, accountId: I }, now()).data;
  return d;
}
