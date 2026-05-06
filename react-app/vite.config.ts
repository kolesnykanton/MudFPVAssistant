import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/MudFPVAssistant/',
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('/@firebase/') || id.includes('/firebase/')) return 'vendor-firebase';
          if (id.includes('/leaflet') || id.includes('/react-leaflet')) return 'vendor-leaflet';
          if (id.includes('/@mantine/')) return 'vendor-mantine';
          if (id.includes('/recharts/')) return 'vendor-charts';
          if (id.includes('/react') || id.includes('/scheduler/')) return 'vendor-react';
        },
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['img/*.png', 'img/*.svg', 'animations/*.json'],
      manifest: {
        name: 'MudFPVAssistant',
        short_name: 'MudFPVAssistant',
        start_url: './',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#03173d',
        icons: [
          { src: 'img/iconfpvAss-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'img/iconfpvAss-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.tile\.openstreetmap\.org\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'map-tiles', expiration: { maxEntries: 200, maxAgeSeconds: 7 * 24 * 60 * 60 } },
          },
        ],
      },
    }),
  ],
})
