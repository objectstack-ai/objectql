/**
 * ObjectQL LocalStorage Driver TCK Tests
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * LocalStorage Driver TCK (Technology Compatibility Kit) Tests
 * 
 * This test suite verifies that the LocalStorage driver passes all TCK requirements.
 */

import { runDriverTCK } from '@objectql/driver-tck';
import { LocalStorageDriver } from '../src';

// Mock localStorage for Node.js environment
class LocalStorageMock {
    private store: Map<string, string> = new Map();
    
    getItem(key: string): string | null {
        return this.store.get(key) || null;
    }
    
    setItem(key: string, value: string): void {
        this.store.set(key, value);
    }
    
    removeItem(key: string): void {
        this.store.delete(key);
    }
    
    clear(): void {
        this.store.clear();
    }
    
    get length(): number {
        return this.store.size;
    }
    
    key(index: number): string | null {
        const keys = Array.from(this.store.keys());
        return keys[index] || null;
    }
}

describe('LocalStorageDriver TCK Compliance', () => {
    let driver: LocalStorageDriver;
    let mockStorage: LocalStorageMock;
    
    runDriverTCK(
        () => {
            mockStorage = new LocalStorageMock();
            (global as any).localStorage = mockStorage;
            
            driver = new LocalStorageDriver({
                namespace: 'tck_test'
            });
            return driver;
        },
        {
            skip: {
                aggregations: true,  // LocalStorage driver doesn't support aggregations
                transactions: true,  // LocalStorage doesn't support transactions
                joins: true,         // LocalStorage doesn't support joins
            },
            timeout: 30000,
            hooks: {
                beforeEach: async () => {
                    // Clear localStorage
                    if (mockStorage) {
                        mockStorage.clear();
                    }
                },
                afterEach: async () => {
                    // Cleanup handled in beforeEach
                }
            }
        }
    );
});
