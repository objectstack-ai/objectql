/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Driver, DriverCapabilities, ObjectQLError } from '@objectql/types';
import { SqlDriver } from '@objectql/driver-sql';
import { checkWebAssembly, checkIndexedDB, checkOPFS } from './environment';
import { loadWasmModule } from './wasm-loader';
import { createPGliteKnexConfig } from './knex-adapter';

/**
 * Configuration for PostgreSQL WASM Driver
 */
export interface PgWasmDriverConfig {
    /** Storage backend: 'idb' for IndexedDB, 'opfs' for OPFS, 'memory' for ephemeral. Default: 'idb' */
    storage?: 'idb' | 'opfs' | 'memory';
    /** Database name. Default: 'objectql' */
    database?: string;
    /** Enable PGlite extensions (e.g., 'vector', 'postgis'). Default: [] */
    extensions?: string[];
}

/**
 * PostgreSQL WASM Driver for ObjectQL
 * 
 * Browser-native PostgreSQL database driver using WebAssembly and IndexedDB/OPFS persistence.
 * 
 * Architecture:
 * - Composes SqlDriver from @objectql/driver-sql for all query logic
 * - Uses PGlite for the WASM PostgreSQL implementation
 * - Supports IndexedDB (default), OPFS, or memory storage
 * - Reuses the entire Knex compilation pipeline via custom client adapter
 * 
 * Key Design Principles:
 * - Composition pattern: wraps SqlDriver, delegates all query building
 * - Library-agnostic API: references "PostgreSQL WASM", not "PGlite"
 * - PGlite-specific extensions exposed via config but not bundled by default
 * - ~3MB bundle size acceptable for apps needing PostgreSQL features
 * 
 * @version 4.2.0
 */
export class PgWasmDriver implements Driver {
    // Driver metadata
    public readonly name = 'PgWasmDriver';
    public readonly version = '4.2.0';
    public readonly supports: DriverCapabilities = {
        create: true,
        read: true,
        update: true,
        delete: true,
        bulkCreate: true,
        bulkUpdate: true,
        bulkDelete: true,
        transactions: true,
        savepoints: true,
        isolationLevels: ['read_uncommitted', 'read_committed', 'repeatable_read', 'serializable'],
        queryFilters: true,
        queryAggregations: true,
        querySorting: true,
        queryPagination: true,
        queryWindowFunctions: true,
        querySubqueries: true,
        queryCTE: true,
        joins: true,
        fullTextSearch: true,
        jsonQuery: true,
        jsonFields: true,
        arrayFields: true,
        streaming: false,
        schemaSync: true,
        migrations: true,
        indexes: true,
        connectionPooling: false,
        preparedStatements: true,
        queryCache: false
    };

    private config: Required<PgWasmDriverConfig>;
    private sqlDriver: SqlDriver | null = null;
    private pglite: any = null;
    private initialized = false;

    constructor(config: PgWasmDriverConfig = {}) {
        // Check environment before anything else
        checkWebAssembly();
        
        this.config = {
            storage: config.storage || 'idb',
            database: config.database || 'objectql',
            extensions: config.extensions || []
        };
    }

    /**
     * Initialize the WASM module and database
     * 
     * This method sets up the PGlite connection and creates a SqlDriver instance
     * that will handle all query compilation and execution.
     */
    private async initialize(): Promise<void> {
        if (this.initialized) return;

        // Auto-detect storage if needed
        if (this.config.storage === 'idb') {
            const hasIDB = await checkIndexedDB();
            if (!hasIDB) {
                const hasOPFS = await checkOPFS();
                if (hasOPFS) {
                    this.config.storage = 'opfs';
                } else {
                    this.config.storage = 'memory';
                }
            }
        } else if (this.config.storage === 'opfs') {
            const hasOPFS = await checkOPFS();
            if (!hasOPFS) {
                const hasIDB = await checkIndexedDB();
                if (hasIDB) {
                    this.config.storage = 'idb';
                } else {
                    this.config.storage = 'memory';
                }
            }
        }

        // Load PGlite WASM module
        const PGlite = await loadWasmModule();
        
        // Determine the data directory based on storage backend
        let dataDir: string;
        if (this.config.storage === 'memory') {
            dataDir = 'memory://';
        } else if (this.config.storage === 'opfs') {
            dataDir = `opfs-ahp://${this.config.database}`;
        } else {
            // IndexedDB
            dataDir = `idb://${this.config.database}`;
        }

        // Initialize PGlite with extensions
        const options: any = {
            dataDir
        };
        
        if (this.config.extensions.length > 0) {
            options.extensions = this.config.extensions;
        }

        this.pglite = new PGlite(options);
        
        // Wait for PGlite to be ready
        await this.pglite.waitReady;

        // Create SqlDriver with custom Knex configuration for PGlite
        const knexConfig = createPGliteKnexConfig(this.pglite);
        this.sqlDriver = new SqlDriver(knexConfig);

        this.initialized = true;
    }

    // ========================================================================
    // Driver Interface Implementation (delegates to SqlDriver)
    // ========================================================================

    async connect(): Promise<void> {
        await this.initialize();
    }

    async disconnect(): Promise<void> {
        if (this.sqlDriver) {
            await (this.sqlDriver as any).knex?.destroy();
        }
        if (this.pglite) {
            await this.pglite.close();
        }
        this.sqlDriver = null;
        this.pglite = null;
        this.initialized = false;
    }

    async checkHealth(): Promise<boolean> {
        try {
            await this.initialize();
            // Simple health check - ensure we can query
            const knex = (this.sqlDriver as any)?.knex;
            if (knex) {
                await knex.raw('SELECT 1');
                return true;
            }
            return false;
        } catch {
            return false;
        }
    }

    async find(objectName: string, query: any, options?: any): Promise<any[]> {
        await this.initialize();
        return this.sqlDriver!.find(objectName, query, options);
    }

    async findOne(objectName: string, id: string | number, query?: any, options?: any): Promise<any> {
        await this.initialize();
        return this.sqlDriver!.findOne(objectName, id, query, options);
    }

    async create(objectName: string, data: any, options?: any): Promise<any> {
        await this.initialize();
        return this.sqlDriver!.create(objectName, data, options);
    }

    async update(objectName: string, id: string | number, data: any, options?: any): Promise<any> {
        await this.initialize();
        return this.sqlDriver!.update(objectName, id, data, options);
    }

    async delete(objectName: string, id: string | number, options?: any): Promise<any> {
        await this.initialize();
        return this.sqlDriver!.delete(objectName, id, options);
    }

    async count(objectName: string, filters: any, options?: any): Promise<number> {
        await this.initialize();
        return this.sqlDriver!.count(objectName, filters, options);
    }

    async bulkCreate(objectName: string, data: any[], options?: any): Promise<any> {
        await this.initialize();
        // SqlDriver doesn't have bulkCreate, so we'll use create in a loop
        const results = [];
        for (const item of data) {
            const result = await this.sqlDriver!.create(objectName, item, options);
            results.push(result);
        }
        return results;
    }

    async bulkUpdate(objectName: string, updates: Array<{id: string | number, data: any}>, options?: any): Promise<any> {
        await this.initialize();
        // SqlDriver doesn't have bulkUpdate, so we'll use update in a loop
        const results = [];
        for (const update of updates) {
            const result = await this.sqlDriver!.update(objectName, update.id, update.data, options);
            results.push(result);
        }
        return results;
    }

    async bulkDelete(objectName: string, ids: Array<string | number>, options?: any): Promise<any> {
        await this.initialize();
        // SqlDriver doesn't have bulkDelete, so we'll use delete in a loop
        const results = [];
        for (const id of ids) {
            const result = await this.sqlDriver!.delete(objectName, id, options);
            results.push(result);
        }
        return results;
    }

    async distinct(objectName: string, field: string, filters?: any, options?: any): Promise<any[]> {
        await this.initialize();
        return this.sqlDriver!.distinct?.(objectName, field, filters, options) || [];
    }

    async aggregate(objectName: string, query: any, options?: any): Promise<any[]> {
        await this.initialize();
        return this.sqlDriver!.aggregate?.(objectName, query, options) || [];
    }

    async init(objects: any[]): Promise<void> {
        await this.initialize();
        return this.sqlDriver!.init?.(objects);
    }

    async executeQuery(ast: any, options?: any): Promise<{ value: any[]; count?: number }> {
        await this.initialize();
        return this.sqlDriver!.executeQuery?.(ast, options) || { value: [] };
    }

    async executeCommand(command: any, options?: any): Promise<{ success: boolean; data?: any; affected: number }> {
        await this.initialize();
        return this.sqlDriver!.executeCommand?.(command, options) || { success: false, affected: 0 };
    }

    async introspectSchema(): Promise<any> {
        await this.initialize();
        return this.sqlDriver!.introspectSchema?.();
    }

    async beginTransaction(): Promise<any> {
        await this.initialize();
        return this.sqlDriver!.beginTransaction?.();
    }

    async commitTransaction(transaction: any): Promise<void> {
        await this.initialize();
        return this.sqlDriver!.commitTransaction?.(transaction);
    }

    async rollbackTransaction(transaction: any): Promise<void> {
        await this.initialize();
        return this.sqlDriver!.rollbackTransaction?.(transaction);
    }

    /**
     * Execute raw SQL query (PostgreSQL-specific)
     * Useful for JSONB operations, full-text search, etc.
     */
    async query(sql: string, params?: any[]): Promise<any[]> {
        await this.initialize();
        const result = await this.pglite.query(sql, params);
        return result.rows || [];
    }

    /**
     * Execute JSONB query operations (PostgreSQL-specific feature)
     */
    async jsonbQuery(objectName: string, jsonbField: string, query: any): Promise<any[]> {
        await this.initialize();
        // Example: SELECT * FROM objectName WHERE jsonbField @> '{"key": "value"}'::jsonb
        const jsonbLiteral = JSON.stringify(query);
        const sql = `SELECT * FROM ${objectName} WHERE ${jsonbField} @> $1::jsonb`;
        return this.query(sql, [jsonbLiteral]);
    }

    /**
     * Execute full-text search (PostgreSQL-specific feature)
     */
    async fullTextSearch(objectName: string, searchField: string, searchQuery: string): Promise<any[]> {
        await this.initialize();
        // Example: SELECT * FROM objectName WHERE to_tsvector('english', searchField) @@ plainto_tsquery('english', 'search query')
        const sql = `SELECT * FROM ${objectName} WHERE to_tsvector('english', ${searchField}) @@ plainto_tsquery('english', $1)`;
        return this.query(sql, [searchQuery]);
    }
}

// Re-export types and utilities
export { PgWasmDriverConfig as Config };
export { checkWebAssembly, checkIndexedDB, checkOPFS, detectStorageBackend } from './environment';
export { loadWasmModule } from './wasm-loader';
