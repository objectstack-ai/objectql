/**
 * ObjectQL Sync Protocol — Server-side Change Log
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SyncServerChange, MutationOperation } from '@objectql/types';

/**
 * A checkpoint-indexed entry in the server change log.
 */
export interface ChangeLogEntry extends SyncServerChange {
  /** Monotonic checkpoint sequence */
  readonly checkpointSeq: number;
}

/**
 * Server-side append-only change log.
 * Records all mutations for delta computation during sync.
 */
export class ChangeLog {
  private readonly entries: ChangeLogEntry[] = [];
  private seq = 0;
  private readonly retentionMs: number;

  constructor(retentionDays = 30) {
    this.retentionMs = retentionDays * 24 * 60 * 60 * 1000;
  }

  /** Record a change in the log */
  record(change: {
    objectName: string;
    recordId: string | number;
    operation: MutationOperation;
    data?: Record<string, unknown>;
    serverVersion: number;
  }): ChangeLogEntry {
    this.seq += 1;
    const entry: ChangeLogEntry = {
      objectName: change.objectName,
      recordId: change.recordId,
      operation: change.operation,
      data: change.data,
      serverVersion: change.serverVersion,
      timestamp: new Date().toISOString(),
      checkpointSeq: this.seq,
    };
    this.entries.push(entry);
    return entry;
  }

  /** Get changes since a checkpoint (exclusive) */
  getChangesSince(checkpoint: string | null): readonly ChangeLogEntry[] {
    if (checkpoint === null) {
      return [...this.entries];
    }
    const seq = parseInt(checkpoint, 10);
    if (isNaN(seq)) return [...this.entries];
    return this.entries.filter(e => e.checkpointSeq > seq);
  }

  /** Get current checkpoint string */
  getCurrentCheckpoint(): string {
    return String(this.seq);
  }

  /** Prune old entries based on retention policy */
  prune(): number {
    const cutoff = Date.now() - this.retentionMs;
    const before = this.entries.length;
    for (let i = this.entries.length - 1; i >= 0; i--) {
      if (new Date(this.entries[i].timestamp).getTime() < cutoff) {
        this.entries.splice(i, 1);
      }
    }
    return before - this.entries.length;
  }

  /** Get total entries */
  get size(): number {
    return this.entries.length;
  }
}
