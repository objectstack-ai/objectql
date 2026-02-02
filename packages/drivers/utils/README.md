# @objectql/driver-utils

Shared utilities for ObjectQL drivers to reduce code duplication and standardize driver implementations.

## Overview

This package provides common functionality used across all ObjectQL drivers:

- **QueryAST normalization** - Convert between legacy and modern query formats
- **FilterCondition evaluation** - MongoDB-style query evaluation and conversion
- **Error handling** - Standard error codes and error creation utilities
- **ID generation** - Multiple ID generation strategies (nanoid, UUID, sequential, timestamp)
- **Timestamp management** - Automatic timestamp handling for create/update operations
- **Transaction utilities** - Transaction state management and helpers

## Installation

```bash
pnpm add @objectql/driver-utils
```

## Usage

### QueryAST Normalization

```typescript
import { normalizeQuery, normalizeOrderBy, applySorting, applyPagination } from '@objectql/driver-utils';

// Normalize query from various formats
const normalized = normalizeQuery({
  filters: { role: 'admin' }, // Legacy format
  sort: [['age', 'asc']],
  skip: 10,
  limit: 20
});
// Returns: { where: {...}, orderBy: [...], offset: 10, limit: 20 }

// Apply sorting to records
const sorted = applySorting(records, [
  { field: 'age', order: 'asc' },
  { field: 'name', order: 'desc' }
]);

// Apply pagination
const paginated = applyPagination(records, 10, 20); // offset: 10, limit: 20
```

### FilterCondition Evaluation

```typescript
import { evaluateFilter, filterRecords, isFilterCondition } from '@objectql/driver-utils';

// Evaluate a single record against a condition
const matches = evaluateFilter(record, {
  age: { $gt: 18 },
  role: 'user'
});

// Filter an array of records
const filtered = filterRecords(records, {
  $or: [
    { status: 'active' },
    { priority: { $gte: 5 } }
  ]
});

// Check if value is a FilterCondition
if (isFilterCondition(query.where)) {
  // Handle MongoDB-style query
}
```

### Error Handling

```typescript
import {
  createRecordNotFoundError,
  createDuplicateRecordError,
  createValidationError,
  wrapError,
  DriverError
} from '@objectql/driver-utils';

// Throw standard errors
throw createRecordNotFoundError('users', userId);
throw createDuplicateRecordError('users', userId);

// Wrap native errors
try {
  // ... database operation
} catch (error) {
  throw wrapError(error as Error, {
    operation: 'create',
    objectName: 'users'
  });
}
```

### ID Generation

```typescript
import { IDGenerator, generateNanoId, generateUUID, generateTimestampId } from '@objectql/driver-utils';

// Using ID Generator
const idGen = new IDGenerator();
const id1 = idGen.generateSequential('users'); // "1"
const id2 = idGen.generateSequential('users', 'usr_'); // "usr_2"
const id3 = idGen.generateRandom(16); // Random nanoid

// Direct functions
const nanoId = generateNanoId(16);
const uuid = generateUUID();
const timestampId = generateTimestampId('doc');
```

### Timestamp Utilities

```typescript
import { addCreateTimestamps, addUpdateTimestamps, getCurrentTimestamp } from '@objectql/driver-utils';

// Add timestamps for create
const newRecord = addCreateTimestamps({ name: 'Alice' });
// Returns: { name: 'Alice', created_at: '2026-02-02T...', updated_at: '2026-02-02T...' }

// Add timestamps for update
const updated = addUpdateTimestamps(
  { email: 'new@example.com' },
  existingRecord.created_at
);
// Returns: { email: '...', created_at: '<preserved>', updated_at: '2026-02-02T...' }
```

### Transaction Utilities

```typescript
import {
  createTransaction,
  generateTransactionId,
  isTransactionActive,
  markCommitted,
  TransactionState
} from '@objectql/driver-utils';

// Create transaction
const tx = createTransaction();
console.log(tx.id); // "tx_1234567890_abc123"
console.log(tx.state); // TransactionState.ACTIVE

// Check state
if (isTransactionActive(tx)) {
  // Execute operations
}

// Update state
markCommitted(tx);
console.log(tx.state); // TransactionState.COMMITTED
```

## API Reference

See individual module documentation for detailed API information:

- [query-ast.ts](./src/query-ast.ts) - Query normalization and parsing
- [filter-condition.ts](./src/filter-condition.ts) - Filter evaluation and conversion
- [error-handler.ts](./src/error-handler.ts) - Error handling utilities
- [id-generator.ts](./src/id-generator.ts) - ID generation strategies
- [timestamp-utils.ts](./src/timestamp-utils.ts) - Timestamp management
- [transaction-utils.ts](./src/transaction-utils.ts) - Transaction helpers

## Benefits

Using `@objectql/driver-utils` in your driver implementation provides:

1. **Reduced Code Duplication** - Common patterns extracted and tested
2. **Consistency** - All drivers behave the same way for core operations
3. **Maintainability** - Bug fixes and improvements benefit all drivers
4. **Type Safety** - Full TypeScript support with proper type definitions
5. **Testing** - Shared utilities are thoroughly tested

## License

MIT
