# Database Drivers

ObjectQL relies on **Drivers** to communicate with the underlying database. A driver is responsible for translating the ObjectQL specific query format (AST) into the native query language of the database (SQL, MongoDB Query, etc.).

You can configure multiple drivers for different parts of your application, or use a single driver for everything.

## Available Drivers

We currently support the following official drivers:

*   **[SQL Driver](./sql)**: Supports PostgreSQL, MySQL, SQLite, MSSQL, etc.
*   **[MongoDB Driver](./mongo)**: Supports MongoDB.

## Unified ID Field

ObjectQL provides a **consistent API** across all database drivers by standardizing on the `id` field name for primary keys:

- **MongoDB Driver**: Automatically maps `id` (API) ↔ `_id` (database)
- **SQL Driver**: Uses `id` natively in the database schema

This means you can write database-agnostic code:

```typescript
// Same code works with MongoDB OR SQL drivers!
const user = await app.create('users', {
  id: 'user-123',     // Works with both drivers
  name: 'Alice'
});

const query = {
  filters: [['id', '=', 'user-123']]  // Consistent across drivers
};
const results = await app.find('users', query);
```

**No more switching between `_id` and `id` depending on your database!**

See the individual driver documentation for implementation details.

## Configuring a Driver

Drivers are instantiated and passed to the `ObjectQL` constructor under the `driver` property (or `datasources` map for multi-db setup).

```typescript
import { ObjectQL } from '@objectql/core';
import { KnexDriver } from '@objectql/driver-sql';

const myDriver = new KnexDriver({ /* options */ });

const app = new ObjectQL({
  driver: myDriver
});
```

See the specific pages for configuration options for each driver.
