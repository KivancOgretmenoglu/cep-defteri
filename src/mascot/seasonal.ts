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

// ── Gökyüzü ve gece kıyafeti ─────────────────────────────

/** Ana ekran başlığının arkasındaki gökyüzü bandı. */
export type SkyBand = 'dawn' | 'day' | 'golden' | 'evening' | 'night';

/** Yerel saate göre bant: şafak 5–10, gündüz 10–17, altın saat 17–19, akşam 19–22, gece 22–5. */
export function skyBand(hour: number): SkyBand {
  const h = ((Math.floor(hour) % 24) + 24) % 24;
  if (h >= 5 && h < 10) return 'dawn';
  if (h >= 10 && h < 17) return 'day';
  if (h >= 17 && h < 19) return 'golden';
  if (h >= 19 && h < 22) return 'evening';
  return 'night';
}

/** Güneş/ay sprite'ının konumu (0–1): x soldan sağa yol, y 0 = tepede, 1 = ufukta. */
export function skyBody(d: Date): { kind: 'sun' | 'moon'; x: number; y: number } {
  const t = d.getHours() + d.getMinutes() / 60;
  const sun = t >= 6 && t < 20;
  // Güneş 06→20, ay 20→06 boyunca bir yay çizer
  const p = sun ? (t - 6) / 14 : (((t - 20) % 24) + 24) % 24 / 10;
  const r = (v: number) => Math.round(v * 100) / 100;
  return { kind: sun ? 'sun' : 'moon', x: r(p), y: r(1 - Math.sin(Math.PI * p)) };
}

/** Pijama saatleri: 22:00–05:59. */
export const pajamaTime = (d: Date) => d.getHours() >= 22 || d.getHours() < 6;

/**
 * Ana ekran maskotunun kıyafeti. Öncelik: ajan (gizli toplamlar) > sınav haftası > özel gün > gece pijaması > kullanıcının seçimi.
 */
export function homeOutfit(o: { spy: boolean; exam: boolean; season: Season; night: boolean; user: string }): string {
  if (o.spy) return 'spy';
  if (o.exam) return 'exam';
  if (o.season) return o.season;
  if (o.night) return 'pajama';
  return o.user;
}
