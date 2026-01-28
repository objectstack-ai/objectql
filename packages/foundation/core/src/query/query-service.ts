/**
 * ObjectQL Query Service
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { 
    Driver, 
    ObjectConfig, 
    UnifiedQuery, 
    Filter,
    MetadataRegistry
} from '@objectql/types';
import { Data } from '@objectstack/spec';
type QueryAST = Data.QueryAST;
import { QueryBuilder } from './query-builder';

/**
 * Options for query execution
 */
export interface QueryOptions {
    /**
     * Transaction handle for transactional queries
     */
    transaction?: any;
    
    /**
     * Skip validation (for system operations)
     */
    skipValidation?: boolean;
    
    /**
     * Include profiling information
     */
    profile?: boolean;
    
    /**
     * Custom driver options
     */
    driverOptions?: Record<string, unknown>;
}

/**
 * Result of a query execution with optional profiling data
 */
export interface QueryResult<T = any> {
    /**
     * The query results
     */
    value: T;
    
    /**
     * Total count (for paginated queries)
     */
    count?: number;
    
    /**
     * Profiling information (if profile option was enabled)
     */
    profile?: QueryProfile;
}

/**
 * Profiling information for a query
 */
export interface QueryProfile {
    /**
     * Execution time in milliseconds
     */
    executionTime: number;
    
    /**
     * Number of rows scanned
     */
    rowsScanned?: number;
    
    /**
     * Whether an index was used
     */
    indexUsed?: boolean;
    
    /**
     * The generated QueryAST
     */
    ast?: QueryAST;
}

/**
 * Query Service
 * 
 * Handles all query execution logic, separating query concerns from
 * the repository pattern. This service is responsible for:
 * - Building QueryAST from UnifiedQuery
 * - Executing queries via drivers
 * - Optional query profiling and analysis
 * 
 * The QueryService is registered as a service in the ObjectQLPlugin
 * and can be used by Repository for all read operations.
 */
export class QueryService {
    private queryBuilder: QueryBuilder;
    
    constructor(
        private datasources: Record<string, Driver>,
        private metadata: MetadataRegistry
    ) {
        this.queryBuilder = new QueryBuilder();
    }
    
    /**
     * Get the driver for a specific object
     * @private
     */
    private getDriver(objectName: string): Driver {
        const obj = this.getSchema(objectName);
        const datasourceName = obj.datasource || 'default';
        const driver = this.datasources[datasourceName];
        
        if (!driver) {
            throw new Error(`Datasource '${datasourceName}' not found for object '${objectName}'`);
        }
        
        return driver;
    }
    
    /**
     * Get the schema for an object
     * @private
     */
    private getSchema(objectName: string): ObjectConfig {
        const obj = this.metadata.get('object', objectName);
        if (!obj) {
            throw new Error(`Object '${objectName}' not found in metadata`);
        }
        return obj;
    }
    
    /**
     * Build QueryAST from UnifiedQuery
     * @private
     */
    private buildQueryAST(objectName: string, query: UnifiedQuery): QueryAST {
        return this.queryBuilder.build(objectName, query);
    }
    
    /**
     * Execute a find query
     * 
     * @param objectName - The object to query
     * @param query - The unified query
     * @param options - Query execution options
     * @returns Array of matching records
     */
    async find(
        objectName: string, 
        query: UnifiedQuery = {}, 
        options: QueryOptions = {}
    ): Promise<QueryResult<any[]>> {
        const driver = this.getDriver(objectName);
        const startTime = options.profile ? Date.now() : 0;
        
        // Build QueryAST
        const ast = this.buildQueryAST(objectName, query);
        
        // Execute query via driver
        const driverOptions = {
            transaction: options.transaction,
            ...options.driverOptions
        };
        
        let results: any[];
        let count: number | undefined;
        
        if (driver.find) {
            // Legacy driver interface
            const result: any = await driver.find(objectName, query, driverOptions);
            results = Array.isArray(result) ? result : (result?.value || []);
            count = (typeof result === 'object' && !Array.isArray(result) && result?.count !== undefined) ? result.count : undefined;
        } else if (driver.executeQuery) {
            // New DriverInterface
            const result = await driver.executeQuery(ast, driverOptions);
            results = result.value || [];
            count = result.count;
        } else {
            throw new Error(`Driver does not support query execution`);
        }
        
        const executionTime = options.profile ? Date.now() - startTime : 0;
        
        return {
            value: results,
            count,
            profile: options.profile ? {
                executionTime,
                ast,
                rowsScanned: results.length,
            } : undefined
        };
    }
    
    /**
     * Execute a findOne query by ID
     * 
     * @param objectName - The object to query
     * @param id - The record ID
     * @param options - Query execution options
     * @returns The matching record or undefined
     */
    async findOne(
        objectName: string, 
        id: string | number, 
        options: QueryOptions = {}
    ): Promise<QueryResult<any>> {
        const driver = this.getDriver(objectName);
        const startTime = options.profile ? Date.now() : 0;
        
        const driverOptions = {
            transaction: options.transaction,
            ...options.driverOptions
        };
        
        let result: any;
        
        if (driver.findOne) {
            // Legacy driver interface
            result = await driver.findOne(objectName, id, driverOptions);
        } else if (driver.get) {
            // Alternative method name
            result = await driver.get(objectName, String(id), driverOptions);
        } else if (driver.executeQuery) {
            // Fallback to query with ID filter
            const query: UnifiedQuery = {
                where: { _id: id }
            };
            const ast = this.buildQueryAST(objectName, query);
            const queryResult = await driver.executeQuery(ast, driverOptions);
            result = queryResult.value?.[0];
        } else {
            throw new Error(`Driver does not support findOne operation`);
        }
        
        const executionTime = options.profile ? Date.now() - startTime : 0;
        
        return {
            value: result,
            profile: options.profile ? {
                executionTime,
                rowsScanned: result ? 1 : 0,
            } : undefined
        };
    }
    
    /**
     * Execute a count query
     * 
     * @param objectName - The object to query
     * @param where - Optional filter condition
     * @param options - Query execution options
     * @returns Count of matching records
     */
    async count(
        objectName: string, 
        where?: Filter, 
        options: QueryOptions = {}
    ): Promise<QueryResult<number>> {
        const driver = this.getDriver(objectName);
        const startTime = options.profile ? Date.now() : 0;
        
        const query: UnifiedQuery = where ? { where } : {};
        const ast = this.buildQueryAST(objectName, query);
        
        const driverOptions = {
            transaction: options.transaction,
            ...options.driverOptions
        };
        
        let count: number;
        
        if (driver.count) {
            // Legacy driver interface
            count = await driver.count(objectName, where || {}, driverOptions);
        } else if (driver.executeQuery) {
            // Use executeQuery and count results
            // Note: This is inefficient for large datasets
            // Ideally, driver should support count-specific optimization
            const result = await driver.executeQuery(ast, driverOptions);
            count = result.count ?? result.value?.length ?? 0;
        } else {
            throw new Error(`Driver does not support count operation`);
        }
        
        const executionTime = options.profile ? Date.now() - startTime : 0;
        
        return {
            value: count,
            profile: options.profile ? {
                executionTime,
                ast,
            } : undefined
        };
    }
    
    /**
     * Execute an aggregate query
     * 
     * @param objectName - The object to query
     * @param query - The aggregation query using UnifiedQuery format
     * @param options - Query execution options
     * @returns Aggregation results
     */
    async aggregate(
        objectName: string, 
        query: UnifiedQuery, 
        options: QueryOptions = {}
    ): Promise<QueryResult<any[]>> {
        const driver = this.getDriver(objectName);
        const startTime = options.profile ? Date.now() : 0;
        
        const driverOptions = {
            transaction: options.transaction,
            ...options.driverOptions
        };
        
        let results: any[];
        
        if (driver.aggregate) {
            // Driver supports aggregation
            results = await driver.aggregate(objectName, query, driverOptions);
        } else {
            // Driver doesn't support aggregation
            throw new Error(`Driver does not support aggregate operations. Consider using a driver that supports aggregation.`);
        }
        
        const executionTime = options.profile ? Date.now() - startTime : 0;
        
        return {
            value: results,
            profile: options.profile ? {
                executionTime,
                rowsScanned: results.length,
            } : undefined
        };
    }
    
    /**
     * Execute a direct SQL/query passthrough
     * 
     * This bypasses ObjectQL's query builder and executes raw queries.
     * Use with caution as it bypasses security and validation.
     * 
     * @param objectName - The object (determines which datasource to use)
     * @param queryString - Raw query string (SQL, MongoDB query, etc.)
     * @param params - Query parameters (for parameterized queries)
     * @param options - Query execution options
     * @returns Query results
     */
    async directQuery(
        objectName: string,
        queryString: string,
        params?: any[],
        options: QueryOptions = {}
    ): Promise<QueryResult<any>> {
        const driver = this.getDriver(objectName);
        const startTime = options.profile ? Date.now() : 0;
        
        const driverOptions = {
            transaction: options.transaction,
            ...options.driverOptions
        };
        
        let results: any;
        
        if (driver.directQuery) {
            results = await driver.directQuery(queryString, params);
        } else if (driver.query) {
            // Alternative method name
            results = await driver.query(queryString, params);
        } else {
            throw new Error(`Driver does not support direct query execution`);
        }
        
        const executionTime = options.profile ? Date.now() - startTime : 0;
        
        return {
            value: results,
            profile: options.profile ? {
                executionTime,
            } : undefined
        };
    }
}
