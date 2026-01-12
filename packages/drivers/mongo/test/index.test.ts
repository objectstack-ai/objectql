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

});
