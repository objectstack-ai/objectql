import { Data, System as SystemSpec } from '@objectstack/spec';
type QueryAST = Data.QueryAST;
type SortNode = Data.SortNode;
type DriverInterface = Data.DriverInterface;
/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Driver } from '@objectql/types';
import { MongoClient, Db, Filter, ObjectId, FindOptions, FindOneAndUpdateOptions, ChangeStream, ChangeStreamDocument } from 'mongodb';

/**
 * Change stream event handler callback
 */
export type ChangeStreamHandler = (change: ChangeStreamDocument) => void | Promise<void>;

/**
 * Change stream options
 */
export interface ChangeStreamOptions {
    /** Filter for specific operation types (insert, update, delete, replace) */
    operationTypes?: ('insert' | 'update' | 'delete' | 'replace')[];
    /** Full document lookup for update operations */
    fullDocument?: 'updateLookup' | 'whenAvailable' | 'required';
    /** Pipeline to filter change events */
    pipeline?: any[];
}

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
 * MongoDB Driver for ObjectQL
 * 
 * Implements both the legacy Driver interface from @objectql/types and
 * the standard DriverInterface from @objectstack/spec for compatibility
 * with the new kernel-based plugin system.
 * 
 * The driver internally converts QueryAST format to MongoDB query format.
 */
export class MongoDriver implements Driver {
    // Driver metadata (ObjectStack-compatible)
    public readonly name = 'MongoDriver';
    public readonly version = '3.0.1';
    public readonly supports = {
        transactions: true,
        joins: false,
        fullTextSearch: true,
        jsonFields: true,
        arrayFields: true,
        queryFilters: true,
        queryAggregations: true,
        querySorting: true,
        queryPagination: true,
        queryWindowFunctions: false,
        querySubqueries: false
    };

    private client: MongoClient;
    private db?: Db;
    private config: any;
    private connected: Promise<void>;
    private changeStreams: Map<string, ChangeStream>;

    constructor(config: { url: string, dbName?: string }) {
        this.config = config;
        this.client = new MongoClient(config.url);
        this.connected = this.internalConnect();
        this.changeStreams = new Map();
    }

    /**
     * Internal connect method used in constructor
     */
    private async internalConnect() {
        await this.client.connect();
        this.db = this.client.db(this.config.dbName);
    }

    /**
     * Connect to the database (for DriverInterface compatibility)
     * This method ensures the connection is established.
     */
    async connect(): Promise<void> {
        await this.connected;
    }

    /**
     * Check database connection health
     */
    async checkHealth(): Promise<boolean> {
        try {
            await this.connected;
            if (!this.db) return false;
            await this.db.admin().ping();
            return true;
        } catch (error) {
            return false;
        }
    }

    private async getCollection(objectName: string) {
        await this.connected;
        if (!this.db) throw new Error("Database not initialized");
        return this.db.collection<any>(objectName);
    }

    private normalizeId(id: string | number | ObjectId): ObjectId | string | number {
        // User requested String IDs, so we do NOT convert 24-char strings to ObjectId.
        // We only pass through what is given.
        return id;
    }

    /**
     * Map API document (with 'id') to MongoDB document (with '_id')
     */
    private mapToMongo(doc: any): any {
        if (!doc) return doc;
        const { id, ...rest } = doc;
        if (id !== undefined) {
            return { _id: id, ...rest };
        }
        return doc;
    }

    /**
     * Map MongoDB document (with '_id') to API document (with 'id')
     */
    private mapFromMongo(doc: any): any {
        if (!doc) return doc;
        const { _id, ...rest } = doc;
        if (_id !== undefined) {
            return { id: _id, ...rest };
        }
        return doc;
    }

    /**
     * Map array of MongoDB documents to API documents
     */
    private mapFromMongoArray(docs: any[]): any[] {
        return docs.map(doc => this.mapFromMongo(doc));
    }

    private mapFilters(filters: any): Filter<any> {
        if (!filters) return {};
        
        // If filters is an object (FilterCondition format), map id fields to _id
        if (typeof filters === 'object' && !Array.isArray(filters)) {
            return this.mapIdFieldsInFilter(filters);
        }
        
        // If filters is an array (legacy format), convert it
        if (Array.isArray(filters) && filters.length === 0) return {};
        
        const result = this.buildFilterConditions(filters);
        return result;
    }

    /**
     * Recursively map 'id' fields to '_id' in FilterCondition objects
     * and normalize primitive values to use $eq operator when inside logical operators
     */
    private mapIdFieldsInFilter(filter: any, insideLogicalOp: boolean = false): any {
        if (!filter || typeof filter !== 'object') {
            return filter;
        }

        const result: any = {};
        
        for (const [key, value] of Object.entries(filter)) {
            // Handle logical operators
            if (key === '$and' || key === '$or') {
                if (Array.isArray(value)) {
                    // Pass true to indicate we're inside a logical operator
                    result[key] = value.map(v => this.mapIdFieldsInFilter(v, true));
                }
            } 
            // Map 'id' to '_id'
            else if (key === 'id') {
                // If value is already an object with operators, recurse
                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                    result['_id'] = this.mapIdFieldsInFilter(value, insideLogicalOp);
                } else {
                    // Primitive value - wrap with $eq only if inside logical operator
                    result['_id'] = insideLogicalOp ? { $eq: value } : value;
                }
            }
            // Skip MongoDB operator keys (starting with $) - but still recurse for nested mappings
            else if (key.startsWith('$')) {
                // Recursively process to handle nested objects that might contain 'id' fields
                if (typeof value === 'object' && value !== null) {
                    result[key] = this.mapIdFieldsInFilter(value, insideLogicalOp);
                } else {
                    result[key] = value;
                }
            }
            // Recursively handle nested objects (already operator-wrapped values)
            else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                result[key] = this.mapIdFieldsInFilter(value, insideLogicalOp);
            }
            // Primitive field values
            else {
                // Wrap with $eq only if inside a logical operator
                result[key] = insideLogicalOp ? { $eq: value } : value;
            }
        }
        
        return result;
    }

    /**
     * Build MongoDB filter conditions from ObjectQL filter array.
     * Supports nested filter groups and logical operators (AND/OR).
     */
    private buildFilterConditions(filters: any[]): Filter<any> {
        const conditions: any[] = [];
        let nextJoin = '$and'; // Default logic operator for next condition

        for (const item of filters) {
            if (typeof item === 'string') {
                // Update the logic operator for the next condition
                if (item.toLowerCase() === 'or') {
                    nextJoin = '$or';
                } else if (item.toLowerCase() === 'and') {
                    nextJoin = '$and';
                }
                continue;
            }

            if (Array.isArray(item)) {
                // Heuristic to detect if it is a criterion [field, op, value] or a nested group
                const [fieldRaw, op, value] = item;
                const isCriterion = typeof fieldRaw === 'string' && typeof op === 'string';

                let condition: any;
                
                if (isCriterion) {
                    // This is a single criterion [field, op, value]
                    condition = this.buildSingleCondition(fieldRaw, op, value);
                } else {
                    // This is a nested group - recursively process it
                    condition = this.buildFilterConditions(item);
                }
                
                // Apply the join logic
                if (conditions.length > 0 && nextJoin === '$or') {
                    // Collect all OR conditions together
                    const lastItem = conditions[conditions.length - 1];
                    if (lastItem && lastItem.$or) {
                        // Extend existing $or array
                        lastItem.$or.push(condition);
                    } else {
                        // Create new $or with previous and current condition
                        const previous = conditions.pop();
                        conditions.push({ $or: [previous, condition] });
                    }
                } else {
                    // Default AND - just add to conditions array
                    conditions.push(condition);
                }
                
                // Reset to default AND logic after processing each item
                nextJoin = '$and';
            }
        }

        if (conditions.length === 0) return {};
        if (conditions.length === 1) return conditions[0];
        
        // Multiple conditions - wrap in AND
        return { $and: conditions };
    }

    /**
     * Build a single MongoDB condition from field, operator, and value.
     */
    private buildSingleCondition(fieldRaw: string, op: string, value: any): any {
        const mongoCondition: any = {};
        
        // Map both 'id' and '_id' to '_id' for MongoDB compatibility
        const dbField = (fieldRaw === 'id' || fieldRaw === '_id') ? '_id' : fieldRaw;
        
        if (dbField === '_id') {
            mongoCondition[dbField] = this.normalizeId(value);
        } else {
            switch (op) {
               case '=': mongoCondition[dbField] = { $eq: value }; break;
               case '!=': mongoCondition[dbField] = { $ne: value }; break;
               case '>': mongoCondition[dbField] = { $gt: value }; break;
               case '>=': mongoCondition[dbField] = { $gte: value }; break;
               case '<': mongoCondition[dbField] = { $lt: value }; break;
               case '<=': mongoCondition[dbField] = { $lte: value }; break;
               case 'in': mongoCondition[dbField] = { $in: value }; break;
               case 'nin': mongoCondition[dbField] = { $nin: value }; break;
               case 'contains': 
                    mongoCondition[dbField] = { $regex: value, $options: 'i' }; 
                    break;
               default: mongoCondition[dbField] = { $eq: value };
            }
        }
        
        return mongoCondition;
    }

    /**
     * Normalizes query format to support both legacy UnifiedQuery and QueryAST formats.
     * This ensures backward compatibility while supporting the new @objectstack/spec interface.
     * 
     * QueryAST format uses 'top' for limit, while UnifiedQuery uses 'limit'.
     * QueryAST sort is array of {field, order}, while UnifiedQuery is array of [field, order].
     * QueryAST uses 'aggregations', while legacy uses 'aggregate'.
     */
    async find(objectName: string, query: any, options?: any): Promise<any[]> {
        const collection = await this.getCollection(objectName);
        
        // Handle both new format (where) and legacy format (filters)
        const filterCondition = query.where || query.filters;
        const filter = this.mapFilters(filterCondition);
        
        const findOptions: FindOptions = {};
        
        // Handle pagination - support both new format (offset/limit) and legacy format (skip/top)
        const offsetValue = query.offset ?? query.skip;
        const limitValue = query.limit ?? query.top;
        
        if (offsetValue !== undefined) findOptions.skip = offsetValue;
        if (limitValue !== undefined) findOptions.limit = limitValue;
        
        // Handle sort - support both new format (orderBy) and legacy format (sort)
        const sortArray = query.orderBy || query.sort;
        if (sortArray && Array.isArray(sortArray)) {
            findOptions.sort = {};
            for (const item of sortArray) {
                // Support both {field, order} object format and [field, order] array format
                const field = item.field || item[0];
                const order = item.order || item[1] || 'asc';
                // Map both 'id' and '_id' to '_id' for backward compatibility
                const dbField = (field === 'id' || field === '_id') ? '_id' : field;
                (findOptions.sort as any)[dbField] = order === 'desc' ? -1 : 1;
            }
        }
        
        if (query.fields && query.fields.length > 0) {
            findOptions.projection = {};
            for (const field of query.fields) {
                // Map both 'id' and '_id' to '_id' for backward compatibility
                const dbField = (field === 'id' || field === '_id') ? '_id' : field;
                (findOptions.projection as any)[dbField] = 1;
            }
            // Explicitly exclude _id if 'id' is not in the requested fields
            const hasIdField = query.fields.some((f: string) => f === 'id' || f === '_id');
            if (!hasIdField) {
                (findOptions.projection as any)._id = 0;
            }
        }

        const results = await collection.find(filter, findOptions).toArray();
        // Map MongoDB documents to API format (convert _id to id)
        return this.mapFromMongoArray(results);
    }

    async findOne(objectName: string, id: string | number, query?: any, options?: any) {
        const collection = await this.getCollection(objectName);
        if (id) {
            const result = await collection.findOne({ _id: this.normalizeId(id) });
            // Map MongoDB document to API format (convert _id to id)
            return this.mapFromMongo(result);
        }
        if (query) {
             const results = await this.find(objectName, { ...query, limit: 1 }, options);
             return results[0];
        }
        return null;
    }

    async create(objectName: string, data: any, options?: any) {
        const collection = await this.getCollection(objectName);
        
        // Map API document (id) to MongoDB document (_id)
        const mongoDoc = this.mapToMongo(data);
        
        // If no _id is provided, generate a String ID instead of allowing Mongo to generate an ObjectId
        if (!mongoDoc._id) {
            mongoDoc._id = new ObjectId().toHexString();
        }

        // Add timestamps if not already present
        const now = new Date().toISOString();
        if (!mongoDoc.created_at) {
            mongoDoc.created_at = now;
        }
        if (!mongoDoc.updated_at) {
            mongoDoc.updated_at = now;
        }

        // Pass session for transactional operations only if it exists
        const result = options?.session 
            ? await collection.insertOne(mongoDoc, { session: options.session })
            : await collection.insertOne(mongoDoc);
        
        // Return API format document (convert _id to id)
        return this.mapFromMongo({ ...mongoDoc, _id: result.insertedId });
    }

    async update(objectName: string, id: string | number, data: any, options?: any) {
        const collection = await this.getCollection(objectName);
        
        // Map API document (id) to MongoDB document (_id) for update data
        // But we should not allow updating the _id field itself
        const { id: _ignoredId, created_at: _ignoredCreatedAt, ...updateData } = data; // intentionally ignore id and created_at to prevent updating them
        
        // Add updated_at timestamp
        updateData.updated_at = new Date().toISOString();
        
        // Handle atomic operators if present
        const isAtomic = Object.keys(updateData).some(k => k.startsWith('$'));
        const update = isAtomic ? updateData : { $set: updateData };

        // Use findOneAndUpdate to return the updated document
        const mongoOptions: FindOneAndUpdateOptions = { returnDocument: 'after' };
        if (options?.session) {
            mongoOptions.session = options.session;
        }
        
        const result = await collection.findOneAndUpdate(
            { _id: this.normalizeId(id) },
            update,
            mongoOptions
        );
        
        // Return API format document (convert _id to id)
        return this.mapFromMongo(result);
    }

    async delete(objectName: string, id: string | number, options?: any) {
        const collection = await this.getCollection(objectName);
        // Pass session for transactional operations only if it exists
        const result = options?.session
            ? await collection.deleteOne({ _id: this.normalizeId(id) }, { session: options.session })
            : await collection.deleteOne({ _id: this.normalizeId(id) });
        return result.deletedCount;
    }

    async count(objectName: string, filters: any, options?: any): Promise<number> {
        const collection = await this.getCollection(objectName);
        // Handle both filter objects and query objects
        let actualFilters = filters;
        if (filters && (filters.where || filters.filters)) {
            // It's a query object with 'where' or 'filters' property
            actualFilters = filters.where || filters.filters;
        }
        const filter = this.mapFilters(actualFilters);
        return await collection.countDocuments(filter);
    }
    
    // Bulk Operations
    async createMany(objectName: string, data: any[], options?: any): Promise<any> {
        if (!data || data.length === 0) return [];
        const collection = await this.getCollection(objectName);
        // Map all API documents to MongoDB format
        const mongoDocs = data.map(doc => {
            const mongoDoc = this.mapToMongo(doc);
            if (!mongoDoc._id) {
                mongoDoc._id = new ObjectId().toHexString();
            }
            return mongoDoc;
        });
        const result = await collection.insertMany(mongoDocs);
        // Return API format (convert _id to id)
        return Object.values(result.insertedIds).map(id => ({ id }));
    }

    async updateMany(objectName: string, filters: any, data: any, options?: any): Promise<any> {
        const collection = await this.getCollection(objectName);
        const filter = this.mapFilters(filters);
        
        // Remove 'id' field from update data as it shouldn't be updated
        const { id: idToIgnore, ...updateData } = data;
        
        const isAtomic = Object.keys(updateData).some(k => k.startsWith('$'));
        const update = isAtomic ? updateData : { $set: updateData };
        
        const result = await collection.updateMany(filter, update);
        return result.modifiedCount;
    }

    async deleteMany(objectName: string, filters: any, options?: any): Promise<any> {
        const collection = await this.getCollection(objectName);
        const filter = this.mapFilters(filters);
        const result = await collection.deleteMany(filter);
        return result.deletedCount;
    }

    async aggregate(objectName: string, pipeline: any[], options?: any): Promise<any[]> {
        const collection = await this.getCollection(objectName);
        const results = await collection.aggregate(pipeline).toArray();
        // Map MongoDB documents to API format (convert _id to id)
        return this.mapFromMongoArray(results);
    }

    /**
     * Get distinct values for a field
     * @param objectName - The collection name
     * @param field - The field to get distinct values from
     * @param filters - Optional filters to apply
     * @param options - Optional query options
     * @returns Array of distinct values
     */
    async distinct(objectName: string, field: string, filters?: any, options?: any): Promise<any[]> {
        const collection = await this.getCollection(objectName);
        
        // Convert ObjectQL filters to MongoDB query format
        const filter = filters ? this.mapFilters(filters) : {};
        
        // Use MongoDB's native distinct method
        const results = await collection.distinct(field, filter);
        
        return results;
    }

    /**
     * Find one document and update it atomically
     * @param objectName - The collection name
     * @param filters - Query filters to find the document
     * @param update - Update operations to apply
     * @param options - Optional query options (e.g., returnDocument, upsert)
     * @returns The updated document
     * 
     * @example
     * // Find and update with returnDocument: 'after' to get the updated doc
     * const updated = await driver.findOneAndUpdate('users', 
     *   { email: 'user@example.com' }, 
     *   { $set: { status: 'active' } },
     *   { returnDocument: 'after' }
     * );
     */
    async findOneAndUpdate(objectName: string, filters: any, update: any, options?: any): Promise<any> {
        const collection = await this.getCollection(objectName);
        
        // Convert ObjectQL filters to MongoDB query format
        const filter = this.mapFilters(filters);
        
        // MongoDB findOneAndUpdate options
        const mongoOptions: any = {
            returnDocument: options?.returnDocument || 'after', // 'before' or 'after'
            upsert: options?.upsert || false
        };
        
        // Execute the atomic find and update
        const result = await collection.findOneAndUpdate(filter, update, mongoOptions);
        
        // Map MongoDB document to API format (convert _id to id)
        // MongoDB driver v5+ returns { value: document, ok: number }
        // Older versions (v4) return the document directly
        // We handle both for backward compatibility
        const doc = result?.value !== undefined ? result.value : result;
        return doc ? this.mapFromMongo(doc) : null;
    }

    // ========== Transaction Support ==========
    
    /**
     * Begin a new transaction session
     * 
     * @returns MongoDB ClientSession that can be used for transactional operations
     * 
     * @example
     * const session = await driver.beginTransaction();
     * try {
     *   await driver.create('users', { name: 'Alice' }, { session });
     *   await driver.create('orders', { userId: 'alice' }, { session });
     *   await driver.commitTransaction(session);
     * } catch (error) {
     *   await driver.rollbackTransaction(session);
     *   throw error;
     * }
     */
    async beginTransaction(): Promise<any> {
        await this.connected;
        const session = this.client.startSession();
        session.startTransaction();
        return session;
    }
    
    /**
     * Commit a transaction
     * 
     * @param transaction - MongoDB ClientSession returned by beginTransaction()
     * 
     * @example
     * const session = await driver.beginTransaction();
     * // ... perform operations with { session } in options
     * await driver.commitTransaction(session);
     */
    async commitTransaction(transaction: any): Promise<void> {
        if (!transaction || typeof transaction.commitTransaction !== 'function') {
            throw new Error('Invalid transaction object. Must be a MongoDB ClientSession.');
        }
        
        try {
            await transaction.commitTransaction();
        } finally {
            await transaction.endSession();
        }
    }
    
    /**
     * Rollback a transaction
     * 
     * @param transaction - MongoDB ClientSession returned by beginTransaction()
     * 
     * @example
     * const session = await driver.beginTransaction();
     * try {
     *   // ... perform operations
     *   await driver.commitTransaction(session);
     * } catch (error) {
     *   await driver.rollbackTransaction(session);
     * }
     */
    async rollbackTransaction(transaction: any): Promise<void> {
        if (!transaction || typeof transaction.abortTransaction !== 'function') {
            throw new Error('Invalid transaction object. Must be a MongoDB ClientSession.');
        }
        
        try {
            await transaction.abortTransaction();
        } finally {
            await transaction.endSession();
        }
    }

    async disconnect() {
        // Close all active change streams
        for (const [streamId, stream] of this.changeStreams.entries()) {
            await stream.close();
        }
        this.changeStreams.clear();
        
        // Close the MongoDB client
        if (this.client) {
            await this.client.close();
        }
    }

    /**
     * Watch for changes in a collection using MongoDB Change Streams
     * @param objectName - The collection name to watch
     * @param handler - Callback function to handle change events
     * @param options - Optional change stream configuration
     * @returns Stream ID that can be used to close the stream later
     * 
     * @example
     * const streamId = await driver.watch('users', async (change) => {
     *   console.log('Change detected:', change.operationType);
     *   if (change.operationType === 'insert') {
     *     console.log('New document:', change.fullDocument);
     *   }
     * }, {
     *   operationTypes: ['insert', 'update'],
     *   fullDocument: 'updateLookup'
     * });
     * 
     * // Later, to stop watching:
     * await driver.unwatchChangeStream(streamId);
     */
    async watch(objectName: string, handler: ChangeStreamHandler, options?: ChangeStreamOptions): Promise<string> {
        const collection = await this.getCollection(objectName);
        
        // Build change stream pipeline
        const pipeline: any[] = options?.pipeline || [];
        
        // Add operation type filter if specified
        if (options?.operationTypes && options.operationTypes.length > 0) {
            pipeline.unshift({
                $match: {
                    operationType: { $in: options.operationTypes }
                }
            });
        }
        
        // Configure change stream options
        const streamOptions: any = {};
        if (options?.fullDocument) {
            streamOptions.fullDocument = options.fullDocument;
        }
        
        // Create the change stream
        const changeStream = collection.watch(pipeline, streamOptions);
        
        // Generate unique stream ID
        const streamId = `${objectName}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        
        // Store the stream
        this.changeStreams.set(streamId, changeStream);
        
        // Handle change events
        changeStream.on('change', async (change) => {
            try {
                await handler(change);
            } catch (error) {
                console.error(`[MongoDriver] Error in change stream handler for ${objectName}:`, error);
            }
        });
        
        changeStream.on('error', (error) => {
            console.error(`[MongoDriver] Change stream error for ${objectName}:`, error);
        });
        
        return streamId;
    }

    /**
     * Stop watching a change stream
     * @param streamId - The stream ID returned by watch()
     */
    async unwatchChangeStream(streamId: string): Promise<void> {
        const stream = this.changeStreams.get(streamId);
        if (stream) {
            await stream.close();
            this.changeStreams.delete(streamId);
        }
    }

    /**
     * Get all active change stream IDs
     */
    getActiveChangeStreams(): string[] {
        return Array.from(this.changeStreams.keys());
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
        // QueryAST is now the same format as our internal query
        // Just pass it directly to find
        const results = await this.find(ast.object || '', ast, options);
        
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
                        affected: updated ? 1 : 0
                    };
                
                case 'delete':
                    if (!command.id) {
                        throw new Error('Delete command requires id');
                    }
                    const deleteCount = await this.delete(command.object, command.id, cmdOptions);
                    return {
                        success: true,
                        affected: deleteCount
                    };
                
                case 'bulkCreate':
                    if (!command.records || !Array.isArray(command.records)) {
                        throw new Error('BulkCreate command requires records array');
                    }
                    const bulkCreated = await this.createMany(command.object, command.records, cmdOptions);
                    return {
                        success: true,
                        data: bulkCreated,
                        affected: command.records.length
                    };
                
                case 'bulkUpdate':
                    if (!command.updates || !Array.isArray(command.updates)) {
                        throw new Error('BulkUpdate command requires updates array');
                    }
                    let updateCount = 0;
                    const updateResults = [];
                    for (const update of command.updates) {
                        const result = await this.update(command.object, update.id, update.data, cmdOptions);
                        updateResults.push(result);
                        if (result) updateCount++;
                    }
                    return {
                        success: true,
                        data: updateResults,
                        affected: updateCount
                    };
                
                case 'bulkDelete':
                    if (!command.ids || !Array.isArray(command.ids)) {
                        throw new Error('BulkDelete command requires ids array');
                    }
                    let deleted = 0;
                    for (const id of command.ids) {
                        const result = await this.delete(command.object, id, cmdOptions);
                        deleted += result;
                    }
                    return {
                        success: true,
                        affected: deleted
                    };
                
                default:
                    const validTypes = ['create', 'update', 'delete', 'bulkCreate', 'bulkUpdate', 'bulkDelete'];
                    throw new Error(`Unknown command type: ${(command as any).type}. Valid types are: ${validTypes.join(', ')}`);
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
     * Convert FilterCondition (QueryAST format) to legacy filter array format
     * This allows reuse of existing filter logic while supporting new QueryAST
     * 
    /**
     * Execute command (alternative signature for compatibility)
     * 
     * @param command - Command string or object
     * @param parameters - Command parameters
     * @param options - Execution options
     */
    async execute(command: any, parameters?: any[], options?: any): Promise<any> {
        // MongoDB driver doesn't support raw command execution in the traditional SQL sense
        // Use executeCommand() instead for mutations (create/update/delete)
        // Example: await driver.executeCommand({ type: 'create', object: 'users', data: {...} })
        throw new Error(
            'MongoDB driver does not support raw command execution. ' +
            'Use executeCommand() for mutations or aggregate() for complex queries. ' +
            'Example: driver.executeCommand({ type: "create", object: "users", data: {...} })'
        );
    }
}

