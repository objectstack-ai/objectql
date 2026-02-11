/**
 * @objectql/plugin-optimizations
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { RuntimePlugin, RuntimeContext } from '@objectql/types';
import { ConsoleLogger } from '@objectql/types';
import type { Logger } from '@objectql/types';
import { OptimizedMetadataRegistry } from './OptimizedMetadataRegistry';
import { GlobalConnectionPool } from './GlobalConnectionPool';
import { QueryCompiler } from './QueryCompiler';

/**
 * Configuration for the Optimizations Plugin
 */
export interface OptimizationsPluginConfig {
  /**
   * Enable optimized metadata registry
   * @default true
   */
  enableOptimizedRegistry?: boolean;

  /**
   * Enable global connection pooling
   * @default true
   */
  enableConnectionPool?: boolean;

  /**
   * Connection pool limits
   */
  poolLimits?: { total?: number; perDriver?: number };

  /**
   * Enable query compiler with LRU cache
   * @default true
   */
  enableQueryCompiler?: boolean;

  /**
   * Query compiler cache size
   * @default 1000
   */
  queryCompilerCacheSize?: number;
}

/**
 * Optimizations Plugin
 * 
 * Provides performance optimizations for the ObjectQL kernel:
 * - Optimized metadata registry with O(k) package uninstall
 * - Global connection pooling across drivers
 * - Query compiler with LRU cache
 */
export class OptimizationsPlugin implements RuntimePlugin {
  name = '@objectql/plugin-optimizations';
  version = '4.2.0';
  private logger: Logger;
  private config: Required<OptimizationsPluginConfig>;

  constructor(config: OptimizationsPluginConfig = {}) {
    this.config = {
      enableOptimizedRegistry: true,
      enableConnectionPool: true,
      poolLimits: { total: 50, perDriver: 20 },
      enableQueryCompiler: true,
      queryCompilerCacheSize: 1000,
      ...config,
    };
    this.logger = new ConsoleLogger({ name: this.name, level: 'info' });
  }

  async install(ctx: RuntimeContext): Promise<void> {
    this.logger.info('Installing optimizations plugin...');

    const kernel = ctx.engine as any;

    // 1. Wrap metadata registry with optimized version
    if (this.config.enableOptimizedRegistry && kernel.metadata) {
      const existingRegistry = kernel.metadata;
      const optimized = new OptimizedMetadataRegistry();

      // Copy existing items to optimized registry
      if (typeof existingRegistry.getTypes === 'function') {
        for (const type of existingRegistry.getTypes()) {
          const items = existingRegistry.list(type);
          for (const item of items) {
            optimized.register(type, item);
          }
        }
      }

      // Replace metadata on kernel if replaceService is available
      if (typeof (ctx as any).replaceService === 'function') {
        (ctx as any).replaceService('metadata', optimized);
      }
      kernel.optimizedMetadata = optimized;
      this.logger.debug('Optimized metadata registry installed');
    }

    // 2. Initialize connection pooling
    if (this.config.enableConnectionPool) {
      const connectionPool = new GlobalConnectionPool(this.config.poolLimits as any);
      kernel.connectionPool = connectionPool;
      this.logger.debug('Global connection pool installed');
    }

    // 3. Initialize query compiler
    if (this.config.enableQueryCompiler) {
      const queryCompiler = new QueryCompiler(this.config.queryCompilerCacheSize);
      kernel.queryCompiler = queryCompiler;
      this.logger.debug('Query compiler installed');
    }

    this.logger.info('Optimizations plugin installed successfully');
  }

  async onStart(_ctx: RuntimeContext): Promise<void> {
    this.logger.debug('Optimizations plugin started');
  }
}
