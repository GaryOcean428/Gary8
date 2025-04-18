import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Run tests in Node environment
    environment: 'node',
    // Setup polyfills before test files run
    setupFiles: './src/setupTests.ts',
    // Include all .test.ts and .test.tsx files, except APIClient & RetryHandler
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['src/tests/utils/RetryHandler.test.ts'],
    // Note: All test suites are now enabled
    // Exclude patterns can be configured here if needed
  }
});