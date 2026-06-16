import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  // CRITICAL: Forces Vite to look inside the subfolder for index.html
  root: __dirname, 
  
  plugins: [react()],
  server: {
    host: '0.0.0.0',      // Exposes Vite out of the nested dashboard container 
    port: 5173,           // Anchors to port 5173
    strictPort: true,     
    allowedHosts: 'all',  // Overrides security blocks for the .github.dev subdomains
    hmr: {
      clientPort: 443,    // Proxies WebSockets safely over secure HTTPS
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
