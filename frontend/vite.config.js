import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5176,
    host: '0.0.0.0', // Accessible from any device on network
    strictPort: true, // Force port 5176, fail if busy
    cors: true, // Enable CORS for cross-origin requests
    open: false, // Don't auto-open browser (for universal access)
  },
  preview: {
    port: 5176,
    host: '0.0.0.0',
    strictPort: true,
    cors: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
