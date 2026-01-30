/**
 * @objectstack/runtime
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Object Configuration
 */
export interface ObjectConfig {
    name: string;
    label?: string;
    fields?: Record<string, any>;
    [key: string]: any;
}

/**
 * MetadataRegistry - manages metadata items
 */
export interface MetadataRegistry {
    register(type: string, item: any): void;
    get<T = any>(type: string, id: string): T | undefined;
    list<T = any>(type: string): T[];
    unregister(type: string, id: string): boolean;
    getTypes(): string[];
    unregisterPackage(packageName: string): void;
}

/**
 * Driver Interface
 */
export interface Driver {
    find(objectName: string, query: any, options?: any): Promise<any[]>;
    findOne(objectName: string, id: string, fields?: any, options?: any): Promise<any>;
    create(objectName: string, data: any, options: any): Promise<any>;
    update(objectName: string, id: string, data: any, options: any): Promise<any>;
    delete(objectName: string, id: string, options: any): Promise<any>;
    count?(objectName: string, filters?: any, options?: any): Promise<number>;
}

/**
 * Loader Plugin Interface
 */
export interface LoaderPlugin {
    load(path: string): Promise<any>;
}

/**
 * Plugin Context - passed to plugin lifecycle methods
 */
export interface RuntimeContext {
    engine: ObjectKernel;
}

/**
 * Plugin Interface - defines the contract for kernel plugins
 */
export interface Plugin {
    name: string;
    version?: string;
    install?(ctx: RuntimeContext): void | Promise<void>;
    onStart?(ctx: RuntimeContext): void | Promise<void>;
    onStop?(ctx: RuntimeContext): void | Promise<void>;
}

/**
 * Application Config - declarative metadata manifest
 */
export interface RuntimeAppConfig {
    name: string;
    label?: string;
    description?: string;
    objects?: Record<string, ObjectConfig>;
    [key: string]: any;
}

/**
 * Driver Interface - simplified for runtime kernel
 */
export interface RuntimeDriver {
    name?: string;
    connect?(): Promise<void>;
    disconnect?(): Promise<void>;
    find(objectName: string, query: any, options?: any): Promise<any[]>;
    create(objectName: string, data: any, options: any): Promise<any>;
    update(objectName: string, id: string, data: any, options: any): Promise<any>;
    delete(objectName: string, id: string, options: any): Promise<any>;
    findOne(objectName: string, id: string, fields?: any, options?: any): Promise<any>;
}

/**
 * Component - anything loadable by the kernel
 */
export type Component = RuntimeAppConfig | RuntimeDriver | Plugin;

/**
 * Metadata Registry Manager
 */
class MetadataRegistryImpl implements MetadataRegistry {
    private store = new Map<string, Map<string, any>>();
    
    register(type: string, item: any): void {
        if (!this.store.has(type)) {
            this.store.set(type, new Map());
        }
        const typeMap = this.store.get(type)!;
        const id = item.id || item.name;
        typeMap.set(id, { content: item, id, type });
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
    
    unregisterPackage(packageName: string): void {
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

/**
 * Hook Manager
 */
class HookManager {
    private hooks = new Map<string, any[]>();
    
    register(hookName: string, objectName: string, handler: any, packageName?: string): void {
        if (!this.hooks.has(hookName)) {
            this.hooks.set(hookName, []);
        }
        this.hooks.get(hookName)!.push({ objectName, handler, packageName });
    }
    
    async trigger(hookName: string, objectName: string, context: any): Promise<void> {
        const handlers = this.hooks.get(hookName) || [];
        for (const entry of handlers) {
            if (entry.objectName === '*' || entry.objectName === objectName) {
                await entry.handler(context);
            }
        }
    }
    
    removePackage(packageName: string): void {
        for (const [hookName, handlers] of this.hooks.entries()) {
            this.hooks.set(hookName, handlers.filter(h => h.packageName !== packageName));
        }
    }
    
    clear(): void {
        this.hooks.clear();
    }
}

/**
 * Action Manager
 */
class ActionManager {
    private actions = new Map<string, any>();
    
    register(objectName: string, actionName: string, handler: any, packageName?: string): void {
        const key = `${objectName}.${actionName}`;
        this.actions.set(key, { handler, packageName });
    }
    
    async execute(objectName: string, actionName: string, context: any): Promise<any> {
        const key = `${objectName}.${actionName}`;
        const action = this.actions.get(key);
        if (!action) {
            throw new Error(`Action ${actionName} not found for object ${objectName}`);
        }
        return await action.handler(context);
    }
    
    get(objectName: string, actionName: string): any {
        const key = `${objectName}.${actionName}`;
        return this.actions.get(key)?.handler;
    }
    
    removePackage(packageName: string): void {
        const toDelete: string[] = [];
        for (const [key, action] of this.actions.entries()) {
            if (action.packageName === packageName) {
                toDelete.push(key);
            }
        }
        toDelete.forEach(key => this.actions.delete(key));
    }
    
    clear(): void {
        this.actions.clear();
    }
}

/**
 * ObjectKernel - The Micro-Kernel Runtime
 * 
 * Provides a minimal, composable runtime for ObjectStack applications.
 * Accepts heterogeneous components and orchestrates their lifecycle.
 */
export class ObjectKernel {
    public ql: any = null;
    public metadata: MetadataRegistry;
    public hooks: HookManager;
    public actions: ActionManager;
    
    private plugins: Plugin[] = [];
    private drivers: RuntimeDriver[] = [];
    private apps: RuntimeAppConfig[] = [];
    private driver: RuntimeDriver | null = null;
    
    constructor(components: Component[] = []) {
        this.metadata = new MetadataRegistryImpl();
        this.hooks = new HookManager();
        this.actions = new ActionManager();
        
        // Classify components
        for (const component of components) {
            if (this.isPlugin(component)) {
                this.plugins.push(component);
            } else if (this.isDriver(component)) {
                this.drivers.push(component);
                if (!this.driver) {
                    this.driver = component;
                }
            } else if (this.isAppConfig(component)) {
                this.apps.push(component);
            }
        }
    }
    
    private isPlugin(component: any): component is Plugin {
        return component && typeof component.name === 'string' && 
               (component.install || component.onStart || component.onStop);
    }
    
    private isDriver(component: any): component is RuntimeDriver {
        return component && typeof component.find === 'function';
    }
    
    private isAppConfig(component: any): component is RuntimeAppConfig {
        return component && typeof component.name === 'string' && 
               !this.isPlugin(component) && !this.isDriver(component);
    }
    
    /**
     * Method to set the driver for delegation
     */
    setDriver(driver: RuntimeDriver): void {
        this.driver = driver;
    }
    
    /**
     * Start the kernel - lifecycle orchestration
     */
    async start(): Promise<void> {
        // Phase 1: Load application manifests
        for (const app of this.apps) {
            if (app.objects) {
                for (const [name, config] of Object.entries(app.objects)) {
                    this.metadata.register('object', { ...config, name });
                }
            }
        }
        
        // Phase 2: Install plugins
        for (const plugin of this.plugins) {
            if (plugin.install) {
                await plugin.install({ engine: this });
            }
        }
        
        // Phase 3: Connect drivers
        for (const driver of this.drivers) {
            if (driver.connect) {
                await driver.connect();
            }
        }
        
        // Phase 4: Start plugins
        for (const plugin of this.plugins) {
            if (plugin.onStart) {
                await plugin.onStart({ engine: this });
            }
        }
    }
    
    /**
     * Stop the kernel
     */
    async stop(): Promise<void> {
        // Stop plugins
        for (const plugin of this.plugins) {
            if (plugin.onStop) {
                await plugin.onStop({ engine: this });
            }
        }
        
        // Disconnect drivers
        for (const driver of this.drivers) {
            if (driver.disconnect) {
                await driver.disconnect();
            }
        }
    }
    
    /**
     * Seed data
     */
    async seed(): Promise<void> {
        // Mock implementation
    }
    
    /**
     * CRUD operations - delegated to driver
     */
    async find(objectName: string, query: any): Promise<{ value: Record<string, any>[]; count: number }> {
        if (!this.driver) {
            return { value: [], count: 0 };
        }
        
        const results = await this.driver.find(objectName, query);
        return { value: results, count: results.length };
    }
    
    async get(objectName: string, id: string): Promise<Record<string, any>> {
        if (!this.driver) {
            return {};
        }
        return await this.driver.findOne(objectName, id);
    }
    
    async create(objectName: string, data: any): Promise<Record<string, any>> {
        if (!this.driver) {
            return data;
        }
        return await this.driver.create(objectName, data, {});
    }
    
    async update(objectName: string, id: string, data: any): Promise<Record<string, any>> {
        if (!this.driver) {
            return data;
        }
        return await this.driver.update(objectName, id, data, {});
    }
    
    async delete(objectName: string, id: string): Promise<boolean> {
        if (!this.driver) {
            return true;
        }
        await this.driver.delete(objectName, id, {});
        return true;
    }
    
    getMetadata(objectName: string): any {
        return this.metadata.get('object', objectName);
    }
    
    getView(objectName: string, viewType?: 'list' | 'form'): any {
        return null;
    }
    
    /**
     * Plugin registration (for dynamic plugin loading)
     */
    use(plugin: Plugin): void {
        this.plugins.push(plugin);
    }
}

/**
 * ObjectStackKernel - Alias for ObjectKernel
 */
export class ObjectStackKernel extends ObjectKernel {}

