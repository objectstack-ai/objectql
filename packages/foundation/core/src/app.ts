/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { 
    MetadataRegistry,
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
    Logger,
    ConsoleLogger,
    ObjectQLError
} from '@objectql/types';
import { ObjectKernel, type Plugin } from '@objectstack/runtime';
import { ObjectQL as RuntimeObjectQL, SchemaRegistry } from '@objectstack/objectql';
import { ValidatorPlugin } from '@objectql/plugin-validator';
import { FormulaPlugin } from '@objectql/plugin-formula';
import { CompiledHookManager } from '@objectql/plugin-optimizations';
import { ObjectRepository } from './repository';
import { convertIntrospectedSchemaToObjects } from './util';

/**
 * Internal bridge interface for the ObjectKernel.
 * Provides typed access to kernel properties that are dynamically assigned,
 * avoiding `as any` casts throughout the codebase.
 */
interface KernelBridge {
    metadata: {
        register(type: string, item: Record<string, unknown>): void;
        get(type: string, name: string): Record<string, unknown> | undefined;
        getEntry(type: string, name: string): unknown;
        list(type: string): Array<Record<string, unknown>>;
        unregister(type: string, name: string): void;
        unregisterPackage(packageName: string): void;
    };
    hooks: {
        register(event: string, objectName: string, handler: HookHandler, packageName?: string): void;
        removePackage(packageName: string): void;
        trigger(event: string, objectName: string, ctx: HookContext): Promise<void>;
    };
    actions: {
        register(objectName: string, actionName: string, handler: ActionHandler, packageName?: string): void;
        removePackage(packageName: string): void;
        execute(objectName: string, actionName: string, ctx: ActionContext): Promise<unknown>;
    };
    // CRUD methods dynamically assigned during init()
    create?(objectName: string, doc: Record<string, unknown>, options?: Record<string, unknown>): Promise<unknown>;
    update?(objectName: string, id: string, doc: Record<string, unknown>, options?: Record<string, unknown>): Promise<unknown>;
    delete?(objectName: string, id: string, options?: Record<string, unknown>): Promise<unknown>;
    find?(objectName: string, query: Record<string, unknown>, options?: Record<string, unknown>): Promise<{ value: Record<string, unknown>[]; count: number }>;
    findOne?(objectName: string, id: string, options?: Record<string, unknown>): Promise<Record<string, unknown> | null>;
    get?(objectName: string, id: string): Promise<Record<string, unknown> | null>;
    count?(objectName: string, query: Record<string, unknown>, options?: Record<string, unknown>): Promise<number>;
    setDriver?(driver: Driver): void;
    start?(): Promise<void>;
    bootstrap?(): Promise<void>;
    use?(plugin: Plugin): void;
    queryService?: Record<string, unknown>;
    getAllDrivers?(): Driver[];
}

/**
 * ObjectQL
 * 
 * ObjectQL implementation that wraps ObjectKernel
 * to provide the plugin architecture.
 */
export class ObjectQL implements IObjectQL {
    // Delegate to kernel for metadata, hooks, and actions
    public get metadata(): MetadataRegistry {
        return this.bridge.metadata as unknown as MetadataRegistry;
    }
    
    private datasources: Record<string, Driver> = {};
    private remotes: string[] = [];
    
    // ObjectStack Kernel Integration
    private kernel!: ObjectKernel;
    private bridge!: KernelBridge;
    private ql: RuntimeObjectQL;
    private kernelPlugins: Plugin[] = [];
    
    // Optimized managers
    private hookManager = new CompiledHookManager();
    private localActions = new Map<string, ActionHandler & { _package?: string }>();
    
    // Structured logger
    private logger: Logger;
    
    // Store config for lazy loading in init()
    private config: ObjectQLConfig;

    constructor(config: ObjectQLConfig) {
        this.config = config;
        this.datasources = config.datasources || {};
        this.logger = config.logger ?? new ConsoleLogger({ name: '@objectql/core', level: 'info' });
        
        if (config.connection) {
             throw new ObjectQLError({ code: 'CONFIG_ERROR', message: "Connection strings are not supported in core directly. Use @objectql/platform-node's createDriverFromConnection or pass a driver instance to 'datasources'." });
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
                    throw new ObjectQLError({ code: 'CONFIG_ERROR', message: "String plugins are not supported in core. Use @objectql/platform-node or pass plugin instance." });
                } else {
                    this.use(plugin as unknown as Plugin);
                }
            }
        }
        
        // Ensure default plugins are present
        if (!this.kernelPlugins.some(p => p.name === 'validator')) {
            this.use(new ValidatorPlugin());
        }
        if (!this.kernelPlugins.some(p => p.name === 'formula')) {
            this.use(new FormulaPlugin());
        }
        
        // Create the kernel with registered plugins
        const KernelConstructor = ObjectKernel as unknown as new (plugins: Plugin[]) => ObjectKernel;
        this.kernel = new KernelConstructor(this.kernelPlugins);
        this.bridge = this.kernel as unknown as KernelBridge;
        for (const plugin of this.kernelPlugins) {
             if (this.bridge.use) {
                 this.bridge.use(plugin);
             }
        }

        // Helper to unwrap content property (matching MetadataRegistry behavior)
        const unwrapContent = (item: Record<string, unknown>) => {
            if (item && item.content) {
                return item.content;
            }
            return item;
        };

        // Stub legacy accessors
        this.bridge.metadata = {
            register: (type: string, item: Record<string, unknown>) => SchemaRegistry.registerItem(type, item, item.id ? 'id' : 'name'),
            get: (type: string, name: string) => {
                const item = SchemaRegistry.getItem(type, name) as Record<string, unknown> | null;
                return item ? (unwrapContent(item) as Record<string, unknown>) : undefined;
            },
            getEntry: (type: string, name: string) => SchemaRegistry.getItem(type, name),
            list: (type: string) => {
                const items = SchemaRegistry.listItems(type) as Array<Record<string, unknown>>;
                return items.map(i => unwrapContent(i) as Record<string, unknown>);
            },
            unregister: (type: string, name: string) => {
                 if (typeof SchemaRegistry.unregisterItem === 'function') {
                     SchemaRegistry.unregisterItem(type, name);
                 } else {
                     const registry = SchemaRegistry as unknown as { metadata?: Map<string, Map<string, unknown>> };
                     if (registry.metadata instanceof Map) {
                         const collection = registry.metadata.get(type);
                         if (collection instanceof Map) {
                             collection.delete(name);
                         }
                     }
                 }
            },
            unregisterPackage: (packageName: string) => {
                 if (typeof SchemaRegistry.unregisterObjectsByPackage === 'function') {
                     SchemaRegistry.unregisterObjectsByPackage(packageName);
                 }
                 const registry = SchemaRegistry as unknown as { metadata?: Map<string, Map<string, Record<string, unknown>>> };
                 if (registry.metadata instanceof Map) {
                     for (const [_type, collection] of registry.metadata.entries()) {
                         if (collection instanceof Map) {
                             for (const [key, item] of collection.entries()) {
                                 if (item.package === packageName) {
                                     collection.delete(key);
                                 }
                             }
                         }
                     }
                 }
            }
        };
        this.bridge.hooks = {
            register: (event: string, objectName: string, handler: HookHandler, packageName?: string) => {
                this.hookManager.registerHook(event, objectName, handler, packageName);
            },
            removePackage: (packageName: string) => {
                this.hookManager.removePackage(packageName);
            },
            trigger: async (event: string, objectName: string, ctx: HookContext) => {
                await this.hookManager.runHooks(event, objectName, ctx);
            }
        };
        this.bridge.actions = {
            register: (objectName: string, actionName: string, handler: ActionHandler, packageName?: string) => {
                const key = `${objectName}:${actionName}`;
                const taggedHandler = handler as ActionHandler & { _package?: string };
                taggedHandler._package = packageName;
                this.localActions.set(key, taggedHandler);
            },
            removePackage: (packageName: string) => {
                for (const [key, handler] of this.localActions.entries()) {
                    if (handler._package === packageName) {
                        this.localActions.delete(key);
                    }
                }
            },
            execute: async (objectName: string, actionName: string, ctx: ActionContext) => {
                const handler = this.localActions.get(`${objectName}:${actionName}`);
                if (handler) {
                    return handler(ctx);
                }
                throw new ObjectQLError({ code: 'NOT_FOUND', message: `Action '${actionName}' on object '${objectName}' not found` });
            }
        };
        
        // Register initial metadata if provided
        if (config.registry) {
            for (const type of config.registry.getTypes()) {
                const items = config.registry.list(type);
                for (const item of items) {
                    const itemId = typeof item === 'object' && item !== null 
                        ? (item as { name?: string; id?: string }).name || (item as { name?: string; id?: string }).id || 'unknown'
                        : 'unknown';
                    
                    this.bridge.metadata.register(type, {
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
        if (this.kernel && this.bridge.use) {
            this.bridge.use(plugin);
        }
    }

    removePackage(name: string) {
        this.bridge.metadata.unregisterPackage(name);
        this.bridge.hooks.removePackage(name);
        this.bridge.actions.removePackage(name);
    }

    on(event: HookName, objectName: string, handler: HookHandler, packageName?: string) {
        this.bridge.hooks.register(event, objectName, handler, packageName);
    }

    async triggerHook(event: HookName, objectName: string, ctx: HookContext) {
        await this.bridge.hooks.trigger(event, objectName, ctx);
    }

    registerAction(objectName: string, actionName: string, handler: ActionHandler, packageName?: string) {
        this.bridge.actions.register(objectName, actionName, handler, packageName);
    }

    async executeAction(objectName: string, actionName: string, ctx: ActionContext) {
        return await this.bridge.actions.execute(objectName, actionName, ctx);
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
            transaction: async (callback: (ctx: ObjectQLContext) => Promise<unknown>) => {
                 const driver = this.datasources['default'];
                 if (!driver || !driver.beginTransaction) {
                      return callback(ctx);
                 }

                 const trx = await driver.beginTransaction();

                 const trxCtx: ObjectQLContext = {
                     ...ctx,
                     transactionHandle: trx,
                     transaction: async (cb: (ctx: ObjectQLContext) => Promise<unknown>) => cb(trxCtx)
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
            throw new ObjectQLError({ code: 'INTERNAL_ERROR', message: 'Kernel not initialized. Call init() first.' });
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
        this.bridge.metadata.register('object', object as unknown as Record<string, unknown>);
    }

    unregisterObject(name: string) {
        this.bridge.metadata.unregister('object', name);
    }

    getObject(name: string): ObjectConfig | undefined {
        const item = this.bridge.metadata.get('object', name) as Record<string, unknown> | undefined;
        if (!item) return undefined;
        return (item.content || item) as ObjectConfig;
    }

    getConfigs(): Record<string, ObjectConfig> {
        const result: Record<string, ObjectConfig> = {};
        const items = this.bridge.metadata.list('object') || [];
        for (const item of items) {
            const config = (item.content || item) as ObjectConfig;
            if (config?.name) {
                result[config.name] = config;
            }
        }
        return result;
    }

    datasource(name: string): Driver {
        const driver = this.datasources[name];
        if (!driver) {
            throw new ObjectQLError({ code: 'NOT_FOUND', message: `Datasource '${name}' not found` });
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
            throw new ObjectQLError({ code: 'DRIVER_UNSUPPORTED_OPERATION', message: `Driver for datasource '${datasourceName}' does not support schema introspection` });
        }
        
        this.logger.info(`Introspecting datasource '${datasourceName}'...`);
        const introspectedSchema = await driver.introspectSchema();
        
        // Convert introspected schema to ObjectQL objects
        const objects = convertIntrospectedSchemaToObjects(introspectedSchema, options);
        
        this.logger.info(`Discovered ${objects.length} table(s), registering as objects...`);
        
        // Register each discovered object
        for (const obj of objects) {
            this.registerObject(obj);
        }
        
        return objects;
    }

    async close() {
        for (const [name, driver] of Object.entries(this.datasources)) {
            if (driver.disconnect) {
                this.logger.debug(`Closing driver '${name}'...`);
                await driver.disconnect();
            }
        }
    }

    async init() {
        this.logger.info('Initializing with ObjectKernel...');
        
        // Start the kernel - this will install and start all plugins
        if (this.bridge.start) {
            await this.bridge.start();
        } else if (this.bridge.bootstrap) {
            await this.bridge.bootstrap();
        } else {
             this.logger.warn('ObjectKernel does not have start() or bootstrap() method');
             
             // Manually initialize plugins if kernel doesn't support lifecycle
             for (const plugin of this.kernelPlugins) {
                 try {
                     const p = plugin as Plugin & { init?: (kernel: ObjectKernel) => Promise<void>; start?: (kernel: ObjectKernel) => Promise<void>; name?: string };
                     if (typeof p.init === 'function') {
                         await p.init(this.kernel);
                     }
                     if (typeof p.start === 'function') {
                         await p.start(this.kernel);
                     }
                 } catch (error) {
                     const p = plugin as Plugin & { name?: string };
                     this.logger.error(`Failed to initialize plugin ${p.name || 'unknown'}`, error as Error);
                 }
             }
        }
        
        // TEMPORARY: Set driver for backward compatibility during migration
        const defaultDriver = this.datasources['default'];
        if (this.bridge.setDriver && defaultDriver) {
            this.bridge.setDriver(defaultDriver);
        }

        // TEMPORARY: Patch kernel with CRUD methods dynamically if missing
        if (typeof this.bridge.create !== 'function' && defaultDriver) {
             this.bridge.create = (object: string, doc: Record<string, unknown>, options?: Record<string, unknown>) => defaultDriver.create(object, doc, options || {});
             this.bridge.update = (object: string, id: string, doc: Record<string, unknown>, options?: Record<string, unknown>) => defaultDriver.update(object, id, doc, options || {});
             this.bridge.delete = (object: string, id: string, options?: Record<string, unknown>) => defaultDriver.delete(object, id, options || {});
             this.bridge.find = async (object: string, query: Record<string, unknown>, options?: Record<string, unknown>) => {
                 const res = await defaultDriver.find(object, query, options);
                 return { value: res || [], count: (res || []).length };
             };
             this.bridge.findOne = (object: string, id: string, options?: Record<string, unknown>) => defaultDriver.findOne(object, id, options);
             this.bridge.get = (object: string, id: string) => defaultDriver.findOne(object, id); 
             this.bridge.count = (object: string, query: Record<string, unknown>, options?: Record<string, unknown>) => defaultDriver.count(object, query, options || {});
        }

        // Load In-Memory Objects (Dynamic Layer)
        if (this.config.objects) {
            for (const [_key, obj] of Object.entries(this.config.objects)) {
                this.registerObject(obj);
            }
        }

        const registryItems = this.bridge.metadata.list('object');
        const objects = (registryItems || []).map((item) => (item.content || item) as ObjectConfig);
        
        // Init Datasources
        for (const [name, driver] of Object.entries(this.datasources)) {
            if (driver.init) {
                this.logger.debug(`Initializing driver '${name}'...`);
                await driver.init(objects);
            }
        }

        // Process Initial Data
        await this.processInitialData();
        
        this.logger.info('Initialization complete');
    }

    private async processInitialData() {
        const dataEntries = this.bridge.metadata.list('data');
        if (dataEntries.length === 0) return;

        this.logger.info(`Processing ${dataEntries.length} initial data files...`);
        
        // We need a system context to write data
        const ctx = this.createContext({ isSystem: true });

        for (const entry of dataEntries) {
            const dataContent = (entry.content || entry) as Record<string, unknown>;

            let objectName = dataContent.object as string | undefined;
            let records = dataContent.records as Record<string, unknown>[] | undefined;

            if (Array.isArray(dataContent)) {
                records = dataContent as Record<string, unknown>[];
                if (!objectName && (dataContent as unknown as { name?: string }).name) {
                    objectName = (dataContent as unknown as { name?: string }).name;
                }
            }

            if (!objectName || !records || !Array.isArray(records)) {
                this.logger.warn('Skipping invalid data entry', { entry: String(entry) });
                continue;
            }

            const repo = ctx.object(objectName);
            
            for (const record of records) {
                try {
                    await repo.create(record);
                    this.logger.debug(`Initialized record for ${objectName}`);
                } catch (e: unknown) {
                    const message = e instanceof Error ? e.message : String(e);
                     this.logger.warn(`Failed to insert initial data for ${objectName}: ${message}`);
                }
            }
        }
    }
}
