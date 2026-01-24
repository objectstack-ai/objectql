/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { 
    TriggerAction, 
    TriggerTiming, 
    TriggerContextSchema, 
    TriggerSchema,
    type TriggerActionType,
    type TriggerTimingType,
    type TriggerContext,
    type Trigger
} from '../src/trigger.zod';

describe('Trigger Zod Schemas', () => {
    describe('TriggerAction', () => {
        it('should accept valid trigger actions', () => {
            expect(TriggerAction.parse('insert')).toBe('insert');
            expect(TriggerAction.parse('update')).toBe('update');
            expect(TriggerAction.parse('delete')).toBe('delete');
        });

        it('should reject invalid trigger actions', () => {
            expect(() => TriggerAction.parse('invalid')).toThrow();
            expect(() => TriggerAction.parse('')).toThrow();
        });
    });

    describe('TriggerTiming', () => {
        it('should accept valid trigger timing', () => {
            expect(TriggerTiming.parse('before')).toBe('before');
            expect(TriggerTiming.parse('after')).toBe('after');
        });

        it('should reject invalid trigger timing', () => {
            expect(() => TriggerTiming.parse('during')).toThrow();
            expect(() => TriggerTiming.parse('')).toThrow();
        });
    });

    describe('TriggerContextSchema', () => {
        it('should validate a complete trigger context', () => {
            const context = {
                action: 'insert' as const,
                timing: 'before' as const,
                doc: { id: '123', name: 'Test' },
                userId: 'user-123',
                user: { id: 'user-123', email: 'test@example.com' },
                ql: {},
                logger: {},
                addError: (message: string, field?: string) => {},
                getOldValue: (fieldName: string) => undefined,
            };

            const result = TriggerContextSchema.parse(context);
            expect(result.action).toBe('insert');
            expect(result.doc.id).toBe('123');
        });

        it('should validate context with previousDoc for update', () => {
            const context = {
                action: 'update' as const,
                timing: 'after' as const,
                doc: { id: '123', status: 'active' },
                previousDoc: { id: '123', status: 'pending' },
                userId: 'user-123',
                user: { id: 'user-123' },
                ql: {},
                logger: {},
                addError: (message: string, field?: string) => {},
                getOldValue: (fieldName: string) => 'pending',
            };

            const result = TriggerContextSchema.parse(context);
            expect(result.previousDoc?.status).toBe('pending');
        });

        it('should reject context with missing required fields', () => {
            const invalidContext = {
                action: 'insert',
                // missing timing
                doc: {},
                userId: 'user-123',
            };

            expect(() => TriggerContextSchema.parse(invalidContext)).toThrow();
        });
    });

    describe('TriggerSchema', () => {
        it('should validate a complete trigger definition', () => {
            const trigger = {
                name: 'set_default_status',
                object: 'project',
                timing: 'before' as const,
                action: 'insert' as const,
                execute: async (ctx: TriggerContext) => {},
                description: 'Sets default status for new projects',
                active: true,
                order: 10,
            };

            const result = TriggerSchema.parse(trigger);
            expect(result.name).toBe('set_default_status');
            expect(result.object).toBe('project');
        });

        it('should validate trigger with array of actions', () => {
            const trigger = {
                name: 'validate_amount',
                object: 'order',
                timing: 'before' as const,
                action: ['insert', 'update'] as const,
                execute: async (ctx: TriggerContext) => {},
            };

            const result = TriggerSchema.parse(trigger);
            expect(Array.isArray(result.action)).toBe(true);
        });

        it('should apply default values', () => {
            const trigger = {
                name: 'simple_trigger',
                object: 'task',
                timing: 'after' as const,
                action: 'insert' as const,
                execute: async (ctx: TriggerContext) => {},
            };

            const result = TriggerSchema.parse(trigger);
            expect(result.active).toBe(true);
            expect(result.order).toBe(0);
        });

        it('should reject invalid trigger name format', () => {
            const trigger = {
                name: 'Invalid-Name', // Should be snake_case
                object: 'task',
                timing: 'before' as const,
                action: 'insert' as const,
                execute: async (ctx: TriggerContext) => {},
            };

            expect(() => TriggerSchema.parse(trigger)).toThrow();
        });

        it('should accept valid snake_case names', () => {
            const validNames = [
                'simple_name',
                'name_with_multiple_words',
                'name123',
                '_private_trigger',
            ];

            validNames.forEach(name => {
                const trigger = {
                    name,
                    object: 'task',
                    timing: 'before' as const,
                    action: 'insert' as const,
                    execute: async (ctx: TriggerContext) => {},
                };

                expect(() => TriggerSchema.parse(trigger)).not.toThrow();
            });
        });

        it('should reject missing required fields', () => {
            const invalidTrigger = {
                name: 'test_trigger',
                // missing object, timing, action, execute
            };

            expect(() => TriggerSchema.parse(invalidTrigger)).toThrow();
        });
    });

    describe('TypeScript Types', () => {
        it('should infer correct types', () => {
            // Type checking - these should compile
            const action: TriggerActionType = 'insert';
            const timing: TriggerTimingType = 'before';
            
            const trigger: Trigger = {
                name: 'test_trigger',
                object: 'project',
                timing: 'before',
                action: 'insert',
                execute: async (ctx: TriggerContext) => {
                    // Access context properties
                    const docId = ctx.doc.id;
                    const userId = ctx.userId;
                },
                active: true,
                order: 0,
            };

            expect(action).toBe('insert');
            expect(timing).toBe('before');
            expect(trigger.name).toBe('test_trigger');
        });
    });
});
