/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ObjectStackProtocolImplementation } from '../src/protocol';
import { IObjectQL } from '@objectql/types';

describe('ObjectStackProtocolImplementation', () => {
    let mockEngine: Partial<IObjectQL>;
    let protocol: ObjectStackProtocolImplementation;

    beforeEach(() => {
        mockEngine = {
            metadata: {
                getTypes: jest.fn().mockReturnValue(['object']),
                list: jest.fn().mockReturnValue([{ name: 'testObject', label: 'Test Object' }]),
                get: jest.fn().mockReturnValue({ name: 'testObject', fields: {} }),
            } as any,
            // Mock kernel-like direct methods
            find: jest.fn(),
            get: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        };
        protocol = new ObjectStackProtocolImplementation(mockEngine as IObjectQL);
    });

    describe('Meta Operations', () => {
        it('getMetaTypes should return types from engine metadata', async () => {
            const result = await protocol.getMetaTypes({});
            expect(result).toEqual({ types: ['object'] });
            expect(mockEngine.metadata?.getTypes).toHaveBeenCalled();
        });

        it('getMetaItems should return items for a type', async () => {
            const result = await protocol.getMetaItems({ type: 'object' });
            expect(result).toEqual({ 
                type: 'object', 
                items: [{ name: 'testObject', label: 'Test Object' }] 
            });
            expect(mockEngine.metadata?.list).toHaveBeenCalledWith('object');
        });

        it('getMetaItem should return specific item definition', async () => {
            const result = await protocol.getMetaItem({ type: 'object', name: 'testObject' });
            expect(result).toEqual({ name: 'testObject', fields: {} });
            expect(mockEngine.metadata?.get).toHaveBeenCalledWith('object', 'testObject');
        });
    });

    describe('Data Operations (Direct Kernel Mode)', () => {
        it('findData should delegate to engine.find', async () => {
            const mockData = [{ id: '1', name: 'Test' }];
            (mockEngine as any).find.mockResolvedValue(mockData);

            const result = await protocol.findData({ object: 'testObject', query: {} });
            expect(result).toBe(mockData);
            expect((mockEngine as any).find).toHaveBeenCalledWith('testObject', {});
        });

        it('getData should delegate to engine.get', async () => {
            const mockRecord = { id: '1', name: 'Test' };
            (mockEngine as any).get.mockResolvedValue(mockRecord);

            const result = await protocol.getData({ object: 'testObject', id: '1' });
            expect(result).toBe(mockRecord);
            expect((mockEngine as any).get).toHaveBeenCalledWith('testObject', '1');
        });

        it('createData should delegate to engine.create', async () => {
            const newData = { name: 'New' };
            const createdRecord = { id: '2', ...newData };
            (mockEngine as any).create.mockResolvedValue(createdRecord);

            const result = await protocol.createData({ object: 'testObject', data: newData });
            expect(result).toBe(createdRecord);
            expect((mockEngine as any).create).toHaveBeenCalledWith('testObject', newData);
        });

        it('updateData should delegate to engine.update', async () => {
            const updateData = { name: 'Updated' };
            const updatedRecord = { id: '1', ...updateData };
            (mockEngine as any).update.mockResolvedValue(updatedRecord);

            const result = await protocol.updateData({ object: 'testObject', id: '1', data: updateData });
            expect(result).toBe(updatedRecord);
            expect((mockEngine as any).update).toHaveBeenCalledWith('testObject', '1', updateData);
        });

        it('deleteData should delegate to engine.delete', async () => {
            (mockEngine as any).delete.mockResolvedValue(true);

            const result = await protocol.deleteData({ object: 'testObject', id: '1' });
            expect(result).toEqual({ object: 'testObject', id: '1', success: true });
            expect((mockEngine as any).delete).toHaveBeenCalledWith('testObject', '1');
        });
    });

    describe('Legacy Mode (IObjectQL Context)', () => {
        let mockRepo: any;
        
        beforeEach(() => {
            // Remove direct methods to force legacy path
            delete (mockEngine as any).find;
            delete (mockEngine as any).get;
            delete (mockEngine as any).create;
            delete (mockEngine as any).update;
            delete (mockEngine as any).delete;

            mockRepo = {
                find: jest.fn(),
                findOne: jest.fn(),
                create: jest.fn(),
                update: jest.fn(),
                delete: jest.fn(),
            };

            (mockEngine as any).createContext = jest.fn().mockReturnValue({
                object: jest.fn().mockReturnValue(mockRepo)
            });
        });

        it('findData should use repo.find in legacy mode', async () => {
            const mockData = [{ id: '1' }];
            mockRepo.find.mockResolvedValue(mockData);

            await protocol.findData({ object: 'testObject' });
            expect(mockRepo.find).toHaveBeenCalled();
        });

        it('deleteData should use repo.delete in legacy mode', async () => {
            mockRepo.delete.mockResolvedValue(true);
            const result = await protocol.deleteData({ object: 'testObject', id: '1' });
            expect(result.success).toBe(true);
            expect(mockRepo.delete).toHaveBeenCalledWith('1');
        });
    });
});
