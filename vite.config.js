import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'CalledIt',
        short_name: 'CalledIt',
        description: 'Prediction pools with friends — World Cup 2026 edition',
        theme_color: '#065f46',
        background_color: '#f0fdf4',
        display: 'standalone',
        start_url: './',
        scope: './',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/raw\.githubusercontent\.com\/openfootball\/.*/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'results-cache',
              expiration: { maxEntries: 4, maxAgeSeconds: 60 * 60 * 24 }
            }
          }
        ]
      }
    })
  ]
});
