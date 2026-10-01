/**
 * Günün saatine göre Clawd'ın kozmetik hâli (kahve, gece takkesi, uykulu gözler).
 * Yalnız görünüşü etkiler; duygu (mood) kurallarına hiçbir şey katmaz.
 */
export interface DayPhase {
  /** 06:00–09:59 */
  morning: boolean;
  /** 23:00–05:59 */
  night: boolean;
  /** Pazartesi 06:00–11:59: biraz daha uykulu */
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
