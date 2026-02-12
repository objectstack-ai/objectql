/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { checkWebAssembly, checkOPFS, detectStorageBackend } from './environment.js';
import { SqliteWasmDriver } from './index.js';

// ---------------------------------------------------------------------------
// Environment Detection Utilities
// ---------------------------------------------------------------------------

describe('sqlite-wasm / environment', () => {
    describe('checkWebAssembly', () => {
        afterEach(() => {
            vi.restoreAllMocks();
        });

        it('should not throw when WebAssembly is available', () => {
            // Node.js ships with WebAssembly support
            expect(() => checkWebAssembly()).not.toThrow();
        });

        it('should throw ObjectQLError when WebAssembly is unavailable', () => {
            const original = globalThis.WebAssembly;
            try {
                // Simulate an environment without WebAssembly
                Object.defineProperty(globalThis, 'WebAssembly', {
                    value: undefined,
                    configurable: true,
                });
                expect(() => checkWebAssembly()).toThrowError('WebAssembly is not supported');
            } finally {
                Object.defineProperty(globalThis, 'WebAssembly', {
                    value: original,
                    configurable: true,
                });
            }
        });

        it('should throw an error with code ENVIRONMENT_ERROR', () => {
            const original = globalThis.WebAssembly;
            try {
                Object.defineProperty(globalThis, 'WebAssembly', {
                    value: undefined,
                    configurable: true,
                });
                try {
                    checkWebAssembly();
                } catch (err: any) {
                    expect(err.code).toBe('ENVIRONMENT_ERROR');
                }
            } finally {
                Object.defineProperty(globalThis, 'WebAssembly', {
                    value: original,
                    configurable: true,
                });
            }
        });
    });

    describe('checkOPFS', () => {
        it('should return false in Node.js (no navigator)', async () => {
            const result = await checkOPFS();
            expect(result).toBe(false);
        });

        it('should return a boolean value', async () => {
            const result = await checkOPFS();
            expect(typeof result).toBe('boolean');
        });
    });

    describe('detectStorageBackend', () => {
        it('should return "memory" in Node.js (OPFS unavailable)', async () => {
            const backend = await detectStorageBackend();
            expect(backend).toBe('memory');
        });

        it('should return a valid storage type', async () => {
            const backend = await detectStorageBackend();
            expect(['opfs', 'memory']).toContain(backend);
        });
    });
});

// ---------------------------------------------------------------------------
// SqliteWasmDriver — Metadata & Capabilities
// ---------------------------------------------------------------------------

describe('SqliteWasmDriver', () => {
    describe('instantiation', () => {
        it('should instantiate with default config', () => {
            const driver = new SqliteWasmDriver();
            expect(driver).toBeDefined();
        });

        it('should accept custom configuration', () => {
            const driver = new SqliteWasmDriver({
                storage: 'memory',
                filename: 'test.db',
                walMode: false,
                pageSize: 8192,
            });
            expect(driver).toBeDefined();
        });

        it('should accept partial configuration', () => {
            const driver = new SqliteWasmDriver({ filename: 'custom.db' });
            expect(driver).toBeDefined();
        });
    });

    describe('metadata', () => {
        const driver = new SqliteWasmDriver({ storage: 'memory' });

        it('should expose driver name', () => {
            expect(driver.name).toBe('SqliteWasmDriver');
        });

        it('should expose driver version', () => {
            expect(driver.version).toBe('4.2.0');
        });

        it('should expose a supports/capabilities object', () => {
            expect(driver.supports).toBeDefined();
            expect(typeof driver.supports).toBe('object');
        });
    });

    describe('capabilities', () => {
        const driver = new SqliteWasmDriver({ storage: 'memory' });
        const caps = driver.supports;

        it('should support basic CRUD operations', () => {
            expect(caps.create).toBe(true);
            expect(caps.read).toBe(true);
            expect(caps.update).toBe(true);
            expect(caps.delete).toBe(true);
        });

        it('should support bulk operations', () => {
            expect(caps.bulkCreate).toBe(true);
            expect(caps.bulkUpdate).toBe(true);
            expect(caps.bulkDelete).toBe(true);
        });

        it('should NOT support transactions (single connection)', () => {
            expect(caps.transactions).toBe(false);
            expect(caps.savepoints).toBe(false);
        });

        it('should support JSON fields', () => {
            expect(caps.jsonFields).toBe(true);
        });

        it('should NOT support array fields', () => {
            expect(caps.arrayFields).toBe(false);
        });

        it('should NOT support streaming', () => {
            expect(caps.streaming).toBe(false);
        });

        it('should support query features', () => {
            expect(caps.queryFilters).toBe(true);
            expect(caps.queryAggregations).toBe(true);
            expect(caps.querySorting).toBe(true);
            expect(caps.queryPagination).toBe(true);
        });

        it('should support advanced SQL features', () => {
            expect(caps.queryWindowFunctions).toBe(true);
            expect(caps.querySubqueries).toBe(true);
            expect(caps.queryCTE).toBe(true);
            expect(caps.joins).toBe(true);
        });

        it('should support schema management', () => {
            expect(caps.schemaSync).toBe(true);
            expect(caps.migrations).toBe(true);
            expect(caps.indexes).toBe(true);
        });

        it('should support prepared statements but not connection pooling', () => {
            expect(caps.preparedStatements).toBe(true);
            expect(caps.connectionPooling).toBe(false);
        });

        it('should NOT support query cache', () => {
            expect(caps.queryCache).toBe(false);
        });
    });
});
