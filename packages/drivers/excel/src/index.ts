import { Data, Driver as DriverSpec } from '@objectstack/spec';
type QueryAST = Data.QueryAST;
type SortNode = Data.SortNode;
type DriverInterface = DriverSpec.DriverInterface;
/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

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
 * - Secure: Uses ExcelJS (no known vulnerabilities)
 * 
 * Use Cases:
 * - Import/export data from Excel spreadsheets
 * - Use Excel as a simple database for prototyping
 * - Data migration from Excel to other databases
 * - Generate reports in Excel format
 */

import { Driver, ObjectQLError } from '@objectql/types';
import * as ExcelJS from 'exceljs';
import * as fs from 'fs';
import * as path from 'path';

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
 * File storage mode for the Excel driver.
 */
export type FileStorageMode = 'single-file' | 'file-per-object';

/**
 * Configuration options for the Excel driver.
 */
export interface ExcelDriverConfig {
    /** 
     * Path to the Excel file or directory.
     * - In 'single-file' mode: Path to a single .xlsx file
     * - In 'file-per-object' mode: Path to a directory where object files are stored
     */
    filePath: string;
    
    /** 
     * File storage mode (default: 'single-file')
     * - 'single-file': All object types stored as worksheets in one Excel file
     * - 'file-per-object': Each object type stored in a separate Excel file
     */
    fileStorageMode?: FileStorageMode;
    
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
 * 
 * Uses ExcelJS library for secure Excel file operations.
 * 
 * Implements both the legacy Driver interface from @objectql/types and
 * the standard DriverInterface from @objectstack/spec for compatibility
 * with the new kernel-based plugin system.
 */
export class ExcelDriver implements Driver {
    // Driver metadata (ObjectStack-compatible)
    public readonly name = 'ExcelDriver';
    public readonly version = '4.0.0';
    public readonly supports = {
        transactions: false,
        joins: false,
        fullTextSearch: false,
        jsonFields: true,
        arrayFields: true,
        queryFilters: true,
        queryAggregations: false,
        querySorting: true,
        queryPagination: true,
        queryWindowFunctions: false,
        querySubqueries: false
    };

    private config: ExcelDriverConfig;
    private workbook!: ExcelJS.Workbook;
    private workbooks: Map<string, ExcelJS.Workbook>; // For file-per-object mode
    private data: Map<string, any[]>;
    private idCounters: Map<string, number>;
    private filePath: string;
    private fileStorageMode: FileStorageMode;

    constructor(config: ExcelDriverConfig) {
        this.config = {
            autoSave: true,
            createIfMissing: true,
            strictMode: false,
            fileStorageMode: 'single-file',
            ...config
        };
        
        this.filePath = path.resolve(config.filePath);
        this.fileStorageMode = this.config.fileStorageMode!;
        this.data = new Map<string, any[]>();
        this.idCounters = new Map<string, number>();
        this.workbooks = new Map<string, ExcelJS.Workbook>();
        
        // Initialize workbook for single-file mode
        if (this.fileStorageMode === 'single-file') {
            this.workbook = new ExcelJS.Workbook();
        }
        
        // Note: Actual file loading happens in init()
        // Call init() after construction or use the async create() factory method
    }

    /**
     * Initialize the driver by loading the workbook from file.
     * This must be called after construction before using the driver.
     */
    async init(): Promise<void> {
        await this.loadWorkbook();
    }

    /**
     * Connect to the database (for DriverInterface compatibility)
     * This calls init() to load the workbook.
     */
    async connect(): Promise<void> {
        await this.init();
    }

    /**
     * Check database connection health
     */
    async checkHealth(): Promise<boolean> {
        try {
            if (this.fileStorageMode === 'single-file') {
                // Check if file exists or can be created
                if (!fs.existsSync(this.filePath)) {
                    if (!this.config.createIfMissing) {
                        return false;
                    }
                    // Check if directory is writable
                    const dir = path.dirname(this.filePath);
                    if (!fs.existsSync(dir)) {
                        return false;
                    }
                }
                return true;
            } else {
                // Check if directory exists or can be created
                if (!fs.existsSync(this.filePath)) {
                    if (!this.config.createIfMissing) {
                        return false;
                    }
                }
                return true;
            }
        } catch (error) {
            return false;
        }
    }

    /**
     * Factory method to create and initialize the driver.
     */
    static async create(config: ExcelDriverConfig): Promise<ExcelDriver> {
        const driver = new ExcelDriver(config);
        await driver.init();
        return driver;
    }

    /**
     * Load workbook from file or create a new one.
     * Handles both single-file and file-per-object modes.
     */
    private async loadWorkbook(): Promise<void> {
        if (this.fileStorageMode === 'single-file') {
            await this.loadSingleFileWorkbook();
        } else {
            await this.loadFilePerObjectWorkbooks();
        }
    }

    /**
     * Load workbook in single-file mode (all objects in one Excel file).
     */
    private async loadSingleFileWorkbook(): Promise<void> {
        this.workbook = new ExcelJS.Workbook();
        
        if (fs.existsSync(this.filePath)) {
            try {
                await this.workbook.xlsx.readFile(this.filePath);
                this.loadDataFromWorkbook();
            } catch (error) {
                const errorMessage = (error as Error).message;
                
                // Provide helpful error messages for common issues
                let detailedMessage = `Failed to read Excel file: ${this.filePath}`;
                if (errorMessage.includes('corrupted') || errorMessage.includes('invalid')) {
                    detailedMessage += ' - File may be corrupted or not a valid .xlsx file';
                } else if (errorMessage.includes('permission') || errorMessage.includes('EACCES')) {
                    detailedMessage += ' - Permission denied. Check file permissions.';
                } else if (errorMessage.includes('EBUSY')) {
                    detailedMessage += ' - File is locked by another process. Close it and try again.';
                }
                
                throw new ObjectQLError({
                    code: 'FILE_READ_ERROR',
                    message: detailedMessage,
                    details: { 
                        filePath: this.filePath,
                        error: errorMessage 
                    }
                });
            }
        } else if (this.config.createIfMissing) {
            // Create new empty workbook
            await this.saveWorkbook();
        } else {
            throw new ObjectQLError({
                code: 'FILE_NOT_FOUND',
                message: `Excel file not found: ${this.filePath}`,
                details: { filePath: this.filePath }
            });
        }
    }

    /**
     * Load workbooks in file-per-object mode (each object in separate Excel file).
     */
    private async loadFilePerObjectWorkbooks(): Promise<void> {
        // Ensure directory exists
        if (!fs.existsSync(this.filePath)) {
            if (this.config.createIfMissing) {
                fs.mkdirSync(this.filePath, { recursive: true });
            } else {
                throw new ObjectQLError({
                    code: 'DIRECTORY_NOT_FOUND',
                    message: `Directory not found: ${this.filePath}`,
                    details: { filePath: this.filePath }
                });
            }
        }

        // Check if it's actually a directory
        const stats = fs.statSync(this.filePath);
        if (!stats.isDirectory()) {
            throw new ObjectQLError({
                code: 'INVALID_PATH',
                message: `Path must be a directory in file-per-object mode: ${this.filePath}`,
                details: { filePath: this.filePath }
            });
        }

        // Load all existing .xlsx files in the directory
        const files = fs.readdirSync(this.filePath);
        for (const file of files) {
            if (file.endsWith('.xlsx') && !file.startsWith('~$')) {
                const objectName = file.replace('.xlsx', '');
                const filePath = path.join(this.filePath, file);
                
                try {
                    const workbook = new ExcelJS.Workbook();
                    await workbook.xlsx.readFile(filePath);
                    this.workbooks.set(objectName, workbook);
                    
                    // Load data from first worksheet
                    const worksheet = workbook.worksheets[0];
                    if (worksheet) {
                        this.loadDataFromSingleWorksheet(worksheet, objectName);
                    }
                } catch (error) {
                    console.warn(`[ExcelDriver] Warning: Failed to load file ${file}:`, (error as Error).message);
                }
            }
        }
    }

    /**
     * Load data from workbook into memory.
     * 
     * Expected Excel format:
     * - First row contains column headers (field names)
     * - Subsequent rows contain data records
     * - Each worksheet represents one object type
     */
    private loadDataFromWorkbook(): void {
        this.workbook.eachSheet((worksheet) => {
            this.loadDataFromSingleWorksheet(worksheet, worksheet.name);
        });
    }

    /**
     * Load data from a single worksheet into memory.
     */
    private loadDataFromSingleWorksheet(worksheet: ExcelJS.Worksheet, objectName: string): void {
        const records: any[] = [];
        
        // Get headers from first row
        const headerRow = worksheet.getRow(1);
        const headers: string[] = [];
        headerRow.eachCell((cell: any, colNumber: number) => {
            const headerValue = cell.value;
            if (headerValue) {
                headers[colNumber - 1] = String(headerValue);
            }
        });
        
        // Warn if worksheet has no headers (might be corrupted or wrong format)
        if (headers.length === 0 && worksheet.rowCount > 0) {
            console.warn(`[ExcelDriver] Warning: Worksheet "${objectName}" has no headers in first row. Skipping.`);
            return;
        }
        
        // Skip first row (headers) and read data rows
        let rowsProcessed = 0;
        let rowsSkipped = 0;
        
        worksheet.eachRow((row: any, rowNumber: number) => {
            if (rowNumber === 1) return; // Skip header row
            
            const record: any = {};
            let hasData = false;
            
            row.eachCell((cell: any, colNumber: number) => {
                const header = headers[colNumber - 1];
                if (header) {
                    record[header] = cell.value;
                    hasData = true;
                }
            });
            
            // Skip completely empty rows
            if (!hasData) {
                rowsSkipped++;
                return;
            }
            
            // Ensure ID exists
            if (!record.id) {
                record.id = this.generateId(objectName);
            }
            
            records.push(record);
            rowsProcessed++;
        });
        
        // Log summary for debugging
        if (rowsSkipped > 0) {
            console.warn(`[ExcelDriver] Worksheet "${objectName}": Processed ${rowsProcessed} rows, skipped ${rowsSkipped} empty rows`);
        }
        
        this.data.set(objectName, records);
        this.updateIdCounter(objectName, records);
    }

    /**
     * Update ID counter based on existing records.
     * 
     * Attempts to extract counter from auto-generated IDs (format: objectName-timestamp-counter).
     * If IDs don't follow this format, counter starts from existing record count.
     */
    private updateIdCounter(objectName: string, records: any[]): void {
        let maxCounter = 0;
        for (const record of records) {
            if (record.id) {
                // Try to extract counter from generated IDs (format: objectName-timestamp-counter)
                const idStr = String(record.id);
                const parts = idStr.split('-');
                
                // Only parse if it matches the expected auto-generated format
                if (parts.length === 3 && parts[0] === objectName && !isNaN(Number(parts[2]))) {
                    const counter = Number(parts[2]);
                    if (counter > maxCounter) {
                        maxCounter = counter;
                    }
                }
            }
        }
        
        // If no auto-generated IDs found, start from record count to avoid collisions
        if (maxCounter === 0 && records.length > 0) {
            maxCounter = records.length;
        }
        
        this.idCounters.set(objectName, maxCounter);
    }

    /**
     * Save workbook to file.
     */
    /**
     * Save workbook to file.
     * Handles both single-file and file-per-object modes.
     */
    private async saveWorkbook(objectName?: string): Promise<void> {
        if (this.fileStorageMode === 'single-file') {
            await this.saveSingleFileWorkbook();
        } else if (objectName) {
            await this.saveFilePerObjectWorkbook(objectName);
        }
    }

    /**
     * Save workbook in single-file mode.
     */
    private async saveSingleFileWorkbook(): Promise<void> {
        try {
            // Ensure directory exists
            const dir = path.dirname(this.filePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            
            // Write workbook to file
            await this.workbook.xlsx.writeFile(this.filePath);
        } catch (error) {
            throw new ObjectQLError({
                code: 'FILE_WRITE_ERROR',
                message: `Failed to write Excel file: ${this.filePath}`,
                details: { error: (error as Error).message }
            });
        }
    }

    /**
     * Save workbook in file-per-object mode.
     */
    private async saveFilePerObjectWorkbook(objectName: string): Promise<void> {
        const workbook = this.workbooks.get(objectName);
        if (!workbook) {
            throw new ObjectQLError({
                code: 'WORKBOOK_NOT_FOUND',
                message: `Workbook not found for object: ${objectName}`,
                details: { objectName }
            });
        }

        try {
            const filePath = path.join(this.filePath, `${objectName}.xlsx`);
            await workbook.xlsx.writeFile(filePath);
        } catch (error) {
            throw new ObjectQLError({
                code: 'FILE_WRITE_ERROR',
                message: `Failed to write Excel file for object: ${objectName}`,
                details: { objectName, error: (error as Error).message }
            });
        }
    }

    /**
     * Sync in-memory data to workbook.
     * 
     * Creates or updates a worksheet for the given object type.
     */
    private async syncToWorkbook(objectName: string): Promise<void> {
        if (this.fileStorageMode === 'single-file') {
            await this.syncToSingleFileWorkbook(objectName);
        } else {
            await this.syncToFilePerObjectWorkbook(objectName);
        }
    }

    /**
     * Sync data to worksheet in single-file mode.
     */
    private async syncToSingleFileWorkbook(objectName: string): Promise<void> {
        const records = this.data.get(objectName) || [];
        
        // Remove existing worksheet if it exists
        const existingSheet = this.workbook.getWorksheet(objectName);
        if (existingSheet) {
            this.workbook.removeWorksheet(existingSheet.id);
        }
        
        // Create new worksheet
        const worksheet = this.workbook.addWorksheet(objectName);
        
        if (records.length > 0) {
            // Get all unique keys from records to create headers
            const headers = new Set<string>();
            records.forEach(record => {
                Object.keys(record).forEach(key => headers.add(key));
            });
            const headerArray = Array.from(headers);
            
            // Add header row
            worksheet.addRow(headerArray);
            
            // Add data rows
            records.forEach(record => {
                const row = headerArray.map(header => record[header]);
                worksheet.addRow(row);
            });
            
            // Auto-fit columns
            worksheet.columns.forEach((column: any) => {
                if (column.header) {
                    column.width = Math.max(10, String(column.header).length + 2);
                }
            });
        }
        
        // Auto-save if enabled
        if (this.config.autoSave) {
            await this.saveWorkbook();
        }
    }

    /**
     * Sync data to separate file in file-per-object mode.
     */
    private async syncToFilePerObjectWorkbook(objectName: string): Promise<void> {
        const records = this.data.get(objectName) || [];
        
        // Get or create workbook for this object
        let workbook = this.workbooks.get(objectName);
        if (!workbook) {
            workbook = new ExcelJS.Workbook();
            this.workbooks.set(objectName, workbook);
        }
        
        // Remove all existing worksheets
        workbook.worksheets.forEach(ws => workbook!.removeWorksheet(ws.id));
        
        // Create new worksheet
        const worksheet = workbook.addWorksheet(objectName);
        
        if (records.length > 0) {
            // Get all unique keys from records to create headers
            const headers = new Set<string>();
            records.forEach(record => {
                Object.keys(record).forEach(key => headers.add(key));
            });
            const headerArray = Array.from(headers);
            
            // Add header row
            worksheet.addRow(headerArray);
            
            // Add data rows
            records.forEach(record => {
                const row = headerArray.map(header => record[header]);
                worksheet.addRow(row);
            });
            
            // Auto-fit columns
            worksheet.columns.forEach((column: any) => {
                if (column.header) {
                    column.width = Math.max(10, String(column.header).length + 2);
                }
            });
        }
        
        // Auto-save if enabled
        if (this.config.autoSave) {
            await this.saveWorkbook(objectName);
        }
    }

    /**
     * Find multiple records matching the query criteria.
     */
    async find(objectName: string, query: any = {}, options?: any): Promise<any[]> {
        // Normalize query to support both legacy and QueryAST formats
        const normalizedQuery = this.normalizeQuery(query);
        let results = this.data.get(objectName) || [];
        
        // Return empty array if no data
        if (results.length === 0) {
            return [];
        }
        
        // Deep copy to avoid mutations
        results = results.map(r => ({ ...r }));
        
        // Apply filters
        if (normalizedQuery.filters) {
            results = this.applyFilters(results, normalizedQuery.filters);
        }
        
        // Apply sorting
        if (normalizedQuery.sort && Array.isArray(normalizedQuery.sort)) {
            results = this.applySort(results, normalizedQuery.sort);
        }
        
        // Apply pagination
        if (normalizedQuery.skip) {
            results = results.slice(normalizedQuery.skip);
        }
        if (normalizedQuery.limit) {
            results = results.slice(0, normalizedQuery.limit);
        }
        
        // Apply field projection
        if (normalizedQuery.fields && Array.isArray(normalizedQuery.fields)) {
            results = results.map(doc => this.projectFields(doc, normalizedQuery.fields));
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
        await this.syncToWorkbook(objectName);
        
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
        await this.syncToWorkbook(objectName);
        
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
        await this.syncToWorkbook(objectName);
        
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
            await this.syncToWorkbook(objectName);
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
            await this.syncToWorkbook(objectName);
        }
        
        return { deletedCount };
    }

    /**
     * Manually save the workbook to file.
     */
    /**
     * Manually save the workbook to file.
     */
    async save(): Promise<void> {
        if (this.fileStorageMode === 'single-file') {
            await this.saveWorkbook();
        } else {
            // Save all object files in file-per-object mode
            for (const objectName of this.data.keys()) {
                await this.saveWorkbook(objectName);
            }
        }
    }

    /**
     * Disconnect (flush any pending writes).
     */
    async disconnect(): Promise<void> {
        if (this.config.autoSave) {
            await this.save();
        }
    }

    /**
     * Execute a query using QueryAST (DriverInterface v4.0 method)
     * 
     * This method handles all query operations using the standard QueryAST format
     * from @objectstack/spec. It converts the AST to the legacy query format
     * and delegates to the existing find() method.
     * 
     * @param ast - The query AST to execute
     * @param options - Optional execution options
     * @returns Query results with value array and count
     */
    async executeQuery(ast: QueryAST, options?: any): Promise<{ value: any[]; count?: number }> {
        const objectName = ast.object || '';
        
        // Convert QueryAST to legacy query format
        const legacyQuery: any = {
            fields: ast.fields,
            filters: this.convertFilterNodeToLegacy(ast.filters),
            sort: ast.sort?.map((s: SortNode) => [s.field, s.order]),
            limit: ast.top,
            skip: ast.skip,
        };
        
        // Use existing find method
        const results = await this.find(objectName, legacyQuery, options);
        
        return {
            value: results,
            count: results.length
        };
    }

    /**
     * Execute a command (DriverInterface v4.0 method)
     * 
     * This method handles all mutation operations (create, update, delete)
     * using a unified command interface.
     * 
     * @param command - The command to execute
     * @param options - Optional execution options
     * @returns Command execution result
     */
    async executeCommand(command: Command, options?: any): Promise<CommandResult> {
        try {
            const cmdOptions = { ...options, ...command.options };
            
            switch (command.type) {
                case 'create':
                    if (!command.data) {
                        throw new Error('Create command requires data');
                    }
                    const created = await this.create(command.object, command.data, cmdOptions);
                    return {
                        success: true,
                        data: created,
                        affected: 1
                    };
                
                case 'update':
                    if (!command.id || !command.data) {
                        throw new Error('Update command requires id and data');
                    }
                    const updated = await this.update(command.object, command.id, command.data, cmdOptions);
                    return {
                        success: true,
                        data: updated,
                        affected: 1
                    };
                
                case 'delete':
                    if (!command.id) {
                        throw new Error('Delete command requires id');
                    }
                    await this.delete(command.object, command.id, cmdOptions);
                    return {
                        success: true,
                        affected: 1
                    };
                
                case 'bulkCreate':
                    if (!command.records || !Array.isArray(command.records)) {
                        throw new Error('BulkCreate command requires records array');
                    }
                    const bulkCreated = [];
                    for (const record of command.records) {
                        const created = await this.create(command.object, record, cmdOptions);
                        bulkCreated.push(created);
                    }
                    return {
                        success: true,
                        data: bulkCreated,
                        affected: command.records.length
                    };
                
                case 'bulkUpdate':
                    if (!command.updates || !Array.isArray(command.updates)) {
                        throw new Error('BulkUpdate command requires updates array');
                    }
                    const updateResults = [];
                    for (const update of command.updates) {
                        const result = await this.update(command.object, update.id, update.data, cmdOptions);
                        updateResults.push(result);
                    }
                    return {
                        success: true,
                        data: updateResults,
                        affected: command.updates.length
                    };
                
                case 'bulkDelete':
                    if (!command.ids || !Array.isArray(command.ids)) {
                        throw new Error('BulkDelete command requires ids array');
                    }
                    let deleted = 0;
                    for (const id of command.ids) {
                        const result = await this.delete(command.object, id, cmdOptions);
                        if (result) deleted++;
                    }
                    return {
                        success: true,
                        affected: deleted
                    };
                
                default:
                    throw new Error(`Unsupported command type: ${(command as any).type}`);
            }
        } catch (error: any) {
            return {
                success: false,
                affected: 0,
                error: error.message || 'Unknown error occurred'
            };
        }
    }

    /**
     * Execute raw command (for compatibility)
     * 
     * @param command - Command string or object
     * @param parameters - Command parameters
     * @param options - Execution options
     */
    async execute(command: any, parameters?: any[], options?: any): Promise<any> {
        throw new Error('Excel driver does not support raw command execution. Use executeCommand() instead.');
    }

    // ========== Helper Methods ==========

    /**
     * Convert FilterNode from QueryAST to legacy filter format.
     * 
     * @param node - The FilterNode to convert
     * @returns Legacy filter array format
     */
    private convertFilterNodeToLegacy(node?: FilterNode): any {
        if (!node) return undefined;
        
        switch (node.type) {
            case 'comparison':
                // Convert comparison node to [field, operator, value] format
                const operator = node.operator || '=';
                return [[node.field, operator, node.value]];
            
            case 'and':
                // Convert AND node to array with 'and' separator
                if (!node.children || node.children.length === 0) return undefined;
                const andResults: any[] = [];
                for (const child of node.children) {
                    const converted = this.convertFilterNodeToLegacy(child);
                    if (converted) {
                        if (andResults.length > 0) {
                            andResults.push('and');
                        }
                        andResults.push(...(Array.isArray(converted) ? converted : [converted]));
                    }
                }
                return andResults.length > 0 ? andResults : undefined;
            
            case 'or':
                // Convert OR node to array with 'or' separator
                if (!node.children || node.children.length === 0) return undefined;
                const orResults: any[] = [];
                for (const child of node.children) {
                    const converted = this.convertFilterNodeToLegacy(child);
                    if (converted) {
                        if (orResults.length > 0) {
                            orResults.push('or');
                        }
                        orResults.push(...(Array.isArray(converted) ? converted : [converted]));
                    }
                }
                return orResults.length > 0 ? orResults : undefined;
            
            case 'not':
                // NOT is complex - we'll just process the first child for now
                if (node.children && node.children.length > 0) {
                    return this.convertFilterNodeToLegacy(node.children[0]);
                }
                return undefined;
            
            default:
                return undefined;
        }
    }

    /**
     * Normalizes query format to support both legacy UnifiedQuery and QueryAST formats.
     * This ensures backward compatibility while supporting the new @objectstack/spec interface.
     * 
     * QueryAST format uses 'top' for limit, while UnifiedQuery uses 'limit'.
     * QueryAST sort is array of {field, order}, while UnifiedQuery is array of [field, order].
     */
    private normalizeQuery(query: any): any {
        if (!query) return {};
        
        const normalized: any = { ...query };
        
        // Normalize limit/top
        if (normalized.top !== undefined && normalized.limit === undefined) {
            normalized.limit = normalized.top;
        }
        
        // Normalize sort format
        if (normalized.sort && Array.isArray(normalized.sort)) {
            // Check if it's already in the array format [field, order]
            const firstSort = normalized.sort[0];
            if (firstSort && typeof firstSort === 'object' && !Array.isArray(firstSort)) {
                // Convert from QueryAST format {field, order} to internal format [field, order]
                normalized.sort = normalized.sort.map((item: any) => [
                    item.field,
                    item.order || item.direction || item.dir || 'asc'
                ]);
            }
        }
        
        return normalized;
    }

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
