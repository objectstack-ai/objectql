/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// ============================================================================
// Offline-First Sync Protocol Types
// ============================================================================

/**
 * Sync conflict resolution strategy.
 *
 * - `last-write-wins`: Server accepts the most recent mutation based on timestamp.
 * - `crdt`: Conflict-free Replicated Data Type — field-level merge without conflicts.
 * - `manual`: Conflicts are flagged for manual resolution via a callback.
 */
export type SyncStrategy = 'last-write-wins' | 'crdt' | 'manual';

/**
 * Per-object sync configuration.
 *
 * Declared in `*.object.yml` under the `sync` key. Opt-in per object.
 *
 * @example
 * ```yaml
 * name: story
 * sync:
 *   enabled: true
 *   strategy: last-write-wins
 *   conflict_fields: [status]
 * ```
 */
export interface SyncConfig {
    /** Enable offline sync for this object. Default: false */
    readonly enabled: boolean;

    /** Conflict resolution strategy. Default: 'last-write-wins' */
    readonly strategy?: SyncStrategy;

    /**
     * Fields requiring manual merge when strategy is 'last-write-wins'.
     * Changes to these fields during concurrent edits trigger a conflict.
     */
    readonly conflict_fields?: readonly string[];

    /**
     * Sync direction.
     * - `bidirectional`: Client ↔ Server (default)
     * - `push-only`: Client → Server
     * - `pull-only`: Server → Client
     */
    readonly direction?: 'bidirectional' | 'push-only' | 'pull-only';

    /**
     * Debounce interval in milliseconds before syncing mutations.
     * Batches rapid mutations into a single sync request.
     * Default: 1000
     */
    readonly debounce_ms?: number;

    /**
     * Maximum number of mutations to batch in a single sync request.
     * Default: 50
     */
    readonly batch_size?: number;
}

/**
 * Mutation operation type recorded in the client-side mutation log.
 */
export type MutationOperation = 'create' | 'update' | 'delete';

/**
 * A single entry in the client-side append-only mutation log.
 *
 * Recorded by WASM drivers when offline. Replayed to the server
 * during sync to achieve eventual consistency.
 */
export interface MutationLogEntry {
    /** Unique mutation identifier (UUID v7 for time-ordered sorting) */
    readonly id: string;

    /** Object name this mutation applies to */
    readonly objectName: string;

    /** Record identifier */
    readonly recordId: string | number;

    /** Type of mutation */
    readonly operation: MutationOperation;

    /**
     * The mutation payload.
     * - `create`: Full record data.
     * - `update`: Partial field updates (only changed fields).
     * - `delete`: undefined.
     */
    readonly data?: Record<string, unknown>;

    /** ISO 8601 timestamp when the mutation was recorded on the client */
    readonly timestamp: string;

    /** Client device identifier for multi-device conflict resolution */
    readonly clientId: string;

    /** Monotonically increasing sequence number per client */
    readonly sequence: number;

    /**
     * Server-assigned version of the record at the time of mutation.
     * Used for optimistic concurrency during sync.
     * `null` for new records created offline.
     */
    readonly baseVersion: number | null;
}

/**
 * Conflict descriptor returned when the server detects a merge conflict.
 */
export interface SyncConflict {
    /** Object name */
    readonly objectName: string;

    /** Record identifier */
    readonly recordId: string | number;

    /** The client's mutation that caused the conflict */
    readonly clientMutation: MutationLogEntry;

    /** Current server-side record state */
    readonly serverRecord: Record<string, unknown>;

    /** Fields that are in conflict */
    readonly conflictingFields: readonly string[];

    /** Suggested resolution (server-computed) */
    readonly suggestedResolution?: Record<string, unknown>;
}

/**
 * Outcome of a single mutation during sync.
 */
export type SyncMutationResult =
    | { readonly status: 'applied'; readonly serverVersion: number }
    | { readonly status: 'conflict'; readonly conflict: SyncConflict }
    | { readonly status: 'rejected'; readonly reason: string };

/**
 * Client → Server sync request payload.
 */
export interface SyncPushRequest {
    /** Client device identifier */
    readonly clientId: string;

    /** Mutations to push, ordered by sequence number */
    readonly mutations: readonly MutationLogEntry[];

    /**
     * Last server checkpoint the client has seen.
     * The server uses this to determine what changes to send back.
     */
    readonly lastCheckpoint: string | null;
}

/**
 * Server → Client sync response payload.
 */
export interface SyncPushResponse {
    /** Results for each pushed mutation (same order as request) */
    readonly results: readonly SyncMutationResult[];

    /** Server changes since the client's lastCheckpoint */
    readonly serverChanges: readonly SyncServerChange[];

    /** New checkpoint for the client to store */
    readonly checkpoint: string;
}

/**
 * A server-side change to be applied on the client.
 */
export interface SyncServerChange {
    /** Object name */
    readonly objectName: string;

    /** Record identifier */
    readonly recordId: string | number;

    /** Operation that occurred on the server */
    readonly operation: MutationOperation;

    /** Record data (full for create, partial for update, undefined for delete) */
    readonly data?: Record<string, unknown>;

    /** Server version after this change */
    readonly serverVersion: number;

    /** ISO 8601 timestamp of the server change */
    readonly timestamp: string;
}

/**
 * Sync endpoint configuration for the server-side sync service.
 */
export interface SyncEndpointConfig {
    /** Enable the sync endpoint. Default: false */
    readonly enabled: boolean;

    /** URL path for the sync endpoint. Default: '/api/sync' */
    readonly path?: string;

    /** Maximum mutations per push request. Default: 100 */
    readonly maxMutationsPerRequest?: number;

    /** Maximum age (in days) for server-side change log retention. Default: 30 */
    readonly changeLogRetentionDays?: number;

    /** Enable WebSocket for real-time push from server. Default: false */
    readonly realtime?: boolean;
}
