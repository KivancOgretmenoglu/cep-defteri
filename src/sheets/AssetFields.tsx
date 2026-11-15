/**
 * Altın/döviz/hisse hesaplarının form parçaları: mod seçimi ve tür tür açılış kalemleri (hesap sayfası),
 * tür + miktar + birim fiyat (katkı/çekim formu), elle fiyat girişi ve ortak biçimlendirme yardımcıları.
 * Hisseler (BIST, ABD) StockPicker ile seçilir; miktarları adettir.
 */
import { useEffect, useState } from 'react';
import { Plus, RefreshCw, Trash2, TrendingUp } from 'lucide-react';
import type { Account } from '../domain/types';
import type { Money } from '../domain/money';
import {
  ALL_UNITS, FX_UNITS, GOLD_UNITS, isFixedUnit, isStockUnit, parseQty, priceFromQty, qtyDecimals, qtyFromAmount, qtyToInput,
  stockCurrency, stockMarket, stockSymbol, unitOrder,
  type AssetLot, type AssetUnit, type FixedUnit, type StockUnit,
} from '../domain/assets';
import { assetQuantities } from '../domain/ledger';
import type { QuoteSource } from '../domain/stocks';
import type { Key } from '../i18n/core';
import { formatMoney, formatQuote, moneyToInput, moneyUnit, parseMoney } from '../i18n/format';
import { useT, type TFn } from '../i18n';
import { getLang } from '../i18n/lang';
import { unitLabel, unitShortLabel } from '../i18n/units';
import { agoParts, fetchStockQuote, getPrices, refreshPrices, setManualPrice, setManualQuote, usePrices } from '../store/prices';
import { stockName, useStockList } from '../store/stockList';
import { Chip, Field, Segmented } from '../ui/kit';
import { useData } from '../ui/hooks';
import { StockPicker } from './StockPicker';
import './assets.css';

// ───────────────────────── Biçimlendirme ─────────────────────────

/** Uzun ad: "Gram altın (24 ayar)", "THYAO · Türk Hava Yolları". Hisse adları için useStockList() çağrılmalı. */
export const unitName = (T: TFn, u: AssetUnit) => unitLabel(T, u, isStockUnit(u) ? stockName(u) : undefined);
/** Kısa ad: "gram", "USD", "THYAO". */
export const unitShort = (T: TFn, u: AssetUnit) => unitShortLabel(T, u);
/** Seçim çipinde: altın/dövizde uzun ad, hissede yalnız kod (çip kısa kalsın). */
const chipName = (T: TFn, u: AssetUnit) => (isStockUnit(u) ? stockSymbol(u) : unitName(T, u));

/** Hisse kotasyonunun kaynağı: "Yahoo Finance", "Nasdaq", "İş Yatırım, son kapanış", "elle girdin". */
export const quoteSourceText = (T: TFn, s: QuoteSource) => (s === 'manual' ? T('asset.src.manual') : T(`stock.src.${s}`));

/** 12.5, 'gram' → "12,5 gram" (en: "12.5 g"). */
export function formatQty(T: TFn, q: number, u: AssetUnit): string {
  const lang = getLang();
  const n = new Intl.NumberFormat(lang === 'en' ? 'en-US' : 'tr-TR', { maximumFractionDigits: qtyDecimals(u) }).format(q);
  return `${n} ${unitShort(T, u)}`;
}

/** Yalnız sayı: 10 → "10", 0,5 → "0,5" (çipte hisse kodunun yanında). */
export function formatQtyNum(q: number, u: AssetUnit): string {
  return new Intl.NumberFormat(getLang() === 'en' ? 'en-US' : 'tr-TR', { maximumFractionDigits: qtyDecimals(u) }).format(q);
}

export function agoText(T: TFn, at: number, now = Date.now()): string {
  const a = agoParts(at, now);
  return T(`asset.ago.${a.key}`, { n: a.n });
}

// ───────────────────────── Hesap sayfası ─────────────────────────

/** "Ne olarak tutuyorsun? TL / Altın-döviz". Kilitliyse (kaydı olan hesap) yalnız gösterir. */
export function AssetModePicker({ value, onChange, locked }: { value: boolean; onChange: (v: boolean) => void; locked: boolean }) {
  const T = useT();
  if (locked) {
    return (
      <div className="callout callout--quiet">
        <p><b>{T('asset.holdQ')}</b> {value ? T('asset.kind.assets') : T('asset.kind.tl')}</p>
        {value && <p className="note-line">{T('asset.lockedNote')}</p>}
      </div>
    );
  }
  return (
    <fieldset className="block">
      <legend>{T('asset.holdQ')}</legend>
      <Segmented<'tl' | 'assets'>
        size="sm"
        label={T('asset.holdQ')}
        value={value ? 'assets' : 'tl'}
        onChange={(c) => onChange(c === 'assets')}
        options={[
          { value: 'tl', label: T('asset.kind.tl') },
          { value: 'assets', label: T('asset.kind.assets') },
        ]}
      />
      {value && <p className="note-line">{T('asset.holdHint')}</p>}
    </fieldset>
  );
}

/** "Mevcut birikimimi ekle" formundaki bir satır (ham metinler). */
export interface LotRow {
  id: string;
  unit: AssetUnit;
  qty: string;
  price: string;
}

let rowSeq = 0;
const rowId = () => `lot-${++rowSeq}`;

/** Hesabın açılış kalemlerinden form satırları. */
export function lotRowsFrom(lots: AssetLot[] | undefined): LotRow[] {
  const lang = getLang();
  return (lots ?? []).map((l) => ({ id: rowId(), unit: l.unit, qty: qtyToInput(l.qty, l.unit, lang), price: moneyToInput(l.price) }));
}

/** Satırları açılış kalemlerine çevirir; miktarı boş satırlar atlanır. Hatada sözlük anahtarı döner. */
export function parseLotRows(rows: LotRow[]): { lots: AssetLot[] } | { error: Key } {
  const lang = getLang();
  const lots: AssetLot[] = [];
  for (const r of rows) {
    if (!r.qty.trim()) continue;
    const qty = parseQty(r.qty, lang);
    if (qty === null) return { error: 'err.assetQty' };
    if (isWhole(r.unit) && !Number.isInteger(qty)) return { error: 'stock.qtyWhole' };
    const price = parseMoney(r.price);
    if (price === null) return { error: 'err.assetPrice' };
    if (lots.some((l) => l.unit === r.unit)) return { error: 'err.assetDupUnit' };
    lots.push({ unit: r.unit, qty, price });
  }
  return { lots };
}

/** Henüz satırlarda olmayan ilk altın/döviz birimi (gram, çeyrek, … USD sırasıyla). */
const nextFreeUnit = (rows: LotRow[]): FixedUnit => ALL_UNITS.find((u) => !rows.some((r) => r.unit === u)) ?? 'gram';

const STOCK_OPTION = '__stock';

/**
 * Birim seçici (altın / döviz / hisse grupları). Başka satırda seçili altın/döviz kapalıdır.
 * "Hisse senedi…" seçilince hisse arama paneli açılır (onStock).
 */
function UnitSelect({ value, taken, onChange, onStock }: { value: AssetUnit; taken: AssetUnit[]; onChange: (u: AssetUnit) => void; onStock: () => void }) {
  const T = useT();
  return (
    <select
      className="input lot-row__unit"
      value={value}
      aria-label={T('asset.rowUnit')}
      onChange={(e) => (e.target.value === STOCK_OPTION ? onStock() : onChange(e.target.value as AssetUnit))}
    >
      <optgroup label={T('asset.kind.gold')}>
        {GOLD_UNITS.map((u) => <option key={u} value={u} disabled={u !== value && taken.includes(u)}>{unitName(T, u)}</option>)}
      </optgroup>
      <optgroup label={T('asset.kind.fx')}>
        {FX_UNITS.map((u) => <option key={u} value={u} disabled={u !== value && taken.includes(u)}>{unitName(T, u)}</option>)}
      </optgroup>
      <optgroup label={T('stock.kind')}>
        {isStockUnit(value) && <option value={value}>{unitName(T, value)}</option>}
        <option value={STOCK_OPTION}>{T('stock.kindOption')}</option>
      </optgroup>
    </select>
  );
}

/**
 * "Mevcut birikimimi ekle": tür tür açılış kalemleri (tür + miktar + o günkü birim fiyat).
 * Fiyat boşsa güncel alış fiyatı önerilir; düzenlenebilir. Satır eklenip silinebilir.
 */
export function OpeningLots({ rows, onChange }: { rows: LotRow[]; onChange: (rows: LotRow[]) => void }) {
  const T = useT();
  const prices = usePrices();
  const lang = getLang();
  useStockList();
  // Hisse paneli: bir satırın türünü değiştirmek için (satır kimliği) ya da yeni hisse satırı için ('new').
  const [picking, setPicking] = useState<string | null>(null);
  useEffect(() => {
    void refreshPrices();
  }, []);
  // Hisse satırlarının fiyatı (elde olmayan hisseler toplu yenilemede istenmez).
  const stockUnits = rows.map((r) => r.unit).filter(isStockUnit).join(',');
  useEffect(() => {
    for (const u of stockUnits.split(',')) if (isStockUnit(u)) void fetchStockQuote(u);
  }, [stockUnits]);
  const takenStocks = rows.map((r) => r.unit).filter(isStockUnit);
  function pickStock(u: StockUnit) {
    if (picking === 'new') onChange([...rows, { id: rowId(), unit: u, qty: '', price: '' }]);
    else onChange(rows.map((r) => (r.id === picking ? { ...r, unit: u, price: '' } : r)));
    setPicking(null);
  }
  // Fiyatı boş satırlara güncel alış fiyatı yazılır.
  useEffect(() => {
    if (rows.some((r) => !r.price && prices.book[r.unit])) onChange(rows.map((r) => (!r.price && prices.book[r.unit] ? { ...r, price: moneyToInput(prices.book[r.unit]!.buy) } : r)));
  }, [rows, prices.book, onChange]);
  const patch = (id: string, p: Partial<LotRow>) => onChange(rows.map((r) => (r.id === id ? { ...r, ...p } : r)));
  let total = 0;
  for (const r of rows) {
    const q = parseQty(r.qty, lang), p = parseMoney(r.price);
    if (q && p) total += Math.round(q * p);
  }
  return (
    <>
      <p className="note-line">{T('asset.haveSomeHint')}</p>
      <ul className="lot-rows">
        {rows.map((r) => {
          const u = unitShort(T, r.unit);
          return (
            <li key={r.id} className="lot-row">
              <div className="lot-row__head">
                <UnitSelect value={r.unit} taken={rows.map((x) => x.unit)} onChange={(unit) => patch(r.id, { unit, price: '' })} onStock={() => setPicking(r.id)} />
                {rows.length > 1 && (
                  <button type="button" className="icon-btn" aria-label={T('asset.removeRow')} onClick={() => onChange(rows.filter((x) => x.id !== r.id))}><Trash2 size={17} /></button>
                )}
              </div>
              {picking === r.id && <StockPicker onPick={pickStock} onClose={() => setPicking(null)} taken={takenStocks.filter((x) => x !== r.unit)} />}
              <div className="asset-fields__row">
                <QtyInput label={isStockUnit(r.unit) ? T('stock.qtyLabel', { unit: u }) : T('asset.openingQty', { unit: u })} value={r.qty} onChange={(qty) => patch(r.id, { qty })} whole={isWhole(r.unit)} />
                <PriceInput label={T('asset.unitPriceLabel', { unit: u })} value={r.price} onChange={(price) => patch(r.id, { price })} />
              </div>
              {isStockUnit(r.unit) && <StockQuoteLine unit={r.unit} side="buy" />}
            </li>
          );
        })}
      </ul>
      {picking === 'new' && <StockPicker onPick={pickStock} onClose={() => setPicking(null)} taken={takenStocks} />}
      <div className="btn-row">
        {rows.filter((r) => isFixedUnit(r.unit)).length < ALL_UNITS.length && (
          <button type="button" className="btn btn--ghost btn--small" onClick={() => onChange([...rows, { id: rowId(), unit: nextFreeUnit(rows), qty: '', price: '' }])}>
            <Plus size={16} /> {T('asset.addRow')}
          </button>
        )}
        {picking !== 'new' && (
          <button type="button" className="btn btn--ghost btn--small" onClick={() => setPicking('new')}>
            <TrendingUp size={16} /> {T('stock.add')}
          </button>
        )}
      </div>
      {total > 0 && <p className="note-line">{T('asset.openingValue', { amount: formatMoney(total) })}</p>}
    </>
  );
}

/** Boş bir ilk satır. */
export const newLotRow = (unit: AssetUnit = 'gram'): LotRow => ({ id: rowId(), unit, qty: '', price: '' });

// ───────────────────────── Girdi alanları ─────────────────────────

/** Tam adet zorunlu mu (BIST hissesi). */
const isWhole = (u: AssetUnit) => qtyDecimals(u) === 0;

function QtyInput({ label, value, onChange, whole }: { label: string; value: string; onChange: (v: string) => void; whole?: boolean }) {
  const T = useT();
  const q = value.trim() !== '' ? parseQty(value, getLang()) : undefined;
  const error = q === null ? T('asset.qtyFormat') : whole && q !== undefined && !Number.isInteger(q) ? T('stock.qtyWhole') : null;
  return (
    <Field label={label} error={error}>
      <input className="input" inputMode={whole ? 'numeric' : 'decimal'} autoComplete="off" value={value} onChange={(e) => onChange(e.target.value.replace(/[^\d.,]/g, ''))} aria-invalid={!!error} />
    </Field>
  );
}

/** Birim fiyat alanı; `ccy` verilmezse TL ("TL" / "₺"). */
function PriceInput({ label, value, onChange, ccy }: { label: string; value: string; onChange: (v: string) => void; ccy?: string }) {
  const T = useT();
  const invalid = value.trim() !== '' && parseMoney(value) === null;
  return (
    <Field label={`${label} (${ccy ?? moneyUnit()})`} error={invalid ? T('asset.priceFormat') : null}>
      <input className="input" inputMode="decimal" autoComplete="off" value={value} onChange={(e) => onChange(e.target.value.replace(/[^\d.,]/g, ''))} aria-invalid={invalid} />
    </Field>
  );
}

// ───────────────────────── Katkı / çekim formu ─────────────────────────

export interface AssetValue {
  unit: AssetUnit;
  qty: number;
  unitPrice: Money;
}

/**
 * Birim seçimi için sıra: elde olanlar önce (miktarıyla; hisseler dahil), sonra diğer altın/döviz türleri.
 * Çekimde yalnız elde olanlar. `keep`: düzenlenen işlemin ya da yeni seçilen hissenin birimi.
 */
export function unitChoices(held: Map<AssetUnit, number>, dir: 'in' | 'out', keep: AssetUnit[] = []): { unit: AssetUnit; qty: number }[] {
  const units = new Set<AssetUnit>([...[...held].filter(([, q]) => q > 0).map(([u]) => u), ...keep]);
  const have = [...units].sort(unitOrder).map((unit) => ({ unit, qty: held.get(unit) ?? 0 }));
  if (dir === 'out') return have;
  return [...have, ...ALL_UNITS.filter((u) => !units.has(u)).map((unit) => ({ unit, qty: 0 }))];
}

/**
 * Altın/döviz hesabına katkı (dir 'in') ya da çekimde: hangi tür + miktar + birim fiyat.
 * Türler çip olarak gelir; elde olanlar önce. Çekimde yalnız elde olan türler seçilebilir.
 */
export function AssetQtyFields({ account, dir, amount, initial, editingTxId, onChange, onAmount }: {
  account: Account;
  dir: 'in' | 'out';
  /** TL tutar alanının ham metni */
  amount: string;
  initial?: AssetValue;
  editingTxId?: string;
  onChange: (v: AssetValue | null) => void;
  /** Verilirse hissede "adet × güncel fiyat" ile tutar alanı doldurulabilir. */
  onAmount?: (raw: string) => void;
}) {
  const T = useT();
  const { data } = useData();
  useStockList();
  const held = assetQuantities(data, account, editingTxId);
  const [picked, setPicked] = useState<AssetUnit | null>(initial?.unit ?? null);
  // Yeni alınan (elde olmayan) hisse de seçenekler arasında kalsın.
  const [newStock, setNewStock] = useState<StockUnit | null>(null);
  const [picking, setPicking] = useState(false);
  const choices = unitChoices(held, dir, [initial?.unit, dir === 'in' ? newStock : null].filter((u): u is AssetUnit => !!u));
  const unit = picked && choices.some((c) => c.unit === picked) ? picked : choices[0]?.unit ?? null;
  const heldStocks = [...held].filter(([u, q]) => q > 0 && isStockUnit(u)).map(([u]) => u as StockUnit);
  useEffect(() => {
    if (!unit) onChange(null);
  }, [unit, onChange]);
  if (!unit) return <p className="callout callout--quiet">{T('asset.noHoldings')}</p>;
  return (
    <div className="asset-fields">
      <fieldset className="block">
        <legend>{T(dir === 'in' ? 'asset.unitPick' : 'asset.unitPickOut')}</legend>
        <div className="chip-row" role="group" aria-label={T('asset.unitLabel')}>
          {choices.map((c) => (
            <Chip key={c.unit} on={c.unit === unit} onClick={() => setPicked(c.unit)} title={isStockUnit(c.unit) ? stockName(c.unit) : undefined}>
              {chipName(T, c.unit)}{c.qty > 0 && <small className="chip__qty"> · {isStockUnit(c.unit) ? formatQtyNum(c.qty, c.unit) : formatQty(T, c.qty, c.unit)}</small>}
            </Chip>
          ))}
          {dir === 'in' && !picking && (
            <Chip onClick={() => setPicking(true)}><TrendingUp size={14} aria-hidden /> {T('stock.add')}</Chip>
          )}
        </div>
      </fieldset>
      {picking && (
        <StockPicker
          held={heldStocks}
          onClose={() => setPicking(false)}
          onPick={(u) => {
            if (!heldStocks.includes(u)) setNewStock(u);
            setPicked(u);
            setPicking(false);
          }}
        />
      )}
      {isStockUnit(unit) && <p className="note-line stock-name-line">{unitName(T, unit)} · {T(`stock.market.${stockMarket(unit)}`)}</p>}
      <UnitQtyFields
        key={unit}
        unit={unit}
        dir={dir}
        amount={amount}
        held={held.get(unit) ?? 0}
        initial={initial && initial.unit === unit ? initial : undefined}
        onChange={onChange}
        onAmount={onAmount}
      />
    </div>
  );
}

/**
 * Tek birim için miktar + fiyat. Katkıda kuyumcunun SATIŞ fiyatı, çekimde ALIŞ fiyatı önerilir; ikisi de
 * düzenlenebilir. Miktar = TL tutar ÷ fiyat. Kullanıcı miktarı yazarsa fiyat = tutar ÷ miktar olur (iki yönlü).
 */
function UnitQtyFields({ unit, dir, amount, held, initial, onChange, onAmount }: {
  unit: AssetUnit;
  dir: 'in' | 'out';
  amount: string;
  held: number;
  initial?: AssetValue;
  onChange: (v: AssetValue | null) => void;
  onAmount?: (raw: string) => void;
}) {
  const T = useT();
  const prices = usePrices();
  const live = prices.book[unit];
  const suggested = live ? (dir === 'in' ? live.sell : live.buy) : null;
  const lang = getLang();
  const stock = isStockUnit(unit);
  // Hissede önce adet sorulur (BIST'te tam adet): tutar ÷ adet = birim fiyat.
  const [mode, setMode] = useState<'price' | 'qty'>(initial || stock ? 'qty' : 'price');
  const [priceRaw, setPriceRaw] = useState(initial ? moneyToInput(initial.unitPrice) : '');
  const [priceTouched, setPriceTouched] = useState(!!initial);
  const [qtyRaw, setQtyRaw] = useState(initial ? qtyToInput(initial.qty, unit, lang) : '');

  useEffect(() => {
    void refreshPrices();
    if (isStockUnit(unit)) void fetchStockQuote(unit);
  }, [unit]);

  const amt = parseMoney(amount);
  const effPriceRaw = priceTouched ? priceRaw : suggested ? moneyToInput(suggested) : '';
  let qty: number | null;
  let price: Money | null;
  if (mode === 'price') {
    price = parseMoney(effPriceRaw);
    qty = amt && price ? qtyFromAmount(amt, price, unit) : null;
  } else {
    qty = parseQty(qtyRaw, lang);
    if (qty !== null && isWhole(unit) && !Number.isInteger(qty)) qty = null;
    price = amt && qty ? priceFromQty(amt, qty) : null;
  }
  // Hissede adet yazıldı ama tutar boş: "adet × güncel fiyat" ile doldurmayı öner.
  const typedQty = mode === 'qty' ? qty : null;
  const fill = stock && onAmount && !amt && typedQty && suggested ? Math.round(typedQty * suggested) : null;
  const priceShown = mode === 'price' ? effPriceRaw : price ? moneyToInput(price) : '';
  const qtyShown = mode === 'qty' ? qtyRaw : qty ? qtyToInput(qty, unit, lang) : '';

  useEffect(() => {
    onChange(qty && price ? { unit, qty, unitPrice: price } : null);
  }, [unit, qty, price, onChange]);

  const u = unitShort(T, unit);
  return (
    <>
      <div className="asset-fields__row">
        <PriceInput
          label={T(dir === 'in' ? 'asset.priceBuyLabel' : 'asset.priceSellLabel', { unit: u })}
          value={priceShown}
          onChange={(v) => {
            setMode('price');
            setPriceTouched(true);
            setPriceRaw(v);
          }}
        />
        <QtyInput
          label={stock ? T('stock.qtyLabel', { unit: u }) : T('asset.qtyLabel', { unit: u })}
          value={qtyShown}
          whole={isWhole(unit)}
          onChange={(v) => {
            setMode('qty');
            setQtyRaw(v);
          }}
        />
      </div>
      {fill !== null && (
        <p className="note-line">
          {T('stock.fillHint', { qty: formatQty(T, typedQty!, unit), amount: formatMoney(fill) })}{' '}
          <button type="button" className="link link--small" onClick={() => onAmount!(moneyToInput(fill))}>{T('stock.fillAmount', { amount: formatMoney(fill) })}</button>
        </p>
      )}
      {stock && <StockQuoteLine unit={unit} side={dir === 'in' ? 'sell' : 'buy'} />}
      <p className="note-line">
        {stock
          ? suggested ? T('stock.editHint', { price: formatMoney(suggested) }) : T('asset.noPrice')
          : live && suggested
            ? T('asset.liveNote', { side: T(dir === 'in' ? 'asset.side.sell' : 'asset.side.buy'), price: formatMoney(suggested), ago: agoText(T, live.at) })
            : T('asset.noPrice')}{' '}
        {T('asset.calcHint')}
        {dir === 'out' && <> · {T('asset.held', { qty: formatQty(T, held, unit) })}</>}
      </p>
    </>
  );
}

// ───────────────────────── Elle fiyat ─────────────────────────

/**
 * Değerleme yerine: varlık hesabındaki bir türün birim fiyatını elle gir (bu cihazda saklanır, yedeğe girmez).
 * Kanca: sayfa gövdesini ve kaydet işlevini döndürür (ValuationSheet kullanır).
 */
export function useManualPrice(account: Account, onDone: () => void, onError: (m: string | null) => void) {
  const T = useT();
  const { data } = useData();
  const prices = usePrices();
  useStockList();
  // Elde olan türler önce (hisseler dahil); hiç yoksa altın/döviz türlerinin tümü.
  const held = assetQuantities(data, account);
  const have = [...held].filter(([, q]) => q > 0).map(([u]) => u).sort(unitOrder);
  const units: AssetUnit[] = have.length ? have : ALL_UNITS;
  const [unit, setUnit] = useState<AssetUnit>(units[0]);
  /** Alandaki fiyat: altın/dövizde TL alış, hissede kendi para biriminde son fiyat. */
  const priceOf = (u: AssetUnit) => {
    const p = getPrices();
    if (isStockUnit(u)) return p.quotes[u] ? moneyToInput(p.quotes[u]!.price) : '';
    return p.book[u] ? moneyToInput(p.book[u]!.buy) : '';
  };
  const [price, setPrice] = useState(() => priceOf(units[0]));
  function pick(u: AssetUnit) {
    setUnit(u);
    setPrice(priceOf(u));
    onError(null);
  }
  function save() {
    const p = parseMoney(price);
    if (!p) return onError(T('asset.priceFormat'));
    if (isStockUnit(unit)) setManualQuote(unit, p);
    else setManualPrice(unit, p);
    onDone();
  }
  async function refresh() {
    await refreshPrices({ force: true });
    if (isStockUnit(unit)) await fetchStockQuote(unit, { force: true });
    const v = priceOf(unit);
    if (v) setPrice(v);
  }
  const u = unitShort(T, unit);
  const live = prices.book[unit];
  const quote = isStockUnit(unit) ? prices.quotes[unit] : undefined;
  const ccy = isStockUnit(unit) ? (stockCurrency(unit) === 'USD' ? '$' : moneyUnit()) : moneyUnit();
  const body = (
    <>
      {units.length > 1 && (
        <fieldset className="block">
          <legend>{T('asset.priceUnitQ')}</legend>
          <div className="chip-row" role="group" aria-label={T('asset.unitLabel')}>
            {units.map((x) => <Chip key={x} on={x === unit} onClick={() => pick(x)} title={isStockUnit(x) ? stockName(x) : undefined}>{chipName(T, x)}</Chip>)}
          </div>
        </fieldset>
      )}
      {isStockUnit(unit) ? (
        <>
          <p className="muted">{unitName(T, unit)} · {T('stock.priceQ', { unit: u, ccy })}</p>
          <PriceInput label={T('stock.priceLabel', { unit: u })} value={price} onChange={setPrice} ccy={ccy} />
          {quote && <p className="note-line">{T('stock.priceLine', { unit: u, price: formatQuote(quote.price, quote.ccy), ago: agoText(T, quote.at) })} · {quoteSourceText(T, quote.source)}</p>}
          <p className="note-line">{T('stock.delayNote')}</p>
        </>
      ) : (
        <>
          <p className="muted">{T('asset.priceQ', { unit: u, money: moneyUnit() })}</p>
          <PriceInput label={T('asset.unitPriceLabel', { unit: u })} value={price} onChange={setPrice} />
          {live && <p className="note-line">{T('asset.priceLine', { unit: u, price: formatMoney(live.buy), ago: agoText(T, live.at) })}{live.source !== 'live' ? ` · ${T(live.source === 'manual' ? 'asset.src.manual' : 'asset.src.estimate')}` : ''}</p>}
        </>
      )}
      <div className="btn-row">
        <button type="button" className="btn btn--ghost" disabled={prices.loading} onClick={refresh}>
          <RefreshCw size={16} /> {prices.loading ? T('asset.refreshing') : T('asset.refresh')}
        </button>
      </div>
      {prices.failed && <p className="note-line">{T('asset.fetchFailed')}</p>}
      <p className="note-line">{T('asset.priceNote')}</p>
    </>
  );
  return { save, body };
}

// ───────────────────────── Hisse fiyat satırı ─────────────────────────

/**
 * Hissenin kendi para birimindeki son fiyatı, kaynağı ve yaşı; ABD hissesinde dolar kuru:
 * "1 AAPL = $356,27 · dolar kuru ₺50,37 · Nasdaq · 5 dk önce". `side`: önerilen TL fiyatta kullanılan kur
 * (katkıda satış, çekimde ve açılışta alış).
 */
export function StockQuoteLine({ unit, side }: { unit: StockUnit; side: 'buy' | 'sell' }) {
  const T = useT();
  const prices = usePrices();
  const q = prices.quotes[unit];
  if (!q) return prices.loading ? <p className="note-line">{T('asset.refreshing')}</p> : null;
  const usd = prices.base.USD;
  const src = `${quoteSourceText(T, q.source)} · ${agoText(T, q.at)}`;
  if (q.ccy === 'TRY') return <p className="note-line">{T('stock.priceLine', { unit: stockSymbol(unit), price: formatQuote(q.price, q.ccy), ago: src })}</p>;
  if (!usd) return <p className="note-line">{T('stock.priceLine', { unit: stockSymbol(unit), price: formatQuote(q.price, 'USD'), ago: src })} · {T('stock.noUsd')}</p>;
  return (
    <p className="note-line">
      {T('stock.usdLine', { sym: stockSymbol(unit), usd: formatQuote(q.price, 'USD'), rate: formatMoney(side === 'sell' ? usd.sell : usd.buy, { compact: false }) })} · {src}
    </p>
  );
}
