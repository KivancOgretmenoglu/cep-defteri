import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import type { Tx } from '../domain/types';
import { monthEnd, monthOf, monthStart, type MonthKey } from '../domain/dates';
import { catName, formatMoney, relativeDay } from '../i18n/format';
import { categoryName } from '../domain/defaults';
import { searchTxs } from '../domain/search';
import '../ui/polish.css';
import { useT } from '../i18n';
import type { Key } from '../i18n/core';
import { allTags, rangeSummary, transferKind, refundCategory } from '../domain/ledger';
import { Chip, MonthSwitcher } from '../ui/kit';
import { TxRow, txView } from '../ui/TxRow';
import { setFilter, useNav, openSheet, type TxFilter } from '../ui/nav';
import { useData, useLookups } from '../ui/hooks';
import { useListSettle } from '../ui/motion';
import { EmptyState, SceneEmpty } from '../mascot/MascotNote';

const KINDS: { value: NonNullable<TxFilter['kind']>; label: Key }[] = [
  { value: 'all', label: 'common.all' },
  { value: 'expense', label: 'tx.expense' },
  { value: 'income', label: 'tx.income' },
  { value: 'transfer', label: 'tx.transfer' },
  { value: 'invest', label: 'txs.kindInvest' },
  { value: 'debt', label: 'txs.kindDebt' },
];

export function Transactions() {
  const t = useT();
  const { data, today } = useData();
  const lookups = useLookups(data);
  const { filter } = useNav();
  // Hesap ya da etiket seçilince varsayılan olarak tüm zamanlar gösterilir (ör. bir gezinin toplamı).
  const month: MonthKey | 'all' = filter.month ?? (filter.accountId || filter.tag ? 'all' : monthOf(today));
  const kind = filter.kind ?? 'all';
  const [q, setQ] = useState('');
  // Telefonda arama alanı başlıktaki simgeyle açılır; geniş ekranda hep görünür (polish.css).
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  const list = useMemo(() => {
    const base = data.txs
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
      .sort((a, b) => (a.date === b.date ? b.seq - a.seq : a.date < b.date ? 1 : -1));
    // Arama: not, kategori (yerel ve kayıtlı ad), hesap adları, etiketler ve tutar.
    return searchTxs(base, q, t.lang === 'en' ? 'en' : 'tr', (x) => {
      const v = txView(x, lookups.accounts, lookups.cats, lookups.txById);
      const c = lookups.cats.get((x.type === 'refund' ? refundCategory(x, lookups.txById) : x.categoryId) ?? '');
      const names = c ? `${catName(c)} ${c.name} ${categoryName(c, 'en')}` : '';
      const accs = `${lookups.accounts.get(x.accountId)?.name ?? ''} ${x.toAccountId ? lookups.accounts.get(x.toAccountId)?.name ?? '' : ''}`;
      return `${x.note ?? ''} ${v.title} ${v.sub} ${names} ${accs} ${(x.tags ?? []).join(' ')}`;
    });
  }, [data, month, kind, filter.accountId, filter.categoryId, filter.tag, q, lookups, t]);
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
  // Kayıt eklenince yeni satırın yerleşmesi (yalnız listenin başı izlenir).
  const listRef = useListSettle<HTMLDivElement>(useMemo(() => list.slice(0, 60).map((x) => x.id), [list]));

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
        <h1>{t('nav.tx')}</h1>
        <button
          type="button"
          className={`icon-btn search-toggle ${searchOpen || q ? 'is-on' : ''}`}
          aria-label={searchOpen ? t('txs.searchClose') : t('txs.searchOpen')}
          aria-expanded={searchOpen || !!q}
          aria-controls="tx-search"
          onClick={() => {
            if (searchOpen) setQ('');
            setSearchOpen(!searchOpen);
          }}
        >
          {searchOpen ? <X size={20} /> : <Search size={20} />}
        </button>
        {month === 'all' ? (
          <button className="chip" onClick={() => setFilter({ ...filter, month: monthOf(today) })}>{t('txs.allTime')} · {t('txs.byMonth')}</button>
        ) : (
          <MonthSwitcher month={month} onChange={(m) => setFilter({ ...filter, month: m })} max={monthOf(today)} />
        )}
      </header>

      <div className="toolbar">
        <label className={`search search--collapsible ${searchOpen || q ? 'is-open' : ''}`} id="tx-search">
          <Search size={18} aria-hidden />
          <input ref={searchRef} type="search" enterKeyHint="search" placeholder={t('txs.searchPh')} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Escape') { setQ(''); setSearchOpen(false); } }} aria-label={t('txs.searchLabel')} />
          {q && (
            <button type="button" className="search__clear" aria-label={t('txs.searchClear')} onClick={() => { setQ(''); searchRef.current?.focus(); }}>
              <X size={16} />
            </button>
          )}
        </label>
        <div className="chip-row chip-row--scroll" role="group" aria-label={t('txs.typeFilter')}>
          {KINDS.map((k) => (
            <Chip key={k.value} on={kind === k.value} onClick={() => setFilter({ ...filter, kind: k.value })}>{t(k.label)}</Chip>
          ))}
        </div>
        {tagList.length > 0 && (
          <div className="chip-row chip-row--scroll" role="group" aria-label={t('txs.tagFilter')}>
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
                {t('txs.accountChip')} {acc.name} <X size={14} aria-label={t('txs.removeFilter')} />
              </Chip>
            )}
            {cat && (
              <Chip on onClick={() => setFilter({ ...filter, categoryId: undefined })}>
                {t('txs.categoryChip')} {catName(cat)} <X size={14} aria-label={t('txs.removeFilter')} />
              </Chip>
            )}
            {month === 'all' && acc && <span className="muted small">{t('txs.allTime')}</span>}
          </div>
        )}
      </div>

      {list.length > 0 && (
        <div className="totals-strip" aria-label={t('txs.totalsLabel')}>
          <span>{t('tx.income')} <b className="tone-pos">{formatMoney(totals.income)}</b></span>
          <span>{t('txs.spending')} <b>{formatMoney(totals.spending)}</b></span>
          {(totals.contributions > 0 || totals.withdrawals > 0) && <span>{t('txs.toInvest')} <b className="tone-invest">{formatMoney(totals.contributions)}</b></span>}
          <span className="muted">{t('txs.count', { n: list.length })}</span>
        </div>
      )}

      {groups.length === 0 ? (
        data.txs.length === 0 ? (
          <section className="card">
            <SceneEmpty scene="tx" onAction={() => openSheet({ kind: 'add', preset: { type: 'expense' } })} />
          </section>
        ) : (
          <EmptyState outfit="ledger" mood="calm" title={t('txs.noMatchTitle')}>
            {t('txs.noMatchBody')}
          </EmptyState>
        )
      ) : (
        <div className="day-groups" ref={listRef}>
          {groups.map((g) => {
            const s = rangeSummary({ ...data, txs: g.txs }, g.date, g.date);
            return (
              <section key={g.date} className="day-group" aria-label={relativeDay(g.date, today)}>
                <h2 className="day-group__head">
                  <span>{relativeDay(g.date, today)}</span>
                  <span className="day-group__sum">
                    {s.spending > 0 && <>−{formatMoney(s.spending)}</>}
                    {s.spending < 0 && <span className="tone-pos"> +{t('tx.refundedTag', { amount: formatMoney(-s.spending) })}</span>}
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
