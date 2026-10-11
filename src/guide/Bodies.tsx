/** Rehberin özel adım gövdeleri: ana ekran aracı (widget) ve hızlı ayarlar kutucuğu. */
import { useEffect, useState, type CSSProperties } from 'react';
import type { Mood } from '../domain/mood';
import { availability } from '../domain/ledger';
import { formatMoney, hiddenMoney } from '../i18n/format';
import { useT } from '../i18n';
import type { Key } from '../i18n/core';
import { useStore } from '../store/store';
import { Mascot } from '../mascot/Mascot';
import { useMascot } from '../mascot/MascotNote';
import { addTileSupported, initShortcuts, pinWidgetSupported, requestAddTile, requestPinWidget } from '../native/shortcuts';

/** Desteği öğren: bayraklar initShortcuts bitmeden false döner. */
function useSupport(get: () => boolean): boolean | null {
  const [ok, setOk] = useState<boolean | null>(null);
  useEffect(() => {
    let live = true;
    initShortcuts()
      .catch(() => undefined)
      .then(() => live && setOk(get()));
    return () => {
      live = false;
    };
  }, [get]);
  return ok;
}

function Steps({ keys }: { keys: Key[] }) {
  const t = useT();
  return (
    <ol className="coach-steps">
      {keys.map((k, i) => (
        <li key={k} style={{ '--i': i } as CSSProperties}>
          <span className="coach-steps__n">{i + 1}</span>
          <span>{t(k)}</span>
        </li>
      ))}
    </ol>
  );
}

/** Ana ekranda Cep Defteri aracının küçük çizimi: maskotun sahne zemini, maskot, bakiye ve maskot renkli düğmeler. */
function WidgetMock() {
  const t = useT();
  const m = useMascot();
  const avail = useStore((s) => {
    const a = availability(s.data, s.today);
    return a.confidence === 'none' ? null : a.available;
  });
  const hide = useStore((s) => !!s.data.settings.hideTotals);
  const p = m.ch.palette;
  return (
    <div className="phone-mock" role="img" aria-label={t('guide.mockLabel')}>
      <div className="phone-mock__apps" aria-hidden>
        {Array.from({ length: 4 }, (_, i) => <i key={i} />)}
      </div>
      <div className={`widget-mock widget-mock--${m.who}`} style={{ '--w-accent': p.accent, '--w-soft': p.soft } as CSSProperties} aria-hidden>
        <span className="widget-mock__mascot">
          <Mascot who={m.who} mood="happy" size={46} idle={false} lang={m.lang} />
        </span>
        <span className="widget-mock__card">
          <small>{t('home.availableShort')}</small>
          <b>{avail === null ? '—' : hide ? hiddenMoney() : formatMoney(avail)}</b>
        </span>
        <span className="widget-mock__btns">
          <span className="widget-mock__btn widget-mock__btn--main">{t('tx.expense')}</span>
          <span className="widget-mock__btn">{t('tx.income')}</span>
        </span>
      </div>
      <div className="phone-mock__apps" aria-hidden>
        {Array.from({ length: 4 }, (_, i) => <i key={i} />)}
      </div>
    </div>
  );
}

type Res = 'idle' | 'busy' | 'ok' | 'fail' | 'already';

export function WidgetBody({ onMood }: { onMood: (m: Mood | null) => void }) {
  const t = useT();
  const supported = useSupport(pinWidgetSupported);
  const [res, setRes] = useState<Res>('idle');
  const pin = async () => {
    setRes('busy');
    const r = await requestPinWidget();
    if (r === 'ok') {
      setRes('ok');
      onMood('celebrate');
    } else setRes('fail');
  };
  return (
    <div className="coach__body">
      <WidgetMock />
      {res === 'ok' ? (
        <p className="coach__ok" role="status">{t('guide.pinOk')}</p>
      ) : supported && res !== 'fail' ? (
        <button type="button" className="btn btn--primary btn--block" disabled={res === 'busy'} onClick={() => void pin()}>{t('guide.pinWidget')}</button>
      ) : supported !== null ? (
        <>
          {res === 'fail' && <p className="small muted">{t('guide.pinFail')}</p>}
          <Steps keys={['guide.widget1', 'guide.widget2', 'guide.widget3']} />
        </>
      ) : null}
    </div>
  );
}

export function TileBody({ onMood }: { onMood: (m: Mood | null) => void }) {
  const t = useT();
  const supported = useSupport(addTileSupported);
  const [res, setRes] = useState<Res>('idle');
  const add = async () => {
    setRes('busy');
    const r = await requestAddTile();
    if (r === 'ok' || r === 'already') {
      setRes(r);
      onMood('celebrate');
    } else if (r === 'dismissed') setRes('idle');
    else setRes('fail');
  };
  return (
    <div className="coach__body">
      {res === 'ok' || res === 'already' ? (
        <p className="coach__ok" role="status">{t(res === 'ok' ? 'guide.tileOk' : 'guide.tileAlready')}</p>
      ) : supported && res !== 'fail' ? (
        <button type="button" className="btn btn--primary btn--block" disabled={res === 'busy'} onClick={() => void add()}>{t('guide.addTile')}</button>
      ) : supported !== null ? (
        <>
          {res === 'fail' && <p className="small muted">{t('guide.tileFail')}</p>}
          <Steps keys={['guide.tile1', 'guide.tile2', 'guide.tile3']} />
        </>
      ) : null}
    </div>
  );
}
