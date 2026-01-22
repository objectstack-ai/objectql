/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ObjectQLContext, IObjectQL, ObjectConfig, Driver, UnifiedQuery, ActionContext, HookAPI, RetrievalHookContext, MutationHookContext, UpdateHookContext, ValidationContext, ValidationError, ValidationRuleResult, FormulaContext, Filter } from '@objectql/types';
import type { ObjectStackKernel } from '@objectstack/runtime';
import type { QueryAST, FilterNode, SortNode } from '@objectstack/spec';
import { Validator } from './validator';
import { FormulaEngine } from './formula-engine';

export class ObjectRepository {
    private validator: Validator;
    private formulaEngine: FormulaEngine;

    constructor(
        private objectName: string,
        private context: ObjectQLContext,
        private app: IObjectQL
    ) {
        this.validator = new Validator();
        this.formulaEngine = new FormulaEngine();
    }

    private getDriver(): Driver {
        const obj = this.getSchema();
        const datasourceName = obj.datasource || 'default';
        return this.app.datasource(datasourceName);
    }
    
    private getKernel(): ObjectStackKernel {
        return this.app.getKernel();
    }
    
    private getOptions(extra: any = {}) {
        return {
            transaction: this.context.transactionHandle,
            ...extra
        };
    }

    /**
     * Translates ObjectQL Filter (FilterCondition) to ObjectStack FilterNode format
     * 
     * Converts modern object-based syntax to legacy array-based syntax:
     * Input:  { age: { $gte: 18 }, $or: [{ status: "active" }, { role: "admin" }] }
     * Output: [["age", ">=", 18], "or", [["status", "=", "active"], "or", ["role", "=", "admin"]]]
     * 
     * Also supports backward compatibility: if filters is already in array format, pass through.
     */
    private translateFilters(filters?: Filter): FilterNode | undefined {
        if (!filters) {
            return undefined;
        }

        // Backward compatibility: if it's already an array (old format), pass through
        if (Array.isArray(filters)) {
            return filters as FilterNode;
        }

        // If it's an empty object, return undefined
        if (typeof filters === 'object' && Object.keys(filters).length === 0) {
            return undefined;
        }

        return this.convertFilterToNode(filters);
    }

    /**
     * Recursively converts FilterCondition to FilterNode array format
     */
    private convertFilterToNode(filter: Filter): FilterNode {
        const nodes: any[] = [];
        
        // Process logical operators first
        if (filter.$and) {
            const andNodes = filter.$and.map(f => this.convertFilterToNode(f));
            nodes.push(...this.interleaveWithOperator(andNodes, 'and'));
        }
        
        if (filter.$or) {
            const orNodes = filter.$or.map(f => this.convertFilterToNode(f));
            if (nodes.length > 0) {
                nodes.push('and');
            }
            nodes.push(...this.interleaveWithOperator(orNodes, 'or'));
        }
        
        // Note: $not operator is not currently supported in the legacy FilterNode format
        // Users should use $ne (not equal) instead for negation on specific fields
        if (filter.$not) {
            throw new Error('$not operator is not supported. Use $ne for field negation instead.');
        }
        
        // Process field conditions
        for (const [field, value] of Object.entries(filter)) {
            if (field.startsWith('$')) {
                continue; // Skip logical operators (already processed)
            }
            
            if (nodes.length > 0) {
                nodes.push('and');
            }
            
            // Handle field value
            if (value === null || value === undefined) {
                nodes.push([field, '=', value]);
            } else if (typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
                // Explicit operators - multiple operators on same field are AND-ed together
                const entries = Object.entries(value);
                for (let i = 0; i < entries.length; i++) {
                    const [op, opValue] = entries[i];
                    
                    // Add 'and' before each operator (except the very first node)
                    if (nodes.length > 0 || i > 0) {
                        nodes.push('and');
                    }
                    
                    const legacyOp = this.mapOperatorToLegacy(op);
                    nodes.push([field, legacyOp, opValue]);
                }
            } else {
                // Implicit equality
                nodes.push([field, '=', value]);
            }
        }
        
        return nodes.length === 1 ? nodes[0] : nodes;
    }
    
    /**
     * Interleaves filter nodes with a logical operator
     */
    private interleaveWithOperator(nodes: FilterNode[], operator: string): any[] {
        if (nodes.length === 0) return [];
        if (nodes.length === 1) return [nodes[0]];
        
        const result: any[] = [nodes[0]];
        for (let i = 1; i < nodes.length; i++) {
            result.push(operator, nodes[i]);
        }
        return result;
    }
    
    /**
     * Maps modern $-prefixed operators to legacy format
     */
    private mapOperatorToLegacy(operator: string): string {
        const mapping: Record<string, string> = {
            '$eq': '=',
            '$ne': '!=',
            '$gt': '>',
            '$gte': '>=',
            '$lt': '<',
            '$lte': '<=',
            '$in': 'in',
            '$nin': 'nin',
            '$contains': 'contains',
            '$startsWith': 'startswith',
            '$endsWith': 'endswith',
            '$null': 'is_null',
            '$exist': 'is_not_null',
            '$between': 'between',
        };
        
        return mapping[operator] || operator.replace('$', '');
    }

    /**
     * Translates ObjectQL UnifiedQuery to ObjectStack QueryAST format
     */
    private buildQueryAST(query: UnifiedQuery): QueryAST {
        const ast: QueryAST = {
            object: this.objectName,
        };

        // Map fields
        if (query.fields) {
            ast.fields = query.fields;
        }

        // Map filters
        if (query.filters) {
            ast.filters = this.translateFilters(query.filters);
        }

        // Map sort
        if (query.sort) {
            ast.sort = query.sort.map(([field, order]) => ({
                field,
                order: order as 'asc' | 'desc'
            }));
        }

        // Map pagination
        if (query.limit !== undefined) {
            ast.top = query.limit;
        }
        if (query.skip !== undefined) {
            ast.skip = query.skip;
        }

        // Map aggregations
        if (query.aggregate) {
            ast.aggregations = query.aggregate.map(agg => ({
                function: agg.func as any,
                field: agg.field,
                alias: agg.alias || `${agg.func}_${agg.field}`
            }));
        }

        // Map groupBy
        if (query.groupBy) {
            ast.groupBy = query.groupBy;
        }

        return ast;
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
            const fieldResults = await this.validator.validateField(
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

            const result = await this.validator.validate(schema.validation.rules, validationContext);
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
            if (fieldConfig.type === 'formula' && fieldConfig.formula) {
                const result = this.formulaEngine.evaluate(
                    fieldConfig.formula,
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
                            formula: fieldConfig.formula,
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
        const resultsWithFormulas = results.map(record => this.evaluateFormulas(record));
        
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
        const hookCtx: RetrievalHookContext = {
            ...this.context,
            objectName: this.objectName,
            operation: 'count',
            api: this.getHookAPI(),
            user: this.getUserFromContext(),
            state: {},
            query: filters
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
        const records = await this.find({ filters });
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
        const records = await this.find({ filters });
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
