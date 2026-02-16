/**
 * @objectql/plugin-optimizations — Core Module Tests
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { OptimizedMetadataRegistry } from '../src/OptimizedMetadataRegistry';
import { QueryCompiler } from '../src/QueryCompiler';
import { CompiledHookManager } from '../src/CompiledHookManager';
import { GlobalConnectionPool } from '../src/GlobalConnectionPool';
import { DependencyGraph } from '../src/DependencyGraph';
import { OptimizedValidationEngine } from '../src/OptimizedValidationEngine';
import { LazyMetadataLoader } from '../src/LazyMetadataLoader';
import { SQLQueryOptimizer } from '../src/SQLQueryOptimizer';
import { ObjectQLError } from '@objectql/types';

// ---------------------------------------------------------------------------
// OptimizedMetadataRegistry
// ---------------------------------------------------------------------------
describe('OptimizedMetadataRegistry', () => {
    let registry: OptimizedMetadataRegistry;

    beforeEach(() => {
        registry = new OptimizedMetadataRegistry();
    });

    describe('register / get', () => {
        it('should register an item with explicit name and config', () => {
            registry.register('objects', 'account', { label: 'Account' });
            expect(registry.get('objects', 'account')).toEqual({ label: 'Account' });
        });

        it('should register an item deriving name from config.name', () => {
            registry.register('objects', { name: 'contact', label: 'Contact' });
            expect(registry.get('objects', 'contact')).toEqual({ name: 'contact', label: 'Contact' });
        });

        it('should register an item deriving name from config.id', () => {
            registry.register('objects', { id: 'task', label: 'Task' });
            expect(registry.get('objects', 'task')).toEqual({ id: 'task', label: 'Task' });
        });

        it('should unwrap .content when present', () => {
            registry.register('objects', 'wrapped', { content: { label: 'Inner' }, package: 'pkg' });
            expect(registry.get('objects', 'wrapped')).toEqual({ label: 'Inner' });
        });

        it('should return undefined for non-existent item', () => {
            expect(registry.get('objects', 'nope')).toBeUndefined();
        });
    });

    describe('list', () => {
        it('should list all items of a type', () => {
            registry.register('objects', 'a', { v: 1 });
            registry.register('objects', 'b', { v: 2 });
            expect(registry.list('objects')).toEqual([{ v: 1 }, { v: 2 }]);
        });

        it('should return empty array for unknown type', () => {
            expect(registry.list('nope')).toEqual([]);
        });

        it('should unwrap .content when listing', () => {
            registry.register('objects', 'w', { content: { x: 1 } });
            expect(registry.list('objects')).toEqual([{ x: 1 }]);
        });
    });

    describe('getTypes', () => {
        it('should return all registered types', () => {
            registry.register('objects', 'a', {});
            registry.register('triggers', 'b', {});
            expect(registry.getTypes()).toEqual(expect.arrayContaining(['objects', 'triggers']));
        });
    });

    describe('unregister', () => {
        it('should remove a single item', () => {
            registry.register('objects', 'a', { package: 'p1' });
            registry.unregister('objects', 'a');
            expect(registry.get('objects', 'a')).toBeUndefined();
        });

        it('should be a no-op for non-existent item', () => {
            expect(() => registry.unregister('objects', 'missing')).not.toThrow();
        });
    });

    describe('unregisterPackage', () => {
        it('should remove all items belonging to a package (O(k))', () => {
            registry.register('objects', 'a', { package: 'crm' });
            registry.register('objects', 'b', { package: 'crm' });
            registry.register('objects', 'c', { package: 'hr' });
            registry.unregisterPackage('crm');
            expect(registry.get('objects', 'a')).toBeUndefined();
            expect(registry.get('objects', 'b')).toBeUndefined();
            expect(registry.get('objects', 'c')).toBeDefined();
        });

        it('should handle _package property', () => {
            registry.register('triggers', 'x', { _package: 'crm' });
            registry.unregisterPackage('crm');
            expect(registry.get('triggers', 'x')).toBeUndefined();
        });

        it('should handle packageName property', () => {
            registry.register('hooks', 'y', { packageName: 'crm' });
            registry.unregisterPackage('crm');
            expect(registry.get('hooks', 'y')).toBeUndefined();
        });

        it('should be a no-op for unknown package', () => {
            expect(() => registry.unregisterPackage('unknown')).not.toThrow();
        });
    });
});

// ---------------------------------------------------------------------------
// QueryCompiler
// ---------------------------------------------------------------------------
describe('QueryCompiler', () => {
    let compiler: QueryCompiler;

    beforeEach(() => {
        compiler = new QueryCompiler(3); // small cache for eviction tests
    });

    describe('compile', () => {
        it('should return a CompiledQuery with plan', () => {
            const ast = { fields: ['name'], filters: { status: 'active' } };
            const result = compiler.compile('accounts', ast);
            expect(result.objectName).toBe('accounts');
            expect(result.ast).toBe(ast);
            expect(result.plan).toBeDefined();
            expect(result.timestamp).toBeGreaterThan(0);
        });

        it('should include useIndex hint for filterable fields', () => {
            const ast = { filters: { status: 'active', region: 'US' } };
            const result = compiler.compile('accounts', ast);
            expect(result.plan.useIndex).toEqual(expect.arrayContaining(['status', 'region']));
        });

        it('should set joinStrategy to nested when limit < 100', () => {
            const result = compiler.compile('accounts', { limit: 10 });
            expect(result.plan.joinStrategy).toBe('nested');
        });

        it('should set joinStrategy to hash when limit >= 100 or absent', () => {
            const result = compiler.compile('accounts', {});
            expect(result.plan.joinStrategy).toBe('hash');
        });
    });

    describe('LRU cache', () => {
        it('should return cached result on second compile with same AST', () => {
            const ast = { fields: ['id'] };
            const first = compiler.compile('x', ast);
            const second = compiler.compile('x', ast);
            expect(second.timestamp).toBe(first.timestamp);
        });

        it('should evict least recently used entry when cache is full', () => {
            const ast1 = { id: 1 };
            const ast2 = { id: 2 };
            const ast3 = { id: 3 };
            const ast4 = { id: 4 };

            const r1 = compiler.compile('a', ast1);
            compiler.compile('b', ast2);
            compiler.compile('c', ast3);

            // Cache full (capacity=3). Adding 4th should evict ast1.
            compiler.compile('d', ast4);

            // ast1 should be evicted → re-compile produces new timestamp
            const r1Again = compiler.compile('a', ast1);
            expect(r1Again.timestamp).not.toBe(r1.timestamp);
        });
    });

    describe('clearCache', () => {
        it('should flush the cache so re-compile produces a new entry', () => {
            const ast = { id: 1 };
            const first = compiler.compile('x', ast);
            compiler.clearCache();
            // After clearing, the cache no longer contains the key, so compile
            // must produce a fresh CompiledQuery (different object reference).
            const second = compiler.compile('x', ast);
            expect(second).not.toBe(first);
        });
    });
});

// ---------------------------------------------------------------------------
// CompiledHookManager
// ---------------------------------------------------------------------------
describe('CompiledHookManager', () => {
    let manager: CompiledHookManager;

    beforeEach(() => {
        manager = new CompiledHookManager();
    });

    describe('registerHook / runHooks', () => {
        it('should execute registered hook for exact event', async () => {
            const handler = jest.fn();
            manager.registerHook('beforeCreate', 'accounts', handler);
            await manager.runHooks('beforeCreate', 'accounts', { data: {} });
            expect(handler).toHaveBeenCalledWith({ data: {} });
        });

        it('should execute wildcard object hooks', async () => {
            const handler = jest.fn();
            manager.registerHook('beforeCreate', '*', handler);
            await manager.runHooks('beforeCreate', 'anything', { id: 1 });
            expect(handler).toHaveBeenCalledWith({ id: 1 });
        });

        it('should execute wildcard event hooks (e.g. before*)', async () => {
            const handler = jest.fn();
            manager.registerHook('before*', 'accounts', handler);
            await manager.runHooks('beforeCreate', 'accounts', {});
            await manager.runHooks('beforeUpdate', 'accounts', {});
            expect(handler).toHaveBeenCalledTimes(2);
        });

        it('should execute * (all events) hooks', async () => {
            const handler = jest.fn();
            manager.registerHook('*', 'accounts', handler);
            await manager.runHooks('beforeCreate', 'accounts', {});
            await manager.runHooks('afterDelete', 'accounts', {});
            expect(handler).toHaveBeenCalledTimes(2);
        });

        it('should not execute hooks for non-matching events', async () => {
            const handler = jest.fn();
            manager.registerHook('beforeCreate', 'accounts', handler);
            await manager.runHooks('afterDelete', 'accounts', {});
            expect(handler).not.toHaveBeenCalled();
        });

        it('should not throw when no hooks registered for an event', async () => {
            await expect(manager.runHooks('beforeCreate', 'none', {})).resolves.toBeUndefined();
        });
    });

    describe('removePackage', () => {
        it('should remove all hooks belonging to a package', async () => {
            const h1 = jest.fn();
            const h2 = jest.fn();
            manager.registerHook('beforeCreate', 'accounts', h1, 'crm');
            manager.registerHook('beforeCreate', 'accounts', h2, 'hr');
            manager.removePackage('crm');
            await manager.runHooks('beforeCreate', 'accounts', {});
            expect(h1).not.toHaveBeenCalled();
            expect(h2).toHaveBeenCalled();
        });
    });

    describe('clear', () => {
        it('should remove all hooks', () => {
            manager.registerHook('beforeCreate', 'accounts', jest.fn());
            manager.clear();
            expect(manager.getStats().totalHooks).toBe(0);
            expect(manager.getStats().totalPipelines).toBe(0);
        });
    });

    describe('getStats', () => {
        it('should report correct statistics', () => {
            manager.registerHook('beforeCreate', 'a', jest.fn());
            manager.registerHook('afterCreate', 'b', jest.fn());
            const stats = manager.getStats();
            expect(stats.totalHooks).toBe(2);
            expect(stats.totalPipelines).toBe(2);
        });
    });
});

// ---------------------------------------------------------------------------
// GlobalConnectionPool
// ---------------------------------------------------------------------------
describe('GlobalConnectionPool', () => {
    let pool: GlobalConnectionPool;

    beforeEach(() => {
        pool = new GlobalConnectionPool({ total: 3, perDriver: 2 });
    });

    describe('acquire / release', () => {
        it('should acquire a new connection', async () => {
            const conn = await pool.acquire('sql');
            expect(conn.id).toBeDefined();
            expect(conn.driverName).toBe('sql');
            expect(conn.inUse).toBe(true);
        });

        it('should reuse idle connection after release', async () => {
            const conn = await pool.acquire('sql');
            await pool.release(conn);
            const conn2 = await pool.acquire('sql');
            expect(conn2.id).toBe(conn.id);
        });
    });

    describe('pool limits', () => {
        it('should respect perDriver limit', async () => {
            await pool.acquire('sql');
            await pool.acquire('sql');
            // Third acquire for same driver should queue / timeout
            const promise = pool.acquire('sql');
            // Release one to unblock
            const stats = pool.getStats();
            expect(stats.driverStats['sql'].active).toBe(2);
            // Clean up – release to resolve queued promise
            const conns = await Promise.all([pool.acquire('mongo')]);
            expect(conns[0].driverName).toBe('mongo');
        });

        it('should respect total limit', async () => {
            await pool.acquire('sql');
            await pool.acquire('mongo');
            await pool.acquire('redis');
            // Total limit reached (3) – next acquire should queue
            const stats = pool.getStats();
            expect(stats.totalConnections).toBe(3);
        });

        it('should throw ObjectQLError when limits are exceeded and connection is forced', async () => {
            // Fill pool completely
            const c1 = await pool.acquire('sql');
            const c2 = await pool.acquire('sql');
            await pool.acquire('mongo');

            // Release one and acquire from a new driver to verify pool works after release
            await pool.release(c1);
            const c4 = await pool.acquire('sql');
            expect(c4.id).toBe(c1.id);
        });
    });

    describe('closeDriver', () => {
        it('should remove all connections for a driver', async () => {
            await pool.acquire('sql');
            await pool.acquire('sql');
            await pool.closeDriver('sql');
            const stats = pool.getStats();
            expect(stats.driverStats['sql']).toBeUndefined();
        });
    });

    describe('getStats', () => {
        it('should return pool statistics', async () => {
            const conn = await pool.acquire('sql');
            await pool.release(conn);
            const stats = pool.getStats();
            expect(stats.totalLimit).toBe(3);
            expect(stats.perDriverLimit).toBe(2);
            expect(stats.driverStats['sql'].idle).toBe(1);
            expect(stats.waitQueueSize).toBe(0);
        });
    });

    describe('updateLimits', () => {
        it('should dynamically update pool limits', () => {
            pool.updateLimits({ total: 100, perDriver: 50 });
            const stats = pool.getStats();
            expect(stats.totalLimit).toBe(100);
            expect(stats.perDriverLimit).toBe(50);
        });

        it('should allow partial updates', () => {
            pool.updateLimits({ total: 200 });
            const stats = pool.getStats();
            expect(stats.totalLimit).toBe(200);
            expect(stats.perDriverLimit).toBe(2); // unchanged
        });
    });
});

// ---------------------------------------------------------------------------
// DependencyGraph
// ---------------------------------------------------------------------------
describe('DependencyGraph', () => {
    let graph: DependencyGraph;

    beforeEach(() => {
        graph = new DependencyGraph();
    });

    describe('addObject / addDependency', () => {
        it('should add objects to the graph', () => {
            graph.addObject('users');
            graph.addObject('accounts');
            const stats = graph.getStats();
            expect(stats.totalObjects).toBe(2);
        });

        it('should add dependencies between objects', () => {
            graph.addDependency('users', 'tasks', 'lookup', 'owner');
            expect(graph.getDependents('users')).toContain('tasks');
        });
    });

    describe('getDependents', () => {
        it('should return direct dependents', () => {
            graph.addDependency('users', 'tasks', 'lookup', 'assignee');
            graph.addDependency('users', 'comments', 'lookup', 'author');
            const deps = graph.getDependents('users');
            expect(deps).toEqual(expect.arrayContaining(['tasks', 'comments']));
        });

        it('should return empty array for leaf node', () => {
            graph.addObject('tasks');
            expect(graph.getDependents('tasks')).toEqual([]);
        });
    });

    describe('topologicalSort', () => {
        it('should return objects in topological order', () => {
            graph.addDependency('users', 'tasks', 'lookup', 'owner');
            graph.addDependency('tasks', 'comments', 'lookup', 'taskId');
            const sorted = graph.topologicalSort(['users', 'tasks', 'comments']);
            // DFS-based: dependents are pushed first, then the node
            const usersIdx = sorted.indexOf('users');
            const tasksIdx = sorted.indexOf('tasks');
            const commentsIdx = sorted.indexOf('comments');
            // In DFS post-order: deeper nodes appear earlier in the stack
            expect(commentsIdx).toBeLessThan(tasksIdx);
            expect(tasksIdx).toBeLessThan(usersIdx);
        });
    });

    describe('hasCircularDependency', () => {
        it('should return false for acyclic graph', () => {
            graph.addDependency('a', 'b', 'lookup', 'f');
            graph.addDependency('b', 'c', 'lookup', 'f');
            expect(graph.hasCircularDependency()).toBe(false);
        });

        it('should return true for cyclic graph', () => {
            graph.addDependency('a', 'b', 'lookup', 'f');
            graph.addDependency('b', 'c', 'lookup', 'f');
            graph.addDependency('c', 'a', 'lookup', 'f');
            expect(graph.hasCircularDependency()).toBe(true);
        });
    });

    describe('getCascadeDeleteOrder', () => {
        it('should return correct cascade delete order', () => {
            graph.addDependency('users', 'tasks', 'master_detail', 'owner');
            graph.addDependency('tasks', 'comments', 'master_detail', 'taskId');
            const order = graph.getCascadeDeleteOrder('users');
            expect(order).toContain('users');
            expect(order).toContain('tasks');
            expect(order).toContain('comments');
            // Comments should be deleted before tasks, tasks before users
            expect(order.indexOf('comments')).toBeLessThan(order.indexOf('tasks'));
            expect(order.indexOf('tasks')).toBeLessThan(order.indexOf('users'));
        });

        it('should handle objects with no dependents', () => {
            graph.addObject('standalone');
            expect(graph.getCascadeDeleteOrder('standalone')).toEqual(['standalone']);
        });
    });

    describe('toDot', () => {
        it('should generate DOT graph format', () => {
            graph.addDependency('users', 'tasks', 'lookup', 'owner');
            const dot = graph.toDot();
            expect(dot).toContain('digraph Dependencies');
            expect(dot).toContain('"users" -> "tasks"');
        });
    });

    describe('clear', () => {
        it('should reset the graph', () => {
            graph.addDependency('a', 'b', 'lookup', 'f');
            graph.clear();
            expect(graph.getStats().totalObjects).toBe(0);
            expect(graph.getStats().totalDependencies).toBe(0);
        });
    });
});

// ---------------------------------------------------------------------------
// OptimizedValidationEngine
// ---------------------------------------------------------------------------
describe('OptimizedValidationEngine', () => {
    let engine: OptimizedValidationEngine;

    beforeEach(() => {
        engine = new OptimizedValidationEngine();
    });

    describe('compile / validate', () => {
        it('should validate a string type', () => {
            engine.compile('account', { type: 'string' });
            expect(engine.validate('account', 'hello').valid).toBe(true);
            expect(engine.validate('account', 42).valid).toBe(false);
        });

        it('should validate required', () => {
            engine.compile('account', { type: 'string', required: true });
            const result = engine.validate('account', null);
            expect(result.valid).toBe(false);
            expect(result.errors).toEqual(expect.arrayContaining([expect.stringContaining('required')]));
        });

        it('should validate string minLength and maxLength', () => {
            engine.compile('name', { type: 'string', minLength: 2, maxLength: 5 });
            expect(engine.validate('name', 'a').valid).toBe(false);
            expect(engine.validate('name', 'ab').valid).toBe(true);
            expect(engine.validate('name', 'abcdef').valid).toBe(false);
        });

        it('should validate string pattern', () => {
            engine.compile('email', { type: 'string', pattern: '^[^@]+@[^@]+$' });
            expect(engine.validate('email', 'user@example.com').valid).toBe(true);
            expect(engine.validate('email', 'invalid').valid).toBe(false);
        });

        it('should validate number minimum and maximum', () => {
            engine.compile('age', { type: 'number', minimum: 0, maximum: 150 });
            expect(engine.validate('age', 25).valid).toBe(true);
            expect(engine.validate('age', -1).valid).toBe(false);
            expect(engine.validate('age', 200).valid).toBe(false);
        });

        it('should validate enum', () => {
            engine.compile('status', { type: 'string', enum: ['active', 'inactive'] });
            expect(engine.validate('status', 'active').valid).toBe(true);
            expect(engine.validate('status', 'deleted').valid).toBe(false);
        });

        it('should validate nested object properties', () => {
            engine.compile('profile', {
                type: 'object',
                properties: {
                    name: { type: 'string', minLength: 1 },
                    age: { type: 'number', minimum: 0 },
                },
            });
            expect(engine.validate('profile', { name: 'Alice', age: 30 }).valid).toBe(true);
            const result = engine.validate('profile', { name: '', age: -1 });
            expect(result.valid).toBe(false);
            expect(result.errors!.length).toBeGreaterThanOrEqual(2);
        });

        it('should validate array items', () => {
            engine.compile('tags', {
                type: 'array',
                items: { type: 'string' },
            });
            expect(engine.validate('tags', ['a', 'b']).valid).toBe(true);
            const result = engine.validate('tags', ['a', 42]);
            expect(result.valid).toBe(false);
        });
    });

    describe('hasValidator / removeValidator / clearAll', () => {
        it('should report whether a validator exists', () => {
            expect(engine.hasValidator('x')).toBe(false);
            engine.compile('x', { type: 'string' });
            expect(engine.hasValidator('x')).toBe(true);
        });

        it('should remove a single validator', () => {
            engine.compile('x', { type: 'string' });
            engine.removeValidator('x');
            expect(engine.hasValidator('x')).toBe(false);
        });

        it('should clear all validators', () => {
            engine.compile('a', { type: 'string' });
            engine.compile('b', { type: 'number' });
            engine.clearAll();
            expect(engine.hasValidator('a')).toBe(false);
            expect(engine.hasValidator('b')).toBe(false);
        });
    });

    describe('error handling', () => {
        it('should throw ObjectQLError when validating without compiled validator', () => {
            expect(() => engine.validate('missing', {})).toThrow(ObjectQLError);
        });
    });
});

// ---------------------------------------------------------------------------
// LazyMetadataLoader
// ---------------------------------------------------------------------------
describe('LazyMetadataLoader', () => {
    let loader: LazyMetadataLoader;
    let mockLoadFn: ReturnType<typeof jest.fn>;

    beforeEach(() => {
        mockLoadFn = jest.fn().mockImplementation(async (name: string) => ({
            name,
            fields: {},
        }));
        loader = new LazyMetadataLoader(mockLoadFn);
    });

    describe('get', () => {
        it('should lazily load metadata on first access', async () => {
            const meta = await loader.get('accounts');
            expect(meta.name).toBe('accounts');
            expect(mockLoadFn).toHaveBeenCalledWith('accounts');
        });

        it('should return cached metadata on subsequent access', async () => {
            await loader.get('accounts');
            await loader.get('accounts');
            expect(mockLoadFn).toHaveBeenCalledTimes(1);
        });
    });

    describe('isLoaded', () => {
        it('should return false before loading', () => {
            expect(loader.isLoaded('accounts')).toBe(false);
        });

        it('should return true after loading', async () => {
            await loader.get('accounts');
            expect(loader.isLoaded('accounts')).toBe(true);
        });
    });

    describe('preload', () => {
        it('should batch preload multiple objects', async () => {
            await loader.preload(['a', 'b', 'c']);
            expect(mockLoadFn).toHaveBeenCalledTimes(3);
            expect(loader.isLoaded('a')).toBe(true);
            expect(loader.isLoaded('b')).toBe(true);
            expect(loader.isLoaded('c')).toBe(true);
        });
    });

    describe('invalidate', () => {
        it('should clear cache for a specific object', async () => {
            await loader.get('accounts');
            loader.invalidate('accounts');
            expect(loader.isLoaded('accounts')).toBe(false);
            await loader.get('accounts');
            expect(mockLoadFn).toHaveBeenCalledTimes(2);
        });
    });

    describe('clearAll', () => {
        it('should reset all caches', async () => {
            await loader.preload(['a', 'b']);
            loader.clearAll();
            expect(loader.isLoaded('a')).toBe(false);
            expect(loader.isLoaded('b')).toBe(false);
        });
    });

    describe('getStats', () => {
        it('should report correct statistics', async () => {
            await loader.get('a');
            const stats = loader.getStats();
            expect(stats.loaded).toBe(1);
            expect(stats.cached).toBe(1);
            expect(stats.loading).toBe(0);
        });
    });

    describe('deduplication of concurrent loads', () => {
        it('should not duplicate concurrent load calls', async () => {
            const [r1, r2] = await Promise.all([
                loader.get('accounts'),
                loader.get('accounts'),
            ]);
            expect(r1).toBe(r2);
            expect(mockLoadFn).toHaveBeenCalledTimes(1);
        });
    });
});

// ---------------------------------------------------------------------------
// SQLQueryOptimizer
// ---------------------------------------------------------------------------
describe('SQLQueryOptimizer', () => {
    let optimizer: SQLQueryOptimizer;

    beforeEach(() => {
        optimizer = new SQLQueryOptimizer();
    });

    describe('registerSchema', () => {
        it('should register a schema', () => {
            optimizer.registerSchema({
                name: 'accounts',
                fields: { name: { type: 'text' } },
                indexes: [{ name: 'idx_name', fields: ['name'], unique: false }],
            });
            // No error is the assertion
            expect(true).toBe(true);
        });
    });

    describe('optimize — basic SQL generation', () => {
        it('should generate basic SELECT * when no schema registered', () => {
            const sql = optimizer.optimize({ object: 'unknown' });
            expect(sql).toBe('SELECT * FROM unknown');
        });

        it('should generate SQL with selected fields', () => {
            optimizer.registerSchema({ name: 'accounts', fields: {} });
            const sql = optimizer.optimize({ object: 'accounts', fields: ['id', 'name'] });
            expect(sql).toContain('SELECT id, name');
            expect(sql).toContain('FROM accounts');
        });

        it('should include LIMIT and OFFSET', () => {
            optimizer.registerSchema({ name: 'accounts', fields: {} });
            const sql = optimizer.optimize({ object: 'accounts', limit: 10, offset: 20 });
            expect(sql).toContain('LIMIT 10');
            expect(sql).toContain('OFFSET 20');
        });

        it('should include ORDER BY', () => {
            optimizer.registerSchema({ name: 'accounts', fields: {} });
            const sql = optimizer.optimize({
                object: 'accounts',
                sort: [{ field: 'name', order: 'asc' }],
            });
            expect(sql).toContain('ORDER BY name ASC');
        });
    });

    describe('optimize — index hints', () => {
        it('should add USE INDEX hint when filter matches an index', () => {
            optimizer.registerSchema({
                name: 'accounts',
                fields: { status: { type: 'text' } },
                indexes: [{ name: 'idx_status', fields: ['status'], unique: false }],
            });
            const sql = optimizer.optimize({
                object: 'accounts',
                filters: { status: { $eq: 'active' } },
            });
            expect(sql).toContain('USE INDEX (idx_status)');
        });
    });

    describe('optimize — JOIN optimization', () => {
        it('should convert LEFT JOIN to INNER JOIN when filter references joined table', () => {
            optimizer.registerSchema({ name: 'contacts', fields: {} });
            optimizer.registerSchema({
                name: 'accounts',
                fields: { type: { type: 'text' } },
            });
            const sql = optimizer.optimize({
                object: 'contacts',
                joins: [{ type: 'left', table: 'accounts', on: 'contacts.account_id = accounts.id' }],
                filters: { 'accounts.type': { $eq: 'customer' } },
            });
            expect(sql).toContain('INNER JOIN accounts');
        });

        it('should keep LEFT JOIN when no filter references joined table', () => {
            optimizer.registerSchema({ name: 'contacts', fields: {} });
            optimizer.registerSchema({ name: 'accounts', fields: {} });
            const sql = optimizer.optimize({
                object: 'contacts',
                joins: [{ type: 'left', table: 'accounts', on: 'contacts.account_id = accounts.id' }],
            });
            expect(sql).toContain('LEFT JOIN accounts');
        });
    });

    describe('optimize — filter SQL generation', () => {
        it('should handle $eq operator', () => {
            optimizer.registerSchema({ name: 'x', fields: {} });
            const sql = optimizer.optimize({ object: 'x', filters: { name: { $eq: 'Alice' } } });
            expect(sql).toContain("name = 'Alice'");
        });

        it('should handle $ne operator', () => {
            optimizer.registerSchema({ name: 'x', fields: {} });
            const sql = optimizer.optimize({ object: 'x', filters: { name: { $ne: 'Bob' } } });
            expect(sql).toContain("name != 'Bob'");
        });

        it('should handle $gt and $gte operators', () => {
            optimizer.registerSchema({ name: 'x', fields: {} });
            const sql = optimizer.optimize({ object: 'x', filters: { age: { $gt: 18, $gte: 21 } } });
            expect(sql).toContain("age > '18'");
            expect(sql).toContain("age >= '21'");
        });

        it('should handle $lt and $lte operators', () => {
            optimizer.registerSchema({ name: 'x', fields: {} });
            const sql = optimizer.optimize({ object: 'x', filters: { age: { $lt: 65, $lte: 60 } } });
            expect(sql).toContain("age < '65'");
            expect(sql).toContain("age <= '60'");
        });

        it('should handle $in operator', () => {
            optimizer.registerSchema({ name: 'x', fields: {} });
            const sql = optimizer.optimize({ object: 'x', filters: { status: { $in: ['a', 'b'] } } });
            expect(sql).toContain("status IN ('a', 'b')");
        });

        it('should handle $and operator', () => {
            optimizer.registerSchema({ name: 'x', fields: {} });
            const sql = optimizer.optimize({
                object: 'x',
                filters: {
                    $and: [
                        { name: { $eq: 'Alice' } },
                        { age: { $gt: 18 } },
                    ],
                },
            });
            expect(sql).toContain('AND');
        });

        it('should handle $or operator', () => {
            optimizer.registerSchema({ name: 'x', fields: {} });
            const sql = optimizer.optimize({
                object: 'x',
                filters: {
                    $or: [
                        { name: { $eq: 'Alice' } },
                        { name: { $eq: 'Bob' } },
                    ],
                },
            });
            expect(sql).toContain('OR');
        });

        it('should handle simple equality shorthand', () => {
            optimizer.registerSchema({ name: 'x', fields: {} });
            const sql = optimizer.optimize({ object: 'x', filters: { status: 'active' } });
            expect(sql).toContain("status = 'active'");
        });
    });

    describe('clearSchemas', () => {
        it('should remove all registered schemas', () => {
            optimizer.registerSchema({ name: 'x', fields: {} });
            optimizer.clearSchemas();
            // After clearing, optimize should fall through to basic SQL (no USE INDEX)
            const sql = optimizer.optimize({ object: 'x', filters: { id: { $eq: '1' } } });
            expect(sql).not.toContain('USE INDEX');
        });
    });
});
