/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Validator } from '@objectql/core';
import {
    ValidationContext,
    AnyValidationRule,
    CrossFieldValidationRule,
    StateMachineValidationRule,
    FieldConfig,
} from '@objectql/types';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

describe('Validation System', () => {
    let validator: Validator;

    beforeEach(() => {
        validator = new Validator();
    });

    describe('Field-level validation', () => {
        it('should validate required fields', async () => {
            const fieldConfig: FieldConfig = {
                type: 'text',
                label: 'Name',
                required: true,
            };

            const context: ValidationContext = {
                record: { name: '' },
                operation: 'create',
            };

            const results = await validator.validateField('name', fieldConfig, '', context);
            
            expect(results).toHaveLength(1);
            expect(results[0].valid).toBe(false);
            expect(results[0].message).toContain('required');
        });

        it('should validate email format', async () => {
            const fieldConfig: FieldConfig = {
                type: 'email',
                validation: {
                    format: 'email',
                    message: 'Invalid email',
                },
            };

            const context: ValidationContext = {
                record: { email: 'invalid-email' },
                operation: 'create',
            };

            const results = await validator.validateField('email', fieldConfig, 'invalid-email', context);
            
            expect(results).toHaveLength(1);
            expect(results[0].valid).toBe(false);
            expect(results[0].message).toBe('Invalid email');
        });

        it('should validate valid email format', async () => {
            const fieldConfig: FieldConfig = {
                type: 'email',
                validation: {
                    format: 'email',
                },
            };

            const context: ValidationContext = {
                record: { email: 'test@example.com' },
                operation: 'create',
            };

            const results = await validator.validateField('email', fieldConfig, 'test@example.com', context);
            
            expect(results).toHaveLength(0);
        });

        it('should validate URL format', async () => {
            const fieldConfig: FieldConfig = {
                type: 'url',
                validation: {
                    format: 'url',
                    protocols: ['http', 'https'],
                },
            };

            const context: ValidationContext = {
                record: { website: 'not-a-url' },
                operation: 'create',
            };

            const results = await validator.validateField('website', fieldConfig, 'not-a-url', context);
            
            expect(results.length).toBeGreaterThan(0);
            expect(results[0].valid).toBe(false);
        });

        it('should validate min/max values', async () => {
            const fieldConfig: FieldConfig = {
                type: 'number',
                validation: {
                    min: 0,
                    max: 100,
                },
            };

            const context: ValidationContext = {
                record: { age: 150 },
                operation: 'create',
            };

            const results = await validator.validateField('age', fieldConfig, 150, context);
            
            expect(results).toHaveLength(1);
            expect(results[0].valid).toBe(false);
            expect(results[0].message).toContain('100');
        });

        it('should validate string length', async () => {
            const fieldConfig: FieldConfig = {
                type: 'text',
                validation: {
                    min_length: 3,
                    max_length: 10,
                },
            };

            const context: ValidationContext = {
                record: { username: 'ab' },
                operation: 'create',
            };

            const results = await validator.validateField('username', fieldConfig, 'ab', context);
            
            expect(results).toHaveLength(1);
            expect(results[0].valid).toBe(false);
            expect(results[0].message).toContain('3');
        });

        it('should validate regex pattern', async () => {
            const fieldConfig: FieldConfig = {
                type: 'text',
                validation: {
                    pattern: '^[a-zA-Z0-9_]+$',
                    message: 'Username must be alphanumeric',
                },
            };

            const context: ValidationContext = {
                record: { username: 'user@123' },
                operation: 'create',
            };

            const results = await validator.validateField('username', fieldConfig, 'user@123', context);
            
            expect(results).toHaveLength(1);
            expect(results[0].valid).toBe(false);
            expect(results[0].message).toBe('Username must be alphanumeric');
        });

        it('should handle invalid regex pattern gracefully', async () => {
            const fieldConfig: FieldConfig = {
                type: 'text',
                validation: {
                    pattern: '[invalid(regex',  // Invalid regex
                    message: 'Should not see this',
                },
            };

            const context: ValidationContext = {
                record: { username: 'test' },
                operation: 'create',
            };

            const results = await validator.validateField('username', fieldConfig, 'test', context);
            
            expect(results).toHaveLength(1);
            expect(results[0].valid).toBe(false);
            expect(results[0].message).toContain('Invalid regex pattern');
        });
    });

    describe('Cross-field validation', () => {
        it('should validate date range with compare_to', async () => {
            const rule: CrossFieldValidationRule = {
                name: 'valid_date_range',
                type: 'cross_field',
                rule: {
                    field: 'end_date',
                    operator: '>=',
                    compare_to: 'start_date',
                },
                message: 'End date must be on or after start date',
                error_code: 'INVALID_DATE_RANGE',
            };

            const context: ValidationContext = {
                record: {
                    start_date: '2024-01-01',
                    end_date: '2023-12-31', // Before start date
                },
                operation: 'create',
            };

            const result = await validator.validate([rule], context);
            
            expect(result.valid).toBe(false);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0].error_code).toBe('INVALID_DATE_RANGE');
        });

        it('should pass valid date range with compare_to', async () => {
            const rule: CrossFieldValidationRule = {
                name: 'valid_date_range',
                type: 'cross_field',
                rule: {
                    field: 'end_date',
                    operator: '>=',
                    compare_to: 'start_date',
                },
                message: 'End date must be on or after start date',
            };

            const context: ValidationContext = {
                record: {
                    start_date: '2024-01-01',
                    end_date: '2024-02-01', // After start date
                },
                operation: 'create',
            };

            const result = await validator.validate([rule], context);
            
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });
        
        it('should validate with fixed value comparison', async () => {
            const rule: CrossFieldValidationRule = {
                name: 'min_value_check',
                type: 'cross_field',
                rule: {
                    field: 'budget',
                    operator: '>=',
                    value: 1000,
                },
                message: 'Budget must be at least 1000',
            };

            const context: ValidationContext = {
                record: {
                    budget: 500,
                },
                operation: 'create',
            };

            const result = await validator.validate([rule], context);
            
            expect(result.valid).toBe(false);
            expect(result.errors).toHaveLength(1);
        });
    });

    describe('State machine validation', () => {
        it('should validate allowed state transitions', async () => {
            const rule: StateMachineValidationRule = {
                name: 'status_transition',
                type: 'state_machine',
                field: 'status',
                transitions: {
                    planning: {
                        allowed_next: ['active', 'cancelled'],
                    },
                    active: {
                        allowed_next: ['on_hold', 'completed', 'cancelled'],
                    },
                    completed: {
                        allowed_next: [],
                        is_terminal: true,
                    },
                },
                message: 'Invalid status transition from {{old_status}} to {{new_status}}',
                error_code: 'INVALID_STATE_TRANSITION',
            };

            const context: ValidationContext = {
                record: { status: 'active' },
                previousRecord: { status: 'planning' },
                operation: 'update',
            };

            const result = await validator.validate([rule], context);
            
            expect(result.valid).toBe(true);
        });

        it('should reject invalid state transitions', async () => {
            const rule: StateMachineValidationRule = {
                name: 'status_transition',
                type: 'state_machine',
                field: 'status',
                transitions: {
                    completed: {
                        allowed_next: [],
                        is_terminal: true,
                    },
                },
                message: 'Invalid status transition from {{old_status}} to {{new_status}}',
                error_code: 'INVALID_STATE_TRANSITION',
            };

            const context: ValidationContext = {
                record: { status: 'active' },
                previousRecord: { status: 'completed' },
                operation: 'update',
            };

            const result = await validator.validate([rule], context);
            
            expect(result.valid).toBe(false);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0].message).toContain('completed');
            expect(result.errors[0].message).toContain('active');
        });

        it('should allow same state (no transition)', async () => {
            const rule: StateMachineValidationRule = {
                name: 'status_transition',
                type: 'state_machine',
                field: 'status',
                transitions: {
                    completed: {
                        allowed_next: [],
                        is_terminal: true,
                    },
                },
                message: 'Invalid status transition',
            };

            const context: ValidationContext = {
                record: { status: 'completed' },
                previousRecord: { status: 'completed' },
                operation: 'update',
            };

            const result = await validator.validate([rule], context);
            
            expect(result.valid).toBe(true);
        });
    });

    describe('Validation with triggers', () => {
        it('should only run validation on specified triggers', async () => {
            const rule: AnyValidationRule = {
                name: 'create_only',
                type: 'cross_field',
                trigger: ['create'],
                rule: {
                    field: 'name',
                    operator: '!=',
                    value: null,
                },
                message: 'Name is required',
            };

            // Should run on create
            const createContext: ValidationContext = {
                record: { name: null },
                operation: 'create',
            };

            const createResult = await validator.validate([rule], createContext);
            expect(createResult.valid).toBe(false);

            // Should not run on update
            const updateContext: ValidationContext = {
                record: { name: null },
                operation: 'update',
            };

            const updateResult = await validator.validate([rule], updateContext);
            expect(updateResult.valid).toBe(true); // Rule not applied
        });

        it('should only run validation when specific fields change', async () => {
            const rule: AnyValidationRule = {
                name: 'budget_check',
                type: 'cross_field',
                fields: ['budget'],
                rule: {
                    field: 'budget',
                    operator: '<=',
                    value: 1000000,
                },
                message: 'Budget too high',
            };

            // Should run when budget changes
            const withBudgetChange: ValidationContext = {
                record: { budget: 2000000 },
                operation: 'update',
                changedFields: ['budget', 'name'],
            };

            const budgetResult = await validator.validate([rule], withBudgetChange);
            expect(budgetResult.valid).toBe(false);

            // Should not run when budget doesn't change
            const withoutBudgetChange: ValidationContext = {
                record: { budget: 2000000 },
                operation: 'update',
                changedFields: ['name', 'description'],
            };

            const noBudgetResult = await validator.validate([rule], withoutBudgetChange);
            expect(noBudgetResult.valid).toBe(true); // Rule not applied
        });
    });

    describe('Load validation from YAML fixture', () => {
        it('should load and parse validation rules from YAML', () => {
            const yamlPath = path.join(__dirname, 'fixtures', 'project-with-validation.object.yml');
            const fileContents = fs.readFileSync(yamlPath, 'utf8');
            const objectDef = yaml.load(fileContents) as any;

            expect(objectDef.validation).toBeDefined();
            expect(objectDef.validation.rules).toBeDefined();
            expect(objectDef.validation.rules.length).toBeGreaterThan(0);

            // Check cross-field rule
            const dateRangeRule = objectDef.validation.rules.find((r: any) => r.name === 'valid_date_range');
            expect(dateRangeRule).toBeDefined();
            expect(dateRangeRule.type).toBe('cross_field');
            expect(dateRangeRule.error_code).toBe('INVALID_DATE_RANGE');

            // Check state machine rule
            const statusRule = objectDef.validation.rules.find((r: any) => r.name === 'status_transition');
            expect(statusRule).toBeDefined();
            expect(statusRule.type).toBe('state_machine');
            expect(statusRule.field).toBe('status');
            expect(statusRule.transitions).toBeDefined();
            expect(statusRule.transitions.planning.allowed_next).toContain('active');
        });
    });

    describe('Severity levels', () => {
        it('should categorize errors by severity', async () => {
            const rules: AnyValidationRule[] = [
                {
                    name: 'error_rule',
                    type: 'cross_field',
                    severity: 'error',
                    rule: { field: 'x', operator: '=', value: 1 },
                    message: 'Error',
                },
                {
                    name: 'warning_rule',
                    type: 'cross_field',
                    severity: 'warning',
                    rule: { field: 'y', operator: '=', value: 1 },
                    message: 'Warning',
                },
                {
                    name: 'info_rule',
                    type: 'cross_field',
                    severity: 'info',
                    rule: { field: 'z', operator: '=', value: 1 },
                    message: 'Info',
                },
            ];

            const context: ValidationContext = {
                record: { x: 2, y: 2, z: 2 }, // All fail
                operation: 'create',
            };

            const result = await validator.validate(rules, context);

            expect(result.errors).toHaveLength(1);
            expect(result.warnings).toHaveLength(1);
            expect(result.info).toHaveLength(1);
            expect(result.valid).toBe(false); // Errors make it invalid
        });
    });

    describe('Uniqueness validation', () => {
        it('should validate uniqueness with API access', async () => {
            const rule: AnyValidationRule = {
                name: 'unique_email',
                type: 'unique',
                field: 'email',
                message: 'Email address already exists',
                error_code: 'DUPLICATE_EMAIL',
            };

            // Mock API that returns count
            const mockApi = {
                count: jest.fn().mockResolvedValue(1), // Duplicate found
            };

            const context: ValidationContext = {
                record: { email: 'test@example.com' },
                operation: 'create',
                api: mockApi,
                metadata: {
                    objectName: 'user',
                    ruleName: 'unique_email',
                },
            };

            const result = await validator.validate([rule], context);

            expect(result.valid).toBe(false);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0].error_code).toBe('DUPLICATE_EMAIL');
            expect(mockApi.count).toHaveBeenCalledWith('user', { email: 'test@example.com' });
        });

        it('should pass uniqueness when no duplicates found', async () => {
            const rule: AnyValidationRule = {
                name: 'unique_email',
                type: 'unique',
                field: 'email',
                message: 'Email address already exists',
            };

            const mockApi = {
                count: jest.fn().mockResolvedValue(0), // No duplicates
            };

            const context: ValidationContext = {
                record: { email: 'unique@example.com' },
                operation: 'create',
                api: mockApi,
                metadata: {
                    objectName: 'user',
                    ruleName: 'unique_email',
                },
            };

            const result = await validator.validate([rule], context);

            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should validate composite uniqueness', async () => {
            const rule: AnyValidationRule = {
                name: 'unique_user_space',
                type: 'unique',
                fields: ['username', 'space_id'],
                message: 'Username already exists in this space',
            };

            const mockApi = {
                count: jest.fn().mockResolvedValue(0),
            };

            const context: ValidationContext = {
                record: { username: 'john', space_id: '123' },
                operation: 'create',
                api: mockApi,
                metadata: {
                    objectName: 'user',
                    ruleName: 'unique_user_space',
                },
            };

            const result = await validator.validate([rule], context);

            expect(result.valid).toBe(true);
            expect(mockApi.count).toHaveBeenCalledWith('user', {
                username: 'john',
                space_id: '123',
            });
        });

        it('should exclude current record in update operations', async () => {
            const rule: AnyValidationRule = {
                name: 'unique_email',
                type: 'unique',
                field: 'email',
                message: 'Email already exists',
            };

            const mockApi = {
                count: jest.fn().mockResolvedValue(0),
            };

            const context: ValidationContext = {
                record: { email: 'test@example.com' },
                previousRecord: { _id: 'user123', email: 'old@example.com' },
                operation: 'update',
                api: mockApi,
                metadata: {
                    objectName: 'user',
                    ruleName: 'unique_email',
                },
            };

            const result = await validator.validate([rule], context);

            expect(result.valid).toBe(true);
            expect(mockApi.count).toHaveBeenCalledWith('user', {
                email: 'test@example.com',
                _id: { $ne: 'user123' },
            });
        });

        it('should skip uniqueness check when field value is null', async () => {
            const rule: AnyValidationRule = {
                name: 'unique_email',
                type: 'unique',
                field: 'email',
                message: 'Email already exists',
            };

            const mockApi = {
                count: jest.fn(),
            };

            const context: ValidationContext = {
                record: { email: null },
                operation: 'create',
                api: mockApi,
                metadata: {
                    objectName: 'user',
                    ruleName: 'unique_email',
                },
            };

            const result = await validator.validate([rule], context);

            expect(result.valid).toBe(true);
            expect(mockApi.count).not.toHaveBeenCalled();
        });

        it('should pass validation when no API provided', async () => {
            const rule: AnyValidationRule = {
                name: 'unique_email',
                type: 'unique',
                field: 'email',
                message: 'Email already exists',
            };

            const context: ValidationContext = {
                record: { email: 'test@example.com' },
                operation: 'create',
                metadata: {
                    objectName: 'user',
                    ruleName: 'unique_email',
                },
            };

            const result = await validator.validate([rule], context);

            // Without API, validation passes by default
            expect(result.valid).toBe(true);
        });
    });

    describe('Business rule validation', () => {
        it('should validate all_of conditions', async () => {
            const rule: AnyValidationRule = {
                name: 'budget_with_approval',
                type: 'business_rule',
                constraint: {
                    all_of: [
                        { field: 'budget', operator: '>', value: 10000 },
                        { field: 'approved', operator: '=', value: true },
                    ],
                },
                message: 'Budget over 10,000 requires approval',
                error_code: 'BUDGET_APPROVAL_REQUIRED',
            };

            // Should fail when one condition is false
            const context1: ValidationContext = {
                record: { budget: 15000, approved: false },
                operation: 'create',
            };

            const result1 = await validator.validate([rule], context1);
            expect(result1.valid).toBe(false);
            expect(result1.errors[0].error_code).toBe('BUDGET_APPROVAL_REQUIRED');

            // Should pass when all conditions are true
            const context2: ValidationContext = {
                record: { budget: 15000, approved: true },
                operation: 'create',
            };

            const result2 = await validator.validate([rule], context2);
            expect(result2.valid).toBe(true);
        });

        it('should validate any_of conditions', async () => {
            const rule: AnyValidationRule = {
                name: 'contact_method',
                type: 'business_rule',
                constraint: {
                    any_of: [
                        { field: 'email', operator: '!=', value: null },
                        { field: 'phone', operator: '!=', value: null },
                    ],
                },
                message: 'At least one contact method is required',
            };

            // Should fail when all conditions are false
            const context1: ValidationContext = {
                record: { email: null, phone: null },
                operation: 'create',
            };

            const result1 = await validator.validate([rule], context1);
            expect(result1.valid).toBe(false);

            // Should pass when at least one condition is true
            const context2: ValidationContext = {
                record: { email: 'test@example.com', phone: null },
                operation: 'create',
            };

            const result2 = await validator.validate([rule], context2);
            expect(result2.valid).toBe(true);
        });

        it('should validate then_require conditions', async () => {
            const rule: AnyValidationRule = {
                name: 'discount_requires_reason',
                type: 'business_rule',
                constraint: {
                    then_require: [
                        { field: 'discount_reason', operator: '!=', value: null },
                    ],
                },
                message: 'Discount reason is required',
            };

            // Should fail when condition is not met
            const context1: ValidationContext = {
                record: { discount: 20, discount_reason: null },
                operation: 'create',
            };

            const result1 = await validator.validate([rule], context1);
            expect(result1.valid).toBe(false);

            // Should pass when condition is met
            const context2: ValidationContext = {
                record: { discount: 20, discount_reason: 'Holiday promotion' },
                operation: 'create',
            };

            const result2 = await validator.validate([rule], context2);
            expect(result2.valid).toBe(true);
        });

        it('should pass when no constraint is specified', async () => {
            const rule: AnyValidationRule = {
                name: 'empty_rule',
                type: 'business_rule',
                message: 'Should not fail',
            };

            const context: ValidationContext = {
                record: { field: 'value' },
                operation: 'create',
            };

            const result = await validator.validate([rule], context);
            expect(result.valid).toBe(true);
        });
    });
});
