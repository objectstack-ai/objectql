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
            const host = process.env.REDIS_HOST || 'localhost';
            const port = process.env.REDIS_PORT || '6379';
            driver = new RedisDriver({
                url: `redis://${host}:${port}/15` // Use DB 15 for testing
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
                    if (driver && driver['client']) {
                        await driver['client'].flushDb();
                    }
                },
                afterEach: async () => {
                    // Cleanup handled in beforeEach
                }
            }
        }
    );
});
