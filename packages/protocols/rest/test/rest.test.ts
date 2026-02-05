/**
 * ObjectQL REST Protocol Tests
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ObjectQLServer } from '../src/server';
import { IObjectQL } from '@objectql/types';

describe('ObjectQLServer', () => {
    let mockEngine: any;
    let mockRepo: any;
    let server: ObjectQLServer;

    beforeEach(() => {
        mockRepo = {
            find: vi.fn(),
            findOne: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            count: vi.fn()
        };

        const mockContext = {
            object: vi.fn().mockReturnValue(mockRepo)
        };

        mockEngine = {
            createContext: vi.fn().mockReturnValue(mockContext),
            getObject: vi.fn().mockReturnValue({ name: 'testObject' }), 
            metadata: {
                getTypes: vi.fn().mockReturnValue(['testObject']),
                list: vi.fn(),
                get: vi.fn(),
            } as any
        };
        server = new ObjectQLServer(mockEngine as IObjectQL);
    });

    it('should handle "find" operation', async () => {
        const mockData = [{ id: '1', name: 'Test' }];
        // server.ts handles list response, assuming repo.find returns array
        mockRepo.find.mockResolvedValue(mockData);
        
        const response = await server.handle({
            op: 'find',
            object: 'testObject',
            args: { query: { name: 'Test' } }
        });

        expect(response.error).toBeFalsy();
        expect(response.items).toEqual(mockData);
        expect(mockRepo.find).toHaveBeenCalledWith({ query: { name: 'Test' } });
    });

    it('should handle "findOne" operation', async () => {
        const mockData = { id: '1', name: 'Test' };
        mockRepo.findOne.mockResolvedValue(mockData);

        const response = await server.handle({
            op: 'findOne',
            object: 'testObject',
            args: { id: '1' }
        });

        expect(response.error).toBeFalsy();
        expect(response.data).toEqual({ ...mockData, '@type': 'testObject' });
        expect(mockRepo.findOne).toHaveBeenCalledWith({ id: '1' });
    });

    it('should handle "create" operation', async () => {
        const input = { name: 'New' };
        const output = { id: '1', ...input };
        mockRepo.create.mockResolvedValue(output);

        const response = await server.handle({
            op: 'create',
            object: 'testObject',
            args: input 
        });

        expect(response.error).toBeFalsy();
        expect(response.data).toEqual({ ...output, '@type': 'testObject' });
        expect(mockRepo.create).toHaveBeenCalledWith(input);
    });

    it('should handle "update" operation', async () => {
        const input = { name: 'Updated' };
        const output = { id: '1', ...input };
        mockRepo.update.mockResolvedValue(output);

        // server.ts calls repo.update(req.args.id, req.args.data)
        const args = { id: '1', data: input };

        const response = await server.handle({
            op: 'update',
            object: 'testObject',
            args: args
        });

        expect(response.error).toBeFalsy();
        expect(response.data).toEqual({ ...output, '@type': 'testObject' });
        expect(mockRepo.update).toHaveBeenCalledWith('1', input);
    });

    it('should handle "delete" operation', async () => {
        mockRepo.delete.mockResolvedValue(true);

        const response = await server.handle({
            op: 'delete',
            object: 'testObject',
            args: { id: '1' }
        });

        expect(response.error).toBeFalsy();
        expect(response.data).toEqual({ deleted: true, id: '1', '@type': 'testObject' });
        expect(mockRepo.delete).toHaveBeenCalledWith('1');
    });

    it('should return error on engine failure', async () => {
        mockRepo.find.mockRejectedValue(new Error('DB Error'));

        const response = await server.handle({
            op: 'find',
            object: 'testObject',
            args: {}
        });

        expect(response.data).toBeFalsy();
        expect(response.error).toBeDefined();
        expect(response.error?.message).toContain('DB Error');
    });
});
