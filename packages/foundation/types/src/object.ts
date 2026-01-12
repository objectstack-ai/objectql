import { FieldConfig } from './field';
import { ActionConfig } from './action';
import { AnyValidationRule } from './validation';

export interface IndexConfig {
    /** List of fields involved in the index */
    fields: string[];
    /** Whether the index enforces uniqueness */
    unique?: boolean;
}

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

export interface ObjectAiConfig {
    /** Configuration for semantic search / RAG */
    search?: AiSearchConfig;
}

export interface ObjectConfig {
    name: string;
    datasource?: string; // The name of the datasource to use
    label?: string;
    icon?: string;
    description?: string;
    
    fields: Record<string, FieldConfig>;
    indexes?: Record<string, IndexConfig>;
    /** AI capabilities configuration */
    ai?: ObjectAiConfig;
    actions?: Record<string, ActionConfig>;
    /** Validation rules for this object */
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
 */
export interface ObjectDoc {
    _id?: string | number;
    created_at?: Date | string;
    updated_at?: Date | string;
    [key: string]: any;
}
