import { FieldValidation, ValidationAiContext } from './validation';

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
    | 'vector'
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

    /** Description of the field for documentation or tooltip. */
    description?: string;
    
    /** The data type of the field. */
    type: FieldType;
    
    /** Whether the field is mandatory. Defaults to false. */
    required?: boolean;

    /** Whether the field is unique in the table. */
    unique?: boolean;

    /** Whether to create a database index for this field. */
    index?: boolean;

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
     * Field validation configuration.
     * Defines validation rules applied at the field level.
     */
    validation?: FieldValidation;
    
    /**
     * AI context for the field.
     * Provides semantic information for AI tools.
     */
    ai_context?: ValidationAiContext;

    // Vector properties
    /** Dimension of the vector for 'vector' type fields. */
    dimension?: number;
}
