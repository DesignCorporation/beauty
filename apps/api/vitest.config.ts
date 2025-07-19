import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
    teardownTimeout: 30000,
    include: ['tests/**/*.test.ts'],
    exclude: ['tests/setup.ts', 'tests/helpers/**'],
    reporter: ['verbose', 'junit'],
    outputFile: {
      junit: './test-results.xml'
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'tests/**',
        'src/types/**',
        '**/*.d.ts',
        'dist/**'
      ]
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@tests': resolve(__dirname, './tests')
    }
  }
});
