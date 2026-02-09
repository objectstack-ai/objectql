/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Column metadata from database introspection.
 */
export interface IntrospectedColumn {
    /** Column name */
    name: string;
    /** Native database type (e.g., 'varchar', 'integer', 'timestamp') */
    type: string;
    /** Whether the column is nullable */
    nullable: boolean;
    /** Default value if any */
    defaultValue?: any;
    /** Whether this is a primary key */
    isPrimary?: boolean;
    /** Whether this column has a unique constraint */
    isUnique?: boolean;
    /** Maximum length for string types */
    maxLength?: number;
}

/**
 * Foreign key relationship metadata.
 */
export interface IntrospectedForeignKey {
    /** Column name in the source table */
    columnName: string;
    /** Referenced table name */
    referencedTable: string;
    /** Referenced column name */
    referencedColumn: string;
    /** Constraint name */
    constraintName?: string;
}

/**
 * Table metadata from database introspection.
 */
export interface IntrospectedTable {
    /** Table name */
    name: string;
    /** List of columns */
    columns: IntrospectedColumn[];
    /** List of foreign key relationships */
    foreignKeys: IntrospectedForeignKey[];
    /** Primary key columns */
    primaryKeys: string[];
}

/**
 * Complete database schema introspection result.
 */
export interface IntrospectedSchema {
    /** Map of table name to table metadata */
    tables: Record<string, IntrospectedTable>;
}

// ============================================================================
// Driver Capabilities — aligned with @objectstack/spec DriverCapabilitiesSchema
// ============================================================================

/**
 * Transaction isolation levels supported by the driver.
 * 
 * Aligned with @objectstack/spec DriverCapabilitiesSchema — uses snake_case per protocol convention.
 */
export type IsolationLevel = 'read_uncommitted' | 'read_committed' | 'repeatable_read' | 'serializable' | 'snapshot';

/**
 * Driver Capabilities
 * 
 * Declares what features a driver supports. Aligned with the canonical
 * DriverCapabilitiesSchema from @objectstack/spec.
 * 
 * All boolean fields default to `false`. Drivers only set `true` for supported features.
 */
export interface DriverCapabilities {
    // CRUD operations
    readonly create?: boolean;
    readonly read?: boolean;
    readonly update?: boolean;
    readonly delete?: boolean;

    // Bulk operations
    readonly bulkCreate?: boolean;
    readonly bulkUpdate?: boolean;
    readonly bulkDelete?: boolean;

    // Transaction support
    readonly transactions?: boolean;
    readonly savepoints?: boolean;
    readonly isolationLevels?: readonly IsolationLevel[];

    // Query capabilities
    readonly queryFilters?: boolean;
    readonly queryAggregations?: boolean;
    readonly querySorting?: boolean;
    readonly queryPagination?: boolean;
    readonly queryWindowFunctions?: boolean;
    readonly querySubqueries?: boolean;
    readonly queryCTE?: boolean;

    // Join & search
    readonly joins?: boolean;
    readonly fullTextSearch?: boolean;
    readonly jsonQuery?: boolean;
    readonly geospatialQuery?: boolean;

    // Streaming
    readonly streaming?: boolean;

    // Field type support
    readonly jsonFields?: boolean;
    readonly arrayFields?: boolean;
    readonly vectorSearch?: boolean;

    /** @deprecated Use `geospatialQuery` instead */
    readonly geoSpatial?: boolean;

    // Schema management
    readonly schemaSync?: boolean;
    readonly migrations?: boolean;
    readonly indexes?: boolean;

    // Infrastructure
    readonly connectionPooling?: boolean;
    readonly preparedStatements?: boolean;
    readonly queryCache?: boolean;
}

/**
 * Runtime Driver Capabilities (extends spec with sync-specific properties)
 * 
 * These properties are NOT part of the @objectstack/spec DriverCapabilitiesSchema
 * (which sets additionalProperties: false). They are runtime-only extensions
 * used by the Offline-First Sync Protocol (Q3).
 * 
 * Use this interface for drivers that need sync capabilities.
 */
export interface RuntimeDriverCapabilities extends DriverCapabilities {
    /** Driver can record mutations to an append-only log for offline sync */
    readonly mutationLog?: boolean;
    /** Driver supports checkpoint-based change tracking */
    readonly changeTracking?: boolean;
}

/**
 * Driver type discriminator — aligned with @objectstack/spec DriverConfigSchema.
 */
export type DriverType = 'sql' | 'nosql' | 'cache' | 'search' | 'graph' | 'timeseries';

/**
 * Base driver configuration common to all drivers.
 * Individual drivers extend this with driver-specific fields.
 */
export interface BaseDriverConfig {
    /** Driver type discriminator */
    readonly type?: DriverType;
}

// ============================================================================
// Driver Interface
// ============================================================================

export interface Driver {
    /** Driver identifier (e.g., 'memory', 'sql', 'mongo') */
    readonly name?: string;
    /** Driver version (semver) */
    readonly version?: string;
    /** Capabilities declaration — what this driver supports */
    readonly supports?: DriverCapabilities;
    
    // Core CRUD methods
    find(objectName: string, query: any, options?: any): Promise<any[]>;
    findOne(objectName: string, id: string | number, query?: any, options?: any): Promise<any>;
    create(objectName: string, data: any, options?: any): Promise<any>;
    update(objectName: string, id: string | number, data: any, options?: any): Promise<any>;
    delete(objectName: string, id: string | number, options?: any): Promise<any>;
    count(objectName: string, filters: any, options?: any): Promise<number>;
    
    // Lifecycle methods
    connect?(): Promise<void>;
    disconnect?(): Promise<void>;
    checkHealth?(): Promise<boolean>;
    
    // Bulk operations
    execute?(command: any, parameters?: any[], options?: any): Promise<any>;
    bulkCreate?(objectName: string, data: any[], options?: any): Promise<any>;
    bulkUpdate?(objectName: string, updates: Array<{id: string | number, data: any}>, options?: any): Promise<any>;
    bulkDelete?(objectName: string, ids: Array<string | number>, options?: any): Promise<any>;
    
    // Query extensions
    distinct?(objectName: string, field: string, filters?: any, options?: any): Promise<any[]>;
    aggregate?(objectName: string, query: any, options?: any): Promise<any[]>;
    
    // Transaction support
    beginTransaction?(): Promise<any>;
    /** @deprecated Use `commit` — aligned with @objectstack/spec DriverInterfaceSchema */
    commitTransaction?(transaction: any): Promise<void>;
    /** @deprecated Use `rollback` — aligned with @objectstack/spec DriverInterfaceSchema */
    rollbackTransaction?(transaction: any): Promise<void>;
    /** Commit a transaction (spec-aligned name) */
    commit?(transaction: any): Promise<void>;
    /** Rollback a transaction (spec-aligned name) */
    rollback?(transaction: any): Promise<void>;
    
    // Schema / Lifecycle
    init?(objects: any[]): Promise<void>;
    
    /**
     * Introspect the database schema to discover existing tables, columns, and relationships.
     * @returns Complete schema information including tables, columns, and foreign keys
     */
    introspectSchema?(): Promise<IntrospectedSchema>;

    // Bulk / Atomic (alternative signatures)
    createMany?(objectName: string, data: any[], options?: any): Promise<any>;
    updateMany?(objectName: string, filters: any, data: any, options?: any): Promise<any>;
    deleteMany?(objectName: string, filters: any, options?: any): Promise<any>;
    findOneAndUpdate?(objectName: string, filters: any, update: any, options?: any): Promise<any>;

    // DriverInterface v4.0 methods
    /**
     * Execute a query using QueryAST format (DriverInterface v4.0)
     */
    executeQuery?(ast: any, options?: any): Promise<{ value: any[]; count?: number }>;
    
    /**
     * Execute a command using Command format (DriverInterface v4.0)
     */
    executeCommand?(command: any, options?: any): Promise<{ success: boolean; data?: any; affected: number }>;
    
    /**
     * Alternative method name for findOne (some drivers use 'get')
     */
    get?(objectName: string, id: string, options?: any): Promise<any>;
    
    /**
     * Direct query execution (legacy)
     */
    directQuery?(sql: string, params?: any[]): Promise<any[]>;
    query?(sql: string, params?: any[]): Promise<any[]>;

    // ========================================================================
    // Methods from @objectstack/spec DriverInterfaceSchema
    // ========================================================================

    /**
     * Upsert (create or update) a record.
     * If the record exists (matched by ID or unique key), update it; otherwise, create it.
     * 
     * @param objectName - The object name.
     * @param data - Key-value map of field data (must include ID or unique key).
     * @param options - Driver options.
     * @returns The upserted record.
     */
    upsert?(objectName: string, data: Record<string, unknown>, options?: any): Promise<any>;

    /**
     * Stream records matching the structured query.
     * Optimized for large datasets to avoid memory overflow.
     * 
     * @param objectName - The name of the object.
     * @param query - The structured QueryAST.
     * @param options - Driver options.
     * @returns AsyncIterable/ReadableStream of records.
     */
    findStream?(objectName: string, query: any, options?: any): AsyncIterable<any> | any;

    /**
     * Get connection pool statistics.
     * Useful for monitoring database load.
     */
    getPoolStats?(): { total: number; idle: number; active: number; waiting: number } | undefined;

    /**
     * Synchronize the schema for one or more objects.
     * Creates or alters tables/collections to match the object definitions.
     * 
     * @param objects - Object definitions to synchronize.
     * @param options - Driver options.
     */
    syncSchema?(objects: any[], options?: any): Promise<void>;

    /**
     * Drop a table/collection by name.
     * 
     * @param objectName - The name of the object/table to drop.
     * @param options - Driver options.
     */
    dropTable?(objectName: string, options?: any): Promise<void>;

    /**
     * Explain the execution plan for a query.
     * Useful for debugging and performance optimization.
     * 
     * @param objectName - The name of the object.
     * @param query - The structured QueryAST.
     * @param options - Driver options.
     * @returns Execution plan details.
     */
    explain?(objectName: string, query: any, options?: any): Promise<any>;
}

