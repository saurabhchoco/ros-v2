import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    react(),
    // Main App PWA (for Super Admin, Brand Owner, Manager)
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'generateSW',
      injectRegister: 'auto',
      manifest: {
        id: '/',
        name: 'R-OS',
        short_name: 'R-OS',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        theme_color: '#4f46e5',
        background_color: '#ffffff',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          }
        ]
      },
      workbox: {
        navigateFallback: 'index.html',
        globPatterns: [
          '**/*.{js,css,html,png,svg,ico,json}'
        ]
      }
    })
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        vendor: resolve(__dirname, 'vendor-index.html')
      }
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})