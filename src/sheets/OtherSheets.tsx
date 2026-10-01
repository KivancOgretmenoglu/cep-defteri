import { useState } from 'react';
import { Trash2, Archive, ArchiveRestore, Ban, RotateCw } from 'lucide-react';
import type { AccountKind, Freq, ID, PlanKind } from '../domain/types';
import * as A from '../domain/actions';
import { formatMoney, parseMoney } from '../domain/money';
import { shortDate } from '../domain/dates';
import { cashBalance, installmentEnd, investmentState, isDaily, isInvestment } from '../domain/ledger';
import { commit } from '../store/store';
import { closeSheet, openSheet } from '../ui/nav';
import { Chip, Field, FormError, MoneyInput, Segmented, Sheet, inputFromMoney } from '../ui/kit';
import { CATEGORY_COLORS, CATEGORY_ICONS, CatIcon } from '../ui/icons';
import { dailyAccounts, useData, useLookups } from '../ui/hooks';

const parseSigned = (raw: string) => {
  const t = raw.trim();
  if (!t || /^0+([.,]0*)?$/.test(t)) return 0;
  const neg = t.startsWith('-');
  const v = parseMoney(neg ? t.slice(1) : t);
  return v === null ? null : neg ? -v : v;
};

// ───────────────────────── Hesap ─────────────────────────
export function AccountSheet({ accountId, kindPreset }: { accountId?: ID; kindPreset?: 'investment' | 'person' }) {
  const { data, today } = useData();
  const acc = accountId ? data.accounts.find((a) => a.id === accountId) : undefined;
  const used = acc ? A.isAccountUsed(data, acc.id) : false;
  const [name, setName] = useState(acc?.name ?? (kindPreset === 'investment' ? 'Yatırım hesabı' : ''));
  const [kind, setKind] = useState<AccountKind>(acc?.kind ?? kindPreset ?? 'bank');
  const [opening, setOpening] = useState(acc ? inputFromMoney(Math.abs(acc.openingBalance)) : '');
  // Kişi hesabında açılış yönü: + o bana borçlu, − ben ona borçluyum
  const [owesDir, setOwesDir] = useState<'none' | 'they' | 'me'>(acc?.kind === 'person' ? (acc.openingBalance > 0 ? 'they' : acc.openingBalance < 0 ? 'me' : 'none') : 'none');
  const [openingDate, setOpeningDate] = useState(acc?.openingDate ?? today);
  const [priorKnown, setPriorKnown] = useState(acc?.priorContribution != null);
  const [prior, setPrior] = useState(inputFromMoney(acc?.priorContribution ?? null));
  const [err, setErr] = useState<string | null>(null);

  function save() {
    let ob = parseSigned(opening);
    if (ob === null) return setErr('Tutarı 1.250,50 gibi yaz.');
    if (kind === 'person') ob = owesDir === 'none' ? 0 : owesDir === 'they' ? Math.abs(ob) : -Math.abs(ob);
    let pc: number | null = null;
    if (kind === 'investment' && priorKnown) {
      pc = prior.trim() ? parseSigned(prior) : 0;
      if (pc === null || pc < 0) return setErr('Önceki katkıyı 1.250,50 gibi yaz.');
    }
    const draft: A.AccountDraft = { name, kind, openingBalance: ob, openingDate, priorContribution: pc };
    const e = acc ? commit((d) => A.updateAccount(d, acc.id, draft), 'Hesap güncellendi') : commit((d) => A.addAccount(d, draft).data, `${name.trim()} eklendi`);
    if (e) setErr(e);
    else closeSheet();
  }
  function archive() {
    if (!acc) return;
    commit((d) => A.setAccountArchived(d, acc.id, !acc.archived), acc.archived ? 'Hesap arşivden çıkarıldı' : 'Hesap arşivlendi');
    closeSheet();
  }
  function remove() {
    if (!acc) return;
    const e = commit((d) => A.deleteAccount(d, acc.id), 'Hesap silindi');
    if (e) setErr(e);
    else closeSheet();
  }
  const balanceNow = acc && isDaily(acc) ? cashBalance(data, acc.id) : null;

  return (
    <Sheet
      title={acc ? (kind === 'person' ? 'Kişiyi düzenle' : 'Hesabı düzenle') : kind === 'investment' ? 'Yatırım hesabı ekle' : kind === 'person' ? 'Kişi ekle' : 'Hesap ekle'}
      onClose={closeSheet}
      footer={
        <div className="sheet-actions">
          {acc && !used && (
            <button className="btn btn--ghost btn--danger" onClick={remove}>
              <Trash2 size={18} /> Sil
            </button>
          )}
          {acc && used && (
            <button className="btn btn--ghost" onClick={archive}>
              {acc.archived ? <ArchiveRestore size={18} /> : <Archive size={18} />} {acc.archived ? 'Arşivden çıkar' : 'Arşivle'}
            </button>
          )}
          <button className="btn btn--primary btn--grow" onClick={save}>Kaydet</button>
        </div>
      }
    >
      {!(acc && used) && (
        <Segmented<AccountKind>
          label="Hesap türü"
          value={kind}
          onChange={setKind}
          options={[
            { value: 'bank', label: 'Banka' },
            { value: 'cash', label: 'Nakit' },
            { value: 'investment', label: 'Yatırım' },
            { value: 'person', label: 'Kişi' },
          ]}
        />
      )}
      <Field label={kind === 'person' ? 'Kişinin adı' : 'Hesap adı'}>
        <input className="input" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} placeholder={kind === 'cash' ? 'Cüzdan' : kind === 'bank' ? 'ör. Banka kartı' : kind === 'person' ? 'ör. Ali' : 'ör. Fon hesabı'} />
      </Field>
      {kind === 'person' ? (
        <div className="callout">
          <p><b>Şu an aranızda borç var mı?</b> Bu bir başlangıç durumudur; gelir ya da gider sayılmaz.</p>
          <Segmented size="sm" label="Borç durumu" value={owesDir} onChange={setOwesDir} options={[{ value: 'none', label: 'Yok' }, { value: 'they', label: 'O bana borçlu' }, { value: 'me', label: 'Ben borçluyum' }]} />
          {owesDir !== 'none' && <MoneyInput label="Tutar" value={opening} onChange={setOpening} />}
        </div>
      ) : (
      <MoneyInput
        label={kind === 'investment' ? 'Takibe başladığın gün hesabın değeri' : 'Takibe başladığın gün hesaptaki para'}
        value={opening}
        onChange={(v) => setOpening(v)}
        allowZero
        placeholder="0"
      />
      )}
      <Field label="Takip başlangıcı" hint="Bu tarihten önceki hareketler girilmez; açılış tutarı gelir sayılmaz.">
        <input className="input" type="date" value={openingDate} max={today} onChange={(e) => e.target.value && setOpeningDate(e.target.value)} />
      </Field>
      {kind === 'investment' && (
        <div className="callout">
          <p>
            <b>Takipten önce bu hesaba toplam ne kadar para koymuştun?</b> Bilirsen, değer farkını (kâr/zarar) gösterebilirim. Bilmiyorsan boş bırak; uydurma bir getiri göstermem.
          </p>
          <div className="chip-row">
            <Chip on={!priorKnown} onClick={() => setPriorKnown(false)}>Bilmiyorum</Chip>
            <Chip on={priorKnown} onClick={() => setPriorKnown(true)}>Biliyorum</Chip>
          </div>
          {priorKnown && <MoneyInput label="Takip öncesi net katkı" value={prior} onChange={setPrior} allowZero />}
        </div>
      )}
      {acc?.kind === 'person' && (() => {
        const b = cashBalance(data, acc.id);
        return <p className="note-line">Şu anki durum: {b === 0 ? 'hesap kapalı' : b > 0 ? `sana ${formatMoney(b)} borçlu` : `ona ${formatMoney(-b)} borçlusun`}. Hesap kapanınca arşivleyebilirsin.</p>;
      })()}
      {balanceNow !== null && (
        <p className="note-line">Güncel bakiye: {formatMoney(balanceNow)} (açılış + tüm hareketler)</p>
      )}
      {acc?.archived && <p className="note-line">Bu hesap arşivde: yeni kayıtlarda görünmez ama geçmişi ve bakiyesi korunur.</p>}
      <FormError msg={err} />
    </Sheet>
  );
}

// ───────────────────────── Yatırım değeri ─────────────────────────
export function ValuationSheet({ accountId }: { accountId: ID }) {
  const { data, today } = useData();
  const st = investmentState(data, accountId);
  const [value, setValue] = useState('');
  const [date, setDate] = useState(today);
  const [note, setNote] = useState('');
  const [err, setErr] = useState<string | null>(null);
  if (!st) return null;
  function save() {
    const v = parseSigned(value);
    if (v === null || v < 0 || !value.trim()) return setErr('Değeri 12.500,00 gibi yaz.');
    const e = commit((d, t) => A.addValuation(d, { accountId, date, value: v, note }, t).data, 'Güncel değer kaydedildi', { pulse: true });
    if (e) setErr(e);
    else closeSheet();
  }
  return (
    <Sheet title="Güncel değeri gir" onClose={closeSheet} footer={<button className="btn btn--primary btn--block" onClick={save}>Kaydet</button>}>
      <p className="muted">
        {st.account.name} şu an kaç TL ediyor? Uygulamadaki tahmini değer: <b>{formatMoney(st.currentValue)}</b> (son değer {shortDate(st.lastValuation.date, today)}
        {st.flowsSinceValuation !== 0 && `, sonrasında ${formatMoney(st.flowsSinceValuation, { sign: true })} hareket`}).
      </p>
      <MoneyInput big label="Güncel değer" value={value} onChange={setValue} autoFocus allowZero onEnter={save} />
      <Field label="Değer tarihi" hint="Bu tarihe kadar girdiğin katkı ve çekimlerin bu değere dahil olduğu kabul edilir.">
        <input className="input" type="date" value={date} min={st.account.openingDate} max={today} onChange={(e) => e.target.value && setDate(e.target.value)} />
      </Field>
      <Field label="Not (isteğe bağlı)">
        <input className="input" value={note} maxLength={200} onChange={(e) => setNote(e.target.value)} />
      </Field>
      <p className="note-line">Değer güncellemesi para hareketi değildir: katkı toplamını, gelirini ve günlük bakiyeni değiştirmez.</p>
      <FormError msg={err} />
    </Sheet>
  );
}

// ───────────────────────── Plan ─────────────────────────
const FREQ: { value: Freq; label: string }[] = [
  { value: 'monthly', label: 'Her ay' },
  { value: 'weekly', label: 'Her hafta' },
  { value: 'yearly', label: 'Her yıl' },
  { value: 'once', label: 'Bir kez' },
];

export function PlanSheet({ planId, preset }: { planId?: ID; preset?: PlanKind }) {
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
    if (!amt) return setErr('Tutarı yaz.');
    const n = Number(instN);
    const useInst = canInstall && instOn;
    if (useInst && (!Number.isInteger(n) || n < 2 || n > 60)) return setErr('Taksit sayısı 2 ile 60 arasında olmalı.');
    const draft: A.PlanDraft = { kind, title, amount: amt, accountId, categoryId, toAccountId, freq, startDate, endDate: useInst ? null : endDate || null, installments: useInst ? n : null };
    const e = plan ? commit((d) => A.updatePlan(d, plan.id, draft), 'Plan güncellendi') : commit((d) => A.addPlan(d, draft).data, 'Plan eklendi');
    if (e) setErr(e);
    else closeSheet();
  }
  function remove() {
    if (!plan) return;
    commit((d) => A.deletePlan(d, plan.id), history ? 'Plan silindi (gerçekleşmiş kayıtlar duruyor)' : 'Plan silindi');
    closeSheet();
  }
  const cats = data.categories.filter((c) => c.kind === (kind === 'income' ? 'income' : 'expense') && (!c.archived || c.id === categoryId));
  const allAccounts = data.accounts.filter((a) => !a.archived || a.id === accountId || a.id === toAccountId);

  return (
    <Sheet
      title={plan ? (ended ? 'Biten plan' : 'Planı düzenle') : 'Plan ekle'}
      onClose={closeSheet}
      footer={
        <div className="sheet-actions">
          {plan && (
            <button className="btn btn--ghost btn--danger icon-only-phone" onClick={remove} aria-label="Planı sil">
              <Trash2 size={18} /> <span>Sil</span>
            </button>
          )}
          {plan && !ended && (
            <button className="btn btn--ghost" onClick={() => openSheet({ kind: 'cancelPlan', planId: plan.id })}>
              <Ban size={18} /> İptal et
            </button>
          )}
          {plan && ended && (
            <button
              className="btn btn--ghost"
              onClick={() => {
                const e = commit((d, t) => A.restartPlan(d, plan.id, t).data, `${plan.title} bugünden yeniden başladı`);
                if (e) setErr(e);
                else closeSheet();
              }}
            >
              <RotateCw size={18} /> Yeniden başlat
            </button>
          )}
          <button className="btn btn--primary btn--grow" onClick={save}>Kaydet</button>
        </div>
      }
    >
      {!history && (
        <Segmented<PlanKind>
          label="Plan türü"
          value={kind}
          onChange={(k) => {
            setKind(k);
            setCategoryId(undefined);
            if (k === 'transfer' && !inv.length) setToAccountId(daily.find((d) => d.account.id !== accountId)?.account.id ?? '');
          }}
          options={[
            { value: 'expense', label: 'Ödeme' },
            { value: 'income', label: 'Beklenen gelir' },
            { value: 'transfer', label: 'Aktarım' },
          ]}
        />
      )}
      <Field label="Ad">
        <input className="input" value={title} maxLength={60} onChange={(e) => setTitle(e.target.value)} placeholder={kind === 'income' ? 'ör. KYK bursu' : kind === 'transfer' ? 'ör. Aylık yatırım' : 'ör. Yurt ödemesi'} />
      </Field>
      <MoneyInput label="Tutar" value={amount} onChange={setAmount} />
      {kind !== 'transfer' && (
        <fieldset className="block">
          <legend>{kind === 'income' ? 'Kaynak' : 'Kategori'}</legend>
          <div className="chip-row">
            {cats.map((c) => (
              <Chip key={c.id} on={categoryId === c.id} onClick={() => setCategoryId(c.id)} color={c.color}>
                <CatIcon icon={c.icon} size={15} /> {c.name}
              </Chip>
            ))}
          </div>
        </fieldset>
      )}
      <fieldset className="block">
        <legend>{kind === 'transfer' ? 'Nereden' : kind === 'income' ? 'Hangi hesaba gelecek?' : 'Hangi hesaptan?'}</legend>
        <div className="chip-row">
          {(kind === 'transfer' ? allAccounts : daily.map((d) => d.account)).map((a) => (
            <Chip key={a.id} on={accountId === a.id} onClick={() => setAccountId(a.id)}>{a.name}</Chip>
          ))}
        </div>
      </fieldset>
      {kind === 'transfer' && (
        <fieldset className="block">
          <legend>Nereye</legend>
          <div className="chip-row">
            {allAccounts.filter((a) => a.id !== accountId).map((a) => (
              <Chip key={a.id} on={toAccountId === a.id} onClick={() => setToAccountId(a.id)}>{a.name}</Chip>
            ))}
          </div>
          {isDaily(accounts.get(accountId)) && isInvestment(accounts.get(toAccountId)) && <span className="field__hint">Planlı yatırım katkısı: kullanılabilir paradan önceden ayrılır, harcama sayılmaz.</span>}
        </fieldset>
      )}
      <fieldset className="block">
        <legend>Sıklık</legend>
        {history ? <p className="muted">{FREQ.find((f) => f.value === freq)?.label} (gerçekleşmiş kaydı olduğu için değiştirilemez)</p> : <Segmented<Freq> size="sm" label="Sıklık" value={freq} onChange={setFreq} options={FREQ} />}
      </fieldset>
      <div className="two-col">
        <Field label={freq === 'once' ? 'Tarih' : 'İlk vade'}>
          <input className="input" type="date" value={startDate} onChange={(e) => e.target.value && setStartDate(e.target.value)} />
        </Field>
        {freq !== 'once' && !(canInstall && instOn) && (
          <Field label="Bitiş (isteğe bağlı)">
            <input className="input" type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} />
          </Field>
        )}
      </div>
      {canInstall && (
        <div className="callout">
          <div className="chip-row">
            <Chip on={instOn} onClick={() => setInstOn(!instOn)}>{instOn ? '✓ ' : ''}Taksitli ödeme</Chip>
          </div>
          {instOn && (
            <>
              <Field label="Taksit sayısı">
                <input className="input input--small" inputMode="numeric" value={instN} onChange={(e) => setInstN(e.target.value.replace(/\D/g, '').slice(0, 2))} />
              </Field>
              {(() => {
                const a = parseMoney(amount), n = Number(instN);
                return a && n >= 2 && n <= 60 ? <p className="note-line">Aylık {formatMoney(a)} × {n} taksit = toplam <b>{formatMoney(a * n)}</b>. Son taksit {shortDate(installmentEnd(startDate, n), today)}.</p> : null;
              })()}
              <p className="note-line">Tutar alanına <b>bir taksitin</b> tutarını yaz. Her taksit vadesinde ayrı ayrı “Ödendi” ile kaydedilir.</p>
            </>
          )}
        </div>
      )}
      {ended && <p className="note-line">Bu plan {shortDate(plan!.endDate!, today)} tarihinde bitti/iptal edildi. Geçmiş kayıtları duruyor.</p>}
      <p className="note-line">
        Vadesi gelince kendiliğinden gerçekleşmez; “{kind === 'income' ? 'Geldi' : kind === 'transfer' ? 'Aktarıldı' : 'Ödendi'}” deyip tutarı düzeltebilirsin.
        {kind === 'income' && ' Beklenen gelir, gelene kadar bakiyeye ve kullanılabilir paraya eklenmez.'}
      </p>
      <FormError msg={err} />
    </Sheet>
  );
}

// ───────────────────────── Hedef ─────────────────────────
export function GoalSheet({ goalId, accountId }: { goalId?: ID; accountId?: ID }) {
  const { data } = useData();
  const goal = goalId ? data.goals.find((g) => g.id === goalId) : undefined;
  const inv = data.accounts.filter(isInvestment);
  const [title, setTitle] = useState(goal?.title ?? '');
  const [target, setTarget] = useState(inputFromMoney(goal?.target));
  const [acc, setAcc] = useState(goal?.accountId ?? accountId ?? inv[0]?.id ?? '');
  const [err, setErr] = useState<string | null>(null);
  function save() {
    const t = parseMoney(target);
    if (!t) return setErr('Hedef tutarını yaz.');
    const e = goal ? commit((d) => A.updateGoal(d, goal.id, { title, target: t }), 'Hedef güncellendi') : commit((d) => A.addGoal(d, { title, target: t, accountId: acc }).data, 'Hedef eklendi');
    if (e) setErr(e);
    else closeSheet();
  }
  return (
    <Sheet
      title={goal ? 'Hedefi düzenle' : 'Birikim hedefi'}
      onClose={closeSheet}
      footer={
        <div className="sheet-actions">
          {goal && (
            <button className="btn btn--ghost btn--danger" onClick={() => { commit((d) => A.deleteGoal(d, goal.id), 'Hedef silindi'); closeSheet(); }}>
              <Trash2 size={18} /> Sil
            </button>
          )}
          <button className="btn btn--primary btn--grow" onClick={save}>Kaydet</button>
        </div>
      }
    >
      <Field label="Hedefin adı">
        <input className="input" value={title} maxLength={60} onChange={(e) => setTitle(e.target.value)} placeholder="ör. Yaz okulu, acil durum fonu" />
      </Field>
      <MoneyInput label="Hedef: net katkı" value={target} onChange={setTarget} />
      {!goal && inv.length > 1 && (
        <fieldset className="block">
          <legend>Yatırım hesabı</legend>
          <div className="chip-row">
            {inv.map((a) => <Chip key={a.id} on={acc === a.id} onClick={() => setAcc(a.id)}>{a.name}</Chip>)}
          </div>
        </fieldset>
      )}
      <p className="note-line">İlerleme, piyasa değerine göre değil, bu hesaba senin koyduğun net paraya (katkı − çekim) göre ölçülür. Böylece fiyat dalgalanması hedefini geri götürmez.</p>
      <FormError msg={err} />
    </Sheet>
  );
}

// ───────────────────────── Kategori ─────────────────────────
export function CategorySheet({ categoryId, catKind }: { categoryId?: ID; catKind?: 'expense' | 'income' }) {
  const { data } = useData();
  const cat = categoryId ? data.categories.find((c) => c.id === categoryId) : undefined;
  const kind = cat?.kind ?? catKind ?? 'expense';
  const [name, setName] = useState(cat?.name ?? '');
  const [icon, setIcon] = useState(cat?.icon ?? 'dots');
  const [color, setColor] = useState(cat?.color ?? CATEGORY_COLORS[0]);
  const [err, setErr] = useState<string | null>(null);
  const used = cat ? A.isCategoryUsed(data, cat.id) : false;
  function save() {
    const e = cat ? commit((d) => A.updateCategory(d, cat.id, { name, icon, color }), 'Kategori güncellendi') : commit((d) => A.addCategory(d, { kind, name, icon, color }).data, 'Kategori eklendi');
    if (e) setErr(e);
    else closeSheet();
  }
  function remove() {
    if (!cat) return;
    if (cat.archived) commit((d) => A.updateCategory(d, cat.id, { archived: false }), 'Kategori geri getirildi');
    else commit((d) => A.removeCategory(d, cat.id), used ? 'Kategori arşivlendi (geçmiş kayıtlar korunuyor)' : 'Kategori silindi');
    closeSheet();
  }
  return (
    <Sheet
      title={cat ? 'Kategoriyi düzenle' : kind === 'income' ? 'Gelir kaynağı ekle' : 'Kategori ekle'}
      onClose={closeSheet}
      footer={
        <div className="sheet-actions">
          {cat && (
            <button className="btn btn--ghost" onClick={remove}>
              {cat.archived ? <ArchiveRestore size={18} /> : used ? <Archive size={18} /> : <Trash2 size={18} />} {cat.archived ? 'Geri getir' : used ? 'Arşivle' : 'Sil'}
            </button>
          )}
          <button className="btn btn--primary btn--grow" onClick={save}>Kaydet</button>
        </div>
      }
    >
      <Field label="Ad">
        <input className="input" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} />
      </Field>
      <fieldset className="block">
        <legend>Simge</legend>
        <div className="icon-grid">
          {Object.keys(CATEGORY_ICONS).map((k) => (
            <button type="button" key={k} className={`icon-pick ${icon === k ? 'is-on' : ''}`} aria-pressed={icon === k} aria-label={k} onClick={() => setIcon(k)} style={{ '--cat': color } as React.CSSProperties}>
              <CatIcon icon={k} />
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset className="block">
        <legend>Renk</legend>
        <div className="swatches">
          {CATEGORY_COLORS.map((c) => (
            <button type="button" key={c} className={`swatch ${color === c ? 'is-on' : ''}`} style={{ background: c }} aria-label={`Renk ${c}`} aria-pressed={color === c} onClick={() => setColor(c)} />
          ))}
        </div>
      </fieldset>
      <FormError msg={err} />
    </Sheet>
  );
}

// ───────────────────────── Bütçe ve limit ─────────────────────────
export function BudgetSheet() {
  const { data } = useData();
  const [raw, setRaw] = useState(inputFromMoney(data.settings.monthlyBudget));
  const [err, setErr] = useState<string | null>(null);
  function save() {
    const v = raw.trim() ? parseMoney(raw) : null;
    if (raw.trim() && !v) return setErr('Tutarı 9.000 gibi yaz.');
    const e = commit((d) => A.updateSettings(d, { monthlyBudget: v }), v ? 'Aylık bütçe kaydedildi' : 'Aylık bütçe kaldırıldı');
    if (e) setErr(e);
    else closeSheet();
  }
  return (
    <Sheet
      title="Aylık harcama bütçesi"
      onClose={closeSheet}
      footer={
        <div className="sheet-actions">
          {data.settings.monthlyBudget && (
            <button className="btn btn--ghost" onClick={() => { commit((d) => A.updateSettings(d, { monthlyBudget: null }), 'Aylık bütçe kaldırıldı'); closeSheet(); }}>
              Bütçeyi kaldır
            </button>
          )}
          <button className="btn btn--primary btn--grow" onClick={save}>Kaydet</button>
        </div>
      }
    >
      <MoneyInput big label="Bir ayda en fazla ne kadar harcamak istersin?" value={raw} onChange={setRaw} autoFocus onEnter={save} />
      <p className="note-line">Planlı ödemeler (yurt, abonelik) de bütçeye dahildir, ama Clawd onları “fazla harcama” saymaz; temponu planlı olmayan harcamalara göre ölçer. Yatırım katkıları ve transferler bütçeyi etkilemez.</p>
      <FormError msg={err} />
    </Sheet>
  );
}

export function LimitSheet({ categoryId }: { categoryId?: ID }) {
  const { data } = useData();
  const cats = data.categories.filter((c) => c.kind === 'expense' && !c.archived);
  const [cat, setCat] = useState<ID | undefined>(categoryId);
  const current = cats.find((c) => c.id === cat);
  const [raw, setRaw] = useState(inputFromMoney(current?.limit));
  const [err, setErr] = useState<string | null>(null);
  function save() {
    if (!cat) return setErr('Bir kategori seç.');
    const v = parseMoney(raw);
    if (!v) return setErr('Limit tutarını yaz.');
    const e = commit((d) => A.updateCategory(d, cat, { limit: v }), 'Limit kaydedildi');
    if (e) setErr(e);
    else closeSheet();
  }
  return (
    <Sheet
      title="Kategori limiti"
      onClose={closeSheet}
      footer={
        <div className="sheet-actions">
          {current?.limit && (
            <button className="btn btn--ghost" onClick={() => { commit((d) => A.updateCategory(d, cat!, { limit: null }), 'Limit kaldırıldı'); closeSheet(); }}>
              Limiti kaldır
            </button>
          )}
          <button className="btn btn--primary btn--grow" onClick={save}>Kaydet</button>
        </div>
      }
    >
      {!categoryId && (
        <fieldset className="block">
          <legend>Kategori</legend>
          <div className="chip-row">
            {cats.map((c) => (
              <Chip key={c.id} on={cat === c.id} color={c.color} onClick={() => { setCat(c.id); setRaw(inputFromMoney(c.limit)); }}>
                <CatIcon icon={c.icon} size={15} /> {c.name}
              </Chip>
            ))}
          </div>
        </fieldset>
      )}
      <MoneyInput label={current ? `${current.name} için aylık limit` : 'Aylık limit'} value={raw} onChange={setRaw} onEnter={save} />
      <p className="note-line">%70'e ve %100'e ulaşınca nedenini ve tutarını gösteren bir not çıkar. Limitler isteğe bağlıdır.</p>
      <FormError msg={err} />
    </Sheet>
  );
}
