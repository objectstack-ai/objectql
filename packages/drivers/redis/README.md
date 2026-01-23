# Redis Driver for ObjectQL (Example Implementation)

> ⚠️ **Note**: This is an **example/template implementation** to demonstrate how to create custom ObjectQL drivers. It is not production-ready and serves as a reference for driver development.

**Version 4.0.0** - Now compliant with DriverInterface from @objectstack/spec

## Overview

The Redis Driver is a reference implementation showing how to adapt a key-value store (Redis) to work with ObjectQL's universal data protocol. While Redis is primarily designed for caching and simple key-value operations, this driver demonstrates how to map ObjectQL's rich query interface to a simpler database model.

This driver implements both the legacy Driver interface from @objectql/types and the standard DriverInterface from @objectstack/spec for full compatibility with the new kernel-based plugin system.

## Features

- ✅ Basic CRUD operations (Create, Read, Update, Delete)
- ✅ **v4.0**: executeQuery() with QueryAST support
- ✅ **v4.0**: executeCommand() with unified command interface
- ✅ **v4.0**: Bulk operations (bulkCreate, bulkUpdate, bulkDelete) using Redis PIPELINE
- ✅ Query filtering (in-memory)
- ✅ Sorting (in-memory)
- ✅ Pagination (skip/limit)
- ✅ Count operations
- ⚠️ Limited performance for complex queries (scans all keys)
- ❌ No native aggregation support
- ❌ No transaction support
- ❌ No schema introspection

## Use Cases

This driver is suitable for:

- **Caching Layer**: Store frequently accessed data
- **Session Storage**: User sessions and temporary data
- **Simple Key-Value Storage**: When you don't need complex queries
- **Development/Testing**: Quick prototyping without a full database

## Installation

```bash
npm install @objectql/driver-redis redis
```

## Configuration

```typescript
import { ObjectQL } from '@objectql/core';
import { RedisDriver } from '@objectql/driver-redis';

const driver = new RedisDriver({
  url: 'redis://localhost:6379',
  // Optional: Redis client options
  options: {
    password: 'your-password',
    database: 0
  }
});

const app = new ObjectQL({
  driver: driver
});

await app.init();
```

## Basic Usage

```typescript
// Create a record
const user = await app.create('users', {
  name: 'Alice',
  email: 'alice@example.com',
  role: 'admin'
});
console.log(user.id); // Auto-generated ID

// Find records
const users = await app.find('users', {
  filters: [['role', '=', 'admin']],
  sort: [['name', 'asc']],
  limit: 10
});

// Update a record
await app.update('users', user.id, {
  email: 'alice.new@example.com'
});

// Delete a record
await app.delete('users', user.id);
```

## Performance Considerations

### ⚠️ Important Limitations

This Redis driver uses **full key scanning** for queries, which means:

1. **Find Operations**: Scans ALL keys matching `objectName:*` pattern
2. **Filters**: Applied in-memory after loading all records
3. **Count**: Loads all records to count matches

### Performance Impact

- **Small Datasets** (< 1000 records): ✅ Acceptable
- **Medium Datasets** (1K-10K records): ⚠️ Slow for complex queries
- **Large Datasets** (> 10K records): ❌ Not recommended

### Optimization Strategies

For production use, consider:

1. **Redis Modules**: Use RedisJSON or RedisSearch for better query support
2. **Indexing**: Implement secondary indexes using Redis Sets
3. **Hybrid Approach**: Use Redis for caching, another driver for queries
4. **Sharding**: Distribute data across multiple Redis instances

## How Data is Stored

Records are stored as JSON strings with keys following the pattern:

```
objectName:id
```

Example:
```
users:user-123 → {"id":"user-123","name":"Alice","email":"alice@example.com","created_at":"2026-01-15T00:00:00.000Z"}
```

## API Reference

### Constructor

```typescript
new RedisDriver(config: RedisDriverConfig)
```

**Config Options:**
- `url` (string, required): Redis connection URL
- `options` (object, optional): Additional Redis client options

### Methods

All standard Driver interface methods are implemented:

**Legacy Driver Interface:**
- `find(objectName, query, options)` - Query multiple records
- `findOne(objectName, id, query, options)` - Get single record by ID
- `create(objectName, data, options)` - Create new record
- `update(objectName, id, data, options)` - Update existing record
- `delete(objectName, id, options)` - Delete record
- `count(objectName, filters, options)` - Count matching records
- `disconnect()` - Close Redis connection

**DriverInterface v4.0 Methods:**
- `executeQuery(ast, options)` - Execute queries using QueryAST format
- `executeCommand(command, options)` - Execute commands (create, update, delete, bulk operations)

### executeQuery Examples

The new `executeQuery` method uses the QueryAST format from @objectstack/spec:

```typescript
// Basic query
const result = await driver.executeQuery({
  object: 'users',
  fields: ['name', 'email']
});
console.log(result.value); // Array of users
console.log(result.count); // Number of results

// Query with filters
const result = await driver.executeQuery({
  object: 'users',
  filters: {
    type: 'comparison',
    field: 'age',
    operator: '>',
    value: 18
  },
  sort: [{ field: 'name', order: 'asc' }],
  top: 10,
  skip: 0
});

// Complex filters (AND/OR)
const result = await driver.executeQuery({
  object: 'users',
  filters: {
    type: 'and',
    children: [
      { type: 'comparison', field: 'role', operator: '=', value: 'user' },
      { type: 'comparison', field: 'age', operator: '>', value: 30 }
    ]
  }
});
```

### executeCommand Examples

The new `executeCommand` method provides a unified interface for mutations:

```typescript
// Create a record
const result = await driver.executeCommand({
  type: 'create',
  object: 'users',
  data: { name: 'Alice', email: 'alice@example.com' }
});
console.log(result.success); // true
console.log(result.data); // Created user object
console.log(result.affected); // 1

// Update a record
const result = await driver.executeCommand({
  type: 'update',
  object: 'users',
  id: 'user-123',
  data: { email: 'newemail@example.com' }
});

// Delete a record
const result = await driver.executeCommand({
  type: 'delete',
  object: 'users',
  id: 'user-123'
});

// Bulk create (uses Redis PIPELINE for performance)
const result = await driver.executeCommand({
  type: 'bulkCreate',
  object: 'users',
  records: [
    { name: 'Alice', age: 30 },
    { name: 'Bob', age: 25 },
    { name: 'Charlie', age: 35 }
  ]
});
console.log(result.affected); // 3

// Bulk update
const result = await driver.executeCommand({
  type: 'bulkUpdate',
  object: 'users',
  updates: [
    { id: 'user-1', data: { age: 31 } },
    { id: 'user-2', data: { age: 26 } }
  ]
});

// Bulk delete
const result = await driver.executeCommand({
  type: 'bulkDelete',
  object: 'users',
  ids: ['user-1', 'user-2', 'user-3']
});
```

## Example: Using as Cache Layer

Redis works great as a caching layer in front of another driver:

```typescript
import { SqlDriver } from '@objectql/driver-sql';
import { RedisDriver } from '@objectql/driver-redis';

// Primary database
const sqlDriver = new SqlDriver({
  client: 'pg',
  connection: process.env.DATABASE_URL
});

// Cache layer
const redisDriver = new RedisDriver({
  url: process.env.REDIS_URL
});

// Use SQL for writes, Redis for cached reads
const app = new ObjectQL({
  datasources: {
    default: sqlDriver,
    cache: redisDriver
  }
});
```

## Development

### Building

```bash
pnpm build
```

### Testing

```bash
# Start Redis
docker run -d -p 6379:6379 redis:latest

# Run tests
pnpm test
```

### Project Structure

```
packages/drivers/redis/
├── src/
│   └── index.ts          # Main driver implementation
├── test/
│   └── index.test.ts     # Unit tests
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
```

## Extending This Driver

This is an example implementation. To make it production-ready:

1. **Add Redis Modules Support**
   - RedisJSON for native JSON queries
   - RedisSearch for full-text search

2. **Implement Secondary Indexes**
   - Use Redis Sets for indexed fields
   - Maintain index consistency

3. **Add Transaction Support**
   - Use Redis MULTI/EXEC for atomic operations

4. **Optimize Queries**
   - Avoid scanning all keys
   - Implement cursor-based pagination

5. **Add Connection Pooling**
   - Handle connection failures
   - Implement retry logic

## Related Documentation

- [Driver Extensibility Guide](../../../docs/guide/drivers/extensibility.md)
- [Implementing Custom Drivers](../../../docs/guide/drivers/implementing-custom-driver.md)
- [Driver Interface Reference](../../foundation/types/src/driver.ts)

## License

MIT - Same as ObjectQL

## Contributing

This is an example driver for educational purposes. For production Redis support:

1. Fork this implementation
2. Add production features (see "Extending This Driver")
3. Publish as a community driver
4. Share with the ObjectQL community

## Questions?

- 📖 Read the [Custom Driver Guide](../../../docs/guide/drivers/implementing-custom-driver.md)
- 💬 Ask in ObjectQL Discussions
- 🐛 [Report Issues](https://github.com/objectstack-ai/objectql/issues)
