/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Import types from the Protocol Constitution (@objectstack/spec)
import type { FieldType as ProtocolFieldType, Field, SelectOption as SpecSelectOption } from '@objectstack/spec';

/**
 * Re-export Protocol Types from the Constitution
 * These are the wire-protocol standard types defined in @objectstack/spec
 */
export type { Field as SpecField, SpecSelectOption, ProtocolFieldType };

/**
 * RUNTIME-SPECIFIC TYPES
 * The following types extend or complement the Protocol Constitution
 * with runtime-specific properties that don't belong in the wire protocol.
 */

/**
 * Attachment field data structure for file and image types.
 * Stores metadata about uploaded files, with actual file content stored separately.
 * 
 * This is a RUNTIME type - not part of the wire protocol.
 */
export interface AttachmentData {
    /** Unique identifier for this file */
    id?: string;
    
    /** File name (e.g., "invoice.pdf") */
    name: string;
    
    /** Publicly accessible URL to the file */
    url: string;
    
    /** File size in bytes */
    size: number;
    
    /** MIME type (e.g., "application/pdf", "image/jpeg") */
    type: string;
    
    /** Original filename as uploaded by user */
    original_name?: string;
    
    /** Upload timestamp (ISO 8601) */
    uploaded_at?: string;
    
    /** User ID who uploaded the file */
    uploaded_by?: string;
}

/**
 * Image-specific attachment data with additional metadata.
 * Extends AttachmentData with image-specific properties.
 * 
 * This is a RUNTIME type - not part of the wire protocol.
 */
export interface ImageAttachmentData extends AttachmentData {
    /** Image width in pixels */
    width?: number;
    
    /** Image height in pixels */
    height?: number;
    
    /** Thumbnail URL (if generated) */
    thumbnail_url?: string;
    
    /** Alternative sizes/versions */
    variants?: {
        small?: string;
        medium?: string;
        large?: string;
    };
}

/**
 * Runtime Field Type
 * 
 * Extends the Protocol FieldType with runtime-specific types.
 * The Protocol Constitution defines the core field types.
 * We add runtime-specific types like 'vector', 'grid', 'location', 'object' here.
 */
export type FieldType = 
    | ProtocolFieldType
    | 'location'    // Runtime: Geographic location
    | 'object'      // Runtime: Nested object/JSON
    | 'vector'      // Runtime: Vector embeddings for AI
    | 'grid';       // Runtime: Inline grid/table

/**
 * Runtime Field Option
 * 
 * Extends the Protocol SelectOption to allow number values (for backwards compatibility).
 */
export interface FieldOption {
    /** The display label for the option. */
    label: string;
    /** The actual value stored in the database. */
    value: string | number;
    /** Optional color for visual representation */
    color?: string;
    /** Whether this is the default option */
    default?: boolean;
}

/**
 * Runtime Field Configuration
 * 
 * Extends the Protocol Field definition with runtime-specific properties.
 * The Protocol Constitution (SpecField) defines the core field schema.
 * This adds runtime conveniences and extensions.
 */
export interface FieldConfig extends Omit<Field, 'type' | 'options'> {
    /** The data type of the field (extended with runtime types) */
    type: FieldType;
    
    /** Options for select fields (extended to allow number values) */
    options?: FieldOption[];
    
    /**
     * RUNTIME EXTENSIONS BELOW
     * These properties are NOT in the wire protocol but are useful for the runtime.
     */
    
    /** Tooltip or help text for the user. */
    help_text?: string;
    
    /**
     * Reference to another object for lookup/master_detail fields.
     * @deprecated Use 'reference' from SpecField instead
     */
    reference_to?: string;
    
    /**
     * Allowed file extensions for file/image fields.
     * Example: ['.pdf', '.docx'] or ['.jpg', '.png', '.gif']
     */
    accept?: string[];
    
    /**
     * Maximum file size in bytes for file/image fields.
     * Example: 5242880 (5MB)
     */
    max_size?: number;
    
    /**
     * Minimum file size in bytes for file/image fields.
     */
    min_size?: number;
    
    /**
     * Maximum image width in pixels for image fields.
     */
    max_width?: number;
    
    /**
     * Maximum image height in pixels for image fields.
     */
    max_height?: number;
    
    /**
     * Minimum image width in pixels for image fields.
     */
    min_width?: number;
    
    /**
     * Minimum image height in pixels for image fields.
     */
    min_height?: number;
    
    /**
     * Regular expression pattern for validation.
     * @deprecated Use SpecField validation pattern instead
     */
    regex?: string;
    
    /**
     * AI context for the field.
     * Provides semantic information for AI tools.
     */
    ai_context?: {
        intent?: string;
        validation_strategy?: string;
        [key: string]: unknown;
    };

    // Vector properties (runtime-specific)
    /** Dimension of the vector for 'vector' type fields. */
    dimension?: number;

    // Formula properties (extended from protocol)
    /** Expected return data type for formula fields. */
    data_type?: 'number' | 'text' | 'date' | 'datetime' | 'boolean' | 'currency' | 'percent';
    /** Display format for formula results (e.g., "0.00", "YYYY-MM-DD"). */
    format?: string;
    /** Decimal precision for numeric formula results. */
    precision?: number;
    /** Treat blank/null as zero in formula calculations. */
    blank_as_zero?: boolean;
    /** Default value for null/undefined referenced fields in formulas. */
    treat_blank_as?: string | number | boolean | Date | null;
    
    // Summary properties (extended from protocol)
    /** Object to summarize. */
    summary_object?: string;
    /** Field on the summary object. */
    summary_field?: string;
    /** Type of summary (count, sum, min, max, avg). */
    summary_type?: string;
    /** Filters for summary */
    filters?: unknown[];
}
