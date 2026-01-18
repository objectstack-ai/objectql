/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export type FilterCriterion = [string, string, any];
export type FilterExpression = FilterCriterion | 'and' | 'or' | FilterExpression[];

export type AggregateFunction = 'count' | 'sum' | 'avg' | 'min' | 'max';

export interface AggregateOption {
    func: AggregateFunction;
    field: string;
    alias?: string; // Optional: rename the result field
}

export interface UnifiedQuery {
    fields?: string[];
    filters?: FilterExpression[];
    sort?: [string, 'asc' | 'desc'][];
    skip?: number;
    limit?: number;
    expand?: Record<string, UnifiedQuery>;
    
    // === Aggregation Support ===
    groupBy?: string[];
    aggregate?: AggregateOption[];
}
