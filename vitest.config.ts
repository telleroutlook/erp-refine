import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 15000,
    include: ['tests/**/*.test.ts'],
    coverage: {
      reporter: ['text', 'html'],
      include: ['src/**/*.ts'],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
