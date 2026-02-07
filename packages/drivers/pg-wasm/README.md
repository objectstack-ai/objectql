# @objectql/driver-pg-wasm

> Browser-native PostgreSQL driver for ObjectQL using WebAssembly and IndexedDB/OPFS persistence

[![npm version](https://img.shields.io/npm/v/@objectql/driver-pg-wasm.svg)](https://www.npmjs.com/package/@objectql/driver-pg-wasm)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Overview

`@objectql/driver-pg-wasm` brings full PostgreSQL database capabilities to browser environments through WebAssembly. This driver allows you to run ObjectQL applications entirely client-side with persistent storage and PostgreSQL-specific features like JSONB operators and full-text search.

**Key Features:**

- ✅ **Zero Server Dependencies** — Complete PostgreSQL database in the browser
- ✅ **Persistent Storage** — Data survives page refresh via IndexedDB or OPFS
- ✅ **Full PostgreSQL Support** — JSONB operators, array types, full-text search, CTEs, window functions
- ✅ **Transaction Support** — ACID transactions with savepoints and isolation levels
- ✅ **Reuses SQL Pipeline** — Composes `@objectql/driver-sql` for proven Knex-based query building
- ✅ **~3MB Bundle** — Optimized WASM binary size, acceptable for apps needing PostgreSQL features
- ✅ **Library-Agnostic API** — Public API references "PostgreSQL WASM", underlying implementation (PGlite) is swappable
- ✅ **Extension Support** — Optional extensions like pgvector, postgis (loaded on demand)

## Architecture

```
QueryAST → SqlDriver (Knex) → SQL string → PGlite WASM → IndexedDB/OPFS/Memory
```

This driver uses **composition over inheritance**:
- Wraps `SqlDriver` from `@objectql/driver-sql` internally
- Custom Knex client adapter bridges PGlite WASM API
- All query compilation logic delegated to `SqlDriver`
- No code duplication, only WASM integration layer

## Installation

```bash
pnpm add @objectql/driver-pg-wasm
```

## Usage

### Basic Example

```typescript
import { PgWasmDriver } from '@objectql/driver-pg-wasm';

// Create driver with IndexedDB persistence (default)
const driver = new PgWasmDriver({
  storage: 'idb',           // 'idb' | 'opfs' | 'memory'
  database: 'myapp',        // Database name
  extensions: []            // Optional: ['vector', 'postgis']
});

// Initialize schema
await driver.init([
  {
    name: 'tasks',
    fields: {
      id: { type: 'text', primary: true },
      title: { type: 'text' },
      metadata: { type: 'jsonb' },        // PostgreSQL JSONB
      tags: { type: 'text[]' },           // PostgreSQL array
      completed: { type: 'boolean', default: false }
    }
  }
]);

// CRUD operations
const task = await driver.create('tasks', {
  title: 'Learn ObjectQL',
  metadata: { priority: 'high', category: 'learning' },
  tags: ['objectql', 'postgresql', 'wasm'],
  completed: false
});

// JSONB query (PostgreSQL-specific)
const highPriorityTasks = await driver.jsonbQuery(
  'tasks', 
  'metadata', 
  { priority: 'high' }
);

// Full-text search (PostgreSQL-specific)
const searchResults = await driver.fullTextSearch(
  'tasks',
  'title',
  'learn postgresql'
);

await driver.update('tasks', task.id, { completed: true });

await driver.delete('tasks', task.id);
```

### With ObjectStack Kernel

```typescript
import { ObjectStackKernel } from '@objectstack/runtime';
import { PgWasmDriver } from '@objectql/driver-pg-wasm';
import { HonoServerPlugin } from '@objectstack/plugin-hono-server';
import MyAppManifest from './objectstack.config';

const kernel = new ObjectStackKernel([
  MyAppManifest,
  new PgWasmDriver({ storage: 'idb' }),
  new HonoServerPlugin({ port: 3000 })
]);

await kernel.start();
```

### With Extensions (pgvector example)

```typescript
// Enable vector similarity search
const driver = new PgWasmDriver({
  storage: 'idb',
  extensions: ['vector']
});

await driver.init([
  {
    name: 'documents',
    fields: {
      id: { type: 'text', primary: true },
      content: { type: 'text' },
      embedding: { type: 'vector(1536)' }  // OpenAI embedding
    }
  }
]);

// Vector similarity search
const similar = await driver.query(
  'SELECT * FROM documents ORDER BY embedding <-> $1 LIMIT 5',
  [targetEmbedding]
);
```

## Configuration

```typescript
export interface PgWasmDriverConfig {
  /** Storage backend. Default: 'idb' */
  storage?: 'idb' | 'opfs' | 'memory';
  
  /** Database name. Default: 'objectql' */
  database?: string;
  
  /** Enable PGlite extensions (e.g., 'vector', 'postgis'). Default: [] */
  extensions?: string[];
}
```

### Storage Modes

| Mode | Persistence | Use Case | Browser Support |
|------|-------------|----------|-----------------|
| **idb** | Persistent (IndexedDB) | Production apps, default choice | All modern browsers |
| **opfs** | Persistent (OPFS) | High-performance PWAs | Chrome 102+, Edge 102+, Safari 15.2+ |
| **memory** | Ephemeral (lost on refresh) | Testing, demos | All browsers with WASM support |

**Auto-fallback:** If the specified storage is unavailable, the driver automatically tries alternatives:
- `idb` → `opfs` → `memory`
- `opfs` → `idb` → `memory`

## Environment Requirements

| Requirement | Minimum Version |
|-------------|-----------------|
| **WebAssembly** | Required (95%+ browser coverage) |
| **IndexedDB** | Optional (for persistence) |
| **OPFS** | Optional (for high-performance persistence) |
| **Browser Support** | Chrome 102+, Firefox 110+, Safari 15.2+, Edge 102+ |

**Environment Detection:**

```typescript
import { 
  checkWebAssembly, 
  checkIndexedDB, 
  checkOPFS, 
  detectStorageBackend 
} from '@objectql/driver-pg-wasm';

// Throws ObjectQLError({ code: 'ENVIRONMENT_ERROR' }) if WASM unavailable
checkWebAssembly();

// Returns true if IndexedDB is supported
const hasIDB = await checkIndexedDB();

// Returns true if OPFS is supported
const hasOPFS = await checkOPFS();

// Auto-detect best storage backend
const storage = await detectStorageBackend(); // 'idb' | 'opfs' | 'memory'

const driver = new PgWasmDriver({ storage });
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
  transactions: true,              // Full ACID transactions
  savepoints: true,
  isolationLevels: [
    'read-uncommitted',
    'read-committed',
    'repeatable-read',
    'serializable'
  ],
  queryFilters: true,
  queryAggregations: true,
  querySorting: true,
  queryPagination: true,
  queryWindowFunctions: true,
  querySubqueries: true,
  queryCTE: true,
  joins: true,
  fullTextSearch: true,
  jsonQuery: true,                 // JSONB queries
  jsonFields: true,
  arrayFields: true,                // PostgreSQL arrays
  streaming: false,
  schemaSync: true,
  migrations: true,
  indexes: true,
  connectionPooling: false,
  preparedStatements: true,
  queryCache: false
};
```

## API Reference

### Standard Driver Methods

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

### Transaction Methods

| Method | Description |
|--------|-------------|
| `beginTransaction()` | Start a transaction |
| `commitTransaction(tx)` | Commit transaction |
| `rollbackTransaction(tx)` | Rollback transaction |

### PostgreSQL-Specific Methods

| Method | Description |
|--------|-------------|
| `query(sql, params?)` | Execute raw SQL query |
| `jsonbQuery(object, field, query)` | Query JSONB field with containment operator (@>) |
| `fullTextSearch(object, field, query)` | PostgreSQL full-text search with tsvector |

## PostgreSQL-Specific Features

### JSONB Operators

```typescript
// Create record with JSONB field
await driver.create('users', {
  name: 'Alice',
  metadata: {
    role: 'admin',
    permissions: ['read', 'write', 'delete'],
    settings: { theme: 'dark', notifications: true }
  }
});

// Query with JSONB containment
const admins = await driver.jsonbQuery('users', 'metadata', {
  role: 'admin'
});

// Raw JSONB operators
const results = await driver.query(
  `SELECT * FROM users WHERE metadata->>'role' = $1`,
  ['admin']
);
```

### Array Types

```typescript
// Create record with array field
await driver.create('posts', {
  title: 'PostgreSQL in the Browser',
  tags: ['postgresql', 'wasm', 'browser']
});

// Query array fields
const results = await driver.query(
  `SELECT * FROM posts WHERE 'wasm' = ANY(tags)`
);
```

### Full-Text Search

```typescript
// Create documents
await driver.create('articles', {
  title: 'Getting Started with ObjectQL',
  content: 'ObjectQL is a metadata-driven database abstraction...'
});

// Full-text search
const results = await driver.fullTextSearch(
  'articles',
  'content',
  'metadata database'
);

// Advanced full-text search with ranking
const ranked = await driver.query(`
  SELECT *, ts_rank(to_tsvector('english', content), query) as rank
  FROM articles, plainto_tsquery('english', $1) query
  WHERE to_tsvector('english', content) @@ query
  ORDER BY rank DESC
  LIMIT 10
`, ['metadata database']);
```

### Transaction Example

```typescript
const tx = await driver.beginTransaction();

try {
  await driver.create('accounts', { id: '1', balance: 100 }, { transaction: tx });
  await driver.create('accounts', { id: '2', balance: 50 }, { transaction: tx });
  await driver.commitTransaction(tx);
} catch (error) {
  await driver.rollbackTransaction(tx);
  throw error;
}
```

## Performance Considerations

### Bundle Size

| Component | Size (gzip) |
|-----------|-------------|
| Driver code | ~10KB |
| PGlite WASM | ~2.9MB |
| **Total** | **~3MB** |

**When to use PgWasmDriver vs SqliteWasmDriver:**
- Use **PgWasmDriver** when you need:
  - JSONB operators for complex JSON queries
  - Array types
  - Full-text search with ranking
  - Advanced PostgreSQL features (CTEs, window functions, etc.)
  - Compatibility with PostgreSQL server schema
- Use **SqliteWasmDriver** when:
  - Bundle size is critical (~300KB vs ~3MB)
  - Basic SQL features are sufficient
  - Simpler deployment

### Storage Performance

| Storage | Read Latency | Write Latency | Quota |
|---------|--------------|---------------|-------|
| **IndexedDB** | ~5-10ms | ~10-20ms | ~50% of disk space |
| **OPFS** | ~1-2ms | ~2-5ms | ~60% of disk space |
| **Memory** | <1ms | <1ms | RAM limit |

## Migration Guide

### From SQLite WASM Driver

```typescript
// OLD
import { SqliteWasmDriver } from '@objectql/driver-sqlite-wasm';
const driver = new SqliteWasmDriver({ storage: 'opfs' });

// NEW
import { PgWasmDriver } from '@objectql/driver-pg-wasm';
const driver = new PgWasmDriver({ storage: 'idb' });
```

**Benefits:**
- JSONB operators for complex queries
- Array types
- Full-text search
- Better PostgreSQL compatibility
- Transaction support with savepoints

**Trade-offs:**
- Larger bundle size (~3MB vs ~300KB)
- Slightly higher memory usage

### From LocalStorage Driver

```typescript
// OLD (deprecated)
import { LocalStorageDriver } from '@objectql/driver-localstorage';
const driver = new LocalStorageDriver();

// NEW
import { PgWasmDriver } from '@objectql/driver-pg-wasm';
const driver = new PgWasmDriver({ storage: 'idb' });
```

## Troubleshooting

### ENVIRONMENT_ERROR: WebAssembly not supported

**Cause:** Browser does not support WebAssembly.

**Solution:** Check browser compatibility. All modern browsers (Chrome 57+, Firefox 52+, Safari 11+) support WASM.

### Storage fallback warnings

**Cause:** Preferred storage backend not available.

**Solution:** Driver auto-falls back to alternative storage. Check console warnings to see which backend is being used.

```typescript
// Explicitly check storage availability
import { checkIndexedDB, checkOPFS } from '@objectql/driver-pg-wasm';

if (await checkIndexedDB()) {
  console.log('IndexedDB available');
} else if (await checkOPFS()) {
  console.log('OPFS available');
} else {
  console.warn('Only memory storage available - data will not persist');
}
```

### Data lost after page refresh

**Cause:** Driver is using memory storage instead of persistent storage.

**Solution:** Ensure IndexedDB or OPFS is available, or explicitly configure storage.

### Large bundle size

**Cause:** PGlite WASM binary is ~3MB.

**Solution:**
- Use dynamic imports to lazy-load the driver
- Consider `@objectql/driver-sqlite-wasm` if PostgreSQL features aren't needed
- Use code-splitting for multi-driver apps

```typescript
// Lazy load the driver
const { PgWasmDriver } = await import('@objectql/driver-pg-wasm');
const driver = new PgWasmDriver();
```

## Limitations

- **No Connection Pooling:** Single connection architecture
- **No Cross-Tab Sync:** Database changes not visible across tabs/windows (planned)
- **No Streaming:** Result sets fully materialized in memory
- **Extension Loading:** Extensions must be explicitly configured (not auto-loaded)

## Roadmap

- [ ] Cross-tab synchronization via BroadcastChannel
- [ ] Streaming query results
- [ ] Pre-built extension bundles (vector, postgis)
- [ ] Incremental vacuum on disconnect
- [ ] Encryption at rest
- [ ] Multi-database support

## License

MIT © ObjectStack Inc.

## Related Packages

- [`@objectql/driver-sql`](../sql) — Server-side SQL driver (PostgreSQL, MySQL, SQLite)
- [`@objectql/driver-sqlite-wasm`](../sqlite-wasm) — SQLite WASM driver (~300KB, simpler use cases)
- [`@objectql/driver-memory`](../memory) — In-memory driver for testing
- [`@objectql/driver-sdk`](../sdk) — Remote HTTP driver

## Contributing

See [CONTRIBUTING.md](../../../CONTRIBUTING.md) for development guidelines.

## Support

- [Documentation](https://objectql.dev/drivers/pg-wasm)
- [GitHub Issues](https://github.com/objectstack-ai/objectql/issues)
- [Discord Community](https://discord.gg/objectql)
