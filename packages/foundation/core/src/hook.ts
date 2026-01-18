/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { HookContext, HookHandler, HookName, MetadataRegistry } from '@objectql/types';

export interface HookEntry {
    objectName: string;
    handler: HookHandler;
    packageName?: string;
}

export function registerHookHelper(
    hooks: Record<string, HookEntry[]>,
    event: HookName,
    objectName: string,
    handler: HookHandler,
    packageName?: string
) {
    if (!hooks[event]) {
        hooks[event] = [];
    }
    hooks[event].push({ objectName, handler, packageName });
}

export async function triggerHookHelper(
    metadata: MetadataRegistry,
    runtimeHooks: Record<string, HookEntry[]>,
    event: HookName,
    objectName: string,
    ctx: HookContext
) {
    // 1. Registry Hooks (File-based)
    const fileHooks = metadata.get<any>('hook', objectName);
    if (fileHooks && typeof fileHooks[event] === 'function') {
        await fileHooks[event](ctx);
    }

    // 2. Programmatic Hooks
    const hooks = runtimeHooks[event] || [];
    for (const hook of hooks) {
        if (hook.objectName === '*' || hook.objectName === objectName) {
            await hook.handler(ctx);
        }
    }
}
