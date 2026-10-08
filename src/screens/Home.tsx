import { useMemo } from 'react';
import { Settings, ChevronRight, Plus, Sprout, Info, Eye, EyeOff, HandCoins, ScrollText, ChartLine } from 'lucide-react';
import { monthOf } from '../domain/dates';
import { formatMoney, hiddenMoney, monthLabel, monthName, shortDate } from '../i18n/format';
import { useT } from '../i18n';
import {
  availability, balanceSeries, budgetStatus, cashBalance, dailyBalance, debtTotals, investmentState, investmentTotal, isDaily, isInvestment, monthSummary, pendingReportCard, personBalances, upcomingOutflows, pendingUntil, trackingStart,
} from '../domain/ledger';
import { usePrices } from '../store/prices';
import * as A from '../domain/actions';
import { commit } from '../store/store';
import { mascotEvent } from '../mascot/events';
import { BalanceChart } from '../ui/BalanceChart';
import { DueRow } from '../ui/DueRow';
import { mascotMood } from '../domain/mood';
import { planLine } from '../domain/planLine';
import { addDays } from '../domain/dates';
import { Amount, AnimatedMoney, Progress, SectionHead } from '../ui/kit';
import { useListSettle } from '../ui/motion';
import { MascotNote } from '../mascot/MascotNote';
import { Rings } from '../ui/Rings';
import { TxRow } from '../ui/TxRow';
import { go, openSheet } from '../ui/nav';
import { useData, useLookups } from '../ui/hooks';
import { ACCOUNT_ICONS } from '../ui/icons';
import { BackupReminderCard } from '../native/BackupReminder';
import { Sky } from '../ui/Sky';

export function Home() {
  const t = useT();
  const lang = t.lang;
  const { data, today } = useData();
  const lookups = useLookups(data);
  const month = monthOf(today);
  const d = useMemo(() => {
    const av = availability(data, today);
    const mood = mascotMood(data, today, lang);
    const sum = monthSummary(data, month);
    const budget = budgetStatus(data, month, today);
    const up = upcomingOutflows(data, today, 7);
    const soon = pendingUntil(data, addDays(today, 14)).slice(0, 6);
    const start = trackingStart(data);
    const from = start && start > addDays(today, -29) ? start : addDays(today, -29);
    const spark = start ? balanceSeries(data, from, today) : [];
    // Küçük grafikte de harcama planı çizgisi (bugüne kadarki kısmı görünür).
    const pl = start ? planLine(data, today) : null;
    const sparkPlan = pl ? [{ date: addDays(pl.from, -1), balance: pl.start }, ...pl.points] : [];
    const card = pendingReportCard(data, today);
    return { av, mood, sum, budget, up, soon, spark, sparkPlan, card };
  }, [data, today, month, lang]);
  const { av, mood, sum, budget, soon } = d;
  const dailyAccs = data.accounts.filter((a) => isDaily(a) && (!a.archived || cashBalance(data, a.id) !== 0));
  const invAccs = data.accounts.filter((a) => isInvestment(a) && !a.archived);
  const recent = [...data.txs].sort((a, b) => (a.date === b.date ? b.seq - a.seq : a.date < b.date ? 1 : -1)).slice(0, 5);
  const recentRef = useListSettle<HTMLUListElement>(recent.map((x) => x.id));
  const daily = dailyBalance(data);
  const priceBook = usePrices().book;
  const invTotal = investmentTotal(data, priceBook);
  const hide = data.settings.hideTotals;
  const people = personBalances(data).filter((p) => p.balance !== 0 || !p.account.archived);
  const debts = debtTotals(data);
  const toggleHide = () => {
    commit((x) => A.updateSettings(x, { hideTotals: !hide }));
    mascotEvent({ type: 'hide-totals', hidden: !hide });
  };
  const H = (v: number) => (hide ? hiddenMoney() : formatMoney(v));
  const periodText = data.settings.periodMode === 'days30' ? t('home.periodDays30', { date: shortDate(av.periodEnd) }) : t('home.periodMonth', { month: monthName(month) });

  return (
    <div className="screen screen--home">
      <header className="screen-head sky-head">
        <Sky />
        <div>
          <p className="eyebrow">{monthLabel(month)}</p>
          <h1 className="wordmark">Cep Defteri</h1>
        </div>
        <div className="head-actions">
          <button className="icon-btn" onClick={toggleHide} aria-pressed={hide} aria-label={hide ? t('home.showBalances') : t('home.hideBalances')} title={hide ? t('home.showBalances') : t('home.hideBalances')}>
            {hide ? <EyeOff size={22} /> : <Eye size={22} />}
          </button>
          <button className="icon-btn only-phone" onClick={() => go('settings')} aria-label={t('nav.settings')}>
            <Settings size={22} />
          </button>
        </div>
      </header>

      {d.card && (
        <button className="report-prompt" onClick={() => openSheet({ kind: 'reportCard', month: d.card! })}>
          <ScrollText size={20} aria-hidden />
          <span><b>{t('home.cardReady', { month: monthName(d.card) })}</b><small>{t('home.cardSub')}</small></span>
          <ChevronRight size={18} aria-hidden />
        </button>
      )}

      <MascotNote
        mood={mood.mood}
        text={mood.text}
        why={mood.why}
        outfit={hide ? 'spy' : data.settings.mascot.outfit}
        action={
          mood.focus === 'accounts' ? <button className="link link--small" onClick={() => openSheet({ kind: 'account' })}>{t('home.addAccount')}</button>
          : mood.focus === 'add' ? <button className="link link--small" onClick={() => openSheet({ kind: 'add' })}>{t('home.firstEntry')}</button>
          : mood.focus === 'upcoming' ? <a className="link link--small" href="#yaklasan">{t('home.seeUpcoming')}</a>
          : mood.focus === 'budget' ? <button className="link link--small" onClick={() => go('budget')}>{t('home.seeBudget')}</button>
          : mood.focus === 'goal' ? <button className="link link--small" onClick={() => go('invest')}>{t('home.seeGoal')}</button>
          : null
        }
      />

      <BackupReminderCard />

      <div className="home-grid">
        <Rings />
        <section className="card receipt" aria-labelledby="avail-h">
          <div className="receipt__top">
            <h2 id="avail-h" className="label">{t('home.available')}</h2>
            <span className="receipt__period">{periodText}</span>
          </div>
          {av.confidence === 'none' ? (
            <p className="muted">{t('home.availableEmpty')}</p>
          ) : (
            <>
              <div className="receipt__hero">
                <Amount value={av.available} size="xl" hide={hide} animate className={av.available < 0 && !hide ? 'tone-warn' : ''} />
                <button className="icon-btn icon-btn--small" onClick={toggleHide} aria-label={hide ? t('home.showBalances') : t('home.hideBalances')}>{hide ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              </div>
              {av.available > 0 && <p className="receipt__perday">{t('home.perDayPre')} <b><AnimatedMoney value={av.perDay} hide={hide} /></b>{t('home.perDayPost')} · {t('common.days', { n: av.daysLeft })}</p>}
              <dl className="receipt__lines">
                <div>
                  <dt>{t('home.inDaily')}</dt>
                  <dd><AnimatedMoney value={av.dailyBalance} hide={hide} /></dd>
                </div>
                <div>
                  <dt>
                    − {t('home.upcomingPayments')}{av.payments.length ? ` (${av.payments.length})` : ''}
                  </dt>
                  <dd>{formatMoney(av.paymentsTotal)}</dd>
                </div>
                {av.transfersTotal > 0 && (
                  <div>
                    <dt>− {t('home.plannedInvest')}</dt>
                    <dd>{formatMoney(av.transfersTotal)}</dd>
                  </div>
                )}
                {av.reserve > 0 && (
                  <div>
                    <dt>− {t('home.reserve')}</dt>
                    <dd>{formatMoney(av.reserve)}</dd>
                  </div>
                )}
                {av.debtsOwed > 0 && (
                  <div>
                    <dt>− {t('home.debtsOwed')}</dt>
                    <dd>{formatMoney(av.debtsOwed)}</dd>
                  </div>
                )}
                <div className="receipt__total">
                  <dt>= {t('home.availableShort')}</dt>
                  <dd><AnimatedMoney value={av.available} hide={hide} /></dd>
                </div>
              </dl>
              {av.debtsReceivable > 0 && (
                <p className="receipt__note">
                  <Info size={14} aria-hidden /> {t('home.receivableNote', { amount: formatMoney(av.debtsReceivable) })}
                </p>
              )}
              {av.expectedTotal > 0 && (
                <p className="receipt__note">
                  <Info size={14} aria-hidden /> {t('home.expectedNote', { amount: formatMoney(av.expectedTotal) })}
                </p>
              )}
              {av.confidence === 'partial' && (
                <p className="receipt__note">
                  <Info size={14} aria-hidden /> {t('home.partialNote')}{' '}
                  <button className="link link--small" onClick={() => openSheet({ kind: 'plan' })}>{t('home.addPayment')}</button>
                </p>
              )}
            </>
          )}
        </section>

        <section className="card" id="yaklasan" aria-labelledby="up-h">
          <SectionHead id="up-h" title={t('home.upcoming')} action={<button className="link" onClick={() => go('budget')}>{t('home.plans')} <ChevronRight size={16} /></button>} />
          {soon.length === 0 ? (
            <p className="muted">
              {t('home.noUpcoming')}{' '}
              <button className="link link--small" onClick={() => openSheet({ kind: 'plan' })}>{t('home.addPlan')}</button>
            </p>
          ) : (
            <ul className="due-list">
              {soon.map((o) => <DueRow key={o.plan.id + o.due} o={o} today={today} accounts={lookups.accounts} />)}
            </ul>
          )}
          {d.up.total > 0 && <p className="note-line">{t('home.next7', { amount: formatMoney(d.up.total) })}{d.up.overdue.length ? t('home.overdueSuffix', { n: d.up.overdue.length }) : ''}.</p>}
        </section>
        <section className="month-stats" aria-label={t('home.monthSummary', { month: monthName(month) })}>
          <button className="stat" onClick={() => go('tx', { filter: { month, kind: 'income' } })}>
            <span className="stat__label">{t('home.statIncome')}</span>
            <Amount value={sum.income} size="md" tone="pos" animate />
            <span className="stat__hint">{t('home.statIncomeHint')}</span>
          </button>
          <button className="stat" onClick={() => go('tx', { filter: { month, kind: 'expense' } })}>
            <span className="stat__label">{t('home.statSpending')}</span>
            <Amount value={sum.spending} size="md" animate />
            <span className="stat__hint">{sum.refunds ? t('home.refundsDeducted', { amount: formatMoney(sum.refunds) }) : t('home.statSpendingHint')}</span>
          </button>
          <button className="stat" onClick={() => go('invest')}>
            <span className="stat__label">{t('home.statInvest')}</span>
            <Amount value={sum.contributions} size="md" tone="invest" animate />
            <span className="stat__hint">{sum.withdrawals ? t('home.withdrawn', { amount: formatMoney(sum.withdrawals) }) : t('home.thisMonth')}</span>
          </button>
          {budget.budget !== null && (
            <button className="stat stat--budget" onClick={() => go('budget')}>
              <span className="stat__label">{t('nav.budget')}</span>
              <span className="stat__value">
                {formatMoney(budget.spent)} <small>/ {formatMoney(budget.budget)}</small>
              </span>
              <Progress value={budget.spent} max={budget.budget} label={t('home.budgetUsage')} tone={budget.state === 'over' ? 'warn' : 'accent'} marker={budget.elapsedPct} />
            </button>
          )}
        </section>

        <section className="card" aria-labelledby="acc-h">
          <SectionHead id="acc-h" title={t('home.accounts')} action={<button className="link" onClick={() => openSheet({ kind: 'account' })}><Plus size={16} /> {t('common.add')}</button>} />
          {d.spark.length > 1 && (
            <button className="spark-btn" onClick={() => go('balance')} aria-label={t('home.openHistory')}>
              <BalanceChart history={d.spark} plan={d.sparkPlan} today={today} hide={hide} compact height={64} label={t('home.sparkLabel')} />
              <span className="spark-btn__label"><ChartLine size={15} aria-hidden /> {t('balance.title')} <ChevronRight size={15} aria-hidden /></span>
            </button>
          )}
          {dailyAccs.length === 0 && invAccs.length === 0 && <p className="muted">{t('home.noAccounts')}</p>}
          <ul className="acc-list">
            {dailyAccs.map((a) => {
              const I = ACCOUNT_ICONS[a.kind];
              return (
                <li key={a.id}>
                  <button className="acc-row" onClick={() => go('tx', { filter: { accountId: a.id } })}>
                    <I size={18} aria-hidden />
                    <span className="acc-row__name">{a.name}{a.archived && <small> {t('home.archivedTag')}</small>}</span>
                    <Amount value={cashBalance(data, a.id)} hide={hide} animate />
                  </button>
                </li>
              );
            })}
            {dailyAccs.length > 1 && (
              <li className="acc-total">
                <span>{t('home.dailyTotal')}</span>
                <Amount value={daily} hide={hide} animate />
              </li>
            )}
          </ul>
          {invAccs.length > 0 && (
            <>
              <h3 className="sub-label"><Sprout size={14} aria-hidden /> {t('home.investSeparate')}</h3>
              <ul className="acc-list">
                {invAccs.map((a) => {
                  const st = investmentState(data, a.id, priceBook)!;
                  return (
                    <li key={a.id}>
                      <button className="acc-row acc-row--invest" onClick={() => go('invest')}>
                        <Sprout size={18} aria-hidden />
                        <span className="acc-row__name">
                          {a.name}
                          <small>{t('home.valueAsOf', { date: shortDate(st.lastValuation.date, today) })}{st.flowsSinceValuation !== 0 ? t('home.plusLater') : ''}</small>
                        </span>
                        <Amount value={st.currentValue} tone="invest" hide={hide} animate />
                      </button>
                    </li>
                  );
                })}
              </ul>
              <p className="acc-net">
                {t('home.dailyPlusInvest')} = <b>{H(daily + invTotal)}</b>
                <small>{t('home.investNotSpendable')}</small>
              </p>
            </>
          )}
          {invAccs.length === 0 && dailyAccs.length > 0 && (
            <button className="link link--small" onClick={() => openSheet({ kind: 'account', kindPreset: 'investment' })}>
              <Sprout size={14} /> {t('home.addInvestAccount')}
            </button>
          )}
        </section>


        {people.length > 0 && (
          <section className="card" aria-labelledby="debt-h">
            <SectionHead id="debt-h" title={t('people.title')} action={<button className="link" onClick={() => go('people')}>{t('common.all')} <ChevronRight size={16} /></button>} />
            <div className="debt-mini">
              <span>{t('home.owedToYou')} <b className="tone-pos">{formatMoney(debts.receivable)}</b></span>
              <span>{t('home.youOwe')} <b>{formatMoney(debts.owed)}</b></span>
            </div>
            <ul className="acc-list">
              {people.filter((p) => p.balance !== 0).slice(0, 4).map((p) => (
                <li key={p.account.id}>
                  <button className="acc-row" onClick={() => go('people')}>
                    <HandCoins size={18} aria-hidden />
                    <span className="acc-row__name">{p.account.name}<small>{p.balance > 0 ? t('people.owesYou') : t('people.youOweThem')}</small></span>
                    <span className={p.balance > 0 ? 'tone-pos amount' : 'amount'}>{formatMoney(Math.abs(p.balance))}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="card" aria-labelledby="recent-h">
          <SectionHead id="recent-h" title={t('home.recent')} action={data.txs.length > 0 && <button className="link" onClick={() => go('tx', { filter: {} })}>{t('common.all')} <ChevronRight size={16} /></button>} />
          {recent.length === 0 ? (
            <p className="muted">{t('home.noTxPre')} <b>+</b> {t('home.noTxPost')}</p>
          ) : (
            <ul className="tx-list" ref={recentRef}>
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
