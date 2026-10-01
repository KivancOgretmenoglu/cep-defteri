/**
 * Ayarlar ekranı kartları: Güvenlik (uygulama kilidi), Bildirimler, Otomatik yedek.
 * Ayarlar.tsx bunları mevcut kartların arasına yerleştirir.
 */
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Bell, Fingerprint, HardDriveDownload, Lock, RotateCcw } from 'lucide-react';
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
import { backupNudgeDue, NUDGE_DAYS } from './backupPlan';
import './native.css';

type OnOff = 'on' | 'off';
const ONOFF = [
  { value: 'off' as OnOff, label: 'Kapalı' },
  { value: 'on' as OnOff, label: 'Açık' },
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

const fmtTime = (ms: number) => new Date(ms).toLocaleString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });

// ───────────────────────── Güvenlik ─────────────────────────

type PinMode = null | 'set' | 'change' | 'disable';

export function SecuritySettings() {
  const lock = useDevice((p) => p.lock);
  const hasPin = !!lock.pinHash;
  const [mode, setPinMode] = useState<PinMode>(null);
  const [bio, setBio] = useState<BiometricInfo>({ available: false, label: '' });
  useEffect(() => {
    if (isNative()) biometricInfo().then(setBio);
  }, []);

  async function toggleBio(v: OnOff) {
    if (v === 'off') return setDevice((p) => ({ ...p, lock: { ...p.lock, biometric: false } }));
    if (await verifyBiometric(`${bio.label} ile açmayı etkinleştir`)) {
      setDevice((p) => ({ ...p, lock: { ...p.lock, biometric: true } }));
      showToast(`${bio.label} ile açma açık`);
    }
  }

  return (
    <section className="card" aria-labelledby="s-sec">
      <SectionHead id="s-sec" title="Uygulama kilidi" />
      {!hasPin && mode !== 'set' && (
        <>
          <p className="muted">
            Uygulama açılırken 4–6 haneli bir PIN sorulsun. Bu bir <b>gizlilik perdesidir</b>: yanındakiler kayıtlarını görmesin diye. Kayıtlar şifrelenmez; PIN’i unutursan kilidi kaldırmak için verileri silip yedekten dönmen gerekir.
          </p>
          <button className="btn btn--secondary" onClick={() => setPinMode('set')}>
            <Lock size={17} /> PIN belirle
          </button>
        </>
      )}
      {hasPin && !mode && (
        <>
          <p className="muted">Uygulama kilidi etkin. PIN bu cihazda yalnız özet olarak tutulur ve yedek dosyasına girmez.</p>
          <Row title="Arka planda kalınca kilitle">
            <Segmented
              size="sm"
              label="Yeniden kilitleme süresi"
              value={String(lock.relockAfterSec)}
              onChange={(v) => setDevice((p) => ({ ...p, lock: { ...p.lock, relockAfterSec: Number(v) } }))}
              options={[
                { value: '0', label: 'Hemen' },
                { value: '60', label: '1 dk' },
                { value: '300', label: '5 dk' },
                { value: '900', label: '15 dk' },
              ]}
            />
          </Row>
          {isNative() && bio.available && (
            <Row title={<><Fingerprint size={16} aria-hidden /> {bio.label} ile aç</>} hint="PIN yine de geçerli kalır.">
              <Segmented<OnOff> size="sm" label={`${bio.label} ile aç`} value={lock.biometric ? 'on' : 'off'} onChange={toggleBio} options={ONOFF} />
            </Row>
          )}
          <div className="btn-row">
            <button className="btn btn--secondary" onClick={lockNow}>
              <Lock size={17} /> Şimdi kilitle
            </button>
            <button className="btn btn--ghost" onClick={() => setPinMode('change')}>PIN’i değiştir</button>
            <button className="btn btn--ghost" onClick={() => setPinMode('disable')}>Kilidi kapat</button>
          </div>
        </>
      )}
      {mode && <PinForm mode={mode} onDone={() => setPinMode(null)} />}
    </section>
  );
}

function PinForm({ mode, onDone }: { mode: Exclude<PinMode, null>; onDone: () => void }) {
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
      if (!isValidPin(next)) return setErr('PIN 4–6 rakamdan oluşmalı.');
      if (next !== again) return setErr('İki PIN aynı değil.');
    }
    setBusy(true);
    try {
      if (needCur) {
        const r = await checkCurrentPin(cur);
        if (!r.ok) return setErr(r.waitMs > 0 ? `PIN yanlış. ${Math.ceil(r.waitMs / 1000)} sn sonra tekrar dene.` : 'Şu anki PIN yanlış.');
      }
      if (mode === 'disable') {
        setDevice((p) => ({ ...p, lock: { ...p.lock, pinHash: null, salt: null, biometric: false, failed: 0, blockedUntil: null } }));
        showToast('Uygulama kilidi kapatıldı');
      } else {
        const h = await hashPin(next);
        setDevice((p) => ({ ...p, lock: { ...p.lock, ...h, failed: 0, blockedUntil: null } }));
        showToast(mode === 'set' ? 'PIN belirlendi. Uygulama açılırken sorulacak.' : 'PIN değişti');
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
      {needCur && pinInput('Şu anki PIN', cur, setCur, true)}
      {needNew && pinInput(mode === 'set' ? 'Yeni PIN (4–6 rakam)' : 'Yeni PIN', next, setNext, !needCur)}
      {needNew && pinInput('Yeni PIN (tekrar)', again, setAgain)}
      {mode === 'set' && <p className="muted small">PIN’i unutursan kurtarma yolu yok; ancak verileri silip yedekten dönebilirsin. Otomatik yedeği açık tut.</p>}
      {err && <p className="form-error" role="alert">{err}</p>}
      <div className="btn-row">
        <button type="button" className="btn btn--ghost" onClick={onDone}>Vazgeç</button>
        <button type="submit" className={`btn ${mode === 'disable' ? 'btn--danger' : 'btn--primary'}`} disabled={busy}>
          {mode === 'set' ? 'PIN’i kaydet' : mode === 'change' ? 'Değiştir' : 'Kilidi kapat'}
        </button>
      </div>
    </form>
  );
}

// ───────────────────────── Bildirimler ─────────────────────────

const setNotif = (patch: Partial<DevicePrefs['notifications']>) => setDevice((p) => ({ ...p, notifications: { ...p.notifications, ...patch } }));

export function NotificationSettings() {
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
        <SectionHead id="s-notif" title="Bildirimler" />
        <p className="muted">
          Hatırlatmalar (yaklaşan ödeme, beklenen gelir, akşam “bugünü girdin mi?”) yalnız <b>Android uygulamasında</b> çalışır. Tarayıcı sürümü kapalıyken bildirim gönderemez.
        </p>
      </section>
    );
  }

  async function toggle(v: OnOff) {
    if (v === 'off') return setNotif({ enabled: false });
    const ok = await requestNotificationPermission();
    setPerm(ok ? 'granted' : 'denied');
    if (!ok) {
      showToast('Bildirim izni verilmedi. Telefonun Ayarlar → Uygulamalar → Cep Defteri → Bildirimler bölümünden açabilirsin.', { tone: 'error', ms: 6000 });
      return;
    }
    setNotif({ enabled: true });
    showToast('Bildirimler açık');
  }

  return (
    <section className="card" aria-labelledby="s-notif">
      <SectionHead id="s-notif" title="Bildirimler" />
      <Row title={<><Bell size={16} aria-hidden /> Hatırlatmalar</>}>
        <Segmented<OnOff> size="sm" label="Bildirimler" value={n.enabled ? 'on' : 'off'} onChange={toggle} options={ONOFF} />
      </Row>
      {n.enabled && perm === 'denied' && (
        <p className="form-error" role="alert">Telefon bildirim iznini kapatmış. Ayarlar → Uygulamalar → Cep Defteri → Bildirimler’den açmadıkça hatırlatma gelmez.</p>
      )}
      {n.enabled && (
        <>
          <Row title="Yaklaşan ödemeler" hint="Ödemeden bir gün önce saat 10:00’da">
            <Segmented<OnOff> size="sm" label="Yaklaşan ödemeler" value={n.payments ? 'on' : 'off'} onChange={(v) => setNotif({ payments: v === 'on' })} options={ONOFF} />
          </Row>
          <Row title="Beklenen gelir" hint="Gelirin günü saat 12:00’de “geldi mi?”">
            <Segmented<OnOff> size="sm" label="Beklenen gelir" value={n.income ? 'on' : 'off'} onChange={(v) => setNotif({ income: v === 'on' })} options={ONOFF} />
          </Row>
          <Row title="Akşam hatırlatması" hint="O gün hiç kayıt yoksa “Bugünkü harcamalarını girdin mi?”">
            <Segmented<OnOff> size="sm" label="Akşam hatırlatması" value={n.dailyReminder ? 'on' : 'off'} onChange={(v) => setNotif({ dailyReminder: v === 'on' })} options={ONOFF} />
          </Row>
          {n.dailyReminder && (
            <Row title="Hatırlatma saati">
              <select className="input input--small nset-select" value={n.reminderHour} onChange={(e) => setNotif({ reminderHour: Number(e.target.value) })} aria-label="Hatırlatma saati">
                {[17, 18, 19, 20, 21, 22, 23].map((h) => (
                  <option key={h} value={h}>{`${h}:00`}</option>
                ))}
              </select>
            </Row>
          )}
          <p className="muted small">
            {mode === 'demo' ? 'Örnek veri modunda bildirim gönderilmez.' : count > 0 ? `Önümüzdeki 30 gün için ${count} hatırlatma planlandı.` : 'Önümüzdeki günlerde hatırlatılacak bir şey yok.'}
          </p>
        </>
      )}
    </section>
  );
}

// ───────────────────────── Otomatik yedek ─────────────────────────

export function AutoBackupSettings() {
  const ab = useDevice((p) => p.autoBackup);
  const data = useStore((s) => s.data);
  const mode = useStore((s) => s.mode);
  const native = isNative();
  const [list, setList] = useState<AutoBackupEntry[]>([]);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    listAutoBackups().then(setList);
  }, [ab.lastAt]);
  const nudge = (!native || !ab.enabled) && mode === 'real' && backupNudgeDue(data, Date.now());

  async function backupNow() {
    setBusy(true);
    if (native && !(await requestStoragePermission())) {
      setBusy(false);
      return showToast('Dosya izni verilmedi; yedek yazılamadı.', { tone: 'error' });
    }
    const ok = await runAutoBackup(getState().data, getState().mode, { force: true });
    setBusy(false);
    showToast(ok ? 'Yedek alındı' : getDevice().autoBackup.lastError ?? 'Yedek alınamadı', { tone: ok ? 'ok' : 'error' });
  }

  return (
    <section className="card" aria-labelledby="s-auto">
      <SectionHead id="s-auto" title="Otomatik yedek" />
      <Row title={<><HardDriveDownload size={16} aria-hidden /> Her gün yedek al</>}>
        <Segmented<OnOff> size="sm" label="Otomatik yedek" value={ab.enabled ? 'on' : 'off'} onChange={(v) => setDevice((p) => ({ ...p, autoBackup: { ...p.autoBackup, enabled: v === 'on' } }))} options={ONOFF} />
      </Row>
      {native ? (
        <p className="muted small">
          Her gün bir kopya telefonun <b>Belgeler/CepDefteri</b> klasörüne yazılır; son 7 gün tutulur. Bu klasör uygulamayı silsen de kalır: yeniden kurduktan sonra <b>Yedekten geri yükle</b> ile oradaki en yeni dosyayı seç.
        </p>
      ) : (
        <p className="muted small">
          Tarayıcı, son 5 günün kopyasını kendi deposunda tutar. Tarayıcı verileri temizlenirse bu kopyalar da gider; bu yüzden ara sıra <b>Yedek indir</b> ile dosya al.
        </p>
      )}
      {mode === 'demo' && <p className="muted small">Örnek veri modunda otomatik yedek alınmaz.</p>}
      {ab.lastAt && (
        <p className="muted small">
          Son otomatik yedek: {fmtTime(ab.lastAt)}
          {ab.lastPath && <> · {ab.lastPath}</>}
        </p>
      )}
      {ab.lastError && <p className="form-error" role="alert">{ab.lastError}</p>}
      {nudge && (
        <div className="callout callout--quiet">
          Son yedek dosyan {NUDGE_DAYS} günden eski{native ? '' : ' (tarayıcıdaki kopyalar cihaz dışında bir yedek sayılmaz)'}. <b>Yedek indir</b> ile bir kopya almaya ne dersin?
        </div>
      )}
      {mode === 'real' && (
        <div className="btn-row">
          <button className="btn btn--ghost" onClick={backupNow} disabled={busy}>
            <HardDriveDownload size={17} /> Şimdi yedekle
          </button>
        </div>
      )}
      {list.length > 0 && <AutoRestoreList list={list} />}
    </section>
  );
}

function AutoRestoreList({ list }: { list: AutoBackupEntry[] }) {
  const mode = useStore((s) => s.mode);
  const [pending, setPending] = useState<{ entry: AutoBackupEntry; data: Data } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function pick(e: AutoBackupEntry) {
    setErr(null);
    try {
      const r = parseBackup(await e.read());
      if (!r.ok) return setErr(r.error);
      setPending({ entry: e, data: r.data });
    } catch {
      setErr('Yedek dosyası okunamadı.');
    }
  }
  function apply() {
    if (!pending) return;
    if (mode === 'demo') setMode('real');
    replaceData(pending.data, { stash: true });
    setPending(null);
    showToast('Otomatik yedek geri yüklendi. Önceki verin ayarlardan geri alınabilir.', { ms: 5000 });
    go('home');
  }

  return (
    <details className="details">
      <summary>Otomatik yedekler ({list.length})</summary>
      <ul className="nset-list">
        {list.map((e) => (
          <li key={e.name}>
            <span>
              <b>{new Date(e.day + 'T12:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' })}</b>
              {e.at && <small className="muted"> · {new Date(e.at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</small>}
            </span>
            <button className="btn btn--ghost btn--small" onClick={() => pick(e)}>
              <RotateCcw size={15} /> Geri yükle
            </button>
          </li>
        ))}
      </ul>
      {pending && (
        <div className="callout">
          <p>
            {pending.data.accounts.length} hesap, {pending.data.txs.length} işlem, {pending.data.plans.length} plan, {pending.data.valuations.length} değer kaydı.
          </p>
          <p>Bu yedek {mode === 'demo' ? 'gerçek verilerinin' : 'şu anki verilerinin'} yerine geçecek. Mevcut veri, geri alabilmen için cihazda saklanır.</p>
          <div className="btn-row">
            <button className="btn btn--ghost" onClick={() => setPending(null)}>Vazgeç</button>
            <button className="btn btn--primary" onClick={apply}>Geri yükle</button>
          </div>
        </div>
      )}
      {err && <p className="form-error" role="alert">{err}</p>}
    </details>
  );
}
