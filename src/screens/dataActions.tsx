/** Yedek/CSV indirme, yedekten geri yükleme ve örnek veri: Ayarlar dışında (ilk açılış, raporlar, yedek hatırlatıcı) da kullanılır. */
import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import type { Data } from '../domain/types';
import { parseBackup, serializeBackup, transactionsCSV } from '../domain/backup';
import * as A from '../domain/actions';
import { intlLocale } from '../i18n/format';
import { t as tNow, useT } from '../i18n';
import { getLang } from '../i18n/lang';
import { commit, getState, replaceData, setMode, showToast, useStore } from '../store/store';
import { go } from '../ui/nav';
import { isNative, saveFile } from '../platform';

export async function download(name: string, content: string, type: string): Promise<boolean> {
  try {
    const r = await saveFile(name, content, type);
    return r !== 'cancelled';
  } catch {
    showToast(tNow('set.fileSaveFailed'), { tone: 'error' });
    return false;
  }
}
const stamp = (today: string) => today;

export function downloadCSV(data: Data) {
  download(`cep-defteri-islemler-${stamp(getState().today)}.csv`, transactionsCSV(data, getLang()), 'text/csv;charset=utf-8');
}

export async function downloadBackup() {
  const { data, mode, today } = getState();
  const ok = await download(`cep-defteri-yedek-${mode === 'demo' ? 'ORNEK-' : ''}${stamp(today)}.json`, serializeBackup(data), 'application/json');
  if (!ok) return;
  if (mode === 'real') commit((d) => A.updateSettings(d, { lastBackupAt: Date.now() }), undefined);
  showToast(isNative() ? tNow('set.backupReadyNative') : tNow('set.backupDownloaded'));
}

/** Yedek dosyası seçme + önizleme + onay. Ayarlar ve ilk açılış ekranında kullanılır. */
export function RestorePicker({ compact = false }: { compact?: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<{ data: Data; exportedAt: string | null; name: string } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const mode = useStore((s) => s.mode);
  const t = useT();
  async function onFile(f: File | undefined) {
    setErr(null);
    if (!f) return;
    const text = await f.text();
    const r = parseBackup(text, getLang());
    if (!r.ok) return setErr(r.error);
    setPending({ data: r.data, exportedAt: r.exportedAt, name: f.name });
  }
  function apply() {
    if (!pending) return;
    if (mode === 'demo') setMode('real');
    replaceData(pending.data, { stash: true });
    setPending(null);
    showToast(tNow('set.restored'), { ms: 5000 });
    go('home');
  }
  return (
    <div className="restore">
      <input ref={ref} type="file" accept="application/json,.json" hidden onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ''; }} />
      {!pending && (
        <button className={`btn ${compact ? 'btn--ghost' : 'btn--secondary'}`} onClick={() => ref.current?.click()}>
          <Upload size={17} /> {t('set.restore')}
        </button>
      )}
      {pending && (
        <div className="callout">
          <p>
            <b>{pending.name}</b>
            {pending.exportedAt && <> · {new Date(pending.exportedAt).toLocaleString(intlLocale())}</>}
            <br />
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
    </div>
  );
}

export async function startDemo(today: string) {
  // Örnek veri üreticisi ayrı parçada; yalnız "örneği dene" denince yüklenir.
  const { buildDemo } = await import('../domain/demo');
  // Örnek veride de kullanıcının seçtiği maskot ve tema kalır.
  const demo = buildDemo(today, getLang());
  const cur = getState().data.settings;
  setMode('demo', { ...demo, settings: { ...demo.settings, mascot: cur.mascot, theme: cur.theme } });
  showToast(tNow('set.demoStarted'), { ms: 5000 });
  go('home');
}
