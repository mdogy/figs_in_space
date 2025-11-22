import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  cacheDir: './.vite-cache',
  resolve: {
    alias: {
      '@core': resolve(__dirname, './src/core'),
      '@scenes': resolve(__dirname, './src/scenes'),
      '@prefabs': resolve(__dirname, './src/prefabs'),
      '@theme': resolve(__dirname, './src/theme'),
      '@ui': resolve(__dirname, './src/ui'),
      phaser3spectorjs: resolve(__dirname, './tests/mocks/phaser3spectorjs.js')
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
  },
  optimizeDeps: {
    force: true
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    clearMocks: true
  }
})
