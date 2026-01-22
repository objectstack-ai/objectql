/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Re-export types from @objectstack packages for API compatibility
export type { ObjectStackKernel, ObjectStackRuntimeProtocol } from '@objectstack/runtime';
export type { ObjectQL as ObjectQLEngine, SchemaRegistry } from '@objectstack/objectql';

// Export ObjectStack spec types for driver development
export type { DriverInterface, DriverOptions, QueryAST } from '@objectstack/spec';

// Export our enhanced runtime components (actual implementations)
export * from './repository';
export * from './app';
export * from './plugin';
export * from './validator-plugin';
export * from './formula-plugin';

// Export query-specific modules (ObjectQL core competency)
export * from './query';

// Export utilities
export * from './validator';
export * from './util';
export * from './ai-agent';
export * from './formula-engine';
