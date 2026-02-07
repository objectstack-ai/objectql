import { defineConfig, mergeConfig } from 'vitest/config';
import rootConfig from '../../../vitest.config';

/**
 * MongoDB driver tests require sequential file execution because
 * multiple MongoMemoryReplSet instances cannot start in parallel
 * (port conflicts / resource contention causes hangs).
 */
export default mergeConfig(rootConfig, defineConfig({
  test: {
    fileParallelism: false,
    testTimeout: 30000,
    hookTimeout: 120000,
  }
}));
