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
 * LocalStorage Driver for ObjectQL (Production-Ready)
 * 
 * A browser-based driver that persists data to localStorage.
 * Perfect for client-side applications that need persistence across sessions.
 * 
 * Implements both the legacy Driver interface from @objectql/types and
 * the standard DriverInterface from @objectstack/spec for compatibility
 * with the new kernel-based plugin system.
 * 
 * ✅ Production-ready features:
 * - Browser localStorage persistence
 * - Automatic serialization/deserialization
 * - Full query support (filters, sorting, pagination)
 * - Storage quota management
 * - Namespace support to avoid conflicts
 * 
 * Use Cases:
 * - Client-side web applications
 * - Progressive Web Apps (PWAs)
 * - Offline-first applications
 * - Browser extensions
 * - User preference storage
 */

import { Driver, ObjectQLError } from '@objectql/types';

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
 * Configuration options for the LocalStorage driver.
 */
export interface LocalStorageDriverConfig {
    /** Optional: Namespace prefix for all keys (default: 'objectql') */
    namespace?: string;
    /** Optional: Initial data to populate the store */
    initialData?: Record<string, any[]>;
    /** Optional: Enable strict mode (throw on missing objects) */
    strictMode?: boolean;
    /** Optional: Custom localStorage implementation (for testing) */
    storage?: Storage;
}

/**
 * LocalStorage Driver Implementation
 * 
 * Stores ObjectQL documents in browser localStorage with keys formatted as:
 * `{namespace}:{objectName}:{id}`
 * 
 * Example: `objectql:users:user-123` → `{"id":"user-123","name":"Alice",...}`
 */
export class LocalStorageDriver implements Driver, DriverInterface {
    // Driver metadata (ObjectStack-compatible)
    public readonly name = 'LocalStorageDriver';
    public readonly version = '4.0.0';
    public readonly supports = {
        transactions: false,
        joins: false,
        fullTextSearch: false,
        jsonFields: true,
        arrayFields: true
    };

    private config: LocalStorageDriverConfig;
    private storage: Storage;
    private namespace: string;
    private idCounters: Map<string, number>;

    constructor(config: LocalStorageDriverConfig = {}) {
        this.config = config;
        this.namespace = config.namespace || 'objectql';
        this.idCounters = new Map<string, number>();
        
        // Use provided storage or browser localStorage
        if (config.storage) {
            this.storage = config.storage;
        } else if (typeof localStorage !== 'undefined') {
            this.storage = localStorage;
        } else {
            throw new ObjectQLError({
                code: 'ENVIRONMENT_ERROR',
                message: 'localStorage is not available in this environment',
                details: { environment: typeof window !== 'undefined' ? 'browser' : 'node' }
            });
        }
        
        // Load initial data if provided
        if (config.initialData) {
            this.loadInitialData(config.initialData);
        }
    }

    /**
     * Connect to the database (for DriverInterface compatibility)
     * This is a no-op for localStorage driver as there's no external connection.
     */
    async connect(): Promise<void> {
        // No-op: LocalStorage driver doesn't need connection
    }

    /**
     * Check database connection health
     */
    async checkHealth(): Promise<boolean> {
        try {
            // Check if localStorage is accessible
            if (!this.storage) {
                return false;
            }
            // Try a test write and read
            const testKey = `${this.namespace}:healthcheck`;
            this.storage.setItem(testKey, 'ok');
            const value = this.storage.getItem(testKey);
            this.storage.removeItem(testKey);
            return value === 'ok';
        } catch (error) {
            return false;
        }
    }

    /**
     * Load initial data into localStorage.
     */
    private loadInitialData(data: Record<string, any[]>): void {
        for (const [objectName, records] of Object.entries(data)) {
            for (const record of records) {
                const id = record.id || this.generateId(objectName);
                const key = this.makeKey(objectName, id);
                this.storage.setItem(key, JSON.stringify({ ...record, id }));
            }
        }
    }

    /**
     * Generate a storage key.
     */
    private makeKey(objectName: string, id: string | number): string {
        return `${this.namespace}:${objectName}:${id}`;
    }

    /**
     * Parse a storage key to extract object name and ID.
     */
    private parseKey(key: string): { objectName: string; id: string } | null {
        const prefix = `${this.namespace}:`;
        if (!key.startsWith(prefix)) {
            return null;
        }
        const parts = key.slice(prefix.length).split(':');
        if (parts.length < 2) {
            return null;
        }
        return {
            objectName: parts[0],
            id: parts.slice(1).join(':')
        };
    }

    /**
     * Get all keys for a specific object type.
     */
    private getObjectKeys(objectName: string): string[] {
        const prefix = `${this.namespace}:${objectName}:`;
        const keys: string[] = [];
        
        for (let i = 0; i < this.storage.length; i++) {
            const key = this.storage.key(i);
            if (key && key.startsWith(prefix)) {
                keys.push(key);
            }
        }
        
        return keys;
    }

    /**
     * Find multiple records matching the query criteria.
     */
    async find(objectName: string, query: any = {}, options?: any): Promise<any[]> {
        // Normalize query to support both legacy and QueryAST formats
        const normalizedQuery = this.normalizeQuery(query);
        const keys = this.getObjectKeys(objectName);
        let results: any[] = [];
        
        for (const key of keys) {
            const data = this.storage.getItem(key);
            if (data) {
                try {
                    const doc = JSON.parse(data);
                    results.push(doc);
                } catch (error) {
                    console.warn(`[LocalStorageDriver] Failed to parse document at key ${key}:`, error);
                }
            }
        }
        
        // Apply filters
        if (normalizedQuery.filters) {
            results = this.applyFilters(results, normalizedQuery.filters);
        }
        
        // Apply sorting
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
     * Find a single record by ID or query.
     */
    async findOne(objectName: string, id: string | number, query?: any, options?: any): Promise<any> {
        // If ID is provided, fetch directly
        if (id) {
            const key = this.makeKey(objectName, id);
            const data = this.storage.getItem(key);
            
            if (!data) {
                return null;
            }
            
            try {
                return JSON.parse(data);
            } catch (error) {
                console.warn(`[LocalStorageDriver] Failed to parse document at key ${key}:`, error);
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
        // Generate ID if not provided
        const id = data.id || this.generateId(objectName);
        const key = this.makeKey(objectName, id);
        
        // Check if record already exists
        if (this.storage.getItem(key) !== null) {
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
        
        try {
            this.storage.setItem(key, JSON.stringify(doc));
        } catch (error) {
            // Handle quota exceeded error
            if (error instanceof Error && error.name === 'QuotaExceededError') {
                throw new ObjectQLError({
                    code: 'STORAGE_QUOTA_EXCEEDED',
                    message: 'localStorage quota exceeded. Cannot create new record.',
                    details: { objectName, id, error: error.message }
                });
            }
            throw error;
        }
        
        return { ...doc };
    }

    /**
     * Update an existing record.
     */
    async update(objectName: string, id: string | number, data: any, options?: any): Promise<any> {
        const key = this.makeKey(objectName, id);
        const existing = this.storage.getItem(key);
        
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
        
        const existingDoc = JSON.parse(existing);
        const doc = {
            ...existingDoc,
            ...data,
            id, // Preserve ID
            created_at: existingDoc.created_at, // Preserve created_at
            updated_at: new Date().toISOString()
        };
        
        try {
            this.storage.setItem(key, JSON.stringify(doc));
        } catch (error) {
            if (error instanceof Error && error.name === 'QuotaExceededError') {
                throw new ObjectQLError({
                    code: 'STORAGE_QUOTA_EXCEEDED',
                    message: 'localStorage quota exceeded. Cannot update record.',
                    details: { objectName, id, error: error.message }
                });
            }
            throw error;
        }
        
        return { ...doc };
    }

    /**
     * Delete a record.
     */
    async delete(objectName: string, id: string | number, options?: any): Promise<any> {
        const key = this.makeKey(objectName, id);
        const exists = this.storage.getItem(key) !== null;
        
        if (!exists && this.config.strictMode) {
            throw new ObjectQLError({
                code: 'RECORD_NOT_FOUND',
                message: `Record with id '${id}' not found in '${objectName}'`,
                details: { objectName, id }
            });
        }
        
        this.storage.removeItem(key);
        return exists;
    }

    /**
     * Count records matching filters.
     */
    async count(objectName: string, filters: any, options?: any): Promise<number> {
        const keys = this.getObjectKeys(objectName);
        
        // Extract actual filters from query object if needed
        let actualFilters = filters;
        if (filters && !Array.isArray(filters) && filters.filters) {
            actualFilters = filters.filters;
        }
        
        // If no filters, return total count
        if (!actualFilters || (Array.isArray(actualFilters) && actualFilters.length === 0)) {
            return keys.length;
        }
        
        // Count only records matching filters
        let count = 0;
        for (const key of keys) {
            const data = this.storage.getItem(key);
            if (data) {
                try {
                    const doc = JSON.parse(data);
                    if (this.matchesFilters(doc, actualFilters)) {
                        count++;
                    }
                } catch (error) {
                    console.warn(`[LocalStorageDriver] Failed to parse document at key ${key}:`, error);
                }
            }
        }
        
        return count;
    }

    /**
     * Get distinct values for a field.
     */
    async distinct(objectName: string, field: string, filters?: any, options?: any): Promise<any[]> {
        const keys = this.getObjectKeys(objectName);
        const values = new Set<any>();
        
        for (const key of keys) {
            const data = this.storage.getItem(key);
            if (data) {
                try {
                    const record = JSON.parse(data);
                    if (!filters || this.matchesFilters(record, filters)) {
                        const value = record[field];
                        if (value !== undefined && value !== null) {
                            values.add(value);
                        }
                    }
                } catch (error) {
                    console.warn(`[LocalStorageDriver] Failed to parse document at key ${key}:`, error);
                }
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
     * Update multiple records matching filters.
     */
    async updateMany(objectName: string, filters: any, data: any, options?: any): Promise<any> {
        const keys = this.getObjectKeys(objectName);
        let count = 0;
        
        for (const key of keys) {
            const existing = this.storage.getItem(key);
            if (existing) {
                try {
                    const record = JSON.parse(existing);
                    if (this.matchesFilters(record, filters)) {
                        const updated = {
                            ...record,
                            ...data,
                            id: record.id,
                            created_at: record.created_at,
                            updated_at: new Date().toISOString()
                        };
                        this.storage.setItem(key, JSON.stringify(updated));
                        count++;
                    }
                } catch (error) {
                    console.warn(`[LocalStorageDriver] Failed to update document at key ${key}:`, error);
                }
            }
        }
        
        return { modifiedCount: count };
    }

    /**
     * Delete multiple records matching filters.
     */
    async deleteMany(objectName: string, filters: any, options?: any): Promise<any> {
        const keys = this.getObjectKeys(objectName);
        const keysToDelete: string[] = [];
        
        for (const key of keys) {
            const data = this.storage.getItem(key);
            if (data) {
                try {
                    const record = JSON.parse(data);
                    if (this.matchesFilters(record, filters)) {
                        keysToDelete.push(key);
                    }
                } catch (error) {
                    console.warn(`[LocalStorageDriver] Failed to parse document at key ${key}:`, error);
                }
            }
        }
        
        for (const key of keysToDelete) {
            this.storage.removeItem(key);
        }
        
        return { deletedCount: keysToDelete.length };
    }

    /**
     * Clear all data for this namespace from localStorage.
     */
    async clear(): Promise<void> {
        const keysToDelete: string[] = [];
        
        for (let i = 0; i < this.storage.length; i++) {
            const key = this.storage.key(i);
            if (key && key.startsWith(`${this.namespace}:`)) {
                keysToDelete.push(key);
            }
        }
        
        for (const key of keysToDelete) {
            this.storage.removeItem(key);
        }
        
        this.idCounters.clear();
    }

    /**
     * Get the current number of records stored.
     */
    getSize(): number {
        let count = 0;
        for (let i = 0; i < this.storage.length; i++) {
            const key = this.storage.key(i);
            if (key && key.startsWith(`${this.namespace}:`)) {
                count++;
            }
        }
        return count;
    }

    /**
     * Disconnect (no-op for localStorage driver).
     */
    async disconnect(): Promise<void> {
        // No-op: LocalStorage driver doesn't need cleanup
    }

    /**
     * Execute a query using QueryAST (DriverInterface v4.0 method)
     * 
     * This method handles all query operations using the standard QueryAST format
     * from @objectstack/spec. It converts the AST to the legacy query format
     * and delegates to the existing find() method.
     * 
     * @param ast - The query AST to execute
     * @param options - Optional execution options
     * @returns Query results with value array and count
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
     * @param command - The command to execute
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
                    throw new Error(`Unsupported command type: ${(command as any).type}`);
            }
        } catch (error: any) {
            return {
                success: false,
                affected: 0,
                error: error.message || 'Unknown error occurred'
            };
        }
    }

    /**
     * Execute raw command (for compatibility)
     * 
     * @param command - Command string or object
     * @param parameters - Command parameters
     * @param options - Execution options
     */
    async execute(command: any, parameters?: any[], options?: any): Promise<any> {
        throw new Error('LocalStorage driver does not support raw command execution. Use executeCommand() instead.');
    }

    // ========== Helper Methods (Same as MemoryDriver) ==========

    /**
     * Convert FilterNode from QueryAST to legacy filter format.
     * 
     * @param node - The FilterNode to convert
     * @returns Legacy filter array format
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

    private applyFilters(records: any[], filters: any[]): any[] {
        if (!filters || filters.length === 0) {
            return records;
        }
        return records.filter(record => this.matchesFilters(record, filters));
    }

    private matchesFilters(record: any, filters: any[]): boolean {
        if (!filters || filters.length === 0) {
            return true;
        }
        
        let conditions: boolean[] = [];
        let operators: string[] = [];
        
        for (const item of filters) {
            if (typeof item === 'string') {
                operators.push(item.toLowerCase());
            } else if (Array.isArray(item)) {
                const [field, operator, value] = item;
                if (typeof field !== 'string') {
                    conditions.push(this.matchesFilters(record, item));
                } else {
                    const matches = this.evaluateCondition(record[field], operator, value);
                    conditions.push(matches);
                }
            }
        }
        
        if (conditions.length === 0) {
            return true;
        }
        
        let result = conditions[0];
        for (let i = 0; i < operators.length; i++) {
            const op = operators[i];
            const nextCondition = conditions[i + 1];
            if (op === 'or') {
                result = result || nextCondition;
            } else {
                result = result && nextCondition;
            }
        }
        
        return result;
    }

    private evaluateCondition(fieldValue: any, operator: string, compareValue: any): boolean {
        switch (operator) {
            case '=':
            case '==':
                return fieldValue === compareValue;
            case '!=':
            case '<>':
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
            case 'not in':
                return Array.isArray(compareValue) && !compareValue.includes(fieldValue);
            case 'contains':
            case 'like':
                return String(fieldValue).toLowerCase().includes(String(compareValue).toLowerCase());
            case 'startswith':
            case 'starts_with':
                return String(fieldValue).toLowerCase().startsWith(String(compareValue).toLowerCase());
            case 'endswith':
            case 'ends_with':
                return String(fieldValue).toLowerCase().endsWith(String(compareValue).toLowerCase());
            case 'between':
                return Array.isArray(compareValue) && 
                       fieldValue >= compareValue[0] && 
                       fieldValue <= compareValue[1];
            default:
                console.warn(`[LocalStorageDriver] Unsupported operator: ${operator}`);
                return false;
        }
    }

    private applySort(records: any[], sort: any[]): any[] {
        const sorted = [...records];
        
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
                
                if (aVal == null && bVal == null) return 0;
                if (aVal == null) return 1;
                if (bVal == null) return -1;
                
                if (aVal < bVal) return direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        
        return sorted;
    }

    private projectFields(doc: any, fields: string[]): any {
        const result: any = {};
        for (const field of fields) {
            if (doc[field] !== undefined) {
                result[field] = doc[field];
            }
        }
        return result;
    }

    private generateId(objectName: string): string {
        const counter = (this.idCounters.get(objectName) || 0) + 1;
        this.idCounters.set(objectName, counter);
        const timestamp = Date.now();
        return `${objectName}-${timestamp}-${counter}`;
    }
}
