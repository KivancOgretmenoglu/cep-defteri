/**
 * Arayüz çevirisi. Bileşenlerde `const t = useT();` (dil değişince yeniden çizilir),
 * React dışında `t('anahtar', { ad: 'x' })` (o anki dil).
 */
import { useMemo } from 'react';
import { getLang, useLang } from './lang';
import { translate, type Key, type Vars, type TFn } from './core';
import type { Lang } from '../domain/types';

export type { Key, Vars, TFn };

/** O anki dilde çeviri (React dışı kod: bildirimler, uyarılar…). */
export const t: TFn = (key, vars) => translate(getLang(), key, vars);

export type BoundT = TFn & { lang: Lang };

/** Bileşenler için: dil değişince yeniden çizilir. `t.lang` o anki dil. */
export function useT(): BoundT {
  const lang = useLang();
  return useMemo(() => Object.assign(((key: Key, vars?: Vars) => translate(lang, key, vars)) as TFn, { lang }), [lang]);
}
