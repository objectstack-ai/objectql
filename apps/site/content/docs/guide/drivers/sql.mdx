# SQL Driver (Knex)

The SQL driver implementation is based on [Knex.js](https://knexjs.org/), a powerful SQL query builder. It supports all major SQL databases including PostgreSQL, MySQL, SQLite3, and SQL Server.

## Installation

```bash
npm install @objectql/driver-sql knex pg
# Replace 'pg' with 'mysql', 'sqlite3', or 'mssql' depending on your database.
```

## Configuration

The `SqlDriver` constructor accepts the standard [Knex configuration object](https://knexjs.org/guide/#configuration-options).

```typescript
import { SqlDriver } from '@objectql/driver-sql';

const driver = new SqlDriver({
  client: 'pg', // 'mysql', 'sqlite3', etc.
  connection: {
    host: '127.0.0.1',
    port: 5432,
    user: 'your_user',
    password: 'your_password',
    database: 'your_app_db'
  },
  // Optional: Connection pool settings
  pool: { min: 2, max: 10 }
});
```

### SQLite Example

For local development or testing with SQLite:

```typescript
const driver = new SqlDriver({
  client: 'sqlite3',
  connection: {
    filename: './local.db'
  },
  useNullAsDefault: true // Required for SQLite support
});
```

## Unified ID Field

ObjectQL uses **`id`** as the primary key field name across all SQL databases for consistency with the MongoDB driver.

### How It Works

- **Database Column**: SQL tables use `id` as the primary key column (VARCHAR/TEXT type)
- **API Level**: You use `id` in your queries, filters, and documents
- **Consistency**: Same API as MongoDB driver - no need to remember `_id` vs `id`

### Examples

**Table Schema:**
```sql
CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY,  -- Primary key is 'id'
  name VARCHAR(255),
  email VARCHAR(255),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Creating Documents:**
```typescript
// Create with auto-generated ID
const user = await app.create('users', {
  name: 'Alice',
  email: 'alice@example.com'
});
console.log(user.id); // Auto-generated UUID or custom ID

// Create with custom ID
const user = await app.create('users', {
  id: 'custom-user-123',
  name: 'Bob'
});
```

**Querying by ID:**
```typescript
const query = {
  filters: [['id', '=', 'custom-user-123']]
};
const users = await app.find('users', query);
```

**Finding by ID:**
```typescript
const user = await app.findOne('users', 'custom-user-123');
```

### Legacy `_id` Support

For backward compatibility, if you provide `_id` in a create operation, the driver will automatically map it to `id`:

```typescript
// Legacy code - automatically mapped
const user = await app.create('users', {
  _id: 'user-123',  // Mapped to 'id' internally
  name: 'Charlie'
});

console.log(user.id); // 'user-123'
```

This ensures smooth migration for projects that previously used MongoDB-style `_id` fields.

## Schema Mapping

The driver automatically maps ObjectQL types to SQL column types:

| ObjectQL Type | SQL Type | Notes |
| :--- | :--- | :--- |
| `text` | `VARCHAR(255)` | |
| `textarea` | `TEXT` | |
| `boolean` | `BOOLEAN` | or `TINYINT` in MySQL |
| `number` | `FLOAT` / `DECIMAL` | |
| `date` | `DATE` | |
| `datetime` | `TIMESTAMP` | |
| `json` | `JSON` | or `TEXT` if not supported |
