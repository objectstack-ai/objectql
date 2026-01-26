/**
 * ObjectQL AI Plugin Types
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * AI Provider Interface
 * Extensible interface for different AI providers (OpenAI, Anthropic, etc.)
 */
export interface AIProvider {
    /** Provider name (e.g., 'openai', 'anthropic') */
    name: string;
    
    /** API endpoint */
    endpoint?: string;
    
    /** API key for authentication */
    apiKey: string;
    
    /** Model to use (e.g., 'gpt-4', 'claude-3') */
    model?: string;
    
    /** Temperature for generation (0-1) */
    temperature?: number;
    
    /** Maximum tokens for generation */
    maxTokens?: number;
}

/**
 * AI Plugin Configuration
 */
export interface AIPluginConfig {
    /**
     * Enable AI integration
     * @default true
     */
    enabled?: boolean;
    
    /**
     * AI Provider configuration
     * Can be a single provider or multiple providers
     */
    provider?: AIProvider | AIProvider[];
    
    /**
     * Default provider name to use when multiple providers are configured
     */
    defaultProvider?: string;
    
    /**
     * Enable AI-powered code generation
     * @default true
     */
    enableGeneration?: boolean;
    
    /**
     * Enable AI-powered validation
     * @default true
     */
    enableValidation?: boolean;
    
    /**
     * Enable AI-powered suggestions
     * @default true
     */
    enableSuggestions?: boolean;
    
    /**
     * Preferred language for AI responses
     * @default 'en'
     */
    language?: string;
    
    /**
     * Custom system prompts for different AI operations
     */
    customPrompts?: {
        generation?: string;
        validation?: string;
        suggestions?: string;
    };
}

/**
 * AI Generation Request
 */
export interface AIGenerationRequest {
    /** Natural language description */
    description: string;
    
    /** Type of generation */
    type?: 'basic' | 'complete' | 'custom';
    
    /** Maximum tokens */
    maxTokens?: number;
    
    /** Provider to use (if multiple configured) */
    provider?: string;
}

/**
 * AI Generation Result
 */
export interface AIGenerationResult {
    /** Success flag */
    success: boolean;
    
    /** Generated files */
    files: Array<{
        filename: string;
        content: string;
        type: 'object' | 'validation' | 'action' | 'hook' | 'permission' | 'workflow' | 'data' | 'application' | 'typescript' | 'test' | 'other';
    }>;
    
    /** Errors if any */
    errors?: string[];
    
    /** Raw AI response */
    rawResponse?: string;
}

/**
 * AI Validation Request
 */
export interface AIValidationRequest {
    /** Metadata to validate (YAML string or parsed object) */
    metadata: string | any;
    
    /** Filename for context */
    filename?: string;
    
    /** Check business logic */
    checkBusinessLogic?: boolean;
    
    /** Check performance */
    checkPerformance?: boolean;
    
    /** Check security */
    checkSecurity?: boolean;
    
    /** Provider to use */
    provider?: string;
}

/**
 * AI Validation Result
 */
export interface AIValidationResult {
    /** Valid flag */
    valid: boolean;
    
    /** Errors */
    errors: Array<{
        message: string;
        location?: string;
        code?: string;
    }>;
    
    /** Warnings */
    warnings: Array<{
        message: string;
        location?: string;
        suggestion?: string;
    }>;
    
    /** Info messages */
    info: Array<{
        message: string;
        location?: string;
    }>;
}

/**
 * AI Suggestion Request
 */
export interface AISuggestionRequest {
    /** Current context (object being edited, etc.) */
    context: {
        objectName?: string;
        currentMetadata?: any;
        userInput?: string;
    };
    
    /** Type of suggestions needed */
    type?: 'fields' | 'validations' | 'actions' | 'hooks' | 'general';
    
    /** Provider to use */
    provider?: string;
}

/**
 * AI Suggestion Result
 */
export interface AISuggestionResult {
    /** Success flag */
    success: boolean;
    
    /** Suggestions */
    suggestions: Array<{
        title: string;
        description: string;
        code?: string;
        priority?: 'high' | 'medium' | 'low';
    }>;
    
    /** Errors if any */
    errors?: string[];
}

/**
 * AI Service Interface
 * Core interface for AI operations
 */
export interface AIService {
    /**
     * Generate metadata from description
     */
    generate(request: AIGenerationRequest): Promise<AIGenerationResult>;
    
    /**
     * Validate metadata
     */
    validate(request: AIValidationRequest): Promise<AIValidationResult>;
    
    /**
     * Get suggestions
     */
    suggest(request: AISuggestionRequest): Promise<AISuggestionResult>;
    
    /**
     * Get available providers
     */
    getProviders(): string[];
    
    /**
     * Get default provider
     */
    getDefaultProvider(): string;
}
