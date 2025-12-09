import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Load environment variables
const API_URL = process.env.VITE_BACKEND_URL || 'https://driftwear-backend.onrender.com'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: API_URL,
        changeOrigin: true,
        secure: false,
      }
    },
    cors: true
  },
  build: {
    outDir: 'dist',
    sourcemap: false, // Disable sourcemaps in production
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          fabric: ['fabric']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['fabric']
  },
  // CRITICAL FOR SPA ROUTING
  base: '/'
})
