import { describe, expect, it } from 'vitest';
import { fold, parseSearch, searchTxs } from './search';
import type { Tx } from './types';

const tx = (id: string, amount: number, note = '', extra = ''): Tx & { extra: string } => ({
  id, seq: 1, type: 'expense', amount, date: '2026-10-01', accountId: 'a', note, createdAt: 0, extra,
});

const list = [
  tx('1', 16000, 'Süt ve çay', 'Market Banka'),
  tx('2', 16050, 'Taksi', 'Ulaşım Nakit #istanbul'),
  tx('3', 25000, 'İnternet faturası', 'Faturalar Banka'),
  tx('4', 990, 'Kitap 160 sayfa', 'Eğitim Nakit #okul'),
  tx('5', 125000, 'ISPARTA gezisi', 'Tatil Banka'),
];
const textOf = (t: Tx) => `${t.note ?? ''} ${(t as Tx & { extra: string }).extra}`;
const ids = (q: string, lang: 'tr' | 'en' = 'tr') => searchTxs(list, q, lang, textOf).map((t) => t.id);

describe('fold', () => {
  it('normalizes Turkish case and diacritics', () => {
    expect(fold('İSTANBUL')).toBe('istanbul');
    expect(fold('ISTANBUL')).toBe('istanbul');
    expect(fold('ıstanbul')).toBe('istanbul');
    expect(fold('Şçğöü')).toBe('scgou');
  });
});

describe('searchTxs', () => {
  it('returns everything for an empty query', () => {
    expect(ids('   ')).toHaveLength(list.length);
  });
  it('matches text without case or diacritics', () => {
    expect(ids('sut')).toEqual(['1']);
    expect(ids('ÇAY')).toEqual(['1']);
    expect(ids('internet')).toEqual(['3']);
    expect(ids('isparta')).toEqual(['5']);
    expect(ids('ulasim')).toEqual(['2']);
  });
  it('matches category, account and tag text', () => {
    expect(ids('market')).toEqual(['1']);
    expect(ids('nakit')).toEqual(['2', '4']);
    expect(ids('#okul')).toEqual(['4']);
    expect(ids('okul')).toEqual(['4']);
  });
  it('requires every word to match', () => {
    expect(ids('banka fatura')).toEqual(['3']);
  });
  it('matches whole-lira amounts including kurus, and notes containing the number', () => {
    expect(ids('160')).toEqual(['1', '2', '4']);
  });
  it('matches exact decimal amounts', () => {
    expect(ids('160,5')).toEqual(['2']);
    expect(ids('160,50')).toEqual(['2']);
    expect(ids('160.5', 'en')).toEqual(['2']);
    expect(ids('9,90')).toEqual(['4']);
  });
  it('understands thousands separators', () => {
    expect(ids('1.250')).toEqual(['5']);
    expect(ids('1,250', 'en')).toEqual(['5']);
  });
  it('supports ranges', () => {
    expect(ids('100-200')).toEqual(['1', '2']);
    expect(ids('200-100')).toEqual(['1', '2']);
    expect(ids('0-10')).toEqual([]);
  });
  it('classifies tokens', () => {
    expect(parseSearch('süt 160 160,5 10-20').map((t) => t.kind)).toEqual(['text', 'amount', 'amount', 'range']);
  });
});
