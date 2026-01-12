import { 
    MetadataRegistry, 
    Driver, 
    ObjectConfig, 
    ObjectQLContext, 
    ObjectQLContextOptions, 
    IObjectQL, 
    ObjectQLConfig,
    ObjectQLPlugin,
    HookName,
    HookHandler,
    HookContext,
    ActionHandler,
    ActionContext,
    LoaderPlugin
} from '@objectql/types';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { ObjectLoader } from './loader';
import { ObjectRepository } from './repository';
import { loadPlugin } from './plugin';
import { createDriverFromConnection } from './driver';
import { loadRemoteFromUrl } from './remote';
import { executeActionHelper, registerActionHelper, ActionEntry } from './action';
import { registerHookHelper, triggerHookHelper, HookEntry } from './hook';
import { registerObjectHelper, getConfigsHelper } from './object';

export class ObjectQL implements IObjectQL {
    public metadata: MetadataRegistry;
    private loader: ObjectLoader;
    private datasources: Record<string, Driver> = {};
    private remotes: string[] = [];
    private hooks: Record<string, HookEntry[]> = {};
    private actions: Record<string, ActionEntry> = {};
    private pluginsList: ObjectQLPlugin[] = [];
    
    // Store config for lazy loading in init()
    private config: ObjectQLConfig;

    constructor(config: ObjectQLConfig) {
        this.config = config;
        this.metadata = config.registry || new MetadataRegistry();
        this.loader = new ObjectLoader(this.metadata);
        this.datasources = config.datasources || {};
        this.remotes = config.remotes || [];
        
        if (config.connection) {
            this.datasources['default'] = createDriverFromConnection(config.connection);
        }

        // Initialize Plugin List (but don't setup yet)
        if (config.plugins) {
            for (const plugin of config.plugins) {
                if (typeof plugin === 'string') {
                    this.use(loadPlugin(plugin));
                } else {
                    this.use(plugin);
                }
            }
        }
    }

    addPackage(name: string) {
        this.loader.loadPackage(name);
    }

    use(plugin: ObjectQLPlugin) {
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

    loadFromDirectory(dir: string, packageName?: string) {
        this.loader.load(dir, packageName);
    }

    addLoader(plugin: LoaderPlugin) {
        this.loader.use(plugin);
    }

    async updateMetadata(type: string, id: string, content: any): Promise<void> {
        // Use registry to find the entry so we can get the file path
        const entry = this.metadata.getEntry(type, id);
        if (!entry) {
            throw new Error(`Metadata ${type}:${id} not found`);
        }

        if (!entry.path) {
            throw new Error('Cannot update: Metadata source file not found (in-memory only?)');
        }

        // Safety Check: Prevent writing to node_modules
        if (entry.path.includes('node_modules')) {
            throw new Error(`Cannot update metadata ${type}:${id}: File is inside node_modules (read-only package).`);
        }

        // Check file extension
        const ext = path.extname(entry.path).toLowerCase();
        let newContent = '';

        if (ext === '.yml' || ext === '.yaml') {
            newContent = yaml.dump(content);
        } else if (ext === '.json') {
            newContent = JSON.stringify(content, null, 2);
        } else {
            throw new Error(`Cannot update: Unsupported file format ${ext} (only .yml, .yaml, .json supported)`);
        }

        // Write file
        try {
            await fs.promises.chmod(entry.path, 0o666).catch(() => {}); // Try to ensure writable
            await fs.promises.writeFile(entry.path, newContent, 'utf8');
        } catch (e: any) {
            throw new Error(`Failed to write file ${entry.path}: ${e.message}`);
        }

        // Update registry in-memory
        entry.content = content;
        
        // If it's an object update, we might need some re-processing? 
        // For now, assume a restart or reload is needed for deep schema changes, 
        // but simple property updates are reflected immediately in registry.
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

    async init() {
        // 0. Init Plugins (This allows plugins to register custom loaders)
        for (const plugin of this.pluginsList) {
            console.log(`Initializing plugin '${plugin.name}'...`);
            
            let app: IObjectQL = this;
            const pkgName = (plugin as any)._packageName;

            if (pkgName) {
                app = new Proxy(this, {
                    get(target, prop) {
                        if (prop === 'on') {
                            return (event: HookName, obj: string, handler: HookHandler) => 
                                target.on(event, obj, handler, pkgName);
                        }
                        if (prop === 'registerAction') {
                            return (obj: string, act: string, handler: ActionHandler) => 
                                target.registerAction(obj, act, handler, pkgName);
                        }
                        const value = (target as any)[prop];
                        return typeof value === 'function' ? value.bind(target) : value;
                    }
                });
            }

            await plugin.setup(app);
        }

        // 1. Load Presets/Packages (Base Layer) - AFTER plugins, so they can use new loaders
        if (this.config.packages) {
            for (const name of this.config.packages) {
                this.addPackage(name);
            }
        }
        if (this.config.presets) {
            for (const name of this.config.presets) {
                this.addPackage(name);
            }
        }

        // 2. Load Local Sources (Application Layer)
        if (this.config.source) {
            const sources = Array.isArray(this.config.source) ? this.config.source : [this.config.source];
            for (const src of sources) {
                this.loader.load(src);
            }
        }

        // 3. Load In-Memory Objects (Dynamic Layer)
        if (this.config.objects) {
            for (const [key, obj] of Object.entries(this.config.objects)) {
                this.registerObject(obj);
            }
        }

        // 4. Load Remotes
        if (this.remotes.length > 0) {
            console.log(`Loading ${this.remotes.length} remotes...`);
            const results = await Promise.all(this.remotes.map(url => loadRemoteFromUrl(url)));
            for (const res of results) {
                if (res) {
                    this.datasources[res.driverName] = res.driver;
                    for (const obj of res.objects) {
                        this.registerObject(obj);
                    }
                }
            }
        }

        const objects = this.metadata.list<ObjectConfig>('object');
        
        // 5. Init Drivers (e.g. Sync Schema)
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
