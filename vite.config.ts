import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Göreli `base`, derlenen uygulamanın herhangi bir alt dizinden (ör. GitHub Pages) çalışmasını sağlar.
export default defineConfig({
  base: './',
  plugins: [react()],
  test: {
    include: ['src/**/*.test.ts'],
  },
});
