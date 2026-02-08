# @objectql/protocol-sync

Server-side sync protocol for ObjectQL — delta computation, change tracking, and conflict resolution.

## Features

### 📥 Sync Request Handler
- Process client push requests with per-mutation conflict detection
- Optimistic concurrency control via record versioning
- Configurable maximum mutations per request
- Delta computation from client checkpoint

### 📜 Change Log
- Server-side append-only change log with monotonic checkpoints
- Configurable retention policy (days)
- Checkpoint-based delta queries for efficient sync
- Automatic pruning of expired entries

### 🔢 Version Store
- Per-record version tracking for optimistic concurrency
- Atomic version increment on mutation
- Automatic cleanup on record deletion

### ⚡ Plugin Integration
- Implements `RuntimePlugin` for seamless kernel integration
- Registers sync handler on the kernel context
- Configurable per-object conflict field definitions

## Installation

```bash
pnpm add @objectql/protocol-sync
```

## Quick Start

```typescript
import { SyncProtocolPlugin } from '@objectql/protocol-sync';
import { createKernel } from '@objectstack/runtime';

const kernel = createKernel({
  plugins: [
    new SyncProtocolPlugin({
      endpoint: {
        enabled: true,
        path: '/api/sync',
        maxMutationsPerRequest: 100,
        changeLogRetentionDays: 30,
      },
      conflictFields: new Map([
        ['task', ['title', 'status', 'assignee']],
        ['project', ['name', 'budget']],
      ]),
    })
  ]
});

await kernel.start();
```

## Server-Side Handler

The `SyncHandler` processes push requests by applying mutations, detecting conflicts, and returning server deltas.

```typescript
import { SyncHandler, type RecordResolver } from '@objectql/protocol-sync';

const handler = new SyncHandler({
  config: {
    enabled: true,
    path: '/api/sync',
    maxMutationsPerRequest: 100,
    changeLogRetentionDays: 30,
  },
  conflictFields: new Map([
    ['task', ['title', 'status']],
  ]),
});

// Implement the RecordResolver interface
const resolver: RecordResolver = {
  async getRecord(objectName, recordId) {
    return db.collection(objectName).findOne({ _id: recordId });
  },
  async applyMutation(mutation, serverVersion) {
    if (mutation.operation === 'create') {
      await db.collection(mutation.objectName).insertOne({
        _id: mutation.recordId,
        ...mutation.data,
        _version: serverVersion,
      });
    } else if (mutation.operation === 'update') {
      await db.collection(mutation.objectName).updateOne(
        { _id: mutation.recordId },
        { $set: { ...mutation.data, _version: serverVersion } },
      );
    } else if (mutation.operation === 'delete') {
      await db.collection(mutation.objectName).deleteOne({ _id: mutation.recordId });
    }
  },
};

// Handle a push request
const response = await handler.handlePush(pushRequest, resolver);
// response.results    => per-mutation results (applied | conflict | rejected)
// response.serverChanges => changes since client's last checkpoint
// response.checkpoint => current server checkpoint
```

## Change Log

The `ChangeLog` records all server-side mutations for delta computation during sync.

```typescript
import { ChangeLog } from '@objectql/protocol-sync';

const changeLog = new ChangeLog(30); // 30-day retention

// Record a change
changeLog.record({
  objectName: 'task',
  recordId: 'task-1',
  operation: 'update',
  data: { status: 'completed' },
  serverVersion: 5,
});

// Get changes since a checkpoint
const changes = changeLog.getChangesSince('42');

// Get current checkpoint
const checkpoint = changeLog.getCurrentCheckpoint();

// Prune expired entries
const pruned = changeLog.prune();
```

## Version Tracking

The `VersionStore` tracks the current version of each record for optimistic concurrency control.

```typescript
import { VersionStore } from '@objectql/protocol-sync';

const versions = new VersionStore();

// Increment version on mutation
const newVersion = versions.increment('task', 'task-1');
// => 1

// Get current version
const current = versions.getVersion('task', 'task-1');
// => 1

// Remove on delete
versions.remove('task', 'task-1');
```

## API Reference

### Classes

| Class                  | Description                                          |
|------------------------|------------------------------------------------------|
| `SyncProtocolPlugin`   | `RuntimePlugin` — registers sync handler on kernel   |
| `SyncHandler`          | Processes push requests with conflict detection      |
| `ChangeLog`            | Server-side append-only change log                   |
| `VersionStore`         | Per-record version tracking                          |

### Types

| Type                        | Description                                     |
|-----------------------------|-------------------------------------------------|
| `SyncProtocolPluginConfig`  | Plugin constructor options                      |
| `RecordResolver`            | Interface for reading/writing server records    |
| `ChangeLogEntry`            | A checkpoint-indexed change log entry           |
| `SyncPushRequest`           | Client push request payload                     |
| `SyncPushResponse`          | Server push response payload                    |
| `SyncMutationResult`        | Per-mutation result (`applied` \| `conflict` \| `rejected`) |
| `SyncServerChange`          | A server-side change record                     |
| `SyncEndpointConfig`        | Sync endpoint configuration                     |

## License

MIT
