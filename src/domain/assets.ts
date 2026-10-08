/**
 * Altın ve döviz tutan yatırım hesapları için birim bilgisi ve miktar/değer hesapları (saf fonksiyonlar).
 *
 * Model:
 *  - Hesap TL yerine bir varlık birimi tutar (Account.asset). Katkı/çekim işlemi TL tutarın yanında
 *    o anda alınan/satılan miktarı (Tx.qty) ve birim fiyatı (Tx.unitPrice) saklar.
 *  - Elde tutulan miktar = açılış miktarı + katkılarla alınan − çekimlerle satılan.
 *  - Güncel değer = miktar × güncel ALIŞ fiyatı (kuyumcu/döviz bürosu senden bu fiyata alır;
 *    yani bugün satsan eline geçecek tutar). Fiyat yoksa son işlem fiyatı kullanılır.
 *  - Hedefler ve net katkı TL üzerinden ölçülmeye devam eder.
 */
import type { Money } from './money';

export type GoldUnit = 'gram' | 'ceyrek' | 'yarim' | 'tam' | 'cumhuriyet' | 'bilezik22';
export type FxUnit = 'USD' | 'EUR' | 'GBP';
export type AssetUnit = GoldUnit | FxUnit;
export type AssetKind = 'gold' | 'fx';

export interface AssetSpec {
  kind: AssetKind;
  unit: AssetUnit;
}

export const GOLD_UNITS: GoldUnit[] = ['gram', 'ceyrek', 'yarim', 'tam', 'cumhuriyet', 'bilezik22'];
export const FX_UNITS: FxUnit[] = ['USD', 'EUR', 'GBP'];
export const ALL_UNITS: AssetUnit[] = [...GOLD_UNITS, ...FX_UNITS];

export const unitKind = (u: AssetUnit): AssetKind => ((FX_UNITS as string[]).includes(u) ? 'fx' : 'gold');
export const isAssetUnit = (v: unknown): v is AssetUnit => typeof v === 'string' && (ALL_UNITS as string[]).includes(v);

export function isAssetSpec(v: unknown): v is AssetSpec {
  if (typeof v !== 'object' || v === null) return false;
  const o = v as Record<string, unknown>;
  return isAssetUnit(o.unit) && o.kind === unitKind(o.unit);
}

/** Miktarın kaç ondalıkla tutulacağı: gram 0,001; sikke ve döviz 0,01. */
export function qtyDecimals(u: AssetUnit): number {
  return u === 'gram' || u === 'bilezik22' ? 3 : 2;
}

/**
 * Has altın (24 ayar) gram karşılığı; yalnız yedek kaynakta (ons fiyatından) tahmini fiyat üretmek için.
 * Sikkeler 22 ayardır (0,916). Kuyumcu fiyatı işçilik payı içerdiği için gerçek fiyattan farklıdır.
 */
export const PURE_GRAMS: Record<GoldUnit, number> = {
  gram: 1,
  bilezik22: 0.916,
  ceyrek: 1.75 * 0.916,
  yarim: 3.5 * 0.916,
  tam: 7.0 * 0.916,
  cumhuriyet: 7.216 * 0.916,
};

/** Kayan nokta gürültüsünü (0,1 + 0,2) temizler; birimin ondalığına yuvarlar. */
export function roundQty(q: number, u: AssetUnit): number {
  const f = 10 ** qtyDecimals(u);
  return Math.round((q + Number.EPSILON * Math.sign(q)) * f) / f;
}

export const isQty = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v > 0 && v < 1e9;

/** TL tutar ÷ birim fiyat → miktar (birimin ondalığına yuvarlı). Fiyat ≤ 0 ise null. */
export function qtyFromAmount(amount: Money, unitPrice: Money, u: AssetUnit): number | null {
  if (!(unitPrice > 0) || !(amount > 0)) return null;
  const q = roundQty(amount / unitPrice, u);
  return q > 0 ? q : null;
}

/** TL tutar ÷ miktar → birim fiyat (kuruş). */
export function priceFromQty(amount: Money, qty: number): Money | null {
  if (!(qty > 0) || !(amount > 0)) return null;
  const p = Math.round(amount / qty);
  return p > 0 ? p : null;
}

/** Miktar × birim fiyat → TL (kuruş). */
export const valueOf = (qty: number, unitPrice: Money): Money => Math.round(qty * unitPrice);

/**
 * Kullanıcının yazdığı miktarı sayıya çevirir. Türkçede virgül ondalık, nokta binliktir ("1.234,5");
 * İngilizcede nokta ondalık. Virgül yoksa tek nokta Türkçede de ondalık sayılır ("1.234" → 1,234 gram;
 * miktarlar binlik ayırıcıyla pek yazılmaz, gram altında bu okuma daha güvenli).
 */
export function parseQty(input: string, lang: 'tr' | 'en' = 'tr'): number | null {
  let s = input.trim().replace(/\s/g, '');
  if (!s) return null;
  if (lang === 'en') s = s.replace(/,/g, '');
  else if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  else if ((s.match(/\./g) ?? []).length > 1) s = s.replace(/\./g, '');
  if (!/^\d+(\.\d+)?$/.test(s)) return null;
  const n = Number(s);
  return isQty(n) ? n : null;
}

/** Miktarı düzenleme alanı için yazar: 1.5 → "1,5" (en: "1.5"). */
export function qtyToInput(q: number, u: AssetUnit, lang: 'tr' | 'en' = 'tr'): string {
  const s = String(roundQty(q, u));
  return lang === 'en' ? s : s.replace('.', ',');
}
