/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Redis Driver Tests
 * 
 * These tests demonstrate the expected behavior of the Redis driver.
 * They require a running Redis instance to execute.
 */

import { RedisDriver } from '../src';

describe('RedisDriver', () => {
    let driver: RedisDriver;
    const TEST_OBJECT = 'test_users';

    beforeAll(async () => {
        let d: RedisDriver | undefined;
        // Suppress console.error solely for the connection probe to avoid noise
        // when Redis is intentionaly missing (e.g. in some local envs)
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        // Skip tests if Redis is not available
        try {
            d = new RedisDriver({ 
                url: process.env.REDIS_URL || 'redis://127.0.0.1:6379'
            });
            
            // Verify connection by attempting a simple operation
            await d.count('_test_connection', []);
            driver = d;
        } catch (error) {
            console.warn('Redis not available, skipping tests');
            if (d) {
                try {
                    await d.disconnect();
                } catch (e) {
                    // Ignore disconnect error
                }
            }
        } finally {
            // Restore console.error
            consoleErrorSpy.mockRestore();
        }
    });

    afterAll(async () => {
        if (driver) {
            // Clean up test data
            try {
                const results = await driver.find(TEST_OBJECT, {});
                for (const record of results) {
                    await driver.delete(TEST_OBJECT, record.id);
                }
            } catch (error) {
                // Ignore cleanup errors
            }
            
            await driver.disconnect();
        }
    });

    afterEach(async () => {
        if (driver) {
            // Clean up after each test
            try {
                const results = await driver.find(TEST_OBJECT, {});
                for (const record of results) {
                    await driver.delete(TEST_OBJECT, record.id);
                }
            } catch (error) {
                // Ignore cleanup errors
            }
        }
    });

    describe('Connection', () => {
        it('should connect to Redis', () => {
            expect(driver).toBeDefined();
        });
    });

    describe('CRUD Operations', () => {
        it('should create a record', async () => {
            if (!driver) {
                console.log('Skipping test: Redis not available');
                return;
            }

            const result = await driver.create(TEST_OBJECT, {
                name: 'Alice',
                email: 'alice@example.com',
                role: 'admin'
            });

            expect(result).toHaveProperty('id');
            expect(result.name).toBe('Alice');
            expect(result.email).toBe('alice@example.com');
            expect(result).toHaveProperty('created_at');
            expect(result).toHaveProperty('updated_at');
        });

        it('should create a record with custom ID', async () => {
            if (!driver) return;

            const result = await driver.create(TEST_OBJECT, {
                id: 'custom-123',
                name: 'Bob'
            });

            expect(result.id).toBe('custom-123');
            expect(result.name).toBe('Bob');
        });

        it('should find all records', async () => {
            if (!driver) return;

            await driver.create(TEST_OBJECT, { name: 'Alice' });
            await driver.create(TEST_OBJECT, { name: 'Bob' });

            const results = await driver.find(TEST_OBJECT, {});

            expect(results).toHaveLength(2);
        });

        it('should findOne by ID', async () => {
            if (!driver) return;

            const created = await driver.create(TEST_OBJECT, { name: 'Alice' });
            const found = await driver.findOne(TEST_OBJECT, created.id);

            expect(found).toBeDefined();
            expect(found.id).toBe(created.id);
            expect(found.name).toBe('Alice');
        });

        it('should return null for non-existent ID', async () => {
            if (!driver) return;

            const found = await driver.findOne(TEST_OBJECT, 'non-existent-id');

            expect(found).toBeNull();
        });

        it('should update a record', async () => {
            if (!driver) return;

            const created = await driver.create(TEST_OBJECT, { 
                name: 'Alice',
                email: 'alice@example.com'
            });

            // Wait a bit to ensure updated_at is different
            await new Promise(resolve => setTimeout(resolve, 10));

            const updated = await driver.update(TEST_OBJECT, created.id, {
                email: 'alice.new@example.com'
            });

            expect(updated.id).toBe(created.id);
            expect(updated.name).toBe('Alice');
            expect(updated.email).toBe('alice.new@example.com');
            expect(updated.created_at).toBe(created.created_at);
            expect(updated.updated_at).not.toBe(created.updated_at);
        });

        it('should delete a record', async () => {
            if (!driver) return;

            const created = await driver.create(TEST_OBJECT, { name: 'Alice' });
            const deleted = await driver.delete(TEST_OBJECT, created.id);

            expect(deleted).toBe(true);

            const found = await driver.findOne(TEST_OBJECT, created.id);
            expect(found).toBeNull();
        });

        it('should count records', async () => {
            if (!driver) return;

            await driver.create(TEST_OBJECT, { name: 'Alice' });
            await driver.create(TEST_OBJECT, { name: 'Bob' });

            const count = await driver.count(TEST_OBJECT, []);

            expect(count).toBe(2);
        });
    });

    describe('Query Filtering', () => {
        beforeEach(async () => {
            if (!driver) return;

            await driver.create(TEST_OBJECT, { name: 'Alice', age: 30, role: 'admin' });
            await driver.create(TEST_OBJECT, { name: 'Bob', age: 25, role: 'user' });
            await driver.create(TEST_OBJECT, { name: 'Charlie', age: 35, role: 'user' });
        });

        it('should filter by equality', async () => {
            if (!driver) return;

            const results = await driver.find(TEST_OBJECT, {
                filters: [['role', '=', 'user']]
            });

            expect(results).toHaveLength(2);
            expect(results.every((r: any) => r.role === 'user')).toBe(true);
        });

        it('should filter by greater than', async () => {
            if (!driver) return;

            const results = await driver.find(TEST_OBJECT, {
                filters: [['age', '>', 25]]
            });

            expect(results).toHaveLength(2);
        });

        it('should filter with OR operator', async () => {
            if (!driver) return;

            const results = await driver.find(TEST_OBJECT, {
                filters: [
                    ['name', '=', 'Alice'],
                    'or',
                    ['name', '=', 'Bob']
                ]
            });

            expect(results).toHaveLength(2);
        });

        it('should filter with contains', async () => {
            if (!driver) return;

            const results = await driver.find(TEST_OBJECT, {
                filters: [['name', 'contains', 'li']]
            });

            expect(results).toHaveLength(2); // Alice and Charlie
        });

        it('should count with filters', async () => {
            if (!driver) return;

            const count = await driver.count(TEST_OBJECT, [['role', '=', 'user']]);

            expect(count).toBe(2);
        });
    });

    describe('Query Options', () => {
        beforeEach(async () => {
            if (!driver) return;

            await driver.create(TEST_OBJECT, { name: 'Alice', age: 30 });
            await driver.create(TEST_OBJECT, { name: 'Bob', age: 25 });
            await driver.create(TEST_OBJECT, { name: 'Charlie', age: 35 });
        });

        it('should sort ascending', async () => {
            if (!driver) return;

            const results = await driver.find(TEST_OBJECT, {
                sort: [['age', 'asc']]
            });

            expect(results[0].name).toBe('Bob');
            expect(results[1].name).toBe('Alice');
            expect(results[2].name).toBe('Charlie');
        });

        it('should sort descending', async () => {
            if (!driver) return;

            const results = await driver.find(TEST_OBJECT, {
                sort: [['age', 'desc']]
            });

            expect(results[0].name).toBe('Charlie');
            expect(results[1].name).toBe('Alice');
            expect(results[2].name).toBe('Bob');
        });

        it('should limit results', async () => {
            if (!driver) return;

            const results = await driver.find(TEST_OBJECT, {
                limit: 2
            });

            expect(results).toHaveLength(2);
        });

        it('should skip results', async () => {
            if (!driver) return;

            const results = await driver.find(TEST_OBJECT, {
                sort: [['age', 'asc']],
                skip: 1
            });

            expect(results).toHaveLength(2);
            expect(results[0].name).toBe('Alice');
        });

        it('should project fields', async () => {
            if (!driver) return;

            const results = await driver.find(TEST_OBJECT, {
                fields: ['name']
            });

            expect(results[0]).toHaveProperty('name');
            expect(results[0]).not.toHaveProperty('age');
        });
    });
});
