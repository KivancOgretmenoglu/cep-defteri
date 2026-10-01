import { useState } from 'react';
import { FlaskConical } from 'lucide-react';
import * as A from '../domain/actions';
import { parseMoney } from '../domain/money';
import { commit, useStore } from '../store/store';
import { Clawd } from '../clawd/Clawd';
import { Chip, FormError, MoneyInput } from '../ui/kit';
import { RestorePicker, startDemo } from './Settings';

const zeroOk = (raw: string) => (raw.trim() === '' || /^0+([.,]0*)?$/.test(raw.trim()) ? 0 : parseMoney(raw));

/** İlk açılış: paranın şu an nerede olduğunu birkaç alanla sorar. */
export function Onboarding() {
  const today = useStore((s) => s.today);
  const body = useStore((s) => s.data.settings.clawd.body);
  const [bank, setBank] = useState('');
  const [cash, setCash] = useState('');
  const [hasInv, setHasInv] = useState(false);
  const [inv, setInv] = useState('');
  const [priorKnown, setPriorKnown] = useState(false);
  const [prior, setPrior] = useState('');
  const [err, setErr] = useState<string | null>(null);

  function start() {
    const b = zeroOk(bank), c = zeroOk(cash), i = zeroOk(inv), p = zeroOk(prior);
    if (b === null || c === null || i === null || p === null) return setErr('Tutarları 1.250,50 gibi yaz.');
    const e = commit((d) => {
      let x = A.addAccount(d, { name: 'Banka', kind: 'bank', openingBalance: b, openingDate: today }).data;
      x = A.addAccount(x, { name: 'Nakit', kind: 'cash', openingBalance: c, openingDate: today }).data;
      if (hasInv) x = A.addAccount(x, { name: 'Yatırım', kind: 'investment', openingBalance: i, openingDate: today, priorContribution: priorKnown ? p : null }).data;
      return x;
    }, undefined, { pulse: true });
    if (e) setErr(e);
  }

  return (
    <div className="onboard">
      <div className="onboard__hero">
        <Clawd mood="curious" outfit="hoodie" body={body} size={168} />
        <div>
          <p className="eyebrow">Cep Defteri</p>
          <h1>Paranın nereden gelip nereye gittiğini birlikte izleyelim.</h1>
          <p className="muted">Ben Clawd. Önce şu an paranın nerede durduğunu söyle; bu tutarlar gelir sayılmaz, başlangıç noktası olur. Hesap adlarını sonra değiştirebilirsin.</p>
        </div>
      </div>
      <section className="card onboard__form" aria-label="Başlangıç bakiyeleri">
        <div className="two-col">
          <MoneyInput label="Banka hesabında" value={bank} onChange={setBank} allowZero autoFocus onEnter={start} />
          <MoneyInput label="Cüzdanda nakit" value={cash} onChange={setCash} allowZero onEnter={start} />
        </div>
        <div className="chip-row">
          <Chip on={hasInv} onClick={() => setHasInv(!hasInv)}>{hasInv ? '✓ ' : ''}Bir yatırım hesabım da var</Chip>
        </div>
        {hasInv && (
          <div className="callout">
            <MoneyInput label="Yatırım hesabının bugünkü değeri" value={inv} onChange={setInv} allowZero />
            <p className="small">Bugüne kadar bu hesaba toplam ne kadar para koyduğunu biliyor musun? Bilmiyorsan sorun değil; kâr/zarar uydurmam.</p>
            <div className="chip-row">
              <Chip on={!priorKnown} onClick={() => setPriorKnown(false)}>Bilmiyorum</Chip>
              <Chip on={priorKnown} onClick={() => setPriorKnown(true)}>Biliyorum</Chip>
            </div>
            {priorKnown && <MoneyInput label="Şimdiye kadar koyduğum net para" value={prior} onChange={setPrior} allowZero />}
          </div>
        )}
        <FormError msg={err} />
        <button className="btn btn--primary btn--block btn--lg" onClick={start}>Başla</button>
      </section>
      <div className="onboard__alt">
        <button className="btn btn--ghost" onClick={() => startDemo(today)}><FlaskConical size={17} /> Önce örnek verilerle dene</button>
        <RestorePicker compact />
      </div>
      <p className="note-line center">Veriler yalnızca bu cihazda saklanır. Hesap eşitlemesi yok; yedek dosyasıyla taşıyabilirsin.</p>
    </div>
  );
}
