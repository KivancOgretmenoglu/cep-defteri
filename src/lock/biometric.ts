/** Parmak izi / yüz ile açma (yalnız Android uygulamasında; tarayıcıda hiç yüklenmez). */
import { Capacitor } from '@capacitor/core';
import { suppressRelock } from './lockState';
import { t as tr } from '../i18n';

export interface BiometricInfo {
  available: boolean;
  /** "Parmak izi", "Yüz tanıma" ya da "Parmak izi / yüz" */
  label: string;
}

export async function biometricInfo(): Promise<BiometricInfo> {
  if (!Capacitor.isNativePlatform()) return { available: false, label: '' };
  try {
    const { NativeBiometric, BiometryType } = await import('@capgo/capacitor-native-biometric');
    const r = await NativeBiometric.isAvailable({ useFallback: false });
    const t = r.biometryType;
    const label =
      t === BiometryType.FINGERPRINT || t === BiometryType.TOUCH_ID
        ? tr('bio.fingerprint')
        : t === BiometryType.FACE_AUTHENTICATION || t === BiometryType.FACE_ID
          ? tr('bio.face')
          : tr('bio.either');
    return { available: r.isAvailable, label };
  } catch {
    return { available: false, label: '' };
  }
}

/** Sistem biyometrik penceresini açar; başarılıysa true. */
export async function verifyBiometric(reason = tr('bio.reason')): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    const { NativeBiometric } = await import('@capgo/capacitor-native-biometric');
    suppressRelock(60_000);
    await NativeBiometric.verifyIdentity({ reason, title: 'Cep Defteri', subtitle: reason, negativeButtonText: tr('bio.enterPin'), maxAttempts: 5 });
    return true;
  } catch {
    return false;
  } finally {
    suppressRelock(3000);
  }
}
