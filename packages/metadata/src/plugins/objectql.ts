import * as yaml from 'js-yaml';
import * as path from 'path';
import { MetadataLoader } from '../loader';
import { ObjectConfig, ChartConfig, PageConfig } from '../types';

export function registerObjectQLPlugins(loader: MetadataLoader) {
    // Objects
    loader.use({
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

    // Apps
    loader.use({
        name: 'app',
        glob: ['**/*.app.yml', '**/*.app.yaml'],
        handler: (ctx) => {
            try {
                const doc = yaml.load(ctx.content) as any;
                const id = doc.code || doc.id || doc.name;
                if (id) {
                    ctx.registry.register('app', {
                        type: 'app',
                        id: id,
                        path: ctx.file,
                        package: ctx.packageName,
                        content: doc
                    });
                }
            } catch (e) {
                 console.error(`Error loading app from ${ctx.file}:`, e);
            }
        }
    });

    // Hooks
    loader.use({
        name: 'hook',
        glob: ['**/*.hook.{js,ts}'],
        handler: (ctx) => {
            try {
                const hookModule = require(ctx.file);
                let objectName = hookModule.listenTo;
                
                if (!objectName) {
                    const basename = path.basename(ctx.file);
                    const match = basename.match(/^(.+)\.hook\.(ts|js)$/);
                    if (match) objectName = match[1];
                }

                if (objectName) {
                    const entry = ctx.registry.getEntry('object', objectName);
                    if (entry) {
                         const config = entry.content as ObjectConfig;
                         if (!config.listeners) config.listeners = {};
                         
                         const hookNames = [
                             'beforeFind', 'afterFind',
                             'beforeCreate', 'afterCreate',
                             'beforeUpdate', 'afterUpdate',
                             'beforeDelete', 'afterDelete'
                         ];

                         for (const name of hookNames) {
                             if (typeof hookModule[name] === 'function') {
                                 config.listeners[name as keyof typeof config.listeners] = hookModule[name];
                             }
                         }
                         if (hookModule.default && typeof hookModule.default === 'object') {
                              Object.assign(config.listeners, hookModule.default);
                         }

                         if (hookModule.actions && typeof hookModule.actions === 'object') {
                             if (!config.actions) config.actions = {};
                             for (const [actionName, handler] of Object.entries(hookModule.actions)) {
                                 if (!config.actions[actionName]) config.actions[actionName] = {};
                                 config.actions[actionName].handler = handler as any;
                             }
                         }
                    }
                }
            } catch (e) {
                console.error(`Error loading hook from ${ctx.file}:`, e);
            }
        }
    });

    // Actions
    loader.use({
        name: 'action',
        glob: ['**/*.action.{js,ts}'],
        handler: (ctx) => {
            try {
                const actionModule = require(ctx.file);
                let objectName = actionModule.listenTo;
                
                if (!objectName) {
                    const basename = path.basename(ctx.file);
                    const match = basename.match(/^(.+)\.action\.(ts|js)$/);
                    if (match) objectName = match[1];
                }

                if (objectName) {
                    const entry = ctx.registry.getEntry('object', objectName);
                    if (entry) {
                         const config = entry.content as ObjectConfig;
                         if (!config.actions) config.actions = {};
                         
                         for (const [key, value] of Object.entries(actionModule)) {
                             if (key === 'listenTo') continue;
                             if (typeof value === 'function') {
                                 if (!config.actions[key]) config.actions[key] = {};
                                 config.actions[key].handler = value as any;
                             }
                         }
                    }
                }
            } catch (e) {
                console.error(`Error loading action from ${ctx.file}:`, e);
            }
        }
    });

    // Data
    loader.use({
        name: 'data',
        glob: ['**/*.data.yml', '**/*.data.yaml'],
        handler: (ctx) => {
            try {
                const content = ctx.content;
                const data = yaml.load(content);
                if (!Array.isArray(data)) return;

                const basename = path.basename(ctx.file);
                const objectName = basename.replace(/\.data\.ya?ml$/, '');
                
                const entry = ctx.registry.getEntry('object', objectName);
                if (entry) {
                    const config = entry.content as ObjectConfig;
                    config.data = data; 
                } else {
                    console.warn(`Found data for unknown object '${objectName}' in ${ctx.file}`);
                }
            } catch (e) {
                console.error(`Error loading data from ${ctx.file}:`, e);
            }
        }
    });

}

function registerObject(registry: any, obj: any, file: string, packageName?: string) {
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
    registry.register('object', {
        type: 'object',
        id: obj.name,
        path: file,
        package: packageName,
        content: obj
    });
}