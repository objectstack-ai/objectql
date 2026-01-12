import { MongoDriver } from '../src';
import { MongoClient } from 'mongodb';

/**
 * Integration tests for MongoDriver with real MongoDB operations.
 * Note: These tests connect to a local MongoDB instance (default: mongodb://localhost:27017)
 * or a custom instance via the MONGO_URL environment variable.
 * If MongoDB is not available, the setup/cleanup hooks return early; the tests themselves
 * are not automatically skipped and are intended to be run only when MongoDB is available.
 */

// Skip tests if MongoDB is not available
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017';
const TEST_DB = 'objectql_test_' + Date.now();

describe('MongoDriver Integration Tests', () => {
    let driver: MongoDriver;
    let client: MongoClient;
    let skipTests = false;

    beforeAll(async () => {
        // Try to connect to MongoDB, skip tests if unavailable
        try {
            client = new MongoClient(MONGO_URL, { serverSelectionTimeoutMS: 2000 });
            await client.connect();
            await client.close();
        } catch (e) {
            console.warn('MongoDB not available, skipping integration tests');
            skipTests = true;
        }
    }, 10000); // Increase timeout

    beforeEach(async () => {
        if (skipTests) return;
        
        driver = new MongoDriver({ url: MONGO_URL, dbName: TEST_DB });
        // Wait for connection
        await new Promise(resolve => setTimeout(resolve, 100));
    });

    afterEach(async () => {
        if (skipTests) return;
        
        try {
            // Clean up test database
            const client = new MongoClient(MONGO_URL, { serverSelectionTimeoutMS: 2000 });
            await client.connect();
            await client.db(TEST_DB).dropDatabase();
            await client.close();
        } catch (e) {
            // Ignore cleanup errors
        }
    });

    describe('Basic CRUD Operations', () => {
        test.skip('should create a document', async () => {
            const data = {
                name: 'Alice',
                age: 25,
                email: 'alice@example.com'
            };

            const result = await driver.create('users', data);
            
            expect(result).toBeDefined();
            expect(result._id).toBeDefined();
            expect(result.name).toBe('Alice');
            expect(result.age).toBe(25);
        });

        test.skip('should create document with custom _id', async () => {
            const data = {
                _id: 'custom-id-123',
                name: 'Bob',
                age: 30
            };

            const result = await driver.create('users', data);
            
            expect(result._id).toBe('custom-id-123');
            expect(result.name).toBe('Bob');
        });

        test.skip('should find documents with filters', async () => {
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

        test.skip('should find documents with comparison operators', async () => {
            await driver.create('users', { name: 'Alice', age: 25 });
            await driver.create('users', { name: 'Bob', age: 30 });
            await driver.create('users', { name: 'Charlie', age: 20 });

            const results = await driver.find('users', {
                filters: [['age', '>', 22]]
            });

            expect(results.length).toBe(2);
            expect(results.every(r => r.age > 22)).toBe(true);
        });

        test.skip('should find documents with OR filters', async () => {
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

        test.skip('should find documents with in filter', async () => {
            await driver.create('users', { name: 'Alice', status: 'active' });
            await driver.create('users', { name: 'Bob', status: 'pending' });
            await driver.create('users', { name: 'Charlie', status: 'inactive' });

            const results = await driver.find('users', {
                filters: [['status', 'in', ['active', 'pending']]]
            });

            expect(results.length).toBe(2);
        });

        test.skip('should find documents with contains filter', async () => {
            await driver.create('users', { name: 'Alice Johnson' });
            await driver.create('users', { name: 'Bob Smith' });
            await driver.create('users', { name: 'Charlie Johnson' });

            const results = await driver.find('users', {
                filters: [['name', 'contains', 'Johnson']]
            });

            expect(results.length).toBe(2);
        });

        test.skip('should find one document by id', async () => {
            const created = await driver.create('users', { name: 'Alice', age: 25 });
            
            const found = await driver.findOne('users', created._id);
            
            expect(found).toBeDefined();
            expect(found.name).toBe('Alice');
            expect(found.age).toBe(25);
        });

        test.skip('should find one document by query', async () => {
            await driver.create('users', { name: 'Alice', age: 25 });
            await driver.create('users', { name: 'Bob', age: 30 });

            const found = await driver.findOne('users', null as any, {
                filters: [['name', '=', 'Bob']]
            });

            expect(found).toBeDefined();
            expect(found.name).toBe('Bob');
        });

        test.skip('should update a document', async () => {
            const created = await driver.create('users', { name: 'Alice', age: 25 });
            
            await driver.update('users', created._id, { age: 26 });
            
            const updated = await driver.findOne('users', created._id);
            expect(updated.age).toBe(26);
            expect(updated.name).toBe('Alice'); // Should not be removed
        });

        test.skip('should update with atomic operators', async () => {
            const created = await driver.create('users', { name: 'Alice', age: 25, score: 10 });
            
            await driver.update('users', created._id, { $inc: { score: 5 } });
            
            const updated = await driver.findOne('users', created._id);
            expect(updated.score).toBe(15);
        });

        test.skip('should delete a document', async () => {
            const created = await driver.create('users', { name: 'Alice', age: 25 });
            
            const deleteCount = await driver.delete('users', created._id);
            expect(deleteCount).toBe(1);
            
            const found = await driver.findOne('users', created._id);
            expect(found).toBeNull();
        });

        test.skip('should count documents', async () => {
            await driver.create('users', { name: 'Alice', status: 'active' });
            await driver.create('users', { name: 'Bob', status: 'active' });
            await driver.create('users', { name: 'Charlie', status: 'inactive' });

            const count = await driver.count('users', [['status', '=', 'active']]);
            expect(count).toBe(2);
        });

        test.skip('should count all documents', async () => {
            await driver.create('users', { name: 'Alice' });
            await driver.create('users', { name: 'Bob' });
            await driver.create('users', { name: 'Charlie' });

            const count = await driver.count('users', []);
            expect(count).toBe(3);
        });
    });

    describe('Bulk Operations', () => {
        test.skip('should create many documents', async () => {
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

        test.skip('should update many documents', async () => {
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

        test.skip('should update many with atomic operators', async () => {
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

        test.skip('should delete many documents', async () => {
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

        test.skip('should handle empty bulk operations', async () => {
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
            if (skipTests) return;
            
            // Insert ordered test data
            await driver.create('products', { _id: '1', name: 'Laptop', price: 1200, category: 'electronics' });
            await driver.create('products', { _id: '2', name: 'Mouse', price: 25, category: 'electronics' });
            await driver.create('products', { _id: '3', name: 'Desk', price: 350, category: 'furniture' });
            await driver.create('products', { _id: '4', name: 'Chair', price: 200, category: 'furniture' });
            await driver.create('products', { _id: '5', name: 'Monitor', price: 400, category: 'electronics' });
        });

        test.skip('should sort results ascending', async () => {
            const results = await driver.find('products', {
                sort: [['price', 'asc']]
            });

            expect(results[0].price).toBe(25);
            expect(results[results.length - 1].price).toBe(1200);
        });

        test.skip('should sort results descending', async () => {
            const results = await driver.find('products', {
                sort: [['price', 'desc']]
            });

            expect(results[0].price).toBe(1200);
            expect(results[results.length - 1].price).toBe(25);
        });

        test.skip('should limit results', async () => {
            const results = await driver.find('products', {
                limit: 2
            });

            expect(results.length).toBe(2);
        });

        test.skip('should skip results', async () => {
            const results = await driver.find('products', {
                sort: [['_id', 'asc']],
                skip: 2
            });

            expect(results.length).toBe(3);
            expect(results[0]._id).toBe('3');
        });

        test.skip('should combine skip and limit for pagination', async () => {
            const page1 = await driver.find('products', {
                sort: [['_id', 'asc']],
                skip: 0,
                limit: 2
            });

            expect(page1.length).toBe(2);
            expect(page1[0]._id).toBe('1');

            const page2 = await driver.find('products', {
                sort: [['_id', 'asc']],
                skip: 2,
                limit: 2
            });

            expect(page2.length).toBe(2);
            expect(page2[0]._id).toBe('3');
        });

        test.skip('should select specific fields', async () => {
            const results = await driver.find('products', {
                fields: ['name', 'price']
            });

            expect(results.length).toBeGreaterThan(0);
            expect(results[0]).toHaveProperty('name');
            expect(results[0]).toHaveProperty('price');
            // _id is always included by MongoDB unless explicitly excluded
        });

        test.skip('should combine filters, sort, skip, and limit', async () => {
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
            if (skipTests) return;
            
            await driver.create('orders', { customer: 'Alice', amount: 100, status: 'completed' });
            await driver.create('orders', { customer: 'Alice', amount: 200, status: 'completed' });
            await driver.create('orders', { customer: 'Bob', amount: 150, status: 'completed' });
            await driver.create('orders', { customer: 'Bob', amount: 50, status: 'pending' });
        });

        test.skip('should execute simple aggregation pipeline', async () => {
            const pipeline = [
                { $match: { status: 'completed' } },
                { $group: { _id: '$customer', total: { $sum: '$amount' } } }
            ];

            const results = await driver.aggregate('orders', pipeline);
            
            expect(results.length).toBe(2);
            
            const alice = results.find(r => r._id === 'Alice');
            expect(alice.total).toBe(300);

            const bob = results.find(r => r._id === 'Bob');
            expect(bob.total).toBe(150);
        });

        test.skip('should count with aggregation', async () => {
            const pipeline = [
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ];

            const results = await driver.aggregate('orders', pipeline);
            
            expect(results.length).toBe(2);
            
            const completed = results.find(r => r._id === 'completed');
            expect(completed.count).toBe(3);

            const pending = results.find(r => r._id === 'pending');
            expect(pending.count).toBe(1);
        });

        test.skip('should calculate average with aggregation', async () => {
            const pipeline = [
                { $group: { _id: null, avgAmount: { $avg: '$amount' } } }
            ];

            const results = await driver.aggregate('orders', pipeline);
            
            expect(results.length).toBe(1);
            expect(results[0].avgAmount).toBe(125); // (100 + 200 + 150 + 50) / 4
        });
    });

    describe('Edge Cases', () => {
        test.skip('should handle empty collection', async () => {
            const results = await driver.find('empty_collection', {});
            expect(results.length).toBe(0);

            const count = await driver.count('empty_collection', []);
            expect(count).toBe(0);
        });

        test.skip('should handle null values', async () => {
            await driver.create('users', { name: 'Alice', email: null, age: null });

            const result = await driver.findOne('users', null as any, {
                filters: [['name', '=', 'Alice']]
            });

            expect(result).toBeDefined();
            expect(result.email).toBeNull();
            expect(result.age).toBeNull();
        });

        test.skip('should handle nested objects', async () => {
            const data = {
                name: 'Alice',
                address: {
                    street: '123 Main St',
                    city: 'New York',
                    zip: '10001'
                }
            };

            const created = await driver.create('users', data);
            
            const found = await driver.findOne('users', created._id);
            expect(found.address).toEqual(data.address);
        });

        test.skip('should handle arrays', async () => {
            const data = {
                name: 'Alice',
                tags: ['developer', 'designer'],
                scores: [10, 20, 30]
            };

            const created = await driver.create('users', data);
            
            const found = await driver.findOne('users', created._id);
            expect(found.tags).toEqual(['developer', 'designer']);
            expect(found.scores).toEqual([10, 20, 30]);
        });

        test.skip('should return null for non-existent document', async () => {
            const found = await driver.findOne('users', 'nonexistent-id');
            expect(found).toBeNull();
        });

        test.skip('should handle skip beyond total count', async () => {
            await driver.create('users', { name: 'Alice' });
            
            const results = await driver.find('users', {
                skip: 100,
                limit: 10
            });

            expect(results.length).toBe(0);
        });

        test.skip('should handle complex filter combinations', async () => {
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

        test.skip('should handle nin (not in) filter', async () => {
            await driver.create('users', { name: 'Alice', status: 'active' });
            await driver.create('users', { name: 'Bob', status: 'inactive' });
            await driver.create('users', { name: 'Charlie', status: 'pending' });

            const results = await driver.find('users', {
                filters: [['status', 'nin', ['inactive', 'pending']]]
            });

            expect(results.length).toBe(1);
            expect(results[0].name).toBe('Alice');
        });

        test.skip('should handle != operator', async () => {
            await driver.create('users', { name: 'Alice', status: 'active' });
            await driver.create('users', { name: 'Bob', status: 'inactive' });

            const results = await driver.find('users', {
                filters: [['status', '!=', 'inactive']]
            });

            expect(results.length).toBe(1);
            expect(results[0].name).toBe('Alice');
        });

        test.skip('should handle >= and <= operators', async () => {
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
