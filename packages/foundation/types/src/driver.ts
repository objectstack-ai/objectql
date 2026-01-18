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

export interface Driver {
    find(objectName: string, query: any, options?: any): Promise<any[]>;
    findOne(objectName: string, id: string | number, query?: any, options?: any): Promise<any>;
    create(objectName: string, data: any, options?: any): Promise<any>;
    update(objectName: string, id: string | number, data: any, options?: any): Promise<any>;
    delete(objectName: string, id: string | number, options?: any): Promise<any>;
    count(objectName: string, filters: any, options?: any): Promise<number>;
    
    // Schema / Lifecycle
    init?(objects: any[]): Promise<void>;
    
    /**
     * Introspect the database schema to discover existing tables, columns, and relationships.
     * This allows connecting to an existing database without defining metadata.
     * @returns Complete schema information including tables, columns, and foreign keys
     */
    introspectSchema?(): Promise<IntrospectedSchema>;

    // Advanced
    aggregate?(objectName: string, query: any, options?: any): Promise<any>;
    distinct?(objectName: string, field: string, filters?: any, options?: any): Promise<any[]>;
    
    // Bulk / Atomic
    createMany?(objectName: string, data: any[], options?: any): Promise<any>;
    updateMany?(objectName: string, filters: any, data: any, options?: any): Promise<any>;
    deleteMany?(objectName: string, filters: any, options?: any): Promise<any>;
    findOneAndUpdate?(objectName: string, filters: any, update: any, options?: any): Promise<any>;

    // Transaction
    beginTransaction?(): Promise<any>;
    commitTransaction?(trx: any): Promise<void>;
    rollbackTransaction?(trx: any): Promise<void>;

    // Connection
    disconnect?(): Promise<void>;
}

