import { useState } from 'react';
import { Trash2, Archive, ArchiveRestore, Ban, RotateCw } from 'lucide-react';
import type { AccountKind, Freq, ID, PlanKind } from '../domain/types';
import * as A from '../domain/actions';
import { catName, formatMoney, moneyUnit, parseMoney, shortDate } from '../i18n/format';
import { useT } from '../i18n';
import type { Key } from '../i18n/core';
import { cashBalance, installmentEnd, investmentState, isDaily, isInvestment } from '../domain/ledger';
import { commit } from '../store/store';
import { closeSheet, openSheet } from '../ui/nav';
import { Chip, Field, FormError, MoneyInput, Segmented, Sheet, inputFromMoney } from '../ui/kit';
import { CATEGORY_COLORS, CATEGORY_ICONS, CatIcon } from '../ui/icons';
import { dailyAccounts, useData, useLookups } from '../ui/hooks';
import { AssetModePicker, OpeningLots, lotRowsFrom, newLotRow, parseLotRows, useManualPrice, type LotRow } from './AssetFields';

const parseSigned = (raw: string) => {
  const t = raw.trim();
  if (!t || /^0+([.,]0*)?$/.test(t)) return 0;
  const neg = t.startsWith('-');
  const v = parseMoney(neg ? t.slice(1) : t);
  return v === null ? null : neg ? -v : v;
};

// ───────────────────────── Hesap ─────────────────────────
export function AccountSheet({ accountId, kindPreset }: { accountId?: ID; kindPreset?: 'investment' | 'person' }) {
  const T = useT();
  const { data, today } = useData();
  const acc = accountId ? data.accounts.find((a) => a.id === accountId) : undefined;
  const used = acc ? A.isAccountUsed(data, acc.id) : false;
  const [name, setName] = useState(acc?.name ?? (kindPreset === 'investment' ? T('acc.defaultInvName') : ''));
  const [kind, setKind] = useState<AccountKind>(acc?.kind ?? kindPreset ?? 'bank');
  const [opening, setOpening] = useState(acc ? inputFromMoney(Math.abs(acc.openingBalance)) : '');
  // Kişi hesabında açılış yönü: + o bana borçlu, − ben ona borçluyum
  const [owesDir, setOwesDir] = useState<'none' | 'they' | 'me'>(acc?.kind === 'person' ? (acc.openingBalance > 0 ? 'they' : acc.openingBalance < 0 ? 'me' : 'none') : 'none');
  const [openingDate, setOpeningDate] = useState(acc?.openingDate ?? today);
  const [priorKnown, setPriorKnown] = useState(acc?.priorContribution != null);
  const [prior, setPrior] = useState(inputFromMoney(acc?.priorContribution ?? null));
  const [err, setErr] = useState<string | null>(null);
  // Altın/döviz modu ve "mevcut birikimimi ekle" (tür tür açılış miktarı + fiyat)
  const [assetMode, setAssetMode] = useState(!!acc?.asset);
  const [haveSome, setHaveSome] = useState(!!acc?.asset?.opening.length);
  const [lotRows, setLotRows] = useState<LotRow[]>(() => (acc?.asset?.opening.length ? lotRowsFrom(acc.asset.opening) : [newLotRow()]));
  const assetLocked = !!acc && (data.txs.some((t) => t.accountId === acc.id || t.toAccountId === acc.id) || data.valuations.some((v) => v.accountId === acc.id));
  const isAsset = kind === 'investment' && assetMode;

  function save() {
    let ob = isAsset ? 0 : parseSigned(opening);
    if (ob === null) return setErr(T('kit.amountFormat'));
    let asset: A.AccountDraft['asset'] = null;
    if (isAsset) {
      const r = haveSome ? parseLotRows(lotRows) : { lots: [] };
      if ('error' in r) return setErr(T(r.error));
      asset = { opening: r.lots };
    }
    if (kind === 'person') ob = owesDir === 'none' ? 0 : owesDir === 'they' ? Math.abs(ob) : -Math.abs(ob);
    let pc: number | null = null;
    if (kind === 'investment' && priorKnown) {
      pc = prior.trim() ? parseSigned(prior) : 0;
      if (pc === null || pc < 0) return setErr(T('acc.priorFormat'));
    }
    const draft: A.AccountDraft = { name, kind, openingBalance: ob, openingDate, priorContribution: pc, asset };
    const e = acc ? commit((d) => A.updateAccount(d, acc.id, draft), T('acc.updated')) : commit((d) => A.addAccount(d, draft).data, T('acc.added', { name: name.trim() }));
    if (e) setErr(e);
    else closeSheet();
  }
  function archive() {
    if (!acc) return;
    commit((d) => A.setAccountArchived(d, acc.id, !acc.archived), acc.archived ? T('acc.unarchived') : T('acc.archivedToast'));
    closeSheet();
  }
  function remove() {
    if (!acc) return;
    const e = commit((d) => A.deleteAccount(d, acc.id), T('acc.deleted'));
    if (e) setErr(e);
    else closeSheet();
  }
  const balanceNow = acc && isDaily(acc) ? cashBalance(data, acc.id) : null;

  return (
    <Sheet
      title={acc ? (kind === 'person' ? T('acc.editPerson') : T('inv.editAccount')) : kind === 'investment' ? T('home.addInvestAccount') : kind === 'person' ? T('people.addPerson') : T('home.addAccount')}
      onClose={closeSheet}
      footer={
        <div className="sheet-actions">
          {acc && !used && (
            <button className="btn btn--ghost btn--danger" onClick={remove}>
              <Trash2 size={18} /> {T('common.delete')}
            </button>
          )}
          {acc && used && (
            <button className="btn btn--ghost" onClick={archive}>
              {acc.archived ? <ArchiveRestore size={18} /> : <Archive size={18} />} {acc.archived ? T('acc.unarchive') : T('acc.archive')}
            </button>
          )}
          <button className="btn btn--primary btn--grow" onClick={save}>{T('common.save')}</button>
        </div>
      }
    >
      {!(acc && used) && (
        <Segmented<AccountKind>
          label={T('acc.kindLabel')}
          value={kind}
          onChange={setKind}
          options={[
            { value: 'bank', label: T('acc.kind.bank') },
            { value: 'cash', label: T('acc.kind.cash') },
            { value: 'investment', label: T('acc.kind.investment') },
            { value: 'person', label: T('people.person') },
          ]}
        />
      )}
      {kind === 'investment' && <AssetModePicker value={assetMode} onChange={setAssetMode} locked={assetLocked} />}
      <Field label={kind === 'person' ? T('acc.personName') : T('acc.name')}>
        <input className="input" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} placeholder={kind === 'cash' ? T('acc.ph.cash') : kind === 'bank' ? T('acc.ph.bank') : kind === 'person' ? T('acc.ph.person') : T('acc.ph.inv')} />
      </Field>
      {kind === 'person' ? (
        <div className="callout">
          <p><b>{T('acc.debtQ')}</b> {T('acc.debtQHint')}</p>
          <Segmented size="sm" label={T('acc.debtState')} value={owesDir} onChange={setOwesDir} options={[{ value: 'none', label: T('acc.debtNone') }, { value: 'they', label: T('acc.debtThey') }, { value: 'me', label: T('acc.debtMe') }]} />
          {owesDir !== 'none' && <MoneyInput label={T('csv.amount')} value={opening} onChange={setOpening} />}
        </div>
      ) : isAsset ? (
        <div className="callout">
          <div className="chip-row">
            <Chip on={haveSome} onClick={() => setHaveSome(!haveSome)}>{T('asset.haveSome')}</Chip>
          </div>
          {haveSome && <OpeningLots rows={lotRows} onChange={setLotRows} />}
        </div>
      ) : (
      <MoneyInput
        label={kind === 'investment' ? T('acc.openingInv') : T('acc.opening')}
        value={opening}
        onChange={(v) => setOpening(v)}
        allowZero
        placeholder="0"
      />
      )}
      <Field label={T('acc.trackStart')} hint={T('acc.trackStartHint')}>
        <input className="input" type="date" value={openingDate} max={today} onChange={(e) => e.target.value && setOpeningDate(e.target.value)} />
      </Field>
      {kind === 'investment' && !(isAsset && !haveSome) && (
        <div className="callout">
          <p>
            <b>{T('acc.priorQ')}</b> {T('acc.priorQHint')}
          </p>
          <div className="chip-row">
            <Chip on={!priorKnown} onClick={() => setPriorKnown(false)}>{T('onb.dontKnow')}</Chip>
            <Chip on={priorKnown} onClick={() => setPriorKnown(true)}>{T('onb.know')}</Chip>
          </div>
          {priorKnown && <MoneyInput label={T('acc.priorLabel')} value={prior} onChange={setPrior} allowZero />}
        </div>
      )}
      {acc?.kind === 'person' && (() => {
        const b = cashBalance(data, acc.id);
        return <p className="note-line">{T('acc.personState', { state: b === 0 ? T('people.settled') : b > 0 ? T('acc.owesYouAmt', { amount: formatMoney(b) }) : T('acc.youOweAmt', { amount: formatMoney(-b) }) })}</p>;
      })()}
      {balanceNow !== null && (
        <p className="note-line">{T('acc.balanceNow', { amount: formatMoney(balanceNow) })}</p>
      )}
      {acc?.archived && <p className="note-line">{T('acc.archivedNote')}</p>}
      <FormError msg={err} />
    </Sheet>
  );
}

// ───────────────────────── Yatırım değeri ─────────────────────────
export function ValuationSheet({ accountId }: { accountId: ID }) {
  const { data } = useData();
  if (data.accounts.find((a) => a.id === accountId)?.asset) return <AssetPriceSheet accountId={accountId} />;
  return <ValueSheet accountId={accountId} />;
}

/** Altın/döviz hesabında "değeri güncelle" yerine birim fiyat elle girilir. */
function AssetPriceSheet({ accountId }: { accountId: ID }) {
  const T = useT();
  const { data } = useData();
  const account = data.accounts.find((a) => a.id === accountId)!;
  const [err, setErr] = useState<string | null>(null);
  const { save, body } = useManualPrice(account, () => { closeSheet(); }, setErr);
  return (
    <Sheet title={T('asset.priceTitle')} onClose={closeSheet} footer={<button className="btn btn--primary btn--block" onClick={save}>{T('common.save')}</button>}>
      {body}
      <FormError msg={err} />
    </Sheet>
  );
}

function ValueSheet({ accountId }: { accountId: ID }) {
  const T = useT();
  const { data, today } = useData();
  const st = investmentState(data, accountId);
  const [value, setValue] = useState('');
  const [date, setDate] = useState(today);
  const [note, setNote] = useState('');
  const [err, setErr] = useState<string | null>(null);
  if (!st) return null;
  function save() {
    const v = parseSigned(value);
    if (v === null || v < 0 || !value.trim()) return setErr(T('val.format'));
    const e = commit((d, t) => A.addValuation(d, { accountId, date, value: v, note }, t).data, T('val.saved'), { pulse: true });
    if (e) setErr(e);
    else closeSheet();
  }
  return (
    <Sheet title={T('val.title')} onClose={closeSheet} footer={<button className="btn btn--primary btn--block" onClick={save}>{T('common.save')}</button>}>
      <p className="muted">
        {T('val.q', { name: st.account.name, unit: moneyUnit() })} {T('val.estimate')} <b>{formatMoney(st.currentValue)}</b> ({T('val.lastValue', { date: shortDate(st.lastValuation.date, today) })}
        {st.flowsSinceValuation !== 0 && T('val.flowsSince', { amount: formatMoney(st.flowsSinceValuation, { sign: true }) })}).
      </p>
      <MoneyInput big label={T('csv.value')} value={value} onChange={setValue} autoFocus allowZero onEnter={save} />
      <Field label={T('val.date')} hint={T('val.dateHint')}>
        <input className="input" type="date" value={date} min={st.account.openingDate} max={today} onChange={(e) => e.target.value && setDate(e.target.value)} />
      </Field>
      <Field label={T('txs.noteOpt')}>
        <input className="input" value={note} maxLength={200} onChange={(e) => setNote(e.target.value)} />
      </Field>
      <p className="note-line">{T('val.note')}</p>
      <FormError msg={err} />
    </Sheet>
  );
}

// ───────────────────────── Plan ─────────────────────────
const FREQ: { value: Freq; label: Key }[] = [
  { value: 'monthly', label: 'freq.monthly' },
  { value: 'weekly', label: 'freq.weekly' },
  { value: 'yearly', label: 'freq.yearly' },
  { value: 'once', label: 'freq.once' },
];

export function PlanSheet({ planId, preset }: { planId?: ID; preset?: PlanKind }) {
  const T = useT();
  const { data, today } = useData();
  const plan = planId ? data.plans.find((p) => p.id === planId) : undefined;
  const history = plan ? A.planHasHistory(data, plan.id) : false;
  const daily = dailyAccounts(data);
  const inv = data.accounts.filter((a) => isInvestment(a) && !a.archived);
  const [kind, setKind] = useState<PlanKind>(plan?.kind ?? preset ?? 'expense');
  const [title, setTitle] = useState(plan?.title ?? '');
  const [amount, setAmount] = useState(inputFromMoney(plan?.amount));
  const [categoryId, setCategoryId] = useState<ID | undefined>(plan?.categoryId);
  const [accountId, setAccountId] = useState<ID>(plan?.accountId ?? data.settings.lastAccountId ?? daily[0]?.account.id ?? '');
  const [toAccountId, setToAccountId] = useState<ID>(plan?.toAccountId ?? inv[0]?.id ?? '');
  const [freq, setFreq] = useState<Freq>(plan?.freq ?? 'monthly');
  const [startDate, setStartDate] = useState(plan?.startDate ?? today);
  const [endDate, setEndDate] = useState(plan?.endDate ?? '');
  const [instOn, setInstOn] = useState(!!plan?.installments);
  const [instN, setInstN] = useState(String(plan?.installments ?? 6));
  const [err, setErr] = useState<string | null>(null);
  const { accounts } = useLookups(data);
  const ended = !!plan?.endDate && plan.endDate < today;
  const canInstall = kind === 'expense' && freq === 'monthly';

  function save() {
    const amt = parseMoney(amount);
    if (!amt) return setErr(T('txs.typeAmount'));
    const n = Number(instN);
    const useInst = canInstall && instOn;
    if (useInst && (!Number.isInteger(n) || n < 2 || n > 60)) return setErr(T('err.installmentsRange'));
    const draft: A.PlanDraft = { kind, title, amount: amt, accountId, categoryId, toAccountId, freq, startDate, endDate: useInst ? null : endDate || null, installments: useInst ? n : null };
    const e = plan ? commit((d) => A.updatePlan(d, plan.id, draft), T('plan.updated')) : commit((d) => A.addPlan(d, draft).data, T('plan.added'));
    if (e) setErr(e);
    else closeSheet();
  }
  function remove() {
    if (!plan) return;
    commit((d) => A.deletePlan(d, plan.id), history ? T('plan.deletedKeep') : T('plan.deleted'));
    closeSheet();
  }
  const cats = data.categories.filter((c) => c.kind === (kind === 'income' ? 'income' : 'expense') && (!c.archived || c.id === categoryId));
  const allAccounts = data.accounts.filter((a) => !a.archived || a.id === accountId || a.id === toAccountId);

  return (
    <Sheet
      title={plan ? (ended ? T('plan.endedTitle') : T('plan.editTitle')) : T('home.addPlan')}
      onClose={closeSheet}
      footer={
        <div className="sheet-actions">
          {plan && (
            <button className="btn btn--ghost btn--danger icon-only-phone" onClick={remove} aria-label={T('plan.delete')}>
              <Trash2 size={18} /> <span>{T('common.delete')}</span>
            </button>
          )}
          {plan && !ended && (
            <button className="btn btn--ghost" onClick={() => openSheet({ kind: 'cancelPlan', planId: plan.id })}>
              <Ban size={18} /> {T('plan.cancel')}
            </button>
          )}
          {plan && ended && (
            <button
              className="btn btn--ghost"
              onClick={() => {
                const e = commit((d, t) => A.restartPlan(d, plan.id, t).data, T('plan.restarted', { title: plan.title }));
                if (e) setErr(e);
                else closeSheet();
              }}
            >
              <RotateCw size={18} /> {T('plan.restart')}
            </button>
          )}
          <button className="btn btn--primary btn--grow" onClick={save}>{T('common.save')}</button>
        </div>
      }
    >
      {!history && (
        <Segmented<PlanKind>
          label={T('plan.kindLabel')}
          value={kind}
          onChange={(k) => {
            setKind(k);
            setCategoryId(undefined);
            if (k === 'transfer' && !inv.length) setToAccountId(daily.find((d) => d.account.id !== accountId)?.account.id ?? '');
          }}
          options={[
            { value: 'expense', label: T('plan.kind.expense') },
            { value: 'income', label: T('plan.kind.income') },
            { value: 'transfer', label: T('plan.kind.transfer') },
          ]}
        />
      )}
      <Field label={T('plan.name')}>
        <input className="input" value={title} maxLength={60} onChange={(e) => setTitle(e.target.value)} placeholder={kind === 'income' ? T('plan.ph.income') : kind === 'transfer' ? T('plan.ph.transfer') : T('plan.ph.expense')} />
      </Field>
      <MoneyInput label={T('csv.amount')} value={amount} onChange={setAmount} />
      {kind !== 'transfer' && (
        <fieldset className="block">
          <legend>{kind === 'income' ? T('txs.source') : T('csv.category')}</legend>
          <div className="chip-row">
            {cats.map((c) => (
              <Chip key={c.id} on={categoryId === c.id} onClick={() => setCategoryId(c.id)} color={c.color}>
                <CatIcon icon={c.icon} size={15} /> {catName(c)}
              </Chip>
            ))}
          </div>
        </fieldset>
      )}
      <fieldset className="block">
        <legend>{kind === 'transfer' ? T('txs.from') : kind === 'income' ? T('plan.whichAccountIn') : T('txs.whichAccountOut')}</legend>
        <div className="chip-row">
          {(kind === 'transfer' ? allAccounts : daily.map((d) => d.account)).map((a) => (
            <Chip key={a.id} on={accountId === a.id} onClick={() => setAccountId(a.id)}>{a.name}</Chip>
          ))}
        </div>
      </fieldset>
      {kind === 'transfer' && (
        <fieldset className="block">
          <legend>{T('txs.to')}</legend>
          <div className="chip-row">
            {allAccounts.filter((a) => a.id !== accountId).map((a) => (
              <Chip key={a.id} on={toAccountId === a.id} onClick={() => setToAccountId(a.id)}>{a.name}</Chip>
            ))}
          </div>
          {isDaily(accounts.get(accountId)) && isInvestment(accounts.get(toAccountId)) && <span className="field__hint">{T('plan.investHint')}</span>}
        </fieldset>
      )}
      <fieldset className="block">
        <legend>{T('plan.freq')}</legend>
        {history ? <p className="muted">{T(FREQ.find((f) => f.value === freq)!.label)} {T('plan.freqLocked')}</p> : <Segmented<Freq> size="sm" label={T('plan.freq')} value={freq} onChange={setFreq} options={FREQ.map((f) => ({ value: f.value, label: T(f.label) }))} />}
      </fieldset>
      <div className="two-col">
        <Field label={freq === 'once' ? T('csv.date') : T('plan.firstDue')}>
          <input className="input" type="date" value={startDate} onChange={(e) => e.target.value && setStartDate(e.target.value)} />
        </Field>
        {freq !== 'once' && !(canInstall && instOn) && (
          <Field label={T('plan.endOpt')}>
            <input className="input" type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} />
          </Field>
        )}
      </div>
      {canInstall && (
        <div className="callout">
          <div className="chip-row">
            <Chip on={instOn} onClick={() => setInstOn(!instOn)}>{instOn ? '✓ ' : ''}{T('plan.installment')}</Chip>
          </div>
          {instOn && (
            <>
              <Field label={T('plan.installmentCount')}>
                <input className="input input--small" inputMode="numeric" value={instN} onChange={(e) => setInstN(e.target.value.replace(/\D/g, '').slice(0, 2))} />
              </Field>
              {(() => {
                const a = parseMoney(amount), n = Number(instN);
                return a && n >= 2 && n <= 60 ? <p className="note-line">{T('plan.instCalc', { a: formatMoney(a), n })} <b>{formatMoney(a * n)}</b>. {T('plan.instLast', { date: shortDate(installmentEnd(startDate, n), today) })}</p> : null;
              })()}
              <p className="note-line">{T('plan.instHintPre')} <b>{T('plan.instHintBold')}</b>{T('plan.instHintPost')}</p>
            </>
          )}
        </div>
      )}
      {ended && <p className="note-line">{T('plan.endedNote', { date: shortDate(plan!.endDate!, today) })}</p>}
      <p className="note-line">
        {T('plan.notAuto', { verb: kind === 'income' ? T('due.received') : kind === 'transfer' ? T('due.moved') : T('due.paid') })}
        {kind === 'income' && T('plan.incomeNote')}
      </p>
      <FormError msg={err} />
    </Sheet>
  );
}

// ───────────────────────── Hedef ─────────────────────────
export function GoalSheet({ goalId, accountId }: { goalId?: ID; accountId?: ID }) {
  const T = useT();
  const { data } = useData();
  const goal = goalId ? data.goals.find((g) => g.id === goalId) : undefined;
  const inv = data.accounts.filter(isInvestment);
  const [title, setTitle] = useState(goal?.title ?? '');
  const [target, setTarget] = useState(inputFromMoney(goal?.target));
  const [acc, setAcc] = useState(goal?.accountId ?? accountId ?? inv[0]?.id ?? '');
  const [err, setErr] = useState<string | null>(null);
  function save() {
    const t = parseMoney(target);
    if (!t) return setErr(T('goal.typeAmount'));
    const e = goal ? commit((d) => A.updateGoal(d, goal.id, { title, target: t }), T('goal.updated')) : commit((d) => A.addGoal(d, { title, target: t, accountId: acc }).data, T('goal.added'));
    if (e) setErr(e);
    else closeSheet();
  }
  return (
    <Sheet
      title={goal ? T('goal.editTitle') : T('goal.newTitle')}
      onClose={closeSheet}
      footer={
        <div className="sheet-actions">
          {goal && (
            <button className="btn btn--ghost btn--danger" onClick={() => { commit((d) => A.deleteGoal(d, goal.id), T('goal.deleted')); closeSheet(); }}>
              <Trash2 size={18} /> {T('common.delete')}
            </button>
          )}
          <button className="btn btn--primary btn--grow" onClick={save}>{T('common.save')}</button>
        </div>
      }
    >
      <Field label={T('goal.name')}>
        <input className="input" value={title} maxLength={60} onChange={(e) => setTitle(e.target.value)} placeholder={T('goal.ph')} />
      </Field>
      <MoneyInput label={T('goal.target')} value={target} onChange={setTarget} />
      {!goal && inv.length > 1 && (
        <fieldset className="block">
          <legend>{T('csv.invAccount')}</legend>
          <div className="chip-row">
            {inv.map((a) => <Chip key={a.id} on={acc === a.id} onClick={() => setAcc(a.id)}>{a.name}</Chip>)}
          </div>
        </fieldset>
      )}
      <p className="note-line">{T('goal.note')}</p>
      <FormError msg={err} />
    </Sheet>
  );
}

// ───────────────────────── Kategori ─────────────────────────
export function CategorySheet({ categoryId, catKind }: { categoryId?: ID; catKind?: 'expense' | 'income' }) {
  const T = useT();
  const { data } = useData();
  const cat = categoryId ? data.categories.find((c) => c.id === categoryId) : undefined;
  const kind = cat?.kind ?? catKind ?? 'expense';
  // Varsayılan kategori seçili dilde gösterilir; ad değiştirilmezse kayıttaki (Türkçe) ad korunur.
  const shownName = cat ? catName(cat) : '';
  const [name, setName] = useState(shownName);
  const [icon, setIcon] = useState(cat?.icon ?? 'dots');
  const [color, setColor] = useState(cat?.color ?? CATEGORY_COLORS[0]);
  const [err, setErr] = useState<string | null>(null);
  const used = cat ? A.isCategoryUsed(data, cat.id) : false;
  function save() {
    const finalName = cat && name.trim() === shownName ? cat.name : name;
    const e = cat ? commit((d) => A.updateCategory(d, cat.id, { name: finalName, icon, color }), T('cat.updated')) : commit((d) => A.addCategory(d, { kind, name, icon, color }).data, T('cat.added'));
    if (e) setErr(e);
    else closeSheet();
  }
  function remove() {
    if (!cat) return;
    if (cat.archived) commit((d) => A.updateCategory(d, cat.id, { archived: false }), T('cat.restored'));
    else commit((d) => A.removeCategory(d, cat.id), used ? T('cat.archivedToast') : T('cat.deleted'));
    closeSheet();
  }
  return (
    <Sheet
      title={cat ? T('cat.editTitle') : kind === 'income' ? T('cat.addIncome') : T('cat.addTitle')}
      onClose={closeSheet}
      footer={
        <div className="sheet-actions">
          {cat && (
            <button className="btn btn--ghost" onClick={remove}>
              {cat.archived ? <ArchiveRestore size={18} /> : used ? <Archive size={18} /> : <Trash2 size={18} />} {cat.archived ? T('cat.restore') : used ? T('acc.archive') : T('common.delete')}
            </button>
          )}
          <button className="btn btn--primary btn--grow" onClick={save}>{T('common.save')}</button>
        </div>
      }
    >
      <Field label={T('plan.name')}>
        <input className="input" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} />
      </Field>
      <fieldset className="block">
        <legend>{T('cat.icon')}</legend>
        <div className="icon-grid">
          {Object.keys(CATEGORY_ICONS).map((k) => (
            <button type="button" key={k} className={`icon-pick ${icon === k ? 'is-on' : ''}`} aria-pressed={icon === k} aria-label={k} onClick={() => setIcon(k)} style={{ '--cat': color } as React.CSSProperties}>
              <CatIcon icon={k} />
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset className="block">
        <legend>{T('cat.color')}</legend>
        <div className="swatches">
          {CATEGORY_COLORS.map((c) => (
            <button type="button" key={c} className={`swatch ${color === c ? 'is-on' : ''}`} style={{ background: c }} aria-label={T('cat.colorAria', { c })} aria-pressed={color === c} onClick={() => setColor(c)} />
          ))}
        </div>
      </fieldset>
      <FormError msg={err} />
    </Sheet>
  );
}

// ───────────────────────── Bütçe ve limit ─────────────────────────
export function BudgetSheet() {
  const T = useT();
  const { data } = useData();
  const [raw, setRaw] = useState(inputFromMoney(data.settings.monthlyBudget));
  const [err, setErr] = useState<string | null>(null);
  function save() {
    const v = raw.trim() ? parseMoney(raw) : null;
    if (raw.trim() && !v) return setErr(T('bs.format'));
    const e = commit((d) => A.updateSettings(d, { monthlyBudget: v }), v ? T('bs.saved') : T('bs.removed'));
    if (e) setErr(e);
    else closeSheet();
  }
  return (
    <Sheet
      title={T('bs.title')}
      onClose={closeSheet}
      footer={
        <div className="sheet-actions">
          {data.settings.monthlyBudget && (
            <button className="btn btn--ghost" onClick={() => { commit((d) => A.updateSettings(d, { monthlyBudget: null }), T('bs.removed')); closeSheet(); }}>
              {T('bs.remove')}
            </button>
          )}
          <button className="btn btn--primary btn--grow" onClick={save}>{T('common.save')}</button>
        </div>
      }
    >
      <MoneyInput big label={T('bs.q')} value={raw} onChange={setRaw} autoFocus onEnter={save} />
      <p className="note-line">{T('bs.note')}</p>
      <FormError msg={err} />
    </Sheet>
  );
}

export function LimitSheet({ categoryId }: { categoryId?: ID }) {
  const T = useT();
  const { data } = useData();
  const cats = data.categories.filter((c) => c.kind === 'expense' && !c.archived);
  const [cat, setCat] = useState<ID | undefined>(categoryId);
  const current = cats.find((c) => c.id === cat);
  const [raw, setRaw] = useState(inputFromMoney(current?.limit));
  const [err, setErr] = useState<string | null>(null);
  function save() {
    if (!cat) return setErr(T('err.pickCategory'));
    const v = parseMoney(raw);
    if (!v) return setErr(T('lim.typeAmount'));
    const e = commit((d) => A.updateCategory(d, cat, { limit: v }), T('lim.saved'));
    if (e) setErr(e);
    else closeSheet();
  }
  return (
    <Sheet
      title={T('lim.title')}
      onClose={closeSheet}
      footer={
        <div className="sheet-actions">
          {current?.limit && (
            <button className="btn btn--ghost" onClick={() => { commit((d) => A.updateCategory(d, cat!, { limit: null }), T('lim.removed')); closeSheet(); }}>
              {T('lim.remove')}
            </button>
          )}
          <button className="btn btn--primary btn--grow" onClick={save}>{T('common.save')}</button>
        </div>
      }
    >
      {!categoryId && (
        <fieldset className="block">
          <legend>{T('csv.category')}</legend>
          <div className="chip-row">
            {cats.map((c) => (
              <Chip key={c.id} on={cat === c.id} color={c.color} onClick={() => { setCat(c.id); setRaw(inputFromMoney(c.limit)); }}>
                <CatIcon icon={c.icon} size={15} /> {catName(c)}
              </Chip>
            ))}
          </div>
        </fieldset>
      )}
      <MoneyInput label={current ? T('lim.forCat', { cat: catName(current) }) : T('lim.monthly')} value={raw} onChange={setRaw} onEnter={save} />
      <p className="note-line">{T('lim.note')}</p>
      <FormError msg={err} />
    </Sheet>
  );
}
