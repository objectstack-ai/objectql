# Building a Custom Driver for ObjectStack

This example demonstrates how to build a custom database driver for ObjectStack. It shows how to implement the `Driver` interface to connect ObjectStack to any data source.

## Overview

**Drivers** are the bridge between the ObjectQL engine and underlying data storage (SQL, NoSQL, APIs, files, etc.). By implementing the `Driver` interface, you can connect ObjectStack to any data source.

This example implements a simple **In-Memory Driver** that stores data in JavaScript Maps—perfect for:

- 🧪 **Testing** (no database setup required)
- 🚀 **Prototyping** (quick start without infrastructure)
- ⚡ **Edge Environments** (Cloudflare Workers, Deno Deploy)
- 📚 **Learning** (understand driver architecture)

## Quick Start

```bash
# Install dependencies
pnpm install

# Run the demo
pnpm start
```

## Prerequisites

- Existing ObjectStack workspace or plugin package
- Dependencies:
  - `@objectql/core` - ObjectQL runtime engine
  - `@objectql/types` - Type definitions
  - `@objectstack/objectql` - ObjectStack runtime
  - `@objectstack/spec` - Protocol specifications

## Architecture

```
┌─────────────────────────────────────┐
│   ObjectQL Engine (Core)            │
│                                     │
│  ┌──────────────────────────────┐  │
│  │  Repository Pattern          │  │
│  │  (CRUD Operations)           │  │
│  └──────────┬───────────────────┘  │
│             │                       │
│             ▼                       │
│  ┌──────────────────────────────┐  │
│  │  Driver Interface            │  │ ← Your Custom Driver
│  │  (Abstract Data Layer)       │  │
│  └──────────┬───────────────────┘  │
└─────────────┼───────────────────────┘
              │
              ▼
   ┌──────────────────────────┐
   │  Data Storage            │
   │  • SQL Database          │
   │  • NoSQL (MongoDB)       │
   │  • File System           │
   │  • In-Memory (This!)     │
   │  • HTTP API              │
   └──────────────────────────┘
```

## 1. Driver Interface

All drivers must implement the `Driver` interface from `@objectql/types`:

```typescript
import { Driver } from '@objectql/types';

export class MyCustomDriver implements Driver {
    name = 'MyCustomDriver';
    
    // Connection lifecycle
    async connect() {
        // Initialize connection
    }
    
    async disconnect() {
        // Close connection
    }
    
    // Required CRUD methods
    async find(objectName: string, query: any, options?: any): Promise<any[]> { }
    async findOne(objectName: string, id: string | number, query?: any, options?: any): Promise<any> { }
    async create(objectName: string, data: any, options?: any): Promise<any> { }
    async update(objectName: string, id: string | number, data: any, options?: any): Promise<any> { }
    async delete(objectName: string, id: string | number, options?: any): Promise<any> { }
    async count(objectName: string, filters: any, options?: any): Promise<number> { }
    
    // Optional methods
    async distinct?(objectName: string, field: string, filters?: any, options?: any): Promise<any[]> { }
    async createMany?(objectName: string, data: any[], options?: any): Promise<any> { }
    async updateMany?(objectName: string, filters: any, data: any, options?: any): Promise<any> { }
    async deleteMany?(objectName: string, filters: any, options?: any): Promise<any> { }
}
```

## 2. Implementing CRUD Operations

### Find (Query)

The `find` method receives a query object with filters, sorting, and pagination:

```typescript
async find(objectName: string, query: any = {}, options?: any): Promise<any[]> {
    // 1. Get data for the object
    // 2. Apply filters (where conditions)
    // 3. Apply sorting
    // 4. Apply pagination (skip/limit)
    // 5. Apply field projection
    return results;
}
```

**Query Structure:**

```typescript
{
    filters: [['field', 'operator', value], 'and', ['field2', 'operator', value2]],
    sort: [['field', 'asc'], ['field2', 'desc']],
    skip: 0,
    limit: 10,
    fields: ['id', 'name', 'status']
}
```

### Create (Insert)

```typescript
async create(objectName: string, data: any, options?: any): Promise<any> {
    // 1. Generate ID if not provided
    const id = data.id || this.generateId(objectName);
    
    // 2. Add timestamps
    const record = {
        ...data,
        id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
    
    // 3. Store the record
    // 4. Return the created record
    return record;
}
```

### Update

```typescript
async update(objectName: string, id: string | number, data: any, options?: any): Promise<any> {
    // 1. Find existing record
    // 2. Merge changes (preserve id and created_at)
    // 3. Update updated_at timestamp
    // 4. Save and return updated record
}
```

### Delete

```typescript
async delete(objectName: string, id: string | number, options?: any): Promise<any> {
    // 1. Remove record by ID
    // 2. Return success/failure
}
```

## 3. Filter Support

ObjectQL uses a unified filter format:

```typescript
// Simple condition
[['status', '=', 'active']]

// Multiple conditions with AND
[['status', '=', 'active'], 'and', ['priority', '=', 'high']]

// Multiple conditions with OR
[['status', '=', 'active'], 'or', ['status', '=', 'planning']]

// Comparison operators
[['budget', '>', 50000]]
[['budget', '<=', 100000]]

// String operators
[['name', 'contains', 'project']]
[['name', 'startswith', 'Web']]

// Array operators
[['status', 'in', ['active', 'planning']]]
```

**Supported Operators:**

- `=`, `!=` - Equality
- `>`, `>=`, `<`, `<=` - Comparison
- `in`, `not in` - Array membership
- `contains`, `like` - String search
- `startswith`, `endswith` - String prefix/suffix

## 4. Type Handling

Use types from `@objectql/types`:

```typescript
import { 
    Driver,           // Main driver interface
    UnifiedQuery,     // Query structure
    ObjectQLError     // Standardized errors
} from '@objectql/types';
```

## 5. Error Handling

Always use `ObjectQLError` for consistency:

```typescript
import { ObjectQLError } from '@objectql/types';

throw new ObjectQLError({
    code: 'NOT_FOUND',
    message: `Record with id '${id}' not found`,
    details: { objectName, id }
});
```

**Standard Error Codes:**

- `INVALID_REQUEST` - Invalid parameters
- `NOT_FOUND` - Record not found
- `CONFLICT` - Duplicate record
- `VALIDATION_ERROR` - Data validation failed
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Permission denied
- `INTERNAL_ERROR` - Internal error

## 6. Registering the Driver

### Method 1: Direct Usage

```typescript
import { ObjectQL } from '@objectql/core';
import { InMemoryDriver } from './memory-driver';

const driver = new InMemoryDriver();

const app = new ObjectQL({
    datasources: {
        default: driver
    }
});
```

### Method 2: As a Plugin

```typescript
// index.ts
import { InMemoryDriver } from './memory-driver';

export default {
    name: 'plugin-driver-memory',
    version: '1.0.0',
    drivers: [new InMemoryDriver()]
};
```

```typescript
// app.ts
import { ObjectQL } from '@objectql/core';
import MyDriverPlugin from './my-driver';

const app = new ObjectQL({
    plugins: [MyDriverPlugin]
});
```

## 7. Example: In-Memory Driver

See the implementation in `src/memory-driver.ts`:

**Features:**

✅ Full CRUD operations  
✅ Query filters, sorting, pagination  
✅ Field projection  
✅ Aggregate operations (count, distinct)  
✅ Timestamps (created_at, updated_at)  
✅ ID generation  
✅ Error handling with ObjectQLError  

**Storage Format:**

```typescript
Map<objectName, Map<id, record>>

Example:
{
  "projects": {
    "proj-1": { id: "proj-1", name: "Website", status: "active" },
    "proj-2": { id: "proj-2", name: "Mobile App", status: "planning" }
  }
}
```

## 8. Running the Demo

```bash
# Run the demo
pnpm start

# Expected output:
🚀 Custom Driver Demo: In-Memory Storage
📦 Step 1: Initialize Custom Driver
✅ InMemoryDriver created with initial data
📦 Step 2: Initialize ObjectQL
✅ ObjectQL initialized with custom driver
📝 Step 3: Create Records
✅ Created 4 projects
🔍 Step 4: Query Examples
📊 Total projects: 4
🔥 High priority projects: 2
   - Website Redesign
   - Mobile App
...
```

## 9. Advanced Topics

### Transactions (Optional)

```typescript
async beginTransaction?(): Promise<any>;
async commitTransaction?(trx: any): Promise<void>;
async rollbackTransaction?(trx: any): Promise<void>;
```

### Schema Introspection (Optional)

```typescript
async introspectSchema?(): Promise<IntrospectedSchema>;
```

Allows connecting to existing databases without defining metadata.

### Bulk Operations (Optional)

```typescript
async createMany?(objectName: string, data: any[], options?: any): Promise<any>;
async updateMany?(objectName: string, filters: any, data: any, options?: any): Promise<any>;
async deleteMany?(objectName: string, filters: any, options?: any): Promise<any>;
```

## 10. Testing Your Driver

```typescript
import { InMemoryDriver } from './memory-driver';

async function testDriver() {
    const driver = new InMemoryDriver();
    
    // Test create
    const record = await driver.create('users', { name: 'Alice', role: 'admin' });
    console.assert(record.id !== undefined, 'ID should be generated');
    
    // Test find
    const results = await driver.find('users', {});
    console.assert(results.length === 1, 'Should have 1 record');
    
    // Test update
    await driver.update('users', record.id, { role: 'superadmin' });
    const updated = await driver.findOne('users', record.id);
    console.assert(updated.role === 'superadmin', 'Role should be updated');
    
    // Test delete
    await driver.delete('users', record.id);
    const remaining = await driver.find('users', {});
    console.assert(remaining.length === 0, 'Should have 0 records');
    
    console.log('✅ All tests passed!');
}
```

## 11. Best Practices

1. **Use TypeScript** - Type safety prevents runtime errors
2. **Handle Errors Gracefully** - Use `ObjectQLError` for consistency
3. **Add Timestamps** - Auto-add `created_at` and `updated_at`
4. **Generate IDs** - If not provided by the data source
5. **Support Pagination** - Always respect `skip` and `limit`
6. **Test Thoroughly** - Test all CRUD operations and edge cases
7. **Document Your Driver** - Explain configuration options and limitations

## 12. Next Steps

- **Add Transaction Support** - Implement atomic operations
- **Add Caching** - Cache frequently accessed data
- **Add Schema Validation** - Validate data before storage
- **Add Connection Pooling** - For database drivers
- **Add Performance Monitoring** - Track query execution times

## 13. Resources

- [Driver Interface Documentation](../../packages/foundation/types/src/driver.ts)
- [ObjectQL Core](../../packages/foundation/core)
- [Existing Drivers](../../packages/drivers)
  - [FileSystem Driver](../../packages/drivers/fs)
  - [SQL Driver](../../packages/drivers/sql)
  - [MongoDB Driver](../../packages/drivers/mongo)

## License

MIT © ObjectStack Inc.
