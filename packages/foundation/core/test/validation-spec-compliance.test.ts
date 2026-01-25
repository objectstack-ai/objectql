/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Validation Specification Compliance Tests
 * 
 * Ensures that validation rules work according to the latest specification.
 */

import { Validator } from '../src/validator';
import type {
    ValidationContext,
    CrossFieldValidationRule,
    StateMachineValidationRule,
    FieldConfig,
} from '@objectql/types';

describe('Validation Specification Compliance', () => {
    let validator: Validator;

    beforeEach(() => {
        validator = new Validator();
    });

    describe('Cross-field validation per specification', () => {
        it('should validate date range as per spec example', async () => {
            // From spec lines 219-235
            const rule: CrossFieldValidationRule = {
                name: 'end_after_start',
                type: 'cross_field',
                rule: {
                    field: 'end_date',
                    operator: '>=',
                    compare_to: 'start_date',
                },
                message: 'End date must be on or after start date',
                error_code: 'INVALID_DATE_RANGE',
                severity: 'error',
            };

            const validContext: ValidationContext = {
                operation: 'create',
                record: {
                    start_date: new Date('2026-01-01'),
                    end_date: new Date('2026-12-31'),
                },
            };

            const result = await validator.validate([rule], validContext);
            expect(result.valid).toBe(true);
        });

        it('should reject invalid date range', async () => {
            const rule: CrossFieldValidationRule = {
                name: 'end_after_start',
                type: 'cross_field',
                rule: {
                    field: 'end_date',
                    operator: '>=',
                    compare_to: 'start_date',
                },
                message: 'End date must be on or after start date',
                error_code: 'INVALID_DATE_RANGE',
            };

            const invalidContext: ValidationContext = {
                operation: 'create',
                record: {
                    start_date: new Date('2026-12-31'),
                    end_date: new Date('2026-01-01'),
                },
            };

            const result = await validator.validate([rule], invalidContext);
            expect(result.valid).toBe(false);
            expect(result.errors[0].error_code).toBe('INVALID_DATE_RANGE');
        });

        it('should validate conditional requirements as per spec', async () => {
            // From spec lines 238-258
            const rule: CrossFieldValidationRule = {
                name: 'reason_required_for_rejection',
                type: 'cross_field',
                rule: {
                    if: {
                        field: 'status',
                        operator: '=',
                        value: 'rejected',
                    },
                    then: {
                        field: 'rejection_reason',
                        operator: '!=',
                        value: null,
                    },
                },
                message: 'Rejection reason is required when status is rejected',
                error_code: 'REJECTION_REASON_REQUIRED',
            };

            const validContext: ValidationContext = {
                operation: 'create',
                record: {
                    status: 'rejected',
                    rejection_reason: 'Does not meet requirements',
                },
            };

            const result = await validator.validate([rule], validContext);
            expect(result.valid).toBe(true);
        });
    });

    describe('State machine validation per specification', () => {
        it('should validate state transitions as per spec example', async () => {
            // From spec lines 446-497
            const rule: StateMachineValidationRule = {
                name: 'order_status_flow',
                type: 'state_machine',
                field: 'status',
                message: 'Invalid status transition',
                transitions: {
                    draft: {
                        allowed_next: ['submitted', 'cancelled'],
                    },
                    submitted: {
                        allowed_next: ['approved', 'rejected'],
                    },
                    approved: {
                        allowed_next: ['processing', 'cancelled'],
                    },
                },
            };

            const validContext: ValidationContext = {
                operation: 'update',
                record: { status: 'submitted' },
                previousRecord: { status: 'draft' },
            };

            const result = await validator.validate([rule], validContext);
            expect(result.valid).toBe(true);
        });

        it('should reject invalid state transitions', async () => {
            const rule: StateMachineValidationRule = {
                name: 'order_status_flow',
                type: 'state_machine',
                field: 'status',
                message: 'Invalid status transition from {{old_status}} to {{new_status}}',
                transitions: {
                    draft: {
                        allowed_next: ['submitted', 'cancelled'],
                    },
                    submitted: {
                        allowed_next: ['approved', 'rejected'],
                    },
                },
            };

            const invalidContext: ValidationContext = {
                operation: 'update',
                record: { status: 'approved' },
                previousRecord: { status: 'draft' },
            };

            const result = await validator.validate([rule], invalidContext);
            expect(result.valid).toBe(false);
            expect(result.errors[0].message).toContain('draft');
            expect(result.errors[0].message).toContain('approved');
        });

        it('should handle terminal states correctly', async () => {
            const rule: StateMachineValidationRule = {
                name: 'status_transition',
                type: 'state_machine',
                field: 'status',
                message: 'Invalid status transition',
                transitions: {
                    completed: {
                        allowed_next: [],
                        is_terminal: true,
                    },
                },
            };

            const invalidContext: ValidationContext = {
                operation: 'update',
                record: { status: 'active' },
                previousRecord: { status: 'completed' },
            };

            const result = await validator.validate([rule], invalidContext);
            expect(result.valid).toBe(false);
        });
    });

    describe('Field-level validation per specification', () => {
        it('should validate email format as per spec', async () => {
            // From spec lines 152-159
            const fieldConfig: FieldConfig = {
                type: 'email',
                required: true,
                validation: {
                    format: 'email',
                    message: 'Please enter a valid email address',
                },
            };

            const context: ValidationContext = {
                operation: 'create',
                record: { email: 'test@example.com' },
            };

            const results = await validator.validateField('email', fieldConfig, 'test@example.com', context);
            expect(results.length).toBe(0);
        });

        it('should reject invalid email format', async () => {
            const fieldConfig: FieldConfig = {
                type: 'email',
                required: true,
                validation: {
                    format: 'email',
                    message: 'Please enter a valid email address',
                },
            };

            const context: ValidationContext = {
                operation: 'create',
                record: { email: 'invalid-email' },
            };

            const results = await validator.validateField('email', fieldConfig, 'invalid-email', context);
            expect(results.length).toBeGreaterThan(0);
            expect(results[0].valid).toBe(false);
        });

        it('should validate URL format with protocol restrictions', async () => {
            // From spec lines 190-199
            const fieldConfig: FieldConfig = {
                type: 'url',
                validation: {
                    format: 'url',
                    protocols: ['http', 'https'],
                    message: 'Please enter a valid URL',
                },
            };

            const context: ValidationContext = {
                operation: 'create',
                record: { website: 'https://example.com' },
            };

            const results = await validator.validateField('website', fieldConfig, 'https://example.com', context);
            expect(results.length).toBe(0);
        });

        it('should reject URL with invalid protocol', async () => {
            const fieldConfig: FieldConfig = {
                type: 'url',
                validation: {
                    format: 'url',
                    protocols: ['http', 'https'],
                    message: 'Please enter a valid URL',
                },
            };

            const context: ValidationContext = {
                operation: 'create',
                record: { website: 'ftp://example.com' },
            };

            const results = await validator.validateField('website', fieldConfig, 'ftp://example.com', context);
            expect(results.length).toBeGreaterThan(0);
            expect(results[0].valid).toBe(false);
        });

        it('should validate min/max range as per spec', async () => {
            // From spec lines 160-170
            const fieldConfig: FieldConfig = {
                type: 'number',
                validation: {
                    min: 0,
                    max: 150,
                    message: 'Age must be between 0 and 150',
                },
            };

            const context: ValidationContext = {
                operation: 'create',
                record: { age: 25 },
            };

            const results = await validator.validateField('age', fieldConfig, 25, context);
            expect(results.length).toBe(0);
        });

        it('should validate string length constraints', async () => {
            // From spec lines 172-185
            const fieldConfig: FieldConfig = {
                type: 'text',
                required: true,
                validation: {
                    min_length: 3,
                    max_length: 20,
                    message: 'Username must be 3-20 characters',
                },
            };

            const context: ValidationContext = {
                operation: 'create',
                record: { username: 'john_doe' },
            };

            const results = await validator.validateField('username', fieldConfig, 'john_doe', context);
            expect(results.length).toBe(0);
        });

        it('should validate pattern matching', async () => {
            const fieldConfig: FieldConfig = {
                type: 'text',
                validation: {
                    pattern: '^[a-zA-Z0-9_]+$',
                    message: 'Username must be alphanumeric',
                },
            };

            const validContext: ValidationContext = {
                operation: 'create',
                record: { username: 'john_doe_123' },
            };

            const results = await validator.validateField('username', fieldConfig, 'john_doe_123', validContext);
            expect(results.length).toBe(0);
        });

        it('should reject invalid pattern', async () => {
            const fieldConfig: FieldConfig = {
                type: 'text',
                validation: {
                    pattern: '^[a-zA-Z0-9_]+$',
                    message: 'Username must be alphanumeric',
                },
            };

            const invalidContext: ValidationContext = {
                operation: 'create',
                record: { username: 'john@doe!' },
            };

            const results = await validator.validateField('username', fieldConfig, 'john@doe!', invalidContext);
            expect(results.length).toBeGreaterThan(0);
            expect(results[0].valid).toBe(false);
        });
    });

    describe('Validation triggers and conditions', () => {
        it('should apply rule only on specified operations', async () => {
            const rule: CrossFieldValidationRule = {
                name: 'budget_check',
                type: 'cross_field',
                trigger: ['create', 'update'],
                rule: {
                    field: 'budget',
                    operator: '>=',
                    value: 0,
                },
                message: 'Budget must be positive',
            };

            const deleteContext: ValidationContext = {
                operation: 'delete',
                record: { budget: -100 },
            };

            // Rule should be skipped on delete operation
            const result = await validator.validate([rule], deleteContext);
            expect(result.valid).toBe(true);
        });

        it('should apply conditional validation', async () => {
            const rule: CrossFieldValidationRule = {
                name: 'high_value_approval',
                type: 'cross_field',
                apply_when: {
                    field: 'total_amount',
                    operator: '>',
                    value: 10000,
                },
                rule: {
                    field: 'manager_approval_id',
                    operator: '!=',
                    value: null,
                },
                message: 'Manager approval required for orders over $10,000',
            };

            // Rule should not apply for low-value orders
            const lowValueContext: ValidationContext = {
                operation: 'create',
                record: {
                    total_amount: 5000,
                    manager_approval_id: null,
                },
            };

            const result = await validator.validate([rule], lowValueContext);
            expect(result.valid).toBe(true);
        });
    });

    describe('Message formatting with templates', () => {
        it('should format messages with template variables', async () => {
            const rule: CrossFieldValidationRule = {
                name: 'budget_limit',
                type: 'cross_field',
                rule: {
                    field: 'budget',
                    operator: '<=',
                    value: 100000,
                },
                message: 'Budget {{budget}} exceeds limit',
            };

            const context: ValidationContext = {
                operation: 'create',
                record: { budget: 150000 },
            };

            const result = await validator.validate([rule], context);
            expect(result.valid).toBe(false);
            expect(result.errors[0].message).toContain('150000');
        });
    });
});
