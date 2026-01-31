/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as fs from 'fs';
import * as path from 'path';
import { FileSystemDriver } from '../src/index';

describe('FileSystemDriver', () => {
    const testDataDir = path.join(__dirname, '.test-data');
    let driver: FileSystemDriver;

    beforeEach(() => {
        // Clean up test directory
        if (fs.existsSync(testDataDir)) {
            fs.rmSync(testDataDir, { recursive: true });
        }
        
        driver = new FileSystemDriver({
            dataDir: testDataDir,
            prettyPrint: true,
            enableBackup: true
        });
    });

    afterEach(async () => {
        await driver.disconnect();
        
        // Clean up test directory
        if (fs.existsSync(testDataDir)) {
            fs.rmSync(testDataDir, { recursive: true });
        }
    });

    describe('Basic CRUD Operations', () => {
        test('should create a record', async () => {
            const result = await driver.create('users', {
                name: 'Alice',
                email: 'alice@example.com'
            });

            expect(result).toHaveProperty('id');
            expect(result.name).toBe('Alice');
            expect(result.email).toBe('alice@example.com');
            expect(result).toHaveProperty('created_at');
            expect(result).toHaveProperty('updated_at');
        });

        test('should create a file for the object', async () => {
            await driver.create('users', { name: 'Bob' });

            const filePath = path.join(testDataDir, 'users.json');
            expect(fs.existsSync(filePath)).toBe(true);

            const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            expect(Array.isArray(content)).toBe(true);
            expect(content.length).toBe(1);
        });

        test('should find all records', async () => {
            await driver.create('users', { name: 'Alice' });
            await driver.create('users', { name: 'Bob' });

            const results = await driver.find('users', {});
            expect(results.length).toBe(2);
        });

        test('should find a single record by ID', async () => {
            const created = await driver.create('users', { name: 'Charlie' });
            const found = await driver.findOne('users', created.id);

            expect(found).not.toBeNull();
            expect(found.name).toBe('Charlie');
            expect(found.id).toBe(created.id);
        });

        test('should update a record', async () => {
            const created = await driver.create('users', { name: 'David', age: 25 });
            
            // Add small delay to ensure different timestamp
            await new Promise(resolve => setTimeout(resolve, 10));
            
            const updated = await driver.update('users', created.id, { age: 26 });

            expect(updated.age).toBe(26);
            expect(updated.name).toBe('David');
            expect(updated.id).toBe(created.id);
            expect(updated.updated_at).not.toBe(created.updated_at);
        });

        test('should delete a record', async () => {
            const created = await driver.create('users', { name: 'Eve' });
            const deleted = await driver.delete('users', created.id);

            expect(deleted).toBe(true);

            const found = await driver.findOne('users', created.id);
            expect(found).toBeNull();
        });

        test('should throw error on duplicate ID', async () => {
            await driver.create('users', { id: 'user-1', name: 'Alice' });

            await expect(
                driver.create('users', { id: 'user-1', name: 'Bob' })
            ).rejects.toThrow();
        });
    });

    describe('Query Operations', () => {
        beforeEach(async () => {
            await driver.create('products', { id: 'p1', name: 'Laptop', price: 1000, category: 'electronics' });
            await driver.create('products', { id: 'p2', name: 'Mouse', price: 25, category: 'electronics' });
            await driver.create('products', { id: 'p3', name: 'Desk', price: 300, category: 'furniture' });
            await driver.create('products', { id: 'p4', name: 'Chair', price: 150, category: 'furniture' });
        });

        test('should filter records with equality', async () => {
            const results = await driver.find('products', {
                where: { category: { $eq: 'electronics' } }
            });

            expect(results.length).toBe(2);
            expect(results.every(r => r.category === 'electronics')).toBe(true);
        });

        test('should filter records with comparison operators', async () => {
            const results = await driver.find('products', {
                where: { price: { $gt: 100 } }
            });

            expect(results.length).toBe(3);
            expect(results.every(r => r.price > 100)).toBe(true);
        });

        test('should filter with IN operator', async () => {
            const results = await driver.find('products', {
                where: { id: { $in: ['p1', 'p3'] } }
            });

            expect(results.length).toBe(2);
            expect(results.map(r => r.id).sort()).toEqual(['p1', 'p3']);
        });

        test('should filter with LIKE operator', async () => {
            const results = await driver.find('products', {
                where: { name: { $regex: 'a' } }
            });

            expect(results.length).toBe(2); // Laptop, Chair
        });

        test('should sort records', async () => {
            const results = await driver.find('products', {
                orderBy: [{ field: 'price', order: 'asc' }]
            });

            expect(results[0].name).toBe('Mouse');
            expect(results[3].name).toBe('Laptop');
        });

        test('should paginate records', async () => {
            const page1 = await driver.find('products', {
                orderBy: [{ field: 'price', order: 'asc' }],
                limit: 2
            });

            expect(page1.length).toBe(2);
            expect(page1[0].name).toBe('Mouse');

            const page2 = await driver.find('products', {
                orderBy: [{ field: 'price', order: 'asc' }],
                offset: 2,
                limit: 2
            });

            expect(page2.length).toBe(2);
            expect(page2[0].name).toBe('Desk');
        });

        test('should project specific fields', async () => {
            const results = await driver.find('products', {
                fields: ['name', 'price']
            });

            expect(results.length).toBe(4);
            expect(results[0]).toHaveProperty('name');
            expect(results[0]).toHaveProperty('price');
            expect(results[0]).not.toHaveProperty('category');
        });

        test('should count all records', async () => {
            const count = await driver.count('products', {});
            expect(count).toBe(4);
        });

        test('should count filtered records', async () => {
            const count = await driver.count('products', {
                where: { category: { $eq: 'electronics' } }
            });
            expect(count).toBe(2);
        });

        test('should get distinct values', async () => {
            const categories = await driver.distinct('products', 'category');
            expect(categories.sort()).toEqual(['electronics', 'furniture']);
        });
    });

    describe('Bulk Operations', () => {
        test('should create many records', async () => {
            const data = [
                { name: 'User 1' },
                { name: 'User 2' },
                { name: 'User 3' }
            ];

            const results = await driver.createMany('users', data);
            expect(results.length).toBe(3);

            const all = await driver.find('users', {});
            expect(all.length).toBe(3);
        });

        test('should update many records', async () => {
            await driver.create('tasks', { id: 't1', status: 'pending', priority: 'high' });
            await driver.create('tasks', { id: 't2', status: 'pending', priority: 'low' });
            await driver.create('tasks', { id: 't3', status: 'completed', priority: 'high' });

            const result = await driver.updateMany(
                'tasks',
                { status: { $eq: 'pending' } },
                { status: 'in_progress' }
            );

            expect(result.modifiedCount).toBe(2);

            const updated = await driver.find('tasks', {
                where: { status: { $eq: 'in_progress' } }
            });
            expect(updated.length).toBe(2);
        });

        test('should delete many records', async () => {
            await driver.create('logs', { id: 'l1', level: 'info' });
            await driver.create('logs', { id: 'l2', level: 'debug' });
            await driver.create('logs', { id: 'l3', level: 'error' });

            const result = await driver.deleteMany(
                'logs',
                { level: { $in: ['info', 'debug'] } }
            );

            expect(result.deletedCount).toBe(2);

            const remaining = await driver.find('logs', {});
            expect(remaining.length).toBe(1);
            expect(remaining[0].level).toBe('error');
        });
    });

    describe('File System Operations', () => {
        test('should create backup file on update', async () => {
            const created = await driver.create('configs', { key: 'theme', value: 'dark' });
            
            // First update - creates backup
            await driver.update('configs', created.id, { value: 'light' });

            const backupPath = path.join(testDataDir, 'configs.json.bak');
            expect(fs.existsSync(backupPath)).toBe(true);
        });

        test('should handle missing file gracefully', async () => {
            const results = await driver.find('nonexistent', {});
            expect(results).toEqual([]);
        });

        test('should write pretty-printed JSON', async () => {
            await driver.create('settings', { key: 'test', value: 'data' });

            const filePath = path.join(testDataDir, 'settings.json');
            const content = fs.readFileSync(filePath, 'utf8');
            
            // Pretty-printed JSON should have newlines
            expect(content).toContain('\n');
        });

        test('should handle concurrent writes', async () => {
            // Create multiple records concurrently
            await Promise.all([
                driver.create('concurrent', { name: 'Item 1' }),
                driver.create('concurrent', { name: 'Item 2' }),
                driver.create('concurrent', { name: 'Item 3' })
            ]);

            const results = await driver.find('concurrent', {});
            expect(results.length).toBe(3);
        });
    });

    describe('Edge Cases', () => {
        test('should handle empty object name', async () => {
            await expect(
                driver.create('', { name: 'test' })
            ).rejects.toThrow();
        });

        test('should preserve custom ID', async () => {
            const result = await driver.create('items', {
                id: 'custom-id-123',
                name: 'Custom Item'
            });

            expect(result.id).toBe('custom-id-123');
        });

        test('should handle _id field', async () => {
            const result = await driver.create('docs', {
                _id: 'mongo-style-id',
                title: 'Document'
            });

            const found = await driver.findOne('docs', 'mongo-style-id');
            expect(found).not.toBeNull();
            expect(found.title).toBe('Document');
        });

        test('should return null for non-existent record', async () => {
            const found = await driver.findOne('users', 'non-existent-id');
            expect(found).toBeNull();
        });

        test('should handle update of non-existent record', async () => {
            const result = await driver.update('users', 'non-existent', { name: 'Test' });
            expect(result).toBeNull();
        });
    });

    describe('New Features', () => {
        test('should load initial data', async () => {
            const newDriver = new FileSystemDriver({
                dataDir: path.join(testDataDir, 'initial'),
                initialData: {
                    products: [
                        { id: 'p1', name: 'Product 1', price: 100 },
                        { id: 'p2', name: 'Product 2', price: 200 }
                    ]
                }
            });

            const results = await newDriver.find('products', {});
            expect(results.length).toBe(2);
            expect(results[0].name).toBe('Product 1');
            
            await newDriver.disconnect();
        });

        test('should clear specific object data', async () => {
            await driver.create('temp', { name: 'Test' });
            
            const before = await driver.find('temp', {});
            expect(before.length).toBe(1);

            await driver.clear('temp');

            const after = await driver.find('temp', {});
            expect(after.length).toBe(0);
        });

        test('should clear all data', async () => {
            await driver.create('obj1', { name: 'Test 1' });
            await driver.create('obj2', { name: 'Test 2' });

            await driver.clearAll();

            const obj1 = await driver.find('obj1', {});
            const obj2 = await driver.find('obj2', {});
            
            expect(obj1.length).toBe(0);
            expect(obj2.length).toBe(0);
        });

        test('should invalidate cache', async () => {
            await driver.create('cache_test', { name: 'Test' });
            
            // Verify cache is populated
            expect(driver.getCacheSize()).toBeGreaterThan(0);

            driver.invalidateCache('cache_test');

            // Cache should reload on next access
            const results = await driver.find('cache_test', {});
            expect(results.length).toBe(1);
        });

        test('should get cache size', async () => {
            await driver.create('size1', { name: 'Test 1' });
            await driver.create('size2', { name: 'Test 2' });

            const size = driver.getCacheSize();
            expect(size).toBeGreaterThanOrEqual(2);
        });

        test('should handle empty JSON file', async () => {
            const filePath = path.join(testDataDir, 'empty.json');
            fs.writeFileSync(filePath, '', 'utf8');

            const results = await driver.find('empty', {});
            expect(results).toEqual([]);
        });

        test('should handle invalid JSON file', async () => {
            const filePath = path.join(testDataDir, 'invalid.json');
            fs.writeFileSync(filePath, '{invalid json}', 'utf8');

            try {
                await driver.find('invalid', {});
                fail('Should have thrown an error');
            } catch (error: any) {
                expect(error.code).toBe('INVALID_JSON_FORMAT');
                expect(error.message).toContain('invalid JSON');
            }
        });
    });

    describe('DriverInterface v4.0 Methods', () => {
        describe('executeQuery', () => {
            test('should execute query with QueryAST format', async () => {
                // Create test data
                await driver.create('users', { name: 'Alice', age: 30 });
                await driver.create('users', { name: 'Bob', age: 25 });
                await driver.create('users', { name: 'Charlie', age: 35 });

                // Execute query
                const result = await driver.executeQuery({
                    object: 'users',
                    fields: ['name', 'age'],
                    where: {
                        age: { $gt: 25 }
                    },
                    orderBy: [{ field: 'age', order: 'asc' }],
                    limit: 10,
                    offset: 0
                });

                expect(result.value).toHaveLength(2);
                expect(result.value[0].name).toBe('Alice');
                expect(result.value[1].name).toBe('Charlie');
                expect(result.count).toBe(2);
            });

            test('should handle AND filters', async () => {
                await driver.create('users', { name: 'Alice', age: 30, city: 'NYC' });
                await driver.create('users', { name: 'Bob', age: 25, city: 'LA' });
                await driver.create('users', { name: 'Charlie', age: 35, city: 'NYC' });

                const result = await driver.executeQuery({
                    object: 'users',
                    where: {
                        $and: [
                            { age: { $gt: 25 } },
                            { city: { $eq: 'NYC' } }
                        ]
                    }
                });

                expect(result.value).toHaveLength(2);
                expect(result.value.every((u: any) => u.city === 'NYC')).toBe(true);
            });

            test('should handle OR filters', async () => {
                await driver.create('users', { name: 'Alice', age: 30 });
                await driver.create('users', { name: 'Bob', age: 25 });
                await driver.create('users', { name: 'Charlie', age: 35 });

                const result = await driver.executeQuery({
                    object: 'users',
                    where: {
                        $or: [
                            { age: { $eq: 25 } },
                            { age: { $eq: 35 } }
                        ]
                    }
                });

                expect(result.value).toHaveLength(2);
                expect(result.value.some((u: any) => u.name === 'Bob')).toBe(true);
                expect(result.value.some((u: any) => u.name === 'Charlie')).toBe(true);
            });

            test('should handle pagination with offset and limit', async () => {
                await driver.create('users', { name: 'Alice', age: 30 });
                await driver.create('users', { name: 'Bob', age: 25 });
                await driver.create('users', { name: 'Charlie', age: 35 });

                const result = await driver.executeQuery({
                    object: 'users',
                    orderBy: [{ field: 'name', order: 'asc' }],
                    offset: 1,
                    limit: 1
                });

                expect(result.value).toHaveLength(1);
                expect(result.value[0].name).toBe('Bob');
            });
        });

        describe('executeCommand', () => {
            test('should execute create command', async () => {
                const result = await driver.executeCommand({
                    type: 'create',
                    object: 'users',
                    data: { name: 'Alice', email: 'alice@test.com' }
                });

                expect(result.success).toBe(true);
                expect(result.affected).toBe(1);
                expect(result.data).toHaveProperty('id');
                expect(result.data.name).toBe('Alice');
            });

            test('should execute update command', async () => {
                const created = await driver.create('users', { name: 'Alice', age: 30 });

                const result = await driver.executeCommand({
                    type: 'update',
                    object: 'users',
                    id: created.id,
                    data: { age: 31 }
                });

                expect(result.success).toBe(true);
                expect(result.affected).toBe(1);
                expect(result.data.age).toBe(31);
            });

            test('should execute delete command', async () => {
                const created = await driver.create('users', { name: 'Alice' });

                const result = await driver.executeCommand({
                    type: 'delete',
                    object: 'users',
                    id: created.id
                });

                expect(result.success).toBe(true);
                expect(result.affected).toBe(1);

                const remaining = await driver.find('users', {});
                expect(remaining).toHaveLength(0);
            });

            test('should execute bulkCreate command', async () => {
                const result = await driver.executeCommand({
                    type: 'bulkCreate',
                    object: 'users',
                    records: [
                        { name: 'Alice', age: 30 },
                        { name: 'Bob', age: 25 },
                        { name: 'Charlie', age: 35 }
                    ]
                });

                expect(result.success).toBe(true);
                expect(result.affected).toBe(3);
                expect(result.data).toHaveLength(3);
            });

            test('should execute bulkUpdate command', async () => {
                const user1 = await driver.create('users', { name: 'Alice', age: 30 });
                const user2 = await driver.create('users', { name: 'Bob', age: 25 });

                const result = await driver.executeCommand({
                    type: 'bulkUpdate',
                    object: 'users',
                    updates: [
                        { id: user1.id, data: { age: 31 } },
                        { id: user2.id, data: { age: 26 } }
                    ]
                });

                expect(result.success).toBe(true);
                expect(result.affected).toBe(2);
                expect(result.data).toHaveLength(2);
            });

            test('should execute bulkDelete command', async () => {
                const user1 = await driver.create('users', { name: 'Alice' });
                const user2 = await driver.create('users', { name: 'Bob' });
                const user3 = await driver.create('users', { name: 'Charlie' });

                const result = await driver.executeCommand({
                    type: 'bulkDelete',
                    object: 'users',
                    ids: [user1.id, user2.id]
                });

                expect(result.success).toBe(true);
                expect(result.affected).toBe(2);

                const remaining = await driver.find('users', {});
                expect(remaining).toHaveLength(1);
                expect(remaining[0].name).toBe('Charlie');
            });

            test('should return error for invalid command', async () => {
                const result = await driver.executeCommand({
                    type: 'create',
                    object: 'users'
                    // Missing data
                } as any);

                expect(result.success).toBe(false);
                expect(result.affected).toBe(0);
                expect(result.error).toBeDefined();
            });
        });
    });
    
    describe('Aggregation Operations', () => {
        beforeEach(async () => {
            // Create sample data for aggregation tests
            await driver.create('orders', { id: '1', customer: 'Alice', product: 'Phone', amount: 500, quantity: 2, status: 'completed' });
            await driver.create('orders', { id: '2', customer: 'Bob', product: 'Tablet', amount: 300, quantity: 1, status: 'pending' });
            await driver.create('orders', { id: '3', customer: 'Alice', product: 'Laptop', amount: 700, quantity: 1, status: 'completed' });
            await driver.create('orders', { id: '4', customer: 'Charlie', product: 'Monitor', amount: 250, quantity: 2, status: 'completed' });
            await driver.create('orders', { id: '5', customer: 'Bob', product: 'Keyboard', amount: 100, quantity: 1, status: 'cancelled' });
        });

        test('should aggregate with $match stage', async () => {
            const results = await driver.aggregate('orders', [
                { $match: { status: 'completed' } }
            ]);

            expect(results).toBeDefined();
            expect(results.length).toBe(3);
            expect(results.every((r: any) => r.status === 'completed')).toBe(true);
        });

        test('should aggregate with $group and $sum', async () => {
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

        test('should aggregate with $group and $avg', async () => {
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
            expect(results[0].avgAmount).toBeCloseTo(370, 0);
        });
    });
});
