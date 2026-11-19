import { describe, expect, it } from 'vitest';
import { properSuffix } from './tr';
import { emptyData } from './defaults';
import * as A from './actions';
import { monthLetter } from './letter';
import { translator } from '../i18n/core';

describe('özel isim ekleri', () => {
  it('ay ve maskot adları', () => {
    expect(['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Eylül', 'Ekim', 'Kasım', 'Aralık'].map((m) => properSuffix(m, 'loc'))).toEqual([
      "Ocak'ta", "Şubat'ta", "Mart'ta", "Nisan'da", "Mayıs'ta", "Eylül'de", "Ekim'de", "Kasım'da", "Aralık'ta",
    ]);
    expect(['Eylül', 'Ekim', 'Haziran', 'Ağustos'].map((m) => properSuffix(m, 'dat'))).toEqual(["Eylül'e", "Ekim'e", "Haziran'a", "Ağustos'a"]);
    expect(['Fıstık', 'Bilge', 'Ceviz', 'Pamuk', 'Karamel', 'Diken'].map((m) => properSuffix(m, 'abl'))).toEqual([
      "Fıstık'tan", "Bilge'den", "Ceviz'den", "Pamuk'tan", "Karamel'den", "Diken'den",
    ]);
    expect(properSuffix('Bilge', 'dat')).toBe("Bilge'ye");
  });
});

describe('ay mektubu', () => {
  it('harcama, en çok kategori, karşılaştırma, bütçe, gün sayısı', () => {
    let d = emptyData();
    const bank = A.addAccount(d, { name: 'Banka', kind: 'bank', openingBalance: 1000000, openingDate: '2026-09-01' });
    d = A.updateSettings(bank.data, { monthlyBudget: 500000 });
    const add = (date: string, amount: number, categoryId = 'e-food') => (d = A.addTx(d, { type: 'expense', amount, date, accountId: bank.account.id, categoryId }, '2026-11-02').data);
    add('2026-09-10', 200000);
    add('2026-10-05', 100000);
    add('2026-10-12', 60000, 'e-transport');
    const L = monthLetter(d, '2026-10', '2026-11-02', translator('tr'), 'tr');
    expect(L.star).toBe(true);
    expect(L.lines).toEqual([
      'Merhaba!',
      "Ekim'de toplam 1.600 TL harcadın; en çok Yemek & kafe (1.000 TL).",
      "Eylül'e göre %20 daha az. Bunu fark ettim 👏",
      'Ve bütçenin içinde kaldın. Gurur duydum!',
      'Ay boyunca 2 gün defterini açtın.',
    ]);
    const en = monthLetter(d, '2026-10', '2026-11-02', translator('en'), 'en');
    expect(en.lines[1]).toBe('In October you spent ₺1,600 in total; most of it on Food & coffee (₺1,000).');
  });
});
