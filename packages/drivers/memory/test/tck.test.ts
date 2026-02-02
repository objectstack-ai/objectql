/**
 * ObjectQL Memory Driver TCK Tests
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Memory Driver TCK (Technology Compatibility Kit) Tests
 * 
 * This test suite verifies that the Memory driver passes all TCK requirements.
 * The Memory driver serves as the reference implementation for all ObjectQL drivers.
 */

import { runDriverTCK } from '@objectql/driver-tck';
import { MemoryDriver } from '../src';

describe('MemoryDriver TCK Compliance', () => {
    runDriverTCK(
        () => new MemoryDriver(),
        {
            // Memory driver supports all features
            skip: {
                // No features to skip - Memory driver is the reference implementation
            },
            timeout: 30000,
            hooks: {
                beforeEach: async () => {
                    // No special setup needed
                },
                afterEach: async () => {
                    // Cleanup handled by driver.clear() in TCK
                }
            }
        }
    );
});
