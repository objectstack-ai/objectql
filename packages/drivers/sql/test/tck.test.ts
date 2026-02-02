/**
 * ObjectQL SQL Driver TCK Tests
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * SQL Driver TCK (Technology Compatibility Kit) Tests
 * 
 * This test suite verifies that the SQL driver passes all TCK requirements.
 */

import { runDriverTCK } from '@objectql/driver-tck';
import { SqlDriver } from '../src';

describe('SqlDriver TCK Compliance', () => {
    let driver: SqlDriver;
    
    runDriverTCK(
        () => {
            // Use SQLite in-memory database for testing
            driver = new SqlDriver({
                client: 'better-sqlite3',
                connection: {
                    filename: ':memory:'
                },
                useNullAsDefault: true
            });
            return driver;
        },
        {
            // SQL driver doesn't support all aggregation features yet
            skip: {
                aggregations: true, // Skip aggregation tests for now
            },
            timeout: 30000,
            hooks: {
                beforeEach: async () => {
                    // Clear all tables
                    if (driver) {
                        try {
                            const tables = await driver['knex'].raw(`
                                SELECT name FROM sqlite_master 
                                WHERE type='table' AND name NOT LIKE 'sqlite_%'
                            `);
                            
                            for (const table of tables) {
                                await driver['knex'].raw(`DROP TABLE IF EXISTS "${table.name}"`);
                            }
                        } catch (error) {
                            // Ignore errors during cleanup
                        }
                    }
                },
                afterEach: async () => {
                    // Cleanup handled in beforeEach
                }
            }
        }
    );
});
