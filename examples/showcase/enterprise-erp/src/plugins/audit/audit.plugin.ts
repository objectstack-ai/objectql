/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Import ObjectQLPlugin types from @objectql/core instead of @objectstack/runtime
// to avoid ESM/CJS compatibility issues
type RuntimeContext = any;

interface ObjectQLPlugin {
    name: string;
    init: (ctx: any) => void | Promise<void>;
}

const AuditLogPlugin: ObjectQLPlugin = {
    name: 'audit-log',
    
    async init(ctx: any) {
        console.log('[AuditLogPlugin] Init...');
        // Plugin installation logic here
        console.log('[AuditLogPlugin] Plugin initialized');
    }
};

export default AuditLogPlugin;
