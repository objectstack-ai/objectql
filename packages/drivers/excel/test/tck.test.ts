/**
 * ObjectQL Excel Driver TCK Tests
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Excel Driver TCK (Technology Compatibility Kit) Tests
 * 
 * This test suite verifies that the Excel driver passes all TCK requirements.
 */

import { runDriverTCK } from '@objectql/driver-tck';
import { ExcelDriver } from '../src';
import * as fs from 'fs';
import * as path from 'path';

describe('ExcelDriver TCK Compliance', () => {
    const testFilePath = path.join(__dirname, 'tck-test.xlsx');
    let driver: ExcelDriver;
    
    afterEach(() => {
        // Clean up test file
        if (fs.existsSync(testFilePath)) {
            fs.unlinkSync(testFilePath);
        }
    });
    
    runDriverTCK(
        () => {
            driver = new ExcelDriver({
                filePath: testFilePath,
                autoSave: true
            });
            return driver;
        },
        {
            skip: {
                aggregations: true,  // Excel driver doesn't support aggregations
                transactions: true,  // Excel doesn't support transactions
                joins: true,         // Excel doesn't support joins
            },
            timeout: 30000,
            hooks: {
                beforeEach: async () => {
                    // Create fresh Excel file
                    if (fs.existsSync(testFilePath)) {
                        fs.unlinkSync(testFilePath);
                    }
                },
                afterEach: async () => {
                    // Cleanup handled in test afterEach
                }
            }
        }
    );
});
