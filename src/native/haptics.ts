/**
 * Dokunsal geri bildirim (titreşim). Yalnız Android uygulamasında çalışır; tarayıcıda hiçbir şey yapmaz.
 * Hatalar yutulur: titreşim hiçbir akışı bozmamalı.
 *   light   : hafif tık (seçim, düğme)
 *   success : kayıt eklendi / hedef tamamlandı
 *   warning : bütçe aşıldı, silme onayı
 */
import { isNative } from '../platform';

export type HapticKind = 'light' | 'success' | 'warning';

type HapticsModule = typeof import('@capacitor/haptics');
let mod: Promise<HapticsModule> | null = null;

export function haptic(kind: HapticKind): void {
  if (!isNative()) return;
  try {
    mod ??= import('@capacitor/haptics');
    mod
      .then(({ Haptics, ImpactStyle, NotificationType }) =>
        kind === 'light'
          ? Haptics.impact({ style: ImpactStyle.Light })
          : Haptics.notification({ type: kind === 'success' ? NotificationType.Success : NotificationType.Warning }),
      )
      .catch(() => undefined);
  } catch {
    /* sessizce geç */
  }
}
