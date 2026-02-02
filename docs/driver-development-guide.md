# ObjectQL Driver Development Guide

## Overview

This guide provides comprehensive instructions for developing new ObjectQL drivers and ensuring they meet the ObjectQL standards through the Technology Compatibility Kit (TCK).

## Table of Contents

1. [Driver Architecture](#driver-architecture)
2. [Getting Started](#getting-started)
3. [Core Interface Implementation](#core-interface-implementation)
4. [Using Driver Utilities](#using-driver-utilities)
5. [Testing with TCK](#testing-with-tck)
6. [Transaction Support](#transaction-support)
7. [Best Practices](#best-practices)

## Driver Architecture

ObjectQL drivers follow a standardized architecture:

```
packages/drivers/your-driver/
├── src/
│   └── index.ts          # Main driver implementation
├── test/
│   ├── index.test.ts     # Driver-specific tests
│   └── tck.test.ts       # TCK compliance tests
├── package.json
├── tsconfig.json
└── README.md
```

## Getting Started

### 1. Create Package Structure

```bash
mkdir -p packages/drivers/your-driver/src
mkdir -p packages/drivers/your-driver/test
```

### 2. Initialize package.json

```json
{
  "name": "@objectql/driver-your-driver",
  "version": "4.0.3",
  "description": "ObjectQL driver for YourDatabase",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "test": "jest"
  },
  "dependencies": {
    "@objectql/types": "workspace:*",
    "@objectql/driver-utils": "workspace:*",
    "@objectstack/spec": "^0.8.2"
  },
  "devDependencies": {
    "@objectql/driver-tck": "workspace:*",
    "@types/jest": "^29.0.0",
    "jest": "^30.0.0",
    "typescript": "^5.3.0"
  }
}
```

### 3. Create tsconfig.json

```json
{
  "extends": "../../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

## Core Interface Implementation

### Driver Interface

Implement the `Driver` interface from `@objectql/types`:

```typescript
import { Driver } from '@objectql/types';
import { Data } from '@objectstack/spec';

export class YourDriver implements Driver {
    // Driver metadata
    public readonly name = 'YourDriver';
    public readonly version = '1.0.0';
    public readonly supports = {
        transactions: false,      // Set to true if you support transactions
        joins: false,
        fullTextSearch: false,
        jsonFields: true,
        arrayFields: true,
        queryFilters: true,
        queryAggregations: false,
        querySorting: true,
        queryPagination: true,
        queryWindowFunctions: false,
        querySubqueries: false
    };

    constructor(config: any) {
        // Initialize your driver
    }

    // Required CRUD methods
    async find(objectName: string, query: any, options?: any): Promise<any[]> {
        // Implementation
    }

    async findOne(objectName: string, id: string | number, query?: any, options?: any): Promise<any> {
        // Implementation
    }

    async create(objectName: string, data: any, options?: any): Promise<any> {
        // Implementation
    }

    async update(objectName: string, id: string | number, data: any, options?: any): Promise<any> {
        // Implementation
    }

    async delete(objectName: string, id: string | number, options?: any): Promise<any> {
        // Implementation
    }

    async count(objectName: string, filters: any, options?: any): Promise<number> {
        // Implementation
    }

    // Optional lifecycle methods
    async connect?(): Promise<void> {
        // Connect to database
    }

    async disconnect?(): Promise<void> {
        // Disconnect from database
    }
}
```

## Using Driver Utilities

The `@objectql/driver-utils` package provides common functionality to reduce code duplication:

### Query Normalization

```typescript
import { normalizeQuery, applySorting, applyPagination } from '@objectql/driver-utils';

async find(objectName: string, query: any, options?: any): Promise<any[]> {
    // Normalize query from various formats
    const normalized = normalizeQuery(query);
    
    // Get all records
    let records = await this.getAllRecords(objectName);
    
    // Apply filters (using your database's native filtering)
    if (normalized.where) {
        records = this.applyFilters(records, normalized.where);
    }
    
    // Apply sorting
    if (normalized.orderBy) {
        records = applySorting(records, normalized.orderBy);
    }
    
    // Apply pagination
    records = applyPagination(records, normalized.offset, normalized.limit);
    
    return records;
}
```

### Filter Evaluation

```typescript
import { evaluateFilter, filterRecords, isFilterCondition } from '@objectql/driver-utils';

private applyFilters(records: any[], filters: any): any[] {
    if (isFilterCondition(filters)) {
        // Use the utility to filter records
        return filterRecords(records, filters);
    }
    
    // Or evaluate each record individually
    return records.filter(record => evaluateFilter(record, filters));
}
```

### Error Handling

```typescript
import {
    createRecordNotFoundError,
    createDuplicateRecordError,
    DriverError
} from '@objectql/driver-utils';

async findOne(objectName: string, id: string | number): Promise<any> {
    const record = await this.getRecord(objectName, id);
    
    if (!record) {
        throw createRecordNotFoundError(objectName, id);
    }
    
    return record;
}

async create(objectName: string, data: any): Promise<any> {
    const exists = await this.recordExists(objectName, data.id);
    
    if (exists) {
        throw createDuplicateRecordError(objectName, data.id);
    }
    
    // Create record...
}
```

### ID Generation

```typescript
import { IDGenerator, generateNanoId } from '@objectql/driver-utils';

export class YourDriver {
    private idGenerator: IDGenerator;
    
    constructor(config: any) {
        this.idGenerator = new IDGenerator();
    }
    
    async create(objectName: string, data: any): Promise<any> {
        // Generate ID if not provided
        const id = data.id || this.idGenerator.generateRandom(16);
        
        // Or use sequential IDs
        // const id = data.id || this.idGenerator.generateSequential(objectName);
        
        return await this.insertRecord(objectName, { ...data, id });
    }
}
```

### Timestamp Management

```typescript
import { addCreateTimestamps, addUpdateTimestamps } from '@objectql/driver-utils';

async create(objectName: string, data: any): Promise<any> {
    // Automatically add timestamps
    const recordWithTimestamps = addCreateTimestamps(data);
    return await this.insertRecord(objectName, recordWithTimestamps);
}

async update(objectName: string, id: string | number, data: any): Promise<any> {
    const existing = await this.findOne(objectName, id);
    
    // Add updated_at, preserve created_at
    const recordWithTimestamps = addUpdateTimestamps(data, existing.created_at);
    return await this.updateRecord(objectName, id, recordWithTimestamps);
}
```

## Testing with TCK

The Technology Compatibility Kit (TCK) ensures your driver behaves consistently with other ObjectQL drivers.

### Create TCK Test File

`test/tck.test.ts`:

```typescript
import { runDriverTCK } from '@objectql/driver-tck';
import { YourDriver } from '../src';

describe('YourDriver TCK Compliance', () => {
    let driver: YourDriver;
    
    runDriverTCK(
        () => {
            driver = new YourDriver({
                // Your driver config
            });
            return driver;
        },
        {
            skip: {
                // Skip tests for unsupported features
                transactions: true,       // If you don't support transactions
                aggregations: true,       // If you don't support aggregations
                distinct: true,           // If you don't support distinct
                bulkOperations: false,    // If you support bulk ops
            },
            timeout: 30000,
            hooks: {
                beforeEach: async () => {
                    // Clear test data before each test
                    await driver.clear();
                },
                afterEach: async () => {
                    // Cleanup after each test
                }
            }
        }
    );
});
```

### Run TCK Tests

```bash
cd packages/drivers/your-driver
pnpm test
```

### TCK Test Coverage

The TCK includes 36 tests covering:
- Core CRUD operations (10 tests)
- Query operations (11 tests)
- Count operations (2 tests)
- Distinct operations (2 tests)
- Bulk operations (3 tests)
- Transaction support (2 tests)
- Aggregation operations (2 tests)
- Edge cases (3 tests)

## Transaction Support

If your driver supports transactions, implement these methods:

```typescript
async beginTransaction(): Promise<any> {
    // Start transaction and return handle
    const tx = await this.database.startTransaction();
    return tx;
}

async commitTransaction(transaction: any): Promise<void> {
    // Commit the transaction
    await transaction.commit();
}

async rollbackTransaction(transaction: any): Promise<void> {
    // Rollback the transaction
    await transaction.rollback();
}

// Update CRUD methods to accept transaction in options
async create(objectName: string, data: any, options?: any): Promise<any> {
    const tx = options?.transaction;
    
    if (tx) {
        // Use transaction
        return await this.database.insert(data).transacting(tx);
    } else {
        // Regular insert
        return await this.database.insert(data);
    }
}
```

See [Transaction Protocol](./transaction-protocol.md) for detailed requirements.

## Best Practices

### 1. Use TypeScript Strict Mode

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

### 2. Handle All Edge Cases

- Null/undefined values
- Empty queries
- Special characters in strings
- Large datasets
- Concurrent operations

### 3. Provide Clear Error Messages

```typescript
throw new DriverError({
    code: 'INVALID_QUERY',
    message: `Invalid query format: expected object, got ${typeof query}`,
    details: { query }
});
```

### 4. Document Your Driver

Include comprehensive README with:
- Installation instructions
- Configuration options
- Usage examples
- Supported features
- Limitations

### 5. Performance Considerations

- Use database-native filtering when possible
- Implement connection pooling
- Cache frequently accessed data
- Use indexes for common queries
- Batch operations when available

### 6. Security

- Validate all inputs
- Prevent SQL injection (if applicable)
- Sanitize user data
- Use parameterized queries
- Implement proper access control

## Example: Complete Minimal Driver

See the [Memory Driver](../packages/drivers/memory/src/index.ts) as the reference implementation.

## Resources

- [Driver Utils API](../packages/drivers/utils/README.md)
- [TCK Documentation](../packages/tools/driver-tck/README.md)
- [Transaction Protocol](./transaction-protocol.md)
- [ObjectQL Types](../packages/foundation/types/src/driver.ts)

## Getting Help

- GitHub Issues: Report bugs or request features
- Discussions: Ask questions or share implementations
- Examples: See existing drivers for patterns and best practices
