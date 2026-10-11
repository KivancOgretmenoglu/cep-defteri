/**
 * Rehberin küresel durumu: açık mı, yeni kurulumdan sonra kendiliğinden başlaması bekleniyor mu.
 * Açıkken <body data-tour="1"> olur; misafir maskot, kaydırma bakışı ve ipuçları bunu görünce bekler.
 */
import { useSyncExternalStore } from 'react';

interface GuideState {
  active: boolean;
  /** Başlatma sayacı: her başlatmada artar (rehber 1. adımdan yeniden kurulur). */
  run: number;
  /** Kurulum bitti; Özet açılınca rehber bir kez kendiliğinden başlasın. */
  pendingAuto: boolean;
}

let st: GuideState = { active: false, run: 0, pendingAuto: false };
const ls = new Set<() => void>();
const set = (p: Partial<GuideState>) => {
  st = { ...st, ...p };
  if (typeof document !== 'undefined') {
    if (st.active) document.body.dataset.tour = '1';
    else delete document.body.dataset.tour;
  }
  ls.forEach((l) => l());
};

export const getGuide = () => st;
export function useGuide(): GuideState {
  return useSyncExternalStore(
    (l) => {
      ls.add(l);
      return () => ls.delete(l);
    },
    () => st,
    () => st,
  );
}

/** Rehber 1. adımdan başlar. */
export const startGuide = () => set({ active: true, run: st.run + 1, pendingAuto: false });
export const stopGuide = () => set({ active: false });
/** Kurulumun son adımı çağırır: hesaplar oluşup Özet çizilince rehber başlar. */
export const requestAutoGuide = () => set({ pendingAuto: true });
export const clearAutoGuide = () => set({ pendingAuto: false });

/** Rehber açık mı (DOM bayrağı; React dışı kodlar için). */
export const tourActive = () => typeof document !== 'undefined' && document.body.dataset.tour === '1';
