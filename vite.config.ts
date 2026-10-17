import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// Served from https://<user>.github.io/pregnancy-tracker/ (GitHub Pages project site)
const BASE = '/pregnancy-tracker/';

export default defineConfig({
  base: BASE,
  build: { outDir: 'dist', chunkSizeWarningLimit: 600 },
  plugins: [
    // Installable app + offline app shell. Data stays OUT of the service worker: Supabase requests are never cached
    // here — the data adapter keeps its own IndexedDB copy and outbox.
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script-defer',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Pregnancy Tracker', short_name: 'Pregnancy', lang: 'en-ZA',
        description: 'Private pregnancy tracker for two, synced live.',
        theme_color: '#00A693', background_color: '#eeeae3', display: 'standalone', orientation: 'portrait',
        start_url: BASE, scope: BASE,
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,webmanifest}'],
        navigateFallback: BASE + 'index.html',
        cleanupOutdatedCaches: true, clientsClaim: true, skipWaiting: true,
        // the 14 Century Gothic files are ~4.6 MB in total: cache each one the first time it's used instead of precaching them all
        runtimeCaching: [{ urlPattern: /\/fonts\/.*\.ttf$/, handler: 'CacheFirst', options: { cacheName: 'fonts', expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 }, cacheableResponse: { statuses: [0, 200] } } }],
      },
      devOptions: { enabled: false },
    }),
  ],
  server: { port: 5173, strictPort: true },
});
