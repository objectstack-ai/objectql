/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createMultiTenantRouter, type MultiTenantConfig } from '../src/multi-tenant-router';
import { ObjectQLError } from '@objectql/types';

describe('createMultiTenantRouter - Configuration Validation', () => {
    it('should throw CONFIG_ERROR if urlTemplate is missing', () => {
        expect(() => {
            createMultiTenantRouter({ urlTemplate: '' });
        }).toThrow(ObjectQLError);
        expect(() => {
            createMultiTenantRouter({ urlTemplate: '' });
        }).toThrow('requires a "urlTemplate"');
    });

    it('should throw CONFIG_ERROR if urlTemplate has no {tenant} placeholder', () => {
        expect(() => {
            createMultiTenantRouter({ urlTemplate: 'libsql://fixed.turso.io' });
        }).toThrow(ObjectQLError);
        expect(() => {
            createMultiTenantRouter({ urlTemplate: 'libsql://fixed.turso.io' });
        }).toThrow('{tenant}');
    });

    it('should create a router with valid config', () => {
        const router = createMultiTenantRouter({
            urlTemplate: 'libsql://{tenant}-org.turso.io',
        });
        expect(router).toBeDefined();
        expect(typeof router.getDriverForTenant).toBe('function');
        expect(typeof router.invalidateCache).toBe('function');
        expect(typeof router.destroyAll).toBe('function');
        expect(typeof router.getCacheSize).toBe('function');
    });
});

describe('createMultiTenantRouter - Tenant ID Validation', () => {
    let router: ReturnType<typeof createMultiTenantRouter>;

    beforeEach(() => {
        router = createMultiTenantRouter({
            urlTemplate: 'file:/tmp/test-{tenant}.db',
        });
    });

    afterEach(async () => {
        await router.destroyAll();
    });

    it('should reject empty tenantId', async () => {
        await expect(router.getDriverForTenant('')).rejects.toThrow('non-empty string');
    });

    it('should reject single-character tenantId', async () => {
        await expect(router.getDriverForTenant('a')).rejects.toThrow('Invalid tenantId');
    });

    it('should reject tenantId with special characters', async () => {
        await expect(router.getDriverForTenant('tenant@bad')).rejects.toThrow('Invalid tenantId');
    });

    it('should reject tenantId starting with hyphen', async () => {
        await expect(router.getDriverForTenant('-invalid')).rejects.toThrow('Invalid tenantId');
    });
});

describe('createMultiTenantRouter - Driver Lifecycle (in-memory)', () => {
    // Use file-based URLs with {tenant} to properly test multi-tenant routing.
    // Each tenant gets a unique temp file DB.
    let router: ReturnType<typeof createMultiTenantRouter>;

    beforeEach(() => {
        router = createMultiTenantRouter({
            urlTemplate: 'file:/tmp/oql-test-{tenant}.db',
            clientCacheTTL: 60_000, // 1 minute
        });
    });

    afterEach(async () => {
        await router.destroyAll();
    });

    it('should create and cache a driver for a tenant', async () => {
        const driver = await router.getDriverForTenant('tenant-01');
        expect(driver).toBeDefined();
        expect(driver.name).toBe('TursoDriver');
        expect(router.getCacheSize()).toBe(1);
    });

    it('should return cached driver on second call', async () => {
        const d1 = await router.getDriverForTenant('tenant-02');
        const d2 = await router.getDriverForTenant('tenant-02');
        expect(d1).toBe(d2); // Same reference
        expect(router.getCacheSize()).toBe(1);
    });

    it('should create separate drivers for different tenants', async () => {
        const d1 = await router.getDriverForTenant('tenant-aa');
        const d2 = await router.getDriverForTenant('tenant-bb');
        expect(d1).not.toBe(d2);
        expect(router.getCacheSize()).toBe(2);
    });

    it('should invalidate a specific tenant cache', async () => {
        await router.getDriverForTenant('tenant-cc');
        expect(router.getCacheSize()).toBe(1);

        router.invalidateCache('tenant-cc');
        expect(router.getCacheSize()).toBe(0);
    });

    it('should no-op when invalidating non-existent tenant', () => {
        router.invalidateCache('nonexistent');
        expect(router.getCacheSize()).toBe(0);
    });

    it('should destroy all cached drivers', async () => {
        await router.getDriverForTenant('tenant-dd');
        await router.getDriverForTenant('tenant-ee');
        expect(router.getCacheSize()).toBe(2);

        await router.destroyAll();
        expect(router.getCacheSize()).toBe(0);
    });
});

describe('createMultiTenantRouter - TTL Expiration', () => {
    it('should recreate driver after TTL expires', async () => {
        const router = createMultiTenantRouter({
            urlTemplate: 'file:/tmp/oql-ttl-{tenant}.db',
            clientCacheTTL: 1, // 1ms TTL — will expire immediately
        });

        const d1 = await router.getDriverForTenant('tenant-ff');

        // Wait for TTL to expire
        await new Promise(resolve => setTimeout(resolve, 10));

        const d2 = await router.getDriverForTenant('tenant-ff');
        expect(d1).not.toBe(d2); // New instance after expiration

        await router.destroyAll();
    });
});

describe('createMultiTenantRouter - Callbacks', () => {
    it('should call onTenantCreate when creating a new driver', async () => {
        const onTenantCreate = vi.fn().mockResolvedValue(undefined);

        const router = createMultiTenantRouter({
            urlTemplate: 'file:/tmp/oql-cb1-{tenant}.db',
            onTenantCreate,
        });

        await router.getDriverForTenant('tenant-gg');
        expect(onTenantCreate).toHaveBeenCalledWith('tenant-gg');
        expect(onTenantCreate).toHaveBeenCalledTimes(1);

        // Second call should use cache — no callback
        await router.getDriverForTenant('tenant-gg');
        expect(onTenantCreate).toHaveBeenCalledTimes(1);

        await router.destroyAll();
    });

    it('should call onTenantDelete when destroying all', async () => {
        const onTenantDelete = vi.fn().mockResolvedValue(undefined);

        const router = createMultiTenantRouter({
            urlTemplate: 'file:/tmp/oql-cb2-{tenant}.db',
            onTenantDelete,
        });

        await router.getDriverForTenant('tenant-hh');
        await router.destroyAll();
        expect(onTenantDelete).toHaveBeenCalledWith('tenant-hh');
    });
});

describe('createMultiTenantRouter - Driver Operations', () => {
    let router: ReturnType<typeof createMultiTenantRouter>;

    beforeEach(() => {
        router = createMultiTenantRouter({
            urlTemplate: 'file:/tmp/oql-crud-{tenant}.db',
        });
    });

    afterEach(async () => {
        await router.destroyAll();
    });

    it('should allow CRUD operations on tenant driver', async () => {
        const driver = await router.getDriverForTenant('tenant-crud');

        // Create table
        await driver.init([{
            name: 'tasks',
            fields: {
                title: { type: 'text' },
                done: { type: 'boolean' },
            },
        }]);

        // Create record
        const created = await driver.create('tasks', { title: 'Test task', done: false });
        expect(created.title).toBe('Test task');
        expect(created.id).toBeDefined();

        // Read record
        const found = await driver.findOne('tasks', created.id as string);
        expect(found).toBeDefined();
        expect(found!.title).toBe('Test task');
    });
});
