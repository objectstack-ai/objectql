/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { describe, it, expect } from 'vitest';
import { compileFilter, compileSelect, parseSort, quoteIdentifier } from '../src/query-compiler';

describe('quoteIdentifier', () => {
    it('should quote a simple identifier', () => {
        expect(quoteIdentifier('users')).toBe('"users"');
    });

    it('should escape embedded double-quotes', () => {
        expect(quoteIdentifier('table"name')).toBe('"table""name"');
    });
});

describe('compileFilter — empty / falsy', () => {
    it('should return empty for null', () => {
        const result = compileFilter(null);
        expect(result.sql).toBe('');
        expect(result.args).toEqual([]);
    });

    it('should return empty for undefined', () => {
        const result = compileFilter(undefined);
        expect(result.sql).toBe('');
        expect(result.args).toEqual([]);
    });

    it('should return empty for empty object', () => {
        const result = compileFilter({});
        expect(result.sql).toBe('');
        expect(result.args).toEqual([]);
    });
});

describe('compileFilter — direct equality', () => {
    it('should compile direct equality', () => {
        const result = compileFilter({ name: 'Alice' });
        expect(result.sql).toBe('"name" = ?');
        expect(result.args).toEqual(['Alice']);
    });

    it('should compile null equality', () => {
        const result = compileFilter({ name: null });
        expect(result.sql).toBe('"name" IS NULL');
        expect(result.args).toEqual([]);
    });

    it('should compile multiple fields with AND', () => {
        const result = compileFilter({ name: 'Alice', age: 30 });
        expect(result.sql).toBe('"name" = ? AND "age" = ?');
        expect(result.args).toEqual(['Alice', 30]);
    });
});

describe('compileFilter — comparison operators', () => {
    it('should compile $gt', () => {
        const result = compileFilter({ age: { $gt: 18 } });
        expect(result.sql).toBe('"age" > ?');
        expect(result.args).toEqual([18]);
    });

    it('should compile $gte', () => {
        const result = compileFilter({ age: { $gte: 18 } });
        expect(result.sql).toBe('"age" >= ?');
        expect(result.args).toEqual([18]);
    });

    it('should compile $lt', () => {
        const result = compileFilter({ age: { $lt: 65 } });
        expect(result.sql).toBe('"age" < ?');
        expect(result.args).toEqual([65]);
    });

    it('should compile $lte', () => {
        const result = compileFilter({ age: { $lte: 65 } });
        expect(result.sql).toBe('"age" <= ?');
        expect(result.args).toEqual([65]);
    });

    it('should compile $ne', () => {
        const result = compileFilter({ status: { $ne: 'deleted' } });
        expect(result.sql).toBe('"status" != ?');
        expect(result.args).toEqual(['deleted']);
    });

    it('should compile $eq', () => {
        const result = compileFilter({ status: { $eq: 'active' } });
        expect(result.sql).toBe('"status" = ?');
        expect(result.args).toEqual(['active']);
    });

    it('should compile $eq null', () => {
        const result = compileFilter({ status: { $eq: null } });
        expect(result.sql).toBe('"status" IS NULL');
    });

    it('should compile $ne null', () => {
        const result = compileFilter({ status: { $ne: null } });
        expect(result.sql).toBe('"status" IS NOT NULL');
    });
});

describe('compileFilter — array operators', () => {
    it('should compile $in', () => {
        const result = compileFilter({ status: { $in: ['active', 'pending'] } });
        expect(result.sql).toBe('"status" IN (?, ?)');
        expect(result.args).toEqual(['active', 'pending']);
    });

    it('should compile $nin', () => {
        const result = compileFilter({ status: { $nin: ['deleted'] } });
        expect(result.sql).toBe('"status" NOT IN (?)');
        expect(result.args).toEqual(['deleted']);
    });

    it('should handle empty $in as always false', () => {
        const result = compileFilter({ status: { $in: [] } });
        expect(result.sql).toBe('1=0');
    });

    it('should handle empty $nin as always true', () => {
        const result = compileFilter({ status: { $nin: [] } });
        expect(result.sql).toBe('1=1');
    });
});

describe('compileFilter — logical operators', () => {
    it('should compile $or', () => {
        const result = compileFilter({
            $or: [{ name: 'Alice' }, { name: 'Bob' }]
        });
        expect(result.sql).toBe('("name" = ? OR "name" = ?)');
        expect(result.args).toEqual(['Alice', 'Bob']);
    });

    it('should compile $and', () => {
        const result = compileFilter({
            $and: [{ age: { $gte: 18 } }, { age: { $lte: 65 } }]
        });
        expect(result.sql).toBe('("age" >= ? AND "age" <= ?)');
        expect(result.args).toEqual([18, 65]);
    });

    it('should compile $not', () => {
        const result = compileFilter({
            $not: { status: 'deleted' }
        });
        expect(result.sql).toBe('NOT ("status" = ?)');
        expect(result.args).toEqual(['deleted']);
    });
});

describe('compileFilter — $like and $exists', () => {
    it('should compile $like', () => {
        const result = compileFilter({ name: { $like: '%Alice%' } });
        expect(result.sql).toBe('"name" LIKE ?');
        expect(result.args).toEqual(['%Alice%']);
    });

    it('should compile $exists true', () => {
        const result = compileFilter({ email: { $exists: true } });
        expect(result.sql).toBe('"email" IS NOT NULL');
    });

    it('should compile $exists false', () => {
        const result = compileFilter({ email: { $exists: false } });
        expect(result.sql).toBe('"email" IS NULL');
    });
});

describe('compileFilter — $between', () => {
    it('should compile $between', () => {
        const result = compileFilter({ age: { $between: [18, 65] } });
        expect(result.sql).toBe('"age" BETWEEN ? AND ?');
        expect(result.args).toEqual([18, 65]);
    });
});

describe('compileFilter — legacy array format', () => {
    it('should compile simple legacy filter', () => {
        const result = compileFilter(['age', '>', 18]);
        expect(result.sql).toBe('"age" > ?');
        expect(result.args).toEqual([18]);
    });

    it('should compile legacy filter with AND conjunction', () => {
        const result = compileFilter(['age', '>', 18, 'and', 'age', '<', 65]);
        expect(result.sql).toBe('"age" > ? AND "age" < ?');
        expect(result.args).toEqual([18, 65]);
    });

    it('should compile legacy filter with OR conjunction', () => {
        const result = compileFilter(['name', '=', 'Alice', 'or', 'name', '=', 'Bob']);
        expect(result.sql).toBe('"name" = ? OR "name" = ?');
        expect(result.args).toEqual(['Alice', 'Bob']);
    });

    it('should compile legacy "in" operator', () => {
        const result = compileFilter(['status', 'in', ['a', 'b']]);
        expect(result.sql).toBe('"status" IN (?, ?)');
        expect(result.args).toEqual(['a', 'b']);
    });
});

describe('compileSelect', () => {
    it('should compile a basic SELECT *', () => {
        const result = compileSelect({ objectName: 'users' });
        expect(result.sql).toBe('SELECT * FROM "users"');
        expect(result.args).toEqual([]);
    });

    it('should compile SELECT with specific fields', () => {
        const result = compileSelect({ objectName: 'users', fields: ['name', 'age'] });
        expect(result.sql).toBe('SELECT "name", "age" FROM "users"');
    });

    it('should compile SELECT with WHERE', () => {
        const result = compileSelect({
            objectName: 'users',
            where: { sql: '"age" > ?', args: [18] }
        });
        expect(result.sql).toBe('SELECT * FROM "users" WHERE "age" > ?');
        expect(result.args).toEqual([18]);
    });

    it('should compile SELECT with ORDER BY', () => {
        const result = compileSelect({
            objectName: 'users',
            orderBy: [{ field: 'name', direction: 'asc' }]
        });
        expect(result.sql).toBe('SELECT * FROM "users" ORDER BY "name" ASC');
    });

    it('should compile SELECT with LIMIT and OFFSET', () => {
        const result = compileSelect({
            objectName: 'users',
            limit: 10,
            offset: 20
        });
        expect(result.sql).toBe('SELECT * FROM "users" LIMIT ? OFFSET ?');
        expect(result.args).toEqual([10, 20]);
    });

    it('should compile a full SELECT query', () => {
        const result = compileSelect({
            objectName: 'users',
            fields: ['name', 'age'],
            where: { sql: '"age" > ?', args: [18] },
            orderBy: [{ field: 'name', direction: 'desc' }],
            limit: 10,
            offset: 0
        });
        expect(result.sql).toBe('SELECT "name", "age" FROM "users" WHERE "age" > ? ORDER BY "name" DESC LIMIT ? OFFSET ?');
        expect(result.args).toEqual([18, 10, 0]);
    });
});

describe('parseSort', () => {
    it('should return empty for null/undefined', () => {
        expect(parseSort(null)).toEqual([]);
        expect(parseSort(undefined)).toEqual([]);
    });

    it('should parse object format with 1/-1', () => {
        const result = parseSort({ name: 1, age: -1 });
        expect(result).toEqual([
            { field: 'name', direction: 'asc' },
            { field: 'age', direction: 'desc' }
        ]);
    });

    it('should parse object format with asc/desc strings', () => {
        const result = parseSort({ name: 'asc', age: 'desc' });
        expect(result).toEqual([
            { field: 'name', direction: 'asc' },
            { field: 'age', direction: 'desc' }
        ]);
    });

    it('should parse string format', () => {
        const result = parseSort('name asc, age desc');
        expect(result).toEqual([
            { field: 'name', direction: 'asc' },
            { field: 'age', direction: 'desc' }
        ]);
    });

    it('should parse array of tuples', () => {
        const result = parseSort([['name', 'asc'], ['age', 'desc']]);
        expect(result).toEqual([
            { field: 'name', direction: 'asc' },
            { field: 'age', direction: 'desc' }
        ]);
    });

    it('should parse array of objects', () => {
        const result = parseSort([{ field: 'name', direction: 'asc' }]);
        expect(result).toEqual([{ field: 'name', direction: 'asc' }]);
    });
});
