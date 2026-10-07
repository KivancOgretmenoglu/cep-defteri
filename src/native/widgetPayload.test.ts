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
