import { useState } from 'react';
import { CheckCircle2, SkipForward, Pencil, Ban, Undo2 } from 'lucide-react';
import type { ID } from '../domain/types';
import * as A from '../domain/actions';
import { formatMoney } from '../domain/money';
import { addDays, dueLabel, shortDate, type ISODate } from '../domain/dates';
import { installmentNo, occurrences, planIsInflow } from '../domain/ledger';
import { commit } from '../store/store';
import { closeSheet, openSheet } from '../ui/nav';
import { Field, Sheet } from '../ui/kit';
import { useData, useLookups } from '../ui/hooks';

const verbOf = (k: string) => (k === 'income' ? 'Geldi' : k === 'transfer' ? 'Aktarıldı' : 'Ödendi');

/** Yaklaşan bir vadeye dokununca açılan menü: gerçekleşti / atla / düzenle / iptal. */
export function OccurrenceSheet({ planId, due }: { planId: ID; due: ISODate }) {
  const { data, today } = useData();
  const { accounts } = useLookups(data);
  const plan = data.plans.find((p) => p.id === planId);
  if (!plan) return null;
  const occ = occurrences(data, due, due, [plan])[0];
  const skipped = occ?.status === 'skipped';
  const n = installmentNo(plan, due);
  return (
    <Sheet title={plan.title} onClose={closeSheet}>
      <p className="muted">
        {shortDate(due, today)} · {dueLabel(due, today)} · {planIsInflow(plan, accounts) ? '+' : ''}
        {formatMoney(plan.amount)}
        {n ? ` · ${n}/${plan.installments}. taksit` : ''}
      </p>
      <div className="menu-list">
        <button className="menu-item" onClick={() => openSheet({ kind: 'confirm', planId, due })}>
          <CheckCircle2 size={20} aria-hidden />
          <span>{verbOf(plan.kind)}<small>Gerçekleşen tutarı ve tarihi düzeltip kaydet</small></span>
        </button>
        <button
          className="menu-item"
          onClick={() => {
            commit((d) => A.skipOccurrence(d, planId, due, !skipped), skipped ? 'Atlama geri alındı' : `${plan.title} (${shortDate(due)}) bu sefer atlandı`);
            closeSheet();
          }}
        >
          {skipped ? <Undo2 size={20} aria-hidden /> : <SkipForward size={20} aria-hidden />}
          <span>{skipped ? 'Atlamayı geri al' : 'Bu seferlik atla'}<small>Yalnız bu vade; plan devam eder</small></span>
        </button>
        <button className="menu-item" onClick={() => openSheet({ kind: 'plan', planId })}>
          <Pencil size={20} aria-hidden />
          <span>Planı düzenle<small>Ad, tutar, tarih, hesap</small></span>
        </button>
        <button className="menu-item menu-item--warn" onClick={() => openSheet({ kind: 'cancelPlan', planId })}>
          <Ban size={20} aria-hidden />
          <span>Planı iptal et<small>Bundan sonraki vadeler oluşmaz; geçmiş korunur</small></span>
        </button>
      </div>
    </Sheet>
  );
}

/** Planı belirli bir günden itibaren iptal etme. */
export function CancelPlanSheet({ planId }: { planId: ID }) {
  const { data, today } = useData();
  const plan = data.plans.find((p) => p.id === planId);
  const [from, setFrom] = useState<ISODate>(today);
  const [skipEarlier, setSkipEarlier] = useState(true);
  if (!plan) return null;
  const earlier = occurrences(data, plan.startDate, addDays(from, -1), [plan]).filter((o) => o.status === 'pending');
  const done = occurrences(data, plan.startDate, '9999-12-31', [plan]).filter((o) => o.status === 'done').length;
  function apply() {
    commit((d) => A.cancelPlan(d, planId, from, skipEarlier), `${plan!.title} iptal edildi`);
    closeSheet();
  }
  return (
    <Sheet
      title="Planı iptal et"
      onClose={closeSheet}
      footer={
        <div className="sheet-actions">
          <button className="btn btn--ghost" onClick={closeSheet}>Vazgeç</button>
          <button className="btn btn--primary btn--grow" onClick={apply}>İptal et</button>
        </div>
      }
    >
      <p>
        <b>{plan.title}</b> için seçtiğin günden itibaren yeni vade oluşmaz.{done ? ` Gerçekleşmiş ${done} kayıt ve raporlar olduğu gibi kalır.` : ''} İstersen sonra “Yeniden başlat” diyebilirsin.
      </p>
      <Field label="Hangi günden itibaren?">
        <input className="input" type="date" value={from} min={plan.startDate} onChange={(e) => e.target.value && setFrom(e.target.value)} />
      </Field>
      {earlier.length > 0 && (
        <label className="check-row">
          <input type="checkbox" checked={skipEarlier} onChange={(e) => setSkipEarlier(e.target.checked)} />
          <span>
            Bundan önceki bekleyen {earlier.length} vadeyi de kapat ({earlier.map((o) => shortDate(o.due, today)).join(', ')})
            <small>Ödemediysen ve ödemeyeceksen işaretli bırak; kullanılabilir paradan düşülmeye devam etmesin.</small>
          </span>
        </label>
      )}
      <p className="note-line">Planı tamamen yok etmek istersen düzenleme ekranındaki “Sil”i kullan.</p>
    </Sheet>
  );
}
