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

import { Driver, IntrospectedSchema, IntrospectedTable, IntrospectedColumn, IntrospectedForeignKey } from '@objectql/types';
import knex, { Knex } from 'knex';
import { nanoid } from 'nanoid';

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
 * SQL Driver for ObjectQL
 * 
 * Implements both the legacy Driver interface from @objectql/types and
 * the standard DriverInterface from @objectstack/spec for full compatibility
 * with the new kernel-based plugin system.
 * 
 * The driver supports both legacy filter syntax and modern QueryAST format,
 * internally converting them to Knex query builder calls for optimal SQL generation.
 * 
 * @version 4.0.0 - DriverInterface compliant
 */
export class SqlDriver implements Driver {
    // Driver metadata (ObjectStack-compatible)
    public readonly name = 'SqlDriver';
    public readonly version = '4.0.0';
    public readonly supports = {
        transactions: true,
        joins: true,
        fullTextSearch: false,
        jsonFields: true,
        arrayFields: true,
        queryFilters: true,
        queryAggregations: true,
        querySorting: true,
        queryPagination: true,
        queryWindowFunctions: true,
        querySubqueries: true
    };

    private knex: Knex;
    private config: any;
    private jsonFields: Record<string, string[]> = {};

    constructor(config: any) {
        this.config = config;
        this.knex = knex(config);
    }

    private getBuilder(objectName: string, options?: any) {
        let builder = this.knex(objectName);
        if (options?.transaction) {
            builder = builder.transacting(options.transaction);
        }
        return builder;
    }

    private applyFilters(builder: Knex.QueryBuilder, filters: any) {
        if (!filters) return;
        
        // Handle Plain Object filters (MongoDB style simple query)
        // e.g. { name: 'John', age: 20 }
        if (!Array.isArray(filters)) {
            if (typeof filters === 'object') {
                for (const [key, value] of Object.entries(filters)) {
                    // Ignore special query properties if they leak here
                    if (['filters', 'sort', 'limit', 'skip', 'fields'].includes(key)) continue;
                    builder.where(key, value as any);
                }
            }
            return;
        }

        if (filters.length === 0) return;

        let nextJoin = 'and';

        for (const item of filters) {
             if (typeof item === 'string') {
                 if (item.toLowerCase() === 'or') nextJoin = 'or';
                 else if (item.toLowerCase() === 'and') nextJoin = 'and';
                 continue;
             }

             if (Array.isArray(item)) {
                 // Heuristic to detect if it is a criterion [field, op, value] or a nested group
                 const [fieldRaw, op, value] = item;
                 const isCriterion = typeof fieldRaw === 'string' && typeof op === 'string';

                 if (isCriterion) {
                     const field = this.mapSortField(fieldRaw);
                     // Handle specific operators that map to different knex methods
                     const apply = (b: any) => {
                         let method = nextJoin === 'or' ? 'orWhere' : 'where';
                         let methodIn = nextJoin === 'or' ? 'orWhereIn' : 'whereIn';
                         let methodNotIn = nextJoin === 'or' ? 'orWhereNotIn' : 'whereNotIn';
                         
                         // Fix for 'contains' mapping
                         if (op === 'contains') {
                             b[method](field, 'like', `%${value}%`);
                             return;
                         }

                         switch (op) {
                             case '=': b[method](field, value); break;
                             case '!=': b[method](field, '<>', value); break;
                             case 'in': b[methodIn](field, value); break;
                             case 'nin': b[methodNotIn](field, value); break;
                             default: b[method](field, op, value);
                         }
                     };
                     apply(builder);
                 } else {
                     // Recursive Group
                     const method = nextJoin === 'or' ? 'orWhere' : 'where';
                     builder[method]((qb) => {
                         this.applyFilters(qb, item);
                     });
                 }
                 
                 nextJoin = 'and'; 
             }
        }
    }

    private mapSortField(field: string): string {
        if (field === 'createdAt') return 'created_at';
        if (field === 'updatedAt') return 'updated_at';
        return field;
    }

    /**
     * Normalizes query format to support both legacy UnifiedQuery and QueryAST formats.
     * This ensures backward compatibility while supporting the new @objectstack/spec interface.
     * 
     * QueryAST format uses 'top' for limit, while UnifiedQuery uses 'limit'.
     * QueryAST sort is array of {field, order}, while UnifiedQuery is array of [field, order].
     * QueryAST uses 'aggregations', while legacy uses 'aggregate'.
     */
    private normalizeQuery(query: any): any {
        if (!query) return {};
        
        const normalized: any = { ...query };
        
        // Normalize limit/top
        if (normalized.top !== undefined && normalized.limit === undefined) {
            normalized.limit = normalized.top;
        }
        
        // Normalize aggregations/aggregate
        if (normalized.aggregations !== undefined && normalized.aggregate === undefined) {
            // Convert QueryAST aggregations format to legacy aggregate format
            normalized.aggregate = normalized.aggregations.map((agg: any) => ({
                func: agg.function,
                field: agg.field,
                alias: agg.alias
            }));
        }
        
        // Normalize sort format
        if (normalized.sort && Array.isArray(normalized.sort)) {
            // Check if it's already in the array format [field, order]
            const firstSort = normalized.sort[0];
            if (firstSort && typeof firstSort === 'object' && !Array.isArray(firstSort)) {
                // Convert from QueryAST format {field, order} to internal format [field, order]
                // Keep the object format as the applySort logic already handles it
            }
        }
        
        return normalized;
    }

    async find(objectName: string, query: any, options?: any): Promise<any[]> {
        const normalizedQuery = this.normalizeQuery(query);
        const builder = this.getBuilder(objectName, options);
        
        if (normalizedQuery.fields) {
            builder.select(normalizedQuery.fields.map((f: string) => this.mapSortField(f)));
        } else {
            builder.select('*');
        }

        if (normalizedQuery.filters) {
            this.applyFilters(builder, normalizedQuery.filters);
        }

        if (normalizedQuery.sort && Array.isArray(normalizedQuery.sort)) {
            for (const item of normalizedQuery.sort) {
                let field: string | undefined;
                let dir: string | undefined;

                if (Array.isArray(item)) {
                     [field, dir] = item;
                } else if (typeof item === 'object' && item !== null) {
                    // Support object format { field: 'name', order: 'asc' }
                     field = (item as any).field;
                     dir = (item as any).order || (item as any).direction || (item as any).dir;
                }

                if (field) {
                    builder.orderBy(this.mapSortField(field), dir);
                }
            }
        }

        if (normalizedQuery.skip) builder.offset(normalizedQuery.skip);
        if (normalizedQuery.limit) builder.limit(normalizedQuery.limit);

        const results = await builder;
        
        if (!Array.isArray(results)) {
            // Log warning or throw better error
            // console.warn('SqlDriver.find: results is not an array', results);
            return [];
        }

        if (this.config.client === 'sqlite3') {
             for (const row of results) {
                 this.formatOutput(objectName, row);
             }
        }
        return results;
    }

    async findOne(objectName: string, id: string | number, query?: any, options?: any) {
        if (id) {
            const res = await this.getBuilder(objectName, options).where('id', id).first();
            return this.formatOutput(objectName, res);
        }
        if (query) {
             const results = await this.find(objectName, { ...query, limit: 1 }, options);
             return results[0];
        }
        return null;
    }

    async create(objectName: string, data: any, options?: any) {
        // Handle _id -> id mapping for compatibility
        const { _id, ...rest } = data;
        const toInsert = { ...rest };
        // If _id exists and id doesn't, map _id to id
        if (_id !== undefined && toInsert.id === undefined) {
             toInsert.id = _id;
        } else if (toInsert.id === undefined) {
            // Auto-generate ID if not provided
            toInsert.id = nanoid(16);
        }
        
        // Knex insert returns Result array (e.g. ids)
        // We want the created document. 
        const builder = this.getBuilder(objectName, options);

        const formatted = this.formatInput(objectName, toInsert);

        // We should insert 'toInsert' instead of 'data'
        const result = await builder.insert(formatted).returning('*'); 
        return this.formatOutput(objectName, result[0]);
    }

    async update(objectName: string, id: string | number, data: any, options?: any) {
        const builder = this.getBuilder(objectName, options);
        const formatted = this.formatInput(objectName, data);
        await builder.where('id', id).update(formatted);
        
        // Fetch and return the updated record
        const updated = await this.findOne(objectName, id, undefined, options);
        return updated;
    }

    async delete(objectName: string, id: string | number, options?: any) {
        const builder = this.getBuilder(objectName, options);
        return await builder.where('id', id).delete();
    }

    async count(objectName: string, filters: any, options?: any): Promise<number> {
        const builder = this.getBuilder(objectName, options);
        
        // Handle both filter arrays and query objects
        let actualFilters = filters;
        if (filters && !Array.isArray(filters)) {
            // It's a query object, normalize it and extract filters
            const normalizedQuery = this.normalizeQuery(filters);
            actualFilters = normalizedQuery.filters || filters;
        }

        if (actualFilters) {
            this.applyFilters(builder, actualFilters);
        }
        const result = await builder.count<{count: number}[]>('* as count');
        // result is usually [{count: 123}] or similar depending on driver
        if (result && result.length > 0) {
            const row: any = result[0];
            return Number(row.count || row['count(*)']);
        }
        return 0;
    }

    // Transaction Support
    async beginTransaction(): Promise<any> {
        return await this.knex.transaction();
    }

    async commitTransaction(trx: Knex.Transaction): Promise<void> {
        await trx.commit();
    }

    async rollbackTransaction(trx: Knex.Transaction): Promise<void> {
        await trx.rollback();
    }

    // Aggregation
    async aggregate(objectName: string, query: any, options?: any): Promise<any> {
        const normalizedQuery = this.normalizeQuery(query);
        const builder = this.getBuilder(objectName, options);
        
        // 1. Filter
        if (normalizedQuery.filters) {
            this.applyFilters(builder, normalizedQuery.filters);
        }

        // 2. GroupBy
        if (normalizedQuery.groupBy) {
            builder.groupBy(normalizedQuery.groupBy);
            // Select grouping keys
            for (const field of normalizedQuery.groupBy) {
                builder.select(field);
            }
        }

        // 3. Aggregate Functions
        if (normalizedQuery.aggregate) {
            for (const agg of normalizedQuery.aggregate) {
                // func: 'sum', field: 'amount', alias: 'total'
                const rawFunc = this.mapAggregateFunc(agg.func); 
                if (agg.alias) {
                    builder.select(this.knex.raw(`${rawFunc}(??) as ??`, [agg.field, agg.alias]));
                } else {
                    builder.select(this.knex.raw(`${rawFunc}(??)`, [agg.field]));
                }
            }
        }

        return await builder;
    }

    private mapAggregateFunc(func: string) {
        switch(func) {
            case 'count': return 'count';
            case 'sum': return 'sum';
            case 'avg': return 'avg';
            case 'min': return 'min';
            case 'max': return 'max';
            default: throw new Error(`Unsupported aggregate function: ${func}`);
        }
    }
    
    // Bulk Operations
    async createMany(objectName: string, data: any[], options?: any): Promise<any> {
        const builder = this.getBuilder(objectName, options);
        return await builder.insert(data).returning('*');
    }
    
    async updateMany(objectName: string, filters: any, data: any, options?: any): Promise<any> {
        const builder = this.getBuilder(objectName, options);
        if(filters) this.applyFilters(builder, filters);
        return await builder.update(data);
    }
    
    async deleteMany(objectName: string, filters: any, options?: any): Promise<any> {
        const builder = this.getBuilder(objectName, options);
        if(filters) this.applyFilters(builder, filters);
        return await builder.delete();
    }

    async init(objects: any[]): Promise<void> {
        await this.ensureDatabaseExists();

        for (const obj of objects) {
            const tableName = obj.name;
            
            // Cache JSON fields
            const jsonCols: string[] = [];
            if (obj.fields) {
                for (const [name, field] of Object.entries<any>(obj.fields)) {
                     const type = field.type || 'string';
                     if (this.isJsonField(type, field)) {
                         jsonCols.push(name);
                     }
                }
            }
            this.jsonFields[tableName] = jsonCols;

            let exists = await this.knex.schema.hasTable(tableName);
            
            if (exists) {
                 const columnInfo = await this.knex(tableName).columnInfo();
                 const existingColumns = Object.keys(columnInfo);
                 
                 // Check for _id vs id conflict (Legacy _id from mongo-style init)
                 if (existingColumns.includes('_id') && !existingColumns.includes('id')) {
                     console.log(`[SqlDriver] Detected legacy '_id' in '${tableName}'. Recreating table for 'id' compatibility...`);
                     await this.knex.schema.dropTable(tableName);
                     exists = false;
                 }
            }
            
            if (!exists) {
                await this.knex.schema.createTable(tableName, (table) => {
                    // Use standard 'id' for SQL databases
                    table.string('id').primary(); 
                    table.timestamp('created_at').defaultTo(this.knex.fn.now());
                    table.timestamp('updated_at').defaultTo(this.knex.fn.now());
                    if (obj.fields) {
                        for (const [name, field] of Object.entries(obj.fields)) {
                            this.createColumn(table, name, field);
                        }
                    }
                });
                console.log(`[SqlDriver] Created table '${tableName}'`);
            } else {
                 const columnInfo = await this.knex(tableName).columnInfo();
                 const existingColumns = Object.keys(columnInfo);
                 
                 await this.knex.schema.alterTable(tableName, (table) => {
                     if (obj.fields) {
                         for (const [name, field] of Object.entries(obj.fields)) {
                             if (!existingColumns.includes(name)) {
                                 this.createColumn(table, name, field);
                                 console.log(`[SqlDriver] Added column '${name}' to '${tableName}'`);
                             }
                         }
                     }
                 });
            }
        }
    }

    private createColumn(table: Knex.CreateTableBuilder, name: string, field: any) {
        if (field.multiple) {
            table.json(name);
            return;
        }

        const type = field.type || 'string';
        let col;
        switch(type) {
            case 'string': 
            case 'email':
            case 'url':
            case 'phone':
            case 'password':
                col = table.string(name); break;
            case 'text': 
            case 'textarea': 
            case 'html': 
            case 'markdown':
                col = table.text(name); break;
            case 'integer': 
            case 'int': col = table.integer(name); break;
            case 'float': 
            case 'number': 
            case 'currency':
            case 'percent': col = table.float(name); break;
            case 'boolean': col = table.boolean(name); break;
            case 'date': col = table.date(name); break;
            case 'datetime': col = table.timestamp(name); break;
            case 'time': col = table.time(name); break;
            case 'json': 
            case 'object':
            case 'array': 
            case 'image':
            case 'file':
            case 'avatar':
            case 'location': col = table.json(name); break;
            case 'lookup': 
                col = table.string(name);
                if (field.reference_to) {
                    table.foreign(name).references('id').inTable(field.reference_to);
                }
                break;
            case 'summary': col = table.float(name); break; // Stored calculation result
            case 'auto_number': col = table.string(name); break; // Generated string
            case 'formula': return; // Virtual field, do not create column
            default: col = table.string(name);
        }

        if (field.unique) {
            col.unique();
        }
        if (field.required) {
            col.notNullable();
        }
    }

    private async ensureDatabaseExists() {
        if (this.config.client !== 'pg' && this.config.client !== 'postgresql') return;
        
        try {
            await this.knex.raw('SELECT 1');
        } catch (e: any) {
            if (e.code === '3D000') { // Database does not exist
                 await this.createDatabase();
            } else {
                throw e;
            }
        }
    }

    private async createDatabase() {
        const config = this.config;
        const connection = config.connection;
        let dbName = '';
        let adminConfig = { ...config };

        if (typeof connection === 'string') {
            const url = new URL(connection);
            dbName = url.pathname.slice(1);
            url.pathname = '/postgres';
            adminConfig.connection = url.toString();
        } else {
            dbName = connection.database;
            adminConfig.connection = { ...connection, database: 'postgres' };
        }

        console.log(`[SqlDriver] Database '${dbName}' does not exist. Creating...`);

        const adminKnex = knex(adminConfig);
        try {
            await adminKnex.raw(`CREATE DATABASE "${dbName}"`);
            console.log(`[SqlDriver] Database '${dbName}' created successfully.`);
        } catch (e: any) {
             console.error(`[SqlDriver] Failed to create database '${dbName}':`, e.message);
             if (e.code === '42501') {
                 console.error(`[SqlDriver] Hint: The user '${adminConfig.connection.user || 'current user'}' does not have CREATEDB privileges.`);
                 console.error(`[SqlDriver] Please run: createdb ${dbName}`);
             }
             throw e;
        } finally {
            await adminKnex.destroy();
        }
    }

    private isJsonField(type: string, field: any) {
        return ['json', 'object', 'array', 'image', 'file', 'avatar', 'location'].includes(type) || field.multiple;
    }

    private formatInput(objectName: string, data: any) {
        // Only needed for SQLite usually, PG handles JSON
        const isSqlite = this.config.client === 'sqlite3';
        if (!isSqlite) return data;
        
        const fields = this.jsonFields[objectName];
        if (!fields || fields.length === 0) return data;

        const copy = { ...data };
        for (const field of fields) {
            if (copy[field] !== undefined && typeof copy[field] === 'object' && copy[field] !== null) {
                copy[field] = JSON.stringify(copy[field]);
            }
        }
        return copy;
    }

    private formatOutput(objectName: string, data: any) {
        if (!data) return data;

        const isSqlite = this.config.client === 'sqlite3';
        if (!isSqlite) return data;

        const fields = this.jsonFields[objectName];
        if (!fields || fields.length === 0) return data;

        // data is a single row object
        for (const field of fields) {
            if (data[field] !== undefined && typeof data[field] === 'string') {
                try {
                    data[field] = JSON.parse(data[field]);
                } catch (e) {
                    // ignore parse error, keep as string
                }
            }
        }
        return data;
    }

    /**
     * Introspect the database schema to discover existing tables, columns, and relationships.
     */
    async introspectSchema(): Promise<IntrospectedSchema> {
        const tables: Record<string, IntrospectedTable> = {};
        
        // Get list of all tables
        let tableNames: string[] = [];
        
        if (this.config.client === 'pg' || this.config.client === 'postgresql') {
            const result = await this.knex.raw(`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_type = 'BASE TABLE'
            `);
            tableNames = result.rows.map((row: any) => row.table_name);
        } else if (this.config.client === 'mysql' || this.config.client === 'mysql2') {
            const result = await this.knex.raw(`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = DATABASE()
                AND table_type = 'BASE TABLE'
            `);
            tableNames = result[0].map((row: any) => row.TABLE_NAME);
        } else if (this.config.client === 'sqlite3') {
            const result = await this.knex.raw(`
                SELECT name as table_name 
                FROM sqlite_master 
                WHERE type='table' 
                AND name NOT LIKE 'sqlite_%'
            `);
            tableNames = result.map((row: any) => row.table_name);
        }
        
        // For each table, get columns and foreign keys
        for (const tableName of tableNames) {
            const columns = await this.introspectColumns(tableName);
            const foreignKeys = await this.introspectForeignKeys(tableName);
            const primaryKeys = await this.introspectPrimaryKeys(tableName);
            const uniqueConstraints = await this.introspectUniqueConstraints(tableName);
            
            // Update columns with primary key and unique information
            for (const col of columns) {
                if (primaryKeys.includes(col.name)) {
                    col.isPrimary = true;
                }
                if (uniqueConstraints.includes(col.name)) {
                    col.isUnique = true;
                }
            }
            
            tables[tableName] = {
                name: tableName,
                columns,
                foreignKeys,
                primaryKeys
            };
        }
        
        return { tables };
    }
    
    /**
     * Get column information for a specific table.
     */
    private async introspectColumns(tableName: string): Promise<IntrospectedColumn[]> {
        const columnInfo = await this.knex(tableName).columnInfo();
        const columns: IntrospectedColumn[] = [];
        
        for (const [colName, info] of Object.entries<any>(columnInfo)) {
            let type = 'string';
            let maxLength: number | undefined;
            
            // Map database type to a generic type string
            if (this.config.client === 'sqlite3') {
                type = info.type?.toLowerCase() || 'string';
            } else if (this.config.client === 'pg' || this.config.client === 'postgresql') {
                type = info.type || 'string';
            } else if (this.config.client === 'mysql' || this.config.client === 'mysql2') {
                type = info.type || 'string';
            }
            
            // Extract max length if available
            if (info.maxLength) {
                maxLength = info.maxLength;
            }
            
            columns.push({
                name: colName,
                type,
                nullable: info.nullable !== false,
                defaultValue: info.defaultValue,
                isPrimary: false, // Will be set by introspectPrimaryKeys
                isUnique: false,
                maxLength
            });
        }
        
        return columns;
    }
    
    /**
     * Get foreign key information for a specific table.
     */
    private async introspectForeignKeys(tableName: string): Promise<IntrospectedForeignKey[]> {
        const foreignKeys: IntrospectedForeignKey[] = [];
        
        try {
            if (this.config.client === 'pg' || this.config.client === 'postgresql') {
                const result = await this.knex.raw(`
                    SELECT
                        kcu.column_name,
                        ccu.table_name AS referenced_table,
                        ccu.column_name AS referenced_column,
                        tc.constraint_name
                    FROM information_schema.table_constraints AS tc
                    JOIN information_schema.key_column_usage AS kcu
                        ON tc.constraint_name = kcu.constraint_name
                        AND tc.table_schema = kcu.table_schema
                    JOIN information_schema.constraint_column_usage AS ccu
                        ON ccu.constraint_name = tc.constraint_name
                        AND ccu.table_schema = tc.table_schema
                    WHERE tc.constraint_type = 'FOREIGN KEY'
                        AND tc.table_name = ?
                `, [tableName]);
                
                for (const row of result.rows) {
                    foreignKeys.push({
                        columnName: row.column_name,
                        referencedTable: row.referenced_table,
                        referencedColumn: row.referenced_column,
                        constraintName: row.constraint_name
                    });
                }
            } else if (this.config.client === 'mysql' || this.config.client === 'mysql2') {
                const result = await this.knex.raw(`
                    SELECT
                        COLUMN_NAME as column_name,
                        REFERENCED_TABLE_NAME as referenced_table,
                        REFERENCED_COLUMN_NAME as referenced_column,
                        CONSTRAINT_NAME as constraint_name
                    FROM information_schema.KEY_COLUMN_USAGE
                    WHERE TABLE_SCHEMA = DATABASE()
                        AND TABLE_NAME = ?
                        AND REFERENCED_TABLE_NAME IS NOT NULL
                `, [tableName]);
                
                for (const row of result[0]) {
                    foreignKeys.push({
                        columnName: row.column_name,
                        referencedTable: row.referenced_table,
                        referencedColumn: row.referenced_column,
                        constraintName: row.constraint_name
                    });
                }
            } else if (this.config.client === 'sqlite3') {
                // SQLite PRAGMA doesn't support parameter binding, so we need to ensure safe identifier.
                // First, verify that the requested table actually exists using a parameterized query.
                const tableExistsResult = await this.knex.raw(
                    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
                    [tableName]
                );
                
                if (!Array.isArray(tableExistsResult) || tableExistsResult.length === 0) {
                    // If the table does not exist, there are no foreign keys to introspect.
                    return foreignKeys;
                }
                
                // Table names in ObjectQL are validated and should be safe, but we add extra protection
                const safeTableName = tableName.replace(/[^a-zA-Z0-9_]/g, '');
                const result = await this.knex.raw(`PRAGMA foreign_key_list(${safeTableName})`);
                
                for (const row of result) {
                    foreignKeys.push({
                        columnName: row.from,
                        referencedTable: row.table,
                        referencedColumn: row.to,
                        constraintName: `fk_${tableName}_${row.from}`
                    });
                }
            }
        } catch (error) {
            console.warn('Could not introspect foreign keys for requested table:', error);
        }
        
        return foreignKeys;
    }
    
    /**
     * Get primary key information for a specific table.
     */
    private async introspectPrimaryKeys(tableName: string): Promise<string[]> {
        const primaryKeys: string[] = [];
        
        try {
            if (this.config.client === 'pg' || this.config.client === 'postgresql') {
                const result = await this.knex.raw(`
                    SELECT a.attname as column_name
                    FROM pg_index i
                    JOIN pg_attribute a ON a.attrelid = i.indrelid
                        AND a.attnum = ANY(i.indkey)
                    WHERE i.indrelid = ?::regclass
                        AND i.indisprimary
                `, [tableName]);
                
                for (const row of result.rows) {
                    primaryKeys.push(row.column_name);
                }
            } else if (this.config.client === 'mysql' || this.config.client === 'mysql2') {
                const result = await this.knex.raw(`
                    SELECT COLUMN_NAME as column_name
                    FROM information_schema.KEY_COLUMN_USAGE
                    WHERE TABLE_SCHEMA = DATABASE()
                        AND TABLE_NAME = ?
                        AND CONSTRAINT_NAME = 'PRIMARY'
                `, [tableName]);
                
                for (const row of result[0]) {
                    primaryKeys.push(row.column_name);
                }
            } else if (this.config.client === 'sqlite3') {
                // SQLite PRAGMA doesn't support parameter binding, so we need to ensure safe identifier
                const safeTableName = tableName.replace(/[^a-zA-Z0-9_]/g, '');
                
                // Validate that the sanitized table name exists in the database before using it in PRAGMA
                const tablesResult = await this.knex.raw("SELECT name FROM sqlite_master WHERE type = 'table'");
                const tableNames = Array.isArray(tablesResult) ? tablesResult.map((row: any) => row.name) : [];
                
                if (!tableNames.includes(safeTableName)) {
                    console.warn('Could not introspect primary keys: table name contains invalid characters or table does not exist.');
                    return primaryKeys;
                }
                
                const result = await this.knex.raw(`PRAGMA table_info(${safeTableName})`);
                
                for (const row of result) {
                    if (row.pk === 1) {
                        primaryKeys.push(row.name);
                    }
                }
            }
        } catch (error) {
            console.warn('Could not introspect primary keys for a table:', error);
        }
        
        return primaryKeys;
    }

    /**
     * Get unique constraint information for a specific table.
     */
    private async introspectUniqueConstraints(tableName: string): Promise<string[]> {
        const uniqueColumns: string[] = [];
        
        try {
            if (this.config.client === 'pg' || this.config.client === 'postgresql') {
                const result = await this.knex.raw(`
                    SELECT c.column_name
                    FROM information_schema.table_constraints tc
                    JOIN information_schema.constraint_column_usage AS ccu 
                        ON tc.constraint_schema = ccu.constraint_schema
                        AND tc.constraint_name = ccu.constraint_name
                    WHERE tc.constraint_type = 'UNIQUE' 
                        AND tc.table_name = ?
                `, [tableName]);
                
                for (const row of result.rows) {
                    uniqueColumns.push(row.column_name);
                }
            } else if (this.config.client === 'mysql' || this.config.client === 'mysql2') {
                const result = await this.knex.raw(`
                    SELECT COLUMN_NAME
                    FROM information_schema.TABLE_CONSTRAINTS tc
                    JOIN information_schema.KEY_COLUMN_USAGE kcu
                        USING (CONSTRAINT_NAME, TABLE_SCHEMA, TABLE_NAME)
                    WHERE CONSTRAINT_TYPE = 'UNIQUE'
                        AND TABLE_SCHEMA = DATABASE()
                        AND TABLE_NAME = ?
                `, [tableName]);
                
                for (const row of result[0]) {
                    uniqueColumns.push(row.COLUMN_NAME);
                }
            } else if (this.config.client === 'sqlite3') {
                const safeTableName = tableName.replace(/[^a-zA-Z0-9_]/g, '');
                
                // Validate table exists
                const tablesResult = await this.knex.raw("SELECT name FROM sqlite_master WHERE type = 'table'");
                const tableNames = Array.isArray(tablesResult) ? tablesResult.map((row: any) => row.name) : [];
                
                if (!tableNames.includes(safeTableName)) {
                    return uniqueColumns;
                }

                const indexes = await this.knex.raw(`PRAGMA index_list(${safeTableName})`);
                
                for (const idx of indexes) {
                     // Check if unique
                    if (idx.unique === 1) {
                         const info = await this.knex.raw(`PRAGMA index_info(${idx.name})`);
                         // Only handle single column unique constraints for now
                         if (info.length === 1) {
                             uniqueColumns.push(info[0].name);
                         }
                    }
                }
            }
        } catch (error) {
            console.warn('Could not introspect unique constraints for a table:', error);
        }
        
        return uniqueColumns;
    }

    /**
     * Connect to the database (optional - connection is established in constructor)
     * This method is here for DriverInterface compatibility.
     */
    async connect(): Promise<void> {
        // Connection is already established in constructor via Knex
        // This is a no-op for compatibility with DriverInterface
        return Promise.resolve();
    }

    /**
     * Check database connection health
     */
    async checkHealth(): Promise<boolean> {
        try {
            await this.knex.raw('SELECT 1');
            return true;
        } catch (error) {
            return false;
        }
    }

    async disconnect() {
        await this.knex.destroy();
    }

    /**
     * Execute a query using QueryAST (DriverInterface v4.0 method)
     * 
     * This is the new standard method for query execution using the
     * ObjectStack QueryAST format. It provides a unified interface
     * across all drivers.
     * 
     * @param ast - The QueryAST representing the query
     * @param options - Optional execution options (transaction, etc.)
     * @returns Query results with value and count
     */
    async executeQuery(ast: QueryAST, options?: any): Promise<{ value: any[]; count?: number }> {
        const objectName = ast.object || '';
        
        // Convert QueryAST to legacy query format for internal processing
        const legacyQuery: any = {
            fields: ast.fields,
            filters: this.convertFilterNodeToLegacy(ast.filters),
            sort: ast.sort?.map(s => [s.field, s.order]),
            limit: ast.top,
            offset: ast.skip,
        };
        
        // Use existing find method for execution
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
                    // Bulk insert using Knex
                    const builder = this.getBuilder(command.object, cmdOptions);
                    const formatted = command.records.map(r => this.formatInput(command.object, r));
                    const bulkCreated = await builder.insert(formatted).returning('*');
                    return {
                        success: true,
                        data: bulkCreated,
                        affected: command.records.length
                    };
                
                case 'bulkUpdate':
                    if (!command.updates || !Array.isArray(command.updates)) {
                        throw new Error('BulkUpdate command requires updates array');
                    }
                    // Execute updates sequentially (Knex doesn't support batch update well)
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
                    // Bulk delete using whereIn
                    const deleteBuilder = this.getBuilder(command.object, cmdOptions);
                    const deleted = await deleteBuilder.whereIn('id', command.ids).delete();
                    return {
                        success: true,
                        affected: deleted || command.ids.length
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
                // NOT is more complex - we'll need to negate the inner condition
                // For now, we'll just process the children
                if (node.children && node.children.length > 0) {
                    return this.convertFilterNodeToLegacy(node.children[0]);
                }
                return undefined;
            
            default:
                return undefined;
        }
    }

    /**
     * Execute raw SQL (DriverInterface compatibility method)
     * 
     * @param command - SQL query string
     * @param parameters - Query parameters
     * @param options - Execution options
     */
    async execute(command: any, parameters?: any[], options?: any): Promise<any> {
        const builder = options?.transaction 
            ? this.knex.raw(command, parameters || []).transacting(options.transaction)
            : this.knex.raw(command, parameters || []);
        
        return await builder;
    }
}


/**
 * @deprecated Use SqlDriver instead.
 */
export { SqlDriver as KnexDriver };
