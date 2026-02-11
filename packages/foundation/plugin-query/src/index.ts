/**
 * @objectql/plugin-query
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Query Plugin
 * 
 * Provides query execution and analysis capabilities:
 * - QueryService — query execution with profiling support
 * - QueryBuilder — builds ObjectStack QueryAST from ObjectQL UnifiedQuery
 * - QueryAnalyzer — query performance analysis and optimization suggestions
 */

export { QueryPlugin } from './plugin';
export { QueryService, type QueryOptions, type QueryResult, type QueryProfile } from './query-service';
export { QueryBuilder } from './query-builder';
export { QueryAnalyzer, type QueryPlan, type ProfileResult, type QueryStats } from './query-analyzer';
export { FilterTranslator } from './filter-translator';
