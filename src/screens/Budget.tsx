import { pct } from '../domain/tr';
import { useMemo, useState } from 'react';
import { Plus, CalendarClock, Pencil, Repeat } from 'lucide-react';
import type { Plan } from '../domain/types';
import { formatMoney, parseMoney } from '../domain/money';
import { addDays, daysInMonth, dayOfMonth, dueLabel, monthLabel, monthOf, shortDate } from '../domain/dates';
import { accountIndex, availability, budgetStatus, occurrences, pendingUntil, planIsInflow, type BudgetState } from '../domain/ledger';
import * as A from '../domain/actions';
import { commit } from '../store/store';
import { Chip, Progress, SectionHead, Segmented, inputFromMoney } from '../ui/kit';
import { go, openSheet } from '../ui/nav';
import { useData, useLookups } from '../ui/hooks';
import { ClawdNote, EmptyState } from '../ui/ClawdNote';
import { CatIcon } from '../ui/icons';
import type { Mood } from '../domain/mood';

const FREQ_LABEL = { once: 'Bir kez', weekly: 'Her hafta', monthly: 'Her ay', yearly: 'Her yıl' } as const;

const STATE_TEXT: Record<BudgetState, { label: string; mood: Mood }> = {
  none: { label: '', mood: 'calm' },
  'on-track': { label: 'Yolunda', mood: 'happy' },
  watch: { label: 'Biraz önden gidiyor', mood: 'calm' },
  tight: { label: 'Sıkışıyor', mood: 'thoughtful' },
  over: { label: 'Bütçe aşıldı', mood: 'thoughtful' },
  'planned-full': { label: 'Planlı ödemeler bütçeyi dolduruyor', mood: 'calm' },
  'closed-within': { label: 'Bütçe içinde kapandı', mood: 'happy' },
  future: { label: '', mood: 'calm' },
};

export function Budget() {
  const { data, today } = useData();
  const { accounts, cats } = useLookups(data);
  const month = monthOf(today);
  const b = useMemo(() => budgetStatus(data, month, today), [data, month, today]);
  const av = useMemo(() => availability(data, today), [data, today]);
  const upcoming = useMemo(() => pendingUntil(data, addDays(today, 45)), [data, today]);
  const accIdx = accountIndex(data);
  const doneThisMonth = useMemo(
    () => occurrences(data, `${month}-01`, today).filter((o) => o.status === 'done' || o.status === 'skipped').reverse().slice(0, 6),
    [data, month, today],
  );
  const left = daysInMonth(month) - dayOfMonth(today) + 1;

  let note: { text: string; why: string; mood: Mood } | null = null;
  if (b.budget !== null) {
    const st = STATE_TEXT[b.state];
    if (b.state === 'on-track' || b.state === 'watch' || b.state === 'tight')
      note = {
        mood: st.mood,
        text: `Ayın ${pct(b.elapsedPct, 'poss')} geçti; planlı ödemeler dışındaki payın ${pct(b.flexUsedPct ?? 0, 'acc')} kullandın. ${b.remaining !== null && b.remaining > 0 ? `Bu ay için ${formatMoney(b.remaining)} kaldı, günde ~${formatMoney(Math.floor(b.remaining / left))}.` : ''}`,
        why: 'Planlı ödemeler (yurt, abonelik vb.) bütçeden önce ayrılır; tempo yalnız geri kalan harcamalarla ölçülür. Yatırım katkıları ve transferler bütçeye girmez.',
      };
    else if (b.state === 'over')
      note = { mood: 'thoughtful', text: `Bu ay bütçeyi ${formatMoney(b.spent - b.budget)} aştın. Olur böyle aylar; kalan günlerde neyin ertelenebileceğine birlikte bakabiliriz.`, why: `Tüketim harcaması ${formatMoney(b.spent)}, bütçe ${formatMoney(b.budget)}.` };
    else if (b.state === 'planned-full')
      note = { mood: 'calm', text: 'Bu ayki planlı ödemeler bütçenin tamamını kaplıyor. Bütçeyi biraz yükseltmek daha gerçekçi olabilir.', why: `Planlı ödemeler: ${formatMoney(b.plannedSpent + b.plannedPending)}, bütçe: ${formatMoney(b.budget)}.` };
  }

  return (
    <div className="screen">
      <header className="screen-head">
        <div>
          <p className="eyebrow">{monthLabel(month)}</p>
          <h1>Bütçe ve planlar</h1>
        </div>
      </header>

      {b.budget === null ? (
        <section className="card">
          <EmptyState outfit="planner" mood="calm" title="Bütçe zorunlu değil" action={<button className="btn btn--primary" onClick={() => openSheet({ kind: 'budget' })}>Aylık bütçe belirle</button>}>
            Bir aylık harcama sınırı koyarsan gidişatını ayın akışına göre gösteririm. Koymazsan yalnızca kayıtları özetlerim, yargılamam. Kategori limitleri de isteğe bağlı.
          </EmptyState>
        </section>
      ) : (
        <section className="card budget-card" aria-labelledby="budget-h">
          <SectionHead id="budget-h" title="Aylık bütçe" action={<button className="link" onClick={() => openSheet({ kind: 'budget' })}><Pencil size={15} /> Düzenle</button>} />
          <div className="budget-head">
            <span className="budget-head__spent">{formatMoney(b.spent)}</span>
            <span className="budget-head__of">/ {formatMoney(b.budget)}</span>
            {STATE_TEXT[b.state].label && <span className={`badge badge--${b.state}`}>{STATE_TEXT[b.state].label}</span>}
          </div>
          <BudgetBar spentPlanned={b.plannedSpent} spentFlex={Math.max(b.flexibleSpent, 0)} pending={b.plannedPending} budget={b.budget} elapsed={b.elapsedPct} />
          <dl className="legend">
            <div><dt><i className="sw sw--planned" />Planlı (ödendi)</dt><dd>{formatMoney(b.plannedSpent)}</dd></div>
            <div><dt><i className="sw sw--pending" />Planlı (bekliyor)</dt><dd>{formatMoney(b.plannedPending)}</dd></div>
            <div><dt><i className="sw sw--flex" />Diğer harcamalar</dt><dd>{formatMoney(b.flexibleSpent)}</dd></div>
            <div><dt><i className="sw sw--left" />Kalan</dt><dd>{formatMoney(Math.max(b.remaining ?? 0, 0))}</dd></div>
          </dl>
          <p className="note-line">Çizgi, ayın geçen kısmını gösterir (%{b.elapsedPct}).</p>
          {note && <ClawdNote compact mood={note.mood} text={note.text} why={note.why} outfit="planner" size={64} />}
        </section>
      )}

      <section className="card" aria-labelledby="lim-h">
        <SectionHead id="lim-h" title="Kategori limitleri" action={<button className="link" onClick={() => openSheet({ kind: 'limit' })}><Plus size={16} /> Limit</button>} />
        {b.categories.length === 0 ? (
          <p className="muted">İstersen sık harcadığın bir kategoriye (ör. yemek) aylık limit koy. Zorunlu değil.</p>
        ) : (
          <ul className="limit-list">
            {b.categories.map((c) => (
              <li key={c.category.id}>
                <button className="limit-row" onClick={() => openSheet({ kind: 'limit', categoryId: c.category.id })}>
                  <span className="limit-row__head">
                    <span className="limit-row__name" style={{ '--cat': c.category.color } as React.CSSProperties}>
                      <CatIcon icon={c.category.icon} size={16} /> {c.category.name}
                    </span>
                    <span className="limit-row__nums">{formatMoney(c.used)} / {formatMoney(c.limit)}</span>
                  </span>
                  <Progress value={c.used} max={c.limit} label={`${c.category.name} limiti`} tone={c.level === 'over' ? 'warn' : c.level === 'near' ? 'warn' : 'accent'} marker={b.elapsedPct} />
                  {c.level !== 'ok' && (
                    <span className={`limit-row__alert ${c.level === 'over' ? 'is-over' : ''}`}>
                      {c.level === 'over'
                        ? `${c.category.name} limitini ${formatMoney(c.used - c.limit)} aştın (%${c.pct}).`
                        : `${c.category.name} limitinin ${pct(c.pct, 'acc')} kullandın; ${formatMoney(c.limit - c.used)} kaldı.`}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card" aria-labelledby="plans-h">
        <SectionHead id="plans-h" title="Yaklaşan ödemeler ve beklenen gelirler" action={<button className="link" onClick={() => openSheet({ kind: 'plan' })}><Plus size={16} /> Plan</button>} />
        {upcoming.length === 0 ? (
          <p className="muted">45 gün içinde bekleyen plan yok. Yurt, abonelik, burs gibi düzenli kalemleri ekleyince kullanılabilir paran daha gerçekçi olur.</p>
        ) : (
          <ul className="due-list">
            {upcoming.map((o) => {
              const inflow = planIsInflow(o.plan, accIdx);
              return (
                <li key={o.plan.id + o.due} className={o.due < today ? 'is-overdue' : ''}>
                  <CalendarClock size={18} aria-hidden />
                  <span className="due-list__main">
                    <span className="due-list__title">{o.plan.title}</span>
                    <span className="due-list__sub">
                      {shortDate(o.due, today)} · {dueLabel(o.due, today)}
                      {inflow ? ' · beklenen gelir' : o.plan.kind === 'transfer' ? ' · aktarım' : ''}
                      {o.due <= av.periodEnd && !inflow ? ' · ayrıldı' : ''}
                    </span>
                  </span>
                  <span className={`due-list__amt ${inflow ? 'tone-pos' : o.plan.kind === 'transfer' ? 'tone-invest' : ''}`}>{inflow ? '+' : ''}{formatMoney(o.amount)}</span>
                  <button className="btn btn--small btn--secondary" onClick={() => openSheet({ kind: 'confirm', planId: o.plan.id, due: o.due })}>
                    {o.plan.kind === 'income' ? 'Geldi' : o.plan.kind === 'transfer' ? 'Aktarıldı' : 'Ödendi'}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {doneThisMonth.length > 0 && (
          <details className="details">
            <summary>Bu ay tamamlananlar ({doneThisMonth.length})</summary>
            <ul className="due-list due-list--done">
              {doneThisMonth.map((o) => (
                <li key={o.plan.id + o.due}>
                  <span className="due-list__main">
                    <span className="due-list__title">{o.plan.title}</span>
                    <span className="due-list__sub">{shortDate(o.due)} · {o.status === 'done' ? `gerçekleşti${o.tx && o.tx.amount !== o.plan.amount ? ` (plan ${formatMoney(o.plan.amount)})` : ''}` : 'atlandı'}</span>
                  </span>
                  <span className="due-list__amt">{o.status === 'done' ? formatMoney(o.amount) : '—'}</span>
                  {o.status === 'skipped' ? (
                    <button className="btn btn--small btn--ghost" onClick={() => commit((d) => A.skipOccurrence(d, o.plan.id, o.due, false), 'Atlama geri alındı')}>Geri al</button>
                  ) : (
                    <button className="btn btn--small btn--ghost" onClick={() => o.tx && openSheet({ kind: 'edit', txId: o.tx.id })}>Kayıt</button>
                  )}
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>

      <section className="card" aria-labelledby="allplans-h">
        <SectionHead id="allplans-h" title="Tüm planlar" />
        {data.plans.length === 0 ? (
          <div className="chip-row">
            <Chip onClick={() => openSheet({ kind: 'plan', preset: 'expense' })}><Plus size={14} /> Yurt / kira</Chip>
            <Chip onClick={() => openSheet({ kind: 'plan', preset: 'expense' })}><Plus size={14} /> Abonelik</Chip>
            <Chip onClick={() => openSheet({ kind: 'plan', preset: 'income' })}><Plus size={14} /> Burs</Chip>
            <Chip onClick={() => openSheet({ kind: 'plan', preset: 'transfer' })}><Plus size={14} /> Aylık yatırım</Chip>
          </div>
        ) : (
          <ul className="plan-list">
            {[...data.plans].sort((a, b) => a.title.localeCompare(b.title, 'tr')).map((p: Plan) => (
              <li key={p.id}>
                <button className="plan-row" onClick={() => openSheet({ kind: 'plan', planId: p.id })}>
                  <Repeat size={16} aria-hidden />
                  <span className="plan-row__main">
                    <span>{p.title}</span>
                    <small>
                      {FREQ_LABEL[p.freq]} · {p.kind === 'transfer' ? `${accounts.get(p.accountId)?.name} → ${accounts.get(p.toAccountId!)?.name}` : `${cats.get(p.categoryId!)?.name ?? ''} · ${accounts.get(p.accountId)?.name ?? ''}`}
                      {p.endDate ? ` · ${shortDate(p.endDate, today)} bitiş` : ''}
                    </small>
                  </span>
                  <span className={p.kind === 'income' ? 'tone-pos' : p.kind === 'transfer' ? 'tone-invest' : ''}>{p.kind === 'income' ? '+' : ''}{formatMoney(p.amount)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card" aria-labelledby="avail-set-h">
        <SectionHead id="avail-set-h" title="Kullanılabilir para nasıl hesaplanıyor?" />
        <p className="muted">
          Günlük hesaplarındaki para − dönem sonuna kadar bekleyen ödemeler (gecikmişler dahil) − planlı yatırım aktarımları − kenarda tuttuğun birikim payı. Beklenen gelir, gelene kadar eklenmez. Yatırım hesabındaki para hiç sayılmaz.
        </p>
        <div className="setting-row">
          <span>Dönem</span>
          <Segmented
            size="sm"
            label="Dönem"
            value={data.settings.periodMode}
            onChange={(v) => commit((d) => A.updateSettings(d, { periodMode: v }))}
            options={[
              { value: 'month', label: 'Ay sonuna kadar' },
              { value: 'days30', label: '30 gün' },
            ]}
          />
        </div>
        <ReserveRow />
        <button className="link" onClick={() => go('home')}>Özete dön</button>
      </section>
    </div>
  );
}

function ReserveRow() {
  const { data } = useData();
  return (
    <div className="setting-row">
      <span>
        Birikim payı
        <small>Günlük hesapta dokunmadan tuttuğun tutar</small>
      </span>
      <ReserveInput key={data.settings.reserve} value={data.settings.reserve} />
    </div>
  );
}

function ReserveInput({ value }: { value: number }) {
  const [raw, setRaw] = useState(inputFromMoney(value));
  const [err, setErr] = useState(false);
  const save = () => {
    const v = raw.trim() ? parseMoney(raw) : 0;
    if (v === null) return setErr(true);
    setErr(false);
    if (v !== value) commit((d) => A.updateSettings(d, { reserve: v }), v ? `Birikim payı ${formatMoney(v)}` : 'Birikim payı kaldırıldı');
  };
  return (
    <span className="inline-money">
      <input className={`input input--small ${err ? 'is-invalid' : ''}`} inputMode="decimal" value={raw} placeholder="0" onChange={(e) => setRaw(e.target.value.replace(/[^\d.,]/g, ''))} onBlur={save} onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()} aria-label="Birikim payı (TL)" />
      <span>TL</span>
    </span>
  );
}

function BudgetBar({ spentPlanned, spentFlex, pending, budget, elapsed }: { spentPlanned: number; spentFlex: number; pending: number; budget: number; elapsed: number }) {
  const total = Math.max(budget, spentPlanned + spentFlex + pending);
  const w = (v: number) => `${(v / total) * 100}%`;
  return (
    <div className="budget-bar" role="img" aria-label={`Planlı ödenen ${formatMoney(spentPlanned)}, planlı bekleyen ${formatMoney(pending)}, diğer harcama ${formatMoney(spentFlex)}, bütçe ${formatMoney(budget)}`}>
      <span className="budget-bar__seg sw--planned" style={{ width: w(spentPlanned) }} />
      <span className="budget-bar__seg sw--flex" style={{ width: w(spentFlex) }} />
      <span className="budget-bar__seg sw--pending" style={{ width: w(pending) }} />
      {total > budget && <span className="budget-bar__limit" style={{ left: w(budget) }} />}
      <span className="budget-bar__marker" style={{ left: `${(elapsed / 100) * (budget / total) * 100}%` }} />
    </div>
  );
}
