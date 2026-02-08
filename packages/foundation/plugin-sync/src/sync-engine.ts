/**
 * ObjectQL Sync Plugin
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {
  MutationLogEntry,
  MutationOperation,
  SyncConflict,
  SyncPushRequest,
  SyncPushResponse,
  SyncServerChange,
  SyncConfig,
} from '@objectql/types';
import { MutationLogger } from './mutation-logger.js';
import type { ConflictResolver } from './conflict-resolver.js';
import { createResolver } from './conflict-resolver.js';

/**
 * Sync transport interface — abstracts the HTTP/WebSocket layer.
 */
export interface SyncTransport {
  push(request: SyncPushRequest): Promise<SyncPushResponse>;
}

/**
 * Sync event listener.
 */
export interface SyncEventListener {
  onSyncStart?(): void;
  onSyncComplete?(response: SyncPushResponse): void;
  onSyncError?(error: Error): void;
  onConflict?(conflicts: readonly SyncConflict[]): void;
  onServerChanges?(changes: readonly SyncServerChange[]): void;
}

/**
 * Client-side sync engine.
 * Orchestrates push/pull synchronization between client and server.
 */
export class SyncEngine {
  private readonly logger: MutationLogger;
  private readonly transport: SyncTransport;
  private readonly resolver: ConflictResolver;
  private readonly config: SyncConfig;
  private readonly listeners: SyncEventListener[] = [];
  private checkpoint: string | null = null;
  private syncing = false;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(options: {
    clientId: string;
    transport: SyncTransport;
    config: SyncConfig;
    onConflict?: (conflict: SyncConflict) => Record<string, unknown> | undefined;
  }) {
    this.logger = new MutationLogger(options.clientId);
    this.transport = options.transport;
    this.config = options.config;
    this.resolver = createResolver(options.config.strategy ?? 'last-write-wins', options.onConflict);
  }

  /** Record a mutation and optionally trigger debounced sync */
  recordMutation(entry: {
    objectName: string;
    recordId: string | number;
    operation: MutationOperation;
    data?: Record<string, unknown>;
    baseVersion: number | null;
  }): MutationLogEntry {
    const mutation = this.logger.append(entry);
    this.scheduleSync();
    return mutation;
  }

  /** Manually trigger a sync cycle */
  async sync(): Promise<SyncPushResponse | null> {
    if (this.syncing) return null;
    if (this.config.direction === 'pull-only') return null;

    const pending = this.logger.getPending();
    if (pending.length === 0 && this.config.direction === 'push-only') return null;

    this.syncing = true;
    this.notifyListeners('onSyncStart');

    try {
      const batchSize = this.config.batch_size ?? 50;
      const batch = pending.slice(0, batchSize);

      const request: SyncPushRequest = {
        clientId: this.logger.getClientId(),
        mutations: batch,
        lastCheckpoint: this.checkpoint,
      };

      const response = await this.transport.push(request);

      // Process results
      const acknowledgedIds: string[] = [];
      const conflicts: SyncConflict[] = [];

      for (let i = 0; i < response.results.length; i++) {
        const result = response.results[i];
        if (result.status === 'applied') {
          acknowledgedIds.push(batch[i].id);
        } else if (result.status === 'conflict') {
          conflicts.push(result.conflict);
        }
      }

      // Acknowledge applied mutations
      this.logger.acknowledge(acknowledgedIds);

      // Update checkpoint
      this.checkpoint = response.checkpoint;

      // Notify listeners
      if (conflicts.length > 0) {
        this.notifyListeners('onConflict', conflicts);
      }
      if (response.serverChanges.length > 0) {
        this.notifyListeners('onServerChanges', response.serverChanges);
      }
      this.notifyListeners('onSyncComplete', response);

      return response;
    } catch (error) {
      this.notifyListeners('onSyncError', error instanceof Error ? error : new Error(String(error)));
      return null;
    } finally {
      this.syncing = false;
    }
  }

  /** Add a sync event listener */
  addListener(listener: SyncEventListener): void {
    this.listeners.push(listener);
  }

  /** Remove a sync event listener */
  removeListener(listener: SyncEventListener): void {
    const idx = this.listeners.indexOf(listener);
    if (idx !== -1) this.listeners.splice(idx, 1);
  }

  /** Get the mutation logger */
  getMutationLogger(): MutationLogger {
    return this.logger;
  }

  /** Get the current checkpoint */
  getCheckpoint(): string | null {
    return this.checkpoint;
  }

  /** Set the checkpoint (e.g., from persisted state) */
  setCheckpoint(checkpoint: string | null): void {
    this.checkpoint = checkpoint;
  }

  /** Check if a sync is in progress */
  isSyncing(): boolean {
    return this.syncing;
  }

  /** Cancel any scheduled sync */
  cancelScheduledSync(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }

  private scheduleSync(): void {
    if (this.config.direction === 'pull-only') return;

    const debounce = this.config.debounce_ms ?? 1000;
    this.cancelScheduledSync();
    this.debounceTimer = setTimeout(() => {
      void this.sync();
    }, debounce);
  }

  private notifyListeners(event: keyof SyncEventListener, ...args: unknown[]): void {
    for (const listener of this.listeners) {
      const handler = listener[event];
      if (typeof handler === 'function') {
        try {
          (handler as (...a: unknown[]) => void).apply(listener, args);
        } catch {
          // Swallow listener errors to prevent sync interruption
        }
      }
    }
  }
}
