import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://backend-yhu7-git-master-guptaji30749-6020s-projects.vercel.app',
        changeOrigin: true,
      }
    }
  }
})
