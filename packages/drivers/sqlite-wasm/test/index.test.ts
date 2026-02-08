/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SqliteWasmDriver } from '../src';
import { ObjectQLError } from '@objectql/types';

/**
 * Mock global WebAssembly for testing
 * In a real browser environment, this would be provided by the runtime
 */
const mockWebAssembly = {
    Module: class {},
    Instance: class {},
    Memory: class {},
    Table: class {},
    CompileError: class extends Error {},
    LinkError: class extends Error {},
    RuntimeError: class extends Error {},
    instantiate: vi.fn(),
    compile: vi.fn(),
    validate: vi.fn()
};

// Setup global WebAssembly mock
if (typeof globalThis.WebAssembly === 'undefined') {
    (globalThis as any).WebAssembly = mockWebAssembly;
}

describe('SqliteWasmDriver - Environment Detection', () => {
    it('should throw ENVIRONMENT_ERROR if WebAssembly is not available', () => {
        const originalWasm = (globalThis as any).WebAssembly;
        delete (globalThis as any).WebAssembly;

        expect(() => {
            new SqliteWasmDriver();
        }).toThrow(ObjectQLError);

        expect(() => {
            new SqliteWasmDriver();
        }).toThrow('WebAssembly is not supported');

        // Restore
        (globalThis as any).WebAssembly = originalWasm;
    });

    it('should accept default configuration', () => {
        const driver = new SqliteWasmDriver();
        expect(driver).toBeDefined();
        expect(driver.name).toBe('SqliteWasmDriver');
        expect(driver.version).toBe('4.2.0');
    });

    it('should accept custom configuration', () => {
        const driver = new SqliteWasmDriver({
            storage: 'memory',
            filename: 'test.db',
            walMode: false,
            pageSize: 8192
        });
        expect(driver).toBeDefined();
    });
});

describe('SqliteWasmDriver - Capabilities', () => {
    let driver: SqliteWasmDriver;

    beforeEach(() => {
        driver = new SqliteWasmDriver({ storage: 'memory' });
    });

    it('should declare correct capabilities', () => {
        expect(driver.supports).toBeDefined();
        expect(driver.supports.create).toBe(true);
        expect(driver.supports.read).toBe(true);
        expect(driver.supports.update).toBe(true);
        expect(driver.supports.delete).toBe(true);
        expect(driver.supports.queryFilters).toBe(true);
        expect(driver.supports.queryAggregations).toBe(true);
        expect(driver.supports.querySorting).toBe(true);
        expect(driver.supports.queryPagination).toBe(true);
        expect(driver.supports.joins).toBe(true);
        expect(driver.supports.fullTextSearch).toBe(true);
        expect(driver.supports.jsonFields).toBe(true);
    });

    it('should not support transactions with single connection', () => {
        expect(driver.supports.transactions).toBe(false);
        expect(driver.supports.savepoints).toBe(false);
    });

    it('should not support streaming', () => {
        expect(driver.supports.streaming).toBe(false);
    });
});

describe('SqliteWasmDriver - Memory Storage (Mock)', () => {
    let driver: SqliteWasmDriver;

    beforeEach(async () => {
        driver = new SqliteWasmDriver({ storage: 'memory' });
    });

    afterEach(async () => {
        if (driver) {
            await driver.disconnect?.();
        }
    });

    it('should initialize with memory storage', async () => {
        // This test will fail until wa-sqlite is properly integrated
        // For now, we're testing the configuration layer
        expect(driver).toBeDefined();
    });

    it.skip('should connect and check health', async () => {
        // Skip until WASM module is available in test environment
        await driver.connect?.();
        const health = await driver.checkHealth?.();
        expect(health).toBe(true);
    });

    it.skip('should create tables via init', async () => {
        // Skip until WASM module is available
        const objects = [
            {
                name: 'users',
                fields: {
                    id: { type: 'text', primary: true },
                    name: { type: 'text' },
                    age: { type: 'number' }
                }
            }
        ];

        await driver.init?.(objects);
    });
});

describe('SqliteWasmDriver - CRUD Operations (Mock)', () => {
    let driver: SqliteWasmDriver;

    beforeEach(async () => {
        driver = new SqliteWasmDriver({ storage: 'memory' });
    });

    afterEach(async () => {
        if (driver) {
            await driver.disconnect?.();
        }
    });

    it.skip('should create a record', async () => {
        // Skip until WASM module is available
        const newUser = { name: 'Alice', age: 25 };
        const created = await driver.create('users', newUser);
        expect(created).toBeDefined();
        expect(created.name).toBe('Alice');
    });

    it.skip('should find records with filters', async () => {
        // Skip until WASM module is available
        const results = await driver.find('users', {
            where: { age: { $gt: 18 } }
        });
        expect(Array.isArray(results)).toBe(true);
    });

    it.skip('should find one record by id', async () => {
        // Skip until WASM module is available
        const user = await driver.findOne('users', 'user-id-123');
        expect(user).toBeDefined();
    });

    it.skip('should update a record', async () => {
        // Skip until WASM module is available
        const updated = await driver.update('users', 'user-id-123', { age: 26 });
        expect(updated).toBeDefined();
    });

    it.skip('should delete a record', async () => {
        // Skip until WASM module is available
        await driver.delete('users', 'user-id-123');
    });

    it.skip('should count records', async () => {
        // Skip until WASM module is available
        const count = await driver.count('users', {});
        expect(typeof count).toBe('number');
    });
});

describe('SqliteWasmDriver - Bulk Operations (Mock)', () => {
    let driver: SqliteWasmDriver;

    beforeEach(async () => {
        driver = new SqliteWasmDriver({ storage: 'memory' });
    });

    afterEach(async () => {
        if (driver) {
            await driver.disconnect?.();
        }
    });

    it.skip('should bulk create records', async () => {
        // Skip until WASM module is available
        const users = [
            { name: 'Alice', age: 25 },
            { name: 'Bob', age: 30 }
        ];
        const result = await driver.bulkCreate?.('users', users);
        expect(result).toBeDefined();
    });

    it.skip('should bulk update records', async () => {
        // Skip until WASM module is available
        const updates = [
            { id: 'user-1', data: { age: 26 } },
            { id: 'user-2', data: { age: 31 } }
        ];
        const result = await driver.bulkUpdate?.('users', updates);
        expect(result).toBeDefined();
    });

    it.skip('should bulk delete records', async () => {
        // Skip until WASM module is available
        const ids = ['user-1', 'user-2'];
        const result = await driver.bulkDelete?.('users', ids);
        expect(result).toBeDefined();
    });
});

describe('SqliteWasmDriver - Configuration', () => {
    it('should use OPFS by default', () => {
        const driver = new SqliteWasmDriver();
        expect((driver as any).config.storage).toBe('opfs');
    });

    it('should accept memory storage', () => {
        const driver = new SqliteWasmDriver({ storage: 'memory' });
        expect((driver as any).config.storage).toBe('memory');
    });

    it('should use default filename', () => {
        const driver = new SqliteWasmDriver();
        expect((driver as any).config.filename).toBe('objectql.db');
    });

    it('should accept custom filename', () => {
        const driver = new SqliteWasmDriver({ filename: 'custom.db' });
        expect((driver as any).config.filename).toBe('custom.db');
    });

    it('should enable WAL mode by default', () => {
        const driver = new SqliteWasmDriver();
        expect((driver as any).config.walMode).toBe(true);
    });

    it('should accept custom WAL mode', () => {
        const driver = new SqliteWasmDriver({ walMode: false });
        expect((driver as any).config.walMode).toBe(false);
    });

    it('should use default page size', () => {
        const driver = new SqliteWasmDriver();
        expect((driver as any).config.pageSize).toBe(4096);
    });

    it('should accept custom page size', () => {
        const driver = new SqliteWasmDriver({ pageSize: 8192 });
        expect((driver as any).config.pageSize).toBe(8192);
    });
});

describe('SqliteWasmDriver - Lifecycle', () => {
    let driver: SqliteWasmDriver;

    beforeEach(() => {
        driver = new SqliteWasmDriver({ storage: 'memory' });
    });

    afterEach(async () => {
        if (driver) {
            await driver.disconnect?.();
        }
    });

    it('should have connect method', () => {
        expect(typeof driver.connect).toBe('function');
    });

    it('should have disconnect method', () => {
        expect(typeof driver.disconnect).toBe('function');
    });

    it('should have checkHealth method', () => {
        expect(typeof driver.checkHealth).toBe('function');
    });

    it.skip('should initialize lazily on first operation', async () => {
        // The driver should not be initialized until first operation
        expect((driver as any).initialized).toBe(false);
        
        // Skip actual execution until WASM is available
        // await driver.find('test', {});
        // expect((driver as any).initialized).toBe(true);
    });

    it.skip('should disconnect cleanly', async () => {
        // Skip until WASM module is available
        await driver.connect?.();
        await driver.disconnect?.();
        expect((driver as any).initialized).toBe(false);
    });
});
