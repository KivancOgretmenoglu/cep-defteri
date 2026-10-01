import { describe, expect, it } from 'vitest';
import { derivePin, hashPin, isValidPin, lockoutMs, verifyPin } from './pin';

describe('PIN', () => {
  it('yalnız 4–6 haneli rakamları kabul eder', () => {
    expect(isValidPin('1234')).toBe(true);
    expect(isValidPin('123456')).toBe(true);
    expect(isValidPin('123')).toBe(false);
    expect(isValidPin('1234567')).toBe(false);
    expect(isValidPin('12a4')).toBe(false);
  });

  it('tuzlu özet üretir ve doğrular', async () => {
    const a = await hashPin('2468');
    const b = await hashPin('2468');
    expect(a.pinHash).toMatch(/^[0-9a-f]{64}$/);
    expect(a.salt).toMatch(/^[0-9a-f]{32}$/);
    expect(a.salt).not.toBe(b.salt);
    expect(a.pinHash).not.toBe(b.pinHash);
    expect(await verifyPin('2468', a.pinHash, a.salt)).toBe(true);
    expect(await verifyPin('2469', a.pinHash, a.salt)).toBe(false);
    expect(await verifyPin('2468', null, null)).toBe(false);
  });

  it('PBKDF2-SHA256 bilinen değerle uyumlu', async () => {
    // RFC 7914 test vektörü: P="passwd", S="salt", c=1, dkLen=32 → ilk 32 bayt
    // Burada PIN fonksiyonu yalnız rakam kabul ettiği için doğrudan derivePin ile, tuz hex olarak verilir.
    const saltHex = Array.from(new TextEncoder().encode('salt'), (x) => x.toString(16).padStart(2, '0')).join('');
    expect(await derivePin('passwd', saltHex, 1)).toBe('55ac046e56e3089fec1691c22544b605f94185216dde0465e68b9d57c20dacbc');
  });

  it('yanlış denemelerde artan bekleme', () => {
    expect([1, 2, 3, 4].map(lockoutMs)).toEqual([0, 0, 0, 0]);
    expect(lockoutMs(5)).toBe(30_000);
    expect(lockoutMs(6)).toBe(60_000);
    expect(lockoutMs(7)).toBe(120_000);
    expect(lockoutMs(8)).toBe(300_000);
    expect(lockoutMs(9)).toBe(900_000);
    expect(lockoutMs(30)).toBe(900_000);
  });
});
