import { useEffect, useRef, useState } from 'react';
import { Download, Upload, Plus, ChevronRight, ShieldCheck, FlaskConical, RotateCcw, Trash2, FileSpreadsheet } from 'lucide-react';
import type { Data, ThemePref } from '../domain/types';
import { emptyData } from '../domain/defaults';
import { buildDemo } from '../domain/demo';
import { parseBackup, serializeBackup, transactionsCSV, valuationsCSV } from '../domain/backup';
import * as A from '../domain/actions';
import { formatMoney } from '../domain/money';
import { cashBalance, investmentState } from '../domain/ledger';
import { commit, getState, replaceData, setMode, showToast, useStore } from '../store/store';
import * as storage from '../store/storage';
import { Chip, SectionHead, Segmented } from '../ui/kit';
import { go, openSheet } from '../ui/nav';
import { useData } from '../ui/hooks';
import { CatIcon, ACCOUNT_ICONS } from '../ui/icons';
import { Clawd, BODY_COLORS, HOME_OUTFITS, OUTFITS } from '../clawd/Clawd';
import { isNative, saveFile } from '../platform';
import { SecuritySettings, NotificationSettings, AutoBackupSettings } from '../native/NativeSettings';

async function download(name: string, content: string, type: string): Promise<boolean> {
  try {
    const r = await saveFile(name, content, type);
    return r !== 'cancelled';
  } catch {
    showToast('Dosya kaydedilemedi.', { tone: 'error' });
    return false;
  }
}
const stamp = (today: string) => today;

export function downloadCSV(data: Data) {
  download(`cep-defteri-islemler-${stamp(getState().today)}.csv`, transactionsCSV(data), 'text/csv;charset=utf-8');
}

export async function downloadBackup() {
  const { data, mode, today } = getState();
  const ok = await download(`cep-defteri-yedek-${mode === 'demo' ? 'ORNEK-' : ''}${stamp(today)}.json`, serializeBackup(data), 'application/json');
  if (!ok) return;
  if (mode === 'real') commit((d) => A.updateSettings(d, { lastBackupAt: Date.now() }), undefined);
  showToast(isNative() ? 'Yedek hazır; kaydettiğin yeri unutma' : 'Yedek dosyası indirildi');
}

/** Yedek dosyası seçme + önizleme + onay. Ayarlar ve ilk açılış ekranında kullanılır. */
export function RestorePicker({ compact = false }: { compact?: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<{ data: Data; exportedAt: string | null; name: string } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const mode = useStore((s) => s.mode);
  async function onFile(f: File | undefined) {
    setErr(null);
    if (!f) return;
    const text = await f.text();
    const r = parseBackup(text);
    if (!r.ok) return setErr(r.error);
    setPending({ data: r.data, exportedAt: r.exportedAt, name: f.name });
  }
  function apply() {
    if (!pending) return;
    if (mode === 'demo') setMode('real');
    replaceData(pending.data, { stash: true });
    setPending(null);
    showToast('Yedek geri yüklendi. Önceki verin ayarlardan geri alınabilir.', { ms: 5000 });
    go('home');
  }
  return (
    <div className="restore">
      <input ref={ref} type="file" accept="application/json,.json" hidden onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ''; }} />
      {!pending && (
        <button className={`btn ${compact ? 'btn--ghost' : 'btn--secondary'}`} onClick={() => ref.current?.click()}>
          <Upload size={17} /> Yedekten geri yükle
        </button>
      )}
      {pending && (
        <div className="callout">
          <p>
            <b>{pending.name}</b>
            {pending.exportedAt && <> · {new Date(pending.exportedAt).toLocaleString('tr-TR')}</>}
            <br />
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
    </div>
  );
}

export function startDemo(today: string) {
  setMode('demo', buildDemo(today));
  showToast('Örnek verilerle açıldı. Gerçek kayıtların ayrı ve dokunulmadan duruyor.', { ms: 5000 });
  go('home');
}

export function Settings() {
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

  return (
    <div className="screen">
      <header className="screen-head"><h1>Ayarlar</h1></header>
      <div className="settings-grid">
        <section className="card" aria-labelledby="s-acc">
          <SectionHead id="s-acc" title="Hesaplar" action={<button className="link" onClick={() => openSheet({ kind: 'account' })}><Plus size={16} /> Ekle</button>} />
          <ul className="acc-list">
            {data.accounts.map((a) => {
              const I = ACCOUNT_ICONS[a.kind];
              const val = a.kind === 'investment' ? investmentState(data, a.id)!.currentValue : cashBalance(data, a.id);
              return (
                <li key={a.id}>
                  <button className="acc-row" onClick={() => openSheet({ kind: 'account', accountId: a.id })}>
                    <I size={18} aria-hidden />
                    <span className="acc-row__name">
                      {a.name}
                      <small>{a.kind === 'bank' ? 'Banka' : a.kind === 'cash' ? 'Nakit' : a.kind === 'person' ? (val > 0 ? 'kişi · sana borçlu' : val < 0 ? 'kişi · ona borçlusun' : 'kişi') : 'Yatırım'}{a.archived ? ' · arşivde' : ''}</small>
                    </span>
                    <span className={a.kind === 'investment' ? 'tone-invest' : ''}>{a.kind === 'person' ? formatMoney(Math.abs(val)) : data.settings.hideTotals ? '••••• TL' : formatMoney(val)}</span>
                    <ChevronRight size={16} aria-hidden />
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="note-line">Kredi kartı henüz ayrı bir hesap türü değil. Kartla yaptığın harcamayı, borcu ödediğin banka hesabından gider olarak girmen yeterli; böylece iki kez sayılmaz.</p>
        </section>

        <section className="card" aria-labelledby="s-cat">
          <SectionHead id="s-cat" title="Kategoriler" action={<button className="link" onClick={() => openSheet({ kind: 'category', catKind: catTab })}><Plus size={16} /> Ekle</button>} />
          <Segmented size="sm" label="Kategori türü" value={catTab} onChange={setCatTab} options={[{ value: 'expense', label: 'Gider' }, { value: 'income', label: 'Gelir kaynağı' }]} />
          <ul className="cat-list">
            {data.categories.filter((c) => c.kind === catTab).map((c) => (
              <li key={c.id}>
                <button className={`cat-row ${c.archived ? 'is-archived' : ''}`} onClick={() => openSheet({ kind: 'category', categoryId: c.id })}>
                  <span className="cat-row__icon" style={{ '--cat': c.color } as React.CSSProperties}><CatIcon icon={c.icon} size={16} /></span>
                  <span>{c.name}{c.archived && <small> · arşivde</small>}</span>
                  {c.limit ? <small className="muted">limit {formatMoney(c.limit)}</small> : null}
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="card" aria-labelledby="s-clawd">
          <SectionHead id="s-clawd" title="Clawd’ın dolabı" />
          <p className="muted">Ana ekranda Clawd’ın ne giyeceğini seç. Diğer ekranlarda işine uygun kıyafetini kendisi giyer.</p>
          <div className="wardrobe" role="radiogroup" aria-label="Kıyafet">
            {HOME_OUTFITS.map((o) => (
              <button key={o} role="radio" aria-checked={data.settings.clawd.homeOutfit === o} className={`wardrobe__item ${data.settings.clawd.homeOutfit === o ? 'is-on' : ''}`} onClick={() => commit((d) => A.updateSettings(d, { clawd: { ...d.settings.clawd, homeOutfit: o } }))}>
                <Clawd mood="happy" outfit={o} body={data.settings.clawd.body} size={72} idle={false} />
                <span>{OUTFITS[o].name}</span>
              </button>
            ))}
          </div>
          <div className="chip-row" role="radiogroup" aria-label="Gövde rengi">
            {Object.entries(BODY_COLORS).map(([k, v]) => (
              <Chip key={k} on={data.settings.clawd.body === k} onClick={() => commit((d) => A.updateSettings(d, { clawd: { ...d.settings.clawd, body: k } }))}>
                <i className="dot" style={{ background: v.base }} /> {v.name}
              </Chip>
            ))}
          </div>
          <label className="check-row">
            <input type="checkbox" checked={data.settings.clawdQuips} onChange={(e) => commit((d) => A.updateSettings(d, { clawdQuips: e.target.checked }))} />
            <span>Clawd ara sıra espri yapsın<small>Kayıttan sonra kısa, yargılamayan şakalar ve ipuçları</small></span>
          </label>
          <details className="details">
            <summary>Clawd nasıl karar verir?</summary>
            <ul className="rules">
              <li><b>Meraklı:</b> henüz hesap ya da kayıt yokken. Veri yokken yorum yapmaz.</li>
              <li><b>Düşünceli:</b> bekleyen ödemeler bakiyeyi aşınca, bütçe aşılınca, esnek harcama ayın akışının belirgin önüne geçince ya da bir kategori limiti aşılınca. Her zaman nedeni ve tutarı söyler.</li>
              <li><b>Keyifli:</b> bütçe ayın akışına uygun ilerlerken veya bir hedefin %80’ine gelince.</li>
              <li><b>Kutlama:</b> bir birikim hedefi son 7 günde tamamlandıysa.</li>
              <li><b>Sakin:</b> diğer durumlarda; bütçe yoksa yalnızca özetler, yargılamaz.</li>
              <li>Planlı ödemeler (yurt, abonelik) ve yatırım katkıları “fazla harcama” sayılmaz. Yatırım değerinin düşmesi olumsuz yorum doğurmaz. Aynı kayıtlarla her zaman aynı tepkiyi verir.</li>
            </ul>
          </details>
        </section>

        <section className="card" aria-labelledby="s-look">
          <SectionHead id="s-look" title="Görünüm" />
          <Segmented<ThemePref> label="Tema" value={data.settings.theme} onChange={(v) => commit((d) => A.updateSettings(d, { theme: v }))} options={[{ value: 'system', label: 'Sistem' }, { value: 'light', label: 'Açık' }, { value: 'dark', label: 'Koyu' }]} />
        </section>

        <section className="card card--span" aria-labelledby="s-data">
          <SectionHead id="s-data" title="Verilerin" />
          <p className="muted">
            <ShieldCheck size={15} aria-hidden /> Kayıtların yalnızca <b>bu cihazda, bu tarayıcıda</b> saklanır; hiçbir sunucuya gönderilmez. Cihazlar arası eşitleme yok: başka cihaza geçmek için yedek dosyasını indirip orada geri yükle.
            {persisted === true && ' Tarayıcı bu veriyi kalıcı olarak tutmayı onayladı.'}
            {persisted === false && ' Tarayıcı, yer darlığında veriyi silebilir; düzenli yedek almanı öneririm.'}
          </p>
          <p className="muted small">{lastBackup ? `Son yedek: ${new Date(lastBackup).toLocaleDateString('tr-TR')}` : 'Henüz yedek almadın.'}</p>
          <div className="btn-row">
            <button className="btn btn--primary" onClick={downloadBackup}><Download size={17} /> Yedek indir (JSON)</button>
            <RestorePicker />
          </div>
          <div className="btn-row">
            <button className="btn btn--ghost" onClick={() => downloadCSV(data)}><FileSpreadsheet size={17} /> İşlemler CSV</button>
            {data.valuations.length > 0 && <button className="btn btn--ghost" onClick={() => download(`cep-defteri-yatirim-degerleri-${today}.csv`, valuationsCSV(data), 'text/csv;charset=utf-8')}><FileSpreadsheet size={17} /> Yatırım değerleri CSV</button>}
          </div>
          {canUndoRestore && mode === 'real' && (
            <div className="callout callout--quiet">
              <p>Son geri yüklemeden ya da silmeden önceki veri cihazda duruyor.</p>
              <div className="btn-row">
                <button className="btn btn--ghost" onClick={() => {
                  const prev = storage.takePreRestore();
                  if (prev) {
                    replaceData(prev);
                    storage.dropPreRestore();
                    setCanUndoRestore(false);
                    showToast('Önceki veriye dönüldü');
                  }
                }}><RotateCcw size={17} /> Önceki veriye dön</button>
                <button className="btn btn--ghost" onClick={() => { storage.dropPreRestore(); setCanUndoRestore(false); }}>Bu kopyayı sil</button>
              </div>
            </div>
          )}
        </section>

        <SecuritySettings />
        <NotificationSettings />
        <AutoBackupSettings />

        <section className="card" aria-labelledby="s-demo">
          <SectionHead id="s-demo" title="Örnek veri" />
          {mode === 'demo' ? (
            <>
              <p className="muted">Şu an örnek verileri görüyorsun. Gerçek kayıtların ayrı tutuluyor ve bu moddaki değişikliklerden etkilenmiyor.</p>
              <button className="btn btn--primary" onClick={() => { setMode('real'); showToast('Kendi verilerine dönüldü'); go('home'); }}>Örnekten çık</button>
            </>
          ) : (
            <>
              <p className="muted">Uygulamayı kurgusal bir öğrenci bütçesiyle dene. Gerçek kayıtlarına dokunulmaz; çıkınca örnek veriler silinir.</p>
              <button className="btn btn--secondary" onClick={() => startDemo(today)}><FlaskConical size={17} /> Örnek verilerle dene</button>
            </>
          )}
        </section>

        {mode === 'real' && (
          <section className="card" aria-labelledby="s-wipe">
            <SectionHead id="s-wipe" title="Baştan başla" />
            <p className="muted">Tüm hesapları ve kayıtları siler. Silmeden önceki veri bir kez geri alınabilir şekilde cihazda saklanır, yine de önce yedek almanı öneririm.</p>
            <label className="field">
              <span className="field__label">Onaylamak için SİL yaz</span>
              <input className="input" value={confirmWipe} onChange={(e) => setConfirmWipe(e.target.value)} autoComplete="off" />
            </label>
            <button
              className="btn btn--danger"
              disabled={confirmWipe.trim().toLocaleUpperCase('tr') !== 'SİL'}
              onClick={() => {
                replaceData(emptyData(), { stash: true });
                setConfirmWipe('');
                setCanUndoRestore(true);
                showToast('Tüm veriler silindi');
                go('home');
              }}
            >
              <Trash2 size={17} /> Tüm verileri sil
            </button>
          </section>
        )}
      </div>
      <p className="app-foot">Cep Defteri · tutarlar kuruş hassasiyetinde tutulur · Clawd, Claude’un maskotudur.</p>
    </div>
  );
}
