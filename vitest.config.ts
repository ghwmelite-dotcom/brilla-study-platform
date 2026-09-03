import { defineConfig } from 'vitest/config'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}', 'workers/**/*.test.ts'],
    // Canvas/Fabric suites are CPU-heavy. Bounding concurrency prevents
    // resource contention from turning deterministic 5s tests into flakes.
    maxWorkers: 4,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      // Mirror the test include patterns: instrument the modules the suites
      // actually exercise, not build output, scripts, or test scaffolding.
      include: ['src/**/*.{ts,tsx}', 'workers/**/*.ts'],
      exclude: [
        '**/*.test.{ts,tsx}',
        '**/*.d.ts',
        'src/types/**',
        'src/main.tsx',
        'src/vite-env.d.ts',
        'workers/api/tests/**',
      ],
      // Thresholds ratcheted to current reality (measured 2026-08-27, full
      // suite ~5.5min: lines 14.43%, functions 36.10%, branches 61.52%,
      // rounded down to nearest 5). CI runs the suite once with coverage, so
      // coverage cannot silently drop. Raise as suites grow.
      thresholds: {
        lines: 10,
        functions: 35,
        statements: 10,
        branches: 60,
      },
    },
  },
})
