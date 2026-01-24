/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { z } from 'zod';

/**
 * Zod schema for HookOperation.
 * Standard CRUD operations supported by hooks.
 */
export const HookOperationSchema = z.enum(['find', 'count', 'create', 'update', 'delete']);

/**
 * Zod schema for HookTiming.
 * Execution timing relative to the database operation.
 */
export const HookTimingSchema = z.enum(['before', 'after']);

/**
 * Zod schema for HookAPI.
 * Minimal API surface exposed to hooks for performing side-effects or checks.
 */
export const HookAPISchema = z.object({
    find: z.function()
        .args(z.string(), z.any().optional())
        .returns(z.promise(z.array(z.any()))),
    findOne: z.function()
        .args(z.string(), z.union([z.string(), z.number()]))
        .returns(z.promise(z.any())),
    count: z.function()
        .args(z.string(), z.any().optional())
        .returns(z.promise(z.number())),
    create: z.function()
        .args(z.string(), z.any())
        .returns(z.promise(z.any())),
    update: z.function()
        .args(z.string(), z.union([z.string(), z.number()]), z.any())
        .returns(z.promise(z.any())),
    delete: z.function()
        .args(z.string(), z.union([z.string(), z.number()]))
        .returns(z.promise(z.any())),
});

/**
 * Zod schema for BaseHookContext.
 * Base context available in all hooks.
 */
export const BaseHookContextSchema = z.object({
    objectName: z.string(),
    operation: HookOperationSchema,
    api: HookAPISchema,
    user: z.object({
        id: z.union([z.string(), z.number()]),
    }).catchall(z.any()).optional(),
    state: z.record(z.any()),
});

/**
 * Zod schema for RetrievalHookContext.
 * Context for Retrieval operations (Find, Count).
 */
export const RetrievalHookContextSchema = BaseHookContextSchema.extend({
    operation: z.enum(['find', 'count']),
    query: z.any(),
    result: z.union([z.array(z.any()), z.number()]).optional(),
});

/**
 * Zod schema for MutationHookContext.
 * Context for Modification operations (Create, Update, Delete).
 */
export const MutationHookContextSchema = BaseHookContextSchema.extend({
    operation: z.enum(['create', 'update', 'delete']),
    id: z.union([z.string(), z.number()]).optional(),
    data: z.any().optional(),
    result: z.any().optional(),
    previousData: z.any().optional(),
});

/**
 * Zod schema for UpdateHookContext.
 * Specialized context for Updates, including change tracking.
 */
export const UpdateHookContextSchema = MutationHookContextSchema.extend({
    operation: z.literal('update'),
    isModified: z.function()
        .args(z.any())
        .returns(z.boolean()),
});

/**
 * Zod schema for a single hook handler function.
 */
export const HookHandlerSchema = z.function()
    .args(z.union([
        RetrievalHookContextSchema,
        MutationHookContextSchema,
        UpdateHookContextSchema,
    ]))
    .returns(z.union([z.promise(z.void()), z.void()]));

/**
 * Zod schema for ObjectHookDefinition.
 * Definition interface for a set of hooks for a specific object.
 */
export const ObjectHookDefinitionSchema = z.object({
    beforeFind: z.function()
        .args(RetrievalHookContextSchema)
        .returns(z.union([z.promise(z.void()), z.void()]))
        .optional(),
    afterFind: z.function()
        .args(RetrievalHookContextSchema)
        .returns(z.union([z.promise(z.void()), z.void()]))
        .optional(),
    beforeCount: z.function()
        .args(RetrievalHookContextSchema)
        .returns(z.union([z.promise(z.void()), z.void()]))
        .optional(),
    afterCount: z.function()
        .args(RetrievalHookContextSchema)
        .returns(z.union([z.promise(z.void()), z.void()]))
        .optional(),
    beforeDelete: z.function()
        .args(MutationHookContextSchema)
        .returns(z.union([z.promise(z.void()), z.void()]))
        .optional(),
    afterDelete: z.function()
        .args(MutationHookContextSchema)
        .returns(z.union([z.promise(z.void()), z.void()]))
        .optional(),
    beforeCreate: z.function()
        .args(MutationHookContextSchema)
        .returns(z.union([z.promise(z.void()), z.void()]))
        .optional(),
    afterCreate: z.function()
        .args(MutationHookContextSchema)
        .returns(z.union([z.promise(z.void()), z.void()]))
        .optional(),
    beforeUpdate: z.function()
        .args(UpdateHookContextSchema)
        .returns(z.union([z.promise(z.void()), z.void()]))
        .optional(),
    afterUpdate: z.function()
        .args(UpdateHookContextSchema)
        .returns(z.union([z.promise(z.void()), z.void()]))
        .optional(),
});

/**
 * Infer TypeScript types from Zod schemas for runtime validation.
 */
export type HookOperationZod = z.infer<typeof HookOperationSchema>;
export type HookTimingZod = z.infer<typeof HookTimingSchema>;
export type HookAPIZod = z.infer<typeof HookAPISchema>;
export type BaseHookContextZod = z.infer<typeof BaseHookContextSchema>;
export type RetrievalHookContextZod = z.infer<typeof RetrievalHookContextSchema>;
export type MutationHookContextZod = z.infer<typeof MutationHookContextSchema>;
export type UpdateHookContextZod = z.infer<typeof UpdateHookContextSchema>;
export type ObjectHookDefinitionZod = z.infer<typeof ObjectHookDefinitionSchema>;
export type HookHandlerZod = z.infer<typeof HookHandlerSchema>;
