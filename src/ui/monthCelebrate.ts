/**
 * Ay sonu kutlaması: biten ay bütçe içinde kaldıysa karne ilk açıldığında bir kez konfeti.
 * Hangi ayların kutlandığı bu cihazda (localStorage) tutulur; erişilemezse en kötü ihtimalle
 * kutlama tekrar etmez ya da bir kez daha olur, hiçbir akış bozulmaz.
 */
const KEY = 'cep-defteri.celebratedMonths';

/** Saf karar: bütçe içinde, karnesi henüz görülmemiş (ya da en yeni) ve daha önce kutlanmamış ay. */
export function shouldCelebrateMonth(month: string, opts: { within: boolean; reportCardSeen: string | null; celebrated: string[] }): boolean {
  if (!opts.within) return false;
  if (opts.celebrated.includes(month)) return false;
  return opts.reportCardSeen === null || month > opts.reportCardSeen;
}

export function celebratedMonths(scope: string): string[] {
  try {
    const raw = localStorage.getItem(`${KEY}.${scope}`);
    const v = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function markMonthCelebrated(scope: string, month: string) {
  try {
    const next = [...celebratedMonths(scope).filter((m) => m !== month), month].slice(-24);
    localStorage.setItem(`${KEY}.${scope}`, JSON.stringify(next));
  } catch {
    /* depolama kapalı: yok say */
  }
}
