/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Data } from '@objectstack/spec';
import { z } from 'zod';

// Re-export Filter definitions from Spec
export type Filter = z.infer<typeof Data.FilterCondition>;

// Re-export Sort definitions from Spec
export type SortNode = z.infer<typeof Data.SortNodeSchema>;

// Re-export Aggregation definitions from Spec
export type AggregationFunctionType = z.infer<typeof Data.AggregationFunction>;
export type AggregationNode = z.infer<typeof Data.AggregationNodeSchema>;

/**
 * Unified Query Interface - Standard Protocol Format
 * 
 * Uses @objectstack/spec QuerySchema inference directly.
 * We make 'object' optional because in many contexts (like Repository.find), 
 * the object is implicit.
 */
type SpecQuery = z.infer<typeof Data.QuerySchema>;

export interface UnifiedQuery extends Omit<SpecQuery, 'object'> {
    object?: string;
}

/**
 * Standard QueryAST definition.
 * Aliased to UnifiedQuery for backward compatibility and consistency.
 */
export type QueryAST = UnifiedQuery;

// Legacy types - Deprecated, kept for temporary compatibility during migration
/** @deprecated Use AggregationFunctionType instead */
export type AggregateFunction = AggregationFunctionType;

/** @deprecated Use AggregationNode instead */
export interface AggregateOption {
    func: AggregateFunction;
    field: string;
    alias?: string;
}
