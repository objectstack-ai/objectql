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
                where: { role: 'user' }
            });
            expect(results).toHaveLength(2);
            expect(results.every(r => r.role === 'user')).toBe(true);
        });

        it('should filter records with > operator', async () => {
            const results = await driver.find(TEST_OBJECT, {
                where: { age: { $gt: 25 } }
            });
            expect(results).toHaveLength(2);
            expect(results.every(r => r.age > 25)).toBe(true);
        });

        it('should combine filters with OR', async () => {
            const results = await driver.find(TEST_OBJECT, {
                where: {
                    $or: [
                        { role: 'admin' },
                        { age: { $gt: 30 } }
                    ]
                }
            });
            expect(results).toHaveLength(2); // Alice (admin) and Charlie (age > 30)
        });

        it('should sort records ascending', async () => {
            const results = await driver.find(TEST_OBJECT, {
                orderBy: [{ field: 'age', order: 'asc' }]
            });
            expect(results[0].age).toBe(25);
            expect(results[1].age).toBe(30);
            expect(results[2].age).toBe(35);
        });

        it('should support pagination with skip and limit', async () => {
            const results = await driver.find(TEST_OBJECT, {
                orderBy: [{ field: 'age', order: 'asc' }],
                offset: 1,
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
            const count = await driver.count(TEST_OBJECT, {});
            expect(count).toBe(3);
        });

        it('should count filtered records', async () => {
            const count = await driver.count(TEST_OBJECT, { role: 'user' });
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
                { role: 'user' },
                { status: 'active' }
            );

            expect(result.modifiedCount).toBe(2);
        });

        it('should delete multiple records', async () => {
            await driver.create(TEST_OBJECT, { id: '1', role: 'user' });
            await driver.create(TEST_OBJECT, { id: '2', role: 'user' });
            await driver.create(TEST_OBJECT, { id: '3', role: 'admin' });

            const result = await driver.deleteMany(TEST_OBJECT, { role: 'user' });

            expect(result.deletedCount).toBe(2);
        });
    });

    describe('Aggregate Method', () => {
        beforeEach(async () => {
            // Create test data for aggregation
            await driver.create('orders', { id: '1', customer: 'Alice', product: 'Laptop', amount: 1200, quantity: 1, status: 'completed' });
            await driver.create('orders', { id: '2', customer: 'Bob', product: 'Mouse', amount: 25, quantity: 2, status: 'completed' });
            await driver.create('orders', { id: '3', customer: 'Alice', product: 'Keyboard', amount: 75, quantity: 1, status: 'pending' });
            await driver.create('orders', { id: '4', customer: 'Charlie', product: 'Monitor', amount: 350, quantity: 1, status: 'completed' });
            await driver.create('orders', { id: '5', customer: 'Bob', product: 'Laptop', amount: 1200, quantity: 1, status: 'cancelled' });
        });

        it('should aggregate with $match stage', async () => {
            const results = await driver.aggregate('orders', [
                { $match: { status: 'completed' } }
            ]);

            expect(results).toBeDefined();
            expect(results.length).toBe(3);
            expect(results.every((r: any) => r.status === 'completed')).toBe(true);
        });

        it('should aggregate with $group and $sum', async () => {
            const results = await driver.aggregate('orders', [
                { $match: { status: 'completed' } },
                { 
                    $group: { 
                        _id: '$customer', 
                        totalAmount: { $sum: '$amount' } 
                    } 
                }
            ]);

            expect(results).toBeDefined();
            expect(results.length).toBeGreaterThan(0);
            
            const alice = results.find((r: any) => r._id === 'Alice');
            expect(alice).toBeDefined();
            expect(alice.totalAmount).toBe(1200);
        });

        it('should aggregate with $group and $avg', async () => {
            const results = await driver.aggregate('orders', [
                { 
                    $group: { 
                        _id: null, 
                        avgAmount: { $avg: '$amount' } 
                    } 
                }
            ]);

            expect(results).toBeDefined();
            expect(results.length).toBe(1);
            expect(results[0].avgAmount).toBeCloseTo(570, 0);
        });

        it('should aggregate with $project stage', async () => {
            const results = await driver.aggregate('orders', [
                { $match: { status: 'completed' } },
                { 
                    $project: { 
                        customer: 1, 
                        product: 1, 
                        total: { $multiply: ['$amount', '$quantity'] }
                    } 
                }
            ]);

            expect(results).toBeDefined();
            expect(results.length).toBe(3);
            expect(results[0]).toHaveProperty('total');
        });

        it('should aggregate with $sort stage', async () => {
            const results = await driver.aggregate('orders', [
                { $match: { status: 'completed' } },
                { $sort: { amount: -1 } }
            ]);

            expect(results).toBeDefined();
            expect(results.length).toBe(3);
            expect(results[0].amount).toBe(1200);
            expect(results[2].amount).toBe(25);
        });
    });

    describe('Transaction Support', () => {
        it('should begin and commit a transaction', async () => {
            const tx = await driver.beginTransaction();
            expect(tx).toBeDefined();
            expect(tx.id).toBeDefined();

            await driver.create(TEST_OBJECT, { id: '1', name: 'Alice' });
            await driver.commitTransaction(tx);

            const result = await driver.findOne(TEST_OBJECT, '1');
            expect(result).toBeDefined();
            expect(result.name).toBe('Alice');
        });

        it('should rollback a transaction', async () => {
            await driver.create(TEST_OBJECT, { id: '1', name: 'Alice' });
            
            const tx = await driver.beginTransaction();
            
            await driver.update(TEST_OBJECT, '1', { name: 'Bob' });
            await driver.create(TEST_OBJECT, { id: '2', name: 'Charlie' });
            
            await driver.rollbackTransaction(tx);
            
            const result1 = await driver.findOne(TEST_OBJECT, '1');
            expect(result1.name).toBe('Alice'); // Should be reverted
            
            const result2 = await driver.findOne(TEST_OBJECT, '2');
            expect(result2).toBeNull(); // Should not exist
        });

        it('should handle multiple transactions', async () => {
            const tx1 = await driver.beginTransaction();
            const tx2 = await driver.beginTransaction();
            
            expect(tx1.id).not.toBe(tx2.id);
            
            await driver.commitTransaction(tx1);
            await driver.commitTransaction(tx2);
        });

        it('should throw error for invalid transaction', async () => {
            await expect(
                driver.commitTransaction({ id: 'invalid-tx-id' })
            ).rejects.toThrow();
        });
    });

    describe('Indexing', () => {
        it('should build indexes on initialization', () => {
            const indexedDriver = new MemoryDriver({
                initialData: {
                    users: [
                        { id: '1', name: 'Alice', email: 'alice@example.com', role: 'admin' },
                        { id: '2', name: 'Bob', email: 'bob@example.com', role: 'user' },
                        { id: '3', name: 'Charlie', email: 'charlie@example.com', role: 'user' }
                    ]
                },
                indexes: {
                    users: ['email', 'role']
                }
            });

            expect(indexedDriver).toBeDefined();
            expect(indexedDriver.getSize()).toBe(3);
        });

        it('should update indexes when creating records', async () => {
            const indexedDriver = new MemoryDriver({
                indexes: {
                    users: ['email']
                }
            });

            await indexedDriver.create('users', { id: '1', name: 'Alice', email: 'alice@example.com' });
            await indexedDriver.create('users', { id: '2', name: 'Bob', email: 'bob@example.com' });

            const results = await indexedDriver.find('users', {});
            expect(results.length).toBe(2);
        });

        it('should update indexes when updating records', async () => {
            const indexedDriver = new MemoryDriver({
                indexes: {
                    users: ['email']
                }
            });

            await indexedDriver.create('users', { id: '1', name: 'Alice', email: 'alice@example.com' });
            await indexedDriver.update('users', '1', { email: 'alice.new@example.com' });

            const result = await indexedDriver.findOne('users', '1');
            expect(result.email).toBe('alice.new@example.com');
        });

        it('should remove from indexes when deleting records', async () => {
            const indexedDriver = new MemoryDriver({
                indexes: {
                    users: ['email']
                }
            });

            await indexedDriver.create('users', { id: '1', name: 'Alice', email: 'alice@example.com' });
            await indexedDriver.delete('users', '1');

            const result = await indexedDriver.findOne('users', '1');
            expect(result).toBeNull();
        });
    });

    describe('Persistence', () => {
        const testFilePath = '/tmp/objectql-memory-test.json';

        afterEach(() => {
            // Clean up test file
            try {
                const fs = require('fs');
                if (fs.existsSync(testFilePath)) {
                    fs.unlinkSync(testFilePath);
                }
            } catch (e) {
                // Ignore errors
            }
        });

        it('should save data to disk on disconnect', async () => {
            const persistentDriver = new MemoryDriver({
                persistence: {
                    filePath: testFilePath,
                    autoSaveInterval: 10000 // Long interval, we'll manually trigger
                }
            });

            await persistentDriver.create('users', { id: '1', name: 'Alice' });
            await persistentDriver.disconnect();

            const fs = require('fs');
            expect(fs.existsSync(testFilePath)).toBe(true);

            const fileData = JSON.parse(fs.readFileSync(testFilePath, 'utf8'));
            expect(fileData.store).toBeDefined();
            expect(fileData.store['users:1']).toBeDefined();
            expect(fileData.store['users:1'].name).toBe('Alice');
        });

        it('should load data from disk on initialization', async () => {
            // First, create a driver and save data
            const driver1 = new MemoryDriver({
                persistence: {
                    filePath: testFilePath,
                    autoSaveInterval: 10000
                }
            });

            await driver1.create('users', { id: '1', name: 'Alice' });
            await driver1.create('users', { id: '2', name: 'Bob' });
            await driver1.disconnect();

            // Now create a new driver that should load the data
            const driver2 = new MemoryDriver({
                persistence: {
                    filePath: testFilePath,
                    autoSaveInterval: 10000
                }
            });

            const users = await driver2.find('users', {});
            expect(users.length).toBe(2);
            expect(users.some(u => u.name === 'Alice')).toBe(true);
            expect(users.some(u => u.name === 'Bob')).toBe(true);

            await driver2.disconnect();
        });

        it('should handle missing persistence file gracefully', () => {
            const driver = new MemoryDriver({
                persistence: {
                    filePath: '/tmp/nonexistent-file.json',
                    autoSaveInterval: 10000
                }
            });

            expect(driver).toBeDefined();
            expect(driver.getSize()).toBe(0);
        });
    });
});
