import * as fs from 'fs';
import * as glob from 'fast-glob';
import * as path from 'path';
import { MetadataRegistry } from './registry';

export interface LoaderHandlerContext {
    file: string;
    content: string; // for text files
    registry: MetadataRegistry;
    packageName?: string;
}

export type LoaderHandler = (ctx: LoaderHandlerContext) => void;

export interface LoaderPlugin {
    name: string;
    glob: string[];
    handler: LoaderHandler;
    options?: any;
    // Should we support binary reading? Assuming text for now or handler can re-read
}

export class MetadataLoader {
    private plugins: LoaderPlugin[] = [];

    constructor(protected registry: MetadataRegistry) {}

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
                // Determine if we need to read content? 
                // Let's passed path, and maybe content lazily?
                // For now, read content if it's not a .js/.ts file (which are usually required)
                // Actually, let the handler decide? But interface has `content`.
                // Let's just provide content for convenience for now if it's small config files.
                // Or better, let the handler do fs.readFileSync if needed, to avoid reading large files unnecessarily.
                // But user wants "metadata loading", usually implying config files.

                // Refined Context: 
                // Only read if extension suggests text/yaml/json?
                // Let's just pass path to handler, remove content from required context?
                const ctx: LoaderHandlerContext = {
                    file,
                    content: '', // Handler should read if needed? Or we helper it.
                    registry: this.registry,
                    packageName
                };
                
                // Pre-read for convenience?
                // Only if not .js/ts/node
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
