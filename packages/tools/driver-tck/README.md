# ObjectQL Driver TCK (Technology Compatibility Kit)

A comprehensive test suite to ensure all ObjectQL drivers implement consistent behavior.

## Purpose

The Driver TCK provides a standardized set of tests that all ObjectQL drivers must pass. This ensures:

- **Consistency**: All drivers behave the same way for core operations
- **Compatibility**: Applications can switch drivers without code changes
- **Quality**: Drivers are thoroughly tested against a known specification

## Usage

### With Jest

```typescript
import { runDriverTCK } from '@objectql/driver-tck';
import { MyDriver } from './my-driver';

describe('MyDriver TCK', () => {
  runDriverTCK(() => new MyDriver({
    // driver config
  }), {
    skip: {
      // Skip tests for unsupported features
      aggregations: true,
      transactions: true
    },
    timeout: 30000
  });
});
```

### With Vitest

```typescript
import { describe } from 'vitest';
import { runDriverTCK } from '@objectql/driver-tck';
import { MyDriver } from './my-driver';

describe('MyDriver TCK', () => {
  runDriverTCK(() => new MyDriver(), {
    timeout: 30000
  });
});
```

## Test Categories

### 1. Core CRUD Operations
- Create records
- Read records (findOne)
- Update records
- Delete records
- Custom IDs
- Timestamps

### 2. Query Operations
- Find all records
- Filter by equality, comparison operators
- Boolean filters
- Sorting (ascending/descending)
- Pagination (limit/offset)
- Combined filters + sort + pagination
- Count with and without filters

### 3. Distinct Operations *(optional)*
- Get distinct values for a field
- Distinct with filters

### 4. Aggregation Operations *(optional)*
- Group by with count
- Average, min, max
- Complex aggregation pipelines

### 5. Bulk Operations *(optional)*
- Bulk create
- Bulk update
- Bulk delete

### 6. Edge Cases
- Empty queries
- Null/undefined values
- Special characters
- Type conversions

## Configuration

### Skip Options

Use the `skip` configuration to disable tests for features your driver doesn't support:

```typescript
{
  skip: {
    transactions: true,      // Skip transaction tests
    joins: true,            // Skip join tests
    fullTextSearch: true,   // Skip full-text search tests
    aggregations: true,     // Skip aggregation tests
    distinct: true,         // Skip distinct tests
    bulkOperations: true    // Skip bulk operation tests
  }
}
```

### Timeout

Set custom timeout for long-running operations:

```typescript
{
  timeout: 60000 // 60 seconds
}
```

### Hooks

Provide custom setup/teardown logic:

```typescript
{
  hooks: {
    beforeAll: async () => {
      // Setup database connection
    },
    afterAll: async () => {
      // Cleanup
    },
    beforeEach: async () => {
      // Clear test data
    },
    afterEach: async () => {
      // Post-test cleanup
    }
  }
}
```

## Driver Requirements

To pass the TCK, your driver must implement:

### Required Methods

- `create(objectName, data)` - Create a record
- `findOne(objectName, id)` - Find by ID
- `find(objectName, query)` - Query records
- `update(objectName, id, data)` - Update a record
- `delete(objectName, id)` - Delete a record
- `count(objectName, filters)` - Count records

### Optional Methods

- `distinct(objectName, field, filters)` - Get distinct values
- `aggregate(objectName, pipeline)` - Aggregation pipeline
- `executeCommand(command)` - Bulk operations
- `connect()` - Initialize connection
- `disconnect()` - Close connection
- `clear()` - Clear all data (for testing)

### Expected Behavior

1. **Auto-generated IDs**: If no ID is provided, generate a unique one
2. **Timestamps**: Automatically add `created_at` and `updated_at`
3. **Null Safety**: Return `null` for non-existent records
4. **QueryAST Support**: Support the standard query format

## License

MIT
