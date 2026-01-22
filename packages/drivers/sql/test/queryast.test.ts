/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SqlDriver } from '../src';

/**
 * QueryAST format tests
 * 
 * Tests the driver's compatibility with @objectstack/spec QueryAST format
 * which uses:
 * - 'top' instead of 'limit'
 * - 'aggregations' instead of 'aggregate'
 * - sort as array of {field, order} objects
 */
describe('SqlDriver (QueryAST Format)', () => {
    let driver: SqlDriver;

    beforeEach(async () => {
        // Init ephemeral in-memory database
        driver = new SqlDriver({
            client: 'sqlite3',
            connection: {
                filename: ':memory:'
            },
            useNullAsDefault: true
        });
        
        const k = (driver as any).knex;
        
        await k.schema.createTable('products', (t: any) => {
            t.string('id').primary();
            t.string('name');
            t.float('price');
            t.string('category');
        });

        await k('products').insert([
            { id: '1', name: 'Laptop', price: 1200, category: 'Electronics' },
            { id: '2', name: 'Mouse', price: 25, category: 'Electronics' },
            { id: '3', name: 'Desk', price: 350, category: 'Furniture' },
            { id: '4', name: 'Chair', price: 200, category: 'Furniture' },
            { id: '5', name: 'Monitor', price: 400, category: 'Electronics' }
        ]);
    });

    afterEach(async () => {
        const k = (driver as any).knex;
        await k.destroy();
    });

    describe('Driver Metadata', () => {
        it('should expose driver metadata for ObjectStack compatibility', () => {
            expect(driver.name).toBe('SqlDriver');
            expect(driver.version).toBeDefined();
            expect(driver.supports).toBeDefined();
            expect(driver.supports.transactions).toBe(true);
            expect(driver.supports.joins).toBe(true);
        });
    });

    describe('Lifecycle Methods', () => {
        it('should support connect method', async () => {
            await expect(driver.connect()).resolves.toBeUndefined();
        });

        it('should support checkHealth method', async () => {
            const healthy = await driver.checkHealth();
            expect(healthy).toBe(true);
        });

        it('should support disconnect method', async () => {
            // Create a separate driver instance for this test
            const testDriver = new SqlDriver({
                client: 'sqlite3',
                connection: {
                    filename: ':memory:'
                },
                useNullAsDefault: true
            });
            
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
                fields: ['name'],
                sort: [
                    { field: 'category', order: 'asc' as const },
                    { field: 'price', order: 'desc' as const }
                ]
            };
            const results = await driver.find('products', query);
            
            // Electronics: Monitor(400), Laptop(1200), Mouse(25)
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

        it('should support aggregations in QueryAST format', async () => {
            const query = {
                aggregations: [
                    { function: 'sum' as const, field: 'price', alias: 'total_price' },
                    { function: 'count' as const, field: '*', alias: 'count' }
                ],
                groupBy: ['category']
            };
            const results = await driver.aggregate('products', query);
            
            expect(results.length).toBe(2);
            
            const electronics = results.find((r: any) => r.category === 'Electronics');
            const furniture = results.find((r: any) => r.category === 'Furniture');
            
            expect(electronics).toBeDefined();
            expect(electronics.total_price).toBe(1625); // 1200 + 25 + 400
            
            expect(furniture).toBeDefined();
            expect(furniture.total_price).toBe(550); // 350 + 200
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

        it('should still support legacy aggregate format', async () => {
            const query = {
                aggregate: [
                    { func: 'avg', field: 'price', alias: 'avg_price' }
                ],
                groupBy: ['category']
            };
            const results = await driver.aggregate('products', query);
            
            expect(results.length).toBe(2);
            const electronics = results.find((r: any) => r.category === 'Electronics');
            expect(electronics.avg_price).toBeCloseTo(541.67, 1); // (1200 + 25 + 400) / 3
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
    });
});
