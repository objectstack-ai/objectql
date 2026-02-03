/**
 * JSON-RPC 2.0 Protocol Validation
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { z } from 'zod';

/**
 * JSON-RPC 2.0 version constant
 */
export const JSONRPC_VERSION = '2.0' as const;

/**
 * JSON-RPC error codes
 */
export enum JSONRPCErrorCode {
    PARSE_ERROR = -32700,
    INVALID_REQUEST = -32600,
    METHOD_NOT_FOUND = -32601,
    INVALID_PARAMS = -32602,
    INTERNAL_ERROR = -32603,
    SERVER_ERROR = -32000, // -32000 to -32099 are reserved for implementation-defined server errors
}

/**
 * JSON-RPC Request Schema
 */
export const JSONRPCRequestSchema = z.object({
    jsonrpc: z.literal(JSONRPC_VERSION),
    method: z.string().min(1, 'Method name cannot be empty'),
    params: z.union([z.array(z.any()), z.record(z.any())]).optional(),
    id: z.union([z.string(), z.number(), z.null()]).optional()
});

/**
 * JSON-RPC Error Schema
 */
export const JSONRPCErrorSchema = z.object({
    code: z.number().int(),
    message: z.string(),
    data: z.any().optional()
});

/**
 * JSON-RPC Response Schema (Success)
 */
export const JSONRPCSuccessResponseSchema = z.object({
    jsonrpc: z.literal(JSONRPC_VERSION),
    result: z.any(),
    id: z.union([z.string(), z.number(), z.null()])
}).strict();

/**
 * JSON-RPC Response Schema (Error)
 */
export const JSONRPCErrorResponseSchema = z.object({
    jsonrpc: z.literal(JSONRPC_VERSION),
    error: JSONRPCErrorSchema,
    id: z.union([z.string(), z.number(), z.null()])
}).strict();

/**
 * JSON-RPC Response Schema (either success or error)
 * Note: Error response must come first in union since success has z.any() for result
 */
export const JSONRPCResponseSchema = z.union([
    JSONRPCErrorResponseSchema,
    JSONRPCSuccessResponseSchema
]);

/**
 * JSON-RPC Batch Request Schema
 */
export const JSONRPCBatchRequestSchema = z.array(JSONRPCRequestSchema).min(1, 'Batch cannot be empty');

/**
 * JSON-RPC Batch Response Schema
 */
export const JSONRPCBatchResponseSchema = z.array(JSONRPCResponseSchema);

/**
 * Validation error class for JSON-RPC
 */
export class JSONRPCValidationError extends Error {
    public code: JSONRPCErrorCode;
    public data?: any;

    constructor(code: JSONRPCErrorCode, message: string, data?: any) {
        super(message);
        this.name = 'JSONRPCValidationError';
        this.code = code;
        this.data = data;
    }
}

/**
 * Validate a JSON-RPC request
 */
export function validateRequest(request: unknown): z.infer<typeof JSONRPCRequestSchema> {
    try {
        return JSONRPCRequestSchema.parse(request);
    } catch (error) {
        if (error instanceof z.ZodError) {
            throw new JSONRPCValidationError(
                JSONRPCErrorCode.INVALID_REQUEST,
                'Invalid JSON-RPC request format',
                {
                    validationErrors: error.errors.map(err => ({
                        path: err.path.join('.'),
                        message: err.message
                    }))
                }
            );
        }
        throw error;
    }
}

/**
 * Validate a JSON-RPC batch request
 */
export function validateBatchRequest(request: unknown): z.infer<typeof JSONRPCBatchRequestSchema> {
    try {
        return JSONRPCBatchRequestSchema.parse(request);
    } catch (error) {
        if (error instanceof z.ZodError) {
            throw new JSONRPCValidationError(
                JSONRPCErrorCode.INVALID_REQUEST,
                'Invalid JSON-RPC batch request format',
                {
                    validationErrors: error.errors.map(err => ({
                        path: err.path.join('.'),
                        message: err.message
                    }))
                }
            );
        }
        throw error;
    }
}

/**
 * Validate a JSON-RPC response
 */
export function validateResponse(response: unknown): z.infer<typeof JSONRPCResponseSchema> {
    try {
        return JSONRPCResponseSchema.parse(response);
    } catch (error) {
        if (error instanceof z.ZodError) {
            console.error('[JSON-RPC Validation] Response validation failed:', error.errors);
            // Don't throw on response validation - log and return as-is
            return response as any;
        }
        throw error;
    }
}

/**
 * Validate a JSON-RPC batch response
 */
export function validateBatchResponse(response: unknown): z.infer<typeof JSONRPCBatchResponseSchema> {
    try {
        return JSONRPCBatchResponseSchema.parse(response);
    } catch (error) {
        if (error instanceof z.ZodError) {
            console.error('[JSON-RPC Validation] Batch response validation failed:', error.errors);
            // Don't throw on response validation - log and return as-is
            return response as any;
        }
        throw error;
    }
}

/**
 * Validate method parameters against a schema
 */
export function validateMethodParams<T>(
    params: unknown,
    schema: z.ZodSchema<T>,
    methodName: string
): T {
    try {
        return schema.parse(params);
    } catch (error) {
        if (error instanceof z.ZodError) {
            throw new JSONRPCValidationError(
                JSONRPCErrorCode.INVALID_PARAMS,
                `Invalid parameters for method '${methodName}'`,
                {
                    validationErrors: error.errors.map(err => ({
                        path: err.path.join('.'),
                        message: err.message
                    }))
                }
            );
        }
        throw error;
    }
}

/**
 * Create a standardized JSON-RPC error response
 */
export function createErrorResponse(
    id: string | number | null,
    code: JSONRPCErrorCode,
    message: string,
    data?: any
): z.infer<typeof JSONRPCErrorResponseSchema> {
    return {
        jsonrpc: JSONRPC_VERSION,
        error: {
            code,
            message,
            data
        },
        id
    };
}

/**
 * Create a standardized JSON-RPC success response
 */
export function createSuccessResponse(
    id: string | number | null,
    result: any
): z.infer<typeof JSONRPCSuccessResponseSchema> {
    return {
        jsonrpc: JSONRPC_VERSION,
        result,
        id
    };
}

/**
 * Type exports for TypeScript inference
 */
export type JSONRPCRequest = z.infer<typeof JSONRPCRequestSchema>;
export type JSONRPCResponse = z.infer<typeof JSONRPCResponseSchema>;
export type JSONRPCSuccessResponse = z.infer<typeof JSONRPCSuccessResponseSchema>;
export type JSONRPCErrorResponse = z.infer<typeof JSONRPCErrorResponseSchema>;
export type JSONRPCBatchRequest = z.infer<typeof JSONRPCBatchRequestSchema>;
export type JSONRPCBatchResponse = z.infer<typeof JSONRPCBatchResponseSchema>;
export type JSONRPCError = z.infer<typeof JSONRPCErrorSchema>;
