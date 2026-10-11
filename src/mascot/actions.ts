/**
 * Maskotların kısa hareketleri: adım adım (piksel hissi) kare dizileri, hepsi ≤ ~1,5 sn.
 * Konumlar karakterin bağlantı noktalarından (anchors) hesaplanır; böylece her hayvanda doğru yere düşer.
 * Saf veri üretir; zamanlama lively.ts içinde.
 */
import { CHARACTERS, INK, type Character, type MascotKey } from './characters';
import { OX, OY, type MascotLive, type R } from './render';
import { DIZZY, SNEEZE, TICKLE, YAWN } from './quips';
import type { CategoryReaction } from './categoryReact';

type Line = { tr: string; en: string };

export interface Frame extends MascotLive {
  ms: number;
  /** Kısa ünlem */
  pop?: Line;
  /** Saksıdaki filiz bir piksel uzar */
  grow?: boolean;
}

export type ActionName =
  | 'stretch' | 'hop' | 'wave' | 'turn' | 'peek' | 'sneeze' | 'yawn' | 'dance' | 'lookaround'
  | 'glasses' | 'water' | 'write' | 'pages' | 'music' | 'shiver' | 'captip' | 'spylook' | 'glint' | 'psst' | 'study'
  | 'tailwag' | 'earflap' | 'stash' | 'curl' | 'leaf' | 'tilt' | 'bowfix' | 'nibble'
  | 'giggle' | 'jump' | 'spin' | 'hey' | 'dizzy' | 'tickle'
  | 'note' | 'coins' | 'sprout' | 'confetti' | 'wiggle' | 'shrug' | 'disguise' | 'undisguise' | 'nod'
  | CategoryReaction;

export interface ActionCtx {
  who: MascotKey;
  outfit: string;
  sprout: number;
}

const CREAM = '#FBF6EC';
const GOLD = '#E5B94A';
const P = (tr: string, en: string): Line => ({ tr, en });

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
const cloud = (big: boolean): R[] =>
  big
    ? [[6, 5, 20, 20, '#E8E1D4'], [4, 9, 24, 12, '#E8E1D4'], [9, 3, 14, 2, '#E8E1D4'], [8, 8, 3, 3, '#F6F1E8'], [19, 15, 4, 3, '#F6F1E8'], [13, 21, 5, 3, '#D9D0C1']]
    : [[10, 9, 12, 11, '#E8E1D4'], [8, 11, 16, 7, '#E8E1D4'], [12, 10, 3, 2, '#F6F1E8']];
const BOW = '#E0457B';
const miniHeart = (x: number, y: number, c = '#E8577A'): R[] => [[x, y, 1, 1, c], [x + 2, y, 1, 1, c], [x, y + 1, 3, 1, c], [x + 1, y + 2, 1, 1, c]];
const rep = <T,>(n: number, f: (i: number) => T[]): T[] => Array.from({ length: n }, (_, i) => f(i)).flat();

/** Bahçıvan saksısındaki filizin ek pikselleri (seviyeye göre), sol tutma noktasına göre. */
export function sproutRects(who: MascotKey, level: number): R[] {
  const [hx, hy] = CHARACTERS[who].anchors.hold.l;
  const x = hx + OX, y = hy + OY - 6;
  const r: R[] = [];
  if (level >= 1) r.push([x, y, 1, 2, '#4E8A42'], [x - 1, y - 1, 1, 1, '#7DBA62']);
  if (level >= 2) r.push([x, y - 2, 1, 2, '#4E8A42'], [x + 1, y - 2, 1, 1, '#7DBA62'], [x, y - 3, 1, 1, '#9BD07E']);
  return r;
}

export function buildAction(name: ActionName, ctx: ActionCtx): Frame[] {
  const ch = CHARACTERS[ctx.who];
  const [ex, ey] = ch.anchors.eye;
  const eyeY = ey + OY;
  const eyeL = ex + OX, eyeR = ex + ch.anchors.eyeGap + OX;
  const [lx, ly] = ch.anchors.hold.l;
  const [rx, ry] = ch.anchors.hold.r;
  const holdL: [number, number] = [lx + OX, ly + OY];
  const holdR: [number, number] = [rx + OX, ry + OY];
  const headTop = ch.anchors.head.y + OY;
  const midX = ch.anchors.head.x + OX;
  switch (name) {
    // ── Sürprizler ──
    case 'stretch':
      return [
        { ms: 160, paws: 'up', eyes: 'closed' },
        { ms: 650, paws: 'stretch', eyes: 'squeeze', dy: -1 },
        { ms: 250, paws: 'up', eyes: 'closed' },
        { ms: 120, eyes: 'happy' },
      ];
    case 'hop':
      return [{ ms: 100, squash: true }, { ms: 100, dy: -2 }, { ms: 160, dy: -3, eyes: 'happy' }, { ms: 100, dy: -2 }, { ms: 100, squash: true }];
    case 'wave':
      return [...rep(3, () => [{ ms: 190, paws: 'wave', eyes: 'happy', blush: true } as Frame, { ms: 190, paws: 'wave2', eyes: 'happy', blush: true } as Frame]), { ms: 150, paws: 'wave', eyes: 'happy' }];
    case 'turn':
      return [{ ms: 110, eyes: 'closed' }, { ms: 450, flip: true, look: [-1, 0] }, { ms: 450, flip: true, look: [-1, 0], eyes: 'wide' }, { ms: 110, eyes: 'closed' }];
    case 'peek': {
      const c = 24;
      return [
        { ms: 90, clipY: c, dy: 2 }, { ms: 90, clipY: c, dy: 6 }, { ms: 90, clipY: c, dy: 11 }, { ms: 260, clipY: c, dy: 20 },
        { ms: 140, clipY: c, dy: 9 }, { ms: 300, clipY: c, dy: 7, look: [-1, 0] }, { ms: 300, clipY: c, dy: 7, look: [1, 0] },
        { ms: 90, clipY: c, dy: 4 }, { ms: 90, clipY: c, dy: 1 },
      ];
    }
    case 'sneeze':
      return [
        { ms: 260, eyes: 'squeeze', dy: -1, pop: P('Ha...', 'Ah…') },
        { ms: 260, eyes: 'squeeze', dy: -1, paws: 'up' },
        { ms: 200, eyes: 'closed', squash: true, dx: -1, over: puff(27, 15), pop: SNEEZE },
        { ms: 220, eyes: 'closed', over: puff(29, 13) },
        { ms: 160, blush: true },
      ];
    case 'yawn':
      return [{ ms: 200, eyes: 'closed', paws: 'up' }, { ms: 700, eyes: 'squeeze', paws: 'stretch', dy: -1, pop: YAWN }, { ms: 300, eyes: 'closed', paws: 'up' }, { ms: 300, eyes: 'half' }];
    case 'dance':
      return rep(3, (i) => [
        { ms: 200, dx: -1, paws: 'up', eyes: 'happy', over: confetti(i * 2) } as Frame,
        { ms: 200, dy: -1, paws: 'wave', eyes: 'happy', over: confetti(i * 2 + 1) } as Frame,
        { ms: 200, dx: 1, paws: 'up', eyes: 'happy', over: confetti(i * 2 + 2) } as Frame,
        { ms: 200, dy: -1, paws: 'wave2', eyes: 'happy', flip: true } as Frame,
      ]).slice(0, 7);
    case 'lookaround':
      return [{ ms: 420, look: [-1, 0] }, { ms: 420, look: [1, 0] }, { ms: 320, look: [0, -1] }, { ms: 120, eyes: 'closed' }];

    // ── Kıyafete özgü ──
    case 'glasses':
      return [{ ms: 180, paws: 'face' }, { ms: 200, paws: 'face', faceDy: -1 }, { ms: 160, paws: 'face' }, { ms: 200, paws: 'face', faceDy: -1 }, { ms: 260, paws: 'face', eyes: 'wide' }, { ms: 160, eyes: 'happy' }];
    case 'water': {
      const [x, y] = holdL;
      const can: R[] = [[x + 1, y - 9, 4, 2, '#6E8FA0'], [x, y - 9, 1, 1, '#6E8FA0'], [x + 2, y - 10, 2, 1, '#55717F']];
      return [
        { ms: 160, props: can },
        { ms: 180, props: can, over: drop(x, y - 7) },
        { ms: 180, props: can, over: [...drop(x, y - 5), ...drop(x - 1, y - 7)] },
        { ms: 180, props: can, over: [...drop(x - 1, y - 5), ...drop(x, y - 7)] },
        { ms: 380, eyes: 'happy', grow: ctx.sprout < 2, over: star(x - 2, y - 13, '#9BD07E') },
      ];
    }
    case 'write': {
      const [x, y] = holdL;
      const line = (k: number): R[] => (k ? [[x - 1, y - 1, k, 1, '#8C8272']] : []);
      return [
        { ms: 140, look: [-1, 1], props: pencil(x - 1, y - 1) },
        { ms: 160, look: [-1, 1], props: [...line(1), ...pencil(x, y - 1)] },
        { ms: 160, look: [-1, 1], props: [...line(2), ...pencil(x + 1, y - 1)] },
        { ms: 320, eyes: 'happy', props: line(2) },
      ];
    }
    case 'pages': {
      const [x, y] = holdR;
      const page = (dx: number, w: number): R[] => [[x + dx, y - 4, w, 7, CREAM], [x + dx, y + 2, w, 1, '#E3D9C6']];
      return [{ ms: 140, look: [1, 0] }, ...rep(2, () => [{ ms: 140, look: [1, 0], props: page(3, 2) } as Frame, { ms: 140, look: [1, 0], props: page(2, 1) } as Frame, { ms: 140, look: [1, 0], props: page(0, 2) } as Frame]), { ms: 260, look: [1, 0], eyes: 'wide' }];
    }
    case 'study': {
      const [x, y] = holdR;
      return [{ ms: 300, look: [1, 1] }, { ms: 300, look: [1, 1], eyes: 'half' }, { ms: 260, look: [1, 1], over: star(x, y - 9) }, { ms: 200, eyes: 'happy' }];
    }
    case 'music':
      return rep(4, (i) => [
        { ms: 180, squash: true, eyes: 'happy', over: note(i % 2 ? 1 : 27, 8 - i) } as Frame,
        { ms: 180, eyes: 'closed', over: note(i % 2 ? 27 : 1, 6 - i) } as Frame,
      ]).slice(0, 8);
    case 'shiver':
      return [...rep(5, () => [{ ms: 70, dx: -1, eyes: 'squeeze' } as Frame, { ms: 70, dx: 1, eyes: 'squeeze' } as Frame]), { ms: 300, eyes: 'squeeze', pop: P('Brrr!', 'Brrr!') }];
    case 'captip':
      return [{ ms: 160, paws: 'wave' }, { ms: 500, paws: 'wave2', hatLift: true, eyes: 'happy', blush: true }, { ms: 200, paws: 'wave' }, { ms: 160, eyes: 'happy' }];
    case 'spylook':
      return [{ ms: 200, faceDy: 1 }, { ms: 380, faceDy: 2, look: [-1, -1] }, { ms: 380, faceDy: 2, look: [1, -1], flip: true }, { ms: 200, faceDy: 1 }, { ms: 160 }];
    case 'glint':
      return [
        { ms: 110, over: [[eyeL - 1, eyeY, 1, 1, '#FFFFFF']] },
        { ms: 110, over: [[eyeL, eyeY, 1, 1, '#FFFFFF']] },
        { ms: 110, over: [[eyeL + 1, eyeY + 1, 1, 1, '#FFFFFF'], [eyeR - 1, eyeY, 1, 1, '#FFFFFF']] },
        { ms: 220, over: [[eyeR, eyeY, 1, 1, '#FFFFFF']] },
      ];
    case 'psst':
      return [{ ms: 200, paws: 'face' }, { ms: 900, paws: 'face', flip: true, pop: P('Psst...', 'Psst…') }, { ms: 200 }];

    // ── Karaktere özgü imza hareketleri ──
    case 'tailwag':
      return [...rep(4, (i) => [{ ms: 120, dx: i % 2 ? 1 : 0, eyes: 'happy', blush: true } as Frame, { ms: 120, dx: i % 2 ? 0 : -1, eyes: 'happy' } as Frame]), { ms: 160, eyes: 'happy' }];
    case 'earflap': {
      const ear = (up: boolean): R[] => (up ? [[eyeL - 5, headTop + 1, 3, 3, '#8A5626'], [eyeR + 4, headTop + 1, 3, 3, '#8A5626']] : []);
      return rep(3, (i) => [{ ms: 130, props: ear(true), eyes: 'happy', dy: -1 } as Frame, { ms: 130, props: ear(i === 2 ? false : false), eyes: 'happy' } as Frame]);
    }
    case 'stash': {
      const nut = (x: number, y: number): R[] => [[x, y, 3, 2, '#8A5A2B'], [x, y, 1, 1, '#B98450']];
      return [
        { ms: 160, look: [1, 0] },
        { ms: 180, look: [1, 0], props: nut(midX + 6, eyeY + 2) },
        { ms: 180, look: [1, -1], props: nut(midX + 9, eyeY - 2) },
        { ms: 220, eyes: 'happy', over: coin(midX + 10, eyeY - 6) },
        { ms: 260, eyes: 'happy', blush: true, pop: P('Saklandı!', 'Stashed!') },
      ];
    }
    case 'curl':
      return [
        { ms: 160, squash: true, eyes: 'closed' },
        { ms: 260, squash: true, eyes: 'closed', dy: 1 },
        { ms: 220, squash: true, eyes: 'closed', dx: 1, dy: 1 },
        { ms: 220, squash: true, eyes: 'closed', dx: -1, dy: 1 },
        { ms: 200, eyes: 'happy', pop: P('Top oldum!', 'Rolled up!') },
      ];
    case 'leaf': {
      const leaf = (dx: number): R[] => [[midX + 3 + dx, headTop - 3, 2, 1, '#7DBA62'], [midX + 2 + dx, headTop - 2, 2, 1, '#5BAA5E']];
      return [{ ms: 160, look: [1, -1] }, { ms: 200, look: [1, -1], props: leaf(1) }, { ms: 200, look: [1, -1], props: leaf(-1) }, { ms: 200, eyes: 'happy' }];
    }
    case 'bowfix': {
      // Kurdelesini düzeltir: pati kulağa, kurdele iki yana kıpırdar, ışıltı ve minik kalp.
      const bx = midX + 2, by = headTop - 4;
      const bow = (dx: number): R[] => [
        [bx + dx, by, 2, 3, BOW], [bx + 5 + dx, by, 2, 3, BOW], [bx + 2 + dx, by + 1, 3, 1, BOW],
        [bx + dx, by, 1, 1, '#FF9EC4'], [bx + 5 + dx, by, 1, 1, '#FF9EC4'], [bx + 3 + dx, by + 1, 1, 1, '#A92A5A'],
      ];
      return [
        { ms: 160, paws: 'wave2', look: [1, -1] },
        { ms: 190, paws: 'wave2', look: [1, -1], props: bow(-1) },
        { ms: 190, paws: 'wave2', look: [1, -1], props: bow(1) },
        { ms: 220, eyes: 'happy', props: bow(0), over: star(bx + 7, by - 4, '#FFFFFF') },
        { ms: 320, eyes: 'happy', blush: true, props: bow(0), over: miniHeart(bx + 8, by - 6), pop: P('Kusursuz.', 'Flawless.') },
      ];
    }
    case 'nibble': {
      // Havuç kemirir: havuç kısalır, kırıntılar düşer.
      const mx = Math.round((eyeL + eyeR + 2) / 2) - 1, my = eyeY + 4;
      const carrot = (len: number): R[] => [
        [mx + 1, my, len, 2, '#F08A3C'], [mx + 2, my + 1, 1, 1, '#C9652A'], ...(len > 3 ? ([[mx + 4, my, 1, 1, '#C9652A']] as R[]) : []),
        [mx + 1 + len, my - 1, 1, 1, '#7DBA62'], [mx + 2 + len, my - 2, 1, 2, '#5E9E4E'], [mx + 1 + len, my + 1, 2, 1, '#7DBA62'],
      ];
      const bits = (k: number): R[] => [[mx + 1 - k, my + 3 + k, 1, 1, '#F08A3C'], [mx + 3 + k, my + 4, 1, 1, '#E5A060']];
      return [
        { ms: 150, look: [1, 1], props: carrot(6) },
        { ms: 150, squash: true, eyes: 'closed', props: carrot(6) },
        { ms: 150, props: carrot(4), over: bits(0) },
        { ms: 150, squash: true, eyes: 'closed', props: carrot(4) },
        { ms: 150, props: carrot(2), over: bits(1) },
        { ms: 300, eyes: 'happy', blush: true, pop: P('Nom!', 'Nom!') },
      ];
    }
    case 'tilt':
      return [{ ms: 200, look: [-1, 0], dx: -1 }, { ms: 420, look: [-1, -1], dx: -1, eyes: 'wide' }, { ms: 200, look: [1, 0], dx: 1 }, { ms: 200 }];

    // ── Dokunma tepkileri ──
    case 'giggle': {
      const fs: Frame[] = [...rep(3, () => [{ ms: 110, squash: true, eyes: 'happy', blush: true } as Frame, { ms: 110, eyes: 'happy', blush: true } as Frame]), { ms: 150, eyes: 'happy', blush: true }];
      fs[0] = { ...fs[0], pop: P('Hi hi!', 'Hee hee!') };
      return fs;
    }
    case 'jump':
      return [{ ms: 90, squash: true }, { ms: 90, dy: -3, paws: 'up' }, { ms: 180, dy: -5, paws: 'up', eyes: 'happy' }, { ms: 90, dy: -3, paws: 'up' }, { ms: 90, squash: true }];
    case 'spin':
      return [{ ms: 110, flip: true, eyes: 'closed' }, { ms: 110, eyes: 'none' }, { ms: 110, flip: true, eyes: 'closed' }, { ms: 110, eyes: 'none' }, { ms: 220, eyes: 'x' }, { ms: 200, eyes: 'happy' }];
    case 'hey':
      return [{ ms: 120, eyes: 'wide', dy: -1, pop: P('Hey!', 'Hey!') }, { ms: 240, eyes: 'wide', paws: 'wave' }, { ms: 240, eyes: 'wide', paws: 'wave2' }, { ms: 240, eyes: 'happy', paws: 'wave' }];
    case 'dizzy': {
      const ring = (k: number): R[] => {
        const pts: [number, number][] = [[8, 3], [14, 1], [21, 2], [25, 5], [4, 6]];
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
      const [x, y] = holdR;
      const pad: R[] = [[x - 1, y - 3, 6, 5, CREAM], [x, y - 2, 4, 1, '#B9AE9B']];
      const line = (k: number): R[] => (k ? [[x, y, k, 1, '#D97757']] : []);
      return [
        { ms: 140, look: [1, 1], props: pad },
        { ms: 150, look: [1, 1], props: [...pad, ...pencil(x, y)] },
        { ms: 150, look: [1, 1], props: [...pad, ...line(2), ...pencil(x + 2, y)] },
        { ms: 150, look: [1, 1], props: [...pad, ...line(4), ...pencil(x + 4, y)] },
        { ms: 300, eyes: 'happy', props: [...pad, ...line(4)] },
      ];
    }
    case 'coins':
      return [
        { ms: 90, squash: true },
        { ms: 120, dy: -2, paws: 'up', over: coin(5, 8) },
        { ms: 200, dy: -4, paws: 'up', eyes: 'happy', over: [...coin(4, 4), ...coin(25, 6)] },
        { ms: 140, dy: -2, paws: 'up', eyes: 'happy', over: [...coin(3, 1), ...coin(26, 2), ...coin(15, 0)] },
        { ms: 120, squash: true, eyes: 'happy', over: [...coin(2, 0), ...coin(27, 0)] },
        { ms: 260, eyes: 'happy', blush: true },
      ];
    case 'sprout': {
      if (ctx.outfit === 'gardener') return [{ ms: 200, look: [-1, 0] }, { ms: 300, look: [-1, -1], grow: ctx.sprout < 2 }, { ms: 500, eyes: 'happy', over: star(holdL[0] - 2, holdL[1] - 13, '#9BD07E') }];
      const [x, y] = [holdL[0] - 2, holdL[1] + 1];
      const pot: R[] = [[x, y, 6, 1, '#9E4F31'], [x + 1, y + 1, 4, 3, '#C0643F']];
      const g = '#4E8A42', l = '#7DBA62';
      const full: R[] = [...pot, [x + 2, y - 5, 1, 5, g], [x + 3, y - 4, 2, 1, l], [x, y - 5, 2, 1, l], [x + 2, y - 6, 1, 1, l]];
      return [
        { ms: 160, look: [-1, 1], props: pot },
        { ms: 180, look: [-1, 1], props: [...pot, [x + 2, y - 1, 1, 1, g]] },
        { ms: 180, look: [-1, 0], props: [...pot, [x + 2, y - 3, 1, 3, g], [x + 3, y - 3, 1, 1, l]] },
        { ms: 220, look: [-1, -1], props: full },
        { ms: 450, eyes: 'happy', blush: true, props: full },
      ];
    }
    case 'confetti':
      return rep(7, (i) => [{ ms: 200, eyes: 'happy', paws: i % 2 ? 'up' : 'wave', dy: i % 2 ? -1 : 0, dx: i % 4 === 1 ? -1 : i % 4 === 3 ? 1 : 0, over: confetti(i) } as Frame]);
    case 'wiggle':
      return [...rep(3, () => [{ ms: 110, dx: -1, eyes: 'happy', blush: true } as Frame, { ms: 110, dx: 1, eyes: 'happy', blush: true } as Frame]), { ms: 200, eyes: 'happy', blush: true }];
    case 'shrug':
      return [{ ms: 120, paws: 'up' }, { ms: 500, paws: 'up', dy: -1, eyes: 'closed' }, { ms: 200, paws: 'up' }, { ms: 120 }];
    case 'disguise':
      return [
        { ms: 110, over: cloud(false) },
        { ms: 260, over: cloud(true), outfit: 'spy' },
        { ms: 120, over: cloud(false), outfit: 'spy' },
        { ms: 360, outfit: 'spy', over: [[eyeL, eyeY, 1, 1, '#FFFFFF'], [eyeR, eyeY, 1, 1, '#FFFFFF']] },
        { ms: 300, outfit: 'spy', paws: 'face' },
      ];
    case 'undisguise':
      return [
        { ms: 160, outfit: 'spy', paws: 'face' },
        { ms: 180, outfit: 'spy', paws: 'face', faceDy: 1 },
        { ms: 220, outfit: 'spy', paws: 'face', faceDy: 3, eyes: 'wide' },
        { ms: 140, over: cloud(false), outfit: 'spy', faceDy: null },
        { ms: 220, over: cloud(true) },
        { ms: 300, eyes: 'happy' },
      ];
    case 'nod':
      return [{ ms: 150, squash: true, eyes: 'closed' }, { ms: 150, dy: -1 }, { ms: 150, squash: true }, { ms: 120 }];

    // ── Kategoriye göre kayıt tepkileri (categoryReact.ts) — her biri ≤ ~1,2 sn ──
    default:
      return categoryFrames(name, { ch, eyeL, eyeR, eyeY, holdL, holdR, headTop, midX });
  }
}

/** Kıyafete özgü sürpriz hareketleri. */
export const OUTFIT_ACTIONS: Partial<Record<string, ActionName[]>> = {
  scholar: ['glasses'],
  gardener: ['water'],
  ledger: ['write'],
  planner: ['pages'],
  headphones: ['music'],
  winter: ['shiver'],
  cap: ['captip'],
  spy: ['spylook', 'glint', 'psst'],
  exam: ['study', 'glasses'],
  newyear: ['dance'],
  bayram: ['wave'],
  pajama: ['yawn'],
  suit: ['coins', 'nod'],
};

/** Hareketi azaltılmış görünüm: yalnız kısa bir yüz ifadesi. */
export function reduceFrames(frames: Frame[]): Frame[] {
  const eyes = frames.find((f) => f.eyes && f.eyes !== 'none')?.eyes;
  const pop = frames.find((f) => f.pop)?.pop;
  return [{ ms: 700, eyes, pop, blush: frames.some((f) => f.blush) || undefined }];
}

// ── Kategori tepkileri ─────────────────────────────────
interface Geo {
  ch: Character;
  eyeL: number;
  eyeR: number;
  eyeY: number;
  holdL: [number, number];
  holdR: [number, number];
  headTop: number;
  midX: number;
}

const BROWN = '#7A5A44';
const BREAD = '#C98A44';
const BREAD2 = '#E3B26A';
const PINKR = '#E8577A';

const cupAt = (x: number, y: number): R[] => [[x, y, 3, 3, CREAM], [x, y, 3, 1, BROWN], [x, y + 1, 3, 1, '#D97757'], [x + 3, y + 1, 1, 1, CREAM]];
const steam = (x: number, y: number): R[] => [[x, y, 1, 2, '#CFC6B8']];
const heartAt = (x: number, y: number, c = PINKR): R[] => [[x, y, 2, 1, c], [x + 3, y, 2, 1, c], [x, y + 1, 5, 1, c], [x + 1, y + 2, 3, 1, c], [x + 2, y + 3, 1, 1, c]];
const bus = (x: number): R[] => {
  const y = 19;
  return [
    [x, y, 11, 5, '#4F86C6'], [x, y, 11, 1, '#3C6EA8'],
    [x + 1, y + 1, 2, 2, CREAM], [x + 4, y + 1, 2, 2, CREAM], [x + 7, y + 1, 2, 2, CREAM],
    [x + 10, y + 3, 1, 1, GOLD], [x + 1, y + 5, 2, 1, INK], [x + 7, y + 5, 2, 1, INK],
  ];
};
const car = (x: number): R[] => {
  const y = 22;
  return [[x + 2, y, 4, 1, '#C2453E'], [x, y + 1, 8, 2, '#D2423A'], [x + 3, y, 2, 1, '#BFE0EE'], [x + 7, y + 1, 1, 1, GOLD], [x + 1, y + 3, 2, 1, INK], [x + 5, y + 3, 2, 1, INK]];
};
const plane = (x: number, y: number): R[] => [
  [x, y + 1, 7, 2, '#E8E4DC'], [x + 1, y + 1, 1, 1, '#6FB7E0'], [x + 3, y + 1, 1, 1, '#6FB7E0'],
  [x + 3, y, 2, 1, '#9AA6B8'], [x + 3, y + 3, 2, 1, '#9AA6B8'], [x + 6, y - 1, 1, 2, '#D2423A'],
  [x + 8, y + 2, 3, 1, '#E3DCCF'],
];
const dust = (x: number, y: number): R[] => [[x, y, 1, 1, '#D9D0C1'], [x - 2, y - 1, 1, 1, '#E3DCCF']];

function categoryFrames(name: ActionName, g: Geo): Frame[] {
  const { eyeL, eyeR, eyeY, holdL, holdR, headTop, midX, ch } = g;
  // Ağız: iki gözün ortası, biraz altı
  const mx = Math.round((eyeL + eyeR + 2) / 2) - 1;
  const my = eyeY + 4;
  switch (name) {
    case 'sip': {
      const [x, y] = holdR;
      const low = cupAt(x, y - 2);
      const up = cupAt(mx + 2, my - 1);
      return [
        { ms: 150, look: [1, 0], props: low },
        { ms: 140, look: [1, -1], props: cupAt(mx + 3, my - 2) },
        { ms: 300, eyes: 'closed', props: up, over: steam(mx + 3, my - 5) },
        { ms: 150, eyes: 'closed', squash: true, props: up },
        { ms: 150, props: low },
        { ms: 250, eyes: 'happy', blush: true, props: low, over: steam(x + 1, y - 6) },
      ];
    }
    case 'munch': {
      const food = (w: number): R[] => (w ? [[mx - 2, my - 1, w, 1, BREAD2], [mx - 2, my, w, 1, '#7DBA62'], [mx - 2, my + 1, w, 1, BREAD]] : []);
      const crumbs = (k: number): R[] => [[mx - 3 + k, my + 3, 1, 1, BREAD], [mx + 3 - k, my + 4, 1, 1, BREAD2]];
      return [
        { ms: 140, look: [0, 1], props: food(5) },
        { ms: 150, squash: true, eyes: 'closed', props: food(5) },
        { ms: 150, props: food(3), over: crumbs(0) },
        { ms: 150, squash: true, eyes: 'closed', props: food(3) },
        { ms: 150, props: food(1), over: crumbs(1) },
        { ms: 300, eyes: 'happy', blush: true },
      ];
    }
    case 'bag': {
      const [x, y] = holdR;
      const bx = x, by = y - 4;
      const bag: R[] = [[bx, by + 2, 5, 6, '#C9A06A'], [bx, by + 2, 5, 1, '#A87F4C'], [bx + 3, by - 1, 1, 4, BREAD2], [bx + 1, by, 1, 2, '#6E9E5B'], [bx, by, 1, 1, '#8CC46E']];
      return [
        { ms: 150, look: [1, 1], dy: 1, props: bag },
        { ms: 150, eyes: 'happy', props: bag },
        { ms: 140, dx: -1, squash: true, props: bag },
        { ms: 140, dy: -1, props: bag },
        { ms: 140, dx: 1, squash: true, props: bag },
        { ms: 140, dy: -1, props: bag },
        { ms: 260, eyes: 'happy', blush: true, props: bag },
      ];
    }
    case 'drive': {
      // Otobüs figürün arkasından soldan sağa geçer; gözler onu izler.
      const xs = [-12, -7, -2, 3, 8, 13, 18, 23, 28, 33];
      return [
        ...xs.map((x, i): Frame => ({ ms: 100, under: bus(x), look: [i < 3 ? -1 : i > 6 ? 1 : 0, 0], over: i === 1 ? dust(-1, 25) : i === 9 ? dust(29, 25) : undefined })),
        { ms: 180, eyes: 'happy' },
      ];
    }
    case 'zoom': {
      const xs = [-10, -3, 4, 11, 18, 25, 32];
      return [
        ...xs.map((x, i): Frame => ({ ms: 90, under: car(x), look: [i < 2 ? -1 : i > 4 ? 1 : 0, 0], over: i >= 5 ? dust(x - 2, 25) : undefined })),
        { ms: 140, eyes: 'wide', look: [1, 0] },
        { ms: 220, eyes: 'happy' },
      ];
    }
    case 'fly': {
      const xs = [34, 28, 22, 16, 10, 4, -2, -8];
      return [
        ...xs.map((x, i): Frame => ({ ms: 110, over: plane(x, 0), look: [i < 3 ? 1 : i > 5 ? -1 : 0, -1] })),
        { ms: 250, eyes: 'happy', look: [-1, -1] },
      ];
    }
    case 'house': {
      const x0 = -5, y0 = 20;
      const R_ = '#C2553C';
      const full = (dy: number): R[] => [
        [x0 + 3, y0 + dy, 2, 1, R_], [x0 + 2, y0 + 1 + dy, 4, 1, R_], [x0 + 1, y0 + 2 + dy, 6, 1, R_], [x0, y0 + 3 + dy, 8, 1, R_],
        [x0 + 6, y0 + dy, 1, 2, '#8A5A2B'],
        [x0 + 1, y0 + 4 + dy, 6, 4 - dy, '#F1E3C8'], [x0 + 3, y0 + 6, 2, 2, '#8A5A2B'], [x0 + 5, y0 + 5 + dy, 1, 1, '#6FB7E0'],
      ];
      const tiny: R[] = [[x0 + 2, y0 + 5, 4, 1, R_], [x0 + 2, y0 + 6, 4, 2, '#F1E3C8'], [x0 + 3, y0 + 7, 1, 1, '#8A5A2B']];
      return [
        { ms: 120, look: [-1, 1], over: [[x0 + 1, y0 + 7, 6, 1, '#D9D0C1']] },
        { ms: 140, look: [-1, 0], over: tiny },
        { ms: 140, look: [-1, 0], eyes: 'wide', over: full(-1) },
        { ms: 200, look: [-1, 0], over: full(0) },
        { ms: 250, look: [-1, 0], over: [...full(0), ...puff(x0 + 7, y0 - 4)] },
        { ms: 300, eyes: 'happy', blush: true, over: full(0) },
      ];
    }
    case 'bulb': {
      const x = midX - 1, y = headTop - 9;
      const b = (on: boolean): R[] => [
        [x, y, 3, 3, on ? '#F7D560' : '#D9D2C4'], [x + 1, y, 1, 1, on ? '#FFF3C4' : '#EDE7DB'], [x, y + 3, 3, 1, '#8C8272'], [x + 1, y + 4, 1, 1, '#6B6357'],
        ...(on ? ([[x - 2, y + 1, 1, 1, GOLD], [x + 4, y + 1, 1, 1, GOLD], [x + 1, y - 2, 1, 1, GOLD]] as R[]) : []),
      ];
      return [
        { ms: 150, look: [0, -1], over: b(false) },
        { ms: 120, look: [0, -1], over: b(true) },
        { ms: 100, look: [0, -1], over: b(false) },
        { ms: 130, look: [0, -1], eyes: 'wide', over: b(true) },
        { ms: 300, eyes: 'happy', over: b(true) },
        { ms: 150, eyes: 'happy' },
      ];
    }
    case 'groove':
      return [
        { ms: 160, dx: -1, paws: 'up', eyes: 'happy', over: note(1, 6) },
        { ms: 160, dy: -1, paws: 'wave', eyes: 'happy' },
        { ms: 160, dx: 1, paws: 'up', eyes: 'happy', over: note(27, 4) },
        { ms: 160, dy: -1, paws: 'wave2', eyes: 'happy', flip: true },
        { ms: 160, dx: -1, paws: 'up', eyes: 'happy' },
        { ms: 160, dy: -1, paws: 'wave', eyes: 'happy', over: note(2, 3) },
        { ms: 200, eyes: 'happy', blush: true },
      ];
    case 'buzz': {
      const [x, y] = holdR;
      const ph = (dx: number, lit = false): R[] => [[x + dx, y - 4, 4, 6, '#2E2C36'], [x + dx + 1, y - 3, 2, 3, lit ? '#BDEBF5' : '#7FC8D8'], [x + dx + 1, y + 1, 2, 1, '#55535F']];
      const lines: R[] = [[x - 2, y - 3, 1, 1, PINKR], [x + 5, y - 3, 1, 1, PINKR], [x - 2, y - 1, 1, 1, PINKR], [x + 5, y - 1, 1, 1, PINKR]];
      return [
        { ms: 120, eyes: 'wide', props: ph(0) },
        { ms: 80, eyes: 'wide', props: ph(1), over: lines },
        { ms: 80, eyes: 'wide', props: ph(-1) },
        { ms: 80, eyes: 'wide', props: ph(1), over: lines },
        { ms: 80, eyes: 'wide', props: ph(-1) },
        { ms: 80, eyes: 'wide', props: ph(1), over: lines },
        { ms: 350, look: [1, 1], props: ph(0, true) },
        { ms: 250, eyes: 'happy', props: ph(0, true) },
      ];
    }
    case 'tryhat': {
      const { w } = ch.anchors.head;
      const l = Math.round(ch.anchors.head.x - w / 2) + OX;
      const hat = (dy: number): R[] => [
        [l - 1, headTop - 2 + dy, w + 2, 2, PINKR], [l, headTop - 3 + dy, w, 1, PINKR], [l - 1, headTop - 1 + dy, w + 2, 1, '#B8435F'], [midX, headTop - 4 + dy, 1, 1, '#B8435F'],
      ];
      return [
        { ms: 150, look: [0, -1], props: hat(-6) },
        { ms: 120, look: [0, -1], props: hat(-4) },
        { ms: 120, look: [0, -1], props: hat(-2) },
        { ms: 150, squash: true, props: hat(0) },
        { ms: 300, flip: true, eyes: 'happy', blush: true, props: hat(0) },
        { ms: 300, eyes: 'happy', look: [1, 0], props: hat(0), over: star(midX + 6, headTop - 5) },
      ];
    }
    case 'read': {
      const [x, y] = holdR;
      const book: R[] = [[x - 1, y - 2, 7, 5, '#5B4FA0'], [x, y - 2, 2, 4, CREAM], [x + 3, y - 2, 2, 4, CREAM], [x + 2, y - 2, 1, 5, '#3E3480'], [x, y - 1, 2, 1, '#B9AE9B'], [x + 3, y, 2, 1, '#B9AE9B']];
      return [
        { ms: 150, look: [1, 1], props: book },
        { ms: 220, look: [1, 1], eyes: 'half', props: book },
        { ms: 130, look: [1, 1], props: [...book, [x + 3, y - 4, 2, 4, CREAM]] },
        { ms: 130, look: [1, 1], props: [...book, [x + 1, y - 4, 2, 4, CREAM]] },
        { ms: 230, look: [1, 1], props: book },
        { ms: 250, eyes: 'happy', props: book, over: star(x + 1, y - 9) },
      ];
    }
    case 'heart': {
      const hx = 25, y0 = 16;
      return [
        { ms: 150, eyes: 'happy', blush: true, over: heartAt(hx, y0) },
        { ms: 150, eyes: 'happy', blush: true, over: heartAt(hx, y0 - 3) },
        { ms: 150, eyes: 'happy', over: heartAt(hx + 1, y0 - 6) },
        { ms: 150, eyes: 'happy', over: heartAt(hx, y0 - 9) },
        { ms: 200, eyes: 'happy', blush: true, over: heartAt(hx + 1, y0 - 12, '#F29AB0') },
        { ms: 200, blush: true },
      ];
    }
    case 'gift': {
      const gx = holdL[0] - 2, gy = holdL[1] - 2;
      const box: R[] = [[gx, gy + 2, 6, 5, '#D2423A'], [gx + 2, gy + 2, 2, 5, GOLD]];
      const lid = (up: number): R[] => [[gx - 1, gy + 1 - up, 8, 1, '#B8352E'], [gx + 1, gy - up, 1, 1, GOLD], [gx + 4, gy - up, 1, 1, GOLD]];
      return [
        { ms: 150, look: [-1, 1], props: [...box, ...lid(0)] },
        { ms: 150, squash: true, props: [...box, ...lid(0)] },
        { ms: 150, eyes: 'wide', props: [...box, ...lid(3)], over: star(gx + 1, gy - 6) },
        { ms: 300, eyes: 'happy', blush: true, props: [...box, ...lid(3)], over: [...star(gx - 1, gy - 8), ...star(gx + 4, gy - 7, '#F3D98A')] },
        { ms: 200, eyes: 'happy', props: [...box, ...lid(0)] },
      ];
    }
    case 'pocket': {
      // Paralar havada sekip karındaki cebe girer.
      const px = mx - 1, py = eyeY + 7;
      const pocket: R[] = [[px, py, 4, 3, CREAM], [px, py, 4, 1, INK], [px + 1, py + 2, 2, 1, '#E3D9C6']];
      return [
        { ms: 100, squash: true, props: pocket },
        { ms: 140, dy: -1, paws: 'up', props: pocket, over: coin(4, 6) },
        { ms: 140, paws: 'up', eyes: 'happy', props: pocket, over: [...coin(9, 1), ...coin(26, 8)] },
        { ms: 140, eyes: 'happy', props: pocket, over: [...coin(px + 1, py - 5), ...coin(22, 2)] },
        { ms: 140, eyes: 'happy', squash: true, props: pocket, over: [[px + 1, py + 1, 2, 1, GOLD], ...coin(px + 1, py - 4)] },
        { ms: 140, eyes: 'happy', props: pocket, over: [[px + 1, py + 1, 2, 1, GOLD]] },
        { ms: 260, eyes: 'happy', blush: true, props: pocket, over: star(px + 5, py - 4) },
      ];
    }
    case 'happynod':
      return [
        { ms: 120, squash: true, eyes: 'happy', blush: true },
        { ms: 150, dy: -1, eyes: 'happy', blush: true, over: star(26, 4) },
        { ms: 150, squash: true, eyes: 'happy', blush: true },
        { ms: 150, dy: -1, eyes: 'happy' },
        { ms: 150, eyes: 'happy', blush: true },
      ];
    default:
      return [{ ms: 150, squash: true, eyes: 'closed' }, { ms: 150, dy: -1 }, { ms: 150, squash: true }, { ms: 120 }];
  }
}
