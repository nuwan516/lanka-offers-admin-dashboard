import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// Kept apart from vite.config.ts so the dev proxy to the admin API can never
// apply to tests: tests answer every /api request from fixtures (tests/setup.ts).
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    css: false,
    restoreMocks: true,
    testTimeout: 15_000,
  },
})
