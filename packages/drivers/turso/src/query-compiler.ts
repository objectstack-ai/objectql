/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Query Compiler — QueryAST / Filter → SQL (SQLite dialect)
 *
 * Compiles ObjectStack query structures into parameterized SQL strings
 * suitable for libSQL execution.
 */

import type { InValue } from '@libsql/client';

/**
 * Compiled SQL query ready for libSQL execution.
 */
export interface CompiledQuery {
    /** Parameterized SQL string */
    sql: string;
    /** Ordered parameter values */
    args: InValue[];
}

// ============================================================================
// Filter Compilation
// ============================================================================

/**
 * Compile a filter object (MongoDB-style operators) into a SQL WHERE clause.
 *
 * Supports:
 * - Direct equality: `{ name: 'Alice' }`
 * - Comparison operators: `{ age: { $gt: 18 } }`
 * - Logical operators: `{ $and: [...] }`, `{ $or: [...] }`
 * - Array operators: `{ status: { $in: ['a', 'b'] } }`
 * - Null checks: `{ field: { $exists: true } }`
 * - Legacy array format: `['field', 'op', 'value', 'and', ...]`
 */
export function compileFilter(filters: unknown): CompiledQuery {
    if (!filters) {
        return { sql: '', args: [] };
    }

    // Legacy array format: ['field', 'op', 'value', 'and', ...]
    if (Array.isArray(filters)) {
        return compileLegacyArrayFilter(filters);
    }

    // MongoDB-style object filters
    if (typeof filters === 'object') {
        return compileObjectFilter(filters as Record<string, unknown>);
    }

    return { sql: '', args: [] };
}

/**
 * Compile legacy array filter format used by older ObjectQL APIs.
 *
 * Format: `[field, operator, value, conjunction, field, operator, value, ...]`
 */
function compileLegacyArrayFilter(filters: unknown[]): CompiledQuery {
    const parts: string[] = [];
    const args: InValue[] = [];

    let i = 0;
    while (i < filters.length) {
        const field = filters[i] as string;
        const op = filters[i + 1] as string;
        const value = filters[i + 2];

        const { sql, args: fieldArgs } = compileOperator(field, op, value);
        parts.push(sql);
        args.push(...fieldArgs);

        i += 3;

        // Check for conjunction (and/or)
        if (i < filters.length && typeof filters[i] === 'string') {
            const conjunction = (filters[i] as string).toUpperCase();
            if (conjunction === 'AND' || conjunction === 'OR') {
                parts.push(conjunction);
                i++;
            }
        }
    }

    return { sql: parts.join(' '), args };
}

/**
 * Compile a single field operator expression.
 */
function compileOperator(field: string, op: string, value: unknown): CompiledQuery {
    const quotedField = quoteIdentifier(field);

    switch (op.toLowerCase()) {
        case '=':
        case 'eq':
            if (value === null) return { sql: `${quotedField} IS NULL`, args: [] };
            return { sql: `${quotedField} = ?`, args: [value as InValue] };
        case '!=':
        case '<>':
        case 'ne':
            if (value === null) return { sql: `${quotedField} IS NOT NULL`, args: [] };
            return { sql: `${quotedField} != ?`, args: [value as InValue] };
        case '>':
        case 'gt':
            return { sql: `${quotedField} > ?`, args: [value as InValue] };
        case '>=':
        case 'gte':
            return { sql: `${quotedField} >= ?`, args: [value as InValue] };
        case '<':
        case 'lt':
            return { sql: `${quotedField} < ?`, args: [value as InValue] };
        case '<=':
        case 'lte':
            return { sql: `${quotedField} <= ?`, args: [value as InValue] };
        case 'like':
            return { sql: `${quotedField} LIKE ?`, args: [value as InValue] };
        case 'in':
            return compileInOperator(quotedField, value as unknown[]);
        case 'notin':
        case 'not_in':
            return compileNotInOperator(quotedField, value as unknown[]);
        case 'between':
            if (Array.isArray(value) && value.length === 2) {
                return { sql: `${quotedField} BETWEEN ? AND ?`, args: [value[0] as InValue, value[1] as InValue] };
            }
            return { sql: '1=1', args: [] };
        default:
            return { sql: `${quotedField} = ?`, args: [value as InValue] };
    }
}

/**
 * Compile MongoDB-style object filter into SQL WHERE clause.
 */
function compileObjectFilter(filter: Record<string, unknown>): CompiledQuery {
    const parts: string[] = [];
    const args: InValue[] = [];

    for (const [key, value] of Object.entries(filter)) {
        // Logical operators
        if (key === '$and') {
            const subFilters = value as Record<string, unknown>[];
            const compiled = subFilters.map(f => compileObjectFilter(f));
            const nonEmpty = compiled.filter(c => c.sql);
            if (nonEmpty.length > 0) {
                parts.push(`(${nonEmpty.map(c => c.sql).join(' AND ')})`);
                nonEmpty.forEach(c => args.push(...c.args));
            }
            continue;
        }

        if (key === '$or') {
            const subFilters = value as Record<string, unknown>[];
            const compiled = subFilters.map(f => compileObjectFilter(f));
            const nonEmpty = compiled.filter(c => c.sql);
            if (nonEmpty.length > 0) {
                parts.push(`(${nonEmpty.map(c => c.sql).join(' OR ')})`);
                nonEmpty.forEach(c => args.push(...c.args));
            }
            continue;
        }

        if (key === '$not') {
            const compiled = compileObjectFilter(value as Record<string, unknown>);
            if (compiled.sql) {
                parts.push(`NOT (${compiled.sql})`);
                args.push(...compiled.args);
            }
            continue;
        }

        const quotedField = quoteIdentifier(key);

        // Value is an operator object
        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
            const opObj = value as Record<string, unknown>;

            for (const [op, opVal] of Object.entries(opObj)) {
                switch (op) {
                    case '$eq':
                        if (opVal === null) { parts.push(`${quotedField} IS NULL`); }
                        else { parts.push(`${quotedField} = ?`); args.push(opVal as InValue); }
                        break;
                    case '$ne':
                        if (opVal === null) { parts.push(`${quotedField} IS NOT NULL`); }
                        else { parts.push(`${quotedField} != ?`); args.push(opVal as InValue); }
                        break;
                    case '$gt':
                        parts.push(`${quotedField} > ?`); args.push(opVal as InValue);
                        break;
                    case '$gte':
                        parts.push(`${quotedField} >= ?`); args.push(opVal as InValue);
                        break;
                    case '$lt':
                        parts.push(`${quotedField} < ?`); args.push(opVal as InValue);
                        break;
                    case '$lte':
                        parts.push(`${quotedField} <= ?`); args.push(opVal as InValue);
                        break;
                    case '$in': {
                        const { sql: inSql, args: inArgs } = compileInOperator(quotedField, opVal as unknown[]);
                        parts.push(inSql); args.push(...inArgs);
                        break;
                    }
                    case '$nin': {
                        const { sql: ninSql, args: ninArgs } = compileNotInOperator(quotedField, opVal as unknown[]);
                        parts.push(ninSql); args.push(...ninArgs);
                        break;
                    }
                    case '$like':
                        parts.push(`${quotedField} LIKE ?`); args.push(opVal as InValue);
                        break;
                    case '$exists':
                        parts.push(opVal ? `${quotedField} IS NOT NULL` : `${quotedField} IS NULL`);
                        break;
                    case '$between':
                        if (Array.isArray(opVal) && opVal.length === 2) {
                            parts.push(`${quotedField} BETWEEN ? AND ?`);
                            args.push(opVal[0] as InValue, opVal[1] as InValue);
                        }
                        break;
                }
            }
            continue;
        }

        // Direct equality
        if (value === null) {
            parts.push(`${quotedField} IS NULL`);
        } else {
            parts.push(`${quotedField} = ?`);
            args.push(value as InValue);
        }
    }

    return { sql: parts.join(' AND '), args };
}

/**
 * Compile an IN (...) clause.
 */
function compileInOperator(quotedField: string, values: unknown[]): CompiledQuery {
    if (!Array.isArray(values) || values.length === 0) {
        return { sql: '1=0', args: [] };
    }
    const placeholders = values.map(() => '?').join(', ');
    return { sql: `${quotedField} IN (${placeholders})`, args: values as InValue[] };
}

/**
 * Compile a NOT IN (...) clause.
 */
function compileNotInOperator(quotedField: string, values: unknown[]): CompiledQuery {
    if (!Array.isArray(values) || values.length === 0) {
        return { sql: '1=1', args: [] };
    }
    const placeholders = values.map(() => '?').join(', ');
    return { sql: `${quotedField} NOT IN (${placeholders})`, args: values as InValue[] };
}

// ============================================================================
// SELECT Query Compilation
// ============================================================================

/**
 * Options for compiling a SELECT query.
 */
export interface SelectQueryOptions {
    objectName: string;
    fields?: string[];
    where?: CompiledQuery;
    orderBy?: Array<{ field: string; direction?: 'asc' | 'desc' }>;
    limit?: number;
    offset?: number;
}

/**
 * Compile a SELECT query.
 */
export function compileSelect(options: SelectQueryOptions): CompiledQuery {
    const args: InValue[] = [];
    const table = quoteIdentifier(options.objectName);

    const columns = options.fields?.length
        ? options.fields.map(f => quoteIdentifier(f)).join(', ')
        : '*';

    let sql = `SELECT ${columns} FROM ${table}`;

    // WHERE clause
    if (options.where && options.where.sql) {
        sql += ` WHERE ${options.where.sql}`;
        args.push(...options.where.args);
    }

    // ORDER BY
    if (options.orderBy?.length) {
        const orderClauses = options.orderBy.map(
            o => `${quoteIdentifier(o.field)} ${(o.direction || 'asc').toUpperCase()}`
        );
        sql += ` ORDER BY ${orderClauses.join(', ')}`;
    }

    // LIMIT / OFFSET
    if (options.limit !== undefined) {
        sql += ` LIMIT ?`;
        args.push(options.limit);
    }
    if (options.offset !== undefined) {
        sql += ` OFFSET ?`;
        args.push(options.offset);
    }

    return { sql, args };
}

// ============================================================================
// Sorting Helpers
// ============================================================================

/**
 * Parse sort specification into orderBy array.
 *
 * Supports:
 * - Array of [field, direction] tuples: `[['name', 'asc'], ['age', 'desc']]`
 * - Object format: `{ name: 1, age: -1 }`
 * - String format: `'name asc, age desc'`
 */
export function parseSort(sort: unknown): Array<{ field: string; direction: 'asc' | 'desc' }> {
    if (!sort) return [];

    // Array of tuples
    if (Array.isArray(sort)) {
        return sort.map((item: unknown) => {
            if (Array.isArray(item)) {
                return { field: item[0] as string, direction: (item[1] as string || 'asc').toLowerCase() as 'asc' | 'desc' };
            }
            if (typeof item === 'string') {
                return { field: item, direction: 'asc' as const };
            }
            const obj = item as Record<string, unknown>;
            return { field: obj.field as string, direction: (obj.direction as string || 'asc').toLowerCase() as 'asc' | 'desc' };
        });
    }

    // Object format: { name: 1, age: -1 }
    if (typeof sort === 'object') {
        return Object.entries(sort as Record<string, unknown>).map(([field, dir]) => ({
            field,
            direction: (dir === -1 || dir === 'desc') ? 'desc' as const : 'asc' as const
        }));
    }

    // String format: 'name asc, age desc'
    if (typeof sort === 'string') {
        return sort.split(',').map(part => {
            const trimmed = part.trim().split(/\s+/);
            return { field: trimmed[0], direction: (trimmed[1] || 'asc').toLowerCase() as 'asc' | 'desc' };
        });
    }

    return [];
}

// ============================================================================
// Utility
// ============================================================================

/**
 * Quote a SQL identifier (table or column name) to prevent injection.
 * Uses double-quotes per SQLite convention.
 */
export function quoteIdentifier(name: string): string {
    // Escape embedded double-quotes
    return `"${name.replace(/"/g, '""')}"`;
}
