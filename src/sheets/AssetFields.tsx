/**
 * Altın/döviz hesaplarının form parçaları: mod seçimi ve tür tür açılış kalemleri (hesap sayfası),
 * tür + miktar + birim fiyat (katkı/çekim formu), elle fiyat girişi ve ortak biçimlendirme yardımcıları.
 */
import { useEffect, useState } from 'react';
import { Plus, RefreshCw, Trash2 } from 'lucide-react';
import type { Account } from '../domain/types';
import type { Money } from '../domain/money';
import {
  ALL_UNITS, FX_UNITS, GOLD_UNITS, parseQty, priceFromQty, qtyDecimals, qtyFromAmount, qtyToInput,
  type AssetLot, type AssetUnit,
} from '../domain/assets';
import { assetQuantities } from '../domain/ledger';
import type { Key } from '../i18n/core';
import { formatMoney, moneyToInput, moneyUnit, parseMoney } from '../i18n/format';
import { useT, type TFn } from '../i18n';
import { getLang } from '../i18n/lang';
import { agoParts, getPrices, refreshPrices, setManualPrice, usePrices } from '../store/prices';
import { Chip, Field, Segmented } from '../ui/kit';
import { useData } from '../ui/hooks';
import './assets.css';

// ───────────────────────── Biçimlendirme ─────────────────────────

export const unitName = (T: TFn, u: AssetUnit) => T(`asset.unit.${u}`);
export const unitShort = (T: TFn, u: AssetUnit) => T(`asset.short.${u}`);

/** 12.5, 'gram' → "12,5 gram" (en: "12.5 g"). */
export function formatQty(T: TFn, q: number, u: AssetUnit): string {
  const lang = getLang();
  const n = new Intl.NumberFormat(lang === 'en' ? 'en-US' : 'tr-TR', { maximumFractionDigits: qtyDecimals(u) }).format(q);
  return `${n} ${unitShort(T, u)}`;
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
    const price = parseMoney(r.price);
    if (price === null) return { error: 'err.assetPrice' };
    if (lots.some((l) => l.unit === r.unit)) return { error: 'err.assetDupUnit' };
    lots.push({ unit: r.unit, qty, price });
  }
  return { lots };
}

/** Henüz satırlarda olmayan ilk birim (gram, çeyrek, … USD sırasıyla). */
const nextFreeUnit = (rows: LotRow[]): AssetUnit => ALL_UNITS.find((u) => !rows.some((r) => r.unit === u)) ?? 'gram';

/** Birim seçici (altın / döviz grupları). Başka satırda seçili birimler kapalıdır. */
function UnitSelect({ value, taken, onChange }: { value: AssetUnit; taken: AssetUnit[]; onChange: (u: AssetUnit) => void }) {
  const T = useT();
  return (
    <select className="input lot-row__unit" value={value} aria-label={T('asset.rowUnit')} onChange={(e) => onChange(e.target.value as AssetUnit)}>
      <optgroup label={T('asset.kind.gold')}>
        {GOLD_UNITS.map((u) => <option key={u} value={u} disabled={u !== value && taken.includes(u)}>{unitName(T, u)}</option>)}
      </optgroup>
      <optgroup label={T('asset.kind.fx')}>
        {FX_UNITS.map((u) => <option key={u} value={u} disabled={u !== value && taken.includes(u)}>{unitName(T, u)}</option>)}
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
  useEffect(() => {
    void refreshPrices();
  }, []);
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
                <UnitSelect value={r.unit} taken={rows.map((x) => x.unit)} onChange={(unit) => patch(r.id, { unit, price: '' })} />
                {rows.length > 1 && (
                  <button type="button" className="icon-btn" aria-label={T('asset.removeRow')} onClick={() => onChange(rows.filter((x) => x.id !== r.id))}><Trash2 size={17} /></button>
                )}
              </div>
              <div className="asset-fields__row">
                <QtyInput label={T('asset.openingQty', { unit: u })} value={r.qty} onChange={(qty) => patch(r.id, { qty })} />
                <PriceInput label={T('asset.unitPriceLabel', { unit: u })} value={r.price} onChange={(price) => patch(r.id, { price })} />
              </div>
            </li>
          );
        })}
      </ul>
      {rows.length < ALL_UNITS.length && (
        <button type="button" className="btn btn--ghost btn--small" onClick={() => onChange([...rows, { id: rowId(), unit: nextFreeUnit(rows), qty: '', price: '' }])}>
          <Plus size={16} /> {T('asset.addRow')}
        </button>
      )}
      {total > 0 && <p className="note-line">{T('asset.openingValue', { amount: formatMoney(total) })}</p>}
    </>
  );
}

/** Boş bir ilk satır. */
export const newLotRow = (unit: AssetUnit = 'gram'): LotRow => ({ id: rowId(), unit, qty: '', price: '' });

// ───────────────────────── Girdi alanları ─────────────────────────

function QtyInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const T = useT();
  const invalid = value.trim() !== '' && parseQty(value, getLang()) === null;
  return (
    <Field label={label} error={invalid ? T('asset.qtyFormat') : null}>
      <input className="input" inputMode="decimal" autoComplete="off" value={value} onChange={(e) => onChange(e.target.value.replace(/[^\d.,]/g, ''))} aria-invalid={invalid} />
    </Field>
  );
}

function PriceInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const T = useT();
  const invalid = value.trim() !== '' && parseMoney(value) === null;
  return (
    <Field label={`${label} (${moneyUnit()})`} error={invalid ? T('asset.priceFormat') : null}>
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

/** Birim seçimi için sıra: elde olanlar önce (miktarıyla), sonra diğerleri. Çekimde yalnız elde olanlar. */
function unitChoices(held: Map<AssetUnit, number>, dir: 'in' | 'out', keep?: AssetUnit): { unit: AssetUnit; qty: number }[] {
  const have = ALL_UNITS.filter((u) => (held.get(u) ?? 0) > 0 || u === keep).map((unit) => ({ unit, qty: held.get(unit) ?? 0 }));
  if (dir === 'out') return have;
  return [...have, ...ALL_UNITS.filter((u) => !have.some((h) => h.unit === u)).map((unit) => ({ unit, qty: 0 }))];
}

/**
 * Altın/döviz hesabına katkı (dir 'in') ya da çekimde: hangi tür + miktar + birim fiyat.
 * Türler çip olarak gelir; elde olanlar önce. Çekimde yalnız elde olan türler seçilebilir.
 */
export function AssetQtyFields({ account, dir, amount, initial, editingTxId, onChange }: {
  account: Account;
  dir: 'in' | 'out';
  /** TL tutar alanının ham metni */
  amount: string;
  initial?: AssetValue;
  editingTxId?: string;
  onChange: (v: AssetValue | null) => void;
}) {
  const T = useT();
  const { data } = useData();
  const held = assetQuantities(data, account, editingTxId);
  const choices = unitChoices(held, dir, initial?.unit);
  const [picked, setPicked] = useState<AssetUnit | null>(initial?.unit ?? null);
  const unit = picked && choices.some((c) => c.unit === picked) ? picked : choices[0]?.unit ?? null;
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
            <Chip key={c.unit} on={c.unit === unit} onClick={() => setPicked(c.unit)}>
              {unitName(T, c.unit)}{c.qty > 0 && <small className="chip__qty"> · {formatQty(T, c.qty, c.unit)}</small>}
            </Chip>
          ))}
        </div>
      </fieldset>
      <UnitQtyFields
        key={unit}
        unit={unit}
        dir={dir}
        amount={amount}
        held={held.get(unit) ?? 0}
        initial={initial && initial.unit === unit ? initial : undefined}
        onChange={onChange}
      />
    </div>
  );
}

/**
 * Tek birim için miktar + fiyat. Katkıda kuyumcunun SATIŞ fiyatı, çekimde ALIŞ fiyatı önerilir; ikisi de
 * düzenlenebilir. Miktar = TL tutar ÷ fiyat. Kullanıcı miktarı yazarsa fiyat = tutar ÷ miktar olur (iki yönlü).
 */
function UnitQtyFields({ unit, dir, amount, held, initial, onChange }: {
  unit: AssetUnit;
  dir: 'in' | 'out';
  amount: string;
  held: number;
  initial?: AssetValue;
  onChange: (v: AssetValue | null) => void;
}) {
  const T = useT();
  const prices = usePrices();
  const live = prices.book[unit];
  const suggested = live ? (dir === 'in' ? live.sell : live.buy) : null;
  const lang = getLang();
  const [mode, setMode] = useState<'price' | 'qty'>(initial ? 'qty' : 'price');
  const [priceRaw, setPriceRaw] = useState(initial ? moneyToInput(initial.unitPrice) : '');
  const [priceTouched, setPriceTouched] = useState(!!initial);
  const [qtyRaw, setQtyRaw] = useState(initial ? qtyToInput(initial.qty, unit, lang) : '');

  useEffect(() => {
    void refreshPrices();
  }, []);

  const amt = parseMoney(amount);
  const effPriceRaw = priceTouched ? priceRaw : suggested ? moneyToInput(suggested) : '';
  let qty: number | null;
  let price: Money | null;
  if (mode === 'price') {
    price = parseMoney(effPriceRaw);
    qty = amt && price ? qtyFromAmount(amt, price, unit) : null;
  } else {
    qty = parseQty(qtyRaw, lang);
    price = amt && qty ? priceFromQty(amt, qty) : null;
  }
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
          label={T('asset.qtyLabel', { unit: u })}
          value={qtyShown}
          onChange={(v) => {
            setMode('qty');
            setQtyRaw(v);
          }}
        />
      </div>
      <p className="note-line">
        {live && suggested
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
  // Elde olan türler önce; hiç yoksa tümü.
  const held = assetQuantities(data, account);
  const have = ALL_UNITS.filter((u) => (held.get(u) ?? 0) > 0);
  const units = have.length ? have : ALL_UNITS;
  const [unit, setUnit] = useState<AssetUnit>(units[0]);
  const live = prices.book[unit];
  const [price, setPrice] = useState(live ? moneyToInput(live.buy) : '');
  function pick(u: AssetUnit) {
    setUnit(u);
    const b = getPrices().book[u];
    setPrice(b ? moneyToInput(b.buy) : '');
    onError(null);
  }
  function save() {
    const p = parseMoney(price);
    if (!p) return onError(T('asset.priceFormat'));
    setManualPrice(unit, p);
    onDone();
  }
  async function refresh() {
    await refreshPrices({ force: true });
    const b = getPrices().book[unit];
    if (b) setPrice(moneyToInput(b.buy));
  }
  const u = unitShort(T, unit);
  const body = (
    <>
      {units.length > 1 && (
        <fieldset className="block">
          <legend>{T('asset.priceUnitQ')}</legend>
          <div className="chip-row" role="group" aria-label={T('asset.unitLabel')}>
            {units.map((x) => <Chip key={x} on={x === unit} onClick={() => pick(x)}>{unitName(T, x)}</Chip>)}
          </div>
        </fieldset>
      )}
      <p className="muted">{T('asset.priceQ', { unit: u, money: moneyUnit() })}</p>
      <PriceInput label={T('asset.unitPriceLabel', { unit: u })} value={price} onChange={setPrice} />
      {live && <p className="note-line">{T('asset.priceLine', { unit: u, price: formatMoney(live.buy), ago: agoText(T, live.at) })}{live.source !== 'live' ? ` · ${T(live.source === 'manual' ? 'asset.src.manual' : 'asset.src.estimate')}` : ''}</p>}
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
