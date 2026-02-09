/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { MongoDriver } from '../src';
import { vi } from 'vitest';

// Mock data
const products = [
    { _id: '1', name: 'Laptop', price: 1200, category: 'Electronics' },
    { _id: '2', name: 'Mouse', price: 25, category: 'Electronics' },
    { _id: '3', name: 'Desk', price: 350, category: 'Furniture' },
    { _id: '4', name: 'Chair', price: 200, category: 'Furniture' },
    { _id: '5', name: 'Monitor', price: 400, category: 'Electronics' }
];

const mockCollection = {
    find: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    toArray: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    insertOne: jest.fn().mockResolvedValue({ insertedId: '123' }),
    updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    countDocuments: jest.fn().mockResolvedValue(0)
};

const mockDb = {
    collection: jest.fn().mockReturnValue(mockCollection),
    admin: jest.fn().mockReturnValue({
        ping: jest.fn().mockResolvedValue({})
    })
};

const mockClient = {
    connect: jest.fn().mockResolvedValue(undefined),
    db: jest.fn().mockReturnValue(mockDb),
    close: jest.fn().mockResolvedValue(undefined)
};

vi.mock('mongodb', () => {
    return {
        MongoClient: jest.fn().mockImplementation(() => mockClient),
        ObjectId: jest.fn(id => id)
    };
});

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

    beforeEach(async () => {
        driver = new MongoDriver({ url: 'mongodb://localhost:27017', dbName: 'test' });
        await new Promise(process.nextTick);
        
        // Reset mocks
        jest.clearAllMocks();
    });

    afterEach(async () => {
        // Don't actually disconnect since it's mocked
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
            const testDriver = new MongoDriver({ url: 'mongodb://localhost:27017', dbName: 'test2' });
            await expect(testDriver.connect()).resolves.toBeUndefined();
        });

        it('should support checkHealth method', async () => {
            const healthy = await driver.checkHealth();
            expect(healthy).toBe(true);
            expect(mockDb.admin).toHaveBeenCalled();
        });

        it('should support disconnect method', async () => {
            await expect(driver.disconnect()).resolves.toBeUndefined();
            expect(mockClient.close).toHaveBeenCalled();
        });
    });

    describe('QueryAST Format Support', () => {
        it('should support QueryAST with "top" instead of "limit"', async () => {
            mockCollection.toArray.mockResolvedValueOnce([
                { _id: '2', name: 'Mouse', price: 25 },
                { _id: '4', name: 'Chair', price: 200 }
            ]);
            
            const query = {
                fields: ['name', 'price'],
                top: 2,
                sort: [{ field: 'price', order: 'asc' as const }]
            };
            const results = await driver.find('products', query);
            
            expect(mockCollection.find).toHaveBeenCalledWith(
                {},
                expect.objectContaining({
                    limit: 2,
                    sort: { price: 1 },
                    projection: { _id: 0, name: 1, price: 1 }
                })
            );
            expect(results.length).toBe(2);
            expect(results[0].id).toBe('2');
            expect(results[0].name).toBe('Mouse');
        });

        it('should support QueryAST sort format with object notation', async () => {
            mockCollection.toArray.mockResolvedValueOnce(products);
            
            const query = {
                fields: ['name', 'category', 'price'],
                sort: [
                    { field: 'category', order: 'asc' as const },
                    { field: 'price', order: 'desc' as const }
                ]
            };
            await driver.find('products', query);
            
            expect(mockCollection.find).toHaveBeenCalledWith(
                {},
                expect.objectContaining({
                    sort: { category: 1, price: -1 }
                })
            );
        });

        it('should support QueryAST with filters and pagination', async () => {
            mockCollection.toArray.mockResolvedValueOnce([
                { _id: '5', name: 'Monitor', price: 400 }
            ]);
            
            const query = {
                filters: [['category', '=', 'Electronics']],
                skip: 1,
                top: 1,
                sort: [{ field: 'price', order: 'asc' as const }]
            };
            await driver.find('products', query);
            
            expect(mockCollection.find).toHaveBeenCalledWith(
                { category: { $eq: 'Electronics' } },
                expect.objectContaining({
                    skip: 1,
                    limit: 1,
                    sort: { price: 1 }
                })
            );
        });

        it('should support count with QueryAST format', async () => {
            mockCollection.countDocuments.mockResolvedValueOnce(3);
            
            const query = {
                filters: [['price', '>', 300]]
            };
            const count = await driver.count('products', query);
            
            expect(mockCollection.countDocuments).toHaveBeenCalledWith(
                { price: { $gt: 300 } }
            );
            expect(count).toBe(3);
        });
    });

    describe('Backward Compatibility', () => {
        it('should still support legacy UnifiedQuery format with "limit"', async () => {
            mockCollection.toArray.mockResolvedValueOnce([
                { _id: '2', name: 'Mouse' },
                { _id: '4', name: 'Chair' }
            ]);
            
            const query = {
                fields: ['name'],
                limit: 2,
                sort: [['price', 'asc']]
            };
            await driver.find('products', query);
            
            expect(mockCollection.find).toHaveBeenCalledWith(
                {},
                expect.objectContaining({
                    limit: 2,
                    sort: { price: 1 }
                })
            );
        });

        it('should support legacy sort format with arrays', async () => {
            mockCollection.toArray.mockResolvedValueOnce(products);
            
            const query = {
                fields: ['name'],
                sort: [['price', 'desc']],
                limit: 3
            };
            await driver.find('products', query);
            
            expect(mockCollection.find).toHaveBeenCalledWith(
                {},
                expect.objectContaining({
                    limit: 3,
                    sort: { price: -1 }
                })
            );
        });
    });

    describe('Mixed Format Support', () => {
        it('should handle query with both top and skip', async () => {
            mockCollection.toArray.mockResolvedValueOnce(products.slice(2, 5));
            
            const query = {
                top: 3,
                skip: 2,
                sort: [{ field: 'name', order: 'asc' as const }]
            };
            await driver.find('products', query);
            
            expect(mockCollection.find).toHaveBeenCalledWith(
                {},
                expect.objectContaining({
                    skip: 2,
                    limit: 3,
                    sort: { name: 1 }
                })
            );
        });

        it('should support filtering with object sort format', async () => {
            mockCollection.toArray.mockResolvedValueOnce([
                { _id: '1', name: 'Laptop' },
                { _id: '5', name: 'Monitor' }
            ]);
            
            const query = {
                filters: [['category', '=', 'Electronics']],
                sort: [{ field: 'price', order: 'desc' as const }],
                top: 2
            };
            await driver.find('products', query);
            
            expect(mockCollection.find).toHaveBeenCalledWith(
                { category: { $eq: 'Electronics' } },
                expect.objectContaining({
                    limit: 2,
                    sort: { price: -1 }
                })
            );
        });
    });

    describe('Field Mapping', () => {
        it('should support querying with id field in QueryAST format', async () => {
            mockCollection.toArray.mockResolvedValueOnce([
                { _id: '1', name: 'Laptop' }
            ]);
            
            const query = {
                filters: [['id', '=', '1']],
                fields: ['id', 'name']
            };
            const _results = await driver.find('products', query);
            
            expect(mockCollection.find).toHaveBeenCalledWith(
                { _id: '1' },
                expect.objectContaining({
                    projection: { _id: 1, name: 1 }
                })
            );
        });

        it('should support sorting by id field', async () => {
            mockCollection.toArray.mockResolvedValueOnce([
                { _id: '5', name: 'Monitor' },
                { _id: '4', name: 'Chair' }
            ]);
            
            const query = {
                sort: [{ field: 'id', order: 'desc' as const }],
                top: 2
            };
            await driver.find('products', query);
            
            expect(mockCollection.find).toHaveBeenCalledWith(
                {},
                expect.objectContaining({
                    limit: 2,
                    sort: { _id: -1 }
                })
            );
        });
    });
});
