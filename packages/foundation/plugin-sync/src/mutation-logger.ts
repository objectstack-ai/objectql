/**
 * ObjectQL Sync Plugin
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { MutationLogEntry, MutationOperation } from '@objectql/types';

/**
 * Client-side append-only mutation log.
 * Records all mutations while offline for later sync.
 */
export class MutationLogger {
  private readonly log: MutationLogEntry[] = [];
  private sequence = 0;
  private readonly clientId: string;

  constructor(clientId: string) {
    this.clientId = clientId;
  }

  /** Record a mutation in the log */
  append(entry: {
    objectName: string;
    recordId: string | number;
    operation: MutationOperation;
    data?: Record<string, unknown>;
    baseVersion: number | null;
  }): MutationLogEntry {
    this.sequence += 1;
    const mutation: MutationLogEntry = {
      id: this.generateId(),
      objectName: entry.objectName,
      recordId: entry.recordId,
      operation: entry.operation,
      data: entry.data,
      timestamp: new Date().toISOString(),
      clientId: this.clientId,
      sequence: this.sequence,
      baseVersion: entry.baseVersion,
    };
    this.log.push(mutation);
    return mutation;
  }

  /** Get all pending mutations (not yet synced) */
  getPending(): readonly MutationLogEntry[] {
    return [...this.log];
  }

  /** Get pending mutations for a specific object */
  getPendingForObject(objectName: string): readonly MutationLogEntry[] {
    return this.log.filter(e => e.objectName === objectName);
  }

  /** Remove mutations that have been successfully synced */
  acknowledge(mutationIds: readonly string[]): void {
    const idSet = new Set(mutationIds);
    // Remove acknowledged mutations
    for (let i = this.log.length - 1; i >= 0; i--) {
      if (idSet.has(this.log[i].id)) {
        this.log.splice(i, 1);
      }
    }
  }

  /** Clear all pending mutations */
  clear(): void {
    this.log.length = 0;
  }

  /** Get the number of pending mutations */
  get size(): number {
    return this.log.length;
  }

  /** Get the client identifier */
  getClientId(): string {
    return this.clientId;
  }

  private generateId(): string {
    // Simple UUID v4-like generation for environments without crypto.randomUUID
    const hex = '0123456789abcdef';
    let id = '';
    for (let i = 0; i < 32; i++) {
      id += hex[Math.floor(Math.random() * 16)];
      if (i === 7 || i === 11 || i === 15 || i === 19) id += '-';
    }
    return id;
  }
}
