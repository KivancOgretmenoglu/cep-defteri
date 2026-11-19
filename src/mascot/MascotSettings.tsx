/** Ayarlar: maskot seçimi, adı, ana ekran kıyafeti, espriler, sınav haftası. */
import { useState } from 'react';
import * as A from '../domain/actions';
import { addDays, daysInMonth } from '../domain/dates';
import { useT } from '../i18n';
import { monthName as monthNameOf } from '../i18n/format';
import { commit, useStore } from '../store/store';
import { characterOf, type Lang, type MascotKey } from './characters';
import { Mascot } from './Mascot';
import { MascotGrid, mascotWith } from './MascotPicker';
import { OUTFITS, wardrobeFor } from './render';
import { examActive } from './seasonal';

const T = {
  title: { tr: 'Maskotun', en: 'Your sidekick' },
  name: { tr: 'Adı', en: 'Name' },
  wardrobe: { tr: 'Ana ekranda giydiği', en: 'Home screen outfit' },
  wardrobeHint: {
    tr: 'Seçtiğin kıyafet ana ekranda ve widget’ta görünür; toplamlar gizliyken üstüne ajan gözlüğü ve fötrü takar. “Sade” seçiliyken gece pijama, yılbaşı, bayram ve yaz günlerinde özel kıyafet giyer. Diğer ekranlarda işine uygun kıyafeti kendisi giyer.',
    en: 'Your pick shows on the home screen and the widget; with totals hidden it adds spy shades and a fedora on top. With “Plain” it wears pajamas at night and dresses up on New Year, holidays and summer days. On other screens it dresses for the job.',
  },
  quips: { tr: 'Ara sıra espri yapsın', en: 'Crack a joke now and then' },
  quipsHint: { tr: 'Kayıttan sonra kısa, yargılamayan şakalar', en: 'Short, never-judging jokes after you log something' },
  cameos: { tr: 'Misafir maskotlar', en: 'Guest mascots' },
  cameosHint: { tr: 'Arada bir diğer maskotlar köşeden uğrar, küçük bir şey yapıp gider', en: 'Once in a while another mascot drops by a corner, does something small and leaves' },
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
  const cameos = useStore((s) => s.data.settings.cameos);
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
      <MascotGrid value={ch.key} onPick={(k: MascotKey) => commit((d) => A.updateSettings(d, { mascot: mascotWith(d.settings.mascot, k) }))} lang={lang} size={60} />
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
          {wardrobeFor(ch.key).map((o) => (
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
      <label className="check-row">
        <input type="checkbox" checked={cameos !== false} onChange={(e) => commit((d) => A.updateSettings(d, { cameos: e.target.checked }))} />
        <span>
          {T.cameos[lang]}
          <small>{T.cameosHint[lang]}</small>
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
      <BirthdayRow />
      {children}
    </section>
  );
}

/** İsteğe bağlı doğum günü (ay + gün; yıl sorulmaz). O gün maskot parti şapkasıyla kutlar. */
function BirthdayRow() {
  const t = useT();
  const bday = useStore((s) => s.data.settings.birthday ?? null);
  const [m, d] = bday ? bday.split('-') : ['', ''];
  const monthNames = Array.from({ length: 12 }, (_, i) => monthNameOf(`2024-${String(i + 1).padStart(2, '0')}`));
  const days = m ? daysInMonth(`2024-${m}`) : 31;
  const set = (mm: string, dd: string) => {
    if (!mm) return commit((x) => A.updateSettings(x, { birthday: null }));
    const max = daysInMonth(`2024-${mm}`);
    const day = String(Math.min(Number(dd || '1'), max)).padStart(2, '0');
    commit((x) => A.updateSettings(x, { birthday: `${mm}-${day}` }));
  };
  return (
    <div className="bday-row">
      <div>
        <b>🎂 {t('party.settingsLabel')}</b>
        <p className="muted small">{t('party.settingsHint')}</p>
      </div>
      <div className="bday-row__fields">
        <select className="input input--small" aria-label={t('party.month')} value={m} onChange={(e) => set(e.target.value, d)}>
          <option value="">{t('party.none')}</option>
          {monthNames.map((n, i) => <option key={n} value={String(i + 1).padStart(2, '0')}>{n}</option>)}
        </select>
        <select className="input input--small" aria-label={t('party.day')} value={d} disabled={!m} onChange={(e) => set(m, e.target.value)}>
          {Array.from({ length: days }, (_, i) => String(i + 1).padStart(2, '0')).map((x) => <option key={x} value={x}>{Number(x)}</option>)}
        </select>
      </div>
    </div>
  );
}
