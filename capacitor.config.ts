import type { CapacitorConfig } from '@capacitor/cli';

// Android uygulaması (APK) için yapılandırma. Web derlemesi (dist/) uygulamanın içine gömülür; internet gerekmez.
const config: CapacitorConfig = {
  appId: 'io.github.kivancogretmenoglu.cepdefteri',
  appName: 'Cep Defteri',
  webDir: 'dist',
  android: {
    backgroundColor: '#F4EFE6',
  },
  plugins: {
    // Kenardan kenara görünüm: durum/gezinme çubuğu boşlukları --safe-area-inset-* CSS değişkenleriyle gelir.
    SystemBars: { insetsHandling: 'css', initialViewportFitValueHint: 'cover' },
  },
};

export default config;
