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
export async function setupBackButton(handlers: { hasSheet: () => boolean; closeSheet: () => void; isHome: () => boolean; goHome: () => void }) {
  if (!isNative()) return;
  const { App } = await import('@capacitor/app');
  App.addListener('backButton', () => {
    if (handlers.hasSheet()) handlers.closeSheet();
    else if (!handlers.isHome()) handlers.goHome();
    else App.minimizeApp();
  });
}
