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
export type FilterCondition = 
    | { [key: string]: any } // Field equality or operator object
    | { $and?: FilterCondition[] }
    | { $or?: FilterCondition[] };

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
    defaultValue?: any;
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
    referenceFilters?: any;
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
