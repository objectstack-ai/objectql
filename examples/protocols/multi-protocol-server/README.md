# Multi-Protocol Server Example

This example demonstrates how to run multiple protocol plugins (OData V4, JSON-RPC 2.0, and GraphQL) on the same ObjectStack kernel, providing different API styles for accessing the same data.

## What This Example Shows

1. **Plugin Architecture**: How to use RuntimePlugin interface
2. **Protocol Bridge**: Using ObjectStackRuntimeProtocol for kernel interaction
3. **Multi-Protocol Support**: Running multiple protocols simultaneously
4. **No Direct DB Access**: All data operations through the protocol layer

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                ObjectStack Kernel                   │
│  ┌──────────────────────────────────────────────┐   │
│  │         Metadata Registry                    │   │
│  │  - users (object)                            │   │
│  │  - projects (object)                         │   │
│  └──────────────────────────────────────────────┘   │
│                      ▲                              │
│                      │                              │
│  ┌──────────────────┴──────────────────────────┐   │
│  │   ObjectStackRuntimeProtocol (Bridge)       │   │
│  │  - getMetaTypes()                           │   │
│  │  - findData()                               │   │
│  │  - createData()                             │   │
│  └──────────────────┬──────────────────────────┘   │
│                     │                               │
└─────────────────────┼───────────────────────────────┘
                      │
        ┌─────────────┴────────────┬─────────────┐
        │                          │             │
┌───────▼────────┐        ┌────────▼──────┐  ┌──▼────────┐
│ OData V4       │        │ JSON-RPC 2.0  │  │ GraphQL   │
│ Plugin         │        │ Plugin        │  │ Plugin    │
│ Port: 8080     │        │ Port: 9000    │  │ Port: 4000│
└────────────────┘        └───────────────┘  └───────────┘
```

## Running the Example

```bash
# Install dependencies
pnpm install

# Run the server
pnpm start

# Or run in watch mode
pnpm dev
```

## Testing the Protocols

### OData V4 Protocol (Port 8080)

#### Service Document
```bash
curl http://localhost:8080/odata/
```

#### Metadata Document  
```bash
curl http://localhost:8080/odata/\$metadata
```

#### Query All Users
```bash
curl http://localhost:8080/odata/users
```

#### Query with Filters
```bash
curl "http://localhost:8080/odata/users?\$filter=active eq true&\$orderby=name"
```

#### Get Single User
```bash
curl http://localhost:8080/odata/users\('USER_ID'\)
```

#### Create User
```bash
curl -X POST http://localhost:8080/odata/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Charlie","email":"charlie@example.com","active":true,"role":"user"}'
```

### JSON-RPC 2.0 Protocol (Port 9000)

#### List Available Methods
```bash
curl -X POST http://localhost:9000/rpc \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"system.listMethods","id":1}'
```

#### Get Method Description
```bash
curl -X POST http://localhost:9000/rpc \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"system.describe","params":["object.find"],"id":2}'
```

#### Find All Users
```bash
curl -X POST http://localhost:9000/rpc \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"object.find","params":["users",{}],"id":3}'
```

#### Find Users with Filter
```bash
curl -X POST http://localhost:9000/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "method":"object.find",
    "params":["users",{"where":{"active":true}}],
    "id":4
  }'
```

#### Create User
```bash
curl -X POST http://localhost:9000/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "method":"object.create",
    "params":["users",{"name":"Diana","email":"diana@example.com"}],
    "id":5
  }'
```

#### List Metadata
```bash
curl -X POST http://localhost:9000/rpc \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"metadata.list","id":6}'
```

#### Batch Request
```bash
curl -X POST http://localhost:9000/rpc \
  -H "Content-Type: application/json" \
  -d '[
    {"jsonrpc":"2.0","method":"metadata.list","id":1},
    {"jsonrpc":"2.0","method":"object.find","params":["users",{}],"id":2}
  ]'
```

### GraphQL Protocol (Port 4000)

#### Access GraphQL Playground
Open in browser: `http://localhost:4000/`

#### Query All Users
```bash
curl -X POST http://localhost:4000/ \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{ usersList { id name email active } }"
  }'
```

#### Query Single User
```bash
curl -X POST http://localhost:4000/ \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{ users(id: \"USER_ID\") { id name email } }"
  }'
```

#### Query with Limit
```bash
curl -X POST http://localhost:4000/ \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{ usersList(limit: 10, offset: 0) { id name email } }"
  }'
```

#### Create User (Mutation)
```bash
curl -X POST http://localhost:4000/ \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { createUsers(input: \"{\\\"name\\\":\\\"Eve\\\",\\\"email\\\":\\\"eve@example.com\\\"}\") { id name email } }"
  }'
```

#### Update User (Mutation)
```bash
curl -X POST http://localhost:4000/ \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { updateUsers(id: \"USER_ID\", input: \"{\\\"name\\\":\\\"Eve Updated\\\"}\") { id name email } }"
  }'
```

#### Delete User (Mutation)
```bash
curl -X POST http://localhost:4000/ \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { deleteUsers(id: \"USER_ID\") }"
  }'
```

#### List All Objects (Introspection)
```bash
curl -X POST http://localhost:4000/ \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{ listObjects }"
  }'
```
    {"jsonrpc":"2.0","method":"object.find","params":["users",{}],"id":2}
  ]'
```

## Key Concepts Demonstrated

### 1. Plugin Lifecycle

```typescript
class MyProtocolPlugin implements RuntimePlugin {
  // Called during initialization
  async install(ctx: RuntimeContext) {
    this.protocol = new ObjectStackRuntimeProtocol(ctx.engine);
  }

  // Called when kernel starts
  async onStart(ctx: RuntimeContext) {
    // Start your protocol server
  }

  // Called when kernel stops
  async onStop(ctx: RuntimeContext) {
    // Cleanup resources
  }
}
```

### 2. Protocol Bridge Usage

```typescript
// Get metadata
const objects = this.protocol.getMetaTypes();
const metadata = this.protocol.getMetaItem('users');

// Query data
const result = await this.protocol.findData('users', {
  where: { active: true },
  orderBy: [{ field: 'name', order: 'asc' }]
});

// Mutate data
await this.protocol.createData('users', { name: 'John' });
await this.protocol.updateData('users', '123', { name: 'Jane' });
await this.protocol.deleteData('users', '123');
```

### 3. No Direct Database Access

Both protocol plugins interact **only** through `ObjectStackRuntimeProtocol`. They never:
- Import or use database drivers directly
- Access the kernel's internal state
- Bypass the protocol bridge layer

This ensures:
- ✅ Clean separation of concerns
- ✅ Consistent behavior across protocols
- ✅ Easier testing and maintenance
- ✅ Type safety and validation

## Extending the Example

### Add a New Protocol

1. Create your plugin:
```typescript
class MyProtocolPlugin implements RuntimePlugin {
  name = '@objectql/protocol-my-protocol';
  private protocol?: ObjectStackRuntimeProtocol;

  async install(ctx: RuntimeContext) {
    const { ObjectStackRuntimeProtocol } = await import('@objectql/runtime');
    this.protocol = new ObjectStackRuntimeProtocol(ctx.engine);
  }

  async onStart(ctx: RuntimeContext) {
    // Start your server
  }
}
```

2. Add to kernel:
```typescript
const kernel = new ObjectStackKernel([
  new ObjectQLPlugin({ datasources: { default: memoryDriver } }),
  new ODataV4Plugin({ port: 8080 }),
  new JSONRPCPlugin({ port: 9000 }),
  new MyProtocolPlugin({ port: 8888 })  // Your new protocol
]);
```

### Add More Objects

```typescript
kernel.metadata.register('object', 'tasks', {
  name: 'tasks',
  label: 'Tasks',
  fields: {
    title: { type: 'text', required: true },
    completed: { type: 'boolean', default: false },
    due_date: { type: 'date' }
  }
});
```

## Learn More

- [Protocol Plugin Architecture](../../packages/protocols/README.md)
- [ObjectStack Runtime](../../packages/objectstack/runtime/README.md)
- [OData V4 Plugin](../../packages/protocols/odata-v4/)
- [JSON-RPC Plugin](../../packages/protocols/json-rpc/)

## License

MIT
