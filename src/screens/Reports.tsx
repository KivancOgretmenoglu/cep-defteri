import { pct } from '../domain/tr';
import { useMemo } from 'react';
import { Download, ChevronRight, ScrollText } from 'lucide-react';
import type { Data, ID } from '../domain/types';
import { formatMoney, type Money } from '../domain/money';
import { addMonths, dayOfMonth, monthLabel, monthName, monthOf, monthShort, shortDate, type MonthKey } from '../domain/dates';
import { allTags, budgetStatus, compareMonth, monthTrend, tagSummary, type Comparison } from '../domain/ledger';
import { monthEnd, monthStart } from '../domain/dates';
import { MonthSwitcher, SectionHead } from '../ui/kit';
import { go, openSheet, useNav } from '../ui/nav';
import { useData, useLookups } from '../ui/hooks';
import { ClawdNote, EmptyState } from '../ui/ClawdNote';
import { CatIcon } from '../ui/icons';
import { downloadCSV } from './Settings';
import type { Mood } from '../domain/mood';

function rangeText(c: Comparison['current']) {
  const a = dayOfMonth(c.from), b = dayOfMonth(c.to);
  return `${a}–${b} ${monthShort(monthOf(c.from))}`;
}

/** Rapor yorumu: yalnızca gerçek kayıtlardan; karşılaştırma anlamlı değilse söylemez. */
function reportComment(data: Data, month: MonthKey, today: string, c: Comparison, catName: (id: ID) => string): { mood: Mood; text: string; why: string } {
  if (c.current.txCount === 0) return { mood: 'curious', text: 'Bu dönemde kayıt yok; yorum yapacak bir şey bulamadım.', why: 'Yorumlar yalnızca girilen kayıtlardan üretilir.' };
  const lines: string[] = [];
  const whys: string[] = [];
  if (!c.meaningful) {
    lines.push(c.previousComplete ? `Önceki dönemde kayıt olmadığı için karşılaştırma yapmıyorum.` : `Takip ${monthName(addMonths(month, -1))} başından önce başlamadığı için önceki ayla karşılaştırmıyorum; eksik bir dönemden sonuç çıkarmak yanıltıcı olur.`);
  } else {
    const d = c.current.spending - c.previous.spending;
    if (c.previous.spending > 0) {
      const ch = Math.round((Math.abs(d) / c.previous.spending) * 100);
      lines.push(d === 0 ? 'Harcaman önceki dönemle aynı.' : `Harcaman ${rangeText(c.previous)} dönemine göre %${ch} ${d < 0 ? 'daha az' : 'daha fazla'} (${formatMoney(c.previous.spending)} → ${formatMoney(c.current.spending)}).`);
    }
    // En çok değişen kategori
    const ids = new Set([...c.current.spendingByCategory.keys(), ...c.previous.spendingByCategory.keys()]);
    let best: { id: ID; diff: Money } | null = null;
    for (const id of ids) {
      const diff = (c.current.spendingByCategory.get(id) ?? 0) - (c.previous.spendingByCategory.get(id) ?? 0);
      if (!best || Math.abs(diff) > Math.abs(best.diff)) best = { id, diff };
    }
    if (best && Math.abs(best.diff) >= 5000) lines.push(`En büyük fark ${catName(best.id)} kategorisinde: ${formatMoney(best.diff, { sign: true })}.`);
    whys.push(`Karşılaştırılan aralıklar: ${rangeText(c.current)} ve ${rangeText(c.previous)}${c.partial ? ' (devam eden ay, önceki ayın aynı günleriyle)' : ''}.`);
  }
  const b = budgetStatus(data, month, today);
  let mood: Mood = 'calm';
  if (b.budget !== null && b.usedPct !== null) {
    if (c.partial) lines.push(`Bütçenin ${pct(b.usedPct, 'poss')} kullanıldı, ayın ${pct(b.elapsedPct, 'poss')} geçti.`);
    else lines.push(b.spent <= b.budget ? `Ay, bütçenin ${formatMoney(b.budget - b.spent)} altında kapandı.` : `Ay, bütçeyi ${formatMoney(b.spent - b.budget)} aşarak kapandı.`);
    if (b.state === 'on-track' || b.state === 'closed-within') mood = 'happy';
    if (b.state === 'over' || b.state === 'tight') mood = 'thoughtful';
    whys.push('İyi/kötü değerlendirmesi yalnızca senin koyduğun bütçeye göre yapılır.');
  } else whys.push('Bütçe tanımlı olmadığı için iyileşme ya da kötüleşme yorumu yapmıyorum, yalnızca farkları gösteriyorum.');
  return { mood, text: lines.join(' '), why: whys.join(' ') };
}

export function Reports() {
  const { data, today } = useData();
  const { cats } = useLookups(data);
  const nav = useNav();
  const current = monthOf(today);
  const month = nav.reportMonth ?? current;
  const setMonth = (m: MonthKey) => go('reports', { reportMonth: m });
  const c = useMemo(() => compareMonth(data, month, today), [data, month, today]);
  const trend = useMemo(() => monthTrend(data, month, 6), [data, month]);
  const catName = (id: ID) => cats.get(id)?.name ?? 'Kategorisiz';
  const comment = reportComment(data, month, today, c, catName);
  const s = c.current;

  const spendRows = [...s.spendingByCategory.entries()].filter(([, v]) => v !== 0).sort((a, b) => b[1] - a[1]);
  const incomeRows = [...s.incomeBySource.entries()].sort((a, b) => b[1] - a[1]);
  const maxSpend = Math.max(1, ...spendRows.map(([, v]) => v));
  const maxInc = Math.max(1, ...incomeRows.map(([, v]) => v));
  const tagRows = allTags(data)
    .map((t) => ({ tag: t.tag, month: tagSummary(data, t.tag, monthStart(month), monthEnd(month)), all: tagSummary(data, t.tag) }))
    .filter((r) => r.month.txCount > 0 || r.all.txCount > 0)
    .sort((a, b) => b.month.spending - a.month.spending || b.all.spending - a.all.spending)
    .slice(0, 8);

  if (data.txs.length === 0) {
    return (
      <div className="screen">
        <header className="screen-head"><h1>Raporlar</h1></header>
        <section className="card">
          <EmptyState outfit="scholar" title="İnceleyecek kayıt yok">Birkaç işlem girince paranın nereden gelip nereye gittiğini burada göstereceğim.</EmptyState>
        </section>
      </div>
    );
  }

  return (
    <div className="screen">
      <header className="screen-head">
        <h1>Raporlar</h1>
        <MonthSwitcher month={month} onChange={setMonth} max={current} />
      </header>

      <ClawdNote mood={comment.mood} text={comment.text} why={comment.why} outfit="scholar" size={84} />
      {month < current && (
        <button className="report-prompt" onClick={() => openSheet({ kind: 'reportCard', month })}>
          <ScrollText size={20} aria-hidden />
          <span><b>{monthLabel(month)} karnesi</b><small>Ayın özeti, paylaşılabilir resim</small></span>
          <ChevronRight size={18} aria-hidden />
        </button>
      )}

      <div className="report-grid">
        <section className="card" aria-labelledby="sum-h">
          <SectionHead id="sum-h" title={c.partial ? `${monthLabel(month)} · ${shortDate(s.from)}–${shortDate(s.to)}` : monthLabel(month)} />
          <table className="cmp-table">
            <thead>
              <tr>
                <th scope="col"></th>
                <th scope="col">Bu dönem<small>{rangeText(c.current)}</small></th>
                <th scope="col">Önceki<small>{rangeText(c.previous)}</small></th>
              </tr>
            </thead>
            <tbody>
              <tr><th scope="row">Gelir</th><td className="tone-pos">{formatMoney(s.income)}</td><td>{c.previousComplete ? formatMoney(c.previous.income) : '—'}</td></tr>
              <tr><th scope="row">Harcama</th><td>{formatMoney(s.spending)}</td><td>{c.previousComplete ? formatMoney(c.previous.spending) : '—'}</td></tr>
              <tr><th scope="row">Yatırıma aktarılan</th><td className="tone-invest">{formatMoney(s.contributions)}</td><td>{c.previousComplete ? formatMoney(c.previous.contributions) : '—'}</td></tr>
              <tr><th scope="row">Gelir − harcama</th><td>{formatMoney(s.income - s.spending, { sign: true })}</td><td>{c.previousComplete ? formatMoney(c.previous.income - c.previous.spending, { sign: true }) : '—'}</td></tr>
            </tbody>
          </table>
          {!c.previousComplete && <p className="note-line">Önceki dönem takip başlangıcından önce kaldığı için gösterilmiyor.</p>}
          {c.partial && <p className="note-line">Ay devam ediyor: önceki ayın yalnızca aynı günleri ({rangeText(c.previous)}) karşılaştırılıyor.</p>}
        </section>

        <section className="card" aria-labelledby="cat-h">
          <SectionHead id="cat-h" title="Harcama kategorileri" />
          {spendRows.length === 0 ? <p className="muted">Bu dönemde harcama yok.</p> : (
            <ul className="bars">
              {spendRows.map(([id, v]) => {
                const cat = cats.get(id);
                const prev = c.previous.spendingByCategory.get(id) ?? 0;
                return (
                  <li key={id}>
                    <button className="bar-row" onClick={() => go('tx', { filter: { month, categoryId: id, kind: 'expense' } })}>
                      <span className="bar-row__head">
                        <span className="bar-row__name" style={{ '--cat': cat?.color } as React.CSSProperties}>
                          <CatIcon icon={cat?.icon ?? 'dots'} size={15} /> {catName(id)}
                        </span>
                        <span className="bar-row__val">
                          {formatMoney(v)}
                          {c.meaningful && <small className="bar-row__delta">{prev === 0 ? 'önceki: 0' : `${formatMoney(v - prev, { sign: true })}`}</small>}
                        </span>
                      </span>
                      <span className="bar"><span className="bar__fill" style={{ width: `${(Math.max(v, 0) / maxSpend) * 100}%`, background: cat?.color }} /></span>
                      <ChevronRight size={16} className="bar-row__chev" aria-hidden />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {s.refunds > 0 && <p className="note-line">{formatMoney(s.refunds)} iade ilgili kategorilerden düşüldü.</p>}
        </section>

        <section className="card" aria-labelledby="inc-h">
          <SectionHead id="inc-h" title="Gelir kaynakları" />
          {incomeRows.length === 0 ? <p className="muted">Bu dönemde gerçekleşmiş gelir yok.</p> : (
            <ul className="bars">
              {incomeRows.map(([id, v]) => {
                const cat = cats.get(id);
                return (
                  <li key={id}>
                    <button className="bar-row" onClick={() => go('tx', { filter: { month, categoryId: id, kind: 'income' } })}>
                      <span className="bar-row__head">
                        <span className="bar-row__name" style={{ '--cat': cat?.color } as React.CSSProperties}><CatIcon icon={cat?.icon ?? 'dots'} size={15} /> {catName(id)}</span>
                        <span className="bar-row__val">{formatMoney(v)}</span>
                      </span>
                      <span className="bar"><span className="bar__fill" style={{ width: `${(v / maxInc) * 100}%`, background: cat?.color }} /></span>
                      <ChevronRight size={16} className="bar-row__chev" aria-hidden />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="note-line">Transferler, yatırımdan çekimler, iadeler ve açılış bakiyeleri gelir sayılmaz.</p>
        </section>

        {tagRows.length > 0 && (
          <section className="card" aria-labelledby="tag-h">
            <SectionHead id="tag-h" title="Etiketler" />
            <ul className="bars">
              {tagRows.map((r) => (
                <li key={r.tag}>
                  <button className="bar-row" onClick={() => go('tx', { filter: { tag: r.tag } })}>
                    <span className="bar-row__head">
                      <span className="bar-row__name">#{r.tag}</span>
                      <span className="bar-row__val">
                        {formatMoney(r.month.spending)}
                        <small className="bar-row__delta">tüm zamanlar {formatMoney(r.all.spending)}</small>
                      </span>
                    </span>
                    <ChevronRight size={16} className="bar-row__chev" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
            <p className="note-line">Bu ayki harcama ve etiketin tüm zamanlardaki toplamı (iadeler düşülmüş). Bir etiket birden çok kategoriye yayılabilir.</p>
          </section>
        )}

        <section className="card" aria-labelledby="trend-h">
          <SectionHead id="trend-h" title="Son 6 ay" />
          <Trend trend={trend} current={current} onPick={setMonth} selected={month} />
        </section>

        <section className="card card--span">
          <SectionHead title="Dışa aktar" />
          <p className="muted">Tüm işlemleri Excel’de açılabilen CSV dosyası olarak indir.</p>
          <button className="btn btn--secondary" onClick={() => downloadCSV(data)}><Download size={17} /> İşlemler (CSV)</button>
        </section>
      </div>
    </div>
  );
}

function Trend({ trend, current, onPick, selected }: { trend: ReturnType<typeof monthTrend>; current: MonthKey; onPick: (m: MonthKey) => void; selected: MonthKey }) {
  const max = Math.max(1, ...trend.map((t) => Math.max(t.summary.income, t.summary.spending, t.summary.contributions)));
  return (
    <>
      <div className="trend" role="list">
        {trend.map((t) => (
          <button key={t.month} role="listitem" className={`trend__col ${t.month === selected ? 'is-on' : ''}`} onClick={() => onPick(t.month)} aria-label={`${monthLabel(t.month)}: gelir ${formatMoney(t.summary.income)}, harcama ${formatMoney(t.summary.spending)}, yatırım ${formatMoney(t.summary.contributions)}${!t.tracked ? ', takip yok' : ''}`}>
            <span className="trend__bars">
              {t.tracked ? (
                <>
                  <span className="trend__bar trend__bar--inc" style={{ height: `${(t.summary.income / max) * 100}%` }} />
                  <span className="trend__bar trend__bar--sp" style={{ height: `${(Math.max(t.summary.spending, 0) / max) * 100}%` }} />
                  <span className="trend__bar trend__bar--inv" style={{ height: `${(t.summary.contributions / max) * 100}%` }} />
                </>
              ) : <span className="trend__none">—</span>}
            </span>
            <span className="trend__lbl">{monthShort(t.month)}{t.month === current ? '*' : ''}{t.partialTracking ? '°' : ''}</span>
          </button>
        ))}
      </div>
      <div className="trend-legend">
        <span><i className="sw sw--inc" /> Gelir</span>
        <span><i className="sw sw--sp" /> Harcama</span>
        <span><i className="sw sw--inv" /> Yatırım</span>
      </div>
      <p className="note-line">* devam eden ay · ° takip ay ortasında başladı · — takip yok</p>
    </>
  );
}
