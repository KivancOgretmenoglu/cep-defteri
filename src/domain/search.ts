/**
 * İşlem arama: not, kategori adı, etiket, hesap adı ve tutara göre süzme.
 * Büyük/küçük harf ve Türkçe aksan duyarsızdır: "ISTANBUL", "İstanbul", "istanbul" ve "ıstanbul" aynıdır;
 * "sut" "Süt"ü, "cay" "Çay"ı bulur. Birden çok kelime yazılırsa hepsi eşleşmelidir.
 * Sayı yazılırsa tutar da aranır: "160" 160 TL ve 160,50 TL'yi, "160,5" yalnız 160,50 TL'yi bulur;
 * "100-200" aralıktır (iki uç dahil).
 */
import type { Tx } from './types';
import { parseMoney, type Money, type MoneyLang } from './money';

/** Karşılaştırma için metni sadeleştirir: Türkçe küçük harf, ı→i, aksanlar atılır. */
export function fold(s: string): string {
  return s
    .toLocaleLowerCase('tr')
    .replace(/ı/g, 'i')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

export type SearchToken =
  | { kind: 'text'; text: string }
  | { kind: 'amount'; text: string; value: Money; exact: boolean }
  | { kind: 'range'; text: string; min: Money; max: Money };

const NUM = /^[\d.,]+$/;

/** Arama metnini kelimelere ayırır; sayı gibi görünen kelimeler tutar olarak da yorumlanır. */
export function parseSearch(q: string, lang: MoneyLang = 'tr'): SearchToken[] {
  const out: SearchToken[] = [];
  for (const raw of q.trim().split(/\s+/)) {
    if (!raw) continue;
    const text = fold(raw.replace(/^#/, ''));
    if (!text) continue;
    const range = raw.match(/^([\d.,]+)\s*[-–]\s*([\d.,]+)$/);
    if (range) {
      const a = parseMoney(range[1], lang);
      const b = parseMoney(range[2], lang);
      if (a !== null && b !== null) {
        out.push({ kind: 'range', text, min: Math.min(a, b), max: Math.max(a, b) });
        continue;
      }
    }
    if (NUM.test(raw) && /\d/.test(raw)) {
      const value = parseMoney(raw, lang);
      if (value !== null) {
        const exact = raw.includes(lang === 'en' ? '.' : ',') || value % 100 !== 0;
        out.push({ kind: 'amount', text, value, exact });
        continue;
      }
    }
    out.push({ kind: 'text', text });
  }
  return out;
}

/** Tek işlem, hazırlanmış (fold edilmiş) arama metniyle eşleşiyor mu. */
export function matchTokens(tokens: SearchToken[], amount: Money, haystack: string): boolean {
  return tokens.every((tk) => {
    if (tk.kind === 'range') return amount >= tk.min && amount <= tk.max;
    if (tk.kind === 'amount') {
      const hit = tk.exact ? amount === tk.value : Math.floor(amount / 100) === tk.value / 100;
      // Not içindeki sayılar da bulunur (ör. "160 km").
      return hit || haystack.includes(tk.text);
    }
    return haystack.includes(tk.text);
  });
}

/**
 * İşlemleri arama metnine göre süzer. `textOf` bir işlemin aranabilir metnini verir
 * (not, yerelleştirilmiş kategori adı, hesap adları, etiketler); bu modül dil/arayüz bilmez.
 */
export function searchTxs(txs: Tx[], q: string, lang: MoneyLang, textOf: (t: Tx) => string): Tx[] {
  const tokens = parseSearch(q, lang);
  if (tokens.length === 0) return txs;
  return txs.filter((t) => matchTokens(tokens, t.amount, fold(textOf(t))));
}
