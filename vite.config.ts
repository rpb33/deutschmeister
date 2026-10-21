import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
const base = process.env.BASE_PATH || '/deutschmeister/';
export default defineConfig({
  base,
  plugins: [
    react(),
    tailwind(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: 'auto',
      includeAssets: ['icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'DeutschMeister',
        short_name: 'Deutsch',
        description: 'A little German, every day. Offline vocabulary and grammar practice.',
        id: base,
        start_url: base,
        scope: base,
        display: 'standalone',
        background_color: '#f7f8f5',
        theme_color: '#25634b',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,webmanifest}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  test: { include: ['tests/**/*.test.ts'], setupFiles: ['tests/setup.ts'] },
});
