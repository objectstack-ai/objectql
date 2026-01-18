/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ActionContext, ActionHandler, MetadataRegistry } from '@objectql/types';

export interface ActionEntry {
    handler: ActionHandler;
    packageName?: string;
}

export function registerActionHelper(
    actions: Record<string, ActionEntry>,
    objectName: string,
    actionName: string,
    handler: ActionHandler,
    packageName?: string
) {
    const key = `${objectName}:${actionName}`;
    actions[key] = { handler, packageName };
}

export async function executeActionHelper(
    metadata: MetadataRegistry,
    runtimeActions: Record<string, ActionEntry>,
    objectName: string,
    actionName: string,
    ctx: ActionContext
) {
    // 1. Programmatic
    const key = `${objectName}:${actionName}`;
    const actionEntry = runtimeActions[key];
    if (actionEntry) {
        return await actionEntry.handler(ctx);
    }

    // 2. Registry (File-based)
    const fileActions = metadata.get<any>('action', objectName);
    if (fileActions && typeof fileActions[actionName] === 'function') {
        return await fileActions[actionName](ctx);
    }

    throw new Error(`Action '${actionName}' not found for object '${objectName}'`);
}
