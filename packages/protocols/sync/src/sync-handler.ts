/**
 * ObjectQL Sync Protocol — Sync Request Handler
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {
  SyncPushRequest,
  SyncPushResponse,
  SyncMutationResult,
  SyncServerChange,
  MutationLogEntry,
  SyncConflict,
  SyncEndpointConfig,
} from '@objectql/types';
import { ChangeLog } from './change-log.js';
import { VersionStore } from './version-store.js';

/**
 * Server-side record resolver.
 * The sync handler uses this to read current server state and apply mutations.
 */
export interface RecordResolver {
  getRecord(objectName: string, recordId: string | number): Promise<Record<string, unknown> | null>;
  applyMutation(mutation: MutationLogEntry, serverVersion: number): Promise<void>;
}

/**
 * Server-side sync request handler.
 * Processes push requests, applies mutations, detects conflicts, and returns deltas.
 */
export class SyncHandler {
  private readonly changeLog: ChangeLog;
  private readonly versionStore: VersionStore;
  private readonly config: SyncEndpointConfig;
  private readonly conflictFields: ReadonlyMap<string, readonly string[]>;

  constructor(options: {
    config: SyncEndpointConfig;
    conflictFields?: ReadonlyMap<string, readonly string[]>;
  }) {
    this.config = options.config;
    this.changeLog = new ChangeLog(options.config.changeLogRetentionDays ?? 30);
    this.versionStore = new VersionStore();
    this.conflictFields = options.conflictFields ?? new Map();
  }

  /** Process a sync push request */
  async handlePush(request: SyncPushRequest, resolver: RecordResolver): Promise<SyncPushResponse> {
    const maxMutations = this.config.maxMutationsPerRequest ?? 100;

    if (request.mutations.length > maxMutations) {
      const results: SyncMutationResult[] = request.mutations.map(() => ({
        status: 'rejected' as const,
        reason: `Exceeds maximum mutations per request (${maxMutations})`,
      }));
      return {
        results,
        serverChanges: [],
        checkpoint: this.changeLog.getCurrentCheckpoint(),
      };
    }

    const results: SyncMutationResult[] = [];

    for (const mutation of request.mutations) {
      const result = await this.processMutation(mutation, resolver);
      results.push(result);
    }

    // Get server changes since client's last checkpoint
    const changes = this.changeLog.getChangesSince(request.lastCheckpoint);
    const serverChanges: SyncServerChange[] = changes.map(entry => ({
      objectName: entry.objectName,
      recordId: entry.recordId,
      operation: entry.operation,
      data: entry.data,
      serverVersion: entry.serverVersion,
      timestamp: entry.timestamp,
    }));

    return {
      results,
      serverChanges,
      checkpoint: this.changeLog.getCurrentCheckpoint(),
    };
  }

  /** Get the change log (for testing/debugging) */
  getChangeLog(): ChangeLog {
    return this.changeLog;
  }

  /** Get the version store (for testing/debugging) */
  getVersionStore(): VersionStore {
    return this.versionStore;
  }

  private async processMutation(
    mutation: MutationLogEntry,
    resolver: RecordResolver
  ): Promise<SyncMutationResult> {
    const currentVersion = this.versionStore.getVersion(mutation.objectName, mutation.recordId);

    // Handle create operations
    if (mutation.operation === 'create') {
      const newVersion = this.versionStore.increment(mutation.objectName, mutation.recordId);
      await resolver.applyMutation(mutation, newVersion);
      this.changeLog.record({
        objectName: mutation.objectName,
        recordId: mutation.recordId,
        operation: 'create',
        data: mutation.data,
        serverVersion: newVersion,
      });
      return { status: 'applied', serverVersion: newVersion };
    }

    // Handle delete operations
    if (mutation.operation === 'delete') {
      if (currentVersion === 0) {
        return { status: 'rejected', reason: 'Record not found' };
      }
      const newVersion = this.versionStore.increment(mutation.objectName, mutation.recordId);
      await resolver.applyMutation(mutation, newVersion);
      this.changeLog.record({
        objectName: mutation.objectName,
        recordId: mutation.recordId,
        operation: 'delete',
        serverVersion: newVersion,
      });
      this.versionStore.remove(mutation.objectName, mutation.recordId);
      return { status: 'applied', serverVersion: newVersion };
    }

    // Handle update operations — check for conflicts
    if (mutation.baseVersion !== null && mutation.baseVersion < currentVersion) {
      const serverRecord = await resolver.getRecord(mutation.objectName, mutation.recordId);
      if (!serverRecord) {
        return { status: 'rejected', reason: 'Record not found' };
      }

      const objectConflictFields = this.conflictFields.get(mutation.objectName) ?? [];
      const conflictingFields = this.detectConflictingFields(mutation, serverRecord, objectConflictFields);

      if (conflictingFields.length > 0) {
        const conflict: SyncConflict = {
          objectName: mutation.objectName,
          recordId: mutation.recordId,
          clientMutation: mutation,
          serverRecord,
          conflictingFields,
        };
        return { status: 'conflict', conflict };
      }
    }

    // No conflict — apply the update
    const newVersion = this.versionStore.increment(mutation.objectName, mutation.recordId);
    await resolver.applyMutation(mutation, newVersion);
    this.changeLog.record({
      objectName: mutation.objectName,
      recordId: mutation.recordId,
      operation: 'update',
      data: mutation.data,
      serverVersion: newVersion,
    });
    return { status: 'applied', serverVersion: newVersion };
  }

  private detectConflictingFields(
    mutation: MutationLogEntry,
    serverRecord: Record<string, unknown>,
    conflictFields: readonly string[]
  ): string[] {
    if (conflictFields.length === 0) {
      // If no specific conflict fields defined, treat all changed fields as potential conflicts
      return Object.keys(mutation.data ?? {});
    }

    const conflicts: string[] = [];
    const clientData = mutation.data ?? {};

    for (const field of conflictFields) {
      if (field in clientData && clientData[field] !== serverRecord[field]) {
        conflicts.push(field);
      }
    }

    return conflicts;
  }
}
