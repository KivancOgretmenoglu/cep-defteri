/**
 * Günün saatine ve takvime göre maskotun kozmetik hâli. Duygu (mood) kurallarına hiçbir şey katmaz.
 * Özel gün kıyafetleri toplanmaz; tarihi gelince kendiliğinden giyilir (yalnız ana ekranda).
 */
import type { ISODate } from '../domain/dates';

export interface DayPhase {
  /** 06:00–09:59 */
  morning: boolean;
  /** 23:00–05:59 */
  night: boolean;
  /** Pazartesi 06:00–11:59 */
  mondayMorning: boolean;
  /** Ayın ilk üç günü */
  monthStart: boolean;
}

export function dayPhase(d: Date): DayPhase {
  const h = d.getHours();
  return {
    morning: h >= 6 && h < 10,
    night: h >= 23 || h < 6,
    mondayMorning: d.getDay() === 1 && h >= 6 && h < 12,
    monthStart: d.getDate() <= 3,
  };
}

/**
 * Bayram günleri (Diyanet takvimi; arefe dahil). Yalnız resmî olarak doğrulanmış yıllar.
 * Yeni yıllar Diyanet’in yayımladığı takvimden eklenmeli.
 */
const BAYRAM: [from: ISODate, to: ISODate][] = [
  ['2026-03-19', '2026-03-22'], // Ramazan Bayramı 2026
  ['2026-05-26', '2026-05-30'], // Kurban Bayramı 2026
  ['2027-03-08', '2027-03-11'], // Ramazan Bayramı 2027
  ['2027-05-15', '2027-05-19'], // Kurban Bayramı 2027
];

export type Season = 'newyear' | 'bayram' | 'summer' | null;

/** O günün özel kıyafeti (öncelik: bayram > yılbaşı > yaz). */
export function seasonFor(day: ISODate): Season {
  if (BAYRAM.some(([a, b]) => day >= a && day <= b)) return 'bayram';
  const md = day.slice(5);
  if (md >= '12-24' || md <= '01-02') return 'newyear';
  if (md >= '07-01' && md <= '08-31') return 'summer';
  return null;
}

/** Sınav haftası modu açık mı (bitiş günü dahil). */
export const examActive = (examUntil: string | null | undefined, today: ISODate) => !!examUntil && today <= examUntil;
