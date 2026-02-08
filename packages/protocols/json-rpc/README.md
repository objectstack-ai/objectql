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
import { ObjectKernel } from '@objectstack/runtime';
import { JSONRPCPlugin } from '@objectql/protocol-json-rpc';

const kernel = new ObjectKernel([
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
  
  /** Enable session management (default: true) */
  enableSessions?: boolean;
  
  /** Session timeout in milliseconds (default: 30 minutes) */
  sessionTimeout?: number;
  
  /** Enable progress notifications via SSE (default: true) */
  enableProgress?: boolean;
  
  /** Enable method call chaining in batch requests (default: true) */
  enableChaining?: boolean;
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

**Request (no filter - count all):**
```json
{
  "jsonrpc": "2.0",
  "method": "object.count",
  "params": ["users"],
  "id": 6
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "result": 42,
  "id": 6
}
```

**Request (with filter):**
```json
{
  "jsonrpc": "2.0",
  "method": "object.count",
  "params": ["users", {
    "type": "comparison",
    "field": "active",
    "operator": "=",
    "value": true
  }],
  "id": 7
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "result": 28,
  "id": 7
}
```

**Request (with complex filter):**
```json
{
  "jsonrpc": "2.0",
  "method": "object.count",
  "params": ["users", {
    "type": "logical",
    "operator": "and",
    "conditions": [
      {
        "type": "comparison",
        "field": "active",
        "operator": "=",
        "value": true
      },
      {
        "type": "comparison",
        "field": "role",
        "operator": "=",
        "value": "admin"
      }
    ]
  }],
  "id": 8
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "result": 5,
  "id": 8
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

**Response:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "success": true,
    "messageId": "msg_1234567890",
    "to": "user@example.com",
    "subject": "Hello"
  },
  "id": 10
}
```

**Example: Calculate Discount**
```json
{
  "jsonrpc": "2.0",
  "method": "action.execute",
  "params": ["calculateDiscount", {
    "amount": 100,
    "percentage": 20
  }],
  "id": 11
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "originalAmount": 100,
    "discountPercentage": 20,
    "discountAmount": 20,
    "finalAmount": 80
  },
  "id": 11
}
```

**Error Response (action not found):**
```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32603,
    "message": "Action not found: unknownAction"
  },
  "id": 12
}
```

#### action.list

List all available actions.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "action.list",
  "id": 13
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "result": [
    "sendEmail",
    "calculateDiscount",
    "processPayment",
    "generateReport"
  ],
  "id": 13
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

## Advanced Features

### Batch Requests (JSON-RPC 2.0 §6)

Execute multiple RPC calls in a single HTTP request. Per JSON-RPC 2.0 specification section 6, batch requests allow you to send an array of request objects and receive an array of response objects.

#### Basic Batch Request

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
  },
  {
    "jsonrpc": "2.0",
    "method": "object.count",
    "params": ["users"],
    "id": 3
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
    "result": [
      {"id": "1", "name": "Alice"},
      {"id": "2", "name": "Bob"}
    ],
    "id": 2
  },
  {
    "jsonrpc": "2.0",
    "result": 2,
    "id": 3
  }
]
```

#### Batch with Mixed Operations

Execute CRUD operations, counts, and actions in a single batch:

**Request:**
```json
[
  {
    "jsonrpc": "2.0",
    "method": "object.create",
    "params": ["products", {"name": "Laptop", "price": 999}],
    "id": 1
  },
  {
    "jsonrpc": "2.0",
    "method": "object.count",
    "params": ["products"],
    "id": 2
  },
  {
    "jsonrpc": "2.0",
    "method": "action.execute",
    "params": ["sendEmail", {"to": "admin@example.com", "subject": "New Product"}],
    "id": 3
  }
]
```

**Response:**
```json
[
  {
    "jsonrpc": "2.0",
    "result": {"id": "prod-123", "name": "Laptop", "price": 999},
    "id": 1
  },
  {
    "jsonrpc": "2.0",
    "result": 42,
    "id": 2
  },
  {
    "jsonrpc": "2.0",
    "result": {"success": true, "messageId": "msg_123"},
    "id": 3
  }
]
```

#### Batch with Notifications

Requests without an `id` are notifications and don't return responses:

**Request:**
```json
[
  {
    "jsonrpc": "2.0",
    "method": "object.count",
    "params": ["users"],
    "id": 1
  },
  {
    "jsonrpc": "2.0",
    "method": "action.execute",
    "params": ["logEvent", {"event": "user_login"}]
    // No id - this is a notification
  },
  {
    "jsonrpc": "2.0",
    "method": "metadata.list",
    "id": 2
  }
]
```

**Response:**
```json
[
  {
    "jsonrpc": "2.0",
    "result": 100,
    "id": 1
  },
  {
    "jsonrpc": "2.0",
    "result": ["users", "products"],
    "id": 2
  }
]
```

Note: Only 2 responses because the notification (no `id`) doesn't return a response.

#### Batch with Partial Errors

Individual requests can fail without affecting other requests in the batch:

**Request:**
```json
[
  {
    "jsonrpc": "2.0",
    "method": "object.count",
    "params": ["users"],
    "id": 1
  },
  {
    "jsonrpc": "2.0",
    "method": "object.get",
    "params": ["users", "non-existent-id"],
    "id": 2
  },
  {
    "jsonrpc": "2.0",
    "method": "metadata.list",
    "id": 3
  }
]
```

**Response:**
```json
[
  {
    "jsonrpc": "2.0",
    "result": 100,
    "id": 1
  },
  {
    "jsonrpc": "2.0",
    "result": null,
    "id": 2
  },
  {
    "jsonrpc": "2.0",
    "result": ["users", "products"],
    "id": 3
  }
]
```

### Call Chaining in Batch Requests

When `enableChaining` is enabled, you can reference results from previous requests in the same batch using the `$N.result.path` syntax, where `N` is the request ID.

**Example: Create a user and then fetch it**

```json
[
  {
    "jsonrpc": "2.0",
    "method": "object.create",
    "params": ["users", {"name": "Alice", "email": "alice@example.com"}],
    "id": 1
  },
  {
    "jsonrpc": "2.0",
    "method": "object.get",
    "params": ["users", "$1.result._id"],
    "id": 2
  }
]
```

In this example:
- Request 1 creates a new user
- Request 2 references the `_id` from the result of request 1 using `$1.result._id`

**Complex Reference Example:**

```json
[
  {
    "jsonrpc": "2.0",
    "method": "object.create",
    "params": ["projects", {"name": "New Project", "owner": "$1.result._id"}],
    "id": 3
  }
]
```

**Reference Syntax:**
- `$N.result` - References the entire result of request N
- `$N.result.fieldName` - References a specific field
- `$N.result.nested.field` - References nested fields
- Works with arrays and objects in parameters

### Server-Sent Events (SSE) Progress Notifications

For long-running operations, you can receive real-time progress updates via Server-Sent Events.

**Connecting to Progress Stream:**

```javascript
const sessionId = 'your-session-id';
const eventSource = new EventSource(`http://localhost:9000/rpc/progress/${sessionId}`);

eventSource.addEventListener('message', (event) => {
  const data = JSON.parse(event.data);
  
  if (data.type === 'connected') {
    console.log('Connected to progress stream');
  } else if (data.method === 'progress.update') {
    const { id, progress, total, message } = data.params;
    console.log(`Operation ${id}: ${progress}/${total} - ${message}`);
  }
});

eventSource.addEventListener('error', (error) => {
  console.error('SSE connection error:', error);
});
```

**Progress Notification Format:**

The notification follows JSON-RPC 2.0 format but without the `id` field (as it's a notification):

```json
{
  "jsonrpc": "2.0",
  "method": "progress.update",
  "params": {
    "id": "operation-123",
    "progress": 50,
    "total": 100,
    "message": "Processing item 50 of 100"
  }
}
```

Note: The complete SSE message includes the `data:` prefix and double newline:
```
data: {"jsonrpc":"2.0","method":"progress.update","params":{...}}

```

**Example: Batch Import with Progress**

```javascript
// 1. Start the batch import
const response = await fetch('http://localhost:9000/rpc', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jsonrpc: '2.0',
    method: 'object.batchImport',
    params: ['users', usersData],
    id: 1
  })
});

// 2. Connect to progress stream (if operation returns a session ID)
const result = await response.json();
const sessionId = result.result.sessionId;

const eventSource = new EventSource(`http://localhost:9000/rpc/progress/${sessionId}`);
eventSource.addEventListener('message', (event) => {
  const data = JSON.parse(event.data);
  if (data.method === 'progress.update') {
    updateProgressBar(data.params.progress, data.params.total);
  }
});
```

**Features:**
- ✅ Real-time progress updates for long-running operations
- ✅ Multiple clients can subscribe to the same session
- ✅ Automatic heartbeat to keep connection alive
- ✅ Graceful handling of client disconnections
- ✅ Session-based progress tracking

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
