/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { MongoDriver } from '../src';
import { MongoClient } from 'mongodb';
import { vi } from 'vitest';

const mockCollection = {
    find: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    toArray: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    insertOne: jest.fn().mockResolvedValue({ insertedId: '123' }),
    insertMany: jest.fn().mockResolvedValue({ 
        insertedIds: { 0: 'id1', 1: 'id2' },
        insertedCount: 2
    }),
    updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    findOneAndUpdate: jest.fn().mockResolvedValue({ value: { _id: '123', name: 'Updated' } }),
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

vi.mock('mongodb', () => {
    return {
        MongoClient: jest.fn().mockImplementation(() => mockClient),
        ObjectId: jest.fn().mockImplementation((id?: string) => ({
            toHexString: () => id || 'generated-object-id',
            toString: () => id || 'generated-object-id'
        }))
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
            where: { age: { $gt: 18 } },
            orderBy: [{ field: 'name', order: 'asc' as const }],
            offset: 10,
            limit: 5
        };
        
        await driver.find('users', query);
        
        expect(mockDb.collection).toHaveBeenCalledWith('users');
        
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
            where: {
                $or: [
                    { age: { $gt: 18 } },
                    { role: 'admin' }
                ]
            }
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
            where: { id: '12345' }
        };
        await driver.find('users', query);
        
        expect(mockCollection.find).toHaveBeenCalledWith(
            { _id: '12345' },
            expect.any(Object)
        );
    });

    it('should map "id" to "_id" in sorting', async () => {
        const query = {
            orderBy: [{ field: 'id', order: 'desc' as const }]
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
            where: { _id: '12345' }
        };
        await driver.find('users', query);
        
        expect(mockCollection.find).toHaveBeenCalledWith(
            { _id: '12345' },
            expect.any(Object)
        );
    });

    it('should accept "_id" in sorting for backward compatibility', async () => {
        const query = {
            orderBy: [{ field: '_id', order: 'asc' as const }]
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
            where: {
                $or: [
                    {
                        $and: [
                            { status: 'completed' },
                            { amount: { $gt: 100 } }
                        ]
                    },
                    {
                        $and: [
                            { customer: 'Alice' },
                            { status: 'pending' }
                        ]
                    }
                ]
            }
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
            where: {
                $and: [
                    {
                        $or: [
                            {
                                $and: [
                                    { age: { $gt: 22 } },
                                    { status: 'active' }
                                ]
                            },
                            { role: 'admin' }
                        ]
                    },
                    { name: { $ne: 'Bob' } }
                ]
            }
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
            where: {
                $and: [
                    {
                        $and: [
                            { status: 'active' },
                            { role: 'admin' }
                        ]
                    },
                    { age: { $gt: 25 } }
                ]
            }
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

    describe('DriverInterface v4.0 methods', () => {
        describe('executeQuery', () => {
            it('should execute a simple QueryAST query', async () => {
                const ast = {
                    object: 'users',
                    fields: ['name', 'email'],
                    where: {
                        status: 'active'
                    },
                    limit: 10,
                    offset: 0
                };

                mockCollection.toArray.mockResolvedValue([
                    { name: 'User 1', email: 'user1@example.com' },
                    { name: 'User 2', email: 'user2@example.com' }
                ]);

                const result = await driver.executeQuery(ast);

                expect(result.value).toHaveLength(2);
                expect(result.count).toBe(2);
                expect(mockCollection.find).toHaveBeenCalled();
            });

            it('should handle complex QueryAST with AND filters', async () => {
                const ast = {
                    object: 'users',
                    where: {
                        $and: [
                            { status: 'active' },
                            { age: { $gt: 18 } }
                        ]
                    }
                };

                mockCollection.toArray.mockResolvedValue([]);

                const result = await driver.executeQuery(ast);

                expect(result.value).toEqual([]);
                expect(mockCollection.find).toHaveBeenCalled();
            });

            it('should handle QueryAST with sort', async () => {
                const ast = {
                    object: 'users',
                    orderBy: [
                        { field: 'name', order: 'asc' as const }
                    ]
                };

                mockCollection.toArray.mockResolvedValue([]);

                await driver.executeQuery(ast);

                expect(mockCollection.find).toHaveBeenCalledWith(
                    {},
                    expect.objectContaining({
                        sort: { name: 1 }
                    })
                );
            });
        });

        describe('executeCommand', () => {
            it('should execute create command', async () => {
                const command = {
                    type: 'create' as const,
                    object: 'users',
                    data: { name: 'New User', email: 'new@example.com' }
                };

                mockCollection.insertOne.mockResolvedValue({ 
                    insertedId: 'new123',
                    acknowledged: true
                } as any);

                const result = await driver.executeCommand(command);

                expect(result.success).toBe(true);
                expect(result.affected).toBe(1);
                expect(result.data).toBeDefined();
                expect(mockCollection.insertOne).toHaveBeenCalled();
            });

            it('should execute update command', async () => {
                const command = {
                    type: 'update' as const,
                    object: 'users',
                    id: '123',
                    data: { name: 'Updated User' }
                };

                mockCollection.findOneAndUpdate.mockResolvedValue({ 
                    value: {
                        _id: '123', 
                        name: 'Updated User',
                        updated_at: new Date().toISOString()
                    }
                });

                const result = await driver.executeCommand(command);

                expect(result.success).toBe(true);
                expect(result.affected).toBe(1);
                expect(mockCollection.findOneAndUpdate).toHaveBeenCalled();
            });

            it('should execute delete command', async () => {
                const command = {
                    type: 'delete' as const,
                    object: 'users',
                    id: '123'
                };

                mockCollection.deleteOne.mockResolvedValue({ 
                    deletedCount: 1,
                    acknowledged: true
                } as any);

                const result = await driver.executeCommand(command);

                expect(result.success).toBe(true);
                expect(result.affected).toBe(1);
                expect(mockCollection.deleteOne).toHaveBeenCalled();
            });

            it('should execute bulkCreate command', async () => {
                const command = {
                    type: 'bulkCreate' as const,
                    object: 'users',
                    records: [
                        { name: 'User 1', email: 'user1@example.com' },
                        { name: 'User 2', email: 'user2@example.com' }
                    ]
                };

                mockCollection.insertOne.mockResolvedValue({ 
                    insertedId: 'id1',
                    acknowledged: true
                } as any);

                const result = await driver.executeCommand(command);

                expect(result.success).toBe(true);
                expect(result.affected).toBe(2);
                expect(result.data).toHaveLength(2);
            });

            it('should execute bulkUpdate command', async () => {
                const command = {
                    type: 'bulkUpdate' as const,
                    object: 'users',
                    updates: [
                        { id: '1', data: { name: 'Updated 1' } },
                        { id: '2', data: { name: 'Updated 2' } }
                    ]
                };

                mockCollection.findOneAndUpdate.mockResolvedValue({ 
                    value: {
                        _id: '1', 
                        name: 'Updated 1',
                        updated_at: new Date().toISOString()
                    }
                });

                const result = await driver.executeCommand(command);

                expect(result.success).toBe(true);
                expect(result.affected).toBe(2);
            });

            it('should execute bulkDelete command', async () => {
                const command = {
                    type: 'bulkDelete' as const,
                    object: 'users',
                    ids: ['1', '2', '3']
                };

                mockCollection.deleteOne.mockResolvedValue({ 
                    deletedCount: 1,
                    acknowledged: true
                } as any);

                const result = await driver.executeCommand(command);

                expect(result.success).toBe(true);
                expect(result.affected).toBe(3);
            });

            it('should handle command errors gracefully', async () => {
                const command = {
                    type: 'create' as const,
                    object: 'users',
                    data: undefined // Invalid data
                };

                const result = await driver.executeCommand(command);

                expect(result.success).toBe(false);
                expect(result.error).toBeDefined();
                expect(result.affected).toBe(0);
            });

            it('should reject unknown command types', async () => {
                const command = {
                    type: 'invalidCommand' as any,
                    object: 'users'
                };

                const result = await driver.executeCommand(command);

                expect(result.success).toBe(false);
                expect(result.error).toContain('Unknown command type');
                expect(result.error).toContain('Valid types are');
            });
        });

        describe('execute', () => {
            it('should throw error as MongoDB does not support raw command execution', async () => {
                await expect(driver.execute('SELECT * FROM users')).rejects.toThrow(
                    'MongoDB driver does not support raw command execution'
                );
            });
        });
    });

});
