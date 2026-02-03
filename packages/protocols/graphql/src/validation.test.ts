/**
 * GraphQL Protocol Validation Tests
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { describe, it, expect } from 'vitest';
import {
    GraphQLValidationError,
    GraphQLErrorCode,
    mapErrorToGraphQLError,
    validateGraphQLInput,
    PaginationInputSchema,
    QueryInputSchema,
    CreateInputSchema,
    UpdateInputSchema,
    DeleteInputSchema,
    SortOrderSchema
} from './validation';
import { z } from 'zod';
import { GraphQLError } from 'graphql';

describe('GraphQL Protocol Validation', () => {
    describe('GraphQLValidationError', () => {
        it('should create validation error with all fields', () => {
            const error = new GraphQLValidationError(
                'Invalid input',
                GraphQLErrorCode.BAD_USER_INPUT,
                [{ field: 'email', message: 'Invalid email format' }]
            );

            expect(error.message).toBe('Invalid input');
            expect(error.code).toBe(GraphQLErrorCode.BAD_USER_INPUT);
            expect(error.details).toHaveLength(1);
            expect(error.details?.[0].field).toBe('email');
            expect(error.extensions.code).toBe(GraphQLErrorCode.BAD_USER_INPUT);
        });

        it('should create validation error without details', () => {
            const error = new GraphQLValidationError(
                'Generic error',
                GraphQLErrorCode.INTERNAL_SERVER_ERROR
            );

            expect(error.message).toBe('Generic error');
            expect(error.details).toBeUndefined();
        });
    });

    describe('Error Mapping', () => {
        it('should return GraphQL error as-is', () => {
            const originalError = new GraphQLError('Test error');
            const mapped = mapErrorToGraphQLError(originalError);
            
            expect(mapped).toBe(originalError);
        });

        it('should map validation error', () => {
            const error = {
                name: 'ValidationError',
                message: 'Validation failed',
                fields: {
                    email: 'Invalid email',
                    name: 'Name is required'
                }
            };

            const mapped = mapErrorToGraphQLError(error);
            
            expect(mapped).toBeInstanceOf(GraphQLValidationError);
            expect((mapped as GraphQLValidationError).code).toBe(GraphQLErrorCode.BAD_USER_INPUT);
            expect((mapped as GraphQLValidationError).details).toHaveLength(2);
        });

        it('should map permission error', () => {
            const error = {
                name: 'PermissionError',
                message: 'Access denied'
            };

            const mapped = mapErrorToGraphQLError(error);
            
            expect((mapped as GraphQLValidationError).code).toBe(GraphQLErrorCode.FORBIDDEN);
            expect(mapped.message).toBe('Access denied');
        });

        it('should map authentication error', () => {
            const error = {
                code: 'UNAUTHENTICATED',
                message: 'Not authenticated'
            };

            const mapped = mapErrorToGraphQLError(error);
            
            expect((mapped as GraphQLValidationError).code).toBe(GraphQLErrorCode.UNAUTHENTICATED);
        });

        it('should map not found error', () => {
            const error = {
                name: 'NotFoundError',
                message: 'Resource not found'
            };

            const mapped = mapErrorToGraphQLError(error);
            
            expect((mapped as GraphQLValidationError).code).toBe(GraphQLErrorCode.NOT_FOUND);
        });

        it('should map database error', () => {
            const error = {
                name: 'DatabaseError',
                code: 'DB_CONNECTION_FAILED',
                message: 'Database connection failed'
            };

            const mapped = mapErrorToGraphQLError(error);
            
            expect((mapped as GraphQLValidationError).code).toBe(GraphQLErrorCode.INTERNAL_SERVER_ERROR);
        });

        it('should map unknown error to internal server error', () => {
            const error = new Error('Unknown error');

            const mapped = mapErrorToGraphQLError(error);
            
            expect((mapped as GraphQLValidationError).code).toBe(GraphQLErrorCode.INTERNAL_SERVER_ERROR);
            expect(mapped.message).toBe('Unknown error');
        });
    });

    describe('Input Validation', () => {
        it('should validate valid input', () => {
            const schema = z.object({
                name: z.string(),
                age: z.number().int().positive()
            });

            const input = { name: 'John', age: 30 };
            const context = {
                objectName: 'User',
                operationType: 'mutation' as const,
                fieldName: 'createUser'
            };

            const validated = validateGraphQLInput(input, schema, context);
            expect(validated.name).toBe('John');
            expect(validated.age).toBe(30);
        });

        it('should throw GraphQLValidationError for invalid input', () => {
            const schema = z.object({
                email: z.string().email(),
                count: z.number().int().min(0)
            });

            const input = { email: 'invalid-email', count: -1 };
            const context = {
                objectName: 'User',
                operationType: 'mutation' as const,
                fieldName: 'createUser'
            };

            expect(() => validateGraphQLInput(input, schema, context))
                .toThrow(GraphQLValidationError);
        });

        it('should include field details in validation error', () => {
            const schema = z.object({
                name: z.string().min(3),
                age: z.number().int().positive()
            });

            const input = { name: 'ab', age: 0 };
            const context = {
                objectName: 'User',
                operationType: 'mutation' as const,
                fieldName: 'createUser'
            };

            try {
                validateGraphQLInput(input, schema, context);
                fail('Should have thrown');
            } catch (error) {
                expect(error).toBeInstanceOf(GraphQLValidationError);
                const gqlError = error as GraphQLValidationError;
                expect(gqlError.details).toBeDefined();
                expect(gqlError.details!.length).toBeGreaterThan(0);
                expect(gqlError.details!.some(d => d.field === 'name')).toBe(true);
            }
        });
    });

    describe('Schema Validation', () => {
        describe('PaginationInputSchema', () => {
            it('should validate first/after pagination', () => {
                const input = { first: 10, after: 'cursor123' };
                const validated = PaginationInputSchema.parse(input);
                
                expect(validated.first).toBe(10);
                expect(validated.after).toBe('cursor123');
            });

            it('should validate last/before pagination', () => {
                const input = { last: 20, before: 'cursor456' };
                const validated = PaginationInputSchema.parse(input);
                
                expect(validated.last).toBe(20);
                expect(validated.before).toBe('cursor456');
            });

            it('should reject using both first and last', () => {
                const input = { first: 10, last: 20 };
                
                expect(() => PaginationInputSchema.parse(input)).toThrow();
            });

            it('should reject using both after and before', () => {
                const input = { after: 'cursor1', before: 'cursor2' };
                
                expect(() => PaginationInputSchema.parse(input)).toThrow();
            });

            it('should allow empty pagination input', () => {
                const input = {};
                const validated = PaginationInputSchema.parse(input);
                
                expect(validated).toEqual({});
            });
        });

        describe('QueryInputSchema', () => {
            it('should validate query with all fields', () => {
                const input = {
                    filters: { status: 'active', role: 'admin' },
                    sort: { createdAt: 'DESC', name: 'ASC' },
                    limit: 50,
                    offset: 100
                };

                const validated = QueryInputSchema.parse(input);
                expect(validated.filters).toEqual({ status: 'active', role: 'admin' });
                expect(validated.limit).toBe(50);
            });

            it('should reject limit above 1000', () => {
                const input = { limit: 5000 };
                
                expect(() => QueryInputSchema.parse(input)).toThrow();
            });

            it('should reject negative offset', () => {
                const input = { offset: -10 };
                
                expect(() => QueryInputSchema.parse(input)).toThrow();
            });
        });

        describe('SortOrderSchema', () => {
            it('should accept ASC', () => {
                const validated = SortOrderSchema.parse('ASC');
                expect(validated).toBe('ASC');
            });

            it('should accept DESC', () => {
                const validated = SortOrderSchema.parse('DESC');
                expect(validated).toBe('DESC');
            });

            it('should reject invalid sort order', () => {
                expect(() => SortOrderSchema.parse('INVALID')).toThrow();
            });
        });

        describe('CreateInputSchema', () => {
            it('should accept any record', () => {
                const input = { name: 'Test', value: 123, nested: { field: 'value' } };
                const validated = CreateInputSchema.parse(input);
                
                expect(validated).toEqual(input);
            });
        });

        describe('UpdateInputSchema', () => {
            it('should validate update input', () => {
                const input = {
                    id: 'user123',
                    data: { name: 'Updated Name', age: 31 }
                };

                const validated = UpdateInputSchema.parse(input);
                expect(validated.id).toBe('user123');
                expect(validated.data.name).toBe('Updated Name');
            });

            it('should reject update without id', () => {
                const input = { data: { name: 'Test' } };
                
                expect(() => UpdateInputSchema.parse(input)).toThrow();
            });

            it('should reject update with empty id', () => {
                const input = { id: '', data: { name: 'Test' } };
                
                expect(() => UpdateInputSchema.parse(input)).toThrow();
            });
        });

        describe('DeleteInputSchema', () => {
            it('should validate delete input', () => {
                const input = { id: 'user123' };
                const validated = DeleteInputSchema.parse(input);
                
                expect(validated.id).toBe('user123');
            });

            it('should reject delete without id', () => {
                const input = {};
                
                expect(() => DeleteInputSchema.parse(input as any)).toThrow();
            });
        });
    });

    describe('Error Codes', () => {
        it('should have correct error code values', () => {
            expect(GraphQLErrorCode.BAD_USER_INPUT).toBe('BAD_USER_INPUT');
            expect(GraphQLErrorCode.UNAUTHENTICATED).toBe('UNAUTHENTICATED');
            expect(GraphQLErrorCode.FORBIDDEN).toBe('FORBIDDEN');
            expect(GraphQLErrorCode.NOT_FOUND).toBe('NOT_FOUND');
            expect(GraphQLErrorCode.INTERNAL_SERVER_ERROR).toBe('INTERNAL_SERVER_ERROR');
        });
    });
});
