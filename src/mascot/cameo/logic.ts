/**
 * Misafir maskot kararı: ne zaman bir sahne "kurulur", hangisi, hangi ekranda gösterilir.
 * Saf işlevler; saat ve rastgelelik dışarıdan verilir (testler belirleyici).
 */
import type { Screen } from '../../ui/nav';
import { hourFits, SCENE_IDS, SCENES, type SceneId } from './scenes';

/** Yaklaşık 5 açılışta bir. */
export const CHANCE = 0.2;
/** İki sahne arası en az 5 dakika. */
export const MIN_GAP_MS = 5 * 60_000;
/** İlk açılışlarda hiç çıkmaz. */
export const MIN_OPENS = 2;
/** Şanssız seri: bu kadar açılış sahnesiz geçtiyse bir sonraki kesin kurulur. */
export const PITY_OPENS = 8;
/** Arka plandan bu kadar süre sonra dönüş yeni bir "açılış" sayılır (Android uygulamayı bellekte tutar). */
export const REOPEN_AFTER_MS = 10_000;

export interface CameoCounters {
  /** Toplam açılış */
  opens: number;
  /** Son sahneden beri açılış */
  sinceLast: number;
  /** Son sahnenin başladığı an (ms) */
  lastAt: number;
  /** Zar tuttu ama sahne gösterilemedi: bir sonraki açılışa devreder */
  pending: boolean;
}
export const FRESH: CameoCounters = { opens: 0, sinceLast: 0, lastAt: 0, pending: false };

export const KEY = 'cd.cameo.v1';

export function parseCounters(raw: string | null): CameoCounters {
  try {
    const o = raw ? JSON.parse(raw) : null;
    const n = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : 0);
    return o && typeof o === 'object' ? { opens: n(o.opens), sinceLast: n(o.sinceLast), lastAt: n(o.lastAt), pending: o.pending === true } : { ...FRESH };
  } catch {
    return { ...FRESH };
  }
}

/** Bir açılışı say ve bu açılışta sahne kurulup kurulmayacağını (zar) belirle. */
export function registerOpen(c: CameoCounters, now: number, rand: () => number): { counters: CameoCounters; armed: boolean } {
  const counters = { ...c, opens: c.opens + 1, sinceLast: c.sinceLast + 1 };
  if (counters.opens < MIN_OPENS) return { counters, armed: false };
  if (now - counters.lastAt < MIN_GAP_MS) return { counters, armed: false };
  const armed = counters.pending || counters.sinceLast >= PITY_OPENS || rand() < CHANCE;
  return { counters: { ...counters, pending: armed }, armed };
}

/** Sahne gösterilince sayaçları sıfırla. */
export const markShown = (c: CameoCounters, now: number): CameoCounters => ({ ...c, sinceLast: 0, lastAt: now, pending: false });

/** Saate uyan sahneler, rastgele sırada (bu açılışın "oyun planı"). */
export function planOpen(hour: number, rand: () => number): SceneId[] {
  const ids = SCENE_IDS.filter((id) => hourFits(SCENES[id], hour));
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return ids;
}

/** Plan sırasına göre bu ekrana uyan ilk sahne (yoksa null). */
export function sceneForScreen(plan: SceneId[], screen: Screen): SceneId | null {
  return plan.find((id) => SCENES[id].screens.includes(screen)) ?? null;
}

export interface BlockCtx {
  enabled: boolean;
  noAccounts: boolean;
  sheetOpen: boolean;
  typing: boolean;
  hidden: boolean;
  /** Başka bir maskot/ipucu/bildirim şu an ekranda (iki maskot aynı anda konuşmasın) */
  busy: boolean;
}
/** Şu an sahne gösterilemez mi? Nedenini döndürür. */
export function blockedReason(b: BlockCtx): 'off' | 'onboarding' | 'sheet' | 'typing' | 'hidden' | 'busy' | null {
  if (!b.enabled) return 'off';
  if (b.noAccounts) return 'onboarding';
  if (b.sheetOpen) return 'sheet';
  if (b.typing) return 'typing';
  if (b.hidden) return 'hidden';
  if (b.busy) return 'busy';
  return null;
}

/** Gösterim gecikmesi 3–6 sn, kalma süresi 12–20 sn. */
export const showDelayMs = (rand: () => number) => Math.round(3000 + rand() * 3000);
export const stayMs = (rand: () => number) => Math.round(12_000 + rand() * 8000);
