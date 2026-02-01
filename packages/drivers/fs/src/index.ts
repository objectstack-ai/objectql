import { Data, System as SystemSpec } from '@objectstack/spec';
type QueryAST = Data.QueryAST;
type SortNode = Data.SortNode;
type DriverInterface = Data.DriverInterface;
/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * File System Driver for ObjectQL (Production-Ready)
 * 
 * A persistent file-based driver for ObjectQL that stores data in JSON files.
 * Each object type is stored in a separate JSON file for easy inspection and backup.
 * 
 * Implements both the legacy Driver interface from @objectql/types and
 * the standard DriverInterface from @objectstack/spec for compatibility
 * with the new kernel-based plugin system.
 * 
 * ✅ Production-ready features:
 * - Persistent storage with JSON files
 * - One file per table/object (e.g., users.json, projects.json)
 * - Atomic write operations with temp file + rename strategy
 * - Full query support (filters, sorting, pagination)
 * - Backup on write for data safety
 * - Human-readable JSON format
 * 
 * Use Cases:
 * - Small to medium datasets (< 10k records per object)
 * - Development and prototyping with persistent data
 * - Configuration and metadata storage
 * - Embedded applications
 * - Scenarios where database setup is not desired
 */

import * as fs from 'fs';
import * as path from 'path';
import { ObjectQLError } from '@objectql/types';
import { MemoryDriver, MemoryDriverConfig } from '@objectql/driver-memory';

/**
 * Command interface for executeCommand method
 */
export interface Command {
    type: 'create' | 'update' | 'delete' | 'bulkCreate' | 'bulkUpdate' | 'bulkDelete';
    object: string;
    data?: any;
    id?: string | number;
    ids?: Array<string | number>;
    records?: any[];
    updates?: Array<{id: string | number, data: any}>;
    options?: any;
}

/**
 * Command result interface
 */
export interface CommandResult {
    success: boolean;
    data?: any;
    affected: number;
    error?: string;
}

/**
 * Configuration options for the FileSystem driver.
 */
export interface FileSystemDriverConfig extends MemoryDriverConfig {
    /** Directory path where JSON files will be stored */
    dataDir: string;
    /** Optional: Enable pretty-print JSON for readability (default: true) */
    prettyPrint?: boolean;
    /** Optional: Enable backup files on write (default: true) */
    enableBackup?: boolean;
}

/**
 * FileSystem Driver Implementation
 * 
 * Extends MemoryDriver with file system persistence.
 * All query and aggregation logic is inherited from MemoryDriver.
 * Only the persistence layer (load/save) is overridden.
 * 
 * Stores ObjectQL documents in JSON files with format:
 * - File: `{dataDir}/{objectName}.json`
 * - Content: Array of records `[{id: "1", ...}, {id: "2", ...}]`
 */
export class FileSystemDriver extends MemoryDriver {
    private dataDir: string;
    private prettyPrint: boolean;
    private enableBackup: boolean;
    private cache: Map<string, any[]>;

    constructor(config: FileSystemDriverConfig) {
        // Initialize parent with inherited config properties
        super({
            strictMode: config.strictMode,
            initialData: config.initialData,
            indexes: config.indexes
        });
        
        // Override driver name and version
        (this as any).name = 'FileSystemDriver';
        (this as any).version = '4.0.0';
        
        this.dataDir = path.resolve(config.dataDir);
        this.prettyPrint = config.prettyPrint !== false;
        this.enableBackup = config.enableBackup !== false;
        this.cache = new Map<string, any[]>();

        // Ensure data directory exists
        if (!fs.existsSync(this.dataDir)) {
            fs.mkdirSync(this.dataDir, { recursive: true });
        }

        // Load all existing data files
        this.loadAllFromDisk();
    }

    /**
     * Load all JSON files from disk into memory
     */
    protected loadAllFromDisk(): void {
        if (!fs.existsSync(this.dataDir)) {
            return;
        }

        const files = fs.readdirSync(this.dataDir);
        for (const file of files) {
            if (file.endsWith('.json') && !file.endsWith('.backup.json')) {
                const objectName = file.replace('.json', '');
                const records = this.loadRecordsFromDisk(objectName);
                
                // Load into parent's store
                for (const record of records) {
                    const id = record.id || record._id;
                    const key = `${objectName}:${id}`;
                    this.store.set(key, record);
                }
            }
        }
    }

    /**
     * Load records for an object type from disk
     */
    protected loadRecordsFromDisk(objectName: string): any[] {
        const filePath = this.getFilePath(objectName);
        
        if (!fs.existsSync(filePath)) {
            return [];
        }

        try {
            const content = fs.readFileSync(filePath, 'utf8');
            if (!content.trim()) {
                return [];
            }
            return JSON.parse(content);
        } catch (error) {
            throw new ObjectQLError({
                code: 'INVALID_JSON_FORMAT',
                message: `Failed to parse ${filePath}: invalid JSON format`
            });
        }
    }

    /**
     * Save records for an object type to disk
     */
    protected saveRecordsToDisk(objectName: string, records: any[]): void {
        const filePath = this.getFilePath(objectName);
        
        // Create backup if enabled
        if (this.enableBackup && fs.existsSync(filePath)) {
            const backupPath = `${filePath}.bak`;
            fs.copyFileSync(filePath, backupPath);
        }

        // Ensure directory exists
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // Write to temp file first (atomic write)
        const tempPath = `${filePath}.tmp`;
        const content = this.prettyPrint 
            ? JSON.stringify(records, null, 2)
            : JSON.stringify(records);
        
        fs.writeFileSync(tempPath, content, 'utf8');
        fs.renameSync(tempPath, filePath);
        
        // Update cache
        this.cache.set(objectName, records);
    }

    /**
     * Get file path for an object type
     */
    protected getFilePath(objectName: string): string {
        return path.join(this.dataDir, `${objectName}.json`);
    }

    /**
     * Override create to persist to disk
     */
    async create(objectName: string, data: any, options?: any): Promise<any> {
        if (!objectName || objectName.trim() === '') {
            throw new ObjectQLError({
                code: 'INVALID_OBJECT_NAME',
                message: 'Object name cannot be empty'
            });
        }
        
        // Handle _id field as alias for id (MongoDB compatibility)
        if (data._id && !data.id) {
            data = { ...data, id: data._id };
        }
        
        const result = await super.create(objectName, data, options);
        this.syncObjectToDisk(objectName);
        return result;
    }

    /**
     * Override update to persist to disk
     */
    async update(objectName: string, id: string | number, data: any, options?: any): Promise<any> {
        const result = await super.update(objectName, id, data, options);
        if (result) {
            this.syncObjectToDisk(objectName);
        }
        return result;
    }

    /**
     * Override delete to persist to disk
     */
    async delete(objectName: string, id: string | number, options?: any): Promise<any> {
        const result = await super.delete(objectName, id, options);
        if (result) {
            this.syncObjectToDisk(objectName);
        }
        return result;
    }

    /**
     * Override find to load from disk if not in cache
     */
    async find(objectName: string, query: any = {}, options?: any): Promise<any[]> {
        // Check if we need to load from disk (e.g., file created externally)
        const filePath = this.getFilePath(objectName);
        const hasRecordsInMemory = Array.from(this.store.keys()).some(key => key.startsWith(`${objectName}:`));
        
        if (!hasRecordsInMemory && fs.existsSync(filePath)) {
            // Load from disk - this will throw on invalid JSON
            const records = this.loadRecordsFromDisk(objectName);
            
            // Load into parent's store
            for (const record of records) {
                const id = record.id || record._id;
                const key = `${objectName}:${id}`;
                this.store.set(key, record);
            }
        }
        
        return super.find(objectName, query, options);
    }

    /**
     * Sync an object type's data to disk
     */
    protected syncObjectToDisk(objectName: string): void {
        const records: any[] = [];
        const prefix = `${objectName}:`;
        
        for (const [key, value] of this.store.entries()) {
            if (key.startsWith(prefix)) {
                records.push(value);
            }
        }
        
        this.saveRecordsToDisk(objectName, records);
    }

    /**
     * Clear cache for an object
     */
    invalidateCache(objectName?: string): void {
        if (objectName) {
            this.cache.delete(objectName);
        } else {
            this.cache.clear();
        }
    }

    /**
     * Get the number of cached objects
     */
    getCacheSize(): number {
        return this.cache.size;
    }

    /**
     * Clear data for a specific object or all data
     */
    async clear(objectName?: string): Promise<void> {
        if (objectName) {
            // Clear specific object from memory
            const prefix = `${objectName}:`;
            const keysToDelete: string[] = [];
            
            for (const key of this.store.keys()) {
                if (key.startsWith(prefix)) {
                    keysToDelete.push(key);
                }
            }
            
            for (const key of keysToDelete) {
                this.store.delete(key);
            }
            
            // Delete from disk
            const filePath = this.getFilePath(objectName);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
            
            // Clear cache
            this.cache.delete(objectName);
        } else {
            // Clear all data
            await super.clear();
            this.cache.clear();
        }
    }

    /**
     * Clear all data from the store and disk
     */
    async clearAll(): Promise<void> {
        // Clear in-memory store
        await this.clear();
        
        // Clear cache
        this.cache.clear();
        
        // Delete all JSON files from disk
        if (fs.existsSync(this.dataDir)) {
            const files = fs.readdirSync(this.dataDir);
            for (const file of files) {
                if (file.endsWith('.json')) {
                    const filePath = path.join(this.dataDir, file);
                    fs.unlinkSync(filePath);
                }
            }
        }
    }
}
