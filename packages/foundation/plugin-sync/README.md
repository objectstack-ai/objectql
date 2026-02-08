# @objectql/plugin-sync

Offline-first sync plugin for ObjectQL — mutation logging, sync engine, and conflict resolution.

## Features

### 📝 Mutation Logging
- Client-side append-only mutation log
- Automatic sequence numbering and timestamping
- Per-object mutation filtering
- Batch acknowledgment after successful sync

### 🔄 Sync Engine
- Push/pull synchronization between client and server
- Configurable sync direction (`push-only`, `pull-only`, `bidirectional`)
- Debounced auto-sync on mutation
- Checkpoint-based delta tracking

### ⚔️ Conflict Resolution
- **Last-Write-Wins (LWW):** Timestamp-based resolution
- **CRDT:** Field-level LWW-Register merge
- **Manual:** Callback-driven resolution for user intervention
- Factory function for strategy selection

### 📡 Event System
- Lifecycle listeners (`onSyncStart`, `onSyncComplete`, `onSyncError`)
- Conflict and server change notifications
- Global and per-engine listener support

## Installation

```bash
pnpm add @objectql/plugin-sync
```

## Quick Start

```typescript
import { SyncPlugin } from '@objectql/plugin-sync';
import { createKernel } from '@objectstack/runtime';

const kernel = createKernel({
  plugins: [
    new SyncPlugin({
      clientId: 'device-abc-123',
      transport: myHttpTransport,
      defaultConfig: {
        enabled: true,
        strategy: 'last-write-wins',
        debounce_ms: 1000,
        batch_size: 50,
      },
      listeners: [{
        onSyncComplete(response) {
          console.log('Sync complete:', response.checkpoint);
        },
        onConflict(conflicts) {
          console.warn('Conflicts detected:', conflicts.length);
        },
      }],
    })
  ]
});

await kernel.start();
```

## MutationLogger

The `MutationLogger` records all client-side mutations in an append-only log for later synchronization.

```typescript
import { MutationLogger } from '@objectql/plugin-sync';

const logger = new MutationLogger('device-abc-123');

// Record a mutation
const entry = logger.append({
  objectName: 'task',
  recordId: 'task-1',
  operation: 'update',
  data: { status: 'completed' },
  baseVersion: 3,
});

// Get all pending mutations
const pending = logger.getPending();

// Get pending for a specific object
const taskMutations = logger.getPendingForObject('task');

// Acknowledge synced mutations
logger.acknowledge(['mutation-id-1', 'mutation-id-2']);

// Check pending count
console.log(logger.size); // => 0
```

## Conflict Resolution Strategies

### Last-Write-Wins (LWW)

Compares client and server timestamps. The most recent write wins.

```typescript
import { LastWriteWinsResolver } from '@objectql/plugin-sync';

const resolver = new LastWriteWinsResolver();
const result = resolver.resolve(conflict);
// result.status => 'applied' (client wins) or 'conflict' (server wins)
```

### CRDT (Field-Level Merge)

Performs field-level LWW-Register merge. Non-conflicting fields from the client are applied; conflicting fields retain the server value.

```typescript
import { CrdtResolver } from '@objectql/plugin-sync';

const resolver = new CrdtResolver();
const result = resolver.resolve(conflict);
// Merges non-conflicting fields from both sides
```

### Manual Resolution

Flags conflicts for manual resolution via a user-provided callback.

```typescript
import { ManualResolver } from '@objectql/plugin-sync';

const resolver = new ManualResolver((conflict) => {
  // Return merged data to resolve, or undefined to keep as conflict
  return {
    ...conflict.serverRecord,
    ...conflict.clientMutation.data,
    resolved_by: 'user',
  };
});
```

### Factory Function

Use `createResolver()` to instantiate a resolver by strategy name.

```typescript
import { createResolver } from '@objectql/plugin-sync';

const resolver = createResolver('crdt');
// => CrdtResolver instance
```

## SyncEngine Configuration

The `SyncEngine` orchestrates the full push/pull sync cycle.

```typescript
import { SyncEngine } from '@objectql/plugin-sync';
import type { SyncTransport } from '@objectql/plugin-sync';

const transport: SyncTransport = {
  async push(request) {
    const res = await fetch('/api/sync/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    return res.json();
  },
};

const engine = new SyncEngine({
  clientId: 'device-abc-123',
  transport,
  config: {
    enabled: true,
    strategy: 'last-write-wins',
    direction: 'bidirectional',
    debounce_ms: 2000,
    batch_size: 50,
  },
});

// Record a mutation (auto-triggers debounced sync)
engine.recordMutation({
  objectName: 'task',
  recordId: 'task-42',
  operation: 'update',
  data: { title: 'Updated title' },
  baseVersion: 5,
});

// Manual sync trigger
const response = await engine.sync();

// Listen to sync events
engine.addListener({
  onSyncStart() { console.log('Syncing...'); },
  onSyncComplete(res) { console.log('Done:', res.checkpoint); },
  onSyncError(err) { console.error('Failed:', err.message); },
  onServerChanges(changes) { console.log('Server changes:', changes.length); },
});
```

### SyncConfig Options

| Property        | Type                                         | Default            | Description                          |
|-----------------|----------------------------------------------|--------------------|--------------------------------------|
| `enabled`       | `boolean`                                    | `true`             | Enable sync for this object          |
| `strategy`      | `'last-write-wins'` \| `'crdt'` \| `'manual'` | `'last-write-wins'` | Conflict resolution strategy         |
| `direction`     | `'push-only'` \| `'pull-only'` \| `'bidirectional'` | `'bidirectional'` | Sync direction                       |
| `debounce_ms`   | `number`                                     | `1000`             | Debounce interval for auto-sync (ms) |
| `batch_size`    | `number`                                     | `50`               | Maximum mutations per sync request   |

## API Reference

### Classes

| Class                  | Description                                          |
|------------------------|------------------------------------------------------|
| `SyncPlugin`           | `RuntimePlugin` — registers sync capabilities on kernel |
| `SyncEngine`           | Client-side push/pull sync orchestrator              |
| `MutationLogger`       | Append-only client-side mutation log                 |
| `LastWriteWinsResolver`| Timestamp-based LWW conflict resolver                |
| `CrdtResolver`         | Field-level LWW-Register merge resolver              |
| `ManualResolver`       | Callback-driven manual conflict resolver             |

### Functions

| Function               | Description                                          |
|------------------------|------------------------------------------------------|
| `createResolver(strategy, onConflict?)` | Factory for `ConflictResolver` instances |

### Types

| Type                   | Description                                          |
|------------------------|------------------------------------------------------|
| `SyncPluginConfig`     | Plugin constructor options                           |
| `SyncTransport`        | Transport interface for push requests                |
| `SyncEventListener`    | Listener interface for sync lifecycle events         |
| `ConflictResolver`     | Interface for conflict resolution strategies         |
| `SyncConfig`           | Per-object sync configuration                        |
| `MutationLogEntry`     | Single mutation log record                           |
| `SyncConflict`         | Conflict descriptor with client/server data          |

## License

MIT
