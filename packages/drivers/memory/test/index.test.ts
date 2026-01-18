/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Memory Driver Tests
 * 
 * Comprehensive test suite for the in-memory ObjectQL driver.
 */

import { MemoryDriver } from '../src';

describe('MemoryDriver', () => {
    let driver: MemoryDriver;
    const TEST_OBJECT = 'test_users';

    beforeEach(() => {
        driver = new MemoryDriver();
    });

    afterEach(async () => {
        await driver.clear();
    });

    describe('Initialization', () => {
        it('should create an empty driver', () => {
            expect(driver).toBeDefined();
            expect(driver.getSize()).toBe(0);
        });

        it('should initialize with initial data', () => {
            const initialData = {
                users: [
                    { id: '1', name: 'Alice', email: 'alice@example.com' },
                    { id: '2', name: 'Bob', email: 'bob@example.com' }
                ]
            };

            const driverWithData = new MemoryDriver({ initialData });
            expect(driverWithData.getSize()).toBe(2);
        });

        it('should support strict mode', async () => {
            const strictDriver = new MemoryDriver({ strictMode: true });
            
            await expect(
                strictDriver.update(TEST_OBJECT, 'non-existent', { name: 'Test' })
            ).rejects.toThrow('Record with id \'non-existent\' not found');
        });
    });

    describe('CRUD Operations', () => {
        it('should create a record', async () => {
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
            const result = await driver.create(TEST_OBJECT, {
                id: 'custom-123',
                name: 'Bob',
                email: 'bob@example.com'
            });

            expect(result.id).toBe('custom-123');
            expect(result.name).toBe('Bob');
        });

        it('should throw error on duplicate ID', async () => {
            await driver.create(TEST_OBJECT, {
                id: 'test-1',
                name: 'Alice'
            });

            await expect(
                driver.create(TEST_OBJECT, {
                    id: 'test-1',
                    name: 'Bob'
                })
            ).rejects.toThrow('Record with id \'test-1\' already exists');
        });

        it('should find a record by ID', async () => {
            const created = await driver.create(TEST_OBJECT, {
                name: 'Alice',
                email: 'alice@example.com'
            });

            const found = await driver.findOne(TEST_OBJECT, created.id);
            expect(found).toBeDefined();
            expect(found.name).toBe('Alice');
            expect(found.email).toBe('alice@example.com');
        });

        it('should return null for non-existent ID', async () => {
            const result = await driver.findOne(TEST_OBJECT, 'non-existent-id');
            expect(result).toBeNull();
        });

        it('should update a record', async () => {
            const created = await driver.create(TEST_OBJECT, {
                name: 'Alice',
                email: 'alice@example.com'
            });

            // Small delay to ensure updated_at timestamp differs
            await new Promise(resolve => setTimeout(resolve, 10));

            const updated = await driver.update(TEST_OBJECT, created.id, {
                email: 'alice.new@example.com'
            });

            expect(updated.email).toBe('alice.new@example.com');
            expect(updated.name).toBe('Alice'); // Unchanged
            expect(updated.created_at).toBe(created.created_at); // Preserved
            expect(updated.updated_at).not.toBe(created.updated_at); // Changed
        });

        it('should delete a record', async () => {
            const created = await driver.create(TEST_OBJECT, {
                name: 'Alice'
            });

            const deleted = await driver.delete(TEST_OBJECT, created.id);
            expect(deleted).toBe(true);

            const found = await driver.findOne(TEST_OBJECT, created.id);
            expect(found).toBeNull();
        });

        it('should return false when deleting non-existent record', async () => {
            const deleted = await driver.delete(TEST_OBJECT, 'non-existent');
            expect(deleted).toBe(false);
        });
    });

    describe('Query Operations', () => {
        beforeEach(async () => {
            // Create test data
            await driver.create(TEST_OBJECT, {
                id: '1',
                name: 'Alice',
                email: 'alice@example.com',
                role: 'admin',
                age: 30
            });
            await driver.create(TEST_OBJECT, {
                id: '2',
                name: 'Bob',
                email: 'bob@example.com',
                role: 'user',
                age: 25
            });
            await driver.create(TEST_OBJECT, {
                id: '3',
                name: 'Charlie',
                email: 'charlie@example.com',
                role: 'user',
                age: 35
            });
        });

        it('should find all records', async () => {
            const results = await driver.find(TEST_OBJECT, {});
            expect(results).toHaveLength(3);
        });

        it('should filter records with = operator', async () => {
            const results = await driver.find(TEST_OBJECT, {
                filters: [['role', '=', 'user']]
            });
            expect(results).toHaveLength(2);
            expect(results.every(r => r.role === 'user')).toBe(true);
        });

        it('should filter records with > operator', async () => {
            const results = await driver.find(TEST_OBJECT, {
                filters: [['age', '>', 25]]
            });
            expect(results).toHaveLength(2);
            expect(results.every(r => r.age > 25)).toBe(true);
        });

        it('should combine filters with OR', async () => {
            const results = await driver.find(TEST_OBJECT, {
                filters: [
                    ['role', '=', 'admin'],
                    'or',
                    ['age', '>', 30]
                ]
            });
            expect(results).toHaveLength(2); // Alice (admin) and Charlie (age > 30)
        });

        it('should sort records ascending', async () => {
            const results = await driver.find(TEST_OBJECT, {
                sort: [['age', 'asc']]
            });
            expect(results[0].age).toBe(25);
            expect(results[1].age).toBe(30);
            expect(results[2].age).toBe(35);
        });

        it('should support pagination with skip and limit', async () => {
            const results = await driver.find(TEST_OBJECT, {
                sort: [['age', 'asc']],
                skip: 1,
                limit: 1
            });
            expect(results).toHaveLength(1);
            expect(results[0].age).toBe(30);
        });
    });

    describe('Count Operations', () => {
        beforeEach(async () => {
            await driver.create(TEST_OBJECT, { role: 'admin', age: 30 });
            await driver.create(TEST_OBJECT, { role: 'user', age: 25 });
            await driver.create(TEST_OBJECT, { role: 'user', age: 35 });
        });

        it('should count all records', async () => {
            const count = await driver.count(TEST_OBJECT, []);
            expect(count).toBe(3);
        });

        it('should count filtered records', async () => {
            const count = await driver.count(TEST_OBJECT, [['role', '=', 'user']]);
            expect(count).toBe(2);
        });
    });

    describe('Bulk Operations', () => {
        it('should create multiple records', async () => {
            const results = await driver.createMany(TEST_OBJECT, [
                { name: 'Alice' },
                { name: 'Bob' },
                { name: 'Charlie' }
            ]);
            expect(results).toHaveLength(3);
            expect(results[0].name).toBe('Alice');
        });

        it('should update multiple records', async () => {
            await driver.create(TEST_OBJECT, { id: '1', role: 'user' });
            await driver.create(TEST_OBJECT, { id: '2', role: 'user' });
            await driver.create(TEST_OBJECT, { id: '3', role: 'admin' });

            const result = await driver.updateMany(
                TEST_OBJECT,
                [['role', '=', 'user']],
                { status: 'active' }
            );

            expect(result.modifiedCount).toBe(2);
        });

        it('should delete multiple records', async () => {
            await driver.create(TEST_OBJECT, { id: '1', role: 'user' });
            await driver.create(TEST_OBJECT, { id: '2', role: 'user' });
            await driver.create(TEST_OBJECT, { id: '3', role: 'admin' });

            const result = await driver.deleteMany(TEST_OBJECT, [
                ['role', '=', 'user']
            ]);

            expect(result.deletedCount).toBe(2);
        });
    });
});
