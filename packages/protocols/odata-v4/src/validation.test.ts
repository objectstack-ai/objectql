/**
 * OData V4 Protocol Validation Tests
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { describe, it, expect } from 'vitest';
import {
    ODataValidationError,
    ODataErrorCode,
    validateQueryOptions,
    validateBatchRequest,
    createODataError,
    mapErrorToODataError,
    QueryOptionsSchema,
    TopParamSchema,
    SkipParamSchema,
    SelectParamSchema,
    ExpandParamSchema,
    FilterParamSchema,
    OrderByParamSchema,
    BatchRequestSchema
} from './validation';

describe('OData V4 Protocol Validation', () => {
    describe('ODataValidationError', () => {
        it('should create validation error with all fields', () => {
            const error = new ODataValidationError(
                ODataErrorCode.INVALID_QUERY,
                'Invalid query syntax',
                '$filter',
                [{ code: 'invalid_syntax', message: 'Unexpected token', target: '$filter' }]
            );

            expect(error.code).toBe(ODataErrorCode.INVALID_QUERY);
            expect(error.message).toBe('Invalid query syntax');
            expect(error.target).toBe('$filter');
            expect(error.details).toHaveLength(1);
        });

        it('should create validation error without optional fields', () => {
            const error = new ODataValidationError(
                ODataErrorCode.BAD_REQUEST,
                'Bad request'
            );

            expect(error.code).toBe(ODataErrorCode.BAD_REQUEST);
            expect(error.target).toBeUndefined();
            expect(error.details).toBeUndefined();
        });
    });

    describe('Query Parameter Validation', () => {
        describe('$top', () => {
            it('should validate valid $top', () => {
                const value = TopParamSchema.parse(50);
                expect(value).toBe(50);
            });

            it('should reject $top above 1000', () => {
                expect(() => TopParamSchema.parse(5000)).toThrow();
            });

            it('should reject negative $top', () => {
                expect(() => TopParamSchema.parse(-10)).toThrow();
            });

            it('should reject zero $top', () => {
                expect(() => TopParamSchema.parse(0)).toThrow();
            });
        });

        describe('$skip', () => {
            it('should validate valid $skip', () => {
                const value = SkipParamSchema.parse(100);
                expect(value).toBe(100);
            });

            it('should allow zero $skip', () => {
                const value = SkipParamSchema.parse(0);
                expect(value).toBe(0);
            });

            it('should reject negative $skip', () => {
                expect(() => SkipParamSchema.parse(-5)).toThrow();
            });
        });

        describe('$select', () => {
            it('should validate single field select', () => {
                const value = SelectParamSchema.parse('name');
                expect(value).toBe('name');
            });

            it('should validate multiple fields select', () => {
                const value = SelectParamSchema.parse(['name', 'email', 'age']);
                expect(value).toEqual(['name', 'email', 'age']);
            });

            it('should reject empty string', () => {
                expect(() => SelectParamSchema.parse('')).toThrow();
            });
        });

        describe('$expand', () => {
            it('should validate single expand', () => {
                const value = ExpandParamSchema.parse('Orders');
                expect(value).toBe('Orders');
            });

            it('should validate multiple expands', () => {
                const value = ExpandParamSchema.parse(['Orders', 'Address']);
                expect(value).toEqual(['Orders', 'Address']);
            });
        });

        describe('$filter', () => {
            it('should validate filter expression', () => {
                const value = FilterParamSchema.parse('Age gt 18');
                expect(value).toBe('Age gt 18');
            });

            it('should reject empty filter', () => {
                expect(() => FilterParamSchema.parse('')).toThrow();
            });
        });

        describe('$orderby', () => {
            it('should validate orderby expression', () => {
                const value = OrderByParamSchema.parse('Name asc,Age desc');
                expect(value).toBe('Name asc,Age desc');
            });
        });
    });

    describe('Query Options Validation', () => {
        it('should validate query options with all parameters', () => {
            const options = {
                $top: 10,
                $skip: 20,
                $count: true,
                $orderby: 'Name asc',
                $filter: 'Age gt 18',
                $select: 'Name,Email',
                $expand: 'Orders',
                $search: 'john'
            };

            const validated = validateQueryOptions(options);
            expect(validated.$top).toBe(10);
            expect(validated.$skip).toBe(20);
            expect(validated.$count).toBe(true);
        });

        it('should validate query options with subset of parameters', () => {
            const options = {
                $top: 50,
                $filter: 'Status eq Active'
            };

            const validated = validateQueryOptions(options);
            expect(validated.$top).toBe(50);
            expect(validated.$filter).toBe('Status eq Active');
        });

        it('should reject invalid parameters', () => {
            const options = {
                $top: 2000, // Too large
                $skip: -5   // Negative
            };

            expect(() => validateQueryOptions(options)).toThrow(ODataValidationError);
        });

        it('should reject unknown query parameters', () => {
            const options = {
                $top: 10,
                $unknown: 'value'
            };

            expect(() => validateQueryOptions(options as any)).toThrow();
        });

        it('should allow empty query options', () => {
            const validated = validateQueryOptions({});
            expect(validated).toEqual({});
        });
    });

    describe('Batch Request Validation', () => {
        it('should validate batch with changesets', () => {
            const batch = {
                changeSets: [
                    {
                        requests: [
                            { method: 'POST', url: '/Users', body: { name: 'John' } },
                            { method: 'PATCH', url: '/Users(1)', body: { name: 'Jane' } }
                        ]
                    }
                ]
            };

            const validated = validateBatchRequest(batch);
            expect(validated.changeSets).toHaveLength(1);
            expect(validated.changeSets![0].requests).toHaveLength(2);
        });

        it('should validate batch with queries', () => {
            const batch = {
                queries: [
                    { method: 'GET', url: '/Users' },
                    { method: 'GET', url: '/Orders' }
                ]
            };

            const validated = validateBatchRequest(batch);
            expect(validated.queries).toHaveLength(2);
        });

        it('should validate batch with both changesets and queries', () => {
            const batch = {
                changeSets: [
                    { requests: [{ method: 'POST', url: '/Users', body: {} }] }
                ],
                queries: [
                    { method: 'GET', url: '/Users' }
                ]
            };

            const validated = validateBatchRequest(batch);
            expect(validated.changeSets).toHaveLength(1);
            expect(validated.queries).toHaveLength(1);
        });

        it('should reject empty batch', () => {
            const batch = {};
            
            expect(() => validateBatchRequest(batch)).toThrow(ODataValidationError);
        });

        it('should reject batch with invalid HTTP method', () => {
            const batch = {
                queries: [
                    { method: 'POST', url: '/Users' } // POST not allowed for queries
                ]
            };

            expect(() => validateBatchRequest(batch as any)).toThrow();
        });

        it('should reject changeset with empty requests', () => {
            const batch = {
                changeSets: [
                    { requests: [] } // Empty requests array
                ]
            };

            expect(() => validateBatchRequest(batch)).toThrow();
        });
    });

    describe('Error Creation', () => {
        it('should create OData error with all fields', () => {
            const error = createODataError(
                ODataErrorCode.NOT_FOUND,
                'Resource not found',
                'Users(123)',
                [{ code: 'not_found', message: 'User not found', target: 'Users' }],
                { message: 'Database query returned no results', type: 'DatabaseError' }
            );

            expect(error.error.code).toBe(ODataErrorCode.NOT_FOUND);
            expect(error.error.message).toBe('Resource not found');
            expect(error.error.target).toBe('Users(123)');
            expect(error.error.details).toHaveLength(1);
            expect(error.error.innererror).toBeDefined();
        });

        it('should create OData error with minimal fields', () => {
            const error = createODataError(
                ODataErrorCode.BAD_REQUEST,
                'Bad request'
            );

            expect(error.error.code).toBe(ODataErrorCode.BAD_REQUEST);
            expect(error.error.message).toBe('Bad request');
            expect(error.error.target).toBeUndefined();
            expect(error.error.details).toBeUndefined();
        });
    });

    describe('Error Mapping', () => {
        it('should map ODataValidationError', () => {
            const error = new ODataValidationError(
                ODataErrorCode.INVALID_FILTER,
                'Invalid filter expression',
                '$filter'
            );

            const mapped = mapErrorToODataError(error);
            expect(mapped.error.code).toBe(ODataErrorCode.INVALID_FILTER);
            expect(mapped.error.target).toBe('$filter');
        });

        it('should map validation error', () => {
            const error = {
                name: 'ValidationError',
                message: 'Validation failed'
            };

            const mapped = mapErrorToODataError(error);
            expect(mapped.error.code).toBe(ODataErrorCode.BAD_REQUEST);
        });

        it('should map permission error', () => {
            const error = {
                name: 'PermissionError',
                message: 'Access denied'
            };

            const mapped = mapErrorToODataError(error);
            expect(mapped.error.code).toBe(ODataErrorCode.FORBIDDEN);
        });

        it('should map authentication error', () => {
            const error = {
                code: 'UNAUTHORIZED',
                message: 'Not authenticated'
            };

            const mapped = mapErrorToODataError(error);
            expect(mapped.error.code).toBe(ODataErrorCode.UNAUTHORIZED);
        });

        it('should map not found error', () => {
            const error = {
                name: 'NotFoundError',
                message: 'Resource not found'
            };

            const mapped = mapErrorToODataError(error);
            expect(mapped.error.code).toBe(ODataErrorCode.NOT_FOUND);
        });

        it('should map database error', () => {
            const error = {
                name: 'DatabaseError',
                code: 'DB_ERROR'
            };

            const mapped = mapErrorToODataError(error);
            expect(mapped.error.code).toBe(ODataErrorCode.INTERNAL_SERVER_ERROR);
        });

        it('should map unknown error to internal server error', () => {
            const error = new Error('Unknown error');

            const mapped = mapErrorToODataError(error);
            expect(mapped.error.code).toBe(ODataErrorCode.INTERNAL_SERVER_ERROR);
        });
    });

    describe('Error Codes', () => {
        it('should have correct error code values', () => {
            expect(ODataErrorCode.BAD_REQUEST).toBe('BadRequest');
            expect(ODataErrorCode.UNAUTHORIZED).toBe('Unauthorized');
            expect(ODataErrorCode.FORBIDDEN).toBe('Forbidden');
            expect(ODataErrorCode.NOT_FOUND).toBe('NotFound');
            expect(ODataErrorCode.INTERNAL_SERVER_ERROR).toBe('InternalServerError');
        });
    });
});
