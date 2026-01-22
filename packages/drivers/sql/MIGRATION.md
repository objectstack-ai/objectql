# SQL Driver Migration Guide (Phase 4)

## Overview

The SQL driver has been migrated to support the standard `DriverInterface` from `@objectstack/spec` while maintaining full backward compatibility with the existing `Driver` interface from `@objectql/types`.

## What Changed

### 1. Driver Metadata

The driver now exposes metadata for ObjectStack compatibility:

```typescript
const driver = new SqlDriver(config);
console.log(driver.name);     // 'SqlDriver'
console.log(driver.version);  // '3.0.1'
console.log(driver.supports); // { transactions: true, joins: true, ... }
```

### 2. Lifecycle Methods

New optional lifecycle methods for DriverInterface compatibility:

```typescript
// Connect (no-op, connection established in constructor)
await driver.connect();

// Check connection health
const healthy = await driver.checkHealth(); // true/false

// Disconnect (existing method)
await driver.disconnect();
```

### 3. QueryAST Format Support

The driver now supports the new QueryAST format from `@objectstack/spec`:

#### Legacy UnifiedQuery Format (Still Supported)
```typescript
const query = {
    fields: ['name', 'age'],
    filters: [['age', '>', 18]],
    sort: [['name', 'asc']],
    limit: 10,
    skip: 0,
    aggregate: [{ func: 'sum', field: 'price', alias: 'total' }]
};
```

#### New QueryAST Format (Now Supported)
```typescript
const query = {
    object: 'users',
    fields: ['name', 'age'],
    filters: [['age', '>', 18]],
    sort: [{ field: 'name', order: 'asc' }],
    top: 10,      // Instead of 'limit'
    skip: 0,
    aggregations: [{ function: 'sum', field: 'price', alias: 'total' }]
};
```

### Key Differences

| Aspect | Legacy Format | QueryAST Format |
|--------|--------------|-----------------|
| Limit | `limit: 10` | `top: 10` |
| Sort | `[['field', 'dir']]` | `[{field, order}]` |
| Aggregations | `aggregate: [{func, field, alias}]` | `aggregations: [{function, field, alias}]` |

## Migration Strategy

The driver uses a **normalization layer** that automatically converts QueryAST format to the internal format:

```typescript
private normalizeQuery(query: any): any {
    // Converts 'top' → 'limit'
    // Converts 'aggregations' → 'aggregate'
    // Handles both sort formats
}
```

This means:
- ✅ Existing code continues to work without changes
- ✅ New code can use QueryAST format
- ✅ Both formats work interchangeably
- ✅ No breaking changes

## Usage Examples

### Using Legacy Format (Unchanged)
```typescript
import { SqlDriver } from '@objectql/driver-sql';

const driver = new SqlDriver({
    client: 'postgresql',
    connection: { /* ... */ }
});

// Works as before
const results = await driver.find('users', {
    filters: [['active', '=', true]],
    sort: [['created_at', 'desc']],
    limit: 20
});
```

### Using QueryAST Format (New)
```typescript
import { SqlDriver } from '@objectql/driver-sql';

const driver = new SqlDriver({
    client: 'postgresql',
    connection: { /* ... */ }
});

// New format
const results = await driver.find('users', {
    filters: [['active', '=', true]],
    sort: [{ field: 'created_at', order: 'desc' }],
    top: 20
});
```

### Using with ObjectStack Kernel
```typescript
import { ObjectQL } from '@objectql/core';
import { SqlDriver } from '@objectql/driver-sql';

const app = new ObjectQL({
    datasources: {
        default: new SqlDriver({ /* config */ })
    }
});

await app.init();

// The kernel will use QueryAST format internally
const ctx = app.createContext({ userId: 'user123' });
const repo = ctx.object('users');
const users = await repo.find({ filters: [['active', '=', true]] });
```

## Testing

Comprehensive tests have been added in `test/queryast.test.ts`:

```bash
npm test -- queryast.test.ts
```

Test coverage includes:
- Driver metadata exposure
- Lifecycle methods (connect, checkHealth, disconnect)
- QueryAST format with `top` parameter
- Object-based sort notation
- Aggregations with QueryAST format
- Backward compatibility with legacy format
- Mixed format support

## Implementation Details

### Files Changed
- `package.json`: Added `@objectstack/spec@^0.2.0` dependency
- `src/index.ts`: 
  - Added driver metadata properties
  - Added `normalizeQuery()` method (~40 lines)
  - Added `connect()` and `checkHealth()` methods (~20 lines)
  - Updated `find()`, `count()`, `aggregate()` to use normalization
- `test/queryast.test.ts`: New comprehensive test suite (200+ lines)

### Lines of Code
- **Added**: ~260 lines (including tests and docs)
- **Modified**: ~10 lines (method signatures)
- **Deleted**: 0 lines

## Next Steps

This migration establishes the pattern for migrating other drivers:

1. ✅ SQL Driver (completed)
2. 🔜 Memory Driver (recommended next - used for testing)
3. 🔜 MongoDB Driver (NoSQL representative)
4. 🔜 Other drivers (bulk migration)

## Backward Compatibility Guarantee

**100% backward compatible** - all existing code using the SQL driver will continue to work without any changes. The QueryAST support is additive, not replacing.

## References

- [ObjectStack Spec Package](https://www.npmjs.com/package/@objectstack/spec)
- [Runtime Integration Docs](../../foundation/core/RUNTIME_INTEGRATION.md)
- [Driver Interface Documentation](../../foundation/types/src/driver.ts)
