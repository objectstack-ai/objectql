# Memory Driver Migration Guide (v4.0.0)

## Overview

The Memory driver has been migrated to support the standard `DriverInterface` from `@objectstack/spec` while maintaining full backward compatibility with the existing `Driver` interface from `@objectql/types`.

**Version**: 4.0.0 (upgraded from 3.0.1)  
**Completion Date**: January 23, 2026  
**Status**: ✅ Fully compliant with DriverInterface v4.0

## What Changed

### 1. Driver Metadata

The driver now exposes metadata for ObjectStack compatibility:

```typescript
const driver = new MemoryDriver(config);
console.log(driver.name);     // 'MemoryDriver'
console.log(driver.version);  // '4.0.0'
console.log(driver.supports); // { transactions: false, joins: false, ... }
```

### 2. New DriverInterface Methods

#### executeQuery(ast: QueryAST)

The new standard method for query execution using the ObjectStack QueryAST format:

```typescript
import { MemoryDriver } from '@objectql/driver-memory';

const driver = new MemoryDriver();

// Using QueryAST format
const result = await driver.executeQuery({
    object: 'users',
    fields: ['id', 'name', 'email'],
    filters: {
        type: 'comparison',
        field: 'active',
        operator: '=',
        value: true
    },
    sort: [{ field: 'name', order: 'asc' }],
    top: 10,
    skip: 0
});

console.log(result.value);  // Array of user records
console.log(result.count);  // Number of records returned
```

#### executeCommand(command: Command)

Unified interface for all mutation operations:

```typescript
// Create a record
const createResult = await driver.executeCommand({
    type: 'create',
    object: 'users',
    data: { name: 'Alice', email: 'alice@example.com' }
});

// Update a record
const updateResult = await driver.executeCommand({
    type: 'update',
    object: 'users',
    id: 'user-123',
    data: { email: 'alice.new@example.com' }
});

// Delete a record
const deleteResult = await driver.executeCommand({
    type: 'delete',
    object: 'users',
    id: 'user-123'
});

// Bulk create
const bulkCreateResult = await driver.executeCommand({
    type: 'bulkCreate',
    object: 'users',
    records: [
        { name: 'Bob', email: 'bob@example.com' },
        { name: 'Charlie', email: 'charlie@example.com' }
    ]
});

console.log(createResult.success);  // true
console.log(createResult.affected); // 1
console.log(createResult.data);     // Created record
```

### 3. QueryAST Format Support

The driver now supports both legacy and QueryAST formats:

#### Legacy UnifiedQuery Format (Still Supported)
```typescript
const query = {
    fields: ['name', 'age'],
    filters: [['age', '>', 18]],
    sort: [['name', 'asc']],
    limit: 10,
    skip: 0
};

const results = await driver.find('users', query);
```

#### New QueryAST Format (Now Supported)
```typescript
const query = {
    object: 'users',
    fields: ['name', 'age'],
    filters: {
        type: 'comparison',
        field: 'age',
        operator: '>',
        value: 18
    },
    sort: [{ field: 'name', order: 'asc' }],
    top: 10,      // Instead of 'limit'
    skip: 0
};

const result = await driver.executeQuery(query);
// or
const results = await driver.find('users', query);
```

### Key Differences

| Aspect | Legacy Format | QueryAST Format |
|--------|--------------|-----------------|
| Limit | `limit: 10` | `top: 10` |
| Sort | `[['field', 'dir']]` | `[{field, order}]` |
| Filters | Array format | FilterNode AST |

## Migration Strategy

The driver uses a **normalization layer** that automatically converts QueryAST format to the internal format. This means:

- ✅ Existing code continues to work without changes
- ✅ New code can use QueryAST format
- ✅ Both formats work interchangeably
- ✅ No breaking changes
- ✅ 100% backward compatible

## Usage Examples

### Basic CRUD Operations (Unchanged)

```typescript
import { MemoryDriver } from '@objectql/driver-memory';

const driver = new MemoryDriver({
    initialData: {
        users: [
            { id: '1', name: 'Alice', age: 30 },
            { id: '2', name: 'Bob', age: 25 }
        ]
    }
});

// Create
const user = await driver.create('users', {
    name: 'Charlie',
    age: 28
});

// Read
const users = await driver.find('users', {
    filters: [['age', '>=', 25]]
});

// Update
await driver.update('users', '1', { age: 31 });

// Delete
await driver.delete('users', '2');

// Count
const count = await driver.count('users', []);
```

### Using QueryAST Format (New)

```typescript
import { MemoryDriver } from '@objectql/driver-memory';

const driver = new MemoryDriver();

// Query with executeQuery
const result = await driver.executeQuery({
    object: 'users',
    filters: {
        type: 'and',
        children: [
            {
                type: 'comparison',
                field: 'age',
                operator: '>=',
                value: 25
            },
            {
                type: 'comparison',
                field: 'active',
                operator: '=',
                value: true
            }
        ]
    },
    sort: [
        { field: 'name', order: 'asc' }
    ],
    top: 20
});

// Command execution
const result = await driver.executeCommand({
    type: 'bulkUpdate',
    object: 'users',
    updates: [
        { id: '1', data: { status: 'active' } },
        { id: '2', data: { status: 'inactive' } }
    ]
});
```

### Using with ObjectQL Core

```typescript
import { ObjectQL } from '@objectql/core';
import { MemoryDriver } from '@objectql/driver-memory';

const app = new ObjectQL({
    datasources: {
        default: new MemoryDriver({
            initialData: {
                projects: [
                    { id: '1', name: 'Project A', status: 'active' }
                ]
            }
        })
    }
});

await app.init();

// The core will use the driver's new interface internally
const ctx = app.createContext({ userId: 'user123' });
const repo = ctx.object('projects');
const projects = await repo.find({ 
    filters: [['status', '=', 'active']] 
});
```

## Testing

The driver includes comprehensive test coverage:

```bash
cd packages/drivers/memory
npm test
```

Test coverage includes:
- Driver metadata exposure (name, version, supports)
- Lifecycle methods (connect, checkHealth, disconnect)
- Legacy CRUD operations (backward compatibility)
- QueryAST format with `top` parameter
- Object-based sort notation
- FilterNode AST support
- executeQuery method
- executeCommand method with all operation types
- Bulk operations (create, update, delete)
- Error handling and edge cases

**Test Results**: ✅ All tests passing (~75% code coverage)

## Implementation Details

### Files Changed
- `package.json`: Added `@objectstack/spec@^0.2.0` dependency, bumped version to 4.0.0
- `src/index.ts`: 
  - Added DriverInterface implementation
  - Added `executeQuery()` method (~35 lines)
  - Added `executeCommand()` method (~100 lines)
  - Added `convertFilterNodeToLegacy()` helper (~60 lines)
  - Added `execute()` stub for compatibility
  - Added Command and CommandResult interfaces

### Lines of Code
- **Added**: ~200 lines (new methods and interfaces)
- **Modified**: ~15 lines (imports and class declaration)
- **Deleted**: 0 lines

## Driver Capabilities

The Memory driver supports:

- **Transactions**: ❌ No (in-memory, atomic operations only)
- **Joins**: ❌ No (single-table queries)
- **Full-Text Search**: ❌ No (simple string matching via filters)
- **JSON Fields**: ✅ Yes (JavaScript objects)
- **Array Fields**: ✅ Yes (JavaScript arrays)

## Use Cases

The Memory driver is perfect for:

- **Unit Testing**: No database setup required
- **Development & Prototyping**: Quick iteration without database overhead
- **Edge/Worker Environments**: Cloudflare Workers, Deno Deploy
- **Client-Side State Management**: Browser applications
- **Temporary Data Caching**: Short-lived data storage
- **Demo Applications**: Examples and showcases

## Performance Characteristics

- **Zero External Dependencies**: No database connection overhead
- **In-Memory Storage**: Extremely fast read/write operations
- **No I/O Overhead**: All operations are synchronous internally
- **Linear Search**: O(n) for filtering (acceptable for small datasets)
- **No Persistence**: Data is lost when process terminates

**Recommended Dataset Size**: < 10,000 records per object

## Backward Compatibility Guarantee

**100% backward compatible** - all existing code using the Memory driver will continue to work without any changes. The DriverInterface support is additive, not replacing.

### Compatibility Matrix

| Feature | v3.0.1 | v4.0.0 | Notes |
|---------|--------|--------|-------|
| Legacy find() | ✅ | ✅ | Unchanged |
| Legacy create() | ✅ | ✅ | Unchanged |
| Legacy update() | ✅ | ✅ | Unchanged |
| Legacy delete() | ✅ | ✅ | Unchanged |
| executeQuery() | ❌ | ✅ | New in v4.0 |
| executeCommand() | ❌ | ✅ | New in v4.0 |
| QueryAST support | ❌ | ✅ | New in v4.0 |

## Migration from v3.0.1 to v4.0.0

### Option 1: No Changes Required (Recommended)

Simply update your `package.json`:

```json
{
  "dependencies": {
    "@objectql/driver-memory": "^4.0.0"
  }
}
```

All existing code will continue to work.

### Option 2: Adopt New DriverInterface Methods

If you want to use the new features:

```typescript
// Before (v3.0.1)
const users = await driver.find('users', {
    filters: [['active', '=', true]],
    limit: 10
});

// After (v4.0.0) - Using executeQuery
const result = await driver.executeQuery({
    object: 'users',
    filters: {
        type: 'comparison',
        field: 'active',
        operator: '=',
        value: true
    },
    top: 10
});
const users = result.value;
```

## Troubleshooting

### Issue: TypeScript errors about DriverInterface

**Solution**: Ensure you have `@objectstack/spec@^0.2.0` installed:

```bash
npm install @objectstack/spec@^0.2.0
```

### Issue: Tests failing after upgrade

**Solution**: Clear node_modules and reinstall:

```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: Performance degradation with large datasets

**Solution**: Memory driver is optimized for small datasets (<10k records). For larger datasets, use a database-backed driver like driver-sql or driver-mongo.

## Next Steps

With Memory driver v4.0 complete, the migration pattern is established for other drivers:

1. ✅ SQL Driver (completed - v4.0.0)
2. ✅ Memory Driver (completed - v4.0.0)
3. ✅ MongoDB Driver (completed - v4.0.0)
4. 🔜 Redis Driver
5. 🔜 FS Driver
6. 🔜 LocalStorage Driver
7. 🔜 Excel Driver
8. 🔜 SDK Driver

## References

- [ObjectStack Spec Package](https://www.npmjs.com/package/@objectstack/spec)
- [SQL Driver Migration Guide](../sql/MIGRATION_V4.md)
- [MongoDB Driver Migration Guide](../mongo/MIGRATION.md)
- [Driver Interface Documentation](../../foundation/types/src/driver.ts)
- [DriverInterface Specification](../../objectstack/spec/src/index.ts)

## Support

For questions or issues:

- GitHub Issues: https://github.com/objectstack-ai/objectql/issues
- Documentation: https://objectql.org/docs
- Community: https://objectql.org/community

---

**Last Updated**: January 23, 2026  
**Driver Version**: 4.0.0  
**Specification**: @objectstack/spec@0.2.0
