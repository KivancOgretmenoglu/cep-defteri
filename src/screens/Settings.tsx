import { useEffect, useState } from 'react';
import { Download, Plus, ChevronRight, ShieldCheck, FlaskConical, RotateCcw, Trash2, FileSpreadsheet } from 'lucide-react';
import type { Lang, ThemePref } from '../domain/types';
import { emptyData } from '../domain/defaults';
import { valuationsCSV } from '../domain/backup';
import * as A from '../domain/actions';
import { catName, formatMoney, hiddenMoney, intlLocale } from '../i18n/format';
import { useT } from '../i18n';
import { cashBalance, investmentState } from '../domain/ledger';
import { usePrices } from '../store/prices';
import { PriceSettings } from './PriceSettings';
import { commit, replaceData, setMode, showToast, useStore } from '../store/store';
import * as storage from '../store/storage';
import { SectionHead, Segmented } from '../ui/kit';
import { go, openSheet } from '../ui/nav';
import { useData } from '../ui/hooks';
import { CatIcon, ACCOUNT_ICONS } from '../ui/icons';
import { SecuritySettings, NotificationSettings, AutoBackupSettings, WidgetSettings } from '../native/NativeSettings';
import { appIconSupported, setAppIcon } from '../native/appIcon';
import { MascotSettings } from '../mascot/MascotSettings';
import { startGuide } from '../guide/state';
import { characterOf } from '../mascot/characters';
import { FeedbackSettings } from '../ui/Feedback';
import { download, downloadBackup, downloadCSV, RestorePicker, startDemo } from './dataActions';

export function Settings() {
  const t = useT();
  const { data, today } = useData();
  const mode = useStore((s) => s.mode);
  const [catTab, setCatTab] = useState<'expense' | 'income'>('expense');
  const [persisted, setPersisted] = useState<boolean | null>(null);
  const [confirmWipe, setConfirmWipe] = useState('');
  const [canUndoRestore, setCanUndoRestore] = useState(storage.hasPreRestore());
  useEffect(() => {
    storage.requestPersistence().then(setPersisted);
  }, []);
  const lastBackup = data.settings.lastBackupAt;
  const priceBook = usePrices().book;

  return (
    <div className="screen">
      <header className="screen-head"><h1>{t('nav.settings')}</h1></header>
      <div className="settings-grid">
        <section className="card" aria-labelledby="s-acc">
          <SectionHead id="s-acc" title={t('home.accounts')} action={<button className="link" onClick={() => openSheet({ kind: 'account' })}><Plus size={16} /> {t('common.add')}</button>} />
          <ul className="acc-list">
            {data.accounts.map((a) => {
              const I = ACCOUNT_ICONS[a.kind];
              const val = a.kind === 'investment' ? investmentState(data, a.id, priceBook)!.currentValue : cashBalance(data, a.id);
              return (
                <li key={a.id}>
                  <button className="acc-row" onClick={() => openSheet({ kind: 'account', accountId: a.id })}>
                    <I size={18} aria-hidden />
                    <span className="acc-row__name">
                      {a.name}
                      <small>{a.kind === 'bank' ? t('acc.kind.bank') : a.kind === 'cash' ? t('acc.kind.cash') : a.kind === 'person' ? (val > 0 ? `${t('acc.kind.person')} · ${t('people.owesYou')}` : val < 0 ? `${t('acc.kind.person')} · ${t('people.youOweThem')}` : t('acc.kind.person')) : t('acc.kind.investment')}{a.archived ? ` · ${t('common.archived')}` : ''}</small>
                    </span>
                    <span className={a.kind === 'investment' ? 'tone-invest' : ''}>{a.kind === 'person' ? formatMoney(Math.abs(val)) : data.settings.hideTotals ? hiddenMoney() : formatMoney(val)}</span>
                    <ChevronRight size={16} aria-hidden />
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="note-line">{t('set.creditCardNote')}</p>
        </section>

        <section className="card" aria-labelledby="s-cat">
          <SectionHead id="s-cat" title={t('set.categories')} action={<button className="link" onClick={() => openSheet({ kind: 'category', catKind: catTab })}><Plus size={16} /> {t('common.add')}</button>} />
          <Segmented size="sm" label={t('set.catKind')} value={catTab} onChange={setCatTab} options={[{ value: 'expense', label: t('tx.expense') }, { value: 'income', label: t('set.incomeSource') }]} />
          <ul className="cat-list">
            {data.categories.filter((c) => c.kind === catTab).map((c) => (
              <li key={c.id}>
                <button className={`cat-row ${c.archived ? 'is-archived' : ''}`} onClick={() => openSheet({ kind: 'category', categoryId: c.id })}>
                  <span className="cat-row__icon" style={{ '--cat': c.color } as React.CSSProperties}><CatIcon icon={c.icon} size={16} /></span>
                  <span>{catName(c)}{c.archived && <small> · {t('common.archived')}</small>}</span>
                  {c.limit ? <small className="muted">{t('set.limitTag', { amount: formatMoney(c.limit) })}</small> : null}
                </button>
              </li>
            ))}
          </ul>
        </section>

        <MascotSettings iconRow={appIconSupported() ? <IconFollowRow /> : undefined}>
          <TourReplay />
          <details className="details">
            <summary>{t('set.rulesTitle')}</summary>
            <ul className="rules">
              <li><b>{t('set.rule.curious')}</b> {t('set.rule.curiousBody')}</li>
              <li><b>{t('set.rule.thoughtful')}</b> {t('set.rule.thoughtfulBody')}</li>
              <li><b>{t('set.rule.happy')}</b> {t('set.rule.happyBody')}</li>
              <li><b>{t('set.rule.celebrate')}</b> {t('set.rule.celebrateBody')}</li>
              <li><b>{t('set.rule.calm')}</b> {t('set.rule.calmBody')}</li>
              <li>{t('set.rule.note')}</li>
            </ul>
          </details>
        </MascotSettings>

        <section className="card" aria-labelledby="s-look">
          <SectionHead id="s-look" title={t('set.look')} />
          <Segmented<ThemePref> label={t('set.theme')} value={data.settings.theme} onChange={(v) => commit((d) => A.updateSettings(d, { theme: v }))} options={[{ value: 'system', label: t('set.themeSystem') }, { value: 'light', label: t('set.themeLight') }, { value: 'dark', label: t('set.themeDark') }]} />
        </section>

        <section className="card" aria-labelledby="s-lang">
          <SectionHead id="s-lang" title="Dil / Language" />
          <Segmented<Lang> label="Dil / Language" value={data.settings.lang ?? 'tr'} onChange={(v) => commit((d) => A.updateSettings(d, { lang: v }))} options={[{ value: 'tr', label: 'Türkçe' }, { value: 'en', label: 'English' }]} />
          <p className="note-line">{t('set.langNote')}</p>
        </section>

        <section className="card card--span" aria-labelledby="s-data">
          <SectionHead id="s-data" title={t('set.yourData')} />
          <p className="muted">
            <ShieldCheck size={15} aria-hidden /> {t('set.privacyPre')} <b>{t('set.privacyBold')}</b>{t('set.privacyPost')}
            {persisted === true && t('set.persisted')}
            {persisted === false && t('set.notPersisted')}
          </p>
          <p className="muted small">{lastBackup ? t('set.lastBackup', { date: new Date(lastBackup).toLocaleDateString(intlLocale()) }) : t('set.noBackup')}</p>
          <div className="btn-row">
            <button className="btn btn--primary" onClick={downloadBackup}><Download size={17} /> {t('set.downloadBackup')}</button>
            <RestorePicker />
          </div>
          <div className="btn-row">
            <button className="btn btn--ghost" onClick={() => downloadCSV(data)}><FileSpreadsheet size={17} /> {t('set.txCsv')}</button>
            {data.valuations.length > 0 && <button className="btn btn--ghost" onClick={() => download(`cep-defteri-yatirim-degerleri-${today}.csv`, valuationsCSV(data, t.lang), 'text/csv;charset=utf-8')}><FileSpreadsheet size={17} /> {t('set.valCsv')}</button>}
          </div>
          {canUndoRestore && mode === 'real' && (
            <div className="callout callout--quiet">
              <p>{t('set.preRestoreNote')}</p>
              <div className="btn-row">
                <button className="btn btn--ghost" onClick={() => {
                  const prev = storage.takePreRestore();
                  if (prev) {
                    replaceData(prev);
                    storage.dropPreRestore();
                    setCanUndoRestore(false);
                    showToast(t('set.revertedToast'));
                  }
                }}><RotateCcw size={17} /> {t('set.revert')}</button>
                <button className="btn btn--ghost" onClick={() => { storage.dropPreRestore(); setCanUndoRestore(false); }}>{t('set.dropCopy')}</button>
              </div>
            </div>
          )}
        </section>

        <PriceSettings />
        <SecuritySettings />
        <NotificationSettings />
        <AutoBackupSettings />
        <WidgetSettings />

        <section className="card" aria-labelledby="s-demo">
          <SectionHead id="s-demo" title={t('app.demoTitle')} />
          {mode === 'demo' ? (
            <>
              <p className="muted">{t('set.demoOn')}</p>
              <button className="btn btn--primary" onClick={() => { setMode('real'); showToast(t('set.backToReal')); go('home'); }}>{t('app.demoExit')}</button>
            </>
          ) : (
            <>
              <p className="muted">{t('set.demoOff')}</p>
              <button className="btn btn--secondary" onClick={() => void startDemo(today)}><FlaskConical size={17} /> {t('set.tryDemo')}</button>
            </>
          )}
        </section>

        <FeedbackSettings />

        {mode === 'real' && (
          <section className="card" aria-labelledby="s-wipe">
            <SectionHead id="s-wipe" title={t('set.startOver')} />
            <p className="muted">{t('set.wipeBody')}</p>
            <label className="field">
              <span className="field__label">{t('set.wipeConfirmLabel')}</span>
              <input className="input" value={confirmWipe} onChange={(e) => setConfirmWipe(e.target.value)} autoComplete="off" />
            </label>
            <button
              className="btn btn--danger"
              disabled={confirmWipe.trim().toLocaleUpperCase(t.lang === 'en' ? 'en' : 'tr') !== t('set.wipeWord')}
              onClick={() => {
                const fresh = emptyData();
                // Dil seçimi silmeden sonra da korunur.
                replaceData({ ...fresh, settings: { ...fresh.settings, lang: data.settings.lang } }, { stash: true });
                setConfirmWipe('');
                setCanUndoRestore(true);
                showToast(t('set.wiped'));
                go('home');
              }}
            >
              <Trash2 size={17} /> {t('set.wipeAll')}
            </button>
          </section>
        )}
      </div>
      <p className="app-foot">{t('set.foot')}</p>
    </div>
  );
}

/** Android: uygulama simgesi seçili maskotu izlesin mi. Kapatınca varsayılan (kedi) simgeye döner. */
function IconFollowRow() {
  const t = useT();
  const follows = useStore((s) => s.data.settings.appIconFollows === true);
  const key = useStore((s) => characterOf(s.data.settings.mascot?.key).key);
  return (
    <label className="check-row">
      <input
        type="checkbox"
        checked={follows}
        onChange={(e) => {
          const v = e.target.checked;
          commit((d) => A.updateSettings(d, { appIconFollows: v }));
          void setAppIcon(v ? key : 'fistik');
        }}
      />
      <span>{t('icon.setting')}<small>{t('icon.hint')}</small></span>
    </label>
  );
}

/** Ayarlar > Maskot: spot ışıklı rehberi 1. adımdan başlatır (Özet'e geçer, gerçek düğmeleri gösterir). */
function TourReplay() {
  const t = useT();
  return (
    <div className="setting-row">
      <span>
        {t('guide.replay')}
        <small>{t('guide.replayHint')}</small>
      </span>
      <button type="button" className="btn btn--secondary btn--small" onClick={startGuide}>{t('guide.show')}</button>
    </div>
  );
}
