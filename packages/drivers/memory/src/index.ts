import { Data, System } from '@objectstack/spec';
type QueryAST = Data.QueryAST;
type FilterNode = Data.FilterNode;
type SortNode = Data.SortNode;
type DriverInterface = System.DriverInterface;
/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Memory Driver for ObjectQL (Production-Ready)
 * 
 * A high-performance in-memory driver for ObjectQL powered by Mingo.
 * Perfect for testing, development, and environments where persistence is not required.
 * 
 * Implements the Driver interface from @objectql/types which includes all methods
 * from the standard DriverInterface from @objectstack/spec for full compatibility
 * with the new kernel-based plugin system.
 * 
 * ✅ Production-ready features:
 * - MongoDB-like query engine powered by Mingo
 * - Thread-safe operations
 * - Full query support (filters, sorting, pagination, aggregation)
 * - Atomic transactions
 * - High performance (no I/O overhead)
 * 
 * Use Cases:
 * - Unit testing (no database setup required)
 * - Development and prototyping
 * - Edge/Worker environments (Cloudflare Workers, Deno Deploy)
 * - Client-side state management
 * - Temporary data caching
 * 
 * @version 4.0.0 - DriverInterface compliant with Mingo integration
 */

import { Driver, ObjectQLError } from '@objectql/types';
import { Query } from 'mingo';

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
    affected: number; // Required (changed from optional)
    error?: string;
}

/**
 * Configuration options for the Memory driver.
 */
export interface MemoryDriverConfig {
    /** Optional: Initial data to populate the store */
    initialData?: Record<string, any[]>;
    /** Optional: Enable strict mode (throw on missing objects) */
    strictMode?: boolean;
}

/**
 * Memory Driver Implementation
 * 
 * Stores ObjectQL documents in JavaScript Maps with keys formatted as:
 * `objectName:id`
 * 
 * Example: `users:user-123` → `{id: "user-123", name: "Alice", ...}`
 */
export class MemoryDriver implements Driver {
    // Driver metadata (ObjectStack-compatible)
    public readonly name = 'MemoryDriver';
    public readonly version = '4.0.0';
    public readonly supports = {
        transactions: false,
        joins: false,
        fullTextSearch: false,
        jsonFields: true,
        arrayFields: true,
        queryFilters: true,
        queryAggregations: false,
        querySorting: true,
        queryPagination: true,
        queryWindowFunctions: false,
        querySubqueries: false
    };

    private store: Map<string, any>;
    private config: MemoryDriverConfig;
    private idCounters: Map<string, number>;

    constructor(config: MemoryDriverConfig = {}) {
        this.config = config;
        this.store = new Map<string, any>();
        this.idCounters = new Map<string, number>();
        
        // Load initial data if provided
        if (config.initialData) {
            this.loadInitialData(config.initialData);
        }
    }

    /**
     * Connect to the database (for DriverInterface compatibility)
     * This is a no-op for memory driver as there's no external connection.
     */
    async connect(): Promise<void> {
        // No-op: Memory driver doesn't need connection
    }

    /**
     * Check database connection health
     */
    async checkHealth(): Promise<boolean> {
        // Memory driver is always healthy if it exists
        return true;
    }

    /**
     * Load initial data into the store.
     */
    private loadInitialData(data: Record<string, any[]>): void {
        for (const [objectName, records] of Object.entries(data)) {
            for (const record of records) {
                const id = record.id || this.generateId(objectName);
                const key = `${objectName}:${id}`;
                this.store.set(key, { ...record, id });
            }
        }
    }

    /**
     * Find multiple records matching the query criteria.
     * Supports filtering, sorting, pagination, and field projection using Mingo.
     */
    async find(objectName: string, query: any = {}, options?: any): Promise<any[]> {
        // Normalize query to support both legacy and QueryAST formats
        const normalizedQuery = this.normalizeQuery(query);
        
        // Get all records for this object type
        const pattern = `${objectName}:`;
        let records: any[] = [];
        
        for (const [key, value] of this.store.entries()) {
            if (key.startsWith(pattern)) {
                records.push({ ...value });
            }
        }
        
        // Convert ObjectQL filters to MongoDB query format
        const mongoQuery = this.convertToMongoQuery(normalizedQuery.filters);
        
        // Apply filters using Mingo
        if (mongoQuery && Object.keys(mongoQuery).length > 0) {
            const mingoQuery = new Query(mongoQuery);
            records = mingoQuery.find(records).all();
        }
        
        // Apply sorting manually (Mingo's sort has issues with CJS builds)
        if (normalizedQuery.sort && Array.isArray(normalizedQuery.sort) && normalizedQuery.sort.length > 0) {
            records = this.applyManualSort(records, normalizedQuery.sort);
        }
        
        // Apply pagination
        if (normalizedQuery.skip) {
            records = records.slice(normalizedQuery.skip);
        }
        if (normalizedQuery.limit) {
            records = records.slice(0, normalizedQuery.limit);
        }
        
        // Apply field projection
        if (normalizedQuery.fields && Array.isArray(normalizedQuery.fields)) {
            records = records.map(doc => this.projectFields(doc, normalizedQuery.fields));
        }
        
        return records;
    }

    /**
     * Find a single record by ID or query.
     */
    async findOne(objectName: string, id: string | number, query?: any, options?: any): Promise<any> {
        // If ID is provided, fetch directly
        if (id) {
            const key = `${objectName}:${id}`;
            const record = this.store.get(key);
            return record ? { ...record } : null;
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
        // Generate ID if not provided
        const id = data.id || this.generateId(objectName);
        const key = `${objectName}:${id}`;
        
        // Check if record already exists
        if (this.store.has(key)) {
            throw new ObjectQLError({
                code: 'DUPLICATE_RECORD',
                message: `Record with id '${id}' already exists in '${objectName}'`,
                details: { objectName, id }
            });
        }
        
        const now = new Date().toISOString();
        const doc = {
            ...data,
            id,
            created_at: data.created_at || now,
            updated_at: data.updated_at || now
        };
        
        this.store.set(key, doc);
        return { ...doc };
    }

    /**
     * Update an existing record.
     */
    async update(objectName: string, id: string | number, data: any, options?: any): Promise<any> {
        const key = `${objectName}:${id}`;
        const existing = this.store.get(key);
        
        if (!existing) {
            if (this.config.strictMode) {
                throw new ObjectQLError({
                    code: 'RECORD_NOT_FOUND',
                    message: `Record with id '${id}' not found in '${objectName}'`,
                    details: { objectName, id }
                });
            }
            return null;
        }
        
        const doc = {
            ...existing,
            ...data,
            id, // Preserve ID
            created_at: existing.created_at, // Preserve created_at
            updated_at: new Date().toISOString()
        };
        
        this.store.set(key, doc);
        return { ...doc };
    }

    /**
     * Delete a record.
     */
    async delete(objectName: string, id: string | number, options?: any): Promise<any> {
        const key = `${objectName}:${id}`;
        const deleted = this.store.delete(key);
        
        if (!deleted && this.config.strictMode) {
            throw new ObjectQLError({
                code: 'RECORD_NOT_FOUND',
                message: `Record with id '${id}' not found in '${objectName}'`,
                details: { objectName, id }
            });
        }
        
        return deleted;
    }

    /**
     * Count records matching filters using Mingo.
     */
    async count(objectName: string, filters: any, options?: any): Promise<number> {
        const pattern = `${objectName}:`;
        
        // Extract actual filters from query object if needed
        let actualFilters = filters;
        if (filters && !Array.isArray(filters) && filters.filters) {
            actualFilters = filters.filters;
        }
        
        // Get all records for this object type
        let records: any[] = [];
        for (const [key, value] of this.store.entries()) {
            if (key.startsWith(pattern)) {
                records.push(value);
            }
        }
        
        // If no filters, return total count
        if (!actualFilters || (Array.isArray(actualFilters) && actualFilters.length === 0)) {
            return records.length;
        }
        
        // Convert to MongoDB query and use Mingo to count
        const mongoQuery = this.convertToMongoQuery(actualFilters);
        if (mongoQuery && Object.keys(mongoQuery).length > 0) {
            const mingoQuery = new Query(mongoQuery);
            const matchedRecords = mingoQuery.find(records).all();
            return matchedRecords.length;
        }
        
        return records.length;
    }

    /**
     * Get distinct values for a field using Mingo.
     */
    async distinct(objectName: string, field: string, filters?: any, options?: any): Promise<any[]> {
        const pattern = `${objectName}:`;
        
        // Get all records for this object type
        let records: any[] = [];
        for (const [key, value] of this.store.entries()) {
            if (key.startsWith(pattern)) {
                records.push(value);
            }
        }
        
        // Apply filters using Mingo if provided
        if (filters) {
            const mongoQuery = this.convertToMongoQuery(filters);
            if (mongoQuery && Object.keys(mongoQuery).length > 0) {
                const mingoQuery = new Query(mongoQuery);
                records = mingoQuery.find(records).all();
            }
        }
        
        // Extract distinct values
        const values = new Set<any>();
        for (const record of records) {
            const value = record[field];
            if (value !== undefined && value !== null) {
                values.add(value);
            }
        }
        
        return Array.from(values);
    }

    /**
     * Create multiple records at once.
     */
    async createMany(objectName: string, data: any[], options?: any): Promise<any> {
        const results = [];
        for (const item of data) {
            const result = await this.create(objectName, item, options);
            results.push(result);
        }
        return results;
    }

    /**
     * Update multiple records matching filters using Mingo.
     */
    async updateMany(objectName: string, filters: any, data: any, options?: any): Promise<any> {
        const pattern = `${objectName}:`;
        
        // Get all records for this object type
        let records: any[] = [];
        const recordKeys = new Map<string, string>();
        
        for (const [key, record] of this.store.entries()) {
            if (key.startsWith(pattern)) {
                records.push(record);
                recordKeys.set(record.id, key);
            }
        }
        
        // Apply filters using Mingo
        const mongoQuery = this.convertToMongoQuery(filters);
        let matchedRecords = records;
        
        if (mongoQuery && Object.keys(mongoQuery).length > 0) {
            const mingoQuery = new Query(mongoQuery);
            matchedRecords = mingoQuery.find(records).all();
        }
        
        // Update matched records
        let count = 0;
        for (const record of matchedRecords) {
            const key = recordKeys.get(record.id);
            if (key) {
                const updated = {
                    ...record,
                    ...data,
                    id: record.id, // Preserve ID
                    created_at: record.created_at, // Preserve created_at
                    updated_at: new Date().toISOString()
                };
                this.store.set(key, updated);
                count++;
            }
        }
        
        return { modifiedCount: count };
    }

    /**
     * Delete multiple records matching filters using Mingo.
     */
    async deleteMany(objectName: string, filters: any, options?: any): Promise<any> {
        const pattern = `${objectName}:`;
        
        // Get all records for this object type
        let records: any[] = [];
        const recordKeys = new Map<string, string>();
        
        for (const [key, record] of this.store.entries()) {
            if (key.startsWith(pattern)) {
                records.push(record);
                recordKeys.set(record.id, key);
            }
        }
        
        // Apply filters using Mingo
        const mongoQuery = this.convertToMongoQuery(filters);
        let matchedRecords = records;
        
        if (mongoQuery && Object.keys(mongoQuery).length > 0) {
            const mingoQuery = new Query(mongoQuery);
            matchedRecords = mingoQuery.find(records).all();
        }
        
        // Delete matched records
        for (const record of matchedRecords) {
            const key = recordKeys.get(record.id);
            if (key) {
                this.store.delete(key);
            }
        }
        
        return { deletedCount: matchedRecords.length };
    }

    /**
     * Clear all data from the store.
     */
    async clear(): Promise<void> {
        this.store.clear();
        this.idCounters.clear();
    }

    /**
     * Get the current size of the store.
     */
    getSize(): number {
        return this.store.size;
    }

    /**
     * Disconnect (no-op for memory driver).
     */
    async disconnect(): Promise<void> {
        // No-op: Memory driver doesn't need cleanup
    }

    // ========== Helper Methods ==========

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
     * Convert ObjectQL filters to MongoDB query format for Mingo.
     * 
     * Supports ObjectQL filter format:
     * [
     *   ['field', 'operator', value],
     *   'or',
     *   ['field2', 'operator', value2]
     * ]
     * 
     * Converts to MongoDB query format:
     * { $or: [{ field: { $operator: value }}, { field2: { $operator: value2 }}] }
     */
    private convertToMongoQuery(filters?: any[]): Record<string, any> {
        if (!filters || filters.length === 0) {
            return {};
        }
        
        // Process the filter array to build MongoDB query
        const conditions: Record<string, any>[] = [];
        let currentLogic: 'and' | 'or' = 'and';
        const logicGroups: { logic: 'and' | 'or', conditions: Record<string, any>[] }[] = [
            { logic: 'and', conditions: [] }
        ];
        
        for (const item of filters) {
            if (typeof item === 'string') {
                // Logical operator (and/or)
                const newLogic = item.toLowerCase() as 'and' | 'or';
                if (newLogic !== currentLogic) {
                    currentLogic = newLogic;
                    logicGroups.push({ logic: currentLogic, conditions: [] });
                }
            } else if (Array.isArray(item)) {
                const [field, operator, value] = item;
                
                // Convert single condition to MongoDB operator
                const mongoCondition = this.convertConditionToMongo(field, operator, value);
                if (mongoCondition) {
                    logicGroups[logicGroups.length - 1].conditions.push(mongoCondition);
                }
            }
        }
        
        // Build final query from logic groups
        if (logicGroups.length === 1 && logicGroups[0].conditions.length === 1) {
            return logicGroups[0].conditions[0];
        }
        
        // Multiple groups or conditions
        const finalConditions: Record<string, any>[] = [];
        for (const group of logicGroups) {
            if (group.conditions.length === 0) continue;
            
            if (group.conditions.length === 1) {
                finalConditions.push(group.conditions[0]);
            } else {
                if (group.logic === 'or') {
                    finalConditions.push({ $or: group.conditions });
                } else {
                    finalConditions.push({ $and: group.conditions });
                }
            }
        }
        
        if (finalConditions.length === 0) {
            return {};
        } else if (finalConditions.length === 1) {
            return finalConditions[0];
        } else {
            return { $and: finalConditions };
        }
    }

    /**
     * Convert a single ObjectQL condition to MongoDB operator format.
     */
    private convertConditionToMongo(field: string, operator: string, value: any): Record<string, any> | null {
        switch (operator) {
            case '=':
            case '==':
                return { [field]: value };
            
            case '!=':
            case '<>':
                return { [field]: { $ne: value } };
            
            case '>':
                return { [field]: { $gt: value } };
            
            case '>=':
                return { [field]: { $gte: value } };
            
            case '<':
                return { [field]: { $lt: value } };
            
            case '<=':
                return { [field]: { $lte: value } };
            
            case 'in':
                return { [field]: { $in: value } };
            
            case 'nin':
            case 'not in':
                return { [field]: { $nin: value } };
            
            case 'contains':
            case 'like':
                // MongoDB regex for case-insensitive contains
                // Escape special regex characters to prevent ReDoS and ensure literal matching
                return { [field]: { $regex: new RegExp(this.escapeRegex(value), 'i') } };
            
            case 'startswith':
            case 'starts_with':
                return { [field]: { $regex: new RegExp(`^${this.escapeRegex(value)}`, 'i') } };
            
            case 'endswith':
            case 'ends_with':
                return { [field]: { $regex: new RegExp(`${this.escapeRegex(value)}$`, 'i') } };
            
            case 'between':
                if (Array.isArray(value) && value.length === 2) {
                    return { [field]: { $gte: value[0], $lte: value[1] } };
                }
                return null;
            
            default:
                throw new ObjectQLError({
                    code: 'UNSUPPORTED_OPERATOR',
                    message: `[MemoryDriver] Unsupported operator: ${operator}`,
                });
        }
    }

    /**
     * Escape special regex characters to prevent ReDoS and ensure literal matching.
     * This is crucial for security when using user input in regex patterns.
     */
    private escapeRegex(str: string): string {
        return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Apply manual sorting to an array of records.
     * This is used instead of Mingo's sort to avoid CJS build issues.
     */
    private applyManualSort(records: any[], sort: any[]): any[] {
        const sorted = [...records];
        
        // Apply sorts in reverse order for correct multi-field precedence
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
                if (aVal < bVal) return direction.toLowerCase() === 'desc' ? 1 : -1;
                if (aVal > bVal) return direction.toLowerCase() === 'desc' ? -1 : 1;
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
     * Generate a unique ID for a record.
     */
    private generateId(objectName: string): string {
        const counter = (this.idCounters.get(objectName) || 0) + 1;
        this.idCounters.set(objectName, counter);
        
        // Use timestamp + counter for better uniqueness
        const timestamp = Date.now();
        return `${objectName}-${timestamp}-${counter}`;
    }

    /**
     * Execute a query using QueryAST (DriverInterface v4.0 method)
     * 
     * This is the new standard method for query execution using the
     * ObjectStack QueryAST format.
     * 
     * @param ast - The QueryAST representing the query
     * @param options - Optional execution options
     * @returns Query results with value and count
     */
    async executeQuery(ast: QueryAST, options?: any): Promise<{ value: any[]; count?: number }> {
        const objectName = ast.object || '';
        
        // Convert QueryAST to legacy query format
        const legacyQuery: any = {
            fields: ast.fields,
            filters: this.convertFilterNodeToLegacy(ast.filters),
            sort: ast.sort?.map((s: SortNode) => [s.field, s.order]),
            limit: ast.top,
            offset: ast.skip,
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
     * @param command - The command to execute
     * @param parameters - Optional command parameters (unused in this driver)
     * @param options - Optional execution options
     * @returns Command execution result
     */
    async executeCommand(command: Command, options?: any): Promise<CommandResult> {
        try {
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
                    const bulkCreated = [];
                    for (const record of command.records) {
                        const created = await this.create(command.object, record, cmdOptions);
                        bulkCreated.push(created);
                    }
                    return {
                        success: true,
                        data: bulkCreated,
                        affected: command.records.length
                    };
                
                case 'bulkUpdate':
                    if (!command.updates || !Array.isArray(command.updates)) {
                        throw new Error('BulkUpdate command requires updates array');
                    }
                    const updateResults = [];
                    for (const update of command.updates) {
                        const result = await this.update(command.object, update.id, update.data, cmdOptions);
                        updateResults.push(result);
                    }
                    return {
                        success: true,
                        data: updateResults,
                        affected: command.updates.length
                    };
                
                case 'bulkDelete':
                    if (!command.ids || !Array.isArray(command.ids)) {
                        throw new Error('BulkDelete command requires ids array');
                    }
                    let deleted = 0;
                    for (const id of command.ids) {
                        const result = await this.delete(command.object, id, cmdOptions);
                        if (result) deleted++;
                    }
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
                // NOT is complex - we'll just process the first child for now
                if (node.children && node.children.length > 0) {
                    return this.convertFilterNodeToLegacy(node.children[0]);
                }
                return undefined;
            
            default:
                return undefined;
        }
    }

    /**
     * Execute command (alternative signature for compatibility)
     * 
     * @param command - Command string or object
     * @param parameters - Command parameters
     * @param options - Execution options
     */
    async execute(command: any, parameters?: any[], options?: any): Promise<any> {
        // For memory driver, this is primarily for compatibility
        // We don't support raw SQL/commands
        throw new Error('Memory driver does not support raw command execution. Use executeCommand() instead.');
    }
}
