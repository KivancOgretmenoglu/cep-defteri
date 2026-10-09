import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';

// Geri bildirim e-postasındaki sürüm (tarayıcıda; Android'de App.getInfo() kullanılır).
const pkgVersion = (JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string }).version;

// Göreli `base`, derlenen uygulamanın herhangi bir alt dizinden (ör. GitHub Pages) çalışmasını sağlar.
export default defineConfig({
  base: './',
  plugins: [react()],
  define: { __APP_VERSION__: JSON.stringify(pkgVersion) },
  test: {
    include: ['src/**/*.test.ts'],
  },
});
