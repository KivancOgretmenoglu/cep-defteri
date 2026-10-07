import { useState } from 'react';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { LiveMascot, useMascot } from './MascotNote';
import { TOUR_LINES, TOUR_MOODS, tourText } from './tourLines';
import './mascot.css';

const N = 4;

/** Kartlardaki küçük, dokunulmaz maketler (gerçek arayüzün sadeleştirilmiş çizimi). */
function Mock({ i, lang }: { i: number; lang: 'tr' | 'en' }) {
  const x = (k: string) => tourText(k, lang);
  if (i === 1) {
    return (
      <div className="tour-mock" aria-hidden>
        <span className="tour-mock__chip">₺ 85</span>
        <span className="tour-mock__arrow">›</span>
        <span className="tour-mock__chip">{x('category')}</span>
        <span className="tour-mock__arrow">›</span>
        <span className="tour-mock__chip tour-mock__chip--on">{x('save')}</span>
        <span className="tour-mock__plus"><Plus size={22} /></span>
      </div>
    );
  }
  if (i === 2) {
    return (
      <div className="tour-mock" aria-hidden>
        <span className="tour-mock__chip">{x('category')} 1</span>
        <span className="tour-mock__chip">{x('category')} 2</span>
        <span className="tour-mock__chip tour-mock__chip--on">{x('newCat')}</span>
      </div>
    );
  }
  if (i === 3) {
    return (
      <div className="tour-mock" aria-hidden>
        <span className="tour-mock__chip tour-mock__chip--link">{x('why')}</span>
      </div>
    );
  }
  return null;
}

/** İlk açılış / Ayarlar rehberi: seçili maskotun ağzından 4 kısa kart. Her kartta "Geç" var. */
export function Tour({ onDone, last }: { onDone: () => void; last?: string }) {
  const m = useMascot();
  const [i, setI] = useState(0);
  const x = (k: string) => tourText(k, m.lang);
  const line = TOUR_LINES[m.who][i][m.lang];
  const isLast = i === N - 1;
  return (
    <div className="tour" role="dialog" aria-modal="true" aria-label={x('label')}>
      <div className="tour__top">
        <p className="eyebrow">{m.name} · {x('step').replace('{n}', String(i + 1)).replace('{total}', String(N))}</p>
        <button type="button" className="btn btn--ghost" onClick={onDone}>{x('skip')}</button>
      </div>
      <div className="tour__stage" key={i}>
        <LiveMascot who={m.who} mood={TOUR_MOODS[i]} size={140} />
        <p className="tour__bubble" aria-live="polite">{line}</p>
        <Mock i={i} lang={m.lang} />
      </div>
      <div className="tour__dots" role="group" aria-label={x('label')}>
        {Array.from({ length: N }, (_, k) => (
          <button key={k} type="button" className={`tour__dot ${k === i ? 'is-on' : ''}`} aria-label={x('step').replace('{n}', String(k + 1)).replace('{total}', String(N))} aria-current={k === i} onClick={() => setI(k)} />
        ))}
      </div>
      <div className="tour__nav">
        {i > 0 && <button type="button" className="btn btn--ghost" onClick={() => setI(i - 1)}><ChevronLeft size={18} aria-hidden /> {x('back')}</button>}
        <button type="button" className="btn btn--primary btn--lg tour__next" onClick={() => (isLast ? onDone() : setI(i + 1))}>
          {isLast ? (last ?? x('close')) : x('next')} {!isLast && <ChevronRight size={18} aria-hidden />}
        </button>
      </div>
    </div>
  );
}
