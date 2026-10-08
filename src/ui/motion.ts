/**
 * Küçük hareket yardımcıları (bağımlılıksız): sayı sayacı, liste yerleşme (FLIP) ve tercih kontrolü.
 * Hepsi kozmetiktir; hareket azaltma tercihinde ve ilk çizimde hiçbir şey oynatmaz.
 */
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useStore } from '../store/store';

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** CSS'teki --ease-snappy / --spring-bouncy ile aynı eğriler (WAAPI değişken okuyamaz). */
export const EASE_SNAPPY = 'cubic-bezier(0.2, 0.9, 0.3, 1)';
export const SPRING_BOUNCY = 'cubic-bezier(0.34, 1.56, 0.64, 1)';

const easeOutCubic = (p: number) => 1 - Math.pow(1 - p, 3);

/**
 * Tam sayı (kuruş) değeri değiştiğinde eski değerden yenisine kısa bir sayma.
 * İlk çizimde, `enabled` kapalıyken (ör. tutarlar gizli) ya da hareket azaltmada doğrudan değeri döndürür.
 */
export function useCountUp(value: number, wanted = true, ms = 520): number {
  const enabled = wanted && !prefersReducedMotion();
  // cur: o an gösterilen değer (sayma sırasında ara değer); state yalnız yeniden çizim tetikler.
  const cur = useRef(value);
  const [, redraw] = useState(0);
  useEffect(() => {
    const from = cur.current;
    if (!enabled) {
      cur.current = value; // gizliyken sayma yok; açılınca doğrudan son değer
      return;
    }
    if (from === value) return;
    if (typeof requestAnimationFrame === 'undefined') {
      cur.current = value;
      redraw((n) => n + 1);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const whole = from % 100 === 0 && value % 100 === 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / ms);
      const raw = from + (value - from) * easeOutCubic(p);
      // İki uç da tam lira ise ara değerler de tam lira: kuruş hanesi belirip kaybolmasın.
      const v = p >= 1 ? value : whole ? Math.round(raw / 100) * 100 : Math.round(raw);
      cur.current = v;
      redraw((n) => n + 1);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, enabled, ms]);
  return enabled ? cur.current : value;
}

const FLIP_LIMIT = 40;

/**
 * Kayıt listesinde yerleşme: kullanıcı bir kayıt eklediğinde (store `pulse` arttığında) yeni satır yaylanarak
 * girer, diğerleri eski yerlerinden yenisine kayar (FLIP). Satırlar `data-tx` özniteliği taşır.
 * Filtre/arama değişimi ya da geri alma gibi kayıt dışı değişikliklerde hiçbir şey oynamaz.
 */
export function useListSettle<T extends HTMLElement>(ids: readonly string[]) {
  const ref = useRef<T>(null);
  const pulse = useStore((s) => s.pulse);
  const prev = useRef<{ ids: Set<string>; tops: Map<string, number>; pulse: number } | null>(null);
  const key = ids.join('|');
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) {
      prev.current = null;
      return;
    }
    const base = root.getBoundingClientRect().top;
    const rows = Array.from(root.querySelectorAll<HTMLElement>('[data-tx]')).slice(0, FLIP_LIMIT);
    const tops = new Map(rows.map((el) => [el.dataset.tx!, el.getBoundingClientRect().top - base]));
    const p = prev.current;
    prev.current = { ids: new Set(ids), tops, pulse };
    if (!p || p.pulse === pulse || prefersReducedMotion() || typeof root.animate !== 'function') return;
    const fresh = ids.filter((id) => !p.ids.has(id));
    if (fresh.length > 3) return;
    const soft = getComputedStyle(root).getPropertyValue('--accent-soft').trim();
    for (const el of rows) {
      const id = el.dataset.tx!;
      if (!p.ids.has(id)) {
        el.animate(
          [
            { opacity: 0, transform: 'translateY(-10px) scale(0.96)' },
            { opacity: 1, transform: 'none' },
          ],
          { duration: 360, easing: SPRING_BOUNCY },
        );
        const btn = el.firstElementChild as HTMLElement | null;
        if (btn && soft) btn.animate([{ backgroundColor: soft }, { backgroundColor: 'transparent' }], { duration: 1100, easing: 'ease-out' });
        continue;
      }
      const old = p.tops.get(id);
      const now = tops.get(id)!;
      if (old === undefined || Math.abs(old - now) < 1) continue;
      el.animate([{ transform: `translateY(${old - now}px)` }, { transform: 'none' }], { duration: 320, easing: EASE_SNAPPY });
    }
  }, [key, pulse]);
  return ref;
}
