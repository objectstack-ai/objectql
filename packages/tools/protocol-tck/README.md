# ObjectQL Protocol TCK (Technology Compatibility Kit)

A comprehensive test suite to ensure all ObjectQL protocol implementations provide consistent behavior.

## Purpose

The Protocol TCK provides a standardized set of tests that all ObjectQL protocol implementations must pass. This ensures:

- **Consistency**: All protocols behave the same way for core operations
- **Compatibility**: Applications can switch protocols without code changes
- **Quality**: Protocols are thoroughly tested against a known specification
- **Performance**: Optional benchmarks to track protocol efficiency

## Supported Protocols

- **GraphQL** - GraphQL queries, mutations, and subscriptions
- **OData V4** - OData query language with $expand and $batch
- **REST** - RESTful HTTP API
- **JSON-RPC** - JSON-RPC 2.0 protocol

## Usage

### With Vitest

```typescript
import { describe } from 'vitest';
import { runProtocolTCK, ProtocolEndpoint } from '@objectql/protocol-tck';
import { MyProtocol } from './my-protocol';

class MyProtocolEndpoint implements ProtocolEndpoint {
  async execute(operation) {
    // Implement protocol-specific request/response handling
  }
  
  async getMetadata() {
    // Return protocol metadata
  }
}

describe('MyProtocol TCK', () => {
  runProtocolTCK(
    () => new MyProtocolEndpoint(),
    'MyProtocol',
    {
      skip: {
        // Skip tests for unsupported features
        subscriptions: true,
        federation: true
      },
      timeout: 30000,
      performance: {
        enabled: true,
        thresholds: {
          create: 100,  // milliseconds
          read: 50,
          update: 100,
          delete: 50,
          query: 200
        }
      }
    }
  );
});
```

## Test Categories

### 1. Core CRUD Operations
- ✅ Create entities
- ✅ Read entities by ID
- ✅ Update entities
- ✅ Delete entities
- ✅ Auto-generated IDs
- ✅ Timestamps

### 2. Query Operations
- ✅ Query all entities
- ✅ Filter by conditions
- ✅ Pagination (limit/offset)
- ✅ Sorting (orderBy)
- ✅ Combined filters + sort + pagination

### 3. Metadata Operations *(optional)*
- ✅ Retrieve protocol metadata
- ✅ List available entities
- ✅ Entity schema information

### 4. Error Handling
- ✅ Invalid entity names
- ✅ Invalid IDs
- ✅ Validation errors
- ✅ Protocol-specific error formats

### 5. Batch Operations *(optional)*
- ✅ Batch create
- ✅ Batch update
- ✅ Batch delete
- ✅ Transaction support

### 6. Protocol-Specific Features *(optional)*

#### GraphQL
- ✅ Subscriptions (real-time updates)
- ✅ Federation (subgraph support)
- ✅ DataLoader (N+1 prevention)

#### OData V4
- ✅ $expand (nested entities)
- ✅ $batch (bulk operations)
- ✅ $search (full-text search)
- ✅ ETags (optimistic concurrency)

#### REST
- ✅ OpenAPI/Swagger metadata
- ✅ File uploads
- ✅ Custom endpoints

#### JSON-RPC
- ✅ Batch requests
- ✅ Notification methods
- ✅ Error codes

## Configuration

### Skip Options

Use the `skip` configuration to disable tests for features your protocol doesn't support:

```typescript
{
  skip: {
    metadata: false,         // Skip metadata tests
    subscriptions: true,     // Skip subscription tests (GraphQL)
    batch: true,            // Skip batch operation tests
    search: true,           // Skip full-text search tests
    transactions: true,     // Skip transaction tests
    expand: true,           // Skip expand tests (OData)
    federation: true        // Skip federation tests (GraphQL)
  }
}
```

### Performance Benchmarks

Enable performance tracking to measure protocol efficiency:

```typescript
{
  performance: {
    enabled: true,
    thresholds: {
      create: 100,   // Max 100ms average
      read: 50,      // Max 50ms average
      update: 100,   // Max 100ms average
      delete: 50,    // Max 50ms average
      query: 200,    // Max 200ms average
      batch: 500     // Max 500ms average
    }
  }
}
```

The TCK will:
1. Measure average, min, and max execution times
2. Report results after all tests complete
3. Warn if averages exceed thresholds

### Hooks

Provide custom setup/teardown logic:

```typescript
{
  hooks: {
    beforeAll: async () => {
      // Setup test server, database, etc.
    },
    afterAll: async () => {
      // Cleanup resources
    },
    beforeEach: async () => {
      // Clear test data between tests
    },
    afterEach: async () => {
      // Post-test cleanup
    }
  }
}
```

## Protocol Endpoint Interface

Your protocol must implement the `ProtocolEndpoint` interface:

```typescript
interface ProtocolEndpoint {
  /**
   * Execute a protocol operation
   */
  execute(operation: ProtocolOperation): Promise<ProtocolResponse>;
  
  /**
   * Get protocol metadata
   */
  getMetadata(): Promise<any>;
  
  /**
   * Cleanup (optional)
   */
  close?(): Promise<void>;
}

interface ProtocolOperation {
  type: 'create' | 'read' | 'update' | 'delete' | 'query' | 'batch' | 'subscribe';
  entity: string;
  data?: any;
  id?: string;
  filter?: any;
  options?: any;
}

interface ProtocolResponse {
  success: boolean;
  data?: any;
  error?: {
    code: string;
    message: string;
  };
  metadata?: any;
}
```

## Expected Behavior

1. **Auto-generated IDs**: If no ID is provided in create, generate a unique one
2. **Timestamps**: Automatically add `created_at` and `updated_at` (if supported by engine)
3. **Null Safety**: Return `null` for non-existent entities
4. **Error Handling**: Return structured errors with `code` and `message`
5. **Type Safety**: Preserve data types (numbers, booleans, strings)

## Example: GraphQL Endpoint

```typescript
import { GraphQLPlugin } from '@objectql/protocol-graphql';
import { ProtocolEndpoint } from '@objectql/protocol-tck';

class GraphQLEndpoint implements ProtocolEndpoint {
  private client: any;
  
  constructor(plugin: GraphQLPlugin) {
    this.client = createGraphQLClient(plugin);
  }
  
  async execute(operation) {
    if (operation.type === 'create') {
      const mutation = `
        mutation CreateEntity($data: ${operation.entity}Input!) {
          create${operation.entity}(data: $data) {
            id
            ...fields
          }
        }
      `;
      const result = await this.client.mutate({ mutation, variables: { data: operation.data } });
      return { success: true, data: result.data[`create${operation.entity}`] };
    }
    // ... implement other operations
  }
  
  async getMetadata() {
    const query = `{ __schema { types { name } } }`;
    const result = await this.client.query({ query });
    return result.data;
  }
}
```

## License

MIT
