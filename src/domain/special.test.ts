import { describe, expect, it } from 'vitest';
import { emptyData } from './defaults';
import * as A from './actions';
import { isBirthday, specialDay } from './special';
import { parseBackup, serializeBackup } from './backup';

const at = (y: number, m: number, d: number) => new Date(y, m - 1, d, 10).getTime();

describe('özel günler', () => {
  it('doğum günü geçerliliği', () => {
    expect(isBirthday('02-29')).toBe(true);
    expect(isBirthday('04-31')).toBe(false);
    expect(isBirthday('13-01')).toBe(false);
    expect(isBirthday('1-5')).toBe(false);
  });

  it('kullanıcının doğum günü; 29 Şubat artık olmayan yılda 28 Şubat', () => {
    const d = A.updateSettings(emptyData(), { birthday: '02-29' });
    expect(specialDay(d, '2027-02-28')).toEqual({ kind: 'birthday' });
    expect(specialDay(d, '2028-02-28')).toBeNull();
    expect(specialDay(d, '2028-02-29')).toEqual({ kind: 'birthday' });
    expect(specialDay(d, '2027-02-28', 'demo')).toBeNull();
    expect(() => A.updateSettings(d, { birthday: '02-30' })).toThrow();
  });

  it('kullanım yıl dönümü: ilk hesabın açıldığı gün, en az 1 yıl', () => {
    let d = A.addAccount(emptyData(), { name: 'Banka', kind: 'bank', openingBalance: 0, openingDate: '2025-11-18' }, at(2025, 11, 18)).data;
    d = A.addAccount(d, { name: 'Nakit', kind: 'cash', openingBalance: 0, openingDate: '2026-01-02' }, at(2026, 1, 2)).data;
    expect(specialDay(d, '2025-11-18')).toBeNull();
    expect(specialDay(d, '2026-11-18')).toEqual({ kind: 'anniversary', years: 1, txCount: 0 });
    expect(specialDay(d, '2027-11-18')).toMatchObject({ years: 2 });
    expect(specialDay(d, '2026-11-19')).toBeNull();
    // Doğum günü öncelikli
    expect(specialDay(A.updateSettings(d, { birthday: '11-18' }), '2026-11-18')).toEqual({ kind: 'birthday' });
  });

  it('yedekte gidip gelir; bozuksa reddedilir', () => {
    const d = A.updateSettings(emptyData(), { birthday: '07-15' });
    const r = parseBackup(serializeBackup(d));
    expect(r.ok && r.data.settings.birthday).toBe('07-15');
    expect(parseBackup(JSON.stringify({ app: 'cep-defteri', version: 1, data: { ...d, settings: { ...d.settings, birthday: '7/15' } } })).ok).toBe(false);
  });
});
