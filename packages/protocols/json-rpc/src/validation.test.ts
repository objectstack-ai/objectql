/**
 * JSON-RPC 2.0 Protocol Validation Tests
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { describe, it, expect } from 'vitest';
import {
    validateRequest,
    validateBatchRequest,
    validateResponse,
    validateBatchResponse,
    validateMethodParams,
    createErrorResponse,
    createSuccessResponse,
    JSONRPCValidationError,
    JSONRPCErrorCode,
    JSONRPC_VERSION,
    JSONRPCRequestSchema,
    JSONRPCResponseSchema,
    JSONRPCBatchRequestSchema,
    JSONRPCBatchResponseSchema
} from './validation';
import { z } from 'zod';

describe('JSON-RPC 2.0 Protocol Validation', () => {
    describe('Request Validation', () => {
        it('should validate a minimal valid request', () => {
            const request = {
                jsonrpc: '2.0',
                method: 'test.method',
                id: 1
            };
            
            const validated = validateRequest(request);
            expect(validated.jsonrpc).toBe('2.0');
            expect(validated.method).toBe('test.method');
            expect(validated.id).toBe(1);
        });

        it('should validate request with array params', () => {
            const request = {
                jsonrpc: '2.0',
                method: 'subtract',
                params: [42, 23],
                id: 1
            };
            
            const validated = validateRequest(request);
            expect(validated.params).toEqual([42, 23]);
        });

        it('should validate request with object params', () => {
            const request = {
                jsonrpc: '2.0',
                method: 'subtract',
                params: { minuend: 42, subtrahend: 23 },
                id: 2
            };
            
            const validated = validateRequest(request);
            expect(validated.params).toEqual({ minuend: 42, subtrahend: 23 });
        });

        it('should validate notification (no id)', () => {
            const request = {
                jsonrpc: '2.0',
                method: 'notify',
                params: [1, 2, 3]
            };
            
            const validated = validateRequest(request);
            expect(validated.id).toBeUndefined();
        });

        it('should validate request with null id', () => {
            const request = {
                jsonrpc: '2.0',
                method: 'test',
                id: null
            };
            
            const validated = validateRequest(request);
            expect(validated.id).toBeNull();
        });

        it('should validate request with string id', () => {
            const request = {
                jsonrpc: '2.0',
                method: 'test',
                id: 'abc-123'
            };
            
            const validated = validateRequest(request);
            expect(validated.id).toBe('abc-123');
        });

        it('should reject request without jsonrpc', () => {
            const request = {
                method: 'test',
                id: 1
            };
            
            expect(() => validateRequest(request)).toThrow(JSONRPCValidationError);
        });

        it('should reject request with wrong jsonrpc version', () => {
            const request = {
                jsonrpc: '1.0',
                method: 'test',
                id: 1
            };
            
            expect(() => validateRequest(request)).toThrow(JSONRPCValidationError);
        });

        it('should reject request without method', () => {
            const request = {
                jsonrpc: '2.0',
                id: 1
            };
            
            expect(() => validateRequest(request as any)).toThrow(JSONRPCValidationError);
        });

        it('should reject request with empty method', () => {
            const request = {
                jsonrpc: '2.0',
                method: '',
                id: 1
            };
            
            expect(() => validateRequest(request)).toThrow(JSONRPCValidationError);
        });

        it('should reject request with invalid id type', () => {
            const request = {
                jsonrpc: '2.0',
                method: 'test',
                id: { nested: 'object' }
            };
            
            expect(() => validateRequest(request as any)).toThrow(JSONRPCValidationError);
        });
    });

    describe('Batch Request Validation', () => {
        it('should validate batch request with multiple calls', () => {
            const batch = [
                { jsonrpc: '2.0', method: 'sum', params: [1, 2, 4], id: '1' },
                { jsonrpc: '2.0', method: 'notify_hello', params: [7] },
                { jsonrpc: '2.0', method: 'subtract', params: [42, 23], id: '2' },
                { jsonrpc: '2.0', method: 'get_data', id: '9' }
            ];
            
            const validated = validateBatchRequest(batch);
            expect(validated).toHaveLength(4);
            expect(validated[0].method).toBe('sum');
            expect(validated[1].id).toBeUndefined();
        });

        it('should reject empty batch', () => {
            const batch: any[] = [];
            
            expect(() => validateBatchRequest(batch)).toThrow(JSONRPCValidationError);
        });

        it('should reject batch with invalid request', () => {
            const batch = [
                { jsonrpc: '2.0', method: 'sum', id: '1' },
                { jsonrpc: '1.0', method: 'invalid', id: '2' } // Invalid version
            ];
            
            expect(() => validateBatchRequest(batch)).toThrow(JSONRPCValidationError);
        });

        it('should reject non-array batch', () => {
            const batch = { jsonrpc: '2.0', method: 'test', id: 1 };
            
            expect(() => validateBatchRequest(batch as any)).toThrow(JSONRPCValidationError);
        });
    });

    describe('Response Validation', () => {
        it('should validate success response', () => {
            const response = {
                jsonrpc: '2.0',
                result: { status: 'success' },
                id: 1
            };
            
            const validated = validateResponse(response);
            expect(validated).toHaveProperty('result');
            expect((validated as any).result).toEqual({ status: 'success' });
        });

        it('should validate error response', () => {
            const response = {
                jsonrpc: '2.0',
                error: {
                    code: -32600,
                    message: 'Invalid Request'
                },
                id: 1
            };
            
            const validated = validateResponse(response);
            expect(validated).toHaveProperty('error');
            expect((validated as any).error.code).toBe(-32600);
        });

        it('should validate error response with data', () => {
            const response = {
                jsonrpc: '2.0',
                error: {
                    code: -32602,
                    message: 'Invalid params',
                    data: { field: 'email', reason: 'Invalid format' }
                },
                id: 1
            };
            
            const validated = validateResponse(response);
            expect((validated as any).error.data).toEqual({ field: 'email', reason: 'Invalid format' });
        });

        it('should handle invalid response gracefully (log but not throw)', () => {
            const response = {
                jsonrpc: '1.0', // Invalid version
                result: 'test',
                id: 1
            };
            
            // Should not throw, just log
            const validated = validateResponse(response);
            expect(validated).toBeDefined();
        });
    });

    describe('Batch Response Validation', () => {
        it('should validate batch response', () => {
            const batch = [
                { jsonrpc: '2.0', result: 7, id: '1' },
                { jsonrpc: '2.0', result: 19, id: '2' },
                { jsonrpc: '2.0', error: { code: -32600, message: 'Invalid Request' }, id: null }
            ];
            
            const validated = validateBatchResponse(batch);
            expect(validated).toHaveLength(3);
        });

        it('should handle invalid batch response gracefully', () => {
            const batch = [
                { jsonrpc: '2.0', result: 7, id: '1' },
                { jsonrpc: '1.0', result: 19, id: '2' } // Invalid version
            ];
            
            // Should not throw, just log
            const validated = validateBatchResponse(batch);
            expect(validated).toBeDefined();
        });
    });

    describe('Method Parameter Validation', () => {
        it('should validate method params with custom schema', () => {
            const schema = z.object({
                name: z.string(),
                age: z.number().int().positive()
            });
            
            const params = { name: 'John', age: 30 };
            
            const validated = validateMethodParams(params, schema, 'createUser');
            expect(validated.name).toBe('John');
            expect(validated.age).toBe(30);
        });

        it('should reject invalid method params', () => {
            const schema = z.object({
                name: z.string(),
                age: z.number().int().positive()
            });
            
            const params = { name: 'John', age: -5 }; // Invalid age
            
            expect(() => validateMethodParams(params, schema, 'createUser'))
                .toThrow(JSONRPCValidationError);
        });

        it('should provide detailed error for invalid params', () => {
            const schema = z.object({
                email: z.string().email(),
                count: z.number().int().min(0)
            });
            
            const params = { email: 'invalid-email', count: -1 };
            
            try {
                validateMethodParams(params, schema, 'testMethod');
                fail('Should have thrown');
            } catch (error) {
                expect(error).toBeInstanceOf(JSONRPCValidationError);
                expect((error as JSONRPCValidationError).code).toBe(JSONRPCErrorCode.INVALID_PARAMS);
                expect((error as JSONRPCValidationError).data).toBeDefined();
            }
        });
    });

    describe('Error Response Creation', () => {
        it('should create error response with all fields', () => {
            const response = createErrorResponse(
                1,
                JSONRPCErrorCode.METHOD_NOT_FOUND,
                'Method not found: test.method',
                { availableMethods: ['method1', 'method2'] }
            );
            
            expect(response.jsonrpc).toBe('2.0');
            expect(response.error.code).toBe(JSONRPCErrorCode.METHOD_NOT_FOUND);
            expect(response.error.message).toBe('Method not found: test.method');
            expect(response.error.data).toEqual({ availableMethods: ['method1', 'method2'] });
            expect(response.id).toBe(1);
        });

        it('should create error response with null id', () => {
            const response = createErrorResponse(
                null,
                JSONRPCErrorCode.PARSE_ERROR,
                'Parse error'
            );
            
            expect(response.id).toBeNull();
        });

        it('should create error response without data', () => {
            const response = createErrorResponse(
                'abc',
                JSONRPCErrorCode.INTERNAL_ERROR,
                'Internal error'
            );
            
            expect(response.error.data).toBeUndefined();
        });
    });

    describe('Success Response Creation', () => {
        it('should create success response', () => {
            const response = createSuccessResponse(1, { status: 'ok', value: 42 });
            
            expect(response.jsonrpc).toBe('2.0');
            expect(response.result).toEqual({ status: 'ok', value: 42 });
            expect(response.id).toBe(1);
        });

        it('should create success response with null result', () => {
            const response = createSuccessResponse(2, null);
            
            expect(response.result).toBeNull();
        });

        it('should create success response with primitive result', () => {
            const response = createSuccessResponse(3, 'success');
            
            expect(response.result).toBe('success');
        });
    });

    describe('Error Codes', () => {
        it('should have correct standard error codes', () => {
            expect(JSONRPCErrorCode.PARSE_ERROR).toBe(-32700);
            expect(JSONRPCErrorCode.INVALID_REQUEST).toBe(-32600);
            expect(JSONRPCErrorCode.METHOD_NOT_FOUND).toBe(-32601);
            expect(JSONRPCErrorCode.INVALID_PARAMS).toBe(-32602);
            expect(JSONRPCErrorCode.INTERNAL_ERROR).toBe(-32603);
            expect(JSONRPCErrorCode.SERVER_ERROR).toBe(-32000);
        });
    });

    describe('JSONRPCValidationError', () => {
        it('should create validation error with all fields', () => {
            const error = new JSONRPCValidationError(
                JSONRPCErrorCode.INVALID_REQUEST,
                'Invalid request format',
                { field: 'jsonrpc' }
            );
            
            expect(error.name).toBe('JSONRPCValidationError');
            expect(error.code).toBe(JSONRPCErrorCode.INVALID_REQUEST);
            expect(error.message).toBe('Invalid request format');
            expect(error.data).toEqual({ field: 'jsonrpc' });
        });

        it('should create validation error without data', () => {
            const error = new JSONRPCValidationError(
                JSONRPCErrorCode.METHOD_NOT_FOUND,
                'Method not found'
            );
            
            expect(error.data).toBeUndefined();
        });
    });

    describe('Schema Exports', () => {
        it('should export request schema', () => {
            expect(JSONRPCRequestSchema).toBeDefined();
            expect(JSONRPCRequestSchema.parse({
                jsonrpc: '2.0',
                method: 'test',
                id: 1
            })).toBeDefined();
        });

        it('should export response schema', () => {
            expect(JSONRPCResponseSchema).toBeDefined();
        });

        it('should export batch schemas', () => {
            expect(JSONRPCBatchRequestSchema).toBeDefined();
            expect(JSONRPCBatchResponseSchema).toBeDefined();
        });
    });
});
