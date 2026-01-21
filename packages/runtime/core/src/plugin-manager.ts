/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { BasePlugin } from '@objectql/types';

/**
 * Error thrown when plugin operations fail
 */
export class PluginError extends Error {
    constructor(
        public code: 'DUPLICATE_PLUGIN' | 'MISSING_DEPENDENCY' | 'CIRCULAR_DEPENDENCY' | 'SETUP_FAILED',
        message: string,
        public pluginName?: string
    ) {
        super(message);
        this.name = 'PluginError';
    }
}

/**
 * PluginManager handles plugin registration, dependency resolution, and lifecycle
 */
export class PluginManager {
    private plugins: Map<string, BasePlugin> = new Map();
    private setupOrder: string[] = [];
    private isBooted = false;

    /**
     * Register a plugin
     * @param plugin Plugin to register
     * @throws {PluginError} If plugin name is duplicated
     */
    register(plugin: BasePlugin): void {
        const name = plugin.metadata.name;
        
        if (this.plugins.has(name)) {
            throw new PluginError(
                'DUPLICATE_PLUGIN',
                `Plugin "${name}" is already registered`,
                name
            );
        }

        this.plugins.set(name, plugin);
        this.setupOrder = []; // Invalidate cached order
    }

    /**
     * Resolve plugin dependencies using topological sort
     * @returns Ordered list of plugin names (dependencies first)
     * @throws {PluginError} If there are missing dependencies or circular dependencies
     */
    resolveDependencies(): string[] {
        if (this.setupOrder.length > 0) {
            return this.setupOrder;
        }

        const visited = new Set<string>();
        const visiting = new Set<string>();
        const order: string[] = [];

        const visit = (pluginName: string, path: string[] = []): void => {
            // Check if already processed
            if (visited.has(pluginName)) {
                return;
            }

            // Check for circular dependency
            if (visiting.has(pluginName)) {
                const cycle = [...path, pluginName].join(' -> ');
                throw new PluginError(
                    'CIRCULAR_DEPENDENCY',
                    `Circular dependency detected: ${cycle}`,
                    pluginName
                );
            }

            const plugin = this.plugins.get(pluginName);
            if (!plugin) {
                throw new PluginError(
                    'MISSING_DEPENDENCY',
                    `Plugin "${pluginName}" is required but not registered`,
                    pluginName
                );
            }

            // Mark as being visited
            visiting.add(pluginName);

            // Visit dependencies first
            const dependencies = plugin.metadata.dependencies || [];
            for (const dep of dependencies) {
                visit(dep, [...path, pluginName]);
            }

            // Mark as visited and add to order
            visiting.delete(pluginName);
            visited.add(pluginName);
            order.push(pluginName);
        };

        // Visit all plugins
        for (const pluginName of this.plugins.keys()) {
            visit(pluginName);
        }

        this.setupOrder = order;
        return order;
    }

    /**
     * Boot all plugins in dependency order
     * @param runtime Runtime instance to pass to setup hooks
     * @throws {PluginError} If setup fails for any plugin
     */
    async boot(runtime: any): Promise<void> {
        if (this.isBooted) {
            return;
        }

        const order = this.resolveDependencies();

        for (const pluginName of order) {
            const plugin = this.plugins.get(pluginName);
            if (!plugin) {
                continue; // Should never happen after resolveDependencies
            }

            if (plugin.setup) {
                try {
                    await plugin.setup(runtime);
                } catch (error) {
                    throw new PluginError(
                        'SETUP_FAILED',
                        `Failed to setup plugin "${pluginName}": ${error instanceof Error ? error.message : String(error)}`,
                        pluginName
                    );
                }
            }
        }

        this.isBooted = true;
    }

    /**
     * Shutdown all plugins in reverse dependency order
     */
    async shutdown(): Promise<void> {
        if (!this.isBooted) {
            return;
        }

        const order = [...this.setupOrder].reverse();

        for (const pluginName of order) {
            const plugin = this.plugins.get(pluginName);
            if (plugin?.teardown) {
                try {
                    await plugin.teardown();
                } catch (error) {
                    // Log but don't throw during shutdown
                    console.error(`Failed to teardown plugin "${pluginName}":`, error);
                }
            }
        }

        this.isBooted = false;
    }

    /**
     * Get a registered plugin by name
     */
    get(name: string): BasePlugin | undefined {
        return this.plugins.get(name);
    }

    /**
     * Get all registered plugins
     */
    getAll(): BasePlugin[] {
        return Array.from(this.plugins.values());
    }

    /**
     * Get plugins by type
     */
    getByType(type: string): BasePlugin[] {
        return this.getAll().filter(p => p.metadata.type === type);
    }

    /**
     * Check if booted
     */
    isInitialized(): boolean {
        return this.isBooted;
    }
}
