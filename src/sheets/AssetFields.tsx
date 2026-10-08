/**
 * Altın/döviz hesaplarının form parçaları: birim seçimi (hesap sayfası), miktar + birim fiyat
 * (katkı/çekim formu), elle fiyat girişi ve ortak biçimlendirme yardımcıları.
 */
import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import type { Account } from '../domain/types';
import type { Money } from '../domain/money';
import {
  FX_UNITS, GOLD_UNITS, parseQty, priceFromQty, qtyDecimals, qtyFromAmount, qtyToInput, unitKind,
  type AssetKind, type AssetSpec, type AssetUnit,
} from '../domain/assets';
import { heldQty } from '../domain/actions';
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

export type HoldChoice = 'tl' | AssetKind;

/** "Ne olarak tutuyorsun? TL / Altın / Döviz" + birim. Kilitliyse yalnız gösterir. */
export function AssetPicker({ value, onChange, locked }: { value: AssetSpec | null; onChange: (v: AssetSpec | null) => void; locked: boolean }) {
  const T = useT();
  const choice: HoldChoice = value ? value.kind : 'tl';
  if (locked) {
    return (
      <div className="callout callout--quiet">
        <p><b>{T('asset.holdQ')}</b> {value ? unitName(T, value.unit) : T('asset.kind.tl')}</p>
        {value && <p className="note-line">{T('asset.lockedNote')}</p>}
      </div>
    );
  }
  const units = choice === 'gold' ? GOLD_UNITS : choice === 'fx' ? FX_UNITS : [];
  return (
    <fieldset className="block">
      <legend>{T('asset.holdQ')}</legend>
      <Segmented<HoldChoice>
        size="sm"
        label={T('asset.holdQ')}
        value={choice}
        onChange={(c) => onChange(c === 'tl' ? null : { kind: c, unit: c === 'gold' ? 'gram' : 'USD' })}
        options={[
          { value: 'tl', label: T('asset.kind.tl') },
          { value: 'gold', label: T('asset.kind.gold') },
          { value: 'fx', label: T('asset.kind.fx') },
        ]}
      />
      {units.length > 0 && (
        <div className="chip-row" role="group" aria-label={T('asset.unitLabel')}>
          {units.map((u) => (
            <Chip key={u} on={value?.unit === u} onClick={() => onChange({ kind: unitKind(u), unit: u })}>{unitName(T, u)}</Chip>
          ))}
        </div>
      )}
    </fieldset>
  );
}

/** "Mevcut birikimimi ekle": açılış miktarı + o günkü birim fiyat. */
export function OpeningHoldings({ unit, qty, price, onQty, onPrice }: { unit: AssetUnit; qty: string; price: string; onQty: (v: string) => void; onPrice: (v: string) => void }) {
  const T = useT();
  const prices = usePrices();
  const live = prices.book[unit];
  // Fiyat boşsa güncel alış fiyatı önerilir.
  useEffect(() => {
    if (!price && live) onPrice(moneyToInput(live.buy));
  }, [live, price, onPrice]);
  useEffect(() => {
    void refreshPrices();
  }, []);
  const q = parseQty(qty, getLang());
  const p = parseMoney(price);
  return (
    <>
      <p className="note-line">{T('asset.haveSomeHint', { unit: unitShort(T, unit) })}</p>
      <QtyInput label={T('asset.openingQty', { unit: unitShort(T, unit) })} value={qty} onChange={onQty} />
      <PriceInput label={T('asset.unitPriceLabel', { unit: unitShort(T, unit) })} value={price} onChange={onPrice} />
      {q && p ? <p className="note-line">{T('asset.openingValue', { amount: formatMoney(Math.round(q * p)) })}</p> : null}
    </>
  );
}

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
  qty: number;
  unitPrice: Money;
}

/**
 * Katkıda (dir 'in') kuyumcunun SATIŞ fiyatı, çekimde ALIŞ fiyatı önerilir; ikisi de düzenlenebilir.
 * Miktar = TL tutar ÷ fiyat. Kullanıcı miktarı yazarsa fiyat = tutar ÷ miktar olur (iki yönlü).
 * Geçerli değer değiştikçe `onChange` çağrılır (eksikse null).
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
  const prices = usePrices();
  const unit = account.asset!.unit;
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
    onChange(qty && price ? { qty, unitPrice: price } : null);
  }, [qty, price, onChange]);

  const held = heldQty(data, account, editingTxId);
  const u = unitShort(T, unit);
  return (
    <div className="asset-fields">
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
    </div>
  );
}

// ───────────────────────── Elle fiyat ─────────────────────────

/**
 * Değerleme yerine: varlık hesabının birim fiyatını elle gir (bu cihazda saklanır, yedeğe girmez).
 * Kanca: sayfa gövdesini ve kaydet işlevini döndürür (ValuationSheet kullanır).
 */
export function useManualPrice(account: Account, onDone: () => void, onError: (m: string | null) => void) {
  const T = useT();
  const prices = usePrices();
  const unit = account.asset!.unit;
  const live = prices.book[unit];
  const [price, setPrice] = useState(live ? moneyToInput(live.buy) : '');
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
