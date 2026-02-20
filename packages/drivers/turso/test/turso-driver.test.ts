/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TursoDriver, createTursoDriver } from '../src';
import { ObjectQLError } from '@objectql/types';

describe('TursoDriver - Configuration', () => {
    it('should throw CONFIG_ERROR if url is missing', () => {
        expect(() => {
            new TursoDriver({ url: '' });
        }).toThrow(ObjectQLError);
        expect(() => {
            new TursoDriver({ url: '' });
        }).toThrow('Turso driver requires a "url"');
    });

    it('should create a driver with minimal config', () => {
        const driver = new TursoDriver({ url: ':memory:' });
        expect(driver).toBeDefined();
        expect(driver.name).toBe('TursoDriver');
        expect(driver.version).toBe('4.2.2');
    });

    it('should accept all configuration options', () => {
        const driver = new TursoDriver({
            url: 'libsql://my-db-org.turso.io',
            authToken: 'test-token',
            encryptionKey: 'test-key',
            concurrency: 10,
            syncUrl: 'libsql://sync.turso.io',
            sync: { intervalSeconds: 30, onConnect: false },
            timeout: 5000
        });
        expect(driver).toBeDefined();
    });
});

describe('TursoDriver - Factory Function', () => {
    it('should create a driver via createTursoDriver', () => {
        const driver = createTursoDriver({ url: ':memory:' });
        expect(driver).toBeInstanceOf(TursoDriver);
        expect(driver.name).toBe('TursoDriver');
    });
});

describe('TursoDriver - Capabilities', () => {
    let driver: TursoDriver;

    beforeEach(() => {
        driver = new TursoDriver({ url: ':memory:' });
    });

    it('should declare CRUD capabilities', () => {
        expect(driver.supports.create).toBe(true);
        expect(driver.supports.read).toBe(true);
        expect(driver.supports.update).toBe(true);
        expect(driver.supports.delete).toBe(true);
    });

    it('should declare bulk operation capabilities', () => {
        expect(driver.supports.bulkCreate).toBe(true);
        expect(driver.supports.bulkUpdate).toBe(true);
        expect(driver.supports.bulkDelete).toBe(true);
    });

    it('should declare transaction capabilities', () => {
        expect(driver.supports.transactions).toBe(true);
        expect(driver.supports.savepoints).toBe(true);
    });

    it('should declare query capabilities', () => {
        expect(driver.supports.queryFilters).toBe(true);
        expect(driver.supports.queryAggregations).toBe(true);
        expect(driver.supports.querySorting).toBe(true);
        expect(driver.supports.queryPagination).toBe(true);
        expect(driver.supports.queryWindowFunctions).toBe(true);
        expect(driver.supports.querySubqueries).toBe(true);
        expect(driver.supports.queryCTE).toBe(true);
    });

    it('should declare join and search capabilities', () => {
        expect(driver.supports.joins).toBe(true);
        expect(driver.supports.fullTextSearch).toBe(true);
        expect(driver.supports.jsonQuery).toBe(true);
        expect(driver.supports.vectorSearch).toBe(true);
    });

    it('should declare schema capabilities', () => {
        expect(driver.supports.schemaSync).toBe(true);
        expect(driver.supports.migrations).toBe(true);
        expect(driver.supports.indexes).toBe(true);
    });

    it('should not support streaming or connection pooling', () => {
        expect(driver.supports.streaming).toBe(false);
        expect(driver.supports.connectionPooling).toBe(false);
    });

    it('should return undefined for pool stats', () => {
        expect(driver.getPoolStats()).toBeUndefined();
    });
});

describe('TursoDriver - Lifecycle (in-memory)', () => {
    let driver: TursoDriver;

    beforeEach(() => {
        driver = new TursoDriver({ url: ':memory:' });
    });

    afterEach(async () => {
        await driver.disconnect();
    });

    it('should connect successfully', async () => {
        await driver.connect();
    });

    it('should be idempotent on multiple connects', async () => {
        await driver.connect();
        await driver.connect(); // should not throw
    });

    it('should disconnect successfully', async () => {
        await driver.connect();
        await driver.disconnect();
    });

    it('should check health after connect', async () => {
        await driver.connect();
        const healthy = await driver.checkHealth();
        expect(healthy).toBe(true);
    });
});

describe('TursoDriver - Schema Management (in-memory)', () => {
    let driver: TursoDriver;

    beforeEach(async () => {
        driver = new TursoDriver({ url: ':memory:' });
        await driver.connect();
    });

    afterEach(async () => {
        await driver.disconnect();
    });

    it('should create tables via init', async () => {
        await driver.init([
            {
                name: 'users',
                fields: {
                    name: { type: 'text' },
                    age: { type: 'integer' },
                    active: { type: 'boolean' }
                }
            }
        ]);

        const schema = await driver.introspectSchema();
        expect(schema.tables.users).toBeDefined();
        expect(schema.tables.users.columns.length).toBeGreaterThanOrEqual(3);
    });

    it('should create tables with JSON fields', async () => {
        await driver.init([
            {
                name: 'configs',
                fields: {
                    settings: { type: 'json' },
                    tags: { type: 'array' }
                }
            }
        ]);

        const schema = await driver.introspectSchema();
        expect(schema.tables.configs).toBeDefined();
    });

    it('should introspect schema correctly', async () => {
        await driver.init([
            {
                name: 'projects',
                fields: {
                    title: { type: 'text' },
                    budget: { type: 'float' }
                }
            }
        ]);

        const schema = await driver.introspectSchema();
        const projects = schema.tables.projects;
        expect(projects).toBeDefined();
        expect(projects.name).toBe('projects');

        const idCol = projects.columns.find(c => c.name === 'id');
        expect(idCol).toBeDefined();
        expect(idCol!.isPrimary).toBe(true);

        const titleCol = projects.columns.find(c => c.name === 'title');
        expect(titleCol).toBeDefined();
        expect(titleCol!.type).toBe('TEXT');

        const budgetCol = projects.columns.find(c => c.name === 'budget');
        expect(budgetCol).toBeDefined();
        expect(budgetCol!.type).toBe('REAL');
    });

    it('should drop a table', async () => {
        await driver.init([{ name: 'temp_table', fields: { foo: { type: 'text' } } }]);
        await driver.dropTable('temp_table');

        const schema = await driver.introspectSchema();
        expect(schema.tables.temp_table).toBeUndefined();
    });

    it('should use syncSchema as alias for init', async () => {
        await driver.syncSchema([
            { name: 'tasks', fields: { title: { type: 'text' } } }
        ]);

        const schema = await driver.introspectSchema();
        expect(schema.tables.tasks).toBeDefined();
    });
});

describe('TursoDriver - CRUD Operations (in-memory)', () => {
    let driver: TursoDriver;

    beforeEach(async () => {
        driver = new TursoDriver({ url: ':memory:' });
        await driver.connect();
        await driver.init([
            {
                name: 'users',
                fields: {
                    name: { type: 'text' },
                    age: { type: 'integer' },
                    email: { type: 'text' },
                    active: { type: 'boolean' },
                    metadata: { type: 'json' }
                }
            }
        ]);
    });

    afterEach(async () => {
        await driver.disconnect();
    });

    it('should create a record with auto-generated id', async () => {
        const created = await driver.create('users', { name: 'Alice', age: 30 });
        expect(created.id).toBeDefined();
        expect(typeof created.id).toBe('string');
        expect(created.name).toBe('Alice');
        expect(created.age).toBe(30);
    });

    it('should create a record with provided id', async () => {
        const created = await driver.create('users', { id: 'custom-id', name: 'Bob', age: 25 });
        expect(created.id).toBe('custom-id');
        expect(created.name).toBe('Bob');
    });

    it('should find one record by id', async () => {
        const created = await driver.create('users', { name: 'Charlie', age: 35 });
        const found = await driver.findOne('users', created.id as string);
        expect(found).toBeDefined();
        expect(found!.name).toBe('Charlie');
        expect(found!.age).toBe(35);
    });

    it('should return null for non-existent id', async () => {
        const found = await driver.findOne('users', 'non-existent');
        expect(found).toBeNull();
    });

    it('should find all records', async () => {
        await driver.create('users', { name: 'Alice', age: 30 });
        await driver.create('users', { name: 'Bob', age: 25 });
        await driver.create('users', { name: 'Charlie', age: 35 });

        const results = await driver.find('users', {});
        expect(results.length).toBe(3);
    });

    it('should find records with filters', async () => {
        await driver.create('users', { name: 'Alice', age: 30 });
        await driver.create('users', { name: 'Bob', age: 25 });
        await driver.create('users', { name: 'Charlie', age: 35 });

        const results = await driver.find('users', { where: { age: { $gt: 28 } } });
        expect(results.length).toBe(2);
    });

    it('should find records with direct equality filter', async () => {
        await driver.create('users', { name: 'Alice', age: 30 });
        await driver.create('users', { name: 'Bob', age: 25 });

        const results = await driver.find('users', { where: { name: 'Alice' } });
        expect(results.length).toBe(1);
        expect(results[0].name).toBe('Alice');
    });

    it('should find records with sorting', async () => {
        await driver.create('users', { name: 'Charlie', age: 35 });
        await driver.create('users', { name: 'Alice', age: 30 });
        await driver.create('users', { name: 'Bob', age: 25 });

        const results = await driver.find('users', { sort: { age: 1 } });
        expect(results[0].name).toBe('Bob');
        expect(results[1].name).toBe('Alice');
        expect(results[2].name).toBe('Charlie');
    });

    it('should find records with pagination', async () => {
        await driver.create('users', { name: 'Alice', age: 30 });
        await driver.create('users', { name: 'Bob', age: 25 });
        await driver.create('users', { name: 'Charlie', age: 35 });

        const results = await driver.find('users', { sort: { age: 1 }, limit: 2, offset: 1 });
        expect(results.length).toBe(2);
        expect(results[0].name).toBe('Alice');
    });

    it('should update a record', async () => {
        const created = await driver.create('users', { name: 'Alice', age: 30 });
        const updated = await driver.update('users', created.id as string, { age: 31 });
        expect(updated.age).toBe(31);
        expect(updated.name).toBe('Alice');
    });

    it('should delete a record', async () => {
        const created = await driver.create('users', { name: 'Alice', age: 30 });
        const result = await driver.delete('users', created.id as string);
        expect((result as Record<string, unknown>).deleted).toBe(true);

        const found = await driver.findOne('users', created.id as string);
        expect(found).toBeNull();
    });

    it('should count records', async () => {
        await driver.create('users', { name: 'Alice', age: 30 });
        await driver.create('users', { name: 'Bob', age: 25 });

        const count = await driver.count('users', {});
        expect(count).toBe(2);
    });

    it('should count records with filter', async () => {
        await driver.create('users', { name: 'Alice', age: 30 });
        await driver.create('users', { name: 'Bob', age: 25 });
        await driver.create('users', { name: 'Charlie', age: 35 });

        const count = await driver.count('users', { age: { $gte: 30 } });
        expect(count).toBe(2);
    });

    it('should handle boolean fields correctly', async () => {
        await driver.create('users', { name: 'Alice', age: 30, active: true });
        const found = await driver.find('users', { where: { name: 'Alice' } });
        expect(found[0].active).toBe(true);
    });

    it('should handle JSON fields correctly', async () => {
        await driver.create('users', {
            name: 'Alice',
            age: 30,
            metadata: { role: 'admin', permissions: ['read', 'write'] }
        });
        const found = await driver.find('users', { where: { name: 'Alice' } });
        const meta = found[0].metadata as Record<string, unknown>;
        expect(meta.role).toBe('admin');
        expect(Array.isArray(meta.permissions)).toBe(true);
    });
});

describe('TursoDriver - Upsert (in-memory)', () => {
    let driver: TursoDriver;

    beforeEach(async () => {
        driver = new TursoDriver({ url: ':memory:' });
        await driver.connect();
        await driver.init([
            { name: 'items', fields: { name: { type: 'text' }, quantity: { type: 'integer' } } }
        ]);
    });

    afterEach(async () => {
        await driver.disconnect();
    });

    it('should insert on first upsert', async () => {
        const result = await driver.upsert('items', { id: 'item-1', name: 'Widget', quantity: 10 });
        expect(result.id).toBe('item-1');
        expect(result.name).toBe('Widget');
    });

    it('should update on second upsert', async () => {
        await driver.upsert('items', { id: 'item-1', name: 'Widget', quantity: 10 });
        const result = await driver.upsert('items', { id: 'item-1', name: 'Widget', quantity: 20 });
        expect(result.quantity).toBe(20);

        const count = await driver.count('items', {});
        expect(count).toBe(1);
    });
});

describe('TursoDriver - Bulk Operations (in-memory)', () => {
    let driver: TursoDriver;

    beforeEach(async () => {
        driver = new TursoDriver({ url: ':memory:' });
        await driver.connect();
        await driver.init([
            { name: 'products', fields: { name: { type: 'text' }, price: { type: 'float' } } }
        ]);
    });

    afterEach(async () => {
        await driver.disconnect();
    });

    it('should bulk create records', async () => {
        const result = await driver.bulkCreate('products', [
            { name: 'A', price: 10 },
            { name: 'B', price: 20 },
            { name: 'C', price: 30 }
        ]);
        expect(result).toBe(3);

        const count = await driver.count('products', {});
        expect(count).toBe(3);
    });

    it('should bulk update records', async () => {
        const a = await driver.create('products', { name: 'A', price: 10 });
        const b = await driver.create('products', { name: 'B', price: 20 });

        await driver.bulkUpdate('products', [
            { id: a.id as string, data: { price: 15 } },
            { id: b.id as string, data: { price: 25 } }
        ]);

        const foundA = await driver.findOne('products', a.id as string);
        expect(foundA!.price).toBe(15);
    });

    it('should bulk delete records', async () => {
        const a = await driver.create('products', { name: 'A', price: 10 });
        const b = await driver.create('products', { name: 'B', price: 20 });
        await driver.create('products', { name: 'C', price: 30 });

        await driver.bulkDelete('products', [a.id as string, b.id as string]);

        const count = await driver.count('products', {});
        expect(count).toBe(1);
    });

    it('should handle empty bulk create', async () => {
        const result = await driver.bulkCreate('products', []);
        expect(result).toEqual([]);
    });
});

describe('TursoDriver - updateMany / deleteMany (in-memory)', () => {
    let driver: TursoDriver;

    beforeEach(async () => {
        driver = new TursoDriver({ url: ':memory:' });
        await driver.connect();
        await driver.init([
            { name: 'tasks', fields: { title: { type: 'text' }, status: { type: 'text' }, priority: { type: 'integer' } } }
        ]);
        await driver.create('tasks', { title: 'Task 1', status: 'open', priority: 1 });
        await driver.create('tasks', { title: 'Task 2', status: 'open', priority: 2 });
        await driver.create('tasks', { title: 'Task 3', status: 'closed', priority: 3 });
    });

    afterEach(async () => {
        await driver.disconnect();
    });

    it('should update many records by filter', async () => {
        await driver.updateMany('tasks', { status: 'open' }, { status: 'in_progress' });

        const results = await driver.find('tasks', { where: { status: 'in_progress' } });
        expect(results.length).toBe(2);
    });

    it('should delete many records by filter', async () => {
        await driver.deleteMany('tasks', { status: 'open' });

        const count = await driver.count('tasks', {});
        expect(count).toBe(1);
    });
});

describe('TursoDriver - Query Extensions (in-memory)', () => {
    let driver: TursoDriver;

    beforeEach(async () => {
        driver = new TursoDriver({ url: ':memory:' });
        await driver.connect();
        await driver.init([
            { name: 'orders', fields: { product: { type: 'text' }, amount: { type: 'float' }, category: { type: 'text' } } }
        ]);
        await driver.create('orders', { product: 'Widget A', amount: 100, category: 'electronics' });
        await driver.create('orders', { product: 'Widget B', amount: 200, category: 'electronics' });
        await driver.create('orders', { product: 'Gadget C', amount: 150, category: 'gadgets' });
    });

    afterEach(async () => {
        await driver.disconnect();
    });

    it('should get distinct values', async () => {
        const categories = await driver.distinct('orders', 'category');
        expect(categories).toHaveLength(2);
        expect(categories).toContain('electronics');
        expect(categories).toContain('gadgets');
    });

    it('should aggregate with groupBy', async () => {
        const results = await driver.aggregate('orders', {
            groupBy: ['category'],
            aggregates: { total: 'SUM("amount")', count: 'COUNT(*)' }
        });
        expect(results.length).toBe(2);
    });

    it('should explain a query', async () => {
        const plan = await driver.explain('orders', { where: { category: 'electronics' } });
        expect(plan).toBeDefined();
    });
});

describe('TursoDriver - executeQuery / executeCommand (in-memory)', () => {
    let driver: TursoDriver;

    beforeEach(async () => {
        driver = new TursoDriver({ url: ':memory:' });
        await driver.connect();
        await driver.init([
            { name: 'items', fields: { name: { type: 'text' } } }
        ]);
    });

    afterEach(async () => {
        await driver.disconnect();
    });

    it('should executeQuery with object/from field', async () => {
        await driver.create('items', { name: 'Test' });
        const result = await driver.executeQuery({ object: 'items' });
        expect(result.value.length).toBe(1);
    });

    it('should throw on executeQuery without object', async () => {
        await expect(driver.executeQuery({})).rejects.toThrow(ObjectQLError);
    });

    it('should executeCommand create', async () => {
        const result = await driver.executeCommand({
            type: 'create',
            object: 'items',
            data: { name: 'CommandItem' }
        });
        expect(result.success).toBe(true);
        expect(result.affected).toBe(1);
    });

    it('should executeCommand with unknown type', async () => {
        const result = await driver.executeCommand({
            type: 'unknown',
            object: 'items'
        });
        expect(result.success).toBe(false);
    });
});

describe('TursoDriver - Legacy Array Filters (in-memory)', () => {
    let driver: TursoDriver;

    beforeEach(async () => {
        driver = new TursoDriver({ url: ':memory:' });
        await driver.connect();
        await driver.init([
            { name: 'people', fields: { name: { type: 'text' }, age: { type: 'integer' } } }
        ]);
        await driver.create('people', { name: 'Alice', age: 30 });
        await driver.create('people', { name: 'Bob', age: 25 });
        await driver.create('people', { name: 'Charlie', age: 35 });
    });

    afterEach(async () => {
        await driver.disconnect();
    });

    it('should support legacy array filter format', async () => {
        const results = await driver.find('people', {
            filters: ['age', '>', 28]
        });
        expect(results.length).toBe(2);
    });

    it('should support legacy array filter with conjunction', async () => {
        const results = await driver.find('people', {
            filters: ['age', '>', 28, 'and', 'name', '=', 'Alice']
        });
        expect(results.length).toBe(1);
        expect(results[0].name).toBe('Alice');
    });
});

describe('TursoDriver - $or / $and / $not Filters (in-memory)', () => {
    let driver: TursoDriver;

    beforeEach(async () => {
        driver = new TursoDriver({ url: ':memory:' });
        await driver.connect();
        await driver.init([
            { name: 'items', fields: { name: { type: 'text' }, price: { type: 'float' }, category: { type: 'text' } } }
        ]);
        await driver.create('items', { name: 'A', price: 10, category: 'x' });
        await driver.create('items', { name: 'B', price: 20, category: 'y' });
        await driver.create('items', { name: 'C', price: 30, category: 'x' });
    });

    afterEach(async () => {
        await driver.disconnect();
    });

    it('should support $or filter', async () => {
        const results = await driver.find('items', {
            where: { $or: [{ name: 'A' }, { name: 'C' }] }
        });
        expect(results.length).toBe(2);
    });

    it('should support $and filter', async () => {
        const results = await driver.find('items', {
            where: { $and: [{ category: 'x' }, { price: { $gt: 15 } }] }
        });
        expect(results.length).toBe(1);
        expect(results[0].name).toBe('C');
    });

    it('should support $in filter', async () => {
        const results = await driver.find('items', {
            where: { name: { $in: ['A', 'B'] } }
        });
        expect(results.length).toBe(2);
    });

    it('should support $nin filter', async () => {
        const results = await driver.find('items', {
            where: { name: { $nin: ['A', 'B'] } }
        });
        expect(results.length).toBe(1);
        expect(results[0].name).toBe('C');
    });
});
