/**
 * Hisse seçici: gömülü listede kod ya da şirket adıyla arama (BIST + ABD), sık seçilenler, elindekiler.
 * Listede olmayan kod yazılırsa borsası seçilip eklenir; önce fiyatı denenir, bulunamazsa yine de
 * eklenebilir (fiyat elle girilir). Formun içinde açılan bir paneldir (ayrı sayfa değil).
 */
import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { MARKETS, stockMarket, stockSymbol, toStockUnit, type StockUnit } from '../domain/assets';
import { searchStocks, type StockEntry } from '../domain/stocks';
import { useT } from '../i18n';
import { unitLabel } from '../i18n/units';
import { fetchStockQuote } from '../store/prices';
import { stockName, useStockList } from '../store/stockList';
import { Chip, Field } from '../ui/kit';

const POPULAR: StockUnit[] = ['BIST:THYAO', 'BIST:ASELS', 'BIST:GARAN', 'BIST:BIMAS', 'BIST:KCHOL', 'BIST:TUPRS', 'US:AAPL', 'US:NVDA', 'US:MSFT', 'US:TSLA', 'US:VOO', 'US:QQQ'];

export function StockPicker({ onPick, onClose, held = [], taken = [] }: {
  onPick: (u: StockUnit) => void;
  onClose: () => void;
  /** Hesapta elde olan hisseler (boş aramada önce gösterilir). */
  held?: StockUnit[];
  /** Başka satırda zaten seçili olanlar (seçilemez). */
  taken?: StockUnit[];
}) {
  const T = useT();
  const list = useStockList();
  const [q, setQ] = useState('');
  const [checking, setChecking] = useState<StockUnit | null>(null);
  const [notFound, setNotFound] = useState<StockUnit | null>(null);
  const hits = useMemo(() => (list ? searchStocks(list, q, 25) : []), [list, q]);
  const isTaken = (u: StockUnit) => taken.includes(u);

  function pick(u: StockUnit) {
    if (isTaken(u)) return;
    // Fiyat arkada istenir; form gelince kendiliğinden doldurur.
    void fetchStockQuote(u);
    onPick(u);
  }

  async function tryCode(u: StockUnit) {
    if (isTaken(u)) return;
    setNotFound(null);
    setChecking(u);
    const quote = await fetchStockQuote(u, { force: true });
    setChecking(null);
    if (quote) onPick(u);
    else setNotFound(u);
  }

  // Yazılan metin geçerli bir kodsa ve listede birebir yoksa: "THYAX kodunu ekle: BIST · ABD"
  const codes = q.trim()
    ? MARKETS.map((m) => toStockUnit(m, q)).filter((u): u is StockUnit => !!u && !hits.some((h) => h.unit === u))
    : [];

  const row = (e: Pick<StockEntry, 'unit' | 'symbol' | 'name' | 'etf'>) => (
    <li key={e.unit}>
      <button type="button" className="stock-hit" disabled={isTaken(e.unit)} onClick={() => pick(e.unit)}>
        <b className="stock-hit__sym">{e.symbol}</b>
        <span className="stock-hit__name">{e.name}</span>
        <small className="stock-hit__mkt">{e.etf ? T('stock.etf') : T(`stock.market.${stockMarket(e.unit)}`)}</small>
      </button>
    </li>
  );

  return (
    <div className="stock-picker" role="group" aria-label={T('stock.pickTitle')}>
      <p className="stock-picker__title">{T('stock.pickTitle')}</p>
      <Field label={T('stock.searchLabel')}>
        <span className="stock-picker__search">
          <Search size={16} aria-hidden />
          <input
            className="input"
            type="search"
            autoFocus
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            placeholder={T('stock.searchPh')}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setNotFound(null);
            }}
          />
        </span>
      </Field>

      {!q.trim() && (
        <>
          {held.length > 0 && (
            <>
              <p className="field__label">{T('stock.yours')}</p>
              <div className="chip-row">
                {held.map((u) => <Chip key={u} onClick={() => pick(u)}>{unitLabel(T, u)}</Chip>)}
              </div>
            </>
          )}
          <p className="field__label">{T('stock.popular')}</p>
          <div className="chip-row">
            {POPULAR.filter((u) => !held.includes(u)).map((u) => (
              <Chip key={u} onClick={() => pick(u)} title={stockName(u)}>{stockSymbol(u)}</Chip>
            ))}
          </div>
        </>
      )}

      {q.trim() !== '' && (
        <>
          {!list ? (
            <p className="note-line">{T('stock.loading')}</p>
          ) : hits.length > 0 ? (
            <ul className="stock-hits">{hits.map(row)}</ul>
          ) : (
            <p className="note-line">{T('stock.noResult')}</p>
          )}
          {codes.length > 0 && (
            <div className="stock-picker__code">
              <span>{T('stock.addCode', { sym: stockSymbol(codes[0]) })}</span>
              {codes.map((u) => (
                <button key={u} type="button" className="btn btn--secondary btn--small" disabled={checking !== null || isTaken(u)} onClick={() => void tryCode(u)}>
                  {checking === u ? T('stock.checking') : T(`stock.market.${stockMarket(u)}`)}
                </button>
              ))}
            </div>
          )}
          {notFound && (
            <div className="callout callout--quiet">
              <p>{T('stock.notFound', { sym: stockSymbol(notFound), market: T(`stock.market.${stockMarket(notFound)}`) })}</p>
              <button type="button" className="btn btn--ghost btn--small" onClick={() => onPick(notFound)}>{T('stock.addAnyway')}</button>
            </div>
          )}
        </>
      )}

      <p className="note-line">{T('stock.listNote')}</p>
      <div className="btn-row">
        <button type="button" className="btn btn--ghost btn--small" onClick={onClose}>{T('stock.close')}</button>
      </div>
    </div>
  );
}
