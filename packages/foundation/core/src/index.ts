/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// ── Convenience factory ──
export { createObjectQLKernel, type ObjectQLKernelOptions } from './kernel-factory';

// ── Re-export bridge engine (extends upstream with MetadataRegistry + legacy config) ──
export { ObjectQL, type ObjectQLConfig } from './app';
export { ObjectRepository, ScopedContext, SchemaRegistry } from '@objectstack/objectql';
export type { HookHandler, HookEntry, OperationContext, EngineMiddleware, ObjectQLHostContext } from '@objectstack/objectql';

// ── Plugin orchestration ──
export * from './plugin';

// ── Utilities ──
export * from './util';
