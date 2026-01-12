import { MongoDriver } from '../src';
import { MongoClient } from 'mongodb';

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
    countDocuments: jest.fn().mockResolvedValue(10)
};

const mockDb = {
    collection: jest.fn().mockReturnValue(mockCollection)
};

const mockClient = {
    connect: jest.fn().mockResolvedValue(undefined),
    db: jest.fn().mockReturnValue(mockDb)
};

jest.mock('mongodb', () => {
    return {
        MongoClient: jest.fn().mockImplementation(() => mockClient),
        ObjectId: jest.fn(id => id) 
    };
});

describe('MongoDriver', () => {
    let driver: MongoDriver;

    beforeEach(async () => {
        driver = new MongoDriver({ url: 'mongodb://localhost:27017', dbName: 'testdb' });
        // Wait for potential async connection in real code (mocked as sync-resolving promise)
        await new Promise(process.nextTick); 
    });

    it('should be instantiable and connect', () => {
        expect(driver).toBeDefined();
        expect(mockClient.connect).toHaveBeenCalled();
        expect(mockClient.db).toHaveBeenCalledWith('testdb');
    });

    it('should find objects with query', async () => {
        const query = {
            filters: [['age', '>', 18]],
            sort: [['name', 'asc']],
            skip: 10,
            limit: 5
        };
        
        await driver.find('users', query);
        
        // Debugging what was actually called
        // console.log('Find calls:', mockCollection.find.mock.calls);

        expect(mockDb.collection).toHaveBeenCalledWith('users');
        
        // We expect: find(filter, options)
        // filter = { $and: [{ age: { $gt: 18 } }] }
        // options = { limit: 5, skip: 10, sort: { name: 1 } }
        
        expect(mockCollection.find).toHaveBeenCalledWith(
            { age: { $gt: 18 } },
            expect.objectContaining({ 
                skip: 10, 
                limit: 5,
                sort: { name: 1 }
            })
        );
        expect(mockCollection.toArray).toHaveBeenCalled();
    });

    it('should handle OR filters', async () => {
        const query = {
            filters: [['age', '>', 18], 'or', ['role', '=', 'admin']]
        };
        await driver.find('users', query);
        
        expect(mockCollection.find).toHaveBeenCalledWith(
            {
                $or: [
                    { age: { $gt: 18 } },
                    { role: { $eq: 'admin' } }
                ]
            },
            expect.any(Object)
        );
    });

    it('should map "id" field to "_id" in filters', async () => {
        const query = {
            filters: [['id', '=', '12345']]
        };
        await driver.find('users', query);
        
        expect(mockCollection.find).toHaveBeenCalledWith(
            { _id: '12345' },
            expect.any(Object)
        );
    });

    it('should map "id" to "_id" in sorting', async () => {
        const query = {
            sort: [['id', 'desc']]
        };
        await driver.find('users', query);
        
        expect(mockCollection.find).toHaveBeenCalledWith(
            {},
            expect.objectContaining({ 
                sort: { _id: -1 }
            })
        );
    });

    it('should map "id" to "_id" in field projection', async () => {
        mockCollection.toArray.mockResolvedValueOnce([{ _id: '123', name: 'Test' }]);
        
        const query = {
            fields: ['id', 'name']
        };
        const results = await driver.find('users', query);
        
        expect(mockCollection.find).toHaveBeenCalledWith(
            {},
            expect.objectContaining({ 
                projection: { _id: 1, name: 1 }
            })
        );
        
        // Should return 'id' instead of '_id'
        expect(results[0]).toEqual({ id: '123', name: 'Test' });
    });

    it('should return documents with "id" field instead of "_id"', async () => {
        mockCollection.toArray.mockResolvedValueOnce([
            { _id: 'abc123', name: 'Alice', age: 30 }
        ]);
        
        const results = await driver.find('users', {});
        
        expect(results).toHaveLength(1);
        expect(results[0]).toHaveProperty('id', 'abc123');
        expect(results[0]).not.toHaveProperty('_id');
        expect(results[0]).toHaveProperty('name', 'Alice');
    });

    it('should accept "id" field in create and map to "_id"', async () => {
        mockCollection.insertOne.mockResolvedValueOnce({ insertedId: 'custom-id' });
        
        const result = await driver.create('users', { id: 'custom-id', name: 'Bob' });
        
        expect(mockCollection.insertOne).toHaveBeenCalledWith(
            expect.objectContaining({ _id: 'custom-id', name: 'Bob' })
        );
        
        // Should return 'id' instead of '_id'
        expect(result).toHaveProperty('id', 'custom-id');
        expect(result).not.toHaveProperty('_id');
    });

    it('should map "_id" to "id" in findOne result', async () => {
        mockCollection.findOne.mockResolvedValueOnce({ _id: '123', name: 'Charlie' });
        
        const result = await driver.findOne('users', '123');
        
        expect(result).toHaveProperty('id', '123');
        expect(result).not.toHaveProperty('_id');
        expect(result).toHaveProperty('name', 'Charlie');
    });

    // Backward compatibility tests for legacy '_id' usage
    it('should accept "_id" field in filters for backward compatibility', async () => {
        const query = {
            filters: [['_id', '=', '12345']]
        };
        await driver.find('users', query);
        
        expect(mockCollection.find).toHaveBeenCalledWith(
            { _id: '12345' },
            expect.any(Object)
        );
    });

    it('should accept "_id" in sorting for backward compatibility', async () => {
        const query = {
            sort: [['_id', 'asc']]
        };
        await driver.find('users', query);
        
        expect(mockCollection.find).toHaveBeenCalledWith(
            {},
            expect.objectContaining({ 
                sort: { _id: 1 }
            })
        );
    });

    it('should accept "_id" in field projection for backward compatibility', async () => {
        mockCollection.toArray.mockResolvedValueOnce([{ _id: '456', name: 'Dave' }]);
        
        const query = {
            fields: ['_id', 'name']
        };
        const results = await driver.find('users', query);
        
        expect(mockCollection.find).toHaveBeenCalledWith(
            {},
            expect.objectContaining({ 
                projection: { _id: 1, name: 1 }
            })
        );
        
        // Should still return 'id' instead of '_id' in results
        expect(results[0]).toEqual({ id: '456', name: 'Dave' });
    });

    it('should handle nested filter groups', async () => {
        const query = {
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
        };
        await driver.find('orders', query);
        
        // Expected MongoDB query structure:
        // { $or: [
        //     { $and: [{ status: { $eq: 'completed' } }, { amount: { $gt: 100 } }] },
        //     { $and: [{ customer: { $eq: 'Alice' } }, { status: { $eq: 'pending' } }] }
        // ] }
        expect(mockCollection.find).toHaveBeenCalledWith(
            {
                $or: [
                    { $and: [{ status: { $eq: 'completed' } }, { amount: { $gt: 100 } }] },
                    { $and: [{ customer: { $eq: 'Alice' } }, { status: { $eq: 'pending' } }] }
                ]
            },
            expect.any(Object)
        );
    });

    it('should handle deeply nested filter groups', async () => {
        const query = {
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
        };
        await driver.find('users', query);
        
        // Expected structure:
        // { $and: [
        //     { $or: [
        //         { $and: [{ age: { $gt: 22 } }, { status: { $eq: 'active' } }] },
        //         { role: { $eq: 'admin' } }
        //     ] },
        //     { name: { $ne: 'Bob' } }
        // ] }
        expect(mockCollection.find).toHaveBeenCalledWith(
            {
                $and: [
                    {
                        $or: [
                            { $and: [{ age: { $gt: 22 } }, { status: { $eq: 'active' } }] },
                            { role: { $eq: 'admin' } }
                        ]
                    },
                    { name: { $ne: 'Bob' } }
                ]
            },
            expect.any(Object)
        );
    });

    it('should handle nested groups with implicit AND', async () => {
        const query = {
            filters: [
                [
                    ['status', '=', 'active'],
                    ['role', '=', 'admin']
                ],
                ['age', '>', 25]
            ]
        };
        await driver.find('users', query);
        
        // Nested array without explicit 'and' should still be treated as AND
        expect(mockCollection.find).toHaveBeenCalledWith(
            {
                $and: [
                    { $and: [{ status: { $eq: 'active' } }, { role: { $eq: 'admin' } }] },
                    { age: { $gt: 25 } }
                ]
            },
            expect.any(Object)
        );
    });

});
