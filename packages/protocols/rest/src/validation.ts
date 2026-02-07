/**
 * ObjectQL REST Protocol Validation
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { z } from 'zod';
import { ErrorCode } from './types.js';

/**
 * AI Context Schema
 */
export const AIContextSchema = z.object({
    intent: z.string().optional(),
    natural_language: z.string().optional(),
    use_case: z.string().optional()
}).passthrough(); // Allow additional fields

/**
 * User Schema
 */
export const UserSchema = z.object({
    id: z.string(),
    roles: z.array(z.string())
}).passthrough(); // Allow additional fields

/**
 * Operation types enum
 */
export const OperationSchema = z.enum([
    'find',
    'findOne',
    'create',
    'update',
    'delete',
    'count',
    'action',
    'createMany',
    'updateMany',
    'deleteMany'
]);

/**
 * ObjectQL Request Schema
 */
export const ObjectQLRequestSchema = z.object({
    user: UserSchema.optional(),
    op: OperationSchema,
    object: z.string().min(1, 'Object name cannot be empty'),
    args: z.any(), // Will be validated by operation-specific schemas
    ai_context: AIContextSchema.optional()
});

/**
 * Operation-specific argument schemas
 */

// Find operation arguments
export const FindArgsSchema = z.object({
    filters: z.record(z.any()).optional(),
    fields: z.array(z.string()).optional(),
    sort: z.union([
        z.string(),
        z.array(z.string()),
        z.record(z.union([z.literal(1), z.literal(-1), z.literal('asc'), z.literal('desc')]))
    ]).optional(),
    limit: z.number().int().positive().optional(),
    skip: z.number().int().nonnegative().optional(),
    offset: z.number().int().nonnegative().optional(),
    expand: z.union([z.string(), z.array(z.string())]).optional()
}).passthrough();

// FindOne operation arguments
export const FindOneArgsSchema = z.union([
    z.string(), // ID string
    z.object({
        id: z.string().optional(),
        filters: z.record(z.any()).optional(),
        fields: z.array(z.string()).optional(),
        expand: z.union([z.string(), z.array(z.string())]).optional()
    }).passthrough()
]);

// Create operation arguments
export const CreateArgsSchema = z.record(z.any());

// Update operation arguments
export const UpdateArgsSchema = z.object({
    id: z.string().min(1, 'ID is required for update'),
    data: z.record(z.any())
});

// Delete operation arguments
export const DeleteArgsSchema = z.object({
    id: z.string().min(1, 'ID is required for delete')
});

// Count operation arguments
export const CountArgsSchema = z.object({
    filters: z.record(z.any()).optional()
}).passthrough();

// Action operation arguments
export const ActionArgsSchema = z.object({
    action: z.string().min(1, 'Action name is required'),
    id: z.string().optional(),
    input: z.any().optional(),
    params: z.any().optional()
});

// CreateMany operation arguments
export const CreateManyArgsSchema = z.array(z.record(z.any()));

// UpdateMany operation arguments
export const UpdateManyArgsSchema = z.object({
    filters: z.record(z.any()).optional(),
    data: z.record(z.any())
});

// DeleteMany operation arguments
export const DeleteManyArgsSchema = z.object({
    filters: z.record(z.any()).optional()
});

/**
 * Pagination metadata schema
 */
export const PaginationMetaSchema = z.object({
    total: z.number().int().nonnegative(),
    page: z.number().int().positive().optional(),
    size: z.number().int().positive().optional(),
    pages: z.number().int().nonnegative().optional(),
    has_next: z.boolean().optional()
});

/**
 * Error details schema
 */
export const ErrorDetailsSchema = z.object({
    field: z.string().optional(),
    reason: z.string().optional(),
    fields: z.record(z.string()).optional(),
    required_permission: z.string().optional(),
    user_roles: z.array(z.string()).optional(),
    retry_after: z.number().optional()
}).passthrough();

/**
 * Error schema
 */
export const ErrorSchema = z.object({
    code: z.nativeEnum(ErrorCode).or(z.string()),
    message: z.string(),
    details: ErrorDetailsSchema.or(z.any()).optional()
});

/**
 * ObjectQL Response Schema
 */
export const ObjectQLResponseSchema = z.object({
    items: z.array(z.any()).optional(),
    meta: PaginationMetaSchema.optional(),
    error: ErrorSchema.optional()
}).passthrough(); // Allow additional fields for single item responses

/**
 * Attachment data schema
 */
export const AttachmentDataSchema = z.object({
    id: z.string(),
    name: z.string(),
    url: z.string().url(),
    size: z.number().int().nonnegative(),
    type: z.string(),
    original_name: z.string().optional(),
    uploaded_at: z.string().optional(),
    uploaded_by: z.string().optional()
});

/**
 * Image attachment data schema
 */
export const ImageAttachmentDataSchema = AttachmentDataSchema.extend({
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
    thumbnail_url: z.string().url().optional(),
    variants: z.object({
        small: z.string().url().optional(),
        medium: z.string().url().optional(),
        large: z.string().url().optional()
    }).optional()
});

/**
 * Validation error class
 */
export class ValidationError extends Error {
    public code: ErrorCode;
    public details: any;

    constructor(message: string, details?: any) {
        super(message);
        this.name = 'ValidationError';
        this.code = ErrorCode.VALIDATION_ERROR;
        this.details = details;
    }
}

/**
 * Validate request based on operation type
 */
export function validateRequest(request: unknown): z.infer<typeof ObjectQLRequestSchema> {
    try {
        // First validate the basic request structure
        const validatedRequest = ObjectQLRequestSchema.parse(request);
        
        // Then validate operation-specific arguments
        switch (validatedRequest.op) {
            case 'find':
                validatedRequest.args = FindArgsSchema.parse(validatedRequest.args);
                break;
            case 'findOne':
                validatedRequest.args = FindOneArgsSchema.parse(validatedRequest.args);
                break;
            case 'create':
                validatedRequest.args = CreateArgsSchema.parse(validatedRequest.args);
                break;
            case 'update':
                validatedRequest.args = UpdateArgsSchema.parse(validatedRequest.args);
                break;
            case 'delete':
                validatedRequest.args = DeleteArgsSchema.parse(validatedRequest.args);
                break;
            case 'count':
                validatedRequest.args = CountArgsSchema.parse(validatedRequest.args);
                break;
            case 'action':
                validatedRequest.args = ActionArgsSchema.parse(validatedRequest.args);
                break;
            case 'createMany':
                validatedRequest.args = CreateManyArgsSchema.parse(validatedRequest.args);
                break;
            case 'updateMany':
                validatedRequest.args = UpdateManyArgsSchema.parse(validatedRequest.args);
                break;
            case 'deleteMany':
                validatedRequest.args = DeleteManyArgsSchema.parse(validatedRequest.args);
                break;
        }
        
        return validatedRequest;
    } catch (error) {
        if (error instanceof z.ZodError) {
            throw new ValidationError(
                'Request validation failed',
                {
                    fields: error.errors.reduce((acc, err) => {
                        const path = err.path.join('.');
                        acc[path] = err.message;
                        return acc;
                    }, {} as Record<string, string>)
                }
            );
        }
        throw error;
    }
}

/**
 * Validate response structure
 */
export function validateResponse(response: unknown): z.infer<typeof ObjectQLResponseSchema> {
    try {
        return ObjectQLResponseSchema.parse(response);
    } catch (error) {
        if (error instanceof z.ZodError) {
            console.error('[REST Validation] Response validation failed:', error.errors);
            // Don't throw on response validation - log and return as-is
            return response as any;
        }
        throw error;
    }
}

/**
 * Type exports for TypeScript inference
 */
export type ValidatedRequest = z.infer<typeof ObjectQLRequestSchema>;
export type ValidatedResponse = z.infer<typeof ObjectQLResponseSchema>;
export type FindArgs = z.infer<typeof FindArgsSchema>;
export type FindOneArgs = z.infer<typeof FindOneArgsSchema>;
export type CreateArgs = z.infer<typeof CreateArgsSchema>;
export type UpdateArgs = z.infer<typeof UpdateArgsSchema>;
export type DeleteArgs = z.infer<typeof DeleteArgsSchema>;
export type CountArgs = z.infer<typeof CountArgsSchema>;
export type ActionArgs = z.infer<typeof ActionArgsSchema>;
export type CreateManyArgs = z.infer<typeof CreateManyArgsSchema>;
export type UpdateManyArgs = z.infer<typeof UpdateManyArgsSchema>;
export type DeleteManyArgs = z.infer<typeof DeleteManyArgsSchema>;
