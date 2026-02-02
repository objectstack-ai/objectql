/**
 * ObjectQL FileSystem Driver TCK Tests
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * FileSystem Driver TCK (Technology Compatibility Kit) Tests
 * 
 * This test suite verifies that the FS driver passes all TCK requirements.
 */

import { runDriverTCK } from '@objectql/driver-tck';
import { FileSystemDriver } from '../src';
import * as fs from 'fs';
import * as path from 'path';

describe('FileSystemDriver TCK Compliance', () => {
    const testDir = path.join(__dirname, 'tck-test-data');
    let driver: FileSystemDriver;
    
    afterEach(() => {
        // Clean up test directory
        if (fs.existsSync(testDir)) {
            fs.rmSync(testDir, { recursive: true, force: true });
        }
    });
    
    runDriverTCK(
        () => {
            driver = new FileSystemDriver({
                dataDir: testDir
            });
            return driver;
        },
        {
            skip: {
                aggregations: true,  // FS driver doesn't support aggregations
                transactions: true,  // FS doesn't support transactions
                joins: true,         // FS doesn't support joins
            },
            timeout: 30000,
            hooks: {
                beforeEach: async () => {
                    // Create fresh directory
                    if (fs.existsSync(testDir)) {
                        fs.rmSync(testDir, { recursive: true, force: true });
                    }
                    fs.mkdirSync(testDir, { recursive: true });
                },
                afterEach: async () => {
                    // Cleanup handled in test afterEach
                }
            }
        }
    );
});
