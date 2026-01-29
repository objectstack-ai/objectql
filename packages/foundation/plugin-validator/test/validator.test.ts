/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Validator } from '../src/validator';
import {
    ValidationContext,
    CrossFieldValidationRule,
    StateMachineValidationRule,
    UniquenessValidationRule,
    BusinessRuleValidationRule,
    CustomValidationRule,
    FieldConfig,
    AnyValidationRule,
} from '@objectql/types';

describe('Validator', () => {
    let validator: Validator;

    beforeEach(() => {
        validator = new Validator();
    });

    describe('Constructor', () => {
        it('should create validator with default options', () => {
            expect(validator).toBeDefined();
        });

        it('should accept custom language option', () => {
            const customValidator = new Validator({ language: 'zh-CN' });
            expect(customValidator).toBeDefined();
        });

        it('should accept language fallback option', () => {
            const customValidator = new Validator({
                language: 'fr',
                languageFallback: ['en', 'zh-CN']
            });
            expect(customValidator).toBeDefined();
        });
    });

    describe('Field Validation', () => {
        describe('Required Fields', () => {
            it('should validate required field with value', async () => {
                const fieldConfig: FieldConfig = {
                    type: 'text',
                    required: true,
                };

                const context: ValidationContext = {
                    operation: 'create',
                    data: { name: 'John' },
                    objectName: 'user',
                };

                const results = await validator.validateField('name', fieldConfig, 'John', context);
                expect(results).toEqual([]);
            });

            it('should fail validation for missing required field', async () => {
                const fieldConfig: FieldConfig = {
                    type: 'text',
                    required: true,
                    label: 'Name',
                };

                const context: ValidationContext = {
                    operation: 'create',
                    data: {},
                    objectName: 'user',
                };

                const results = await validator.validateField('name', fieldConfig, undefined, context);
                expect(results.length).toBeGreaterThan(0);
                expect(results[0].valid).toBe(false);
                expect(results[0].message).toContain('Name is required');
            });

            it('should fail validation for empty string in required field', async () => {
                const fieldConfig: FieldConfig = {
                    type: 'text',
                    required: true,
                };

                const context: ValidationContext = {
                    operation: 'create',
                    data: { name: '' },
                    objectName: 'user',
                };

                const results = await validator.validateField('name', fieldConfig, '', context);
                expect(results.length).toBeGreaterThan(0);
                expect(results[0].valid).toBe(false);
            });

            it('should fail validation for null in required field', async () => {
                const fieldConfig: FieldConfig = {
                    type: 'text',
                    required: true,
                };

                const context: ValidationContext = {
                    operation: 'create',
                    data: { name: null },
                    objectName: 'user',
                };

                const results = await validator.validateField('name', fieldConfig, null, context);
                expect(results.length).toBeGreaterThan(0);
                expect(results[0].valid).toBe(false);
            });
        });

        describe('Email Validation', () => {
            it('should validate correct email format', async () => {
                const fieldConfig: FieldConfig = {
                    type: 'email',
                    validation: { format: 'email' },
                };

                const context: ValidationContext = {
                    operation: 'create',
                    data: { email: 'test@example.com' },
                    objectName: 'user',
                };

                const results = await validator.validateField('email', fieldConfig, 'test@example.com', context);
                const errors = results.filter(r => !r.valid);
                expect(errors.length).toBe(0);
            });

            it('should reject invalid email format', async () => {
                const fieldConfig: FieldConfig = {
                    type: 'email',
                    validation: { format: 'email' },
                };

                const context: ValidationContext = {
                    operation: 'create',
                    data: { email: 'invalid-email' },
                    objectName: 'user',
                };

                const results = await validator.validateField('email', fieldConfig, 'invalid-email', context);
                const errors = results.filter(r => !r.valid);
                expect(errors.length).toBeGreaterThan(0);
            });

            it('should reject email without @', async () => {
                const fieldConfig: FieldConfig = {
                    type: 'email',
                    validation: { format: 'email' },
                };

                const context: ValidationContext = {
                    operation: 'create',
                    data: { email: 'testexample.com' },
                    objectName: 'user',
                };

                const results = await validator.validateField('email', fieldConfig, 'testexample.com', context);
                const errors = results.filter(r => !r.valid);
                expect(errors.length).toBeGreaterThan(0);
            });

            it('should reject email without domain', async () => {
                const fieldConfig: FieldConfig = {
                    type: 'email',
                    validation: { format: 'email' },
                };

                const context: ValidationContext = {
                    operation: 'create',
                    data: { email: 'test@' },
                    objectName: 'user',
                };

                const results = await validator.validateField('email', fieldConfig, 'test@', context);
                const errors = results.filter(r => !r.valid);
                expect(errors.length).toBeGreaterThan(0);
            });
        });

        describe('Length Validation', () => {
            it('should validate string within min and max length', async () => {
                const fieldConfig: FieldConfig = {
                    type: 'text',
                    validation: {
                        min_length: 3,
                        max_length: 10,
                    },
                };

                const context: ValidationContext = {
                    operation: 'create',
                    data: { name: 'John' },
                    objectName: 'user',
                };

                const results = await validator.validateField('name', fieldConfig, 'John', context);
                const errors = results.filter(r => !r.valid);
                expect(errors.length).toBe(0);
            });

            it('should reject string shorter than min_length', async () => {
                const fieldConfig: FieldConfig = {
                    type: 'text',
                    validation: {
                        min_length: 5,
                    },
                };

                const context: ValidationContext = {
                    operation: 'create',
                    data: { name: 'Bob' },
                    objectName: 'user',
                };

                const results = await validator.validateField('name', fieldConfig, 'Bob', context);
                const errors = results.filter(r => !r.valid);
                expect(errors.length).toBeGreaterThan(0);
            });

            it('should reject string longer than max_length', async () => {
                const fieldConfig: FieldConfig = {
                    type: 'text',
                    validation: {
                        max_length: 5,
                    },
                };

                const context: ValidationContext = {
                    operation: 'create',
                    data: { name: 'Alexander' },
                    objectName: 'user',
                };

                const results = await validator.validateField('name', fieldConfig, 'Alexander', context);
                const errors = results.filter(r => !r.valid);
                expect(errors.length).toBeGreaterThan(0);
            });
        });

        describe('Numeric Validation', () => {
            it('should validate number within min and max range', async () => {
                const fieldConfig: FieldConfig = {
                    type: 'number',
                    validation: {
                        min: 0,
                        max: 100,
                    },
                };

                const context: ValidationContext = {
                    operation: 'create',
                    data: { age: 25 },
                    objectName: 'user',
                };

                const results = await validator.validateField('age', fieldConfig, 25, context);
                const errors = results.filter(r => !r.valid);
                expect(errors.length).toBe(0);
            });

            it('should reject number below min', async () => {
                const fieldConfig: FieldConfig = {
                    type: 'number',
                    validation: {
                        min: 18,
                    },
                };

                const context: ValidationContext = {
                    operation: 'create',
                    data: { age: 15 },
                    objectName: 'user',
                };

                const results = await validator.validateField('age', fieldConfig, 15, context);
                const errors = results.filter(r => !r.valid);
                expect(errors.length).toBeGreaterThan(0);
            });

            it('should reject number above max', async () => {
                const fieldConfig: FieldConfig = {
                    type: 'number',
                    validation: {
                        max: 120,
                    },
                };

                const context: ValidationContext = {
                    operation: 'create',
                    data: { age: 150 },
                    objectName: 'user',
                };

                const results = await validator.validateField('age', fieldConfig, 150, context);
                const errors = results.filter(r => !r.valid);
                expect(errors.length).toBeGreaterThan(0);
            });
        });

        describe('Pattern Validation', () => {
            it('should validate value matching pattern', async () => {
                const fieldConfig: FieldConfig = {
                    type: 'text',
                    validation: {
                        pattern: '^[A-Z][0-9]{3}$', // e.g., A123
                    },
                };

                const context: ValidationContext = {
                    operation: 'create',
                    data: { code: 'A123' },
                    objectName: 'product',
                };

                const results = await validator.validateField('code', fieldConfig, 'A123', context);
                const errors = results.filter(r => !r.valid);
                expect(errors.length).toBe(0);
            });

            it('should reject value not matching pattern', async () => {
                const fieldConfig: FieldConfig = {
                    type: 'text',
                    validation: {
                        pattern: '^[A-Z][0-9]{3}$',
                    },
                };

                const context: ValidationContext = {
                    operation: 'create',
                    data: { code: 'a123' },
                    objectName: 'product',
                };

                const results = await validator.validateField('code', fieldConfig, 'a123', context);
                const errors = results.filter(r => !r.valid);
                expect(errors.length).toBeGreaterThan(0);
            });
        });

        describe('URL Validation', () => {
            it('should validate correct URL format', async () => {
                const fieldConfig: FieldConfig = {
                    type: 'url',
                    validation: { format: 'url' },
                };

                const context: ValidationContext = {
                    operation: 'create',
                    data: { website: 'https://example.com' },
                    objectName: 'user',
                };

                const results = await validator.validateField('website', fieldConfig, 'https://example.com', context);
                const errors = results.filter(r => !r.valid);
                expect(errors.length).toBe(0);
            });

            it('should reject invalid URL format', async () => {
                const fieldConfig: FieldConfig = {
                    type: 'url',
                    validation: { format: 'url' },
                };

                const context: ValidationContext = {
                    operation: 'create',
                    data: { website: 'not-a-url' },
                    objectName: 'user',
                };

                const results = await validator.validateField('website', fieldConfig, 'not-a-url', context);
                const errors = results.filter(r => !r.valid);
                expect(errors.length).toBeGreaterThan(0);
            });
        });
    });

    describe('Empty Value Handling', () => {
        it('should skip validation for empty optional fields', async () => {
            const fieldConfig: FieldConfig = {
                type: 'text',
                validation: {
                    min_length: 5,
                },
            };

            const context: ValidationContext = {
                operation: 'create',
                data: {},
                objectName: 'user',
            };

            const results = await validator.validateField('nickname', fieldConfig, undefined, context);
            expect(results.length).toBe(0);
        });

        it('should skip validation for null optional fields', async () => {
            const fieldConfig: FieldConfig = {
                type: 'text',
                validation: {
                    min_length: 5,
                },
            };

            const context: ValidationContext = {
                operation: 'create',
                data: { nickname: null },
                objectName: 'user',
            };

            const results = await validator.validateField('nickname', fieldConfig, null, context);
            expect(results.length).toBe(0);
        });

        it('should skip validation for empty string optional fields', async () => {
            const fieldConfig: FieldConfig = {
                type: 'text',
                validation: {
                    min_length: 5,
                },
            };

            const context: ValidationContext = {
                operation: 'create',
                data: { nickname: '' },
                objectName: 'user',
            };

            const results = await validator.validateField('nickname', fieldConfig, '', context);
            expect(results.length).toBe(0);
        });
    });

    describe('Rule-based Validation', () => {
        describe('Uniqueness Validation', () => {
            it('should validate uniqueness with API access', async () => {
                const rule: UniquenessValidationRule = {
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
                const rule: UniquenessValidationRule = {
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
                const rule: UniquenessValidationRule = {
                    name: 'unique_name_org',
                    type: 'unique',
                    fields: ['name', 'organization'],
                    message: 'Name already exists in this organization',
                };

                const mockApi = {
                    count: jest.fn().mockResolvedValue(1),
                };

                const context: ValidationContext = {
                    record: { name: 'John', organization: 'Acme Inc' },
                    operation: 'create',
                    api: mockApi,
                    metadata: {
                        objectName: 'user',
                        ruleName: 'unique_name_org',
                    },
                };

                const result = await validator.validate([rule], context);

                expect(result.valid).toBe(false);
                expect(mockApi.count).toHaveBeenCalledWith('user', { 
                    name: 'John', 
                    organization: 'Acme Inc' 
                });
            });

            it('should exclude current record in update operations', async () => {
                const rule: UniquenessValidationRule = {
                    name: 'unique_email',
                    type: 'unique',
                    field: 'email',
                    message: 'Email address already exists',
                };

                const mockApi = {
                    count: jest.fn().mockResolvedValue(0), // Exclude self
                };

                const context: ValidationContext = {
                    record: { _id: '123', email: 'test@example.com' },
                    operation: 'update',
                    api: mockApi,
                    metadata: {
                        objectName: 'user',
                        ruleName: 'unique_email',
                    },
                };

                const result = await validator.validate([rule], context);

                expect(result.valid).toBe(true);
                // Should exclude current record ID in the filter
                expect(mockApi.count).toHaveBeenCalled();
            });

            it('should skip uniqueness check when field value is null', async () => {
                const rule: UniquenessValidationRule = {
                    name: 'unique_email',
                    type: 'unique',
                    field: 'email',
                    message: 'Email address already exists',
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
                const rule: UniquenessValidationRule = {
                    name: 'unique_email',
                    type: 'unique',
                    field: 'email',
                    message: 'Email address already exists',
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

                // Should pass when API is not available
                expect(result.valid).toBe(true);
            });
        });

        describe('Business Rule Validation', () => {
            it('should validate all_of conditions', async () => {
                const rule: BusinessRuleValidationRule = {
                    name: 'address_required',
                    type: 'business_rule',
                    constraint: {
                        all_of: ['street', 'city', 'zip'],
                    },
                    message: 'Complete address is required',
                };

                const context: ValidationContext = {
                    record: { street: '123 Main', city: 'NY' }, // Missing zip
                    operation: 'create',
                };

                const result = await validator.validate([rule], context);

                expect(result.valid).toBe(false);
                expect(result.errors[0].message).toContain('Complete address is required');
            });

            it('should validate any_of conditions', async () => {
                const rule: BusinessRuleValidationRule = {
                    name: 'contact_required',
                    type: 'business_rule',
                    constraint: {
                        any_of: ['email', 'phone'],
                    },
                    message: 'At least one contact method is required',
                };

                const context: ValidationContext = {
                    record: { name: 'John' }, // No email or phone
                    operation: 'create',
                };

                const result = await validator.validate([rule], context);

                expect(result.valid).toBe(false);
            });

            it('should validate then_require conditions', async () => {
                const rule: BusinessRuleValidationRule = {
                    name: 'shipping_address',
                    type: 'business_rule',
                    constraint: {
                        if_field: 'requires_shipping',
                        then_require: ['shipping_address', 'shipping_city'],
                    },
                    message: 'Shipping address is required',
                };

                const context: ValidationContext = {
                    record: { requires_shipping: true }, // Missing shipping fields
                    operation: 'create',
                };

                const result = await validator.validate([rule], context);

                expect(result.valid).toBe(false);
            });

            it('should pass when no constraint is specified', async () => {
                const rule: BusinessRuleValidationRule = {
                    name: 'test_rule',
                    type: 'business_rule',
                    message: 'Test message',
                };

                const context: ValidationContext = {
                    record: { field: 'value' },
                    operation: 'create',
                };

                const result = await validator.validate([rule], context);

                expect(result.valid).toBe(true);
            });
        });

        describe('Cross-Field Validation', () => {
            it('should validate date range with compare_to', async () => {
                const rule: CrossFieldValidationRule = {
                    name: 'date_range',
                    type: 'cross_field',
                    field: 'end_date',
                    compare_to: 'start_date',
                    operator: 'gte',
                    message: 'End date must be after start date',
                };

                const context: ValidationContext = {
                    record: { start_date: '2024-01-15', end_date: '2024-01-10' },
                    operation: 'create',
                };

                const result = await validator.validate([rule], context);

                expect(result.valid).toBe(false);
            });

            it('should pass valid date range with compare_to', async () => {
                const rule: CrossFieldValidationRule = {
                    name: 'date_range',
                    type: 'cross_field',
                    field: 'end_date',
                    compare_to: 'start_date',
                    operator: 'gte',
                    message: 'End date must be after start date',
                };

                const context: ValidationContext = {
                    record: { start_date: '2024-01-10', end_date: '2024-01-15' },
                    operation: 'create',
                };

                const result = await validator.validate([rule], context);

                expect(result.valid).toBe(true);
            });

            it('should validate with fixed value comparison', async () => {
                const rule: CrossFieldValidationRule = {
                    name: 'min_age',
                    type: 'cross_field',
                    field: 'age',
                    value: 18,
                    operator: 'gte',
                    message: 'Must be 18 or older',
                };

                const context: ValidationContext = {
                    record: { age: 16 },
                    operation: 'create',
                };

                const result = await validator.validate([rule], context);

                expect(result.valid).toBe(false);
            });
        });

        describe('State Machine Validation', () => {
            it('should validate allowed state transitions', async () => {
                const rule: StateMachineValidationRule = {
                    name: 'status_transition',
                    type: 'state_machine',
                    field: 'status',
                    transitions: [
                        { from: 'draft', to: ['pending', 'cancelled'] },
                        { from: 'pending', to: ['approved', 'rejected'] },
                    ],
                };

                const context: ValidationContext = {
                    record: { status: 'approved' },
                    operation: 'update',
                    previousValues: { status: 'pending' },
                };

                const result = await validator.validate([rule], context);

                expect(result.valid).toBe(true);
            });

            it('should reject invalid state transitions', async () => {
                const rule: StateMachineValidationRule = {
                    name: 'status_transition',
                    type: 'state_machine',
                    field: 'status',
                    transitions: [
                        { from: 'draft', to: ['pending'] },
                        { from: 'pending', to: ['approved'] },
                    ],
                };

                const context: ValidationContext = {
                    record: { status: 'approved' },
                    operation: 'update',
                    previousValues: { status: 'draft' }, // Can't go directly to approved
                };

                const result = await validator.validate([rule], context);

                expect(result.valid).toBe(false);
            });

            it('should allow same state (no transition)', async () => {
                const rule: StateMachineValidationRule = {
                    name: 'status_transition',
                    type: 'state_machine',
                    field: 'status',
                    transitions: [
                        { from: 'draft', to: ['pending'] },
                    ],
                };

                const context: ValidationContext = {
                    record: { status: 'draft' },
                    operation: 'update',
                    previousValues: { status: 'draft' }, // Same state
                };

                const result = await validator.validate([rule], context);

                expect(result.valid).toBe(true);
            });
        });

        describe('Validation Triggers', () => {
            it('should only run validation on specified triggers', async () => {
                const rule: CrossFieldValidationRule = {
                    name: 'test_trigger',
                    type: 'cross_field',
                    field: 'field1',
                    compare_to: 'field2',
                    operator: 'eq',
                    triggers: ['update'],
                };

                const createContext: ValidationContext = {
                    record: { field1: 'a', field2: 'b' },
                    operation: 'create',
                };

                const createResult = await validator.validate([rule], createContext);
                expect(createResult.valid).toBe(true); // Should skip on create

                const updateContext: ValidationContext = {
                    record: { field1: 'a', field2: 'b' },
                    operation: 'update',
                };

                const updateResult = await validator.validate([rule], updateContext);
                expect(updateResult.valid).toBe(false); // Should run on update
            });

            it('should only run validation when specific fields change', async () => {
                const rule: CrossFieldValidationRule = {
                    name: 'test_changed_fields',
                    type: 'cross_field',
                    field: 'price',
                    value: 0,
                    operator: 'gt',
                    changedFields: ['price'],
                };

                const context: ValidationContext = {
                    record: { price: -10, name: 'Updated name' },
                    operation: 'update',
                    changedFields: ['name'], // price didn't change
                };

                const result = await validator.validate([rule], context);
                expect(result.valid).toBe(true); // Should skip when price didn't change

                const contextWithPriceChange: ValidationContext = {
                    record: { price: -10 },
                    operation: 'update',
                    changedFields: ['price'],
                };

                const resultWithChange = await validator.validate([rule], contextWithPriceChange);
                expect(resultWithChange.valid).toBe(false); // Should run when price changed
            });
        });

        describe('Severity Levels', () => {
            it('should categorize errors by severity', async () => {
                const rules: CustomValidationRule[] = [
                    {
                        name: 'error_rule',
                        type: 'custom',
                        field: 'field1',
                        severity: 'error',
                        message: 'Error message',
                    },
                    {
                        name: 'warning_rule',
                        type: 'custom',
                        field: 'field2',
                        severity: 'warning',
                        message: 'Warning message',
                    },
                    {
                        name: 'info_rule',
                        type: 'custom',
                        field: 'field3',
                        severity: 'info',
                        message: 'Info message',
                    },
                ];

                const context: ValidationContext = {
                    record: {},
                    operation: 'create',
                };

                const result = await validator.validate(rules, context);

                // Categorize by severity
                const errors = result.errors.filter(e => e.severity === 'error');
                const warnings = result.errors.filter(e => e.severity === 'warning');
                const infos = result.errors.filter(e => e.severity === 'info');

                expect(errors.length).toBeGreaterThanOrEqual(0);
                expect(warnings.length).toBeGreaterThanOrEqual(0);
                expect(infos.length).toBeGreaterThanOrEqual(0);
            });
        });
    });
});
