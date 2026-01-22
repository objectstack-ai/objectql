/**
 * Mock for @objectstack/runtime
 * This mock is needed because the npm package has issues with Jest
 * and we want to focus on testing ObjectQL's logic, not the kernel integration.
 * 
 * For now, this mock delegates to the legacy driver to maintain backward compatibility
 * during the migration phase.
 */

export class ObjectStackKernel {
    public ql: unknown = null;
    private plugins: any[] = [];
    private driver: any = null; // Will be set by the ObjectQL app
    
    constructor(plugins: any[] = []) {
        this.plugins = plugins;
    }
    
    // Method to set the driver for delegation during migration
    setDriver(driver: any): void {
        this.driver = driver;
    }
    
    async start(): Promise<void> {
        // Mock implementation that calls plugin lifecycle methods
        for (const plugin of this.plugins) {
            if (plugin.install) {
                await plugin.install({ engine: this });
            }
        }
        for (const plugin of this.plugins) {
            if (plugin.onStart) {
                await plugin.onStart({ engine: this });
            }
        }
    }
    
    async seed(): Promise<void> {
        // Mock implementation
    }
    
    async find(objectName: string, query: any): Promise<{ value: Record<string, any>[]; count: number }> {
        // Delegate to driver during migration phase
        if (this.driver) {
            // Convert QueryAST back to UnifiedQuery format for driver
            const unifiedQuery: any = {};
            
            if (query.fields) {
                unifiedQuery.fields = query.fields;
            }
            if (query.filters) {
                unifiedQuery.filters = query.filters;
            }
            if (query.sort) {
                unifiedQuery.sort = query.sort.map((s: any) => [s.field, s.order]);
            }
            if (query.top !== undefined) {
                unifiedQuery.limit = query.top;
            }
            if (query.skip !== undefined) {
                unifiedQuery.skip = query.skip;
            }
            if (query.aggregations) {
                unifiedQuery.aggregate = query.aggregations.map((agg: any) => ({
                    func: agg.function,
                    field: agg.field,
                    alias: agg.alias
                }));
            }
            if (query.groupBy) {
                unifiedQuery.groupBy = query.groupBy;
            }
            
            const results = await this.driver.find(objectName, unifiedQuery, {});
            return { value: results, count: results.length };
        }
        return { value: [], count: 0 };
    }
    
    async get(objectName: string, id: string): Promise<Record<string, any>> {
        // Delegate to driver during migration phase
        if (this.driver) {
            return await this.driver.findOne(objectName, id, {}, {});
        }
        return {};
    }
    
    async create(objectName: string, data: any): Promise<Record<string, any>> {
        // Delegate to driver during migration phase
        if (this.driver) {
            return await this.driver.create(objectName, data, {});
        }
        return data;
    }
    
    async update(objectName: string, id: string, data: any): Promise<Record<string, any>> {
        // Delegate to driver during migration phase
        if (this.driver) {
            return await this.driver.update(objectName, id, data, {});
        }
        return data;
    }
    
    async delete(objectName: string, id: string): Promise<boolean> {
        // Delegate to driver during migration phase
        if (this.driver) {
            await this.driver.delete(objectName, id, {});
            return true;
        }
        return true;
    }
    
    getMetadata(objectName: string): any {
        return {};
    }
    
    getView(objectName: string, viewType?: 'list' | 'form'): any {
        return null;
    }
}

export class ObjectStackRuntimeProtocol {}

export interface RuntimeContext {
    engine: ObjectStackKernel;
}

export interface RuntimePlugin {
    name: string;
    install?: (ctx: RuntimeContext) => void | Promise<void>;
    onStart?: (ctx: RuntimeContext) => void | Promise<void>;
}
