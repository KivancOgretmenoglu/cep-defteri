import { useRef, useState } from 'react';
import { Clawd } from '../clawd/Clawd';
import type { Mood } from '../domain/mood';
import { useStore } from '../store/store';

/** Clawd + kısa durum notu. "Neden?" ile kuralın açıklaması görünür. */
export function ClawdNote({ mood, text, why, outfit, size = 92, action, compact = false }: { mood: Mood; text: string; why?: string; outfit: string; size?: number; action?: React.ReactNode; compact?: boolean }) {
  const body = useStore((s) => s.data.settings.clawd.body);
  const pulse = useStore((s) => s.pulse);
  const [open, setOpen] = useState(false);
  const [wiggle, setWiggle] = useState(0);
  // Yalnız bu ekran açıkken yapılan kayıtlarda onay hareketi oynar.
  const mountPulse = useRef(pulse);
  const fresh = pulse !== mountPulse.current;
  const play = wiggle ? 'wiggle' : fresh ? (mood === 'celebrate' ? 'hop' : 'nod') : null;
  return (
    <section className={`clawd-note ${compact ? 'clawd-note--compact' : ''}`} data-mood={mood} aria-label="Clawd'dan not">
      <button className="clawd-note__avatar" onClick={() => setWiggle(wiggle + 1)} aria-label="Clawd'ı dürt">
        <Clawd mood={mood} outfit={outfit} body={body} size={size} play={play} playKey={wiggle * 1000 + pulse} />
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
      </div>
    </section>
  );
}

/** Boş durumlar için Clawd. */
export function EmptyState({ outfit, mood = 'curious', title, children, action }: { outfit: string; mood?: Mood; title: string; children?: React.ReactNode; action?: React.ReactNode }) {
  const body = useStore((s) => s.data.settings.clawd.body);
  return (
    <div className="empty">
      <Clawd mood={mood} outfit={outfit} body={body} size={120} />
      <h3>{title}</h3>
      {children && <div className="empty__text">{children}</div>}
      {action}
    </div>
  );
}
