/**
 * PIN özeti: PBKDF2-SHA256 (WebCrypto), rastgele tuz. PIN'in kendisi hiçbir yerde saklanmaz.
 * Not: Bu bir gizlilik perdesidir; kayıtlar şifrelenmez (PIN'i unutan kullanıcı verisini yedekten geri alabilsin diye).
 */

export const PIN_ITERATIONS = 150_000;

const toHex = (b: ArrayBuffer | Uint8Array) => Array.from(b instanceof Uint8Array ? b : new Uint8Array(b), (x) => x.toString(16).padStart(2, '0')).join('');
function fromHex(h: string): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(new ArrayBuffer(h.length / 2));
  for (let i = 0; i < out.length; i++) out[i] = parseInt(h.slice(i * 2, i * 2 + 2), 16);
  return out;
}

/** 4–6 haneli rakam mı? */
export const isValidPin = (pin: string) => /^\d{4,6}$/.test(pin);

export function newSalt(): string {
  const s = new Uint8Array(16);
  crypto.getRandomValues(s);
  return toHex(s);
}

export async function derivePin(pin: string, saltHex: string, iterations = PIN_ITERATIONS): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: fromHex(saltHex), iterations }, key, 256);
  return toHex(bits);
}

export async function hashPin(pin: string): Promise<{ pinHash: string; salt: string }> {
  if (!isValidPin(pin)) throw new Error('PIN 4–6 haneli olmalı.');
  const salt = newSalt();
  return { pinHash: await derivePin(pin, salt), salt };
}

/** Sabit süreli karşılaştırma. */
function sameHex(a: string, b: string) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

export async function verifyPin(pin: string, pinHash: string | null, salt: string | null): Promise<boolean> {
  if (!pinHash || !salt || !isValidPin(pin)) return false;
  return sameHex(await derivePin(pin, salt), pinHash);
}

/**
 * Yanlış deneme sonrası bekleme (ms). İlk 4 hata serbest; sonra 30 sn, 1 dk, 2 dk, 5 dk, 15 dk…
 * `failed`: toplam üst üste yanlış deneme sayısı (bu deneme dahil).
 */
export function lockoutMs(failed: number): number {
  if (failed < 5) return 0;
  const steps = [30, 60, 120, 300];
  const i = failed - 5;
  return (i < steps.length ? steps[i] : 900) * 1000;
}
