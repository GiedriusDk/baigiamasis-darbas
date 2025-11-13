import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/catalog': { target: 'http://localhost:8080', changeOrigin: true },
      '/auth':    { target: 'http://localhost:8080', changeOrigin: true },
      '/api/profiles':    { target: 'http://localhost:8080', changeOrigin: true },
      '/profiles':    { target: 'http://localhost:8080', changeOrigin: true },
      '/api/planner':    { target: 'http://localhost:8080', changeOrigin: true },
      '/api/payments':    { target: 'http://localhost:8080', changeOrigin: true },
      '/api/coach-plans':    { target: 'http://localhost:8080', changeOrigin: true },
      '/api/chat':    { target: 'http://localhost:8080', changeOrigin: true },
      '/api/progress':    { target: 'http://localhost:8080', changeOrigin: true },
      
      
      
    },
  },
})