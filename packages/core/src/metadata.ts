/**
 * Represents the supported field data types in the ObjectQL schema.
 * These types determine how data is stored, validated, and rendered.
 * 
 * - `text`: Simple string.
 * - `textarea`: Long string.
 * - `select`: Choice from a list.
 * - `lookup`: Relationship to another object.
 */
export type FieldType = 
    | 'text' 
    | 'textarea' 
    | 'markdown'
    | 'html' 
    | 'select' 
    | 'date' 
    | 'datetime' 
    | 'time'
    | 'number' 
    | 'currency' 
    | 'percent'
    | 'boolean' 
    | 'email'
    | 'phone'
    | 'url'
    | 'image'
    | 'file'
    | 'avatar'
    | 'location'
    | 'lookup' 
    | 'master_detail'  
    | 'password'
    | 'formula'
    | 'summary'
    | 'auto_number'
    | 'object'
    | 'grid';

/**
 * Defines a single option for select/multiselect fields.
 */
export interface FieldOption {
    /** The display label for the option. */
    label: string;
    /** The actual value stored in the database. */
    value: string | number;
}

/**
 * Configuration for a single field on an object.
 * This defines the schema, validation rules, and UI hints for the attribute.
 */
export interface FieldConfig {
    /** 
     * The unique API name of the field. 
     * If defined within an object map, this is often automatically populated from the key.
     */
    name?: string;
    
    /** The human-readable label used in UIs. */
    label?: string;
    
    /** The data type of the field. */
    type: FieldType;
    
    /** Whether the field is mandatory. Defaults to false. */
    required?: boolean;

    /** Whether the field is unique in the table. */
    unique?: boolean;

    /** Whether the field is read-only in UI. */
    readonly?: boolean;

    /** Whether the field is hidden from default UI/API response. */
    hidden?: boolean;
    
    /** The default value if not provided during creation. */
    defaultValue?: any;

    /** Tooltip or help text for the user. */
    help_text?: string;
    
    /** 
     * Whether the field allows multiple values. 
     * Supported by 'select', 'lookup', 'file', 'image'.
     */
    multiple?: boolean;
    
    /** 
     * Options for select fields.
     * List of available choices for select/multiselect fields.
     */
    options?: FieldOption[];
    
    /**
     * Reference to another object for lookup/master_detail fields.
     * Specifies the target object name for relationship fields.
     */
    reference_to?: string;
    
    // Validation properties
    /** Minimum for number/currency/percent. */
    min?: number;
    /** Maximum for number/currency/percent. */
    max?: number;
    /** Minimum length for text based fields. */
    min_length?: number;
    /** Maximum length for text based fields. */
    max_length?: number;
    /** Regular expression pattern for validation. */
    regex?: string;
    
    /**
     * Whether this field can be modified or deleted.
     * System fields (e.g., _id, createdAt, updatedAt) should be marked as non-customizable.
     * Defaults to true for user-defined fields.
     */
    customizable?: boolean;
}

/**
 * Defines a permission rule for a specific object.
 */
export interface PolicyStatement {
    /** Allowed actions. */
    actions: Array<'read' | 'create' | 'update' | 'delete' | '*'>;
    
    /** 
     * Row Level Security (RLS). 
     * A set of filters automatically applied to queries.
     */
    filters?: any[]; // Using any[] to allow flexible filter structure for now

    /**
     * Field Level Security (FLS).
     * List of allowed fields (Visibility). If omitted, implies all fields.
     */
    fields?: string[];

    /**
     * FLS Write Protection.
     * Specific fields that are visible but NOT editable.
     */
    readonly_fields?: string[];
}

/**
 * A reusable policy definition.
 */
export interface PolicyConfig {
    name: string;
    description?: string;
    /** Map of Object Name to Permission Rules */
    permissions: Record<string, PolicyStatement>;
}

/**
 * A role definition combining managed policies and inline rules.
 */
export interface RoleConfig {
    name: string;
    label?: string;
    description?: string;
    /** Inherit permissions from these parent roles. */
    inherits?: string[];
    /** List of policy names to include. */
    policies?: string[];
    /** Map of inline permissions. */
    permissions?: Record<string, PolicyStatement>;
}

export interface ActionConfig {
    handler?: (ctx: any, params: any) => Promise<any>;
    [key: string]: any;
}

export interface ObjectListeners {
    beforeFind?: (ctx: any) => Promise<void>;
    afterFind?: (ctx: any) => Promise<void>;
    beforeCreate?: (ctx: any) => Promise<void>;
    afterCreate?: (ctx: any) => Promise<void>;
    beforeUpdate?: (ctx: any) => Promise<void>;
    afterUpdate?: (ctx: any) => Promise<void>;
    beforeDelete?: (ctx: any) => Promise<void>;
    afterDelete?: (ctx: any) => Promise<void>;
    [key: string]: any;
}

export interface ObjectConfig {
    name: string;
    datasource?: string; // The name of the datasource to use
    label?: string;
    icon?: string;
    description?: string;
    
    fields: Record<string, FieldConfig>;
    
    /** Custom Actions (RPC) defined on this object. */
    actions?: Record<string, ActionConfig>;

    /** Lifecycle hooks. */
    listeners?: ObjectListeners;

    /** Initial data to populate when system starts. */
    data?: any[];
    
    /**
     * Whether this object can be modified or deleted.
     * System objects (e.g., user, session, account) should be marked as non-customizable.
     * Defaults to true for user-defined objects.
     */
    customizable?: boolean;
}
