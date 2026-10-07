/**
 * Maskot seçimi: ilk açılışta ve Ayarlar'da. Seçim anında uygulanır (tema hemen değişir).
 * Seçilen karakter kendini bir cümleyle tanıtır; dokununca hareket eder.
 */
import { useState } from 'react';
import { Check } from 'lucide-react';
import * as A from '../domain/actions';
import { commit, useStore } from '../store/store';
import { CHARACTERS, MASCOT_KEYS, characterOf, type Lang, type MascotKey } from './characters';
import { Mascot } from './Mascot';
import { LiveMascot } from './MascotNote';
import { haptic } from '../native/haptics';

const T = {
  title: { tr: 'Yol arkadaşını seç', en: 'Pick your sidekick' },
  sub: { tr: 'Her birinin kendi kişiliği ve renkleri var. Sonra Ayarlar’dan değiştirebilirsin.', en: 'Each has its own personality and colors. You can change it later in Settings.' },
  nameLabel: { tr: 'İstersen ona bir isim ver', en: 'Give it a name if you like' },
  continue: { tr: 'Devam', en: 'Continue' },
};

export function MascotGrid({ value, onPick, lang, size = 72 }: { value: MascotKey; onPick: (k: MascotKey) => void; lang: Lang; size?: number }) {
  return (
    <div className="mascot-grid" role="radiogroup" aria-label={T.title[lang]}>
      {MASCOT_KEYS.map((k) => {
        const c = CHARACTERS[k];
        const on = value === k;
        return (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={on}
            className={`mascot-card ${on ? 'is-on' : ''}`}
            style={{ '--card': c.palette.soft, '--card-accent': c.palette.accent } as React.CSSProperties}
            onClick={() => { haptic('light'); onPick(k); }}
          >
            {on && <Check size={16} className="mascot-card__check" aria-hidden />}
            <Mascot who={k} mood={on ? 'happy' : 'calm'} size={size} idle={false} lang={lang} />
            <span className="mascot-card__name">{c.name[lang]}</span>
            <span className="mascot-card__sp">{c.species[lang]}</span>
          </button>
        );
      })}
    </div>
  );
}

/** İlk açılış adımı. `iconStep` Android'de simge sorusunu gösterir. */
export function MascotPicker({ onDone, iconQuestion }: { onDone: () => void; iconQuestion?: React.ReactNode }) {
  const lang = useStore((s) => s.data.settings.lang ?? 'tr') as Lang;
  const current = useStore((s) => s.data.settings.mascot);
  const ch = characterOf(current?.key);
  const [name, setName] = useState(current?.name ?? '');
  const pick = (k: MascotKey) => commit((d) => A.updateSettings(d, { mascot: { ...d.settings.mascot, key: k } }));
  const finish = () => {
    commit((d) => A.updateSettings(d, { mascot: { ...d.settings.mascot, name: name.trim() ? name.trim().slice(0, 20) : null } }));
    onDone();
  };
  return (
    <div className="mascot-picker">
      <h1>{T.title[lang]}</h1>
      <p className="muted">{T.sub[lang]}</p>
      <MascotGrid value={ch.key} onPick={pick} lang={lang} />
      <section className="card mascot-intro" style={{ '--card': ch.palette.soft } as React.CSSProperties}>
        <LiveMascot key={ch.key} who={ch.key} mood="happy" size={110} />
        <div>
          <p className="mascot-intro__name">
            {ch.name[lang]} <small>· {ch.species[lang]}</small>
          </p>
          <p className="mascot-intro__say">“{ch.intro[lang]}”</p>
          <p className="muted small">{ch.traits[lang]}</p>
        </div>
      </section>
      <label className="field">
        <span className="field__label">{T.nameLabel[lang]}</span>
        <input className="input" value={name} maxLength={20} placeholder={ch.name[lang]} onChange={(e) => setName(e.target.value)} />
      </label>
      {iconQuestion}
      <button className="btn btn--primary btn--block btn--lg" onClick={finish}>
        {T.continue[lang]}
      </button>
    </div>
  );
}
