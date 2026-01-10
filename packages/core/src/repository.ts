import { ObjectQLContext, IObjectQL, ObjectConfig, Driver, UnifiedQuery, HookContext } from '@objectql/types';

export class ObjectRepository {
    constructor(
        private objectName: string,
        private context: ObjectQLContext,
        private app: IObjectQL
    ) {}

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

    async find(query: UnifiedQuery = {}): Promise<any[]> {
        const hookCtx: HookContext = {
            ...this.context,
            objectName: this.objectName,
            query
        };
        await this.app.triggerHook('beforeFind', this.objectName, hookCtx);

        // TODO: Apply basic filters like spaceId
        const results = await this.getDriver().find(this.objectName, hookCtx.query || {}, this.getOptions());
        
        hookCtx.result = results;
        await this.app.triggerHook('afterFind', this.objectName, hookCtx);

        return hookCtx.result;
    }

    async findOne(idOrQuery: string | number | UnifiedQuery): Promise<any> {
        if (typeof idOrQuery === 'string' || typeof idOrQuery === 'number') {
            const hookCtx: HookContext = {
                ...this.context,
                objectName: this.objectName,
                id: idOrQuery,
                query: {}
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
        const hookCtx: HookContext = {
            ...this.context,
            objectName: this.objectName,
            query: filters
        };
        await this.app.triggerHook('beforeCount', this.objectName, hookCtx);

        const result = await this.getDriver().count(this.objectName, hookCtx.query, this.getOptions());

        hookCtx.result = result;
        await this.app.triggerHook('afterCount', this.objectName, hookCtx);
        return hookCtx.result;
    }

    async create(doc: any): Promise<any> {
        const hookCtx: HookContext = {
            ...this.context,
            objectName: this.objectName,
            doc
        };
        await this.app.triggerHook('beforeCreate', this.objectName, hookCtx);
        const finalDoc = hookCtx.doc;

        const obj = this.getSchema();
        if (this.context.userId) finalDoc.created_by = this.context.userId;
        if (this.context.spaceId) finalDoc.space_id = this.context.spaceId;
        
        const result = await this.getDriver().create(this.objectName, finalDoc, this.getOptions());
        
        hookCtx.result = result;
        await this.app.triggerHook('afterCreate', this.objectName, hookCtx);
        return hookCtx.result;
    }

    async update(id: string | number, doc: any, options?: any): Promise<any> {
        const hookCtx: HookContext = {
            ...this.context,
            objectName: this.objectName,
            id,
            doc
        };
        await this.app.triggerHook('beforeUpdate', this.objectName, hookCtx);

        const result = await this.getDriver().update(this.objectName, id, hookCtx.doc, this.getOptions(options));

        hookCtx.result = result;
        await this.app.triggerHook('afterUpdate', this.objectName, hookCtx);
        return hookCtx.result;
    }

    async delete(id: string | number): Promise<any> {
        const hookCtx: HookContext = {
            ...this.context,
            objectName: this.objectName,
            id
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
}
