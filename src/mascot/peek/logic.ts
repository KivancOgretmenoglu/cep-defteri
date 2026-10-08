/**
 * Kaydırma bakışı kuralları (saf): uzun bir ekranı aşağı kaydırınca seçili maskot ara sıra
 * ekran kenarından yarı gizli bakar. Ekran ziyareti başına en fazla bir kez, iki bakış arası
 * en az 60 sn, yalnız 400 px'ten fazla kaydırınca ve hiçbir şey araya girmiyorken.
 */
export const PEEK_SCREENS = ['home', 'tx', 'budget', 'reports'] as const;
export const PEEK_GAP_MS = 60_000;
export const PEEK_SCROLL_PX = 400;
/** Ziyaret başına bakış şansı ("ara sıra") */
export const PEEK_CHANCE = 0.5;
export const PEEK_STAY_MS = 2600;

export interface PeekCtx {
  enabled: boolean;
  reduced: boolean;
  onboarding: boolean;
  screen: string;
  sheetOpen: boolean;
  /** Misafir maskot, ipucu, bildirim ya da maskot sözü görünüyor */
  busy: boolean;
  hidden: boolean;
  /** Bu ziyarette zaten baktı mı / şansı tuttu mu */
  usedThisVisit: boolean;
  luckyVisit: boolean;
  scrollY: number;
  /** Ekranın ana maskot notu görünür alanda mı */
  noteVisible: boolean;
  now: number;
  lastPeekAt: number;
  /** Hata ayıklama: zaman/şans kurallarını atla */
  forced?: boolean;
}

export type PeekBlock =
  | 'disabled' | 'reduced' | 'onboarding' | 'screen' | 'sheet' | 'busy' | 'hidden'
  | 'used' | 'unlucky' | 'scroll' | 'note' | 'gap';

export function peekBlock(c: PeekCtx): PeekBlock | null {
  if (!c.enabled) return 'disabled';
  if (c.reduced) return 'reduced';
  if (c.onboarding) return 'onboarding';
  if (!(PEEK_SCREENS as readonly string[]).includes(c.screen)) return 'screen';
  if (c.sheetOpen) return 'sheet';
  if (c.hidden) return 'hidden';
  if (c.busy) return 'busy';
  if (c.noteVisible) return 'note';
  if (c.forced) return c.scrollY > 120 ? null : 'scroll';
  if (c.usedThisVisit) return 'used';
  if (!c.luckyVisit) return 'unlucky';
  if (c.scrollY <= PEEK_SCROLL_PX) return 'scroll';
  if (c.now - c.lastPeekAt < PEEK_GAP_MS) return 'gap';
  return null;
}
