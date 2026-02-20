/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { describe, it, expect } from 'vitest';
import { mapRow, mapRows, serializeValue, serializeRecord } from '../src/result-mapper';

describe('mapRow', () => {
    it('should pass through plain values', () => {
        const row = { id: '1', name: 'Alice', age: 30 };
        const result = mapRow(row);
        expect(result).toEqual({ id: '1', name: 'Alice', age: 30 });
    });

    it('should deserialize JSON fields', () => {
        const jsonFields = new Set(['metadata']);
        const row = { id: '1', metadata: '{"role":"admin"}' };
        const result = mapRow(row, jsonFields);
        expect(result.metadata).toEqual({ role: 'admin' });
    });

    it('should handle invalid JSON gracefully', () => {
        const jsonFields = new Set(['metadata']);
        const row = { id: '1', metadata: 'not-json' };
        const result = mapRow(row, jsonFields);
        expect(result.metadata).toBe('not-json');
    });

    it('should convert boolean fields from 0/1', () => {
        const booleanFields = new Set(['active']);
        const row = { id: '1', active: 1 };
        const result = mapRow(row, undefined, booleanFields);
        expect(result.active).toBe(true);
    });

    it('should convert boolean fields from 0 to false', () => {
        const booleanFields = new Set(['active']);
        const row = { id: '1', active: 0 };
        const result = mapRow(row, undefined, booleanFields);
        expect(result.active).toBe(false);
    });
});

describe('mapRows', () => {
    it('should map multiple rows', () => {
        const rows = [
            { id: '1', name: 'Alice' },
            { id: '2', name: 'Bob' }
        ];
        const result = mapRows(rows);
        expect(result).toHaveLength(2);
        expect(result[0].name).toBe('Alice');
        expect(result[1].name).toBe('Bob');
    });
});

describe('serializeValue', () => {
    it('should return null for null/undefined', () => {
        expect(serializeValue(null, 'field')).toBeNull();
        expect(serializeValue(undefined, 'field')).toBeNull();
    });

    it('should JSON stringify objects for JSON fields', () => {
        const jsonFields = new Set(['metadata']);
        const result = serializeValue({ role: 'admin' }, 'metadata', jsonFields);
        expect(result).toBe('{"role":"admin"}');
    });

    it('should pass through strings for JSON fields', () => {
        const jsonFields = new Set(['metadata']);
        const result = serializeValue('already-string', 'metadata', jsonFields);
        expect(result).toBe('already-string');
    });

    it('should convert true to 1 for boolean fields', () => {
        const booleanFields = new Set(['active']);
        const result = serializeValue(true, 'active', undefined, booleanFields);
        expect(result).toBe(1);
    });

    it('should convert false to 0 for boolean fields', () => {
        const booleanFields = new Set(['active']);
        const result = serializeValue(false, 'active', undefined, booleanFields);
        expect(result).toBe(0);
    });

    it('should pass through regular values', () => {
        const result = serializeValue('hello', 'name');
        expect(result).toBe('hello');
    });
});

describe('serializeRecord', () => {
    it('should serialize all fields in a record', () => {
        const jsonFields = new Set(['metadata']);
        const booleanFields = new Set(['active']);
        const data = {
            name: 'Alice',
            active: true,
            metadata: { role: 'admin' }
        };
        const result = serializeRecord(data, jsonFields, booleanFields);
        expect(result.name).toBe('Alice');
        expect(result.active).toBe(1);
        expect(result.metadata).toBe('{"role":"admin"}');
    });
});
