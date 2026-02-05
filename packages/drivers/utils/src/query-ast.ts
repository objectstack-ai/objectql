/**
 * QueryAST Normalization and Parsing Utilities
 * 
 * Provides utilities to normalize and parse QueryAST from different formats:
 * - Legacy ObjectQL query format
 * - New QueryAST format from @objectstack/spec
 * - Backward compatibility handling
 */

import { Data } from '@objectstack/spec';
import { z } from 'zod';
type QueryAST = z.infer<typeof Data.QueryAST>;
type SortNode = typeof Data.SortNode;

/**
 * Normalized query structure for internal driver use
 */
export interface NormalizedQuery {
    where?: any;
    orderBy?: Array<{ field: string; order: 'asc' | 'desc' }>;
    offset?: number;
    limit?: number;
    fields?: string[];
}

/**
 * Normalize query from various formats to standard NormalizedQuery
 * 
 * Supports:
 * - Legacy format with 'filters', 'sort', 'skip', 'limit'
 * - QueryAST format with 'where', 'orderBy', 'offset', 'top'
 * 
 * @param query - Query in any supported format
 * @returns Normalized query object
 */
export function normalizeQuery(query: any): NormalizedQuery {
    if (!query) {
        return {};
    }
    
    const normalized: NormalizedQuery = {};
    
    // Handle where/filters
    if (query.where !== undefined) {
        normalized.where = query.where;
    } else if (query.filters !== undefined) {
        normalized.where = query.filters;
    }
    
    // Handle orderBy/sort
    if (query.orderBy !== undefined) {
        normalized.orderBy = normalizeOrderBy(query.orderBy);
    } else if (query.sort !== undefined) {
        normalized.orderBy = normalizeOrderBy(query.sort);
    }
    
    // Handle offset/skip
    if (query.offset !== undefined) {
        normalized.offset = query.offset;
    } else if (query.skip !== undefined) {
        normalized.offset = query.skip;
    }
    
    // Handle limit/top
    if (query.limit !== undefined) {
        normalized.limit = query.limit;
    } else if (query.top !== undefined) {
        normalized.limit = query.top;
    }
    
    // Handle fields
    if (query.fields !== undefined) {
        normalized.fields = Array.isArray(query.fields) ? query.fields : [query.fields];
    }
    
    return normalized;
}

/**
 * Normalize orderBy/sort clause to standard format
 * 
 * Supports:
 * - Array of objects: [{ field: 'age', order: 'asc' }]
 * - Array of arrays: [['age', 'asc'], ['name', 'desc']]
 * - String: 'age' or 'age asc' or '-age'
 * - Object: { age: 1, name: -1 }
 * 
 * @param orderBy - Sort specification in any format
 * @returns Normalized array of { field, order } objects
 */
export function normalizeOrderBy(orderBy: any): Array<{ field: string; order: 'asc' | 'desc' }> {
    if (!orderBy) {
        return [];
    }
    
    // Already normalized format
    if (Array.isArray(orderBy) && orderBy[0]?.field && orderBy[0]?.order) {
        return orderBy.map(item => ({
            field: item.field,
            order: item.order === 'desc' || item.order === -1 ? 'desc' : 'asc'
        }));
    }
    
    // Array of arrays format: [['age', 'asc'], ['name', 'desc']]
    if (Array.isArray(orderBy) && Array.isArray(orderBy[0])) {
        return orderBy.map(([field, order]: [string, string | number]) => ({
            field,
            order: order === 'desc' || order === -1 ? 'desc' : 'asc'
        }));
    }
    
    // String format: 'age', 'age asc', '-age'
    if (typeof orderBy === 'string') {
        if (orderBy.startsWith('-')) {
            return [{ field: orderBy.substring(1), order: 'desc' }];
        }
        const parts = orderBy.split(' ');
        return [{
            field: parts[0],
            order: parts[1] === 'desc' ? 'desc' : 'asc'
        }];
    }
    
    // Object format: { age: 1, name: -1 }
    if (typeof orderBy === 'object' && !Array.isArray(orderBy)) {
        return Object.entries(orderBy).map(([field, order]) => ({
            field,
            order: order === -1 || order === 'desc' ? 'desc' : 'asc'
        }));
    }
    
    return [];
}

/**
 * Apply field projection to a document
 * 
 * @param document - The document to project
 * @param fields - Array of field names to include
 * @returns Projected document
 */
export function projectFields(document: any, fields: string[]): any {
    if (!fields || fields.length === 0) {
        return document;
    }
    
    const projected: any = {};
    
    for (const field of fields) {
        if (document.hasOwnProperty(field)) {
            projected[field] = document[field];
        }
    }
    
    // Always include id if it exists
    if (document.id && !projected.id) {
        projected.id = document.id;
    }
    
    return projected;
}

/**
 * Apply manual sorting to an array of records
 * 
 * @param records - Array of records to sort
 * @param orderBy - Normalized sort specification
 * @returns Sorted array
 */
export function applySorting<T>(records: T[], orderBy: Array<{ field: string; order: 'asc' | 'desc' }>): T[] {
    if (!orderBy || orderBy.length === 0) {
        return records;
    }
    
    return [...records].sort((a: any, b: any) => {
        for (const { field, order } of orderBy) {
            const aVal = a[field];
            const bVal = b[field];
            
            // Handle null/undefined
            if (aVal === null || aVal === undefined) {
                return order === 'asc' ? -1 : 1;
            }
            if (bVal === null || bVal === undefined) {
                return order === 'asc' ? 1 : -1;
            }
            
            // Compare values
            if (aVal < bVal) {
                return order === 'asc' ? -1 : 1;
            }
            if (aVal > bVal) {
                return order === 'asc' ? 1 : -1;
            }
        }
        return 0;
    });
}

/**
 * Apply pagination to an array of records
 * 
 * @param records - Array of records to paginate
 * @param offset - Number of records to skip
 * @param limit - Maximum number of records to return
 * @returns Paginated array
 */
export function applyPagination<T>(records: T[], offset?: number, limit?: number): T[] {
    let result = records;
    
    if (offset !== undefined && offset > 0) {
        result = result.slice(offset);
    }
    
    if (limit !== undefined && limit > 0) {
        result = result.slice(0, limit);
    }
    
    return result;
}
