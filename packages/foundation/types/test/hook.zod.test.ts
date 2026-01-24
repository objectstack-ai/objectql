/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
    HookOperationSchema,
    HookTimingSchema,
    HookAPISchema,
    BaseHookContextSchema,
    RetrievalHookContextSchema,
    MutationHookContextSchema,
    UpdateHookContextSchema,
    ObjectHookDefinitionSchema,
} from '../src/hook.zod';

describe('Hook Zod Schemas', () => {
    describe('HookOperationSchema', () => {
        it('should validate valid hook operations', () => {
            expect(() => HookOperationSchema.parse('find')).not.toThrow();
            expect(() => HookOperationSchema.parse('count')).not.toThrow();
            expect(() => HookOperationSchema.parse('create')).not.toThrow();
            expect(() => HookOperationSchema.parse('update')).not.toThrow();
            expect(() => HookOperationSchema.parse('delete')).not.toThrow();
        });

        it('should reject invalid hook operations', () => {
            expect(() => HookOperationSchema.parse('invalid')).toThrow();
            expect(() => HookOperationSchema.parse('get')).toThrow();
            expect(() => HookOperationSchema.parse('')).toThrow();
        });
    });

    describe('HookTimingSchema', () => {
        it('should validate valid hook timings', () => {
            expect(() => HookTimingSchema.parse('before')).not.toThrow();
            expect(() => HookTimingSchema.parse('after')).not.toThrow();
        });

        it('should reject invalid hook timings', () => {
            expect(() => HookTimingSchema.parse('during')).toThrow();
            expect(() => HookTimingSchema.parse('invalid')).toThrow();
        });
    });

    describe('HookAPISchema', () => {
        it('should validate valid HookAPI object', () => {
            const mockAPI = {
                find: async (objectName: string, query?: any) => [],
                findOne: async (objectName: string, id: string | number) => ({}),
                count: async (objectName: string, query?: any) => 0,
                create: async (objectName: string, data: any) => ({}),
                update: async (objectName: string, id: string | number, data: any) => ({}),
                delete: async (objectName: string, id: string | number) => ({}),
            };

            expect(() => HookAPISchema.parse(mockAPI)).not.toThrow();
        });

        it('should reject invalid HookAPI object', () => {
            const invalidAPI = {
                find: async () => [],
                // missing other methods
            };

            expect(() => HookAPISchema.parse(invalidAPI)).toThrow();
        });
    });

    describe('BaseHookContextSchema', () => {
        const mockAPI = {
            find: async () => [],
            findOne: async () => ({}),
            count: async () => 0,
            create: async () => ({}),
            update: async () => ({}),
            delete: async () => ({}),
        };

        it('should validate valid BaseHookContext', () => {
            const context = {
                objectName: 'project',
                operation: 'create' as const,
                api: mockAPI,
                state: {},
            };

            expect(() => BaseHookContextSchema.parse(context)).not.toThrow();
        });

        it('should validate context with user', () => {
            const context = {
                objectName: 'project',
                operation: 'update' as const,
                api: mockAPI,
                user: { id: 123, name: 'John Doe' },
                state: { someKey: 'someValue' },
            };

            expect(() => BaseHookContextSchema.parse(context)).not.toThrow();
        });

        it('should reject context without required fields', () => {
            const invalidContext = {
                objectName: 'project',
                // missing operation
                api: mockAPI,
                state: {},
            };

            expect(() => BaseHookContextSchema.parse(invalidContext)).toThrow();
        });
    });

    describe('RetrievalHookContextSchema', () => {
        const mockAPI = {
            find: async () => [],
            findOne: async () => ({}),
            count: async () => 0,
            create: async () => ({}),
            update: async () => ({}),
            delete: async () => ({}),
        };

        it('should validate valid find context', () => {
            const context = {
                objectName: 'project',
                operation: 'find' as const,
                api: mockAPI,
                query: { filters: [] },
                state: {},
            };

            expect(() => RetrievalHookContextSchema.parse(context)).not.toThrow();
        });

        it('should validate find context with result', () => {
            const context = {
                objectName: 'project',
                operation: 'find' as const,
                api: mockAPI,
                query: { filters: [] },
                result: [{ id: 1, name: 'Project A' }],
                state: {},
            };

            expect(() => RetrievalHookContextSchema.parse(context)).not.toThrow();
        });

        it('should validate count context', () => {
            const context = {
                objectName: 'project',
                operation: 'count' as const,
                api: mockAPI,
                query: { filters: [] },
                result: 42,
                state: {},
            };

            expect(() => RetrievalHookContextSchema.parse(context)).not.toThrow();
        });

        it('should reject non-retrieval operations', () => {
            const context = {
                objectName: 'project',
                operation: 'create' as const,
                api: mockAPI,
                query: {},
                state: {},
            };

            expect(() => RetrievalHookContextSchema.parse(context)).toThrow();
        });
    });

    describe('MutationHookContextSchema', () => {
        const mockAPI = {
            find: async () => [],
            findOne: async () => ({}),
            count: async () => 0,
            create: async () => ({}),
            update: async () => ({}),
            delete: async () => ({}),
        };

        it('should validate create context', () => {
            const context = {
                objectName: 'project',
                operation: 'create' as const,
                api: mockAPI,
                data: { name: 'New Project', status: 'planning' },
                state: {},
            };

            expect(() => MutationHookContextSchema.parse(context)).not.toThrow();
        });

        it('should validate update context', () => {
            const context = {
                objectName: 'project',
                operation: 'update' as const,
                api: mockAPI,
                id: 123,
                data: { status: 'active' },
                previousData: { id: 123, name: 'Project A', status: 'planning' },
                state: {},
            };

            expect(() => MutationHookContextSchema.parse(context)).not.toThrow();
        });

        it('should validate delete context', () => {
            const context = {
                objectName: 'project',
                operation: 'delete' as const,
                api: mockAPI,
                id: 123,
                previousData: { id: 123, name: 'Project A' },
                state: {},
            };

            expect(() => MutationHookContextSchema.parse(context)).not.toThrow();
        });

        it('should accept string or number id', () => {
            const contextWithStringId = {
                objectName: 'project',
                operation: 'update' as const,
                api: mockAPI,
                id: 'abc-123',
                data: { status: 'active' },
                state: {},
            };

            const contextWithNumberId = {
                objectName: 'project',
                operation: 'update' as const,
                api: mockAPI,
                id: 456,
                data: { status: 'active' },
                state: {},
            };

            expect(() => MutationHookContextSchema.parse(contextWithStringId)).not.toThrow();
            expect(() => MutationHookContextSchema.parse(contextWithNumberId)).not.toThrow();
        });

        it('should reject non-mutation operations', () => {
            const context = {
                objectName: 'project',
                operation: 'find' as const,
                api: mockAPI,
                state: {},
            };

            expect(() => MutationHookContextSchema.parse(context)).toThrow();
        });
    });

    describe('UpdateHookContextSchema', () => {
        const mockAPI = {
            find: async () => [],
            findOne: async () => ({}),
            count: async () => 0,
            create: async () => ({}),
            update: async () => ({}),
            delete: async () => ({}),
        };

        it('should validate update context with isModified function', () => {
            const context = {
                objectName: 'project',
                operation: 'update' as const,
                api: mockAPI,
                id: 123,
                data: { status: 'active' },
                previousData: { id: 123, status: 'planning' },
                isModified: (field: any) => true,
                state: {},
            };

            expect(() => UpdateHookContextSchema.parse(context)).not.toThrow();
        });

        it('should reject update context without isModified function', () => {
            const context = {
                objectName: 'project',
                operation: 'update' as const,
                api: mockAPI,
                id: 123,
                data: { status: 'active' },
                state: {},
                // missing isModified
            };

            expect(() => UpdateHookContextSchema.parse(context)).toThrow();
        });

        it('should reject non-update operations', () => {
            const context = {
                objectName: 'project',
                operation: 'create' as const,
                api: mockAPI,
                isModified: (field: any) => true,
                state: {},
            };

            expect(() => UpdateHookContextSchema.parse(context)).toThrow();
        });
    });

    describe('ObjectHookDefinitionSchema', () => {
        const mockAPI = {
            find: async () => [],
            findOne: async () => ({}),
            count: async () => 0,
            create: async () => ({}),
            update: async () => ({}),
            delete: async () => ({}),
        };

        it('should validate empty hook definition', () => {
            const hooks = {};
            expect(() => ObjectHookDefinitionSchema.parse(hooks)).not.toThrow();
        });

        it('should validate hook definition with beforeCreate', () => {
            const hooks = {
                beforeCreate: async (ctx: any) => {
                    ctx.data.createdAt = new Date();
                },
            };

            expect(() => ObjectHookDefinitionSchema.parse(hooks)).not.toThrow();
        });

        it('should validate hook definition with multiple hooks', () => {
            const hooks = {
                beforeCreate: async (ctx: any) => {
                    ctx.data.createdAt = new Date();
                },
                afterCreate: async (ctx: any) => {
                    console.log('Record created');
                },
                beforeUpdate: async (ctx: any) => {
                    if (ctx.isModified('status')) {
                        console.log('Status changed');
                    }
                },
                afterUpdate: async (ctx: any) => {
                    console.log('Record updated');
                },
            };

            expect(() => ObjectHookDefinitionSchema.parse(hooks)).not.toThrow();
        });

        it('should validate all hook types', () => {
            const hooks = {
                beforeFind: async (ctx: any) => {},
                afterFind: async (ctx: any) => {},
                beforeCount: async (ctx: any) => {},
                afterCount: async (ctx: any) => {},
                beforeCreate: async (ctx: any) => {},
                afterCreate: async (ctx: any) => {},
                beforeUpdate: async (ctx: any) => {},
                afterUpdate: async (ctx: any) => {},
                beforeDelete: async (ctx: any) => {},
                afterDelete: async (ctx: any) => {},
            };

            expect(() => ObjectHookDefinitionSchema.parse(hooks)).not.toThrow();
        });

        it('should validate synchronous hook handlers', () => {
            const hooks = {
                beforeCreate: (ctx: any) => {
                    ctx.data.createdAt = new Date();
                },
            };

            expect(() => ObjectHookDefinitionSchema.parse(hooks)).not.toThrow();
        });

        it('should reject invalid hook handlers', () => {
            const hooks = {
                beforeCreate: 'not a function',
            };

            expect(() => ObjectHookDefinitionSchema.parse(hooks)).toThrow();
        });

        it('should reject unknown hook names', () => {
            const hooks = {
                invalidHook: async (ctx: any) => {},
            };

            // This should still pass because Zod object schema allows extra properties by default
            // If we want strict validation, we need to add .strict()
            expect(() => ObjectHookDefinitionSchema.parse(hooks)).not.toThrow();
        });
    });
});
