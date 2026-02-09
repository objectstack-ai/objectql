/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ObjectQLError } from '@objectql/types';

/**
 * Custom Knex client adapter for wa-sqlite
 * 
 * This adapter bridges the wa-sqlite API with Knex's expected client interface,
 * allowing us to reuse the entire SQL compilation pipeline from @objectql/driver-sql.
 */
export class WaSqliteClient {
    private db: any;
    private sqlite3: any;

    constructor(db: any, sqlite3: any) {
        this.db = db;
        this.sqlite3 = sqlite3;
    }

    /**
     * Execute a raw SQL query (used by Knex internally)
     */
    async _query(connection: any, sql: string, bindings?: any[]): Promise<any> {
        const stmt = await this.sqlite3.prepare(this.db, sql);
        
        try {
            // Bind parameters if provided
            if (bindings && bindings.length > 0) {
                this.sqlite3.bind_collection(stmt, bindings);
            }

            const rows: any[] = [];
            
            // Execute and fetch all rows
            while (await this.sqlite3.step(stmt) === this.sqlite3.SQLITE_ROW) {
                const row: any = {};
                const columnCount = this.sqlite3.column_count(stmt);
                
                for (let i = 0; i < columnCount; i++) {
                    const name = this.sqlite3.column_name(stmt, i);
                    const value = this.sqlite3.column(stmt, i);
                    row[name] = value;
                }
                
                rows.push(row);
            }

            return { rows };
        } finally {
            await this.sqlite3.finalize(stmt);
        }
    }

    /**
     * Execute a query and return the result
     */
    async query(sql: string, bindings?: any[]): Promise<any> {
        return this._query(this.db, sql, bindings);
    }

    /**
     * Close the database connection
     */
    async close(): Promise<void> {
        if (this.db) {
            await this.sqlite3.close(this.db);
            this.db = null;
        }
    }
}

/**
 * Create a Knex-compatible dialect configuration for wa-sqlite
 */
export function createKnexDialect(db: any, sqlite3: any): any {
    const client = new WaSqliteClient(db, sqlite3);

    return {
        client: 'sqlite3',
        connection: {
            filename: ':memory:' // Placeholder - actual storage handled by wa-sqlite
        },
        useNullAsDefault: true,
        // Custom query execution
        _driver: () => ({
            Client: class {
                acquireConnection(): Promise<any> {
                    return Promise.resolve(client);
                }
                releaseConnection(): Promise<void> {
                    return Promise.resolve();
                }
                destroy(): Promise<void> {
                    return client.close();
                }
            }
        })
    };
}

/**
 * Knex client class that wraps wa-sqlite
 * This is used as a custom client for Knex
 */
export class KnexWaSqliteClient {
    private client: WaSqliteClient;

    constructor(config: { db: any; sqlite3: any }) {
        this.client = new WaSqliteClient(config.db, config.sqlite3);
    }

    async acquireConnection(): Promise<WaSqliteClient> {
        return this.client;
    }

    async releaseConnection(_connection: WaSqliteClient): Promise<void> {
        // No-op for single connection
    }

    async destroy(): Promise<void> {
        await this.client.close();
    }

    processResponse(obj: any, _runner: any): any {
        if (obj && obj.rows) {
            return obj.rows;
        }
        return obj;
    }

    _stream(_connection: any, _obj: any, _stream: any, _options: any): any {
        throw new ObjectQLError({ code: 'DRIVER_UNSUPPORTED_OPERATION', message: 'Streaming is not supported in wa-sqlite adapter' });
    }

    canCancelQuery = false;
}
