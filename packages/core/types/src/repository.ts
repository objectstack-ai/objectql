/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { BasePlugin } from './plugin';
import { RuntimeContext } from './query-processor';

/**
 * Repository plugin interface.
 * 
 * Repository plugins extend the base repository with additional capabilities:
 * - Batch operations (createMany, updateMany, deleteMany)
 * - Upsert operations (create or update)
 * - Soft delete functionality
 * - Audit tracking (createdBy, updatedBy, etc.)
 * - Custom CRUD methods
 * 
 * Lifecycle hooks allow plugins to intercept and modify CRUD operations.
 */
export interface RepositoryPlugin extends BasePlugin {
    type: 'repository';
    
    /**
     * Extend the base repository with custom methods.
     * 
     * Use this to add new methods to the repository instance:
     * - repo.createMany(records)
     * - repo.upsert(id, data)
     * - repo.softDelete(id)
     * 
     * @param repository - Base repository instance (avoid circular dep)
     * @param context - Execution context
     */
    extendRepository?(
        repository: any,
        context: RuntimeContext
    ): void;
    
    /**
     * Hook called before creating a new record.
     * 
     * Use this to:
     * - Add audit fields (createdBy, createdAt)
     * - Validate data
     * - Set default values
     * - Transform data
     * 
     * @param data - Data to be created
     * @param context - Execution context
     * @returns Modified data
     */
    beforeCreate?(
        data: any,
        context: RuntimeContext
    ): Promise<any>;
    
    /**
     * Hook called after creating a new record.
     * 
     * Use this to:
     * - Emit events
     * - Update related records
     * - Clear caches
     * 
     * @param result - Created record
     * @param context - Execution context
     * @returns Modified result
     */
    afterCreate?(
        result: any,
        context: RuntimeContext
    ): Promise<any>;
    
    /**
     * Hook called before updating a record.
     * 
     * Use this to:
     * - Add audit fields (updatedBy, updatedAt)
     * - Validate changes
     * - Transform data
     * 
     * @param id - Record ID to update
     * @param data - Update data
     * @param context - Execution context
     * @returns Modified data
     */
    beforeUpdate?(
        id: string | number,
        data: any,
        context: RuntimeContext
    ): Promise<any>;
    
    /**
     * Hook called after updating a record.
     * 
     * Use this to:
     * - Emit events
     * - Update related records
     * - Clear caches
     * 
     * @param result - Updated record
     * @param context - Execution context
     * @returns Modified result
     */
    afterUpdate?(
        result: any,
        context: RuntimeContext
    ): Promise<any>;
    
    /**
     * Hook called before deleting a record.
     * 
     * Use this to:
     * - Validate deletion
     * - Check dependencies
     * - Implement soft delete
     * 
     * @param id - Record ID to delete
     * @param context - Execution context
     */
    beforeDelete?(
        id: string | number,
        context: RuntimeContext
    ): Promise<void>;
    
    /**
     * Hook called after deleting a record.
     * 
     * Use this to:
     * - Emit events
     * - Cleanup related records
     * - Clear caches
     * 
     * @param id - Deleted record ID
     * @param context - Execution context
     */
    afterDelete?(
        id: string | number,
        context: RuntimeContext
    ): Promise<void>;
    
    /**
     * Hook called before finding records.
     * 
     * Use this to:
     * - Add security filters
     * - Modify query
     * 
     * @param query - Query AST
     * @param context - Execution context
     * @returns Modified query
     */
    beforeFind?(
        query: any,
        context: RuntimeContext
    ): Promise<any>;
    
    /**
     * Hook called after finding records.
     * 
     * Use this to:
     * - Filter results
     * - Transform data
     * - Add computed fields
     * 
     * @param results - Query results
     * @param context - Execution context
     * @returns Modified results
     */
    afterFind?(
        results: any[],
        context: RuntimeContext
    ): Promise<any[]>;
}

/**
 * Configuration options for repository plugins.
 */
export interface RepositoryOptions {
    /** Enable automatic audit fields (_createdBy, _createdAt, etc.) */
    auditFields?: boolean;
    
    /** Enable soft delete functionality */
    softDelete?: boolean;
    
    /** Field name for soft delete flag */
    softDeleteField?: string;
    
    /** Field name for deletion timestamp */
    softDeleteTimestampField?: string;
    
    /** Enable batch operations */
    enableBatchOperations?: boolean;
    
    /** Maximum batch size for bulk operations */
    maxBatchSize?: number;
}
