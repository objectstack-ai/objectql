# Implementing a Custom Driver

This guide walks you through implementing a custom database driver for ObjectQL. By the end, you'll understand how to create a driver that seamlessly integrates with ObjectQL's universal data protocol.

## Table of Contents

1. [Understanding the Driver Interface](#understanding-the-driver-interface)
2. [Implementation Steps](#implementation-steps)
3. [Best Practices](#best-practices)
4. [Testing Your Driver](#testing-your-driver)
5. [Example: Redis Driver](#example-redis-driver)

## Understanding the Driver Interface

All ObjectQL drivers implement the `Driver` interface defined in `@objectql/types/src/driver.ts`:

```typescript
export interface Driver {
    // Basic CRUD Operations
    find(objectName: string, query: any, options?: any): Promise<any[]>;
    findOne(objectName: string, id: string | number, query?: any, options?: any): Promise<any>;
    create(objectName: string, data: any, options?: any): Promise<any>;
    update(objectName: string, id: string | number, data: any, options?: any): Promise<any>;
    delete(objectName: string, id: string | number, options?: any): Promise<any>;
    count(objectName: string, filters: any, options?: any): Promise<number>;
    
    // Schema / Lifecycle (Optional)
    init?(objects: any[]): Promise<void>;
    introspectSchema?(): Promise<IntrospectedSchema>;
    
    // Advanced Operations (Optional)
    aggregate?(objectName: string, query: any, options?: any): Promise<any>;
    distinct?(objectName: string, field: string, filters?: any, options?: any): Promise<any[]>;
    
    // Bulk / Atomic Operations (Optional)
    createMany?(objectName: string, data: any[], options?: any): Promise<any>;
    updateMany?(objectName: string, filters: any, data: any, options?: any): Promise<any>;
    deleteMany?(objectName: string, filters: any, options?: any): Promise<any>;
    findOneAndUpdate?(objectName: string, filters: any, update: any, options?: any): Promise<any>;
    
    // Transaction Support (Optional)
    beginTransaction?(): Promise<any>;
    commitTransaction?(trx: any): Promise<void>;
    rollbackTransaction?(trx: any): Promise<void>;
    
    // Connection Management (Optional)
    disconnect?(): Promise<void>;
}
```

### Required Methods

These methods **must** be implemented:

- `find()` - Query multiple records
- `findOne()` - Get a single record by ID
- `create()` - Create a new record
- `update()` - Update an existing record
- `delete()` - Delete a record
- `count()` - Count records matching filters

### Optional Methods

These methods enhance functionality but are not required:

- `init()` - Initialize database schema
- `introspectSchema()` - Read existing database schema
- `aggregate()` - Perform aggregation operations
- `distinct()` - Get distinct values
- `createMany()`, `updateMany()`, `deleteMany()` - Bulk operations
- `beginTransaction()`, `commitTransaction()`, `rollbackTransaction()` - Transaction support
- `disconnect()` - Clean up resources

## Implementation Steps

### Step 1: Set Up the Package

Create a new package in `packages/drivers/<driver-name>/`:

```bash
mkdir -p packages/drivers/redis
cd packages/drivers/redis
```

Create `package.json`:

```json
{
  "name": "@objectql/driver-redis",
  "version": "1.0.0",
  "description": "Redis driver for ObjectQL",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "test": "jest"
  },
  "dependencies": {
    "@objectql/types": "workspace:*",
    "redis": "^4.6.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "jest": "^29.0.0",
    "@types/jest": "^29.0.0"
  }
}
```

Create `tsconfig.json`:

```json
{
  "extends": "../../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

### Step 2: Create the Driver Class

Create `src/index.ts`:

```typescript
import { Driver } from '@objectql/types';
import { createClient, RedisClientType } from 'redis';

export class RedisDriver implements Driver {
    private client: RedisClientType;
    private config: any;
    private connected: Promise<void>;

    constructor(config: { url: string }) {
        this.config = config;
        this.client = createClient({ url: config.url });
        this.connected = this.connect();
    }

    private async connect(): Promise<void> {
        await this.client.connect();
    }

    // Implement required methods...
}
```

### Step 3: Implement Core CRUD Methods

#### `find()`

The `find()` method must handle:
- **Filters**: Array of filter conditions
- **Sorting**: Sort order specifications
- **Pagination**: `skip` and `limit`
- **Field Projection**: `fields` array

```typescript
async find(objectName: string, query: any, options?: any): Promise<any[]> {
    await this.connected;
    
    // Get all keys for this object type
    const pattern = `${objectName}:*`;
    const keys = await this.client.keys(pattern);
    
    // Retrieve all documents
    let results: any[] = [];
    for (const key of keys) {
        const data = await this.client.get(key);
        if (data) {
            const doc = JSON.parse(data);
            results.push(doc);
        }
    }
    
    // Apply filters
    if (query.filters) {
        results = this.applyFilters(results, query.filters);
    }
    
    // Apply sorting
    if (query.sort) {
        results = this.applySort(results, query.sort);
    }
    
    // Apply pagination
    if (query.skip) {
        results = results.slice(query.skip);
    }
    if (query.limit) {
        results = results.slice(0, query.limit);
    }
    
    // Apply field projection
    if (query.fields) {
        results = results.map(doc => this.projectFields(doc, query.fields));
    }
    
    return results;
}
```

#### `findOne()`

```typescript
async findOne(objectName: string, id: string | number, query?: any, options?: any): Promise<any> {
    await this.connected;
    
    const key = `${objectName}:${id}`;
    const data = await this.client.get(key);
    
    if (!data) {
        return null;
    }
    
    return JSON.parse(data);
}
```

#### `create()`

```typescript
async create(objectName: string, data: any, options?: any): Promise<any> {
    await this.connected;
    
    // Generate ID if not provided
    const id = data.id || this.generateId();
    const doc = {
        ...data,
        id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
    
    const key = `${objectName}:${id}`;
    await this.client.set(key, JSON.stringify(doc));
    
    return doc;
}
```

#### `update()`

```typescript
async update(objectName: string, id: string | number, data: any, options?: any): Promise<any> {
    await this.connected;
    
    const key = `${objectName}:${id}`;
    const existing = await this.client.get(key);
    
    if (!existing) {
        throw new Error(`Record not found: ${objectName}:${id}`);
    }
    
    const doc = {
        ...JSON.parse(existing),
        ...data,
        id,
        updated_at: new Date().toISOString()
    };
    
    await this.client.set(key, JSON.stringify(doc));
    
    return doc;
}
```

#### `delete()`

```typescript
async delete(objectName: string, id: string | number, options?: any): Promise<any> {
    await this.connected;
    
    const key = `${objectName}:${id}`;
    const result = await this.client.del(key);
    
    return result > 0;
}
```

#### `count()`

```typescript
async count(objectName: string, filters: any, options?: any): Promise<number> {
    await this.connected;
    
    const pattern = `${objectName}:*`;
    const keys = await this.client.keys(pattern);
    
    if (!filters) {
        return keys.length;
    }
    
    // Count only records matching filters
    let count = 0;
    for (const key of keys) {
        const data = await this.client.get(key);
        if (data) {
            const doc = JSON.parse(data);
            if (this.matchesFilters(doc, filters)) {
                count++;
            }
        }
    }
    
    return count;
}
```

### Step 4: Implement Filter Logic

ObjectQL uses a universal filter format:

```typescript
// Example filters:
[
  ['name', '=', 'John'],           // Simple equality
  'or',                            // Logical operator
  ['age', '>', 25],                // Comparison
  'and',
  ['status', 'in', ['active', 'pending']]  // IN operator
]
```

Implement filter matching:

```typescript
private applyFilters(records: any[], filters: any[]): any[] {
    return records.filter(record => this.matchesFilters(record, filters));
}

private matchesFilters(record: any, filters: any[]): boolean {
    if (!filters || filters.length === 0) {
        return true;
    }
    
    let result = true;
    let nextJoin = 'and';
    
    for (const item of filters) {
        if (typeof item === 'string') {
            // Logical operator
            nextJoin = item.toLowerCase();
            continue;
        }
        
        if (Array.isArray(item)) {
            const [field, operator, value] = item;
            const matches = this.evaluateCondition(record[field], operator, value);
            
            if (nextJoin === 'and') {
                result = result && matches;
            } else {
                result = result || matches;
            }
            
            nextJoin = 'and'; // Reset to default
        }
    }
    
    return result;
}

private evaluateCondition(fieldValue: any, operator: string, compareValue: any): boolean {
    switch (operator) {
        case '=':
            return fieldValue === compareValue;
        case '!=':
            return fieldValue !== compareValue;
        case '>':
            return fieldValue > compareValue;
        case '>=':
            return fieldValue >= compareValue;
        case '<':
            return fieldValue < compareValue;
        case '<=':
            return fieldValue <= compareValue;
        case 'in':
            return Array.isArray(compareValue) && compareValue.includes(fieldValue);
        case 'nin':
            return Array.isArray(compareValue) && !compareValue.includes(fieldValue);
        case 'contains':
            return String(fieldValue).includes(String(compareValue));
        default:
            return false;
    }
}
```

### Step 5: Implement Sorting

```typescript
private applySort(records: any[], sort: any[]): any[] {
    const sorted = [...records];
    
    // Apply sorts in reverse order for correct precedence
    for (let i = sort.length - 1; i >= 0; i--) {
        const [field, direction] = Array.isArray(sort[i]) 
            ? sort[i] 
            : [sort[i].field, sort[i].order || 'asc'];
        
        sorted.sort((a, b) => {
            const aVal = a[field];
            const bVal = b[field];
            
            if (aVal < bVal) return direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return direction === 'asc' ? 1 : -1;
            return 0;
        });
    }
    
    return sorted;
}
```

### Step 6: Add Cleanup

```typescript
async disconnect(): Promise<void> {
    await this.client.quit();
}
```

### Step 7: Add Helper Methods

```typescript
private generateId(): string {
    // Simple UUID v4 generation
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

private projectFields(doc: any, fields: string[]): any {
    const result: any = {};
    for (const field of fields) {
        if (doc[field] !== undefined) {
            result[field] = doc[field];
        }
    }
    return result;
}
```

## Best Practices

### 1. **Consistent ID Handling**

- Use `id` as the primary key field name (not `_id`)
- Support both string and number IDs
- Auto-generate IDs when not provided

### 2. **Error Handling**

```typescript
import { ObjectQLError } from '@objectql/types';

async create(objectName: string, data: any): Promise<any> {
    try {
        // Implementation
    } catch (error) {
        throw new ObjectQLError({
            code: 'CREATE_FAILED',
            message: `Failed to create ${objectName}: ${error.message}`,
            details: { objectName, error }
        });
    }
}
```

### 3. **TypeScript Strict Mode**

- Enable `strict: true` in `tsconfig.json`
- Avoid using `any` where possible
- Define proper types for configuration

### 4. **Async/Await Consistency**

- All driver methods should be `async`
- Always await database operations
- Handle connection pooling properly

### 5. **Performance Optimization**

- Use connection pooling
- Batch operations when possible
- Implement proper indexing strategies

### 6. **Testing**

Create comprehensive tests in `test/index.test.ts`:

```typescript
import { RedisDriver } from '../src';

describe('RedisDriver', () => {
    let driver: RedisDriver;
    
    beforeAll(async () => {
        driver = new RedisDriver({ url: 'redis://localhost:6379' });
    });
    
    afterAll(async () => {
        await driver.disconnect();
    });
    
    describe('CRUD Operations', () => {
        it('should create a record', async () => {
            const result = await driver.create('users', {
                name: 'Alice',
                email: 'alice@example.com'
            });
            
            expect(result).toHaveProperty('id');
            expect(result.name).toBe('Alice');
        });
        
        // Add more tests...
    });
});
```

## Example: Redis Driver

See the complete Redis driver implementation in [`packages/drivers/redis/`](../../../packages/drivers/redis/) (if available).

## Publishing Your Driver

1. **Test Thoroughly**: Ensure all required methods work correctly
2. **Document**: Create clear README with usage examples
3. **Version**: Follow semantic versioning (SemVer)
4. **Publish**: Publish to npm with appropriate tags

```bash
npm publish --access public
```

## Getting Help

- Review existing drivers: [SQL](../../../packages/drivers/sql/), [MongoDB](../../../packages/drivers/mongo/)
- Check the [Driver Interface](../../../packages/foundation/types/src/driver.ts)
- Open an issue on [GitHub](https://github.com/objectstack-ai/objectql/issues)

## Next Steps

- Read the [Driver Extensibility Guide](./extensibility.md)
- Study the [SQL Driver Implementation](../../../packages/drivers/sql/src/index.ts)
- Join the ObjectQL community for support
