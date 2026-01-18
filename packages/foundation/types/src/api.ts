/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * API Type Definitions for ObjectQL
 * 
 * This file contains TypeScript interfaces for Data API and Metadata API endpoints.
 * These types enable frontend applications to make type-safe API calls.
 */

import { UnifiedQuery, FilterExpression } from './query';
import { ObjectConfig } from './object';
import { FieldConfig } from './field';
import { ActionConfig } from './action';

// ============================================================================
// Error Handling Types
// ============================================================================

/**
 * Standardized error codes for ObjectQL API responses
 */
export enum ApiErrorCode {
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
 * Error details structure with optional field-specific information
 */
export interface ApiErrorDetails {
    field?: string;
    reason?: string;
    fields?: Record<string, string>;
    required_permission?: string;
    user_roles?: string[];
    retry_after?: number;
    [key: string]: unknown;
}

/**
 * Standard error response structure
 */
export interface ApiError {
    code: ApiErrorCode | string;
    message: string;
    details?: ApiErrorDetails;
}

/**
 * ObjectQL Error class for throwing structured errors
 */
export class ObjectQLError extends Error {
    public code: ApiErrorCode | string;
    public details?: ApiErrorDetails;

    constructor(error: { code: ApiErrorCode | string; message: string; details?: ApiErrorDetails }) {
        super(error.message);
        this.name = 'ObjectQLError';
        this.code = error.code;
        this.details = error.details;
        
        // Preserve proper stack traces in Node.js environments
        const ErrorConstructor = Error as unknown as { captureStackTrace?: (target: object, constructor: Function) => void };
        if (typeof ErrorConstructor.captureStackTrace === 'function') {
            ErrorConstructor.captureStackTrace(this, ObjectQLError);
        }
    }
}

// ============================================================================
// Pagination Types
// ============================================================================

/**
 * Pagination metadata for list responses
 */
export interface PaginationMeta {
    /** Total number of records */
    total: number;
    /** Current page number (1-indexed) */
    page?: number;
    /** Number of items per page */
    size?: number;
    /** Total number of pages */
    pages?: number;
    /** Whether there is a next page */
    has_next?: boolean;
}

// ============================================================================
// Data API Types
// ============================================================================

/**
 * Base response structure for Data API operations
 */
export interface DataApiResponse<T = unknown> {
    /** Error information if the operation failed */
    error?: ApiError;
    /** Additional response fields for successful operations */
    [key: string]: unknown;
}

/**
 * Response for list operations (find)
 */
export interface DataApiListResponse<T = unknown> extends DataApiResponse<T> {
    /** Array of retrieved items */
    items?: T[];
    /** Pagination metadata */
    meta?: PaginationMeta;
}

/**
 * Response for single item operations (findOne, create, update)
 */
export interface DataApiItemResponse<T = unknown> extends DataApiResponse<T> {
    /** The item ID */
    _id?: string | number;
    /** Object type identifier */
    '@type'?: string;
    /** Timestamp when created */
    created_at?: string | Date;
    /** Timestamp when last updated */
    updated_at?: string | Date;
}

/**
 * Query parameters for GET /api/data/:object (list records)
 */
export interface DataApiListParams {
    /** Filter expression (can be FilterExpression array or JSON string) */
    filter?: FilterExpression | string;
    /** Fields to return (array or comma-separated string) */
    fields?: string[] | string;
    /** Sort criteria - array of [field, direction] tuples */
    sort?: [string, 'asc' | 'desc'][] | string;
    /** Maximum number of records to return */
    limit?: number;
    /** Number of records to skip (for pagination) */
    skip?: number;
    /** Offset alias for skip */
    offset?: number;
    /** OData-style top parameter (alias for limit) */
    top?: number;
    /** Expand related records */
    expand?: Record<string, UnifiedQuery>;
}

/**
 * Request body for POST /api/data/:object (create single record)
 */
export interface DataApiCreateRequest {
    [key: string]: unknown;
}

/**
 * Request body for POST /api/data/:object (create multiple records)
 */
export type DataApiCreateManyRequest = Array<Record<string, unknown>>;

/**
 * Request body for PUT /api/data/:object/:id (update record)
 */
export interface DataApiUpdateRequest {
    [key: string]: unknown;
}

/**
 * Request body for POST /api/data/:object/bulk-update (update many records)
 */
export interface DataApiBulkUpdateRequest {
    /** Filter criteria to select records to update */
    filters: FilterExpression;
    /** Data to update */
    data: Record<string, unknown>;
}

/**
 * Request body for POST /api/data/:object/bulk-delete (delete many records)
 */
export interface DataApiBulkDeleteRequest {
    /** Filter criteria to select records to delete */
    filters: FilterExpression;
}

/**
 * Response for count operations
 */
export interface DataApiCountResponse extends DataApiResponse {
    /** Number of records matching the criteria */
    count?: number;
}

/**
 * Response for delete operations
 */
export interface DataApiDeleteResponse extends DataApiResponse {
    /** Whether the operation was successful */
    success?: boolean;
    /** Number of deleted records (for bulk operations) */
    deleted_count?: number;
}

// ============================================================================
// Metadata API Types
// ============================================================================

/**
 * Base response structure for Metadata API operations
 */
export interface MetadataApiResponse<T = unknown> {
    /** Error information if the operation failed */
    error?: ApiError;
    /** Additional response fields */
    [key: string]: unknown;
}

/**
 * Response for list metadata operations
 */
export interface MetadataApiListResponse<T = unknown> extends MetadataApiResponse<T> {
    /** Array of metadata items */
    items: T[];
}

/**
 * Simplified object metadata for list views
 */
export interface ObjectMetadataSummary {
    /** Object name (internal identifier) */
    name: string;
    /** Display label */
    label?: string;
    /** Icon identifier */
    icon?: string;
    /** Object description */
    description?: string;
    /** Field definitions (simplified) */
    fields?: Record<string, FieldConfig>;
}

/**
 * Detailed object metadata for single object view
 */
export interface ObjectMetadataDetail extends ObjectConfig {
    /** Formatted fields with name property populated */
    fields: Record<string, FieldConfig & { name: string }>;
}

/**
 * Response for GET /api/metadata/objects (list all objects)
 */
export interface MetadataApiObjectListResponse extends MetadataApiListResponse<ObjectMetadataSummary> {
    items: ObjectMetadataSummary[];
}

/**
 * Response for GET /api/metadata/object/:name (get single object)
 */
export interface MetadataApiObjectDetailResponse extends MetadataApiResponse<ObjectMetadataDetail> {
    /** Object name */
    name: string;
    /** Display label */
    label?: string;
    /** Icon identifier */
    icon?: string;
    /** Description */
    description?: string;
    /** Field definitions with populated names */
    fields: Record<string, FieldConfig & { name: string }>;
    /** Available actions */
    actions?: Record<string, ActionConfig>;
    /** Validation rules */
    validation?: ObjectConfig['validation'];
    /** AI configuration */
    ai?: ObjectConfig['ai'];
}

/**
 * Field metadata response
 */
export interface FieldMetadataResponse extends MetadataApiResponse<FieldConfig> {
    /** Field name */
    name: string;
    /** Field type */
    type: string;
    /** Display label */
    label?: string;
    /** Whether field is required */
    required?: boolean;
    /** Whether field must be unique */
    unique?: boolean;
    /** Default value */
    defaultValue?: unknown;
    /** Options for select/radio fields */
    options?: unknown[];
    /** Minimum value (for number fields) */
    min?: number;
    /** Maximum value (for number fields) */
    max?: number;
    /** Minimum length (for text fields) */
    min_length?: number;
    /** Maximum length (for text fields) */
    max_length?: number;
    /** Regular expression pattern */
    regex?: string;
}

/**
 * Action metadata summary
 */
export interface ActionMetadataSummary {
    /** Action name (internal identifier) */
    name: string;
    /** Action type (record or global) */
    type: 'record' | 'global';
    /** Display label */
    label?: string;
    /** Action parameters */
    params?: Record<string, unknown>;
    /** Action description */
    description?: string;
}

/**
 * Response for GET /api/metadata/object/:name/actions (list object actions)
 */
export interface MetadataApiActionsResponse extends MetadataApiListResponse<ActionMetadataSummary> {
    items: ActionMetadataSummary[];
}

/**
 * Generic metadata entry
 */
export interface MetadataEntry {
    /** Metadata type (e.g., 'object', 'view', 'form', 'page') */
    type: string;
    /** Unique identifier */
    id: string;
    /** File path (if loaded from file) */
    path?: string;
    /** Package name (if from a plugin) */
    package?: string;
    /** Actual metadata content */
    content: unknown;
}

// ============================================================================
// Client SDK Types
// ============================================================================

/**
 * Configuration for Data API client
 */
export interface DataApiClientConfig {
    /** Base URL of the ObjectQL server */
    baseUrl: string;
    /** Optional authentication token */
    token?: string;
    /** Custom headers */
    headers?: Record<string, string>;
    /** Request timeout in milliseconds */
    timeout?: number;
    /** Custom data API path (defaults to /api/data) */
    dataPath?: string;
}

/**
 * Configuration for Metadata API client
 */
export interface MetadataApiClientConfig {
    /** Base URL of the ObjectQL server */
    baseUrl: string;
    /** Optional authentication token */
    token?: string;
    /** Custom headers */
    headers?: Record<string, string>;
    /** Request timeout in milliseconds */
    timeout?: number;
    /** Custom metadata API path (defaults to /api/metadata) */
    metadataPath?: string;
}

/**
 * Interface for Data API client operations
 */
export interface IDataApiClient {
    /**
     * List records from an object
     * @param objectName - Name of the object
     * @param params - Query parameters
     */
    list<T = unknown>(objectName: string, params?: DataApiListParams): Promise<DataApiListResponse<T>>;
    
    /**
     * Get a single record by ID
     * @param objectName - Name of the object
     * @param id - Record ID
     */
    get<T = unknown>(objectName: string, id: string | number): Promise<DataApiItemResponse<T>>;
    
    /**
     * Create a new record
     * @param objectName - Name of the object
     * @param data - Record data
     */
    create<T = unknown>(objectName: string, data: DataApiCreateRequest): Promise<DataApiItemResponse<T>>;
    
    /**
     * Create multiple records
     * @param objectName - Name of the object
     * @param data - Array of record data
     */
    createMany<T = unknown>(objectName: string, data: DataApiCreateManyRequest): Promise<DataApiListResponse<T>>;
    
    /**
     * Update a record
     * @param objectName - Name of the object
     * @param id - Record ID
     * @param data - Updated data
     */
    update<T = unknown>(objectName: string, id: string | number, data: DataApiUpdateRequest): Promise<DataApiItemResponse<T>>;
    
    /**
     * Update multiple records
     * @param objectName - Name of the object
     * @param request - Bulk update request
     */
    updateMany(objectName: string, request: DataApiBulkUpdateRequest): Promise<DataApiResponse>;
    
    /**
     * Delete a record
     * @param objectName - Name of the object
     * @param id - Record ID
     */
    delete(objectName: string, id: string | number): Promise<DataApiDeleteResponse>;
    
    /**
     * Delete multiple records
     * @param objectName - Name of the object
     * @param request - Bulk delete request
     */
    deleteMany(objectName: string, request: DataApiBulkDeleteRequest): Promise<DataApiDeleteResponse>;
    
    /**
     * Count records
     * @param objectName - Name of the object
     * @param filters - Filter criteria
     */
    count(objectName: string, filters?: FilterExpression): Promise<DataApiCountResponse>;
}

/**
 * Interface for Metadata API client operations
 */
export interface IMetadataApiClient {
    /**
     * List all objects
     */
    listObjects(): Promise<MetadataApiObjectListResponse>;
    
    /**
     * Get detailed metadata for a specific object
     * @param objectName - Name of the object
     */
    getObject(objectName: string): Promise<MetadataApiObjectDetailResponse>;
    
    /**
     * Get field metadata for a specific object field
     * @param objectName - Name of the object
     * @param fieldName - Name of the field
     */
    getField(objectName: string, fieldName: string): Promise<FieldMetadataResponse>;
    
    /**
     * List actions for a specific object
     * @param objectName - Name of the object
     */
    listActions(objectName: string): Promise<MetadataApiActionsResponse>;
    
    /**
     * List metadata entries by type
     * @param metadataType - Type of metadata (e.g., 'view', 'form', 'page')
     */
    listByType<T = unknown>(metadataType: string): Promise<MetadataApiListResponse<T>>;
    
    /**
     * Get a specific metadata entry
     * @param metadataType - Type of metadata
     * @param id - Unique identifier
     */
    getMetadata<T = unknown>(metadataType: string, id: string): Promise<MetadataApiResponse<T>>;
}

// ============================================================================
// Route Configuration Types
// ============================================================================

/**
 * Configuration for API route paths
 * Allows customization of all API endpoints during initialization
 */
export interface ApiRouteConfig {
    /**
     * Base path for JSON-RPC endpoint
     * @default '/api/objectql'
     */
    rpc?: string;
    
    /**
     * Base path for REST data API
     * @default '/api/data'
     */
    data?: string;
    
    /**
     * Base path for metadata API
     * @default '/api/metadata'
     */
    metadata?: string;
    
    /**
     * Base path for file operations
     * @default '/api/files'
     */
    files?: string;
}

/**
 * Complete API route configuration with defaults applied
 */
export interface ResolvedApiRouteConfig {
    /** JSON-RPC endpoint path */
    rpc: string;
    
    /** REST data API base path */
    data: string;
    
    /** Metadata API base path */
    metadata: string;
    
    /** File operations base path */
    files: string;
}

/**
 * Default API route configuration
 */
export const DEFAULT_API_ROUTES: ResolvedApiRouteConfig = {
    rpc: '/api/objectql',
    data: '/api/data',
    metadata: '/api/metadata',
    files: '/api/files'
};

/**
 * Resolve API route configuration by merging user config with defaults
 * All paths are normalized to start with '/'
 */
export function resolveApiRoutes(config?: ApiRouteConfig): ResolvedApiRouteConfig {
    const normalizePath = (path: string): string => path.startsWith('/') ? path : `/${path}`;
    
    return {
        rpc: normalizePath(config?.rpc ?? DEFAULT_API_ROUTES.rpc),
        data: normalizePath(config?.data ?? DEFAULT_API_ROUTES.data),
        metadata: normalizePath(config?.metadata ?? DEFAULT_API_ROUTES.metadata),
        files: normalizePath(config?.files ?? DEFAULT_API_ROUTES.files)
    };
}
