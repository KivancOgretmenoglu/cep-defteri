/**
 * Kaydırma bakışı: uzun bir ekranı aşağı kaydırıp ana maskot notu görünmez olunca, seçili maskot
 * ara sıra ekran kenarından yarı gizli bakar, etrafına bakınıp göz kırpar ve geri çekilir.
 * Dokununca zıplayıp saklanır. Kurallar peek/logic.ts'te; App.tsx'te bir kez bağlanır.
 * Hata ayıklama: localStorage 'cd.peek.force' = '1' | 'left' | 'right' (şans/zaman kurallarını atlar).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useStore } from '../../store/store';
import { useNav } from '../../ui/nav';
import { characterOf } from '../characters';
import { Mascot } from '../Mascot';
import { useReducedMotion } from '../lively';
import type { MascotLive } from '../render';
import { peekBlock, PEEK_CHANCE, PEEK_STAY_MS } from './logic';
import './peek.css';

type Side = 'l' | 'r';
type Phase = 'in' | 'out';

const BUSY_SEL = '.cameo, .hint-region, .toast, .mascot-quip';
const isBusy = () => !!document.querySelector(BUSY_SEL);

function noteVisible(): boolean {
  const el = document.querySelector('main .mascot-note');
  if (!el) return false;
  const r = el.getBoundingClientRect();
  return r.bottom > 0 && r.top < window.innerHeight;
}

function readForce(): Side | true | null {
  try {
    const v = localStorage.getItem('cd.peek.force');
    if (!v) return null;
    return v === 'left' ? 'l' : v === 'right' ? 'r' : true;
  } catch {
    return null;
  }
}

/** Modül düzeyi: iki bakış arası süre (yeniden bağlanmalarda da korunur). */
let lastPeekAt = -Infinity;

const SLIDE_MS = 450;

export function ScrollPeek() {
  const { screen, sheet } = useNav();
  const enabled = useStore((s) => s.data.settings.cameos !== false);
  const onboarding = useStore((s) => s.data.accounts.length === 0 && s.mode === 'real');
  const who = characterOf(useStore((s) => s.data.settings.mascot?.key)).key;
  const outfit = useStore((s) => s.data.settings.mascot?.outfit ?? 'plain');
  const reduced = useReducedMotion();

  const [peek, setPeek] = useState<{ side: Side; phase: Phase; key: number } | null>(null);
  const [live, setLive] = useState<MascotLive>({});
  const visit = useRef({ used: false, lucky: false });
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  const later = (fn: () => void, ms: number) => timers.current.push(setTimeout(fn, ms));

  // Yeni ekran ziyareti: zar at
  useEffect(() => {
    visit.current = { used: false, lucky: Math.random() < PEEK_CHANCE };
  }, [screen]);

  const hide = useCallback(() => {
    clearTimers();
    setPeek((p) => (p && p.phase !== 'out' ? { ...p, phase: 'out' } : p));
    later(() => {
      setPeek(null);
      setLive({});
    }, SLIDE_MS);
  }, []);

  const show = useCallback((side: Side, forced: boolean) => {
    clearTimers();
    visit.current.used = true;
    lastPeekAt = Date.now();
    const s = side === 'l' ? 1 : -1; // içeri bakış yönü
    setPeek({ side, phase: 'in', key: Date.now() });
    // Bakın, kırp, yukarı, dışarı, tekrar içeri + kırp, gülümse
    const seq: [number, MascotLive][] = [
      [0, { look: [s, 0], acting: true }],
      [650, { look: [s, 0], eyes: 'closed', acting: true }],
      [780, { look: [s, 0], acting: true }],
      [1000, { look: [0, -1], acting: true }],
      [1450, { look: [-s, 0], acting: true }],
      [1900, { look: [s, 0], eyes: 'closed', acting: true }],
      [2030, { look: [s, 0], acting: true }],
      [2250, { eyes: 'happy', blush: true, acting: true }],
    ];
    for (const [t, l] of seq) later(() => setLive(l), SLIDE_MS + t);
    later(hide, SLIDE_MS + (forced ? 6000 : PEEK_STAY_MS));
  }, [hide]);

  // Dokunma: zıpla ve saklan
  const tap = useCallback(() => {
    clearTimers();
    const hop: [number, MascotLive][] = [
      [0, { squash: true, acting: true }],
      [90, { dy: -2, eyes: 'happy', acting: true }],
      [180, { dy: -4, eyes: 'happy', acting: true }],
      [300, { dy: -2, eyes: 'happy', acting: true }],
      [390, { squash: true, eyes: 'closed', acting: true }],
    ];
    for (const [t, l] of hop) later(() => setLive(l), t);
    later(hide, 480);
  }, [hide]);

  // Kaydırma: duraksayınca koşulları denetle
  const showing = !!peek;
  useEffect(() => {
    if (showing || reduced || !enabled || onboarding || sheet) return;
    let idle: ReturnType<typeof setTimeout> | undefined;
    const check = () => {
      const force = readForce();
      const block = peekBlock({
        enabled, reduced, onboarding, screen, sheetOpen: !!sheet, busy: isBusy(), hidden: document.visibilityState === 'hidden',
        usedThisVisit: visit.current.used, luckyVisit: visit.current.lucky, scrollY: window.scrollY,
        noteVisible: noteVisible(), now: Date.now(), lastPeekAt, forced: !!force,
      });
      // Bildirim/ipucu geçince (kaydırma sürmese de) bir kez daha dene
      if (block === 'busy') idle = setTimeout(check, 2000);
      if (block) return;
      const wide = window.matchMedia?.('(min-width: 768px)').matches;
      const side: Side = force === 'l' || force === 'r' ? force : wide ? 'r' : Math.random() < 0.5 ? 'l' : 'r';
      show(side, !!force);
    };
    const onScroll = () => {
      clearTimeout(idle);
      idle = setTimeout(check, 700);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      clearTimeout(idle);
    };
  }, [showing, reduced, enabled, onboarding, sheet, screen, show]);

  // Görünürken: ekran/sayfa değişirse ya da başka bir şey belirirse çekil
  const shownOn = useRef(screen);
  useEffect(() => {
    if (peek?.phase === 'in') shownOn.current = screen;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peek?.key]);
  useEffect(() => {
    if (peek?.phase !== 'in') return;
    if (sheet || !enabled || reduced || screen !== shownOn.current) return hide();
    const id = setInterval(() => isBusy() && hide(), 400);
    return () => clearInterval(id);
  }, [peek?.phase, sheet, enabled, reduced, screen, hide]);

  useEffect(() => () => clearTimers(), []);

  if (!peek) return null;
  return (
    <div className={`scroll-peek scroll-peek--${peek.side} ${peek.phase === 'out' ? 'is-out' : ''}`} key={peek.key} aria-hidden="true">
      <button type="button" className="scroll-peek__btn" tabIndex={-1} aria-hidden="true" onClick={tap}>
        <Mascot who={who} mood="calm" outfit={outfit} size={54} live={live} uid={`peek${peek.key}`} idle={false} />
      </button>
    </div>
  );
}
