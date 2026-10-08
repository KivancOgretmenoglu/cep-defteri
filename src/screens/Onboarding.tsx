import { useEffect, useState } from 'react';
import { FlaskConical, Check } from 'lucide-react';
import type { Lang } from '../domain/types';
import * as A from '../domain/actions';
import { defaultAccountNames } from '../domain/defaults';
import { commit, useStore } from '../store/store';
import { Mascot } from '../mascot/Mascot';
import { LiveMascot, useMascot } from '../mascot/MascotNote';
import { MascotPicker } from '../mascot/MascotPicker';
import { requestAutoGuide } from '../guide/state';
import { characterOf } from '../mascot/characters';
import { appIconSupported, setAppIcon } from '../native/appIcon';
import { Chip, FormError, MoneyInput } from '../ui/kit';
import { parseMoney } from '../i18n/format';
import { getLang, suggestLang } from '../i18n/lang';
import { useT } from '../i18n';
import { RestorePicker, startDemo } from './Settings';

const zeroOk = (raw: string) => (raw.trim() === '' || /^0+([.,]0*)?$/.test(raw.trim()) ? 0 : parseMoney(raw));

/**
 * İlk açılış, adım adım:
 *  1) 'lang'    — Dil / Language
 *  2) 'mascot'  — maskot seçimi; Android'de uygulama simgesinin maskotla değişip değişmeyeceği
 *  3) 'balance' — maskotun kısa selamı + paranın şu an nerede olduğu (başlangıç bakiyeleri)
 * Hesaplar oluşup Özet açılınca spot ışıklı rehber (src/guide) gerçek ekranlarda kendiliğinden başlar.
 */
type Step = 'lang' | 'mascot' | 'balance';

export function Onboarding() {
  const [step, setStep] = useState<Step>('lang');
  if (step === 'lang') return <LangStep onNext={() => setStep('mascot')} />;
  if (step === 'mascot') {
    return (
      <div className="onboard">
        <MascotPicker onDone={() => setStep('balance')} iconQuestion={appIconSupported() ? <IconQuestion /> : undefined} />
      </div>
    );
  }
  return <BalanceStep onBack={() => setStep('mascot')} />;
}

/** 1) Dil seçimi. Telefonun diline göre öneri önceden seçilir; dokununca arayüz hemen o dile geçer. */
function LangStep({ onNext }: { onNext: () => void }) {
  const t = useT();
  const [chosen, setChosen] = useState<Lang>(() => suggestLang());
  const pick = (lang: Lang) => {
    setChosen(lang);
    commit((d) => A.updateSettings(d, { lang }));
  };
  // Öneri, kullanıcı dokunmadan da önizlensin diye açılışta uygulanır.
  useEffect(() => {
    if (getLang() !== chosen) commit((d) => A.updateSettings(d, { lang: chosen }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="onboard">
      <div className="onboard__hero">
        <span className="onboard__trio" aria-hidden>
          <Mascot who="fistik" mood="happy" size={96} idle={false} />
          <Mascot who="karamel" mood="curious" size={96} idle={false} />
          <Mascot who="bilge" mood="calm" size={96} idle={false} />
        </span>
        <div>
          <p className="eyebrow">Cep Defteri</p>
          <h1>Dil / Language</h1>
          <p className="muted">{t('onb.langBody')}</p>
        </div>
      </div>
      <section className="card onboard__form" aria-label="Dil / Language">
        <div className="lang-pick" role="radiogroup" aria-label="Dil / Language">
          {([['tr', 'Türkçe'], ['en', 'English']] as const).map(([v, label]) => (
            <button key={v} type="button" role="radio" aria-checked={chosen === v} lang={v} className={`lang-pick__btn ${chosen === v ? 'is-on' : ''}`} onClick={() => pick(v)}>
              <span>{label}</span>
              {chosen === v && <Check size={20} aria-hidden />}
            </button>
          ))}
        </div>
        <button className="btn btn--primary btn--block btn--lg" onClick={() => { pick(chosen); onNext(); }}>{t('onb.continue')}</button>
      </section>
    </div>
  );
}

/** 2b) Android: uygulama simgesi seçilen maskotla değişsin mi? Yanıt Ayarlar'dan değiştirilebilir. */
function IconQuestion() {
  const t = useT();
  const follows = useStore((s) => s.data.settings.appIconFollows);
  const key = useStore((s) => characterOf(s.data.settings.mascot?.key).key);
  const answer = (v: boolean) => {
    commit((d) => A.updateSettings(d, { appIconFollows: v }));
    void setAppIcon(v ? key : 'fistik');
  };
  return (
    <div className="callout">
      <p><b>{t('icon.q')}</b></p>
      <p className="small muted">{t('icon.hint')}</p>
      <div className="chip-row">
        <Chip on={follows === true} onClick={() => answer(true)}>{follows === true ? '✓ ' : ''}{t('icon.yes')}</Chip>
        <Chip on={follows === false} onClick={() => answer(false)}>{follows === false ? '✓ ' : ''}{t('icon.no')}</Chip>
      </div>
    </div>
  );
}

/** 4) Paranın şu an nerede olduğunu birkaç alanla sorar. */
function BalanceStep({ onBack }: { onBack: () => void }) {
  const t = useT();
  const today = useStore((s) => s.today);
  const m = useMascot();
  const [bank, setBank] = useState('');
  const [cash, setCash] = useState('');
  const [hasInv, setHasInv] = useState(false);
  const [inv, setInv] = useState('');
  const [priorKnown, setPriorKnown] = useState(false);
  const [prior, setPrior] = useState('');
  const [err, setErr] = useState<string | null>(null);

  function start() {
    const b = zeroOk(bank), c = zeroOk(cash), i = zeroOk(inv), p = zeroOk(prior);
    if (b === null || c === null || i === null || p === null) return setErr(t('kit.amountsFormat'));
    // Hesaplar seçilen dilde adlandırılır.
    const names = defaultAccountNames(t.lang);
    const e = commit((d) => {
      let x = A.addAccount(d, { name: names.bank, kind: 'bank', openingBalance: b, openingDate: today }).data;
      x = A.addAccount(x, { name: names.cash, kind: 'cash', openingBalance: c, openingDate: today }).data;
      if (hasInv) x = A.addAccount(x, { name: names.investment, kind: 'investment', openingBalance: i, openingDate: today, priorContribution: priorKnown ? p : null }).data;
      return x;
    }, undefined, { pulse: true });
    if (e) setErr(e);
    else requestAutoGuide();
  }

  return (
    <div className="onboard">
      <div className="onboard__hero">
        <LiveMascot who={m.who} mood="curious" size={150} />
        <div>
          <p className="eyebrow">{t('onb.hello', { name: m.name })}</p>
          <h1>{t('onb.title')}</h1>
          <p className="muted">{t('onb.body')}</p>
        </div>
      </div>
      <section className="card onboard__form" aria-label={t('onb.formLabel')}>
        <div className="two-col">
          <MoneyInput label={t('onb.bank')} value={bank} onChange={setBank} allowZero autoFocus onEnter={start} />
          <MoneyInput label={t('onb.cash')} value={cash} onChange={setCash} allowZero onEnter={start} />
        </div>
        <div className="chip-row">
          <Chip on={hasInv} onClick={() => setHasInv(!hasInv)}>{hasInv ? '✓ ' : ''}{t('onb.hasInv')}</Chip>
        </div>
        {hasInv && (
          <div className="callout">
            <MoneyInput label={t('onb.invValue')} value={inv} onChange={setInv} allowZero />
            <p className="small">{t('onb.priorQ')}</p>
            <div className="chip-row">
              <Chip on={!priorKnown} onClick={() => setPriorKnown(false)}>{t('onb.dontKnow')}</Chip>
              <Chip on={priorKnown} onClick={() => setPriorKnown(true)}>{t('onb.know')}</Chip>
            </div>
            {priorKnown && <MoneyInput label={t('onb.prior')} value={prior} onChange={setPrior} allowZero />}
          </div>
        )}
        <FormError msg={err} />
        <button className="btn btn--primary btn--block btn--lg" onClick={start}>{t('onb.start')}</button>
        <button className="btn btn--ghost btn--block" onClick={onBack}>{t('onb.back')}</button>
      </section>
      <div className="onboard__alt">
        <button className="btn btn--ghost" onClick={() => startDemo(today)}><FlaskConical size={17} /> {t('onb.tryDemo')}</button>
        <RestorePicker compact />
      </div>
      <p className="note-line center">{t('onb.privacy')}</p>
    </div>
  );
}
