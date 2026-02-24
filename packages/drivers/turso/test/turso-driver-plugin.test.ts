/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { describe, it, expect } from 'vitest';
import { TursoDriverPlugin } from '../src/turso-driver-plugin';
import { ObjectQLError } from '@objectql/types';

// ============================================================================
// Configuration Validation
// ============================================================================

describe('TursoDriverPlugin - Configuration', () => {
    it('should throw CONFIG_ERROR if neither connection nor multiTenant is provided', () => {
        expect(() => {
            new TursoDriverPlugin({});
        }).toThrow(ObjectQLError);
        expect(() => {
            new TursoDriverPlugin({});
        }).toThrow('requires either');
    });

    it('should throw CONFIG_ERROR if both connection and multiTenant are provided', () => {
        expect(() => {
            new TursoDriverPlugin({
                connection: { url: ':memory:' },
                multiTenant: { urlTemplate: 'libsql://{tenant}.turso.io' },
            });
        }).toThrow(ObjectQLError);
        expect(() => {
            new TursoDriverPlugin({
                connection: { url: ':memory:' },
                multiTenant: { urlTemplate: 'libsql://{tenant}.turso.io' },
            });
        }).toThrow('mutually exclusive');
    });

    it('should create with single-tenant connection config', () => {
        const plugin = new TursoDriverPlugin({
            connection: { url: ':memory:' },
        });
        expect(plugin).toBeDefined();
        expect(plugin.name).toBe('@objectql/driver-turso');
        expect(plugin.version).toBe('4.2.2');
    });

    it('should create with multi-tenant config', () => {
        const plugin = new TursoDriverPlugin({
            multiTenant: { urlTemplate: 'libsql://{tenant}-org.turso.io' },
        });
        expect(plugin).toBeDefined();
    });
});

// ============================================================================
// Single-Tenant Lifecycle
// ============================================================================

describe('TursoDriverPlugin - Single-Tenant Lifecycle', () => {
    it('should connect and provide driver after onStart', async () => {
        const plugin = new TursoDriverPlugin({
            connection: { url: ':memory:' },
        });

        const mockCtx = { engine: {} };
        await plugin.install(mockCtx);
        await plugin.onStart(mockCtx);

        const driver = plugin.getDriver();
        expect(driver).toBeDefined();
        expect(driver.name).toBe('TursoDriver');

        // Should be connected — test with health check
        const healthy = await driver.checkHealth();
        expect(healthy).toBe(true);

        await plugin.onStop(mockCtx);
    });

    it('should throw DRIVER_ERROR when getDriver is called before onStart', () => {
        const plugin = new TursoDriverPlugin({
            connection: { url: ':memory:' },
        });

        expect(() => plugin.getDriver()).toThrow(ObjectQLError);
        expect(() => plugin.getDriver()).toThrow('No single-tenant driver');
    });

    it('should throw DRIVER_ERROR when getRouter is called in single-tenant mode', async () => {
        const plugin = new TursoDriverPlugin({
            connection: { url: ':memory:' },
        });

        const mockCtx = { engine: {} };
        await plugin.onStart(mockCtx);

        expect(() => plugin.getRouter()).toThrow(ObjectQLError);
        expect(() => plugin.getRouter()).toThrow('No multi-tenant router');

        await plugin.onStop(mockCtx);
    });

    it('should disconnect on onStop', async () => {
        const plugin = new TursoDriverPlugin({
            connection: { url: ':memory:' },
        });

        const mockCtx = { engine: {} };
        await plugin.onStart(mockCtx);

        const driver = plugin.getDriver();
        expect(await driver.checkHealth()).toBe(true);

        await plugin.onStop(mockCtx);

        // After stop, getDriver should throw
        expect(() => plugin.getDriver()).toThrow(ObjectQLError);
    });
});

// ============================================================================
// Multi-Tenant Lifecycle
// ============================================================================

describe('TursoDriverPlugin - Multi-Tenant Lifecycle', () => {
    it('should provide router after onStart', async () => {
        const plugin = new TursoDriverPlugin({
            multiTenant: {
                urlTemplate: 'file:/tmp/oql-plug-{tenant}.db',
            },
        });

        const mockCtx = { engine: {} };
        await plugin.onStart(mockCtx);

        const router = plugin.getRouter();
        expect(router).toBeDefined();
        expect(typeof router.getDriverForTenant).toBe('function');

        await plugin.onStop(mockCtx);
    });

    it('should destroy all tenant drivers on onStop', async () => {
        const plugin = new TursoDriverPlugin({
            multiTenant: {
                urlTemplate: 'file:/tmp/oql-plug2-{tenant}.db',
            },
        });

        const mockCtx = { engine: {} };
        await plugin.onStart(mockCtx);

        const router = plugin.getRouter();
        await router.getDriverForTenant('tenant-01');
        await router.getDriverForTenant('tenant-02');
        expect(router.getCacheSize()).toBe(2);

        await plugin.onStop(mockCtx);

        // After stop, getRouter should throw
        expect(() => plugin.getRouter()).toThrow(ObjectQLError);
    });
});

// ============================================================================
// Schema Diff & Migration
// ============================================================================

describe('TursoDriverPlugin - Schema Migration', () => {
    it('should generate and apply migration for new table', async () => {
        const plugin = new TursoDriverPlugin({
            connection: { url: ':memory:' },
        });

        const mockCtx = { engine: {} };
        await plugin.onStart(mockCtx);

        const objects = [{
            name: 'projects',
            fields: {
                title: { type: 'text' },
                status: { type: 'select' },
            },
        }];

        // Generate migration
        const migration = await plugin.generateMigration(objects);
        expect(migration.up.length).toBeGreaterThan(0);
        expect(migration.up[0]).toContain('CREATE TABLE');

        // Apply migration
        await plugin.applyMigration(migration);

        // Verify table exists
        const driver = plugin.getDriver();
        const schema = await driver.introspectSchema();
        expect(schema.tables['projects']).toBeDefined();
        expect(schema.tables['projects'].columns.map(c => c.name)).toContain('title');
        expect(schema.tables['projects'].columns.map(c => c.name)).toContain('status');

        await plugin.onStop(mockCtx);
    });

    it('should generate migration for adding columns to existing table', async () => {
        const plugin = new TursoDriverPlugin({
            connection: { url: ':memory:' },
        });

        const mockCtx = { engine: {} };
        await plugin.onStart(mockCtx);

        // Create initial table
        const driver = plugin.getDriver();
        await driver.init([{
            name: 'users',
            fields: { email: { type: 'text' } },
        }]);

        // Generate migration for updated schema
        const migration = await plugin.generateMigration([{
            name: 'users',
            fields: { email: { type: 'text' }, phone: { type: 'text' } },
        }]);

        expect(migration.up.length).toBe(1);
        expect(migration.up[0]).toContain('ALTER TABLE');
        expect(migration.up[0]).toContain('"phone"');

        // Apply and verify
        await plugin.applyMigration(migration);
        const schema = await driver.introspectSchema();
        expect(schema.tables['users'].columns.map(c => c.name)).toContain('phone');

        await plugin.onStop(mockCtx);
    });
});
