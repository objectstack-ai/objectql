/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * @objectql/types - Query-Specific Type Definitions
 * 
 * Version: 4.0.0 (Migration to @objectstack/runtime plugin architecture)
 * 
 * This package contains ONLY query-specific type definitions.
 * General runtime types are delegated to @objectstack packages.
 * 
 * Architecture:
 * - Query-specific types: Defined here (QueryFilter, QueryOptions, etc.)
 * - General types: Re-exported from @objectstack for convenience
 * - Protocol types: Re-exported from @objectstack/spec
 */

// ============================================================================
// QUERY-SPECIFIC TYPES (Core ObjectQL Features)
// ============================================================================
// These are the types that define ObjectQL's query extension capabilities

/** Query types - advanced filtering, sorting, aggregation */
export * from './query';

/** Driver introspection types - for query optimization */
export * from './driver';

/** Repository types - query interface patterns */
export * from './repository';


// ============================================================================
// RE-EXPORTS FROM @objectstack FOR CONVENIENCE
// ============================================================================
// These types are defined in @objectstack but re-exported here for backward
// compatibility. They will be removed in v5.0.0.
//
// Migration Guide:
// - Old: import { FilterCondition } from '@objectql/types';
// - New: import { FilterCondition } from '@objectstack/spec';

/**
 * @deprecated Import from @objectstack/spec directly.
 * 
 * This re-export will be removed in v5.0.0.
 * 
 * @example
 * ```typescript
 * // Old (v3.x - deprecated)
 * import { FilterCondition } from '@objectql/types';
 * 
 * // New (v4.0+ - recommended)
 * import { FilterCondition } from '@objectstack/spec';
 * ```
 */
export type { FilterCondition } from '@objectstack/spec';

/**
 * @deprecated Import from @objectstack/runtime directly.
 * 
 * This re-export will be removed in v5.0.0.
 * 
 * @example
 * ```typescript
 * // Old (v3.x - deprecated)
 * import { RuntimePlugin } from '@objectql/types';
 * 
 * // New (v4.0+ - recommended)
 * import { RuntimePlugin } from '@objectstack/runtime';
 * ```
 */
export type { RuntimePlugin } from '@objectstack/runtime';

// TODO: Add remaining re-exports in future commits
// - DriverInterface from @objectstack/spec
// - MetadataRegistry from @objectstack/types (when available)
// - ObjectConfig from @objectstack/types (when available)
// - FieldConfig from @objectstack/types (when available)
// - ObjectQLContext from @objectstack/types (when available)
// - HookHandler from @objectstack/runtime (when available)
// - ActionHandler from @objectstack/runtime (when available)


// ============================================================================
// OBJECTQL-OWNED TYPES (Kept for now, may migrate later)
// ============================================================================
// These types are currently in ObjectQL but may move to @objectstack in future

/** Object and field definitions */
export * from './field';
export * from './object';

/** Metadata registry */
export * from './registry';

/** Hook system */
export * from './hook';

/** Action system */
export * from './action';

/** Core application */
export * from './app';
export * from './config';

/** Context management */
export * from './context';

/** Validation */
export * from './validation';

/** Permissions */
export * from './permission';

/** UI-related types */
export * from './page';
export * from './view';
export * from './form';
export * from './menu';

/** Data management */
export * from './loader';
export * from './application';
export * from './migration';
export * from './api';
export * from './workflow';
export * from './report';
export * from './formula';
