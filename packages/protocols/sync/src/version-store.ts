/**
 * ObjectQL Sync Protocol — Server-side Version Store
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Server-side record version store.
 * Tracks the current version of each record for optimistic concurrency control.
 */
export class VersionStore {
  private readonly versions = new Map<string, number>();

  private key(objectName: string, recordId: string | number): string {
    return `${objectName}:${String(recordId)}`;
  }

  /** Get the current version of a record */
  getVersion(objectName: string, recordId: string | number): number {
    return this.versions.get(this.key(objectName, recordId)) ?? 0;
  }

  /** Increment and return the new version */
  increment(objectName: string, recordId: string | number): number {
    const k = this.key(objectName, recordId);
    const current = this.versions.get(k) ?? 0;
    const next = current + 1;
    this.versions.set(k, next);
    return next;
  }

  /** Remove version tracking for a deleted record */
  remove(objectName: string, recordId: string | number): void {
    this.versions.delete(this.key(objectName, recordId));
  }

  /** Get total tracked records */
  get size(): number {
    return this.versions.size;
  }
}
