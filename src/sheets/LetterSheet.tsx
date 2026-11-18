/**
 * Ayın ilk günlerinde maskottan mektup: biten ayın kısa, sıcak özeti (domain/letter.ts) ve ay karnesine geçiş.
 * Ana ekrandaki zarf, karne görülene kadar durur (reportCardSeen; karneyi kapatınca işaretlenir).
 */
import { useMemo } from 'react';
import { ScrollText } from 'lucide-react';
import { monthLetter } from '../domain/letter';
import { useT } from '../i18n';
import { translator } from '../i18n/core';
import { monthLabel } from '../i18n/format';
import { Mascot } from '../mascot/Mascot';
import { useMascot } from '../mascot/MascotNote';
import { useData } from '../ui/hooks';
import { Sheet } from '../ui/kit';
import { closeSheet, openSheet } from '../ui/nav';

export function LetterSheet({ month }: { month: string }) {
  const t = useT();
  const { data, today } = useData();
  const m = useMascot();
  const lang = m.lang === 'en' ? 'en' : 'tr';
  const letter = useMemo(() => monthLetter(data, month, today, translator(lang), lang), [data, month, today, lang]);
  return (
    <Sheet
      title={t('letter.title', { month: monthLabel(month) })}
      onClose={closeSheet}
      footer={
        <button className="btn btn--primary btn--block" onClick={() => { closeSheet(); openSheet({ kind: 'reportCard', month }); }}>
          <ScrollText size={17} aria-hidden /> {t('letter.openCard')}
        </button>
      }
    >
      <article className="letter">
        {letter.star && <span className="letter__star" aria-hidden>★</span>}
        {letter.lines.map((l, i) => <p key={i}>{l}</p>)}
        <p className="letter__sign">{t('letter.sign', { name: m.name })}</p>
        <Mascot who={m.who} mood={letter.star ? 'celebrate' : 'happy'} outfit="planner" size={72} lang={m.lang} name={m.name} className="letter__mascot" />
      </article>
    </Sheet>
  );
}
