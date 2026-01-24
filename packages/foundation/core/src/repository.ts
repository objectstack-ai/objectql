/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ObjectQLContext, IObjectQL, ObjectConfig, Driver, UnifiedQuery, ActionContext, TriggerContext, ValidationContext, ValidationError, ValidationRuleResult, FormulaContext, Filter } from '@objectql/types';
import type { ObjectStackKernel } from '@objectql/runtime';
import { Data } from '@objectstack/spec';
type QueryAST = Data.QueryAST;
type FilterNode = Data.FilterNode;
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

    private getTriggerAPI(): any {
        return {
            find: (obj: string, q?: any) => this.context.object(obj).find(q),
            findOne: (obj: string, id: string | number) => this.context.object(obj).findOne(id),
            count: (obj: string, q?: any) => this.context.object(obj).count(q),
            create: (obj: string, data: any) => this.context.object(obj).create(data),
            update: (obj: string, id: string | number, data: any) => this.context.object(obj).update(id, data),
            delete: (obj: string, id: string | number) => this.context.object(obj).delete(id)
        };
    }

    private getLogger(): any {
        // Simple logger implementation - can be enhanced later
        return {
            info: (...args: any[]) => console.log('[INFO]', ...args),
            error: (...args: any[]) => console.error('[ERROR]', ...args),
            warn: (...args: any[]) => console.warn('[WARN]', ...args),
            debug: (...args: any[]) => console.debug('[DEBUG]', ...args)
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
                    api: this.getTriggerAPI(),
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
                api: this.getTriggerAPI(),
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
            if (fieldConfig.type === 'formula' && fieldConfig.formula) {
                const result = this.getFormulaEngine().evaluate(
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
        // Build QueryAST and execute via kernel
        const ast = this.buildQueryAST(query);
        const kernelResult = await this.getKernel().find(this.objectName, ast);
        const results = kernelResult.value;
        
        // Evaluate formulas for each result
        const resultsWithFormulas = results.map((record: any) => this.evaluateFormulas(record));

        return resultsWithFormulas;
    }

    async findOne(idOrQuery: string | number | UnifiedQuery): Promise<any> {
        if (typeof idOrQuery === 'string' || typeof idOrQuery === 'number') {
            // Use kernel.get() for direct ID lookup
            const result = await this.getKernel().get(this.objectName, String(idOrQuery));

            // Evaluate formulas if result exists
            const resultWithFormulas = result ? this.evaluateFormulas(result) : result;

            return resultWithFormulas;
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
            query = { filters };
        } else if (filters && typeof filters === 'object' && (filters.fields || filters.sort || filters.limit !== undefined || filters.skip !== undefined)) {
            // It's already a UnifiedQuery object
            query = filters;
        } else if (filters) {
            // It's a raw filter object, wrap it
            query = { filters };
        } else {
            query = {};
        }

        // Build QueryAST and execute via kernel to get count
        const ast = this.buildQueryAST(query || {});
        const kernelResult = await this.getKernel().find(this.objectName, ast);
        const result = kernelResult.count;

        return result;
    }

    async create(doc: any): Promise<any> {
        // Build trigger context for before-insert trigger
        const errors: string[] = [];
        const triggerContext: Omit<TriggerContext, 'action' | 'timing'> = {
            doc: { ...doc },
            userId: this.context.userId || '',
            user: this.getUserFromContext() || { id: '' },
            ql: this.getTriggerAPI(),
            logger: this.getLogger(),
            addError: (message: string, field?: string) => {
                errors.push(field ? `${field}: ${message}` : message);
            },
            getOldValue: (fieldName: string) => undefined // No old values for insert
        };

        // Execute before-insert trigger
        await this.app.executeTrigger(this.objectName, 'create', 'before', triggerContext);
        
        // Check for trigger errors
        if (errors.length > 0) {
            throw new Error(`Trigger validation failed: ${errors.join('; ')}`);
        }

        // Use modified doc from trigger context
        const finalDoc = triggerContext.doc;
        
        if (this.context.userId) finalDoc.created_by = this.context.userId;
        if (this.context.spaceId) finalDoc.space_id = this.context.spaceId;
        
        // Validate the record before creating
        await this.validateRecord('create', finalDoc);
        
        // Execute via kernel
        const result = await this.getKernel().create(this.objectName, finalDoc);
        
        // Update context with result for after trigger
        triggerContext.doc = result as Record<string, any>;
        
        // Execute after-insert trigger
        await this.app.executeTrigger(this.objectName, 'create', 'after', triggerContext);
        
        return triggerContext.doc as any;
    }

    async update(id: string | number, doc: any, options?: any): Promise<any> {
        const previousData = await this.findOne(id);
        
        // Build trigger context for before-update trigger
        const errors: string[] = [];
        const triggerContext: Omit<TriggerContext, 'action' | 'timing'> = {
            doc: { ...doc },
            previousDoc: previousData,
            userId: this.context.userId || '',
            user: this.getUserFromContext() || { id: '' },
            ql: this.getTriggerAPI(),
            logger: this.getLogger(),
            addError: (message: string, field?: string) => {
                errors.push(field ? `${field}: ${message}` : message);
            },
            getOldValue: (fieldName: string) => previousData ? previousData[fieldName] : undefined
        };

        // Execute before-update trigger
        await this.app.executeTrigger(this.objectName, 'update', 'before', triggerContext);
        
        // Check for trigger errors
        if (errors.length > 0) {
            throw new Error(`Trigger validation failed: ${errors.join('; ')}`);
        }

        // Validate the update
        await this.validateRecord('update', triggerContext.doc, previousData);

        // Execute via kernel
        const result = await this.getKernel().update(this.objectName, String(id), triggerContext.doc);

        // Update context with result for after trigger
        triggerContext.doc = result as Record<string, any>;
        
        // Execute after-update trigger
        await this.app.executeTrigger(this.objectName, 'update', 'after', triggerContext);
        
        return triggerContext.doc as any;
    }

    async delete(id: string | number): Promise<any> {
        const previousData = await this.findOne(id);
        
        // Build trigger context for before-delete trigger
        const errors: string[] = [];
        const triggerContext: Omit<TriggerContext, 'action' | 'timing'> = {
            doc: previousData || {},
            previousDoc: previousData,
            userId: this.context.userId || '',
            user: this.getUserFromContext() || { id: '' },
            ql: this.getTriggerAPI(),
            logger: this.getLogger(),
            addError: (message: string, field?: string) => {
                errors.push(field ? `${field}: ${message}` : message);
            },
            getOldValue: (fieldName: string) => previousData ? previousData[fieldName] : undefined
        };

        // Execute before-delete trigger
        await this.app.executeTrigger(this.objectName, 'delete', 'before', triggerContext);
        
        // Check for trigger errors
        if (errors.length > 0) {
            throw new Error(`Trigger validation failed: ${errors.join('; ')}`);
        }

        // Execute via kernel
        const result = await this.getKernel().delete(this.objectName, String(id));

        // Execute after-delete trigger
        await this.app.executeTrigger(this.objectName, 'delete', 'after', triggerContext);
        
        return result;
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
        const api = this.getTriggerAPI();

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
