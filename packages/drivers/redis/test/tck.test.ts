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
 * Tests gracefully skip if Redis is not available.
 */

import { runDriverTCK } from '@objectql/driver-tck';
import { RedisDriver } from '../src';

let redisAvailable = false;

describe('RedisDriver TCK Compliance', () => {
    let driver: RedisDriver;
    
    beforeAll(async () => {
        // Suppress console.error for the connection probe 
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        let probe: RedisDriver | undefined;
        try {
            const host = process.env.REDIS_HOST || 'localhost';
            const port = process.env.REDIS_PORT || '6379';
            probe = new RedisDriver({
                url: `redis://${host}:${port}/15`,
                retry: { maxAttempts: 2, initialDelay: 100, maxDelay: 500 }
            });
            // Verify connection with a simple operation
            await probe.count('_tck_probe', []);
            redisAvailable = true;
            await probe.disconnect();
        } catch {
            console.warn('⚠️  Redis not available, TCK tests will be skipped.');
            redisAvailable = false;
            if (probe) {
                try { await probe.disconnect(); } catch { /* ignore */ }
            }
        } finally {
            consoleErrorSpy.mockRestore();
        }
    }, 30000);
    
    runDriverTCK(
        () => {
            if (!redisAvailable) {
                throw new Error('Redis not available - TCK tests cannot run');
            }
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
                    if (!redisAvailable) return;
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
