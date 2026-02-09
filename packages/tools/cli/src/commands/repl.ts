/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as repl from 'repl';
import * as _path from 'path';
import * as _fs from 'fs';
import { ObjectQL } from '@objectql/core';
import { register } from 'ts-node';
import { resolveConfigFile } from '../utils/config-loader';

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
    const configFile = resolveConfigFile(configPath, cwd);

    console.log(`🚀 Loading configuration from ${configFile}...`);
    
    try {
        const configModule = require(configFile);
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
                        // Dynamic require to avoid circular dependency — ObjectRepository is constructed
                        // from the user-provided app instance to enable convenient REPL access.
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
