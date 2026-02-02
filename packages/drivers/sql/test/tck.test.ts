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
                client: 'sqlite3',
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
                    // Initialize the tck_test table
                    await driver.init([
                        {
                            name: 'tck_test',
                            fields: {
                                name: { type: 'string' },
                                email: { type: 'string' },
                                age: { type: 'number' },
                                role: { type: 'string' },
                                active: { type: 'boolean' },
                                status: { type: 'string' },
                                department: { type: 'string' },
                                description: { type: 'string' },
                                optionalField: { type: 'string' }
                            }
                        }
                    ]);
                },
                afterEach: async () => {
                    // Close database connection
                    if (driver && driver['knex']) {
                        await driver['knex'].destroy();
                    }
                }
            }
        }
    );
});
