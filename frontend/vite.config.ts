import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  base: '/',
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-tabs', '@radix-ui/react-progress', '@radix-ui/react-toast', '@radix-ui/react-tooltip', '@radix-ui/react-select', '@radix-ui/react-slider', '@radix-ui/react-switch', '@radix-ui/react-accordion'],
          charts: ['recharts', 'react-plotly.js', 'plotly.js'],
          query: ['@tanstack/react-query'],
        },
      },
    },
  },
})
