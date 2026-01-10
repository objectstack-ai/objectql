import * as fs from 'fs';
import * as glob from 'fast-glob';
import * as path from 'path';
import { MetadataRegistry, ObjectConfig, LoaderPlugin, LoaderHandlerContext } from '@objectql/types';
import * as yaml from 'js-yaml';

export class ObjectLoader {
    private plugins: LoaderPlugin[] = [];

    constructor(protected registry: MetadataRegistry) {
        this.registerBuiltinPlugins();
    }

    private registerBuiltinPlugins() {
        // Objects
        this.use({
            name: 'object',
            glob: ['**/*.object.yml', '**/*.object.yaml'],
            handler: (ctx) => {
                try {
                    const doc = yaml.load(ctx.content) as any;
                    if (!doc) return;

                    if (doc.name && doc.fields) {
                        registerObject(ctx.registry, doc, ctx.file, ctx.packageName || ctx.registry.getEntry('package-map', ctx.file)?.package);
                    } else {
                        for (const [key, value] of Object.entries(doc)) {
                            if (typeof value === 'object' && (value as any).fields) {
                                const obj = value as any;
                                if (!obj.name) obj.name = key;
                                registerObject(ctx.registry, obj, ctx.file, ctx.packageName);
                            }
                        }
                    }
                } catch (e) {
                    console.error(`Error loading object from ${ctx.file}:`, e);
                }
            }
        });

        // Hooks
        this.use({
            name: 'hook',
            glob: ['**/*.hook.ts', '**/*.hook.js'],
            handler: (ctx) => {
                const basename = path.basename(ctx.file);
                // Extract object name from filename: user.hook.ts -> user
                const objectName = basename.replace(/\.hook\.(ts|js)$/, '');
                
                try {
                    const mod = require(ctx.file);
                    // Support default export or named exports
                    const hooks = mod.default || mod;
                    
                    ctx.registry.register('hook', {
                        type: 'hook',
                        id: objectName, // Hook ID is the object name
                        path: ctx.file,
                        package: ctx.packageName,
                        content: hooks
                    });
                } catch (e) {
                    console.error(`Error loading hook from ${ctx.file}:`, e);
                }
            }
        });
        
        // Actions
        this.use({
            name: 'action',
            glob: ['**/*.action.ts', '**/*.action.js'],
            handler: (ctx) => {
                const basename = path.basename(ctx.file);
                // Extract object name: invoice.action.ts -> invoice
                const objectName = basename.replace(/\.action\.(ts|js)$/, '');
                
                try {
                    const mod = require(ctx.file);

                    const actions: Record<string, any> = {};
                    
                    for (const [key, value] of Object.entries(mod)) {
                        if (key === 'default') continue;
                        if (typeof value === 'object' && (value as any).handler) {
                            actions[key] = value;
                        }
                    }
                    
                    if (Object.keys(actions).length > 0) {
                         ctx.registry.register('action', {
                            type: 'action',
                            id: objectName, // Action collection ID is the object name
                            path: ctx.file,
                            package: ctx.packageName,
                            content: actions
                        });
                    }

                } catch (e) {
                    console.error(`Error loading action from ${ctx.file}:`, e);
                }
            }
        });
    }

    use(plugin: LoaderPlugin) {
        this.plugins.push(plugin);
    }

    load(dir: string, packageName?: string) {
        for (const plugin of this.plugins) {
            this.runPlugin(plugin, dir, packageName);
        }
    }

    loadPackage(packageName: string) {
        try {
            const entryPath = require.resolve(packageName, { paths: [process.cwd()] });
            // clean cache
            delete require.cache[entryPath];
            const packageDir = path.dirname(entryPath);
            this.load(packageDir, packageName);
        } catch (e) {
            // fallback to directory
            this.load(packageName, packageName);
        }
    }

    private runPlugin(plugin: LoaderPlugin, dir: string, packageName?: string) {
        const files = glob.sync(plugin.glob, {
            cwd: dir,
            absolute: true
        });

        for (const file of files) {
            try {
                const ctx: LoaderHandlerContext = {
                    file,
                    content: '',
                    registry: this.registry,
                    packageName
                };
                
                // Pre-read for convenience
                if (!file.match(/\.(js|ts|node)$/)) {
                    ctx.content = fs.readFileSync(file, 'utf8');
                }

                plugin.handler(ctx);

            } catch (e) {
                console.error(`Error in loader plugin '${plugin.name}' processing ${file}:`, e);
            }
        }
    }
}

function registerObject(registry: MetadataRegistry, obj: any, file: string, packageName?: string) {
    // Normalize fields
    if (obj.fields) {
        for (const [key, field] of Object.entries(obj.fields)) {
            if (typeof field === 'object' && field !== null) {
                if (!(field as any).name) {
                    (field as any).name = key;
                }
            }
        }
    }

    // Check for existing object to Merge
    const existing = registry.getEntry('object', obj.name);
    if (existing) {
        const base = existing.content;
        
        // Merge Fields: New fields overwrite old ones
        if (obj.fields) {
            base.fields = { ...base.fields, ...obj.fields };
        }
        
        // Merge Actions
        if (obj.actions) {
            base.actions = { ...base.actions, ...obj.actions };
        }

        // Merge Indexes
        if (obj.indexes) {
            base.indexes = { ...base.indexes, ...obj.indexes };
        }
        
        // Override Top-level Properties if provided
        if (obj.label) base.label = obj.label;
        if (obj.icon) base.icon = obj.icon;
        if (obj.description) base.description = obj.description;
        if (obj.datasource) base.datasource = obj.datasource;
        
        // Update the content reference
        existing.content = base;
        return;
    }

    registry.register('object', {
        type: 'object',
        id: obj.name,
        path: file,
        package: packageName,
        content: obj
    });
}

export function loadObjectConfigs(dir: string): Record<string, ObjectConfig> {
    const registry = new MetadataRegistry();
    const loader = new ObjectLoader(registry);
    loader.load(dir);

    // Merge actions into objects
    const actions = registry.list<any>('action');
    for (const act of actions) {
        const obj = registry.get<ObjectConfig>('object', act.id);
        if (obj) {
            obj.actions = act.content;
        }
    }

    const result: Record<string, ObjectConfig> = {};
    for (const obj of registry.list<ObjectConfig>('object')) {
        result[obj.name] = obj;
    }
    return result;
}
