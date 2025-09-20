import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    host: '0.0.0.0', // Accessible from any device on network
    strictPort: false, // Allow port fallback if 5174 is busy
    cors: true, // Enable CORS for cross-origin requests
    open: false, // Don't auto-open browser (for universal access)
  },
  preview: {
    port: 5174,
    host: '0.0.0.0',
    strictPort: false,
    cors: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  define: {
    // Make API URL dynamic based on current host
    __API_URL__: 'window.location.protocol + "//" + window.location.hostname + ":8000"'
  }
})
