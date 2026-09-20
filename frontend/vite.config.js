import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// In production (Netlify), /api/* is rewritten to /.netlify/functions/* by netlify.toml.
// In dev, proxy to `netlify dev` which runs functions on port 8888.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8888',
        changeOrigin: true,
        // /api/scan  →  /.netlify/functions/scan
        rewrite: (path) => path.replace(/^\/api\/(.+)/, '/.netlify/functions/$1')
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
})
