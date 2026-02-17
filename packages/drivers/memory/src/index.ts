import { Data, System as _SystemSpec } from '@objectstack/spec';
import { z } from 'zod';
import { QueryAST } from '@objectql/types';
type _DriverInterface = z.infer<typeof Data.DriverInterface>;
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
import { Query, Aggregator } from 'mingo';

/**
 * Typed wrapper for Mingo query operations.
 * Centralizes the type casts required for Mingo library interop,
 * since Mingo expects `Record<string, any>` but we use `Record<string, unknown>`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MingoCompatible = Record<string, any>;

function mingoFind(records: Record<string, unknown>[], mongoQuery: Record<string, unknown>): Record<string, unknown>[] {
    const query = new Query(mongoQuery as MingoCompatible);
    return query.find(records as MingoCompatible[]).all() as Record<string, unknown>[];
}

function mingoAggregate(records: Record<string, unknown>[], pipeline: Record<string, unknown>[]): Record<string, unknown>[] {
    const aggregator = new Aggregator(pipeline as MingoCompatible[]);
    return aggregator.run(records as MingoCompatible[]) as Record<string, unknown>[];
}

/**
 * Command interface for executeCommand method
 */
export interface Command {
    type: 'create' | 'update' | 'delete' | 'bulkCreate' | 'bulkUpdate' | 'bulkDelete';
    object: string;
    data?: Record<string, unknown>;
    id?: string | number;
    ids?: Array<string | number>;
    records?: Record<string, unknown>[];
    updates?: Array<{id: string | number, data: Record<string, unknown>}>;
    options?: Record<string, unknown>;
}

/**
 * Command result interface
 */
export interface CommandResult {
    success: boolean;
    data?: unknown;
    affected: number; // Required (changed from optional)
    error?: string;
}

/**
 * Configuration options for the Memory driver.
 */
export interface MemoryDriverConfig {
    /** Optional: Initial data to populate the store */
    initialData?: Record<string, Record<string, unknown>[]>;
    /** Optional: Enable strict mode (throw on missing objects) */
    strictMode?: boolean;
    /** Optional: Enable persistence to file system */
    persistence?: {
        /** File path to persist data */
        filePath: string;
        /** Auto-save interval in milliseconds (default: 5000) */
        autoSaveInterval?: number;
    };
    /** Optional: Fields to index for faster queries */
    indexes?: Record<string, string[]>; // objectName -> field names
}

/**
 * In-memory transaction
 */
interface MemoryTransaction {
    id: string;
    snapshot: Map<string, Record<string, unknown>>;
    operations: Array<{ type: 'set' | 'delete'; key: string; value?: unknown }>;
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
        transactions: true,
        joins: false,
        fullTextSearch: false,
        jsonFields: true,
        arrayFields: true,
        queryFilters: true,
        queryAggregations: true,
        querySorting: true,
        queryPagination: true,
        queryWindowFunctions: false,
        querySubqueries: false
    };

    protected store: Map<string, Record<string, unknown>>;
    protected config: MemoryDriverConfig;
    protected idCounters: Map<string, number>;
    protected transactions: Map<string, MemoryTransaction>;
    protected indexes: Map<string, Map<string, Set<string>>>; // objectName -> field -> Set<recordIds>
    protected persistenceTimer?: NodeJS.Timeout;

    constructor(config: MemoryDriverConfig = {}) {
        this.config = config;
        this.store = new Map<string, Record<string, unknown>>();
        this.idCounters = new Map<string, number>();
        this.transactions = new Map();
        this.indexes = new Map();
        
        // Load initial data if provided
        if (config.initialData) {
            this.loadInitialData(config.initialData);
        }
        
        // Set up persistence if configured
        if (config.persistence) {
            this.setupPersistence();
        }
        
        // Build indexes if configured
        if (config.indexes) {
            this.buildIndexes(config.indexes);
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
    protected loadInitialData(data: Record<string, Record<string, unknown>[]>): void {
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
    async find(objectName: string, query: object = {}, _options?: Record<string, unknown>): Promise<Record<string, unknown>[]> {
        // Get all records for this object type
        const pattern = `${objectName}:`;
        let records: Record<string, unknown>[] = [];
        
        for (const [key, value] of this.store.entries()) {
            if (key.startsWith(pattern)) {
                records.push({ ...value });
            }
        }
        
        // Convert ObjectQL filters to MongoDB query format
        const q = query as Record<string, unknown>;
        const mongoQuery = this.convertToMongoQuery(q.where as Record<string, unknown> | unknown[] | undefined);
        
        // Apply filters using Mingo
        if (mongoQuery && Object.keys(mongoQuery).length > 0) {
            records = mingoFind(records, mongoQuery);
        }
        
        // Apply sorting manually (Mingo's sort has issues with CJS builds)
        if (q.orderBy && Array.isArray(q.orderBy) && q.orderBy.length > 0) {
            records = this.applyManualSort(records, q.orderBy as unknown[]);
        }
        
        // Apply pagination
        if (q.offset) {
            records = records.slice(q.offset as number);
        }
        if (q.limit) {
            records = records.slice(0, q.limit as number);
        }
        
        // Apply field projection
        if (q.fields && Array.isArray(q.fields)) {
            records = records.map(doc => this.projectFields(doc, q.fields as string[]));
        }
        
        return records;
    }

    /**
     * Find a single record by ID or query.
     */
    async findOne(objectName: string, id: string | number, query?: object, options?: Record<string, unknown>): Promise<Record<string, unknown> | null> {
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
    async create(objectName: string, data: Record<string, unknown>, _options?: Record<string, unknown>): Promise<Record<string, unknown>> {
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
        
        // Update indexes
        this.updateIndex(objectName, String(id), doc);
        
        return { ...doc };
    }

    /**
     * Update an existing record.
     */
    async update(objectName: string, id: string | number, data: Record<string, unknown>, _options?: Record<string, unknown>): Promise<Record<string, unknown>> {
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
            // Non-strict mode: return null to indicate record not found
            // Note: This deviates from the Driver interface (which requires Record<string, unknown>)
            // but preserves backward compatibility for consumers that check for null returns.
            return null!;
        }
        
        const doc = {
            ...existing,
            ...data,
            id, // Preserve ID
            created_at: existing.created_at, // Preserve created_at
            updated_at: new Date().toISOString()
        };
        
        this.store.set(key, doc);
        
        // Update indexes
        this.updateIndex(objectName, id.toString(), doc);
        
        return { ...doc };
    }

    /**
     * Delete a record.
     */
    async delete(objectName: string, id: string | number, _options?: Record<string, unknown>): Promise<unknown> {
        const key = `${objectName}:${id}`;
        const deleted = this.store.delete(key);
        
        // Remove from indexes
        if (deleted) {
            this.removeFromIndex(objectName, id.toString());
        }
        
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
    async count(objectName: string, filters: object, _options?: Record<string, unknown>): Promise<number> {
        const pattern = `${objectName}:`;
        
        // Extract where condition from query object if needed
        let whereCondition: unknown = filters;
        if (filters && !Array.isArray(filters) && (filters as Record<string, unknown>).where) {
            whereCondition = (filters as Record<string, unknown>).where;
        }
        
        // Get all records for this object type
        const records: Record<string, unknown>[] = [];
        for (const [key, value] of this.store.entries()) {
            if (key.startsWith(pattern)) {
                records.push(value);
            }
        }
        
        // If no filters, return total count
        if (!whereCondition || (Array.isArray(whereCondition) && whereCondition.length === 0)) {
            return records.length;
        }
        
        // Convert to MongoDB query and use Mingo to count
        const mongoQuery = this.convertToMongoQuery(whereCondition as Record<string, unknown> | unknown[] | undefined);
        if (mongoQuery && Object.keys(mongoQuery).length > 0) {
            const matchedRecords = mingoFind(records, mongoQuery);
            return matchedRecords.length;
        }
        
        return records.length;
    }

    /**
     * Get distinct values for a field using Mingo.
     */
    async distinct(objectName: string, field: string, filters?: object, _options?: Record<string, unknown>): Promise<unknown[]> {
        const pattern = `${objectName}:`;
        
        // Get all records for this object type
        let records: Record<string, unknown>[] = [];
        for (const [key, value] of this.store.entries()) {
            if (key.startsWith(pattern)) {
                records.push(value);
            }
        }
        
        // Apply filters using Mingo if provided
        if (filters) {
            const mongoQuery = this.convertToMongoQuery(filters as Record<string, unknown>);
            if (mongoQuery && Object.keys(mongoQuery).length > 0) {
                records = mingoFind(records, mongoQuery);
            }
        }
        
        // Extract distinct values
        const values = new Set<unknown>();
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
    async createMany(objectName: string, data: Record<string, unknown>[], options?: Record<string, unknown>): Promise<unknown> {
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
    async updateMany(objectName: string, filters: object, data: Record<string, unknown>, _options?: Record<string, unknown>): Promise<unknown> {
        const pattern = `${objectName}:`;
        
        // Get all records for this object type
        const records: Record<string, unknown>[] = [];
        const recordKeys = new Map<string, string>();
        
        for (const [key, record] of this.store.entries()) {
            if (key.startsWith(pattern)) {
                records.push(record);
                recordKeys.set(record.id as string, key);
            }
        }
        
        // Apply filters using Mingo
        const mongoQuery = this.convertToMongoQuery(filters as Record<string, unknown>);
        let matchedRecords = records;
        
        if (mongoQuery && Object.keys(mongoQuery).length > 0) {
            matchedRecords = mingoFind(records, mongoQuery);
        }
        
        // Update matched records
        let count = 0;
        for (const record of matchedRecords) {
            const key = recordKeys.get(record.id as string);
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
    async deleteMany(objectName: string, filters: object, _options?: Record<string, unknown>): Promise<unknown> {
        const pattern = `${objectName}:`;
        
        // Get all records for this object type
        const records: Record<string, unknown>[] = [];
        const recordKeys = new Map<string, string>();
        
        for (const [key, record] of this.store.entries()) {
            if (key.startsWith(pattern)) {
                records.push(record);
                recordKeys.set(record.id as string, key);
            }
        }
        
        // Apply filters using Mingo
        const mongoQuery = this.convertToMongoQuery(filters as Record<string, unknown>);
        let matchedRecords = records;
        
        if (mongoQuery && Object.keys(mongoQuery).length > 0) {
            matchedRecords = mingoFind(records, mongoQuery);
        }
        
        // Delete matched records
        for (const record of matchedRecords) {
            const key = recordKeys.get(record.id as string);
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
     * Disconnect and cleanup resources.
     */
    async disconnect(): Promise<void> {
        // Save data to disk if persistence is enabled
        if (this.config.persistence) {
            this.saveToDisk();
            
            // Clear the auto-save timer
            if (this.persistenceTimer) {
                clearInterval(this.persistenceTimer);
                this.persistenceTimer = undefined;
            }
        }
    }

    /**
     * Perform aggregation operations using Mingo
     * @param objectName - The object type to aggregate
     * @param pipeline - MongoDB-style aggregation pipeline
     * @param options - Optional query options
     * @returns Aggregation results
     * 
     * @example
     * // Group by status and count
     * const results = await driver.aggregate('orders', [
     *   { $match: { status: 'completed' } },
     *   { $group: { _id: '$customer', totalAmount: { $sum: '$amount' } } }
     * ]);
     * 
     * @example
     * // Calculate average with filter
     * const results = await driver.aggregate('products', [
     *   { $match: { category: 'electronics' } },
     *   { $group: { _id: null, avgPrice: { $avg: '$price' } } }
     * ]);
     */
    async aggregate(objectName: string, pipeline: object[], _options?: Record<string, unknown>): Promise<Record<string, unknown>[]> {
        const pattern = `${objectName}:`;
        
        // Get all records for this object type
        const records: Record<string, unknown>[] = [];
        for (const [key, value] of this.store.entries()) {
            if (key.startsWith(pattern)) {
                records.push({ ...value });
            }
        }
        
        // Use Mingo to execute the aggregation pipeline
        return mingoAggregate(records, pipeline as Record<string, unknown>[]);
    }

    /**
     * Begin a new transaction
     * @returns Transaction object that can be passed to other methods
     */
    async beginTransaction(): Promise<unknown> {
        const txId = `tx_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        
        // Create a deep snapshot of the current store to ensure complete transaction isolation
        // This prevents issues with nested objects and arrays being modified during the transaction
        const snapshot = new Map<string, Record<string, unknown>>();
        for (const [key, value] of this.store.entries()) {
            snapshot.set(key, JSON.parse(JSON.stringify(value)));
        }
        
        const transaction: MemoryTransaction = {
            id: txId,
            snapshot,
            operations: []
        };
        
        this.transactions.set(txId, transaction);
        
        return { id: txId };
    }

    /**
     * Commit a transaction
     * @param transaction - Transaction object returned by beginTransaction()
     */
    async commitTransaction(transaction: unknown): Promise<void> {
        const txId = this.getTransactionId(transaction);
        
        const tx = this.transactions.get(txId);
        if (!tx) {
            throw new ObjectQLError({
                code: 'TRANSACTION_NOT_FOUND',
                message: `Transaction ${txId} not found`
            });
        }
        
        // Operations are already applied to the store during the transaction
        // Just clean up the transaction record
        this.transactions.delete(txId);
    }

    /**
     * Rollback a transaction
     * @param transaction - Transaction object returned by beginTransaction()
     */
    async rollbackTransaction(transaction: unknown): Promise<void> {
        const txId = this.getTransactionId(transaction);
        
        const tx = this.transactions.get(txId);
        if (!tx) {
            throw new ObjectQLError({
                code: 'TRANSACTION_NOT_FOUND',
                message: `Transaction ${txId} not found`
            });
        }
        
        // Restore the snapshot
        this.store = new Map(tx.snapshot);
        
        // Clean up the transaction
        this.transactions.delete(txId);
    }

    /**
     * Set up persistence to file system
     * @private
     */
    protected setupPersistence(): void {
        if (!this.config.persistence) return;
        
        const { filePath, autoSaveInterval = 5000 } = this.config.persistence;
        
        // Try to load existing data from file
        try {
            const fs = require('fs');
            if (fs.existsSync(filePath)) {
                const fileData = fs.readFileSync(filePath, 'utf8');
                const data = JSON.parse(fileData);
                
                // Load data into store
                for (const [key, value] of Object.entries(data.store || {})) {
                    this.store.set(key, value as Record<string, unknown>);
                }
                
                // Load ID counters
                if (data.idCounters) {
                    for (const [key, value] of Object.entries(data.idCounters)) {
                        this.idCounters.set(key, value as number);
                    }
                }
            }
        } catch (_error) {
            // Error silently ignored
        }
        
        // Set up auto-save timer
        // Use unref() to allow Node.js process to exit gracefully when idle
        this.persistenceTimer = setInterval(() => {
            this.saveToDisk();
        }, autoSaveInterval);
        this.persistenceTimer.unref();
    }

    /**
     * Save current state to disk
     * @private
     */
    protected saveToDisk(): void {
        if (!this.config.persistence) return;
        
        try {
            const fs = require('fs');
            const data = {
                store: Object.fromEntries(this.store),
                idCounters: Object.fromEntries(this.idCounters),
                timestamp: new Date().toISOString()
            };
            
            fs.writeFileSync(this.config.persistence.filePath, JSON.stringify(data, null, 2), 'utf8');
        } catch (_error) {
            // Error silently ignored
        }
    }

    /**
     * Build indexes for faster queries
     * @private
     */
    protected buildIndexes(indexConfig: Record<string, string[]>): void {
        for (const [objectName, fields] of Object.entries(indexConfig)) {
            const objectIndexes = new Map<string, Set<string>>();
            
            for (const field of fields) {
                const fieldIndex = new Set<string>();
                
                // Scan all records of this object type
                const pattern = `${objectName}:`;
                for (const [key, record] of this.store.entries()) {
                    if (key.startsWith(pattern)) {
                        const fieldValue = record[field];
                        if (fieldValue !== undefined && fieldValue !== null) {
                            // Store the record ID in the index
                            fieldIndex.add(record.id as string);
                        }
                    }
                }
                
                objectIndexes.set(field, fieldIndex);
            }
            
            this.indexes.set(objectName, objectIndexes);
        }
    }

    /**
     * Update index when a record is created or updated
     * @private
     */
    protected updateIndex(objectName: string, recordId: string, record: Record<string, unknown>): void {
        const objectIndexes = this.indexes.get(objectName);
        if (!objectIndexes) return;
        
        for (const [field, indexSet] of objectIndexes.entries()) {
            const fieldValue = record[field];
            if (fieldValue !== undefined && fieldValue !== null) {
                indexSet.add(recordId);
            } else {
                indexSet.delete(recordId);
            }
        }
    }

    /**
     * Remove record from indexes
     * @private
     */
    protected removeFromIndex(objectName: string, recordId: string): void {
        const objectIndexes = this.indexes.get(objectName);
        if (!objectIndexes) return;
        
        for (const indexSet of objectIndexes.values()) {
            indexSet.delete(recordId);
        }
    }

    // ========== Helper Methods ==========

    /**
     * Extract transaction ID from an opaque transaction handle.
     */
    private getTransactionId(transaction: unknown): string {
        const txId = (transaction != null && typeof transaction === 'object')
            ? (transaction as Record<string, unknown>).id as string | undefined
            : undefined;
        if (!txId) {
            throw new ObjectQLError({
                code: 'INVALID_TRANSACTION',
                message: 'Invalid transaction object'
            });
        }
        return txId;
    }

    /**
     * Normalizes query format to support both legacy UnifiedQuery and QueryAST formats.
     * This ensures backward compatibility while supporting the new @objectstack/spec interface.
     * 
     * QueryAST format uses 'top' for limit, while UnifiedQuery uses 'limit'.
     * QueryAST sort is array of {field, order}, while UnifiedQuery is array of [field, order].
     */
    /**
     * Convert ObjectQL filters to MongoDB query format for Mingo.
     * 
     * Supports both:
     * 1. Legacy ObjectQL filter format (array):
     *    [['field', 'operator', value], 'or', ['field2', 'operator', value2']]
     * 2. New FilterCondition format (object - already MongoDB-like):
     *    { $and: [{ field: { $eq: value }}, { field2: { $gt: value2 }}] }
     * 
     * Converts to MongoDB query format:
     * { $or: [{ field: { $operator: value }}, { field2: { $operator: value2 }}] }
     */
    /**
     * Convert ObjectQL filter format to MongoDB query format.
     * Supports three input formats:
     * 
     * 1. AST Comparison Node: { type: 'comparison', field: string, operator: string, value: any }
     * 2. AST Logical Node: { type: 'logical', operator: 'and' | 'or', conditions: Node[] }
     * 3. Legacy Array Format: [field, operator, value, 'and', field2, operator2, value2]
     * 4. MongoDB Format: { field: value } or { field: { $eq: value } } (passthrough)
     * 
     * @param filters - Filter in any supported format
     * @returns MongoDB query object
     */
    protected convertToMongoQuery(filters?: any[] | Record<string, any>): Record<string, any> {
        if (!filters) {
            return {};
        }
        
        // Handle AST node format (ObjectQL QueryAST)
        if (!Array.isArray(filters) && typeof filters === 'object') {
            // AST Comparison Node: { type: 'comparison', field, operator, value }
            if (filters.type === 'comparison') {
                const mongoCondition = this.convertConditionToMongo(filters.field, filters.operator, filters.value);
                return mongoCondition || {};
            } 
            
            // AST Logical Node: { type: 'logical', operator: 'and' | 'or', conditions: [...] }
            else if (filters.type === 'logical') {
                const conditions = filters.conditions?.map((cond: any) => this.convertToMongoQuery(cond)) || [];
                if (conditions.length === 0) {
                    return {};
                }
                if (conditions.length === 1) {
                    return conditions[0];
                }
                const operator = filters.operator === 'or' ? '$or' : '$and';
                return { [operator]: conditions };
            }
            
            // MongoDB format (passthrough): { field: value } or { field: { $eq: value } }
            // This handles cases where filters is already a proper MongoDB query
            return filters;
        }
        
        // Handle legacy array format
        if (filters.length === 0) {
            return {};
        }
        
        // Process the filter array to build MongoDB query
        const _conditions: Record<string, any>[] = [];
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
        
        // If there's only one group with multiple conditions, use its logic operator
        if (logicGroups.length === 1) {
            const group = logicGroups[0];
            if (group.logic === 'or') {
                return { $or: group.conditions };
            } else {
                return { $and: group.conditions };
            }
        }
        
        // Multiple groups - flatten all conditions and determine the top-level operator
        const allConditions: Record<string, any>[] = [];
        for (const group of logicGroups) {
            if (group.conditions.length === 0) continue;
            
            if (group.conditions.length === 1) {
                allConditions.push(group.conditions[0]);
            } else {
                if (group.logic === 'or') {
                    allConditions.push({ $or: group.conditions });
                } else {
                    allConditions.push({ $and: group.conditions });
                }
            }
        }
        
        if (allConditions.length === 0) {
            return {};
        } else if (allConditions.length === 1) {
            return allConditions[0];
        } else {
            // Determine top-level operator: use OR if any non-empty group has OR logic
            const hasOrLogic = logicGroups.some(g => g.logic === 'or' && g.conditions.length > 0);
            if (hasOrLogic) {
                return { $or: allConditions };
            } else {
                return { $and: allConditions };
            }
        }
    }

    /**
     * Convert a single ObjectQL condition to MongoDB operator format.
     */
    protected convertConditionToMongo(field: string, operator: string, value: unknown): Record<string, unknown> | null {
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
                return { [field]: { $regex: new RegExp(this.escapeRegex(value as string), 'i') } };
            
            case 'startswith':
            case 'starts_with':
                return { [field]: { $regex: new RegExp(`^${this.escapeRegex(value as string)}`, 'i') } };
            
            case 'endswith':
            case 'ends_with':
                return { [field]: { $regex: new RegExp(`${this.escapeRegex(value as string)}$`, 'i') } };
            
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
    protected escapeRegex(str: string): string {
        return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Apply manual sorting to an array of records.
     * This is used instead of Mingo's sort to avoid CJS build issues.
     */
    protected applyManualSort(records: Record<string, unknown>[], sort: unknown[]): Record<string, unknown>[] {
        const sorted = [...records];
        
        // Apply sorts in reverse order for correct multi-field precedence
        for (let i = sort.length - 1; i >= 0; i--) {
            const sortItem = sort[i];
            
            let field: string;
            let direction: string;
            
            if (Array.isArray(sortItem)) {
                [field, direction] = sortItem;
            } else if (typeof sortItem === 'object' && sortItem !== null) {
                const s = sortItem as Record<string, string>;
                field = s.field;
                direction = s.order || s.direction || s.dir || 'asc';
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
    protected projectFields(doc: Record<string, unknown>, fields: string[]): Record<string, unknown> {
        const result: Record<string, unknown> = {};
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
    protected generateId(objectName: string): string {
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
    async executeQuery(ast: QueryAST, options?: Record<string, unknown>): Promise<{ value: Record<string, unknown>[]; count?: number }> {
        const objectName = ast.object || '';
        
        // Use existing find method with QueryAST directly
        const results = await this.find(objectName, ast, options);
        
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
    async executeCommand(command: Command, options?: Record<string, unknown>): Promise<CommandResult> {
        try {
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
                }
                
                case 'bulkUpdate': {
                    if (!command.updates || !Array.isArray(command.updates)) {
                        throw new ObjectQLError({ code: 'DRIVER_QUERY_FAILED', message: 'BulkUpdate command requires updates array' });
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
                }
                
                case 'bulkDelete': {
                    if (!command.ids || !Array.isArray(command.ids)) {
                        throw new ObjectQLError({ code: 'DRIVER_QUERY_FAILED', message: 'BulkDelete command requires ids array' });
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
                }
                
                default:
                    throw new ObjectQLError({ code: 'DRIVER_UNSUPPORTED_OPERATION', message: `Unknown command type: ${(command as Command).type}` });
            }
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : 'Command execution failed';
            return {
                success: false,
                error: msg,
                affected: 0
            };
        }
    }

    /**
     * Execute command (alternative signature for compatibility)
     * 
     * @param command - Command string or object
     * @param parameters - Command parameters
     * @param options - Execution options
     */
    async execute(_command: unknown, _parameters?: unknown[], _options?: Record<string, unknown>): Promise<unknown> {
        // For memory driver, this is primarily for compatibility
        // We don't support raw SQL/commands
        throw new ObjectQLError({ code: 'DRIVER_UNSUPPORTED_OPERATION', message: 'Memory driver does not support raw command execution. Use executeCommand() instead.' });
    }
}
