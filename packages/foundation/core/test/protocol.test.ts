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

    describe('Discovery', () => {
        it('getDiscovery should return per-service status map', async () => {
            const result = await protocol.getDiscovery();
            expect(result.name).toBe('ObjectQL Engine');
            expect(result.version).toBe('4.0.0');
            expect(result.protocols).toEqual(['rest', 'graphql', 'json-rpc', 'odata']);
            expect(result.services).toBeDefined();

            // Kernel-provided services should be enabled
            expect(result.services.metadata.enabled).toBe(true);
            expect(result.services.metadata.status).toBe('degraded');
            expect(result.services.data.enabled).toBe(true);
            expect(result.services.data.status).toBe('available');
            expect(result.services.analytics.enabled).toBe(true);
            expect(result.services.analytics.status).toBe('available');

            // Plugin-required services should be disabled
            expect(result.services.auth.enabled).toBe(false);
            expect(result.services.auth.status).toBe('unavailable');
            expect(result.services.ui.enabled).toBe(false);
            expect(result.services.workflow.enabled).toBe(false);
            expect(result.services.realtime.enabled).toBe(false);
            expect(result.services.notification.enabled).toBe(false);
            expect(result.services.ai.enabled).toBe(false);
            expect(result.services.i18n.enabled).toBe(false);
            expect(result.services.cache.enabled).toBe(false);
            expect(result.services.queue.enabled).toBe(false);
            expect(result.services.job.enabled).toBe(false);
            expect(result.services.graphql.enabled).toBe(false);
        });

        it('updateServiceStatus should update a service status', async () => {
            protocol.updateServiceStatus('auth', {
                enabled: true,
                status: 'available',
                route: '/api/v1/auth',
                provider: 'plugin-auth',
            });

            const result = await protocol.getDiscovery();
            expect(result.services.auth.enabled).toBe(true);
            expect(result.services.auth.status).toBe('available');
            expect(result.services.auth.route).toBe('/api/v1/auth');
            expect(result.services.auth.provider).toBe('plugin-auth');
        });
    });

    describe('Batch Operations', () => {
        it('createManyData should create multiple records', async () => {
            const records = [{ name: 'A' }, { name: 'B' }];
            (mockEngine as any).create
                .mockResolvedValueOnce({ id: '1', name: 'A' })
                .mockResolvedValueOnce({ id: '2', name: 'B' });

            const result = await protocol.createManyData({ object: 'testObject', records });
            expect(result.object).toBe('testObject');
            expect(result.created).toHaveLength(2);
            expect((mockEngine as any).create).toHaveBeenCalledTimes(2);
        });

        it('updateManyData should update multiple records', async () => {
            const records = [
                { id: '1', data: { name: 'A2' } },
                { id: '2', data: { name: 'B2' } },
            ];
            (mockEngine as any).update
                .mockResolvedValueOnce({ id: '1', name: 'A2' })
                .mockResolvedValueOnce({ id: '2', name: 'B2' });

            const result = await protocol.updateManyData({ object: 'testObject', records });
            expect(result.object).toBe('testObject');
            expect(result.updated).toHaveLength(2);
            expect((mockEngine as any).update).toHaveBeenCalledTimes(2);
        });

        it('deleteManyData should delete multiple records', async () => {
            (mockEngine as any).delete
                .mockResolvedValueOnce(true)
                .mockResolvedValueOnce(true);

            const result = await protocol.deleteManyData({ object: 'testObject', ids: ['1', '2'] });
            expect(result.object).toBe('testObject');
            expect(result.deleted).toHaveLength(2);
            expect((mockEngine as any).delete).toHaveBeenCalledTimes(2);
        });

        it('batchData should execute batch create operations', async () => {
            (mockEngine as any).create
                .mockResolvedValueOnce({ id: '1', name: 'New1' })
                .mockResolvedValueOnce({ id: '2', name: 'New2' });

            const result = await protocol.batchData({
                object: 'testObject',
                request: { operation: 'create', records: [{ name: 'New1' }, { name: 'New2' }] },
            });
            expect(result.operation).toBe('create');
            expect(result.results).toHaveLength(2);
        });
    });

    describe('Analytics', () => {
        it('getAnalyticsMeta should return measures and dimensions', async () => {
            (mockEngine.metadata?.get as jest.Mock).mockReturnValue({
                name: 'invoice',
                fields: {
                    amount: { type: 'number', name: 'amount' },
                    created_at: { type: 'date', name: 'created_at' },
                    status: { type: 'text', name: 'status' },
                },
            });

            const result = await protocol.getAnalyticsMeta({ object: 'invoice' });
            expect(result.object).toBe('invoice');
            expect(result.measures).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ name: 'amount', type: 'number' }),
                ])
            );
            expect(result.dimensions).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ name: 'created_at', type: 'date' }),
                    expect.objectContaining({ name: 'status', type: 'text' }),
                ])
            );
        });
    });

    describe('Plugin-Required Services (stubs)', () => {
        it('checkPermission should throw with service unavailable message', async () => {
            await expect(protocol.checkPermission({})).rejects.toThrow(
                /Service 'auth' is not available/
            );
        });

        it('listViews should throw with service unavailable message', async () => {
            await expect(protocol.listViews({})).rejects.toThrow(
                /Service 'ui' is not available/
            );
        });

        it('getWorkflowConfig should throw with service unavailable message', async () => {
            await expect(protocol.getWorkflowConfig({})).rejects.toThrow(
                /Service 'workflow' is not available/
            );
        });

        it('triggerAutomation should throw with service unavailable message', async () => {
            await expect(protocol.triggerAutomation({ trigger: 'test', payload: {} })).rejects.toThrow(
                /Service 'automation' is not available/
            );
        });

        it('realtimeConnect should throw with service unavailable message', async () => {
            await expect(protocol.realtimeConnect({})).rejects.toThrow(
                /Service 'realtime' is not available/
            );
        });

        it('registerDevice should throw with service unavailable message', async () => {
            await expect(protocol.registerDevice({})).rejects.toThrow(
                /Service 'notification' is not available/
            );
        });

        it('aiNlq should throw with service unavailable message', async () => {
            await expect(protocol.aiNlq({})).rejects.toThrow(
                /Service 'ai' is not available/
            );
        });

        it('getLocales should throw with service unavailable message', async () => {
            await expect(protocol.getLocales({})).rejects.toThrow(
                /Service 'i18n' is not available/
            );
        });
    });
});
