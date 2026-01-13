import { ObjectQLContext, IObjectQL, ObjectConfig, Driver, UnifiedQuery, ActionContext, HookAPI, RetrievalHookContext, MutationHookContext, UpdateHookContext, ValidationContext, ValidationError, ValidationRuleResult } from '@objectql/types';
import { Validator } from './validator';

export class ObjectRepository {
    private validator: Validator;

    constructor(
        private objectName: string,
        private context: ObjectQLContext,
        private app: IObjectQL
    ) {
        this.validator = new Validator();
    }

    private getDriver(): Driver {
        const obj = this.getSchema();
        const datasourceName = obj.datasource || 'default';
        return this.app.datasource(datasourceName);
    }
    
    private getOptions(extra: any = {}) {
        return {
            transaction: this.context.transactionHandle,
            ...extra
        };
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

        // TODO: Apply basic filters like spaceId
        const results = await this.getDriver().find(this.objectName, hookCtx.query || {}, this.getOptions());
        
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
            
            const result = await this.getDriver().findOne(this.objectName, idOrQuery, hookCtx.query, this.getOptions());

            hookCtx.result = result;
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

        const result = await this.getDriver().count(this.objectName, hookCtx.query, this.getOptions());

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
        
        const result = await this.getDriver().create(this.objectName, finalDoc, this.getOptions());
        
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

        const result = await this.getDriver().update(this.objectName, id, hookCtx.data, this.getOptions(options));

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

        const result = await this.getDriver().delete(this.objectName, id, this.getOptions());

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
        
        if (!driver.createMany) {
            // Fallback
            const results = [];
            for (const item of data) {
                results.push(await this.create(item));
            }
            return results;
        }
        return driver.createMany(this.objectName, data, this.getOptions());
    }

    async updateMany(filters: any, data: any): Promise<any> {
        const driver = this.getDriver();
        if (!driver.updateMany) throw new Error("Driver does not support updateMany");
        return driver.updateMany(this.objectName, filters, data, this.getOptions());
    }

    async deleteMany(filters: any): Promise<any> {
        const driver = this.getDriver();
        if (!driver.deleteMany) throw new Error("Driver does not support deleteMany");
        return driver.deleteMany(this.objectName, filters, this.getOptions());
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
