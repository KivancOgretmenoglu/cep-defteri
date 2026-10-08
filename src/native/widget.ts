/**
 * Ana ekran aracı köprüsü. Yerel eklenti (android/.../WidgetBridgePlugin.java) metni SharedPreferences'a
 * yazar ve araçları hemen yeniler; çiplerle eklenen kayıtların kuyruğunu okur/siler (widgetQueue.ts).
 * Tarayıcıda hiçbir şey yapmaz.
 */
import { registerPlugin } from '@capacitor/core';
import type { Data } from '../domain/types';
import type { ISODate } from '../domain/dates';
import { isNative } from '../platform';
import { widgetPayload } from './widgetPayload';
import { getWidgetPrefs } from './widgetPrefs';

interface WidgetBridgePlugin {
  /** payload: JSON metni (WidgetPayload) */
  update(options: { payload: string }): Promise<void>;
  refresh(): Promise<void>;
  /** queue: kuyruktaki öğelerin JSON dizi metni (silinmez) */
  readQueue(): Promise<{ queue: string }>;
  /** ids: işlenen qid'lerin JSON dizi metni */
  ackQueue(options: { ids: string }): Promise<{ remaining: number }>;
}

const WidgetBridge = registerPlugin<WidgetBridgePlugin>('WidgetBridge');

let last = '';

export async function updateWidget(data: Data, today: ISODate, mode: 'real' | 'demo', force = false) {
  if (!isNative()) return;
  const p = widgetPayload(data, today, mode, Date.now(), { animate: getWidgetPrefs().animate });
  const sig = JSON.stringify({ ...p, updatedAt: 0 });
  if (!force && sig === last) return;
  try {
    await WidgetBridge.update({ payload: JSON.stringify(p) });
    last = sig;
  } catch {
    /* eski APK'da eklenti yoksa sessizce geç */
  }
}

/** Kuyruğun ham metni; tarayıcıda ya da eski APK'da null. */
export async function readWidgetQueue(): Promise<string | null> {
  if (!isNative()) return null;
  try {
    return (await WidgetBridge.readQueue()).queue ?? null;
  } catch {
    return null;
  }
}

export async function ackWidgetQueue(ids: string[]): Promise<void> {
  if (!isNative() || ids.length === 0) return;
  try {
    await WidgetBridge.ackQueue({ ids: JSON.stringify(ids) });
  } catch {
    /* bir sonraki açılışta yeniden denenir; işlenmiş qid'ler zaten atlanır */
  }
}
