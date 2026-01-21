/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Filter criterion: [field, operator, value]
 * 
 * Examples:
 * - ['name', '=', 'John']
 * - ['age', '>', 18]
 * - ['status', 'in', ['active', 'pending']]
 */
export type FilterCriterion = [string, string, any];

/**
 * Filter expression supporting nested logical operators.
 * 
 * Can be:
 * - A single criterion: ['name', '=', 'John']
 * - A logical operator: 'and' | 'or'
 * - A nested array: [criterion1, 'and', criterion2, 'or', criterion3]
 */
export type FilterExpression = FilterCriterion | 'and' | 'or' | FilterExpression[];

/**
 * Aggregate function types.
 */
export type AggregateFunction = 'count' | 'sum' | 'avg' | 'min' | 'max';

/**
 * Aggregate operation configuration.
 */
export interface AggregateOption {
    /** Aggregate function to apply */
    func: AggregateFunction;
    
    /** Field to aggregate */
    field: string;
    
    /** Optional alias for the result field */
    alias?: string;
}

/**
 * Sort direction.
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Sort configuration: [field, direction]
 */
export type SortOption = [string, SortDirection];

/**
 * Unified query interface for ObjectQL.
 * 
 * This is the core query structure used throughout ObjectQL for:
 * - Finding records
 * - Filtering data
 * - Sorting and pagination
 * - Aggregations
 * - Expanding related records
 */
export interface UnifiedQuery {
    /**
     * Fields to select.
     * If not specified, all fields are returned.
     */
    fields?: string[];
    
    /**
     * Filter expressions to apply.
     * Multiple filters are combined with AND by default.
     */
    filters?: FilterExpression[];
    
    /**
     * Sort options.
     * Multiple sorts are applied in order.
     */
    sort?: SortOption[];
    
    /**
     * Number of records to skip (for pagination).
     */
    skip?: number;
    
    /**
     * Maximum number of records to return.
     */
    limit?: number;
    
    /**
     * Expand related records (joins).
     * Key is the relation field name, value is the query for that relation.
     */
    expand?: Record<string, UnifiedQuery>;
    
    /**
     * Group by fields (for aggregations).
     */
    groupBy?: string[];
    
    /**
     * Aggregate operations to apply.
     */
    aggregate?: AggregateOption[];
}

/**
 * Query result wrapper with pagination metadata.
 */
export interface QueryResult<T = any> {
    /** Query results */
    data: T[];
    
    /** Total count (ignoring skip/limit) */
    total?: number;
    
    /** Number of records skipped */
    skip?: number;
    
    /** Maximum number of records returned */
    limit?: number;
    
    /** Whether there are more records available */
    hasMore?: boolean;
}

/**
 * Query execution options.
 */
export interface QueryOptions {
    /** Transaction to execute within */
    transaction?: any;
    
    /** User context for permission checking */
    userId?: string | number;
    
    /** Skip permission checks */
    skipPermissions?: boolean;
    
    /** Skip validation */
    skipValidation?: boolean;
    
    /** Skip hooks */
    skipHooks?: boolean;
    
    /** Additional metadata */
    metadata?: Record<string, any>;
}
