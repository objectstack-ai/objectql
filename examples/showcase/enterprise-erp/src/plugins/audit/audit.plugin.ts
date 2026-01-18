/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ObjectQLPlugin, IObjectQL, MutationHookContext } from '@objectql/types';

export class AuditLogPlugin implements ObjectQLPlugin {
    name = 'audit-log';

    setup(app: IObjectQL) {
        console.log('[AuditLogPlugin] Setting up...');

        // 1. Listen to all 'afterCreate' events
        app.on('afterCreate', '*', async (ctx) => {
            // Narrow down context type or use assertion since 'afterCreate' is Mutation
            const mutationCtx = ctx as MutationHookContext;
            const userId = mutationCtx.user?.id || 'Guest';
            console.log(`[Audit] Created ${mutationCtx.objectName} (ID: ${mutationCtx.id}) by User ${userId}`);
        });

        // 2. Listen to all 'afterDelete' events
        app.on('afterDelete', '*', async (ctx) => {
            const mutationCtx = ctx as MutationHookContext;
            console.log(`[Audit] Deleted ${mutationCtx.objectName} (ID: ${mutationCtx.id})`);
        });
    }
}
