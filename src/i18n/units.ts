/** Varlık birimlerinin adları: altın/döviz sözlükten, hisseler kod + borsa (adı biliniyorsa ad). */
import { isStockUnit, stockMarket, stockSymbol, type AssetUnit } from '../domain/assets';
import type { TFn } from './core';

/** Uzun ad: "Gram altın (24 ayar)", "THYAO · Türk Hava Yolları", ad yoksa "AAPL (ABD)". */
export function unitLabel(T: TFn, u: AssetUnit, name?: string): string {
  if (!isStockUnit(u)) return T(`asset.unit.${u}`);
  return name ? `${stockSymbol(u)} · ${name}` : T('stock.unitNoName', { sym: stockSymbol(u), market: T(`stock.market.${stockMarket(u)}`) });
}

/** Kısa ad (miktarın yanında): "gram", "çeyrek", "USD", "THYAO". */
export function unitShortLabel(T: TFn, u: AssetUnit): string {
  return isStockUnit(u) ? stockSymbol(u) : T(`asset.short.${u}`);
}
