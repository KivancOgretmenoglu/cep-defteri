/**
 * Akıllı varsayılanlar: yeni kayıt formunda kullanıcının kendi geçmişinden sıralama ve öneri.
 * Hiçbir şeyi kendiliğinden seçmez; yalnızca sırayı ve tek dokunuşluk önerileri belirler.
 * Saf fonksiyonlar: bugün ve saat dışarıdan verilir (testlerde deterministik).
 */
import type { Data, ID, Tx } from './types';
import type { Money } from './money';
import { addDays, diffDays, todayISO, type ISODate } from './dates';

/** Günün dilimi: sabah 05–11, öğle 11–16, akşam 16–22, gece 22–05. */
export type HourBand = 'morning' | 'noon' | 'evening' | 'night';
export function hourBand(hour: number): HourBand {
  if (hour >= 5 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 16) return 'noon';
  if (hour >= 16 && hour < 22) return 'evening';
  return 'night';
}

/** Değerlendirilen geçmiş penceresi (gün) ve yarılanma süresi. */
const WINDOW = 90;
const HALF_LIFE = 30;
/** Aynı saat diliminde girilmiş kayıtlara eklenen pay (ağırlığın bu katı kadar). */
const BAND_BOOST = 0.6;

/**
 * Kaydın girildiği saat dilimi; yalnızca kayıt, girildiği gün için yazıldıysa anlamlıdır
 * (geçmişe dönük ya da içe aktarılan kayıtların saati harcamanın saati değildir).
 */
function enteredBand(t: Tx): HourBand | null {
  if (!t.createdAt) return null;
  const at = new Date(t.createdAt);
  return todayISO(at) === t.date ? hourBand(at.getHours()) : null;
}

/**
 * Kategorileri kullanıcının kullanım sıklığına göre sıralar (son 90 gün, yakın tarih daha ağır,
 * şu anki saat diliminde sık kullanılanlara hafif öncelik). Geçmişi olmayan kategoriler listede yer almaz;
 * çağıran taraf onları varsayılan sırayla sona ekler.
 */
export function rankCategories(data: Data, kind: 'expense' | 'income', today: ISODate, hour: number): ID[] {
  const from = addDays(today, -WINDOW);
  const band = hourBand(hour);
  const score = new Map<ID, { s: number; last: number }>();
  for (const t of data.txs) {
    if (t.type !== kind || !t.categoryId || t.date < from || t.date > today) continue;
    const w = Math.pow(0.5, diffDays(today, t.date) / HALF_LIFE);
    const boost = enteredBand(t) === band ? w * BAND_BOOST : 0;
    const cur = score.get(t.categoryId);
    if (cur) {
      cur.s += w + boost;
      cur.last = Math.max(cur.last, t.seq);
    } else score.set(t.categoryId, { s: w + boost, last: t.seq });
  }
  return [...score.entries()].sort((a, b) => b[1].s - a[1].s || b[1].last - a[1].last).map(([id]) => id);
}

/** Yuvarlak tutar: tam lira ve 5'in katı (kuruşlu ya da 37 TL gibi tutarlar öneri olmaz). */
export const isRoundAmount = (m: Money) => m > 0 && m % 500 === 0;

/**
 * Bu türde en sık girilen yuvarlak tutarlar (son 90 gün, en az 2 kez, planlı kalemler hariç).
 * En fazla `max` tane, küçükten büyüğe. Geçmiş yoksa boş döner; uydurma tutar önerilmez.
 */
export function quickAmounts(data: Data, kind: 'expense' | 'income', today: ISODate, max = 4): Money[] {
  const from = addDays(today, -WINDOW);
  const counts = new Map<Money, { n: number; last: number }>();
  for (const t of data.txs) {
    if (t.type !== kind || t.planRef || t.date < from || t.date > today || !isRoundAmount(t.amount)) continue;
    const c = counts.get(t.amount);
    if (c) {
      c.n++;
      c.last = Math.max(c.last, t.seq);
    } else counts.set(t.amount, { n: 1, last: t.seq });
  }
  return [...counts.entries()]
    .filter(([, c]) => c.n >= 2)
    .sort((a, b) => b[1].n - a[1].n || b[1].last - a[1].last)
    .slice(0, max)
    .map(([m]) => m)
    .sort((a, b) => a - b);
}
