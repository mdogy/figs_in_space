import { defineConfig } from 'vitest/config'
import { resolve, join } from 'path'
import { tmpdir } from 'os'

export default defineConfig({
  // Store Vite cache outside the Dropbox mount to avoid WSL rename permission issues
  cacheDir: join(tmpdir(), 'figs-in-space-vite-cache'),
  resolve: {
    alias: {
      '@core': resolve(__dirname, './src/core'),
      '@scenes': resolve(__dirname, './src/scenes'),
      '@prefabs': resolve(__dirname, './src/prefabs'),
      '@theme': resolve(__dirname, './src/theme'),
      '@ui': resolve(__dirname, './src/ui'),
      phaser3spectorjs: resolve(__dirname, './tests/mocks/phaser3spectorjs.ts')
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
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    clearMocks: true
  }
})
