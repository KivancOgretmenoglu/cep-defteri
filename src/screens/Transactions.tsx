import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import type { Tx } from '../domain/types';
import { formatMoney } from '../domain/money';
import { monthEnd, monthOf, monthStart, relativeDay, type MonthKey } from '../domain/dates';
import { allTags, rangeSummary, transferKind, refundCategory } from '../domain/ledger';
import { Chip, MonthSwitcher } from '../ui/kit';
import { TxRow, txView } from '../ui/TxRow';
import { setFilter, useNav, openSheet, type TxFilter } from '../ui/nav';
import { useData, useLookups } from '../ui/hooks';
import { EmptyState } from '../ui/ClawdNote';

const KINDS: { value: NonNullable<TxFilter['kind']>; label: string }[] = [
  { value: 'all', label: 'Tümü' },
  { value: 'expense', label: 'Gider' },
  { value: 'income', label: 'Gelir' },
  { value: 'transfer', label: 'Transfer' },
  { value: 'invest', label: 'Yatırım' },
  { value: 'debt', label: 'Borç' },
];

export function Transactions() {
  const { data, today } = useData();
  const lookups = useLookups(data);
  const { filter } = useNav();
  // Hesap ya da etiket seçilince varsayılan olarak tüm zamanlar gösterilir (ör. bir gezinin toplamı).
  const month: MonthKey | 'all' = filter.month ?? (filter.accountId || filter.tag ? 'all' : monthOf(today));
  const kind = filter.kind ?? 'all';
  const [q, setQ] = useState('');

  const list = useMemo(() => {
    const needle = q.trim().toLocaleLowerCase('tr');
    return data.txs
      .filter((t) => month === 'all' || (t.date >= monthStart(month) && t.date <= monthEnd(month)))
      .filter((t) => {
        if (kind === 'all') return true;
        if (kind === 'expense') return t.type === 'expense' || t.type === 'refund';
        if (kind === 'income') return t.type === 'income';
        const k = t.type === 'transfer' ? transferKind(t, lookups.accounts) : null;
        if (kind === 'invest') return k === 'contribution' || k === 'withdrawal';
        if (kind === 'debt') return k === 'debt' || (t.type === 'expense' && lookups.accounts.get(t.accountId)?.kind === 'person');
        return k === 'internal';
      })
      .filter((t) => !filter.accountId || t.accountId === filter.accountId || t.toAccountId === filter.accountId)
      .filter((t) => !filter.tag || t.tags?.includes(filter.tag))
      .filter((t) => !filter.categoryId || (t.type === 'refund' ? refundCategory(t, lookups.txById) : t.categoryId) === filter.categoryId)
      .filter((t) => {
        if (!needle) return true;
        const v = txView(t, lookups.accounts, lookups.cats, lookups.txById);
        return `${v.title} ${v.sub} ${formatMoney(t.amount)} ${(t.tags ?? []).map((x) => '#' + x).join(' ')}`.toLocaleLowerCase('tr').includes(needle);
      })
      .sort((a, b) => (a.date === b.date ? b.seq - a.seq : a.date < b.date ? 1 : -1));
  }, [data, month, kind, filter.accountId, filter.categoryId, filter.tag, q, lookups]);
  const tagList = useMemo(() => allTags(data).slice(0, 12), [data]);

  const groups = useMemo(() => {
    const g: { date: string; txs: Tx[] }[] = [];
    for (const t of list) {
      const last = g[g.length - 1];
      if (last && last.date === t.date) last.txs.push(t);
      else g.push({ date: t.date, txs: [t] });
    }
    return g;
  }, [list]);

  // Filtrelenmiş listenin toplamları da aynı hesaplama kurallarından gelir.
  const totals = useMemo(() => {
    const sub = { ...data, txs: list };
    const from = month === 'all' ? '0000-01-01' : monthStart(month);
    const to = month === 'all' ? '9999-12-31' : monthEnd(month);
    return rangeSummary(sub, from, to);
  }, [data, list, month]);

  const acc = filter.accountId ? lookups.accounts.get(filter.accountId) : undefined;
  const cat = filter.categoryId ? lookups.cats.get(filter.categoryId) : undefined;

  return (
    <div className="screen">
      <header className="screen-head">
        <h1>İşlemler</h1>
        {month === 'all' ? (
          <button className="chip" onClick={() => setFilter({ ...filter, month: monthOf(today) })}>Tüm zamanlar · aya göre gör</button>
        ) : (
          <MonthSwitcher month={month} onChange={(m) => setFilter({ ...filter, month: m })} max={monthOf(today)} />
        )}
      </header>

      <div className="toolbar">
        <label className="search">
          <Search size={18} aria-hidden />
          <input type="search" placeholder="Ara: not, kategori, tutar" value={q} onChange={(e) => setQ(e.target.value)} aria-label="İşlemlerde ara" />
        </label>
        <div className="chip-row chip-row--scroll" role="group" aria-label="Tür filtresi">
          {KINDS.map((k) => (
            <Chip key={k.value} on={kind === k.value} onClick={() => setFilter({ ...filter, kind: k.value })}>{k.label}</Chip>
          ))}
        </div>
        {tagList.length > 0 && (
          <div className="chip-row chip-row--scroll" role="group" aria-label="Etiket filtresi">
            {tagList.map((t) => (
              <Chip key={t.tag} className="chip--small" on={filter.tag === t.tag} onClick={() => setFilter({ ...filter, tag: filter.tag === t.tag ? undefined : t.tag, month: filter.tag === t.tag ? filter.month : undefined })}>
                #{t.tag} <span className="chip__meta">{t.count}</span>
              </Chip>
            ))}
          </div>
        )}
        {(acc || cat) && (
          <div className="chip-row">
            {acc && (
              <Chip on onClick={() => setFilter({ ...filter, accountId: undefined })}>
                Hesap: {acc.name} <X size={14} aria-label="Filtreyi kaldır" />
              </Chip>
            )}
            {cat && (
              <Chip on onClick={() => setFilter({ ...filter, categoryId: undefined })}>
                Kategori: {cat.name} <X size={14} aria-label="Filtreyi kaldır" />
              </Chip>
            )}
            {month === 'all' && acc && <span className="muted small">Tüm zamanlar</span>}
          </div>
        )}
      </div>

      {list.length > 0 && (
        <div className="totals-strip" aria-label="Listelenen kayıtların toplamı">
          <span>Gelir <b className="tone-pos">{formatMoney(totals.income)}</b></span>
          <span>Harcama <b>{formatMoney(totals.spending)}</b></span>
          {(totals.contributions > 0 || totals.withdrawals > 0) && <span>Yatırıma <b className="tone-invest">{formatMoney(totals.contributions)}</b></span>}
          <span className="muted">{list.length} kayıt</span>
        </div>
      )}

      {groups.length === 0 ? (
        data.txs.length === 0 ? (
          <EmptyState outfit="ledger" title="Defter henüz boş" action={<button className="btn btn--primary" onClick={() => openSheet({ kind: 'add' })}>İlk kaydı gir</button>}>
            Tutar, kategori ve hesap yeterli. Gerisi isteğe bağlı.
          </EmptyState>
        ) : (
          <EmptyState outfit="ledger" mood="calm" title="Bu filtrede kayıt yok">
            Ayı ya da filtreleri değiştirebilirsin.
          </EmptyState>
        )
      ) : (
        <div className="day-groups">
          {groups.map((g) => {
            const s = rangeSummary({ ...data, txs: g.txs }, g.date, g.date);
            return (
              <section key={g.date} className="day-group" aria-label={relativeDay(g.date, today)}>
                <h2 className="day-group__head">
                  <span>{relativeDay(g.date, today)}</span>
                  <span className="day-group__sum">
                    {s.spending > 0 && <>−{formatMoney(s.spending)}</>}
                    {s.spending < 0 && <span className="tone-pos"> +{formatMoney(-s.spending)} iade</span>}
                    {s.income > 0 && <span className="tone-pos"> +{formatMoney(s.income)}</span>}
                  </span>
                </h2>
                <ul className="tx-list">
                  {g.txs.map((t) => (
                    <TxRow key={t.id} t={t} data={data} lookups={lookups} />
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
