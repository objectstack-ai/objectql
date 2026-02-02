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
 */

import { runDriverTCK } from '@objectql/driver-tck';
import { MongoDriver } from '../src';
import { MongoMemoryReplSet } from 'mongodb-memory-server';

describe('MongoDriver TCK Compliance', () => {
    let mongoServer: MongoMemoryReplSet;
    let driver: MongoDriver;
    
    beforeAll(async () => {
        // Start MongoDB Memory Server with replica set (required for transactions)
        mongoServer = await MongoMemoryReplSet.create({
            replSet: { count: 1, storageEngine: 'wiredTiger' }
        });
    }, 120000);
    
    afterAll(async () => {
        if (driver) {
            await driver.disconnect();
        }
        if (mongoServer) {
            await mongoServer.stop();
        }
    }, 60000);
    
    runDriverTCK(
        () => {
            const uri = mongoServer.getUri();
            driver = new MongoDriver({
                url: uri,
                dbName: 'tck_test'
            });
            return driver;
        },
        {
            // MongoDB supports all features
            skip: {
                // No features to skip
            },
            timeout: 30000,
            hooks: {
                beforeEach: async () => {
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
