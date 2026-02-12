/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// ── Convenience factory ──
export { createObjectQLKernel, type ObjectQLKernelOptions } from './kernel-factory';

// ── Re-export upstream engine (replaces local app.ts + repository.ts) ──
export { ObjectQL, ObjectRepository, ScopedContext, SchemaRegistry } from '@objectstack/objectql';
export type { HookHandler, HookEntry, OperationContext, EngineMiddleware, ObjectQLHostContext } from '@objectstack/objectql';

// ── Plugin orchestration ──
export * from './plugin';

// ── Utilities ──
export * from './util';
