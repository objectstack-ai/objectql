# @objectql/driver-fs

File System Driver for ObjectQL - JSON file-based persistent storage with one file per table.

> **中文文档**: [README.zh-CN.md](./README.zh-CN.md)

## Features

✅ **Persistent Storage** - Data survives process restarts  
✅ **One File Per Table** - Each object type stored in a separate JSON file (e.g., `users.json`, `projects.json`)  
✅ **Human-Readable** - Pretty-printed JSON for easy inspection and debugging  
✅ **Atomic Writes** - Temp file + rename strategy prevents corruption  
✅ **Backup Support** - Automatic backup files (`.bak`) on write  
✅ **Full Query Support** - Filters, sorting, pagination, field projection  
✅ **Zero Database Setup** - No external dependencies or database installation required

## Installation

```bash
npm install @objectql/driver-fs
```

## Quick Start

```typescript
import { ObjectQL } from '@objectql/core';
import { FileSystemDriver } from '@objectql/driver-fs';

// 1. Initialize Driver
const driver = new FileSystemDriver({
    dataDir: './data' // Directory where JSON files will be stored
});

// 2. Initialize ObjectQL
const app = new ObjectQL({
    datasources: {
        default: driver
    }
});

// 3. Define Objects
app.registerObject({
    name: 'users',
    fields: {
        name: { type: 'text', required: true },
        email: { type: 'email' },
        age: { type: 'number' }
    }
});

await app.init();

// 4. Use the API
const ctx = app.createContext({ isSystem: true });
const users = ctx.object('users');

// Create
await users.create({ name: 'Alice', email: 'alice@example.com', age: 30 });

// Find
const allUsers = await users.find({});
console.log(allUsers);

// Query with filters
const youngUsers = await users.find({
    filters: [['age', '<', 25]]
});
```

## Configuration

```typescript
interface FileSystemDriverConfig {
    /** Directory path where JSON files will be stored */
    dataDir: string;
    
    /** Enable pretty-print JSON for readability (default: true) */
    prettyPrint?: boolean;
    
    /** Enable backup files on write (default: true) */
    enableBackup?: boolean;
    
    /** Enable strict mode (throw on missing objects) (default: false) */
    strictMode?: boolean;
    
    /** Initial data to populate the store (optional) */
    initialData?: Record<string, any[]>;
}
```

### Example with Options

```typescript
const driver = new FileSystemDriver({
    dataDir: './data',
    prettyPrint: true,      // Human-readable JSON
    enableBackup: true,     // Create .bak files
    strictMode: false,      // Graceful handling of missing records
    initialData: {          // Pre-populate with initial data
        users: [
            { id: 'admin', name: 'Admin User', role: 'admin' }
        ]
    }
});
```

## File Storage Format

Each object type is stored in a separate JSON file:

```
./data/
  ├── users.json
  ├── users.json.bak      (backup)
  ├── projects.json
  ├── projects.json.bak
  └── tasks.json
```

### File Content Example (`users.json`)

```json
[
  {
    "id": "users-1234567890-1",
    "name": "Alice",
    "email": "alice@example.com",
    "age": 30,
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z"
  },
  {
    "id": "users-1234567891-2",
    "name": "Bob",
    "email": "bob@example.com",
    "age": 25,
    "created_at": "2024-01-15T11:00:00.000Z",
    "updated_at": "2024-01-15T11:00:00.000Z"
  }
]
```

## API Examples

### CRUD Operations

```typescript
const ctx = app.createContext({ isSystem: true });
const products = ctx.object('products');

// Create
const product = await products.create({
    name: 'Laptop',
    price: 1000,
    category: 'electronics'
});

// Find One by ID
const found = await products.findOne(product.id);

// Update
await products.update(product.id, { price: 950 });

// Delete
await products.delete(product.id);
```

### Querying

```typescript
// Filter
const electronics = await products.find({
    filters: [['category', '=', 'electronics']]
});

// Multiple filters with OR
const results = await products.find({
    filters: [
        ['price', '<', 500],
        'or',
        ['category', '=', 'sale']
    ]
});

// Sorting
const sorted = await products.find({
    sort: [['price', 'desc']]
});

// Pagination
const page1 = await products.find({
    limit: 10,
    skip: 0
});

// Field Projection
const names = await products.find({
    fields: ['name', 'price']
});
```

### Bulk Operations

```typescript
// Create Many
await products.createMany([
    { name: 'Item 1', price: 10 },
    { name: 'Item 2', price: 20 },
    { name: 'Item 3', price: 30 }
]);

// Update Many
await products.updateMany(
    [['category', '=', 'electronics']], // filters
    { onSale: true }                    // update data
);

// Delete Many
await products.deleteMany([
    ['price', '<', 10]
]);

// Count
const count = await products.count({
    filters: [['category', '=', 'electronics']]
});

// Distinct Values
const categories = await products.distinct('category');
```

## Supported Query Operators

- **Equality**: `=`, `==`, `!=`, `<>`
- **Comparison**: `>`, `>=`, `<`, `<=`
- **Membership**: `in`, `nin` (not in)
- **String Matching**: `like`, `contains`, `startswith`, `endswith`
- **Range**: `between`

## Use Cases

### ✅ Ideal For

- **Small to Medium Datasets** (< 10k records per object)
- **Development and Prototyping** with persistent data
- **Configuration Storage** (settings, metadata)
- **Embedded Applications** (Electron, Tauri)
- **Scenarios without Database** (no DB setup required)
- **Human-Inspectable Data** (easy to debug and modify)

### ❌ Not Recommended For

- **Large Datasets** (> 10k records per object)
- **High-Concurrency Writes** (multiple processes writing simultaneously)
- **Production High-Traffic Apps** (use SQL/MongoDB drivers instead)
- **Complex Transactions** (use SQL driver with transaction support)

## Performance Characteristics

- **Read Performance**: O(n) for filtered queries, fast for simple lookups
- **Write Performance**: O(n) - entire file is rewritten on each update
- **Storage Format**: Human-readable JSON (larger than binary formats)
- **Concurrency**: Single-process safe, multi-process requires external locking

## Data Safety

### Atomic Writes

The driver uses a temp file + rename strategy to prevent corruption:

1. Write new data to `{file}.tmp`
2. Rename `{file}.tmp` → `{file}` (atomic operation)
3. If the process crashes during write, the original file remains intact

### Backup Files

When `enableBackup: true`, the driver creates `.bak` files:

```
users.json      ← Current data
users.json.bak  ← Previous version
```

To restore from backup:

```bash
cp data/users.json.bak data/users.json
```

## Advanced Usage

### Custom ID Generation

```typescript
// Use your own ID
await products.create({
    id: 'PROD-001',
    name: 'Custom Product'
});

// Or use _id (MongoDB-style)
await products.create({
    _id: '507f1f77bcf86cd799439011',
    name: 'Mongo-Style Product'
});
```

### Loading Initial Data

**Method 1: Provide in configuration**

```typescript
const driver = new FileSystemDriver({
    dataDir: './data',
    initialData: {
        users: [
            { id: 'admin-001', name: 'Admin User', role: 'admin' }
        ],
        settings: [
            { key: 'theme', value: 'dark' }
        ]
    }
});
```

**Method 2: Pre-create JSON files**

You can pre-populate JSON files:

```json
// ./data/users.json
[
  {
    "id": "admin-001",
    "name": "Admin User",
    "email": "admin@example.com",
    "role": "admin",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
]
```

The driver will load this data on startup.

### Multiple Data Directories

```typescript
// Development
const devDriver = new FileSystemDriver({
    dataDir: './data/dev'
});

// Testing
const testDriver = new FileSystemDriver({
    dataDir: './data/test'
});
```

### Utility Methods

```typescript
// Clear all data for a specific object
await driver.clear('users');

// Clear all data for all objects
await driver.clearAll();

// Invalidate cache for an object
driver.invalidateCache('users');

// Get cache size
const size = driver.getCacheSize();
```

## Comparison with Other Drivers

| Feature | FileSystem | Memory | SQL | MongoDB |
|---------|-----------|--------|-----|---------|
| Persistence | ✅ Yes | ❌ No | ✅ Yes | ✅ Yes |
| Setup Required | ❌ No | ❌ No | ✅ Yes | ✅ Yes |
| Human-Readable | ✅ Yes | ❌ No | ❌ No | ⚠️ Partial |
| Performance (Large Data) | ⚠️ Slow | ✅ Fast | ✅ Fast | ✅ Fast |
| Transactions | ❌ No | ❌ No | ✅ Yes | ✅ Yes |
| Best For | Dev/Config | Testing | Production | Production |

## Troubleshooting

### File Corruption

If a JSON file becomes corrupted, restore from backup:

```bash
cp data/users.json.bak data/users.json
```

### Permission Issues

Ensure the process has read/write permissions:

```bash
chmod 755 ./data
```

### Large Files

If files become too large (> 1MB), consider:

1. Splitting data into multiple object types
2. Using SQL/MongoDB drivers for production
3. Implementing data archiving strategy

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or PR on GitHub.

## Related Packages

- [@objectql/core](https://www.npmjs.com/package/@objectql/core) - Core ObjectQL engine
- [@objectql/driver-sql](https://www.npmjs.com/package/@objectql/driver-sql) - SQL driver (PostgreSQL, MySQL, SQLite)
- [@objectql/driver-mongo](https://www.npmjs.com/package/@objectql/driver-mongo) - MongoDB driver
- [@objectql/driver-memory](https://www.npmjs.com/package/@objectql/driver-memory) - In-memory driver
