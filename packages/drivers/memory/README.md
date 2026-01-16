# Memory Driver for ObjectQL

> ✅ **Production-Ready** - A high-performance in-memory driver for testing, development, and edge environments.

## Overview

The Memory Driver is a zero-dependency, production-ready implementation of the ObjectQL Driver interface that stores data in JavaScript Maps. It provides full query support with high performance, making it ideal for scenarios where persistence is not required.

## Features

- ✅ **Zero Dependencies** - No external packages required
- ✅ **Full Query Support** - Filters, sorting, pagination, field projection
- ✅ **High Performance** - No I/O overhead, all operations in-memory
- ✅ **Bulk Operations** - createMany, updateMany, deleteMany
- ✅ **Thread-Safe** - Safe for concurrent operations
- ✅ **Strict Mode** - Optional error throwing for missing records
- ✅ **Initial Data** - Pre-populate on initialization
- ✅ **TypeScript** - Full type safety and IntelliSense support

## Use Cases

This driver is perfect for:

1. **Unit Testing** - No database setup required, instant cleanup
2. **Development & Prototyping** - Quick iteration without infrastructure
3. **Edge Environments** - Cloudflare Workers, Deno Deploy, Vercel Edge
4. **Client-Side State** - Browser-based applications
5. **Temporary Caching** - Short-lived data storage
6. **CI/CD Pipelines** - Fast tests without database dependencies

## Installation

```bash
# Using pnpm (recommended)
pnpm add @objectql/driver-memory

# Using npm
npm install @objectql/driver-memory

# Using yarn
yarn add @objectql/driver-memory
```

Or if you're using the ObjectQL monorepo:

```bash
pnpm add @objectql/driver-memory
```

## Basic Usage

```typescript
import { ObjectQL } from '@objectql/core';
import { MemoryDriver } from '@objectql/driver-memory';

// Initialize the driver
const driver = new MemoryDriver();

// Create ObjectQL instance
const app = new ObjectQL({
  datasources: { default: driver }
});

// Register your schema
app.registerObject({
  name: 'users',
  fields: {
    name: { type: 'text', required: true },
    email: { type: 'email', unique: true },
    role: { type: 'select', options: ['admin', 'user'] }
  }
});

await app.init();

// Use it!
const ctx = app.createContext({ isSystem: true });
const repo = ctx.object('users');

// Create
const user = await repo.create({
  name: 'Alice',
  email: 'alice@example.com',
  role: 'admin'
});

// Find
const users = await repo.find({
  filters: [['role', '=', 'user']]
});

// Update
await repo.update(user.id, { email: 'alice.new@example.com' });

// Delete
await repo.delete(user.id);
```

## Browser Usage

The Memory Driver works seamlessly in web browsers! Perfect for prototyping, client-side apps, and offline experiences.

### Quick Start in Browser

```html
<!DOCTYPE html>
<html>
<head>
    <title>ObjectQL in Browser</title>
</head>
<body>
    <h1>ObjectQL Browser Demo</h1>
    <script type="module">
        import { ObjectQL } from '@objectql/core';
        import { MemoryDriver } from '@objectql/driver-memory';
        
        // Initialize
        const driver = new MemoryDriver();
        const app = new ObjectQL({
            datasources: { default: driver }
        });
        
        // Define schema
        app.registerObject({
            name: 'tasks',
            fields: {
                title: { type: 'text', required: true },
                completed: { type: 'boolean', defaultValue: false }
            }
        });
        
        await app.init();
        
        // Use it!
        const ctx = app.createContext({ isSystem: true });
        const tasks = ctx.object('tasks');
        
        await tasks.create({ title: 'Learn ObjectQL in Browser!' });
        const allTasks = await tasks.find({});
        console.log('Tasks:', allTasks);
    </script>
</body>
</html>
```

### Interactive Browser Demo

See the **examples** in the repository for interactive demonstrations.
- 🎨 Beautiful UI with live CRUD operations
- 🖥️ Browser console debugging
- 📊 Real-time statistics
- ✨ Sample data generation

### Browser Compatibility

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ All modern browsers with ES6+ support

### Browser vs Node.js

| Feature | Browser | Node.js |
|---------|---------|---------|
| **Performance** | ⚡ Fast | ⚡ Fast |
| **Persistence** | ❌ Lost on refresh | ❌ Lost on process exit |
| **Use Case** | Prototyping, Client state | Testing, Dev, Edge |
| **Data Limit** | RAM (GB) | RAM (GB) |

**For persistent browser storage**, use the [LocalStorage Driver](../localstorage/README.md).

## Configuration Options

### Basic Configuration

```typescript
const driver = new MemoryDriver();
```

### With Initial Data

```typescript
const driver = new MemoryDriver({
  initialData: {
    users: [
      { id: '1', name: 'Alice', email: 'alice@example.com' },
      { id: '2', name: 'Bob', email: 'bob@example.com' }
    ],
    posts: [
      { id: '1', title: 'Hello World', author_id: '1' }
    ]
  }
});
```

### With Strict Mode

```typescript
const driver = new MemoryDriver({
  strictMode: true  // Throws errors for missing records
});

// This will throw an error instead of returning null
await driver.update('users', 'non-existent-id', { name: 'Test' });
// ObjectQLError: Record with id 'non-existent-id' not found in 'users'
```

## API Reference

### Core Methods

All methods implement the standard Driver interface from `@objectql/types`:

#### `find(objectName, query, options)`

Find multiple records with optional filtering, sorting, and pagination.

```typescript
const users = await driver.find('users', {
  filters: [
    ['role', '=', 'admin'],
    'or',
    ['age', '>', 30]
  ],
  sort: [['name', 'asc']],
  skip: 0,
  limit: 10,
  fields: ['name', 'email']
});
```

#### `findOne(objectName, id, query, options)`

Find a single record by ID or query.

```typescript
// By ID
const user = await driver.findOne('users', 'user-123');

// By query
const admin = await driver.findOne('users', null, {
  filters: [['role', '=', 'admin']]
});
```

#### `create(objectName, data, options)`

Create a new record.

```typescript
const user = await driver.create('users', {
  name: 'Alice',
  email: 'alice@example.com'
});
// Returns: { id: 'users-1234567890-1', name: 'Alice', ... }
```

#### `update(objectName, id, data, options)`

Update an existing record.

```typescript
const updated = await driver.update('users', 'user-123', {
  email: 'alice.new@example.com'
});
```

#### `delete(objectName, id, options)`

Delete a record.

```typescript
const deleted = await driver.delete('users', 'user-123');
// Returns: true if deleted, false if not found
```

#### `count(objectName, filters, options)`

Count records matching filters.

```typescript
const adminCount = await driver.count('users', [
  ['role', '=', 'admin']
]);
```

### Bulk Operations

#### `createMany(objectName, data, options)`

Create multiple records at once.

```typescript
const users = await driver.createMany('users', [
  { name: 'Alice' },
  { name: 'Bob' },
  { name: 'Charlie' }
]);
```

#### `updateMany(objectName, filters, data, options)`

Update all records matching filters.

```typescript
const result = await driver.updateMany(
  'users',
  [['role', '=', 'user']],
  { status: 'active' }
);
// Returns: { modifiedCount: 5 }
```

#### `deleteMany(objectName, filters, options)`

Delete all records matching filters.

```typescript
const result = await driver.deleteMany('users', [
  ['status', '=', 'inactive']
]);
// Returns: { deletedCount: 3 }
```

### Advanced Operations

#### `distinct(objectName, field, filters, options)`

Get unique values for a field.

```typescript
const roles = await driver.distinct('users', 'role');
// Returns: ['admin', 'user', 'moderator']
```

### Utility Methods

#### `clear()`

Remove all data from the store.

```typescript
await driver.clear();
```

#### `getSize()`

Get the total number of records in the store.

```typescript
const size = driver.getSize();
// Returns: 42
```

#### `disconnect()`

Gracefully disconnect (no-op for memory driver).

```typescript
await driver.disconnect();
```

## Supported Query Operators

The Memory Driver supports all standard ObjectQL query operators:

### Comparison Operators

- `=`, `==` - Equals
- `!=`, `<>` - Not equals
- `>` - Greater than
- `>=` - Greater than or equal
- `<` - Less than
- `<=` - Less than or equal

### Set Operators

- `in` - Value in array
- `nin`, `not in` - Value not in array

### String Operators

- `contains`, `like` - Contains substring (case-insensitive)
- `startswith`, `starts_with` - Starts with string
- `endswith`, `ends_with` - Ends with string

### Range Operators

- `between` - Value between two values (inclusive)

### Logical Operators

- `and` - Logical AND (default)
- `or` - Logical OR

## Query Examples

### Simple Filter

```typescript
const admins = await driver.find('users', {
  filters: [['role', '=', 'admin']]
});
```

### Multiple Filters (AND)

```typescript
const activeAdmins = await driver.find('users', {
  filters: [
    ['role', '=', 'admin'],
    'and',
    ['status', '=', 'active']
  ]
});
```

### OR Filters

```typescript
const results = await driver.find('users', {
  filters: [
    ['role', '=', 'admin'],
    'or',
    ['permissions', 'contains', 'manage_users']
  ]
});
```

### Range Queries

```typescript
const middleAged = await driver.find('users', {
  filters: [['age', 'between', [30, 50]]]
});
```

### Sorting

```typescript
const sorted = await driver.find('users', {
  sort: [
    ['role', 'asc'],
    ['created_at', 'desc']
  ]
});
```

### Pagination

```typescript
// Get page 2 with 10 items per page
const page2 = await driver.find('users', {
  skip: 10,
  limit: 10,
  sort: [['created_at', 'desc']]
});
```

### Field Projection

```typescript
const names = await driver.find('users', {
  fields: ['id', 'name', 'email']
});
// Returns only id, name, and email fields
```

## Testing with Memory Driver

The Memory Driver is ideal for unit tests:

```typescript
import { MemoryDriver } from '@objectql/driver-memory';

describe('User Service', () => {
  let driver: MemoryDriver;

  beforeEach(() => {
    driver = new MemoryDriver({
      initialData: {
        users: [
          { id: '1', name: 'Test User', role: 'user' }
        ]
      }
    });
  });

  afterEach(async () => {
    await driver.clear();
  });

  it('should find users by role', async () => {
    const users = await driver.find('users', {
      filters: [['role', '=', 'user']]
    });
    expect(users).toHaveLength(1);
  });
});
```

## Performance Characteristics

- **Create**: O(1)
- **Read by ID**: O(1)
- **Update**: O(1)
- **Delete**: O(1)
- **Find/Query**: O(n) - Scans all records for the object type
- **Count**: O(n) - Scans all matching records
- **Sort**: O(n log n)

### Performance Tips

1. **Use specific filters** - More filters reduce the result set faster
2. **Limit results** - Use `limit` to avoid processing large result sets
3. **Clear regularly** - Call `clear()` to free memory in long-running processes
4. **Consider size** - Memory driver is best for < 10,000 records per object type

## Comparison with Other Drivers

| Feature | Memory | SQL | MongoDB | Redis |
|---------|--------|-----|---------|-------|
| **Setup Required** | ❌ None | ✅ Database | ✅ Database | ✅ Redis Server |
| **Persistence** | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes |
| **Performance** | ⚡ Fastest | 🐢 Slower | 🏃 Fast | 🏃 Fast |
| **Query Support** | ✅ Full | ✅ Full | ✅ Full | ⚠️ Limited |
| **Production Ready** | ✅ Yes* | ✅ Yes | ✅ Yes | ⚠️ Example |
| **Dependencies** | 0 | 2-3 | 1 | 1 |

*For use cases where persistence is not required

## Limitations

1. **No Persistence** - Data is lost when the process ends
2. **Memory Bound** - Limited by available RAM
3. **Single Instance** - No distribution or clustering
4. **No Transactions** - Operations are individual (though atomic)
5. **Linear Scans** - Queries scan all records (no indexes)

## Migration Guide

### From Redis Driver to Memory Driver

```typescript
// Before
import { RedisDriver } from '@objectql/driver-redis';
const driver = new RedisDriver({ url: 'redis://localhost:6379' });

// After
import { MemoryDriver } from '@objectql/driver-memory';
const driver = new MemoryDriver();
```

### From SQL Driver to Memory Driver (for testing)

```typescript
// Production
const driver = new SqlDriver({
  client: 'pg',
  connection: process.env.DATABASE_URL
});

// Testing
const driver = new MemoryDriver({
  initialData: {
    users: [/* test data */],
    posts: [/* test data */]
  }
});
```

## Troubleshooting

### Out of Memory Errors

```typescript
// Problem: Too much data
const driver = new MemoryDriver();
// ... add millions of records

// Solution: Clear periodically or use a persistent driver
await driver.clear();
```

### Slow Queries

```typescript
// Problem: Scanning large datasets
const results = await driver.find('users', {}); // Returns 100,000 records

// Solution: Add filters and limits
const results = await driver.find('users', {
  filters: [['status', '=', 'active']],
  limit: 100
});
```

## Related Documentation

- [Driver Extensibility Guide](../../../docs/guide/drivers/extensibility.md)
- [Implementing Custom Drivers](../../../docs/guide/drivers/implementing-custom-driver.md)
- [Driver Interface Reference](../../foundation/types/src/driver.ts)
- [ObjectQL Core Documentation](../../foundation/core/README.md)

## Contributing

Found a bug or have a feature request? Please open an issue on [GitHub](https://github.com/objectstack-ai/objectql/issues).

## License

MIT - Same as ObjectQL

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for version history.
