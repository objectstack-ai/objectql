import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  resolve: {
    alias: {
      '@objectql/core': resolve(__dirname, '../../../packages/foundation/core/src/index.ts'),
      '@objectql/driver-localstorage': resolve(__dirname, '../../../packages/drivers/localstorage/src/index.ts'),
      '@objectql/driver-memory': resolve(__dirname, '../../../packages/drivers/memory/src/index.ts'),
      '@objectql/types': resolve(__dirname, '../../../packages/foundation/types/src/index.ts')
    }
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      }
    }
  },
  server: {
    port: 3000,
    open: false
  }
});
