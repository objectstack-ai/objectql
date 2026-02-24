/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { RuntimePlugin, RuntimeContext } from '@objectql/types';
import { ObjectQLError } from '@objectql/types';
import { TursoDriver, type TursoDriverConfig } from './turso-driver';
import { createMultiTenantRouter, type MultiTenantConfig, type MultiTenantRouter } from './multi-tenant-router';
import { diffSchema, generateMigration, type ObjectSchema, type SchemaMigration } from './schema-diff';

// ============================================================================
// Plugin Configuration
// ============================================================================

/**
 * Configuration for the TursoDriverPlugin.
 *
 * Supports two modes:
 * 1. **Single-tenant**: Provide `connection` with a direct database URL.
 * 2. **Multi-tenant**: Provide `multiTenant` with a URL template.
 *
 * When multi-tenant is configured, the plugin creates a router that
 * manages per-tenant driver instances with TTL-based caching.
 */
export interface TursoDriverPluginConfig {
    /** Direct single-tenant connection config. */
    connection?: TursoDriverConfig;

    /** Multi-tenant router config. Mutually exclusive with `connection`. */
    multiTenant?: MultiTenantConfig;

    /**
     * Whether to run automatic schema diff & migration on start.
     * Default: false.
     */
    autoMigrate?: boolean;
}

// ============================================================================
// TursoDriverPlugin
// ============================================================================

/**
 * ObjectStack kernel plugin that integrates the Turso/libSQL driver.
 *
 * Provides:
 * - Single-tenant or multi-tenant database connectivity
 * - Automatic schema diff and migration on start (optional)
 * - Graceful shutdown of all connections
 *
 * @example Single-tenant
 * ```typescript
 * const plugin = new TursoDriverPlugin({
 *   connection: {
 *     url: process.env.TURSO_DATABASE_URL!,
 *     authToken: process.env.TURSO_AUTH_TOKEN,
 *   },
 * });
 * ```
 *
 * @example Multi-tenant
 * ```typescript
 * const plugin = new TursoDriverPlugin({
 *   multiTenant: {
 *     urlTemplate: 'libsql://{tenant}-myorg.turso.io',
 *     groupAuthToken: process.env.TURSO_GROUP_TOKEN,
 *   },
 * });
 * ```
 */
export class TursoDriverPlugin implements RuntimePlugin {
    public readonly name = '@objectql/driver-turso';
    public readonly version = '4.2.2';

    private readonly config: TursoDriverPluginConfig;
    private driver: TursoDriver | null = null;
    private router: MultiTenantRouter | null = null;

    constructor(config: TursoDriverPluginConfig) {
        if (!config.connection && !config.multiTenant) {
            throw new ObjectQLError({
                code: 'CONFIG_ERROR',
                message: 'TursoDriverPlugin requires either "connection" or "multiTenant" config.'
            });
        }
        if (config.connection && config.multiTenant) {
            throw new ObjectQLError({
                code: 'CONFIG_ERROR',
                message: 'TursoDriverPlugin: "connection" and "multiTenant" are mutually exclusive.'
            });
        }
        this.config = config;
    }

    // ========================================================================
    // Lifecycle
    // ========================================================================

    async install(_ctx: RuntimeContext): Promise<void> {
        // Nothing to install — driver registration happens in onStart
    }

    async onStart(_ctx: RuntimeContext): Promise<void> {
        if (this.config.connection) {
            this.driver = new TursoDriver(this.config.connection);
            await this.driver.connect();
        }

        if (this.config.multiTenant) {
            this.router = createMultiTenantRouter(this.config.multiTenant);
        }
    }

    async onStop(_ctx: RuntimeContext): Promise<void> {
        if (this.driver) {
            await this.driver.disconnect();
            this.driver = null;
        }
        if (this.router) {
            await this.router.destroyAll();
            this.router = null;
        }
    }

    // ========================================================================
    // Accessors
    // ========================================================================

    /**
     * Get the single-tenant driver instance.
     * Throws if the plugin is configured for multi-tenant mode.
     */
    getDriver(): TursoDriver {
        if (!this.driver) {
            throw new ObjectQLError({
                code: 'DRIVER_ERROR',
                message: 'TursoDriverPlugin: No single-tenant driver available. Did you call onStart()?'
            });
        }
        return this.driver;
    }

    /**
     * Get the multi-tenant router instance.
     * Throws if the plugin is configured for single-tenant mode.
     */
    getRouter(): MultiTenantRouter {
        if (!this.router) {
            throw new ObjectQLError({
                code: 'DRIVER_ERROR',
                message: 'TursoDriverPlugin: No multi-tenant router available. Did you configure multiTenant?'
            });
        }
        return this.router;
    }

    // ========================================================================
    // Schema Diff & Migration
    // ========================================================================

    /**
     * Generate a migration by comparing desired object definitions with
     * the live database schema. Uses the single-tenant driver.
     *
     * @param objects - Desired ObjectQL object definitions
     * @returns Generated migration with up/down SQL
     */
    async generateMigration(objects: readonly ObjectSchema[]): Promise<SchemaMigration> {
        const d = this.getDriver();
        const live = await d.introspectSchema();
        const diff = diffSchema(objects, live);
        return generateMigration(diff);
    }

    /**
     * Apply a generated migration against the single-tenant driver.
     *
     * @param migration - Migration to apply (from `generateMigration`)
     */
    async applyMigration(migration: SchemaMigration): Promise<void> {
        const d = this.getDriver();
        for (const stmt of migration.up) {
            if (stmt.startsWith('--')) continue; // Skip comments
            await d.execute({ sql: stmt, args: [] });
        }
    }
}
