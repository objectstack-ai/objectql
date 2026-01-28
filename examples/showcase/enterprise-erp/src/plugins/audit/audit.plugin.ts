/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Import RuntimePlugin types from @objectstack/core instead of @objectstack/runtime
// to avoid ESM/CJS compatibility issues
interface RuntimeContext {
    engine: any; // ObjectStackKernel
}

interface RuntimePlugin {
    name: string;
    install?: (ctx: RuntimeContext) => void | Promise<void>;
    onStart?: (ctx: RuntimeContext) => void | Promise<void>;
}

const AuditLogPlugin: RuntimePlugin = {
    name: 'audit-log',
    
    async install(ctx: RuntimeContext) {
        console.log('[AuditLogPlugin] Installing...');
        // Plugin installation logic here
    },
    
    async onStart(ctx: RuntimeContext) {
        console.log('[AuditLogPlugin] Starting...');
        
        // TODO: Register event handlers using the runtime context
        // The RuntimeContext provides:
        // - ctx.engine for accessing the kernel
        
        // For now, we'll just log that the plugin is started
        console.log('[AuditLogPlugin] Plugin started');
        
        // Note: The new plugin system uses RuntimeContext instead of PluginContextData
        // This will need to be enhanced when the full events API is available
    }
};

export default AuditLogPlugin;
