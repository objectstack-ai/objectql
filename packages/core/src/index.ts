import { 
    ObjectRegistry, 
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
    ActionContext
} from '@objectql/types';
import { ObjectLoader } from './loader';
export * from './loader';
import { ObjectRepository } from './repository';
import { RemoteDriver } from './drivers/remote';

export class ObjectQL implements IObjectQL {
    public metadata: ObjectRegistry;
    private loader: ObjectLoader;
    private datasources: Record<string, Driver> = {};
    private remotes: string[] = [];
    private hooks: Record<string, Array<{ objectName: string, handler: HookHandler, packageName?: string }>> = {};
    private actions: Record<string, { handler: ActionHandler, packageName?: string }> = {};
    private pluginsList: ObjectQLPlugin[] = [];

    constructor(config: ObjectQLConfig) {
        this.metadata = config.registry || new ObjectRegistry();
        this.loader = new ObjectLoader(this.metadata);
        this.datasources = config.datasources || {};
        this.remotes = config.remotes || [];
        
        if (config.connection) {
            this.loadDriverFromConnection(config.connection);
        }

        // 1. Load Presets/Packages first (Base Layer)
        if (config.packages) {
            for (const name of config.packages) {
                this.addPackage(name);
            }
        }
        if (config.presets) {
            for (const name of config.presets) {
                this.addPackage(name);
            }
        }
        
        if (config.plugins) {
            for (const plugin of config.plugins) {
                if (typeof plugin === 'string') {
                    this.loadPluginFromPackage(plugin);
                } else {
                    this.use(plugin);
                }
            }
        }

        // 2. Load Local Sources (Application Layer - can override presets)
        if (config.source) {
            const sources = Array.isArray(config.source) ? config.source : [config.source];
            for (const src of sources) {
                this.loader.load(src);
            }
        }

        // 3. Load In-Memory Objects (Dynamic Layer - highest priority)
        if (config.objects) {
            for (const [key, obj] of Object.entries(config.objects)) {
                this.registerObject(obj);
            }
        }
    }

    private loadPluginFromPackage(packageName: string) {
        let mod: any;
        try {
            const modulePath = require.resolve(packageName, { paths: [process.cwd()] });
            mod = require(modulePath);
        } catch (e) {
            throw new Error(`Failed to resolve plugin '${packageName}': ${e}`);
        }

        // Helper to find plugin instance
        const findPlugin = (candidate: any): ObjectQLPlugin | undefined => {
             if (!candidate) return undefined;
             
             // 1. Try treating as Class
             if (typeof candidate === 'function') {
                 try {
                     const inst = new candidate();
                     if (inst && typeof inst.setup === 'function') {
                         return inst; // Found it!
                     }
                 } catch (e) {
                     // Not a constructor or instantiation failed
                 }
             }

             // 2. Try treating as Instance
             if (candidate && typeof candidate.setup === 'function') {
                 if (candidate.name) return candidate;
             }
             return undefined;
        };

        // Search in default, module root, and all named exports
        let instance = findPlugin(mod.default) || findPlugin(mod);
        
        if (!instance && mod && typeof mod === 'object') {
            for (const key of Object.keys(mod)) {
                if (key === 'default') continue;
                instance = findPlugin(mod[key]);
                if (instance) break;
            }
        }

        if (instance) {
            (instance as any)._packageName = packageName;
            this.use(instance);
        } else {
            console.error(`[PluginLoader] Failed to find ObjectQLPlugin in '${packageName}'. Exports:`, Object.keys(mod));
            throw new Error(`Plugin '${packageName}' must export a class or object implementing ObjectQLPlugin.`);
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
        if (!this.hooks[event]) {
            this.hooks[event] = [];
        }
        this.hooks[event].push({ objectName, handler, packageName });
    }

    async triggerHook(event: HookName, objectName: string, ctx: HookContext) {
        // 1. Registry Hooks (File-based)
        const fileHooks = this.metadata.get<any>('hook', objectName);
        if (fileHooks && typeof fileHooks[event] === 'function') {
            await fileHooks[event](ctx);
        }

        // 2. Programmatic Hooks
        const hooks = this.hooks[event] || [];
        for (const hook of hooks) {
            if (hook.objectName === '*' || hook.objectName === objectName) {
                await hook.handler(ctx);
            }
        }
    }

    registerAction(objectName: string, actionName: string, handler: ActionHandler, packageName?: string) {
        const key = `${objectName}:${actionName}`;
        this.actions[key] = { handler, packageName };
    }

    async executeAction(objectName: string, actionName: string, ctx: ActionContext) {
        // 1. Programmatic
        const key = `${objectName}:${actionName}`;
        const actionEntry = this.actions[key];
        if (actionEntry) {
            return await actionEntry.handler(ctx);
        }

        // 2. Registry (File-based)
        const fileActions = this.metadata.get<any>('action', objectName);
        if (fileActions && typeof fileActions[actionName] === 'function') {
            return await fileActions[actionName](ctx);
        }

        throw new Error(`Action '${actionName}' not found for object '${objectName}'`);
    }

    loadFromDirectory(dir: string, packageName?: string) {
        this.loader.load(dir, packageName);
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
        // Normalize fields
        if (object.fields) {
            for (const [key, field] of Object.entries(object.fields)) {
                if (!field.name) {
                    field.name = key;
                }
            }
        }
        this.metadata.register('object', {
            type: 'object',
            id: object.name,
            content: object
        });
    }

    unregisterObject(name: string) {
        this.metadata.unregister('object', name);
    }

    getObject(name: string): ObjectConfig | undefined {
        return this.metadata.get<ObjectConfig>('object', name);
    }

    getConfigs(): Record<string, ObjectConfig> {
        const result: Record<string, ObjectConfig> = {};
        const objects = this.metadata.list<ObjectConfig>('object');
        for (const obj of objects) {
            result[obj.name] = obj;
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

    async init() {
        // -1. Load Remotes
        if (this.remotes.length > 0) {
            console.log(`Loading ${this.remotes.length} remotes...`);
            await Promise.all(this.remotes.map(url => this.loadRemote(url)));
        }

        // 0. Init Plugins
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

        const objects = this.metadata.list<ObjectConfig>('object');
        
        // 1. Init Drivers (e.g. Sync Schema)
        // Let's pass all objects to all configured drivers.
        for (const [name, driver] of Object.entries(this.datasources)) {
            if (driver.init) {
                console.log(`Initializing driver '${name}'...`);
                await driver.init(objects);
            }
        }
    }

    private loadDriverFromConnection(connection: string) {
        let driverPackage = '';
        let driverClass = '';
        let driverConfig: any = {};
        
        if (connection.startsWith('mongodb://')) {
            driverPackage = '@objectql/driver-mongo';
            driverClass = 'MongoDriver';
            driverConfig = { url: connection };
        } 
        else if (connection.startsWith('sqlite://')) {
            driverPackage = '@objectql/driver-knex';
            driverClass = 'KnexDriver';
            const filename = connection.replace('sqlite://', '');
            driverConfig = {
                client: 'sqlite3',
                connection: { filename },
                useNullAsDefault: true
            };
        }
        else if (connection.startsWith('postgres://') || connection.startsWith('postgresql://')) {
            driverPackage = '@objectql/driver-knex';
            driverClass = 'KnexDriver';
            driverConfig = {
                client: 'pg',
                connection: connection
            };
        }
        else if (connection.startsWith('mysql://')) {
            driverPackage = '@objectql/driver-knex';
            driverClass = 'KnexDriver';
            driverConfig = {
                client: 'mysql2',
                connection: connection
            };
        }
        else {
            throw new Error(`Unsupported connection protocol: ${connection}`);
        }

        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const pkg = require(driverPackage);
            const DriverClass = pkg[driverClass];
            if (!DriverClass) {
                throw new Error(`${driverClass} not found in ${driverPackage}`);
            }
            this.datasources['default'] = new DriverClass(driverConfig);
        } catch (e: any) {
            throw new Error(`Failed to load driver ${driverPackage}. Please install it: npm install ${driverPackage}. Error: ${e.message}`);
        }
    }

    private async loadRemote(url: string) {
        try {
            const baseUrl = url.replace(/\/$/, '');
            const metadataUrl = `${baseUrl}/api/metadata/objects`;
            
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore - Fetch is available in Node 18+
            const res = await fetch(metadataUrl);
            if (!res.ok) {
                console.warn(`[ObjectQL] Remote ${url} returned ${res.status}`);
                return;
            }

            const data = await res.json() as any;
            if (!data || !data.objects) return;

            const driverName = `remote:${baseUrl}`;
            this.datasources[driverName] = new RemoteDriver(baseUrl);

            await Promise.all(data.objects.map(async (summary: any) => {
                try {
                    // @ts-ignore
                    const detailRes = await fetch(`${metadataUrl}/${summary.name}`);
                    if (detailRes.ok) {
                        const config = await detailRes.json() as ObjectConfig;
                        config.datasource = driverName;
                        this.registerObject(config);
                    }
                } catch (e) {
                    console.warn(`[ObjectQL] Failed to load object ${summary.name} from ${url}`);
                }
            }));

        } catch (e: any) {
             console.warn(`[ObjectQL] Remote connection error ${url}: ${e.message}`);
        }
    }
}

export * from './repository';
