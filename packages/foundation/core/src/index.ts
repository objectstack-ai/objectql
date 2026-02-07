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

// Re-export new @objectstack/objectql 1.1.0 FQN (Fully Qualified Name) utilities
export {
    computeFQN,
    parseFQN,
    RESERVED_NAMESPACES,
    DEFAULT_OWNER_PRIORITY,
    DEFAULT_EXTENDER_PRIORITY,
    SchemaRegistry,
} from '@objectstack/objectql';
export type { ObjectContributor } from '@objectstack/objectql';

// Export ObjectStack spec types for driver development
import { Data, System, Automation } from '@objectstack/spec';
import { z } from 'zod';
export { QueryAST } from '@objectql/types';
export type DriverInterface = z.infer<typeof Data.DriverInterfaceSchema>;
export type DriverOptions = z.infer<typeof Data.DriverOptionsSchema>;

// Re-export new @objectstack/spec 1.1.0 types
export type StateMachineConfig = z.infer<typeof Automation.StateMachineSchema>;
export type ObjectOwnership = z.infer<typeof Data.ObjectOwnershipEnum>;
export type ObjectExtension = z.infer<typeof Data.ObjectExtensionSchema>;

export * from './gateway';

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

// Export AI runtime
export * from './ai';
