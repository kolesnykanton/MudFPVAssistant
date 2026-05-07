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
      // 'prompt' lets us show the user a "New version available — Reload" UI
      // (see useRegisterSW in src/main.tsx). 'autoUpdate' would silently reload
      // and lose any in-progress form state.
      registerType: 'prompt',
      includeAssets: ['img/*.png', 'img/*.svg', 'favicon.svg'],
      manifest: {
        id: '/MudFPVAssistant/',
        name: 'MudFPV Assistant',
        short_name: 'MudFPV',
        description: 'FPV drone flight log, saved-spot map, and OSD/utilities companion.',
        start_url: './',
        scope: './',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#03173d',
        lang: 'en',
        dir: 'ltr',
        categories: ['utilities', 'navigation', 'sports'],
        icons: [
          { src: 'img/iconfpvAss-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'img/iconfpvAss-512.png', sizes: '512x512', type: 'image/png' },
          // Reuse the 512 PNG as a maskable icon. A dedicated maskable variant
          // with proper safe-zone padding would be ideal but is non-blocking.
          { src: 'img/iconfpvAss-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          { name: 'New flight', url: '/MudFPVAssistant/flight-info' },
          { name: 'Flight spots', url: '/MudFPVAssistant/map-spot-save' },
          { name: 'Settings', url: '/MudFPVAssistant/settings' },
        ],
      },
      workbox: {
        navigateFallback: 'index.html',
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,woff2}'],
        runtimeCaching: [
          {
            // OSM Standard tiles
            urlPattern: /^https:\/\/[a-z]\.tile\.openstreetmap\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'tiles-osm',
              expiration: { maxEntries: 400, maxAgeSeconds: 14 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Esri World Imagery satellite
            urlPattern: /^https:\/\/server\.arcgisonline\.com\/ArcGIS\/rest\/services\/World_Imagery\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'tiles-esri',
              expiration: { maxEntries: 400, maxAgeSeconds: 14 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // CartoDB Light/Dark
            urlPattern: /^https:\/\/[a-z]\.basemaps\.cartocdn\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'tiles-cartodb',
              expiration: { maxEntries: 400, maxAgeSeconds: 14 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // OpenWeatherMap overlay tiles (wind, clouds, precipitation)
            urlPattern: /^https:\/\/tile\.openweathermap\.org\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'tiles-owm',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // RainViewer radar tiles + index JSON
            urlPattern: /^https:\/\/(api|tilecache)\.rainviewer\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'tiles-rainviewer',
              expiration: { maxEntries: 200, maxAgeSeconds: 30 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // OpenWeather current-conditions JSON (Home page weather widget)
            urlPattern: /^https:\/\/api\.openweathermap\.org\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-owm',
              expiration: { maxEntries: 50, maxAgeSeconds: 30 * 60 },
              networkTimeoutSeconds: 5,
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Weather widget icon PNGs
            urlPattern: /^https:\/\/openweathermap\.org\/img\/wn\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'owm-icons',
              expiration: { maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
})
