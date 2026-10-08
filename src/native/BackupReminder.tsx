/**
 * Dürüst yedek hatırlatması (ana ekran kartı + Ayarlar'daki not).
 * Genel bir "yedek al" yerine somut olgu: kaç kayıt, nerede duruyor, ne olursa gider.
 * Android'de günlük otomatik yedek çalışıyorsa hiç görünmez (kural: backupPlan.backupReminder).
 * "Sonra" tarafsızdır: suçluluk yok, hatırlatma bir hafta susar.
 */
import { useState } from 'react';
import { HardDriveDownload } from 'lucide-react';
import { useStore } from '../store/store';
import { useDevice } from '../store/device';
import { useT, type BoundT } from '../i18n';
import { isNative } from '../platform';
import { downloadBackup } from '../screens/Settings';
import { backupReminder, SNOOZE_DAYS, type BackupReminder as Reminder } from './backupPlan';
import './backupReminder.css';

const SNOOZE_KEY = 'cep-defteri:backup-later';

function readSnooze(): number | null {
  try {
    const v = Number(localStorage.getItem(SNOOZE_KEY));
    return Number.isFinite(v) && v > 0 ? v : null;
  } catch {
    return null;
  }
}

/** Hatırlatmanın metinleri: başlık (olgu), neden (ne olursa gider) ve son yedek bilgisi. */
export function reminderTexts(r: Reminder, t: BoundT): { title: string; why: string; last: string | null } {
  const what = r.count > 0 ? t('bkr.what', { n: r.count }) : t('bkr.whatNone');
  const one = r.count === 1 ? 1 : 0;
  const days = r.days != null ? t('common.days', { n: r.days }) : '';
  if (r.kind === 'autoFailed') {
    return { title: t('bkr.autoFailed'), why: r.days != null ? t('bkr.autoFailedWhy', { days }) : t('bkr.autoFailedNever'), last: null };
  }
  return {
    title: t(r.kind === 'web' ? 'bkr.web' : 'bkr.phone', { what, one }),
    why: t(r.kind === 'web' ? 'bkr.webWhy' : 'bkr.phoneWhy'),
    last: r.days != null ? t('bkr.last', { days }) : t('bkr.never'),
  };
}

/** O anki hatırlatma (yoksa null). `ignoreSnooze`: Ayarlar'da "Sonra" denmiş olsa da göster. */
export function useBackupReminder(ignoreSnooze = false): Reminder | null {
  const data = useStore((s) => s.data);
  const mode = useStore((s) => s.mode);
  const auto = useDevice((p) => p.autoBackup);
  const [snoozedUntil] = useState(readSnooze);
  return backupReminder(data, { real: mode === 'real', native: isNative(), auto, snoozedUntil: ignoreSnooze ? null : snoozedUntil }, Date.now());
}

/** Ana ekran kartı. */
export function BackupReminderCard() {
  const t = useT();
  const r = useBackupReminder();
  const [hidden, setHidden] = useState(false);
  if (!r || hidden) return null;
  const x = reminderTexts(r, t);
  const later = () => {
    try {
      localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_DAYS * 86_400_000));
    } catch {
      /* depo yoksa yalnız bu oturumda gizlenir */
    }
    setHidden(true);
  };
  return (
    <section className="backup-reminder" role="status" aria-labelledby="bkr-title">
      <HardDriveDownload size={20} aria-hidden className="backup-reminder__icon" />
      <div className="backup-reminder__body">
        <p id="bkr-title" className="backup-reminder__title">{x.title}</p>
        <p className="backup-reminder__why">
          {x.why}
          {x.last && <> {x.last}</>}
        </p>
        <div className="backup-reminder__actions">
          <button className="btn btn--primary btn--small" onClick={downloadBackup}>{t('bkr.save')}</button>
          <button className="btn btn--ghost btn--small" onClick={later}>{t('bkr.later')}</button>
        </div>
      </div>
    </section>
  );
}
