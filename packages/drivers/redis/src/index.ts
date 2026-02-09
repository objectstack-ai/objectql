import { Data, System as SystemSpec } from '@objectstack/spec';
import { z } from 'zod';
import { QueryAST, SortNode } from '@objectql/types';
type DriverInterface = z.infer<typeof Data.DriverInterface>;
/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Redis Driver for ObjectQL (Production-Ready Implementation)
 * 
 * A full-featured ObjectQL driver that adapts Redis (a key-value store) to work with 
 * ObjectQL's universal data protocol. Suitable for production use with small to medium 
 * datasets and caching scenarios.
 * 
 * Implements both the legacy Driver interface from @objectql/types and
 * the standard DriverInterface from @objectstack/spec for full compatibility
 * with the new kernel-based plugin system.
 * 
 * Features:
 * - Full CRUD operations with batch support
 * - Distinct value queries
 * - Aggregation pipeline support ($match, $group, $sort, $project, etc.)
 * - Automatic retry with exponential backoff
 * - Connection health monitoring
 * - Redis PIPELINE for optimal bulk operations
 * 
 * Performance Considerations:
 * - Uses key scanning for queries (acceptable for < 100k records)
 * - For larger datasets or complex queries, consider:
 *   - RedisJSON module for native JSON queries
 *   - RediSearch for indexed full-text search
 *   - Secondary indexes using Redis Sets/Sorted Sets
 * 
 * @version 4.1.0 - Production-ready with distinct() and aggregate()
 */

import { Driver, ObjectQLError } from '@objectql/types';
import { createClient, RedisClientType } from 'redis';

/**
 * Command interface for executeCommand method
 * 
 * This interface defines the structure for all mutation operations
 * (create, update, delete, and their bulk variants) in the v4.0 DriverInterface.
 * 
 * @example
 * // Create a single record
 * const cmd: Command = { type: 'create', object: 'users', data: { name: 'Alice' } };
 * 
 * @example
 * // Update a record
 * const cmd: Command = { type: 'update', object: 'users', id: '123', data: { email: 'new@example.com' } };
 * 
 * @example
 * // Bulk create multiple records
 * const cmd: Command = { 
 *   type: 'bulkCreate', 
 *   object: 'users', 
 *   records: [{ name: 'Alice' }, { name: 'Bob' }] 
 * };
 */
export interface Command {
    /** Command type: create, update, delete, or their bulk variants */
    type: 'create' | 'update' | 'delete' | 'bulkCreate' | 'bulkUpdate' | 'bulkDelete';
    /** Target object name */
    object: string;
    /** Data for create/update operations */
    data?: any;
    /** Record ID for single update/delete operations */
    id?: string | number;
    /** Array of IDs for bulkDelete operation */
    ids?: Array<string | number>;
    /** Array of records for bulkCreate operation */
    records?: any[];
    /** Array of updates for bulkUpdate operation */
    updates?: Array<{id: string | number, data: any}>;
    /** Additional command-specific options */
    options?: any;
}

/**
 * Command result interface
 * 
 * Standardized result format for all executeCommand operations.
 * 
 * @example
 * // Successful create
 * { success: true, data: { id: '123', name: 'Alice' }, affected: 1 }
 * 
 * @example
 * // Failed operation
 * { success: false, error: 'Record not found', affected: 0 }
 */
export interface CommandResult {
    /** Whether the command executed successfully */
    success: boolean;
    /** The resulting data (for create/update operations) */
    data?: any;
    /** Number of records affected by the operation */
    affected: number;
    /** Error message if the command failed */
    error?: string;
}

/**
 * Configuration options for the Redis driver.
 */
export interface RedisDriverConfig {
    /** Redis connection URL (e.g., 'redis://localhost:6379') */
    url: string;
    /** Additional Redis client options */
    options?: any;
    /** Connection retry configuration */
    retry?: {
        /** Maximum number of retry attempts (default: 10) */
        maxAttempts?: number;
        /** Initial retry delay in milliseconds (default: 100) */
        initialDelay?: number;
        /** Maximum retry delay in milliseconds (default: 3000) */
        maxDelay?: number;
        /** Enable exponential backoff (default: true) */
        exponentialBackoff?: boolean;
    };
    /** Connection pool configuration */
    pool?: {
        /** Minimum number of connections (default: 1) */
        min?: number;
        /** Maximum number of connections (default: 10) */
        max?: number;
    };
    /** Enable automatic reconnection on disconnect (default: true) */
    autoReconnect?: boolean;
}

/**
 * Redis Driver Implementation
 * 
 * Stores ObjectQL documents as JSON strings in Redis with keys formatted as:
 * `objectName:id`
 * 
 * Example: `users:user-123` → `{"id":"user-123","name":"Alice",...}`
 */
export class RedisDriver implements Driver {
    // Driver metadata (ObjectStack-compatible)
    public readonly name = 'RedisDriver';
    public readonly version = '4.1.0'; // Production-ready with distinct() and aggregate()
    public readonly supports = {
        transactions: false,
        joins: false,
        fullTextSearch: false,
        jsonFields: true,
        arrayFields: true,
        queryFilters: true,
        queryAggregations: true, // Now supported with aggregate()
        querySorting: true,
        queryPagination: true,
        queryWindowFunctions: false,
        querySubqueries: false
    };

    private client: RedisClientType;
    private config: RedisDriverConfig;
    private connected: Promise<void>;
    private reconnecting: boolean = false;

    constructor(config: RedisDriverConfig) {
        this.config = {
            ...config,
            retry: {
                maxAttempts: config.retry?.maxAttempts ?? 10,
                initialDelay: config.retry?.initialDelay ?? 100,
                maxDelay: config.retry?.maxDelay ?? 3000,
                exponentialBackoff: config.retry?.exponentialBackoff ?? true,
            },
            pool: {
                min: config.pool?.min ?? 1,
                max: config.pool?.max ?? 10,
            },
            autoReconnect: config.autoReconnect ?? true,
        };
        
        this.client = createClient({ 
            url: this.config.url,
            socket: {
                reconnectStrategy: (retries: number) => {
                    // Implement exponential backoff for reconnection
                    if (retries > (this.config.retry?.maxAttempts ?? 10)) {
                        return new Error('Max reconnection attempts reached');
                    }
                    
                    const delay = this.calculateRetryDelay(retries);
                    return delay;
                }
            },
            ...this.config.options 
        }) as RedisClientType;
        
        // Handle connection errors with enhanced logging
        this.client.on('error', (_err: Error) => {
            // Error silently ignored
        });
        
        // Handle successful reconnection
        this.client.on('reconnecting', () => {
            this.reconnecting = true;
        });
        
        this.client.on('ready', () => {
            if (this.reconnecting) {
                this.reconnecting = false;
            }
        });
        
        this.connected = this.connect();
    }

    /**
     * Calculate retry delay with exponential backoff
     */
    private calculateRetryDelay(attempt: number): number {
        const config = this.config.retry!;
        const initialDelay = config.initialDelay!;
        const maxDelay = config.maxDelay!;
        
        if (!config.exponentialBackoff) {
            return initialDelay;
        }
        
        // Exponential backoff: delay = min(initialDelay * 2^attempt, maxDelay)
        const delay = Math.min(initialDelay * Math.pow(2, attempt - 1), maxDelay);
        return delay;
    }

    async connect(): Promise<void> {
        let lastError: Error | undefined;
        const maxAttempts = this.config.retry?.maxAttempts ?? 10;
        
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                await this.client.connect();
                return;
            } catch (error) {
                lastError = error as Error;
                
                if (attempt < maxAttempts) {
                    const delay = this.calculateRetryDelay(attempt);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        
        throw new ObjectQLError({ code: 'DRIVER_CONNECTION_FAILED', message: `[RedisDriver] Failed to connect after ${maxAttempts} attempts: ${lastError?.message}` });
    }

    /**
     * Check database connection health with detailed diagnostics
     * @returns Health status object with connection state
     */
    async checkHealth(): Promise<boolean> {
        try {
            await this.connected;
            
            // Perform ping to verify connection is alive
            const start = Date.now();
            await this.client.ping();
            const latency = Date.now() - start;
            
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Find multiple records matching the query criteria.
     * 
     * Supports both legacy filter format and QueryAST format.
     * For optimal performance with large datasets, use filters to limit results.
     */
    async find(objectName: string, query: any = {}, options?: any): Promise<any[]> {
        await this.connected;
        
        // Normalize query to support both legacy and QueryAST formats
        const normalizedQuery = this.normalizeQuery(query);
        
        // Get all keys for this object type
        const pattern = `${objectName}:*`;
        const keys = await this.client.keys(pattern);
        
        // Retrieve all documents
        let results: any[] = [];
        for (const key of keys) {
            const data = await this.client.get(key);
            if (data) {
                try {
                    const doc = JSON.parse(data);
                    results.push(doc);
                } catch (error) {
                    // Error silently ignored
                }
            }
        }
        // Apply filters (in-memory)
        if (normalizedQuery.filters) {
            results = this.applyFilters(results, normalizedQuery.filters);
        }
        
        // Apply sorting (in-memory)
        if (normalizedQuery.sort && Array.isArray(normalizedQuery.sort)) {
            results = this.applySort(results, normalizedQuery.sort);
        }
        
        // Apply pagination
        if (normalizedQuery.skip) {
            results = results.slice(normalizedQuery.skip);
        }
        if (normalizedQuery.limit) {
            results = results.slice(0, normalizedQuery.limit);
        }
        
        // Apply field projection
        if (normalizedQuery.fields && Array.isArray(normalizedQuery.fields)) {
            results = results.map(doc => this.projectFields(doc, normalizedQuery.fields));
        }
        
        return results;
    }

    /**
     * Find a single record by ID.
     */
    async findOne(objectName: string, id: string | number, query?: any, options?: any): Promise<any> {
        await this.connected;
        
        // If ID is provided, fetch directly
        if (id) {
            const key = this.generateRedisKey(objectName, id);
            const data = await this.client.get(key);
            
            if (!data) {
                return null;
            }
            
            try {
                return JSON.parse(data);
            } catch (error) {
                // Error silently ignored
                return null;
            }
        }
        
        // If query is provided, use find and return first result
        if (query) {
            const results = await this.find(objectName, { ...query, limit: 1 }, options);
            return results[0] || null;
        }
        
        return null;
    }

    /**
     * Create a new record.
     */
    async create(objectName: string, data: any, options?: any): Promise<any> {
        await this.connected;
        
        // Generate ID if not provided
        const id = data.id || this.generateId();
        const now = new Date().toISOString();
        
        const doc = {
            ...data,
            id,
            created_at: data.created_at || now,
            updated_at: data.updated_at || now
        };
        
        const key = this.generateRedisKey(objectName, id);
        
        // Use SET with NX option to prevent overwriting existing records
        const result = await this.client.set(key, JSON.stringify(doc), { NX: true });
        
        if (!result) {
            throw new ObjectQLError({ code: 'DRIVER_QUERY_FAILED', message: `Record with ID ${id} already exists in ${objectName}` });
        }
        
        return doc;
    }

    /**
     * Update an existing record.
     */
    async update(objectName: string, id: string | number, data: any, options?: any): Promise<any> {
        await this.connected;
        
        const key = this.generateRedisKey(objectName, id);
        const existing = await this.client.get(key);
        
        if (!existing) {
            throw new ObjectQLError({ code: 'NOT_FOUND', message: `Record not found: ${objectName}:${id}` });
        }
        
        const existingDoc = JSON.parse(existing);
        const doc = {
            ...existingDoc,
            ...data,
            id, // Preserve ID
            created_at: existingDoc.created_at, // Preserve created_at
            updated_at: new Date().toISOString()
        };
        
        await this.client.set(key, JSON.stringify(doc));
        
        return doc;
    }

    /**
     * Delete a record.
     */
    async delete(objectName: string, id: string | number, options?: any): Promise<any> {
        await this.connected;
        
        const key = this.generateRedisKey(objectName, id);
        const result = await this.client.del(key);
        
        return result > 0;
    }

    /**
     * Count records matching filters.
     * 
     * Returns the number of records that match the specified filter criteria.
     * If no filters are provided, returns the total count of all records.
     */
    async count(objectName: string, filters: any, options?: any): Promise<number> {
        await this.connected;
        
        const pattern = `${objectName}:*`;
        const keys = await this.client.keys(pattern);
        
        // If no filters, return total count
        if (!filters || (Array.isArray(filters) && filters.length === 0)) {
            return keys.length;
        }
        
        // Convert filters if needed
        let actualFilters = filters;
        if (filters && !Array.isArray(filters) && filters.filters) {
            actualFilters = filters.filters;
        }
        
        // If filters are in the new FilterCondition format, convert them
        // Check for FilterCondition-specific properties (type property is a reliable indicator)
        if (filters && !Array.isArray(filters) && !Array.isArray(actualFilters) && filters.type) {
            actualFilters = this.convertFilterConditionToArray(filters);
        } else if (filters && !Array.isArray(filters) && !Array.isArray(actualFilters) && filters.field && 'operator' in filters && filters.value !== undefined) {
            // Also handle FilterCondition without explicit type (some simplified formats)
            actualFilters = this.convertFilterConditionToArray(filters);
        } else if (filters && !Array.isArray(filters) && !Array.isArray(actualFilters)) {
            // Handle simple object filters like { role: 'user' } or MongoDB-style filters
            actualFilters = this.convertFilterConditionToArray(filters);
        }
        
        // Count only records matching filters
        let count = 0;
        for (const key of keys) {
            const data = await this.client.get(key);
            if (data) {
                try {
                    const doc = JSON.parse(data);
                    if (this.matchesFilters(doc, actualFilters)) {
                        count++;
                    }
                } catch (error) {
                    // Error silently ignored
                }
            }
        }
        
        return count;
    }

    /**
     * Get distinct values for a specified field.
     * 
     * Retrieves all unique values for a given field across records matching optional filters.
     * 
     * @param objectName - The object type to query
     * @param field - The field name to get distinct values for
     * @param filters - Optional filter criteria (supports both legacy array and FilterCondition formats)
     * @param options - Additional query options
     * @returns Array of distinct values for the specified field
     * 
     * @example
     * // Get all unique roles
     * const roles = await driver.distinct('users', 'role');
     * 
     * @example
     * // Get unique departments for active users
     * const departments = await driver.distinct('users', 'department', {
     *   type: 'comparison',
     *   field: 'status',
     *   operator: '=',
     *   value: 'active'
     * });
     */
    async distinct(objectName: string, field: string, filters?: any, options?: any): Promise<any[]> {
        await this.connected;
        
        const pattern = `${objectName}:*`;
        const keys = await this.client.keys(pattern);
        
        // Convert filters if needed
        let actualFilters = filters;
        if (filters && !Array.isArray(filters) && filters.filters) {
            actualFilters = filters.filters;
        }
        
        // If filters are in the new FilterCondition format, convert them
        if (filters && !Array.isArray(filters) && !Array.isArray(actualFilters) && filters.type) {
            actualFilters = this.convertFilterConditionToArray(filters);
        } else if (filters && !Array.isArray(filters) && !Array.isArray(actualFilters) && filters.field && 'operator' in filters && filters.value !== undefined) {
            actualFilters = this.convertFilterConditionToArray(filters);
        } else if (filters && !Array.isArray(filters) && !Array.isArray(actualFilters)) {
            // Handle simple object filters like { role: 'user' } or MongoDB-style filters
            actualFilters = this.convertFilterConditionToArray(filters);
        }
        
        // Collect distinct values
        const values = new Set<any>();
        
        for (const key of keys) {
            const data = await this.client.get(key);
            if (data) {
                try {
                    const doc = JSON.parse(data);
                    
                    // Check if record matches filters
                    if (!actualFilters || this.matchesFilters(doc, actualFilters)) {
                        const value = doc[field];
                        if (value !== undefined && value !== null) {
                            // For complex values (objects/arrays), use JSON string as the key
                            if (typeof value === 'object') {
                                values.add(JSON.stringify(value));
                            } else {
                                values.add(value);
                            }
                        }
                    }
                } catch (error) {
                    // Error silently ignored
                }
            }
        }
        
        // Convert Set to Array and parse back JSON strings for objects
        return Array.from(values).map(v => {
            if (typeof v === 'string' && (v.startsWith('{') || v.startsWith('['))) {
                try {
                    return JSON.parse(v);
                } catch {
                    return v;
                }
            }
            return v;
        });
    }

    /**
     * Execute aggregation pipeline on records.
     * 
     * Performs aggregation operations such as grouping, counting, summing, etc.
     * This implementation provides basic aggregation support for Redis by loading
     * all matching records into memory and processing them.
     * 
     * @param objectName - The object type to aggregate
     * @param pipeline - Array of aggregation stages (e.g., $match, $group, $sort, $project)
     * @param options - Additional execution options
     * @returns Array of aggregation results
     * 
     * @example
     * // Count users by role
     * const results = await driver.aggregate('users', [
     *   { $group: { _id: '$role', count: { $sum: 1 } } }
     * ]);
     * 
     * @example
     * // Get average age by department
     * const results = await driver.aggregate('users', [
     *   { $group: { _id: '$department', avgAge: { $avg: '$age' } } },
     *   { $sort: { avgAge: -1 } }
     * ]);
     * 
     * Note: For production use with large datasets, consider using RedisJSON with
     * RediSearch module for native aggregation support.
     */
    async aggregate(objectName: string, pipeline: any[], options?: any): Promise<any[]> {
        await this.connected;
        
        const pattern = `${objectName}:*`;
        const keys = await this.client.keys(pattern);
        
        // Load all records
        const records: any[] = [];
        for (const key of keys) {
            const data = await this.client.get(key);
            if (data) {
                try {
                    const doc = JSON.parse(data);
                    records.push(doc);
                } catch (error) {
                    // Error silently ignored
                }
            }
        }
        
        // Process aggregation pipeline
        let results = records;
        
        for (const stage of pipeline) {
            const stageName = Object.keys(stage)[0];
            const stageParams = stage[stageName];
            
            switch (stageName) {
                case '$match':
                    // Filter records
                    results = results.filter(doc => this.matchesAggregationCondition(doc, stageParams));
                    break;
                    
                case '$group':
                    // Group and aggregate
                    results = this.performGrouping(results, stageParams);
                    break;
                    
                case '$sort':
                    // Sort results
                    results = this.performSort(results, stageParams);
                    break;
                    
                case '$project':
                    // Project fields
                    results = results.map(doc => this.performProjection(doc, stageParams));
                    break;
                    
                case '$limit':
                    // Limit results
                    results = results.slice(0, stageParams);
                    break;
                    
                case '$skip':
                    // Skip results
                    results = results.slice(stageParams);
                    break;
                    
                default:
                    break;
            }
        }
        
        return results;
    }

    /**
     * Close the Redis connection.
     */
    async disconnect(): Promise<void> {
        await this.client.quit();
    }

    /**
     * Execute a query (DriverInterface v4.0 method)
     * 
     * This method handles all read operations using the QueryAST format from @objectstack/spec.
     * It provides a standardized query interface that supports:
     * - Field selection (projection)
     * - Filter conditions (using FilterCondition format)
     * - Sorting
     * - Pagination (offset/limit)
     * - Grouping and aggregations (delegated to find)
     * 
     * The method converts the QueryAST format to the legacy query format and delegates
     * to the existing find() method for backward compatibility.
     * 
     * @param ast - The query Abstract Syntax Tree
     * @param options - Optional execution options
     * @returns Object containing query results and count
     * 
     * @example
     * // Simple query
     * const result = await driver.executeQuery({
     *   object: 'users',
     *   fields: ['name', 'email']
     * });
     * 
     * @example
     * // Query with filters and sorting
     * const result = await driver.executeQuery({
     *   object: 'users',
     *   filters: {
     *     type: 'comparison',
     *     field: 'age',
     *     operator: '>',
     *     value: 18
     *   },
     *   sort: [{ field: 'name', order: 'asc' }],
     *   top: 10
     * });
     */
    async executeQuery(ast: QueryAST, options?: any): Promise<{ value: any[]; count?: number }> {
        const objectName = ast.object || '';
        
        // Convert QueryAST to legacy query format
        // Note: Convert FilterCondition (MongoDB-like) to array format for redis driver
        const legacyQuery: any = {
            fields: ast.fields,
            filters: this.convertFilterConditionToArray(ast.where),
            sort: ast.orderBy?.map((s: SortNode) => [s.field, s.order]),
            limit: ast.limit,
            skip: ast.offset,
        };
        
        // Use existing find method
        const results = await this.find(objectName, legacyQuery, options);
        
        return {
            value: results,
            count: results.length
        };
    }

    /**
     * Execute a command (DriverInterface v4.0 method)
     * 
     * This method provides a unified interface for all mutation operations (create, update, delete)
     * using the Command pattern from @objectstack/spec.
     * 
     * Supports both single operations and bulk operations:
     * - Single: create, update, delete
     * - Bulk: bulkCreate, bulkUpdate, bulkDelete
     * 
     * Bulk operations use Redis PIPELINE for optimal performance, executing multiple
     * commands in a single round-trip to the server.
     * 
     * All operations return a standardized CommandResult with:
     * - success: boolean indicating operation success/failure
     * - data: the resulting data (for create/update)
     * - affected: number of records affected
     * - error: error message if operation failed
     * 
     * @param command - The command to execute (see Command interface)
     * @param options - Optional execution options
     * @returns Standardized command execution result
     * 
     * @example
     * // Create a single record
     * const result = await driver.executeCommand({
     *   type: 'create',
     *   object: 'users',
     *   data: { name: 'Alice', email: 'alice@example.com' }
     * });
     * 
     * @example
     * // Bulk create multiple records
     * const result = await driver.executeCommand({
     *   type: 'bulkCreate',
     *   object: 'users',
     *   records: [
     *     { name: 'Alice' },
     *     { name: 'Bob' },
     *     { name: 'Charlie' }
     *   ]
     * });
     * 
     * @example
     * // Update a record
     * const result = await driver.executeCommand({
     *   type: 'update',
     *   object: 'users',
     *   id: 'user-123',
     *   data: { email: 'newemail@example.com' }
     * });
     */
    async executeCommand(command: Command, options?: any): Promise<CommandResult> {
        try {
            await this.connected;
            const cmdOptions = { ...options, ...command.options };
            
            switch (command.type) {
                case 'create': {
                    if (!command.data) {
                        throw new ObjectQLError({ code: 'DRIVER_QUERY_FAILED', message: 'Create command requires data' });
                    }
                    const created = await this.create(command.object, command.data, cmdOptions);
                    return {
                        success: true,
                        data: created,
                        affected: 1
                    };
                }
                
                case 'update': {
                    if (!command.id || !command.data) {
                        throw new ObjectQLError({ code: 'DRIVER_QUERY_FAILED', message: 'Update command requires id and data' });
                    }
                    const updated = await this.update(command.object, command.id, command.data, cmdOptions);
                    return {
                        success: true,
                        data: updated,
                        affected: 1
                    };
                }
                
                case 'delete':
                    if (!command.id) {
                        throw new ObjectQLError({ code: 'DRIVER_QUERY_FAILED', message: 'Delete command requires id' });
                    }
                    await this.delete(command.object, command.id, cmdOptions);
                    return {
                        success: true,
                        affected: 1
                    };
                
                case 'bulkCreate': {
                    if (!command.records || !Array.isArray(command.records)) {
                        throw new ObjectQLError({ code: 'DRIVER_QUERY_FAILED', message: 'BulkCreate command requires records array' });
                    }
                    // Use Redis PIPELINE for batch operations
                    const pipeline = this.client.multi();
                    const bulkCreated: any[] = [];
                    const now = new Date().toISOString();
                    
                    for (const record of command.records) {
                        const id = record.id || this.generateId();
                        const doc = {
                            ...record,
                            id,
                            created_at: record.created_at || now,
                            updated_at: record.updated_at || now
                        };
                        bulkCreated.push(doc);
                        const key = this.generateRedisKey(command.object, id);
                        pipeline.set(key, JSON.stringify(doc));
                    }
                    
                    await pipeline.exec();
                    
                    return {
                        success: true,
                        data: bulkCreated,
                        affected: command.records.length
                    };
                }
                
                case 'bulkUpdate': {
                    if (!command.updates || !Array.isArray(command.updates)) {
                        throw new ObjectQLError({ code: 'DRIVER_QUERY_FAILED', message: 'BulkUpdate command requires updates array' });
                    }
                    
                    // First, batch GET all existing records using PIPELINE
                    const getPipeline = this.client.multi();
                    for (const update of command.updates) {
                        const key = this.generateRedisKey(command.object, update.id);
                        getPipeline.get(key);
                    }
                    const getResults = await getPipeline.exec();
                    
                    // Then, batch SET updated records using PIPELINE
                    const setPipeline = this.client.multi();
                    const updateResults: any[] = [];
                    const updateTime = new Date().toISOString();
                    
                    for (let i = 0; i < command.updates.length; i++) {
                        const update = command.updates[i];
                        // Redis v4 client returns array of results directly, not [error, result] tuples
                        const existingData = getResults?.[i];
                        
                        if (existingData && typeof existingData === 'string') {
                            const existingDoc = JSON.parse(existingData);
                            const doc = {
                                ...existingDoc,
                                ...update.data,
                                id: update.id,
                                created_at: existingDoc.created_at,
                                updated_at: updateTime
                            };
                            updateResults.push(doc);
                            const key = this.generateRedisKey(command.object, update.id);
                            setPipeline.set(key, JSON.stringify(doc));
                        }
                    }
                    
                    // Only execute pipeline if there are commands to execute
                    if (updateResults.length > 0) {
                        await setPipeline.exec();
                    }
                    
                    return {
                        success: true,
                        data: updateResults,
                        affected: updateResults.length
                    };
                }
                
                case 'bulkDelete': {
                    if (!command.ids || !Array.isArray(command.ids)) {
                        throw new ObjectQLError({ code: 'DRIVER_QUERY_FAILED', message: 'BulkDelete command requires ids array' });
                    }
                    // Use Redis PIPELINE for batch operations
                    const deletePipeline = this.client.multi();
                    
                    for (const id of command.ids) {
                        const key = this.generateRedisKey(command.object, id);
                        deletePipeline.del(key);
                    }
                    
                    const deleteResults = await deletePipeline.exec();
                    // Redis v4 client returns array of results directly, not [error, result] tuples
                    // Each DEL returns 1 if key existed and was deleted, 0 if key didn't exist
                    const deleted = deleteResults?.filter((r: any) => r > 0).length || 0;
                    
                    return {
                        success: true,
                        affected: deleted
                    };
                }
                
                default:
                    throw new ObjectQLError({ code: 'DRIVER_UNSUPPORTED_OPERATION', message: `Unknown command type: ${(command as any).type}` });
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Command execution failed',
                affected: 0
            };
        }
    }

    // ========== Helper Methods ==========

    /**
     * Convert FilterCondition (MongoDB-like format) to legacy filter array format
     * 
     * This method bridges the gap between the new FilterCondition format (MongoDB-style)
     * and the legacy array-based filter format used internally by the driver.
     * 
     * FilterCondition format (MongoDB-like):
     * - Field-level operators: { field: { $eq: value }, field2: { $gt: value } }
     * - Logical operators: { $and: [...], $or: [...], $not: {...} }
     * - Examples: { age: { $gt: 18 } }, { $and: [{ age: { $gt: 18 }}, { role: { $eq: 'user' }}] }
     * 
     * Legacy format:
     * - Array of conditions: [field, operator, value]
     * - String separators: 'and', 'or'
     * - Example: [['age', '>', 18], 'and', ['role', '=', 'user']]
     * 
     * @param condition - The FilterCondition to convert (object or legacy array)
     * @returns Legacy filter array format, or undefined if no filters
     * @private
     * 
     * @example
     * // Input: { field: { $gt: 18 } }
     * // Output: [['field', '>', 18]]
     * 
     * @example
     * // Input: { $and: [{ field1: { $eq: 'val1' }}, { field2: { $gt: 10 }}] }
     * // Output: [['field1', '=', 'val1'], 'and', ['field2', '>', 10]]
     */
    private convertFilterConditionToArray(condition?: any): any[] | undefined {
        if (!condition) return undefined;
        
        // If already an array, return as-is
        if (Array.isArray(condition)) {
            return condition;
        }
        
        // Handle new @objectstack/spec FilterCondition format (v0.3.3+)
        // Check if it's the new format with 'type' property
        if (condition.type) {
            if (condition.type === 'comparison') {
                // Handle comparison filter: { type: 'comparison', field, operator, value }
                return [[condition.field, condition.operator, condition.value]];
            } else if (condition.type === 'and' || condition.type === 'or') {
                // Handle logical filter: { type: 'and' | 'or', children: [...] }
                const result: any[] = [];
                const logicalOp = condition.type;
                
                if (condition.children && Array.isArray(condition.children)) {
                    for (let i = 0; i < condition.children.length; i++) {
                        const converted = this.convertFilterConditionToArray(condition.children[i]);
                        if (converted && converted.length > 0) {
                            if (result.length > 0) {
                                result.push(logicalOp);
                            }
                            result.push(...converted);
                        }
                    }
                }
                
                return result.length > 0 ? result : undefined;
            } else if (condition.type === 'not') {
                // Handle NOT filter: { type: 'not', child: {...} }
                if (condition.child) {
                    return this.convertFilterConditionToArray(condition.child);
                }
            }
        }
        
        // Fallback: Handle legacy MongoDB-style filters for backward compatibility
        const result: any[] = [];
        
        for (const [key, value] of Object.entries(condition)) {
            if (key === '$and' && Array.isArray(value)) {
                // Handle $and: [cond1, cond2, ...]
                for (let i = 0; i < value.length; i++) {
                    const converted = this.convertFilterConditionToArray(value[i]);
                    if (converted && converted.length > 0) {
                        if (result.length > 0) {
                            result.push('and');
                        }
                        result.push(...converted);
                    }
                }
            } else if (key === '$or' && Array.isArray(value)) {
                // Handle $or: [cond1, cond2, ...]
                for (let i = 0; i < value.length; i++) {
                    const converted = this.convertFilterConditionToArray(value[i]);
                    if (converted && converted.length > 0) {
                        if (result.length > 0) {
                            result.push('or');
                        }
                        result.push(...converted);
                    }
                }
            } else if (key === '$not' && typeof value === 'object') {
                // Handle $not: { condition }
                const converted = this.convertFilterConditionToArray(value);
                if (converted) {
                    result.push(...converted);
                }
            } else if (typeof value === 'object' && value !== null) {
                // Handle field-level conditions like { field: { $eq: value } }
                const field = key;
                for (const [operator, operandValue] of Object.entries(value)) {
                    let op: string;
                    switch (operator) {
                        case '$eq': op = '='; break;
                        case '$ne': op = '!='; break;
                        case '$gt': op = '>'; break;
                        case '$gte': op = '>='; break;
                        case '$lt': op = '<'; break;
                        case '$lte': op = '<='; break;
                        case '$in': op = 'in'; break;
                        case '$nin': op = 'nin'; break;
                        case '$regex': op = 'like'; break;
                        default: op = '=';
                    }
                    result.push([field, op, operandValue]);
                }
            } else {
                // Handle simple equality: { field: value }
                result.push([key, '=', value]);
            }
        }
        
        return result.length > 0 ? result : undefined;
    }

    /**
     * Generate Redis key for an object record
     * 
     * This method implements the key naming strategy for storing records in Redis.
     * The strategy uses a simple pattern: `objectName:id`
     * 
     * This ensures:
     * - Easy querying by pattern (e.g., `users:*` to find all user records)
     * - Clear namespace separation between different object types
     * - Human-readable keys for debugging
     * 
     * @param objectName - The object/collection name
     * @param id - The record ID
     * @returns Redis key in format "objectName:id"
     * @private
     * 
     * @example
     * generateRedisKey('users', '123') // Returns: 'users:123'
     * generateRedisKey('orders', 'order-456') // Returns: 'orders:order-456'
     */
    private generateRedisKey(objectName: string, id: string | number): string {
        return `${objectName}:${id}`;
    }

    /**
     * Normalizes query format to support both legacy UnifiedQuery and QueryAST formats.
     * This ensures backward compatibility while supporting the new @objectstack/spec interface.
     * 
     * Supports:
     * - Legacy format: { filters: [], sort: [], skip, limit }
     * - QueryAST format: { where: FilterCondition, orderBy: [], offset, limit, fields }
     * 
     * QueryAST format uses:
     * - 'offset' for skip/top
     * - 'limit' or 'top' for limit  
     * - 'orderBy' for sort
     * - 'where' for filters
     * - FilterCondition format for filters (MongoDB-like or structured format)
     */
    private normalizeQuery(query: any): any {
        if (!query) return {};
        
        const normalized: any = { ...query };
        
        // Normalize limit/top
        if (normalized.top !== undefined && normalized.limit === undefined) {
            normalized.limit = normalized.top;
        }
        
        // Normalize offset/skip
        if (normalized.offset !== undefined && normalized.skip === undefined) {
            normalized.skip = normalized.offset;
        }
        
        // Normalize filters - convert 'where' to 'filters'
        if (normalized.where && !normalized.filters) {
            normalized.filters = this.convertFilterConditionToArray(normalized.where);
        }
        
        // Normalize sort format - convert 'orderBy' to 'sort'
        if (normalized.orderBy && !normalized.sort) {
            if (Array.isArray(normalized.orderBy)) {
                // Convert from QueryAST format {field, order} to internal format [field, order]
                normalized.sort = normalized.orderBy.map((item: any) => [
                    item.field,
                    item.order || item.direction || item.dir || 'asc'
                ]);
            }
        } else if (normalized.sort && Array.isArray(normalized.sort)) {
            // Check if it's already in the array format [field, order]
            const firstSort = normalized.sort[0];
            if (firstSort && typeof firstSort === 'object' && !Array.isArray(firstSort)) {
                // Convert from QueryAST format {field, order} to internal format [field, order]
                normalized.sort = normalized.sort.map((item: any) => [
                    item.field,
                    item.order || item.direction || item.dir || 'asc'
                ]);
            }
        }
        
        return normalized;
    }

    /**
     * Apply filters to an array of records (in-memory filtering).
     * 
     * Supports ObjectQL filter format:
     * [
     *   ['field', 'operator', value],
     *   'or',
     *   ['field2', 'operator', value2]
     * ]
     */
    private applyFilters(records: any[], filters: any[]): any[] {
        if (!filters || filters.length === 0) {
            return records;
        }
        
        return records.filter(record => this.matchesFilters(record, filters));
    }

    /**
     * Check if a single record matches the filter conditions.
     */
    private matchesFilters(record: any, filters: any[]): boolean {
        if (!filters || filters.length === 0) {
            return true;
        }
        
        const conditions: boolean[] = [];
        const operators: string[] = [];
        
        for (const item of filters) {
            if (typeof item === 'string') {
                // Logical operator (and/or)
                operators.push(item.toLowerCase());
            } else if (Array.isArray(item)) {
                const [field, operator, value] = item;
                
                // Handle nested filter groups
                if (typeof field !== 'string') {
                    // Nested group - recursively evaluate
                    conditions.push(this.matchesFilters(record, item));
                } else {
                    // Single condition
                    const matches = this.evaluateCondition(record[field], operator, value);
                    conditions.push(matches);
                }
            }
        }
        
        // Combine conditions with operators
        if (conditions.length === 0) {
            return true;
        }
        
        let result = conditions[0];
        for (let i = 0; i < operators.length; i++) {
            const op = operators[i];
            const nextCondition = conditions[i + 1];
            
            if (op === 'or') {
                result = result || nextCondition;
            } else { // 'and' or default
                result = result && nextCondition;
            }
        }
        
        return result;
    }

    /**
     * Evaluate a single filter condition.
     */
    private evaluateCondition(fieldValue: any, operator: string, compareValue: any): boolean {
        switch (operator) {
            case '=':
                return fieldValue === compareValue;
            case '!=':
                return fieldValue !== compareValue;
            case '>':
                return fieldValue > compareValue;
            case '>=':
                return fieldValue >= compareValue;
            case '<':
                return fieldValue < compareValue;
            case '<=':
                return fieldValue <= compareValue;
            case 'in':
                return Array.isArray(compareValue) && compareValue.includes(fieldValue);
            case 'nin':
                return Array.isArray(compareValue) && !compareValue.includes(fieldValue);
            case 'contains':
                return String(fieldValue).toLowerCase().includes(String(compareValue).toLowerCase());
            default:
                return false;
        }
    }

    /**
     * Apply sorting to an array of records (in-memory sorting).
     */
    private applySort(records: any[], sort: any[]): any[] {
        const sorted = [...records];
        
        // Apply sorts in reverse order for correct precedence
        for (let i = sort.length - 1; i >= 0; i--) {
            const sortItem = sort[i];
            
            let field: string;
            let direction: string;
            
            if (Array.isArray(sortItem)) {
                [field, direction] = sortItem;
            } else if (typeof sortItem === 'object') {
                field = sortItem.field;
                direction = sortItem.order || sortItem.direction || sortItem.dir || 'asc';
            } else {
                continue;
            }
            
            sorted.sort((a, b) => {
                const aVal = a[field];
                const bVal = b[field];
                
                // Handle null/undefined
                if (aVal == null && bVal == null) return 0;
                if (aVal == null) return 1;
                if (bVal == null) return -1;
                
                // Compare values
                if (aVal < bVal) return direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        
        return sorted;
    }

    /**
     * Project specific fields from a document.
     */
    private projectFields(doc: any, fields: string[]): any {
        const result: any = {};
        for (const field of fields) {
            if (doc[field] !== undefined) {
                result[field] = doc[field];
            }
        }
        return result;
    }

    /**
     * Generate a unique ID (simple UUID v4 implementation).
     */
    private generateId(): string {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    /**
     * Check if a document matches aggregation condition (used in $match stage)
     */
    private matchesAggregationCondition(doc: any, condition: any): boolean {
        // Convert MongoDB-style query to filter array format
        const filters = this.convertFilterConditionToArray(condition);
        return this.matchesFilters(doc, filters || []);
    }

    /**
     * Perform grouping operation for aggregation
     */
    private performGrouping(records: any[], groupParams: any): any[] {
        const { _id, ...aggregations } = groupParams;
        const groups: Map<string, any[]> = new Map();
        
        // Group records by _id expression
        for (const record of records) {
            const groupKey = this.evaluateExpression(_id, record);
            const key = typeof groupKey === 'object' ? JSON.stringify(groupKey) : String(groupKey);
            
            if (!groups.has(key)) {
                groups.set(key, []);
            }
            groups.get(key)!.push(record);
        }
        
        // Perform aggregations on each group
        const results: any[] = [];
        for (const [key, groupRecords] of groups.entries()) {
            const result: any = {
                _id: key === 'null' ? null : (key.startsWith('{') || key.startsWith('[') ? JSON.parse(key) : key)
            };
            
            // Calculate aggregation functions
            for (const [field, aggExpr] of Object.entries(aggregations)) {
                result[field] = this.performAggregation(groupRecords, aggExpr);
            }
            
            results.push(result);
        }
        
        return results;
    }

    /**
     * Perform aggregation function on a group of records
     */
    private performAggregation(records: any[], aggExpr: any): any {
        const operator = Object.keys(aggExpr)[0];
        const operand = aggExpr[operator];
        
        switch (operator) {
            case '$sum':
                if (operand === 1) {
                    return records.length;
                }
                return records.reduce((sum, rec) => {
                    const value = this.evaluateExpression(operand, rec);
                    return sum + (typeof value === 'number' ? value : 0);
                }, 0);
                
            case '$avg': {
                const values = records.map(rec => this.evaluateExpression(operand, rec));
                const numbers = values.filter(v => typeof v === 'number');
                return numbers.length > 0 ? numbers.reduce((a, b) => a + b, 0) / numbers.length : null;
            }
                
            case '$min': {
                const minValues = records.map(rec => this.evaluateExpression(operand, rec));
                return Math.min(...minValues.filter(v => typeof v === 'number'));
            }
                
            case '$max': {
                const maxValues = records.map(rec => this.evaluateExpression(operand, rec));
                return Math.max(...maxValues.filter(v => typeof v === 'number'));
            }
                
            case '$first':
                return records.length > 0 ? this.evaluateExpression(operand, records[0]) : null;
                
            case '$last':
                return records.length > 0 ? this.evaluateExpression(operand, records[records.length - 1]) : null;
                
            case '$push':
                return records.map(rec => this.evaluateExpression(operand, rec));
                
            case '$addToSet': {
                const set = new Set(records.map(rec => {
                    const val = this.evaluateExpression(operand, rec);
                    return typeof val === 'object' ? JSON.stringify(val) : val;
                }));
                return Array.from(set).map(v => {
                    if (typeof v === 'string' && (v.startsWith('{') || v.startsWith('['))) {
                        try {
                            return JSON.parse(v);
                        } catch {
                            return v;
                        }
                    }
                    return v;
                });
            }
                
            default:
                return null;
        }
    }

    /**
     * Evaluate an expression (e.g., '$fieldName' or literal value)
     */
    private evaluateExpression(expr: any, record: any): any {
        if (typeof expr === 'string' && expr.startsWith('$')) {
            const fieldName = expr.substring(1);
            return record[fieldName];
        }
        return expr;
    }

    /**
     * Perform sorting for aggregation results
     */
    private performSort(records: any[], sortParams: any): any[] {
        const sortPairs = Object.entries(sortParams);
        
        return [...records].sort((a, b) => {
            for (const [field, order] of sortPairs) {
                const aVal = a[field];
                const bVal = b[field];
                
                if (aVal === bVal) continue;
                
                const direction = order === -1 || order === 'desc' ? -1 : 1;
                
                if (aVal == null) return 1 * direction;
                if (bVal == null) return -1 * direction;
                
                if (aVal < bVal) return -1 * direction;
                if (aVal > bVal) return 1 * direction;
            }
            return 0;
        });
    }

    /**
     * Perform projection for aggregation results
     */
    private performProjection(doc: any, projectParams: any): any {
        const result: any = {};
        
        for (const [field, value] of Object.entries(projectParams)) {
            if (value === 1 || value === true) {
                // Include field
                result[field] = doc[field];
            } else if (value === 0 || value === false) {
                // Exclude field - copy all except this one
                // (In MongoDB, you can't mix inclusion and exclusion except for _id)
                continue;
            } else if (typeof value === 'object') {
                // Computed field
                result[field] = this.evaluateExpression(value, doc);
            } else if (typeof value === 'string' && value.startsWith('$')) {
                // Field reference
                result[field] = this.evaluateExpression(value, doc);
            } else {
                // Literal value
                result[field] = value;
            }
        }
        
        return result;
    }
}
