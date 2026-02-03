/**
 * Mock for @objectstack/runtime
 * This mock is needed because the npm package has issues with Jest
 * and we want to focus on testing ObjectQL's logic, not the kernel integration.
 * 
 * For now, this mock delegates to the legacy driver to maintain backward compatibility
 * during the migration phase.
 */

// Simple mock implementations of runtime managers
class MockMetadataRegistry {
    private store = new Map<string, Map<string, any>>();
    
    register(type: string, item: any): void {
        if (!this.store.has(type)) {
            this.store.set(type, new Map());
        }
        const typeMap = this.store.get(type)!;
        typeMap.set(item.id || item.name, item);
    }
    
    get<T = any>(type: string, id: string): T | undefined {
        const typeMap = this.store.get(type);
        const item = typeMap?.get(id);
        return item?.content as T;
    }
    
    list<T = any>(type: string): T[] {
        const typeMap = this.store.get(type);
        if (!typeMap) return [];
        return Array.from(typeMap.values()).map(item => item.content as T);
    }
    
    unregister(type: string, id: string): boolean {
        const typeMap = this.store.get(type);
        if (!typeMap) return false;
        return typeMap.delete(id);
    }
    
    getTypes(): string[] {
        return Array.from(this.store.keys());
    }
    
    getEntry(type: string, id: string): any | undefined {
        const typeMap = this.store.get(type);
        return typeMap ? typeMap.get(id) : undefined;
    }
    
    unregisterPackage(packageName: string): void {
        // Simple implementation - in real runtime this would filter by package
        for (const [type, typeMap] of this.store.entries()) {
            const toDelete: string[] = [];
            for (const [id, item] of typeMap.entries()) {
                if (item.packageName === packageName || item.package === packageName) {
                    toDelete.push(id);
                }
            }
            toDelete.forEach(id => typeMap.delete(id));
        }
    }
}

class MockHookManager {
    removePackage(packageName: string): void {
        // Mock implementation
    }
    
    clear(): void {
        // Mock implementation
    }
}

class MockActionManager {
    removePackage(packageName: string): void {
        // Mock implementation
    }
    
    clear(): void {
        // Mock implementation
    }
}

export class ObjectKernel {
    public ql: unknown = null;
    public metadata: MockMetadataRegistry;
    public hooks: MockHookManager;
    public actions: MockActionManager;
    private plugins: any[] = [];
    private driver: any = null; // Will be set by the ObjectQL app
    
    constructor(plugins: any[] = []) {
        this.plugins = plugins;
        this.metadata = new MockMetadataRegistry();
        this.hooks = new MockHookManager();
        this.actions = new MockActionManager();
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
    
    async stop(): Promise<void> {
        // Mock implementation that calls plugin lifecycle methods
        for (const plugin of this.plugins) {
            if (plugin.onStop) {
                await plugin.onStop({ engine: this });
            }
        }
    }
    
    getDriver(): any {
        // Return the first driver-like plugin (typically MemoryDriver, SQLDriver, etc.)
        // Drivers usually don't have an 'install' method or have specific driver methods
        const driver = this.plugins.find(p => 
            p.constructor.name?.includes('Driver') || 
            (typeof p.find === 'function' && typeof p.create === 'function')
        );
        return driver || this.driver;
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
            // QueryAST uses 'offset', pass it through
            if (query.offset !== undefined) {
                unifiedQuery.offset = query.offset;
            }
            // Legacy support: also handle 'skip' if present
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
            const result = await this.driver.delete(objectName, id, {});
            return result > 0; // Driver returns count of deleted records
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

export class ObjectStackProtocolImplementation {}

export interface PluginContext {
    engine: ObjectKernel;
}

export interface ObjectQLPlugin {
    name: string;
    install?: (ctx: PluginContext) => void | Promise<void>;
    onStart?: (ctx: PluginContext) => void | Promise<void>;
}

// Export MetadataRegistry
export { MockMetadataRegistry as MetadataRegistry };

export interface MetadataItem {
    type: string;
    id: string;
    content: unknown;
    packageName?: string;
    path?: string;
    package?: string;
}
