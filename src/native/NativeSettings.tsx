/**
 * Ayarlar ekranı kartları: Güvenlik (uygulama kilidi), Bildirimler, Otomatik yedek, Ana ekran aracı (yalnız APK).
 * Ayarlar.tsx bunları mevcut kartların arasına yerleştirir.
 */
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Bell, Fingerprint, HardDriveDownload, LayoutGrid, Lock, RotateCcw } from 'lucide-react';
import { SectionHead, Segmented } from '../ui/kit';
import { isNative } from '../platform';
import { getDevice, setDevice, useDevice, type DevicePrefs } from '../store/device';
import { getState, replaceData, setMode, showToast, useStore } from '../store/store';
import { go } from '../ui/nav';
import { parseBackup } from '../domain/backup';
import type { Data } from '../domain/types';
import { hashPin, isValidPin } from '../lock/pin';
import { checkCurrentPin, lockNow } from '../lock/lockState';
import { biometricInfo, verifyBiometric, type BiometricInfo } from '../lock/biometric';
import { computeSchedule } from './schedule';
import { loadSent, notificationPermission, requestNotificationPermission, type NotifPermission } from './notifications';
import { listAutoBackups, requestStoragePermission, runAutoBackup, type AutoBackupEntry } from './autoBackup';
import { reminderTexts, useBackupReminder } from './BackupReminder';
import { intlLocale } from '../i18n/format';
import { t as tNow, useT } from '../i18n';
import { setWidgetPrefs, useWidgetPrefs } from './widgetPrefs';
import './native.css';

type OnOff = 'on' | 'off';
const onOff = () => [
  { value: 'off' as OnOff, label: tNow('ns.off') },
  { value: 'on' as OnOff, label: tNow('ns.on') },
];

function Row({ title, hint, children }: { title: ReactNode; hint?: ReactNode; children: ReactNode }) {
  return (
    <div className="nset-row">
      <div className="nset-row__text">
        <span className="nset-row__title">{title}</span>
        {hint && <span className="nset-row__hint">{hint}</span>}
      </div>
      <div className="nset-row__ctl">{children}</div>
    </div>
  );
}

const fmtTime = (ms: number) => new Date(ms).toLocaleString(intlLocale(), { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });

// ───────────────────────── Güvenlik ─────────────────────────

type PinMode = null | 'set' | 'change' | 'disable';

export function SecuritySettings() {
  const t = useT();
  const ONOFF = onOff();
  const lock = useDevice((p) => p.lock);
  const hasPin = !!lock.pinHash;
  const [mode, setPinMode] = useState<PinMode>(null);
  const [bio, setBio] = useState<BiometricInfo>({ available: false, label: '' });
  useEffect(() => {
    if (isNative()) biometricInfo().then(setBio);
  }, []);

  async function toggleBio(v: OnOff) {
    if (v === 'off') return setDevice((p) => ({ ...p, lock: { ...p.lock, biometric: false } }));
    if (await verifyBiometric(t('ns.bioEnable', { label: bio.label }))) {
      setDevice((p) => ({ ...p, lock: { ...p.lock, biometric: true } }));
      showToast(t('ns.bioOn', { label: bio.label }));
    }
  }

  return (
    <section className="card" aria-labelledby="s-sec">
      <SectionHead id="s-sec" title={t('ns.lockTitle')} />
      {!hasPin && mode !== 'set' && (
        <>
          <p className="muted">
            {t('ns.lockIntroPre')} <b>{t('ns.privacyCurtain')}</b>{t('ns.lockIntroPost')}
          </p>
          <button className="btn btn--secondary" onClick={() => setPinMode('set')}>
            <Lock size={17} /> {t('ns.setPin')}
          </button>
        </>
      )}
      {hasPin && !mode && (
        <>
          <p className="muted">{t('ns.lockOn')}</p>
          <Row title={t('ns.relock')}>
            <Segmented
              size="sm"
              label={t('ns.relockLabel')}
              value={String(lock.relockAfterSec)}
              onChange={(v) => setDevice((p) => ({ ...p, lock: { ...p.lock, relockAfterSec: Number(v) } }))}
              options={[
                { value: '0', label: t('ns.now') },
                { value: '60', label: t('ns.min', { n: 1 }) },
                { value: '300', label: t('ns.min', { n: 5 }) },
                { value: '900', label: t('ns.min', { n: 15 }) },
              ]}
            />
          </Row>
          {isNative() && bio.available && (
            <Row title={<><Fingerprint size={16} aria-hidden /> {t('lock.bioOpen', { label: bio.label })}</>} hint={t('ns.pinStillWorks')}>
              <Segmented<OnOff> size="sm" label={t('lock.bioOpen', { label: bio.label })} value={lock.biometric ? 'on' : 'off'} onChange={toggleBio} options={ONOFF} />
            </Row>
          )}
          <div className="btn-row">
            <button className="btn btn--secondary" onClick={lockNow}>
              <Lock size={17} /> {t('ns.lockNow')}
            </button>
            <button className="btn btn--ghost" onClick={() => setPinMode('change')}>{t('ns.changePin')}</button>
            <button className="btn btn--ghost" onClick={() => setPinMode('disable')}>{t('ns.disableLock')}</button>
          </div>
        </>
      )}
      {mode && <PinForm mode={mode} onDone={() => setPinMode(null)} />}
    </section>
  );
}

function PinForm({ mode, onDone }: { mode: Exclude<PinMode, null>; onDone: () => void }) {
  const t = useT();
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const [again, setAgain] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const needCur = mode !== 'set';
  const needNew = mode !== 'disable';

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (needNew) {
      if (!isValidPin(next)) return setErr(t('ns.pinDigits'));
      if (next !== again) return setErr(t('ns.pinMismatch'));
    }
    setBusy(true);
    try {
      if (needCur) {
        const r = await checkCurrentPin(cur);
        if (!r.ok) return setErr(r.waitMs > 0 ? t('ns.pinWrongWait', { s: Math.ceil(r.waitMs / 1000) }) : t('ns.curPinWrong'));
      }
      if (mode === 'disable') {
        setDevice((p) => ({ ...p, lock: { ...p.lock, pinHash: null, salt: null, biometric: false, failed: 0, blockedUntil: null } }));
        showToast(t('ns.lockDisabled'));
      } else {
        const h = await hashPin(next);
        setDevice((p) => ({ ...p, lock: { ...p.lock, ...h, failed: 0, blockedUntil: null } }));
        showToast(mode === 'set' ? t('ns.pinSet') : t('ns.pinChanged'));
      }
      onDone();
    } finally {
      setBusy(false);
    }
  }

  const pinInput = (label: string, v: string, set: (s: string) => void, auto?: boolean) => (
    <label className="field">
      <span className="field__label">{label}</span>
      <input
        className="input nset-pin"
        type="password"
        inputMode="numeric"
        autoComplete="off"
        maxLength={6}
        value={v}
        autoFocus={auto}
        onChange={(e) => set(e.target.value.replace(/\D/g, '').slice(0, 6))}
      />
    </label>
  );

  return (
    <form className="nset-form" onSubmit={submit}>
      {needCur && pinInput(t('ns.curPin'), cur, setCur, true)}
      {needNew && pinInput(mode === 'set' ? t('ns.newPinDigits') : t('ns.newPin'), next, setNext, !needCur)}
      {needNew && pinInput(t('ns.newPinAgain'), again, setAgain)}
      {mode === 'set' && <p className="muted small">{t('ns.pinWarn')}</p>}
      {err && <p className="form-error" role="alert">{err}</p>}
      <div className="btn-row">
        <button type="button" className="btn btn--ghost" onClick={onDone}>{t('common.cancel')}</button>
        <button type="submit" className={`btn ${mode === 'disable' ? 'btn--danger' : 'btn--primary'}`} disabled={busy}>
          {mode === 'set' ? t('ns.savePin') : mode === 'change' ? t('ns.change') : t('ns.disableLock')}
        </button>
      </div>
    </form>
  );
}

// ───────────────────────── Bildirimler ─────────────────────────

const setNotif = (patch: Partial<DevicePrefs['notifications']>) => setDevice((p) => ({ ...p, notifications: { ...p.notifications, ...patch } }));

export function NotificationSettings() {
  const t = useT();
  const ONOFF = onOff();
  const n = useDevice((p) => p.notifications);
  const data = useStore((s) => s.data);
  const today = useStore((s) => s.today);
  const mode = useStore((s) => s.mode);
  const [perm, setPerm] = useState<NotifPermission>('unsupported');
  useEffect(() => {
    notificationPermission().then(setPerm);
  }, [n.enabled]);
  const count = useMemo(() => (n.enabled ? computeSchedule(data, today, n, new Date(), loadSent()).length : 0), [data, today, n]);

  if (!isNative()) {
    return (
      <section className="card" aria-labelledby="s-notif">
        <SectionHead id="s-notif" title={t('ns.notifTitle')} />
        <p className="muted">
          {t('ns.webOnlyPre')} <b>{t('ns.androidApp')}</b>{t('ns.webOnlyPost')}
        </p>
      </section>
    );
  }

  async function toggle(v: OnOff) {
    if (v === 'off') return setNotif({ enabled: false });
    const ok = await requestNotificationPermission();
    setPerm(ok ? 'granted' : 'denied');
    if (!ok) {
      showToast(t('ns.permDenied'), { tone: 'error', ms: 6000 });
      return;
    }
    setNotif({ enabled: true });
    showToast(t('ns.notifOn'));
  }

  return (
    <section className="card" aria-labelledby="s-notif">
      <SectionHead id="s-notif" title={t('ns.notifTitle')} />
      <Row title={<><Bell size={16} aria-hidden /> {t('ns.reminders')}</>}>
        <Segmented<OnOff> size="sm" label={t('ns.notifTitle')} value={n.enabled ? 'on' : 'off'} onChange={toggle} options={ONOFF} />
      </Row>
      {n.enabled && perm === 'denied' && (
        <p className="form-error" role="alert">{t('ns.permOff')}</p>
      )}
      {n.enabled && (
        <>
          <Row title={t('home.upcomingPayments')} hint={t('ns.payHint')}>
            <Segmented<OnOff> size="sm" label={t('home.upcomingPayments')} value={n.payments ? 'on' : 'off'} onChange={(v) => setNotif({ payments: v === 'on' })} options={ONOFF} />
          </Row>
          <Row title={t('plan.kind.income')} hint={t('ns.incHint')}>
            <Segmented<OnOff> size="sm" label={t('plan.kind.income')} value={n.income ? 'on' : 'off'} onChange={(v) => setNotif({ income: v === 'on' })} options={ONOFF} />
          </Row>
          <Row title={t('ns.evening')} hint={t('ns.eveningHint')}>
            <Segmented<OnOff> size="sm" label={t('ns.evening')} value={n.dailyReminder ? 'on' : 'off'} onChange={(v) => setNotif({ dailyReminder: v === 'on' })} options={ONOFF} />
          </Row>
          {n.dailyReminder && (
            <Row title={t('ns.reminderHour')}>
              <select className="input input--small nset-select" value={n.reminderHour} onChange={(e) => setNotif({ reminderHour: Number(e.target.value) })} aria-label={t('ns.reminderHour')}>
                {[17, 18, 19, 20, 21, 22, 23].map((h) => (
                  <option key={h} value={h}>{`${h}:00`}</option>
                ))}
              </select>
            </Row>
          )}
          <p className="muted small">
            {mode === 'demo' ? t('ns.demoNoNotif') : count > 0 ? t('ns.planned', { n: count }) : t('ns.nothingPlanned')}
          </p>
        </>
      )}
    </section>
  );
}

// ───────────────────────── Otomatik yedek ─────────────────────────

export function AutoBackupSettings() {
  const t = useT();
  const ONOFF = onOff();
  const ab = useDevice((p) => p.autoBackup);
  const mode = useStore((s) => s.mode);
  const native = isNative();
  const [list, setList] = useState<AutoBackupEntry[]>([]);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    listAutoBackups().then(setList);
  }, [ab.lastAt]);
  // Ana ekrandaki hatırlatmanın aynısı ("Sonra" denmiş olsa da burada görünür).
  const reminder = useBackupReminder(true);
  const rem = reminder && reminderTexts(reminder, t);

  async function backupNow() {
    setBusy(true);
    if (native && !(await requestStoragePermission())) {
      setBusy(false);
      return showToast(t('ns.filePermDenied'), { tone: 'error' });
    }
    const ok = await runAutoBackup(getState().data, getState().mode, { force: true });
    setBusy(false);
    showToast(ok ? t('ns.backedUp') : getDevice().autoBackup.lastError ?? t('ns.backupFailed'), { tone: ok ? 'ok' : 'error' });
  }

  return (
    <section className="card" aria-labelledby="s-auto">
      <SectionHead id="s-auto" title={t('ns.autoTitle')} />
      <Row title={<><HardDriveDownload size={16} aria-hidden /> {t('ns.daily')}</>}>
        <Segmented<OnOff> size="sm" label={t('ns.autoTitle')} value={ab.enabled ? 'on' : 'off'} onChange={(v) => setDevice((p) => ({ ...p, autoBackup: { ...p.autoBackup, enabled: v === 'on' } }))} options={ONOFF} />
      </Row>
      {native ? (
        <p className="muted small">
          {t('ns.nativeInfo1')} <b>{t('ns.docsFolder')}</b> {t('ns.nativeInfo2')} <b>{t('set.restore')}</b> {t('ns.nativeInfo3')}
        </p>
      ) : (
        <p className="muted small">
          {t('ns.webInfo')} <b>{t('ns.downloadBackup')}</b> {t('ns.webInfo2')}
        </p>
      )}
      {mode === 'demo' && <p className="muted small">{t('ns.demoNoBackup')}</p>}
      {ab.lastAt && (
        <p className="muted small">
          {t('ns.lastAuto')} {fmtTime(ab.lastAt)}
          {ab.lastPath && <> · {ab.lastPath}</>}
        </p>
      )}
      {ab.lastError && <p className="form-error" role="alert">{ab.lastError}</p>}
      {rem && (
        <div className="callout callout--quiet">
          <b>{rem.title}</b> {rem.why}{rem.last && <> {rem.last}</>} {t('ns.nudgeHowPre')}<b>{t('ns.downloadBackup')}</b>{t('ns.nudgeHowPost')}
        </div>
      )}
      {mode === 'real' && (
        <div className="btn-row">
          <button className="btn btn--ghost" onClick={backupNow} disabled={busy}>
            <HardDriveDownload size={17} /> {t('ns.backupNow')}
          </button>
        </div>
      )}
      {list.length > 0 && <AutoRestoreList list={list} />}
    </section>
  );
}

function AutoRestoreList({ list }: { list: AutoBackupEntry[] }) {
  const t = useT();
  const mode = useStore((s) => s.mode);
  const [pending, setPending] = useState<{ entry: AutoBackupEntry; data: Data } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function pick(e: AutoBackupEntry) {
    setErr(null);
    try {
      const r = parseBackup(await e.read(), t.lang);
      if (!r.ok) return setErr(r.error);
      setPending({ entry: e, data: r.data });
    } catch {
      setErr(t('ns.readFailed'));
    }
  }
  function apply() {
    if (!pending) return;
    if (mode === 'demo') setMode('real');
    replaceData(pending.data, { stash: true });
    setPending(null);
    showToast(t('ns.autoRestored'), { ms: 5000 });
    go('home');
  }

  return (
    <details className="details">
      <summary>{t('ns.autoList', { n: list.length })}</summary>
      <ul className="nset-list">
        {list.map((e) => (
          <li key={e.name}>
            <span>
              <b>{new Date(e.day + 'T12:00:00').toLocaleDateString(intlLocale(), { day: 'numeric', month: 'long', weekday: 'long' })}</b>
              {e.at && <small className="muted"> · {new Date(e.at).toLocaleTimeString(intlLocale(), { hour: '2-digit', minute: '2-digit' })}</small>}
            </span>
            <button className="btn btn--ghost btn--small" onClick={() => pick(e)}>
              <RotateCcw size={15} /> {t('set.restoreConfirm')}
            </button>
          </li>
        ))}
      </ul>
      {pending && (
        <div className="callout">
          <p>
            {t('set.restoreCounts', { a: pending.data.accounts.length, tx: pending.data.txs.length, p: pending.data.plans.length, v: pending.data.valuations.length })}
          </p>
          <p>{mode === 'demo' ? t('set.restoreReplaceReal') : t('set.restoreReplaceCurrent')}</p>
          <div className="btn-row">
            <button className="btn btn--ghost" onClick={() => setPending(null)}>{t('common.cancel')}</button>
            <button className="btn btn--primary" onClick={apply}>{t('set.restoreConfirm')}</button>
          </div>
        </div>
      )}
      {err && <p className="form-error" role="alert">{err}</p>}
    </details>
  );
}

// ───────────────────────── Ana ekran aracı (yalnız APK) ─────────────────────────

const WIDGET_TXT = {
  tr: {
    title: 'Ana ekran aracı',
    anim: 'Widget animasyonu',
    animHint: 'Büyük araçta (4×3 ve üstü) maskot kendi sahnesinde kısa bir döngü oynar. Kapalıyken sabit durur.',
    info: 'Araç boyuna göre değişir: küçükte tutar, ortada Gider / Gelir düğmeleri, büyükte bugünkü harcama ve sık kayıtların tek dokunuşla eklendiği çipler. Çiplerle eklenenler uygulamayı açınca kaydedilir.',
  },
  en: {
    title: 'Home screen widget',
    anim: 'Widget animation',
    animHint: 'On the large widget (4×3 and up) your mascot plays a short loop in its own scene. When off, it stays still.',
    info: 'The widget adapts to its size: the amount when small, Expense / Income buttons when medium, and today’s spending plus one-tap chips for frequent entries when large. Chip entries are saved the next time you open the app.',
  },
} as const;

export function WidgetSettings() {
  const t = useT();
  const ONOFF = onOff();
  const w = useWidgetPrefs();
  if (!isNative()) return null;
  const s = WIDGET_TXT[t.lang === 'en' ? 'en' : 'tr'];
  return (
    <section className="card" aria-labelledby="s-widget">
      <SectionHead id="s-widget" title={s.title} />
      <Row title={<><LayoutGrid size={16} aria-hidden /> {s.anim}</>} hint={s.animHint}>
        <Segmented<OnOff> size="sm" label={s.anim} value={w.animate ? 'on' : 'off'} onChange={(v) => setWidgetPrefs({ animate: v === 'on' })} options={ONOFF} />
      </Row>
      <p className="muted small">{s.info}</p>
    </section>
  );
}
