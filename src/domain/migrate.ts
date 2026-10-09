/**
 * Kayıtlı/yedeklenmiş veriyi güncel biçime çeviren saf dönüşümler. Doğrulamadan ÖNCE, ham JSON nesnesi
 * üzerinde çalışır (parseBackup çağırır; localStorage'dan okuma da parseBackup'tan geçer). Tanımadığı ya da
 * bozuk alanlara dokunmaz: onları doğrulama reddeder. Güncel biçimdeki veride hiçbir şey değiştirmez.
 *
 * 1) Tek birimli altın/döviz hesabı → çok türlü hesap
 *    Eski: account.asset = { kind, unit }, account.openingQty?, account.openingPrice?;
 *          tx.qty + tx.unitPrice (birim hesaptan anlaşılırdı).
 *    Yeni: account.asset = { opening: [{ unit, qty, price }] } (açılış yoksa boş liste);
 *          tx.unit, tx.qty, tx.unitPrice.
 *    Miktarlar, fiyatlar ve openingBalance aynen korunur; böylece değerler önce/sonra aynıdır.
 */

import { isAssetUnit } from './assets';

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Eski tek birimli varlık bilgisi mi? ({ kind, unit }; `opening` yok) */
const isLegacyAsset = (v: unknown): v is { unit: unknown } => isObj(v) && 'unit' in v && !('opening' in v);

export function migrateRawData(d: Record<string, unknown>): Record<string, unknown> {
  if (!Array.isArray(d.accounts) || !Array.isArray(d.txs)) return d;
  const legacyUnit = new Map<unknown, unknown>();
  let changed = false;
  const accounts = d.accounts.map((a: unknown) => {
    // Bilinmeyen birimli eski kayıt olduğu gibi kalır; doğrulama reddeder.
    if (!isObj(a) || !isLegacyAsset(a.asset) || !isAssetUnit(a.asset.unit)) return a;
    changed = true;
    const unit = a.asset.unit;
    legacyUnit.set(a.id, unit);
    const { openingQty, openingPrice, ...rest } = a;
    const opening = openingQty !== undefined ? [{ unit, qty: openingQty, price: openingPrice }] : [];
    return { ...rest, asset: { opening } };
  });
  if (!changed) return d;
  const txs = d.txs.map((t: unknown) => {
    if (!isObj(t) || t.qty === undefined || t.unit !== undefined) return t;
    const unit = legacyUnit.get(t.toAccountId) ?? legacyUnit.get(t.accountId);
    return unit === undefined ? t : { ...t, unit };
  });
  return { ...d, accounts, txs };
}
