/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SqlDriver } from '../src';
import { UnifiedQuery } from '@objectql/types';

describe('SqlDriver (SQLite Integration)', () => {
    let driver: SqlDriver;

    beforeEach(async () => {
        // Init ephemeral in-memory database
        driver = new SqlDriver({
            client: 'sqlite3',
            connection: {
                filename: ':memory:'
            },
            useNullAsDefault: true
        });
        
        const k = (driver as any).knex;
        
        await k.schema.createTable('users', (t: any) => {
            t.string('id').primary();
            t.string('name');
            t.integer('age');
        });

        await k('users').insert([
            { id: '1', name: 'Alice', age: 25 },
            { id: '2', name: 'Bob', age: 17 },
            { id: '3', name: 'Charlie', age: 30 },
            { id: '4', name: 'Dave', age: 17 }
        ]);
    });

    afterEach(async () => {
        const k = (driver as any).knex;
        await k.destroy();
    });

    it('should be instantiable', () => {
        expect(driver).toBeDefined();
        expect(driver).toBeInstanceOf(SqlDriver);
    });

    it('should find objects with filters', async () => {
        const query: UnifiedQuery = {
            fields: ['name', 'age'],
            filters: [['age', '>', 18]],
            sort: [['name', 'asc']]
        };
        const results = await driver.find('users', query);
        
        expect(results.length).toBe(2);
        expect(results.map((r: any) => r.name)).toEqual(['Alice', 'Charlie']);
    });

    it('should apply simple AND/OR logic', async () => {
        // age = 17 OR age > 29
        const query: UnifiedQuery = {
            filters: [
                ['age', '=', 17],
                'or',
                ['age', '>', 29]
            ]
        };
        const results = await driver.find('users', query);
        const names = results.map((r: any) => r.name).sort();
        expect(names).toEqual(['Bob', 'Charlie', 'Dave']);
    });

    it('should find one object by id', async () => {
        // First get an ID
        const [alice] = await driver.find('users', { filters: [['name', '=', 'Alice']] });
        expect(alice).toBeDefined();

        const fetched = await driver.findOne('users', alice.id);
        expect(fetched).toBeDefined();
        expect(fetched.name).toBe('Alice');
    });

    it('should create an object', async () => {
        const newItem = { name: 'Eve', age: 22 };
        await driver.create('users', newItem);

        const [eve] = await driver.find('users', { filters: [['name', '=', 'Eve']] });
        expect(eve).toBeDefined();
        expect(eve.age).toBe(22);
    });

    it('should update an object', async () => {
        const [bob] = await driver.find('users', { filters: [['name', '=', 'Bob']] });
        await driver.update('users', bob.id, { age: 18 });

        const updated = await driver.findOne('users', bob.id);
        expect(updated.age).toBe(18);
    });

    it('should delete an object', async () => {
        const [charlie] = await driver.find('users', { filters: [['name', '=', 'Charlie']] });
        await driver.delete('users', charlie.id);

        const deleted = await driver.findOne('users', charlie.id);
        expect(deleted).toBeUndefined();
    });

    it('should count objects', async () => {
        const count = await driver.count('users', [['age', '=', 17]]);
        expect(count).toBe(2);
    });

    it('should map _id to id if provided', async () => {
        const newItemWithId = { _id: 'custom-id', name: 'Frank', age: 40 };
        const created = await driver.create('users', newItemWithId);

        expect(created.id).toBe('custom-id');
        // Check if we can retrieve it by id
        const fetched = await driver.findOne('users', 'custom-id');
        expect(fetched).toBeDefined();
        expect(fetched.name).toBe('Frank');
    });
});

