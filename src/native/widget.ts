/**
 * Ana ekran aracı köprüsü. Yerel eklenti (android/.../WidgetBridgePlugin.java) metni SharedPreferences'a
 * yazar ve araçları hemen yeniler. Tarayıcıda hiçbir şey yapmaz.
 */
import { registerPlugin } from '@capacitor/core';
import type { Data } from '../domain/types';
import type { ISODate } from '../domain/dates';
import { isNative } from '../platform';
import { widgetPayload } from './widgetPayload';

interface WidgetBridgePlugin {
  /** payload: JSON metni (WidgetPayload) */
  update(options: { payload: string }): Promise<void>;
  refresh(): Promise<void>;
}

const WidgetBridge = registerPlugin<WidgetBridgePlugin>('WidgetBridge');

let last = '';

export async function updateWidget(data: Data, today: ISODate, mode: 'real' | 'demo', force = false) {
  if (!isNative()) return;
  const p = widgetPayload(data, today, mode);
  const sig = JSON.stringify({ ...p, updatedAt: 0 });
  if (!force && sig === last) return;
  try {
    await WidgetBridge.update({ payload: JSON.stringify(p) });
    last = sig;
  } catch {
    /* eski APK'da eklenti yoksa sessizce geç */
  }
}
