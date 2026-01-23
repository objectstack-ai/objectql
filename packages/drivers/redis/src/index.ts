/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Redis Driver for ObjectQL (Example Implementation)
 * 
 * This is a reference implementation demonstrating how to create a custom ObjectQL driver.
 * It adapts Redis (a key-value store) to work with ObjectQL's universal data protocol.
 * 
 * Implements both the legacy Driver interface from @objectql/types and
 * the standard DriverInterface from @objectstack/spec for full compatibility
 * with the new kernel-based plugin system.
 * 
 * ⚠️ WARNING: This is an educational example, not production-ready.
 * It uses full key scanning which is inefficient for large datasets.
 * 
 * For production use, consider:
 * - RedisJSON module for native JSON queries
 * - RedisSearch for indexed queries
 * - Secondary indexes using Redis Sets
 * 
 * Note: This example implements only the core required methods from the Driver interface.
 * Optional methods like introspectSchema(), aggregate(), transactions, etc. are not implemented.
 * 
 * @version 4.0.0 - DriverInterface compliant
 */

import { Driver } from '@objectql/types';
import { DriverInterface, QueryAST, FilterNode, SortNode } from '@objectstack/spec';
import { createClient, RedisClientType } from 'redis';

/**
 * Command interface for executeCommand method
 */
export interface Command {
    type: 'create' | 'update' | 'delete' | 'bulkCreate' | 'bulkUpdate' | 'bulkDelete';
    object: string;
    data?: any;
    id?: string | number;
    ids?: Array<string | number>;
    records?: any[];
    updates?: Array<{id: string | number, data: any}>;
    options?: any;
}

/**
 * Command result interface
 */
export interface CommandResult {
    success: boolean;
    data?: any;
    affected: number;
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
}

/**
 * Redis Driver Implementation
 * 
 * Stores ObjectQL documents as JSON strings in Redis with keys formatted as:
 * `objectName:id`
 * 
 * Example: `users:user-123` → `{"id":"user-123","name":"Alice",...}`
 */
export class RedisDriver implements Driver, DriverInterface {
    // Driver metadata (ObjectStack-compatible)
    public readonly name = 'RedisDriver';
    public readonly version = '4.0.0';
    public readonly supports = {
        transactions: false,
        joins: false,
        fullTextSearch: false,
        jsonFields: true,
        arrayFields: true
    };

    private client: RedisClientType;
    private config: RedisDriverConfig;
    private connected: Promise<void>;

    constructor(config: RedisDriverConfig) {
        this.config = config;
        this.client = createClient({ 
            url: config.url,
            ...config.options 
        }) as RedisClientType;
        
        // Handle connection errors
        this.client.on('error', (err: Error) => {
            console.error('[RedisDriver] Connection error:', err);
        });
        
        this.connected = this.connect();
    }

    async connect(): Promise<void> {
        await this.client.connect();
    }

    /**
     * Check database connection health
     */
    async checkHealth(): Promise<boolean> {
        try {
            await this.connected;
            await this.client.ping();
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Find multiple records matching the query criteria.
     * 
     * ⚠️ WARNING: This implementation scans ALL keys for the object type.
     * Performance degrades with large datasets.
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
                    console.warn(`[RedisDriver] Failed to parse document at key ${key}:`, error);
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
                console.warn(`[RedisDriver] Failed to parse document at key ${key}:`, error);
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
        await this.client.set(key, JSON.stringify(doc));
        
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
            throw new Error(`Record not found: ${objectName}:${id}`);
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
     * ⚠️ WARNING: Loads all records to count matches.
     */
    async count(objectName: string, filters: any, options?: any): Promise<number> {
        await this.connected;
        
        const pattern = `${objectName}:*`;
        const keys = await this.client.keys(pattern);
        
        // If no filters, return total count
        if (!filters || (Array.isArray(filters) && filters.length === 0)) {
            return keys.length;
        }
        
        // Extract actual filters from query object if needed
        let actualFilters = filters;
        if (filters && !Array.isArray(filters) && filters.filters) {
            actualFilters = filters.filters;
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
                    console.warn(`[RedisDriver] Failed to parse document at key ${key}:`, error);
                }
            }
        }
        
        return count;
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
     * This method handles all read operations using the QueryAST format.
     * Converts QueryAST to legacy query format and delegates to find().
     * 
     * @param ast - The query AST
     * @param options - Optional execution options
     * @returns Query results with count
     */
    async executeQuery(ast: QueryAST, options?: any): Promise<{ value: any[]; count?: number }> {
        const objectName = ast.object || '';
        
        // Convert QueryAST to legacy query format
        const legacyQuery: any = {
            fields: ast.fields,
            filters: this.convertFilterNodeToLegacy(ast.filters),
            sort: ast.sort?.map((s: SortNode) => [s.field, s.order]),
            limit: ast.top,
            skip: ast.skip,
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
     * This method handles all mutation operations (create, update, delete)
     * using a unified command interface.
     * 
     * Supports both single operations and bulk operations using Redis PIPELINE
     * for optimal performance.
     * 
     * @param command - The command to execute
     * @param parameters - Optional command parameters (unused in this driver)
     * @param options - Optional execution options
     * @returns Command execution result
     */
    async executeCommand(command: Command, options?: any): Promise<CommandResult> {
        try {
            await this.connected;
            const cmdOptions = { ...options, ...command.options };
            
            switch (command.type) {
                case 'create':
                    if (!command.data) {
                        throw new Error('Create command requires data');
                    }
                    const created = await this.create(command.object, command.data, cmdOptions);
                    return {
                        success: true,
                        data: created,
                        affected: 1
                    };
                
                case 'update':
                    if (!command.id || !command.data) {
                        throw new Error('Update command requires id and data');
                    }
                    const updated = await this.update(command.object, command.id, command.data, cmdOptions);
                    return {
                        success: true,
                        data: updated,
                        affected: 1
                    };
                
                case 'delete':
                    if (!command.id) {
                        throw new Error('Delete command requires id');
                    }
                    await this.delete(command.object, command.id, cmdOptions);
                    return {
                        success: true,
                        affected: 1
                    };
                
                case 'bulkCreate':
                    if (!command.records || !Array.isArray(command.records)) {
                        throw new Error('BulkCreate command requires records array');
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
                
                case 'bulkUpdate':
                    if (!command.updates || !Array.isArray(command.updates)) {
                        throw new Error('BulkUpdate command requires updates array');
                    }
                    // Use Redis PIPELINE for batch operations
                    const updatePipeline = this.client.multi();
                    const updateResults: any[] = [];
                    const updateTime = new Date().toISOString();
                    
                    for (const update of command.updates) {
                        const key = this.generateRedisKey(command.object, update.id);
                        const existing = await this.client.get(key);
                        
                        if (existing) {
                            const existingDoc = JSON.parse(existing);
                            const doc = {
                                ...existingDoc,
                                ...update.data,
                                id: update.id,
                                created_at: existingDoc.created_at,
                                updated_at: updateTime
                            };
                            updateResults.push(doc);
                            updatePipeline.set(key, JSON.stringify(doc));
                        }
                    }
                    
                    await updatePipeline.exec();
                    
                    return {
                        success: true,
                        data: updateResults,
                        affected: updateResults.length
                    };
                
                case 'bulkDelete':
                    if (!command.ids || !Array.isArray(command.ids)) {
                        throw new Error('BulkDelete command requires ids array');
                    }
                    // Use Redis PIPELINE for batch operations
                    const deletePipeline = this.client.multi();
                    
                    for (const id of command.ids) {
                        const key = this.generateRedisKey(command.object, id);
                        deletePipeline.del(key);
                    }
                    
                    const deleteResults = await deletePipeline.exec();
                    const deleted = deleteResults?.filter((r: any) => r && r[1] > 0).length || 0;
                    
                    return {
                        success: true,
                        affected: deleted
                    };
                
                default:
                    throw new Error(`Unknown command type: ${(command as any).type}`);
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
     * Convert FilterNode (QueryAST format) to legacy filter array format
     * This allows reuse of existing filter logic while supporting new QueryAST
     * 
     * @private
     */
    private convertFilterNodeToLegacy(node?: FilterNode): any {
        if (!node) return undefined;
        
        switch (node.type) {
            case 'comparison':
                // Convert comparison node to [field, operator, value] format
                const operator = node.operator || '=';
                return [[node.field, operator, node.value]];
            
            case 'and':
                // Convert AND node to array with 'and' separator
                if (!node.children || node.children.length === 0) return undefined;
                const andResults: any[] = [];
                for (const child of node.children) {
                    const converted = this.convertFilterNodeToLegacy(child);
                    if (converted) {
                        if (andResults.length > 0) {
                            andResults.push('and');
                        }
                        andResults.push(...(Array.isArray(converted) ? converted : [converted]));
                    }
                }
                return andResults.length > 0 ? andResults : undefined;
            
            case 'or':
                // Convert OR node to array with 'or' separator
                if (!node.children || node.children.length === 0) return undefined;
                const orResults: any[] = [];
                for (const child of node.children) {
                    const converted = this.convertFilterNodeToLegacy(child);
                    if (converted) {
                        if (orResults.length > 0) {
                            orResults.push('or');
                        }
                        orResults.push(...(Array.isArray(converted) ? converted : [converted]));
                    }
                }
                return orResults.length > 0 ? orResults : undefined;
            
            case 'not':
                // NOT is not directly supported in legacy format
                // We could implement it by negating the child operators
                console.warn('[RedisDriver] NOT operator in filters is not fully supported in legacy format');
                return undefined;
            
            default:
                return undefined;
        }
    }

    /**
     * Generate Redis key for an object record
     * 
     * Strategy: objectName:id
     * Example: users:user-123
     * 
     * @private
     */
    private generateRedisKey(objectName: string, id: string | number): string {
        return `${objectName}:${id}`;
    }

    /**
     * Normalizes query format to support both legacy UnifiedQuery and QueryAST formats.
     * This ensures backward compatibility while supporting the new @objectstack/spec interface.
     * 
     * QueryAST format uses 'top' for limit, while UnifiedQuery uses 'limit'.
     * QueryAST sort is array of {field, order}, while UnifiedQuery is array of [field, order].
     */
    private normalizeQuery(query: any): any {
        if (!query) return {};
        
        const normalized: any = { ...query };
        
        // Normalize limit/top
        if (normalized.top !== undefined && normalized.limit === undefined) {
            normalized.limit = normalized.top;
        }
        
        // Normalize sort format
        if (normalized.sort && Array.isArray(normalized.sort)) {
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
        
        let conditions: boolean[] = [];
        let operators: string[] = [];
        
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
                console.warn(`[RedisDriver] Unsupported operator: ${operator}`);
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
}
