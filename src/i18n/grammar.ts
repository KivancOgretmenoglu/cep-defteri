/** Küçük dil bilgisi yardımcıları (sözlüklerdeki işlev değerleri için). */

/** İngilizce çoğul: plural(1, 'day') → "1 day", plural(3, 'day') → "3 days". */
export const plural = (n: number | string, one: string, many = one + 's') => `${n} ${Number(n) === 1 ? one : many}`;
