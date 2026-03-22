/**
 * ObjectQL Plugin Analytics
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Multi-database analytical query plugin for ObjectQL.
 * Provides strategy-based driver dispatch for SQL, MongoDB, and in-memory engines.
 *
 * @example
 * ```typescript
 * import { AnalyticsPlugin } from '@objectql/plugin-analytics';
 *
 * const kernel = new ObjectStackKernel([
 *   new AnalyticsPlugin({ autoDiscover: true }),
 * ]);
 * ```
 */

export { AnalyticsPlugin } from './plugin';
export { AnalyticsService } from './analytics-service';
export { CubeRegistry } from './cube-registry';
export { SemanticCompiler } from './semantic-compiler';
export { NativeSQLStrategy } from './strategy-sql';
export { ObjectQLStrategy } from './strategy-objectql';
export { MemoryFallbackStrategy } from './strategy-memory';

export type {
    CubeDefinition,
    CubeMeasure,
    CubeDimension,
    LogicalPlan,
    LogicalPlanMeasure,
    LogicalPlanDimension,
    LogicalPlanFilter,
    LogicalPlanTimeDimension,
    AnalyticsStrategy,
    AnalyticsPluginConfig,
} from './types';

// Re-export spec types for consumer convenience
export type { AnalyticsQuery, AnalyticsResult, CubeMeta } from './types';
