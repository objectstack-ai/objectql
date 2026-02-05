import { Data, System as SystemSpec } from '@objectstack/spec';
import { z } from 'zod';
type QueryAST = z.infer<typeof Data.QueryAST>;
type SortNode = z.infer<typeof Data.SortNode>;
type DriverInterface = z.infer<typeof Data.DriverInterface>;
/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * LocalStorage Driver for ObjectQL (Production-Ready)
 * 
 * A browser-based driver that persists data to localStorage.
 * Perfect for client-side applications that need persistence across sessions.
 * 
 * Implements both the legacy Driver interface from @objectql/types and
 * the standard DriverInterface from @objectstack/spec for compatibility
 * with the new kernel-based plugin system.
 * 
 * ✅ Production-ready features:
 * - Browser localStorage persistence
 * - Automatic serialization/deserialization
 * - Full query support (filters, sorting, pagination)
 * - Storage quota management
 * - Namespace support to avoid conflicts
 * 
 * Use Cases:
 * - Client-side web applications
 * - Progressive Web Apps (PWAs)
 * - Offline-first applications
 * - Browser extensions
 * - User preference storage
 */

import { ObjectQLError } from '@objectql/types';
import { MemoryDriver, MemoryDriverConfig, Command, CommandResult } from '@objectql/driver-memory';

// Re-export Command and CommandResult for compatibility
export type { Command, CommandResult };

/**
 * Configuration options for the LocalStorage driver.
 */
export interface LocalStorageDriverConfig extends MemoryDriverConfig {
    /** Optional: Namespace prefix for all keys (default: 'objectql') */
    namespace?: string;
    /** Optional: Custom localStorage implementation (for testing) */
    storage?: Storage;
    /** 
     * Optional: Enable compression for stored data (default: false)
     * NOTE: Compression is not yet implemented. Setting this to true will log a warning.
     */
    enableCompression?: boolean;
}

/**
 * LocalStorage Driver Implementation
 * 
 * Extends MemoryDriver with localStorage persistence.
 * All query and aggregation logic is inherited from MemoryDriver.
 * Only the persistence layer (load/save) is overridden.
 * 
 * Stores ObjectQL documents in localStorage with keys formatted as:
 * `{namespace}:{objectName}:{id}`
 * 
 * Example: `objectql:users:user-123` → `{"id":"user-123","name":"Alice",...}`
 */
export class LocalStorageDriver extends MemoryDriver {
    private storage: Storage;
    private namespace: string;
    private enableCompression: boolean;

    constructor(config: LocalStorageDriverConfig = {}) {
        // Initialize parent with inherited config properties
        super({
            strictMode: config.strictMode,
            initialData: config.initialData,
            indexes: config.indexes
        });
        
        // Override driver name and version
        (this as any).name = 'LocalStorageDriver';
        (this as any).version = '4.0.0';
        
        this.namespace = config.namespace || 'objectql';
        this.enableCompression = config.enableCompression || false;
        
        // Warn if compression is enabled but not yet implemented
        if (this.enableCompression) {
            console.warn('[LocalStorageDriver] Compression is not yet implemented. Data will be stored as plain JSON.');
        }
        
        // Use provided storage or browser localStorage
        if (config.storage) {
            this.storage = config.storage;
        } else if (typeof localStorage !== 'undefined') {
            this.storage = localStorage;
        } else {
            throw new ObjectQLError({
                code: 'ENVIRONMENT_ERROR',
                message: 'localStorage is not available in this environment',
                details: { environment: typeof window !== 'undefined' ? 'browser' : 'node' }
            });
        }

        // Load all existing data from localStorage
        this.loadAllFromLocalStorage();
    }

    /**
     * Check database connection health
     */
    async checkHealth(): Promise<boolean> {
        try {
            // Check if localStorage is accessible
            if (!this.storage) {
                return false;
            }
            // Try a test write and read
            const testKey = `${this.namespace}:healthcheck`;
            this.storage.setItem(testKey, 'ok');
            const value = this.storage.getItem(testKey);
            this.storage.removeItem(testKey);
            return value === 'ok';
        } catch (error) {
            return false;
        }
    }

    /**
     * Load all records from localStorage into memory
     */
    protected loadAllFromLocalStorage(): void {
        const prefix = `${this.namespace}:`;
        const keysToLoad: string[] = [];
        
        // Collect all keys that belong to this namespace
        for (let i = 0; i < this.storage.length; i++) {
            const key = this.storage.key(i);
            if (key && key.startsWith(prefix) && key !== `${this.namespace}:healthcheck`) {
                keysToLoad.push(key);
            }
        }
        
        // Load each record into parent's store
        for (const fullKey of keysToLoad) {
            const parsed = this.parseKey(fullKey);
            if (parsed) {
                const value = this.storage.getItem(fullKey);
                if (value) {
                    try {
                        const record = this.deserialize(value);
                        const storeKey = `${parsed.objectName}:${parsed.id}`;
                        this.store.set(storeKey, record);
                    } catch (error) {
                        console.warn(`[LocalStorageDriver] Failed to parse ${fullKey}:`, error);
                    }
                }
            }
        }
    }

    /**
     * Generate a storage key.
     */
    protected makeKey(objectName: string, id: string | number): string {
        return `${this.namespace}:${objectName}:${id}`;
    }

    /**
     * Parse a storage key to extract object name and ID.
     */
    protected parseKey(key: string): { objectName: string; id: string } | null {
        const prefix = `${this.namespace}:`;
        if (!key.startsWith(prefix)) {
            return null;
        }
        const parts = key.slice(prefix.length).split(':');
        if (parts.length < 2) {
            return null;
        }
        return {
            objectName: parts[0],
            id: parts.slice(1).join(':')
        };
    }

    /**
     * Serialize data for storage (with optional compression)
     * NOTE: Compression is not yet implemented
     */
    protected serialize(data: any): string {
        const json = JSON.stringify(data);
        // Compression support planned for future release
        return json;
    }

    /**
     * Deserialize data from storage (with optional decompression)
     * NOTE: Decompression is not yet implemented
     */
    protected deserialize(value: string): any {
        // Decompression support planned for future release
        return JSON.parse(value);
    }

    /**
     * Save a record to localStorage
     */
    protected saveRecordToLocalStorage(objectName: string, id: string | number, record: any): void {
        const key = this.makeKey(objectName, id);
        const value = this.serialize(record);
        try {
            this.storage.setItem(key, value);
        } catch (error: any) {
            // Handle quota exceeded error
            if (error.name === 'QuotaExceededError') {
                throw new ObjectQLError({
                    code: 'STORAGE_QUOTA_EXCEEDED',
                    message: 'localStorage quota exceeded',
                    details: { objectName, id }
                });
            }
            throw error;
        }
    }

    /**
     * Delete a record from localStorage
     */
    protected deleteRecordFromLocalStorage(objectName: string, id: string | number): void {
        const key = this.makeKey(objectName, id);
        this.storage.removeItem(key);
    }

    /**
     * Override create to persist to localStorage
     */
    async create(objectName: string, data: any, options?: any): Promise<any> {
        const result = await super.create(objectName, data, options);
        const id = result.id || result._id;
        this.saveRecordToLocalStorage(objectName, id, result);
        return result;
    }

    /**
     * Override update to persist to localStorage
     */
    async update(objectName: string, id: string | number, data: any, options?: any): Promise<any> {
        const result = await super.update(objectName, id, data, options);
        if (result) {
            this.saveRecordToLocalStorage(objectName, id, result);
        }
        return result;
    }

    /**
     * Override delete to persist to localStorage
     */
    async delete(objectName: string, id: string | number, options?: any): Promise<any> {
        const result = await super.delete(objectName, id, options);
        if (result) {
            this.deleteRecordFromLocalStorage(objectName, id);
        }
        return result;
    }

    /**
     * Clear all data for a specific object type from localStorage
     */
    async clearObject(objectName: string): Promise<void> {
        const prefix = `${this.namespace}:${objectName}:`;
        const keysToDelete: string[] = [];
        
        // Collect all keys for this object type
        for (let i = 0; i < this.storage.length; i++) {
            const key = this.storage.key(i);
            if (key && key.startsWith(prefix)) {
                keysToDelete.push(key);
            }
        }
        
        // Delete from localStorage
        for (const key of keysToDelete) {
            this.storage.removeItem(key);
        }
        
        // Delete from memory
        const storePrefix = `${objectName}:`;
        for (const [key] of this.store.entries()) {
            if (key.startsWith(storePrefix)) {
                this.store.delete(key);
            }
        }
    }

    /**
     * Get storage statistics
     */
    getStorageStats(): { 
        totalKeys: number; 
        namespaceKeys: number; 
        approximateSizeBytes: number 
    } {
        let totalKeys = 0;
        let namespaceKeys = 0;
        let approximateSizeBytes = 0;
        const prefix = `${this.namespace}:`;
        
        for (let i = 0; i < this.storage.length; i++) {
            totalKeys++;
            const key = this.storage.key(i);
            if (key) {
                const value = this.storage.getItem(key);
                if (key.startsWith(prefix)) {
                    namespaceKeys++;
                }
                if (value) {
                    // Approximate size in bytes (UTF-16)
                    approximateSizeBytes += (key.length + value.length) * 2;
                }
            }
        }
        
        return {
            totalKeys,
            namespaceKeys,
            approximateSizeBytes
        };
    }
}
