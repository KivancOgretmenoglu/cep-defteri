/**
 * Misafir maskot yaşam döngüsü. Açılış başına en fazla BİR sahne:
 * açılışta zar atılır (counters localStorage'da, uygulama verisinde değil), saate uyan sahneler
 * sıralanır, ilk uygun ekranda 3–6 sn sonra gösterilir, 12–20 sn sonra (ya da dokununca) çekilir.
 * Hata ayıklama: ?cameo=sleep|cards|coins|hide|ball|coffee ya da localStorage 'cd.cameo.force'.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useStore } from '../../store/store';
import { useNav } from '../../ui/nav';
import { characterOf, type Lang, type MascotKey } from '../characters';
import { blockedReason, markShown, parseCounters, planOpen, registerOpen, sceneForScreen, showDelayMs, stayMs, KEY, REOPEN_AFTER_MS } from './logic';
import { FORCE_ALIASES, guestsFor, SCENES, type SceneId } from './scenes';

export interface ActiveCameo {
  id: SceneId;
  guests: MascotKey[];
  hour: number;
  lang: Lang;
  /** Kapanış animasyonu sürüyor */
  leaving: boolean;
  /** Ana ekran sahnesi için oturacağı kart */
  anchor: HTMLElement | null;
}

const LEDGE_SEL = '.screen--home section.card';

const INTERACTIVE = 'main a, main button, main input, main select, main textarea, main [role="button"]';

/**
 * Ekranda tamamen görünen, tab çubuğundan yeterince yukarıdaki ilk ana ekran kartı. Konuğun oturacağı
 * şerit (kartın hemen üstü) hiçbir düğme/bağlantı/alanla çakışmıyorsa uygundur.
 */
export function findLedgeCard(): HTMLElement | null {
  if (typeof document === 'undefined') return null;
  const vh = window.innerHeight;
  const ctl = [...document.querySelectorAll<HTMLElement>(INTERACTIVE)].map((e) => e.getBoundingClientRect()).filter((r) => r.width > 0);
  for (const el of document.querySelectorAll<HTMLElement>(LEDGE_SEL)) {
    const r = el.getBoundingClientRect();
    if (r.top < 130 || r.top > vh - 190 || r.height < 60) continue;
    const strip = { l: r.right - 12 - 230, r: r.right - 12, t: r.top - 80, b: r.top };
    if (!ctl.some((c) => c.right > strip.l && c.left < strip.r && c.bottom > strip.t && c.top < strip.b)) return el;
  }
  return null;
}

/** Başka bir maskot sözü, ipucu ya da bildirim görünüyor mu? */
/** Rehber (spot ışığı) açıkken de meşgul sayılır: <body data-tour="1">. */
const isBusy = () => document.body.dataset.tour === '1' || !!document.querySelector('.hint-region, .mascot-quip, .toast');

function readForce(): SceneId | null {
  try {
    const q = new URLSearchParams(location.search).get('cameo');
    const v = q ?? localStorage.getItem('cd.cameo.force');
    return v ? (FORCE_ALIASES[v] ?? null) : null;
  } catch {
    return null;
  }
}

function load() {
  try {
    return parseCounters(localStorage.getItem(KEY));
  } catch {
    return parseCounters(null);
  }
}
function save(c: ReturnType<typeof load>) {
  try {
    localStorage.setItem(KEY, JSON.stringify(c));
  } catch {
    /* özel pencere / kota: sessizce geç */
  }
}

const isTyping = () => {
  const el = document.activeElement as HTMLElement | null;
  return !!el && (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.isContentEditable);
};

const EXIT_MS = 400;

export function useCameo() {
  const { screen, sheet } = useNav();
  const enabled = useStore((s) => s.data.settings.cameos !== false);
  const noAccounts = useStore((s) => s.data.accounts.length === 0);
  const main = characterOf(useStore((s) => s.data.settings.mascot?.key)).key;
  const lang = useStore((s) => s.data.settings.lang ?? 'tr') as Lang;

  const [active, setActive] = useState<ActiveCameo | null>(null);
  const [poll, setPoll] = useState(0); // meşgulken (ipucu/bildirim) birkaç saniyede bir yeniden dene
  const [openN, setOpenN] = useState(0); // yeni "açılış" sayacı: efektleri yeniden çalıştırır
  const plan = useRef<SceneId[] | null>(null);
  const forced = useRef<SceneId | null>(null);
  const used = useRef(false);
  const shownOn = useRef<string>('');
  const hiddenAt = useRef<number | null>(null);
  const lastOpenAt = useRef(0);

  // Açılış: mount + arka plandan uzun süre sonra dönüş
  useEffect(() => {
    const open = () => {
      const now = Date.now();
      if (now - lastOpenAt.current < 1000) return; // StrictMode çift çağrısı
      lastOpenAt.current = now;
      used.current = false;
      const f = readForce();
      forced.current = f;
      if (f) {
        plan.current = [f];
      } else {
        const { counters, armed } = registerOpen(load(), now, Math.random);
        save(counters);
        plan.current = armed ? planOpen(new Date(now).getHours(), Math.random) : null;
      }
      setOpenN((n) => n + 1);
    };
    open();
    const onVis = () => {
      if (document.visibilityState === 'hidden') hiddenAt.current = Date.now();
      else if (hiddenAt.current != null && Date.now() - hiddenAt.current >= REOPEN_AFTER_MS) {
        hiddenAt.current = null;
        setActive(null);
        open();
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  const exit = useCallback(() => {
    setActive((a) => (a && !a.leaving ? { ...a, leaving: true } : a));
  }, []);
  useEffect(() => {
    if (!active?.leaving) return;
    const id = setTimeout(() => setActive(null), EXIT_MS);
    return () => clearTimeout(id);
  }, [active?.leaving]);

  const ctxKey = `${screen}|${sheet ? 1 : 0}|${enabled}|${noAccounts}|${openN}|${poll}`;

  // Uygun ekranda bekle, sonra göster
  useEffect(() => {
    if (used.current || !plan.current || active) return;
    const p = plan.current;
    const arm = () => {
      const block = blockedReason({ enabled, noAccounts, sheetOpen: !!sheet, typing: isTyping(), hidden: document.visibilityState === 'hidden', busy: isBusy() });
      if (block) return null;
      return sceneForScreen(p, screen);
    };
    if (!arm()) {
      const again = setTimeout(() => setPoll((n) => n + 1), 2500);
      return () => clearTimeout(again);
    }
    const id = setTimeout(() => {
      if (used.current) return;
      const scene = arm();
      if (!scene) return;
      used.current = true;
      const now = Date.now();
      const hour = new Date(now).getHours();
      if (!forced.current) save(markShown(load(), now));
      shownOn.current = screen;
      setActive({ id: scene, guests: guestsFor(scene, main), hour, lang, leaving: false, anchor: scene === 'hide' ? findLedgeCard() : null });
    }, forced.current ? 1200 : showDelayMs(Math.random));
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctxKey, active]);

  // Gösterilirken: süre dolunca, ekran/sayfa/yazı alanı değişince nazikçe çekil
  const live = !!active && !active.leaving;
  useEffect(() => {
    if (!live) return;
    const id = setTimeout(exit, forced.current ? 60_000 : stayMs(Math.random));
    const onFocus = () => isTyping() && exit();
    document.addEventListener('focusin', onFocus);
    return () => {
      clearTimeout(id);
      document.removeEventListener('focusin', onFocus);
    };
  }, [live, exit]);
  useEffect(() => {
    if (live && (sheet || !enabled || noAccounts || screen !== shownOn.current || !SCENES[active!.id].screens.includes(screen))) exit();
  }, [live, sheet, enabled, noAccounts, screen, active, exit]);

  return { active, dismiss: exit };
}
