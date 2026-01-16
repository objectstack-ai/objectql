/**
 * Excel Driver for ObjectQL (Production-Ready)
 * 
 * A driver for ObjectQL that reads and writes data from Excel (.xlsx) files.
 * Each worksheet in the Excel file represents an object type, with the first row
 * containing column headers (field names) and subsequent rows containing data.
 * 
 * ✅ Features:
 * - Read data from Excel files
 * - Write data back to Excel files
 * - Multiple sheets support (one sheet per object type)
 * - Full CRUD operations
 * - Query support (filters, sorting, pagination)
 * - Automatic data type handling
 * 
 * Use Cases:
 * - Import/export data from Excel spreadsheets
 * - Use Excel as a simple database for prototyping
 * - Data migration from Excel to other databases
 * - Generate reports in Excel format
 */

import { Driver, ObjectQLError } from '@objectql/types';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Configuration options for the Excel driver.
 */
export interface ExcelDriverConfig {
    /** Path to the Excel file */
    filePath: string;
    /** Optional: Auto-save changes to file (default: true) */
    autoSave?: boolean;
    /** Optional: Create file if it doesn't exist (default: true) */
    createIfMissing?: boolean;
    /** Optional: Enable strict mode (throw on missing objects) */
    strictMode?: boolean;
}

/**
 * Excel Driver Implementation
 * 
 * Stores ObjectQL documents in Excel worksheets. Each object type is stored
 * in a separate worksheet, with the first row containing column headers.
 */
export class ExcelDriver implements Driver {
    private config: ExcelDriverConfig;
    private workbook!: XLSX.WorkBook;
    private data: Map<string, any[]>;
    private idCounters: Map<string, number>;
    private filePath: string;

    constructor(config: ExcelDriverConfig) {
        this.config = {
            autoSave: true,
            createIfMissing: true,
            strictMode: false,
            ...config
        };
        
        this.filePath = path.resolve(config.filePath);
        this.data = new Map<string, any[]>();
        this.idCounters = new Map<string, number>();
        
        // Load existing workbook or create new one
        this.loadWorkbook();
    }

    /**
     * Load workbook from file or create a new one.
     */
    private loadWorkbook(): void {
        if (fs.existsSync(this.filePath)) {
            try {
                const fileBuffer = fs.readFileSync(this.filePath);
                this.workbook = XLSX.read(fileBuffer, { type: 'buffer' });
                this.loadDataFromWorkbook();
            } catch (error) {
                throw new ObjectQLError({
                    code: 'FILE_READ_ERROR',
                    message: `Failed to read Excel file: ${this.filePath}`,
                    details: { error: (error as Error).message }
                });
            }
        } else if (this.config.createIfMissing) {
            // Create new workbook
            this.workbook = XLSX.utils.book_new();
            this.saveWorkbook();
        } else {
            throw new ObjectQLError({
                code: 'FILE_NOT_FOUND',
                message: `Excel file not found: ${this.filePath}`,
                details: { filePath: this.filePath }
            });
        }
    }

    /**
     * Load data from workbook into memory.
     */
    private loadDataFromWorkbook(): void {
        for (const sheetName of this.workbook.SheetNames) {
            const worksheet = this.workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
                defval: null,
                raw: false // Convert dates and numbers to strings for consistency
            });
            
            // Convert array of objects to proper format
            const records = jsonData.map((row: any) => {
                // Ensure ID exists
                if (!row.id) {
                    row.id = this.generateId(sheetName);
                }
                return row;
            });
            
            this.data.set(sheetName, records);
            
            // Update ID counter based on existing IDs
            this.updateIdCounter(sheetName, records);
        }
    }

    /**
     * Update ID counter based on existing records.
     */
    private updateIdCounter(objectName: string, records: any[]): void {
        let maxCounter = 0;
        for (const record of records) {
            if (record.id) {
                // Extract counter from generated IDs (format: objectName-timestamp-counter)
                const parts = String(record.id).split('-');
                if (parts.length === 3 && !isNaN(Number(parts[2]))) {
                    const counter = Number(parts[2]);
                    if (counter > maxCounter) {
                        maxCounter = counter;
                    }
                }
            }
        }
        this.idCounters.set(objectName, maxCounter);
    }

    /**
     * Save workbook to file.
     */
    private saveWorkbook(): void {
        try {
            // Ensure directory exists
            const dir = path.dirname(this.filePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            
            // xlsx library requires at least one sheet in the workbook
            // If empty, add a placeholder sheet that will be removed when first object is created
            if (this.workbook.SheetNames.length === 0) {
                const placeholderSheet = XLSX.utils.aoa_to_sheet([[]]);
                XLSX.utils.book_append_sheet(this.workbook, placeholderSheet, '_placeholder');
            }
            
            // Write workbook to file
            XLSX.writeFile(this.workbook, this.filePath);
        } catch (error) {
            throw new ObjectQLError({
                code: 'FILE_WRITE_ERROR',
                message: `Failed to write Excel file: ${this.filePath}`,
                details: { error: (error as Error).message }
            });
        }
    }

    /**
     * Sync in-memory data to workbook.
     */
    private syncToWorkbook(objectName: string): void {
        const records = this.data.get(objectName) || [];
        
        // Create worksheet from JSON data
        const worksheet = XLSX.utils.json_to_sheet(records);
        
        // Remove placeholder sheet if it exists
        if (this.workbook.SheetNames.includes('_placeholder')) {
            const index = this.workbook.SheetNames.indexOf('_placeholder');
            this.workbook.SheetNames.splice(index, 1);
            delete this.workbook.Sheets['_placeholder'];
        }
        
        // Add or update worksheet in workbook
        if (this.workbook.SheetNames.includes(objectName)) {
            this.workbook.Sheets[objectName] = worksheet;
        } else {
            XLSX.utils.book_append_sheet(this.workbook, worksheet, objectName);
        }
        
        // Auto-save if enabled
        if (this.config.autoSave) {
            this.saveWorkbook();
        }
    }

    /**
     * Find multiple records matching the query criteria.
     */
    async find(objectName: string, query: any = {}, options?: any): Promise<any[]> {
        let results = this.data.get(objectName) || [];
        
        // Return empty array if no data
        if (results.length === 0) {
            return [];
        }
        
        // Deep copy to avoid mutations
        results = results.map(r => ({ ...r }));
        
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
        const records = this.data.get(objectName) || [];
        
        // If ID is provided, fetch directly
        if (id) {
            const record = records.find(r => r.id === String(id));
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
        // Get or create object data array
        if (!this.data.has(objectName)) {
            this.data.set(objectName, []);
        }
        
        const records = this.data.get(objectName)!;
        
        // Generate ID if not provided
        const id = data.id || this.generateId(objectName);
        
        // Check if record already exists
        if (records.some(r => r.id === id)) {
            throw new ObjectQLError({
                code: 'DUPLICATE_RECORD',
                message: `Record with id '${id}' already exists in '${objectName}'`,
                details: { objectName, id }
            });
        }
        
        const now = new Date().toISOString();
        const doc = {
            id,
            ...data,
            created_at: data.created_at || now,
            updated_at: data.updated_at || now
        };
        
        records.push(doc);
        this.syncToWorkbook(objectName);
        
        return { ...doc };
    }

    /**
     * Update an existing record.
     */
    async update(objectName: string, id: string | number, data: any, options?: any): Promise<any> {
        const records = this.data.get(objectName) || [];
        const index = records.findIndex(r => r.id === String(id));
        
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
            id: existing.id, // Preserve ID
            created_at: existing.created_at, // Preserve created_at
            updated_at: new Date().toISOString()
        };
        
        records[index] = doc;
        this.syncToWorkbook(objectName);
        
        return { ...doc };
    }

    /**
     * Delete a record.
     */
    async delete(objectName: string, id: string | number, options?: any): Promise<any> {
        const records = this.data.get(objectName) || [];
        const index = records.findIndex(r => r.id === String(id));
        
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
        this.syncToWorkbook(objectName);
        
        return true;
    }

    /**
     * Count records matching filters.
     */
    async count(objectName: string, filters: any, options?: any): Promise<number> {
        const records = this.data.get(objectName) || [];
        
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
        const records = this.data.get(objectName) || [];
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
        const records = this.data.get(objectName) || [];
        let count = 0;
        
        for (let i = 0; i < records.length; i++) {
            if (this.matchesFilters(records[i], filters)) {
                records[i] = {
                    ...records[i],
                    ...data,
                    id: records[i].id, // Preserve ID
                    created_at: records[i].created_at, // Preserve created_at
                    updated_at: new Date().toISOString()
                };
                count++;
            }
        }
        
        if (count > 0) {
            this.syncToWorkbook(objectName);
        }
        
        return { modifiedCount: count };
    }

    /**
     * Delete multiple records matching filters.
     */
    async deleteMany(objectName: string, filters: any, options?: any): Promise<any> {
        const records = this.data.get(objectName) || [];
        const initialLength = records.length;
        
        const filtered = records.filter(record => !this.matchesFilters(record, filters));
        this.data.set(objectName, filtered);
        
        const deletedCount = initialLength - filtered.length;
        
        if (deletedCount > 0) {
            this.syncToWorkbook(objectName);
        }
        
        return { deletedCount };
    }

    /**
     * Manually save the workbook to file.
     */
    async save(): Promise<void> {
        this.saveWorkbook();
    }

    /**
     * Disconnect (flush any pending writes).
     */
    async disconnect(): Promise<void> {
        if (this.config.autoSave) {
            this.saveWorkbook();
        }
    }

    // ========== Helper Methods ==========

    /**
     * Apply filters to an array of records (in-memory filtering).
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
                    // Nested group - recursively evaluate
                    conditions.push(this.matchesFilters(record, item));
                } else {
                    // Single condition
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
        for (let i = 0; i < operators.length; i++) {
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
                    message: `[ExcelDriver] Unsupported operator: ${operator}`,
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
     */
    private generateId(objectName: string): string {
        const counter = (this.idCounters.get(objectName) || 0) + 1;
        this.idCounters.set(objectName, counter);
        
        // Use timestamp + counter for better uniqueness
        const timestamp = Date.now();
        return `${objectName}-${timestamp}-${counter}`;
    }
}
