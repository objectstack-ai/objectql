/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Re-export types from @objectstack packages for API compatibility
export type { ObjectKernel } from '@objectstack/runtime';
export type { ObjectStackProtocolImplementation } from '@objectstack/objectql';
// Note: @objectstack/objectql types temporarily commented out due to type incompatibilities
// in the published package. Will be re-enabled when package is updated.
// export type { ObjectQL as ObjectQLEngine, SchemaRegistry } from '@objectstack/objectql';

// Export ObjectStack spec types for driver development
import { Data, System } from '@objectstack/spec';
export type QueryAST = Data.QueryAST;
export type DriverInterface = Data.DriverInterface;
export type DriverOptions = Data.DriverOptions;

// Export our enhanced runtime components (actual implementations)
export * from './repository';
export * from './app';
export * from './plugin';

// Export query-specific modules (ObjectQL core competency)
export * from './query';

// Export utilities
export * from './util';

// Export kernel optimizations
export * from './optimizations';
