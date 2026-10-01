import { useMemo } from 'react';
import { Settings, ChevronRight, Plus, Sprout, Info, CalendarClock } from 'lucide-react';
import { formatMoney } from '../domain/money';
import { dueLabel, monthLabel, monthOf, shortDate, monthName } from '../domain/dates';
import {
  availability, budgetStatus, cashBalance, dailyBalance, investmentState, investmentTotal, isDaily, isInvestment, monthSummary, upcomingOutflows, pendingUntil, planIsInflow,
} from '../domain/ledger';
import { clawdMood } from '../domain/mood';
import { addDays } from '../domain/dates';
import { Amount, Progress, SectionHead } from '../ui/kit';
import { ClawdNote } from '../ui/ClawdNote';
import { TxRow } from '../ui/TxRow';
import { go, openSheet } from '../ui/nav';
import { useData, useLookups } from '../ui/hooks';
import { ACCOUNT_ICONS } from '../ui/icons';

export function Home() {
  const { data, today } = useData();
  const lookups = useLookups(data);
  const month = monthOf(today);
  const d = useMemo(() => {
    const av = availability(data, today);
    const mood = clawdMood(data, today);
    const sum = monthSummary(data, month);
    const budget = budgetStatus(data, month, today);
    const up = upcomingOutflows(data, today, 7);
    const soon = pendingUntil(data, addDays(today, 14)).slice(0, 6);
    return { av, mood, sum, budget, up, soon };
  }, [data, today, month]);
  const { av, mood, sum, budget, soon } = d;
  const dailyAccs = data.accounts.filter((a) => isDaily(a) && (!a.archived || cashBalance(data, a.id) !== 0));
  const invAccs = data.accounts.filter((a) => isInvestment(a) && !a.archived);
  const recent = [...data.txs].sort((a, b) => (a.date === b.date ? b.seq - a.seq : a.date < b.date ? 1 : -1)).slice(0, 5);
  const daily = dailyBalance(data);
  const invTotal = investmentTotal(data);
  const periodText = data.settings.periodMode === 'days30' ? `önümüzdeki 30 gün (son gün ${shortDate(av.periodEnd)})` : `${monthName(month)} sonuna kadar`;

  return (
    <div className="screen screen--home">
      <header className="screen-head">
        <div>
          <p className="eyebrow">{monthLabel(month)}</p>
          <h1 className="wordmark">Cep Defteri</h1>
        </div>
        <button className="icon-btn only-phone" onClick={() => go('settings')} aria-label="Ayarlar">
          <Settings size={22} />
        </button>
      </header>

      <ClawdNote
        mood={mood.mood}
        text={mood.text}
        why={mood.why}
        outfit={data.settings.clawd.homeOutfit}
        action={
          mood.focus === 'accounts' ? <button className="link link--small" onClick={() => openSheet({ kind: 'account' })}>Hesap ekle</button>
          : mood.focus === 'add' ? <button className="link link--small" onClick={() => openSheet({ kind: 'add' })}>İlk kaydı gir</button>
          : mood.focus === 'upcoming' ? <a className="link link--small" href="#yaklasan">Yaklaşanlara bak</a>
          : mood.focus === 'budget' ? <button className="link link--small" onClick={() => go('budget')}>Bütçeye bak</button>
          : mood.focus === 'goal' ? <button className="link link--small" onClick={() => go('invest')}>Hedefe bak</button>
          : null
        }
      />

      <div className="home-grid">
        <section className="card receipt" aria-labelledby="avail-h">
          <div className="receipt__top">
            <h2 id="avail-h" className="label">Kullanılabilir para</h2>
            <span className="receipt__period">{periodText}</span>
          </div>
          {av.confidence === 'none' ? (
            <p className="muted">Bir hesap ekleyince burada ne kadarını rahatça harcayabileceğini göreceksin.</p>
          ) : (
            <>
              <Amount value={av.available} size="xl" className={av.available < 0 ? 'tone-warn' : ''} />
              {av.available > 0 && <p className="receipt__perday">günde yaklaşık <b>{formatMoney(av.perDay)}</b> · {av.daysLeft} gün</p>}
              <dl className="receipt__lines">
                <div>
                  <dt>Günlük hesaplarda</dt>
                  <dd>{formatMoney(av.dailyBalance)}</dd>
                </div>
                <div>
                  <dt>
                    − Yaklaşan ödemeler{av.payments.length ? ` (${av.payments.length})` : ''}
                  </dt>
                  <dd>{formatMoney(av.paymentsTotal)}</dd>
                </div>
                {av.transfersTotal > 0 && (
                  <div>
                    <dt>− Planlı yatırım aktarımı</dt>
                    <dd>{formatMoney(av.transfersTotal)}</dd>
                  </div>
                )}
                {av.reserve > 0 && (
                  <div>
                    <dt>− Kenarda tuttuğun birikim payı</dt>
                    <dd>{formatMoney(av.reserve)}</dd>
                  </div>
                )}
                <div className="receipt__total">
                  <dt>= Kullanılabilir</dt>
                  <dd>{formatMoney(av.available)}</dd>
                </div>
              </dl>
              {av.expectedTotal > 0 && (
                <p className="receipt__note">
                  <Info size={14} aria-hidden /> Beklenen {formatMoney(av.expectedTotal)} gelir henüz gelmediği için hesaba katılmadı.
                </p>
              )}
              {av.confidence === 'partial' && (
                <p className="receipt__note">
                  <Info size={14} aria-hidden /> Yaklaşan ödeme girmediğin için bu tutar yalnızca bakiyeni gösteriyor.{' '}
                  <button className="link link--small" onClick={() => openSheet({ kind: 'plan' })}>Ödeme ekle</button>
                </p>
              )}
            </>
          )}
        </section>

        <section className="card" id="yaklasan" aria-labelledby="up-h">
          <SectionHead id="up-h" title="Yaklaşan" action={<button className="link" onClick={() => go('budget')}>Planlar <ChevronRight size={16} /></button>} />
          {soon.length === 0 ? (
            <p className="muted">
              Önümüzdeki 2 haftada planlı ödeme ya da beklenen gelir yok.{' '}
              <button className="link link--small" onClick={() => openSheet({ kind: 'plan' })}>Plan ekle</button>
            </p>
          ) : (
            <ul className="due-list">
              {soon.map((o) => {
                const inflow = planIsInflow(o.plan, lookups.accounts);
                return (
                  <li key={o.plan.id + o.due} className={o.due < today ? 'is-overdue' : ''}>
                    <CalendarClock size={18} aria-hidden />
                    <span className="due-list__main">
                      <span className="due-list__title">{o.plan.title}</span>
                      <span className="due-list__sub">{shortDate(o.due, today)} · {dueLabel(o.due, today)}{inflow ? ' · beklenen' : ''}</span>
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
          {d.up.total > 0 && <p className="note-line">Önümüzdeki 7 günde {formatMoney(d.up.total)} ödeme var{d.up.overdue.length ? `; ${d.up.overdue.length} tanesi gecikmiş görünüyor` : ''}.</p>}
        </section>
        <section className="month-stats" aria-label={`${monthName(month)} özeti`}>
          <button className="stat" onClick={() => go('tx', { filter: { month, kind: 'income' } })}>
            <span className="stat__label">Bu ay gelen gelir</span>
            <Amount value={sum.income} size="md" tone="pos" />
            <span className="stat__hint">gerçekleşmiş</span>
          </button>
          <button className="stat" onClick={() => go('tx', { filter: { month, kind: 'expense' } })}>
            <span className="stat__label">Bu ay harcama</span>
            <Amount value={sum.spending} size="md" />
            <span className="stat__hint">{sum.refunds ? `${formatMoney(sum.refunds)} iade düşüldü` : 'transfer ve yatırım hariç'}</span>
          </button>
          <button className="stat" onClick={() => go('invest')}>
            <span className="stat__label">Yatırıma aktarılan</span>
            <Amount value={sum.contributions} size="md" tone="invest" />
            <span className="stat__hint">{sum.withdrawals ? `${formatMoney(sum.withdrawals)} çekildi` : 'bu ay'}</span>
          </button>
          {budget.budget !== null && (
            <button className="stat stat--budget" onClick={() => go('budget')}>
              <span className="stat__label">Bütçe</span>
              <span className="stat__value">
                {formatMoney(budget.spent)} <small>/ {formatMoney(budget.budget)}</small>
              </span>
              <Progress value={budget.spent} max={budget.budget} label="Aylık bütçe kullanımı" tone={budget.state === 'over' ? 'warn' : 'accent'} marker={budget.elapsedPct} />
            </button>
          )}
        </section>

        <section className="card" aria-labelledby="acc-h">
          <SectionHead id="acc-h" title="Hesaplar" action={<button className="link" onClick={() => openSheet({ kind: 'account' })}><Plus size={16} /> Ekle</button>} />
          {dailyAccs.length === 0 && invAccs.length === 0 && <p className="muted">Henüz hesap yok.</p>}
          <ul className="acc-list">
            {dailyAccs.map((a) => {
              const I = ACCOUNT_ICONS[a.kind];
              return (
                <li key={a.id}>
                  <button className="acc-row" onClick={() => go('tx', { filter: { accountId: a.id } })}>
                    <I size={18} aria-hidden />
                    <span className="acc-row__name">{a.name}{a.archived && <small> (arşiv)</small>}</span>
                    <Amount value={cashBalance(data, a.id)} />
                  </button>
                </li>
              );
            })}
            {dailyAccs.length > 1 && (
              <li className="acc-total">
                <span>Günlük hesaplar toplamı</span>
                <Amount value={daily} />
              </li>
            )}
          </ul>
          {invAccs.length > 0 && (
            <>
              <h3 className="sub-label"><Sprout size={14} aria-hidden /> Yatırım (ayrı hesap)</h3>
              <ul className="acc-list">
                {invAccs.map((a) => {
                  const st = investmentState(data, a.id)!;
                  return (
                    <li key={a.id}>
                      <button className="acc-row acc-row--invest" onClick={() => go('invest')}>
                        <Sprout size={18} aria-hidden />
                        <span className="acc-row__name">
                          {a.name}
                          <small>değer {shortDate(st.lastValuation.date, today)}{st.flowsSinceValuation !== 0 ? ' + sonraki hareketler' : ''}</small>
                        </span>
                        <Amount value={st.currentValue} tone="invest" />
                      </button>
                    </li>
                  );
                })}
              </ul>
              <p className="acc-net">
                Günlük hesaplar + yatırım = <b>{formatMoney(daily + invTotal)}</b>
                <small>Yatırım harcanabilir paraya dahil değildir.</small>
              </p>
            </>
          )}
          {invAccs.length === 0 && dailyAccs.length > 0 && (
            <button className="link link--small" onClick={() => openSheet({ kind: 'account', kindPreset: 'investment' })}>
              <Sprout size={14} /> Yatırım hesabı ekle
            </button>
          )}
        </section>


        <section className="card" aria-labelledby="recent-h">
          <SectionHead id="recent-h" title="Son işlemler" action={data.txs.length > 0 && <button className="link" onClick={() => go('tx', { filter: {} })}>Tümü <ChevronRight size={16} /></button>} />
          {recent.length === 0 ? (
            <p className="muted">Henüz işlem yok. Sağ alttaki <b>+</b> ile ilk kaydını birkaç saniyede girebilirsin.</p>
          ) : (
            <ul className="tx-list">
              {recent.map((t) => (
                <TxRow key={t.id} t={t} data={data} lookups={lookups} showDate={shortDate(t.date, today)} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
