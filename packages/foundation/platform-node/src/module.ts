/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ObjectLoader } from './loader';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Resolves a list of module names (npm packages or local paths) to their paths
 * and loads them using ObjectLoader.
 */
export async function loadModules(loader: ObjectLoader, modules: string[]) {
    if (!modules || modules.length === 0) return;
    
    for (const moduleName of modules) {
        try {
            // Check if it is a local path
            if (moduleName.startsWith('./') || moduleName.startsWith('/') || moduleName.startsWith('../')) {
                 const localPath = path.resolve(process.cwd(), moduleName);
                 if (fs.existsSync(localPath)) {
                     loader.load(localPath);
                     continue;
                 }
            }

            // 1. Resolve package path
            // We use require.resolve to find the entry point, then go up to find the package root
            const entryPath = require.resolve(moduleName, { paths: [process.cwd()] });
            
            // Let's try to find the package root directory
            let currentDir = path.dirname(entryPath);
            let packageRoot = '';
            
            // Go up until we find package.json
            while (currentDir !== path.parse(currentDir).root) {
                if (fs.existsSync(path.join(currentDir, 'package.json'))) {
                    // Check if name matches
                    try {
                        const pkg = require(path.join(currentDir, 'package.json'));
                        if (pkg.name === moduleName) {
                            packageRoot = currentDir;
                            break;
                        }
                    } catch (_e) { /* package.json parse error — skip directory */ }
                }
                currentDir = path.dirname(currentDir);
            }

            if (!packageRoot) {
                packageRoot = path.dirname(entryPath);
            }

            // Now, where is the schema?
            // Convention: check 'src', then root.
            const srcDir = path.join(packageRoot, 'src');
            const targetDir = fs.existsSync(srcDir) ? srcDir : packageRoot;
            
            loader.load(targetDir);

        } catch (_e: any) {
            // Module load failed — continue to next module
        }
    }
}


