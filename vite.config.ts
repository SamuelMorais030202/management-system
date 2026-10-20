import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 7301,
    // Permite acesso via túnel (Cloudflare / ngrok) sem listar cada hostname
    allowedHosts: true,
  },
  preview: {
    port: 7301,
  },
})

