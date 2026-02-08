/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Data, Automation } from '@objectstack/spec';
import { z } from 'zod';
import { FieldConfig } from './field';
import { ActionConfig } from './action';
import { AnyValidationRule } from './validation';
import { SyncConfig } from './sync';

/**
 * Re-export Protocol Types from @objectstack/spec 1.1.0
 * State Machine, Object Ownership, and Object Extension types.
 */
export type StateMachineConfig = z.infer<typeof Automation.StateMachineSchema>;
export type StateNodeConfig = z.infer<typeof Automation.StateNodeSchema>;
export type Transition = z.infer<typeof Automation.TransitionSchema>;
export type ActionRef = z.infer<typeof Automation.ActionRefSchema>;
export type ObjectOwnership = z.infer<typeof Data.ObjectOwnershipEnum>;
export type ObjectExtension = z.infer<typeof Data.ObjectExtensionSchema>;
export type ServiceObject = z.infer<typeof Data.ObjectSchema>;

/** Re-export Zod schemas for validation */
export { Data, Automation };

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
 * The Protocol Constitution defines the core object schema.
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

    /**
     * State Machine definition for object lifecycle management.
     * Follows the @objectstack/spec StateMachineConfig protocol.
     * Enables declarative state transitions, guards, and entry/exit actions.
     */
    stateMachine?: StateMachineConfig;

    /**
     * Named state machines for multi-field lifecycle.
     * Each key is a state machine identifier, useful when an object
     * has multiple independent state fields.
     */
    stateMachines?: Record<string, StateMachineConfig>;
    
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

    /**
     * Offline-First Sync configuration (RUNTIME ONLY).
     * Opt-in per object. See {@link SyncConfig} for details.
     *
     * @example
     * ```yaml
     * sync:
     *   enabled: true
     *   strategy: last-write-wins
     *   conflict_fields: [status]
     * ```
     */
    sync?: SyncConfig;
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
