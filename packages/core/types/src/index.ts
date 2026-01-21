/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * @objectql/types - Type definitions for ObjectQL v4.0
 * 
 * This package provides the core TypeScript type definitions for ObjectQL's
 * plugin-based architecture. It includes:
 * 
 * - Plugin interfaces (QueryProcessorPlugin, RepositoryPlugin)
 * - Query types (UnifiedQuery, FilterExpression)
 * - Runtime context and options
 * 
 * Key principles:
 * - Zero dependencies on other @objectql packages
 * - Depends only on @objectstack/spec and @objectstack/runtime
 * - Strict type safety
 * - Protocol-driven design
 */

// ============================================================================
// Plugin System
// ============================================================================

export * from './plugin';
export * from './query-processor';
export * from './repository';

// ============================================================================
// Query System
// ============================================================================

export * from './query';

// ============================================================================
// Re-exports from @objectstack packages
// ============================================================================

/**
 * Re-export commonly used types from @objectstack/spec
 * This provides a convenient import path for ObjectQL users.
 */
export type { 
    DriverInterface,
    // Add other spec types as needed
} from '@objectstack/spec';

/**
 * Re-export commonly used types from @objectstack/runtime
 * This provides a convenient import path for ObjectQL users.
 */
export type {
    // RuntimePlugin,
    // Runtime,
    // Add other runtime types as needed
} from '@objectstack/runtime';
