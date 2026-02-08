/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Custom Knex client adapter for PGlite
 * 
 * This adapter bridges Knex's PostgreSQL dialect with PGlite's WASM API.
 * It allows us to reuse all of SqlDriver's query compilation logic while
 * executing queries through PGlite instead of the standard pg driver.
 */

import { Knex } from 'knex';

/**
 * PGlite connection wrapper for Knex
 * 
 * This wrapper makes PGlite compatible with the node-postgres (pg) driver interface
 * that Knex expects when using client: 'pg'.
 */
export class PGliteConnection {
    private db: any;
    
    constructor(db: any) {
        this.db = db;
    }
    
    /**
     * Execute a raw SQL query
     * This matches the pg driver's query method signature
     */
    async query(sql: string, bindings?: any[]): Promise<any> {
        const result = await this.db.query(sql, bindings);
        return {
            rows: result.rows || [],
            rowCount: result.rows?.length || 0,
            fields: result.fields || []
        };
    }
    
    /**
     * Release the connection (no-op for PGlite)
     */
    async release(): Promise<void> {
        // PGlite doesn't use connection pooling
    }
}

/**
 * Create a custom Knex configuration for PGlite
 * 
 * This uses a simple connection object that wraps the PGlite instance
 * to make it compatible with Knex's PostgreSQL client.
 */
export function createPGliteKnexConfig(db: any): Knex.Config {
    const connection = new PGliteConnection(db);
    
    return {
        client: 'pg',
        connection: connection as any,
        pool: {
            min: 1,
            max: 1,
            afterCreate: (conn: any, done: any) => done(null, conn)
        },
        acquireConnectionTimeout: 60000
    };
}
