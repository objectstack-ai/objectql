/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { BasePlugin } from './plugin';

/**
 * Query AST validation result.
 */
export interface ValidationResult {
    /** Whether the query is valid */
    valid: boolean;
    
    /** List of validation errors, if any */
    errors: ValidationError[];
}

/**
 * Validation error details.
 */
export interface ValidationError {
    /** Field or path that failed validation */
    field: string;
    
    /** Human-readable error message */
    message: string;
    
    /** Error code for programmatic handling */
    code?: string;
    
    /** Additional error metadata */
    metadata?: Record<string, any>;
}

/**
 * Query processor plugin interface.
 * 
 * Query processors enhance the query execution pipeline by:
 * - Validating queries before execution
 * - Optimizing query AST for performance
 * - Transforming queries (e.g., adding filters, modifying fields)
 * - Post-processing query results
 * 
 * Execution order:
 * 1. validateQuery (if provided)
 * 2. beforeQuery (if provided)  
 * 3. optimizeQuery (if provided)
 * 4. [Query Execution]
 * 5. afterQuery (if provided)
 */
export interface QueryProcessorPlugin extends BasePlugin {
    type: 'query-processor';
    
    /**
     * Validate a query AST before execution.
     * 
     * @param ast - The query AST to validate
     * @param context - Execution context with runtime and user info
     * @returns Validation result with any errors
     */
    validateQuery?(
        ast: any,
        context: RuntimeContext
    ): Promise<ValidationResult>;
    
    /**
     * Transform a query AST before execution.
     * 
     * Use this to:
     * - Add security filters
     * - Inject computed fields
     * - Modify query structure
     * 
     * @param ast - The query AST to transform
     * @param context - Execution context
     * @returns Transformed query AST
     * @throws If the query is invalid
     */
    beforeQuery?(
        ast: any,
        context: RuntimeContext
    ): Promise<any>;
    
    /**
     * Optimize a query AST for better performance.
     * 
     * Use this to:
     * - Remove redundant filters
     * - Add index hints
     * - Optimize join order
     * - Prune unused fields
     * 
     * @param ast - The query AST to optimize
     * @param context - Execution context
     * @returns Optimized query AST
     */
    optimizeQuery?(
        ast: any,
        context: RuntimeContext
    ): Promise<any>;
    
    /**
     * Transform query results after execution.
     * 
     * Use this to:
     * - Post-process data
     * - Apply computed fields
     * - Filter sensitive information
     * 
     * @param result - The query result to transform
     * @param context - Execution context
     * @returns Transformed result
     */
    afterQuery?(
        result: any,
        context: RuntimeContext
    ): Promise<any>;
}

/**
 * Runtime context available to plugins during query execution.
 */
export interface RuntimeContext {
    /** Runtime instance (avoid circular dep by using 'any') */
    runtime: any;
    
    /** User ID who initiated the query */
    userId?: string | number;
    
    /** Session or authentication token */
    sessionId?: string;
    
    /** User roles for permission checking */
    roles?: string[];
    
    /** Additional context metadata */
    metadata?: Record<string, any>;
    
    /** Query being executed (set by beforeQuery) */
    query?: any;
    
    /** Flag to skip query execution (e.g., for cache hits) */
    skipExecution?: boolean;
    
    /** Cached result (if skipExecution is true) */
    cachedResult?: any;
}

/**
 * Configuration options for query validation plugins.
 */
export interface ValidationOptions {
    /** Enable strict validation mode */
    strict?: boolean;
    
    /** Allow querying unknown fields */
    allowUnknownFields?: boolean;
    
    /** Custom validator functions */
    customValidators?: Record<string, (value: any) => boolean>;
    
    /** Maximum query depth */
    maxDepth?: number;
    
    /** Maximum number of fields */
    maxFields?: number;
}
