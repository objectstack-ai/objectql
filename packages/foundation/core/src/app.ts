/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { 
    MetadataRegistry,
    MetadataItem,
    Driver, 
    ObjectConfig, 
    ObjectQLContext, 
    ObjectQLContextOptions, 
    IObjectQL, 
    ObjectQLConfig,
    HookName,
    HookHandler,
    HookContext,
    ActionHandler,
    ActionContext,
    LoaderPlugin
} from '@objectql/types';
import { ObjectKernel, type Plugin } from '@objectstack/core';
import { ObjectQL as RuntimeObjectQL, SchemaRegistry } from '@objectstack/objectql';
import { ObjectRepository } from './repository';
import { convertIntrospectedSchemaToObjects } from './util';
import { CompiledHookManager } from './optimizations/CompiledHookManager';

/**
 * ObjectQL
 * 
 * ObjectQL implementation that wraps ObjectKernel
 * to provide the plugin architecture.
 */
export class ObjectQL implements IObjectQL {
    // Delegate to kernel for metadata, hooks, and actions
    public get metadata(): MetadataRegistry {
        return (this.kernel as any).metadata;
    }
    
    private datasources: Record<string, Driver> = {};
    private remotes: string[] = [];
    
    // ObjectStack Kernel Integration
    private kernel!: ObjectKernel & Record<string, any>;
    private ql: any;
    private kernelPlugins: any[] = [];
    
    // Optimized managers
    private hookManager = new CompiledHookManager();
    private localActions = new Map<string, any>();
    
    // Store config for lazy loading in init()
    private config: ObjectQLConfig;

    constructor(config: ObjectQLConfig) {
        this.config = config;
        this.datasources = config.datasources || {};
        
        if (config.connection) {
             throw new Error("Connection strings are not supported in core directly. Use @objectql/platform-node's createDriverFromConnection or pass a driver instance to 'datasources'.");
        }

        // Use the imported RuntimeObjectQL, assuming it works as intended
        this.ql = new RuntimeObjectQL(); 

        // Note: ObjectQLPlugin removed as it now uses RuntimePlugin interface
        // which is incompatible with the legacy Plugin interface from @objectstack/core
        // For new code, use the microkernel pattern with RuntimePlugin directly
        
        // Add runtime plugins from config
        if (config.plugins) {
            for (const plugin of config.plugins) {
                if (typeof plugin === 'string') {
                    throw new Error("String plugins are not supported in core. Use @objectql/platform-node or pass plugin instance.");
                } else {
                    this.use(plugin as any);
                }
            }
        }
        
        // Create the kernel with registered plugins
        this.kernel = new (ObjectKernel as any)();
        for (const plugin of this.kernelPlugins) {
             if ((this.kernel as any).use) {
                 (this.kernel as any).use(plugin);
             }
        }

        // Helper to unwrap content property (matching MetadataRegistry behavior)
        const unwrapContent = (item: any) => {
            if (item && item.content) {
                return item.content;
            }
            return item;
        };

        // Stub legacy accessors
        (this.kernel as any).metadata = {
            register: (type: string, item: any) => SchemaRegistry.registerItem(type, item, item.id ? 'id' : 'name'),
            get: (type: string, name: string) => {
                const item = SchemaRegistry.getItem(type, name) as any;
                return unwrapContent(item);
            },
            getEntry: (type: string, name: string) => SchemaRegistry.getItem(type, name),
            list: (type: string) => {
                const items = SchemaRegistry.listItems(type);
                return items.map(unwrapContent);
            },
            unregister: (type: string, name: string) => {
                 // Use the official unregisterItem API when available (added in @objectstack/objectql v0.9.2)
                 // Fallback to direct metadata access for older versions or test mocks
                 if (typeof SchemaRegistry.unregisterItem === 'function') {
                     SchemaRegistry.unregisterItem(type, name);
                 } else {
                     // Fallback: try to access metadata Map directly
                     const metadata = (SchemaRegistry as any).metadata;
                     if (metadata && metadata instanceof Map) {
                         const collection = metadata.get(type);
                         if (collection && collection instanceof Map) {
                             collection.delete(name);
                         }
                     }
                 }
            },
            unregisterPackage: (packageName: string) => {
                 const metadata = (SchemaRegistry as any).metadata;
                 if (metadata && metadata instanceof Map) {
                     for (const [type, collection] of metadata.entries()) {
                         if (collection instanceof Map) {
                             for (const [key, item] of collection.entries()) {
                                 // console.log(`[App] Check ${type} ${key} pkg=${(item as any).package}`);
                                 if ((item as any).package === packageName) {
                                     collection.delete(key);
                                 }
                             }
                         }
                     }
                 } else {
                     console.warn('Metadata is not a Map');
                 }
            }
        };
        const kernelHooks = (this.kernel as any).hooks || {};
        Object.assign(kernelHooks, {
            register: (event: string, objectName: string, handler: any, packageName?: string) => {
                this.hookManager.registerHook(event, objectName, handler, packageName);
            },
            removePackage: (packageName: string) => {
                this.hookManager.removePackage(packageName);
            },
            trigger: async (event: string, objectName: string, ctx: any) => {
                await this.hookManager.runHooks(event, objectName, ctx);
            }
        });
        if (!(this.kernel as any).hooks) {
            (this.kernel as any).hooks = kernelHooks;
        }
        (this.kernel as any).actions = {
            register: (objectName: string, actionName: string, handler: any, packageName?: string) => {
                const key = `${objectName}:${actionName}`;
                (handler as any)._package = packageName;
                this.localActions.set(key, handler);
            },
            removePackage: (packageName: string) => {
                for (const [key, handler] of this.localActions.entries()) {
                    if ((handler as any)._package === packageName) {
                        this.localActions.delete(key);
                    }
                }
            },
            execute: async (objectName: string, actionName: string, ctx: any) => {
                const handler = this.localActions.get(`${objectName}:${actionName}`);
                if (handler) {
                    return handler(ctx);
                }
                throw new Error(`Action '${actionName}' on object '${objectName}' not found`);
            }
        };
        
        // Register initial metadata if provided
        if (config.registry) {
            // Copy metadata from provided registry to kernel's registry
            for (const type of config.registry.getTypes()) {
                const items = config.registry.list(type);
                for (const item of items) {
                    // Safely extract the item's id/name
                    const itemId = typeof item === 'object' && item !== null 
                        ? (item as { name?: string; id?: string }).name || (item as { name?: string; id?: string }).id || 'unknown'
                        : 'unknown';
                    
                    (this.kernel as any).metadata.register(type, {
                        type,
                        id: itemId,
                        content: item
                    });
                }
            }
        }
    }
    
    use(plugin: Plugin) {
        this.kernelPlugins.push(plugin);
        if (this.kernel && (this.kernel as any).use) {
            (this.kernel as any).use(plugin);
        }
    }

    removePackage(name: string) {
        // Delegate to kernel managers
        (this.kernel as any).metadata.unregisterPackage(name);
        (this.kernel as any).hooks.removePackage(name);
        (this.kernel as any).actions.removePackage(name);
    }

    on(event: HookName, objectName: string, handler: HookHandler, packageName?: string) {
        // Delegate to kernel hook manager
        // We wrap the handler to bridge ObjectQL's rich context types with runtime's base types
        // The runtime HookContext supports all fields via index signature, so this is safe
        const wrappedHandler = handler as unknown as any;
        (this.kernel as any).hooks.register(event, objectName, wrappedHandler, packageName);
    }

    async triggerHook(event: HookName, objectName: string, ctx: HookContext) {
        // Delegate to kernel hook manager
        // Runtime HookContext supports ObjectQL-specific fields via index signature
        await (this.kernel as any).hooks.trigger(event, objectName, ctx);
    }

    registerAction(objectName: string, actionName: string, handler: ActionHandler, packageName?: string) {
        // Delegate to kernel action manager
        // We wrap the handler to bridge ObjectQL's rich context types with runtime's base types
        // The runtime ActionContext supports all fields via index signature, so this is safe
        const wrappedHandler = handler as unknown as any;
        (this.kernel as any).actions.register(objectName, actionName, wrappedHandler, packageName);
    }

    async executeAction(objectName: string, actionName: string, ctx: ActionContext) {
        // Delegate to kernel action manager
        // Runtime ActionContext supports ObjectQL-specific fields via index signature
        return await (this.kernel as any).actions.execute(objectName, actionName, ctx);
    }

    createContext(options: ObjectQLContextOptions): ObjectQLContext {
        const ctx: ObjectQLContext = {
            userId: options.userId,
            spaceId: options.spaceId,
            roles: options.roles || [],
            isSystem: options.isSystem,
            object: (name: string) => {
                return new ObjectRepository(name, ctx, this);
            },
            transaction: async (callback: (ctx: ObjectQLContext) => Promise<any>) => {
                 const driver = this.datasources['default'];
                 if (!driver || !driver.beginTransaction) {
                      return callback(ctx);
                 }

                 let trx: any;
                 try {
                     trx = await driver.beginTransaction();
                 } catch (e) {
                     throw e;
                 }

                 const trxCtx: ObjectQLContext = {
                     ...ctx,
                     transactionHandle: trx,
                     transaction: async (cb: (ctx: ObjectQLContext) => Promise<any>) => cb(trxCtx)
                 };

                 try {
                     const result = await callback(trxCtx);
                     if (driver.commitTransaction) await driver.commitTransaction(trx);
                     return result;
                 } catch (error) {
                     if (driver.rollbackTransaction) await driver.rollbackTransaction(trx);
                     throw error;
                 }
            },
            sudo: () => {
                 return this.createContext({ ...options, isSystem: true });
            }
        };
        return ctx;
    }

    /**
     * Get the underlying ObjectKernel instance
     * 
     * This provides access to the kernel for advanced usage scenarios
     * where you need direct access to the plugin architecture.
     * 
     * @returns The ObjectKernel instance
     * @throws Error if called before init()
     */
    getKernel(): ObjectKernel {
        if (!this.kernel) {
            throw new Error('Kernel not initialized. Call init() first.');
        }
        return this.kernel;
    }

    registerObject(object: ObjectConfig) {
        // Normalize fields
        if (object.fields) {
            for (const [key, field] of Object.entries(object.fields)) {
                if (field && !field.name) {
                    field.name = key;
                }
            }
        }
        (this.kernel as any).metadata.register('object', object);
    }

    unregisterObject(name: string) {
        (this.kernel as any).metadata.unregister('object', name);
    }

    getObject(name: string): ObjectConfig | undefined {
        const item = (this.kernel as any).metadata.get('object', name);
        return item?.content || item;
    }

    getConfigs(): Record<string, ObjectConfig> {
        const result: Record<string, ObjectConfig> = {};
        const items = (this.kernel as any).metadata.list('object') || [];
        for (const item of items) {
            const config = item.content || item;
            if (config?.name) {
                result[config.name] = config;
            }
        }
        return result;
    }

    datasource(name: string): Driver {
        const driver = this.datasources[name];
        if (!driver) {
            throw new Error(`Datasource '${name}' not found`);
        }
        return driver;
    }

    /**
     * Introspect the database schema and automatically register objects.
     * This allows connecting to an existing database without defining metadata.
     * 
     * @param datasourceName - The name of the datasource to introspect (default: 'default')
     * @param options - Optional configuration for schema conversion
     * @returns Array of registered ObjectConfig
     */
    async introspectAndRegister(
        datasourceName: string = 'default',
        options?: {
            excludeTables?: string[];
            includeTables?: string[];
            skipSystemColumns?: boolean;
        }
    ): Promise<ObjectConfig[]> {
        const driver = this.datasource(datasourceName);
        
        if (!driver.introspectSchema) {
            throw new Error(`Driver for datasource '${datasourceName}' does not support schema introspection`);
        }
        
        console.log(`Introspecting datasource '${datasourceName}'...`);
        const introspectedSchema = await driver.introspectSchema();
        
        // Convert introspected schema to ObjectQL objects
        const objects = convertIntrospectedSchemaToObjects(introspectedSchema, options);
        
        console.log(`Discovered ${objects.length} table(s), registering as objects...`);
        
        // Register each discovered object
        for (const obj of objects) {
            this.registerObject(obj);
        }
        
        return objects;
    }

    async close() {
        for (const [name, driver] of Object.entries(this.datasources)) {
            if (driver.disconnect) {
                console.log(`Closing driver '${name}'...`);
                await driver.disconnect();
            }
        }
    }

    async init() {
        console.log('[ObjectQL] Initializing with ObjectKernel...');
        
        // Start the kernel - this will install and start all plugins
        if ((this.kernel as any).start) {
            await (this.kernel as any).start();
        } else if ((this.kernel as any).bootstrap) {
            await (this.kernel as any).bootstrap();
        } else {
             console.warn('ObjectKernel does not have start() or bootstrap() method');
             
             // Manually initialize plugins if kernel doesn't support lifecycle
             for (const plugin of this.kernelPlugins) {
                 try {
                     if (typeof (plugin as any).init === 'function') {
                         await (plugin as any).init();
                     }
                     if (typeof (plugin as any).start === 'function') {
                         await (plugin as any).start();
                     }
                 } catch (error) {
                     console.error(`Failed to initialize plugin ${(plugin as any).name || 'unknown'}:`, error);
                     // Continue with other plugins even if one fails
                 }
             }
        }
        
        // TEMPORARY: Set driver for backward compatibility during migration
        // This allows the kernel mock to delegate to the driver
        const defaultDriver = this.datasources['default'];
        if (typeof (this.kernel as any).setDriver === 'function') {
            if (defaultDriver) {
                (this.kernel as any).setDriver(defaultDriver);
            }
        }

        // TEMPORARY: Patch kernel with CRUD methods dynamically if missing
        // This ensures the repository can delegate to the kernel even if using the new @objectstack/core kernel
        if (typeof (this.kernel as any).create !== 'function' && defaultDriver) {
             (this.kernel as any).create = (object: string, doc: any, options: any) => defaultDriver.create(object, doc, options);
             (this.kernel as any).update = (object: string, id: any, doc: any, options: any) => defaultDriver.update(object, id, doc, options);
             (this.kernel as any).delete = (object: string, id: any, options: any) => defaultDriver.delete(object, id, options);
             (this.kernel as any).find = async (object: string, query: any, options: any) => {
                 const res = await defaultDriver.find(object, query, options);
                 return { value: res || [], count: (res || []).length };
             };
             (this.kernel as any).findOne = (object: string, id: any, options: any) => defaultDriver.findOne(object, id, options);
             (this.kernel as any).get = (object: string, id: any) => defaultDriver.findOne(object, id); 
             (this.kernel as any).count = (object: string, query: any, options: any) => defaultDriver.count(object, query, options);
        }

        // Load In-Memory Objects (Dynamic Layer)
        if (this.config.objects) {
            for (const [key, obj] of Object.entries(this.config.objects)) {
                this.registerObject(obj);
            }
        }

        const registryItems = (this.kernel as any).metadata.list('object');
        const objects = (registryItems || []).map((item: any) => item.content || item) as ObjectConfig[];
        
        // Init Datasources
        // Let's pass all objects to all configured drivers.
        for (const [name, driver] of Object.entries(this.datasources)) {
            if (driver.init) {
                console.log(`Initializing driver '${name}'...`);
                await driver.init(objects);
            }
        }

        // Process Initial Data
        await this.processInitialData();
        
        console.log('[ObjectQL] Initialization complete');
    }

    private async processInitialData() {
        const dataEntries = (this.kernel as any).metadata.list('data');
        if (dataEntries.length === 0) return;

        console.log(`Processing ${dataEntries.length} initial data files...`);
        
        // We need a system context to write data
        const ctx = this.createContext({ isSystem: true });

        for (const entry of dataEntries) {
            // Unwrapping metadata content if present
            const dataContent = (entry as any).content || entry;

            // Expected format:
            // 1. { object: 'User', records: [...] }
            // 2. [ record1, record2 ] (with name property added by loader inferred from filename)
            
            let objectName = dataContent.object;
            let records = dataContent.records;

            if (Array.isArray(dataContent)) {
                records = dataContent;
                if (!objectName && (dataContent as any).name) {
                    objectName = (dataContent as any).name;
                }
            }

            if (!objectName || !records || !Array.isArray(records)) {
                console.warn(`Skipping invalid data entry:`, entry);
                continue;
            }

            const repo = ctx.object(objectName);
            
            for (const record of records) {
                try {
                    // Check existence if a unique key is provided?
                    // For now, let's assume if it has an ID, we check it.
                    // Or we could try to find existing record by some key matching logic.
                    // Simple approach: create. If it fails (constraint), ignore.
                    
                    // Actually, a better approach for initial data is "upsert" or "create if not exists".
                    // But without unique keys defined in data, we can't reliably dedup.
                    // Let's try to 'create' and catch errors.
                    await repo.create(record);
                    console.log(`Initialized record for ${objectName}`);
                } catch (e: any) {
                    // Ignore duplicate key errors silently-ish
                     console.warn(`Failed to insert initial data for ${objectName}: ${e.message}`);
                }
            }
        }
    }
}
