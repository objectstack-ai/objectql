/**
 * GraphQL Protocol Validation and Error Mapping
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { z } from 'zod';
import { GraphQLError } from 'graphql';

/**
 * Standard error codes for GraphQL operations
 */
export enum GraphQLErrorCode {
    // Client errors (4xx equivalent)
    BAD_USER_INPUT = 'BAD_USER_INPUT',
    UNAUTHENTICATED = 'UNAUTHENTICATED',
    FORBIDDEN = 'FORBIDDEN',
    NOT_FOUND = 'NOT_FOUND',
    
    // Server errors (5xx equivalent)
    INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
    
    // GraphQL-specific errors
    GRAPHQL_PARSE_FAILED = 'GRAPHQL_PARSE_FAILED',
    GRAPHQL_VALIDATION_FAILED = 'GRAPHQL_VALIDATION_FAILED',
    BAD_REQUEST = 'BAD_REQUEST',
    
    // Persisted queries
    PERSISTED_QUERY_NOT_FOUND = 'PERSISTED_QUERY_NOT_FOUND',
    PERSISTED_QUERY_NOT_SUPPORTED = 'PERSISTED_QUERY_NOT_SUPPORTED'
}

/**
 * GraphQL input validation context
 */
export interface ValidationContext {
    objectName: string;
    operationType: 'query' | 'mutation' | 'subscription';
    fieldName: string;
}

/**
 * Validation error details
 */
export interface ValidationErrorDetails {
    field?: string;
    message: string;
    code?: string;
    [key: string]: any;
}

/**
 * Custom GraphQL validation error
 */
export class GraphQLValidationError extends GraphQLError {
    public code: GraphQLErrorCode;
    public details?: ValidationErrorDetails[];

    constructor(
        message: string,
        code: GraphQLErrorCode = GraphQLErrorCode.BAD_USER_INPUT,
        details?: ValidationErrorDetails[]
    ) {
        super(message, {
            extensions: {
                code,
                details
            }
        });
        this.code = code;
        this.details = details;
    }
}

/**
 * Map common errors to GraphQL error codes
 */
export function mapErrorToGraphQLError(error: any): GraphQLError {
    // Already a GraphQL error
    if (error instanceof GraphQLError) {
        return error;
    }

    // Validation errors
    if (error.name === 'ValidationError' || error.code === 'VALIDATION_ERROR') {
        return new GraphQLValidationError(
            error.message || 'Validation failed',
            GraphQLErrorCode.BAD_USER_INPUT,
            error.fields ? Object.entries(error.fields).map(([field, message]) => ({
                field,
                message: String(message)
            })) : error.details
        );
    }

    // Permission errors
    if (error.name === 'PermissionError' || error.code === 'FORBIDDEN') {
        return new GraphQLValidationError(
            error.message || 'You do not have permission to access this resource',
            GraphQLErrorCode.FORBIDDEN,
            error.details ? [{ message: error.details }] : undefined
        );
    }

    // Authentication errors
    if (error.name === 'AuthenticationError' || error.code === 'UNAUTHORIZED' || error.code === 'UNAUTHENTICATED') {
        return new GraphQLValidationError(
            error.message || 'Authentication required',
            GraphQLErrorCode.UNAUTHENTICATED
        );
    }

    // Not found errors
    if (error.name === 'NotFoundError' || error.code === 'NOT_FOUND') {
        return new GraphQLValidationError(
            error.message || 'Resource not found',
            GraphQLErrorCode.NOT_FOUND
        );
    }

    // Database errors
    if (error.name === 'DatabaseError' || error.code?.startsWith('DB_')) {
        return new GraphQLValidationError(
            'An error occurred while processing your request',
            GraphQLErrorCode.INTERNAL_SERVER_ERROR,
            [{ message: 'Database error', code: error.code }]
        );
    }

    // Default to internal server error
    return new GraphQLValidationError(
        error.message || 'An unexpected error occurred',
        GraphQLErrorCode.INTERNAL_SERVER_ERROR
    );
}

/**
 * Validate GraphQL input arguments using Zod schema
 */
export function validateGraphQLInput<T>(
    input: unknown,
    schema: z.ZodSchema<T>,
    context: ValidationContext
): T {
    try {
        return schema.parse(input);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const details: ValidationErrorDetails[] = error.issues.map((err: any) => ({
                field: err.path.join('.'),
                message: err.message,
                code: err.code
            }));
            
            throw new GraphQLValidationError(
                `Invalid input for ${context.operationType} ${context.objectName}.${context.fieldName}`,
                GraphQLErrorCode.BAD_USER_INPUT,
                details
            );
        }
        throw error;
    }
}

/**
 * Pagination input schema
 */
export const PaginationInputSchema = z.object({
    first: z.number().int().positive().optional(),
    after: z.string().optional(),
    last: z.number().int().positive().optional(),
    before: z.string().optional()
}).refine(
    data => !(data.first && data.last),
    { message: 'Cannot use both "first" and "last" pagination arguments' }
).refine(
    data => !(data.after && data.before),
    { message: 'Cannot use both "after" and "before" cursor arguments' }
);

/**
 * Filter input base schema
 */
export const FilterInputSchema = z.record(z.string(), z.any());

/**
 * Sort order enum
 */
export const SortOrderSchema = z.enum(['ASC', 'DESC']);

/**
 * Common query input schema
 */
export const QueryInputSchema = z.object({
    filters: FilterInputSchema.optional(),
    sort: z.record(z.string(), SortOrderSchema).optional(),
    limit: z.number().int().positive().max(1000).optional(),
    offset: z.number().int().nonnegative().optional()
});

/**
 * Create input validation schema
 */
export const CreateInputSchema = z.record(z.string(), z.any());

/**
 * Update input validation schema
 */
export const UpdateInputSchema = z.object({
    id: z.string().min(1, 'ID is required'),
    data: z.record(z.string(), z.any())
});

/**
 * Delete input validation schema
 */
export const DeleteInputSchema = z.object({
    id: z.string().min(1, 'ID is required')
});

/**
 * Type exports
 */
export type PaginationInput = z.infer<typeof PaginationInputSchema>;
export type FilterInput = z.infer<typeof FilterInputSchema>;
export type SortOrder = z.infer<typeof SortOrderSchema>;
export type QueryInput = z.infer<typeof QueryInputSchema>;
export type CreateInput = z.infer<typeof CreateInputSchema>;
export type UpdateInput = z.infer<typeof UpdateInputSchema>;
export type DeleteInput = z.infer<typeof DeleteInputSchema>;
