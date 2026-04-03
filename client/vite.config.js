import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { createBuildDefines } from '../scripts/build-meta.mjs'

export default defineConfig({
  plugins: [vue()],
  base: '/',
  define: createBuildDefines(),
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
})
