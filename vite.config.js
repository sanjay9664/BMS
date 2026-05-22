import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://backend-7vd2.vercel.app',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'wss://backend-7vd2.vercel.app',
        ws: true,
        changeOrigin: true
      },
      '/sochiot-auth': {
        target: 'https://app.sochiot.com/api/auth-engine',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/sochiot-auth/, '')
      },
      '/sochiot-config': {
        target: 'https://app.sochiot.com/api/config-engine',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/sochiot-config/, '')
      }
    }
  }
})
