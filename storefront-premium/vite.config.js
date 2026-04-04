import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_API_PROXY || env.VITE_API_URL || 'http://187.124.23.65:4000'

  return {
    plugins: [react()],
    server: {
      port: 4002,
      host: true,
      proxy: {
        '/api': { target: apiTarget, changeOrigin: true },
        '/uploads': { target: apiTarget, changeOrigin: true }
      }
    },
    preview: { port: 4002, host: true }
  }
})
