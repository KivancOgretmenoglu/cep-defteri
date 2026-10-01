import { useMemo, useState } from 'react';
import { Trash2, RotateCcw, CalendarClock, Repeat, UserRound, Split, Tag, X } from 'lucide-react';
import type { ID, PlanRef, Tx } from '../domain/types';
import * as A from '../domain/actions';
import { formatMoney, parseMoney } from '../domain/money';
import { addDays, diffDays, dueLabel, shortDate, type ISODate } from '../domain/dates';
import { allTags, cashBalance, isInvestment, isPerson, occurrences, planIsInflow, planIsOutflow, transferKind } from '../domain/ledger';
import { clawdEvent, type ClawdEvent } from '../clawd/events';
import { commit } from '../store/store';
import { closeSheet, openSheet } from '../ui/nav';
import { Chip, FormError, MoneyInput, Segmented, Sheet, inputFromMoney } from '../ui/kit';
import { CatIcon, ACCOUNT_ICONS } from '../ui/icons';
import { dailyAccounts, frequentTemplates, recentCategories, useData, useLookups } from '../ui/hooks';

type Tab = 'expense' | 'income' | 'transfer' | 'invest' | 'debt';

const TAB_LABEL: Record<Tab, string> = { expense: 'Gider', income: 'Gelir', transfer: 'Transfer', invest: 'Yatırım', debt: 'Borç' };

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
  const { data, today } = useData();
  const { accounts, cats } = useLookups(data);
  const editing = txId ? data.txs.find((t) => t.id === txId) : undefined;
  const daily = dailyAccounts(data);
  const hide = data.settings.hideTotals;
  const persons = data.accounts.filter((a) => isPerson(a) && (!a.archived || a.id === editing?.accountId || a.id === editing?.toAccountId));
  const invAccounts = data.accounts.filter((a) => isInvestment(a) && (!a.archived || a.id === editing?.toAccountId || a.id === editing?.accountId));
  const defaultAcc = (preset?.accountId && accounts.get(preset.accountId) && !isInvestment(accounts.get(preset.accountId)) ? preset.accountId : null)
    ?? (data.settings.lastAccountId && daily.some((d) => d.account.id === data.settings.lastAccountId) ? data.settings.lastAccountId : daily[0]?.account.id ?? '');

  const init = editing ? tabOf(editing, accounts) : { tab: ((preset?.type === 'invest' ? 'invest' : preset?.type) as Tab) ?? 'expense', dir: preset?.direction ?? 'in' };
  const [tab, setTab] = useState<Tab>(init.tab);
  const [dir, setDir] = useState<'in' | 'out'>(init.dir);
  const [amount, setAmount] = useState(editing ? inputFromMoney(editing.amount) : '');
  const [categoryId, setCategoryId] = useState<ID | null>(editing?.categoryId ?? null);
  const initDaily = editing
    ? (init.tab === 'invest' && init.dir === 'out') || (init.tab === 'debt' && init.dir === 'in')
      ? editing.toAccountId!
      : editing.accountId
    : preset?.paidByPerson && preset.personId
      ? preset.personId
      : defaultAcc;
  const [personId, setPersonId] = useState<ID>(
    editing && init.tab === 'debt' ? (init.dir === 'out' ? editing.toAccountId! : editing.accountId) : preset?.personId ?? persons[0]?.id ?? '',
  );
  const [split, setSplit] = useState(false);
  const [splitPerson, setSplitPerson] = useState<ID>(persons[0]?.id ?? '');
  const [splitShare, setSplitShare] = useState('');
  const [tags, setTags] = useState<string[]>(editing?.tags ?? []);
  const [tagInput, setTagInput] = useState('');
  const [accountId, setAccountId] = useState<ID>(initDaily);
  const otherDaily = daily.find((d) => d.account.id !== defaultAcc)?.account.id ?? '';
  const [toAccountId, setToAccountId] = useState<ID>(editing?.type === 'transfer' && init.tab === 'transfer' ? editing.toAccountId! : otherDaily);
  const [invId, setInvId] = useState<ID>(
    editing && init.tab === 'invest' ? (init.dir === 'in' ? editing.toAccountId! : editing.accountId) : preset?.accountId && isInvestment(accounts.get(preset.accountId)) ? preset.accountId : invAccounts[0]?.id ?? '',
  );
  const [date, setDate] = useState<ISODate>(editing?.date ?? today);
  const [note, setNote] = useState(editing?.note ?? '');
  const [showNote, setShowNote] = useState(!!editing?.note || !!editing?.tags?.length);
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
    if (!amt) return 'Tutarı yaz.';
    if (tab === 'expense' || tab === 'income') {
      if (!categoryId) return 'Bir kategori seç.';
      if (!accountId) return 'Bir hesap seç.';
      return { type: tab, amount: amt, date, accountId, categoryId, note, planRef, tags };
    }
    if (tab === 'transfer') return { type: 'transfer', amount: amt, date, accountId, toAccountId, note, planRef, tags };
    if (tab === 'debt') {
      if (!personId) return 'Bir kişi seç ya da ekle.';
      return dir === 'out'
        ? { type: 'transfer', amount: amt, date, accountId, toAccountId: personId, note, tags }
        : { type: 'transfer', amount: amt, date, accountId: personId, toAccountId: accountId, note, tags };
    }
    if (!invId) return 'Önce bir yatırım hesabı ekle.';
    return dir === 'in'
      ? { type: 'transfer', amount: amt, date, accountId, toAccountId: invId, note, planRef, tags }
      : { type: 'transfer', amount: amt, date, accountId: invId, toAccountId: accountId, note, planRef, tags };
  }

  function eventFor(d: A.TxDraft): ClawdEvent {
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
    const label = tab === 'invest' ? (dir === 'in' ? 'Yatırıma aktarıldı' : 'Yatırımdan çekildi') : tab === 'transfer' ? 'Transfer kaydedildi' : tab === 'debt' ? 'Borç kaydedildi' : 'Kaydedildi';
    let e: string | null;
    if (!editing && split && tab === 'expense') {
      // Hesabı bölüş: toplamdan arkadaşın payı alacak olarak ayrılır, kalanı senin giderindir.
      const share = parseMoney(splitShare);
      if (!splitPerson) return setErr('Bölüşeceğin kişiyi seç.');
      if (!share || share >= draft.amount) return setErr('Arkadaşının payı, toplam tutardan az olmalı.');
      if (isPerson(accounts.get(draft.accountId))) return setErr('Bölüşme, senin ödediğin bir hesap için yapılır.');
      const who = accounts.get(splitPerson)?.name ?? '';
      e = commit(
        (d, t) => {
          const mine = A.addTx(d, { ...draft, amount: draft.amount - share, note: draft.note || undefined }, t).data;
          return A.addTx(mine, { type: 'transfer', amount: share, date: draft.date, accountId: draft.accountId, toAccountId: splitPerson, note: `${draft.note?.trim() || 'Bölüşülen hesap'} · ${who} payı`, tags: draft.tags }, t).data;
        },
        `Bölüşüldü · senin payın ${formatMoney(draft.amount - share)}, ${who} ${formatMoney(share)} borçlu`,
        { pulse: true },
      );
    } else
      e = editing
        ? commit((d, t) => A.updateTx(d, editing.id, draft, t), 'Değişiklik kaydedildi', { pulse: true })
        : commit((d, t) => A.addTx(d, draft, t).data, `${label} · ${formatMoney(draft.amount)}`, { pulse: true });
    if (e) setErr(e);
    else {
      clawdEvent(eventFor(draft));
      closeSheet();
    }
  }

  function remove() {
    if (!editing) return;
    const refunds = data.txs.filter((t) => t.refundOf === editing.id).length;
    const e = commit((d) => A.deleteTx(d, editing.id).data, refunds ? `Silindi (bağlı ${refunds} iade ile)` : 'Silindi');
    if (e) setErr(e);
    else {
      clawdEvent({ type: 'deleted' });
      closeSheet();
    }
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
              <I size={16} aria-hidden /> {account.name} {!hide && <span className="chip__meta">{formatMoney(balance)}</span>}
            </Chip>
          );
        })}
      {editing && !daily.some((d) => d.account.id === value) && accounts.get(value) && (
        <Chip on>{accounts.get(value)!.name} (arşiv)</Chip>
      )}
    </div>
  );

  const personChips = (value: ID, set: (id: ID) => void, label = 'Kişi') => (
    <div className="chip-row" role="group" aria-label={label}>
      {persons.map((p) => {
        const b = cashBalance(data, p.id);
        return (
          <Chip key={p.id} on={value === p.id} onClick={() => set(p.id)}>
            <UserRound size={15} aria-hidden /> {p.name}
            {b !== 0 && <span className="chip__meta">{b > 0 ? `sana ${formatMoney(b)}` : `sen ${formatMoney(-b)}`}</span>}
          </Chip>
        );
      })}
      <Chip onClick={() => openSheet({ kind: 'account', kindPreset: 'person' })}>+ Kişi</Chip>
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
          options={(['expense', 'income', 'transfer', 'invest', 'debt'] as Tab[]).map((t) => ({ value: t, label: TAB_LABEL[t] }))}
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
          {tab === 'expense' && persons.length > 0 && !planRef && (
            <div className="paid-by">
              <span className="paid-by__label">ya da başkası ödedi:</span>
              <div className="chip-row">
                {persons.map((p) => (
                  <Chip key={p.id} on={accountId === p.id} onClick={() => { setAccountId(p.id); setSplit(false); }}>
                    <UserRound size={15} aria-hidden /> {p.name} ödedi
                  </Chip>
                ))}
              </div>
            </div>
          )}
          {tab === 'expense' && isPerson(accounts.get(accountId)) && (
            <p className="note-line">Harcama sana yazılır; {accounts.get(accountId)!.name} kişisine bu tutar kadar borçlanırsın. Ödediğinde “Borç” sekmesinden “Ben verdim” ile kapatırsın.</p>
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
            <Split size={15} aria-hidden /> Hesabı bölüş
          </button>
          {split && (
            persons.length === 0 ? (
              <p className="note-line">Önce bir kişi ekle. <button type="button" className="link link--small" onClick={() => openSheet({ kind: 'account', kindPreset: 'person' })}>Kişi ekle</button></p>
            ) : (
              <div className="split__body">
                {personChips(splitPerson, setSplitPerson, 'Kiminle bölüştün?')}
                <MoneyInput label="Onun payı" value={splitShare} onChange={setSplitShare} />
                {(() => {
                  const total = parseMoney(amount), share = parseMoney(splitShare);
                  return total && share && share < total ? (
                    <p className="note-line">Senin harcaman <b>{formatMoney(total - share)}</b> olarak yazılır; {accounts.get(splitPerson)?.name} sana <b>{formatMoney(share)}</b> borçlu olur. Toplam {formatMoney(total)} hesabından çıkar.</p>
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
            label="Yön"
            value={dir}
            onChange={setDir}
            options={[
              { value: 'out', label: 'Ben verdim / ödedim' },
              { value: 'in', label: 'Ben aldım / o ödedi' },
            ]}
          />
          <fieldset className="block">
            <legend>Kiminle?</legend>
            {personChips(personId, setPersonId)}
          </fieldset>
          <fieldset className="block">
            <legend>{dir === 'out' ? 'Hangi hesaptan verdin?' : 'Hangi hesaba geldi?'}</legend>
            {accountChips(accountId, setAccountId)}
          </fieldset>
          <p className="note-line">
            {dir === 'out'
              ? 'Ona borç verdin ya da ona olan borcunu ödedin. Gider sayılmaz.'
              : 'Ondan borç aldın ya da sana olan borcunu ödedi. Gelir sayılmaz.'}
            {personId && (() => {
              const b = cashBalance(data, personId);
              return b !== 0 ? ` Şu an ${b > 0 ? `sana ${formatMoney(b)} borçlu` : `ona ${formatMoney(-b)} borçlusun`}.` : '';
            })()}
          </p>
        </>
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
            + Not / etiket
          </button>
        )}
      </div>
      {showNote && (
        <>
          <label className="field">
            <span className="field__label">Not (isteğe bağlı)</span>
            <input className="input" value={note} maxLength={200} onChange={(e) => setNote(e.target.value)} placeholder="ör. kafeterya, kitap" onKeyDown={(e) => e.key === 'Enter' && save()} />
          </label>
          <div className="field">
            <span className="field__label"><Tag size={14} aria-hidden /> Etiketler (isteğe bağlı)</span>
            <div className="tag-input">
              {tags.map((t) => (
                <button type="button" key={t} className="tag-pill" onClick={() => setTags(tags.filter((x) => x !== t))} aria-label={`${t} etiketini kaldır`}>
                  #{t} <X size={12} aria-hidden />
                </button>
              ))}
              {tags.length < 5 && (
                <input
                  className="tag-input__field"
                  value={tagInput}
                  maxLength={24}
                  placeholder={tags.length ? '' : 'ör. erasmus, tatil'}
                  aria-label="Etiket ekle"
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
              const sugg = allTags(data).map((x) => x.tag).filter((t) => !tags.includes(t) && (!tagInput || t.startsWith(tagInput.toLocaleLowerCase('tr')))).slice(0, 6);
              return sugg.length ? (
                <div className="chip-row">
                  {sugg.map((t) => <Chip key={t} className="chip--small" onClick={() => { setTags(A.normalizeTags([...tags, t])); setTagInput(''); }}>#{t}</Chip>)}
                </div>
              ) : null;
            })()}
          </div>
        </>
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
    const draft: A.TxDraft = { type: 'refund', amount: amt, date, accountId, categoryId: base!.categoryId, refundOf: base!.id, note, tags: base!.tags };
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
