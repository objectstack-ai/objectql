/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { describe, it, expect } from 'vitest';
import { fieldTypeToSqlite, isJsonFieldType, isBooleanFieldType } from '../src/type-mapper';

describe('fieldTypeToSqlite', () => {
    it('should map text types to TEXT', () => {
        expect(fieldTypeToSqlite('text')).toBe('TEXT');
        expect(fieldTypeToSqlite('string')).toBe('TEXT');
        expect(fieldTypeToSqlite('textarea')).toBe('TEXT');
        expect(fieldTypeToSqlite('richtext')).toBe('TEXT');
        expect(fieldTypeToSqlite('html')).toBe('TEXT');
        expect(fieldTypeToSqlite('markdown')).toBe('TEXT');
        expect(fieldTypeToSqlite('url')).toBe('TEXT');
        expect(fieldTypeToSqlite('email')).toBe('TEXT');
        expect(fieldTypeToSqlite('phone')).toBe('TEXT');
        expect(fieldTypeToSqlite('select')).toBe('TEXT');
        expect(fieldTypeToSqlite('lookup')).toBe('TEXT');
        expect(fieldTypeToSqlite('master_detail')).toBe('TEXT');
        expect(fieldTypeToSqlite('autonumber')).toBe('TEXT');
    });

    it('should map integer types to INTEGER', () => {
        expect(fieldTypeToSqlite('number')).toBe('INTEGER');
        expect(fieldTypeToSqlite('integer')).toBe('INTEGER');
        expect(fieldTypeToSqlite('int')).toBe('INTEGER');
    });

    it('should map float types to REAL', () => {
        expect(fieldTypeToSqlite('float')).toBe('REAL');
        expect(fieldTypeToSqlite('decimal')).toBe('REAL');
        expect(fieldTypeToSqlite('currency')).toBe('REAL');
        expect(fieldTypeToSqlite('percent')).toBe('REAL');
    });

    it('should map boolean types to INTEGER', () => {
        expect(fieldTypeToSqlite('boolean')).toBe('INTEGER');
        expect(fieldTypeToSqlite('toggle')).toBe('INTEGER');
    });

    it('should map date/time types to TEXT', () => {
        expect(fieldTypeToSqlite('date')).toBe('TEXT');
        expect(fieldTypeToSqlite('datetime')).toBe('TEXT');
        expect(fieldTypeToSqlite('timestamp')).toBe('TEXT');
        expect(fieldTypeToSqlite('time')).toBe('TEXT');
    });

    it('should map JSON/complex types to TEXT', () => {
        expect(fieldTypeToSqlite('json')).toBe('TEXT');
        expect(fieldTypeToSqlite('object')).toBe('TEXT');
        expect(fieldTypeToSqlite('array')).toBe('TEXT');
        expect(fieldTypeToSqlite('multiselect')).toBe('TEXT');
    });

    it('should map binary types to BLOB', () => {
        expect(fieldTypeToSqlite('blob')).toBe('BLOB');
        expect(fieldTypeToSqlite('binary')).toBe('BLOB');
        expect(fieldTypeToSqlite('image')).toBe('BLOB');
        expect(fieldTypeToSqlite('file')).toBe('BLOB');
    });

    it('should default to TEXT for unknown types', () => {
        expect(fieldTypeToSqlite('unknown_type')).toBe('TEXT');
        expect(fieldTypeToSqlite('')).toBe('TEXT');
    });
});

describe('isJsonFieldType', () => {
    it('should return true for JSON field types', () => {
        expect(isJsonFieldType('json')).toBe(true);
        expect(isJsonFieldType('object')).toBe(true);
        expect(isJsonFieldType('array')).toBe(true);
        expect(isJsonFieldType('multiselect')).toBe(true);
    });

    it('should return false for non-JSON field types', () => {
        expect(isJsonFieldType('text')).toBe(false);
        expect(isJsonFieldType('integer')).toBe(false);
        expect(isJsonFieldType('boolean')).toBe(false);
    });
});

describe('isBooleanFieldType', () => {
    it('should return true for boolean field types', () => {
        expect(isBooleanFieldType('boolean')).toBe(true);
        expect(isBooleanFieldType('toggle')).toBe(true);
    });

    it('should return false for non-boolean field types', () => {
        expect(isBooleanFieldType('text')).toBe(false);
        expect(isBooleanFieldType('integer')).toBe(false);
        expect(isBooleanFieldType('json')).toBe(false);
    });
});
