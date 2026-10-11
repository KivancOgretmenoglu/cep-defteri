import { describe, expect, it } from 'vitest';
import { emptyData } from '../domain/defaults';
import * as A from '../domain/actions';
import type { Data } from '../domain/types';
import { widgetMascot, widgetPayload } from './widgetPayload';

const TODAY = '2026-10-15';
const TL = (n: number) => Math.round(n * 100);

function withBank(): Data {
  return A.addAccount(emptyData(), { name: 'Banka', kind: 'bank', openingBalance: TL(2500), openingDate: '2026-09-01' }, 1000).data;
}
const withMascot = (d: Data, key: string) => A.updateSettings(d, { mascot: { ...d.settings.mascot, key } });

describe('ana ekran aracı: dil ve maskot', () => {
  it('Türkçe metinler ve varsayılan maskot', () => {
    const p = widgetPayload(withBank(), TODAY, 'real', 1);
    expect(p).toMatchObject({ amount: '2.500 TL', title: 'Kullanılabilir', add: '+ Ekle', label: 'Ekim sonuna kadar', note: '', mascot: 'fistik', lang: 'tr' });
  });

  it('İngilizce metinler', () => {
    const d = A.updateSettings(withBank(), { lang: 'en' });
    const p = widgetPayload(d, TODAY, 'demo', 1);
    expect(p).toMatchObject({ title: 'Available', add: '+ Add', label: 'until end of October', note: 'demo data', lang: 'en' });
    expect(widgetPayload(A.updateSettings(d, { periodMode: 'days30' }), TODAY, 'real').label).toBe('until 13 November');
    const empty = widgetPayload(A.updateSettings(emptyData(), { lang: 'en' }), TODAY, 'real');
    expect(empty).toMatchObject({ amount: '—', label: 'Available money', note: 'Add an account to see it' });
  });

  it('seçili maskotu taşır, bilinmeyeni varsayılana çevirir', () => {
    const d = withBank();
    expect(widgetPayload(withMascot(d, 'bilge'), TODAY, 'real').mascot).toBe('bilge');
    expect(widgetPayload(withMascot(d, 'karamel'), TODAY, 'real').mascot).toBe('karamel');
    expect(widgetMascot(withMascot(d, 'clawd'))).toBe('fistik');
    const noMascot = { ...d, settings: { ...d.settings, mascot: undefined } } as unknown as Data;
    expect(widgetMascot(noMascot)).toBe('fistik');
  });
});

describe('ana ekran aracı: ham tutarlar ve gizleme', () => {
  it('ham kuruş, dil biçimi ve bugünkü harcama şablonu', () => {
    const p = widgetPayload(withBank(), TODAY, 'real', 5);
    expect(p).toMatchObject({ available: TL(2500), todaySpent: 0, todayTpl: 'Bugün: %s', todayISO: TODAY, hidden: false, real: true, labelShort: 'Ekim sonu', updatedAt: 5 });
    const en = widgetPayload(A.updateSettings(withBank(), { lang: 'en' }), TODAY, 'real');
    expect(en).toMatchObject({ amount: '₺2,500', today: 'Today: ₺0', todayTpl: 'Today: %s', labelShort: 'end of Oct' });
    expect(widgetPayload(A.updateSettings(withBank(), { periodMode: 'days30' }), TODAY, 'real').labelShort).toBe('13 Kasım');
  });

  it('araçta tutarı gizle: maske, gizli bayrağı; toplamları gizle de aynı', () => {
    const p = widgetPayload(withBank(), TODAY, 'real', 1, { hideAmount: true });
    expect(p).toMatchObject({ amount: '•••• TL', today: 'Bugün: •••• TL', hidden: true, negative: false, available: TL(2500) });
    const en = widgetPayload(A.updateSettings(withBank(), { lang: 'en', hideTotals: true }), TODAY, 'real');
    expect(en).toMatchObject({ amount: '₺••••', hidden: true });
  });

  it('işlenmiş kuyruk qidleri yalnız gerçek veride taşınır', () => {
    expect(widgetPayload(withBank(), TODAY, 'real', 1, { seen: ['a', 'b'] }).seen).toEqual(['a', 'b']);
    expect(widgetPayload(withBank(), TODAY, 'demo', 1, { seen: ['a'] })).toMatchObject({ seen: [], real: false });
  });

  it('hesap yokken tutar null', () => {
    expect(widgetPayload(emptyData(), TODAY, 'real')).toMatchObject({ amount: '—', available: null, todayTpl: '' });
  });
});
