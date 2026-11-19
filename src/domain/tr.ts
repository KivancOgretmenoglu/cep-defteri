/**
 * Türkçe yüzde ekleri: "%55'i", "%104'ünü", "%80'ine". Ek, sayının okunuşunun son kelimesine göre seçilir.
 */
const DIGITS = ['sıfır', 'bir', 'iki', 'üç', 'dört', 'beş', 'altı', 'yedi', 'sekiz', 'dokuz'];
const TENS = ['', 'on', 'yirmi', 'otuz', 'kırk', 'elli', 'altmış', 'yetmiş', 'seksen', 'doksan'];

function lastWord(n: number): string {
  n = Math.abs(Math.trunc(n));
  if (n === 0) return 'sıfır';
  if (n % 10) return DIGITS[n % 10];
  if (n % 100) return TENS[(n % 100) / 10];
  if (n % 1000) return 'yüz';
  if (n % 1_000_000) return 'bin';
  return 'milyon';
}

const VOWELS = 'aıoueiöü';
function lastVowel(w: string) {
  for (let i = w.length - 1; i >= 0; i--) if (VOWELS.includes(w[i])) return w[i];
  return 'e';
}
/** Dörtlü uyum: ı/i/u/ü */
const v4 = (v: string) => ({ a: 'ı', ı: 'ı', o: 'u', u: 'u', e: 'i', i: 'i', ö: 'ü', ü: 'ü' })[v] ?? 'i';
/** İkili uyum: a/e */
const v2 = (v: string) => ('aıou'.includes(v) ? 'a' : 'e');

export type PctForm = 'poss' | 'acc' | 'dat' | 'locYou';

/** %n + ek. poss: "%55'i", acc: "%70'ini", dat: "%80'ine", locYou: "%85'indesin" */
export function pct(n: number, form: PctForm): string {
  const w = lastWord(n);
  const lv = lastVowel(w);
  const endsVowel = VOWELS.includes(w[w.length - 1]);
  const i = v4(lv);
  const poss = (endsVowel ? 's' : '') + i;
  let suf = poss;
  if (form === 'acc') suf += 'n' + i;
  else if (form === 'dat') suf += 'n' + v2(lv);
  else if (form === 'locYou') {
    const a = v2(lv);
    suf += 'nd' + a + 's' + (a === 'a' ? 'ın' : 'in');
  }
  return `%${n}'${suf}`;
}

/**
 * Özel isme kesme işaretiyle hâl eki: "Ekim'de", "Kasım'a", "Pamuk'tan", "Bilge'den", "Mayıs'ta".
 * loc: -da/-de/-ta/-te; dat: -a/-e (ünlüden sonra -ya/-ye); abl: -dan/-den/-tan/-ten.
 * Ünsüz benzeşmesi (fıstıkçı şahap) son harfe göre; kısaltma ve sayı okunuşu desteklenmez.
 */
export function properSuffix(word: string, kind: 'loc' | 'dat' | 'abl'): string {
  const w = word.trim();
  const low = w.toLocaleLowerCase('tr');
  const last = low[low.length - 1] ?? 'e';
  const a = v2(lastVowel(low));
  const hard = 'fstkçşhp'.includes(last);
  const vowelEnd = VOWELS.includes(last);
  if (kind === 'dat') return `${w}'${vowelEnd ? 'y' : ''}${a}`;
  const d = hard ? 't' : 'd';
  return `${w}'${d}${a}${kind === 'abl' ? 'n' : ''}`;
}
