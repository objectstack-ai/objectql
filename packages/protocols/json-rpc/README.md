# @objectql/protocol-json-rpc

JSON-RPC 2.0 Protocol Plugin for ObjectStack

## Overview

This plugin provides full JSON-RPC 2.0 specification compliance for ObjectStack applications. It exposes ObjectStack data and metadata through a remote procedure call interface with built-in introspection support.

## Features

- ✅ **JSON-RPC 2.0 Compliant** - Full specification support
- ✅ **Batch Requests** - Execute multiple RPC calls in a single request
- ✅ **Notifications** - Support for requests without response
- ✅ **Introspection** - Discover available methods and signatures
- ✅ **CRUD Operations** - Full data manipulation support
- ✅ **Metadata Access** - Query object schemas and configurations
- ✅ **Action Execution** - Execute custom actions
- ✅ **CORS Support** - Configurable Cross-Origin Resource Sharing
- ✅ **No Direct DB Access** - All operations through ObjectStackRuntimeProtocol

## Installation

```bash
pnpm add @objectql/protocol-json-rpc
```

## Usage

### Basic Setup

```typescript
import { ObjectStackKernel } from '@objectql/runtime';
import { JSONRPCPlugin } from '@objectql/protocol-json-rpc';

const kernel = new ObjectStackKernel([
  new JSONRPCPlugin({
    port: 9000,
    basePath: '/rpc',
    enableCORS: true,
    enableIntrospection: true
  })
]);

await kernel.start();
```

### Configuration Options

```typescript
interface JSONRPCPluginConfig {
  /** Port to listen on (default: 9000) */
  port?: number;
  
  /** Base path for JSON-RPC endpoint (default: '/rpc') */
  basePath?: string;
  
  /** Enable CORS (default: true) */
  enableCORS?: boolean;
  
  /** Enable introspection methods (default: true) */
  enableIntrospection?: boolean;
}
```

## Available Methods

### Object Methods

#### object.find

Find multiple records.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "object.find",
  "params": ["users", {"where": {"active": true}}],
  "id": 1
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "value": [
      {"id": "1", "name": "Alice", "email": "alice@example.com"},
      {"id": "2", "name": "Bob", "email": "bob@example.com"}
    ],
    "count": 2
  },
  "id": 1
}
```

#### object.get

Get a single record by ID.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "object.get",
  "params": ["users", "123"],
  "id": 2
}
```

#### object.create

Create a new record.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "object.create",
  "params": ["users", {"name": "Charlie", "email": "charlie@example.com"}],
  "id": 3
}
```

#### object.update

Update an existing record.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "object.update",
  "params": ["users", "123", {"name": "Charlie Updated"}],
  "id": 4
}
```

#### object.delete

Delete a record.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "object.delete",
  "params": ["users", "123"],
  "id": 5
}
```

#### object.count

Count records matching filters.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "object.count",
  "params": ["users", {"active": true}],
  "id": 6
}
```

### Metadata Methods

#### metadata.list

List all registered object types.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "metadata.list",
  "id": 7
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "result": ["users", "projects", "tasks"],
  "id": 7
}
```

#### metadata.get

Get metadata for a specific object.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "metadata.get",
  "params": ["users"],
  "id": 8
}
```

#### metadata.getAll

Get all metadata items of a specific type.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "metadata.getAll",
  "params": ["object"],
  "id": 9
}
```

### Action Methods

#### action.execute

Execute a custom action.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "action.execute",
  "params": ["sendEmail", {"to": "user@example.com", "subject": "Hello"}],
  "id": 10
}
```

#### action.list

List all available actions.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "action.list",
  "id": 11
}
```

### System Methods (Introspection)

#### system.listMethods

List all available RPC methods.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "system.listMethods",
  "id": 12
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "result": [
    "object.find",
    "object.get",
    "object.create",
    "metadata.list",
    "system.listMethods"
  ],
  "id": 12
}
```

#### system.describe

Get method signature and description.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "system.describe",
  "params": ["object.find"],
  "id": 13
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "description": "Find multiple records",
    "params": [
      {"name": "objectName", "type": "string", "required": true},
      {"name": "query", "type": "object", "required": false}
    ],
    "returns": {"type": "object", "properties": ["value", "count"]}
  },
  "id": 13
}
```

### View Methods

#### view.get

Get view configuration for an object.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "view.get",
  "params": ["users", "list"],
  "id": 14
}
```

## Advanced Features

### Batch Requests

Execute multiple RPC calls in a single HTTP request.

**Request:**
```json
[
  {
    "jsonrpc": "2.0",
    "method": "metadata.list",
    "id": 1
  },
  {
    "jsonrpc": "2.0",
    "method": "object.find",
    "params": ["users", {}],
    "id": 2
  }
]
```

**Response:**
```json
[
  {
    "jsonrpc": "2.0",
    "result": ["users", "projects"],
    "id": 1
  },
  {
    "jsonrpc": "2.0",
    "result": {"value": [...], "count": 10},
    "id": 2
  }
]
```

### Notifications

Requests without an `id` field are treated as notifications and don't receive a response.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "log.info",
  "params": ["User logged in"]
}
```

No response is sent for notifications.

## Error Codes

JSON-RPC 2.0 standard error codes:

| Code | Message | Meaning |
|------|---------|---------|
| -32700 | Parse error | Invalid JSON |
| -32600 | Invalid Request | Not JSON-RPC 2.0 format |
| -32601 | Method not found | Method doesn't exist |
| -32602 | Invalid params | Invalid method parameters |
| -32603 | Internal error | Server error |

**Error Response Example:**
```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32601,
    "message": "Method not found: unknown.method"
  },
  "id": 1
}
```

## Architecture

This plugin follows the ObjectStack protocol plugin pattern:

1. **RuntimePlugin Interface** - Implements the standard plugin lifecycle
2. **ObjectStackRuntimeProtocol Bridge** - Uses the protocol bridge for all kernel interactions
3. **No Direct DB Access** - All data operations through the bridge layer
4. **Lifecycle Management** - Proper initialization and cleanup

```typescript
export class JSONRPCPlugin implements RuntimePlugin {
  async install(ctx: RuntimeContext) {
    // Initialize protocol bridge
    this.protocol = new ObjectStackRuntimeProtocol(ctx.engine);
    // Register RPC methods
    this.registerMethods();
  }

  async onStart(ctx: RuntimeContext) {
    // Start HTTP server
  }

  async onStop(ctx: RuntimeContext) {
    // Stop HTTP server
  }
}
```

## Examples

See the [multi-protocol-server example](../../../examples/protocols/multi-protocol-server) for a complete working example.

## License

MIT
