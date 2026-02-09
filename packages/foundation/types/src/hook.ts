/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */


/**
 * Standard CRUD operations supported by hooks.
 */
export type HookOperation = 'find' | 'count' | 'create' | 'update' | 'delete';

/**
 * Execution timing relative to the database operation.
 */
export type HookTiming = 'before' | 'after';

/**
 * Minimal API surface exposed to hooks for performing side-effects or checks.
 */
export interface HookAPI {
    find(objectName: string, query?: Record<string, unknown>): Promise<Record<string, unknown>[]>;
    findOne(objectName: string, id: string | number): Promise<Record<string, unknown> | null>;
    count(objectName: string, query?: Record<string, unknown>): Promise<number>;
    create(objectName: string, data: Record<string, unknown>): Promise<Record<string, unknown>>;
    update(objectName: string, id: string | number, data: Record<string, unknown>): Promise<Record<string, unknown>>;
    delete(objectName: string, id: string | number): Promise<Record<string, unknown>>;
}

/**
 * Base context available in all hooks.
 */
export interface BaseHookContext<_T = Record<string, unknown>> {
    /** The name of the object (entity) being acted upon. */
    objectName: string;
    
    /** The triggering operation. */
    operation: HookOperation;
    
    /** Access to the database/engine to perform extra queries. */
    api: HookAPI;
    
    /** User/Session context (Authentication info). */
    user?: {
        id: string | number;
        [key: string]: unknown;
    };

    /** 
     * Shared state for passing data between matching 'before' and 'after' hooks.
     * e.g. Calculate a diff in 'beforeUpdate' and read it in 'afterUpdate'.
     */
    state: Record<string, unknown>;
}

/**
 * Context for Retrieval operations (Find, Count).
 */
export interface RetrievalHookContext<T = Record<string, unknown>> extends BaseHookContext<T> {
    operation: 'find' | 'count';
    
    /** The query criteria being executed. Modifiable in 'before' hooks. */
    query: object;
    
    /** The result of the query. Only available in 'after' hooks. */
    result?: T[] | number;
}

/**
 * Context for Modification operations (Create, Update, Delete).
 */
export interface MutationHookContext<T = Record<string, unknown>> extends BaseHookContext<T> {
    operation: 'create' | 'update' | 'delete';
    
    /** The record ID. Undefined for 'create'. */
    id?: string | number;
    
    /** 
     * The incoming data changes. 
     * - For 'create': The full object to insert.
     * - For 'update': The partial fields to update.
     * - For 'delete': Undefined.
     */
    data?: Partial<T>;

    /**
     * The final result record from the database.
     * Only available in 'after' hooks.
     */
    result?: T;

    /**
     * The existing record fetched from DB before operation.
     * Available in 'update' and 'delete' hooks.
     */
    previousData?: T;
}

/**
 * Specialized context for Updates, including change tracking.
 */
export interface UpdateHookContext<T = Record<string, unknown>> extends MutationHookContext<T> {
    operation: 'update';
    
    /**
     * Helper to check if a specific field is being modified.
     * Checks if the field exists in 'data' AND is different from 'previousData'.
     */
    isModified(field: keyof T): boolean;
}

/**
 * Definition interface for a set of hooks for a specific object.
 */
export interface ObjectHookDefinition<T = Record<string, unknown>> {
    beforeFind?: (ctx: RetrievalHookContext<T>) => Promise<void> | void;
    afterFind?: (ctx: RetrievalHookContext<T>) => Promise<void> | void;
    
    beforeCount?: (ctx: RetrievalHookContext<T>) => Promise<void> | void;
    afterCount?: (ctx: RetrievalHookContext<T>) => Promise<void> | void;
    
    beforeDelete?: (ctx: MutationHookContext<T>) => Promise<void> | void;
    afterDelete?: (ctx: MutationHookContext<T>) => Promise<void> | void;
    
    beforeCreate?: (ctx: MutationHookContext<T>) => Promise<void> | void;
    afterCreate?: (ctx: MutationHookContext<T>) => Promise<void> | void;
    
    beforeUpdate?: (ctx: UpdateHookContext<T>) => Promise<void> | void;
    afterUpdate?: (ctx: UpdateHookContext<T>) => Promise<void> | void;
}

export type HookName = keyof ObjectHookDefinition;
export type HookContext<T = Record<string, unknown>> = RetrievalHookContext<T> | MutationHookContext<T> | UpdateHookContext<T>;
export type HookHandler<T = Record<string, unknown>> = (ctx: HookContext<T>) => Promise<void> | void;
