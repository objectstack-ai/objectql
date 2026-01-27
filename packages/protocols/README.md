# ObjectStack Protocol Plugins

This directory contains protocol plugin implementations for the ObjectStack ecosystem. Each protocol plugin implements the `RuntimePlugin` interface and uses the `ObjectStackRuntimeProtocol` bridge layer to interact with the kernel.

## Architecture Overview

### Key Principles

1. **Plugin Interface**: All protocols implement `RuntimePlugin` from `@objectql/runtime`
2. **Bridge Layer**: Must instantiate `ObjectStackRuntimeProtocol` for kernel interaction
3. **No Direct DB Access**: All data operations go through the protocol bridge methods
4. **Lifecycle Management**: Plugins initialize in `onStart` lifecycle hook

### Protocol Bridge Pattern

```typescript
import { RuntimePlugin, RuntimeContext, ObjectStackRuntimeProtocol } from '@objectql/runtime';

export class MyProtocolPlugin implements RuntimePlugin {
  name = '@objectql/protocol-my-protocol';
  private protocol?: ObjectStackRuntimeProtocol;

  async install(ctx: RuntimeContext): Promise<void> {
    // Initialize the protocol bridge
    this.protocol = new ObjectStackRuntimeProtocol(ctx.engine);
  }

  async onStart(ctx: RuntimeContext): Promise<void> {
    // Start your protocol server
    // Use this.protocol.findData(), this.protocol.createData(), etc.
  }
}
```

## Available Protocol Plugins

### 1. OData V4 (`@objectql/protocol-odata-v4`)

Full OData V4 protocol implementation with automatic metadata generation.

**Features:**
- Service document (/)
- Metadata document ($metadata)
- Entity queries with $filter, $select, $orderby, $top, $skip
- CRUD operations
- EDMX schema generation

**Usage:**
```typescript
import { ObjectStackKernel } from '@objectql/runtime';
import { ODataV4Plugin } from '@objectql/protocol-odata-v4';

const kernel = new ObjectStackKernel([
  new ODataV4Plugin({ 
    port: 8080, 
    basePath: '/odata',
    namespace: 'MyApp'
  })
]);
await kernel.start();

// Access at: http://localhost:8080/odata
// Metadata: http://localhost:8080/odata/$metadata
// Query: http://localhost:8080/odata/users?$top=10&$orderby=name
```

### 2. JSON-RPC 2.0 (`@objectql/protocol-json-rpc`)

Full JSON-RPC 2.0 specification compliant implementation.

**Features:**
- Batch requests
- Notification support
- Built-in introspection (system.listMethods, system.describe)
- CRUD and metadata methods
- Error handling with JSON-RPC error codes

**Usage:**
```typescript
import { ObjectStackKernel } from '@objectql/runtime';
import { JSONRPCPlugin } from '@objectql/protocol-json-rpc';

const kernel = new ObjectStackKernel([
  new JSONRPCPlugin({ 
    port: 9000, 
    basePath: '/rpc',
    enableIntrospection: true
  })
]);
await kernel.start();

// Client request:
// POST http://localhost:9000/rpc
// {
//   "jsonrpc": "2.0",
//   "method": "object.find",
//   "params": ["users", {"where": {"active": true}}],
//   "id": 1
// }
```

### 3. GraphQL (`@objectql/protocol-graphql`)

GraphQL protocol implementation with Apollo Server integration.

**Features:**
- Automatic schema generation from metadata
- Query and mutation resolvers
- GraphQL introspection and playground
- Apollo Server 4.x integration
- Type-safe operations

**Usage:**
```typescript
import { ObjectStackKernel } from '@objectql/runtime';
import { GraphQLPlugin } from '@objectql/protocol-graphql';

const kernel = new ObjectStackKernel([
  new GraphQLPlugin({ 
    port: 4000,
    introspection: true,
    playground: true
  })
]);
await kernel.start();

// Access GraphQL playground: http://localhost:4000/
// Query example:
// {
//   usersList(limit: 10) {
//     id
//     name
//     email
//   }
// }
```

**Reference**: Based on implementation by @hotlong

**Available RPC Methods:**
- `object.find(objectName, query)` - Find records
- `object.get(objectName, id)` - Get single record
- `object.create(objectName, data)` - Create record
- `object.update(objectName, id, data)` - Update record
- `object.delete(objectName, id)` - Delete record
- `object.count(objectName, filters)` - Count records
- `metadata.list()` - List all objects
- `metadata.get(objectName)` - Get object metadata
- `action.execute(actionName, params)` - Execute action
- `system.listMethods()` - List available methods
- `system.describe(method)` - Get method signature

## ObjectStackRuntimeProtocol API

The bridge layer provides these methods for protocol implementations:

### Metadata Methods
- `getMetaTypes(): string[]` - Get all registered object types
- `getMetaItem(objectName): unknown` - Get object metadata
- `getAllMetaItems(metaType): Map` - Get all metadata of type
- `hasObject(objectName): boolean` - Check if object exists

### Data Query Methods
- `findData(objectName, query?): Promise<{value, count}>` - Find records
- `getData(objectName, id): Promise<any>` - Get single record
- `countData(objectName, filters?): Promise<number>` - Count records

### Data Mutation Methods
- `createData(objectName, data): Promise<any>` - Create record
- `updateData(objectName, id, data): Promise<any>` - Update record
- `deleteData(objectName, id): Promise<boolean>` - Delete record

### View & Action Methods
- `getViewConfig(objectName, viewType?): unknown` - Get view config
- `executeAction(actionName, params?): Promise<any>` - Execute action
- `getActions(): string[]` - List actions

### Utility Methods
- `getKernel(): ObjectStackKernel` - Get kernel (advanced use only)

## Creating a Custom Protocol Plugin

### Step 1: Create Package Structure

```bash
packages/protocols/my-protocol/
├── src/
│   └── index.ts
├── package.json
└── tsconfig.json
```

### Step 2: Implement RuntimePlugin

```typescript
import type { RuntimePlugin, RuntimeContext, ObjectStackRuntimeProtocol } from '@objectql/runtime';

export class MyProtocolPlugin implements RuntimePlugin {
  name = '@objectql/protocol-my-protocol';
  version = '0.1.0';
  
  private protocol?: ObjectStackRuntimeProtocol;

  constructor(private config: MyProtocolConfig = {}) {}

  async install(ctx: RuntimeContext): Promise<void> {
    const { ObjectStackRuntimeProtocol } = await import('@objectql/runtime');
    this.protocol = new ObjectStackRuntimeProtocol(ctx.engine);
  }

  async onStart(ctx: RuntimeContext): Promise<void> {
    // Initialize your protocol server here
    // Use this.protocol methods for all data operations
  }

  async onStop(ctx: RuntimeContext): Promise<void> {
    // Cleanup resources
  }
}
```

### Step 3: Use Protocol Bridge Methods

```typescript
// Get metadata
const objects = this.protocol.getMetaTypes();
const userMeta = this.protocol.getMetaItem('users');

// Query data
const result = await this.protocol.findData('users', {
  where: { active: true },
  orderBy: [{ field: 'name', order: 'asc' }],
  limit: 10
});

// Create data
const newUser = await this.protocol.createData('users', {
  name: 'John Doe',
  email: 'john@example.com'
});

// Update data
const updated = await this.protocol.updateData('users', '123', {
  name: 'Jane Doe'
});

// Delete data
await this.protocol.deleteData('users', '123');
```

## Best Practices

1. **Never access database directly** - Always use `ObjectStackRuntimeProtocol` methods
2. **Initialize in install hook** - Create the protocol bridge in `install()`
3. **Start server in onStart** - Launch your protocol server in `onStart()`
4. **Cleanup in onStop** - Close connections and release resources in `onStop()`
5. **Handle errors gracefully** - Provide meaningful error messages in protocol format
6. **Type safety** - Use TypeScript strict mode and proper typing
7. **Configuration** - Make plugins configurable through constructor options
8. **Documentation** - Document available endpoints and methods

## Testing

Each protocol plugin should include:
- Unit tests for request parsing and response formatting
- Integration tests with a mock kernel
- End-to-end tests with real HTTP requests

## Contributing

When adding a new protocol plugin:
1. Follow the architectural pattern shown in existing plugins
2. Implement all three lifecycle hooks (install, onStart, onStop)
3. Use the protocol bridge for all kernel interactions
4. Add comprehensive documentation
5. Include tests
6. Update this README

## License

MIT
