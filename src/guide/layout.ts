/** Rehber balonunun yerleşimi (saf; testler doğrudan kullanır). */

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface Frame {
  vw: number;
  vh: number;
  /** Balonun girebileceği dikey aralık (güvenli alanlar ve tab çubuğu hariç) */
  top: number;
  bottom: number;
}

const GAP = 14;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Balonun yeri: hedefin altı ya da üstü; sığmazsa geniş tarafa, ekrandan taşmadan. Ok yalnız bitişikse görünür. */
export function placeBubble(box: Box | null, f: Frame, bh: number, maxW = 360) {
  const w = Math.min(maxW, f.vw - 32);
  if (!box) {
    return { left: (f.vw - w) / 2, top: clamp((f.top + f.bottom) / 2 - bh / 2, f.top, Math.max(f.top, f.bottom - bh)), w, side: 'none' as const, arrow: 0 };
  }
  const cx = box.x + box.w / 2;
  const left = clamp(cx - w / 2, 16, f.vw - 16 - w);
  const arrow = clamp(cx - left, 24, w - 24);
  const below = box.y + box.h + GAP;
  const above = box.y - GAP - bh;
  if (below + bh <= f.bottom) return { left, top: below, w, side: 'below' as const, arrow };
  if (above >= f.top) return { left, top: above, w, side: 'above' as const, arrow };
  // İkisi de sığmıyor (büyük hedef): geniş tarafa yasla, gerekirse hedefin üstüne binsin.
  const spaceBelow = f.bottom - (box.y + box.h);
  const spaceAbove = box.y - f.top;
  const top = spaceBelow >= spaceAbove ? clamp(below, f.top, Math.max(f.top, f.bottom - bh)) : clamp(above, f.top, Math.max(f.top, f.bottom - bh));
  return { left, top, w, side: 'none' as const, arrow };
}

