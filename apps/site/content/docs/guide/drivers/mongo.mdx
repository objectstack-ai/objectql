# MongoDB Driver

The MongoDB driver allows ObjectQL to store data in a MongoDB database (version 4.0+). It takes advantage of MongoDB's document model to store JSON fields natively and flexible schemas.

## Installation

```bash
npm install @objectql/driver-mongo mongodb
```

## Configuration

The `MongoDriver` accepts connection parameters directly.

```typescript
import { MongoDriver } from '@objectql/driver-mongo';

const driver = new MongoDriver({
  url: 'mongodb://localhost:27017', // Connection string
  dbName: 'my_app_db',              // Database name
  options: {
    // Optional MongoDB client options
    maxPoolSize: 10
  }
});
```

## Unified ID Field

ObjectQL provides a **unified `id` field** across all database drivers for a consistent API experience.

### How It Works

- **API Level**: You always use `id` in your application code (queries, filters, documents)
- **Database Level**: MongoDB internally uses `_id` as required by MongoDB conventions
- **Automatic Mapping**: The driver transparently converts between `id` and `_id`

### Examples

**Querying by ID:**
```typescript
// ✅ Use 'id' in queries - works consistently across all drivers
const query = {
  filters: [['id', '=', '507f1f77bcf86cd799439011']]
};
const users = await app.find('users', query);
```

**Creating Documents:**
```typescript
// ✅ Use 'id' when creating - the driver maps it to '_id' internally
const newUser = await app.create('users', {
  id: '507f1f77bcf86cd799439011',  // Optional: specify custom ID
  name: 'Alice',
  email: 'alice@example.com'
});

// Result returned with 'id' field (not '_id')
console.log(newUser.id); // '507f1f77bcf86cd799439011'
```

**Finding by ID:**
```typescript
// ✅ Use 'id' parameter
const user = await app.findOne('users', '507f1f77bcf86cd799439011');
console.log(user.id); // Always 'id', never '_id'
```

**Sorting by ID:**
```typescript
const query = {
  sort: [['id', 'desc']]  // ✅ Use 'id' for sorting
};
const users = await app.find('users', query);
```

**Field Projection:**
```typescript
const query = {
  fields: ['id', 'name', 'email']  // ✅ Use 'id' to select the ID field
};
const users = await app.find('users', query);
// Results contain 'id', not '_id'
```

### Migration from Legacy Code

If you have existing code using `_id`, you have two options:

1. **Recommended: Migrate to `id`** for consistency across drivers:

**Before (Legacy):**
```typescript
// ❌ Old way - inconsistent with SQL drivers
const query = {
  filters: [['_id', '=', '507f1f77bcf86cd799439011']],
  sort: [['_id', 'desc']],
  fields: ['_id', 'name']
};
```

**After (Recommended):**
```typescript
// ✅ New way - consistent across all drivers
const query = {
  filters: [['id', '=', '507f1f77bcf86cd799439011']],
  sort: [['id', 'desc']],
  fields: ['id', 'name']
};
```

2. **Backward Compatible Mode:** Continue using `_id` in queries (results still return `id`)

The MongoDB driver **fully supports `_id` in filters, sorting, and field projections** for backward compatibility:

```typescript
// ✅ This works - backward compatible
const query = {
  filters: [['_id', '=', '507f1f77bcf86cd799439011']],
  sort: [['_id', 'desc']],
  fields: ['_id', 'name']
};
const users = await app.find('users', query);

// Results ALWAYS use 'id' regardless of query field name
console.log(users[0].id); // '507f1f77bcf86cd799439011'
console.log(users[0]._id); // undefined
```

**Key Points:**
- Queries accept both `id` and `_id` (automatically mapped to MongoDB's `_id`)
- Results always return `id` field (never `_id`)
- Using `id` is recommended for database portability

## ID Generation

When creating documents without specifying an `id`, the driver automatically generates a string ID:

```typescript
const newUser = await app.create('users', {
  name: 'Bob',
  // No id specified
});

// Driver generates a unique string ID (not ObjectId)
console.log(newUser.id); // e.g., '507f1f77bcf86cd799439011'
```

The generated IDs are hexadecimal strings (24 characters) that maintain MongoDB's uniqueness guarantees without using ObjectId objects.

## Limitations

*   **Joins**: While MongoDB supports `$lookup` (which this driver uses for joins), complex relationships across many collections can be slower than SQL.
*   **Transactions**: Transactions are supported but require a MongoDB Replica Set deployment.
