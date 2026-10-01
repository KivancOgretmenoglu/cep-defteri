import { pct } from '../domain/tr';
import { useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Plus, RefreshCw, Target, Pencil, Trash2 } from 'lucide-react';
import type { ID } from '../domain/types';
import { formatMoney, type Money } from '../domain/money';
import { monthEnd, monthOf, monthStart, shortDate } from '../domain/dates';
import { accountIndex, goalProgress, investmentState, isInvestment, rangeSummary, transferKind } from '../domain/ledger';
import * as A from '../domain/actions';
import { commit } from '../store/store';
import { Amount, Chip, Progress, SectionHead } from '../ui/kit';
import { openSheet } from '../ui/nav';
import { useData } from '../ui/hooks';
import { ClawdNote, EmptyState } from '../ui/ClawdNote';

export function Invest() {
  const { data, today } = useData();
  const invAccounts = data.accounts.filter((a) => isInvestment(a) && (!a.archived || investmentState(data, a.id)!.currentValue !== 0));
  const [sel, setSel] = useState<ID | null>(null);
  const accountId = sel && invAccounts.some((a) => a.id === sel) ? sel : invAccounts[0]?.id;
  const month = monthOf(today);

  const view = useMemo(() => {
    if (!accountId) return null;
    const st = investmentState(data, accountId)!;
    const accounts = accountIndex(data);
    const only = { ...data, txs: data.txs.filter((t) => t.type === 'transfer' && (t.accountId === accountId || t.toAccountId === accountId)) };
    const m = rangeSummary(only, monthStart(month), monthEnd(month));
    const events = [
      ...only.txs.map((t) => ({ kind: transferKind(t, accounts), date: t.date, seq: t.seq, amount: t.amount, id: t.id, note: t.note, other: accounts.get(t.accountId === accountId ? t.toAccountId! : t.accountId)?.name })),
      ...st.history.map((v) => ({ kind: v.isOpening ? 'opening' : 'value', date: v.date, seq: v.seq, amount: v.value, id: v.id ?? 'opening', note: undefined, other: undefined })),
    ].sort((a, b) => (a.date === b.date ? b.seq - a.seq : a.date < b.date ? 1 : -1));
    const goals = data.goals.filter((g) => g.accountId === accountId).map((g) => goalProgress(data, g)!);
    return { st, m, events, goals };
  }, [data, accountId, month]);

  if (!accountId || !view) {
    return (
      <div className="screen">
        <header className="screen-head"><h1>Yatırım</h1></header>
        <section className="card">
          <EmptyState outfit="gardener" mood="curious" title="Yatırım hesabı ayrı tutulur" action={<button className="btn btn--primary" onClick={() => openSheet({ kind: 'account', kindPreset: 'investment' })}>Yatırım hesabı ekle</button>}>
            Yatırıma gönderdiğin para harcama sayılmaz; günlük bakiyenden çıkar, buraya katkı olarak eklenir. Güncel değeri istediğin zaman elle girersin.
          </EmptyState>
        </section>
      </div>
    );
  }
  const { st, m, events, goals } = view;
  const reached = goals.find((g) => g.reached);
  const near = goals.find((g) => !g.reached && g.pct >= 80);

  return (
    <div className="screen">
      <header className="screen-head">
        <h1>Yatırım</h1>
        {invAccounts.length > 1 && (
          <div className="chip-row">
            {invAccounts.map((a) => <Chip key={a.id} on={a.id === accountId} onClick={() => setSel(a.id)}>{a.name}</Chip>)}
          </div>
        )}
      </header>

      <div className="invest-grid">
        <section className="card invest-hero" aria-labelledby="inv-h">
          <div className="invest-hero__top">
            <h2 id="inv-h" className="label">{st.account.name} · güncel değer</h2>
            <button className="icon-btn" onClick={() => openSheet({ kind: 'account', accountId })} aria-label="Hesabı düzenle"><Pencil size={18} /></button>
          </div>
          <Amount value={st.currentValue} size="xl" tone="invest" />
          <p className="invest-hero__date">
            {st.lastValuation.isOpening ? 'Açılış değeri' : 'Son girdiğin değer'}: {formatMoney(st.lastValuation.value)} · {shortDate(st.lastValuation.date, today)}
            {st.flowsSinceValuation !== 0 && <> · sonrasındaki net hareket {formatMoney(st.flowsSinceValuation, { sign: true })} eklendi</>}
          </p>
          <div className="btn-row">
            <button className="btn btn--primary" onClick={() => openSheet({ kind: 'valuation', accountId })}><RefreshCw size={17} /> Değeri güncelle</button>
            <button className="btn btn--secondary" onClick={() => openSheet({ kind: 'add', preset: { type: 'invest', direction: 'in', accountId } })}><ArrowDownLeft size={17} /> Para aktar</button>
            <button className="btn btn--ghost" onClick={() => openSheet({ kind: 'add', preset: { type: 'invest', direction: 'out', accountId } })}><ArrowUpRight size={17} /> Çek</button>
          </div>
        </section>

        <section className="card" aria-labelledby="contrib-h">
          <SectionHead id="contrib-h" title="Senin koyduğun para" />
          <dl className="kv">
            <div><dt>Bu ay yatırılan</dt><dd className="tone-invest">{formatMoney(m.contributions)}</dd></div>
            <div><dt>Toplam yatırılan <small>(kayıtlı, takip başlangıcı {shortDate(st.account.openingDate, today)})</small></dt><dd>{formatMoney(st.contributed)}</dd></div>
            <div><dt>Geri çekilen</dt><dd>{formatMoney(st.withdrawn)}</dd></div>
            <div className="kv__strong"><dt>Net katkı <small>(yatırılan − çekilen)</small></dt><dd>{formatMoney(st.netContribution)}</dd></div>
            <div><dt>Takip öncesi katkı</dt><dd>{st.account.priorContribution != null ? formatMoney(st.account.priorContribution) : st.account.openingBalance === 0 ? '—' : 'bilinmiyor'}</dd></div>
          </dl>
          <ValueDiff diff={st.valueDiff} basis={st.basis} onFix={() => openSheet({ kind: 'account', accountId })} />
        </section>

        <section className="card" aria-labelledby="goal-h">
          <SectionHead id="goal-h" title="Birikim hedefleri" action={<button className="link" onClick={() => openSheet({ kind: 'goal', accountId })}><Plus size={16} /> Hedef</button>} />
          {(reached || near) && (
            <ClawdNote
              compact
              size={64}
              outfit="gardener"
              mood={reached ? 'celebrate' : 'happy'}
              text={reached ? `“${reached.goal.title}” tamam! Net katkın ${formatMoney(reached.current)}.` : `“${near!.goal.title}” hedefinin ${pct(near!.pct, 'locYou')}.`}
              why="Hedef ilerlemesi senin koyduğun net paraya göre ölçülür; piyasa değeri değişince geri gitmez."
            />
          )}
          {goals.length === 0 ? (
            <p className="muted"><Target size={15} aria-hidden /> İstersen bir hedef koy (ör. yaz okulu için 10.000 TL). İlerlemesi net katkıya göre ölçülür.</p>
          ) : (
            <ul className="goal-list">
              {goals.map((g) => (
                <li key={g.goal.id}>
                  <button className="goal-row" onClick={() => openSheet({ kind: 'goal', goalId: g.goal.id })}>
                    <span className="goal-row__head">
                      <span>{g.goal.title}</span>
                      <span>{formatMoney(g.current)} / {formatMoney(g.goal.target)}</span>
                    </span>
                    <Progress value={g.current} max={g.goal.target} tone={g.reached ? 'pos' : 'invest'} label={`${g.goal.title} hedefi`} />
                    <small>{g.reached ? 'Ulaşıldı' : `%${g.pct} · ${formatMoney(g.goal.target - g.current)} kaldı`}{!g.priorKnown ? ' · takip öncesi katkı bilinmediği için yalnız kayıtlı katkı sayılıyor' : ''}</small>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card" aria-labelledby="chart-h">
          <SectionHead id="chart-h" title="Değer ve katkı" />
          <ValueChart history={st.history.map((h) => ({ date: h.date, value: h.value }))} />
          <p className="note-line">Noktalar elle girdiğin değerlerdir. Fiyat düşüşü senin hatan değil; burada yalnızca kaydı tutuyoruz.</p>
        </section>

        <section className="card card--span" aria-labelledby="hist-h">
          <SectionHead id="hist-h" title="Hareketler ve değerler" />
          <ul className="inv-events">
            {events.map((e) => (
              <li key={e.kind + e.id} className={`inv-ev inv-ev--${e.kind}`}>
                <span className="inv-ev__date">{shortDate(e.date, today)}</span>
                <span className="inv-ev__main">
                  {e.kind === 'contribution' && <>Katkı <small>{e.other} hesabından{e.note ? ` · ${e.note}` : ''}</small></>}
                  {e.kind === 'withdrawal' && <>Çekim <small>{e.other} hesabına{e.note ? ` · ${e.note}` : ''}</small></>}
                  {e.kind === 'investment-internal' && <>Yatırım hesapları arası</>}
                  {e.kind === 'value' && <>Değer girildi <small>para hareketi değil</small></>}
                  {e.kind === 'opening' && <>Takip başladı <small>açılış değeri, gelir sayılmaz</small></>}
                </span>
                <span className="inv-ev__amt">
                  {e.kind === 'contribution' ? '+' : e.kind === 'withdrawal' ? '−' : ''}
                  {formatMoney(e.amount)}
                </span>
                {(e.kind === 'contribution' || e.kind === 'withdrawal') && (
                  <button className="icon-btn icon-btn--small" aria-label="Düzenle" onClick={() => openSheet({ kind: 'edit', txId: e.id })}><Pencil size={15} /></button>
                )}
                {e.kind === 'value' && (
                  <button className="icon-btn icon-btn--small" aria-label="Değer kaydını sil" onClick={() => commit((d) => A.deleteValuation(d, e.id), 'Değer kaydı silindi')}><Trash2 size={15} /></button>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function ValueDiff({ diff, basis, onFix }: { diff: Money | null; basis: Money | null; onFix: () => void }) {
  if (diff === null || basis === null)
    return (
      <p className="callout callout--quiet">
        Takip öncesinde bu hesaba ne kadar koyduğun bilinmediği için kâr/zarar hesaplamıyorum. <button className="link link--small" onClick={onFix}>Bilgiyi ekle</button>
      </p>
    );
  return (
    <p className="callout callout--quiet">
      Güncel değer, toplam net katkından <b>{formatMoney(Math.abs(diff))} {diff >= 0 ? 'fazla' : 'az'}</b> (taban {formatMoney(basis)}). Bu bir getiri oranı değil; katkıların zamanlaması hesaba katılmaz.
    </p>
  );
}

function ValueChart({ history }: { history: { date: string; value: number }[] }) {
  if (history.length < 2) return <p className="muted">İkinci bir değer girince burada değişimi çizgi olarak göreceksin.</p>;
  const W = 320, H = 132, P = 8, B = 22;
  const vals = history.map((h) => h.value);
  const min = Math.min(...vals), max = Math.max(...vals);
  const span = max - min || 1;
  const pts = history.map((h, i) => [P + (i / (history.length - 1)) * (W - 2 * P), H - B - ((h.value - min) / span) * (H - B - P)] as const);
  return (
    <svg className="value-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Değer geçmişi: ${history.map((h) => `${shortDate(h.date)} ${formatMoney(h.value)}`).join(', ')}`}>
      <polyline points={pts.map((p) => p.join(',')).join(' ')} fill="none" stroke="var(--invest)" strokeWidth="2" strokeLinejoin="round" />
      {pts.map(([x, y], i) => <rect key={i} x={x - 3} y={y - 3} width="6" height="6" fill="var(--surface)" stroke="var(--invest)" strokeWidth="2" />)}
      <text x={0} y={H - 2} className="value-chart__lbl">{shortDate(history[0].date)}</text>
      <text x={W} y={H - 2} textAnchor="end" className="value-chart__lbl">{shortDate(history[history.length - 1].date)}</text>
    </svg>
  );
}
