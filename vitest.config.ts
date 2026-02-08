import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/expected/**', 
        '**/__fixtures__/**',
        '**/*.d.ts'
      ]
    },
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    setupFiles: [path.resolve(__dirname, './scripts/vitest-setup.ts')],
    alias: {
      '@objectql/types': path.resolve(__dirname, './packages/foundation/types/src'),
      '@objectql/core': path.resolve(__dirname, './packages/foundation/core/src'),
      '@objectql/plugin-validator': path.resolve(__dirname, './packages/foundation/plugin-validator/src'),
      '@objectql/plugin-formula': path.resolve(__dirname, './packages/foundation/plugin-formula/src'),
      '@objectql/plugin-security': path.resolve(__dirname, './packages/foundation/plugin-security/src'),
      '@objectql/plugin-sync': path.resolve(__dirname, './packages/foundation/plugin-sync/src'),
      '@objectql/edge-adapter': path.resolve(__dirname, './packages/foundation/edge-adapter/src'),
      '@objectql/protocol-graphql': path.resolve(__dirname, './packages/protocols/graphql/src'),
      '@objectql/protocol-odata-v4': path.resolve(__dirname, './packages/protocols/odata-v4/src'),
      '@objectql/protocol-json-rpc': path.resolve(__dirname, './packages/protocols/json-rpc/src'),
      '@objectql/protocol-sync': path.resolve(__dirname, './packages/protocols/sync/src'),
      // Drivers
      '@objectql/driver-memory': path.resolve(__dirname, './packages/drivers/memory/src'),
      '@objectql/driver-mongo': path.resolve(__dirname, './packages/drivers/mongo/src'),
      '@objectql/driver-sql': path.resolve(__dirname, './packages/drivers/sql/src'),
      // Mocks
      '@objectstack/core': path.resolve(__dirname, './packages/foundation/core/test/__mocks__/@objectstack/core.ts'),
      '@objectstack/objectql': path.resolve(__dirname, './packages/foundation/core/test/__mocks__/@objectstack/objectql.ts'),
      '@objectstack/runtime': path.resolve(__dirname, './packages/foundation/core/test/__mocks__/@objectstack/runtime.ts'),
      // Tools
      '@objectql/driver-tck': path.resolve(__dirname, './packages/tools/driver-tck/src'),
      '@objectql/protocol-tck': path.resolve(__dirname, './packages/tools/protocol-tck/src'),
    }
  },
});
