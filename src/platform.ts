/**
 * Android uygulaması (Capacitor) ile tarayıcı arasındaki farklar burada toplanır.
 * Tarayıcıda dosya indirilir; uygulamada dosya önce cihaza yazılır, sonra paylaşım ekranı açılır
 * (Drive'a, Dosyalar'a, WhatsApp'a… kaydedebilirsin). Uygulama içi WebView "indirme" yapamaz.
 */
import { Capacitor } from '@capacitor/core';

export const isNative = () => Capacitor.isNativePlatform();

export async function saveFile(name: string, content: string, type: string): Promise<'downloaded' | 'shared' | 'cancelled'> {
  if (!isNative()) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return 'downloaded';
  }
  const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
  const { Share } = await import('@capacitor/share');
  const res = await Filesystem.writeFile({ path: name, data: content, directory: Directory.Cache, encoding: Encoding.UTF8 });
  try {
    await Share.share({ title: name, files: [res.uri], dialogTitle: 'Dosyayı kaydet veya gönder' });
    return 'shared';
  } catch {
    // Kullanıcı paylaşım ekranını kapattı.
    return 'cancelled';
  }
}

/** Android geri tuşu: önce açık sayfayı kapatır, sonra Özet'e döner, en son uygulamayı arka plana alır. */
export async function setupBackButton(handlers: { isLocked: () => boolean; hasSheet: () => boolean; closeSheet: () => void; isHome: () => boolean; goHome: () => void }) {
  if (!isNative()) return;
  const { App } = await import('@capacitor/app');
  App.addListener('backButton', () => {
    // Kilit ekranındayken alttaki uygulamada gezinme yapılmaz; geri tuşu uygulamayı arka plana alır.
    if (handlers.isLocked()) App.minimizeApp();
    else if (handlers.hasSheet()) handlers.closeSheet();
    else if (!handlers.isHome()) handlers.goHome();
    else App.minimizeApp();
  });
}

/** Bir resmi (PNG) paylaşır ya da indirir. */
export async function shareImage(name: string, blob: Blob): Promise<'shared' | 'downloaded' | 'cancelled'> {
  if (isNative()) {
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    const { Share } = await import('@capacitor/share');
    const b64 = await new Promise<string>((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(String(r.result).split(',')[1] ?? '');
      r.onerror = () => rej(r.error);
      r.readAsDataURL(blob);
    });
    const f = await Filesystem.writeFile({ path: name, data: b64, directory: Directory.Cache });
    try {
      await Share.share({ title: name, files: [f.uri] });
      return 'shared';
    } catch {
      return 'cancelled';
    }
  }
  const file = new File([blob], name, { type: 'image/png' });
  const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
  if (nav.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: name });
      return 'shared';
    } catch {
      return 'cancelled';
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return 'downloaded';
}
