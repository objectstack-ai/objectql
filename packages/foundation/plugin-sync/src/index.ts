/**
 * ObjectQL Sync Plugin
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Main plugin export
export { SyncPlugin } from './plugin.js';
export type { SyncPluginConfig } from './plugin.js';

// Core components
export { SyncEngine } from './sync-engine.js';
export type { SyncTransport, SyncEventListener } from './sync-engine.js';

export { MutationLogger } from './mutation-logger.js';

// Conflict resolution
export {
  LastWriteWinsResolver,
  CrdtResolver,
  ManualResolver,
  createResolver,
} from './conflict-resolver.js';
export type { ConflictResolver } from './conflict-resolver.js';

// Re-export sync types from @objectql/types for convenience
export type {
  SyncConfig,
  SyncStrategy,
  MutationLogEntry,
  MutationOperation,
  SyncConflict,
  SyncMutationResult,
  SyncPushRequest,
  SyncPushResponse,
  SyncServerChange,
  SyncEndpointConfig,
} from '@objectql/types';
