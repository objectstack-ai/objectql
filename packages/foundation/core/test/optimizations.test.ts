/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Import from the plugin package where the optimization modules now live
import {
    OptimizedMetadataRegistry,
    QueryCompiler,
    CompiledHookManager,
    GlobalConnectionPool,
    OptimizedValidationEngine,
    LazyMetadataLoader,
    DependencyGraph,
    SQLQueryOptimizer
} from '@objectql/plugin-optimizations';

describe('Kernel Optimizations', () => {
    describe('OptimizedMetadataRegistry', () => {
        let registry: OptimizedMetadataRegistry;

        beforeEach(() => {
            registry = new OptimizedMetadataRegistry();
        });

        it('should register and retrieve metadata', () => {
            const item = { name: 'user', package: 'crm', fields: {} };
            registry.register('object', item);

            const retrieved = registry.get('object', 'user');
            expect(retrieved).toEqual(item);
        });

        it('should unregister package with O(k) complexity', () => {
            // Register multiple items in the same package
            registry.register('object', { name: 'user', package: 'crm' });
            registry.register('object', { name: 'account', package: 'crm' });
            registry.register('object', { name: 'task', package: 'todo' });

            // Unregister the 'crm' package
            registry.unregisterPackage('crm');

            // Verify items are removed
            expect(registry.get('object', 'user')).toBeUndefined();
            expect(registry.get('object', 'account')).toBeUndefined();
            
            // Verify other package items remain
            expect(registry.get('object', 'task')).toBeDefined();
        });

        it('should list items by type', () => {
            registry.register('object', { name: 'user', package: 'crm' });
            registry.register('object', { name: 'account', package: 'crm' });

            const objects = registry.list('object');
            expect(objects.length).toBe(2);
        });
    });

    describe('QueryCompiler', () => {
        let compiler: QueryCompiler;

        beforeEach(() => {
            compiler = new QueryCompiler(10);
        });

        it('should compile and cache queries', () => {
            const ast = { 
                filters: { status: 'active' }, 
                sort: [{ field: 'created', order: 'desc' as const }] 
            };
            
            const compiled1 = compiler.compile('user', ast);
            const compiled2 = compiler.compile('user', ast);

            // Should return same cached instance
            expect(compiled1).toBe(compiled2);
        });

        it('should detect indexable fields', () => {
            const ast = { 
                filters: { status: 'active', email: 'test@example.com' } 
            };
            
            const compiled = compiler.compile('user', ast);
            expect(compiled.plan.useIndex).toContain('status');
            expect(compiled.plan.useIndex).toContain('email');
        });

        it('should cache different queries separately', () => {
            const ast1 = { filters: { status: 'active' } };
            const ast2 = { filters: { status: 'inactive' } };
            
            const compiled1 = compiler.compile('user', ast1);
            const compiled2 = compiler.compile('user', ast2);

            // Should be different instances
            expect(compiled1).not.toBe(compiled2);
        });

        it('should clear cache', () => {
            const ast = { filters: { status: 'active' } };
            compiler.compile('user', ast);
            
            compiler.clearCache();
            
            const compiled = compiler.compile('user', ast);
            expect(compiled).toBeDefined();
        });
    });

    describe('CompiledHookManager', () => {
        let hookManager: CompiledHookManager;

        beforeEach(() => {
            hookManager = new CompiledHookManager();
        });

        it('should register and run hooks', async () => {
            let executed = false;
            const handler = async () => { executed = true; };

            hookManager.registerHook('beforeCreate', 'user', handler);
            await hookManager.runHooks('beforeCreate', 'user', {});

            expect(executed).toBe(true);
        });

        it('should expand wildcard patterns', async () => {
            let count = 0;
            const handler = async () => { count++; };

            hookManager.registerHook('before*', 'user', handler);
            
            await hookManager.runHooks('beforeCreate', 'user', {});
            await hookManager.runHooks('beforeUpdate', 'user', {});

            expect(count).toBe(2);
        });

        it('should handle wildcard object names', async () => {
            let count = 0;
            const handler = async () => { count++; };

            hookManager.registerHook('beforeCreate', '*', handler);
            
            await hookManager.runHooks('beforeCreate', 'user', {});
            await hookManager.runHooks('beforeCreate', 'account', {});

            expect(count).toBe(2);
        });

        it('should remove package hooks', async () => {
            let executed = false;
            const handler = async () => { executed = true; };

            hookManager.registerHook('beforeCreate', 'user', handler, 'crm');
            hookManager.removePackage('crm');
            
            await hookManager.runHooks('beforeCreate', 'user', {});

            expect(executed).toBe(false);
        });
    });

    describe('GlobalConnectionPool', () => {
        let pool: GlobalConnectionPool;

        beforeEach(() => {
            pool = new GlobalConnectionPool({ total: 5, perDriver: 3 });
        });

        it('should acquire and release connections', async () => {
            const conn = await pool.acquire('postgres');
            expect(conn).toBeDefined();
            expect(conn.driverName).toBe('postgres');

            await pool.release(conn);
            const stats = pool.getStats();
            expect(stats.driverStats.postgres.idle).toBe(1);
        });

        it('should enforce per-driver limits', async () => {
            const conns = [];
            for (let i = 0; i < 3; i++) {
                conns.push(await pool.acquire('postgres'));
            }

            // Should queue the next request
            const promise = pool.acquire('postgres');
            const stats = pool.getStats();
            expect(stats.waitQueueSize).toBe(1);

            // Release one connection
            await pool.release(conns[0]);
            
            // Now the queued request should complete
            const conn = await promise;
            expect(conn).toBeDefined();
        });

        it('should track connection statistics', async () => {
            await pool.acquire('postgres');
            await pool.acquire('postgres');
            
            const stats = pool.getStats();
            expect(stats.totalConnections).toBe(2);
            expect(stats.driverStats.postgres.active).toBe(2);
        });
    });

    describe('OptimizedValidationEngine', () => {
        let engine: OptimizedValidationEngine;

        beforeEach(() => {
            engine = new OptimizedValidationEngine();
        });

        it('should compile and validate schemas', () => {
            const schema = {
                type: 'object',
                properties: {
                    name: { type: 'string', required: true, minLength: 3 },
                    age: { type: 'number', minimum: 0, maximum: 120 }
                }
            };

            engine.compile('user', schema);

            const result = engine.validate('user', {
                name: 'John',
                age: 30
            });

            expect(result.valid).toBe(true);
        });

        it('should detect validation errors', () => {
            const schema = {
                type: 'object',
                properties: {
                    email: { type: 'string', pattern: '^[^@]+@[^@]+\\.[^@]+$' }
                }
            };

            engine.compile('user', schema);

            const result = engine.validate('user', {
                email: 'invalid-email'
            });

            expect(result.valid).toBe(false);
            expect(result.errors).toBeDefined();
        });

        it('should validate enum values', () => {
            const schema = {
                type: 'string',
                enum: ['active', 'inactive', 'pending']
            };

            engine.compile('status', schema);

            const validResult = engine.validate('status', 'active');
            expect(validResult.valid).toBe(true);

            const invalidResult = engine.validate('status', 'unknown');
            expect(invalidResult.valid).toBe(false);
        });
    });

    describe('LazyMetadataLoader', () => {
        let loader: LazyMetadataLoader;
        let loadCount: number;

        beforeEach(() => {
            loadCount = 0;
            loader = new LazyMetadataLoader(async (objectName) => {
                loadCount++;
                return {
                    name: objectName,
                    fields: { id: { type: 'string' } },
                    relatedObjects: objectName === 'user' ? ['account'] : []
                };
            });
        });

        it('should load metadata on-demand', async () => {
            const metadata = await loader.get('user');
            expect(metadata.name).toBe('user');
            expect(loadCount).toBe(1);
        });

        it('should cache loaded metadata', async () => {
            await loader.get('user');
            await loader.get('user');
            
            // Should only load once
            expect(loadCount).toBe(1);
        });

        it('should predictively preload related objects', async () => {
            await loader.get('user');
            
            // Give time for async preload
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Account should have been preloaded
            expect(loader.isLoaded('account')).toBe(true);
        });

        it('should invalidate cache', async () => {
            await loader.get('user');
            loader.invalidate('user');
            
            await loader.get('user');
            expect(loadCount).toBe(2);
        });
    });

    describe('DependencyGraph', () => {
        let graph: DependencyGraph;

        beforeEach(() => {
            graph = new DependencyGraph();
        });

        it('should build dependency graph', () => {
            graph.addDependency('account', 'contact', 'lookup', 'account_id');
            graph.addDependency('account', 'opportunity', 'lookup', 'account_id');

            const dependents = graph.getDependents('account');
            expect(dependents).toContain('contact');
            expect(dependents).toContain('opportunity');
        });

        it('should compute topological sort', () => {
            graph.addDependency('account', 'contact', 'lookup', 'account_id');
            graph.addDependency('contact', 'task', 'lookup', 'contact_id');

            const sorted = graph.topologicalSort(['account', 'contact', 'task']);
            
            // Task should come before contact, contact before account
            expect(sorted.indexOf('task')).toBeLessThan(sorted.indexOf('contact'));
            expect(sorted.indexOf('contact')).toBeLessThan(sorted.indexOf('account'));
        });

        it('should detect circular dependencies', () => {
            graph.addDependency('a', 'b', 'lookup', 'a_id');
            graph.addDependency('b', 'c', 'lookup', 'b_id');
            graph.addDependency('c', 'a', 'lookup', 'c_id');

            expect(graph.hasCircularDependency()).toBe(true);
        });

        it('should get cascade delete order', () => {
            graph.addDependency('account', 'contact', 'master_detail', 'account_id');
            graph.addDependency('contact', 'task', 'master_detail', 'contact_id');

            const deleteOrder = graph.getCascadeDeleteOrder('account');
            
            // Should delete in order: task -> contact -> account
            expect(deleteOrder).toContain('task');
            expect(deleteOrder).toContain('contact');
            expect(deleteOrder).toContain('account');
        });
    });

    describe('SQLQueryOptimizer', () => {
        let optimizer: SQLQueryOptimizer;

        beforeEach(() => {
            optimizer = new SQLQueryOptimizer();
            
            // Register schema with indexes
            optimizer.registerSchema({
                name: 'users',
                fields: {
                    id: { type: 'string' },
                    email: { type: 'string' },
                    status: { type: 'string' }
                },
                indexes: [
                    { name: 'idx_email', fields: ['email'], unique: true },
                    { name: 'idx_status', fields: ['status'], unique: false }
                ]
            });
        });

        it('should generate basic SQL', () => {
            const sql = optimizer.optimize({
                object: 'users',
                fields: ['id', 'email'],
                filters: { status: 'active' }
            });

            expect(sql).toContain('SELECT id, email');
            expect(sql).toContain('FROM users');
            expect(sql).toContain('WHERE');
        });

        it('should add index hints', () => {
            const sql = optimizer.optimize({
                object: 'users',
                filters: { status: 'active' }
            });

            expect(sql).toContain('USE INDEX (idx_status)');
        });

        it('should optimize join types', () => {
            const sql = optimizer.optimize({
                object: 'users',
                joins: [
                    { type: 'left', table: 'accounts', on: 'users.account_id = accounts.id' }
                ],
                filters: { 'accounts.type': 'premium' }
            });

            // Should convert LEFT to INNER when filtering on joined table
            expect(sql).toContain('INNER JOIN');
        });

        it('should handle sorting and limits', () => {
            const sql = optimizer.optimize({
                object: 'users',
                sort: [{ field: 'created_at', order: 'desc' }],
                limit: 10,
                offset: 20
            });

            expect(sql).toContain('ORDER BY created_at DESC');
            expect(sql).toContain('LIMIT 10');
            expect(sql).toContain('OFFSET 20');
        });
    });
});
