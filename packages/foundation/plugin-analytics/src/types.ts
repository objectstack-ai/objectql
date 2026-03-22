/**
 * ObjectQL Plugin Analytics — Internal Types
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { AnalyticsQuery, AnalyticsResult, CubeMeta } from '@objectql/types';

// ============================================================================
// Cube Definition (manifest or inferred)
// ============================================================================

/** Measure definition within a cube */
export interface CubeMeasure {
    readonly name: string;
    readonly type: 'count' | 'sum' | 'avg' | 'min' | 'max' | 'countDistinct';
    /** Underlying field name in the datasource. Defaults to the measure name. */
    readonly field?: string;
    readonly title?: string;
}

/** Dimension definition within a cube */
export interface CubeDimension {
    readonly name: string;
    readonly type: 'string' | 'number' | 'time' | 'boolean';
    /** Underlying field name in the datasource. Defaults to the dimension name. */
    readonly field?: string;
    readonly title?: string;
}

/** A cube definition — either declared in a manifest or inferred from metadata. */
export interface CubeDefinition {
    /** Cube name — must be unique within the registry. */
    readonly name: string;
    /** Human-readable title */
    readonly title?: string;
    /** Underlying datasource object name (e.g. table or collection). */
    readonly objectName: string;
    /** Optional datasource key (defaults to 'default'). */
    readonly datasource?: string;
    readonly measures: readonly CubeMeasure[];
    readonly dimensions: readonly CubeDimension[];
}

// ============================================================================
// Logical Plan — driver-agnostic intermediate representation
// ============================================================================

export interface LogicalPlanMeasure {
    readonly cube: string;
    readonly measure: string;
    readonly aggregation: 'count' | 'sum' | 'avg' | 'min' | 'max' | 'countDistinct';
    readonly field: string;
    readonly alias: string;
}

export interface LogicalPlanDimension {
    readonly cube: string;
    readonly dimension: string;
    readonly field: string;
    readonly alias: string;
}

export interface LogicalPlanFilter {
    readonly field: string;
    readonly operator: string;
    readonly values?: string[];
}

export interface LogicalPlanTimeDimension {
    readonly field: string;
    readonly granularity?: string;
    readonly dateRange?: string | string[];
    readonly alias: string;
}

export interface LogicalPlan {
    readonly objectName: string;
    readonly datasource: string;
    readonly measures: readonly LogicalPlanMeasure[];
    readonly dimensions: readonly LogicalPlanDimension[];
    readonly filters: readonly LogicalPlanFilter[];
    readonly timeDimensions: readonly LogicalPlanTimeDimension[];
    readonly order?: Record<string, 'asc' | 'desc'>;
    readonly limit?: number;
    readonly offset?: number;
    readonly timezone?: string;
}

// ============================================================================
// Strategy interface — Physical compilation per driver type
// ============================================================================

export interface AnalyticsStrategy {
    readonly name: string;
    execute(plan: LogicalPlan, driver: unknown): Promise<AnalyticsResult>;
    generateSql?(plan: LogicalPlan): { sql: string; params: unknown[] };
}

// ============================================================================
// Plugin configuration
// ============================================================================

export interface AnalyticsPluginConfig {
    /** Pre-registered cube manifests. */
    readonly cubes?: readonly CubeDefinition[];
    /** When true, cubes are automatically inferred from registered metadata objects. Defaults to true. */
    readonly autoDiscover?: boolean;
    /** Map of datasource name → driver instance. Populated from kernel if omitted. */
    readonly datasources?: Record<string, unknown>;
}

// ============================================================================
// Re-exports for consumer convenience
// ============================================================================

export type { AnalyticsQuery, AnalyticsResult, CubeMeta };
