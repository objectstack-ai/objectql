/**
 * ObjectQL Plugin Analytics — Plugin Entry Point
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { RuntimePlugin, RuntimeContext, Logger } from '@objectql/types';
import { ConsoleLogger } from '@objectql/types';
import type { AnalyticsPluginConfig } from './types';
import { CubeRegistry } from './cube-registry';
import { AnalyticsService } from './analytics-service';

/**
 * AnalyticsPlugin
 *
 * Kernel plugin that installs the AnalyticsService.
 * Registers the 'analytics' service on the kernel for REST/API discovery.
 *
 * @example
 * ```typescript
 * import { AnalyticsPlugin } from '@objectql/plugin-analytics';
 *
 * const kernel = new ObjectStackKernel([
 *   new AnalyticsPlugin({
 *     cubes: [myCubeDefinition],
 *     autoDiscover: true,
 *   }),
 * ]);
 * ```
 */
export class AnalyticsPlugin implements RuntimePlugin {
    name = '@objectql/plugin-analytics';
    version = '4.2.2';
    private logger: Logger;
    private service: AnalyticsService | null = null;

    constructor(private config: AnalyticsPluginConfig = {}) {
        this.logger = new ConsoleLogger({ name: this.name, level: 'info' });
    }

    async install(ctx: RuntimeContext): Promise<void> {
        this.logger.info('Installing analytics plugin...');

        const kernel = ctx.engine as any;

        // 1. Resolve datasources
        let datasources = this.config.datasources as Record<string, unknown> | undefined;
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

        if (!datasources || Object.keys(datasources).length === 0) {
            this.logger.warn('No datasources available. AnalyticsService will not be registered.');
            return;
        }

        // 2. Build CubeRegistry
        const registry = new CubeRegistry();

        // Register manifest cubes
        if (this.config.cubes && this.config.cubes.length > 0) {
            registry.registerAll(this.config.cubes);
            this.logger.debug(`Registered ${this.config.cubes.length} manifest cube(s)`);
        }

        // Auto-discover cubes from metadata
        if (this.config.autoDiscover !== false && kernel.metadata) {
            registry.discoverFromMetadata(kernel.metadata);
            this.logger.debug(`Auto-discovered cubes from metadata (total: ${registry.list().length})`);
        }

        // 3. Create AnalyticsService
        this.service = new AnalyticsService(registry, datasources);
        kernel.analyticsService = this.service;
        this.logger.debug('AnalyticsService registered on kernel');

        // 4. Register as named service for kernel discovery
        if (typeof (ctx as any).registerService === 'function') {
            (ctx as any).registerService('analytics', this.service);
            this.logger.debug("Registered 'analytics' service alias");
        }

        this.logger.info('Analytics plugin installed successfully');
    }

    async onStart(_ctx: RuntimeContext): Promise<void> {
        // Analytics service is stateless — nothing to start
    }

    async onStop(_ctx: RuntimeContext): Promise<void> {
        this.service = null;
    }

    // --- Adapter for @objectstack/core compatibility ---
    init = async (pluginCtx: any): Promise<void> => {
        const actualKernel = typeof pluginCtx.getKernel === 'function'
            ? pluginCtx.getKernel()
            : pluginCtx;
        const ctx: any = {
            engine: actualKernel,
            getKernel: () => actualKernel,
            registerService: typeof pluginCtx.registerService === 'function'
                ? pluginCtx.registerService.bind(pluginCtx)
                : undefined,
        };
        await this.install(ctx);
    };
}
