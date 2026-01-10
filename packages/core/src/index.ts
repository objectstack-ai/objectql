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
    HookContext
} from '@objectql/types';
import { MetadataLoader } from './loader';
export * from './loader';
import { ObjectRepository } from './repository';

export class ObjectQL implements IObjectQL {
    public metadata: MetadataRegistry;
    private loader: MetadataLoader;
    private datasources: Record<string, Driver> = {};
    private hooks: Record<string, Array<{ objectName: string, handler: HookHandler }>> = {};

    constructor(config: ObjectQLConfig) {
        this.metadata = config.registry || new MetadataRegistry();
        this.loader = new MetadataLoader(this.metadata);
        this.datasources = config.datasources;

        if (config.objects) {
            for (const [key, obj] of Object.entries(config.objects)) {
                this.registerObject(obj);
            }
        }
        if (config.packages) {
            for (const name of config.packages) {
                this.addPackage(name);
            }
        }
    }

    addPackage(name: string) {
        this.loader.loadPackage(name);
    }

    removePackage(name: string) {
        this.metadata.unregisterPackage(name);
    }

    on(event: HookName, objectName: string, handler: HookHandler) {
        if (!this.hooks[event]) {
            this.hooks[event] = [];
        }
        this.hooks[event].push({ objectName, handler });
    }

    async triggerHook(event: HookName, objectName: string, ctx: HookContext) {
        const hooks = this.hooks[event] || [];
        for (const hook of hooks) {
            if (hook.objectName === '*' || hook.objectName === objectName) {
                await hook.handler(ctx);
            }
        }
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
}

export * from './repository';
