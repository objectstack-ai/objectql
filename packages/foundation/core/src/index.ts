/**
 * ObjectQL Core — DEPRECATED
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @deprecated This package is deprecated. Migrate to `@objectstack/objectql` and individual plugins.
 * See: https://github.com/objectstack-ai/spec/blob/main/content/docs/guides/objectql-migration.mdx
 *
 * Phase A–C of the deprecation plan have been completed:
 *   - ObjectQLPlugin aggregator: deprecated → compose plugins directly
 *   - ObjectQL bridge class: deprecated → use @objectstack/objectql directly
 *   - kernel-factory: deprecated → use new ObjectStackKernel([...]) directly
 *   - util functions: moved to @objectql/types
 *   - repository: re-exported from @objectstack/objectql
 */

// ── Bridge engine (deprecated — use @objectstack/objectql ObjectQL directly) ──
/** @deprecated Import ObjectQL from `@objectstack/objectql` instead. This bridge class will be removed in v5.0. */
export { ObjectQL, type ObjectQLConfig } from './app';

// ── Convenience factory (deprecated — use new ObjectStackKernel([...]) directly) ──
/** @deprecated Use `new ObjectStackKernel([...plugins])` from `@objectstack/runtime` instead. Will be removed in v5.0. */
export { createObjectQLKernel } from './kernel-factory';
/** @deprecated Use `@objectstack/runtime` types instead. Will be removed in v5.0. */
export type { ObjectQLKernelOptions } from './kernel-factory';

// ── Re-exports from @objectstack/objectql (deprecated — import directly from upstream) ──
/** @deprecated Import from `@objectstack/objectql` instead. */
export { ObjectRepository, ScopedContext, SchemaRegistry } from '@objectstack/objectql';
/** @deprecated Import from `@objectstack/objectql` instead. */
export { toTitleCase, convertIntrospectedSchemaToObjects } from '@objectstack/objectql';
/** @deprecated Import from `@objectstack/objectql` instead. */
export type { HookHandler, HookEntry, OperationContext, EngineMiddleware, ObjectQLHostContext } from '@objectstack/objectql';

// ── Plugin orchestration (deprecated — compose plugins directly) ──
/** @deprecated Import and compose plugins individually from their packages instead. */
export * from './plugin';
