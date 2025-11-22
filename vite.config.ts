import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@core': resolve(__dirname, './src/core'),
      '@scenes': resolve(__dirname, './src/scenes'),
      '@prefabs': resolve(__dirname, './src/prefabs'),
      '@theme': resolve(__dirname, './src/theme'),
      '@ui': resolve(__dirname, './src/ui')
    }
  },
  server: {
    port: 5173,
    open: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true
  }
})
