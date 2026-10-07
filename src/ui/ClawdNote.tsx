import { useEffect, useRef, useState } from 'react';
import { Clawd, HOME_OUTFITS } from '../clawd/Clawd';
import { useLively, type Lively } from '../clawd/lively';
import '../clawd/clawd.css';
import type { Mood } from '../domain/mood';
import { useStore } from '../store/store';

const HOME = HOME_OUTFITS as readonly string[];

function Pop({ lv }: { lv: Lively }) {
  return lv.pop ? (
    <span className="clawd-pop" key={lv.pop.key} aria-hidden="true">
      {lv.pop.text}
    </span>
  ) : null;
}
function Quip({ lv, float = false }: { lv: Lively; float?: boolean }) {
  // Görsel baloncuk dokununca kapanır; ekran okuyucuya ayrı, kibar (polite) bir canlı bölge duyurur.
  return lv.bubble ? (
    <button type="button" tabIndex={-1} aria-hidden="true" key={lv.bubble.key} className={`clawd-quip ${float ? 'clawd-quip--float' : ''}`} onClick={lv.dismiss}>
      {lv.bubble.text}
    </button>
  ) : null;
}
function Announce({ lv }: { lv: Lively }) {
  return (
    <p className="clawd-sr" aria-live="polite" aria-atomic="true">
      {lv.bubble?.text ?? ''}
    </p>
  );
}

/** Clawd + kısa durum notu. "Neden?" ile kuralın açıklaması görünür. */
export function ClawdNote({ mood, text, why, outfit, size = 92, action, compact = false }: { mood: Mood; text: string; why?: string; outfit: string; size?: number; action?: React.ReactNode; compact?: boolean }) {
  const body = useStore(() => 'coral');
  const pulse = useStore((s) => s.pulse);
  const quips = useStore((s) => s.data.settings.quips) !== false;
  const hideTotals = useStore((s) => !!s.data.settings.hideTotals);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);
  // Ana ekran Clawd'ı (dolaptaki kıyafetlerden birini giyer): bakiyeler gizliyse ajan olur.
  const home = HOME.includes(outfit);
  const lv = useLively({ mood, outfit, quips, home, spy: home && hideTotals, priority: home ? 0 : 1, ref });

  // Bu ekran açıkken yapılan kayıtlarda kısa onay hareketi; olay kanalından tepki geldiyse onu bozmaz.
  const seenPulse = useRef(pulse);
  const { play, lastEventAt } = lv;
  useEffect(() => {
    if (pulse === seenPulse.current) return;
    seenPulse.current = pulse;
    const t = setTimeout(() => {
      if (Date.now() - lastEventAt() > 800) play(mood === 'celebrate' ? 'hop' : 'nod');
    }, 300);
    return () => clearTimeout(t);
  }, [pulse, mood, play, lastEventAt]);

  return (
    <section className={`clawd-note ${compact ? 'clawd-note--compact' : ''}`} data-mood={mood} aria-label="Clawd'dan not">
      <button ref={ref} className="clawd-note__avatar" aria-label="Clawd'ı dürt (basılı tut: ipucu)" {...lv.bind}>
        <Clawd mood={mood} outfit={lv.outfit} body={body} size={size} live={lv.live} uid={lv.uid} />
        <Pop lv={lv} />
      </button>
      <div className="clawd-note__bubble">
        <p>{text}</p>
        <div className="clawd-note__foot">
          {why && (
            <button className="link link--small" aria-expanded={open} onClick={() => setOpen(!open)}>
              {open ? 'Gizle' : 'Neden böyle?'}
            </button>
          )}
          {action}
        </div>
        {open && why && <p className="clawd-note__why">{why}</p>}
        <Quip lv={lv} />
      </div>
      <Announce lv={lv} />
    </section>
  );
}

/** Boş durumlar için Clawd. */
export function EmptyState({ outfit, mood = 'curious', title, children, action }: { outfit: string; mood?: Mood; title: string; children?: React.ReactNode; action?: React.ReactNode }) {
  const body = useStore(() => 'coral');
  const quips = useStore((s) => s.data.settings.quips) !== false;
  const ref = useRef<HTMLButtonElement>(null);
  const lv = useLively({ mood, outfit, quips, priority: 2, ref });
  return (
    <div className="empty">
      <div className="clawd-live">
        <button ref={ref} className="clawd-live__btn" aria-label="Clawd'ı dürt (basılı tut: ipucu)" {...lv.bind}>
          <Clawd mood={mood} outfit={lv.outfit} body={body} size={120} live={lv.live} uid={lv.uid} />
          <Pop lv={lv} />
        </button>
        <Quip lv={lv} float />
      </div>
      <h3>{title}</h3>
      {children && <div className="empty__text">{children}</div>}
      {action}
      <Announce lv={lv} />
    </div>
  );
}
