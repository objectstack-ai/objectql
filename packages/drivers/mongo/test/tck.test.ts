/**
 * ObjectQL MongoDB Driver TCK Tests
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * MongoDB Driver TCK (Technology Compatibility Kit) Tests
 * 
 * This test suite verifies that the MongoDB driver passes all TCK requirements.
 * Uses mongodb-memory-server for isolated testing.
 * Tests gracefully skip if MongoDB binary cannot be started.
 */

import { runDriverTCK } from '@objectql/driver-tck';
import { MongoDriver } from '../src';
import { MongoMemoryReplSet } from 'mongodb-memory-server';

let mongoServer: MongoMemoryReplSet | null = null;
let mongoAvailable = false;

describe('MongoDriver TCK Compliance', () => {
    let driver: MongoDriver;
    
    beforeAll(async () => {
        try {
            // Start MongoDB Memory Server with replica set (required for transactions)
            mongoServer = await MongoMemoryReplSet.create({
                replSet: { count: 1, storageEngine: 'wiredTiger' }
            });
            mongoAvailable = true;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            console.warn('⚠️  MongoDB Memory Server setup failed, TCK tests will be skipped.');
            console.warn('   Reason:', message);
            console.warn('   This is expected in CI environments with network restrictions.');
            mongoAvailable = false;
        }
    }, 120000);
    
    afterAll(async () => {
        if (driver) {
            try { await driver.disconnect(); } catch { /* ignore */ }
        }
        if (mongoServer) {
            try { await mongoServer.stop(); } catch { /* ignore */ }
        }
    }, 60000);
    
    runDriverTCK(
        () => {
            if (!mongoAvailable || !mongoServer) {
                throw new Error('MongoDB not available - TCK tests cannot run');
            }
            const uri = mongoServer.getUri();
            driver = new MongoDriver({
                url: uri,
                dbName: 'tck_test'
            });
            return driver;
        },
        {
            // MongoDB supports most features
            skip: {
                // No features to skip - MongoDB now supports transactions
            },
            timeout: 30000,
            hooks: {
                beforeEach: async () => {
                    if (!mongoAvailable) return;
                    // Wait for driver to connect
                    await driver['connected'];
                    
                    // Clear all collections
                    if (driver && driver['db']) {
                        const collections = await driver['db'].listCollections().toArray();
                        for (const collection of collections) {
                            await driver['db'].collection(collection.name).deleteMany({});
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
