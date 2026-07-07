import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_API_PROXY || env.VITE_API_URL || 'http://187.124.23.65:4000'

  return {
    plugins: [react()],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('@zxing')) return 'vendor-zxing'
            if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) {
              return 'vendor-react'
            }
            if (id.includes('node_modules/react-router')) {
              return 'vendor-router'
            }
            if (id.includes('node_modules/axios')) {
              return 'vendor-axios'
            }
          },
        },
      },
    },
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
