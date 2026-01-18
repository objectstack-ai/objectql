/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ObjectQLPlugin } from '@objectql/types';

export function loadPlugin(packageName: string): ObjectQLPlugin {
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
        return instance;
    } else {
        console.error(`[PluginLoader] Failed to find ObjectQLPlugin in '${packageName}'. Exports:`, Object.keys(mod));
        throw new Error(`Plugin '${packageName}' must export a class or object implementing ObjectQLPlugin.`);
    }
}
