import { useMemo, useState } from 'react';
import { Trash2, RotateCcw, CalendarClock, Repeat } from 'lucide-react';
import type { ID, PlanRef, Tx } from '../domain/types';
import * as A from '../domain/actions';
import { formatMoney, parseMoney } from '../domain/money';
import { addDays, diffDays, dueLabel, shortDate, type ISODate } from '../domain/dates';
import { isInvestment, occurrences, planIsInflow, planIsOutflow, transferKind } from '../domain/ledger';
import { commit } from '../store/store';
import { closeSheet, openSheet } from '../ui/nav';
import { Chip, FormError, MoneyInput, Segmented, Sheet, inputFromMoney } from '../ui/kit';
import { CatIcon, ACCOUNT_ICONS } from '../ui/icons';
import { dailyAccounts, frequentTemplates, recentCategories, useData, useLookups } from '../ui/hooks';

type Tab = 'expense' | 'income' | 'transfer' | 'invest';

const TAB_LABEL: Record<Tab, string> = { expense: 'Gider', income: 'Gelir', transfer: 'Transfer', invest: 'Yatırım' };

function tabOf(tx: Tx, accounts: Map<ID, import('../domain/types').Account>): { tab: Tab; dir: 'in' | 'out' } {
  if (tx.type === 'transfer') {
    const k = transferKind(tx, accounts);
    if (k === 'contribution') return { tab: 'invest', dir: 'in' };
    if (k === 'withdrawal') return { tab: 'invest', dir: 'out' };
    return { tab: 'transfer', dir: 'in' };
  }
  return { tab: tx.type === 'income' ? 'income' : 'expense', dir: 'in' };
}

export function TxSheet({ txId, preset }: { txId?: ID; preset?: { type?: string; direction?: 'in' | 'out'; accountId?: ID } }) {
  const { data, today } = useData();
  const { accounts, cats } = useLookups(data);
  const editing = txId ? data.txs.find((t) => t.id === txId) : undefined;
  const daily = dailyAccounts(data);
  const invAccounts = data.accounts.filter((a) => isInvestment(a) && (!a.archived || a.id === editing?.toAccountId || a.id === editing?.accountId));
  const defaultAcc = (preset?.accountId && accounts.get(preset.accountId) && !isInvestment(accounts.get(preset.accountId)) ? preset.accountId : null)
    ?? (data.settings.lastAccountId && daily.some((d) => d.account.id === data.settings.lastAccountId) ? data.settings.lastAccountId : daily[0]?.account.id ?? '');

  const init = editing ? tabOf(editing, accounts) : { tab: ((preset?.type === 'invest' ? 'invest' : preset?.type) as Tab) ?? 'expense', dir: preset?.direction ?? 'in' };
  const [tab, setTab] = useState<Tab>(init.tab);
  const [dir, setDir] = useState<'in' | 'out'>(init.dir);
  const [amount, setAmount] = useState(editing ? inputFromMoney(editing.amount) : '');
  const [categoryId, setCategoryId] = useState<ID | null>(editing?.categoryId ?? null);
  const initDaily = editing ? (init.tab === 'invest' && init.dir === 'out' ? editing.toAccountId! : editing.accountId) : defaultAcc;
  const [accountId, setAccountId] = useState<ID>(initDaily);
  const otherDaily = daily.find((d) => d.account.id !== defaultAcc)?.account.id ?? '';
  const [toAccountId, setToAccountId] = useState<ID>(editing?.type === 'transfer' && init.tab === 'transfer' ? editing.toAccountId! : otherDaily);
  const [invId, setInvId] = useState<ID>(
    editing && init.tab === 'invest' ? (init.dir === 'in' ? editing.toAccountId! : editing.accountId) : preset?.accountId && isInvestment(accounts.get(preset.accountId)) ? preset.accountId : invAccounts[0]?.id ?? '',
  );
  const [date, setDate] = useState<ISODate>(editing?.date ?? today);
  const [note, setNote] = useState(editing?.note ?? '');
  const [showNote, setShowNote] = useState(!!editing?.note);
  const [planRef, setPlanRef] = useState<PlanRef | undefined>(editing?.planRef);
  const [showAllCats, setShowAllCats] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const catKind = tab === 'income' ? 'income' : 'expense';
  const catList = useMemo(() => {
    const recent = recentCategories(data, catKind);
    const all = data.categories.filter((c) => c.kind === catKind && (!c.archived || c.id === editing?.categoryId));
    const ordered = [...recent.map((id) => all.find((c) => c.id === id)).filter((c): c is NonNullable<typeof c> => !!c), ...all.filter((c) => !recent.includes(c.id))];
    return ordered;
  }, [data, catKind, editing?.categoryId]);
  const visibleCats = showAllCats ? catList : catList.slice(0, 8);
  if (categoryId && !visibleCats.some((c) => c.id === categoryId)) {
    const sel = catList.find((c) => c.id === categoryId);
    if (sel) visibleCats.splice(Math.max(visibleCats.length - 1, 0), 1, sel);
  }

  const templates = !editing && (tab === 'expense' || tab === 'income') ? frequentTemplates(data, tab, today) : [];

  // Bu türdeki yakın tarihli bekleyen planlı kalemler: seçilirse işlem plana bağlanır (iki kez düşülmez).
  const planMatches = useMemo(() => {
    if (editing?.planRef) return [];
    const occ = occurrences(data, addDays(today, -45), addDays(today, 10)).filter((o) => o.status === 'pending');
    return occ
      .filter((o) => {
        if (tab === 'expense') return o.plan.kind === 'expense';
        if (tab === 'income') return o.plan.kind === 'income';
        if (tab === 'invest') return o.plan.kind === 'transfer' && (dir === 'in' ? planIsOutflow(o.plan, accounts) : planIsInflow(o.plan, accounts));
        return o.plan.kind === 'transfer' && !planIsOutflow(o.plan, accounts) && !planIsInflow(o.plan, accounts);
      })
      .slice(0, 3);
  }, [data, today, tab, dir, accounts, editing?.planRef]);

  const linkedPlan = planRef ? data.plans.find((p) => p.id === planRef.planId) : undefined;

  function choosePlan(o: (typeof planMatches)[number]) {
    if (planRef && planRef.planId === o.plan.id && planRef.due === o.due) {
      setPlanRef(undefined);
      return;
    }
    setPlanRef({ planId: o.plan.id, due: o.due });
    setAmount(inputFromMoney(o.plan.amount));
    if (o.plan.kind === 'transfer') {
      if (tab === 'invest') {
        if (dir === 'in') {
          setAccountId(o.plan.accountId);
          setInvId(o.plan.toAccountId!);
        } else {
          setInvId(o.plan.accountId);
          setAccountId(o.plan.toAccountId!);
        }
      } else {
        setAccountId(o.plan.accountId);
        setToAccountId(o.plan.toAccountId!);
      }
    } else {
      setCategoryId(o.plan.categoryId ?? null);
      setAccountId(o.plan.accountId);
    }
    if (!note.trim()) setNote(o.plan.title);
  }

  function switchTab(t: Tab) {
    setTab(t);
    setErr(null);
    if (!editing?.planRef) setPlanRef(undefined);
    if ((t === 'income') !== (tab === 'income')) setCategoryId(null);
  }

  function buildDraft(): A.TxDraft | string {
    const amt = parseMoney(amount);
    if (!amt) return 'Tutarı yaz.';
    if (tab === 'expense' || tab === 'income') {
      if (!categoryId) return 'Bir kategori seç.';
      if (!accountId) return 'Bir hesap seç.';
      return { type: tab, amount: amt, date, accountId, categoryId, note, planRef };
    }
    if (tab === 'transfer') return { type: 'transfer', amount: amt, date, accountId, toAccountId, note, planRef };
    if (!invId) return 'Önce bir yatırım hesabı ekle.';
    return dir === 'in'
      ? { type: 'transfer', amount: amt, date, accountId, toAccountId: invId, note, planRef }
      : { type: 'transfer', amount: amt, date, accountId: invId, toAccountId: accountId, note, planRef };
  }

  function save() {
    const draft = buildDraft();
    if (typeof draft === 'string') return setErr(draft);
    const label = tab === 'invest' ? (dir === 'in' ? 'Yatırıma aktarıldı' : 'Yatırımdan çekildi') : tab === 'transfer' ? 'Transfer kaydedildi' : 'Kaydedildi';
    const e = editing
      ? commit((d, t) => A.updateTx(d, editing.id, draft, t), 'Değişiklik kaydedildi', { pulse: true })
      : commit((d, t) => A.addTx(d, draft, t).data, `${label} · ${formatMoney(draft.amount)}`, { pulse: true });
    if (e) setErr(e);
    else closeSheet();
  }

  function remove() {
    if (!editing) return;
    const refunds = data.txs.filter((t) => t.refundOf === editing.id).length;
    const e = commit((d) => A.deleteTx(d, editing.id).data, refunds ? `Silindi (bağlı ${refunds} iade ile)` : 'Silindi');
    if (e) setErr(e);
    else closeSheet();
  }

  const refundable = editing?.type === 'expense' ? editing.amount - data.txs.filter((t) => t.refundOf === editing.id).reduce((a, t) => a + t.amount, 0) : 0;

  if (daily.length === 0 && !editing) {
    return (
      <Sheet title="İşlem ekle" onClose={closeSheet}>
        <p className="muted">Önce paranın durduğu bir hesap ekle (banka ya da nakit).</p>
        <button className="btn btn--primary" onClick={() => openSheet({ kind: 'account' })}>Hesap ekle</button>
      </Sheet>
    );
  }

  const accountChips = (value: ID, set: (id: ID) => void, exclude?: ID, label = 'Hesap') => (
    <div className="chip-row" role="group" aria-label={label}>
      {daily
        .filter((d) => d.account.id !== exclude)
        .map(({ account, balance }) => {
          const I = ACCOUNT_ICONS[account.kind];
          return (
            <Chip key={account.id} on={value === account.id} onClick={() => set(account.id)}>
              <I size={16} aria-hidden /> {account.name} <span className="chip__meta">{formatMoney(balance)}</span>
            </Chip>
          );
        })}
      {editing && !daily.some((d) => d.account.id === value) && accounts.get(value) && (
        <Chip on>{accounts.get(value)!.name} (arşiv)</Chip>
      )}
    </div>
  );

  const title = editing ? 'İşlemi düzenle' : 'Yeni işlem';
  const saveLabel = editing ? 'Kaydet' : tab === 'invest' ? (dir === 'in' ? 'Yatırıma aktar' : 'Yatırımdan çek') : 'Kaydet';

  return (
    <Sheet
      title={title}
      onClose={closeSheet}
      footer={
        <div className="sheet-actions">
          {editing && (
            <button className="btn btn--ghost btn--danger" onClick={remove}>
              <Trash2 size={18} /> Sil
            </button>
          )}
          {editing && editing.type === 'expense' && refundable > 0 && (
            <button className="btn btn--ghost" onClick={() => openSheet({ kind: 'refund', txId: editing.id })}>
              <RotateCcw size={18} /> İade ekle
            </button>
          )}
          <button className="btn btn--primary btn--grow" onClick={save}>
            {saveLabel}
          </button>
        </div>
      }
    >
      {!(editing && editing.planRef) && (
        <Segmented<Tab>
          label="İşlem türü"
          value={tab}
          onChange={switchTab}
          options={(['expense', 'income', 'transfer', 'invest'] as Tab[]).map((t) => ({ value: t, label: TAB_LABEL[t] }))}
        />
      )}

      {tab === 'invest' && (
        <Segmented
          size="sm"
          label="Yön"
          value={dir}
          onChange={(v) => {
            setDir(v);
            setPlanRef(undefined);
          }}
          options={[
            { value: 'in', label: 'Yatırıma aktar' },
            { value: 'out', label: 'Yatırımdan çek' },
          ]}
        />
      )}

      <MoneyInput big label="Tutar" value={amount} onChange={setAmount} autoFocus={!editing} onEnter={save} />

      {templates.length > 0 && (
        <div className="chip-row chip-row--scroll" role="group" aria-label="Sık işlemler">
          {templates.map((t) => (
            <Chip
              key={t.key}
              className="chip--template"
              onClick={() => {
                setAmount(inputFromMoney(t.amount));
                setCategoryId(t.categoryId);
                setAccountId(t.accountId);
                setNote(t.note ?? '');
                if (t.note) setShowNote(true);
              }}
            >
              <Repeat size={14} aria-hidden /> {t.note ?? cats.get(t.categoryId)?.name} · {formatMoney(t.amount)}
            </Chip>
          ))}
        </div>
      )}

      {planMatches.length > 0 && (
        <div className="plan-match">
          <span className="plan-match__label">
            <CalendarClock size={15} aria-hidden /> Planlı bir kalemi mi ödüyorsun?
          </span>
          <div className="chip-row">
            {planMatches.map((o) => (
              <Chip key={o.plan.id + o.due} on={planRef?.planId === o.plan.id && planRef?.due === o.due} onClick={() => choosePlan(o)}>
                {o.plan.title} · {formatMoney(o.amount)} <span className="chip__meta">{dueLabel(o.due, today)}</span>
              </Chip>
            ))}
          </div>
        </div>
      )}
      {linkedPlan && planRef && (
        <p className="note-line">
          Bu kayıt <b>{linkedPlan.title}</b> ({shortDate(planRef.due)}) planına bağlı; o vade artık bekleyen sayılmaz.
        </p>
      )}

      {(tab === 'expense' || tab === 'income') && (
        <fieldset className="block">
          <legend>{tab === 'income' ? 'Kaynak' : 'Kategori'}</legend>
          <div className="cat-grid">
            {visibleCats.map((c) => (
              <button
                type="button"
                key={c.id}
                className={`cat-btn ${categoryId === c.id ? 'is-on' : ''}`}
                aria-pressed={categoryId === c.id}
                onClick={() => setCategoryId(c.id)}
                style={{ '--cat': c.color } as React.CSSProperties}
              >
                <span className="cat-btn__icon">
                  <CatIcon icon={c.icon} size={18} />
                </span>
                <span className="cat-btn__name">{c.name}</span>
              </button>
            ))}
            {catList.length > 8 && (
              <button type="button" className="cat-btn cat-btn--more" onClick={() => setShowAllCats(!showAllCats)}>
                <span className="cat-btn__name">{showAllCats ? 'Daha az' : `+${catList.length - 8} daha`}</span>
              </button>
            )}
          </div>
        </fieldset>
      )}

      {(tab === 'expense' || tab === 'income') && (
        <fieldset className="block">
          <legend>{tab === 'income' ? 'Hangi hesaba geldi?' : 'Hangi hesaptan?'}</legend>
          {accountChips(accountId, setAccountId)}
        </fieldset>
      )}

      {tab === 'transfer' && (
        <>
          {daily.length < 2 && !editing ? (
            <p className="muted">Transfer için en az iki günlük hesap gerekir. <button className="link" onClick={() => openSheet({ kind: 'account' })}>Hesap ekle</button></p>
          ) : (
            <>
              <fieldset className="block">
                <legend>Nereden</legend>
                {accountChips(accountId, (id) => {
                  setAccountId(id);
                  if (id === toAccountId) setToAccountId(daily.find((d) => d.account.id !== id)?.account.id ?? '');
                })}
              </fieldset>
              <fieldset className="block">
                <legend>Nereye</legend>
                {accountChips(toAccountId, setToAccountId, accountId)}
              </fieldset>
              <p className="note-line">Kendi hesapların arasındaki para hareketi gelir ya da gider sayılmaz.</p>
            </>
          )}
        </>
      )}

      {tab === 'invest' && (
        <>
          {invAccounts.length === 0 ? (
            <div className="empty-inline">
              <p>Henüz yatırım hesabın yok.</p>
              <button className="btn btn--secondary" onClick={() => openSheet({ kind: 'account', kindPreset: 'investment' })}>Yatırım hesabı ekle</button>
            </div>
          ) : (
            <>
              <fieldset className="block">
                <legend>{dir === 'in' ? 'Hangi hesaptan gönderdin?' : 'Hangi hesaba geldi?'}</legend>
                {accountChips(accountId, setAccountId)}
              </fieldset>
              {invAccounts.length > 1 && (
                <fieldset className="block">
                  <legend>Yatırım hesabı</legend>
                  <div className="chip-row">
                    {invAccounts.map((a) => (
                      <Chip key={a.id} on={invId === a.id} onClick={() => setInvId(a.id)}>{a.name}</Chip>
                    ))}
                  </div>
                </fieldset>
              )}
              <p className="note-line">
                {dir === 'in'
                  ? `${accounts.get(invId)?.name ?? 'Yatırım'} hesabına katkı olarak kaydedilir. Harcama sayılmaz.`
                  : 'Günlük hesabına geri döner. Yeni gelir sayılmaz; net katkın azalır.'}
              </p>
            </>
          )}
        </>
      )}

      <div className="row-wrap">
        <div className="chip-row" role="group" aria-label="Tarih">
          <Chip on={date === today} onClick={() => setDate(today)}>Bugün</Chip>
          <Chip on={date === addDays(today, -1)} onClick={() => setDate(addDays(today, -1))}>Dün</Chip>
          <label className={`chip chip--date ${date !== today && date !== addDays(today, -1) ? 'is-on' : ''}`}>
            <span>{date !== today && date !== addDays(today, -1) ? shortDate(date, today) : 'Tarih seç'}</span>
            <input type="date" value={date} max={today} onChange={(e) => e.target.value && setDate(e.target.value)} aria-label="Tarih seç" />
          </label>
        </div>
        {!showNote && (
          <button type="button" className="link" onClick={() => setShowNote(true)}>
            + Not ekle
          </button>
        )}
      </div>
      {showNote && (
        <label className="field">
          <span className="field__label">Not (isteğe bağlı)</span>
          <input className="input" value={note} maxLength={200} onChange={(e) => setNote(e.target.value)} placeholder="ör. kafeterya, kitap" onKeyDown={(e) => e.key === 'Enter' && save()} />
        </label>
      )}
      {date < today && diffDays(today, date) > 1 && <p className="note-line">Tarih: {shortDate(date, today)}</p>}
      <FormError msg={err} />
    </Sheet>
  );
}

// ───────────────────────── İade ─────────────────────────

export function RefundSheet({ txId }: { txId: ID }) {
  const { data, today } = useData();
  const { cats } = useLookups(data);
  const orig = data.txs.find((t) => t.id === txId);
  const editingRefund = orig?.type === 'refund' ? orig : undefined;
  const base = editingRefund ? data.txs.find((t) => t.id === editingRefund.refundOf) : orig;
  const daily = dailyAccounts(data);
  const already = base ? data.txs.filter((t) => t.refundOf === base.id && t.id !== editingRefund?.id).reduce((a, t) => a + t.amount, 0) : 0;
  const max = base ? base.amount - already : 0;
  const [amount, setAmount] = useState(inputFromMoney(editingRefund?.amount ?? max));
  const [accountId, setAccountId] = useState(editingRefund?.accountId ?? base?.accountId ?? daily[0]?.account.id ?? '');
  const [date, setDate] = useState(editingRefund?.date ?? today);
  const [note, setNote] = useState(editingRefund?.note ?? '');
  const [err, setErr] = useState<string | null>(null);
  if (!base) return null;
  const cat = cats.get(base.categoryId ?? '');

  function save() {
    const amt = parseMoney(amount);
    if (!amt) return setErr('Tutarı yaz.');
    const draft: A.TxDraft = { type: 'refund', amount: amt, date, accountId, categoryId: base!.categoryId, refundOf: base!.id, note };
    const e = editingRefund
      ? commit((d, t) => A.updateTx(d, editingRefund.id, draft, t), 'İade güncellendi', { pulse: true })
      : commit((d, t) => A.addTx(d, draft, t).data, `İade kaydedildi · ${formatMoney(amt)}`, { pulse: true });
    if (e) setErr(e);
    else closeSheet();
  }
  function remove() {
    if (!editingRefund) return;
    commit((d) => A.deleteTx(d, editingRefund.id).data, 'İade silindi');
    closeSheet();
  }

  return (
    <Sheet
      title={editingRefund ? 'İadeyi düzenle' : 'İade kaydet'}
      onClose={closeSheet}
      footer={
        <div className="sheet-actions">
          {editingRefund && (
            <button className="btn btn--ghost btn--danger" onClick={remove}>
              <Trash2 size={18} /> Sil
            </button>
          )}
          <button className="btn btn--primary btn--grow" onClick={save}>Kaydet</button>
        </div>
      }
    >
      <div className="linked-tx">
        <span className="linked-tx__icon" style={{ '--cat': cat?.color } as React.CSSProperties}>
          <CatIcon icon={cat?.icon ?? 'dots'} />
        </span>
        <span>
          <b>{base.note || cat?.name}</b>
          <small>
            {shortDate(base.date, today)} · {formatMoney(base.amount)}
            {already > 0 && ` · önceden ${formatMoney(already)} iade`}
          </small>
        </span>
      </div>
      <MoneyInput big label={`İade tutarı (en fazla ${formatMoney(max)})`} value={amount} onChange={setAmount} autoFocus onEnter={save} />
      <fieldset className="block">
        <legend>Hangi hesaba döndü?</legend>
        <div className="chip-row">
          {daily.map(({ account }) => (
            <Chip key={account.id} on={accountId === account.id} onClick={() => setAccountId(account.id)}>{account.name}</Chip>
          ))}
        </div>
      </fieldset>
      <Field2 label="Tarih">
        <input className="input" type="date" value={date} min={base.date} max={today} onChange={(e) => e.target.value && setDate(e.target.value)} />
      </Field2>
      <Field2 label="Not (isteğe bağlı)">
        <input className="input" value={note} maxLength={200} onChange={(e) => setNote(e.target.value)} />
      </Field2>
      <p className="note-line">İade, “{cat?.name}” harcamasını azaltır; gelir olarak sayılmaz.</p>
      <FormError msg={err} />
    </Sheet>
  );
}

function Field2({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      {children}
    </label>
  );
}

// ───────────────────────── Planlı kalemi onayla ─────────────────────────

export function ConfirmSheet({ planId, due }: { planId: ID; due: ISODate }) {
  const { data, today } = useData();
  const { accounts, cats } = useLookups(data);
  const plan = data.plans.find((p) => p.id === planId);
  const daily = dailyAccounts(data);
  const [amount, setAmount] = useState(inputFromMoney(plan?.amount));
  const [date, setDate] = useState(due <= today ? due : today);
  const [accountId, setAccountId] = useState(plan?.accountId ?? '');
  const [err, setErr] = useState<string | null>(null);
  if (!plan) return null;
  const occ = occurrences(data, due, due, [plan])[0];
  const skipped = occ?.status === 'skipped';
  const verb = plan.kind === 'income' ? 'Geldi' : plan.kind === 'transfer' ? 'Aktarıldı' : 'Ödendi';

  function save() {
    const amt = parseMoney(amount);
    if (!amt) return setErr('Tutarı yaz.');
    const e = commit((d, t) => A.confirmOccurrence(d, planId, due, { amount: amt, date, accountId: plan!.kind === 'transfer' ? undefined : accountId }, t).data, `${plan!.title}: ${verb.toLocaleLowerCase('tr')} olarak kaydedildi`, { pulse: true });
    if (e) setErr(e);
    else closeSheet();
  }
  function skip() {
    commit((d) => A.skipOccurrence(d, planId, due, !skipped), skipped ? 'Atlama geri alındı' : `${plan!.title} (${shortDate(due)}) bu sefer atlandı`);
    closeSheet();
  }
  const cat = plan.categoryId ? cats.get(plan.categoryId) : undefined;

  return (
    <Sheet
      title={plan.title}
      onClose={closeSheet}
      footer={
        <div className="sheet-actions">
          <button className="btn btn--ghost" onClick={skip}>{skipped ? 'Atlamayı geri al' : 'Bu sefer atla'}</button>
          <button className="btn btn--primary btn--grow" onClick={save}>{verb}, kaydet</button>
        </div>
      }
    >
      <p className="muted">
        Vade: {shortDate(due, today)} ({dueLabel(due, today)}){cat ? ` · ${cat.name}` : ''}
        {plan.kind === 'transfer' && ` · ${accounts.get(plan.accountId)?.name} → ${accounts.get(plan.toAccountId!)?.name}`}
      </p>
      <MoneyInput big label="Gerçekleşen tutar" value={amount} onChange={setAmount} autoFocus onEnter={save} />
      {plan.kind !== 'transfer' && (
        <fieldset className="block">
          <legend>Hesap</legend>
          <div className="chip-row">
            {daily.map(({ account }) => (
              <Chip key={account.id} on={accountId === account.id} onClick={() => setAccountId(account.id)}>{account.name}</Chip>
            ))}
          </div>
        </fieldset>
      )}
      <Field2 label="Gerçekleşme tarihi">
        <input className="input" type="date" value={date} max={today} onChange={(e) => e.target.value && setDate(e.target.value)} />
      </Field2>
      <p className="note-line">
        Kaydedince gerçek bir {plan.kind === 'income' ? 'gelir' : plan.kind === 'transfer' ? 'aktarım' : 'gider'} oluşur ve bu vade “bekleyen” listesinden çıkar; kullanılabilir paradan ikinci kez düşülmez.
      </p>
      <FormError msg={err} />
    </Sheet>
  );
}

export function isRefund(tx: Tx) {
  return tx.type === 'refund';
}
