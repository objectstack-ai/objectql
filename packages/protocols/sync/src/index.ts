/**
 * ObjectQL Sync Protocol
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Main plugin export
export { SyncProtocolPlugin } from './plugin.js';
export type { SyncProtocolPluginConfig } from './plugin.js';

// Core components
export { SyncHandler } from './sync-handler.js';
export type { RecordResolver } from './sync-handler.js';

export { ChangeLog } from './change-log.js';
export type { ChangeLogEntry } from './change-log.js';

export { VersionStore } from './version-store.js';

// Re-export sync types from @objectql/types
export type {
  SyncPushRequest,
  SyncPushResponse,
  SyncMutationResult,
  SyncServerChange,
  SyncConflict,
  SyncEndpointConfig,
  MutationLogEntry,
  MutationOperation,
} from '@objectql/types';
