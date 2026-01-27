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
                where: {
                    type: 'comparison',
                    field: 'role',
                    operator: '=',
                    value: 'user'
                }
            });

            expect(results).toHaveLength(2);
            expect(results.every((r: any) => r.role === 'user')).toBe(true);
        });

        it('should filter by greater than', async () => {
            if (!driver) return;

            const results = await driver.find(TEST_OBJECT, {
                where: {
                    type: 'comparison',
                    field: 'age',
                    operator: '>',
                    value: 25
                }
            });

            expect(results).toHaveLength(2);
        });

        it('should filter with OR operator', async () => {
            if (!driver) return;

            const results = await driver.find(TEST_OBJECT, {
                where: {
                    type: 'or',
                    children: [
                        {
                            type: 'comparison',
                            field: 'name',
                            operator: '=',
                            value: 'Alice'
                        },
                        {
                            type: 'comparison',
                            field: 'name',
                            operator: '=',
                            value: 'Bob'
                        }
                    ]
                }
            });

            expect(results).toHaveLength(2);
        });

        it('should filter with contains', async () => {
            if (!driver) return;

            const results = await driver.find(TEST_OBJECT, {
                where: {
                    type: 'comparison',
                    field: 'name',
                    operator: 'contains',
                    value: 'li'
                }
            });

            expect(results).toHaveLength(2); // Alice and Charlie
        });

        it('should count with filters', async () => {
            if (!driver) return;

            const count = await driver.count(TEST_OBJECT, {
                type: 'comparison',
                field: 'role',
                operator: '=',
                value: 'user'
            });

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
                orderBy: [{ field: 'age', order: 'asc' }]
            });

            expect(results[0].name).toBe('Bob');
            expect(results[1].name).toBe('Alice');
            expect(results[2].name).toBe('Charlie');
        });

        it('should sort descending', async () => {
            if (!driver) return;

            const results = await driver.find(TEST_OBJECT, {
                orderBy: [{ field: 'age', order: 'desc' }]
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
                orderBy: [{ field: 'age', order: 'asc' }],
                offset: 1
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

    describe('DriverInterface v4.0 - executeQuery', () => {
        beforeEach(async () => {
            if (!driver) return;

            await driver.create(TEST_OBJECT, { name: 'Alice', age: 30, role: 'admin' });
            await driver.create(TEST_OBJECT, { name: 'Bob', age: 25, role: 'user' });
            await driver.create(TEST_OBJECT, { name: 'Charlie', age: 35, role: 'user' });
        });

        it('should execute a basic query with QueryAST', async () => {
            if (!driver) return;

            const result = await driver.executeQuery({
                object: TEST_OBJECT,
                fields: ['name', 'age']
            });

            expect(result.value).toHaveLength(3);
            expect(result.count).toBe(3);
            expect(result.value[0]).toHaveProperty('name');
            expect(result.value[0]).toHaveProperty('age');
        });

        it('should execute query with filter', async () => {
            if (!driver) return;

            const result = await driver.executeQuery({
                object: TEST_OBJECT,
                where: {
                    type: 'comparison',
                    field: 'role',
                    operator: '=',
                    value: 'user'
                }
            });

            expect(result.value).toHaveLength(2);
            expect(result.value.every((r: any) => r.role === 'user')).toBe(true);
        });

        it('should execute query with sort', async () => {
            if (!driver) return;

            const result = await driver.executeQuery({
                object: TEST_OBJECT,
                orderBy: [{ field: 'age', order: 'asc' }]
            });

            expect(result.value).toHaveLength(3);
            expect(result.value[0].name).toBe('Bob');
            expect(result.value[1].name).toBe('Alice');
            expect(result.value[2].name).toBe('Charlie');
        });

        it('should execute query with pagination', async () => {
            if (!driver) return;

            const result = await driver.executeQuery({
                object: TEST_OBJECT,
                orderBy: [{ field: 'age', order: 'asc' }],
                offset: 1,
                limit: 1
            });

            expect(result.value).toHaveLength(1);
            expect(result.value[0].name).toBe('Alice');
        });

        it('should execute query with AND filters', async () => {
            if (!driver) return;

            const result = await driver.executeQuery({
                object: TEST_OBJECT,
                where: {
                    type: 'and',
                    children: [
                        {
                            type: 'comparison',
                            field: 'role',
                            operator: '=',
                            value: 'user'
                        },
                        {
                            type: 'comparison',
                            field: 'age',
                            operator: '>',
                            value: 30
                        }
                    ]
                }
            });

            expect(result.value).toHaveLength(1);
            expect(result.value[0].name).toBe('Charlie');
        });

        it('should execute query with OR filters', async () => {
            if (!driver) return;

            const result = await driver.executeQuery({
                object: TEST_OBJECT,
                where: {
                    type: 'or',
                    children: [
                        {
                            type: 'comparison',
                            field: 'name',
                            operator: '=',
                            value: 'Alice'
                        },
                        {
                            type: 'comparison',
                            field: 'name',
                            operator: '=',
                            value: 'Bob'
                        }
                    ]
                }
            });

            expect(result.value).toHaveLength(2);
        });
    });

    describe('DriverInterface v4.0 - executeCommand', () => {
        it('should execute create command', async () => {
            if (!driver) return;

            const result = await driver.executeCommand({
                type: 'create',
                object: TEST_OBJECT,
                data: { name: 'David', email: 'david@example.com' }
            });

            expect(result.success).toBe(true);
            expect(result.affected).toBe(1);
            expect(result.data).toHaveProperty('id');
            expect(result.data.name).toBe('David');
        });

        it('should execute update command', async () => {
            if (!driver) return;

            const created = await driver.create(TEST_OBJECT, { name: 'Eve', email: 'eve@example.com' });

            const result = await driver.executeCommand({
                type: 'update',
                object: TEST_OBJECT,
                id: created.id,
                data: { email: 'eve.new@example.com' }
            });

            expect(result.success).toBe(true);
            expect(result.affected).toBe(1);
            expect(result.data.email).toBe('eve.new@example.com');
            expect(result.data.name).toBe('Eve');
        });

        it('should execute delete command', async () => {
            if (!driver) return;

            const created = await driver.create(TEST_OBJECT, { name: 'Frank' });

            const result = await driver.executeCommand({
                type: 'delete',
                object: TEST_OBJECT,
                id: created.id
            });

            expect(result.success).toBe(true);
            expect(result.affected).toBe(1);

            const found = await driver.findOne(TEST_OBJECT, created.id);
            expect(found).toBeNull();
        });

        it('should execute bulkCreate command', async () => {
            if (!driver) return;

            const result = await driver.executeCommand({
                type: 'bulkCreate',
                object: TEST_OBJECT,
                records: [
                    { name: 'Grace', age: 28 },
                    { name: 'Henry', age: 32 },
                    { name: 'Iris', age: 29 }
                ]
            });

            expect(result.success).toBe(true);
            expect(result.affected).toBe(3);
            expect(result.data).toHaveLength(3);
            expect(result.data[0]).toHaveProperty('id');

            const all = await driver.find(TEST_OBJECT, {});
            expect(all).toHaveLength(3);
        });

        it('should execute bulkUpdate command', async () => {
            if (!driver) return;

            const created1 = await driver.create(TEST_OBJECT, { name: 'Jack', age: 30 });
            const created2 = await driver.create(TEST_OBJECT, { name: 'Kate', age: 25 });

            const result = await driver.executeCommand({
                type: 'bulkUpdate',
                object: TEST_OBJECT,
                updates: [
                    { id: created1.id, data: { age: 31 } },
                    { id: created2.id, data: { age: 26 } }
                ]
            });

            expect(result.success).toBe(true);
            expect(result.affected).toBe(2);
            expect(result.data).toHaveLength(2);

            const updated1 = await driver.findOne(TEST_OBJECT, created1.id);
            const updated2 = await driver.findOne(TEST_OBJECT, created2.id);
            expect(updated1.age).toBe(31);
            expect(updated2.age).toBe(26);
        });

        it('should execute bulkDelete command', async () => {
            if (!driver) return;

            const created1 = await driver.create(TEST_OBJECT, { name: 'Liam' });
            const created2 = await driver.create(TEST_OBJECT, { name: 'Mia' });
            const created3 = await driver.create(TEST_OBJECT, { name: 'Noah' });

            const result = await driver.executeCommand({
                type: 'bulkDelete',
                object: TEST_OBJECT,
                ids: [created1.id, created2.id, created3.id]
            });

            expect(result.success).toBe(true);
            expect(result.affected).toBe(3);

            const all = await driver.find(TEST_OBJECT, {});
            expect(all).toHaveLength(0);
        });

        it('should handle command errors gracefully', async () => {
            if (!driver) return;

            const result = await driver.executeCommand({
                type: 'create',
                object: TEST_OBJECT,
                data: undefined // Missing data
            } as any);

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
            expect(result.affected).toBe(0);
        });
    });
});
