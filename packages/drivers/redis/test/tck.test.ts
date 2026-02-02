/**
 * ObjectQL Redis Driver TCK Tests
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Redis Driver TCK (Technology Compatibility Kit) Tests
 * 
 * This test suite verifies that the Redis driver passes all TCK requirements.
 */

import { runDriverTCK } from '@objectql/driver-tck';
import { RedisDriver } from '../src';

describe('RedisDriver TCK Compliance', () => {
    let driver: RedisDriver;
    
    runDriverTCK(
        () => {
            driver = new RedisDriver({
                host: process.env.REDIS_HOST || 'localhost',
                port: parseInt(process.env.REDIS_PORT || '6379'),
                db: 15 // Use a separate DB for testing
            });
            return driver;
        },
        {
            skip: {
                aggregations: true,  // Redis driver doesn't support full aggregations
                joins: true,         // Redis doesn't support joins
            },
            timeout: 30000,
            hooks: {
                beforeEach: async () => {
                    // Clear the test database
                    if (driver && driver['redis']) {
                        await driver['redis'].flushdb();
                    }
                },
                afterEach: async () => {
                    // Cleanup handled in beforeEach
                }
            }
        }
    );
});
