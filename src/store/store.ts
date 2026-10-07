/**
 * Uygulama durumu: tek bir veri nesnesi, değişiklikler `commit` ile yapılır ve hemen kaydedilir.
 * Son değişiklik birkaç saniye boyunca geri alınabilir.
 */
import { useSyncExternalStore } from 'react';
import type { Data } from '../domain/types';
import { todayISO, type ISODate } from '../domain/dates';
import { ActionError } from '../domain/actions';
import * as storage from './storage';
import { haptic } from '../native/haptics';
import { translate, type Key } from '../i18n/core';

/** Depodaki o anki dil (i18n/lang.ts bu dosyaya bağlı olduğundan burada doğrudan okunur). */
const curLang = () => state.data.settings.lang ?? 'tr';

export interface Toast {
  id: number;
  text: string;
  undo?: boolean;
  tone?: 'ok' | 'error';
}

interface State {
  data: Data;
  mode: storage.Mode;
  today: ISODate;
  /** Uyarının sözlük anahtarı (arayüzde çevrilir) */
  warning: Key | null;
  saveFailed: boolean;
  toast: Toast | null;
  /** Maskotun kısa onay hareketi için sayaç */
  pulse: number;
  isNew: boolean;
}

let undoPrev: Data | null = null;
let toastTimer: ReturnType<typeof setTimeout> | undefined;
let toastSeq = 0;
const listeners = new Set<() => void>();

function init(): State {
  const mode = storage.loadMode();
  const loaded = storage.load(mode);
  return { data: loaded.data, mode, today: todayISO(), warning: loaded.warning, saveFailed: false, toast: null, pulse: 0, isNew: loaded.isNew };
}

let state: State = init();

function emit(next: Partial<State>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

export function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}
export const getState = () => state;

export function useStore<T>(sel: (s: State) => T): T {
  return useSyncExternalStore(subscribe, () => sel(state));
}

function persist(data: Data): boolean {
  const ok = storage.save(state.mode, data);
  return ok;
}

export function showToast(text: string, opts: { undo?: boolean; tone?: Toast['tone']; ms?: number } = {}) {
  clearTimeout(toastTimer);
  const t: Toast = { id: ++toastSeq, text, undo: opts.undo, tone: opts.tone ?? 'ok' };
  emit({ toast: t });
  toastTimer = setTimeout(() => {
    if (state.toast?.id === t.id) {
      if (t.undo) undoPrev = null;
      emit({ toast: null });
    }
  }, opts.ms ?? (opts.undo ? 6000 : 3200));
}
export function hideToast() {
  clearTimeout(toastTimer);
  undoPrev = null;
  emit({ toast: null });
}

/**
 * Bir değişiklik uygular. Hata (ActionError) olursa mesajı döndürür, veri değişmez.
 * `message` verilirse geri alınabilir bir bildirim gösterilir.
 */
export function commit(fn: (d: Data, today: ISODate) => Data, message?: string, opts: { pulse?: boolean; undo?: boolean } = {}): string | null {
  const prev = state.data;
  let next: Data;
  try {
    next = fn(prev, state.today);
  } catch (e) {
    if (e instanceof ActionError) return e.localize(curLang());
    console.error(e);
    return translate(curLang(), 'store.unexpected');
  }
  const ok = persist(next);
  emit({ data: next, saveFailed: !ok, pulse: opts.pulse ? state.pulse + 1 : state.pulse, isNew: false });
  if (opts.pulse && ok) haptic('success');
  if (message) {
    undoPrev = opts.undo === false ? null : prev;
    showToast(message, { undo: opts.undo !== false });
  }
  return null;
}

export function undo() {
  if (!undoPrev) return;
  const prev = undoPrev;
  undoPrev = null;
  const ok = persist(prev);
  emit({ data: prev, saveFailed: !ok });
  showToast(translate(curLang(), 'store.undone'));
}

/** Gün değişimini yakalar (gece yarısını geçen açık uygulama için). */
export function refreshToday() {
  const t = todayISO();
  if (t !== state.today) emit({ today: t });
}

/** Tüm veriyi değiştirir (geri yükleme, örnekten çıkış). Geri yüklemeden önceki hâl saklanır. */
export function replaceData(data: Data, opts: { stash?: boolean } = {}) {
  if (opts.stash) storage.stashPreRestore(state.data);
  const ok = persist(data);
  undoPrev = null;
  emit({ data, saveFailed: !ok, isNew: false, warning: null });
}

export function setMode(mode: storage.Mode, demoData?: Data) {
  storage.saveMode(mode);
  if (mode === 'demo' && demoData) storage.save('demo', demoData);
  if (mode === 'real') storage.clearDemo();
  const loaded = storage.load(mode);
  undoPrev = null;
  emit({ mode, data: loaded.data, isNew: loaded.isNew, toast: null, warning: loaded.warning });
}

export function dismissWarning() {
  emit({ warning: null });
}

// Başka bir sekmede yapılan değişiklikleri al.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key && e.key.startsWith(storage.STORAGE_KEY_PREFIX) && !e.key.includes('pre-restore')) {
      const mode = storage.loadMode();
      const loaded = storage.load(mode);
      emit({ mode, data: loaded.data, isNew: loaded.isNew });
    }
  });
  document.addEventListener('visibilitychange', refreshToday);
  setInterval(refreshToday, 60_000);
}
