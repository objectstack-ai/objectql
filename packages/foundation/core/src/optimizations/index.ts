/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Kernel Optimizations Module
 * 
 * This module contains 10 key optimizations for the ObjectQL kernel:
 * 
 * 1. OptimizedMetadataRegistry - O(k) package uninstall with secondary indexes
 * 2. QueryCompiler - LRU cache for compiled query plans
 * 3. CompiledHookManager - Pre-compiled hook pipelines
 * 4. GlobalConnectionPool - Kernel-level connection pooling
 * 5. OptimizedValidationEngine - Compiled validation rules
 * 6. LazyMetadataLoader - On-demand metadata loading with predictive preload
 * 7. DependencyGraph - DAG-based dependency resolution
 * 8. SQLQueryOptimizer - SQL-aware query optimization with index hints
 * 
 * Note: TypeScript type generation optimization (#7) and memory-mapped storage (#10)
 * are not included in this release for compatibility and complexity reasons.
 */

export { OptimizedMetadataRegistry } from './OptimizedMetadataRegistry';
export { QueryCompiler, type CompiledQuery } from './QueryCompiler';
export { CompiledHookManager, type Hook } from './CompiledHookManager';
export { GlobalConnectionPool, type Connection, type PoolLimits } from './GlobalConnectionPool';
export { OptimizedValidationEngine, type ValidatorFunction, type ValidationSchema } from './OptimizedValidationEngine';
export { LazyMetadataLoader, type ObjectMetadata, type MetadataLoader } from './LazyMetadataLoader';
export { DependencyGraph, type DependencyEdge, type DependencyType } from './DependencyGraph';
export { SQLQueryOptimizer, type IndexMetadata, type SchemaWithIndexes, type OptimizableQueryAST } from './SQLQueryOptimizer';
