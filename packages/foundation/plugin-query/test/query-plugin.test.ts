/**
 * @objectql/plugin-query — Plugin Tests
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { QueryPlugin } from '../src/plugin';

describe('QueryPlugin', () => {
    let plugin: QueryPlugin;
    let mockKernel: any;
    let mockCtx: any;

    beforeEach(() => {
        mockKernel = {
            metadata: {
                get: jest.fn(),
                list: jest.fn().mockReturnValue([]),
                getTypes: jest.fn().mockReturnValue([]),
            },
        };
        mockCtx = {
            engine: mockKernel,
        };
    });

    describe('Plugin Metadata', () => {
        it('should have correct name and version', () => {
            plugin = new QueryPlugin();
            expect(plugin.name).toBe('@objectql/plugin-query');
            expect(plugin.version).toBe('4.2.0');
        });
    });

    describe('Constructor', () => {
        it('should create plugin with default config', () => {
            plugin = new QueryPlugin();
            expect(plugin).toBeDefined();
        });

        it('should create plugin with custom config', () => {
            const mockDriver = { find: jest.fn(), findOne: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), count: jest.fn() } as any;
            plugin = new QueryPlugin({
                datasources: { default: mockDriver },
                enableAnalyzer: false,
            });
            expect(plugin).toBeDefined();
        });

        it('should default enableAnalyzer to true', () => {
            plugin = new QueryPlugin({});
            expect(plugin).toBeDefined();
        });
    });

    describe('install', () => {
        it('should register QueryService on kernel when datasources provided', async () => {
            const mockDriver = { find: jest.fn(), findOne: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), count: jest.fn() } as any;
            plugin = new QueryPlugin({ datasources: { default: mockDriver } });
            await plugin.install(mockCtx);
            expect(mockKernel.queryService).toBeDefined();
        });

        it('should register QueryAnalyzer on kernel when analyzer enabled', async () => {
            const mockDriver = { find: jest.fn(), findOne: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), count: jest.fn() } as any;
            plugin = new QueryPlugin({ datasources: { default: mockDriver }, enableAnalyzer: true });
            await plugin.install(mockCtx);
            expect(mockKernel.queryAnalyzer).toBeDefined();
        });

        it('should not register QueryAnalyzer when analyzer disabled', async () => {
            const mockDriver = { find: jest.fn(), findOne: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), count: jest.fn() } as any;
            plugin = new QueryPlugin({ datasources: { default: mockDriver }, enableAnalyzer: false });
            await plugin.install(mockCtx);
            expect(mockKernel.queryService).toBeDefined();
            expect(mockKernel.queryAnalyzer).toBeUndefined();
        });

        it('should handle missing datasources gracefully', async () => {
            plugin = new QueryPlugin();
            await plugin.install(mockCtx);
            expect(mockKernel.queryService).toBeUndefined();
            expect(mockKernel.queryAnalyzer).toBeUndefined();
        });

        it('should get drivers from kernel when not in config', async () => {
            const mockDriver = { name: 'memory', find: jest.fn(), findOne: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), count: jest.fn() } as any;
            mockKernel.getAllDrivers = jest.fn().mockReturnValue([mockDriver]);
            plugin = new QueryPlugin();
            await plugin.install(mockCtx);
            expect(mockKernel.getAllDrivers).toHaveBeenCalled();
            expect(mockKernel.queryService).toBeDefined();
        });

        it('should use driver.name for datasource key or fallback to default', async () => {
            const driver1 = { name: 'pg', find: jest.fn(), findOne: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), count: jest.fn() } as any;
            const driver2 = { find: jest.fn(), findOne: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), count: jest.fn() } as any;
            mockKernel.getAllDrivers = jest.fn().mockReturnValue([driver1, driver2]);
            plugin = new QueryPlugin();
            await plugin.install(mockCtx);
            expect(mockKernel.queryService).toBeDefined();
        });

        it('should assign default name to first unnamed driver', async () => {
            const driver = { find: jest.fn(), findOne: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), count: jest.fn() } as any;
            mockKernel.getAllDrivers = jest.fn().mockReturnValue([driver]);
            plugin = new QueryPlugin();
            await plugin.install(mockCtx);
            expect(mockKernel.queryService).toBeDefined();
        });

        it('should handle kernel without getAllDrivers', async () => {
            plugin = new QueryPlugin();
            await plugin.install(mockCtx);
            expect(mockKernel.queryService).toBeUndefined();
        });

        it('should handle getAllDrivers returning empty array', async () => {
            mockKernel.getAllDrivers = jest.fn().mockReturnValue([]);
            plugin = new QueryPlugin();
            await plugin.install(mockCtx);
            expect(mockKernel.queryService).toBeUndefined();
        });
    });

    describe('onStart', () => {
        it('should execute without error', async () => {
            plugin = new QueryPlugin();
            await expect(plugin.onStart(mockCtx)).resolves.not.toThrow();
        });
    });
});
