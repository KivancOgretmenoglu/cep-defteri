/**
 * Arayüz dili. Seçim veride (settings.lang) tutulur; yedekle birlikte taşınır.
 * Metin sözlükleri ve t() yardımcıları src/i18n altında.
 */
import { getState, useStore } from '../store/store';
import type { Lang } from '../domain/types';

export type { Lang };
export const LANGS: Lang[] = ['tr', 'en'];

export const getLang = (): Lang => getState().data.settings.lang ?? 'tr';
export const useLang = (): Lang => useStore((s) => s.data.settings.lang ?? 'tr');

/** Telefonun dilinden öneri (ilk açılış): Türkçe değilse İngilizce. */
export function suggestLang(): Lang {
  const l = (typeof navigator !== 'undefined' && (navigator.languages?.[0] || navigator.language)) || 'tr';
  return l.toLowerCase().startsWith('tr') ? 'tr' : 'en';
}
