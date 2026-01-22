# @objectql/driver-sql

Knex.js based SQL driver for ObjectQL. Supports PostgreSQL, MySQL, SQLite, and other SQL databases.

**Phase 4 Update**: Now implements the standard `DriverInterface` from `@objectstack/spec` with full backward compatibility.

## Features

- ✅ **ObjectStack Spec Compatible**: Implements `DriverInterface` from `@objectstack/spec`
- ✅ **QueryAST Support**: Supports both legacy UnifiedQuery and new QueryAST formats
- ✅ **Multiple Databases**: PostgreSQL, MySQL, SQLite, and more via Knex
- ✅ **Transactions**: Full transaction support with begin/commit/rollback
- ✅ **Aggregations**: COUNT, SUM, AVG, MIN, MAX with GROUP BY
- ✅ **Schema Management**: Auto-create/update tables from metadata
- ✅ **Introspection**: Discover existing database schemas
- ✅ **100% Backward Compatible**: All existing code continues to work

## Installation

```bash
npm install @objectql/driver-sql
```

## Basic Usage

```typescript
import { SqlDriver } from '@objectql/driver-sql';

const driver = new SqlDriver({
    client: 'sqlite3',
    connection: {
        filename: './data.db'
    },
    useNullAsDefault: true
});

const objectql = new ObjectQL({
    datasources: {
        default: driver
    }
});
```

## QueryAST Format (New)

The driver now supports the QueryAST format from `@objectstack/spec`:

```typescript
// New QueryAST format
const results = await driver.find('users', {
    fields: ['name', 'email'],
    filters: [['active', '=', true]],
    sort: [{ field: 'created_at', order: 'desc' }],
    top: 10,  // Instead of 'limit'
    skip: 0
});

// Aggregations
const stats = await driver.aggregate('orders', {
    aggregations: [
        { function: 'sum', field: 'amount', alias: 'total' },
        { function: 'count', field: '*', alias: 'count' }
    ],
    groupBy: ['customer_id'],
    filters: [['status', '=', 'completed']]
});
```

## Legacy Format (Still Supported)

All existing code continues to work:

```typescript
// Legacy UnifiedQuery format
const results = await driver.find('users', {
    fields: ['name', 'email'],
    filters: [['active', '=', true]],
    sort: [['created_at', 'desc']],
    limit: 10,
    skip: 0
});
```

## Driver Metadata

The driver exposes metadata for ObjectStack compatibility:

```typescript
console.log(driver.name);      // 'SqlDriver'
console.log(driver.version);   // '3.0.1'
console.log(driver.supports);  // { transactions: true, joins: true, ... }
```

## Lifecycle Methods

```typescript
// Connect (optional - connection is automatic)
await driver.connect();

// Check health
const healthy = await driver.checkHealth(); // true/false

// Disconnect
await driver.disconnect();
```

## Migration Guide

See [MIGRATION.md](./MIGRATION.md) for detailed migration information from legacy format to QueryAST format.

## License

MIT

