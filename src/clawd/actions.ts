/**
 * Clawd'ın kısa hareketleri: adım adım (piksel hissi) kare dizileri. Hepsi ≤ ~1,5 sn.
 * Saf veri üretir; zamanlama `lively.ts` içinde yapılır.
 */
import { CREAM, INK, type ClawdLive, type R } from './Clawd';
import { DIZZY, TICKLE } from './quips';

export interface Frame extends ClawdLive {
  ms: number;
  /** Kısa ünlem (baloncuk değil): "Hey!", "Hapşu!" */
  pop?: string;
  /** Bahçıvanın filizi bir piksel uzar */
  grow?: boolean;
}

export type ActionName =
  // sürprizler
  | 'stretch' | 'hop' | 'wave' | 'turn' | 'peek' | 'sneeze' | 'yawn' | 'dance' | 'lookaround'
  // kıyafete özgü
  | 'glasses' | 'water' | 'write' | 'pages' | 'music' | 'shiver' | 'capflip' | 'spylook' | 'glint' | 'psst'
  // dokunma
  | 'giggle' | 'jump' | 'spin' | 'hey' | 'dizzy' | 'tickle'
  // olaylar
  | 'note' | 'coins' | 'sprout' | 'confetti' | 'wiggle' | 'shrug' | 'disguise' | 'undisguise' | 'nod';

export interface ActionCtx {
  outfit: string;
  /** Bahçıvan filizinin ek boyu (0–2) */
  sprout: number;
}

// ── Parçacıklar ──────────────────────────────────────
const GOLD = '#E5B94A';
const coin = (x: number, y: number): R[] => [[x, y, 2, 2, GOLD], [x, y, 1, 1, '#F3D98A']];
const star = (x: number, y: number, c = GOLD): R[] => [[x + 1, y, 1, 1, c], [x, y + 1, 3, 1, c], [x + 1, y + 2, 1, 1, c]];
const note = (x: number, y: number, c = '#9B7BC6'): R[] => [[x + 1, y, 1, 3, c], [x + 2, y, 1, 1, c], [x, y + 2, 2, 2, c]];
const drop = (x: number, y: number): R[] => [[x, y, 1, 2, '#6FB7E0']];
const puff = (x: number, y: number): R[] => [[x, y, 2, 1, '#E3DCCF'], [x - 1, y + 1, 4, 1, '#E3DCCF'], [x, y + 2, 2, 1, '#E3DCCF']];
const pencil = (tx: number, ty: number): R[] => [[tx, ty, 1, 1, INK], [tx + 1, ty - 1, 1, 1, GOLD], [tx + 2, ty - 2, 1, 1, GOLD], [tx + 3, ty - 3, 1, 1, '#E8577A']];
const CONF = ['#E8577A', '#3E8A8C', GOLD, '#9B7BC6', '#6F9D7E', '#4A6FA5'];
const confetti = (seed: number): R[] =>
  Array.from({ length: 12 }, (_, i): R => {
    const k = (i * 7 + seed * 5) % 13;
    return [(i * 11 + seed * 3) % 31, (k + seed * 2 + i) % 9, 1, 1, CONF[(i + seed) % CONF.length]];
  });
/** Kılık değiştirme bulutu: figürü örter. */
const cloud = (big: boolean): R[] =>
  big
    ? [[8, 6, 16, 14, '#E8E1D4'], [6, 9, 20, 9, '#E8E1D4'], [10, 4, 12, 2, '#E8E1D4'], [9, 8, 3, 3, '#F6F1E8'], [18, 13, 4, 3, '#F6F1E8'], [13, 17, 5, 3, '#D9D0C1']]
    : [[11, 9, 10, 9, '#E8E1D4'], [9, 11, 14, 5, '#E8E1D4'], [12, 10, 3, 2, '#F6F1E8']];

/** Bahçıvan filizinin ek pikselleri (seviyeye göre). */
export function sproutRects(level: number): R[] {
  const r: R[] = [];
  if (level >= 1) r.push([3, 9, 1, 2, '#4E8A42'], [2, 8, 1, 1, '#7DBA62']);
  if (level >= 2) r.push([3, 7, 1, 2, '#4E8A42'], [4, 7, 1, 1, '#7DBA62'], [3, 6, 1, 1, '#9BD07E']);
  return r;
}

const rep = <T,>(n: number, f: (i: number) => T[]): T[] => Array.from({ length: n }, (_, i) => f(i)).flat();

export function buildAction(name: ActionName, ctx: ActionCtx): Frame[] {
  switch (name) {
    // ── Sürprizler ──
    case 'stretch':
      return [
        { ms: 160, arms: 'up', eyes: 'closed' },
        { ms: 650, arms: 'stretch', eyes: 'squeeze', dy: -1 },
        { ms: 250, arms: 'up', eyes: 'closed' },
        { ms: 120, eyes: 'happy' },
      ];
    case 'hop':
      return [
        { ms: 100, squash: true },
        { ms: 100, dy: -2 },
        { ms: 160, dy: -3, eyes: 'happy' },
        { ms: 100, dy: -2 },
        { ms: 100, squash: true },
      ];
    case 'wave':
      return [...rep(3, () => [{ ms: 190, arms: 'wave', eyes: 'happy', blush: true } as Frame, { ms: 190, arms: 'wave2', eyes: 'happy', blush: true } as Frame]), { ms: 150, arms: 'wave', eyes: 'happy' }];
    case 'turn':
      return [
        { ms: 110, eyes: 'closed' },
        { ms: 450, flip: true, look: [-1, 0] },
        { ms: 450, flip: true, look: [-1, 0] as [number, number], eyes: 'wide' },
        { ms: 110, eyes: 'closed' },
      ];
    case 'peek':
      return [
        { ms: 90, clipY: 21, dy: 2 },
        { ms: 90, clipY: 21, dy: 5 },
        { ms: 90, clipY: 21, dy: 9 },
        { ms: 260, clipY: 21, dy: 18 },
        { ms: 140, clipY: 21, dy: 8 },
        { ms: 300, clipY: 21, dy: 6, look: [-1, 0] },
        { ms: 300, clipY: 21, dy: 6, look: [1, 0] },
        { ms: 90, clipY: 21, dy: 4 },
        { ms: 90, clipY: 21, dy: 1 },
      ];
    case 'sneeze':
      return [
        { ms: 260, eyes: 'squeeze', dy: -1, pop: 'Ha...' },
        { ms: 260, eyes: 'squeeze', dy: -1, arms: 'up' },
        { ms: 200, eyes: 'closed', squash: true, dx: -1, over: [...puff(26, 14)], pop: 'Hapşu!' },
        { ms: 220, eyes: 'closed', over: [...puff(28, 12)] },
        { ms: 160, blush: true },
      ];
    case 'yawn':
      return [
        { ms: 200, eyes: 'closed', arms: 'up' },
        { ms: 700, eyes: 'squeeze', arms: 'stretch', dy: -1, pop: 'Hıaaa...' },
        { ms: 300, eyes: 'closed', arms: 'up' },
        { ms: 300, eyes: 'half' },
      ];
    case 'dance':
      return rep(3, (i) => [
        { ms: 200, dx: -1, arms: 'up', eyes: 'happy', over: confetti(i * 2) } as Frame,
        { ms: 200, dy: -1, arms: 'wave', eyes: 'happy', over: confetti(i * 2 + 1) } as Frame,
        { ms: 200, dx: 1, arms: 'up', eyes: 'happy', over: confetti(i * 2 + 2) } as Frame,
        { ms: 200, dy: -1, arms: 'wave2', eyes: 'happy', flip: true } as Frame,
      ]).slice(0, 7);
    case 'lookaround':
      return [
        { ms: 420, look: [-1, 0] },
        { ms: 420, look: [1, 0] },
        { ms: 320, look: [0, -1] },
        { ms: 120, eyes: 'closed' },
      ];

    // ── Kıyafete özgü ──
    case 'glasses':
      return [
        { ms: 180, arms: 'face-r' },
        { ms: 200, arms: 'face-r', faceDy: -1 },
        { ms: 160, arms: 'face-r' },
        { ms: 200, arms: 'face-r', faceDy: -1 },
        { ms: 260, arms: 'face-r', eyes: 'wide' },
        { ms: 160, eyes: 'happy' },
      ];
    case 'water': {
      const can: R[] = [[3, 8, 4, 2, '#6E8FA0'], [2, 8, 1, 1, '#6E8FA0'], [4, 7, 2, 1, '#55717F']];
      return [
        { ms: 160, arms: 'up', props: can },
        { ms: 180, arms: 'up', props: can, over: drop(2, 9) },
        { ms: 180, arms: 'up', props: can, over: [...drop(2, 11), ...drop(1, 9)] },
        { ms: 180, arms: 'up', props: can, over: [...drop(1, 11), ...drop(2, 9)] },
        { ms: 160, arms: 'up', props: can, over: drop(2, 11) },
        { ms: 380, eyes: 'happy', grow: ctx.sprout < 2, over: star(0, 4, '#9BD07E') },
      ];
    }
    case 'write': {
      const line = (k: number): R[] => (k ? [[4, 12, k, 1, '#8C8272']] : []);
      return [
        { ms: 140, look: [-1, 1], props: pencil(4, 12) },
        { ms: 160, look: [-1, 1], props: [...line(1), ...pencil(5, 12)] },
        { ms: 160, look: [-1, 1], props: [...line(1), ...pencil(4, 12)] },
        { ms: 160, look: [-1, 1], props: [...line(2), ...pencil(5, 12)] },
        { ms: 160, look: [-1, 1], props: [...line(2), ...pencil(6, 11)] },
        { ms: 320, eyes: 'happy', props: line(2) },
      ];
    }
    case 'pages': {
      const page = (x: number, y: number, w: number, h: number): R[] => [[x, y, w, h, CREAM], [x, y + h - 1, w, 1, '#E3D9C6']];
      return [
        { ms: 140, look: [1, 0] },
        { ms: 140, look: [1, 0], props: page(27, 10, 2, 7) },
        { ms: 140, look: [1, 0], props: page(26, 8, 1, 9) },
        { ms: 140, look: [1, 0], props: page(24, 9, 2, 8) },
        { ms: 140, look: [1, 0], props: page(27, 10, 2, 7) },
        { ms: 140, look: [1, 0], props: page(26, 8, 1, 9) },
        { ms: 140, look: [1, 0], props: page(24, 9, 2, 8) },
        { ms: 260, look: [1, 0], eyes: 'wide' },
      ];
    }
    case 'music':
      return rep(4, (i) => [
        { ms: 180, squash: true, eyes: 'happy', over: note(i % 2 ? 2 : 27, 8 - i) } as Frame,
        { ms: 180, eyes: 'closed', over: note(i % 2 ? 27 : 2, 6 - i) } as Frame,
      ]).slice(0, 8);
    case 'shiver':
      return [...rep(5, () => [{ ms: 70, dx: -1, eyes: 'squeeze' } as Frame, { ms: 70, dx: 1, eyes: 'squeeze' } as Frame]), { ms: 300, eyes: 'squeeze', pop: 'Brrr!' }];
    case 'capflip':
      return [
        { ms: 160, arms: 'up' },
        { ms: 140, arms: 'up', capBack: true, dy: -1 },
        { ms: 800, capBack: true, eyes: 'happy', blush: true },
        { ms: 140, arms: 'up' },
        { ms: 200, eyes: 'happy' },
      ];
    case 'spylook':
      return [
        { ms: 200, faceDy: 1 },
        { ms: 380, faceDy: 2, look: [-1, -1] },
        { ms: 380, faceDy: 2, look: [1, -1], flip: true },
        { ms: 200, faceDy: 1 },
        { ms: 160 },
      ];
    case 'glint':
      return [
        { ms: 110, over: [[11, 11, 1, 1, '#FFFFFF']] },
        { ms: 110, over: [[12, 12, 1, 1, '#FFFFFF'], [11, 11, 1, 1, '#9C9AA8']] },
        { ms: 110, over: [[13, 13, 1, 1, '#FFFFFF'], [18, 11, 1, 1, '#FFFFFF']] },
        { ms: 110, over: [[19, 12, 1, 1, '#FFFFFF'], [9, 9, 1, 1, '#FFFFFF']] },
        { ms: 220, over: [[20, 13, 1, 1, '#FFFFFF']] },
      ];
    case 'psst':
      return [
        { ms: 200, arms: 'face-r' },
        { ms: 900, arms: 'face-r', flip: true, pop: 'Psst...' },
        { ms: 200 },
      ];

    // ── Dokunma tepkileri ──
    case 'giggle': {
      const fs: Frame[] = [...rep(3, () => [{ ms: 110, squash: true, eyes: 'happy', blush: true } as Frame, { ms: 110, eyes: 'happy', blush: true } as Frame]), { ms: 150, eyes: 'happy', blush: true }];
      fs[0] = { ...fs[0], pop: 'Hi hi!' };
      return fs;
    }
    case 'jump':
      return [
        { ms: 90, squash: true },
        { ms: 90, dy: -3, arms: 'up' },
        { ms: 180, dy: -5, arms: 'up', eyes: 'happy' },
        { ms: 90, dy: -3, arms: 'up' },
        { ms: 90, squash: true },
      ];
    case 'spin':
      return [
        { ms: 110, flip: true, eyes: 'closed' },
        { ms: 110, eyes: 'none' },
        { ms: 110, flip: true, eyes: 'closed' },
        { ms: 110, eyes: 'none' },
        { ms: 220, eyes: 'x' },
        { ms: 200, eyes: 'happy' },
      ];
    case 'hey':
      return [
        { ms: 120, eyes: 'wide', dy: -1, pop: 'Hey!' },
        { ms: 240, eyes: 'wide', arms: 'wave' },
        { ms: 240, eyes: 'wide', arms: 'wave2' },
        { ms: 240, eyes: 'happy', arms: 'wave' },
      ];
    case 'dizzy': {
      const ring = (k: number): R[] => {
        const pts: [number, number][] = [[8, 5], [14, 3], [21, 4], [24, 7], [5, 8]];
        return pts.flatMap(([x, y], i) => ((i + k) % 2 ? star(x, y) : [[x + 1, y + 1, 1, 1, '#F3D98A'] as R]));
      };
      return rep(6, (i) => [{ ms: 210, eyes: 'x', dx: i % 2 ? 1 : -1, over: ring(i), pop: i === 0 ? DIZZY : undefined } as Frame]);
    }
    case 'tickle': {
      const fs: Frame[] = [...rep(5, (i) => [{ ms: 90, squash: true, dx: i % 2 ? 1 : -1, eyes: 'squeeze', blush: true } as Frame, { ms: 90, eyes: 'happy', blush: true } as Frame]), { ms: 200, eyes: 'happy', blush: true }];
      fs[0] = { ...fs[0], pop: TICKLE };
      return fs;
    }

    // ── Olay tepkileri ──
    case 'note': {
      const pad: R[] = [[13, 14, 6, 5, CREAM], [14, 15, 4, 1, '#B9AE9B']];
      const line = (k: number): R[] => (k ? [[14, 17, k, 1, '#D97757']] : []);
      return [
        { ms: 140, look: [0, 1], arms: 'hold-r', props: pad },
        { ms: 150, look: [0, 1], arms: 'hold-r', props: [...pad, ...pencil(14, 17)] },
        { ms: 150, look: [0, 1], arms: 'hold-r', props: [...pad, ...line(1), ...pencil(15, 17)] },
        { ms: 150, look: [0, 1], arms: 'hold-r', props: [...pad, ...line(2), ...pencil(16, 17)] },
        { ms: 150, look: [0, 1], arms: 'hold-r', props: [...pad, ...line(3), ...pencil(17, 17)] },
        { ms: 300, eyes: 'happy', props: [...pad, ...line(4)] },
      ];
    }
    case 'coins':
      return [
        { ms: 90, squash: true },
        { ms: 120, dy: -2, arms: 'up', over: coin(6, 6) },
        { ms: 200, dy: -4, arms: 'up', eyes: 'happy', over: [...coin(5, 3), ...coin(24, 5)] },
        { ms: 140, dy: -2, arms: 'up', eyes: 'happy', over: [...coin(4, 1), ...coin(25, 2), ...coin(15, 0)] },
        { ms: 120, squash: true, eyes: 'happy', over: [...coin(3, 0), ...coin(26, 0)] },
        { ms: 260, eyes: 'happy', blush: true },
      ];
    case 'sprout': {
      if (ctx.outfit === 'gardener') return [{ ms: 200, look: [-1, 0] }, { ms: 300, look: [-1, -1], grow: ctx.sprout < 2 }, { ms: 500, eyes: 'happy', over: star(0, 4, '#9BD07E') }];
      const pot: R[] = [[1, 17, 6, 1, '#9E4F31'], [2, 18, 4, 3, '#C0643F']];
      const g = '#4E8A42', l = '#7DBA62';
      return [
        { ms: 160, look: [-1, 1], props: pot },
        { ms: 180, look: [-1, 1], props: [...pot, [3, 16, 1, 1, g]] },
        { ms: 180, look: [-1, 0], props: [...pot, [3, 14, 1, 3, g], [4, 14, 1, 1, l]] },
        { ms: 220, look: [-1, -1], props: [...pot, [3, 12, 1, 5, g], [4, 13, 2, 1, l], [1, 12, 2, 1, l], [3, 11, 1, 1, l]] },
        { ms: 450, eyes: 'happy', blush: true, props: [...pot, [3, 12, 1, 5, g], [4, 13, 2, 1, l], [1, 12, 2, 1, l], [3, 11, 1, 1, l]] },
      ];
    }
    case 'confetti':
      return rep(7, (i) => [{ ms: 200, eyes: 'happy', arms: i % 2 ? 'up' : 'wave', dy: i % 2 ? -1 : 0, dx: i % 4 === 1 ? -1 : i % 4 === 3 ? 1 : 0, over: confetti(i) } as Frame]);
    case 'wiggle':
      return [...rep(3, () => [{ ms: 110, dx: -1, eyes: 'happy', blush: true } as Frame, { ms: 110, dx: 1, eyes: 'happy', blush: true } as Frame]), { ms: 200, eyes: 'happy', blush: true }];
    case 'shrug':
      return [
        { ms: 120, arms: 'out' },
        { ms: 500, arms: 'shrug', dy: -1, eyes: 'closed' },
        { ms: 200, arms: 'out' },
        { ms: 120 },
      ];
    case 'disguise':
      return [
        { ms: 110, over: cloud(false) },
        { ms: 260, over: cloud(true), outfit: 'spy' },
        { ms: 120, over: cloud(false), outfit: 'spy' },
        { ms: 360, outfit: 'spy', over: [[11, 11, 1, 1, '#FFFFFF'], [18, 11, 1, 1, '#FFFFFF']] },
        { ms: 300, outfit: 'spy', arms: 'face-r' },
      ];
    case 'undisguise':
      return [
        { ms: 160, outfit: 'spy', arms: 'face-r' },
        { ms: 180, outfit: 'spy', arms: 'face-r', faceDy: 1 },
        { ms: 220, outfit: 'spy', arms: 'face-r', faceDy: 3, eyes: 'wide' },
        { ms: 140, over: cloud(false), outfit: 'spy', faceDy: null },
        { ms: 220, over: cloud(true) },
        { ms: 300, eyes: 'happy' },
      ];
    case 'nod':
      return [
        { ms: 150, squash: true, eyes: 'closed' },
        { ms: 150, dy: -1 },
        { ms: 150, squash: true },
        { ms: 120 },
      ];
  }
}

/** Kıyafete özgü sürpriz hareketi (varsa). */
export const OUTFIT_ACTIONS: Partial<Record<string, ActionName[]>> = {
  scholar: ['glasses'],
  gardener: ['water'],
  ledger: ['write'],
  planner: ['pages'],
  headphones: ['music'],
  winter: ['shiver'],
  cap: ['capflip'],
  spy: ['spylook', 'glint', 'psst'],
};

/**
 * Hareketi azaltılmış görünüm: yer değiştirme, dönme, parçacık yok;
 * yalnız tek bir yüz ifadesi kısa bir süre görünür.
 */
export function reduceFrames(frames: Frame[]): Frame[] {
  const eyes = frames.find((f) => f.eyes && f.eyes !== 'none')?.eyes;
  const pop = frames.find((f) => f.pop)?.pop;
  return [{ ms: 700, eyes, pop, blush: frames.some((f) => f.blush) || undefined }];
}
