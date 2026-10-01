import { useMemo } from 'react';
import { ArrowLeft, Plus, UserRound, HandCoins, ArrowDownLeft, ArrowUpRight, Receipt } from 'lucide-react';
import { formatMoney } from '../domain/money';
import { shortDate } from '../domain/dates';
import { debtTotals, personBalances } from '../domain/ledger';
import { Amount, SectionHead } from '../ui/kit';
import { go, openSheet } from '../ui/nav';
import { useData, useLookups } from '../ui/hooks';
import { EmptyState } from '../ui/ClawdNote';
import { TxRow } from '../ui/TxRow';

/** Arkadaşlarla borç/alacak defteri. */
export function People() {
  const { data, today } = useData();
  const lookups = useLookups(data);
  const people = useMemo(() => personBalances(data).sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance)), [data]);
  const totals = debtTotals(data);
  const recent = useMemo(() => {
    const ids = new Set(people.map((p) => p.account.id));
    return [...data.txs].filter((t) => ids.has(t.accountId) || ids.has(t.toAccountId ?? '')).sort((a, b) => (a.date === b.date ? b.seq - a.seq : a.date < b.date ? 1 : -1)).slice(0, 12);
  }, [data, people]);

  return (
    <div className="screen">
      <header className="screen-head">
        <div className="head-with-back">
          <button className="icon-btn only-phone" onClick={() => go('home')} aria-label="Özete dön"><ArrowLeft size={20} /></button>
          <h1>Borç ve alacak</h1>
        </div>
        <button className="btn btn--secondary btn--small" onClick={() => openSheet({ kind: 'account', kindPreset: 'person' })}><Plus size={16} /> Kişi</button>
      </header>

      {people.length === 0 ? (
        <section className="card">
          <EmptyState outfit="ledger" mood="calm" title="Kimseye borç yok, kimseden alacak yok" action={<button className="btn btn--primary" onClick={() => openSheet({ kind: 'account', kindPreset: 'person' })}>Kişi ekle</button>}>
            Yemeği bölüştüğün, borç verdiğin ya da senin yerine ödeme yapan arkadaşlarını ekle. Bu hareketler gelir ya da gider sayılmaz; yalnızca kimin kime borçlu olduğunu tutar.
          </EmptyState>
        </section>
      ) : (
        <>
          <section className="debt-totals" aria-label="Toplam">
            <div className="stat">
              <span className="stat__label">Sana borçlu olanlar</span>
              <Amount value={totals.receivable} tone="pos" />
              <span className="stat__hint">gelince bakiyene eklenir</span>
            </div>
            <div className="stat">
              <span className="stat__label">Senin borcun</span>
              <Amount value={totals.owed} />
              <span className="stat__hint">kullanılabilir paradan ayrıldı</span>
            </div>
          </section>

          <section className="card" aria-labelledby="ppl-h">
            <SectionHead id="ppl-h" title="Kişiler" />
            <ul className="person-list">
              {people.map(({ account, balance }) => (
                <li key={account.id} className="person">
                  <button className="person__head" onClick={() => openSheet({ kind: 'account', accountId: account.id })}>
                    <span className="person__avatar" aria-hidden><UserRound size={18} /></span>
                    <span className="person__name">
                      {account.name}
                      <small>{balance > 0 ? 'sana borçlu' : balance < 0 ? 'ona borçlusun' : 'hesap kapalı'}{account.archived ? ' · arşivde' : ''}</small>
                    </span>
                    <span className={`person__bal ${balance > 0 ? 'tone-pos' : ''}`}>{balance === 0 ? '—' : formatMoney(Math.abs(balance))}</span>
                  </button>
                  <div className="person__actions">
                    <button className="btn btn--small btn--ghost" onClick={() => openSheet({ kind: 'add', preset: { type: 'debt', direction: 'out', personId: account.id } })}>
                      <ArrowUpRight size={15} /> Ben verdim
                    </button>
                    <button className="btn btn--small btn--ghost" onClick={() => openSheet({ kind: 'add', preset: { type: 'debt', direction: 'in', personId: account.id } })}>
                      <ArrowDownLeft size={15} /> Ben aldım
                    </button>
                    <button className="btn btn--small btn--ghost" onClick={() => openSheet({ kind: 'add', preset: { type: 'expense', paidByPerson: true, personId: account.id } })}>
                      <Receipt size={15} /> O ödedi
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <p className="note-line"><HandCoins size={14} aria-hidden /> “Ben verdim”: borç verdin ya da ona olan borcunu ödedin. “Ben aldım”: borç aldın ya da sana olan borcunu ödedi. “O ödedi”: senin harcamanı o ödedi (harcama sana yazılır, ona borçlanırsın).</p>
          </section>

          {recent.length > 0 && (
            <section className="card" aria-labelledby="ppl-r">
              <SectionHead id="ppl-r" title="Son hareketler" />
              <ul className="tx-list">
                {recent.map((t) => <TxRow key={t.id} t={t} data={data} lookups={lookups} showDate={shortDate(t.date, today)} />)}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
