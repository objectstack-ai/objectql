/**
 * File System Driver for ObjectQL (Production-Ready)
 * 
 * A persistent file-based driver for ObjectQL that stores data in JSON files.
 * Each object type is stored in a separate JSON file for easy inspection and backup.
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
import { Driver, ObjectQLError } from '@objectql/types';

/**
 * Configuration options for the FileSystem driver.
 */
export interface FileSystemDriverConfig {
    /** Directory path where JSON files will be stored */
    dataDir: string;
    /** Optional: Enable pretty-print JSON for readability (default: true) */
    prettyPrint?: boolean;
    /** Optional: Enable backup files on write (default: true) */
    enableBackup?: boolean;
    /** Optional: Enable strict mode (throw on missing objects) */
    strictMode?: boolean;
    /** Optional: Initial data to populate the store */
    initialData?: Record<string, any[]>;
}

/**
 * FileSystem Driver Implementation
 * 
 * Stores ObjectQL documents in JSON files with format:
 * - File: `{dataDir}/{objectName}.json`
 * - Content: Array of records `[{id: "1", ...}, {id: "2", ...}]`
 */
export class FileSystemDriver implements Driver {
    private config: FileSystemDriverConfig;
    private idCounters: Map<string, number>;
    private cache: Map<string, any[]>;

    constructor(config: FileSystemDriverConfig) {
        this.config = {
            prettyPrint: true,
            enableBackup: true,
            strictMode: false,
            ...config
        };
        this.idCounters = new Map<string, number>();
        this.cache = new Map<string, any[]>();

        // Ensure data directory exists
        if (!fs.existsSync(this.config.dataDir)) {
            fs.mkdirSync(this.config.dataDir, { recursive: true });
        }

        // Load initial data if provided
        if (config.initialData) {
            this.loadInitialData(config.initialData);
        }
    }

    /**
     * Load initial data into the store.
     */
    private loadInitialData(data: Record<string, any[]>): void {
        for (const [objectName, records] of Object.entries(data)) {
            // Only load if file doesn't exist yet
            const filePath = this.getFilePath(objectName);
            if (!fs.existsSync(filePath)) {
                const recordsWithIds = records.map(record => ({
                    ...record,
                    id: record.id || record._id || this.generateId(objectName),
                    created_at: record.created_at || new Date().toISOString(),
                    updated_at: record.updated_at || new Date().toISOString()
                }));
                this.saveRecords(objectName, recordsWithIds);
            }
        }
    }

    /**
     * Get the file path for an object type.
     */
    private getFilePath(objectName: string): string {
        return path.join(this.config.dataDir, `${objectName}.json`);
    }

    /**
     * Load records from file into memory cache.
     */
    private loadRecords(objectName: string): any[] {
        // Check cache first
        if (this.cache.has(objectName)) {
            return this.cache.get(objectName)!;
        }

        const filePath = this.getFilePath(objectName);
        
        if (!fs.existsSync(filePath)) {
            // File doesn't exist yet, return empty array
            this.cache.set(objectName, []);
            return [];
        }

        try {
            const content = fs.readFileSync(filePath, 'utf8');
            
            // Handle empty file
            if (!content || content.trim() === '') {
                this.cache.set(objectName, []);
                return [];
            }
            
            let records;
            try {
                records = JSON.parse(content);
            } catch (parseError) {
                throw new ObjectQLError({
                    code: 'INVALID_JSON_FORMAT',
                    message: `File ${filePath} contains invalid JSON: ${(parseError as Error).message}`,
                    details: { objectName, filePath, parseError }
                });
            }
            
            if (!Array.isArray(records)) {
                throw new ObjectQLError({
                    code: 'INVALID_DATA_FORMAT',
                    message: `File ${filePath} does not contain a valid array`,
                    details: { objectName, filePath }
                });
            }
            
            this.cache.set(objectName, records);
            return records;
        } catch (error) {
            // If it's already an ObjectQLError, rethrow it
            if ((error as any).code && (error as any).code.startsWith('INVALID_')) {
                throw error;
            }
            
            if ((error as any).code === 'ENOENT') {
                this.cache.set(objectName, []);
                return [];
            }
            
            throw new ObjectQLError({
                code: 'FILE_READ_ERROR',
                message: `Failed to read file for object '${objectName}': ${(error as Error).message}`,
                details: { objectName, filePath, error }
            });
        }
    }

    /**
     * Save records to file with atomic write strategy.
     */
    private saveRecords(objectName: string, records: any[]): void {
        const filePath = this.getFilePath(objectName);
        const tempPath = `${filePath}.tmp`;
        const backupPath = `${filePath}.bak`;

        try {
            // Create backup if file exists and backup is enabled
            if (this.config.enableBackup && fs.existsSync(filePath)) {
                fs.copyFileSync(filePath, backupPath);
            }

            // Write to temporary file
            const content = this.config.prettyPrint 
                ? JSON.stringify(records, null, 2)
                : JSON.stringify(records);
            
            fs.writeFileSync(tempPath, content, 'utf8');

            // Atomic rename (replaces original file)
            fs.renameSync(tempPath, filePath);

            // Update cache
            this.cache.set(objectName, records);
        } catch (error) {
            // Clean up temp file if it exists
            if (fs.existsSync(tempPath)) {
                fs.unlinkSync(tempPath);
            }

            throw new ObjectQLError({
                code: 'FILE_WRITE_ERROR',
                message: `Failed to write file for object '${objectName}': ${(error as Error).message}`,
                details: { objectName, filePath, error }
            });
        }
    }

    /**
     * Find multiple records matching the query criteria.
     */
    async find(objectName: string, query: any = {}, options?: any): Promise<any[]> {
        let results = this.loadRecords(objectName);

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

        // Return deep copies to prevent external modifications
        return results.map(r => ({ ...r }));
    }

    /**
     * Find a single record by ID or query.
     */
    async findOne(objectName: string, id: string | number, query?: any, options?: any): Promise<any> {
        const records = this.loadRecords(objectName);

        // If ID is provided, fetch directly
        if (id) {
            const record = records.find(r => r.id === id || r._id === id);
            return record ? { ...record } : null;
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
        // Validate object name
        if (!objectName || objectName.trim() === '') {
            throw new ObjectQLError({
                code: 'INVALID_OBJECT_NAME',
                message: 'Object name cannot be empty',
                details: { objectName }
            });
        }

        const records = this.loadRecords(objectName);

        // Generate ID if not provided
        const id = data.id || data._id || this.generateId(objectName);
        
        // Check if record already exists
        const existing = records.find(r => r.id === id || r._id === id);
        if (existing) {
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

        records.push(doc);
        this.saveRecords(objectName, records);

        return { ...doc };
    }

    /**
     * Update an existing record.
     */
    async update(objectName: string, id: string | number, data: any, options?: any): Promise<any> {
        const records = this.loadRecords(objectName);
        const index = records.findIndex(r => r.id === id || r._id === id);

        if (index === -1) {
            if (this.config.strictMode) {
                throw new ObjectQLError({
                    code: 'RECORD_NOT_FOUND',
                    message: `Record with id '${id}' not found in '${objectName}'`,
                    details: { objectName, id }
                });
            }
            return null;
        }

        const existing = records[index];
        const doc = {
            ...existing,
            ...data,
            id: existing.id || existing._id, // Preserve ID
            created_at: existing.created_at, // Preserve created_at
            updated_at: new Date().toISOString()
        };

        records[index] = doc;
        this.saveRecords(objectName, records);

        return { ...doc };
    }

    /**
     * Delete a record.
     */
    async delete(objectName: string, id: string | number, options?: any): Promise<any> {
        const records = this.loadRecords(objectName);
        const index = records.findIndex(r => r.id === id || r._id === id);

        if (index === -1) {
            if (this.config.strictMode) {
                throw new ObjectQLError({
                    code: 'RECORD_NOT_FOUND',
                    message: `Record with id '${id}' not found in '${objectName}'`,
                    details: { objectName, id }
                });
            }
            return false;
        }

        records.splice(index, 1);
        this.saveRecords(objectName, records);

        return true;
    }

    /**
     * Count records matching filters.
     */
    async count(objectName: string, filters: any, options?: any): Promise<number> {
        const records = this.loadRecords(objectName);

        // Extract actual filters from query object if needed
        let actualFilters = filters;
        if (filters && !Array.isArray(filters) && filters.filters) {
            actualFilters = filters.filters;
        }

        // If no filters or empty object/array, return total count
        if (!actualFilters || 
            (Array.isArray(actualFilters) && actualFilters.length === 0) ||
            (typeof actualFilters === 'object' && !Array.isArray(actualFilters) && Object.keys(actualFilters).length === 0)) {
            return records.length;
        }

        // Count only records matching filters
        return records.filter(record => this.matchesFilters(record, actualFilters)).length;
    }

    /**
     * Get distinct values for a field.
     */
    async distinct(objectName: string, field: string, filters?: any, options?: any): Promise<any[]> {
        const records = this.loadRecords(objectName);
        const values = new Set<any>();

        for (const record of records) {
            if (!filters || this.matchesFilters(record, filters)) {
                const value = record[field];
                if (value !== undefined && value !== null) {
                    values.add(value);
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
        const records = this.loadRecords(objectName);
        let count = 0;

        for (let i = 0; i < records.length; i++) {
            if (this.matchesFilters(records[i], filters)) {
                const updated = {
                    ...records[i],
                    ...data,
                    id: records[i].id || records[i]._id, // Preserve ID
                    created_at: records[i].created_at, // Preserve created_at
                    updated_at: new Date().toISOString()
                };
                records[i] = updated;
                count++;
            }
        }

        if (count > 0) {
            this.saveRecords(objectName, records);
        }

        return { modifiedCount: count };
    }

    /**
     * Delete multiple records matching filters.
     */
    async deleteMany(objectName: string, filters: any, options?: any): Promise<any> {
        const records = this.loadRecords(objectName);
        const initialCount = records.length;

        const remaining = records.filter(record => !this.matchesFilters(record, filters));
        const deletedCount = initialCount - remaining.length;

        if (deletedCount > 0) {
            this.saveRecords(objectName, remaining);
        }

        return { deletedCount };
    }

    /**
     * Disconnect (flush cache).
     */
    async disconnect(): Promise<void> {
        this.cache.clear();
    }

    /**
     * Clear all data from a specific object.
     * Useful for testing or data reset scenarios.
     */
    async clear(objectName: string): Promise<void> {
        const filePath = this.getFilePath(objectName);
        
        // Remove file if exists
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        
        // Remove backup if exists
        const backupPath = `${filePath}.bak`;
        if (fs.existsSync(backupPath)) {
            fs.unlinkSync(backupPath);
        }
        
        // Clear cache
        this.cache.delete(objectName);
        this.idCounters.delete(objectName);
    }

    /**
     * Clear all data from all objects.
     * Removes all JSON files in the data directory.
     */
    async clearAll(): Promise<void> {
        const files = fs.readdirSync(this.config.dataDir);
        
        for (const file of files) {
            if (file.endsWith('.json') || file.endsWith('.json.bak') || file.endsWith('.json.tmp')) {
                const filePath = path.join(this.config.dataDir, file);
                fs.unlinkSync(filePath);
            }
        }
        
        this.cache.clear();
        this.idCounters.clear();
    }

    /**
     * Invalidate cache for a specific object.
     * Forces reload from file on next access.
     */
    invalidateCache(objectName: string): void {
        this.cache.delete(objectName);
    }

    /**
     * Get the size of the cache (number of objects cached).
     */
    getCacheSize(): number {
        return this.cache.size;
    }

    // ========== Helper Methods ==========

    /**
     * Apply filters to an array of records.
     * 
     * Supports ObjectQL filter format with logical operators (AND/OR):
     * [
     *   ['field', 'operator', value],
     *   'or',
     *   ['field2', 'operator', value2]
     * ]
     */
    private applyFilters(records: any[], filters: any[]): any[] {
        if (!filters || filters.length === 0) {
            return records;
        }
        return records.filter(record => this.matchesFilters(record, filters));
    }

    /**
     * Check if a single record matches the filter conditions.
     */
    private matchesFilters(record: any, filters: any[]): boolean {
        if (!filters || filters.length === 0) {
            return true;
        }

        let conditions: boolean[] = [];
        let operators: string[] = [];

        for (const item of filters) {
            if (typeof item === 'string') {
                // Logical operator (and/or)
                operators.push(item.toLowerCase());
            } else if (Array.isArray(item)) {
                const [field, operator, value] = item;

                // Handle nested filter groups
                if (typeof field !== 'string') {
                    conditions.push(this.matchesFilters(record, item));
                } else {
                    const matches = this.evaluateCondition(record[field], operator, value);
                    conditions.push(matches);
                }
            }
        }

        // Combine conditions with operators
        if (conditions.length === 0) {
            return true;
        }

        let result = conditions[0];
        for (let i = 0; i < operators.length && i + 1 < conditions.length; i++) {
            const op = operators[i];
            const nextCondition = conditions[i + 1];

            if (op === 'or') {
                result = result || nextCondition;
            } else { // 'and' or default
                result = result && nextCondition;
            }
        }

        return result;
    }

    /**
     * Evaluate a single filter condition.
     */
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
                throw new ObjectQLError({
                    code: 'UNSUPPORTED_OPERATOR',
                    message: `[FileSystemDriver] Unsupported operator: ${operator}`,
                });
        }
    }

    /**
     * Apply sorting to an array of records.
     */
    private applySort(records: any[], sort: any[]): any[] {
        const sorted = [...records];

        // Apply sorts in reverse order for correct precedence
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

                // Handle null/undefined
                if (aVal == null && bVal == null) return 0;
                if (aVal == null) return 1;
                if (bVal == null) return -1;

                // Compare values
                if (aVal < bVal) return direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return sorted;
    }

    /**
     * Project specific fields from a document.
     */
    private projectFields(doc: any, fields: string[]): any {
        const result: any = {};
        for (const field of fields) {
            if (doc[field] !== undefined) {
                result[field] = doc[field];
            }
        }
        return result;
    }

    /**
     * Generate a unique ID for a record.
     * Uses timestamp + counter for uniqueness.
     * Note: For production use with high-frequency writes, consider using crypto.randomUUID().
     */
    private generateId(objectName: string): string {
        const counter = (this.idCounters.get(objectName) || 0) + 1;
        this.idCounters.set(objectName, counter);

        // Use timestamp + counter for better uniqueness
        const timestamp = Date.now();
        return `${objectName}-${timestamp}-${counter}`;
    }
}
