/**
 * Gömülü hisse listesi (src/data/stocks.json; scripts/gen-stock-list.mjs üretir): tüm BIST hisseleri,
 * en büyük ABD hisseleri ve yaygın ETF'ler. Yalnız arama ve şirket adı içindir; ilk ihtiyaçta tembel
 * yüklenir (açılışı yavaşlatmaz, çevrimdışı çalışır). Listede olmayan kod da elle eklenebilir.
 */
import { useEffect, useState } from 'react';
import type { StockUnit } from '../domain/assets';
import type { StockEntry } from '../domain/stocks';
import { getPrices } from './prices';

interface Raw {
  asOf: string;
  bist: [string, string][];
  us: [string, string][];
  etf: [string, string][];
}

let list: StockEntry[] | null = null;
let byUnit = new Map<StockUnit, StockEntry>();
let loading: Promise<StockEntry[]> | null = null;
let asOf: string | null = null;

export function loadStockList(): Promise<StockEntry[]> {
  if (list) return Promise.resolve(list);
  loading ??= import('../data/stocks.json').then((m) => {
    const raw = (m.default ?? m) as unknown as Raw;
    asOf = raw.asOf;
    const out: StockEntry[] = [
      ...raw.bist.map(([symbol, name]) => ({ unit: `BIST:${symbol}` as StockUnit, symbol, name })),
      ...raw.us.map(([symbol, name]) => ({ unit: `US:${symbol}` as StockUnit, symbol, name })),
      ...raw.etf.map(([symbol, name]) => ({ unit: `US:${symbol}` as StockUnit, symbol, name, etf: true })),
    ];
    byUnit = new Map(out.map((e) => [e.unit, e]));
    list = out;
    return out;
  });
  return loading;
}

/** Liste yüklendiyse true; bileşen yeniden çizilsin diye kanca. */
export function useStockList(): StockEntry[] | null {
  const [l, setL] = useState(list);
  useEffect(() => {
    if (!l) void loadStockList().then(setL);
  }, [l]);
  return l;
}

/** Şirket adı: gömülü listeden, yoksa kaynağın verdiği addan. Bilinmiyorsa undefined. */
export function stockName(u: StockUnit): string | undefined {
  return byUnit.get(u)?.name ?? getPrices().quotes[u]?.name;
}

export const stockListAsOf = () => asOf;
