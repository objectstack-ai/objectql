/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Data } from '@objectstack/spec';
type FilterCondition = Data.FilterCondition;

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

// Legacy types - Deprecated, kept for temporary compatibility during migration
/** @deprecated Use AggregationFunctionType instead */
export type AggregateFunction = AggregationFunctionType;

/** @deprecated Use AggregationNode instead */
export interface AggregateOption {
    func: AggregateFunction;
    field: string;
    alias?: string;
}

/**
 * Sort Node - Standard Protocol Format
 * Represents an "Order By" clause.
 */
export interface SortNode {
    /** Field name to sort by */
    field: string;
    /** Sort direction - defaults to 'asc' */
    order: 'asc' | 'desc';
}

/**
 * Aggregation Function - Standard Protocol Format
 */
export type AggregationFunctionType = 'count' | 'sum' | 'avg' | 'min' | 'max' | 'count_distinct' | 'array_agg' | 'string_agg';

/**
 * Aggregation Node - Standard Protocol Format
 * Represents an aggregated field with function.
 */
export interface AggregationNode {
    /** Aggregation function to apply */
    function: AggregationFunctionType;
    /** Field to aggregate (optional for count) */
    field?: string;
    /** Alias for the result field */
    alias: string;
    /** Apply DISTINCT to the field before aggregation */
    distinct?: boolean;
    /** Optional filter condition for this aggregation */
    filter?: Filter;
}

/**
 * Unified Query Interface - Standard Protocol Format
 * 
 * Uses @objectstack/spec QueryAST format directly.
 * This is the single source of truth for query structure.
 */
export interface UnifiedQuery {
    /** Field selection - specify which fields to return */
    fields?: string[];
    
    /** Filter conditions using standard FilterCondition syntax (was: filters) */
    where?: Filter;
    
    /** Sort order - array of SortNode objects (was: sort as tuples) */
    orderBy?: SortNode[];
    
    /** Pagination - number of records to skip (was: skip) */
    offset?: number;
    
    /** Pagination - maximum number of records to return */
    limit?: number;
    
    /** Relation expansion - load related records */
    expand?: Record<string, UnifiedQuery>;
    
    /** Aggregation - group by fields */
    groupBy?: string[];
    
    /** Aggregation - aggregate functions to apply (was: aggregate with func) */
    aggregations?: AggregationNode[];
    
    /** Filter for aggregated results (HAVING clause) */
    having?: Filter;
    
    /** Enable distinct results */
    distinct?: boolean;
}
