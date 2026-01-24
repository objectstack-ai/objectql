/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { FilterCondition } from '@objectstack/spec/data';

/**
 * Modern Query Filter using @objectstack/spec FilterCondition
 * 
 * Supports MongoDB/Prisma-style object-based syntax:
 * - Implicit equality: { field: value }
 * - Explicit operators: { field: { $eq: value, $gt: 10 } }
 * - Logical operators: { $and: [...], $or: [...] }
 * - String operators: { name: { $contains: "text" } }
 * - Range operators: { age: { $gte: 18, $lte: 65 } }
 * - Set operators: { status: { $in: ["active", "pending"] } }
 * - Null checks: { field: { $null: true } }
 * 
 * Note: $not operator is not supported. Use $ne for field-level negation.
 */
export type Filter = FilterCondition;

export type AggregateFunction = 'count' | 'sum' | 'avg' | 'min' | 'max';

export interface AggregateOption {
    func: AggregateFunction;
    field: string;
    alias?: string; // Optional: rename the result field
}

/**
 * Unified Query Interface
 * 
 * Provides a consistent query API across all ObjectQL drivers.
 */
export interface UnifiedQuery {
    /** Field selection - specify which fields to return */
    fields?: string[];
    
    /** Filter conditions using modern FilterCondition syntax */
    filters?: Filter;
    
    /** Sort order - array of [field, direction] tuples */
    sort?: [string, 'asc' | 'desc'][];
    
    /** Pagination - number of records to skip */
    skip?: number;
    
    /** Pagination - maximum number of records to return */
    limit?: number;
    
    /** Relation expansion - load related records */
    expand?: Record<string, UnifiedQuery>;
    
    /** Aggregation - group by fields */
    groupBy?: string[];
    
    /** Aggregation - aggregate functions to apply */
    aggregate?: AggregateOption[];
}
