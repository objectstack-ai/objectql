// src/types.ts

/**
 * Standardized error codes for ObjectQL API
 */
export enum ErrorCode {
    INVALID_REQUEST = 'INVALID_REQUEST',
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    UNAUTHORIZED = 'UNAUTHORIZED',
    FORBIDDEN = 'FORBIDDEN',
    NOT_FOUND = 'NOT_FOUND',
    CONFLICT = 'CONFLICT',
    INTERNAL_ERROR = 'INTERNAL_ERROR',
    DATABASE_ERROR = 'DATABASE_ERROR',
    RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED'
}

/**
 * AI context for better logging, debugging, and AI processing
 */
export interface AIContext {
    intent?: string;
    natural_language?: string;
    use_case?: string;
    [key: string]: unknown;
}

/**
 * ObjectQL JSON-RPC style request
 */
export interface ObjectQLRequest {
    // Identity provided by the framework adapter (e.g. from session)
    user?: {
        id: string;
        roles: string[];
        [key: string]: any;
    };
    
    // The actual operation
    op: 'find' | 'findOne' | 'create' | 'update' | 'delete' | 'count' | 'action';
    object: string;
    
    // Arguments
    args: any;
    
    // Optional AI context for explainability
    ai_context?: AIContext;
}

/**
 * Error details structure
 */
export interface ErrorDetails {
    field?: string;
    reason?: string;
    fields?: Record<string, string>;
    required_permission?: string;
    user_roles?: string[];
    retry_after?: number;
    [key: string]: unknown;
}

/**
 * ObjectQL API response
 */
export interface ObjectQLResponse {
    data?: any;
    error?: {
        code: ErrorCode | string;
        message: string;
        details?: ErrorDetails;
    };
    meta?: {
        total?: number;
        page?: number;
        per_page?: number;
    };
}
