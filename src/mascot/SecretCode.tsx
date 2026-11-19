/**
 * Ayarlar'ın en altındaki gizli kod alanı. Görünmez durur; sayfanın en altına varıp ardından bir kez daha
 * aşağı kaydırınca (yeni bir dokunma/tekerlek hareketi ya da ↓ tuşu) açılır. En alta ilk varış sayılmaz.
 * Doğru kod gizli maskotu açar ve hemen seçer.
 */
import { useEffect, useRef, useState } from 'react';
import { KeyRound } from 'lucide-react';
import * as A from '../domain/actions';
import { commit, showToast, useStore } from '../store/store';
import { haptic } from '../native/haptics';
import { CHARACTERS, type Lang } from './characters';
import { Mascot } from './Mascot';
import { mascotWith } from './MascotPicker';
import { redeemCode, unlockedOf } from './secret';

const T = {
  title: { tr: 'Gizli kod', en: 'Secret code' },
  hint: { tr: 'Bir kodun varsa buraya yaz.', en: 'Got a code? Type it here.' },
  label: { tr: 'Kod', en: 'Code' },
  try: { tr: 'Dene', en: 'Try' },
  wrong: { tr: 'Olmadı. Bir daha dene.', en: 'Nope. Try again.' },
  already: { tr: 'Bu kod zaten açık.', en: 'Already unlocked.' },
  unlocked: { tr: '{name} açıldı! Artık maskotun o.', en: '{name} unlocked! Your sidekick now.' },
  owned: { tr: 'Açtığın gizli maskotlar', en: 'Secret sidekicks you unlocked' },
};

/** En alta varıştan sonra bu süre geçmeden gelen hareket sayılmaz (kaydırmanın ataleti). */
const SETTLE_MS = 350;
/** Ayrı bir tekerlek hareketi sayılması için önceki tekerlek olayından bu kadar sonra başlamalı. */
const WHEEL_GAP_MS = 300;

/** En alttayken yeniden aşağı kaydırma girişimini yakalar. */
function useOverscrollAgain(onAgain: () => void, enabled: boolean) {
  const cb = useRef(onAgain);
  cb.current = onAgain;
  useEffect(() => {
    if (!enabled) return;
    const atBottom = () => window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
    let since = atBottom() ? performance.now() : 0;
    const settled = () => since > 0 && performance.now() - since > SETTLE_MS;
    const onScroll = () => {
      if (!atBottom()) since = 0;
      else if (!since) since = performance.now();
    };
    let touchY: number | null = null;
    const onTouchStart = (e: TouchEvent) => {
      touchY = settled() ? e.touches[0].clientY : null;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (touchY == null || !atBottom()) return;
      if (touchY - e.touches[0].clientY > 56) {
        touchY = null;
        cb.current();
      }
    };
    let lastWheel = 0, wheelOk = false, wheelSum = 0;
    const onWheel = (e: WheelEvent) => {
      const now = performance.now();
      if (now - lastWheel > WHEEL_GAP_MS) {
        wheelOk = settled();
        wheelSum = 0;
      }
      lastWheel = now;
      if (!wheelOk || e.deltaY <= 0 || !atBottom()) return;
      wheelSum += e.deltaY;
      if (wheelSum > 80) {
        wheelOk = false;
        cb.current();
      }
    };
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
      if (settled() && ['ArrowDown', 'PageDown', 'End'].includes(e.key)) cb.current();
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKey);
    };
  }, [enabled]);
}

export function SecretCode() {
  const lang = useStore((s) => s.data.settings.lang ?? 'tr') as Lang;
  const unlocked = unlockedOf(useStore((s) => s.data.settings.unlockedMascots));
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [shake, setShake] = useState(0);
  const ref = useRef<HTMLElement>(null);

  useOverscrollAgain(() => {
    haptic('light');
    setOpen(true);
  }, !open);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      ref.current?.querySelector('input')?.focus({ preventScroll: true });
    }, 60);
    return () => clearTimeout(t);
  }, [open]);

  if (!open) return null;

  const submit = () => {
    const key = redeemCode(code);
    if (!key) {
      haptic('warning');
      setMsg({ text: T.wrong[lang], ok: false });
      setShake((n) => n + 1);
      return;
    }
    if (unlocked.includes(key)) {
      setMsg({ text: T.already[lang], ok: true });
      setCode('');
      return;
    }
    commit((d) =>
      A.updateSettings(d, {
        unlockedMascots: [...unlockedOf(d.settings.unlockedMascots), key],
        mascot: mascotWith(d.settings.mascot, key),
      }),
    );
    haptic('success');
    const text = T.unlocked[lang].replace('{name}', CHARACTERS[key].name[lang]);
    setMsg({ text, ok: true });
    setCode('');
    showToast(text);
  };

  return (
    <section ref={ref} className="card secret-code" aria-labelledby="s-secret">
      <div className="section-head">
        <h2 id="s-secret">
          <KeyRound size={17} aria-hidden /> {T.title[lang]}
        </h2>
      </div>
      <p className="muted small">{T.hint[lang]}</p>
      <form
        className={`secret-code__row ${msg && !msg.ok ? 'is-wrong' : ''}`}
        key={shake}
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <label className="field">
          <span className="field__label">{T.label[lang]}</span>
          <input
            className="input"
            value={code}
            maxLength={32}
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            onChange={(e) => {
              setCode(e.target.value);
              setMsg(null);
            }}
          />
        </label>
        <button type="submit" className="btn btn--secondary" disabled={!code.trim()}>
          {T.try[lang]}
        </button>
      </form>
      {msg && (
        <p className={`small ${msg.ok ? '' : 'tone-warn'}`} role="status">
          {msg.text}
        </p>
      )}
      {unlocked.length > 0 && (
        <div className="secret-code__owned">
          <span className="muted small">{T.owned[lang]}</span>
          <div>
            {unlocked.map((k) => (
              <Mascot key={k} who={k} mood="happy" size={48} idle={false} lang={lang} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
