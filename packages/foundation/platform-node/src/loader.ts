/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as fs from 'fs';
import * as glob from 'fast-glob';
import * as path from 'path';
import { MetadataRegistry, ObjectConfig, LoaderPlugin, LoaderHandlerContext, FieldConfig } from '@objectql/types';
import * as yaml from 'js-yaml';
import { toTitleCase } from '@objectql/core';

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

                    // Calculate ID from filename
                    const basename = path.basename(ctx.file);
                    const filenameId = basename.replace(/\.object\.(yml|yaml)$/, '');

                    // 1. Single Object definition (Standard)
                    // If fields are present, we treat it as a single object definition
                    if (doc.fields) {
                        if (!doc.name) {
                            // If name is missing, infer from filename
                            doc.name = filenameId;
                        } else if (doc.name !== filenameId) {
                            // warn if mismatch
                            console.warn(`[ObjectQL] Warning: Object name '${doc.name}' in ${basename} does not match filename. Using '${doc.name}'.`);
                        }

                        const packageEntry = ctx.registry.getEntry('package-map', ctx.file);
                        registerObject(ctx.registry, doc, ctx.file, ctx.packageName || (packageEntry && packageEntry.package));
                        return;
                    }

                     // 2. Multi-object map (Legacy/Bundle mode) 
                    // e.g. { object1: { fields... }, object2: { fields... } }
                    for (const [key, value] of Object.entries(doc)) {
                        if (typeof value === 'object' && (value as any).fields) {
                            const obj = value as any;
                            if (!obj.name) obj.name = key;
                            registerObject(ctx.registry, obj, ctx.file, ctx.packageName);
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

        // Generic YAML Metadata Loaders
        const metaTypes = ['view', 'form', 'permission', 'report', 'workflow', 'validation', 'data', 'app', 'page', 'menu'];
        
        for (const type of metaTypes) {
            this.use({
                name: type,
                glob: [`**/*.${type}.yml`, `**/*.${type}.yaml`],
                handler: (ctx) => {
                    try {
                        const doc = yaml.load(ctx.content) as any;
                        if (!doc) return;

                        // Use 'name' from doc, or filename base (without extension)
                        let id = doc.name;
                        if (!id) {
                            const basename = path.basename(ctx.file); 
                            // e.g. "my-view.view.yml" -> "my-view"
                            // Regex: remove .type.yml or .type.yaml
                            const re = new RegExp(`\\.${type}\\.(yml|yaml)$`);
                            id = basename.replace(re, '');
                        }

                        // Ensure name is in the doc for consistency
                        if (!doc.name) doc.name = id;

                        ctx.registry.register(type, {
                            type: type,
                            id: id,
                            path: ctx.file,
                            package: ctx.packageName,
                            content: doc
                        });
                    } catch (e) {
                         console.error(`Error loading ${type} from ${ctx.file}:`, e);
                    }
                }
            })
        }
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
        // Enforce path conventions: 
        // 1. Never scan node_modules (unless explicitly loaded via loadPackage which sets cwd inside it)
        // 2. Ignore build artifacts (dist, build, out) to avoid double-loading metadata if both src and dist exist.
        //    Note: If you want to load from 'dist', you must explicitly point the loader to it (e.g. loader.load('./dist')).
        //    In that case, the patterns won't match relative to the CWD.
        // Path conventions:
        // 1. Always ignore node_modules and .git
        const ignore = [
            '**/node_modules/**', 
            '**/.git/**'
        ];

        // 2. Intelligent handling of build artifacts (dist/build)
        // If 'src' exists in the scan directory, we assume it's a Development Environment.
        // In Dev, we ignore 'dist' to avoid duplicate loading (ts in src vs js in dist).
        // In Production (no src), we must NOT ignore 'dist', otherwise we can't load compiled hooks/actions.
        const srcPath = path.join(dir, 'src');
        const hasSrc = fs.existsSync(srcPath) && fs.statSync(srcPath).isDirectory();

        if (hasSrc) {
            ignore.push('**/dist/**', '**/build/**', '**/out/**');
        }

        // 3. User instruction: "src 不行的" (src is not viable for metadata in production)
        // Metadata (.yml) should ideally be placed in 'objects/' or root, not 'src/', 
        // to simplify packaging (so you don't need to copy assets from src to dist).
        // However, we do not strictly block 'src' scanning here to avoid breaking dev workflow.
        // The exclusion of 'dist' in dev mode (above) handles the code duality.

        const files = glob.sync(plugin.glob, {
            cwd: dir,
            absolute: true,
            ignore
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
    if (!obj.name) return;

    // --- Smart Defaults & Normalization ---

    // 1. Object Label: Infer from name if missing
    if (!obj.label) {
        obj.label = toTitleCase(obj.name);
    }

    // 2. Normalize Fields
    if (obj.fields) {
        for (const [key, field] of Object.entries(obj.fields)) {
            if (typeof field === 'object' && field !== null) {
                const f = field as FieldConfig;
                
                // Ensure field has a name
                if (!f.name) {
                    f.name = key;
                }

                // Field Label: Infer from key if missing
                if (!f.label) {
                    f.label = toTitleCase(key);
                }

                // Inferred Types
                if (!f.type) {
                    if (f.reference_to) {
                        f.type = 'lookup';
                    } else if (f.options) {
                        f.type = 'select';
                    } else if (f.formula) {
                        f.type = 'formula';
                    } else if (f.summary_object) {
                        f.type = 'summary';
                    }
                }
            }
        }
    }

    // --- End Smart Defaults ---

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
