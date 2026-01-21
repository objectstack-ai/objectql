/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * ====================================================================
 * Custom In-Memory Driver for ObjectStack
 * ====================================================================
 * 
 * This is a tutorial implementation showing how to build a custom
 * driver for ObjectStack. It demonstrates:
 * 
 * 1. Implementing the Driver interface
 * 2. CRUD operations (Create, Read, Update, Delete)
 * 3. Query support (filters, sorting, pagination)
 * 4. Type handling with ObjectQL types
 * 
 * This driver stores data in JavaScript Maps and is perfect for:
 * - Learning driver development
 * - Testing without database setup
 * - Prototyping and demos
 * - Edge environments (Cloudflare Workers, Deno)
 */

import { Driver, ObjectQLError, UnifiedQuery } from '@objectql/types';

/**
 * Configuration options for the In-Memory driver
 */
export interface DriverOptions {
    /** Optional: Initial data to populate */
    initialData?: Record<string, any[]>;
    /** Optional: Enable strict mode (throw errors on missing records) */
    strictMode?: boolean;
}

/**
 * In-Memory Driver Implementation
 * 
 * This driver implements the Driver interface from @objectql/types.
 * All data is stored in a JavaScript Map with keys formatted as:
 * `objectName:id` → `{id, ...data}`
 */
export class InMemoryDriver implements Driver {
    name = 'InMemory';
    private store = new Map<string, Map<string, any>>();
    private config: DriverOptions;

    constructor(config: DriverOptions = {}) {
        this.config = config;
        
        // Load initial data if provided
        if (config.initialData) {
            this.loadInitialData(config.initialData);
        }
    }

    /**
     * ====================================================================
     * 1. CONNECTION METHODS
     * ====================================================================
     */

    async connect(): Promise<void> {
        // No-op for in-memory driver
        console.log('[InMemoryDriver] Connected');
    }

    async disconnect(): Promise<void> {
        // Optional cleanup
        console.log('[InMemoryDriver] Disconnected');
    }

    /**
     * ====================================================================
     * 2. CRUD OPERATIONS
     * ====================================================================
     */

    /**
     * Find (Query)
     * 
     * The find method accepts a UnifiedQuery object which contains:
     * - filters: Array of filter conditions
     * - sort: Array of sort specifications
     * - skip/limit: Pagination parameters
     * - fields: Field projection
     */
    async find(objectName: string, query: any = {}, options?: any): Promise<any[]> {
        // Get the object table
        const table = this.store.get(objectName);
        if (!table) {
            return [];
        }

        // Convert Map to array
        let results = Array.from(table.values()).map(doc => ({ ...doc }));

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
     * Find One
     * 
     * Find a single record by ID
     */
    async findOne(objectName: string, id: string | number, query?: any, options?: any): Promise<any> {
        const table = this.store.get(objectName);
        if (!table) {
            return null;
        }

        const record = table.get(String(id));
        return record ? { ...record } : null;
    }

    /**
     * Insert (Create)
     * 
     * Insert a new record into the data store
     */
    async create(objectName: string, data: any, options?: any): Promise<any> {
        // Ensure table exists
        if (!this.store.has(objectName)) {
            this.store.set(objectName, new Map());
        }

        const table = this.store.get(objectName)!;

        // Generate ID if not provided
        const id = data.id || this.generateId(objectName);

        // Check for duplicate
        if (table.has(String(id))) {
            throw new ObjectQLError({
                code: 'CONFLICT',
                message: `Record with id '${id}' already exists in '${objectName}'`,
                details: { objectName, id }
            });
        }

        // Add timestamps
        const now = new Date().toISOString();
        const record = {
            ...data,
            id,
            created_at: data.created_at || now,
            updated_at: data.updated_at || now
        };

        table.set(String(id), record);
        return { ...record };
    }

    /**
     * Update
     * 
     * Update an existing record by ID
     */
    async update(objectName: string, id: string | number, data: any, options?: any): Promise<any> {
        const table = this.store.get(objectName);
        if (!table) {
            if (this.config.strictMode) {
                throw new ObjectQLError({
                    code: 'NOT_FOUND',
                    message: `Object '${objectName}' not found`,
                    details: { objectName }
                });
            }
            return null;
        }

        const existing = table.get(String(id));
        if (!existing) {
            if (this.config.strictMode) {
                throw new ObjectQLError({
                    code: 'NOT_FOUND',
                    message: `Record with id '${id}' not found in '${objectName}'`,
                    details: { objectName, id }
                });
            }
            return null;
        }

        // Merge data
        const updated = {
            ...existing,
            ...data,
            id, // Preserve ID
            created_at: existing.created_at, // Preserve created_at
            updated_at: new Date().toISOString()
        };

        table.set(String(id), updated);
        return { ...updated };
    }

    /**
     * Delete
     * 
     * Delete a record by ID
     */
    async delete(objectName: string, id: string | number, options?: any): Promise<any> {
        const table = this.store.get(objectName);
        if (!table) {
            if (this.config.strictMode) {
                throw new ObjectQLError({
                    code: 'NOT_FOUND',
                    message: `Object '${objectName}' not found`,
                    details: { objectName }
                });
            }
            return false;
        }

        const deleted = table.delete(String(id));
        if (!deleted && this.config.strictMode) {
            throw new ObjectQLError({
                code: 'NOT_FOUND',
                message: `Record with id '${id}' not found in '${objectName}'`,
                details: { objectName, id }
            });
        }

        return deleted;
    }

    /**
     * ====================================================================
     * 3. ADVANCED OPERATIONS (Optional)
     * ====================================================================
     */

    /**
     * Count records matching filters
     */
    async count(objectName: string, filters: any, options?: any): Promise<number> {
        const table = this.store.get(objectName);
        if (!table) {
            return 0;
        }

        // Extract actual filters
        let actualFilters = filters;
        if (filters && !Array.isArray(filters) && filters.filters) {
            actualFilters = filters.filters;
        }

        // If no filters, return total count
        if (!actualFilters || (Array.isArray(actualFilters) && actualFilters.length === 0)) {
            return table.size;
        }

        // Count matching records
        let count = 0;
        for (const record of table.values()) {
            if (this.matchesFilters(record, actualFilters)) {
                count++;
            }
        }

        return count;
    }

    /**
     * Get distinct values for a field
     */
    async distinct(objectName: string, field: string, filters?: any, options?: any): Promise<any[]> {
        const table = this.store.get(objectName);
        if (!table) {
            return [];
        }

        const values = new Set<any>();
        for (const record of table.values()) {
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
     * ====================================================================
     * 4. HELPER METHODS
     * ====================================================================
     */

    /**
     * Load initial data into the store
     */
    private loadInitialData(data: Record<string, any[]>): void {
        for (const [objectName, records] of Object.entries(data)) {
            const table = new Map<string, any>();
            for (const record of records) {
                const id = record.id || this.generateId(objectName);
                table.set(String(id), { ...record, id });
            }
            this.store.set(objectName, table);
        }
    }

    /**
     * Apply filters to records
     */
    private applyFilters(records: any[], filters: any[]): any[] {
        if (!filters || filters.length === 0) {
            return records;
        }
        return records.filter(record => this.matchesFilters(record, filters));
    }

    /**
     * Check if a record matches filter conditions
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

    /**
     * Evaluate a single filter condition
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
                return String(fieldValue).toLowerCase().startsWith(String(compareValue).toLowerCase());
            case 'endswith':
                return String(fieldValue).toLowerCase().endsWith(String(compareValue).toLowerCase());
            default:
                throw new ObjectQLError({
                    code: 'INVALID_REQUEST',
                    message: `Unsupported operator: ${operator}`
                });
        }
    }

    /**
     * Apply sorting to records
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
     * Project specific fields from a document
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
     * Generate a unique ID for a record
     */
    private generateId(objectName: string): string {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000);
        return `${objectName}-${timestamp}-${random}`;
    }
}
