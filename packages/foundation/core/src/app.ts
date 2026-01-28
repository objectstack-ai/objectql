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
import { ObjectKernel, type Plugin } from '@objectstack/runtime';
import { ObjectQL as RuntimeObjectQL, SchemaRegistry } from '@objectstack/objectql';
import { ObjectRepository } from './repository';
import { ObjectQLPlugin } from './plugin';
import { convertIntrospectedSchemaToObjects } from './util';

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

        // Add the ObjectQL plugin to provide enhanced features
        this.use(new ObjectQLPlugin({
            datasources: this.datasources
        }, this.ql));

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
        this.kernel = new (ObjectKernel as any)(this.kernelPlugins);

        // Stub legacy accessors
        (this.kernel as any).metadata = {
            register: (type: string, item: any) => SchemaRegistry.registerItem(type, item),
            get: (type: string, name: string) => SchemaRegistry.getItem(type, name),
            list: (type: string) => SchemaRegistry.listItems(type),
            unregister: (type: string, name: string) => console.warn('unregister not impl', type, name),
            unregisterPackage: (name: string) => console.warn('unregisterPackage not impl', name)
        };
        (this.kernel as any).hooks = {
            register: (event: string, objectName: string, handler: any) => {
                // TODO: Map to ObjectQL hooks properly
                this.ql.registerHook(`${event}:${objectName}`, handler);
            },
            removePackage: () => {},
            trigger: () => Promise.resolve()
        };
        (this.kernel as any).actions = {
            register: () => {},
            removePackage: () => {},
            execute: () => Promise.resolve()
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
        return (this.kernel as any).metadata.get('object', name) as ObjectConfig;
    }

    getConfigs(): Record<string, ObjectConfig> {
        const result: Record<string, ObjectConfig> = {};
        const items = (this.kernel as any).metadata.list('object') as ObjectConfig[];
        for (const item of items) {
            result[item.name] = item;
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
        }
        
        // TEMPORARY: Set driver for backward compatibility during migration
        // This allows the kernel mock to delegate to the driver
        if (typeof (this.kernel as any).setDriver === 'function') {
            const defaultDriver = this.datasources['default'];
            if (defaultDriver) {
                (this.kernel as any).setDriver(defaultDriver);
            }
        }

        // Load In-Memory Objects (Dynamic Layer)
        if (this.config.objects) {
            for (const [key, obj] of Object.entries(this.config.objects)) {
                this.registerObject(obj);
            }
        }

        const objects = (this.kernel as any).metadata.list('object') as ObjectConfig[];
        
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
            // Expected format:
            // 1. { object: 'User', records: [...] }
            // 2. [ record1, record2 ] (with name property added by loader inferred from filename)
            
            let objectName = entry.object;
            let records = entry.records;

            if (Array.isArray(entry)) {
                records = entry;
                if (!objectName && (entry as any).name) {
                    objectName = (entry as any).name;
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
