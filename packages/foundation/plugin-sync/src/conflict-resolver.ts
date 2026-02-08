/**
 * ObjectQL Sync Plugin
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SyncConflict, SyncMutationResult } from '@objectql/types';

/**
 * Interface for conflict resolution strategies.
 */
export interface ConflictResolver {
  readonly strategy: string;
  resolve(conflict: SyncConflict): SyncMutationResult;
}

/**
 * Last-Write-Wins resolver.
 * Accepts the mutation with the most recent timestamp.
 */
export class LastWriteWinsResolver implements ConflictResolver {
  readonly strategy = 'last-write-wins';

  resolve(conflict: SyncConflict): SyncMutationResult {
    const clientTime = new Date(conflict.clientMutation.timestamp).getTime();
    const serverTime = conflict.serverRecord['updated_at']
      ? new Date(conflict.serverRecord['updated_at'] as string).getTime()
      : 0;

    if (clientTime >= serverTime) {
      // Client wins - apply the mutation
      return { status: 'applied', serverVersion: (conflict.clientMutation.baseVersion ?? 0) + 1 };
    }
    // Server wins - reject the mutation
    return {
      status: 'conflict',
      conflict: {
        ...conflict,
        suggestedResolution: conflict.serverRecord,
      },
    };
  }
}

/**
 * CRDT (Conflict-free Replicated Data Type) resolver.
 * Performs field-level LWW-Register merge. Each field is resolved independently.
 */
export class CrdtResolver implements ConflictResolver {
  readonly strategy = 'crdt';

  resolve(conflict: SyncConflict): SyncMutationResult {
    const clientData = conflict.clientMutation.data ?? {};
    const serverData = conflict.serverRecord;
    const merged: Record<string, unknown> = { ...serverData };

    // Field-level merge: client fields override server fields
    // unless the field is explicitly in the conflicting set
    for (const [key, value] of Object.entries(clientData)) {
      if (!conflict.conflictingFields.includes(key)) {
        merged[key] = value;
      }
      // For conflicting fields, keep server value (LWW at field level)
    }

    return {
      status: 'applied',
      serverVersion: (conflict.clientMutation.baseVersion ?? 0) + 1,
    };
  }
}

/**
 * Manual conflict resolver.
 * Flags all conflicts for manual resolution via a callback.
 */
export class ManualResolver implements ConflictResolver {
  readonly strategy = 'manual';

  private readonly onConflict?: (conflict: SyncConflict) => Record<string, unknown> | undefined;

  constructor(onConflict?: (conflict: SyncConflict) => Record<string, unknown> | undefined) {
    this.onConflict = onConflict;
  }

  resolve(conflict: SyncConflict): SyncMutationResult {
    if (this.onConflict) {
      const resolution = this.onConflict(conflict);
      if (resolution) {
        return {
          status: 'applied',
          serverVersion: (conflict.clientMutation.baseVersion ?? 0) + 1,
        };
      }
    }
    return { status: 'conflict', conflict };
  }
}

/**
 * Factory function to create the appropriate resolver.
 */
export function createResolver(
  strategy: string,
  onConflict?: (conflict: SyncConflict) => Record<string, unknown> | undefined
): ConflictResolver {
  switch (strategy) {
    case 'last-write-wins':
      return new LastWriteWinsResolver();
    case 'crdt':
      return new CrdtResolver();
    case 'manual':
      return new ManualResolver(onConflict);
    default:
      return new LastWriteWinsResolver();
  }
}
