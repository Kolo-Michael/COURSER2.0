import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // Bind all interfaces so localhost (IPv4/IPv6) and 127.0.0.1 all work.
    // Vite's default host ('localhost') can bind to ::1 only on some Node
    // versions, which breaks the /api proxy for browsers hitting 127.0.0.1.
    host: true,
    proxy: {
      // Keep API calls same-origin in dev so the backend's cookies
      // (courser_session / access_token / refresh_token) are stored for
      // localhost:5173 and readable by getSession(). Without this, the
      // cookie is scoped to 127.0.0.1 and login appears to "do nothing"
      // because the redirect bounces straight back to /auth.
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})
