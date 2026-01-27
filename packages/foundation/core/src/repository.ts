/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ObjectQLContext, IObjectQL, ObjectConfig, Driver, UnifiedQuery, ActionContext, HookAPI, RetrievalHookContext, MutationHookContext, UpdateHookContext, ValidationContext, ValidationError, ValidationRuleResult, FormulaContext, Filter } from '@objectql/types';
import type { ObjectStackKernel } from '@objectql/runtime';
import { Data } from '@objectstack/spec';
type QueryAST = Data.QueryAST;
type SortNode = Data.SortNode;
import { Validator } from './validator';
import { FormulaEngine } from './formula-engine';
import { QueryBuilder } from './query';

/**
 * Extended ObjectStack Kernel with optional ObjectQL plugin capabilities.
 * These properties are attached by ValidatorPlugin and FormulaPlugin during installation.
 */
interface ExtendedKernel extends ObjectStackKernel {
    validator?: Validator;
    formulaEngine?: FormulaEngine;
}

export class ObjectRepository {
    private queryBuilder: QueryBuilder;

    constructor(
        private objectName: string,
        private context: ObjectQLContext,
        private app: IObjectQL
    ) {
        this.queryBuilder = new QueryBuilder();
    }
    
    /**
     * Get validator instance from kernel (via plugin)
     * Falls back to creating a new instance if not available
     */
    private getValidator(): Validator {
        const kernel = this.getKernel() as ExtendedKernel;
        if (kernel.validator) {
            return kernel.validator;
        }
        // Fallback for backward compatibility
        return new Validator();
    }
    
    /**
     * Get formula engine instance from kernel (via plugin)
     * Falls back to creating a new instance if not available
     */
    private getFormulaEngine(): FormulaEngine {
        const kernel = this.getKernel() as ExtendedKernel;
        if (kernel.formulaEngine) {
            return kernel.formulaEngine;
        }
        // Fallback for backward compatibility
        return new FormulaEngine();
    }

    private getDriver(): Driver {
        const obj = this.getSchema();
        const datasourceName = obj.datasource || 'default';
        return this.app.datasource(datasourceName);
    }
    
    private getKernel(): ObjectStackKernel {
        return this.app.getKernel();
    }

    private getOptions(extra: Record<string, unknown> = {}) {
        return {
            transaction: this.context.transactionHandle,
            ...extra
        };
    }

    /**
     * Translates ObjectQL UnifiedQuery to ObjectStack QueryAST format
     */
    private buildQueryAST(query: UnifiedQuery): QueryAST {
        return this.queryBuilder.build(this.objectName, query);
    }

    getSchema(): ObjectConfig {
        const obj = this.app.getObject(this.objectName);
        if (!obj) {
            throw new Error(`Object '${this.objectName}' not found`);
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

    /**
     * Validates a record against field-level and object-level validation rules.
     * For updates, only fields present in the update payload are validated at the field level,
     * while object-level rules use the merged record (previousRecord + updates).
     */
    private async validateRecord(
        operation: 'create' | 'update',
        record: any,
        previousRecord?: any
    ): Promise<void> {
        const schema = this.getSchema();
        const allResults: ValidationRuleResult[] = [];

        // 1. Validate field-level rules
        // For updates, only validate fields that are present in the update payload
        for (const [fieldName, fieldConfig] of Object.entries(schema.fields)) {
            // Skip field validation for updates if the field is not in the update payload
            if (operation === 'update' && !(fieldName in record)) {
                continue;
            }
            
            const value = record[fieldName];
            const fieldResults = await this.getValidator().validateField(
                fieldName,
                fieldConfig,
                value,
                {
                    record,
                    previousRecord,
                    operation,
                    user: this.getUserFromContext(),
                    api: this.getHookAPI(),
                }
            );
            allResults.push(...fieldResults);
        }

        // 2. Validate object-level validation rules
        if (schema.validation?.rules && schema.validation.rules.length > 0) {
            // For updates, merge the update data with previous record to get the complete final state
            const mergedRecord = operation === 'update' && previousRecord
                ? { ...previousRecord, ...record }
                : record;

            // Track which fields changed (using shallow comparison for performance)
            // IMPORTANT: Shallow comparison does not detect changes in nested objects/arrays.
            // If your validation rules rely on detecting changes in complex nested structures,
            // you may need to implement custom change tracking in hooks.
            const changedFields = previousRecord 
                ? Object.keys(record).filter(key => record[key] !== previousRecord[key])
                : undefined;

            const validationContext: ValidationContext = {
                record: mergedRecord,
                previousRecord,
                operation,
                user: this.getUserFromContext(),
                api: this.getHookAPI(),
                changedFields,
            };

            const result = await this.getValidator().validate(schema.validation.rules, validationContext);
            allResults.push(...result.results);
        }

        // 3. Collect errors and throw if any
        const errors = allResults.filter(r => !r.valid && r.severity === 'error');
        if (errors.length > 0) {
            const errorMessage = errors.map(e => e.message).join('; ');
            throw new ValidationError(errorMessage, errors);
        }
    }

    /**
     * Evaluate formula fields for a record
     * Adds computed formula field values to the record
     */
    private evaluateFormulas(record: any): any {
        const schema = this.getSchema();
        const now = new Date();
        
        // Build formula context
        const formulaContext: FormulaContext = {
            record,
            system: {
                today: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
                now: now,
                year: now.getFullYear(),
                month: now.getMonth() + 1,
                day: now.getDate(),
                hour: now.getHours(),
                minute: now.getMinutes(),
                second: now.getSeconds(),
            },
            current_user: {
                id: this.context.userId || '',
                // TODO: Retrieve actual user name from user object if available
                name: undefined,
                email: undefined,
                role: this.context.roles?.[0],
            },
            is_new: false,
            record_id: record._id || record.id,
        };

        // Evaluate each formula field
        for (const [fieldName, fieldConfig] of Object.entries(schema.fields)) {
            const formulaExpression = fieldConfig.expression;
            
            if (fieldConfig.type === 'formula' && formulaExpression) {
                const result = this.getFormulaEngine().evaluate(
                    formulaExpression,
                    formulaContext,
                    fieldConfig.data_type || 'text',
                    { strict: true }
                );

                if (result.success) {
                    record[fieldName] = result.value;
                } else {
                    // In case of error, set to null and log for diagnostics
                    record[fieldName] = null;
                    // Formula evaluation should not throw here, but we need observability
                    // This logging is intentionally minimal and side-effect free
                    // eslint-disable-next-line no-console
                    console.error(
                        '[ObjectQL][FormulaEngine] Formula evaluation failed',
                        {
                            objectName: this.objectName,
                            fieldName,
                            recordId: formulaContext.record_id,
                            expression: formulaExpression,
                            error: result.error,
                            stack: result.stack,
                        }
                    );
                }
            }
        }

        return record;
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

        // Build QueryAST and execute via kernel
        const ast = this.buildQueryAST(hookCtx.query || {});
        const kernelResult = await this.getKernel().find(this.objectName, ast);
        const results = kernelResult.value;
        
        // Evaluate formulas for each result
        const resultsWithFormulas = results.map((record: any) => this.evaluateFormulas(record));
        
        hookCtx.result = resultsWithFormulas;
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
            const result = await this.getKernel().get(this.objectName, String(idOrQuery));

            // Evaluate formulas if result exists
            const resultWithFormulas = result ? this.evaluateFormulas(result) : result;

            hookCtx.result = resultWithFormulas;
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

        // Build QueryAST and execute via kernel to get count
        const ast = this.buildQueryAST(hookCtx.query || {});
        const kernelResult = await this.getKernel().find(this.objectName, ast);
        const result = kernelResult.count;

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
        
        // Validate the record before creating
        await this.validateRecord('create', finalDoc);
        
        // Execute via kernel
        const result = await this.getKernel().create(this.objectName, finalDoc);
        
        hookCtx.result = result;
        await this.app.triggerHook('afterCreate', this.objectName, hookCtx);
        return hookCtx.result;
    }

    async update(id: string | number, doc: any, options?: any): Promise<any> {
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

        // Validate the update
        await this.validateRecord('update', hookCtx.data, previousData);

        // Execute via kernel
        const result = await this.getKernel().update(this.objectName, String(id), hookCtx.data);

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
        const result = await this.getKernel().delete(this.objectName, String(id));

        hookCtx.result = result;
        await this.app.triggerHook('afterDelete', this.objectName, hookCtx);
        return hookCtx.result;
    }

    async aggregate(query: any): Promise<any> {
        const driver = this.getDriver();
        if (!driver.aggregate) throw new Error("Driver does not support aggregate");
        
        return driver.aggregate(this.objectName, query, this.getOptions());
    }

    async distinct(field: string, filters?: any): Promise<any[]> {
        const driver = this.getDriver();
        if (!driver.distinct) throw new Error("Driver does not support distinct");
        
        return driver.distinct(this.objectName, field, filters, this.getOptions());
    }

    async findOneAndUpdate(filters: any, update: any, options?: any): Promise<any> {
        const driver = this.getDriver();
        if (!driver.findOneAndUpdate) throw new Error("Driver does not support findOneAndUpdate");
        return driver.findOneAndUpdate(this.objectName, filters, update, this.getOptions(options));
    }

    async createMany(data: any[]): Promise<any> {
        const driver = this.getDriver();
        
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
