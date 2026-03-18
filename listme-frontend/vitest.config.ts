import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue({ template: { transformAssetUrls: false } })],
  test: {
    environment: 'happy-dom',
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}', 'tests/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['json-summary', 'text'],
      include: ['src/**/*.{ts,vue}'],
      exclude: ['src/main.ts', 'src/router/**', 'src/**/*.d.ts'],
    },
  },
})
