/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { PluginManager, PluginError } from '../src/plugin-manager';
import { BasePlugin } from '@objectql/types';

describe('PluginManager', () => {
    let manager: PluginManager;

    beforeEach(() => {
        manager = new PluginManager();
    });

    describe('plugin registration', () => {
        it('should register a plugin successfully', () => {
            const plugin: BasePlugin = {
                metadata: { name: 'test-plugin', version: '1.0.0' }
            };

            manager.register(plugin);
            expect(manager.get('test-plugin')).toBe(plugin);
        });

        it('should throw error for duplicate plugin names', () => {
            const plugin1: BasePlugin = {
                metadata: { name: 'duplicate', version: '1.0.0' }
            };
            const plugin2: BasePlugin = {
                metadata: { name: 'duplicate', version: '2.0.0' }
            };

            manager.register(plugin1);
            expect(() => manager.register(plugin2)).toThrow(PluginError);
            expect(() => manager.register(plugin2)).toThrow('already registered');
        });
    });

    describe('dependency resolution', () => {
        it('should resolve plugins with no dependencies', () => {
            const pluginA: BasePlugin = {
                metadata: { name: 'plugin-a' }
            };
            const pluginB: BasePlugin = {
                metadata: { name: 'plugin-b' }
            };

            manager.register(pluginA);
            manager.register(pluginB);

            const order = manager.resolveDependencies();
            expect(order).toHaveLength(2);
            expect(order).toContain('plugin-a');
            expect(order).toContain('plugin-b');
        });

        it('should resolve plugins with simple dependencies', () => {
            const pluginA: BasePlugin = {
                metadata: { name: 'plugin-a', dependencies: [] }
            };
            const pluginB: BasePlugin = {
                metadata: { name: 'plugin-b', dependencies: ['plugin-a'] }
            };

            manager.register(pluginA);
            manager.register(pluginB);

            const order = manager.resolveDependencies();
            expect(order).toEqual(['plugin-a', 'plugin-b']);
        });

        it('should resolve complex dependency chains', () => {
            // Setup: D depends on C, C depends on B, B depends on A
            const pluginA: BasePlugin = {
                metadata: { name: 'a', dependencies: [] }
            };
            const pluginB: BasePlugin = {
                metadata: { name: 'b', dependencies: ['a'] }
            };
            const pluginC: BasePlugin = {
                metadata: { name: 'c', dependencies: ['b'] }
            };
            const pluginD: BasePlugin = {
                metadata: { name: 'd', dependencies: ['c'] }
            };

            // Register in random order
            manager.register(pluginD);
            manager.register(pluginB);
            manager.register(pluginA);
            manager.register(pluginC);

            const order = manager.resolveDependencies();
            expect(order).toEqual(['a', 'b', 'c', 'd']);
        });

        it('should resolve diamond dependencies correctly', () => {
            // Setup: D depends on B and C, both B and C depend on A
            const pluginA: BasePlugin = {
                metadata: { name: 'a', dependencies: [] }
            };
            const pluginB: BasePlugin = {
                metadata: { name: 'b', dependencies: ['a'] }
            };
            const pluginC: BasePlugin = {
                metadata: { name: 'c', dependencies: ['a'] }
            };
            const pluginD: BasePlugin = {
                metadata: { name: 'd', dependencies: ['b', 'c'] }
            };

            manager.register(pluginA);
            manager.register(pluginB);
            manager.register(pluginC);
            manager.register(pluginD);

            const order = manager.resolveDependencies();
            
            // A must come first
            expect(order[0]).toBe('a');
            // D must come last
            expect(order[3]).toBe('d');
            // B and C must come after A and before D
            expect(order.indexOf('b')).toBeGreaterThan(order.indexOf('a'));
            expect(order.indexOf('c')).toBeGreaterThan(order.indexOf('a'));
            expect(order.indexOf('d')).toBeGreaterThan(order.indexOf('b'));
            expect(order.indexOf('d')).toBeGreaterThan(order.indexOf('c'));
        });

        it('should throw error for missing dependencies', () => {
            const pluginB: BasePlugin = {
                metadata: { name: 'b', dependencies: ['a'] }
            };

            manager.register(pluginB);

            expect(() => manager.resolveDependencies()).toThrow(PluginError);
            expect(() => manager.resolveDependencies()).toThrow('not registered');
        });

        it('should detect circular dependencies', () => {
            const pluginA: BasePlugin = {
                metadata: { name: 'a', dependencies: ['b'] }
            };
            const pluginB: BasePlugin = {
                metadata: { name: 'b', dependencies: ['a'] }
            };

            manager.register(pluginA);
            manager.register(pluginB);

            expect(() => manager.resolveDependencies()).toThrow(PluginError);
            expect(() => manager.resolveDependencies()).toThrow('Circular dependency');
        });

        it('should detect complex circular dependencies', () => {
            const pluginA: BasePlugin = {
                metadata: { name: 'a', dependencies: ['c'] }
            };
            const pluginB: BasePlugin = {
                metadata: { name: 'b', dependencies: ['a'] }
            };
            const pluginC: BasePlugin = {
                metadata: { name: 'c', dependencies: ['b'] }
            };

            manager.register(pluginA);
            manager.register(pluginB);
            manager.register(pluginC);

            expect(() => manager.resolveDependencies()).toThrow(PluginError);
            expect(() => manager.resolveDependencies()).toThrow('Circular dependency');
        });
    });

    describe('plugin boot lifecycle', () => {
        it('should call setup in dependency order', async () => {
            const setupOrder: string[] = [];

            const pluginA: BasePlugin = {
                metadata: { name: 'a' },
                async setup() {
                    setupOrder.push('a');
                }
            };
            const pluginB: BasePlugin = {
                metadata: { name: 'b', dependencies: ['a'] },
                async setup() {
                    setupOrder.push('b');
                }
            };

            manager.register(pluginA);
            manager.register(pluginB);

            await manager.boot({});

            expect(setupOrder).toEqual(['a', 'b']);
            expect(manager.isInitialized()).toBe(true);
        });

        it('should pass runtime to setup hooks', async () => {
            let receivedRuntime: any;

            const plugin: BasePlugin = {
                metadata: { name: 'test' },
                async setup(runtime) {
                    receivedRuntime = runtime;
                }
            };

            manager.register(plugin);

            const mockRuntime = { id: 'test-runtime' };
            await manager.boot(mockRuntime);

            expect(receivedRuntime).toBe(mockRuntime);
        });

        it('should throw error if setup fails', async () => {
            const plugin: BasePlugin = {
                metadata: { name: 'failing-plugin' },
                async setup() {
                    throw new Error('Setup failed');
                }
            };

            manager.register(plugin);

            await expect(manager.boot({})).rejects.toThrow(PluginError);
            await expect(manager.boot({})).rejects.toThrow('Failed to setup');
        });

        it('should not boot twice', async () => {
            const setupCalls = { count: 0 };

            const plugin: BasePlugin = {
                metadata: { name: 'test' },
                async setup() {
                    setupCalls.count++;
                }
            };

            manager.register(plugin);

            await manager.boot({});
            await manager.boot({});

            expect(setupCalls.count).toBe(1);
        });
    });

    describe('plugin shutdown', () => {
        it('should call teardown in reverse order', async () => {
            const teardownOrder: string[] = [];

            const pluginA: BasePlugin = {
                metadata: { name: 'a' },
                async setup() {},
                async teardown() {
                    teardownOrder.push('a');
                }
            };
            const pluginB: BasePlugin = {
                metadata: { name: 'b', dependencies: ['a'] },
                async setup() {},
                async teardown() {
                    teardownOrder.push('b');
                }
            };

            manager.register(pluginA);
            manager.register(pluginB);

            await manager.boot({});
            await manager.shutdown();

            expect(teardownOrder).toEqual(['b', 'a']);
            expect(manager.isInitialized()).toBe(false);
        });

        it('should handle teardown errors gracefully', async () => {
            const consoleError = jest.spyOn(console, 'error').mockImplementation();

            const plugin: BasePlugin = {
                metadata: { name: 'failing' },
                async setup() {},
                async teardown() {
                    throw new Error('Teardown failed');
                }
            };

            manager.register(plugin);
            await manager.boot({});

            await expect(manager.shutdown()).resolves.not.toThrow();
            expect(consoleError).toHaveBeenCalled();

            consoleError.mockRestore();
        });
    });

    describe('plugin queries', () => {
        it('should get all plugins', () => {
            const pluginA: BasePlugin = {
                metadata: { name: 'a', type: 'driver' }
            };
            const pluginB: BasePlugin = {
                metadata: { name: 'b', type: 'extension' }
            };

            manager.register(pluginA);
            manager.register(pluginB);

            const all = manager.getAll();
            expect(all).toHaveLength(2);
            expect(all).toContainEqual(pluginA);
            expect(all).toContainEqual(pluginB);
        });

        it('should get plugins by type', () => {
            const pluginA: BasePlugin = {
                metadata: { name: 'a', type: 'driver' }
            };
            const pluginB: BasePlugin = {
                metadata: { name: 'b', type: 'query_processor' }
            };
            const pluginC: BasePlugin = {
                metadata: { name: 'c', type: 'query_processor' }
            };

            manager.register(pluginA);
            manager.register(pluginB);
            manager.register(pluginC);

            const processors = manager.getByType('query_processor');
            expect(processors).toHaveLength(2);
            expect(processors.map(p => p.metadata.name)).toContain('b');
            expect(processors.map(p => p.metadata.name)).toContain('c');
        });
    });
});
