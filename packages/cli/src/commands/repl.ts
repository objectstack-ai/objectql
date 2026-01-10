import * as repl from 'repl';
import * as path from 'path';
import * as fs from 'fs';
import { ObjectQL } from '@objectql/core';
import { register } from 'ts-node';

export async function startRepl(configPath?: string) {
    const cwd = process.cwd();
    
    // Register ts-node to handle TS config loading
    register({
        transpileOnly: true,
        compilerOptions: {
            module: "commonjs"
        }
    });

    // 1. Resolve Config File
    let configFile = configPath;
    if (!configFile) {
        const potentialFiles = ['objectql.config.ts', 'objectql.config.js'];
        for (const file of potentialFiles) {
            if (fs.existsSync(path.join(cwd, file))) {
                configFile = file;
                break;
            }
        }
    }

    if (!configFile) {
        console.error("❌ No configuration file found (objectql.config.ts/js).");
        console.log("Please create one that exports an ObjectQL instance.");
        process.exit(1);
    }

    console.log(`🚀 Loading configuration from ${configFile}...`);
    
    try {
        const configModule = require(path.join(cwd, configFile));
        // Support default export or named export 'app' or 'objectql' or 'db'
        const app = configModule.default || configModule.app || configModule.objectql || configModule.db;

        if (!(app instanceof ObjectQL)) {
            console.error("❌ The config file must export an instance of 'ObjectQL' as default or 'app'/'db'.");
            process.exit(1);
        }

        // 2. Init ObjectQL
        await app.init();
        console.log("✅ ObjectQL Initialized.");

        // 3. Start REPL
        const r = repl.start({
            prompt: 'objectql> ',
            useColors: true
        });

        // Enable Auto-Await for Promises
        const defaultEval = r.eval;
        (r as any).eval = (cmd: string, context: any, filename: string, callback: any) => {
            defaultEval.call(r, cmd, context, filename, async (err: Error | null, result: any) => {
                if (err) return callback(err, null);
                if (result && typeof result.then === 'function') {
                    try {
                        const value = await result;
                        callback(null, value);
                    } catch (e: any) {
                        callback(e, null);
                    }
                } else {
                    callback(null, result);
                }
            });
        };

        // 4. Inject Context
        r.context.app = app;
        r.context.db = app; // Alias for db
        r.context.object = (name: string) => app.getObject(name);
        
        // Helper to get a repo quickly: tasks.find() instead of app.object('tasks').find()
        const objects = app.metadata.list('object');
        for (const obj of objects) {
            // Inject repositories as top-level globals if valid identifiers
            if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(obj.name)) {
                // We use a getter to lazily create context with system privileges
                Object.defineProperty(r.context, obj.name, {
                    get: () => {
                        // HACK: We need to construct a repository. 
                        // Since `ObjectRepository` is exported from `@objectql/core`, we can use it if we import it.
                        // But `app` is passed from user land. We can rely on `require('@objectql/core')` here.
                        const { ObjectRepository } = require('@objectql/core');
                        
                        const replContext: any = {
                            roles: ['admin'],
                            isSystem: true,
                            userId: 'REPL'
                        };
                        
                        replContext.object = (n: string) => new ObjectRepository(n, replContext, app);
                        replContext.transaction = async (cb: any) => cb(replContext);
                        replContext.sudo = () => replContext;

                        return new ObjectRepository(obj.name, replContext, app);
                    }
                });
            }
        }

        console.log(`\nAvailable Objects: ${objects.map((o: any) => o.name).join(', ')}`);
        console.log(`Usage: tasks.find()  (Auto-await enabled)`);
        
        // Fix for REPL sometimes not showing prompt immediately
        r.displayPrompt();

    } catch (error) {
        console.error("Failed to load or start:", error);
        process.exit(1);
    }
}
