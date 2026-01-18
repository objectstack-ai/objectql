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

import { Driver, ObjectQLError } from '@objectql/types';

/**
 * Configuration options for the LocalStorage driver.
 */
export interface LocalStorageDriverConfig {
    /** Optional: Namespace prefix for all keys (default: 'objectql') */
    namespace?: string;
    /** Optional: Initial data to populate the store */
    initialData?: Record<string, any[]>;
    /** Optional: Enable strict mode (throw on missing objects) */
    strictMode?: boolean;
    /** Optional: Custom localStorage implementation (for testing) */
    storage?: Storage;
}

/**
 * LocalStorage Driver Implementation
 * 
 * Stores ObjectQL documents in browser localStorage with keys formatted as:
 * `{namespace}:{objectName}:{id}`
 * 
 * Example: `objectql:users:user-123` → `{"id":"user-123","name":"Alice",...}`
 */
export class LocalStorageDriver implements Driver {
    private config: LocalStorageDriverConfig;
    private storage: Storage;
    private namespace: string;
    private idCounters: Map<string, number>;

    constructor(config: LocalStorageDriverConfig = {}) {
        this.config = config;
        this.namespace = config.namespace || 'objectql';
        this.idCounters = new Map<string, number>();
        
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
        
        // Load initial data if provided
        if (config.initialData) {
            this.loadInitialData(config.initialData);
        }
    }

    /**
     * Load initial data into localStorage.
     */
    private loadInitialData(data: Record<string, any[]>): void {
        for (const [objectName, records] of Object.entries(data)) {
            for (const record of records) {
                const id = record.id || this.generateId(objectName);
                const key = this.makeKey(objectName, id);
                this.storage.setItem(key, JSON.stringify({ ...record, id }));
            }
        }
    }

    /**
     * Generate a storage key.
     */
    private makeKey(objectName: string, id: string | number): string {
        return `${this.namespace}:${objectName}:${id}`;
    }

    /**
     * Parse a storage key to extract object name and ID.
     */
    private parseKey(key: string): { objectName: string; id: string } | null {
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
     * Get all keys for a specific object type.
     */
    private getObjectKeys(objectName: string): string[] {
        const prefix = `${this.namespace}:${objectName}:`;
        const keys: string[] = [];
        
        for (let i = 0; i < this.storage.length; i++) {
            const key = this.storage.key(i);
            if (key && key.startsWith(prefix)) {
                keys.push(key);
            }
        }
        
        return keys;
    }

    /**
     * Find multiple records matching the query criteria.
     */
    async find(objectName: string, query: any = {}, options?: any): Promise<any[]> {
        const keys = this.getObjectKeys(objectName);
        let results: any[] = [];
        
        for (const key of keys) {
            const data = this.storage.getItem(key);
            if (data) {
                try {
                    const doc = JSON.parse(data);
                    results.push(doc);
                } catch (error) {
                    console.warn(`[LocalStorageDriver] Failed to parse document at key ${key}:`, error);
                }
            }
        }
        
        // Apply filters
        if (query.filters) {
            results = this.applyFilters(results, query.filters);
        }
        
        // Apply sorting
        if (query.sort && Array.isArray(query.sort)) {
            results = this.applySort(results, query.sort);
        }
        
        // Apply pagination
        if (query.skip) {
            results = results.slice(query.skip);
        }
        if (query.limit) {
            results = results.slice(0, query.limit);
        }
        
        // Apply field projection
        if (query.fields && Array.isArray(query.fields)) {
            results = results.map(doc => this.projectFields(doc, query.fields));
        }
        
        return results;
    }

    /**
     * Find a single record by ID or query.
     */
    async findOne(objectName: string, id: string | number, query?: any, options?: any): Promise<any> {
        // If ID is provided, fetch directly
        if (id) {
            const key = this.makeKey(objectName, id);
            const data = this.storage.getItem(key);
            
            if (!data) {
                return null;
            }
            
            try {
                return JSON.parse(data);
            } catch (error) {
                console.warn(`[LocalStorageDriver] Failed to parse document at key ${key}:`, error);
                return null;
            }
        }
        
        // If query is provided, use find and return first result
        if (query) {
            const results = await this.find(objectName, { ...query, limit: 1 }, options);
            return results[0] || null;
        }
        
        return null;
    }

    /**
     * Create a new record.
     */
    async create(objectName: string, data: any, options?: any): Promise<any> {
        // Generate ID if not provided
        const id = data.id || this.generateId(objectName);
        const key = this.makeKey(objectName, id);
        
        // Check if record already exists
        if (this.storage.getItem(key) !== null) {
            throw new ObjectQLError({
                code: 'DUPLICATE_RECORD',
                message: `Record with id '${id}' already exists in '${objectName}'`,
                details: { objectName, id }
            });
        }
        
        const now = new Date().toISOString();
        const doc = {
            ...data,
            id,
            created_at: data.created_at || now,
            updated_at: data.updated_at || now
        };
        
        try {
            this.storage.setItem(key, JSON.stringify(doc));
        } catch (error) {
            // Handle quota exceeded error
            if (error instanceof Error && error.name === 'QuotaExceededError') {
                throw new ObjectQLError({
                    code: 'STORAGE_QUOTA_EXCEEDED',
                    message: 'localStorage quota exceeded. Cannot create new record.',
                    details: { objectName, id, error: error.message }
                });
            }
            throw error;
        }
        
        return { ...doc };
    }

    /**
     * Update an existing record.
     */
    async update(objectName: string, id: string | number, data: any, options?: any): Promise<any> {
        const key = this.makeKey(objectName, id);
        const existing = this.storage.getItem(key);
        
        if (!existing) {
            if (this.config.strictMode) {
                throw new ObjectQLError({
                    code: 'RECORD_NOT_FOUND',
                    message: `Record with id '${id}' not found in '${objectName}'`,
                    details: { objectName, id }
                });
            }
            return null;
        }
        
        const existingDoc = JSON.parse(existing);
        const doc = {
            ...existingDoc,
            ...data,
            id, // Preserve ID
            created_at: existingDoc.created_at, // Preserve created_at
            updated_at: new Date().toISOString()
        };
        
        try {
            this.storage.setItem(key, JSON.stringify(doc));
        } catch (error) {
            if (error instanceof Error && error.name === 'QuotaExceededError') {
                throw new ObjectQLError({
                    code: 'STORAGE_QUOTA_EXCEEDED',
                    message: 'localStorage quota exceeded. Cannot update record.',
                    details: { objectName, id, error: error.message }
                });
            }
            throw error;
        }
        
        return { ...doc };
    }

    /**
     * Delete a record.
     */
    async delete(objectName: string, id: string | number, options?: any): Promise<any> {
        const key = this.makeKey(objectName, id);
        const exists = this.storage.getItem(key) !== null;
        
        if (!exists && this.config.strictMode) {
            throw new ObjectQLError({
                code: 'RECORD_NOT_FOUND',
                message: `Record with id '${id}' not found in '${objectName}'`,
                details: { objectName, id }
            });
        }
        
        this.storage.removeItem(key);
        return exists;
    }

    /**
     * Count records matching filters.
     */
    async count(objectName: string, filters: any, options?: any): Promise<number> {
        const keys = this.getObjectKeys(objectName);
        
        // Extract actual filters from query object if needed
        let actualFilters = filters;
        if (filters && !Array.isArray(filters) && filters.filters) {
            actualFilters = filters.filters;
        }
        
        // If no filters, return total count
        if (!actualFilters || (Array.isArray(actualFilters) && actualFilters.length === 0)) {
            return keys.length;
        }
        
        // Count only records matching filters
        let count = 0;
        for (const key of keys) {
            const data = this.storage.getItem(key);
            if (data) {
                try {
                    const doc = JSON.parse(data);
                    if (this.matchesFilters(doc, actualFilters)) {
                        count++;
                    }
                } catch (error) {
                    console.warn(`[LocalStorageDriver] Failed to parse document at key ${key}:`, error);
                }
            }
        }
        
        return count;
    }

    /**
     * Get distinct values for a field.
     */
    async distinct(objectName: string, field: string, filters?: any, options?: any): Promise<any[]> {
        const keys = this.getObjectKeys(objectName);
        const values = new Set<any>();
        
        for (const key of keys) {
            const data = this.storage.getItem(key);
            if (data) {
                try {
                    const record = JSON.parse(data);
                    if (!filters || this.matchesFilters(record, filters)) {
                        const value = record[field];
                        if (value !== undefined && value !== null) {
                            values.add(value);
                        }
                    }
                } catch (error) {
                    console.warn(`[LocalStorageDriver] Failed to parse document at key ${key}:`, error);
                }
            }
        }
        
        return Array.from(values);
    }

    /**
     * Create multiple records at once.
     */
    async createMany(objectName: string, data: any[], options?: any): Promise<any> {
        const results = [];
        for (const item of data) {
            const result = await this.create(objectName, item, options);
            results.push(result);
        }
        return results;
    }

    /**
     * Update multiple records matching filters.
     */
    async updateMany(objectName: string, filters: any, data: any, options?: any): Promise<any> {
        const keys = this.getObjectKeys(objectName);
        let count = 0;
        
        for (const key of keys) {
            const existing = this.storage.getItem(key);
            if (existing) {
                try {
                    const record = JSON.parse(existing);
                    if (this.matchesFilters(record, filters)) {
                        const updated = {
                            ...record,
                            ...data,
                            id: record.id,
                            created_at: record.created_at,
                            updated_at: new Date().toISOString()
                        };
                        this.storage.setItem(key, JSON.stringify(updated));
                        count++;
                    }
                } catch (error) {
                    console.warn(`[LocalStorageDriver] Failed to update document at key ${key}:`, error);
                }
            }
        }
        
        return { modifiedCount: count };
    }

    /**
     * Delete multiple records matching filters.
     */
    async deleteMany(objectName: string, filters: any, options?: any): Promise<any> {
        const keys = this.getObjectKeys(objectName);
        const keysToDelete: string[] = [];
        
        for (const key of keys) {
            const data = this.storage.getItem(key);
            if (data) {
                try {
                    const record = JSON.parse(data);
                    if (this.matchesFilters(record, filters)) {
                        keysToDelete.push(key);
                    }
                } catch (error) {
                    console.warn(`[LocalStorageDriver] Failed to parse document at key ${key}:`, error);
                }
            }
        }
        
        for (const key of keysToDelete) {
            this.storage.removeItem(key);
        }
        
        return { deletedCount: keysToDelete.length };
    }

    /**
     * Clear all data for this namespace from localStorage.
     */
    async clear(): Promise<void> {
        const keysToDelete: string[] = [];
        
        for (let i = 0; i < this.storage.length; i++) {
            const key = this.storage.key(i);
            if (key && key.startsWith(`${this.namespace}:`)) {
                keysToDelete.push(key);
            }
        }
        
        for (const key of keysToDelete) {
            this.storage.removeItem(key);
        }
        
        this.idCounters.clear();
    }

    /**
     * Get the current number of records stored.
     */
    getSize(): number {
        let count = 0;
        for (let i = 0; i < this.storage.length; i++) {
            const key = this.storage.key(i);
            if (key && key.startsWith(`${this.namespace}:`)) {
                count++;
            }
        }
        return count;
    }

    /**
     * Disconnect (no-op for localStorage driver).
     */
    async disconnect(): Promise<void> {
        // No-op: LocalStorage driver doesn't need cleanup
    }

    // ========== Helper Methods (Same as MemoryDriver) ==========

    private applyFilters(records: any[], filters: any[]): any[] {
        if (!filters || filters.length === 0) {
            return records;
        }
        return records.filter(record => this.matchesFilters(record, filters));
    }

    private matchesFilters(record: any, filters: any[]): boolean {
        if (!filters || filters.length === 0) {
            return true;
        }
        
        let conditions: boolean[] = [];
        let operators: string[] = [];
        
        for (const item of filters) {
            if (typeof item === 'string') {
                operators.push(item.toLowerCase());
            } else if (Array.isArray(item)) {
                const [field, operator, value] = item;
                if (typeof field !== 'string') {
                    conditions.push(this.matchesFilters(record, item));
                } else {
                    const matches = this.evaluateCondition(record[field], operator, value);
                    conditions.push(matches);
                }
            }
        }
        
        if (conditions.length === 0) {
            return true;
        }
        
        let result = conditions[0];
        for (let i = 0; i < operators.length; i++) {
            const op = operators[i];
            const nextCondition = conditions[i + 1];
            if (op === 'or') {
                result = result || nextCondition;
            } else {
                result = result && nextCondition;
            }
        }
        
        return result;
    }

    private evaluateCondition(fieldValue: any, operator: string, compareValue: any): boolean {
        switch (operator) {
            case '=':
            case '==':
                return fieldValue === compareValue;
            case '!=':
            case '<>':
                return fieldValue !== compareValue;
            case '>':
                return fieldValue > compareValue;
            case '>=':
                return fieldValue >= compareValue;
            case '<':
                return fieldValue < compareValue;
            case '<=':
                return fieldValue <= compareValue;
            case 'in':
                return Array.isArray(compareValue) && compareValue.includes(fieldValue);
            case 'nin':
            case 'not in':
                return Array.isArray(compareValue) && !compareValue.includes(fieldValue);
            case 'contains':
            case 'like':
                return String(fieldValue).toLowerCase().includes(String(compareValue).toLowerCase());
            case 'startswith':
            case 'starts_with':
                return String(fieldValue).toLowerCase().startsWith(String(compareValue).toLowerCase());
            case 'endswith':
            case 'ends_with':
                return String(fieldValue).toLowerCase().endsWith(String(compareValue).toLowerCase());
            case 'between':
                return Array.isArray(compareValue) && 
                       fieldValue >= compareValue[0] && 
                       fieldValue <= compareValue[1];
            default:
                console.warn(`[LocalStorageDriver] Unsupported operator: ${operator}`);
                return false;
        }
    }

    private applySort(records: any[], sort: any[]): any[] {
        const sorted = [...records];
        
        for (let i = sort.length - 1; i >= 0; i--) {
            const sortItem = sort[i];
            let field: string;
            let direction: string;
            
            if (Array.isArray(sortItem)) {
                [field, direction] = sortItem;
            } else if (typeof sortItem === 'object') {
                field = sortItem.field;
                direction = sortItem.order || sortItem.direction || sortItem.dir || 'asc';
            } else {
                continue;
            }
            
            sorted.sort((a, b) => {
                const aVal = a[field];
                const bVal = b[field];
                
                if (aVal == null && bVal == null) return 0;
                if (aVal == null) return 1;
                if (bVal == null) return -1;
                
                if (aVal < bVal) return direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        
        return sorted;
    }

    private projectFields(doc: any, fields: string[]): any {
        const result: any = {};
        for (const field of fields) {
            if (doc[field] !== undefined) {
                result[field] = doc[field];
            }
        }
        return result;
    }

    private generateId(objectName: string): string {
        const counter = (this.idCounters.get(objectName) || 0) + 1;
        this.idCounters.set(objectName, counter);
        const timestamp = Date.now();
        return `${objectName}-${timestamp}-${counter}`;
    }
}
