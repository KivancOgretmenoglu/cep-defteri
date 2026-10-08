/**
 * Maskotu canlı tutan kanca: nefes ve kol salınımı (CSS), göz kırpma, bakış, imleci izleme,
 * ara sıra sürprizler, dokunma/uzun basma tepkileri, günün saati, olay tepkileri ve espriler.
 *
 * Her şey kozmetiktir; duygu (mood) domain/mood.ts'ten olduğu gibi gelir.
 * Hareket azaltma tercihinde yalnız göz kırpma ve kısa yüz ifadeleri kalır.
 * Sekme gizliyken ya da maskot ekranda değilken zamanlayıcılar durur.
 */
import { useCallback, useEffect, useId, useMemo, useRef, useState, type RefObject } from 'react';
import type { Mood } from '../domain/mood';
import { OUTFITS, type MascotLive } from './render';
import { buildAction, OUTFIT_ACTIONS, reduceFrames, sproutRects, type ActionName, type Frame } from './actions';
import { onMascotEvent, type MascotEvent } from './events';
import { dayPhase, type Season } from './seasonal';
import { eventPool, GREET, jokesFor, popsFor, say as sayLine, TIPS } from './quips';
import { CHARACTERS, type Lang, type MascotKey } from './characters';

export interface LivelyOptions {
  who: MascotKey;
  lang: Lang;
  /** Görünen ad (kullanıcının verdiği ya da karakterin adı) */
  name: string;
  /** Ana ekranda özel gün kıyafeti (yılbaşı, bayram, yaz) */
  season?: Season;
  /** Sınav haftası modu (ana ekran) */
  exam?: boolean;
  mood: Mood;
  outfit: string;
  /** Kullanıcı espri ayarı (settings.quips) */
  quips: boolean;
  /** Ana ekran maskotu mu (selam, ajan modu) */
  home?: boolean;
  /** Bakiyeler gizli: ajan kılığı */
  spy?: boolean;
  /** Aynı olayda kimin konuşacağı: küçük olan önce (ana ekran 0, not 1, boş durum 2) */
  priority?: number;
  ref: RefObject<Element | null>;
}

export interface Bubble {
  text: string;
  key: number;
}

export interface Lively {
  live: MascotLive;
  /** Çizilecek kıyafet */
  outfit: string;
  uid: string;
  pop: Bubble | null;
  bubble: Bubble | null;
  dismiss: () => void;
  /** Dışarıdan hareket oynat (ör. kayıt sonrası onay) */
  play: (name: ActionName) => void;
  /** Son olay zamanı (ms) */
  lastEventAt: () => number;
  /** Avatar düğmesine bağlanacak olaylar */
  bind: {
    onClick: () => void;
    onPointerDown: (e: React.PointerEvent) => void;
    onPointerUp: () => void;
    onPointerLeave: () => void;
    onPointerCancel: () => void;
    onContextMenu: (e: React.MouseEvent) => void;
    onKeyDown: (e: React.KeyboardEvent) => void;
  };
}

// ── Modül düzeyi: birden çok maskot aynı anda espri yapmasın ──
const QUIP_GAP = 120_000;
let lastQuipAt = -Infinity;
let greeted = false;
const BUBBLE_MS = 4200;

const rand = (a: number, b: number) => a + Math.random() * (b - a);

export function useReducedMotion(): boolean {
  const q = '(prefers-reduced-motion: reduce)';
  const [r, setR] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.(q).matches);
  useEffect(() => {
    const m = window.matchMedia?.(q);
    if (!m) return;
    const on = () => setR(m.matches);
    on();
    m.addEventListener?.('change', on);
    return () => m.removeEventListener?.('change', on);
  }, []);
  return r;
}

/** Görünür mü: sekme açık ve öğe ekranda. */
function useActive(ref: RefObject<Element | null>): boolean {
  const [onScreen, setOnScreen] = useState(true);
  const [docVisible, setDocVisible] = useState(() => typeof document === 'undefined' || !document.hidden);
  useEffect(() => {
    const v = () => setDocVisible(!document.hidden);
    document.addEventListener('visibilitychange', v);
    return () => document.removeEventListener('visibilitychange', v);
  }, []);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver((es) => setOnScreen(es.some((e) => e.isIntersecting)), { threshold: 0.05 });
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
  return onScreen && docVisible;
}

export function useLively({ who, lang, name, season = null, exam = false, mood, outfit: wantOutfit, quips, home = false, spy = false, priority = 1, ref }: LivelyOptions): Lively {
  const reduced = useReducedMotion();
  const active = useActive(ref);
  const uid = 'masc' + useId().replace(/[^a-zA-Z0-9]/g, '');
  // Öncelik: ajan (bakiye gizli) > sınav haftası > özel gün > seçilen kıyafet. Özel durumlar yalnız ana ekranda.
  const outfit = spy ? 'spy' : home && exam ? 'exam' : home && season ? season : wantOutfit;

  const [frame, setFrame] = useState<Frame | null>(null);
  const [blink, setBlink] = useState(false);
  const [glance, setGlance] = useState<[number, number] | null>(null);
  const [track, setTrack] = useState<[number, number] | null>(null);
  const [sprout, setSprout] = useState(0);
  const [now, setNow] = useState(() => new Date());
  const [pop, setPop] = useState<Bubble | null>(null);
  const [bubble, setBubble] = useState<Bubble | null>(null);
  // Sabah kahvesi "bazen": her açılışta yarı yarıya.
  const [coffeeLuck] = useState(() => Math.random() < 0.6);

  const phase = useMemo(() => dayPhase(now), [now]);

  // Zamanlayıcılar ve güncel değerler için referanslar
  const r = useRef({
    timer: 0 as number | ReturnType<typeof setTimeout>,
    playing: null as ActionName | null,
    popTimer: undefined as ReturnType<typeof setTimeout> | undefined,
    bubbleTimer: undefined as ReturnType<typeof setTimeout> | undefined,
    taps: [] as number[],
    pressTimer: undefined as ReturnType<typeof setTimeout> | undefined,
    pressed: false,
    lastEventAt: 0,
    lastDisguiseAt: 0,
    seq: 0,
  });
  const cur = useRef({ who, lang, name, season, exam, outfit, mood, sprout, reduced, active, quips, home, spy, bubble, priority });
  cur.current = { who, lang, name, season, exam, outfit, mood, sprout, reduced, active, quips, home, spy, bubble, priority };
  type Pool = Parameters<typeof sayLine>[0];
  const text = (pool: Pool) => sayLine(pool, cur.current.lang, cur.current.name);

  const showPop = useCallback((text: string) => {
    clearTimeout(r.current.popTimer);
    setPop({ text, key: ++r.current.seq });
    r.current.popTimer = setTimeout(() => setPop(null), 1300);
  }, []);

  const say = useCallback((text: string) => {
    clearTimeout(r.current.bubbleTimer);
    setBubble({ text, key: ++r.current.seq });
    r.current.bubbleTimer = setTimeout(() => setBubble(null), BUBBLE_MS);
  }, []);

  /** Espri: ayar açıksa, ekranda görünüyorsa, şansı tutarsa ve 2 dakikada bir. */
  const quip = useCallback(
    (pool: Pool | null, chance: number, ignoreGap = false) => {
      const c = cur.current;
      if (!pool || !c.quips || !c.active) return;
      const t = Date.now();
      // Aynı olay birden çok maskota ulaşır: önemli olaylarda bile yalnız biri konuşsun.
      if (t - lastQuipAt < (ignoreGap ? 1500 : QUIP_GAP)) return;
      if (Math.random() >= chance) return;
      lastQuipAt = t;
      say(text(pool));
    },
    [say],
  );

  const play = useCallback(
    (name: ActionName) => {
      clearTimeout(r.current.timer);
      const c = cur.current;
      let frames = buildAction(name, { who: c.who, outfit: c.outfit, sprout: c.sprout });
      if (c.reduced) frames = reduceFrames(frames);
      let i = 0;
      r.current.playing = name;
      const step = () => {
        if (i >= frames.length) {
          r.current.playing = null;
          setFrame(null);
          return;
        }
        const f = frames[i++];
        setFrame(f);
        if (f.pop) showPop(f.pop[cur.current.lang]);
        if (f.grow) setSprout((s) => Math.min(2, s + 1));
        r.current.timer = setTimeout(step, f.ms);
      };
      step();
    },
    [showPop],
  );

  // Temizlik
  useEffect(() => {
    const st = r.current;
    return () => {
      clearTimeout(st.timer);
      clearTimeout(st.popTimer);
      clearTimeout(st.bubbleTimer);
      clearTimeout(st.pressTimer);
    };
  }, []);

  // Görünmezken oynayan hareketi bitir (ekrana dönünce yarım kalmış kare kalmasın).
  useEffect(() => {
    if (!active && r.current.playing) {
      clearTimeout(r.current.timer);
      r.current.playing = null;
      setFrame(null);
    }
  }, [active]);

  // Saat: dakikada bir (yalnız görünürken)
  useEffect(() => {
    if (!active) return;
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, [active]);

  // Doğal göz kırpma: 2,5–6 sn arası, bazen çift
  useEffect(() => {
    if (!active) return;
    let t: ReturnType<typeof setTimeout>;
    const loop = () => {
      t = setTimeout(() => {
        setBlink(true);
        t = setTimeout(() => {
          setBlink(false);
          if (Math.random() < 0.2) {
            t = setTimeout(() => {
              setBlink(true);
              t = setTimeout(() => {
                setBlink(false);
                loop();
              }, 110);
            }, 160);
          } else loop();
        }, 130);
      }, rand(2500, 6000));
    };
    loop();
    return () => {
      clearTimeout(t);
      setBlink(false);
    };
  }, [active]);

  // Ara sıra bakış: sola, sağa, yukarı
  useEffect(() => {
    if (!active || reduced) return;
    let t: ReturnType<typeof setTimeout>;
    const dirs: [number, number][] = [[-1, 0], [1, 0], [0, -1], [-1, -1], [1, -1]];
    const loop = () => {
      t = setTimeout(() => {
        setGlance(dirs[Math.floor(Math.random() * dirs.length)]);
        t = setTimeout(() => {
          setGlance(null);
          loop();
        }, rand(600, 1300));
      }, rand(2500, 5500));
    };
    loop();
    return () => {
      clearTimeout(t);
      setGlance(null);
    };
  }, [active, reduced]);

  // Gözler imleci/parmağı izler (rAF ile seyreltilmiş), boşta merkeze döner
  useEffect(() => {
    if (!active || reduced) return;
    let raf = 0;
    let idle: ReturnType<typeof setTimeout> | undefined;
    let px = 0, py = 0;
    let lastKey = '';
    const apply = () => {
      raf = 0;
      const el = ref.current;
      if (!el) return;
      const b = el.getBoundingClientRect();
      const cx = b.left + b.width / 2, cy = b.top + b.height * 0.45;
      const ddx = px - cx, ddy = py - cy;
      const lx = Math.abs(ddx) > Math.max(24, b.width * 0.3) ? Math.sign(ddx) : 0;
      const ly = ddy < -Math.max(30, b.height * 0.5) ? -1 : ddy > Math.max(30, b.height * 0.5) ? 1 : 0;
      const k = `${lx},${ly}`;
      if (k !== lastKey) {
        lastKey = k;
        setTrack([lx, ly]);
      }
      clearTimeout(idle);
      idle = setTimeout(() => {
        lastKey = '';
        setTrack(null);
      }, 2500);
    };
    const move = (e: PointerEvent) => {
      px = e.clientX;
      py = e.clientY;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerdown', move, { passive: true });
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerdown', move);
      cancelAnimationFrame(raf);
      clearTimeout(idle);
      setTrack(null);
    };
  }, [active, reduced, ref]);

  // Sürprizler: görünürken 9–20 sn'de bir, havuzdan
  useEffect(() => {
    if (!active || reduced) return;
    let t: ReturnType<typeof setTimeout>;
    const loop = () => {
      t = setTimeout(() => {
        const c = cur.current;
        if (!r.current.playing && !c.bubble) {
          const ph = dayPhase(new Date());
          const pool: ActionName[] = ['stretch', 'hop', 'wave', 'turn', 'peek', 'sneeze', 'lookaround'];
          const own = OUTFIT_ACTIONS[c.outfit] ?? [];
          for (let k = 0; k < 3; k++) pool.push(...own);
          // Karakterin imza hareketleri daha sık
          for (let k = 0; k < 2; k++) pool.push(...(CHARACTERS[c.who].signature as ActionName[]));
          if (ph.night || ph.mondayMorning) pool.push('yawn', 'yawn', 'yawn');
          if (c.mood === 'celebrate') pool.push('dance', 'dance', 'dance');
          play(pool[Math.floor(Math.random() * pool.length)]);
        }
        loop();
      }, rand(9_000, 20_000));
    };
    loop();
    return () => clearTimeout(t);
  }, [active, reduced, play]);

  // Açılış selamı: oturumda bir kez, yalnız ana ekranda
  useEffect(() => {
    if (!home || !active || greeted) return;
    const t = setTimeout(() => {
      const c = cur.current;
      if (greeted || !c.quips || !c.active) return;
      const ph = dayPhase(new Date());
      const pool = c.spy
        ? GREET.spy
        : c.exam
          ? GREET.exam
          : c.season
            ? GREET[c.season]
            : ph.monthStart
              ? GREET.monthStart
              : ph.mondayMorning
                ? GREET.monday
                : ph.morning
                  ? GREET.morning
                  : ph.night
                    ? GREET.night
                    : null;
      greeted = true;
      if (pool) quip(pool, 1);
    }, 1800);
    return () => clearTimeout(t);
  }, [home, active, quip]);

  // Kılık değiştirme: ajan modu açılıp kapanınca (olay gelmese bile)
  const prevSpy = useRef(spy);
  useEffect(() => {
    if (prevSpy.current === spy) return;
    prevSpy.current = spy;
    if (Date.now() - r.current.lastDisguiseAt < 1500) return;
    r.current.lastDisguiseAt = Date.now();
    play(spy ? 'disguise' : 'undisguise');
    quip(spy ? GREET.spy : GREET.spyOff, 1, true);
  }, [spy, play, quip]);

  // Uygulama olayları
  useEffect(() => {
    return onMascotEvent((e: MascotEvent) => {
      const c = cur.current;
      r.current.lastEventAt = Date.now();
      if (!c.active) return;
      let act: ActionName = 'nod';
      // Espri sıklığı karakterin kişiliğinden
      let chance = CHARACTERS[c.who].quipChance;
      switch (e.type) {
        case 'expense':
          act = c.outfit === 'ledger' ? 'write' : 'note';
          break;
        case 'debt':
          act = c.who === 'karamel' ? 'tailwag' : 'nod';
          break;
        case 'income':
          act = 'coins';
          break;
        case 'invest':
          act = c.who === 'ceviz' ? 'stash' : 'sprout';
          break;
        case 'goal-reached':
          act = 'confetti';
          chance = 1;
          break;
        case 'refund':
          act = 'wiggle';
          break;
        case 'deleted':
        case 'undo':
          act = 'shrug';
          break;
        case 'plan-confirmed':
          act = e.kind === 'income' ? 'coins' : e.kind === 'expense' ? 'note' : 'nod';
          break;
        case 'hide-totals': {
          if (!c.home) return;
          if (Date.now() - r.current.lastDisguiseAt < 1500) return;
          r.current.lastDisguiseAt = Date.now();
          play(e.hidden ? 'disguise' : 'undisguise');
          quip(e.hidden ? GREET.spy : GREET.spyOff, 1, true);
          return;
        }
      }
      play(act);
      // Espri hareketin sonuna doğru gelsin
      const pool = eventPool(e, c.who);
      if (pool) setTimeout(() => quip(pool, chance, e.type === 'goal-reached'), 400 + 80 * c.priority);
    });
  }, [play, quip]);

  // ── Dokunma ──
  const dismiss = useCallback(() => {
    clearTimeout(r.current.bubbleTimer);
    setBubble(null);
  }, []);

  const longPress = useCallback(() => {
    const c = cur.current;
    const pool = c.quips && Math.random() < 0.5 ? jokesFor(c.who) : TIPS;
    say(text(pool));
    play('hey');
  }, [play, say]);

  const tap = useCallback(() => {
    if (r.current.pressed) {
      r.current.pressed = false;
      return;
    }
    const t = Date.now();
    const taps = (r.current.taps = [...r.current.taps.filter((x) => t - x < 2000), t]);
    if (taps.length >= 4) {
      r.current.taps = [];
      play(Math.random() < 0.5 ? 'dizzy' : 'tickle');
      return;
    }
    const opts: ActionName[] = ['giggle', 'jump', 'spin', 'hey', ...(CHARACTERS[cur.current.who].signature as ActionName[])];
    const name = opts[Math.floor(Math.random() * opts.length)];
    play(name);
    if (name === 'jump' || name === 'spin') showPop(text(popsFor(cur.current.who)));
  }, [play, showPop]);

  const bind = useMemo(
    () => ({
      onClick: tap,
      onPointerDown: (e: React.PointerEvent) => {
        if (e.button !== 0) return;
        r.current.pressed = false;
        clearTimeout(r.current.pressTimer);
        r.current.pressTimer = setTimeout(() => {
          r.current.pressed = true;
          longPress();
        }, 500);
      },
      onPointerUp: () => clearTimeout(r.current.pressTimer),
      onPointerLeave: () => clearTimeout(r.current.pressTimer),
      onPointerCancel: () => clearTimeout(r.current.pressTimer),
      onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
      onKeyDown: (e: React.KeyboardEvent) => {
        // Klavyeyle: "?" ipucu gösterir
        if (e.key === '?') {
          e.preventDefault();
          longPress();
        }
      },
    }),
    [tap, longPress],
  );

  const lastEventAt = useCallback(() => r.current.lastEventAt, []);

  // ── Kareyi birleştir ──
  const o = OUTFITS[frame?.outfit ?? outfit] ?? OUTFITS.plain;
  const sleepy = phase.night || phase.mondayMorning;
  const busy = o.hold ? [o.hold.side] : [];
  const coffeeSide = phase.morning && coffeeLuck && !phase.night ? (!busy.includes('r') ? 'r' : !busy.includes('l') ? 'l' : undefined) : undefined;
  let look = frame?.look ?? track ?? glance ?? undefined;
  if (reduced) look = frame?.look;
  const growth = outfit === 'gardener' ? sproutRects(who, sprout) : [];

  const live: MascotLive = {
    ...frame,
    look,
    eyes: frame?.eyes ?? (blink ? 'closed' : sleepy ? 'half' : undefined),
    nightcap: phase.night,
    zzz: phase.night && !frame && mood !== 'thoughtful' && mood !== 'curious',
    coffee: frame?.paws || frame?.props ? undefined : coffeeSide,
    props: [...growth, ...(frame?.props ?? [])],
    acting: !!frame,
  };

  return {
    live,
    outfit,
    uid,
    pop,
    bubble,
    dismiss,
    play,
    lastEventAt,
    bind,
  };
}
