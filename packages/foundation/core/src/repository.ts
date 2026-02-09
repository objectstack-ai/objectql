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
        return this.app.getKernel();
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


    async find(query: UnifiedQuery = {}): Promise<any[]> {
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
        const kernelResult = await (this.getKernel() as any).find(this.objectName, hookCtx.query || {});
        const results = kernelResult.value;
        
        // Formula evaluation moved to FormulaPlugin hook
        hookCtx.result = results;
        await this.app.triggerHook('afterFind', this.objectName, hookCtx);

        return hookCtx.result as any[];
    }

    async findOne(idOrQuery: string | number | UnifiedQuery): Promise<any> {
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
            const result = await (this.getKernel() as any).get(this.objectName, String(idOrQuery));

            // Formula evaluation moved to FormulaPlugin hook
            hookCtx.result = result;
            await this.app.triggerHook('afterFind', this.objectName, hookCtx);
            return hookCtx.result;
        } else {
            const results = await this.find(idOrQuery);
            return results[0] || null;
        }
    }

    async count(filters: any): Promise<number> {
        // Normalize filters to UnifiedQuery format
        // If filters is an array, wrap it in a query object
        // If filters is already a UnifiedQuery (has UnifiedQuery-specific properties), use it as-is
        let query: UnifiedQuery;
        if (Array.isArray(filters)) {
            query = { where: filters };
        } else if (filters && typeof filters === 'object' && (filters.fields || filters.orderBy || filters.limit !== undefined || filters.offset !== undefined)) {
            // It's already a UnifiedQuery object
            query = filters;
        } else if (filters) {
            // It's a raw filter object, wrap it
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
        const kernel = this.getKernel() as any;
        if (typeof kernel.count === 'function') {
            result = await kernel.count(this.objectName, hookCtx.query || {});
        } else {
            // Fallback to driver if kernel doesn't support count
            result = await this.getDriver().count(this.objectName, hookCtx.query || {});
        }

        hookCtx.result = result;
        await this.app.triggerHook('afterCount', this.objectName, hookCtx);
        return hookCtx.result as number;
    }

    async create(doc: any): Promise<any> {
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

        if (this.context.userId) finalDoc.created_by = this.context.userId;
        if (this.context.spaceId) finalDoc.space_id = this.context.spaceId;
        
        // Validation moved to ValidatorPlugin hook
        
        // Execute via kernel
        const result = await (this.getKernel() as any).create(this.objectName, finalDoc, this.getOptions());
        
        hookCtx.result = result;
        await this.app.triggerHook('afterCreate', this.objectName, hookCtx);
        return hookCtx.result;
    }

    async update(id: string | number, doc: any, _options?: any): Promise<any> {
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
            previousData,
            isModified: (field) => hookCtx.data ? Object.prototype.hasOwnProperty.call(hookCtx.data, field) : false
        };
        await this.app.triggerHook('beforeUpdate', this.objectName, hookCtx);

        // Validation moved to ValidatorPlugin hook

        // Execute via kernel
        const result = await (this.getKernel() as any).update(this.objectName, String(id), hookCtx.data, this.getOptions());

        hookCtx.result = result;
        await this.app.triggerHook('afterUpdate', this.objectName, hookCtx);
        return hookCtx.result;
    }

    async delete(id: string | number): Promise<any> {
        const previousData = await this.findOne(id);
        const hookCtx: MutationHookContext = {
            ...this.context,
            objectName: this.objectName,
            operation: 'delete',
            state: {},
            api: this.getHookAPI(),
            user: this.getUserFromContext(),
            id,
            previousData
        };
        await this.app.triggerHook('beforeDelete', this.objectName, hookCtx);

        // Execute via kernel
        const result = await (this.getKernel() as any).delete(this.objectName, String(id), this.getOptions());

        hookCtx.result = result;
        await this.app.triggerHook('afterDelete', this.objectName, hookCtx);
        return hookCtx.result;
    }

    async aggregate(query: any): Promise<any> {
        const driver = this.getDriver();
        if (!driver.aggregate) throw new ObjectQLError({ code: 'DRIVER_UNSUPPORTED_OPERATION', message: "Driver does not support aggregate" });
        
        return driver.aggregate(this.objectName, query, this.getOptions());
    }

    async distinct(field: string, filters?: any): Promise<any[]> {
        const driver = this.getDriver();
        if (!driver.distinct) throw new ObjectQLError({ code: 'DRIVER_UNSUPPORTED_OPERATION', message: "Driver does not support distinct" });
        
        return driver.distinct(this.objectName, field, filters, this.getOptions());
    }

    async findOneAndUpdate(filters: any, update: any, options?: any): Promise<any> {
        const driver = this.getDriver();
        if (!driver.findOneAndUpdate) throw new ObjectQLError({ code: 'DRIVER_UNSUPPORTED_OPERATION', message: "Driver does not support findOneAndUpdate" });
        return driver.findOneAndUpdate(this.objectName, filters, update, this.getOptions(options));
    }

    async createMany(data: any[]): Promise<any> {
        const _driver = this.getDriver();
        
        // Always use fallback to ensure validation and hooks are executed
        // This maintains ObjectQL's metadata-driven architecture where
        // validation rules, hooks, and permissions are enforced consistently
        const results = [];
        for (const item of data) {
            results.push(await this.create(item));
        }
        return results;
    }

    async updateMany(filters: any, data: any): Promise<any> {
        // Find all matching records and update them individually
        // to ensure validation and hooks are executed
        const records = await this.find({ where: filters });
        let count = 0;
        for (const record of records) {
            if (record && record._id) {
                await this.update(record._id, data);
                count++;
            }
        }
        return count;
    }

    async deleteMany(filters: any): Promise<any> {
        // Find all matching records and delete them individually
        // to ensure hooks are executed
        const records = await this.find({ where: filters });
        let count = 0;
        for (const record of records) {
            if (record && record._id) {
                await this.delete(record._id);
                count++;
            }
        }
        return count;
    }

    async execute(actionName: string, id: string | number | undefined, params: any): Promise<any> {
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
