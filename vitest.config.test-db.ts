import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    exclude: [
      'node_modules',
      'dist',
      '.next',
      'src/__tests__/lib/services/**/*.test.ts' // Exclude DB tests for now
    ],
    // Increase timeouts for complex tests
    testTimeout: 30000,
    hookTimeout: 30000,
    // Better error handling
    bail: 10, // Stop after 10 failures to prevent overwhelming output
    reporters: ['verbose', 'json'],
    outputFile: {
      json: './test-results.json'
    },
    // Mock external dependencies
    deps: {
      external: ['@clerk/nextjs']
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
