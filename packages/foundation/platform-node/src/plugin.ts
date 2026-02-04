/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Kernel } from '@objectstack/spec';
type PluginDefinition = Kernel.PluginDefinition;

export function loadPlugin(packageName: string): PluginDefinition {
    let mod: any;
    try {
        const modulePath = require.resolve(packageName, { paths: [process.cwd()] });
        mod = require(modulePath);
    } catch (e) {
        throw new Error(`Failed to resolve plugin '${packageName}': ${e}`);
    }

    // Helper to check if candidate is a PluginDefinition
    const isPlugin = (candidate: any): candidate is PluginDefinition => {
        return candidate && (
            // Check for any lifecycle method
            typeof candidate.onEnable === 'function' ||
            typeof candidate.onDisable === 'function' ||
            typeof candidate.onInstall === 'function' ||
            typeof candidate.onUninstall === 'function' ||
            typeof candidate.onUpgrade === 'function'
        ) && (
            // Note: id is optional in PluginDefinition, so we don't require it
            // The spec allows plugins without id (it just defaults to package name)
            candidate.id === undefined || typeof candidate.id === 'string'
        );
    };

    // Helper to find plugin instance
    const findPlugin = (candidate: any): PluginDefinition | undefined => {
            if (!candidate) return undefined;
            
            // 1. Check if it's a PluginDefinition
            if (isPlugin(candidate)) {
                return candidate;
            }

            // 2. Try treating as Class
            if (typeof candidate === 'function') {
                try {
                    const inst = new candidate();
                    if (isPlugin(inst)) {
                        return inst;
                    }
                } catch (e) {
                    // Not a constructor or instantiation failed
                }
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
        throw new Error(`Plugin '${packageName}' must export a PluginDefinition with lifecycle hooks (onEnable, onDisable, etc.).`);
    }
}
