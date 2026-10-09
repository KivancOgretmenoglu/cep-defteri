import { useEffect, useRef, useState } from 'react';
import type { Mood } from '../domain/mood';
import { useStore } from '../store/store';
import { Mascot } from './Mascot';
import { useLively, type Lively } from './lively';
import { HOME_OUTFITS } from './render';
import { characterOf, type Lang } from './characters';
import { examActive, homeOutfit, pajamaTime, seasonFor } from './seasonal';
import { useNow } from '../ui/Sky';
import { Plus } from 'lucide-react';
import { useT } from '../i18n';
import type { Key, Vars } from '../i18n/core';
import type { ActionName } from './actions';
import { EMPTY_SCENES, sceneKeys, type EmptyScene } from './emptyScenes';
import './mascot.css';

const HOME = HOME_OUTFITS as readonly string[];

const TXT = {
  note: { tr: 'not', en: 'note' },
  poke: { tr: 'dürt (basılı tut: ipucu)', en: 'poke (hold: tip)' },
  hide: { tr: 'Gizle', en: 'Hide' },
  why: { tr: 'Neden böyle?', en: 'Why?' },
};

/** Seçili maskot, adı, dili ve özel günü. */
export function useMascot() {
  const who = useStore((s) => s.data.settings.mascot?.key);
  const custom = useStore((s) => s.data.settings.mascot?.name);
  const lang = useStore((s) => s.data.settings.lang ?? 'tr') as Lang;
  const quips = useStore((s) => s.data.settings.quips) !== false;
  const today = useStore((s) => s.today);
  const examUntil = useStore((s) => s.data.settings.examUntil);
  const ch = characterOf(who);
  return {
    ch,
    who: ch.key,
    lang,
    name: custom?.trim() || ch.name[lang],
    quips,
    season: seasonFor(today),
    exam: examActive(examUntil, today),
  };
}

function Pop({ lv }: { lv: Lively }) {
  return lv.pop ? (
    <span className="mascot-pop" key={lv.pop.key} aria-hidden="true">
      {lv.pop.text}
    </span>
  ) : null;
}
function Quip({ lv, float = false }: { lv: Lively; float?: boolean }) {
  return lv.bubble ? (
    <button type="button" tabIndex={-1} aria-hidden="true" key={lv.bubble.key} className={`mascot-quip ${float ? 'mascot-quip--float' : ''}`} onClick={lv.dismiss}>
      {lv.bubble.text}
    </button>
  ) : null;
}
function Announce({ lv }: { lv: Lively }) {
  return (
    <p className="mascot-sr" aria-live="polite" aria-atomic="true">
      {lv.bubble?.text ?? ''}
    </p>
  );
}

/** Maskot + kısa durum notu. "Neden?" ile kuralın açıklaması görünür. */
export function MascotNote({ mood, text, why, outfit, size = 92, action, compact = false }: { mood: Mood; text: string; why?: string; outfit: string; size?: number; action?: React.ReactNode; compact?: boolean }) {
  const m = useMascot();
  const pulse = useStore((s) => s.pulse);
  const hideTotals = useStore((s) => !!s.data.settings.hideTotals);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);
  // Ana ekran maskotu (dolaptaki kıyafetlerden biri): bakiyeler gizliyse ajan, özel günlerde bayramlık.
  const home = HOME.includes(outfit) || outfit === 'spy';
  // Gece 22–06 ana ekran maskotu pijamalı (ajan > sınav > özel gün > pijama > seçilen kıyafet)
  const night = pajamaTime(useNow());
  const mine = outfit === 'spy' ? 'plain' : outfit;
  const want = home ? homeOutfit({ spy: hideTotals, exam: m.exam, season: m.season, night, user: mine }) : mine;
  const lv = useLively({ who: m.who, lang: m.lang, name: m.name, season: m.season, exam: m.exam, mood, outfit: want, quips: m.quips, home, spy: home && hideTotals, priority: home ? 0 : 1, ref });

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
    <section className={`mascot-note ${compact ? 'mascot-note--compact' : ''}`} data-mood={mood} aria-label={`${m.name}: ${TXT.note[m.lang]}`}>
      <button ref={ref} className="mascot-note__avatar" aria-label={`${m.name}: ${TXT.poke[m.lang]}`} {...lv.bind}>
        <Mascot who={m.who} mood={mood} outfit={lv.outfit} size={size} live={lv.live} uid={lv.uid} lang={m.lang} name={m.name} />
        <Pop lv={lv} />
      </button>
      <div className="mascot-note__bubble">
        <p>{text}</p>
        <div className="mascot-note__foot">
          {why && (
            <button className="link link--small" data-tour="why" aria-expanded={open} onClick={() => setOpen(!open)}>
              {open ? TXT.hide[m.lang] : TXT.why[m.lang]}
            </button>
          )}
          {action}
        </div>
        {open && why && <p className="mascot-note__why">{why}</p>}
        <Quip lv={lv} />
      </div>
      <Announce lv={lv} />
    </section>
  );
}

/**
 * Boş durumlar için maskot. `acts` verilirse maskot o ekrana özgü küçük bir sahneyi aralıklarla
 * tekrarlar (yazmak, gözlük düzeltmek, bozuk para…). `compact`: yatay, küçük (liste içi) görünüm.
 */
export function EmptyState({ outfit, mood = 'curious', title, children, action, acts, compact = false }: { outfit: string; mood?: Mood; title: string; children?: React.ReactNode; action?: React.ReactNode; acts?: readonly ActionName[]; compact?: boolean }) {
  const m = useMascot();
  const ref = useRef<HTMLButtonElement>(null);
  const lv = useLively({ who: m.who, lang: m.lang, name: m.name, mood, outfit, quips: m.quips, priority: 2, ref });
  const { play } = lv;
  const actsKey = acts?.join(',') ?? '';
  useEffect(() => {
    const list = actsKey ? (actsKey.split(',') as ActionName[]) : [];
    if (!list.length) return;
    let i = 0;
    let timer: ReturnType<typeof setTimeout>;
    // İlk hareket ekran girişinden hemen sonra; sonra 5–8 sn arayla (sekme gizliyken oynamaz).
    const tick = (ms: number) => {
      timer = setTimeout(() => {
        if (!document.hidden) play(list[i++ % list.length]);
        tick(5000 + Math.random() * 3000);
      }, ms);
    };
    tick(650);
    return () => clearTimeout(timer);
  }, [actsKey, play]);
  const size = compact ? 72 : acts ? 104 : 120;
  return (
    <div className={`empty ${acts ? 'empty--scene' : ''} ${compact ? 'empty--compact' : ''}`}>
      <div className="mascot-live">
        <button ref={ref} className="mascot-live__btn" aria-label={`${m.name}: ${TXT.poke[m.lang]}`} {...lv.bind}>
          <Mascot who={m.who} mood={mood} outfit={lv.outfit} size={size} live={lv.live} uid={lv.uid} lang={m.lang} name={m.name} />
          <Pop lv={lv} />
        </button>
        <Quip lv={lv} float />
      </div>
      <div className="empty__copy">
        <h3>{title}</h3>
        {children && <div className="empty__text">{children}</div>}
        {action && <div className="empty__action">{action}</div>}
      </div>
      <Announce lv={lv} />
    </div>
  );
}

/** Ekrana özgü canlı boş durum: sahne + maskotun ağzından başlık/satır + tek birincil düğme. */
export function SceneEmpty({ scene, onAction, cta, vars, compact = false }: { scene: EmptyScene; onAction?: () => void; cta?: Key; vars?: Vars; compact?: boolean }) {
  const t = useT();
  const def = EMPTY_SCENES[scene];
  const k = sceneKeys(scene);
  return (
    <EmptyState
      outfit={def.outfit}
      mood={def.mood}
      acts={def.acts}
      compact={compact}
      title={t(k.title, vars)}
      action={onAction && (
        <button className={`btn btn--primary ${compact ? 'btn--small' : ''}`} data-empty-cta={scene} onClick={onAction}>
          <Plus size={compact ? 16 : 18} aria-hidden /> {t(cta ?? k.cta, vars)}
        </button>
      )}
    >
      {t(k.body, vars)}
    </EmptyState>
  );
}

/** Canlı, tek başına maskot (seçim ekranı, kilit ekranı). */
export function LiveMascot({ who, mood = 'happy', outfit = 'plain', size = 120, quips = false }: { who?: string; mood?: Mood; outfit?: string; size?: number; quips?: boolean }) {
  const m = useMascot();
  const ch = characterOf(who ?? m.who);
  const ref = useRef<HTMLButtonElement>(null);
  const lv = useLively({ who: ch.key, lang: m.lang, name: ch.key === m.who ? m.name : ch.name[m.lang], mood, outfit, quips, priority: 3, ref });
  return (
    <span className="mascot-live">
      <button ref={ref} type="button" className="mascot-live__btn" aria-label={ch.name[m.lang]} {...lv.bind}>
        <Mascot who={ch.key} mood={mood} outfit={lv.outfit} size={size} live={lv.live} uid={lv.uid} lang={m.lang} />
        <Pop lv={lv} />
      </button>
      <Quip lv={lv} float />
      <Announce lv={lv} />
    </span>
  );
}
