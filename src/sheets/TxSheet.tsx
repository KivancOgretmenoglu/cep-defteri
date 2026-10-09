import { useEffect, useMemo, useState } from 'react';
import { Trash2, RotateCcw, CalendarClock, Repeat, UserRound, Split, Tag, X } from 'lucide-react';
import type { ID, PlanRef, Tx } from '../domain/types';
import * as A from '../domain/actions';
import { addDays, diffDays, type ISODate } from '../domain/dates';
import { catName, dueLabel, formatMoney, lower, parseMoney, shortDate } from '../i18n/format';
import { useT } from '../i18n';
import type { Key } from '../i18n/core';
import { AssetQtyFields, type AssetValue } from './AssetFields';
import { allTags, cashBalance, isInvestment, isPerson, occurrences, planIsInflow, planIsOutflow, transferKind } from '../domain/ledger';
import { mascotEvent, type MascotEvent } from '../mascot/events';
import { commit } from '../store/store';
import { closeSheet, openSheet, type SheetState } from '../ui/nav';
import { discardTxDraft, stashTxDraft, takeTxDraft, type TxSnap } from './txDraft';
import { Chip, FormError, MoneyInput, Segmented, Sheet, inputFromMoney } from '../ui/kit';
import { CatIcon, ACCOUNT_ICONS } from '../ui/icons';
import { categoryOrder, dailyAccounts, frequentTemplates, useData, useLookups } from '../ui/hooks';
import { quickAmounts } from '../domain/smart';

type Tab = 'expense' | 'income' | 'transfer' | 'invest' | 'debt';

const TAB_LABEL: Record<Tab, Key> = { expense: 'tx.expense', income: 'tx.income', transfer: 'tx.transfer', invest: 'txs.kindInvest', debt: 'txs.kindDebt' };

function tabOf(tx: Tx, accounts: Map<ID, import('../domain/types').Account>): { tab: Tab; dir: 'in' | 'out' } {
  if (tx.type === 'transfer') {
    const k = transferKind(tx, accounts);
    if (k === 'contribution') return { tab: 'invest', dir: 'in' };
    if (k === 'withdrawal') return { tab: 'invest', dir: 'out' };
    // Borç: günlük → kişi "ben verdim" (out), kişi → günlük "ben aldım" (in)
    if (k === 'debt') return { tab: 'debt', dir: isPerson(accounts.get(tx.toAccountId ?? '')) ? 'out' : 'in' };
    return { tab: 'transfer', dir: 'in' };
  }
  return { tab: tx.type === 'income' ? 'income' : 'expense', dir: 'in' };
}

export function TxSheet({ txId, preset }: { txId?: ID; preset?: { type?: string; direction?: 'in' | 'out'; accountId?: ID; personId?: ID; paidByPerson?: boolean } }) {
  const T = useT();
  const { data, today } = useData();
  const { accounts, cats } = useLookups(data);
  const editing = txId ? data.txs.find((t) => t.id === txId) : undefined;
  const daily = dailyAccounts(data);
  const hide = data.settings.hideTotals;
  const persons = data.accounts.filter((a) => isPerson(a) && (!a.archived || a.id === editing?.accountId || a.id === editing?.toAccountId));
  const invAccounts = data.accounts.filter((a) => isInvestment(a) && (!a.archived || a.id === editing?.toAccountId || a.id === editing?.accountId));
  const defaultAcc = (preset?.accountId && accounts.get(preset.accountId) && !isInvestment(accounts.get(preset.accountId)) ? preset.accountId : null)
    ?? (data.settings.lastAccountId && daily.some((d) => d.account.id === data.settings.lastAccountId) ? data.settings.lastAccountId : daily[0]?.account.id ?? '');

  // "+ Yeni kategori/hesap"tan dönüşse yazılanlar geri yüklenir; yeni oluşturulan kayıt seçilir.
  const [rs] = useState(takeTxDraft);
  useEffect(() => { discardTxDraft(); }, []);
  const newCat = rs ? data.categories.find((c) => !rs.catIds.includes(c.id)) : undefined;
  const newAcc = rs ? data.accounts.find((a) => !rs.accIds.includes(a.id)) : undefined;
  const newDaily = newAcc && daily.some((d) => d.account.id === newAcc.id) ? newAcc.id : undefined;
  const pick = <K extends keyof TxSnap>(k: K, orig: TxSnap[K]): TxSnap[K] => (rs ? rs[k] : orig);

  const init = editing ? tabOf(editing, accounts) : { tab: ((preset?.type === 'invest' ? 'invest' : preset?.type) as Tab) ?? 'expense', dir: preset?.direction ?? 'in' };
  const [tab, setTab] = useState<Tab>(pick('tab', init.tab) as Tab);
  const [dir, setDir] = useState<'in' | 'out'>(pick('dir', init.dir));
  const [amount, setAmount] = useState(pick('amount', editing ? inputFromMoney(editing.amount) : ''));
  const [categoryId, setCategoryId] = useState<ID | null>(newCat && newCat.kind === (pick('tab', '') === 'income' ? 'income' : 'expense') ? newCat.id : pick('categoryId', editing?.categoryId ?? null));
  const initDaily = editing
    ? (init.tab === 'invest' && init.dir === 'out') || (init.tab === 'debt' && init.dir === 'in')
      ? editing.toAccountId!
      : editing.accountId
    : preset?.paidByPerson && preset.personId
      ? preset.personId
      : defaultAcc;
  const newPerson = newAcc && isPerson(newAcc) ? newAcc.id : undefined;
  const [personId, setPersonId] = useState<ID>(
    (rs?.target !== 'splitPerson' && newPerson) ||
      pick('personId', editing && init.tab === 'debt' ? (init.dir === 'out' ? editing.toAccountId! : editing.accountId) : preset?.personId ?? persons[0]?.id ?? ''),
  );
  const [split, setSplit] = useState(pick('split', false));
  const [splitPerson, setSplitPerson] = useState<ID>((rs?.target === 'splitPerson' && newPerson) || pick('splitPerson', persons[0]?.id ?? ''));
  const [splitShare, setSplitShare] = useState(pick('splitShare', ''));
  const [tags, setTags] = useState<string[]>(pick('tags', editing?.tags ?? []));
  const [tagInput, setTagInput] = useState(pick('tagInput', ''));
  const [accountId, setAccountId] = useState<ID>((newDaily && rs?.target !== 'toAccountId' && rs?.target !== 'invId' ? newDaily : undefined) ?? pick('accountId', initDaily));
  const otherDaily = daily.find((d) => d.account.id !== defaultAcc)?.account.id ?? '';
  const [toAccountId, setToAccountId] = useState<ID>((newDaily && rs?.target === 'toAccountId' ? newDaily : undefined) ?? pick('toAccountId', editing?.type === 'transfer' && init.tab === 'transfer' ? editing.toAccountId! : otherDaily));
  const [invId, setInvId] = useState<ID>(
    (newAcc && isInvestment(newAcc) ? newAcc.id : undefined) ?? pick('invId', editing && init.tab === 'invest' ? (init.dir === 'in' ? editing.toAccountId! : editing.accountId) : preset?.accountId && isInvestment(accounts.get(preset.accountId)) ? preset.accountId : invAccounts[0]?.id ?? ''),
  );
  const [date, setDate] = useState<ISODate>(pick('date', editing?.date ?? today) as ISODate);
  const [note, setNote] = useState(pick('note', editing?.note ?? ''));
  const [showNote, setShowNote] = useState(pick('showNote', !!editing?.note || !!editing?.tags?.length));
  const [planRef, setPlanRef] = useState<PlanRef | undefined>(pick('planRef', editing?.planRef));
  const [showAllCats, setShowAllCats] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  // Altın/döviz hesabına katkı/çekimde miktar + birim fiyat (yalnız Yatırım sekmesi)
  const [assetVal, setAssetVal] = useState<AssetValue | null>(null);

  const catKind = tab === 'income' ? 'income' : 'expense';

  // Yeni kategori/hesap sayfasını aç; form kaybolmasın diye önce taslağa kaydedilir.
  function openNew(next: SheetState, target: TxSnap['target'] = 'accountId') {
    const back: SheetState = editing ? { kind: 'edit', txId: editing.id } : { kind: 'add', preset: preset as Extract<SheetState, { kind: 'add' }>['preset'] };
    stashTxDraft(
      { tab, dir, amount, categoryId, personId, split, splitPerson, splitShare, tags, tagInput, accountId, toAccountId, invId, date, note, showNote, planRef, target, catIds: data.categories.map((c) => c.id), accIds: data.accounts.map((a) => a.id) },
      back,
      next,
    );
  }
  // Sıra açılışta bir kez hesaplanır: sayfa açıkken ızgara kaymasın (kayıt eklenince yer değiştirmesin).
  const [catOrder] = useState(() => {
    const hour = new Date().getHours();
    return { expense: categoryOrder(data, 'expense', today, hour), income: categoryOrder(data, 'income', today, hour) };
  });
  const catList = useMemo(() => {
    const ranked = catOrder[catKind];
    const all = data.categories.filter((c) => c.kind === catKind && (!c.archived || c.id === editing?.categoryId));
    const ordered = [...ranked.map((id) => all.find((c) => c.id === id)).filter((c): c is NonNullable<typeof c> => !!c), ...all.filter((c) => !ranked.includes(c.id))];
    return ordered;
  }, [data, catKind, catOrder, editing?.categoryId]);
  const visibleCats = showAllCats ? catList : catList.slice(0, 8);
  if (categoryId && !visibleCats.some((c) => c.id === categoryId)) {
    const sel = catList.find((c) => c.id === categoryId);
    if (sel) visibleCats.splice(Math.max(visibleCats.length - 1, 0), 1, sel);
  }

  const templates = !editing && (tab === 'expense' || tab === 'income') ? frequentTemplates(data, tab, today) : [];
  // Sık girilen yuvarlak tutarlar (yalnız yeni gider/gelir): dokununca tutarı doldurur, kaydetmez.
  const [amountChips] = useState(() => ({ expense: quickAmounts(data, 'expense', today), income: quickAmounts(data, 'income', today) }));
  // Kalıp çipinin zaten önerdiği tutar tekrar gösterilmez (aynı satır iki kez görünmesin).
  const quick = !editing && !planRef && (tab === 'expense' || tab === 'income') ? amountChips[tab].filter((m) => !templates.some((t) => t.amount === m)) : [];

  // Bu türdeki yakın tarihli bekleyen planlı kalemler: seçilirse işlem plana bağlanır (iki kez düşülmez).
  const planMatches = useMemo(() => {
    if (editing?.planRef) return [];
    const occ = occurrences(data, addDays(today, -45), addDays(today, 10)).filter((o) => o.status === 'pending');
    return occ
      .filter((o) => {
        if (tab === 'expense') return o.plan.kind === 'expense';
        if (tab === 'income') return o.plan.kind === 'income';
        if (tab === 'debt') return false;
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
    if (!amt) return T('txs.typeAmount');
    if (tab === 'expense' || tab === 'income') {
      if (!categoryId) return T('err.pickCategory');
      if (!accountId) return T('err.pickAccount');
      return { type: tab, amount: amt, date, accountId, categoryId, note, planRef, tags };
    }
    if (tab === 'transfer') return { type: 'transfer', amount: amt, date, accountId, toAccountId, note, planRef, tags };
    if (tab === 'debt') {
      if (!personId) return T('txs.pickPerson');
      return dir === 'out'
        ? { type: 'transfer', amount: amt, date, accountId, toAccountId: personId, note, tags }
        : { type: 'transfer', amount: amt, date, accountId: personId, toAccountId: accountId, note, tags };
    }
    if (!invId) return T('txs.addInvFirst');
    const assetPart = accounts.get(invId)?.asset ? assetVal : undefined;
    if (assetPart === null) return T('err.assetPrice');
    return dir === 'in'
      ? { type: 'transfer', amount: amt, date, accountId, toAccountId: invId, note, planRef, tags, ...assetPart }
      : { type: 'transfer', amount: amt, date, accountId: invId, toAccountId: accountId, note, planRef, tags, ...assetPart };
  }

  function eventFor(d: A.TxDraft): MascotEvent {
    if (d.planRef) return { type: 'plan-confirmed', kind: d.type === 'income' ? 'income' : d.type === 'transfer' ? 'transfer' : 'expense', amount: d.amount };
    if (d.type === 'expense') return { type: 'expense', categoryId: d.categoryId, amount: d.amount, note: d.note };
    if (d.type === 'income') return { type: 'income', categoryId: d.categoryId, amount: d.amount };
    if (tab === 'invest') return dir === 'in' ? { type: 'invest', amount: d.amount } : { type: 'withdraw', amount: d.amount };
    if (tab === 'debt') return { type: 'debt', amount: d.amount };
    return { type: 'transfer', amount: d.amount };
  }

  function addTagFromInput() {
    const next = A.normalizeTags([...tags, ...tagInput.split(',')]);
    setTags(next);
    setTagInput('');
  }

  function save() {
    if (tagInput.trim()) addTagFromInput();
    const built = buildDraft();
    if (typeof built === 'string') return setErr(built);
    const draft: A.TxDraft = { ...built, tags: A.normalizeTags([...(built.tags ?? []), ...tagInput.split(',')]) };
    const label = tab === 'invest' ? (dir === 'in' ? T('txs.savedInvestIn') : T('txs.savedInvestOut')) : tab === 'transfer' ? T('txs.savedTransfer') : tab === 'debt' ? T('txs.savedDebt') : T('txs.saved');
    let e: string | null;
    if (!editing && split && tab === 'expense') {
      // Hesabı bölüş: toplamdan arkadaşın payı alacak olarak ayrılır, kalanı senin giderindir.
      const share = parseMoney(splitShare);
      if (!splitPerson) return setErr(T('txs.splitPickPerson'));
      if (!share || share >= draft.amount) return setErr(T('txs.splitShareTooBig'));
      if (isPerson(accounts.get(draft.accountId))) return setErr(T('txs.splitOwnOnly'));
      const who = accounts.get(splitPerson)?.name ?? '';
      e = commit(
        (d, t) => {
          const mine = A.addTx(d, { ...draft, amount: draft.amount - share, note: draft.note || undefined }, t).data;
          return A.addTx(mine, { type: 'transfer', amount: share, date: draft.date, accountId: draft.accountId, toAccountId: splitPerson, note: `${draft.note?.trim() || T('txs.splitBill')} · ${T('txs.splitShareOf', { name: who })}`, tags: draft.tags }, t).data;
        },
        T('txs.splitDone', { mine: formatMoney(draft.amount - share), name: who, share: formatMoney(share) }),
        { pulse: true },
      );
    } else
      e = editing
        ? commit((d, t) => A.updateTx(d, editing.id, draft, t), T('txs.changesSaved'), { pulse: true })
        : commit((d, t) => A.addTx(d, draft, t).data, `${label} · ${formatMoney(draft.amount)}`, { pulse: true });
    if (e) setErr(e);
    else {
      mascotEvent(eventFor(draft));
      closeSheet();
    }
  }

  function remove() {
    if (!editing) return;
    const refunds = data.txs.filter((t) => t.refundOf === editing.id).length;
    const e = commit((d) => A.deleteTx(d, editing.id).data, refunds ? T('txs.deletedWithRefunds', { n: refunds }) : T('txs.deleted'));
    if (e) setErr(e);
    else {
      mascotEvent({ type: 'deleted' });
      closeSheet();
    }
  }

  const refundable = editing?.type === 'expense' ? editing.amount - data.txs.filter((t) => t.refundOf === editing.id).reduce((a, t) => a + t.amount, 0) : 0;

  if (daily.length === 0 && !editing) {
    return (
      <Sheet title={T('app.addTx')} onClose={closeSheet}>
        <p className="muted">{T('txs.needAccount')}</p>
        <button className="btn btn--primary" onClick={() => openSheet({ kind: 'account' })}>{T('home.addAccount')}</button>
      </Sheet>
    );
  }

  const accountChips = (value: ID, set: (id: ID) => void, exclude?: ID, label = T('csv.account'), target: TxSnap['target'] = 'accountId') => (
    <div className="chip-row" role="group" aria-label={label}>
      {daily
        .filter((d) => d.account.id !== exclude)
        .map(({ account, balance }) => {
          const I = ACCOUNT_ICONS[account.kind];
          return (
            <Chip key={account.id} on={value === account.id} onClick={() => set(account.id)}>
              <I size={16} aria-hidden /> {account.name} {!hide && <span className="chip__meta">{formatMoney(balance)}</span>}
            </Chip>
          );
        })}
      {editing && !daily.some((d) => d.account.id === value) && accounts.get(value) && (
        <Chip on>{accounts.get(value)!.name} {T('home.archivedTag')}</Chip>
      )}
      <Chip onClick={() => openNew({ kind: 'account' }, target)}>+ {T('hint.newAccount')}</Chip>
    </div>
  );

  const personChips = (value: ID, set: (id: ID) => void, label = T('people.person'), target: TxSnap['target'] = 'personId') => (
    <div className="chip-row" role="group" aria-label={label}>
      {persons.map((p) => {
        const b = cashBalance(data, p.id);
        return (
          <Chip key={p.id} on={value === p.id} onClick={() => set(p.id)}>
            <UserRound size={15} aria-hidden /> {p.name}
            {b !== 0 && <span className="chip__meta">{b > 0 ? T('txs.chipOwesYou', { amount: formatMoney(b) }) : T('txs.chipYouOwe', { amount: formatMoney(-b) })}</span>}
          </Chip>
        );
      })}
      <Chip onClick={() => openNew({ kind: 'account', kindPreset: 'person' }, target)}>+ {T('people.person')}</Chip>
    </div>
  );

  const title = editing ? T('txs.editTitle') : T('txs.newTitle');
  const saveLabel = editing ? T('common.save') : tab === 'invest' ? (dir === 'in' ? T('txs.investIn') : T('txs.investOut')) : T('common.save');

  return (
    <Sheet
      title={title}
      onClose={closeSheet}
      footer={
        <div className="sheet-actions">
          {editing && (
            <button className="btn btn--ghost btn--danger" onClick={remove}>
              <Trash2 size={18} /> {T('common.delete')}
            </button>
          )}
          {editing && editing.type === 'expense' && refundable > 0 && (
            <button className="btn btn--ghost" onClick={() => openSheet({ kind: 'refund', txId: editing.id })}>
              <RotateCcw size={18} /> {T('txs.addRefund')}
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
          label={T('txs.typeLabel')}
          value={tab}
          onChange={switchTab}
          options={(['expense', 'income', 'transfer', 'invest', 'debt'] as Tab[]).map((t) => ({ value: t, label: T(TAB_LABEL[t]) }))}
        />
      )}

      {tab === 'invest' && (
        <Segmented
          size="sm"
          label={T('txs.direction')}
          value={dir}
          onChange={(v) => {
            setDir(v);
            setPlanRef(undefined);
          }}
          options={[
            { value: 'in', label: T('txs.investIn') },
            { value: 'out', label: T('txs.investOut') },
          ]}
        />
      )}

      <MoneyInput big tour="amount" label={T('csv.amount')} value={amount} onChange={setAmount} autoFocus={!editing} onEnter={save} />


      {(quick.length > 0 || templates.length > 0) && (
        // Hızlı tutarlar ve kalıplar tek kaydırılabilir satırda: kategori ızgarası aşağı itilmesin.
        <div className="chip-row chip-row--scroll quick-row" data-tour="quick">
          {quick.length > 0 && (
            <span className="quick-row__group" role="group" aria-label={T('defaults.quickAmounts')}>
              {quick.map((m) => (
                <Chip key={m} className="chip--amount" on={parseMoney(amount) === m} onClick={() => setAmount(inputFromMoney(m))}>
                  {formatMoney(m)}
                </Chip>
              ))}
            </span>
          )}
          <span className="quick-row__group" role="group" aria-label={T('txs.frequent')}>
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
              <Repeat size={14} aria-hidden /> {t.note ?? catName(cats.get(t.categoryId))} · {formatMoney(t.amount)}
            </Chip>
          ))}
          </span>
        </div>
      )}

      {planMatches.length > 0 && (
        <div className="plan-match">
          <span className="plan-match__label">
            <CalendarClock size={15} aria-hidden /> {T('txs.planMatchQ')}
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
          {T('txs.linkedPre')} <b>{linkedPlan.title}</b> ({shortDate(planRef.due)}){T('txs.linkedPost')}
        </p>
      )}

      {(tab === 'expense' || tab === 'income') && (
        <fieldset className="block">
          <legend>{tab === 'income' ? T('txs.source') : T('csv.category')}</legend>
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
                <span className="cat-btn__name">{catName(c)}</span>
              </button>
            ))}
            <button type="button" className="cat-btn cat-btn--more" data-tour="newCat" onClick={() => openNew({ kind: 'category', catKind })}>
              <span className="cat-btn__name">+ {T('hint.newCategory')}</span>
            </button>
            {catList.length > 8 && (
              <button type="button" className="cat-btn cat-btn--more" onClick={() => setShowAllCats(!showAllCats)}>
                <span className="cat-btn__name">{showAllCats ? T('txs.less') : T('txs.more', { n: catList.length - 8 })}</span>
              </button>
            )}
          </div>
        </fieldset>
      )}

      {(tab === 'expense' || tab === 'income') && (
        <fieldset className="block">
          <legend>{tab === 'income' ? T('txs.whichAccountIn') : T('txs.whichAccountOut')}</legend>
          {accountChips(accountId, setAccountId)}
          {tab === 'expense' && persons.length > 0 && !planRef && (
            <div className="paid-by">
              <span className="paid-by__label">{T('txs.orSomeoneElse')}</span>
              <div className="chip-row">
                {persons.map((p) => (
                  <Chip key={p.id} on={accountId === p.id} onClick={() => { setAccountId(p.id); setSplit(false); }}>
                    <UserRound size={15} aria-hidden /> {T('tx.paidBy', { name: p.name })}
                  </Chip>
                ))}
              </div>
            </div>
          )}
          {tab === 'expense' && isPerson(accounts.get(accountId)) && (
            <p className="note-line">{T('txs.paidByNote', { name: accounts.get(accountId)!.name })}</p>
          )}
        </fieldset>
      )}

      {tab === 'expense' && !editing && !planRef && !isPerson(accounts.get(accountId)) && (
        <div className="split">
          <button type="button" className={`chip ${split ? 'is-on' : ''}`} aria-pressed={split} onClick={() => {
            const next = !split;
            setSplit(next);
            const amt = parseMoney(amount);
            if (next && amt && !splitShare) setSplitShare(inputFromMoney(Math.floor(amt / 2)));
          }}>
            <Split size={15} aria-hidden /> {T('txs.split')}
          </button>
          {split && (
            persons.length === 0 ? (
              <p className="note-line">{T('txs.addPersonFirst')} <button type="button" className="link link--small" onClick={() => openNew({ kind: 'account', kindPreset: 'person' }, 'splitPerson')}>{T('people.addPerson')}</button></p>
            ) : (
              <div className="split__body">
                {personChips(splitPerson, setSplitPerson, T('txs.splitWith'), 'splitPerson')}
                <MoneyInput label={T('txs.theirShare')} value={splitShare} onChange={setSplitShare} />
                {(() => {
                  const total = parseMoney(amount), share = parseMoney(splitShare);
                  return total && share && share < total ? (
                    <p className="note-line">{T('txs.splitNote1')} <b>{formatMoney(total - share)}</b>{T('txs.splitNote2', { name: accounts.get(splitPerson)?.name ?? '' })} <b>{formatMoney(share)}</b>{T('txs.splitNote3', { total: formatMoney(total) })}</p>
                  ) : null;
                })()}
              </div>
            )
          )}
        </div>
      )}

      {tab === 'debt' && (
        <>
          <Segmented
            size="sm"
            label={T('txs.direction')}
            value={dir}
            onChange={setDir}
            options={[
              { value: 'out', label: T('txs.debtOut') },
              { value: 'in', label: T('txs.debtIn') },
            ]}
          />
          <fieldset className="block">
            <legend>{T('txs.withWhom')}</legend>
            {personChips(personId, setPersonId)}
          </fieldset>
          <fieldset className="block">
            <legend>{dir === 'out' ? T('txs.whichAccountGave') : T('txs.whichAccountIn')}</legend>
            {accountChips(accountId, setAccountId)}
          </fieldset>
          <p className="note-line">
            {dir === 'out'
              ? T('txs.debtOutNote')
              : T('txs.debtInNote')}
            {personId && (() => {
              const b = cashBalance(data, personId);
              return b !== 0 ? ' ' + (b > 0 ? T('txs.nowOwesYou', { amount: formatMoney(b) }) : T('txs.nowYouOwe', { amount: formatMoney(-b) })) : '';
            })()}
          </p>
        </>
      )}

      {tab === 'transfer' && (
        <>
          {daily.length < 2 && !editing ? (
            <p className="muted">{T('txs.needTwo')} <button className="link" onClick={() => openNew({ kind: 'account' })}>{T('home.addAccount')}</button></p>
          ) : (
            <>
              <fieldset className="block">
                <legend>{T('txs.from')}</legend>
                {accountChips(accountId, (id) => {
                  setAccountId(id);
                  if (id === toAccountId) setToAccountId(daily.find((d) => d.account.id !== id)?.account.id ?? '');
                })}
              </fieldset>
              <fieldset className="block">
                <legend>{T('txs.to')}</legend>
                {accountChips(toAccountId, setToAccountId, accountId, undefined, 'toAccountId')}
              </fieldset>
              <p className="note-line">{T('txs.transferNote')}</p>
            </>
          )}
        </>
      )}

      {tab === 'invest' && (
        <>
          {invAccounts.length === 0 ? (
            <div className="empty-inline">
              <p>{T('txs.noInv')}</p>
              <button className="btn btn--secondary" onClick={() => openNew({ kind: 'account', kindPreset: 'investment' }, 'invId')}>{T('home.addInvestAccount')}</button>
            </div>
          ) : (
            <>
              <fieldset className="block">
                <legend>{dir === 'in' ? T('txs.whichAccountSent') : T('txs.whichAccountIn')}</legend>
                {accountChips(accountId, setAccountId)}
              </fieldset>
              <fieldset className="block">
                <legend>{T('csv.invAccount')}</legend>
                <div className="chip-row">
                  {invAccounts.map((a) => (
                    <Chip key={a.id} on={invId === a.id} onClick={() => setInvId(a.id)}>{a.name}</Chip>
                  ))}
                  <Chip onClick={() => openNew({ kind: 'account', kindPreset: 'investment' }, 'invId')}>+ {T('hint.newAccount')}</Chip>
                </div>
              </fieldset>
              {accounts.get(invId)?.asset && (
                <AssetQtyFields
                  key={invId + dir}
                  account={accounts.get(invId)!}
                  dir={dir}
                  amount={amount}
                  initial={editing?.qty !== undefined && editing.unit && editing.unitPrice && init.tab === 'invest' && init.dir === dir && (editing.toAccountId === invId || editing.accountId === invId) ? { unit: editing.unit, qty: editing.qty, unitPrice: editing.unitPrice } : undefined}
                  editingTxId={editing?.id}
                  onChange={setAssetVal}
                />
              )}
              <p className="note-line">
                {dir === 'in'
                  ? T('txs.investInNote', { name: accounts.get(invId)?.name ?? T('acc.kind.investment') })
                  : T('txs.investOutNote')}
              </p>
            </>
          )}
        </>
      )}

      <div className="row-wrap">
        <div className="chip-row" role="group" aria-label={T('csv.date')}>
          <Chip on={date === today} onClick={() => setDate(today)}>{T('txs.today')}</Chip>
          <Chip on={date === addDays(today, -1)} onClick={() => setDate(addDays(today, -1))}>{T('txs.yesterday')}</Chip>
          <label className={`chip chip--date ${date !== today && date !== addDays(today, -1) ? 'is-on' : ''}`}>
            <span>{date !== today && date !== addDays(today, -1) ? shortDate(date, today) : T('txs.pickDate')}</span>
            <input type="date" value={date} max={today} onChange={(e) => e.target.value && setDate(e.target.value)} aria-label={T('txs.pickDate')} />
          </label>
        </div>
        {!showNote && (
          <button type="button" className="link" onClick={() => setShowNote(true)}>
            + {T('txs.noteTag')}
          </button>
        )}
      </div>
      {showNote && (
        <>
          <label className="field">
            <span className="field__label">{T('txs.noteOpt')}</span>
            <input className="input" value={note} maxLength={200} onChange={(e) => setNote(e.target.value)} placeholder={T('txs.notePh')} onKeyDown={(e) => e.key === 'Enter' && save()} />
          </label>
          <div className="field">
            <span className="field__label"><Tag size={14} aria-hidden /> {T('txs.tagsOpt')}</span>
            <div className="tag-input">
              {tags.map((t) => (
                <button type="button" key={t} className="tag-pill" onClick={() => setTags(tags.filter((x) => x !== t))} aria-label={T('txs.removeTag', { tag: t })}>
                  #{t} <X size={12} aria-hidden />
                </button>
              ))}
              {tags.length < 5 && (
                <input
                  className="tag-input__field"
                  value={tagInput}
                  maxLength={24}
                  placeholder={tags.length ? T('hint.tagMore') : T('hint.tagPh')}
                  aria-label={T('txs.addTag')}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      if (tagInput.trim()) addTagFromInput();
                    } else if (e.key === 'Backspace' && !tagInput && tags.length) setTags(tags.slice(0, -1));
                  }}
                  onBlur={() => tagInput.trim() && addTagFromInput()}
                />
              )}
            </div>
            {(() => {
              const sugg = allTags(data).map((x) => x.tag).filter((t) => !tags.includes(t) && (!tagInput || t.startsWith(lower(tagInput)))).slice(0, 6);
              return sugg.length ? (
                <div className="chip-row">
                  {sugg.map((t) => <Chip key={t} className="chip--small" onClick={() => { setTags(A.normalizeTags([...tags, t])); setTagInput(''); }}>#{t}</Chip>)}
                </div>
              ) : null;
            })()}
          </div>
        </>
      )}
      {date < today && diffDays(today, date) > 1 && <p className="note-line">{T('txs.dateLine', { date: shortDate(date, today) })}</p>}
      <FormError msg={err} />
    </Sheet>
  );
}

// ───────────────────────── İade ─────────────────────────

export function RefundSheet({ txId }: { txId: ID }) {
  const T = useT();
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
    if (!amt) return setErr(T('txs.typeAmount'));
    const draft: A.TxDraft = { type: 'refund', amount: amt, date, accountId, categoryId: base!.categoryId, refundOf: base!.id, note, tags: base!.tags };
    const e = editingRefund
      ? commit((d, t) => A.updateTx(d, editingRefund.id, draft, t), T('ref.updated'), { pulse: true })
      : commit((d, t) => A.addTx(d, draft, t).data, T('ref.saved', { amount: formatMoney(amt) }), { pulse: true });
    if (e) setErr(e);
    else closeSheet();
  }
  function remove() {
    if (!editingRefund) return;
    commit((d) => A.deleteTx(d, editingRefund.id).data, T('ref.deleted'));
    closeSheet();
  }

  return (
    <Sheet
      title={editingRefund ? T('ref.editTitle') : T('ref.newTitle')}
      onClose={closeSheet}
      footer={
        <div className="sheet-actions">
          {editingRefund && (
            <button className="btn btn--ghost btn--danger" onClick={remove}>
              <Trash2 size={18} /> {T('common.delete')}
            </button>
          )}
          <button className="btn btn--primary btn--grow" onClick={save}>{T('common.save')}</button>
        </div>
      }
    >
      <div className="linked-tx">
        <span className="linked-tx__icon" style={{ '--cat': cat?.color } as React.CSSProperties}>
          <CatIcon icon={cat?.icon ?? 'dots'} />
        </span>
        <span>
          <b>{base.note || catName(cat)}</b>
          <small>
            {shortDate(base.date, today)} · {formatMoney(base.amount)}
            {already > 0 && ` · ${T('ref.already', { amount: formatMoney(already) })}`}
          </small>
        </span>
      </div>
      <MoneyInput big label={T('ref.amount', { max: formatMoney(max) })} value={amount} onChange={setAmount} autoFocus onEnter={save} />
      <fieldset className="block">
        <legend>{T('ref.whichAccount')}</legend>
        <div className="chip-row">
          {daily.map(({ account }) => (
            <Chip key={account.id} on={accountId === account.id} onClick={() => setAccountId(account.id)}>{account.name}</Chip>
          ))}
        </div>
      </fieldset>
      <Field2 label={T('csv.date')}>
        <input className="input" type="date" value={date} min={base.date} max={today} onChange={(e) => e.target.value && setDate(e.target.value)} />
      </Field2>
      <Field2 label={T('txs.noteOpt')}>
        <input className="input" value={note} maxLength={200} onChange={(e) => setNote(e.target.value)} />
      </Field2>
      <p className="note-line">{T('ref.note', { cat: catName(cat) })}</p>
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
  const T = useT();
  const { data, today } = useData();
  const { accounts, cats } = useLookups(data);
  const plan = data.plans.find((p) => p.id === planId);
  const daily = dailyAccounts(data);
  const [amount, setAmount] = useState(inputFromMoney(plan?.amount));
  const [date, setDate] = useState(due <= today ? due : today);
  const [accountId, setAccountId] = useState(plan?.accountId ?? '');
  const [err, setErr] = useState<string | null>(null);
  const [assetVal, setAssetVal] = useState<AssetValue | null>(null);
  if (!plan) return null;
  const assetAcc = plan.kind === 'transfer' ? A.assetSideOf(data, { type: 'transfer', accountId: plan.accountId, toAccountId: plan.toAccountId }) : undefined;
  const occ = occurrences(data, due, due, [plan])[0];
  const skipped = occ?.status === 'skipped';
  const verb = plan.kind === 'income' ? T('due.received') : plan.kind === 'transfer' ? T('due.moved') : T('due.paid');
  const verbLower = plan.kind === 'income' ? T('conf.receivedLower') : plan.kind === 'transfer' ? T('conf.movedLower') : T('conf.paidLower');

  function save() {
    const amt = parseMoney(amount);
    if (!amt) return setErr(T('txs.typeAmount'));
    if (assetAcc && !assetVal) return setErr(T('err.assetPrice'));
    const e = commit((d, t) => A.confirmOccurrence(d, planId, due, { amount: amt, date, accountId: plan!.kind === 'transfer' ? undefined : accountId, ...(assetVal ?? {}) }, t).data, T('conf.saved', { title: plan!.title, verb: verbLower }), { pulse: true });
    if (e) setErr(e);
    else closeSheet();
  }
  function skip() {
    commit((d) => A.skipOccurrence(d, planId, due, !skipped), skipped ? T('bud.unskipped') : T('conf.skipped', { title: plan!.title, date: shortDate(due) }));
    closeSheet();
  }
  const cat = plan.categoryId ? cats.get(plan.categoryId) : undefined;

  return (
    <Sheet
      title={plan.title}
      onClose={closeSheet}
      footer={
        <div className="sheet-actions">
          <button className="btn btn--ghost" onClick={skip}>{skipped ? T('conf.unskip') : T('conf.skip')}</button>
          <button className="btn btn--primary btn--grow" onClick={save}>{T('conf.verbSave', { verb })}</button>
        </div>
      }
    >
      <p className="muted">
        {T('conf.due')} {shortDate(due, today)} ({dueLabel(due, today)}){cat ? ` · ${catName(cat)}` : ''}
        {plan.kind === 'transfer' && ` · ${accounts.get(plan.accountId)?.name} → ${accounts.get(plan.toAccountId!)?.name}`}
      </p>
      <MoneyInput big label={T('conf.actualAmount')} value={amount} onChange={setAmount} autoFocus onEnter={save} />
      {assetAcc && <AssetQtyFields account={assetAcc} dir={assetAcc.id === plan.toAccountId ? 'in' : 'out'} amount={amount} onChange={setAssetVal} />}
      {plan.kind !== 'transfer' && (
        <fieldset className="block">
          <legend>{T('csv.account')}</legend>
          <div className="chip-row">
            {daily.map(({ account }) => (
              <Chip key={account.id} on={accountId === account.id} onClick={() => setAccountId(account.id)}>{account.name}</Chip>
            ))}
          </div>
        </fieldset>
      )}
      <Field2 label={T('conf.actualDate')}>
        <input className="input" type="date" value={date} max={today} onChange={(e) => e.target.value && setDate(e.target.value)} />
      </Field2>
      <p className="note-line">
        {T(plan.kind === 'income' ? 'conf.noteIncome' : plan.kind === 'transfer' ? 'conf.noteTransfer' : 'conf.noteExpense')}
      </p>
      <FormError msg={err} />
    </Sheet>
  );
}

export function isRefund(tx: Tx) {
  return tx.type === 'refund';
}
