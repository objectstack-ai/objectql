/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// ── Re-export upstream canonical engine ──
export type { ObjectKernel } from '@objectstack/runtime';
export type { ObjectStackProtocolImplementation } from '@objectstack/objectql';

// Re-export new @objectstack/objectql 1.1.0 FQN (Fully Qualified Name) utilities
export {
    computeFQN,
    parseFQN,
    RESERVED_NAMESPACES,
    DEFAULT_OWNER_PRIORITY,
    DEFAULT_EXTENDER_PRIORITY,
    SchemaRegistry,
} from '@objectstack/objectql';
export type { ObjectContributor } from '@objectstack/objectql';

// Re-export upstream types exported by @objectstack/objectql for plugin authors
export type {
    ObjectQLHostContext,
    HookHandler as UpstreamHookHandler,
    HookEntry,
    OperationContext,
    EngineMiddleware,
} from '@objectstack/objectql';

// Export ObjectStack spec types for driver development
import { Data, Automation } from '@objectstack/spec';
import { z } from 'zod';
export { QueryAST } from '@objectql/types';
export type DriverInterface = z.infer<typeof Data.DriverInterfaceSchema>;
export type DriverOptions = z.infer<typeof Data.DriverOptionsSchema>;

// Re-export new @objectstack/spec 1.1.0 types
export type StateMachineConfig = z.infer<typeof Automation.StateMachineSchema>;
export type ObjectOwnership = z.infer<typeof Data.ObjectOwnershipEnum>;
export type ObjectExtension = z.infer<typeof Data.ObjectExtensionSchema>;

// ── Convenience factory ──
export { createObjectQLKernel, type ObjectQLKernelOptions } from './kernel-factory';

// ── Gateway (kept in core — upstream server handles API layer) ──
export * from './gateway';

// ── Core runtime components (backward compatibility) ──
export * from './repository';
export * from './app';
export * from './plugin';

// ── Utilities ──
export * from './util';

// ── AI runtime (kept in core — separate AI project) ──
export * from './ai';

// ── Re-export from @objectql/plugin-query (backward compatibility) ──
// Import from '@objectql/plugin-query' directly for new code.

/** @deprecated Import from '@objectql/plugin-query' instead */
export { QueryService } from '@objectql/plugin-query';
/** @deprecated Import from '@objectql/plugin-query' instead */
export { QueryBuilder } from '@objectql/plugin-query';
/** @deprecated Import from '@objectql/plugin-query' instead */
export { QueryAnalyzer } from '@objectql/plugin-query';
/** @deprecated Import from '@objectql/plugin-query' instead */
export { FilterTranslator } from '@objectql/plugin-query';
/** @deprecated Import from '@objectql/plugin-query' instead */
export { QueryPlugin } from '@objectql/plugin-query';

export type {
    QueryOptions,
    QueryResult,
    QueryProfile,
} from '@objectql/plugin-query';
export type {
    QueryPlan,
    ProfileResult,
    QueryStats,
} from '@objectql/plugin-query';

// ── Re-export from @objectql/plugin-optimizations (backward compatibility) ──
// Import from '@objectql/plugin-optimizations' directly for new code.

/** @deprecated Import from '@objectql/plugin-optimizations' instead */
export { OptimizedMetadataRegistry } from '@objectql/plugin-optimizations';
/** @deprecated Import from '@objectql/plugin-optimizations' instead */
export { QueryCompiler } from '@objectql/plugin-optimizations';
/** @deprecated Import from '@objectql/plugin-optimizations' instead */
export { CompiledHookManager } from '@objectql/plugin-optimizations';
/** @deprecated Import from '@objectql/plugin-optimizations' instead */
export { GlobalConnectionPool } from '@objectql/plugin-optimizations';
/** @deprecated Import from '@objectql/plugin-optimizations' instead */
export { OptimizedValidationEngine } from '@objectql/plugin-optimizations';
/** @deprecated Import from '@objectql/plugin-optimizations' instead */
export { LazyMetadataLoader } from '@objectql/plugin-optimizations';
/** @deprecated Import from '@objectql/plugin-optimizations' instead */
export { DependencyGraph } from '@objectql/plugin-optimizations';
/** @deprecated Import from '@objectql/plugin-optimizations' instead */
export { SQLQueryOptimizer } from '@objectql/plugin-optimizations';
/** @deprecated Import from '@objectql/plugin-optimizations' instead */
export { OptimizationsPlugin } from '@objectql/plugin-optimizations';

export type { CompiledQuery } from '@objectql/plugin-optimizations';
export type { Hook } from '@objectql/plugin-optimizations';
export type { Connection, PoolLimits } from '@objectql/plugin-optimizations';
export type { ValidatorFunction, ValidationSchema } from '@objectql/plugin-optimizations';
export type { ObjectMetadata, MetadataLoader } from '@objectql/plugin-optimizations';
export type { DependencyEdge, DependencyType } from '@objectql/plugin-optimizations';
export type { IndexMetadata, SchemaWithIndexes, OptimizableQueryAST } from '@objectql/plugin-optimizations';
