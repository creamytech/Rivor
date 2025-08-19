/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    css: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@rivor/db': path.resolve(__dirname, '../../packages/db/src'),
      '@rivor/crypto': path.resolve(__dirname, '../../packages/crypto/src'),
    },
  },
  esbuild: {
    target: 'esnext'
  }
})
