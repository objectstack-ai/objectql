/**
 * @objectstack/spec
 * ObjectStack Protocol Specification
 * 
 * This package defines the wire protocol types for the ObjectStack ecosystem.
 * These are the canonical type definitions that all implementations must follow.
 */

/**
 * Filter Condition - Modern object-based query syntax
 * 
 * Supports MongoDB/Prisma-style filtering:
 * - Implicit equality: { field: value }
 * - Explicit operators: { field: { $eq: value, $gt: 10 } }
 * - Logical operators: { $and: [...], $or: [...] }
 */
export interface FilterCondition {
    [key: string]: any;
    $and?: FilterCondition[];
    $or?: FilterCondition[];
    $not?: FilterCondition;
}

/**
 * Filter Node - AST representation of a filter condition
 */
export interface FilterNode {
    type: 'and' | 'or' | 'not' | 'comparison';
    operator?: string;
    field?: string;
    value?: string | number | boolean | null | Date;
    children?: FilterNode[];
}

/**
 * Sort Node - AST representation of sort order
 */
export interface SortNode {
    field: string;
    order: 'asc' | 'desc';
}

/**
 * Query AST - Abstract Syntax Tree for queries
 */
export interface QueryAST {
    /** Target object name */
    object?: string;
    /** Fields to select */
    fields?: string[];
    /** Filter conditions */
    filters?: FilterNode;
    /** Sort order */
    sort?: SortNode[];
    /** Number of records to skip */
    skip?: number;
    /** Maximum number of records to return */
    top?: number;
    /** Group by fields */
    groupBy?: string[];
    /** Aggregations to perform */
    aggregations?: Array<{
        function: string;
        field: string;
        alias?: string;
    }>;
}

/**
 * Protocol Field Types
 * Core field types defined in the ObjectStack specification
 */
export type FieldType = 
    | 'text'
    | 'textarea'
    | 'number'
    | 'boolean'
    | 'date'
    | 'datetime'
    | 'time'
    | 'select'
    | 'lookup'
    | 'master_detail'
    | 'formula'
    | 'summary'
    | 'autonumber'
    | 'url'
    | 'email'
    | 'phone'
    | 'currency'
    | 'percent'
    | 'markdown'
    | 'html'
    | 'password'
    | 'file'
    | 'image';

/**
 * Select Option - Protocol definition for select field options
 */
export interface SelectOption {
    /** The display label for the option */
    label: string;
    /** The actual value stored in the database */
    value: string;
    /** Optional color for visual representation */
    color?: string;
    /** Whether this is the default option */
    default?: boolean;
}

/**
 * Field - Protocol definition for object fields
 * 
 * This is the canonical wire-protocol definition.
 * Implementations may extend this with runtime-specific properties.
 */
export interface Field {
    /** Field name */
    name: string;
    /** Display label */
    label: string;
    /** Field type */
    type: string;
    /** Description */
    description?: string;
    /** Options for select fields */
    options?: SelectOption[];
    /** Whether the field is mandatory */
    required?: boolean;
    /** Whether the field allows multiple values */
    multiple?: boolean;
    /** Whether the field is unique */
    unique?: boolean;
    /** Delete behavior for relationships */
    deleteBehavior?: 'set_null' | 'cascade' | 'restrict';
    /** Whether the field is hidden */
    hidden?: boolean;
    /** Whether the field is read-only */
    readonly?: boolean;
    /** Whether the field is encrypted */
    encryption?: boolean;
    /** Whether to create a database index */
    index?: boolean;
    /** Whether this is an external ID field */
    externalId?: boolean;
    /** Whether the field is searchable */
    searchable?: boolean;
    /** Default value */
    defaultValue?: string | number | boolean | null;
    /** Maximum length for strings */
    maxLength?: number;
    /** Minimum length for strings */
    minLength?: number;
    /** Minimum value for numbers */
    min?: number;
    /** Maximum value for numbers */
    max?: number;
    /** Decimal precision */
    precision?: number;
    /** Decimal scale */
    scale?: number;
    /** Formula expression */
    formula?: string;
    /** Reference to another object (for lookup/master_detail) */
    reference?: string;
    /** Filters for reference field */
    referenceFilters?: FilterCondition;
    /** Whether write requires master read permission */
    writeRequiresMasterRead?: boolean;
    /** Summary expression */
    expression?: string;
    /** Summary operations */
    summaryOperations?: string[];
}

/**
 * Index Schema - Protocol definition for database indexes
 */
export interface IndexSchema {
    /** Index name */
    name?: string;
    /** List of fields in the index */
    fields: string[];
    /** Whether the index enforces uniqueness */
    unique?: boolean;
}

/**
 * Service Object - Protocol definition for data objects
 * 
 * This is the canonical wire-protocol definition for objects/entities.
 */
export interface ServiceObject {
    /** Object name (unique identifier) */
    name: string;
    /** Display label */
    label?: string;
    /** Plural label */
    pluralLabel?: string;
    /** Description */
    description?: string;
    /** Icon identifier */
    icon?: string;
    /** Datasource name */
    datasource?: string;
    /** Custom table name */
    tableName?: string;
    /** Whether this is a system object */
    isSystem?: boolean;
    /** Field definitions */
    fields: Record<string, Field>;
    /** Index definitions */
    indexes?: Record<string, IndexSchema>;
    /** Primary display field */
    nameField?: string;
    /** Object capabilities */
    enable?: {
        trackHistory?: boolean;
        searchable?: boolean;
        apiEnabled?: boolean;
        files?: boolean;
        feedEnabled?: boolean;
        trash?: boolean;
    };
}

/**
 * Action - Protocol definition for custom actions
 */
export interface Action {
    /** Display label */
    label?: string;
    /** Description */
    description?: string;
    /** Icon name */
    icon?: string;
    /** Action type (record or global) */
    type?: 'record' | 'global';
    /** Confirmation message */
    confirm_text?: string;
    /** Whether this action is internal only */
    internal?: boolean;
}

/**
 * Application Manifest
 */
export interface App {
    /** App name */
    name: string;
    /** App version */
    version?: string;
    /** App description */
    description?: string;
}

/**
 * ObjectStack Manifest
 * Configuration manifest for ObjectStack applications
 */
export interface ObjectStackManifest {
    /** Manifest version */
    version: string;
    /** Unique identifier for the manifest (optional) */
    id?: string;
    /** Application info */
    app?: App;
    /** List of objects */
    objects?: ServiceObject[];
}

/**
 * Driver Interface
 * 
 * Base interface for database drivers
 */
export interface DriverInterface {
    /** Driver name */
    name?: string;
    /** Driver version */
    version?: string;
    /** Driver capabilities */
    supports?: {
        transactions?: boolean;
        joins?: boolean;
        fullTextSearch?: boolean;
        jsonFields?: boolean;
        arrayFields?: boolean;
        queryFilters?: boolean;
        queryAggregations?: boolean;
        querySorting?: boolean;
        queryPagination?: boolean;
        queryWindowFunctions?: boolean;
        querySubqueries?: boolean;
    };
    /** Connect to the database */
    connect?(): Promise<void>;
    /** Disconnect from the database */
    disconnect?(): Promise<void>;
    /** Find records */
    find?(objectName: string, query: any, options?: any): Promise<any[]>;
    /** Find a single record */
    findOne?(objectName: string, id: string | number, query?: any, options?: any): Promise<any>;
    /** Create a record */
    create?(objectName: string, data: any, options?: any): Promise<any>;
    /** Update a record */
    update?(objectName: string, id: string | number, data: any, options?: any): Promise<any>;
    /** Delete a record */
    delete?(objectName: string, id: string | number, options?: any): Promise<any>;
    /** Count records */
    count?(objectName: string, filters: any, options?: any): Promise<number>;
    /** Execute a command */
    execute?(command: any, parameters?: any[], options?: any): Promise<any>;
    /** Bulk operations */
    bulkCreate?(objectName: string, data: any[], options?: any): Promise<any>;
    bulkUpdate?(objectName: string, updates: Array<{id: string | number, data: any}>, options?: any): Promise<any>;
    bulkDelete?(objectName: string, ids: Array<string | number>, options?: any): Promise<any>;
    /** Aggregation */
    distinct?(objectName: string, field: string, filters?: any, options?: any): Promise<any[]>;
    aggregate?(objectName: string, aggregations: any[], filters?: any, options?: any): Promise<any[]>;
    /** Transaction support */
    beginTransaction?(): Promise<any>;
    commitTransaction?(transaction: any): Promise<void>;
    rollbackTransaction?(transaction: any): Promise<void>;
    /** Schema initialization */
    init?(objects: any[]): Promise<void>;
    /** Schema introspection */
    introspectSchema?(): Promise<any>;
    /** Health check */
    checkHealth?(): Promise<boolean>;
}

/**
 * Driver Options
 * 
 * Configuration options for database drivers
 */
export interface DriverOptions {
    /** Connection string or configuration */
    connection?: string | Record<string, unknown>;
    /** Additional driver-specific options */
    [key: string]: unknown;
}

/**
 * Plugin Definition
 * 
 * Base interface for plugins
 */
export interface PluginDefinition {
    /** Plugin name */
    name: string;
    /** Plugin version */
    version?: string;
    /** Plugin description */
    description?: string;
}

