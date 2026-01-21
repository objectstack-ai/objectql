/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ObjectQLPlugin, PluginDefinition } from '@objectql/types';

export function loadPlugin(packageName: string): ObjectQLPlugin | PluginDefinition {
    let mod: any;
    try {
        const modulePath = require.resolve(packageName, { paths: [process.cwd()] });
        mod = require(modulePath);
    } catch (e) {
        throw new Error(`Failed to resolve plugin '${packageName}': ${e}`);
    }

    // Helper to check if candidate is a legacy ObjectQLPlugin
    const isLegacyPlugin = (candidate: any): candidate is ObjectQLPlugin => {
        return candidate && typeof candidate.setup === 'function' && candidate.name;
    };

    // Helper to check if candidate is a new PluginDefinition
    const isNewPlugin = (candidate: any): candidate is PluginDefinition => {
        return candidate && (
            typeof candidate.onEnable === 'function' ||
            typeof candidate.onDisable === 'function' ||
            typeof candidate.onInstall === 'function' ||
            typeof candidate.onUninstall === 'function' ||
            typeof candidate.onUpgrade === 'function'
        );
    };

    // Helper to find plugin instance
    const findPlugin = (candidate: any): ObjectQLPlugin | PluginDefinition | undefined => {
            if (!candidate) return undefined;
            
            // 1. Check if it's a new PluginDefinition
            if (isNewPlugin(candidate)) {
                return candidate;
            }

            // 2. Try treating as Class (legacy)
            if (typeof candidate === 'function') {
                try {
                    const inst = new candidate();
                    if (isLegacyPlugin(inst)) {
                        return inst;
                    }
                    if (isNewPlugin(inst)) {
                        return inst;
                    }
                } catch (e) {
                    // Not a constructor or instantiation failed
                }
            }

            // 3. Try treating as Instance (legacy)
            if (isLegacyPlugin(candidate)) {
                return candidate;
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
        console.error(`[PluginLoader] Failed to find plugin in '${packageName}'. Exports:`, Object.keys(mod));
        throw new Error(`Plugin '${packageName}' must export a PluginDefinition (with lifecycle hooks) or legacy ObjectQLPlugin (with setup method).`);
    }
}
