/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  resolve: {
    alias: {
      // '@objectql/core': resolve(__dirname, '../../../packages/foundation/core/src/index.ts'),
      // '@objectql/driver-memory': resolve(__dirname, '../../../packages/drivers/memory/src/index.ts'),
      // '@objectql/types': resolve(__dirname, '../../../packages/foundation/types/src/index.ts'),
      // '@objectstack/runtime': resolve(__dirname, '../../../packages/objectstack/runtime/src/index.ts'),
      // '@objectstack/spec': resolve(__dirname, '../../../packages/objectstack/spec/src/index.ts')
    }
  },
  optimizeDeps: {
    include: [
      '@objectql/types',
      '@objectstack/objectql',
      '@objectql/driver-memory'
    ]
  },
  build: {
    commonjsOptions: {
      include: [/packages/, /node_modules/]
    },
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
