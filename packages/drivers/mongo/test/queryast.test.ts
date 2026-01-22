/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { MongoDriver } from '../src';
import { MongoMemoryServer } from 'mongodb-memory-server';

/**
 * QueryAST format tests
 * 
 * Tests the driver's compatibility with @objectstack/spec QueryAST format
 * which uses:
 * - 'top' instead of 'limit'
 * - 'aggregations' instead of 'aggregate'
 * - sort as array of {field, order} objects
 */
describe('MongoDriver (QueryAST Format)', () => {
    let driver: MongoDriver;
    let mongoServer: MongoMemoryServer;

    beforeAll(async () => {
        // Start in-memory MongoDB server
        mongoServer = await MongoMemoryServer.create();
    });

    afterAll(async () => {
        await mongoServer.stop();
    });

    beforeEach(async () => {
        const uri = mongoServer.getUri();
        driver = new MongoDriver({ url: uri, dbName: 'test' });
        await driver.connect();
        
        // Insert test data
        const products = [
            { id: '1', name: 'Laptop', price: 1200, category: 'Electronics' },
            { id: '2', name: 'Mouse', price: 25, category: 'Electronics' },
            { id: '3', name: 'Desk', price: 350, category: 'Furniture' },
            { id: '4', name: 'Chair', price: 200, category: 'Furniture' },
            { id: '5', name: 'Monitor', price: 400, category: 'Electronics' }
        ];
        
        for (const product of products) {
            await driver.create('products', product);
        }
    });

    afterEach(async () => {
        await driver.disconnect();
    });

    describe('Driver Metadata', () => {
        it('should expose driver metadata for ObjectStack compatibility', () => {
            expect(driver.name).toBe('MongoDriver');
            expect(driver.version).toBeDefined();
            expect(driver.supports).toBeDefined();
            expect(driver.supports.transactions).toBe(true);
            expect(driver.supports.joins).toBe(false);
            expect(driver.supports.fullTextSearch).toBe(true);
            expect(driver.supports.jsonFields).toBe(true);
            expect(driver.supports.arrayFields).toBe(true);
        });
    });

    describe('Lifecycle Methods', () => {
        it('should support connect method', async () => {
            const uri = mongoServer.getUri();
            const testDriver = new MongoDriver({ url: uri, dbName: 'test2' });
            await expect(testDriver.connect()).resolves.toBeUndefined();
            await testDriver.disconnect();
        });

        it('should support checkHealth method', async () => {
            const healthy = await driver.checkHealth();
            expect(healthy).toBe(true);
        });

        it('should support disconnect method', async () => {
            const uri = mongoServer.getUri();
            const testDriver = new MongoDriver({ url: uri, dbName: 'test3' });
            await testDriver.connect();
            
            await expect(testDriver.disconnect()).resolves.toBeUndefined();
            // After disconnect, health check should fail
            const healthy = await testDriver.checkHealth();
            expect(healthy).toBe(false);
        });
    });

    describe('QueryAST Format Support', () => {
        it('should support QueryAST with "top" instead of "limit"', async () => {
            const query = {
                fields: ['name', 'price'],
                top: 2,
                sort: [{ field: 'price', order: 'asc' as const }]
            };
            const results = await driver.find('products', query);
            
            expect(results.length).toBe(2);
            expect(results[0].name).toBe('Mouse');
            expect(results[1].name).toBe('Chair');
        });

        it('should support QueryAST sort format with object notation', async () => {
            const query = {
                fields: ['name', 'category', 'price'],
                sort: [
                    { field: 'category', order: 'asc' as const },
                    { field: 'price', order: 'desc' as const }
                ]
            };
            const results = await driver.find('products', query);
            
            // Electronics: Laptop(1200), Monitor(400), Mouse(25)
            // Furniture: Desk(350), Chair(200)
            expect(results.length).toBe(5);
            expect(results[0].name).toBe('Laptop'); // Electronics, highest price
            expect(results[3].name).toBe('Desk'); // Furniture, highest price
        });

        it('should support QueryAST with filters and pagination', async () => {
            const query = {
                filters: [['category', '=', 'Electronics']],
                skip: 1,
                top: 1,
                sort: [{ field: 'price', order: 'asc' as const }]
            };
            const results = await driver.find('products', query);
            
            expect(results.length).toBe(1);
            expect(results[0].name).toBe('Monitor'); // Second cheapest electronics
        });

        it('should support count with QueryAST format', async () => {
            const query = {
                filters: [['price', '>', 300]]
            };
            const count = await driver.count('products', query);
            expect(count).toBe(3); // Laptop, Desk, Monitor
        });
    });

    describe('Backward Compatibility', () => {
        it('should still support legacy UnifiedQuery format with "limit"', async () => {
            const query = {
                fields: ['name'],
                limit: 2,
                sort: [['price', 'asc']]
            };
            const results = await driver.find('products', query);
            
            expect(results.length).toBe(2);
            expect(results[0].name).toBe('Mouse');
        });

        it('should support legacy sort format with arrays', async () => {
            const query = {
                fields: ['name'],
                sort: [['price', 'desc']],
                limit: 3
            };
            const results = await driver.find('products', query);
            
            expect(results.length).toBe(3);
            expect(results[0].name).toBe('Laptop'); // Highest price
            expect(results[1].name).toBe('Monitor');
            expect(results[2].name).toBe('Desk');
        });
    });

    describe('Mixed Format Support', () => {
        it('should handle query with both top and skip', async () => {
            const query = {
                top: 3,
                skip: 2,
                sort: [{ field: 'name', order: 'asc' as const }]
            };
            const results = await driver.find('products', query);
            
            expect(results.length).toBe(3);
            // Alphabetically: Chair, Desk, Laptop, Monitor, Mouse
            // Skip 2 (Chair, Desk), take 3 (Laptop, Monitor, Mouse)
            expect(results[0].name).toBe('Laptop');
            expect(results[1].name).toBe('Monitor');
            expect(results[2].name).toBe('Mouse');
        });

        it('should support filtering with object sort format', async () => {
            const query = {
                filters: [['category', '=', 'Electronics']],
                sort: [{ field: 'price', order: 'desc' as const }],
                top: 2
            };
            const results = await driver.find('products', query);
            
            expect(results.length).toBe(2);
            expect(results[0].name).toBe('Laptop');
            expect(results[1].name).toBe('Monitor');
        });
    });

    describe('Field Mapping', () => {
        it('should support querying with id field in QueryAST format', async () => {
            const query = {
                filters: [['id', '=', '1']],
                fields: ['id', 'name']
            };
            const results = await driver.find('products', query);
            
            expect(results.length).toBe(1);
            expect(results[0].id).toBe('1');
            expect(results[0].name).toBe('Laptop');
        });

        it('should support sorting by id field', async () => {
            const query = {
                sort: [{ field: 'id', order: 'desc' as const }],
                top: 2
            };
            const results = await driver.find('products', query);
            
            expect(results.length).toBe(2);
            expect(results[0].id).toBe('5');
            expect(results[1].id).toBe('4');
        });
    });
});
