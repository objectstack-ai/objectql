/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { createRuntime } from '../src/runtime';
import { BasePlugin, QueryProcessorPlugin } from '@objectql/types';

describe('Runtime Integration', () => {
    describe('createRuntime factory', () => {
        it('should create runtime with no plugins', () => {
            const runtime = createRuntime();
            expect(runtime).toBeDefined();
            expect(runtime.pluginManager).toBeDefined();
        });

        it('should create runtime with plugins', () => {
            const plugin: BasePlugin = {
                metadata: { name: 'test' }
            };

            const runtime = createRuntime({ plugins: [plugin] });
            expect(runtime.pluginManager.get('test')).toBe(plugin);
        });
    });

    describe('runtime initialization', () => {
        it('should initialize plugins on init()', async () => {
            const setupCalls: string[] = [];

            const plugin1: BasePlugin = {
                metadata: { name: 'p1' },
                async setup() {
                    setupCalls.push('p1');
                }
            };

            const plugin2: BasePlugin = {
                metadata: { name: 'p2', dependencies: ['p1'] },
                async setup() {
                    setupCalls.push('p2');
                }
            };

            const runtime = createRuntime({ plugins: [plugin2, plugin1] });
            await runtime.init();

            expect(setupCalls).toEqual(['p1', 'p2']);
        });

        it('should pass runtime instance to plugin setup', async () => {
            let receivedRuntime: any;

            const plugin: BasePlugin = {
                metadata: { name: 'test' },
                async setup(runtime) {
                    receivedRuntime = runtime;
                }
            };

            const runtime = createRuntime({ plugins: [plugin] });
            await runtime.init();

            expect(receivedRuntime).toBe(runtime);
        });
    });

    describe('query execution', () => {
        it('should require query executor to be set', async () => {
            const runtime = createRuntime();
            await runtime.init();

            await expect(
                runtime.query('project', {})
            ).rejects.toThrow('Query executor not set');
        });

        it('should execute query through pipeline', async () => {
            const mockExecutor = jest.fn().mockResolvedValue([
                { id: 1, name: 'Project 1' }
            ]);

            const runtime = createRuntime();
            runtime.setQueryExecutor(mockExecutor);
            await runtime.init();

            const results = await runtime.query('project', {
                filters: [['status', '=', 'active']]
            });

            expect(results).toEqual([{ id: 1, name: 'Project 1' }]);
            expect(mockExecutor).toHaveBeenCalledWith('project', {
                filters: [['status', '=', 'active']]
            });
        });

        it('should execute query with context', async () => {
            let receivedContext: any;

            const plugin: QueryProcessorPlugin = {
                metadata: { name: 'ctx-plugin', type: 'query_processor' },
                async beforeQuery(query, context) {
                    receivedContext = context;
                    return query;
                }
            };

            const runtime = createRuntime({ plugins: [plugin] });
            runtime.setQueryExecutor(async () => []);
            await runtime.init();

            await runtime.query('project', {}, {
                user: { id: 'user-123' }
            });

            expect(receivedContext).toMatchObject({
                objectName: 'project',
                user: { id: 'user-123' }
            });
        });
    });

    describe('complete workflow demonstration', () => {
        it('should demonstrate plugin dependency ordering and query processing', async () => {
            const executionLog: string[] = [];

            // Plugin A: Base plugin (no dependencies)
            const pluginA: BasePlugin = {
                metadata: {
                    name: 'plugin-a',
                    version: '1.0.0',
                    type: 'extension'
                },
                async setup(runtime) {
                    executionLog.push('setup-a');
                }
            };

            // Plugin B: Depends on A
            const pluginB: QueryProcessorPlugin = {
                metadata: {
                    name: 'plugin-b',
                    version: '1.0.0',
                    type: 'query_processor',
                    dependencies: ['plugin-a']
                },
                async setup(runtime) {
                    executionLog.push('setup-b');
                },
                async beforeQuery(query) {
                    executionLog.push('before-b');
                    return { ...query, addedByB: true } as any;
                },
                async afterQuery(results) {
                    executionLog.push('after-b');
                    return results.map(r => ({ ...r, decoratedByB: true }));
                }
            };

            // Plugin C: Depends on B (transitive dependency on A)
            const pluginC: QueryProcessorPlugin = {
                metadata: {
                    name: 'plugin-c',
                    version: '1.0.0',
                    type: 'query_processor',
                    dependencies: ['plugin-b']
                },
                async setup(runtime) {
                    executionLog.push('setup-c');
                },
                async validateQuery(query) {
                    executionLog.push('validate-c');
                },
                async beforeQuery(query) {
                    executionLog.push('before-c');
                    return { ...query, addedByC: true } as any;
                },
                async afterQuery(results) {
                    executionLog.push('after-c');
                    return results.map(r => ({ ...r, decoratedByC: true }));
                }
            };

            // Create runtime with plugins in random order
            const runtime = createRuntime({
                plugins: [pluginC, pluginA, pluginB]
            });

            // Set query executor
            const mockData = [{ id: 1, name: 'Test' }];
            runtime.setQueryExecutor(async (objectName, query) => {
                executionLog.push('execute');
                return mockData;
            });

            // Initialize runtime (should setup in dependency order)
            await runtime.init();

            // Execute query
            const results = await runtime.query('project', {
                filters: [['status', '=', 'active']]
            });

            // Verify setup order (A -> B -> C)
            expect(executionLog.slice(0, 3)).toEqual(['setup-a', 'setup-b', 'setup-c']);

            // Verify execution order
            expect(executionLog).toEqual([
                'setup-a',        // Setup phase (dependency order)
                'setup-b',
                'setup-c',
                'validate-c',     // Validation phase (only C has validator)
                'before-c',       // Before phase (C then B - registration order)
                'before-b',
                'execute',        // Execution
                'after-c',        // After phase (C then B - registration order)
                'after-b'
            ]);

            // Verify results were transformed by both plugins
            expect(results).toEqual([{
                id: 1,
                name: 'Test',
                decoratedByB: true,
                decoratedByC: true
            }]);
        });
    });

    describe('runtime shutdown', () => {
        it('should shutdown all plugins', async () => {
            const teardownCalls: string[] = [];

            const plugin1: BasePlugin = {
                metadata: { name: 'p1' },
                async setup() {},
                async teardown() {
                    teardownCalls.push('p1');
                }
            };

            const plugin2: BasePlugin = {
                metadata: { name: 'p2', dependencies: ['p1'] },
                async setup() {},
                async teardown() {
                    teardownCalls.push('p2');
                }
            };

            const runtime = createRuntime({ plugins: [plugin1, plugin2] });
            await runtime.init();
            await runtime.shutdown();

            // Should teardown in reverse order
            expect(teardownCalls).toEqual(['p2', 'p1']);
        });
    });
});
