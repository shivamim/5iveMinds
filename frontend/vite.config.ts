import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Prevents Render from failing on large shadcn/ui chunk warnings
    chunkSizeWarningLimit: 1000, 
  },
  server: {
    host: true,
    port: 5173,
  }
})
