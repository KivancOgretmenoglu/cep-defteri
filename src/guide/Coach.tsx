/**
 * Spot ışıklı rehber: gerçek ekranlarda, gerçek düğmelerin etrafını açık bırakıp gerisini karartır,
 * seçili maskotun konuşma balonuyla "bu düğme" der. Adımlar steps.ts'te, satırlar lines.ts'te.
 * App.tsx'te bir kez <GuideHost/> olarak bağlanır.
 */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import * as A from '../domain/actions';
import type { Mood } from '../domain/mood';
import { commit, useStore } from '../store/store';
import { closeSheet, getNav, go, openSheet, useNav } from '../ui/nav';
import { useT } from '../i18n';
import { isNative } from '../platform';
import { Mascot } from '../mascot/Mascot';
import { useMascot } from '../mascot/MascotNote';
import { useReducedMotion } from '../mascot/lively';
import { useLocked } from '../lock/lockState';
import { useDevice } from '../store/device';
import { GUIDE_STEPS, GUIDE_VERSION, filterSteps, nextPresent, shouldAutoStart, type GuideStep } from './steps';
import { guideLine } from './lines';
import { clearAutoGuide, startGuide, stopGuide, useGuide } from './state';
import { TileBody, WidgetBody } from './Bodies';
import { placeBubble, type Box, type Frame } from './layout';
import './guide.css';

const PAD = 8;
const WAIT_MS = 1500;

const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function visible(el: Element): boolean {
  const r = el.getBoundingClientRect();
  if (r.width <= 0 || r.height <= 0) return false;
  const cs = getComputedStyle(el);
  return cs.visibility !== 'hidden' && cs.display !== 'none';
}

/** Adımın hedef öğeleri (görünenler); yoksa boş dizi. */
export function findTargets(step: GuideStep): HTMLElement[] {
  if (!step.target) return [];
  const all = (name: string) => [...document.querySelectorAll<HTMLElement>(`[data-tour="${name}"]`)].filter(visible);
  if (step.target.mode === 'first') {
    for (const n of step.target.names) {
      const hit = all(n)[0];
      if (hit) return [hit];
    }
    return [];
  }
  return step.target.names.flatMap(all);
}

function unionBox(els: HTMLElement[]): Box | null {
  if (!els.length) return null;
  let l = Infinity, t = Infinity, r = -Infinity, b = -Infinity;
  for (const e of els) {
    const q = e.getBoundingClientRect();
    l = Math.min(l, q.left);
    t = Math.min(t, q.top);
    r = Math.max(r, q.right);
    b = Math.max(b, q.bottom);
  }
  return { x: l - PAD, y: t - PAD, w: r - l + PAD * 2, h: b - t + PAD * 2 };
}

/** Güvenli alan payları: uygulamanın kendi --safe-t / --safe-b değişkenlerinden ölçülür. */
function safeInsets(): { t: number; b: number } {
  const p = document.createElement('div');
  p.style.cssText = 'position:fixed;visibility:hidden;pointer-events:none;padding-top:var(--safe-t);padding-bottom:var(--safe-b)';
  document.body.appendChild(p);
  const cs = getComputedStyle(p);
  const res = { t: parseFloat(cs.paddingTop) || 0, b: parseFloat(cs.paddingBottom) || 0 };
  p.remove();
  return res;
}

function measureFrame(safe: { t: number; b: number }): Frame {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let bottom = vh - safe.b;
  const bar = document.querySelector('.tabbar');
  if (bar && !document.body.classList.contains('has-sheet')) {
    const r = bar.getBoundingClientRect();
    if (r.height > 0 && r.top < bottom) bottom = r.top;
  }
  return { vw, vh, top: safe.t + 10, bottom: bottom - 10 };
}

const inFixedBar = (el: HTMLElement) => !!el.closest('.tabbar, .rail');

function scrollToTargets(els: HTMLElement[], reduced: boolean) {
  const el = els[0];
  if (!el || inFixedBar(el)) return;
  const box = unionBox(els)!;
  const inSheet = !!el.closest('.sheet');
  const block: ScrollLogicalPosition = inSheet ? 'nearest' : box.h > window.innerHeight * 0.4 ? 'start' : 'center';
  el.scrollIntoView({ block, inline: 'nearest', behavior: reduced ? 'auto' : 'smooth' });
}

/** App'te bir kez: yeni kurulumdan sonra rehberi kendiliğinden başlatır; açıkken katmanı çizer. */
export function GuideHost() {
  const g = useGuide();
  const { screen, sheet } = useNav();
  const mode = useStore((s) => s.mode);
  const hasAccounts = useStore((s) => s.data.accounts.length > 0);
  const guideVersion = useStore((s) => s.data.settings.guideVersion);
  const locked = useLocked();
  const hasPin = useDevice((p) => !!p.lock.pinHash);
  const busy = screen !== 'home' || !!sheet || (locked && hasPin);

  useEffect(() => {
    if (!g.pendingAuto || g.active) return;
    // Rehber zaten görülmüşse ya da demo/geri yükleme ile başka yere gidildiyse bekleyen başlatma düşer.
    if (mode !== 'real' || (guideVersion ?? 0) >= GUIDE_VERSION) {
      clearAutoGuide();
      return;
    }
    if (!shouldAutoStart({ mode, hasAccounts, guideVersion, pendingAuto: g.pendingAuto, busy })) return;
    const id = setTimeout(startGuide, 900);
    return () => clearTimeout(id);
  }, [g.pendingAuto, g.active, mode, hasAccounts, guideVersion, busy]);

  return g.active ? <Coach key={g.run} /> : null;
}

type Shown = { i: number; box: Box | null };

function Coach() {
  const t = useT();
  const m = useMascot();
  const reduced = useReducedMotion();
  const steps = useMemo(() => filterSteps(GUIDE_STEPS, { native: isNative() }), []);
  const [shown, setShown] = useState<Shown | null>(null);
  const [frame, setFrame] = useState<Frame>(() => ({ vw: window.innerWidth, vh: window.innerHeight, top: 10, bottom: window.innerHeight - 10 }));
  const [bh, setBh] = useState(190);
  const [moodOverride, setMoodOverride] = useState<Mood | null>(null);
  const [skipped, setSkipped] = useState<Set<number>>(() => new Set());
  const [seeking, setSeeking] = useState(true);
  const seq = useRef(0);
  const targets = useRef<HTMLElement[]>([]);
  const safe = useRef({ t: 0, b: 0 });
  const bubble = useRef<HTMLDivElement>(null);
  const primary = useRef<HTMLButtonElement>(null);
  const prevFocus = useRef<HTMLElement | null>(null);
  const done = useRef(false);

  const finish = useCallback(() => {
    if (done.current) return;
    done.current = true;
    seq.current++;
    if (getNav().sheet) closeSheet();
    commit((d) => A.updateSettings(d, { guideVersion: GUIDE_VERSION }));
    stopGuide();
    const back = prevFocus.current;
    setTimeout(() => (back && back.isConnected ? back : document.getElementById('main'))?.focus?.({ preventScroll: true }), 0);
  }, []);

  /** `from`'dan `dir` yönünde ilk bulunabilen adıma geçer; yoksa ileride biter, geride yerinde kalır. */
  const show = useCallback(
    async (from: number, dir: 1 | -1) => {
      const token = ++seq.current;
      const stale = () => token !== seq.current;
      setSeeking(true);
      for (let i = from; i >= 0 && i < steps.length; i += dir) {
        const s = steps[i];
        // Sayfa: gerekmiyorsa kapat (kaydetmeden; TxSheet taslak bırakmaz), gerekiyorsa aç.
        const nav = getNav();
        const wantAdd = s.sheet === 'add';
        if (nav.sheet && !(wantAdd && nav.sheet.kind === 'add')) {
          closeSheet();
          await nextFrame();
        }
        if (getNav().screen !== s.screen) {
          go(s.screen);
          await nextFrame();
        }
        let opened = false;
        if (wantAdd && !getNav().sheet) {
          openSheet({ kind: 'add' });
          opened = true;
        }
        if (stale()) return;
        let els: HTMLElement[] = [];
        if (s.target) {
          const t0 = performance.now();
          for (;;) {
            await nextFrame();
            if (stale()) return;
            els = findTargets(s);
            if (els.length || performance.now() - t0 > WAIT_MS) break;
          }
          if (!els.length) {
            setSkipped((k) => new Set(k).add(i));
            continue;
          }
          scrollToTargets(els, reduced);
          // Kaydırma/açılış animasyonu otursun: kutu birkaç kare kıpırdamayana kadar bekle (en çok ~1,2 sn).
          let last = unionBox(els), still = 0;
          const t1 = performance.now();
          while (still < 4 && performance.now() - t1 < 1200) {
            await nextFrame();
            if (stale()) return;
            const b = unionBox(els);
            still = b && last && Math.abs(b.x - last.x) + Math.abs(b.y - last.y) + Math.abs(b.h - last.h) < 0.5 ? still + 1 : 0;
            last = b;
          }
        }
        // Yeni açılan sayfanın kendi odaklaması bitsin (balon odağı geri alır).
        if (opened) await sleep(140);
        if (stale()) return;
        targets.current = els;
        // Aynı ekrandaki (sayfasız) adımların hedefleri şimdiden yoksa sayaçtan düş; ulaşınca yine denenir.
        const absent = s.sheet ? [] : steps.flatMap((x, k) => (k > i && x.target && !x.sheet && x.screen === s.screen && !findTargets(x).length ? [k] : []));
        setSkipped((k) => {
          const n = new Set(k);
          n.delete(i);
          absent.forEach((x) => n.add(x));
          return n;
        });
        setMoodOverride(null);
        setShown({ i, box: unionBox(els) });
        setSeeking(false);
        return;
      }
      if (dir === 1) finish();
    },
    [steps, reduced, finish],
  );

  // Başlangıç: güvenli alanlar, önceki odak, 1. adım.
  useEffect(() => {
    prevFocus.current = document.activeElement as HTMLElement | null;
    safe.current = safeInsets();
    setFrame(measureFrame(safe.current));
    void show(0, 1);
    return () => {
      seq.current++;
    };
  }, [show]);

  // Hedefi her karede izle: kaydırma, boyut değişimi, sayfa açılış animasyonu.
  useEffect(() => {
    if (!shown) return;
    let id = 0;
    const tick = () => {
      const f = measureFrame(safe.current);
      setFrame((p) => (p.vw === f.vw && p.vh === f.vh && p.top === f.top && p.bottom === f.bottom ? p : f));
      if (targets.current.length) {
        if (!targets.current.every((e) => e.isConnected)) targets.current = findTargets(steps[shown.i]);
        const b = unionBox(targets.current);
        setShown((s) => {
          if (!s || !b) return s;
          const o = s.box;
          if (o && Math.abs(o.x - b.x) < 0.5 && Math.abs(o.y - b.y) < 0.5 && Math.abs(o.w - b.w) < 0.5 && Math.abs(o.h - b.h) < 0.5) return s;
          return { ...s, box: b };
        });
      }
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [shown?.i, steps]); // eslint-disable-line react-hooks/exhaustive-deps

  // Balon yüksekliği (yerleşim için)
  useLayoutEffect(() => {
    const el = bubble.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setBh(el.offsetHeight));
    ro.observe(el);
    setBh(el.offsetHeight);
    return () => ro.disconnect();
  }, [shown?.i]);

  // Adım değişince odak birincil düğmeye
  useEffect(() => {
    if (shown) primary.current?.focus({ preventScroll: true });
  }, [shown?.i]); // eslint-disable-line react-hooks/exhaustive-deps

  const next = useCallback(() => shown && void show(shown.i + 1, 1), [shown, show]);
  const back = useCallback(() => {
    if (!shown) return;
    const prev = nextPresent(steps, shown.i - 1, -1, (s) => !skipped.has(steps.indexOf(s)));
    if (prev >= 0) void show(prev, -1);
  }, [shown, show, skipped]);

  // Klavye: Esc geçer, oklar gezinir; Tab balonda döner. Alttaki uygulama (sayfa, N kısayolu) tuşları görmez.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      e.stopPropagation();
      if (e.key === 'Escape') {
        e.preventDefault();
        finish();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        next();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        back();
      } else if (e.key === 'Tab' && bubble.current) {
        const f = [...bubble.current.querySelectorAll<HTMLElement>('button:not([disabled])')];
        if (!f.length) return;
        const i = f.indexOf(document.activeElement as HTMLElement);
        e.preventDefault();
        f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
      }
    };
    // Odak balondan kaçarsa (ör. sayfanın otomatik odağı) geri getir.
    const onFocus = (e: FocusEvent) => {
      const el = e.target as Node;
      if (bubble.current && !bubble.current.contains(el)) primary.current?.focus({ preventScroll: true });
    };
    window.addEventListener('keydown', onKey, true);
    document.addEventListener('focusin', onFocus, true);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      document.removeEventListener('focusin', onFocus, true);
    };
  }, [finish, next, back]);

  const step = shown ? steps[shown.i] : null;
  const box = shown?.box ?? null;
  const pos = placeBubble(box, frame, bh);
  const visibleSteps = steps.map((_, k) => k).filter((k) => !skipped.has(k));
  const n = shown ? visibleSteps.indexOf(shown.i) + 1 : 0;
  const total = visibleSteps.length;
  const isLast = shown ? shown.i === steps.length - 1 : false;
  const canBack = shown ? visibleSteps.some((k) => k < shown.i) : false;
  const mood = moodOverride ?? step?.mood ?? 'happy';

  // Delik: hedef yoksa ortada sıfır boyutlu (tüm ekran kararır).
  const hole: CSSProperties = box
    ? { left: box.x, top: box.y, width: box.w, height: box.h }
    : { left: frame.vw / 2, top: frame.vh / 2, width: 0, height: 0 };

  return (
    <div className={`coach ${reduced ? 'coach--still' : ''} ${seeking ? 'is-seeking' : ''}`} role="dialog" aria-modal="true" aria-label={t('guide.label')}>
      <div className="coach__block" onClick={(e) => e.stopPropagation()} />
      <div className={`coach__hole ${box ? '' : 'coach__hole--none'}`} style={hole} aria-hidden />
      {box && <div className="coach__ring" key={shown!.i} style={hole} aria-hidden />}
      {step && pos.side !== 'none' && (
        <i
          className={`coach__arrow coach__arrow--${pos.side}`}
          style={{ left: pos.left + pos.arrow - 8, top: pos.side === 'below' ? pos.top - 7 : pos.top + bh - 9 }}
          aria-hidden
        />
      )}
      {step && (
        <div
          ref={bubble}
          className={`coach__bubble coach__bubble--${pos.side}`}
          style={{ left: pos.left, top: pos.top, width: pos.w }}
          key={step.id}
        >
          <div className="coach__head">
            <span className="coach__mascot" aria-hidden>
              <Mascot who={m.who} mood={mood} size={52} lang={m.lang} name={m.name} idle={!reduced} />
            </span>
            <div className="coach__text">
              <p className="coach__name">{m.name} · <span>{t('guide.step', { n, total })}</span></p>
              <p className="coach__line" aria-live="polite">{guideLine(m.who, step.id, m.lang)}</p>
            </div>
          </div>
          {step.body === 'widget' && <WidgetBody onMood={setMoodOverride} />}
          {step.body === 'tile' && <TileBody onMood={setMoodOverride} />}
          <div className="coach__dots" aria-hidden>
            {steps.map((s, k) => (
              <i key={s.id} className={`${k === shown!.i ? 'is-on' : ''} ${skipped.has(k) ? 'is-skipped' : ''}`} />
            ))}
          </div>
          <div className="coach__foot">
            <button type="button" className="btn btn--ghost btn--small coach__skiptext" onClick={finish}>{t('guide.skip')}</button>
            {canBack && (
              <button type="button" className="btn btn--secondary btn--small" onClick={back} aria-label={t('guide.back')}>
                <ChevronLeft size={16} aria-hidden />
              </button>
            )}
            <button ref={primary} type="button" className="btn btn--primary btn--small coach__next" onClick={isLast ? finish : next}>
              {isLast ? t('guide.done') : t('guide.next')} {!isLast && <ChevronRight size={16} aria-hidden />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
