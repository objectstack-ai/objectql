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

If you have existing code using `_id`, you should migrate to using `id` for consistency:

**Before (Legacy):**
```typescript
// ❌ Old way - inconsistent with SQL drivers
const query = {
  filters: [['_id', '=', '507f1f77bcf86cd799439011']]
};
```

**After (Recommended):**
```typescript
// ✅ New way - consistent across all drivers
const query = {
  filters: [['id', '=', '507f1f77bcf86cd799439011']]
};
```

**Note:** The MongoDB driver still accepts `_id` in filters for backward compatibility, but using `id` is strongly recommended for new code.

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
