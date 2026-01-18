/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Import and re-export types from the Protocol Constitution (@objectstack/spec)
import type { ServiceObject, IndexSchema } from '@objectstack/spec';
import { FieldConfig } from './field';
import { ActionConfig } from './action';
import { AnyValidationRule } from './validation';

/**
 * Re-export Protocol Types from the Constitution
 */
export type { ServiceObject as SpecObject, IndexSchema };

/**
 * RUNTIME-SPECIFIC TYPES
 * The following types extend or complement the Protocol Constitution
 */

/**
 * Index Configuration (compatible with Protocol)
 * 
 * The Protocol defines IndexSchema. We provide a simpler alias for runtime convenience.
 */
export interface IndexConfig {
    /** Index name (optional, auto-generated if not provided) */
    name?: string;
    /** List of fields involved in the index */
    fields: string[];
    /** Whether the index enforces uniqueness */
    unique?: boolean;
}

/**
 * AI Search Configuration
 * 
 * RUNTIME EXTENSION: Not part of the wire protocol.
 * Defines semantic search capabilities for the runtime engine.
 */
export interface AiSearchConfig {
    /** Enable semantic search for this object */
    enabled: boolean;
    /** Fields to include in the embedding generation */
    fields: string[];
    /** The AI model to use for embedding (e.g. 'openai/text-embedding-3-small') */
    model?: string;
    /** Optional: Target vector field name if manually defined */
    target_field?: string;
}

/**
 * Object AI Configuration
 * 
 * RUNTIME EXTENSION: Not part of the wire protocol.
 */
export interface ObjectAiConfig {
    /** Configuration for semantic search / RAG */
    search?: AiSearchConfig;
}

/**
 * Runtime Object Configuration
 * 
 * Extends the Protocol ServiceObject with runtime-specific properties.
 * The Protocol Constitution (SpecObject) defines the core object schema.
 * This adds runtime conveniences like actions, AI config, and validation rules.
 */
export interface ObjectConfig {
    /** Object name (required by Protocol) */
    name: string;
    
    /** Display label */
    label?: string;
    
    /** Plural label */
    pluralLabel?: string;
    
    /** Description */
    description?: string;
    
    /** Icon identifier */
    icon?: string;
    
    /** Datasource name (defaults to 'default') */
    datasource?: string;
    
    /** Custom table name (defaults to object name) */
    tableName?: string;
    
    /** Whether this is a system object */
    isSystem?: boolean;
    
    /** 
     * Field definitions
     * Maps field names to their configurations
     */
    fields: Record<string, FieldConfig>;
    
    /** 
     * Index definitions
     * Maps index names to their configurations
     */
    indexes?: Record<string, IndexConfig>;
    
    /** Primary display field */
    nameField?: string;
    
    /** Object capabilities (from Protocol) */
    enable?: {
        /** Enable history tracking (Audit Trail) */
        trackHistory?: boolean;
        /** Enable global search indexing */
        searchable?: boolean;
        /** Enable REST/GraphQL API access */
        apiEnabled?: boolean;
        /** Enable attachments/files */
        files?: boolean;
        /** Enable discussions/chatter */
        feedEnabled?: boolean;
        /** Enable Recycle Bin mechanics */
        trash?: boolean;
    };
    
    /**
     * RUNTIME EXTENSIONS BELOW
     */
    
    /** AI capabilities configuration (RUNTIME ONLY) */
    ai?: ObjectAiConfig;
    
    /** Custom actions (RUNTIME ONLY) */
    actions?: Record<string, ActionConfig>;
    
    /** Validation rules for this object (RUNTIME ONLY) */
    validation?: {
        /** Validation rules */
        rules?: AnyValidationRule[];
        /** AI context for validation strategy */
        ai_context?: {
            intent?: string;
            validation_strategy?: string;
        };
    };
}

/**
 * Base interface for all ObjectQL documents.
 * 
 * RUNTIME TYPE: Represents a document instance in the database.
 */
export interface ObjectDoc {
    _id?: string | number;
    created_at?: Date | string;
    updated_at?: Date | string;
    [key: string]: any;
}
