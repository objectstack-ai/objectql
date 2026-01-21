/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { PluginDefinition, PluginContextData } from '@objectql/types';

const AuditLogPlugin: PluginDefinition = {
    id: 'audit-log',
    
    onEnable: async (context: PluginContextData) => {
        console.log('[AuditLogPlugin] Enabling...');

        // TODO: Register event handlers using the new context API
        // The PluginContextData provides:
        // - context.events for event handling
        // - context.ql for data access
        // - context.logger for logging
        
        // For now, we'll just log that the plugin is enabled
        context.logger.info('[AuditLogPlugin] Plugin enabled');
        
        // Note: The new plugin system uses context.events instead of app.on()
        // This will need to be implemented when the events API is available
    }
};

export default AuditLogPlugin;
