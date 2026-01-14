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
    op: 'find' | 'findOne' | 'create' | 'update' | 'delete' | 'count' | 'action' | 'createMany' | 'updateMany' | 'deleteMany';
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
 * Pagination metadata
 */
export interface PaginationMeta {
    total: number;        // Total number of records
    page?: number;        // Current page number (1-indexed, e.g. page 1 corresponds to skip=0)
    size?: number;        // Number of items per page
    pages?: number;       // Total number of pages
    has_next?: boolean;   // Whether there is a next page
}

/**
 * ObjectQL API response
 */
export interface ObjectQLResponse {
    // For list operations (find)
    items?: any[];
    
    // Pagination metadata (for list operations)
    meta?: PaginationMeta;
    
    // Error information
    error?: {
        code: ErrorCode | string;
        message: string;
        details?: ErrorDetails | any; // Allow flexible details structure
    };
    
    // For single item operations, the response is the object itself with '@type' field
    // This allows any additional fields from the actual data object
    [key: string]: any;
}
