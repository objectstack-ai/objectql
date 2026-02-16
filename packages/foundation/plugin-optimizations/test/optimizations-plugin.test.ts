/**
 * @objectql/plugin-optimizations — Plugin Tests
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { OptimizationsPlugin } from '../src/plugin';

describe('OptimizationsPlugin', () => {
    let plugin: OptimizationsPlugin;
    let mockKernel: any;
    let mockCtx: any;

    beforeEach(() => {
        mockKernel = {
            metadata: {
                getTypes: jest.fn().mockReturnValue(['objects']),
                list: jest.fn().mockReturnValue([{ name: 'account', label: 'Account' }]),
            },
        };
        mockCtx = {
            engine: mockKernel,
        };
    });

    describe('Plugin Metadata', () => {
        it('should have correct name and version', () => {
            plugin = new OptimizationsPlugin();
            expect(plugin.name).toBe('@objectql/plugin-optimizations');
            expect(plugin.version).toBe('4.2.0');
        });
    });

    describe('Constructor', () => {
        it('should create plugin with default config', () => {
            plugin = new OptimizationsPlugin();
            expect(plugin).toBeDefined();
        });

        it('should create plugin with custom config', () => {
            plugin = new OptimizationsPlugin({
                enableOptimizedRegistry: false,
                enableConnectionPool: false,
                enableQueryCompiler: false,
                poolLimits: { total: 100, perDriver: 50 },
                queryCompilerCacheSize: 2000,
            });
            expect(plugin).toBeDefined();
        });

        it('should merge partial config with defaults', () => {
            plugin = new OptimizationsPlugin({ queryCompilerCacheSize: 500 });
            expect(plugin).toBeDefined();
        });
    });

    describe('install', () => {
        it('should install optimized metadata registry when enabled', async () => {
            plugin = new OptimizationsPlugin({ enableOptimizedRegistry: true });
            await plugin.install(mockCtx);
            expect(mockKernel.optimizedMetadata).toBeDefined();
        });

        it('should copy existing metadata to optimized registry', async () => {
            plugin = new OptimizationsPlugin({ enableOptimizedRegistry: true });
            await plugin.install(mockCtx);
            expect(mockKernel.metadata.getTypes).toHaveBeenCalled();
            expect(mockKernel.metadata.list).toHaveBeenCalledWith('objects');
        });

        it('should not install optimized registry when disabled', async () => {
            plugin = new OptimizationsPlugin({ enableOptimizedRegistry: false });
            await plugin.install(mockCtx);
            expect(mockKernel.optimizedMetadata).toBeUndefined();
        });

        it('should install connection pool when enabled', async () => {
            plugin = new OptimizationsPlugin({ enableConnectionPool: true });
            await plugin.install(mockCtx);
            expect(mockKernel.connectionPool).toBeDefined();
        });

        it('should not install connection pool when disabled', async () => {
            plugin = new OptimizationsPlugin({ enableConnectionPool: false });
            await plugin.install(mockCtx);
            expect(mockKernel.connectionPool).toBeUndefined();
        });

        it('should install query compiler when enabled', async () => {
            plugin = new OptimizationsPlugin({ enableQueryCompiler: true });
            await plugin.install(mockCtx);
            expect(mockKernel.queryCompiler).toBeDefined();
        });

        it('should not install query compiler when disabled', async () => {
            plugin = new OptimizationsPlugin({ enableQueryCompiler: false });
            await plugin.install(mockCtx);
            expect(mockKernel.queryCompiler).toBeUndefined();
        });

        it('should handle kernel without metadata registry', async () => {
            delete mockKernel.metadata;
            plugin = new OptimizationsPlugin({ enableOptimizedRegistry: true });
            await expect(plugin.install(mockCtx)).resolves.not.toThrow();
        });

        it('should call replaceService when available', async () => {
            const replaceService = jest.fn();
            const ctxWithReplace = { ...mockCtx, replaceService };
            plugin = new OptimizationsPlugin({ enableOptimizedRegistry: true });
            await plugin.install(ctxWithReplace);
            expect(replaceService).toHaveBeenCalledWith('metadata', expect.any(Object));
        });
    });

    describe('onStart', () => {
        it('should execute without error', async () => {
            plugin = new OptimizationsPlugin();
            await expect(plugin.onStart(mockCtx)).resolves.not.toThrow();
        });
    });
});
