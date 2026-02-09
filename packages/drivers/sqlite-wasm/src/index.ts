/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Driver, DriverCapabilities } from '@objectql/types';
import { SqlDriver } from '@objectql/driver-sql';
import { checkWebAssembly, checkOPFS } from './environment';

/**
 * Configuration for SQLite WASM Driver
 */
export interface SqliteWasmDriverConfig {
    /** Storage backend: 'opfs' for persistent, 'memory' for ephemeral. Default: 'opfs' */
    storage?: 'opfs' | 'memory';
    /** Database filename in OPFS. Default: 'objectql.db' */
    filename?: string;
    /** Enable WAL mode for better read concurrency. Default: true */
    walMode?: boolean;
    /** Page size in bytes. Default: 4096 */
    pageSize?: number;
}

/**
 * SQLite WASM Driver for ObjectQL
 * 
 * Browser-native SQL database driver using WebAssembly and OPFS persistence.
 * 
 * Architecture:
 * - Composes SqlDriver from @objectql/driver-sql for all query logic
 * - Uses wa-sqlite for the WASM SQLite implementation
 * - Supports OPFS for persistent storage or memory for ephemeral
 * - Reuses the entire Knex compilation pipeline via custom client adapter
 * 
 * Note: This is the initial implementation. Full wa-sqlite integration with OPFS
 * requires a browser runtime environment. The driver composition pattern is in place,
 * and the actual WASM integration will be completed once the package is built and
 * tested in a browser environment.
 * 
 * @version 4.2.0
 */
export class SqliteWasmDriver implements Driver {
    // Driver metadata
    public readonly name = 'SqliteWasmDriver';
    public readonly version = '4.2.0';
    public readonly supports: DriverCapabilities = {
        create: true,
        read: true,
        update: true,
        delete: true,
        bulkCreate: true,
        bulkUpdate: true,
        bulkDelete: true,
        transactions: false, // wa-sqlite with single connection doesn't support full transactions
        savepoints: false,
        queryFilters: true,
        queryAggregations: true,
        querySorting: true,
        queryPagination: true,
        queryWindowFunctions: true,
        querySubqueries: true,
        queryCTE: true,
        joins: true,
        fullTextSearch: true,
        jsonFields: true,
        arrayFields: false,
        streaming: false,
        schemaSync: true,
        migrations: true,
        indexes: true,
        connectionPooling: false,
        preparedStatements: true,
        queryCache: false
    };

    private config: SqliteWasmDriverConfig;
    private sqlDriver: SqlDriver | null = null;
    private initialized = false;

    constructor(config: SqliteWasmDriverConfig = {}) {
        // Check environment before anything else
        checkWebAssembly();
        
        this.config = {
            storage: config.storage || 'opfs',
            filename: config.filename || 'objectql.db',
            walMode: config.walMode !== false,
            pageSize: config.pageSize || 4096
        };
    }

    /**
     * Initialize the WASM module and database
     * 
     * This method sets up the wa-sqlite connection and creates a SqlDriver instance
     * that will handle all query compilation and execution.
     */
    private async initialize(): Promise<void> {
        if (this.initialized) return;

        // Auto-detect storage if needed
        if (this.config.storage === 'opfs') {
            const hasOPFS = await checkOPFS();
            if (!hasOPFS) {
                this.config.storage = 'memory';
            }
        }

        // For now, we create a simple SqlDriver that uses an in-memory SQLite database
        // This demonstrates the composition pattern
        // Full wa-sqlite integration with OPFS will be added in browser environment testing
        this.sqlDriver = new SqlDriver({
            client: 'sqlite3',
            connection: {
                filename: ':memory:'
            },
            useNullAsDefault: true
        });

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
        this.sqlDriver = null;
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
}

// Re-export types and utilities
export { SqliteWasmDriverConfig as Config };
export { checkWebAssembly, checkOPFS, detectStorageBackend } from './environment';
