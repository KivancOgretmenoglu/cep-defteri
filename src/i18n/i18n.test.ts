import { describe, expect, it } from 'vitest';
import { tr } from './tr';
import { en } from './en';
import { translate, type Key } from './core';
import { emptyData, categoryName, defaultAccountNames, DEFAULT_CATEGORIES } from '../domain/defaults';
import * as A from '../domain/actions';
import { clawdMood } from '../domain/mood';
import { formatMoney, hiddenMoney, moneyParts, moneyToInput, parseMoney } from '../domain/money';
import { dueLabel, monthLabel, relativeDay, shortDate, weekday } from '../domain/dates';
import { parseBackup, serializeBackup, transactionsCSV, valuationsCSV } from '../domain/backup';
import { buildDemo } from '../domain/demo';
import type { Data } from '../domain/types';

const TODAY = '2026-10-15';
const TL = (n: number) => Math.round(n * 100);
/** Türkçeye özgü harfler (İngilizce metinde olmamalı). */
const TURKISH = /[ğüşıöçİĞÜŞÖÇ]/;

const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe('sözlükler', () => {
  it('İngilizce sözlük her anahtarı içerir, fazlası yok', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(tr).sort());
  });
  it('İngilizce metin yalnız Türkçede de olan yer tutucuları kullanır', () => {
    for (const k of Object.keys(tr) as Key[]) {
      const a = tr[k] as unknown, b = en[k];
      if (typeof a === 'string' && typeof b === 'string') {
        const known = placeholders(a);
        expect([k, placeholders(b).filter((x) => !known.includes(x))]).toEqual([k, []]);
      }
    }
  });
  it('İngilizce metinlerde Türkçe harf yok (marka/klasör adları hariç)', () => {
    const allowed: Key[] = ['rc.imageHeader'];
    for (const k of Object.keys(en) as Key[]) {
      const v = en[k];
      const s = typeof v === 'function' ? v({ n: 2, a: 1, tx: 3, p: 1, v: 0, month: 'May', dates: 'x', label: 'x' }) : v;
      if (!allowed.includes(k)) expect([k, TURKISH.test(s)]).toEqual([k, false]);
    }
  });
  it('yer tutucu doldurma ve çoğul', () => {
    expect(translate('tr', 'acc.added', { name: 'Kumbara' })).toBe('Kumbara eklendi');
    expect(translate('en', 'acc.added', { name: 'Piggy' })).toBe('Piggy added');
    expect(translate('en', 'common.days', { n: 1 })).toBe('1 day');
    expect(translate('en', 'common.days', { n: 3 })).toBe('3 days');
    expect(translate('tr', 'common.days', { n: 3 })).toBe('3 gün');
  });
});

describe('İngilizce para biçimi', () => {
  it('ayrıştırma: nokta ondalık, virgül binlik', () => {
    expect(parseMoney('1,234.50', 'en')).toBe(123450);
    expect(parseMoney('12.5', 'en')).toBe(1250);
    expect(parseMoney('1,250', 'en')).toBe(125000);
    expect(parseMoney('3000', 'en')).toBe(300000);
    expect(parseMoney('0.1', 'en')).toBe(10);
    expect(parseMoney('₺45', 'en')).toBe(4500);
    expect(parseMoney('45,5', 'en')).toBe(4550); // tek virgül ve binlik grubu değil → ondalık
    expect(parseMoney('1,234,567.89', 'en')).toBe(123456789);
    expect(parseMoney('1.234,56', 'en')).toBeNull();
    expect(parseMoney('0', 'en')).toBeNull();
    expect(parseMoney('-5', 'en')).toBeNull();
    expect(parseMoney('abc', 'en')).toBeNull();
    // Türkçe davranış değişmedi
    expect(parseMoney('1.250')).toBe(125000);
    expect(parseMoney('1.234,56', 'tr')).toBe(123456);
  });
  it('yazım: ₺1,234.50', () => {
    expect(formatMoney(123450, { lang: 'en' })).toBe('₺1,234.50');
    expect(formatMoney(100, { lang: 'en' })).toBe('₺1');
    expect(formatMoney(-123456, { compact: false, lang: 'en' })).toBe('−₺1,234.56');
    expect(formatMoney(5000, { sign: true, lang: 'en' })).toBe('+₺50');
    expect(formatMoney(123400, { unit: false, lang: 'en' })).toBe('1,234');
    expect(formatMoney(123450)).toBe('1.234,50 TL');
    expect(moneyParts(123405, 'en')).toEqual({ sign: '', lira: '1,234', kurus: '05' });
    expect(moneyToInput(123450, 'en')).toBe('1234.50');
    expect(moneyToInput(123450)).toBe('1234,50');
    expect(hiddenMoney('en')).toBe('₺•••••');
    expect(hiddenMoney('tr')).toBe('••••• TL');
  });
});

describe('İngilizce tarih', () => {
  it('ay, gün ve göreli etiketler', () => {
    expect(monthLabel('2026-10', 'en')).toBe('October 2026');
    expect(shortDate('2026-10-03', '2026-10-15', 'en')).toBe('Oct 3');
    expect(shortDate('2025-10-03', '2026-10-15', 'en')).toBe('Oct 3, 2025');
    expect(weekday('2026-10-16', 'en')).toBe('Friday');
    expect(relativeDay('2026-10-15', TODAY, 'en')).toBe('Today');
    expect(relativeDay('2026-10-14', TODAY, 'en')).toBe('Yesterday');
    expect(relativeDay('2026-10-16', TODAY, 'en')).toBe('Tomorrow');
    expect(relativeDay('2026-10-03', TODAY, 'en')).toBe('Saturday, October 3');
    expect(dueLabel('2026-10-18', TODAY, 'en')).toBe('in 3 days');
    expect(dueLabel('2026-10-13', TODAY, 'en')).toBe('2 days overdue');
    expect(dueLabel('2026-10-14', TODAY, 'en')).toBe('1 day overdue');
    expect(dueLabel('2026-10-13', TODAY)).toBe('2 gün gecikti');
    expect(relativeDay('2026-10-03', TODAY)).toBe('3 Ekim, Cumartesi');
  });
});

function setup() {
  let d = emptyData();
  const bank = A.addAccount(d, { name: 'Bank', kind: 'bank', openingBalance: TL(10000), openingDate: '2026-09-01' });
  d = bank.data;
  const inv = A.addAccount(d, { name: 'Invest', kind: 'investment', openingBalance: 0, openingDate: '2026-09-01' });
  d = inv.data;
  return { d, bank: bank.account.id, inv: inv.account.id };
}

describe('İngilizce alan metinleri', () => {
  it('Clawd durum notları ve gerekçeleri İngilizce', () => {
    const cases: Data[] = [];
    cases.push(emptyData());
    let { d, bank, inv } = setup();
    cases.push(d);
    d = A.addTx(d, { type: 'expense', amount: TL(9000), date: '2026-10-10', accountId: bank, categoryId: 'e-fun' }, TODAY).data;
    cases.push(d);
    cases.push(A.updateSettings(d, { monthlyBudget: TL(5000) }));
    cases.push(A.updateCategory(A.updateSettings(d, { monthlyBudget: TL(50000) }), 'e-fun', { limit: TL(1000) }));
    cases.push(A.addPlan(d, { kind: 'expense', title: 'Course', amount: TL(12000), accountId: bank, categoryId: 'e-school', freq: 'once', startDate: '2026-10-28' }).data);
    let g = A.addGoal(d, { title: 'Fund', target: TL(1000), accountId: inv }).data;
    g = A.addTx(g, { type: 'transfer', amount: TL(1000), date: '2026-10-12', accountId: bank, toAccountId: inv }, TODAY).data;
    cases.push(g);
    const moods = new Set<string>();
    for (const c of cases) {
      const m = clawdMood(c, TODAY, 'en');
      moods.add(m.mood);
      expect(TURKISH.test(m.text + m.why)).toBe(false);
      // Aynı kural, aynı duygu: dil yalnız metni değiştirir.
      const t = clawdMood(c, TODAY);
      expect(t.mood).toBe(m.mood);
      expect(t.focus).toBe(m.focus);
    }
    expect(moods.size).toBeGreaterThanOrEqual(4);
    const over = clawdMood(cases[4], TODAY, 'en');
    expect(over.text).toContain('Fun'); // varsayılan kategori adı çevrildi
  });

  it('İngilizcede yüzde "55%" biçiminde, Türkçede ekli', () => {
    let { d, bank } = setup();
    d = A.updateSettings(d, { monthlyBudget: TL(30000) });
    d = A.addTx(d, { type: 'expense', amount: TL(9000), date: '2026-10-10', accountId: bank, categoryId: 'e-food' }, TODAY).data;
    const en = clawdMood(d, TODAY, 'en');
    const trm = clawdMood(d, TODAY, 'tr');
    expect(en.text).toMatch(/\d+%/);
    expect(trm.text).toMatch(/%\d+'/);
  });

  it('doğrulama hataları anahtar taşır ve İngilizceye çevrilir', () => {
    const { d, bank } = setup();
    try {
      A.addTx(d, { type: 'expense', amount: 100, date: '2026-10-16', accountId: bank, categoryId: 'e-food' }, TODAY);
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(A.ActionError);
      const err = e as A.ActionError;
      expect(err.message).toMatch(/Gelecek/);
      expect(err.localize('en')).toMatch(/future/);
    }
    try {
      A.addTx(d, { type: 'expense', amount: 100, date: '2026-08-01', accountId: bank, categoryId: 'e-food' }, TODAY);
    } catch (e) {
      expect((e as A.ActionError).localize('en')).toBe('"Bank" is tracked from 2026-09-01; you can\'t add anything earlier.');
    }
  });

  it('yedek hataları ve CSV başlıkları dile göre', () => {
    expect(parseBackup('not json', 'en')).toEqual({ ok: false, error: "Couldn't read the file: it isn't valid JSON." });
    const broken = JSON.parse(serializeBackup(emptyData()));
    delete broken.data.txs;
    const r = parseBackup(JSON.stringify(broken), 'en');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe('Backup is damaged: the "txs" list is missing.');
    const { d, bank } = setup();
    const x = A.addTx(d, { type: 'expense', amount: 123456, date: '2026-10-10', accountId: bank, categoryId: 'e-food', note: 'Lunch, with friends' }, TODAY).data;
    const csv = transactionsCSV(x, 'en');
    expect(csv).toContain('Date,Type,Amount,Account,To account,Category,Note,Planned,Tags');
    expect(csv).toContain('2026-10-10,Expense,1234.56,Bank,,Food & coffee,"Lunch, with friends",,');
    const csvTr = transactionsCSV(x);
    expect(csvTr).toContain('Tarih;Tür;Tutar');
    expect(csvTr).toContain('Gider;1234,56;Bank;;Yemek & kafe');
    expect(valuationsCSV(x, 'en')).toContain('Date,Investment account,Current value,Note');
  });

  it('varsayılan kategori adları: değiştirilmediyse çevrilir', () => {
    const food = DEFAULT_CATEGORIES.find((c) => c.id === 'e-food')!;
    expect(categoryName(food, 'en')).toBe('Food & coffee');
    expect(categoryName(food, 'tr')).toBe('Yemek & kafe');
    expect(categoryName({ ...food, name: 'Yemekhane' }, 'en')).toBe('Yemekhane');
    expect(categoryName({ id: 'custom', name: 'Kahve' }, 'en')).toBe('Kahve');
    for (const c of DEFAULT_CATEGORIES) expect(TURKISH.test(categoryName(c, 'en'))).toBe(false);
    expect(defaultAccountNames('en')).toMatchObject({ bank: 'Bank', cash: 'Cash', investment: 'Investments' });
  });

  it('örnek veri seçili dilde üretilir, sayılar aynı', () => {
    const e = buildDemo(TODAY, 'en');
    const t = buildDemo(TODAY, 'tr');
    expect(e.settings.lang).toBe('en');
    expect(e.txs.map((x) => x.amount)).toEqual(t.txs.map((x) => x.amount));
    const texts = [...e.accounts.map((a) => a.name), ...e.plans.map((p) => p.title), ...e.goals.map((g) => g.title), ...e.txs.flatMap((x) => [x.note ?? '', ...(x.tags ?? [])])];
    for (const s of texts) expect([s, TURKISH.test(s)]).toEqual([s, false]);
    expect(parseBackup(serializeBackup(e)).ok).toBe(true);
  });
});
