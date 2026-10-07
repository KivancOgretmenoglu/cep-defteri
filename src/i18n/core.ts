/**
 * Saf çeviri çekirdeği: React'e ve depoya bağımlı değildir; src/domain de kullanabilir.
 * Sözlükler: tr.ts (kaynak) ve en.ts (tr'deki her anahtarı içermek zorunda; tür denetimli).
 */
import type { Lang } from '../domain/types';
import { tr } from './tr';
import { en } from './en';

export type Vars = Record<string, string | number>;
/** Metin ya da dil bilgisine göre metin üreten küçük işlev (çoğul/ek farkları için). */
export type Entry = string | ((v: Vars) => string);
export type Key = keyof typeof tr;
/** Her dil sözlüğü tr'deki anahtarların tamamını içerir (fazlasını değil). */
export type Dict = { [K in Key]: Entry };

const DICTS: Record<Lang, Dict> = { tr, en };

/** "{name}" yer tutucularını doldurur. */
export function interpolate(s: string, vars?: Vars): string {
  if (!vars) return s;
  return s.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}

export function translate(lang: Lang, key: Key, vars?: Vars): string {
  const e = (DICTS[lang] ?? DICTS.tr)[key] ?? DICTS.tr[key];
  if (typeof e === 'function') return e(vars ?? {});
  return interpolate(e ?? String(key), vars);
}

export type TFn = (key: Key, vars?: Vars) => string;
export const translator = (lang: Lang): TFn => (key, vars) => translate(lang, key, vars);
