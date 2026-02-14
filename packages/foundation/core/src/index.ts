/**
 * ObjectQL Core — DEPRECATED
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @deprecated This package is deprecated. Migrate to `@objectstack/objectql`.
 * See: https://github.com/objectstack-ai/spec/blob/main/content/docs/guides/objectql-migration.mdx
 */

// ── Re-exports from @objectstack/objectql (deprecated — import directly from upstream) ──

/** @deprecated Import from `@objectstack/objectql` instead. */
export { ObjectQL } from '@objectstack/objectql';
/** @deprecated Import from `@objectstack/objectql` instead. */
export { ObjectRepository, ScopedContext, SchemaRegistry } from '@objectstack/objectql';
/** @deprecated Import from `@objectstack/objectql` instead. */
export { createObjectQLKernel } from '@objectstack/objectql';
/** @deprecated Import from `@objectstack/objectql` instead. */
export { toTitleCase, convertIntrospectedSchemaToObjects } from '@objectstack/objectql';
/** @deprecated Import from `@objectstack/objectql` instead. */
export type { ObjectQLKernelOptions, HookHandler, HookEntry, OperationContext, EngineMiddleware, ObjectQLHostContext } from '@objectstack/objectql';

// ── Plugin orchestration (downstream — stays in @objectql ecosystem) ──
export * from './plugin';
