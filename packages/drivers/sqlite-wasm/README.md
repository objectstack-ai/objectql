# @objectql/driver-sqlite-wasm

> Browser-native SQLite driver for ObjectQL using WebAssembly and OPFS persistence

[![npm version](https://img.shields.io/npm/v/@objectql/driver-sqlite-wasm.svg)](https://www.npmjs.com/package/@objectql/driver-sqlite-wasm)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Overview

`@objectql/driver-sqlite-wasm` brings full-featured SQL database capabilities to browser environments through WebAssembly and the Origin Private File System (OPFS). This driver allows you to run ObjectQL applications entirely client-side with persistent storage.

**Key Features:**

- ✅ **Zero Server Dependencies** — Complete SQL database in the browser
- ✅ **Persistent Storage** — Data survives page refresh via OPFS
- ✅ **Full SQL Support** — Leverages SQLite 3.x features (CTEs, window functions, JSON operators)
- ✅ **Reuses SQL Pipeline** — Composes `@objectql/driver-sql` for proven Knex-based query building
- ✅ **~300KB Bundle** — Optimized WASM binary size
- ✅ **Library-Agnostic API** — Public API references "SQLite WASM", underlying implementation (wa-sqlite) is swappable

## Architecture

```
QueryAST → SqlDriver (Knex) → SQL string → wa-sqlite WASM → OPFS/Memory
```

This driver uses **composition over inheritance**:
- Wraps `SqlDriver` from `@objectql/driver-sql` internally
- Custom Knex client adapter bridges wa-sqlite WASM API
- All query compilation logic delegated to `SqlDriver`
- No code duplication, only WASM integration layer

## Installation

```bash
pnpm add @objectql/driver-sqlite-wasm
```

## Usage

### Basic Example

```typescript
import { SqliteWasmDriver } from '@objectql/driver-sqlite-wasm';

// Create driver with OPFS persistence (default)
const driver = new SqliteWasmDriver({
  storage: 'opfs',        // 'opfs' | 'memory'
  filename: 'myapp.db',   // Database filename in OPFS
  walMode: true,          // Enable WAL mode for concurrency
  pageSize: 4096          // SQLite page size
});

// Initialize schema
await driver.init([
  {
    name: 'tasks',
    fields: {
      id: { type: 'text', primary: true },
      title: { type: 'text' },
      completed: { type: 'boolean', default: false }
    }
  }
]);

// CRUD operations
const task = await driver.create('tasks', {
  title: 'Learn ObjectQL',
  completed: false
});

const tasks = await driver.find('tasks', {
  where: { completed: false },
  orderBy: [{ field: 'title', order: 'asc' }]
});

await driver.update('tasks', task.id, { completed: true });

await driver.delete('tasks', task.id);
```

### With ObjectStack Kernel

```typescript
import { ObjectStackKernel } from '@objectstack/runtime';
import { SqliteWasmDriver } from '@objectql/driver-sqlite-wasm';
import { HonoServerPlugin } from '@objectstack/plugin-hono-server';
import MyAppManifest from './objectstack.config';

const kernel = new ObjectStackKernel([
  MyAppManifest,
  new SqliteWasmDriver({ storage: 'opfs' }),
  new HonoServerPlugin({ port: 3000 })
]);

await kernel.start();
```

### In-Memory Mode (Testing/SSR)

```typescript
// Ephemeral storage - data lost on page refresh
const driver = new SqliteWasmDriver({ storage: 'memory' });
```

## Configuration

```typescript
export interface SqliteWasmDriverConfig {
  /** Storage backend. Default: 'opfs' */
  storage?: 'opfs' | 'memory';
  
  /** Database filename in OPFS. Default: 'objectql.db' */
  filename?: string;
  
  /** Enable WAL mode for better read concurrency. Default: true */
  walMode?: boolean;
  
  /** Page size in bytes. Default: 4096 */
  pageSize?: number;
}
```

### Storage Modes

| Mode | Persistence | Use Case | Browser Support |
|------|-------------|----------|-----------------|
| **opfs** | Persistent (survives refresh) | Production PWAs, offline apps | Chrome 102+, Edge 102+, Safari 15.2+ |
| **memory** | Ephemeral (lost on refresh) | Testing, SSR, demos | All browsers with WASM support |

**Auto-fallback:** If `storage: 'opfs'` is specified but OPFS is unavailable, the driver automatically falls back to `'memory'` with a console warning.

## Environment Requirements

| Requirement | Minimum Version |
|-------------|-----------------|
| **WebAssembly** | Required (95%+ browser coverage) |
| **OPFS** | Optional (for persistence) |
| **Browser Support** | Chrome 102+, Firefox 110+, Safari 15.2+, Edge 102+ |

**Environment Detection:**

```typescript
import { checkWebAssembly, checkOPFS, detectStorageBackend } from '@objectql/driver-sqlite-wasm';

// Throws ObjectQLError({ code: 'ENVIRONMENT_ERROR' }) if WASM unavailable
checkWebAssembly();

// Returns true if OPFS is supported
const hasOPFS = await checkOPFS();

// Auto-detect best storage backend
const storage = await detectStorageBackend(); // 'opfs' | 'memory'

const driver = new SqliteWasmDriver({ storage });
```

## Driver Capabilities

```typescript
driver.supports = {
  create: true,
  read: true,
  update: true,
  delete: true,
  bulkCreate: true,
  bulkUpdate: true,
  bulkDelete: true,
  transactions: false,        // Single connection limitation
  savepoints: false,
  queryFilters: true,
  queryAggregations: true,
  querySorting: true,
  queryPagination: true,
  queryWindowFunctions: true,
  querySubqueries: true,
  queryCTE: true,
  joins: true,
  fullTextSearch: true,
  jsonFields: true,
  arrayFields: false,
  streaming: false,
  schemaSync: true,
  migrations: true,
  indexes: true,
  connectionPooling: false,   // Single connection
  preparedStatements: true,
  queryCache: false
};
```

## API Reference

### Driver Methods

All standard `Driver` interface methods are supported:

| Method | Description |
|--------|-------------|
| `connect()` | Initialize WASM module and database |
| `disconnect()` | Close database connection |
| `checkHealth()` | Verify database is responsive |
| `find(object, query, options?)` | Query records |
| `findOne(object, id, query?, options?)` | Get single record by ID |
| `create(object, data, options?)` | Insert record |
| `update(object, id, data, options?)` | Update record |
| `delete(object, id, options?)` | Delete record |
| `count(object, filters, options?)` | Count records |
| `bulkCreate(object, data[], options?)` | Insert multiple records |
| `bulkUpdate(object, updates[], options?)` | Update multiple records |
| `bulkDelete(object, ids[], options?)` | Delete multiple records |
| `aggregate(object, query, options?)` | Aggregate query |
| `distinct(object, field, filters?, options?)` | Get distinct values |
| `init(objects[])` | Initialize schema from metadata |
| `introspectSchema()` | Discover existing schema |
| `executeQuery(ast, options?)` | Execute QueryAST (DriverInterface v4.0) |
| `executeCommand(command, options?)` | Execute Command (DriverInterface v4.0) |

### Query Syntax

Supports both legacy filter syntax and modern QueryAST:

```typescript
// MongoDB-style filters
await driver.find('tasks', {
  where: {
    $or: [
      { completed: true },
      { priority: { $gte: 5 } }
    ]
  },
  orderBy: [{ field: 'createdAt', order: 'desc' }],
  limit: 10,
  skip: 0
});

// Simple object filters
await driver.find('tasks', {
  where: { completed: false, assignee: 'alice@example.com' }
});
```

## Performance Considerations

### OPFS Storage

- **Quota:** Browsers allocate significant storage (10GB+ on desktop)
- **Performance:** Near-native I/O speed (~80% of native SQLite)
- **Concurrency:** Single connection per database (no cross-tab locking yet)

### WAL Mode

Enabled by default (`walMode: true`):
- Better read concurrency
- Faster writes (batched to disk)
- Small WAL file overhead

### Bundle Size

| Component | Size (gzip) |
|-----------|-------------|
| Driver code | ~5KB |
| wa-sqlite WASM | ~295KB |
| **Total** | **~300KB** |

**Optimization Tips:**
- Use dynamic imports to lazy-load the driver
- Consider code-splitting for apps with multiple drivers
- WASM binary is cacheable (set long `Cache-Control` headers)

## Migration from LocalStorage Driver

If you previously used `@objectql/driver-localstorage` (now deprecated):

```typescript
// OLD (deprecated)
import { LocalStorageDriver } from '@objectql/driver-localstorage';
const driver = new LocalStorageDriver();

// NEW (recommended)
import { SqliteWasmDriver } from '@objectql/driver-sqlite-wasm';
const driver = new SqliteWasmDriver({ storage: 'opfs' });
```

**Benefits of Migration:**
- No 5MB localStorage limit
- Full SQL query support (joins, aggregations, subqueries)
- Better performance for large datasets
- Data persistence across sessions

## Troubleshooting

### ENVIRONMENT_ERROR: WebAssembly not supported

**Cause:** Browser does not support WebAssembly.

**Solution:** Check browser compatibility. All modern browsers (Chrome 57+, Firefox 52+, Safari 11+) support WASM.

### OPFS not available warning

**Cause:** Browser does not support OPFS or it's disabled.

**Solution:** Driver auto-falls back to memory storage. To enable OPFS:
- Ensure browser version supports OPFS (Chrome 102+, Safari 15.2+)
- Check if OPFS is disabled in browser settings
- Verify site is served over HTTPS (required for OPFS)

### Data lost after page refresh

**Cause:** Driver is using memory storage instead of OPFS.

**Solution:**
```typescript
// Explicitly check OPFS availability
import { checkOPFS } from '@objectql/driver-sqlite-wasm';

if (await checkOPFS()) {
  const driver = new SqliteWasmDriver({ storage: 'opfs' });
} else {
  console.error('OPFS not available - data will not persist');
}
```

### Cross-origin isolation errors

**Cause:** SharedArrayBuffer requires cross-origin isolation headers.

**Solution:** Set these HTTP headers:
```
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Opener-Policy: same-origin
```

## Limitations

- **No Transactions:** Single connection architecture prevents full ACID transactions
- **No Cross-Tab Sync:** Database changes not visible across tabs/windows (yet)
- **No Streaming:** Result sets fully materialized in memory
- **No Array Fields:** SQLite JSON fields supported, but not native arrays

## Roadmap

- [ ] Cross-tab synchronization via BroadcastChannel
- [ ] Transaction support via async locking
- [ ] Streaming query results
- [ ] Incremental vacuum on disconnect
- [ ] IndexedDB fallback for older browsers
- [ ] Encryption at rest (SQLite extension)

## License

MIT © ObjectStack Inc.

## Related Packages

- [`@objectql/driver-sql`](../sql) — Server-side SQL driver (PostgreSQL, MySQL, SQLite)
- [`@objectql/driver-pg-wasm`](../pg-wasm) — PostgreSQL WASM driver (coming in Q1 P1)
- [`@objectql/driver-memory`](../memory) — In-memory driver for testing
- [`@objectql/driver-sdk`](../sdk) — Remote HTTP driver

## Contributing

See [CONTRIBUTING.md](../../../CONTRIBUTING.md) for development guidelines.

## Support

- [Documentation](https://objectql.dev/drivers/sqlite-wasm)
- [GitHub Issues](https://github.com/objectstack-ai/objectql/issues)
- [Discord Community](https://discord.gg/objectql)
