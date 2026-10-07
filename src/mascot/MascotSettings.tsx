/** Ayarlar: maskot seçimi, adı, ana ekran kıyafeti, espriler, sınav haftası. */
import { useState } from 'react';
import * as A from '../domain/actions';
import { addDays } from '../domain/dates';
import { commit, useStore } from '../store/store';
import { characterOf, type Lang, type MascotKey } from './characters';
import { Mascot } from './Mascot';
import { MascotGrid } from './MascotPicker';
import { HOME_OUTFITS, OUTFITS } from './render';
import { examActive } from './seasonal';

const T = {
  title: { tr: 'Maskotun', en: 'Your sidekick' },
  name: { tr: 'Adı', en: 'Name' },
  wardrobe: { tr: 'Ana ekranda giydiği', en: 'Home screen outfit' },
  wardrobeHint: {
    tr: 'Diğer ekranlarda işine uygun kıyafeti kendisi giyer. Yılbaşı, bayram ve yaz günlerinde de kendiliğinden özel kıyafet giyer.',
    en: 'On other screens it dresses for the job. On New Year, holidays and summer days it dresses up on its own.',
  },
  quips: { tr: 'Ara sıra espri yapsın', en: 'Crack a joke now and then' },
  quipsHint: { tr: 'Kayıttan sonra kısa, yargılamayan şakalar', en: 'Short, never-judging jokes after you log something' },
  exam: { tr: 'Sınav haftası', en: 'Exam week' },
  examHint: {
    tr: 'Açıkken maskot da ders çalışır ve akşam “bugün kayıt girdin mi?” hatırlatması susar. Ödeme hatırlatmaları devam eder.',
    en: 'While on, your sidekick studies too and the evening “did you log today?” reminder goes quiet. Payment reminders continue.',
  },
  examOn: { tr: 'Sınav haftası açık · bitiş', en: 'Exam week on · ends' },
  examStart: { tr: 'Bir haftalığına aç', en: 'Turn on for a week' },
  examStop: { tr: 'Kapat', en: 'Turn off' },
};

export function MascotSettings({ iconRow, children }: { iconRow?: React.ReactNode; children?: React.ReactNode }) {
  const lang = useStore((s) => s.data.settings.lang ?? 'tr') as Lang;
  const m = useStore((s) => s.data.settings.mascot);
  const quips = useStore((s) => s.data.settings.quips);
  const examUntil = useStore((s) => s.data.settings.examUntil);
  const today = useStore((s) => s.today);
  const ch = characterOf(m?.key);
  const [name, setName] = useState(m?.name ?? '');
  const setMascot = (patch: Partial<typeof m>) => commit((d) => A.updateSettings(d, { mascot: { ...d.settings.mascot, ...patch } }));
  const examOn = examActive(examUntil, today);

  return (
    <section className="card card--span" aria-labelledby="s-mascot">
      <div className="section-head">
        <h2 id="s-mascot">{T.title[lang]}</h2>
      </div>
      <MascotGrid value={ch.key} onPick={(k: MascotKey) => setMascot({ key: k })} lang={lang} size={60} />
      <p className="muted small">“{ch.intro[lang]}”</p>
      <label className="field">
        <span className="field__label">{T.name[lang]}</span>
        <input
          className="input"
          value={name}
          maxLength={20}
          placeholder={ch.name[lang]}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => setMascot({ name: name.trim() ? name.trim().slice(0, 20) : null })}
          onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        />
      </label>
      {iconRow}
      <fieldset className="block">
        <legend>{T.wardrobe[lang]}</legend>
        <div className="wardrobe" role="radiogroup" aria-label={T.wardrobe[lang]}>
          {HOME_OUTFITS.map((o) => (
            <button key={o} role="radio" aria-checked={m?.outfit === o} className={`wardrobe__item ${m?.outfit === o ? 'is-on' : ''}`} onClick={() => setMascot({ outfit: o })}>
              <Mascot who={ch.key} mood="happy" outfit={o} size={64} idle={false} lang={lang} />
              <span>{OUTFITS[o].name[lang]}</span>
            </button>
          ))}
        </div>
        <span className="field__hint">{T.wardrobeHint[lang]}</span>
      </fieldset>
      <label className="check-row">
        <input type="checkbox" checked={quips !== false} onChange={(e) => commit((d) => A.updateSettings(d, { quips: e.target.checked }))} />
        <span>
          {T.quips[lang]}
          <small>{T.quipsHint[lang]}</small>
        </span>
      </label>
      <div className="exam-row">
        <div>
          <b>{T.exam[lang]}</b>
          <p className="muted small">{T.examHint[lang]}</p>
        </div>
        {examOn ? (
          <div className="exam-row__on">
            <label className="field">
              <span className="field__label">{T.examOn[lang]}</span>
              <input className="input" type="date" value={examUntil!} min={today} onChange={(e) => e.target.value && commit((d) => A.updateSettings(d, { examUntil: e.target.value }))} />
            </label>
            <button className="btn btn--ghost" onClick={() => commit((d) => A.updateSettings(d, { examUntil: null }))}>
              {T.examStop[lang]}
            </button>
          </div>
        ) : (
          <button className="btn btn--secondary" onClick={() => commit((d) => A.updateSettings(d, { examUntil: addDays(today, 6) }))}>
            {T.examStart[lang]}
          </button>
        )}
      </div>
      {children}
    </section>
  );
}
