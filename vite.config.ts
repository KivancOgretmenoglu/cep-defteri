import { defineConfig, type Plugin } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';

// Geri bildirim e-postasındaki sürüm (tarayıcıda; Android'de App.getInfo() kullanılır).
const pkgVersion = (JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string }).version;

/**
 * Çevrimdışı çalışma: derlemenin ürettiği tüm dosyaların (tembel yüklenen ekran parçaları dahil) listesini
 * `precache.json` olarak yazar. public/sw.js kurulumda bu listeyi önbelleğe alır; böylece hiç açılmamış
 * bir ekran da çevrimdışıyken yüklenir.
 */
function precacheManifest(): Plugin {
  return {
    name: 'cep-precache-manifest',
    apply: 'build',
    generateBundle(_opts, bundle) {
      const files = Object.keys(bundle)
        .filter((f) => !f.endsWith('.map') && f !== 'precache.json')
        .sort();
      this.emitFile({ type: 'asset', fileName: 'precache.json', source: JSON.stringify({ version: pkgVersion, files }) });
    },
  };
}

// Göreli `base`, derlenen uygulamanın herhangi bir alt dizinden (ör. GitHub Pages) çalışmasını sağlar.
export default defineConfig({
  base: './',
  plugins: [react(), precacheManifest()],
  define: { __APP_VERSION__: JSON.stringify(pkgVersion) },
  build: {
    rolldownOptions: {
      output: {
        // React ayrı parçada: uygulama kodu değişse de (yeni sürüm) tarayıcı önbelleğinde kalır.
        codeSplitting: {
          groups: [{ name: 'react', test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/ }],
        },
      },
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
});
