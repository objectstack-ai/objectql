/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ObjectQLContext, IObjectQL, ObjectConfig, Driver, UnifiedQuery, ActionContext, HookAPI, RetrievalHookContext, MutationHookContext, UpdateHookContext, ObjectQLError } from '@objectql/types';
import type { ObjectKernel } from '@objectstack/runtime';
import { Data } from '@objectstack/spec';
import { z } from 'zod';
type _SortNode = z.infer<typeof Data.SortNodeSchema>;

export class ObjectRepository {

    constructor(
        private objectName: string,
        private context: ObjectQLContext,
        private app: IObjectQL
    ) {
    }
    
    private getDriver(): Driver {
        const obj = this.getSchema();
        const datasourceName = obj.datasource || 'default';
        return this.app.datasource(datasourceName);
    }
    
    private getKernel(): ObjectKernel {
        return this.app.getKernel() as ObjectKernel;
    }

    private getOptions(extra: Record<string, unknown> = {}) {
        return {
            transaction: this.context.transactionHandle,
            ...extra
        };
    }

    getSchema(): ObjectConfig {
        const obj = this.app.getObject(this.objectName);
        if (!obj) {
            throw new ObjectQLError({ code: 'NOT_FOUND', message: `Object '${this.objectName}' not found` });
        }
        return obj;
    }

    private getHookAPI(): HookAPI {
        return {
            find: (obj, q) => this.context.object(obj).find(q),
            findOne: (obj, id) => this.context.object(obj).findOne(id),
            count: (obj, q) => this.context.object(obj).count(q),
            create: (obj, data) => this.context.object(obj).create(data),
            update: (obj, id, data) => this.context.object(obj).update(id, data),
            delete: (obj, id) => this.context.object(obj).delete(id)
        };
    }

    private getUserFromContext() {
        if (!this.context.userId) {
            return undefined;
        }
        // Construct user object from context, including relevant properties
        return {
            id: this.context.userId,
            spaceId: this.context.spaceId,
            roles: this.context.roles,
            isSystem: this.context.isSystem
        };
    }


    async find(query: UnifiedQuery = {}): Promise<Record<string, unknown>[]> {
        const hookCtx: RetrievalHookContext = {
            ...this.context,
            objectName: this.objectName,
            operation: 'find',
            api: this.getHookAPI(),
            user: this.getUserFromContext(),
            state: {},
            query
        };
        await this.app.triggerHook('beforeFind', this.objectName, hookCtx);

        // Execute via kernel (delegates to QueryService)
        const kernel = this.getKernel() as unknown as { find(objectName: string, query: Record<string, unknown>): Promise<{ value: Record<string, unknown>[] }> };
        const kernelResult = await kernel.find(this.objectName, (hookCtx.query || {}) as Record<string, unknown>);
        const results = kernelResult.value;
        
        // Formula evaluation moved to FormulaPlugin hook
        hookCtx.result = results;
        await this.app.triggerHook('afterFind', this.objectName, hookCtx);

        return hookCtx.result as Record<string, unknown>[];
    }

    async findOne(idOrQuery: string | number | UnifiedQuery): Promise<Record<string, unknown> | null> {
        if (typeof idOrQuery === 'string' || typeof idOrQuery === 'number') {
            const hookCtx: RetrievalHookContext = {
                ...this.context,
                objectName: this.objectName,
                operation: 'find',
                api: this.getHookAPI(),
                user: this.getUserFromContext(),
                state: {},
                query: { _id: idOrQuery }
            };
            await this.app.triggerHook('beforeFind', this.objectName, hookCtx);
            
            // Use kernel.get() for direct ID lookup
            const kernel = this.getKernel() as unknown as { get(objectName: string, id: string): Promise<Record<string, unknown> | null> };
            const result = await kernel.get(this.objectName, String(idOrQuery));

            // Formula evaluation moved to FormulaPlugin hook
            hookCtx.result = result ? [result] : [];
            await this.app.triggerHook('afterFind', this.objectName, hookCtx);
            const resultArray = hookCtx.result as Record<string, unknown>[];
            return resultArray[0] || null;
        } else {
            const results = await this.find(idOrQuery);
            return results[0] || null;
        }
    }

    async count(filters: Record<string, unknown> | unknown[] | undefined): Promise<number> {
        // Normalize filters to UnifiedQuery format
        // If filters is an array, wrap it in a query object
        // If filters is already a UnifiedQuery (has UnifiedQuery-specific properties), use it as-is
        let query: UnifiedQuery;
        if (Array.isArray(filters)) {
            query = { where: filters };
        } else if (filters && typeof filters === 'object' && ((filters as Record<string, unknown>).fields || (filters as Record<string, unknown>).orderBy || (filters as Record<string, unknown>).limit !== undefined || (filters as Record<string, unknown>).offset !== undefined)) {
            query = filters as UnifiedQuery;
        } else if (filters) {
            query = { where: filters };
        } else {
            query = {};
        }

        const hookCtx: RetrievalHookContext = {
            ...this.context,
            objectName: this.objectName,
            operation: 'count',
            api: this.getHookAPI(),
            user: this.getUserFromContext(),
            state: {},
            query
        };
        await this.app.triggerHook('beforeCount', this.objectName, hookCtx);

        // Execute via kernel (delegates to QueryService)
        let result: number;
        const kernel = this.getKernel() as unknown as { count?(objectName: string, query: Record<string, unknown>): Promise<number> };
        if (typeof kernel.count === 'function') {
            result = await kernel.count(this.objectName, (hookCtx.query || {}) as Record<string, unknown>);
        } else {
            result = await this.getDriver().count(this.objectName, hookCtx.query || {});
        }

        hookCtx.result = result;
        await this.app.triggerHook('afterCount', this.objectName, hookCtx);
        return hookCtx.result as number;
    }

    async create(doc: Record<string, unknown>): Promise<Record<string, unknown>> {
        const hookCtx: MutationHookContext = {
            ...this.context,
            objectName: this.objectName,
            operation: 'create',
            state: {},
            api: this.getHookAPI(),
            user: this.getUserFromContext(),
            data: doc
        };
        await this.app.triggerHook('beforeCreate', this.objectName, hookCtx);
        const finalDoc = hookCtx.data || doc;

        if (this.context.userId) (finalDoc as Record<string, unknown>).created_by = this.context.userId;
        if (this.context.spaceId) (finalDoc as Record<string, unknown>).space_id = this.context.spaceId;
        
        // Execute via kernel
        const kernel = this.getKernel() as unknown as { create(objectName: string, doc: Record<string, unknown>, options: Record<string, unknown>): Promise<Record<string, unknown>> };
        const result = await kernel.create(this.objectName, finalDoc as Record<string, unknown>, this.getOptions());
        
        hookCtx.result = result;
        await this.app.triggerHook('afterCreate', this.objectName, hookCtx);
        return hookCtx.result as Record<string, unknown>;
    }

    async update(id: string | number, doc: Record<string, unknown>, _options?: Record<string, unknown>): Promise<Record<string, unknown>> {
        const previousData = await this.findOne(id);
        const hookCtx: UpdateHookContext = {
            ...this.context,
            objectName: this.objectName,
            operation: 'update',
            state: {},
            api: this.getHookAPI(),
            user: this.getUserFromContext(),
            id,
            data: doc,
            previousData: previousData as Record<string, unknown> | undefined,
            isModified: (field) => hookCtx.data ? Object.prototype.hasOwnProperty.call(hookCtx.data, field) : false
        };
        await this.app.triggerHook('beforeUpdate', this.objectName, hookCtx);

        // Execute via kernel
        const kernel = this.getKernel() as unknown as { update(objectName: string, id: string, data: unknown, options: Record<string, unknown>): Promise<Record<string, unknown>> };
        const result = await kernel.update(this.objectName, String(id), hookCtx.data, this.getOptions());

        hookCtx.result = result;
        await this.app.triggerHook('afterUpdate', this.objectName, hookCtx);
        return hookCtx.result as Record<string, unknown>;
    }

    async delete(id: string | number): Promise<Record<string, unknown>> {
        const previousData = await this.findOne(id);
        const hookCtx: MutationHookContext = {
            ...this.context,
            objectName: this.objectName,
            operation: 'delete',
            state: {},
            api: this.getHookAPI(),
            user: this.getUserFromContext(),
            id,
            previousData: previousData as Record<string, unknown> | undefined
        };
        await this.app.triggerHook('beforeDelete', this.objectName, hookCtx);

        // Execute via kernel
        const kernel = this.getKernel() as unknown as { delete(objectName: string, id: string, options: Record<string, unknown>): Promise<Record<string, unknown>> };
        const result = await kernel.delete(this.objectName, String(id), this.getOptions());

        hookCtx.result = result;
        await this.app.triggerHook('afterDelete', this.objectName, hookCtx);
        return hookCtx.result as Record<string, unknown>;
    }

    async aggregate(query: Record<string, unknown>): Promise<unknown[]> {
        const driver = this.getDriver();
        if (!driver.aggregate) throw new ObjectQLError({ code: 'DRIVER_UNSUPPORTED_OPERATION', message: "Driver does not support aggregate" });
        
        return driver.aggregate(this.objectName, query, this.getOptions());
    }

    async distinct(field: string, filters?: Record<string, unknown>): Promise<unknown[]> {
        const driver = this.getDriver();
        if (!driver.distinct) throw new ObjectQLError({ code: 'DRIVER_UNSUPPORTED_OPERATION', message: "Driver does not support distinct" });
        
        return driver.distinct(this.objectName, field, filters, this.getOptions());
    }

    async findOneAndUpdate(filters: Record<string, unknown>, update: Record<string, unknown>, options?: Record<string, unknown>): Promise<Record<string, unknown> | null> {
        const driver = this.getDriver();
        if (!driver.findOneAndUpdate) throw new ObjectQLError({ code: 'DRIVER_UNSUPPORTED_OPERATION', message: "Driver does not support findOneAndUpdate" });
        return driver.findOneAndUpdate(this.objectName, filters, update, this.getOptions(options));
    }

    async createMany(data: Record<string, unknown>[]): Promise<Record<string, unknown>[]> {
        const _driver = this.getDriver();
        
        const results: Record<string, unknown>[] = [];
        for (const item of data) {
            results.push(await this.create(item));
        }
        return results;
    }

    async updateMany(filters: Record<string, unknown>, data: Record<string, unknown>): Promise<number> {
        const records = await this.find({ where: filters });
        let count = 0;
        for (const record of records) {
            if (record && record._id) {
                await this.update(record._id as string | number, data);
                count++;
            }
        }
        return count;
    }

    async deleteMany(filters: Record<string, unknown>): Promise<number> {
        const records = await this.find({ where: filters });
        let count = 0;
        for (const record of records) {
            if (record && record._id) {
                await this.delete(record._id as string | number);
                count++;
            }
        }
        return count;
    }

    async execute(actionName: string, id: string | number | undefined, params: Record<string, unknown>): Promise<unknown> {
        const api: HookAPI = {
            find: (obj, q) => this.context.object(obj).find(q),
            findOne: (obj, id) => this.context.object(obj).findOne(id),
            count: (obj, q) => this.context.object(obj).count(q),
            create: (obj, data) => this.context.object(obj).create(data),
            update: (obj, id, data) => this.context.object(obj).update(id, data),
            delete: (obj, id) => this.context.object(obj).delete(id)
        };

        const ctx: ActionContext = {
            ...this.context,
            objectName: this.objectName,
            actionName,
            id,
            input: params,
            api,
            user: this.getUserFromContext()
        };
        return await this.app.executeAction(this.objectName, actionName, ctx);
    }
}
