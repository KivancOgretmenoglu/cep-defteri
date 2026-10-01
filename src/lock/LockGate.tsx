/**
 * Kilit ekranı. Kilitliyken içerik bağlı kalır (yarım kalan form kaybolmasın) ama görünmez ve etkileşimsizdir.
 */
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Delete, Fingerprint, LockKeyhole } from 'lucide-react';
import { Clawd } from '../clawd/Clawd';
import { isNative } from '../platform';
import { useDevice } from '../store/device';
import { remainingBlock, startLockWatch, tryPin, unlock, useLocked, wipeAllAppData } from './lockState';
import { biometricInfo, verifyBiometric } from './biometric';
import './lock.css';

export function LockGate({ children }: { children: ReactNode }) {
  const locked = useLocked();
  const hasPin = useDevice((p) => !!p.lock.pinHash);
  useEffect(() => startLockWatch(), []);
  const show = locked && hasPin;
  return (
    <>
      <div className={show ? 'lock-hidden' : undefined} inert={show || undefined} aria-hidden={show || undefined}>
        {children}
      </div>
      {show && <LockScreen />}
    </>
  );
}

const fmtWait = (ms: number) => {
  const s = Math.ceil(ms / 1000);
  return s >= 60 ? `${Math.floor(s / 60)} dk ${String(s % 60).padStart(2, '0')} sn` : `${s} sn`;
};

function LockScreen() {
  const bioEnabled = useDevice((p) => p.lock.biometric);
  const [pin, setPin] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [wait, setWait] = useState(() => remainingBlock());
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(0);
  const [bio, setBio] = useState<{ available: boolean; label: string }>({ available: false, label: '' });
  const [forgot, setForgot] = useState(false);
  const autoTried = useRef(false);

  // Bekleme sayacı
  const waiting = wait > 0;
  useEffect(() => {
    if (!waiting) return;
    const t = setInterval(() => setWait(remainingBlock()), 500);
    return () => clearInterval(t);
  }, [waiting]);

  const tryBio = useCallback(async () => {
    if (await verifyBiometric()) unlock();
  }, []);

  useEffect(() => {
    if (!bioEnabled || !isNative()) return;
    biometricInfo().then((b) => {
      setBio(b);
      // Kilit ekranı açılınca bir kez kendiliğinden sor.
      if (b.available && !autoTried.current && document.visibilityState === 'visible') {
        autoTried.current = true;
        tryBio();
      }
    });
  }, [bioEnabled, tryBio]);

  const submit = useCallback(
    async (value: string) => {
      if (busy || value.length < 4) return;
      setBusy(true);
      const r = await tryPin(value);
      setBusy(false);
      if (r.ok) {
        unlock();
        return;
      }
      setPin('');
      setShake((n) => n + 1);
      setWait(r.waitMs);
      setMsg(r.waitMs > 0 ? 'Çok fazla yanlış deneme.' : r.error);
    },
    [busy],
  );

  const press = useCallback(
    (k: string) => {
      if (wait > 0 || busy) return;
      setMsg(null);
      if (k === 'del') setPin((p) => p.slice(0, -1));
      else if (k === 'ok') submit(pin);
      else setPin((p) => (p.length >= 6 ? p : p + k));
    },
    [wait, busy, pin, submit],
  );

  // Fiziksel klavye
  useEffect(() => {
    if (forgot) return;
    const onKey = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) press(e.key);
      else if (e.key === 'Backspace') press('del');
      else if (e.key === 'Enter') press('ok');
      else return;
      e.preventDefault();
      e.stopPropagation();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [press, forgot]);

  const canBio = bioEnabled && bio.available;

  return (
    <div className="lock" role="dialog" aria-modal="true" aria-labelledby="lock-title">
      <div className="lock__inner">
        <div className="lock__clawd" aria-hidden>
          <Clawd mood="calm" outfit="plain" idle={false} size={92} />
          <span className="lock__z">z</span>
          <span className="lock__z lock__z--2">z</span>
        </div>
        <h1 id="lock-title" className="lock__title">
          <LockKeyhole size={18} aria-hidden /> Cep Defteri kilitli
        </h1>

        {!forgot ? (
          <>
            <p className="lock__sub">{wait > 0 ? `Tekrar denemek için ${fmtWait(wait)} bekle.` : 'Devam etmek için PIN’ini gir.'}</p>
            <div className={`lock__dots ${shake ? 'is-shake' : ''}`} key={shake} aria-label={`${pin.length} hane girildi`} role="status">
              {Array.from({ length: Math.max(4, pin.length) }, (_, i) => (
                <i key={i} className={i < pin.length ? 'is-on' : ''} />
              ))}
            </div>
            <p className="lock__msg" role="alert">{msg ?? ' '}</p>
            <div className="lock__pad">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
                <button key={d} type="button" className="lock__key" onClick={() => press(d)} disabled={wait > 0}>
                  {d}
                </button>
              ))}
              {canBio ? (
                <button type="button" className="lock__key lock__key--fn" onClick={tryBio} aria-label={`${bio.label} ile aç`}>
                  <Fingerprint size={24} />
                </button>
              ) : (
                <span />
              )}
              <button type="button" className="lock__key" onClick={() => press('0')} disabled={wait > 0}>
                0
              </button>
              <button type="button" className="lock__key lock__key--fn" onClick={() => press('del')} aria-label="Sil" disabled={!pin}>
                <Delete size={22} />
              </button>
            </div>
            <button type="button" className="btn btn--primary btn--block lock__ok" onClick={() => press('ok')} disabled={pin.length < 4 || wait > 0 || busy}>
              {busy ? 'Kontrol ediliyor…' : 'Aç'}
            </button>
            <button type="button" className="link lock__forgot" onClick={() => setForgot(true)}>
              PIN’i unuttum
            </button>
          </>
        ) : (
          <Forgot canBio={canBio} bioLabel={bio.label} onBio={tryBio} onBack={() => setForgot(false)} />
        )}
      </div>
    </div>
  );
}

function Forgot({ canBio, bioLabel, onBio, onBack }: { canBio: boolean; bioLabel: string; onBio: () => void; onBack: () => void }) {
  const [confirm, setConfirm] = useState('');
  const native = isNative();
  return (
    <div className="lock__forgot-panel">
      <p>
        Dürüst olalım: bu kilit bir <b>gizlilik perdesi</b>. Kayıtların şifreli değil, ama PIN’i başka bir yoldan sıfırlamanın güvenli bir yolu da yok;
        olsaydı kilidi herkes açabilirdi.
      </p>
      {canBio && (
        <>
          <p>{bioLabel} ile açabilirsin; sonra Ayarlar → Güvenlik’ten yeni bir PIN belirle.</p>
          <button type="button" className="btn btn--primary btn--block" onClick={onBio}>
            <Fingerprint size={18} /> {bioLabel} ile aç
          </button>
        </>
      )}
      <div className="callout">
        <p>
          <b>Kilidi kaldır ve verileri sil:</b> bu cihazdaki tüm kayıtlar, ayarlar ve PIN silinir; uygulama ilk günkü hâline döner.
        </p>
        {native ? (
          <p className="small">
            Telefonun <b>Belgeler/CepDefteri</b> klasöründeki otomatik yedekler silinmez. Sonra <b>Ayarlar → Yedekten geri yükle</b> ile en yeni dosyayı seçerek kayıtlarına dönebilirsin.
          </p>
        ) : (
          <p className="small">
            Tarayıcıdaki otomatik yedekler de silinir. Daha önce indirdiğin bir yedek dosyası varsa, sonra <b>Ayarlar → Yedekten geri yükle</b> ile kayıtlarına dönebilirsin.
          </p>
        )}
        <label className="field">
          <span className="field__label">Onaylamak için SİL yaz</span>
          <input className="input" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" />
        </label>
        <button type="button" className="btn btn--danger btn--block" disabled={confirm.trim().toLocaleUpperCase('tr') !== 'SİL'} onClick={wipeAllAppData}>
          Kilidi kaldır ve verileri sil
        </button>
      </div>
      <button type="button" className="link lock__forgot" onClick={onBack}>
        PIN girmeye dön
      </button>
    </div>
  );
}
