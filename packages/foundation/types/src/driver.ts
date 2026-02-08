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
 */
export type IsolationLevel = 'read-uncommitted' | 'read-committed' | 'repeatable-read' | 'serializable';

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

    // Sync support (Q3 — Offline-First Sync Protocol)
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
    commitTransaction?(transaction: any): Promise<void>;
    rollbackTransaction?(transaction: any): Promise<void>;
    
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
}

