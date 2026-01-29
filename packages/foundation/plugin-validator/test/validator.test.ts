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
});
