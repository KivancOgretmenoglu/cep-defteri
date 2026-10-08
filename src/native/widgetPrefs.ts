/**
 * Ana ekran aracına ait, yalnız bu cihazdaki tercihler (yedeğe girmez): büyük araçtaki canlandırma.
 * Ayrı bir localStorage anahtarında tutulur; widget.ts payload'a `animate` olarak ekler.
 */
import { useSyncExternalStore } from 'react';

export interface WidgetPrefs {
  /** Büyük araçta maskotun kare kare canlandırması (kapalıysa sabit kare). */
  animate: boolean;
}

const KEY = 'cep-defteri:widget';
export const DEFAULT_WIDGET_PREFS: WidgetPrefs = { animate: true };

function read(): WidgetPrefs {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULT_WIDGET_PREFS, ...JSON.parse(raw) } : DEFAULT_WIDGET_PREFS;
  } catch {
    return DEFAULT_WIDGET_PREFS;
  }
}

let prefs: WidgetPrefs | null = null;
const ls = new Set<() => void>();

export const getWidgetPrefs = (): WidgetPrefs => (prefs ??= read());

export function setWidgetPrefs(patch: Partial<WidgetPrefs>) {
  prefs = { ...getWidgetPrefs(), ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {
    /* depolama yoksa yalnız bellekte kalır */
  }
  ls.forEach((l) => l());
}

export function useWidgetPrefs(): WidgetPrefs {
  return useSyncExternalStore(
    (l) => {
      ls.add(l);
      return () => ls.delete(l);
    },
    getWidgetPrefs,
  );
}
