import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: [],
    include: ['src/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@objectstack/core': path.resolve(__dirname, 'test/__mocks__/@objectstack/core.ts'),
    },
  },
});
