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
    LoaderPlugin
} from '@objectql/types';
import type { PluginDefinition } from '@objectstack/spec';
import { ObjectRepository } from './repository';
// import { createDriverFromConnection } from './driver'; // REMOVE THIS

// import { loadRemoteFromUrl } from './remote';
import { executeActionHelper, registerActionHelper, ActionEntry } from './action';
import { registerHookHelper, triggerHookHelper, HookEntry } from './hook';
import { registerObjectHelper, getConfigsHelper } from './object';
import { convertIntrospectedSchemaToObjects } from './util';

export class ObjectQL implements IObjectQL {
    public metadata: MetadataRegistry;
    private datasources: Record<string, Driver> = {};
    private remotes: string[] = [];
    private hooks: Record<string, HookEntry[]> = {};
    private actions: Record<string, ActionEntry> = {};
    private pluginsList: PluginDefinition[] = [];
    
    // Store config for lazy loading in init()
    private config: ObjectQLConfig;

    constructor(config: ObjectQLConfig) {
        this.config = config;
        this.metadata = config.registry || new MetadataRegistry();
        this.datasources = config.datasources || {};
        // this.remotes = config.remotes || [];
        
        if (config.connection) {
             throw new Error("Connection strings are not supported in core directly. Use @objectql/platform-node's createDriverFromConnection or pass a driver instance to 'datasources'.");
        }

        // Initialize Plugin List (but don't setup yet)
        if (config.plugins) {
            for (const plugin of config.plugins) {
                if (typeof plugin === 'string') {
                    throw new Error("String plugins are not supported in core. Use @objectql/platform-node or pass plugin instance.");
                } else {
                    this.use(plugin);
                }
            }
        }
    }
    use(plugin: PluginDefinition) {
        this.pluginsList.push(plugin);
    }

    removePackage(name: string) {
        this.metadata.unregisterPackage(name);
        
        // Remove hooks
        for (const event of Object.keys(this.hooks)) {
            this.hooks[event] = this.hooks[event].filter(h => h.packageName !== name);
        }
        
        // Remove actions
        for (const key of Object.keys(this.actions)) {
            if (this.actions[key].packageName === name) {
                delete this.actions[key];
            }
        }
    }

    on(event: HookName, objectName: string, handler: HookHandler, packageName?: string) {
        registerHookHelper(this.hooks, event, objectName, handler, packageName);
    }

    async triggerHook(event: HookName, objectName: string, ctx: HookContext) {
        await triggerHookHelper(this.metadata, this.hooks, event, objectName, ctx);
    }

    registerAction(objectName: string, actionName: string, handler: ActionHandler, packageName?: string) {
        registerActionHelper(this.actions, objectName, actionName, handler, packageName);
    }

    async executeAction(objectName: string, actionName: string, ctx: ActionContext) {
        return await executeActionHelper(this.metadata, this.actions, objectName, actionName, ctx);
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
            transaction: async (callback) => {
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
                     transaction: async (cb) => cb(trxCtx)
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

    registerObject(object: ObjectConfig) {
        registerObjectHelper(this.metadata, object);
    }

    unregisterObject(name: string) {
        this.metadata.unregister('object', name);
    }

    getObject(name: string): ObjectConfig | undefined {
        return this.metadata.get<ObjectConfig>('object', name);
    }

    getConfigs(): Record<string, ObjectConfig> {
        return getConfigsHelper(this.metadata);
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

    /**
     * Create a PluginContext from the current IObjectQL instance.
     * This adapts the IObjectQL interface to the PluginContext expected by @objectstack/spec plugins.
     * 
     * **Current Implementation Status:**
     * - ✅ ql.object() - Fully functional, provides repository interface for data access
     * - ❌ ql.query() - Not implemented, throws error with guidance
     * - ❌ os.getCurrentUser() - Stub, returns null
     * - ❌ os.getConfig() - Stub, returns null
     * - ✅ logger - Functional, logs to console with [Plugin] prefix
     * - ❌ storage - Stub, no persistence implemented
     * - ✅ i18n - Basic fallback implementation
     * - ✅ metadata - Direct access to MetadataRegistry
     * - ❌ events - Empty object, event bus not implemented
     * - ❌ app.router - Stub methods, no actual routing
     * - ❌ app.scheduler - Not implemented (optional in spec)
     * 
     * @private
     * @returns Minimal PluginContext adapter for current plugin system capabilities
     */
    private createPluginContext(): import('@objectstack/spec').PluginContextData {
        // TODO: Implement full PluginContext conversion
        // For now, provide a minimal adapter that maps IObjectQL to PluginContext
        return {
            ql: {
                object: (name: string) => {
                    // Return a repository-like interface
                    // Cast to ObjectQL to access createContext
                    return (this as ObjectQL).createContext({}).object(name);
                },
                query: async (soql: string) => {
                    // TODO: Implement SOQL query execution
                    // This requires implementing a SOQL parser and converter
                    // For now, throw a descriptive error to guide users
                    throw new Error(
                        'SOQL queries are not yet supported in plugin context adapter. ' +
                        'Please use context.ql.object(name).find() instead for data access.'
                    );
                }
            },
            os: {
                getCurrentUser: async () => {
                    // TODO: Get from context
                    return null;
                },
                getConfig: async (key: string) => {
                    // TODO: Implement config access
                    return null;
                }
            },
            logger: {
                debug: (...args: any[]) => console.debug('[Plugin]', ...args),
                info: (...args: any[]) => console.info('[Plugin]', ...args),
                warn: (...args: any[]) => console.warn('[Plugin]', ...args),
                error: (...args: any[]) => console.error('[Plugin]', ...args),
            },
            storage: {
                get: async (key: string) => {
                    // TODO: Implement plugin storage
                    return null;
                },
                set: async (key: string, value: any) => {
                    // TODO: Implement plugin storage
                },
                delete: async (key: string) => {
                    // TODO: Implement plugin storage
                }
            },
            i18n: {
                t: (key: string, params?: any) => key, // Fallback: return key
                getLocale: () => 'en'
            },
            metadata: this.metadata,
            events: {
                // TODO: Implement event bus
            },
            app: {
                router: {
                    get: (path: string, handler: (...args: unknown[]) => unknown, ...args: unknown[]) => {
                        // TODO: Implement router registration
                    },
                    post: (path: string, handler: (...args: unknown[]) => unknown, ...args: unknown[]) => {
                        // TODO: Implement router registration
                    },
                    use: (path: string | undefined, handler: (...args: unknown[]) => unknown, ...args: unknown[]) => {
                        // TODO: Implement middleware registration
                    }
                },
                scheduler: undefined // Optional in spec
            }
        };
    }

    async init() {
        // 0. Init Plugins (This allows plugins to register custom loaders)
        for (const plugin of this.pluginsList) {
            const pluginId = plugin.id || 'unknown';
            
            console.log(`Initializing plugin '${pluginId}'...`);
            
            // Call onEnable hook if it exists
            if (plugin.onEnable) {
                const context = this.createPluginContext();
                await plugin.onEnable(context);
            }
        }

        // Packages, Presets, Source, Objects loading logic removed from Core.
        // Use @objectql/platform-node's ObjectLoader or platform-specific loaders.
        
        // 3. Load In-Memory Objects (Dynamic Layer)
        if (this.config.objects) {
            for (const [key, obj] of Object.entries(this.config.objects)) {
                this.registerObject(obj);
            }
        }

        const objects = this.metadata.list<ObjectConfig>('object');
        
        // 5. Init Datasources
        // Let's pass all objects to all configured drivers.
        for (const [name, driver] of Object.entries(this.datasources)) {
            if (driver.init) {
                console.log(`Initializing driver '${name}'...`);
                await driver.init(objects);
            }
        }

        // 6. Process Initial Data
        await this.processInitialData();
    }

    private async processInitialData() {
        const dataEntries = this.metadata.list<any>('data');
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
