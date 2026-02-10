/**
 * OData V4 Protocol Validation
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { z } from 'zod';

/**
 * OData error codes based on HTTP status codes and OData spec
 */
export enum ODataErrorCode {
    // Client errors
    BAD_REQUEST = 'BadRequest',
    UNAUTHORIZED = 'Unauthorized',
    FORBIDDEN = 'Forbidden',
    NOT_FOUND = 'NotFound',
    METHOD_NOT_ALLOWED = 'MethodNotAllowed',
    NOT_ACCEPTABLE = 'NotAcceptable',
    PRECONDITION_FAILED = 'PreconditionFailed',
    
    // Server errors
    INTERNAL_SERVER_ERROR = 'InternalServerError',
    NOT_IMPLEMENTED = 'NotImplemented',
    SERVICE_UNAVAILABLE = 'ServiceUnavailable',
    
    // OData-specific errors
    INVALID_QUERY = 'InvalidQuery',
    INVALID_FILTER = 'InvalidFilter',
    INVALID_ORDERBY = 'InvalidOrderBy',
    INVALID_EXPAND = 'InvalidExpand',
    INVALID_SELECT = 'InvalidSelect'
}

/**
 * OData logical operators
 */
export const LogicalOperatorSchema = z.enum(['and', 'or', 'not']);

/**
 * OData comparison operators
 */
export const ComparisonOperatorSchema = z.enum([
    'eq', 'ne', 'gt', 'ge', 'lt', 'le',
    'has', 'in'
]);

/**
 * OData string functions
 */
export const StringFunctionSchema = z.enum([
    'contains', 'endswith', 'startswith',
    'length', 'indexof', 'substring',
    'tolower', 'toupper', 'trim',
    'concat'
]);

/**
 * OData numeric functions
 */
export const NumericFunctionSchema = z.enum([
    'ceiling', 'floor', 'round'
]);

/**
 * OData date functions
 */
export const DateFunctionSchema = z.enum([
    'year', 'month', 'day',
    'hour', 'minute', 'second',
    'date', 'time', 'now'
]);

/**
 * $top parameter validation
 */
export const TopParamSchema = z.number().int().positive().max(1000);

/**
 * $skip parameter validation
 */
export const SkipParamSchema = z.number().int().nonnegative();

/**
 * $count parameter validation
 */
export const CountParamSchema = z.boolean();

/**
 * $orderby parameter validation (simplified)
 */
export const OrderByParamSchema = z.string().min(1);

/**
 * $filter parameter validation (simplified - full parsing is complex)
 */
export const FilterParamSchema = z.string().min(1);

/**
 * $select parameter validation
 */
export const SelectParamSchema = z.union([
    z.string().min(1),
    z.array(z.string().min(1))
]);

/**
 * $expand parameter validation
 */
export const ExpandParamSchema = z.union([
    z.string().min(1),
    z.array(z.string().min(1))
]);

/**
 * $search parameter validation (full-text search)
 */
export const SearchParamSchema = z.string().min(1);

/**
 * Query options schema
 */
export const QueryOptionsSchema = z.object({
    $top: TopParamSchema.optional(),
    $skip: SkipParamSchema.optional(),
    $count: CountParamSchema.optional(),
    $orderby: OrderByParamSchema.optional(),
    $filter: FilterParamSchema.optional(),
    $select: SelectParamSchema.optional(),
    $expand: ExpandParamSchema.optional(),
    $search: SearchParamSchema.optional()
}).strict();

/**
 * OData batch request content types
 */
export const BatchContentTypeSchema = z.string().regex(
    /^multipart\/mixed;\s*boundary=.+$/,
    'Invalid batch content type'
);

/**
 * OData batch changeset
 */
export const BatchChangeSetSchema = z.object({
    requests: z.array(z.object({
        method: z.enum(['POST', 'PATCH', 'PUT', 'DELETE']),
        url: z.string(),
        headers: z.record(z.string(), z.string()).optional(),
        body: z.any().optional()
    })).min(1)
});

/**
 * OData batch request
 */
export const BatchRequestSchema = z.object({
    changeSets: z.array(BatchChangeSetSchema).optional(),
    queries: z.array(z.object({
        method: z.literal('GET'),
        url: z.string(),
        headers: z.record(z.string(), z.string()).optional()
    })).optional()
}).refine(
    data => (data.changeSets && data.changeSets.length > 0) || (data.queries && data.queries.length > 0),
    { message: 'Batch request must contain at least one changeset or query' }
);

/**
 * OData error response schema
 */
export const ODataErrorSchema = z.object({
    error: z.object({
        code: z.string(),
        message: z.string(),
        target: z.string().optional(),
        details: z.array(z.object({
            code: z.string(),
            message: z.string(),
            target: z.string().optional()
        })).optional(),
        innererror: z.object({
            message: z.string(),
            type: z.string().optional(),
            stacktrace: z.string().optional()
        }).optional()
    })
});

/**
 * Validation error class for OData
 */
export class ODataValidationError extends Error {
    public code: ODataErrorCode;
    public target?: string;
    public details?: Array<{ code: string; message: string; target?: string }>;

    constructor(
        code: ODataErrorCode,
        message: string,
        target?: string,
        details?: Array<{ code: string; message: string; target?: string }>
    ) {
        super(message);
        this.name = 'ODataValidationError';
        this.code = code;
        this.target = target;
        this.details = details;
    }
}

/**
 * Validate query options
 */
export function validateQueryOptions(options: unknown): z.infer<typeof QueryOptionsSchema> {
    try {
        return QueryOptionsSchema.parse(options);
    } catch (error) {
        if (error instanceof z.ZodError) {
            throw new ODataValidationError(
                ODataErrorCode.INVALID_QUERY,
                'Invalid query options',
                undefined,
                error.issues.map((err: z.ZodIssue) => ({
                    code: err.code,
                    message: err.message,
                    target: err.path.join('.')
                }))
            );
        }
        throw error;
    }
}

/**
 * Validate batch request
 */
export function validateBatchRequest(request: unknown): z.infer<typeof BatchRequestSchema> {
    try {
        return BatchRequestSchema.parse(request);
    } catch (error) {
        if (error instanceof z.ZodError) {
            throw new ODataValidationError(
                ODataErrorCode.BAD_REQUEST,
                'Invalid batch request format',
                undefined,
                error.issues.map((err: z.ZodIssue) => ({
                    code: err.code,
                    message: err.message,
                    target: err.path.join('.')
                }))
            );
        }
        throw error;
    }
}

/**
 * Create OData error response
 */
export function createODataError(
    code: ODataErrorCode,
    message: string,
    target?: string,
    details?: Array<{ code: string; message: string; target?: string }>,
    innerError?: { message: string; type?: string; stacktrace?: string }
): z.infer<typeof ODataErrorSchema> {
    return {
        error: {
            code,
            message,
            target,
            details,
            innererror: innerError
        }
    };
}

/**
 * Map common errors to OData error codes
 */
export function mapErrorToODataError(error: any): z.infer<typeof ODataErrorSchema> {
    let code: ODataErrorCode;
    let message: string;
    let target: string | undefined;

    if (error instanceof ODataValidationError) {
        return createODataError(error.code, error.message, error.target, error.details);
    }

    // Validation errors
    if (error.name === 'ValidationError' || error.code === 'VALIDATION_ERROR') {
        code = ODataErrorCode.BAD_REQUEST;
        message = error.message || 'Validation failed';
    }
    // Permission errors
    else if (error.name === 'PermissionError' || error.code === 'FORBIDDEN') {
        code = ODataErrorCode.FORBIDDEN;
        message = error.message || 'Access forbidden';
    }
    // Authentication errors
    else if (error.name === 'AuthenticationError' || error.code === 'UNAUTHORIZED') {
        code = ODataErrorCode.UNAUTHORIZED;
        message = error.message || 'Authentication required';
    }
    // Not found errors
    else if (error.name === 'NotFoundError' || error.code === 'NOT_FOUND') {
        code = ODataErrorCode.NOT_FOUND;
        message = error.message || 'Resource not found';
    }
    // Database errors
    else if (error.name === 'DatabaseError' || error.code?.startsWith('DB_')) {
        code = ODataErrorCode.INTERNAL_SERVER_ERROR;
        message = 'An error occurred while processing your request';
    }
    // Default
    else {
        code = ODataErrorCode.INTERNAL_SERVER_ERROR;
        message = error.message || 'Internal server error';
    }

    return createODataError(code, message, target);
}

/**
 * Type exports
 */
export type QueryOptions = z.infer<typeof QueryOptionsSchema>;
export type BatchRequest = z.infer<typeof BatchRequestSchema>;
export type BatchChangeSet = z.infer<typeof BatchChangeSetSchema>;
export type ODataError = z.infer<typeof ODataErrorSchema>;
export type LogicalOperator = z.infer<typeof LogicalOperatorSchema>;
export type ComparisonOperator = z.infer<typeof ComparisonOperatorSchema>;
