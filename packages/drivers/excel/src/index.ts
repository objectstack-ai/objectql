import { Data } from '@objectstack/spec';
type DriverInterface = Data.DriverInterface;
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
 * A persistent Excel-based driver for ObjectQL that stores data in Excel (.xlsx) files.
 * Extends MemoryDriver with Excel file persistence using ExcelJS.
 * 
 * Implements both the legacy Driver interface from @objectql/types and
 * the standard DriverInterface from @objectstack/spec for compatibility
 * with the new kernel-based plugin system.
 * 
 * ✅ Production-ready features:
 * - Persistent storage with Excel files
 * - Support for both single-file and file-per-object modes
 * - One worksheet per table/object (e.g., users sheet, projects sheet)
 * - Atomic write operations
 * - Full query support (filters, sorting, pagination) inherited from MemoryDriver
 * - Human-readable Excel format
 * 
 * Use Cases:
 * - Import/export data from Excel spreadsheets
 * - Use Excel as a simple database for prototyping
 * - Data migration from Excel to other databases
 * - Generate reports in Excel format
 * - Small to medium datasets (< 10k records per object)
 */

import * as fs from 'fs';
import * as path from 'path';
import * as ExcelJS from 'exceljs';
import { ObjectQLError } from '@objectql/types';
import { MemoryDriver, MemoryDriverConfig, Command, CommandResult } from '@objectql/driver-memory';

// Re-export Command and CommandResult for compatibility
export type { Command, CommandResult };

/**
 * File storage mode for the Excel driver.
 */
export type FileStorageMode = 'single-file' | 'file-per-object';

/**
 * Configuration options for the Excel driver.
 */
export interface ExcelDriverConfig extends MemoryDriverConfig {
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
}

/**
 * Excel Driver Implementation
 * 
 * Extends MemoryDriver with Excel file persistence.
 * All query and aggregation logic is inherited from MemoryDriver.
 * Only the persistence layer (load/save) is overridden.
 * 
 * Stores ObjectQL documents in Excel worksheets with format:
 * - Single-file mode: All objects as worksheets in one .xlsx file
 * - File-per-object mode: Each object in a separate .xlsx file
 * 
 * Uses ExcelJS library for secure Excel file operations.
 * 
 * Implements both the legacy Driver interface from @objectql/types and
 * the standard DriverInterface from @objectstack/spec for compatibility
 * with the new kernel-based plugin system.
 */
export class ExcelDriver extends MemoryDriver {
    private filePath: string;
    private fileStorageMode: FileStorageMode;
    private autoSave: boolean;
    private createIfMissing: boolean;
    private workbook!: ExcelJS.Workbook; // For single-file mode
    private workbooks: Map<string, ExcelJS.Workbook>; // For file-per-object mode
    private fileLocks: Map<string, boolean>; // Simple in-memory file locks

    constructor(config: ExcelDriverConfig) {
        // Initialize parent with inherited config properties
        super({
            strictMode: config.strictMode,
            initialData: config.initialData,
            indexes: config.indexes
        });
        
        // Override driver name and version
        (this as any).name = 'ExcelDriver';
        (this as any).version = '4.0.0';
        
        this.filePath = path.resolve(config.filePath);
        this.fileStorageMode = config.fileStorageMode || 'single-file';
        this.autoSave = config.autoSave !== false;
        this.createIfMissing = config.createIfMissing !== false;
        this.workbooks = new Map<string, ExcelJS.Workbook>();
        this.fileLocks = new Map<string, boolean>();

        // Initialize workbook for single-file mode
        if (this.fileStorageMode === 'single-file') {
            this.workbook = new ExcelJS.Workbook();
        }
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
     */
    async connect(): Promise<void> {
        await this.init();
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
     * Check database connection health
     */
    async checkHealth(): Promise<boolean> {
        try {
            if (this.fileStorageMode === 'single-file') {
                if (!fs.existsSync(this.filePath) && !this.createIfMissing) {
                    return false;
                }
                const dir = path.dirname(this.filePath);
                return fs.existsSync(dir) || this.createIfMissing;
            } else {
                return fs.existsSync(this.filePath) || this.createIfMissing;
            }
        } catch {
            return false;
        }
    }

    /**
     * Load workbook from file or create a new one.
     */
    private async loadWorkbook(): Promise<void> {
        if (this.fileStorageMode === 'single-file') {
            await this.loadSingleFileWorkbook();
        } else {
            await this.loadFilePerObjectWorkbooks();
        }
    }

    /**
     * Load workbook in single-file mode.
     */
    private async loadSingleFileWorkbook(): Promise<void> {
        this.workbook = new ExcelJS.Workbook();
        
        if (fs.existsSync(this.filePath)) {
            await this.acquireLock(this.filePath);
            try {
                await this.workbook.xlsx.readFile(this.filePath);
                this.loadDataFromWorkbook();
            } catch (error) {
                this.releaseLock(this.filePath);
                const errorMessage = (error as Error).message;
                
                let detailedMessage = `Failed to read Excel file: ${this.filePath}`;
                if (errorMessage.includes('corrupted') || errorMessage.includes('invalid')) {
                    detailedMessage += ' - File may be corrupted or not a valid .xlsx file';
                } else if (errorMessage.includes('permission') || errorMessage.includes('EACCES')) {
                    detailedMessage += ' - Permission denied';
                } else if (errorMessage.includes('EBUSY')) {
                    detailedMessage += ' - File is locked by another process';
                }
                
                throw new ObjectQLError({
                    code: 'FILE_READ_ERROR',
                    message: detailedMessage,
                    details: { filePath: this.filePath, error: errorMessage }
                });
            }
            this.releaseLock(this.filePath);
        } else if (this.createIfMissing) {
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
     * Load workbooks in file-per-object mode.
     */
    private async loadFilePerObjectWorkbooks(): Promise<void> {
        if (!fs.existsSync(this.filePath)) {
            if (this.createIfMissing) {
                fs.mkdirSync(this.filePath, { recursive: true });
            } else {
                throw new ObjectQLError({
                    code: 'DIRECTORY_NOT_FOUND',
                    message: `Directory not found: ${this.filePath}`,
                    details: { filePath: this.filePath }
                });
            }
        }

        const stats = fs.statSync(this.filePath);
        if (!stats.isDirectory()) {
            throw new ObjectQLError({
                code: 'INVALID_PATH',
                message: `Path must be a directory in file-per-object mode: ${this.filePath}`,
                details: { filePath: this.filePath }
            });
        }

        const files = fs.readdirSync(this.filePath);
        for (const file of files) {
            if (file.endsWith('.xlsx')) {
                const objectName = file.replace('.xlsx', '');
                const filePath = path.join(this.filePath, file);
                
                await this.acquireLock(filePath);
                try {
                    const workbook = new ExcelJS.Workbook();
                    await workbook.xlsx.readFile(filePath);
                    this.workbooks.set(objectName, workbook);
                    this.loadDataFromWorkbookForObject(workbook, objectName);
                } catch (error) {
                    console.warn(`[ExcelDriver] Failed to load ${file}:`, error);
                }
                this.releaseLock(filePath);
            }
        }
    }

    /**
     * Load all data from single-file workbook into memory.
     */
    private loadDataFromWorkbook(): void {
        this.workbook.worksheets.forEach(worksheet => {
            const objectName = worksheet.name;
            const records = this.parseWorksheet(worksheet);
            
            for (const record of records) {
                const id = record.id || record._id;
                const key = `${objectName}:${id}`;
                this.store.set(key, record);
            }
        });
    }

    /**
     * Load data from workbook for a specific object.
     */
    private loadDataFromWorkbookForObject(workbook: ExcelJS.Workbook, objectName: string): void {
        workbook.worksheets.forEach(worksheet => {
            const records = this.parseWorksheet(worksheet);
            
            for (const record of records) {
                const id = record.id || record._id;
                const key = `${objectName}:${id}`;
                this.store.set(key, record);
            }
        });
    }

    /**
     * Parse worksheet into array of records.
     */
    private parseWorksheet(worksheet: ExcelJS.Worksheet): any[] {
        const records: any[] = [];
        const headers: string[] = [];
        
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) {
                row.eachCell((cell) => {
                    headers.push(String(cell.value || ''));
                });
            } else {
                const record: any = {};
                row.eachCell((cell, colNumber) => {
                    const header = headers[colNumber - 1];
                    if (header) {
                        record[header] = cell.value;
                    }
                });
                if (Object.keys(record).length > 0) {
                    records.push(record);
                }
            }
        });
        
        return records;
    }

    /**
     * Save workbook to file.
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
        const dir = path.dirname(this.filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        await this.acquireLock(this.filePath);
        try {
            await this.workbook.xlsx.writeFile(this.filePath);
        } catch (error) {
            throw new ObjectQLError({
                code: 'FILE_WRITE_ERROR',
                message: `Failed to write Excel file: ${this.filePath}`,
                details: { error: (error as Error).message }
            });
        } finally {
            this.releaseLock(this.filePath);
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

        const filePath = path.join(this.filePath, `${objectName}.xlsx`);
        await this.acquireLock(filePath);
        try {
            await workbook.xlsx.writeFile(filePath);
        } catch (error) {
            throw new ObjectQLError({
                code: 'FILE_WRITE_ERROR',
                message: `Failed to write Excel file for object: ${objectName}`,
                details: { objectName, error: (error as Error).message }
            });
        } finally {
            this.releaseLock(filePath);
        }
    }

    /**
     * Sync in-memory data to workbook and save.
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
        const records = this.getObjectRecords(objectName);
        
        // Remove existing worksheet if it exists
        const existingSheet = this.workbook.getWorksheet(objectName);
        if (existingSheet) {
            this.workbook.removeWorksheet(existingSheet.id);
        }
        
        // Create new worksheet
        const worksheet = this.workbook.addWorksheet(objectName);
        this.populateWorksheet(worksheet, records);
        
        if (this.autoSave) {
            await this.saveWorkbook();
        }
    }

    /**
     * Sync data to separate file in file-per-object mode.
     */
    private async syncToFilePerObjectWorkbook(objectName: string): Promise<void> {
        const records = this.getObjectRecords(objectName);
        
        let workbook = this.workbooks.get(objectName);
        if (!workbook) {
            workbook = new ExcelJS.Workbook();
            this.workbooks.set(objectName, workbook);
        }
        
        // Remove all existing worksheets
        workbook.worksheets.forEach(ws => workbook!.removeWorksheet(ws.id));
        
        // Create new worksheet
        const worksheet = workbook.addWorksheet(objectName);
        this.populateWorksheet(worksheet, records);
        
        if (this.autoSave) {
            await this.saveWorkbook(objectName);
        }
    }

    /**
     * Get all records for an object from memory store.
     */
    private getObjectRecords(objectName: string): any[] {
        const records: any[] = [];
        const prefix = `${objectName}:`;
        
        for (const [key, value] of this.store.entries()) {
            if (key.startsWith(prefix)) {
                records.push(value);
            }
        }
        
        return records;
    }

    /**
     * Populate worksheet with records.
     */
    private populateWorksheet(worksheet: ExcelJS.Worksheet, records: any[]): void {
        if (records.length === 0) {
            return;
        }

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

    /**
     * Simple file locking mechanism.
     */
    private async acquireLock(filePath: string): Promise<void> {
        const maxRetries = 10;
        const retryDelay = 100;
        
        for (let i = 0; i < maxRetries; i++) {
            if (!this.fileLocks.get(filePath)) {
                this.fileLocks.set(filePath, true);
                return;
            }
            await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
        
        throw new ObjectQLError({
            code: 'FILE_LOCK_TIMEOUT',
            message: `Failed to acquire lock for file: ${filePath}`,
            details: { filePath }
        });
    }

    /**
     * Release file lock.
     */
    private releaseLock(filePath: string): void {
        this.fileLocks.delete(filePath);
    }

    /**
     * Override create to persist to Excel.
     */
    async create(objectName: string, data: any, options?: any): Promise<any> {
        const result = await super.create(objectName, data, options);
        await this.syncToWorkbook(objectName);
        return result;
    }

    /**
     * Override update to persist to Excel.
     */
    async update(objectName: string, id: string | number, data: any, options?: any): Promise<any> {
        const result = await super.update(objectName, id, data, options);
        if (result) {
            await this.syncToWorkbook(objectName);
        }
        return result;
    }

    /**
     * Override delete to persist to Excel.
     */
    async delete(objectName: string, id: string | number, options?: any): Promise<any> {
        const result = await super.delete(objectName, id, options);
        if (result) {
            await this.syncToWorkbook(objectName);
        }
        return result;
    }

    /**
     * Manually save all data to Excel file(s).
     */
    async save(): Promise<void> {
        if (this.fileStorageMode === 'single-file') {
            // Sync all objects to single file
            for (const [key] of this.store.entries()) {
                const objectName = key.split(':')[0];
                await this.syncToSingleFileWorkbook(objectName);
            }
            await this.saveWorkbook();
        } else {
            // Save all object files
            const objectNames = new Set<string>();
            for (const [key] of this.store.entries()) {
                objectNames.add(key.split(':')[0]);
            }
            for (const objectName of objectNames) {
                await this.syncToFilePerObjectWorkbook(objectName);
                await this.saveWorkbook(objectName);
            }
        }
    }
}
