/**
 * @objectql/plugin-query
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { RuntimePlugin, RuntimeContext } from '@objectql/types';
import { ConsoleLogger } from '@objectql/types';
import type { Logger, Driver } from '@objectql/types';
import { QueryService } from './query-service';
import { QueryAnalyzer } from './query-analyzer';

/**
 * Configuration for the Query Plugin
 */
export interface QueryPluginConfig {
  /**
   * Datasources for query service
   */
  datasources?: Record<string, Driver>;

  /**
   * Enable query analyzer
   * @default true
   */
  enableAnalyzer?: boolean;
}

/**
 * Query Plugin
 * 
 * Provides query execution and analysis capabilities for the ObjectQL kernel.
 * Registers QueryService and QueryAnalyzer on the kernel for consumer access.
 */
export class QueryPlugin implements RuntimePlugin {
  name = '@objectql/plugin-query';
  version = '4.2.0';
  private logger: Logger;

  constructor(private config: QueryPluginConfig = {}) {
    this.config = {
      enableAnalyzer: true,
      ...config,
    };
    this.logger = new ConsoleLogger({ name: this.name, level: 'info' });
  }

  async install(ctx: RuntimeContext): Promise<void> {
    this.logger.info('Installing query plugin...');

    const kernel = ctx.engine as any;

    // Get datasources - either from config or from kernel drivers
    let datasources = this.config.datasources;
    if (!datasources) {
      const drivers = kernel.getAllDrivers?.();
      if (drivers && drivers.length > 0) {
        datasources = {};
        drivers.forEach((driver: any, index: number) => {
          const driverName = driver.name || (index === 0 ? 'default' : `driver_${index + 1}`);
          datasources![driverName] = driver;
        });
      }
    }

    if (!datasources) {
      this.logger.warn('No datasources available. QueryService will not be registered.');
      return;
    }

    // Create QueryService
    const queryService = new QueryService(datasources, kernel.metadata);
    kernel.queryService = queryService;
    this.logger.debug('QueryService registered');

    // Create QueryAnalyzer if enabled
    if (this.config.enableAnalyzer !== false) {
      const queryAnalyzer = new QueryAnalyzer(queryService, kernel.metadata);
      kernel.queryAnalyzer = queryAnalyzer;
      this.logger.debug('QueryAnalyzer registered');
    }

    this.logger.info('Query plugin installed successfully');
  }

  async onStart(_ctx: RuntimeContext): Promise<void> {
    this.logger.debug('Query plugin started');
  }
}
