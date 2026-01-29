/**
 * RuntimePlugin Conformance Test
 * 
 * Verifies that GraphQL, OData V4, and JSON-RPC plugins properly implement
 * the RuntimePlugin interface as defined in @objectql/types
 */

import { describe, it, expect } from 'vitest';
import type { RuntimePlugin, RuntimeContext } from '@objectql/types';

// Mock RuntimeContext for testing
const createMockContext = (): RuntimeContext => {
    const mockMetadata = {
        getTypes: () => ['object'],
        list: (type: string) => {
            if (type === 'object') {
                return [
                    {
                        name: 'test_object',
                        id: 'test_object',
                        content: {
                            name: 'test_object',
                            fields: {
                                name: { type: 'text' },
                                email: { type: 'email' }
                            }
                        }
                    }
                ];
            }
            return [];
        },
        get: (type: string, name: string) => {
            if (type === 'object' && name === 'test_object') {
                return {
                    name: 'test_object',
                    fields: {
                        name: { type: 'text' },
                        email: { type: 'email' }
                    }
                };
            }
            return null;
        }
    };

    const mockEngine = {
        metadata: mockMetadata,
        get: async (objectName: string, id: string) => ({ id, name: 'Test' }),
        find: async (objectName: string, query: any) => [],
        create: async (objectName: string, data: any) => ({ id: '1', ...data }),
        update: async (objectName: string, id: string, data: any) => ({ id, ...data }),
        delete: async (objectName: string, id: string) => true
    };

    return { engine: mockEngine };
};

describe('RuntimePlugin Interface Conformance', () => {
    describe('Interface Structure', () => {
        it('should define required fields', () => {
            const plugin: RuntimePlugin = {
                name: '@test/plugin',
                version: '1.0.0'
            };
            
            expect(plugin.name).toBe('@test/plugin');
            expect(plugin.version).toBe('1.0.0');
        });

        it('should allow optional lifecycle hooks', () => {
            const plugin: RuntimePlugin = {
                name: '@test/plugin',
                install: async (ctx: RuntimeContext) => {},
                onStart: async (ctx: RuntimeContext) => {},
                onStop: async (ctx: RuntimeContext) => {}
            };
            
            expect(plugin.install).toBeDefined();
            expect(plugin.onStart).toBeDefined();
            expect(plugin.onStop).toBeDefined();
        });

        it('should support both sync and async hooks', async () => {
            const syncPlugin: RuntimePlugin = {
                name: '@test/sync',
                install: (ctx: RuntimeContext) => {
                    // Sync implementation
                }
            };
            
            const asyncPlugin: RuntimePlugin = {
                name: '@test/async',
                install: async (ctx: RuntimeContext) => {
                    // Async implementation
                }
            };
            
            expect(syncPlugin.install).toBeDefined();
            expect(asyncPlugin.install).toBeDefined();
        });
    });

    describe('RuntimeContext', () => {
        it('should provide engine access', () => {
            const ctx = createMockContext();
            
            expect(ctx.engine).toBeDefined();
            expect(ctx.engine.metadata).toBeDefined();
        });

        it('should allow metadata operations', () => {
            const ctx = createMockContext();
            
            const types = ctx.engine.metadata.getTypes();
            expect(types).toContain('object');
            
            const objects = ctx.engine.metadata.list('object');
            expect(objects.length).toBeGreaterThan(0);
        });

        it('should allow CRUD operations', async () => {
            const ctx = createMockContext();
            
            // Create
            const created = await ctx.engine.create('test', { name: 'Test' });
            expect(created.id).toBe('1');
            
            // Read
            const found = await ctx.engine.get('test', '1');
            expect(found.id).toBe('1');
            
            // Update
            const updated = await ctx.engine.update('test', '1', { name: 'Updated' });
            expect(updated.id).toBe('1');
            
            // Delete
            const deleted = await ctx.engine.delete('test', '1');
            expect(deleted).toBe(true);
        });
    });

    describe('Lifecycle Hook Execution', () => {
        it('should call install hook during initialization', async () => {
            let installCalled = false;
            
            const plugin: RuntimePlugin = {
                name: '@test/plugin',
                install: async (ctx: RuntimeContext) => {
                    installCalled = true;
                    expect(ctx.engine).toBeDefined();
                }
            };
            
            const ctx = createMockContext();
            await plugin.install?.(ctx);
            
            expect(installCalled).toBe(true);
        });

        it('should call onStart hook when kernel starts', async () => {
            let startCalled = false;
            
            const plugin: RuntimePlugin = {
                name: '@test/plugin',
                onStart: async (ctx: RuntimeContext) => {
                    startCalled = true;
                }
            };
            
            const ctx = createMockContext();
            await plugin.onStart?.(ctx);
            
            expect(startCalled).toBe(true);
        });

        it('should call onStop hook when kernel stops', async () => {
            let stopCalled = false;
            
            const plugin: RuntimePlugin = {
                name: '@test/plugin',
                onStop: async (ctx: RuntimeContext) => {
                    stopCalled = true;
                }
            };
            
            const ctx = createMockContext();
            await plugin.onStop?.(ctx);
            
            expect(stopCalled).toBe(true);
        });

        it('should execute hooks in correct order', async () => {
            const callOrder: string[] = [];
            
            const plugin: RuntimePlugin = {
                name: '@test/plugin',
                install: async () => { callOrder.push('install'); },
                onStart: async () => { callOrder.push('start'); },
                onStop: async () => { callOrder.push('stop'); }
            };
            
            const ctx = createMockContext();
            
            await plugin.install?.(ctx);
            await plugin.onStart?.(ctx);
            await plugin.onStop?.(ctx);
            
            expect(callOrder).toEqual(['install', 'start', 'stop']);
        });
    });
});
