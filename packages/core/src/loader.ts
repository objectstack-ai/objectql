import { MetadataRegistry } from './registry';
import { ObjectConfig } from './types';
import { MetadataLoader as BaseLoader, registerObjectQLPlugins } from '@objectql/metadata';
import * as yaml from 'js-yaml';

export class MetadataLoader extends BaseLoader {
    constructor(registry: MetadataRegistry) {
        super(registry);
        registerObjectQLPlugins(this);
        
        // Register Security Plugins
        this.use({
            name: 'policy',
            glob: ['**/*.policy.yml', '**/*.policy.yaml'],
            handler: (ctx) => {
                if (ctx.content) {
                    try {
                        const content = yaml.load(ctx.content) as any;
                        if (content && content.name) {
                            ctx.registry.register('policy', {
                                type: 'policy',
                                id: content.name,
                                content: content
                            });
                        }
                    } catch (e) {
                            console.error(`Error loading policy ${ctx.file}`, e);
                    }
                }
            }
        });
        
        this.use({
            name: 'role',
            glob: ['**/*.role.yml', '**/*.role.yaml'],
            handler: (ctx) => {
                if (ctx.content) {
                    try {
                        const content = yaml.load(ctx.content) as any;
                        if (content && content.name) {
                            ctx.registry.register('role', {
                                type: 'role',
                                id: content.name,
                                content: content
                            });
                        }
                    } catch (e) {
                            console.error(`Error loading role ${ctx.file}`, e);
                    }
                }
            }
        });
    }

}

export function loadObjectConfigs(dir: string): Record<string, ObjectConfig> {
    const registry = new MetadataRegistry();
    const loader = new MetadataLoader(registry);
    loader.load(dir);
    const result: Record<string, ObjectConfig> = {};
    for (const obj of registry.list<ObjectConfig>('object')) {
        result[obj.name] = obj;
    }
    return result;
}

