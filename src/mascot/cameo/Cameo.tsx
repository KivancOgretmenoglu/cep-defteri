/**
 * Misafir maskot sahnesi: küçük köşe konuğu. Çizim gerçek gövdelerden (render.ts → compose) gelir;
 * animasyonlar cameo.css'te adım adımdır, "hareketi azalt" tercihinde durağan poz kalır.
 */
import { memo, useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { characterOf, type MascotKey } from '../characters';
import { compose, OX, OY, type MascotLive, type R } from '../render';
import { captionFor, SCENES, srLine, type SceneId } from './scenes';
import { useCameo, type ActiveCameo } from './useCameo';
import { CHAT_LINE_MS } from './chat';
import './cameo.css';

type Pose = 'open' | 'closed' | 'happy' | 'down';
const POSE: Record<Pose, { mood: 'calm' | 'happy'; live: MascotLive }> = {
  open: { mood: 'calm', live: {} },
  closed: { mood: 'calm', live: { eyes: 'closed' } },
  happy: { mood: 'happy', live: {} },
  down: { mood: 'calm', live: { eyes: 'half' } },
};

const cache = new Map<string, R[]>();
function bodyRects(k: MascotKey, pose: Pose): R[] {
  const id = k + pose;
  let r = cache.get(id);
  if (!r) {
    const p = POSE[pose];
    cache.set(id, (r = compose(k, p.mood, 'plain', p.live).figure));
  }
  return r;
}

const Rect = ({ x, y, w, h, f, cls, style }: { x: number; y: number; w: number; h: number; f: string; cls?: string; style?: React.CSSProperties }) => (
  <rect x={x} y={y} width={w} height={h} fill={f} className={cls} style={style} />
);

/** 24×24 gövde, (x, y) noktasına; `cls` animasyon için dış grupta durur. */
const Sprite = memo(function Sprite({ who, pose, x, y, cls }: { who: MascotKey; pose: Pose; x: number; y: number; cls?: string }) {
  return (
    <g className={cls}>
      <g transform={`translate(${x - OX} ${y - OY})`}>
        {bodyRects(who, pose).map(([rx, ry, w, h, f], i) => (
          <rect key={i} x={rx} y={ry} width={w} height={h} fill={f} />
        ))}
      </g>
    </g>
  );
});

const GOLD = '#E5B94A';
const GOLD2 = '#B8892A';
const WOOD = '#C9955A';
const WOOD2 = '#8A5A2B';
const CREAM = '#FBF6EC';

/** Büyük/küçük "z" (currentColor) */
const Zed = ({ x, y, big }: { x: number; y: number; big?: boolean }) =>
  big ? (
    <>
      <Rect x={x} y={y} w={4} h={1} f="currentColor" />
      <Rect x={x + 2} y={y + 1} w={1} h={1} f="currentColor" />
      <Rect x={x + 1} y={y + 2} w={1} h={1} f="currentColor" />
      <Rect x={x} y={y + 3} w={4} h={1} f="currentColor" />
    </>
  ) : (
    <>
      <Rect x={x} y={y} w={3} h={1} f="currentColor" />
      <Rect x={x + 1} y={y + 1} w={1} h={1} f="currentColor" />
      <Rect x={x} y={y + 2} w={3} h={1} f="currentColor" />
    </>
  );

const TREAT_COLORS: Record<MascotKey, [string, string]> = {
  karamel: [CREAM, '#D8CDB8'],
  fistik: ['#7FB2D6', '#4F86AD'],
  diken: ['#D14B4B', '#9B2F2F'],
  bilge: ['#E6B23C', '#B5862A'],
  ceviz: ['#8A5A2B', '#5C3A17'],
  pamuk: ['#F08A3C', '#C9652A'],
};

function Art({ id, g }: { id: SceneId; g: MascotKey[] }) {
  const [a, b] = g;
  switch (id) {
    case 'sleep':
      return (
        <svg className="cameo__art" viewBox="0 0 28 26" width={SCENES.sleep.w} height={Math.round((SCENES.sleep.w * 26) / 28)} aria-hidden>
          <Sprite who={a} pose="closed" x={0} y={2} cls="cm-breathe" />
          <g style={{ color: 'var(--accent)' }}>
            <g className="cm-z1"><Zed x={20} y={7} big /></g>
            <g className="cm-z2"><Zed x={23} y={3} /></g>
          </g>
        </svg>
      );
    case 'cards': {
      const card = (x: number, delay: number, pip: string) => (
        <g className="cm-flip" style={{ animationDelay: `${delay}s` }} key={x}>
          <Rect x={x} y={13} w={3} h={4} f="#3E4A8C" />
          <g className="cm-face" style={{ animationDelay: `${delay}s` }}>
            <Rect x={x} y={13} w={3} h={4} f={CREAM} />
            <Rect x={x + 1} y={14} w={1} h={2} f={pip} />
          </g>
        </g>
      );
      return (
        <svg className="cameo__art" viewBox="0 0 46 24" width={SCENES.cards.w} height={SCENES.cards.w / 2} aria-hidden>
          <Sprite who={a} pose="down" x={0} y={0} />
          <Sprite who={b} pose="down" x={22} y={0} />
          <Rect x={1} y={17} w={44} h={2} f={WOOD} />
          <Rect x={1} y={19} w={44} h={1} f={WOOD2} />
          <Rect x={4} y={20} w={2} h={4} f={WOOD2} />
          <Rect x={40} y={20} w={2} h={4} f={WOOD2} />
          {card(19, 0, '#D14B4B')}
          {card(22, -1.2, '#2A1E1A')}
          {card(25, -2.4, '#D14B4B')}
        </svg>
      );
    }
    case 'coins':
      return (
        <svg className="cameo__art" viewBox="0 0 28 26" width={SCENES.coins.w} height={Math.round((SCENES.coins.w * 26) / 28)} aria-hidden>
          <Sprite who={a} pose="open" x={0} y={0} cls="cm-hop2" />
          <Rect x={10} y={23} w={6} h={1} f={GOLD2} />
          <Rect x={10} y={22} w={6} h={1} f={GOLD} />
          <Rect x={11} y={21} w={4} h={1} f={GOLD2} />
          <Rect x={11} y={20} w={4} h={1} f={GOLD} />
          <Rect x={12} y={19} w={2} h={1} f={GOLD2} />
          <g className="cm-pile"><Rect x={12} y={18} w={2} h={1} f={GOLD} /></g>
          <g className="cm-coin">
            <Rect x={2} y={17} w={2} h={2} f={GOLD} />
            <Rect x={2} y={17} w={1} h={1} f="#FFF3C4" />
          </g>
          <Rect x={21} y={22} w={3} h={3} f={GOLD} />
          <Rect x={21} y={22} w={1} h={1} f="#FFF3C4" />
          <Rect x={21} y={24} w={3} h={1} f={GOLD2} />
          <Rect x={25} y={21} w={2} h={2} f={GOLD} />
          <Rect x={25} y={21} w={1} h={1} f="#FFF3C4" />
        </svg>
      );
    case 'hide': {
      const t = TREAT_COLORS[a];
      return (
        <svg className="cameo__art cameo__art--clip" viewBox="0 0 26 17" width={SCENES.hide.w} height={Math.round((SCENES.hide.w * 17) / 26)} aria-hidden>
          <Sprite who={a} pose="open" x={1} y={2} cls="cm-peek" />
          <Rect x={0} y={16} w={26} h={1} f="var(--line-strong)" />
          <Rect x={5} y={15} w={6} h={1} f="var(--ink)" />
          <g className="cm-nut">
            <Rect x={15} y={10} w={3} h={3} f={t[0]} />
            <Rect x={15} y={12} w={3} h={1} f={t[1]} />
            <Rect x={16} y={10} w={1} h={1} f="#FFFFFF" />
          </g>
        </svg>
      );
    }
    case 'ball':
      return (
        <svg className="cameo__art" viewBox="0 0 28 26" width={SCENES.ball.w} height={Math.round((SCENES.ball.w * 26) / 28)} aria-hidden>
          <Sprite who={a} pose="happy" x={0} y={2} cls="cm-hop" />
          <Rect x={20} y={24} w={5} h={1} f="rgba(0,0,0,.18)" />
          <g className="cm-bounce">
            <Rect x={21} y={19} w={4} h={4} f="var(--accent)" />
            <Rect x={21} y={19} w={1} h={1} f="#FFFFFF" />
            <Rect x={21} y={22} w={4} h={1} f="rgba(0,0,0,.25)" />
          </g>
        </svg>
      );
    case 'chat':
      return null;
    case 'coffee':
      return (
        <svg className="cameo__art" viewBox="0 0 28 26" width={SCENES.coffee.w} height={Math.round((SCENES.coffee.w * 26) / 28)} aria-hidden>
          <Sprite who={a} pose="happy" x={2} y={2} />
          <g className="cm-sip">
            <Rect x={22} y={17} w={5} h={4} f={CREAM} />
            <Rect x={22} y={18} w={5} h={1} f={WOOD2} />
            <Rect x={27} y={18} w={1} h={2} f={CREAM} />
            <Rect x={22} y={21} w={4} h={1} f="#D8CDB8" />
          </g>
          <g className="cm-steam" style={{ color: '#9a9183' }}><Rect x={23} y={13} w={1} h={2} f="currentColor" /></g>
          <g className="cm-steam2" style={{ color: '#9a9183' }}><Rect x={25} y={12} w={1} h={2} f="currentColor" /></g>
        </svg>
      );
  }
}

const T = { dismiss: { tr: 'Misafir maskotu kapat', en: 'Dismiss guest mascot' } };

/**
 * Sohbet: misafir, ana ekrandaki maskot notunun baloncuğuna (sağ alt köşe, ana maskotun karşısı) yürüyerek gelir;
 * satırlar baloncuğun üstünde sırayla görünür (misafir, ana maskot, …), sonra misafir el sallayıp gider.
 * Hareketi azalt tercihinde yürüme/zıplama yok; satırlar yine sırayla değişir.
 */
function ChatScene({ c, onDismiss }: { c: ActiveCameo; onDismiss: () => void }) {
  const lines = c.chat ?? [];
  const [i, setI] = useState(0);
  useEffect(() => {
    if (i >= lines.length) return;
    const id = setTimeout(() => setI((n) => n + 1), CHAT_LINE_MS);
    return () => clearTimeout(id);
  }, [i, lines.length]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onDismiss();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onDismiss]);
  const bubble = c.anchor?.querySelector<HTMLElement>('.mascot-note__bubble');
  if (!bubble) return null;
  const guest = c.guests[0];
  const ch = characterOf(guest);
  const line = lines[i];
  const waving = i >= lines.length;
  const speaker = line ? (line.who === 'guest' ? ch.name[c.lang] : null) : null;
  return createPortal(
    <div className={`cameo-chat ${c.leaving ? 'is-gone' : ''} ${waving ? 'is-waving' : ''}`} data-scene="chat" style={{ ['--g-soft' as string]: ch.palette.soft, ['--g-line' as string]: ch.palette.line, ['--g-accent' as string]: ch.palette.accent }}>
      <span className="sr-only" role="status" aria-live="polite">{line ? `${speaker ?? ''}${speaker ? ': ' : ''}${line.text}` : ''}</span>
      <button type="button" className="cameo-chat__guest" tabIndex={-1} aria-hidden onClick={onDismiss} title={T.dismiss[c.lang]}>
        <svg viewBox="0 0 24 24" width={SCENES.chat.w} height={SCENES.chat.w} aria-hidden>
          <Sprite who={guest} pose={waving || line?.who === 'guest' ? 'happy' : 'open'} x={0} y={0} cls={waving ? 'cm-hop' : line?.who === 'guest' ? 'cm-talk' : undefined} />
        </svg>
      </button>
      {line && (
        <button type="button" tabIndex={-1} aria-hidden key={i} className={`cameo-chat__line is-${line.who}`} onClick={onDismiss} title={T.dismiss[c.lang]}>
          {speaker && <em>{speaker}</em>}
          {line.text}
        </button>
      )}
    </div>,
    bubble,
  );
}

function Scene({ c, onDismiss }: { c: ActiveCameo; onDismiss: () => void }) {
  if (c.id === 'chat') return <ChatScene c={c} onDismiss={onDismiss} />;
  return <CornerScene c={c} onDismiss={onDismiss} />;
}

function CornerScene({ c, onDismiss }: { c: ActiveCameo; onDismiss: () => void }) {
  const def = SCENES[c.id];
  const names = c.guests.map((k) => characterOf(k).name[c.lang]).join(c.lang === 'tr' ? ' & ' : ' & ');
  const ledge = def.place === 'ledge';

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onDismiss();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onDismiss]);

  // Ana ekran sahnesi bir kartın üst kenarına oturur: kart konumlanma bağlamı olur.
  const anchor = c.anchor;
  useEffect(() => {
    if (!ledge || !anchor) return;
    const prev = anchor.style.position;
    if (getComputedStyle(anchor).position === 'static') anchor.style.position = 'relative';
    return () => {
      anchor.style.position = prev;
    };
  }, [ledge, anchor]);

  const body: ReactNode = (
    <div className={`cameo cameo--${ledge && anchor ? 'ledge' : def.place === 'ledge' ? 'br' : def.place} ${c.leaving ? 'is-gone' : ''}`} data-scene={c.id} data-ledge={ledge && anchor ? '' : undefined}>
      <span className="sr-only" role="status" aria-live="polite">{srLine(c.id, c.guests, c.lang, c.hour)}</span>
      <button type="button" className="cameo__btn" tabIndex={-1} aria-hidden onClick={onDismiss} title={T.dismiss[c.lang]}>
        <Art id={c.id} g={c.guests} />
        <span className="cameo__bubble">
          <em>{names}</em>
          {captionFor(c.id, c.guests, c.lang, c.hour)}
        </span>
      </button>
    </div>
  );
  return ledge && anchor ? createPortal(body, anchor) : body;
}

/** App.tsx'te bir kez bağlanır. */
export function CameoHost() {
  const { active, dismiss } = useCameo();
  if (!active) return null;
  return <Scene c={active} onDismiss={dismiss} />;
}
