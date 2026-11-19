/**
 * Gizli maskotlar: Ayarlar'ın en altındaki gizli kod alanına doğru kod girilince açılır.
 * Kodun kendisi kaynakta düz yazılmaz, yalnız karması (cyrb53) tutulur. Bu bir güvenlik önlemi değil,
 * sürprizin APK'yı açan birine hemen görünmemesi için; uygulama sunucusuz, kontrol cihazda yapılır.
 * Saf modül (tarayıcıya dokunmaz; testler kullanır).
 */
import { SECRET_KEYS, type MascotKey, type SecretMascotKey } from './characters';

/** Kod karşılaştırma biçimi: küçük harf (Türkçe kurallarıyla), boşluksuz. */
export function normalizeCode(input: string): string {
  return input.toLocaleLowerCase('tr').replace(/\s+/g, '');
}

/** cyrb53: kısa, hızlı, eşzamanlı 53 bit karma (36 tabanında). */
export function codeHash(s: string, seed = 0): string {
  let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < s.length; i++) {
    const ch = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

/** Kod karması → açtığı maskot. */
const CODES: Record<string, SecretMascotKey> = {
  '2fgs18nnumw': 'karafatma',
};

/** Girilen kod bir gizli maskotu açıyorsa onun anahtarı, değilse null. */
export function redeemCode(input: string): SecretMascotKey | null {
  const n = normalizeCode(input);
  if (!n) return null;
  return CODES[codeHash('cep-defteri:' + n)] ?? null;
}

/** Ayarlardaki açılmış listeden yalnız bilinen gizli anahtarlar (yedekten gelen bozuk değerler elenir). */
export function unlockedOf(list: unknown): SecretMascotKey[] {
  if (!Array.isArray(list)) return [];
  return SECRET_KEYS.filter((k) => list.includes(k));
}

/** Bu maskot seçicide görünür mü: herkese açık olanlar her zaman, gizliler yalnız açılmışsa. */
export const pickable = (k: MascotKey, unlocked: readonly string[]) => !(SECRET_KEYS as string[]).includes(k) || unlocked.includes(k);
