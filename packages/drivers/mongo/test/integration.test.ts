/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { MongoDriver } from '../src';
import { MongoClient } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';

/**
 * Integration tests for MongoDriver with real MongoDB operations.
 * Uses mongodb-memory-server for isolated testing without external dependencies.
 * 
 * These tests will gracefully skip if MongoDB binary cannot be downloaded
 * (e.g., in CI environments with network restrictions).
 */

let mongoAvailable = true;

// Helper to check if MongoDB is available and skip if not
const skipIfMongoUnavailable = () => {
    if (!mongoAvailable) {
        console.log('⊘ Skipping test: MongoDB not available');
        return true;
    }
    return false;
};

describe('MongoDriver Integration Tests', () => {
    let driver: MongoDriver;
    let client: MongoClient;
    let mongod: MongoMemoryServer;
    let mongoUrl: string;
    let dbName: string;

    beforeAll(async () => {
        try {
            // Use existing MONGO_URL if provided (e.g. implementation in CI services)
            // Otherwise start an in-memory instance
            if (process.env.MONGO_URL) {
                mongoUrl = process.env.MONGO_URL;
            } else {
                mongod = await MongoMemoryServer.create();
                mongoUrl = mongod.getUri();
            }
            
            dbName = 'objectql_test_' + Date.now();
            
            // ensure connection works
            client = new MongoClient(mongoUrl);
            await client.connect();
        } catch (error: any) {
            console.warn('⚠️  MongoDB setup failed, integration tests will be skipped.');
            console.warn('   Reason:', error.message);
            console.warn('   This is expected in CI environments with network restrictions.');
            mongoAvailable = false;
        }
    }, 60000); // startup can take time

    afterAll(async () => {
        if (client) await client.close();
        if (mongod) await mongod.stop();
    });

    beforeEach(async () => {
        if (!mongoAvailable) return;
        driver = new MongoDriver({ url: mongoUrl, dbName: dbName });
        // Wait for connection
        await new Promise(resolve => setTimeout(resolve, 100));
    });

    afterEach(async () => {
        if (!mongoAvailable) return;
        if (driver) {
            await driver.disconnect();
        }

        try {
            // Clean up test database
            // Reuse the client connected in beforeAll instead of creating a new one every time if possible,
            // but for safety let's use the one we established or just use the driver?
            // Driver doesn't have dropDatabase.
            // Use the client we created in beforeAll
            await client.db(dbName).dropDatabase();
        } catch (e) {
            // Ignore cleanup errors
        }
    });

    describe('Basic CRUD Operations', () => {
        test('should create a document', async () => {
            if (skipIfMongoUnavailable()) return;
            
            const data = {
                name: 'Alice',
                age: 25,
                email: 'alice@example.com'
            };

            const result = await driver.create('users', data);
            
            expect(result).toBeDefined();
            expect(result.id).toBeDefined();
            expect(result.name).toBe('Alice');
            expect(result.age).toBe(25);
        });

        test('should create document with custom _id', async () => {
            if (skipIfMongoUnavailable()) return;
            const data = {
                _id: 'custom-id-123',
                name: 'Bob',
                age: 30
            };

            const result = await driver.create('users', data);
            
            expect(result.id).toBe('custom-id-123');
            expect(result.name).toBe('Bob');
        });

        test('should find documents with filters', async () => {
            if (skipIfMongoUnavailable()) return;
            // Insert test data
            await driver.create('users', { name: 'Alice', age: 25, status: 'active' });
            await driver.create('users', { name: 'Bob', age: 30, status: 'active' });
            await driver.create('users', { name: 'Charlie', age: 20, status: 'inactive' });

            const results = await driver.find('users', {
                filters: [['status', '=', 'active']]
            });

            expect(results.length).toBe(2);
            expect(results.every(r => r.status === 'active')).toBe(true);
        });

        test('should find documents with comparison operators', async () => {
            if (skipIfMongoUnavailable()) return;
            await driver.create('users', { name: 'Alice', age: 25 });
            await driver.create('users', { name: 'Bob', age: 30 });
            await driver.create('users', { name: 'Charlie', age: 20 });

            const results = await driver.find('users', {
                filters: [['age', '>', 22]]
            });

            expect(results.length).toBe(2);
            expect(results.every(r => r.age > 22)).toBe(true);
        });

        test('should find documents with OR filters', async () => {
            if (skipIfMongoUnavailable()) return;
            await driver.create('users', { name: 'Alice', age: 25 });
            await driver.create('users', { name: 'Bob', age: 30 });
            await driver.create('users', { name: 'Charlie', age: 20 });

            const results = await driver.find('users', {
                filters: [
                    ['age', '=', 25],
                    'or',
                    ['name', '=', 'Bob']
                ]
            });

            expect(results.length).toBe(2);
        });

        test('should find documents with in filter', async () => {
            if (skipIfMongoUnavailable()) return;
            await driver.create('users', { name: 'Alice', status: 'active' });
            await driver.create('users', { name: 'Bob', status: 'pending' });
            await driver.create('users', { name: 'Charlie', status: 'inactive' });

            const results = await driver.find('users', {
                filters: [['status', 'in', ['active', 'pending']]]
            });

            expect(results.length).toBe(2);
        });

        test('should find documents with contains filter', async () => {
            if (skipIfMongoUnavailable()) return;
            await driver.create('users', { name: 'Alice Johnson' });
            await driver.create('users', { name: 'Bob Smith' });
            await driver.create('users', { name: 'Charlie Johnson' });

            const results = await driver.find('users', {
                filters: [['name', 'contains', 'Johnson']]
            });

            expect(results.length).toBe(2);
        });

        test('should find one document by id', async () => {
            if (skipIfMongoUnavailable()) return;
            const created = await driver.create('users', { name: 'Alice', age: 25 });
            
            const found = await driver.findOne('users', created.id);
            
            expect(found).toBeDefined();
            expect(found.name).toBe('Alice');
            expect(found.age).toBe(25);
        });

        test('should find one document by query', async () => {
            if (skipIfMongoUnavailable()) return;
            await driver.create('users', { name: 'Alice', age: 25 });
            await driver.create('users', { name: 'Bob', age: 30 });

            const found = await driver.findOne('users', null as any, {
                filters: [['name', '=', 'Bob']]
            });

            expect(found).toBeDefined();
            expect(found.name).toBe('Bob');
        });

        test('should update a document', async () => {
            if (skipIfMongoUnavailable()) return;
            const created = await driver.create('users', { name: 'Alice', age: 25 });
            
            await driver.update('users', created.id, { age: 26 });
            
            const updated = await driver.findOne('users', created.id);
            expect(updated.age).toBe(26);
            expect(updated.name).toBe('Alice'); // Should not be removed
        });

        test('should update with atomic operators', async () => {
            if (skipIfMongoUnavailable()) return;
            const created = await driver.create('users', { name: 'Alice', age: 25, score: 10 });
            
            await driver.update('users', created.id, { $inc: { score: 5 } });
            
            const updated = await driver.findOne('users', created.id);
            expect(updated.score).toBe(15);
        });

        test('should delete a document', async () => {
            if (skipIfMongoUnavailable()) return;
            const created = await driver.create('users', { name: 'Alice', age: 25 });
            
            const deleteCount = await driver.delete('users', created.id);
            expect(deleteCount).toBe(1);
            
            const found = await driver.findOne('users', created.id);
            expect(found).toBeNull();
        });

        test('should count documents', async () => {
            if (skipIfMongoUnavailable()) return;
            await driver.create('users', { name: 'Alice', status: 'active' });
            await driver.create('users', { name: 'Bob', status: 'active' });
            await driver.create('users', { name: 'Charlie', status: 'inactive' });

            const count = await driver.count('users', [['status', '=', 'active']]);
            expect(count).toBe(2);
        });

        test('should count all documents', async () => {
            if (skipIfMongoUnavailable()) return;
            await driver.create('users', { name: 'Alice' });
            await driver.create('users', { name: 'Bob' });
            await driver.create('users', { name: 'Charlie' });

            const count = await driver.count('users', []);
            expect(count).toBe(3);
        });
    });

    describe('Bulk Operations', () => {
        test('should create many documents', async () => {
            if (skipIfMongoUnavailable()) return;
            const data = [
                { name: 'Alice', age: 25 },
                { name: 'Bob', age: 30 },
                { name: 'Charlie', age: 35 }
            ];

            const result = await driver.createMany('users', data);
            
            expect(result).toBeDefined();
            expect(Object.keys(result).length).toBe(3);

            const count = await driver.count('users', []);
            expect(count).toBe(3);
        });

        test('should update many documents', async () => {
            if (skipIfMongoUnavailable()) return;
            await driver.create('users', { name: 'Alice', status: 'pending' });
            await driver.create('users', { name: 'Bob', status: 'pending' });
            await driver.create('users', { name: 'Charlie', status: 'active' });

            const modifiedCount = await driver.updateMany('users',
                [['status', '=', 'pending']],
                { status: 'active' }
            );

            expect(modifiedCount).toBe(2);

            const results = await driver.find('users', {
                filters: [['status', '=', 'active']]
            });
            expect(results.length).toBe(3);
        });

        test('should update many with atomic operators', async () => {
            if (skipIfMongoUnavailable()) return;
            await driver.create('users', { name: 'Alice', score: 10, active: true });
            await driver.create('users', { name: 'Bob', score: 20, active: true });
            await driver.create('users', { name: 'Charlie', score: 30, active: false });

            const modifiedCount = await driver.updateMany('users',
                [['active', '=', true]],
                { $inc: { score: 5 } }
            );

            expect(modifiedCount).toBe(2);

            const alice = await driver.findOne('users', null as any, {
                filters: [['name', '=', 'Alice']]
            });
            expect(alice.score).toBe(15);
        });

        test('should delete many documents', async () => {
            if (skipIfMongoUnavailable()) return;
            await driver.create('users', { name: 'Alice', status: 'inactive' });
            await driver.create('users', { name: 'Bob', status: 'inactive' });
            await driver.create('users', { name: 'Charlie', status: 'active' });

            const deletedCount = await driver.deleteMany('users',
                [['status', '=', 'inactive']]
            );

            expect(deletedCount).toBe(2);

            const remaining = await driver.count('users', []);
            expect(remaining).toBe(1);
        });

        test('should handle empty bulk operations', async () => {
            if (skipIfMongoUnavailable()) return;
            const result = await driver.createMany('users', []);
            expect(result).toBeDefined();

            const updated = await driver.updateMany('users',
                [['name', '=', 'nonexistent']],
                { status: 'updated' }
            );
            expect(updated).toBe(0);

            const deleted = await driver.deleteMany('users',
                [['name', '=', 'nonexistent']]
            );
            expect(deleted).toBe(0);
        });
    });

    describe('Query Options', () => {
        beforeEach(async () => {
            if (!mongoAvailable) return;
            
            // Insert ordered test data
            await driver.create('products', { _id: '1', name: 'Laptop', price: 1200, category: 'electronics' });
            await driver.create('products', { _id: '2', name: 'Mouse', price: 25, category: 'electronics' });
            await driver.create('products', { _id: '3', name: 'Desk', price: 350, category: 'furniture' });
            await driver.create('products', { _id: '4', name: 'Chair', price: 200, category: 'furniture' });
            await driver.create('products', { _id: '5', name: 'Monitor', price: 400, category: 'electronics' });
        });

        test('should sort results ascending', async () => {
            if (skipIfMongoUnavailable()) return;
            const results = await driver.find('products', {
                sort: [['price', 'asc']]
            });

            expect(results[0].price).toBe(25);
            expect(results[results.length - 1].price).toBe(1200);
        });

        test('should sort results descending', async () => {
            if (skipIfMongoUnavailable()) return;
            const results = await driver.find('products', {
                sort: [['price', 'desc']]
            });

            expect(results[0].price).toBe(1200);
            expect(results[results.length - 1].price).toBe(25);
        });

        test('should limit results', async () => {
            if (skipIfMongoUnavailable()) return;
            const results = await driver.find('products', {
                limit: 2
            });

            expect(results.length).toBe(2);
        });

        test('should skip results', async () => {
            if (skipIfMongoUnavailable()) return;
            const results = await driver.find('products', {
                sort: [['_id', 'asc']],
                skip: 2
            });

            expect(results.length).toBe(3);
            expect(results[0].id).toBe('3');
        });

        test('should combine skip and limit for pagination', async () => {
            if (skipIfMongoUnavailable()) return;
            const page1 = await driver.find('products', {
                sort: [['_id', 'asc']],
                skip: 0,
                limit: 2
            });

            expect(page1.length).toBe(2);
            expect(page1[0].id).toBe('1');

            const page2 = await driver.find('products', {
                sort: [['_id', 'asc']],
                skip: 2,
                limit: 2
            });

            expect(page2.length).toBe(2);
            expect(page2[0].id).toBe('3');
        });

        test('should select specific fields', async () => {
            if (skipIfMongoUnavailable()) return;
            const results = await driver.find('products', {
                fields: ['name', 'price']
            });

            expect(results.length).toBeGreaterThan(0);
            expect(results[0]).toHaveProperty('name');
            expect(results[0]).toHaveProperty('price');
            // _id is always included by MongoDB unless explicitly excluded
        });

        test('should combine filters, sort, skip, and limit', async () => {
            if (skipIfMongoUnavailable()) return;
            const results = await driver.find('products', {
                filters: [['category', '=', 'electronics']],
                sort: [['price', 'desc']],
                skip: 1,
                limit: 1
            });

            expect(results.length).toBe(1);
            expect(results[0].name).toBe('Monitor'); // Second most expensive electronics
        });
    });

    describe('Aggregate Operations', () => {
        beforeEach(async () => {
            if (!mongoAvailable) return;
            
            await driver.create('orders', { customer: 'Alice', amount: 100, status: 'completed' });
            await driver.create('orders', { customer: 'Alice', amount: 200, status: 'completed' });
            await driver.create('orders', { customer: 'Bob', amount: 150, status: 'completed' });
            await driver.create('orders', { customer: 'Bob', amount: 50, status: 'pending' });
        });

        test('should execute simple aggregation pipeline', async () => {
            if (skipIfMongoUnavailable()) return;
            const pipeline = [
                { $match: { status: 'completed' } },
                { $group: { _id: '$customer', total: { $sum: '$amount' } } }
            ];

            const results = await driver.aggregate('orders', pipeline);
            
            expect(results.length).toBe(2);
            
            const alice = results.find(r => r.id === 'Alice');
            expect(alice.total).toBe(300);

            const bob = results.find(r => r.id === 'Bob');
            expect(bob.total).toBe(150);
        });

        test('should count with aggregation', async () => {
            if (skipIfMongoUnavailable()) return;
            const pipeline = [
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ];

            const results = await driver.aggregate('orders', pipeline);
            
            expect(results.length).toBe(2);
            
            const completed = results.find(r => r.id === 'completed');
            expect(completed.count).toBe(3);

            const pending = results.find(r => r.id === 'pending');
            expect(pending.count).toBe(1);
        });

        test('should calculate average with aggregation', async () => {
            if (skipIfMongoUnavailable()) return;
            const pipeline = [
                { $group: { _id: null, avgAmount: { $avg: '$amount' } } }
            ];

            const results = await driver.aggregate('orders', pipeline);
            
            expect(results.length).toBe(1);
            expect(results[0].avgAmount).toBe(125); // (100 + 200 + 150 + 50) / 4
        });
    });

    describe('Edge Cases', () => {
        test('should handle empty collection', async () => {
            if (skipIfMongoUnavailable()) return;
            const results = await driver.find('empty_collection', {});
            expect(results.length).toBe(0);

            const count = await driver.count('empty_collection', []);
            expect(count).toBe(0);
        });

        test('should handle null values', async () => {
            if (skipIfMongoUnavailable()) return;
            await driver.create('users', { name: 'Alice', email: null, age: null });

            const result = await driver.findOne('users', null as any, {
                filters: [['name', '=', 'Alice']]
            });

            expect(result).toBeDefined();
            expect(result.email).toBeNull();
            expect(result.age).toBeNull();
        });

        test('should handle nested objects', async () => {
            if (skipIfMongoUnavailable()) return;
            const data = {
                name: 'Alice',
                address: {
                    street: '123 Main St',
                    city: 'New York',
                    zip: '10001'
                }
            };

            const created = await driver.create('users', data);
            
            const found = await driver.findOne('users', created.id);
            expect(found.address).toEqual(data.address);
        });

        test('should handle arrays', async () => {
            if (skipIfMongoUnavailable()) return;
            const data = {
                name: 'Alice',
                tags: ['developer', 'designer'],
                scores: [10, 20, 30]
            };

            const created = await driver.create('users', data);
            
            const found = await driver.findOne('users', created.id);
            expect(found.tags).toEqual(['developer', 'designer']);
            expect(found.scores).toEqual([10, 20, 30]);
        });

        test('should return null for non-existent document', async () => {
            if (skipIfMongoUnavailable()) return;
            const found = await driver.findOne('users', 'nonexistent-id');
            expect(found).toBeNull();
        });

        test('should handle skip beyond total count', async () => {
            if (skipIfMongoUnavailable()) return;
            await driver.create('users', { name: 'Alice' });
            
            const results = await driver.find('users', {
                skip: 100,
                limit: 10
            });

            expect(results.length).toBe(0);
        });

        test('should handle complex filter combinations', async () => {
            if (skipIfMongoUnavailable()) return;
            await driver.create('users', { name: 'Alice', age: 25, status: 'active' });
            await driver.create('users', { name: 'Bob', age: 30, status: 'active' });
            await driver.create('users', { name: 'Charlie', age: 20, status: 'inactive' });

            const results = await driver.find('users', {
                filters: [
                    ['age', '>', 22],
                    'and',
                    ['status', '=', 'active']
                ]
            });

            expect(results.length).toBe(2);
        });

        test('should handle nested filter groups', async () => {
            if (skipIfMongoUnavailable()) return;
            // Create test data matching the SQL driver's advanced test
            await driver.create('orders', { customer: 'Alice', product: 'Laptop', amount: 1200.00, quantity: 1, status: 'completed' });
            await driver.create('orders', { customer: 'Bob', product: 'Mouse', amount: 25.50, quantity: 2, status: 'completed' });
            await driver.create('orders', { customer: 'Alice', product: 'Keyboard', amount: 75.00, quantity: 1, status: 'pending' });
            await driver.create('orders', { customer: 'Charlie', product: 'Monitor', amount: 350.00, quantity: 1, status: 'completed' });

            // Nested filter: (status = 'completed' AND amount > 100) OR (customer = 'Alice' AND status = 'pending')
            const results = await driver.find('orders', {
                filters: [
                    [
                        ['status', '=', 'completed'],
                        'and',
                        ['amount', '>', 100]
                    ],
                    'or',
                    [
                        ['customer', '=', 'Alice'],
                        'and',
                        ['status', '=', 'pending']
                    ]
                ]
            });

            // Should match: Alice's Laptop (completed, 1200), Charlie's Monitor (completed, 350), Alice's Keyboard (pending)
            expect(results.length).toBe(3);
            
            const customers = results.map(r => r.customer).sort();
            expect(customers).toEqual(['Alice', 'Alice', 'Charlie']);
        });

        test('should handle deeply nested filters', async () => {
            if (skipIfMongoUnavailable()) return;
            await driver.create('users', { name: 'Alice', age: 25, status: 'active', role: 'admin' });
            await driver.create('users', { name: 'Bob', age: 30, status: 'active', role: 'user' });
            await driver.create('users', { name: 'Charlie', age: 20, status: 'inactive', role: 'user' });
            await driver.create('users', { name: 'Dave', age: 35, status: 'active', role: 'admin' });

            // Complex nested: ((age > 22 AND status = 'active') OR role = 'admin') AND name != 'Bob'
            const results = await driver.find('users', {
                filters: [
                    [
                        [
                            ['age', '>', 22],
                            'and',
                            ['status', '=', 'active']
                        ],
                        'or',
                        ['role', '=', 'admin']
                    ],
                    'and',
                    ['name', '!=', 'Bob']
                ]
            });

            // Should match: Alice (age>22 AND active), Dave (age>22 AND active AND admin)
            // Should NOT match: Bob (excluded by name filter), Charlie (age<=22, inactive, not admin)
            expect(results.length).toBe(2);
            const names = results.map(r => r.name).sort();
            expect(names).toEqual(['Alice', 'Dave']);
        });


        test('should handle nin (not in) filter', async () => {
            if (skipIfMongoUnavailable()) return;
            await driver.create('users', { name: 'Alice', status: 'active' });
            await driver.create('users', { name: 'Bob', status: 'inactive' });
            await driver.create('users', { name: 'Charlie', status: 'pending' });

            const results = await driver.find('users', {
                filters: [['status', 'nin', ['inactive', 'pending']]]
            });

            expect(results.length).toBe(1);
            expect(results[0].name).toBe('Alice');
        });

        test('should handle != operator', async () => {
            if (skipIfMongoUnavailable()) return;
            await driver.create('users', { name: 'Alice', status: 'active' });
            await driver.create('users', { name: 'Bob', status: 'inactive' });

            const results = await driver.find('users', {
                filters: [['status', '!=', 'inactive']]
            });

            expect(results.length).toBe(1);
            expect(results[0].name).toBe('Alice');
        });

        test('should handle >= and <= operators', async () => {
            if (skipIfMongoUnavailable()) return;
            await driver.create('users', { name: 'Alice', age: 25 });
            await driver.create('users', { name: 'Bob', age: 30 });
            await driver.create('users', { name: 'Charlie', age: 35 });

            const results = await driver.find('users', {
                filters: [
                    ['age', '>=', 25],
                    'and',
                    ['age', '<=', 30]
                ]
            });

            expect(results.length).toBe(2);
        });
    });
});
