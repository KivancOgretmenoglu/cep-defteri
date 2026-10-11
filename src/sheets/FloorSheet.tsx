/** "Ay sonunda en az şu kadar kalsın" (settings.monthEndFloor) düzenleyicisi: bakiye grafiğindeki plan çizgisinin hedefi. */
import { useMemo, useState } from 'react';
import * as A from '../domain/actions';
import { formatMoney, parseMoney } from '../i18n/format';
import { useT } from '../i18n';
import { suggestedFloor } from '../domain/planLine';
import { commit } from '../store/store';
import { closeSheet } from '../ui/nav';
import { FormError, MoneyInput, Sheet, inputFromMoney } from '../ui/kit';
import { useData } from '../ui/hooks';

const ZERO = /^0+([.,]0*)?$/;

export function FloorSheet() {
  const T = useT();
  const { data, today } = useData();
  const current = data.settings.monthEndFloor ?? null;
  const suggestion = useMemo(() => suggestedFloor(data, today), [data, today]);
  // Tanımlı değilse açılışta öneri (bütçe varsa) doldurulur.
  const [raw, setRaw] = useState(current !== null ? (current === 0 ? '0' : inputFromMoney(current)) : suggestion ? inputFromMoney(suggestion) : '');
  const [err, setErr] = useState<string | null>(null);

  function save() {
    const s = raw.trim();
    const v = !s ? null : ZERO.test(s) ? 0 : parseMoney(s);
    if (s && v === null) return setErr(T('fl.format'));
    const e = commit((d) => A.updateSettings(d, { monthEndFloor: v }), v !== null ? T('fl.saved') : T('fl.removed'));
    if (e) setErr(e);
    else closeSheet();
  }
  function remove() {
    commit((d) => A.updateSettings(d, { monthEndFloor: null }), T('fl.removed'));
    closeSheet();
  }
  return (
    <Sheet
      title={T('fl.title')}
      onClose={closeSheet}
      footer={
        <div className="sheet-actions">
          {current !== null && <button className="btn btn--ghost" onClick={remove}>{T('fl.remove')}</button>}
          <button className="btn btn--primary btn--grow" onClick={save}>{T('common.save')}</button>
        </div>
      }
    >
      <MoneyInput big allowZero label={T('fl.q')} value={raw} onChange={setRaw} autoFocus onEnter={save} />
      {suggestion !== null && (
        <p className="note-line">
          {T('fl.suggest', { amount: formatMoney(suggestion) })} · {T('fl.suggestWhy')}{' '}
          {raw !== inputFromMoney(suggestion) && (
            <button type="button" className="link" onClick={() => setRaw(inputFromMoney(suggestion))}>{T('fl.useSuggest')}</button>
          )}
        </p>
      )}
      <p className="note-line">{T('fl.note')}</p>
      <FormError msg={err} />
    </Sheet>
  );
}
