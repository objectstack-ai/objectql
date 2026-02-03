/**
 * ObjectQL REST Protocol Validation Tests
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
    validateRequest,
    validateResponse,
    ValidationError,
    ObjectQLRequestSchema,
    FindArgsSchema,
    FindOneArgsSchema,
    CreateArgsSchema,
    UpdateArgsSchema,
    DeleteArgsSchema,
    CountArgsSchema,
    ActionArgsSchema,
    CreateManyArgsSchema,
    UpdateManyArgsSchema,
    DeleteManyArgsSchema,
    ObjectQLResponseSchema,
    PaginationMetaSchema,
    ErrorSchema
} from '../src/validation';
import { ErrorCode } from '../src/types';

describe('REST Protocol Validation', () => {
    describe('Request Validation', () => {
        describe('Basic Request Structure', () => {
            it('should validate a minimal valid request', () => {
                const request = {
                    op: 'find',
                    object: 'users',
                    args: {}
                };
                
                const validated = validateRequest(request);
                expect(validated.op).toBe('find');
                expect(validated.object).toBe('users');
            });

            it('should validate request with user context', () => {
                const request = {
                    user: {
                        id: 'user123',
                        roles: ['admin', 'user']
                    },
                    op: 'create',
                    object: 'posts',
                    args: { title: 'Test Post' }
                };
                
                const validated = validateRequest(request);
                expect(validated.user?.id).toBe('user123');
                expect(validated.user?.roles).toEqual(['admin', 'user']);
            });

            it('should validate request with AI context', () => {
                const request = {
                    op: 'find',
                    object: 'users',
                    args: {},
                    ai_context: {
                        intent: 'list all active users',
                        natural_language: 'Show me all users',
                        use_case: 'admin dashboard'
                    }
                };
                
                const validated = validateRequest(request);
                expect(validated.ai_context?.intent).toBe('list all active users');
            });

            it('should reject request with empty object name', () => {
                const request = {
                    op: 'find',
                    object: '',
                    args: {}
                };
                
                expect(() => validateRequest(request)).toThrow(ValidationError);
            });

            it('should reject request with invalid operation', () => {
                const request = {
                    op: 'invalid_op',
                    object: 'users',
                    args: {}
                };
                
                expect(() => validateRequest(request)).toThrow(ValidationError);
            });

            it('should reject request with missing required fields', () => {
                const request = {
                    op: 'find'
                    // missing object
                };
                
                expect(() => validateRequest(request as any)).toThrow(ValidationError);
            });
        });

        describe('Find Operation Validation', () => {
            it('should validate find with filters', () => {
                const request = {
                    op: 'find',
                    object: 'users',
                    args: {
                        filters: { active: true, role: 'admin' },
                        limit: 10,
                        skip: 0
                    }
                };
                
                const validated = validateRequest(request);
                expect(validated.args.filters).toEqual({ active: true, role: 'admin' });
                expect(validated.args.limit).toBe(10);
            });

            it('should validate find with field selection', () => {
                const request = {
                    op: 'find',
                    object: 'users',
                    args: {
                        fields: ['id', 'name', 'email'],
                        limit: 20
                    }
                };
                
                const validated = validateRequest(request);
                expect(validated.args.fields).toEqual(['id', 'name', 'email']);
            });

            it('should validate find with sorting', () => {
                const request = {
                    op: 'find',
                    object: 'users',
                    args: {
                        sort: { created_at: -1, name: 'asc' }
                    }
                };
                
                const validated = validateRequest(request);
                expect(validated.args.sort).toEqual({ created_at: -1, name: 'asc' });
            });

            it('should validate find with expand', () => {
                const request = {
                    op: 'find',
                    object: 'posts',
                    args: {
                        expand: ['author', 'comments']
                    }
                };
                
                const validated = validateRequest(request);
                expect(validated.args.expand).toEqual(['author', 'comments']);
            });

            it('should reject find with negative limit', () => {
                const request = {
                    op: 'find',
                    object: 'users',
                    args: {
                        limit: -10
                    }
                };
                
                expect(() => validateRequest(request)).toThrow(ValidationError);
            });

            it('should reject find with negative skip', () => {
                const request = {
                    op: 'find',
                    object: 'users',
                    args: {
                        skip: -5
                    }
                };
                
                expect(() => validateRequest(request)).toThrow(ValidationError);
            });
        });

        describe('FindOne Operation Validation', () => {
            it('should validate findOne with string ID', () => {
                const request = {
                    op: 'findOne',
                    object: 'users',
                    args: 'user123'
                };
                
                const validated = validateRequest(request);
                expect(validated.args).toBe('user123');
            });

            it('should validate findOne with object args', () => {
                const request = {
                    op: 'findOne',
                    object: 'users',
                    args: {
                        id: 'user123',
                        fields: ['id', 'name'],
                        expand: 'profile'
                    }
                };
                
                const validated = validateRequest(request);
                expect(validated.args.id).toBe('user123');
                expect(validated.args.fields).toEqual(['id', 'name']);
            });

            it('should validate findOne with filters', () => {
                const request = {
                    op: 'findOne',
                    object: 'users',
                    args: {
                        filters: { email: 'test@example.com' }
                    }
                };
                
                const validated = validateRequest(request);
                expect(validated.args.filters).toEqual({ email: 'test@example.com' });
            });
        });

        describe('Create Operation Validation', () => {
            it('should validate create with valid data', () => {
                const request = {
                    op: 'create',
                    object: 'users',
                    args: {
                        name: 'John Doe',
                        email: 'john@example.com',
                        role: 'user'
                    }
                };
                
                const validated = validateRequest(request);
                expect(validated.args.name).toBe('John Doe');
                expect(validated.args.email).toBe('john@example.com');
            });
        });

        describe('Update Operation Validation', () => {
            it('should validate update with valid data', () => {
                const request = {
                    op: 'update',
                    object: 'users',
                    args: {
                        id: 'user123',
                        data: {
                            name: 'Jane Doe',
                            email: 'jane@example.com'
                        }
                    }
                };
                
                const validated = validateRequest(request);
                expect(validated.args.id).toBe('user123');
                expect(validated.args.data.name).toBe('Jane Doe');
            });

            it('should reject update without id', () => {
                const request = {
                    op: 'update',
                    object: 'users',
                    args: {
                        data: { name: 'Jane Doe' }
                    }
                };
                
                expect(() => validateRequest(request)).toThrow(ValidationError);
            });

            it('should reject update with empty id', () => {
                const request = {
                    op: 'update',
                    object: 'users',
                    args: {
                        id: '',
                        data: { name: 'Jane Doe' }
                    }
                };
                
                expect(() => validateRequest(request)).toThrow(ValidationError);
            });
        });

        describe('Delete Operation Validation', () => {
            it('should validate delete with valid id', () => {
                const request = {
                    op: 'delete',
                    object: 'users',
                    args: {
                        id: 'user123'
                    }
                };
                
                const validated = validateRequest(request);
                expect(validated.args.id).toBe('user123');
            });

            it('should reject delete without id', () => {
                const request = {
                    op: 'delete',
                    object: 'users',
                    args: {}
                };
                
                expect(() => validateRequest(request)).toThrow(ValidationError);
            });
        });

        describe('Count Operation Validation', () => {
            it('should validate count with filters', () => {
                const request = {
                    op: 'count',
                    object: 'users',
                    args: {
                        filters: { active: true }
                    }
                };
                
                const validated = validateRequest(request);
                expect(validated.args.filters).toEqual({ active: true });
            });

            it('should validate count without filters', () => {
                const request = {
                    op: 'count',
                    object: 'users',
                    args: {}
                };
                
                const validated = validateRequest(request);
                expect(validated.args).toEqual({});
            });
        });

        describe('Action Operation Validation', () => {
            it('should validate action with all parameters', () => {
                const request = {
                    op: 'action',
                    object: 'orders',
                    args: {
                        action: 'approve',
                        id: 'order123',
                        input: { comment: 'Approved by admin' }
                    }
                };
                
                const validated = validateRequest(request);
                expect(validated.args.action).toBe('approve');
                expect(validated.args.id).toBe('order123');
                expect(validated.args.input).toEqual({ comment: 'Approved by admin' });
            });

            it('should reject action without action name', () => {
                const request = {
                    op: 'action',
                    object: 'orders',
                    args: {
                        id: 'order123'
                    }
                };
                
                expect(() => validateRequest(request)).toThrow(ValidationError);
            });
        });

        describe('CreateMany Operation Validation', () => {
            it('should validate createMany with array of records', () => {
                const request = {
                    op: 'createMany',
                    object: 'users',
                    args: [
                        { name: 'User 1', email: 'user1@example.com' },
                        { name: 'User 2', email: 'user2@example.com' }
                    ]
                };
                
                const validated = validateRequest(request);
                expect(Array.isArray(validated.args)).toBe(true);
                expect(validated.args.length).toBe(2);
            });

            it('should reject createMany with non-array args', () => {
                const request = {
                    op: 'createMany',
                    object: 'users',
                    args: { name: 'User 1' }
                };
                
                expect(() => validateRequest(request)).toThrow(ValidationError);
            });
        });

        describe('UpdateMany Operation Validation', () => {
            it('should validate updateMany with filters and data', () => {
                const request = {
                    op: 'updateMany',
                    object: 'users',
                    args: {
                        filters: { role: 'user' },
                        data: { active: true }
                    }
                };
                
                const validated = validateRequest(request);
                expect(validated.args.filters).toEqual({ role: 'user' });
                expect(validated.args.data).toEqual({ active: true });
            });

            it('should reject updateMany without data', () => {
                const request = {
                    op: 'updateMany',
                    object: 'users',
                    args: {
                        filters: { role: 'user' }
                    }
                };
                
                expect(() => validateRequest(request)).toThrow(ValidationError);
            });
        });

        describe('DeleteMany Operation Validation', () => {
            it('should validate deleteMany with filters', () => {
                const request = {
                    op: 'deleteMany',
                    object: 'users',
                    args: {
                        filters: { active: false }
                    }
                };
                
                const validated = validateRequest(request);
                expect(validated.args.filters).toEqual({ active: false });
            });

            it('should validate deleteMany without filters', () => {
                const request = {
                    op: 'deleteMany',
                    object: 'users',
                    args: {}
                };
                
                const validated = validateRequest(request);
                expect(validated.args).toEqual({});
            });
        });
    });

    describe('Response Validation', () => {
        it('should validate response with items', () => {
            const response = {
                items: [
                    { id: '1', name: 'User 1' },
                    { id: '2', name: 'User 2' }
                ]
            };
            
            const validated = validateResponse(response);
            expect(validated.items?.length).toBe(2);
        });

        it('should validate response with pagination metadata', () => {
            const response = {
                items: [{ id: '1', name: 'User 1' }],
                meta: {
                    total: 100,
                    page: 1,
                    size: 10,
                    pages: 10,
                    has_next: true
                }
            };
            
            const validated = validateResponse(response);
            expect(validated.meta?.total).toBe(100);
            expect(validated.meta?.has_next).toBe(true);
        });

        it('should validate response with error', () => {
            const response = {
                error: {
                    code: ErrorCode.VALIDATION_ERROR,
                    message: 'Invalid input',
                    details: {
                        fields: {
                            email: 'Invalid email format'
                        }
                    }
                }
            };
            
            const validated = validateResponse(response);
            expect(validated.error?.code).toBe(ErrorCode.VALIDATION_ERROR);
            expect(validated.error?.details?.fields?.email).toBe('Invalid email format');
        });

        it('should validate response with single data item', () => {
            const response = {
                data: {
                    id: 'user123',
                    name: 'John Doe',
                    '@type': 'users'
                }
            };
            
            const validated = validateResponse(response);
            expect(validated.data?.id).toBe('user123');
        });

        it('should handle invalid response gracefully (log but not throw)', () => {
            const response = {
                meta: {
                    total: -1 // Invalid: should be non-negative
                }
            };
            
            // Should not throw, just log
            const validated = validateResponse(response);
            expect(validated).toBeDefined();
        });
    });

    describe('Schema Validation', () => {
        describe('PaginationMetaSchema', () => {
            it('should validate valid pagination metadata', () => {
                const meta = {
                    total: 100,
                    page: 1,
                    size: 10,
                    pages: 10,
                    has_next: true
                };
                
                const validated = PaginationMetaSchema.parse(meta);
                expect(validated.total).toBe(100);
            });

            it('should reject negative total', () => {
                const meta = {
                    total: -1
                };
                
                expect(() => PaginationMetaSchema.parse(meta)).toThrow();
            });
        });

        describe('ErrorSchema', () => {
            it('should validate error with all fields', () => {
                const error = {
                    code: ErrorCode.NOT_FOUND,
                    message: 'Resource not found',
                    details: {
                        resource: 'users',
                        id: 'user123'
                    }
                };
                
                const validated = ErrorSchema.parse(error);
                expect(validated.code).toBe(ErrorCode.NOT_FOUND);
            });
        });
    });

    describe('ValidationError', () => {
        it('should create ValidationError with message and details', () => {
            const error = new ValidationError('Test error', { field: 'email' });
            
            expect(error.message).toBe('Test error');
            expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
            expect(error.details).toEqual({ field: 'email' });
            expect(error.name).toBe('ValidationError');
        });

        it('should create ValidationError without details', () => {
            const error = new ValidationError('Test error');
            
            expect(error.message).toBe('Test error');
            expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
        });
    });
});
