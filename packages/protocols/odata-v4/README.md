# @objectql/protocol-odata-v4

OData V4 Protocol Plugin for ObjectStack

## Overview

This plugin provides full OData V4 protocol support for ObjectStack applications. It automatically generates OData metadata (EDMX) from ObjectStack metadata and provides a RESTful API for querying and manipulating data.

## Features

- ✅ **Service Document** (`/`) - Discover available entity sets
- ✅ **Metadata Document** (`/$metadata`) - EDMX schema generation
- ✅ **Entity Queries** - Query entity sets with OData query options
- ✅ **Query Options** - Support for `$filter`, `$select`, `$orderby`, `$top`, `$skip`, `$count`, `$expand`
- ✅ **CRUD Operations** - Full Create, Read, Update, Delete support
- ✅ **CORS Support** - Configurable Cross-Origin Resource Sharing
- ✅ **Type Mapping** - Automatic ObjectQL to EDM type conversion
- ✅ **No Direct DB Access** - All operations through ObjectStackRuntimeProtocol

## Installation

```bash
pnpm add @objectql/protocol-odata-v4
```

## Usage

### Basic Setup

```typescript
import { ObjectKernel } from '@objectstack/runtime';
import { ODataV4Plugin } from '@objectql/protocol-odata-v4';

const kernel = new ObjectKernel([
  new ODataV4Plugin({
    port: 8080,
    basePath: '/odata',
    namespace: 'MyApp',
    enableCORS: true
  })
]);

await kernel.start();
```

### Configuration Options

```typescript
interface ODataV4PluginConfig {
  /** Port to listen on (default: 8080) */
  port?: number;
  
  /** Base path for OData endpoints (default: '/odata') */
  basePath?: string;
  
  /** Enable CORS (default: true) */
  enableCORS?: boolean;
  
  /** Service namespace (default: 'ObjectStack') */
  namespace?: string;
}
```

## Endpoints

### Service Document

**GET** `{basePath}/`

Returns a list of available entity sets.

```bash
curl http://localhost:8080/odata/
```

Response:
```json
{
  "@odata.context": "http://localhost:8080/odata/$metadata",
  "value": [
    { "name": "users", "kind": "EntitySet", "url": "users" },
    { "name": "projects", "kind": "EntitySet", "url": "projects" }
  ]
}
```

### Metadata Document

**GET** `{basePath}/$metadata`

Returns the EDMX metadata document describing the data model.

```bash
curl http://localhost:8080/odata/\$metadata
```

Response: XML/EDMX schema

### Query Entity Set

**GET** `{basePath}/{EntitySet}`

Query all entities in a set.

```bash
curl http://localhost:8080/odata/users
```

Response:
```json
{
  "@odata.context": "http://localhost:8080/odata/$metadata#users",
  "value": [
    { "id": "1", "name": "Alice", "email": "alice@example.com" },
    { "id": "2", "name": "Bob", "email": "bob@example.com" }
  ]
}
```

### Query Options

#### $filter

Filter results based on criteria.

```bash
curl "http://localhost:8080/odata/users?\$filter=name eq 'Alice'"
```

#### $orderby

Sort results.

```bash
curl "http://localhost:8080/odata/users?\$orderby=name desc"
```

#### $top and $skip

Pagination.

```bash
curl "http://localhost:8080/odata/users?\$top=10&\$skip=20"
```

#### $count

Include count in response.

```bash
curl "http://localhost:8080/odata/users?\$count=true"
```

Response includes `@odata.count` field:
```json
{
  "@odata.context": "http://localhost:8080/odata/$metadata#users",
  "@odata.count": 42,
  "value": [...]
}
```

You can also get just the count:

```bash
curl "http://localhost:8080/odata/users/\$count"
```

Response: `42` (plain text)

#### $expand

Expand related entities (navigation properties).

**Single property:**
```bash
curl "http://localhost:8080/odata/orders?\$expand=customer"
```

**Multiple properties:**
```bash
curl "http://localhost:8080/odata/orders?\$expand=customer,shipper"
```

**With filter:**
```bash
curl "http://localhost:8080/odata/orders?\$expand=items(\$filter=status eq 'active')"
```

**With select:**
```bash
curl "http://localhost:8080/odata/orders?\$expand=customer(\$select=name,email)"
```

**Supported expand options:**
- `$filter` - Filter expanded entities
- `$select` - Select specific fields from expanded entities
- `$orderby` - Sort expanded entities
- `$top` - Limit number of expanded entities

**Current Limitations:**
- ⚠️ Nested expand (e.g., `$expand=owner($expand=department)`) is not yet supported
- Only single-level relationship expansion is available
- See [Phase 2 Roadmap](../../../PROTOCOL_DEVELOPMENT_PLAN_ZH.md) for planned nested expand support

Response includes expanded entities:
```json
{
  "@odata.context": "http://localhost:8080/odata/$metadata#orders",
  "value": [
    {
      "_id": "order1",
      "total": 100,
      "customer": "user123",
      "customer@expanded": {
        "_id": "user123",
        "name": "Alice",
        "email": "alice@example.com"
      }
    }
  ]
}
```

### Get Single Entity

**GET** `{basePath}/{EntitySet}('{id}')`

Retrieve a single entity by ID.

```bash
curl http://localhost:8080/odata/users\('123'\)
```

### Create Entity

**POST** `{basePath}/{EntitySet}`

Create a new entity.

```bash
curl -X POST http://localhost:8080/odata/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Charlie","email":"charlie@example.com"}'
```

### Update Entity

**PUT/PATCH** `{basePath}/{EntitySet}('{id}')`

Update an existing entity.

```bash
curl -X PUT http://localhost:8080/odata/users\('123'\) \
  -H "Content-Type: application/json" \
  -d '{"name":"Charlie Updated"}'
```

### Delete Entity

**DELETE** `{basePath}/{EntitySet}('{id}')`

Delete an entity.

```bash
curl -X DELETE http://localhost:8080/odata/users\('123'\)
```

## Batch Operations ($batch)

The OData V4 plugin supports batch requests for executing multiple operations in a single HTTP request. Batch operations can include both read operations and changesets (for transactional writes).

### Batch Request Format

**POST** `{basePath}/$batch`

Batch requests use multipart MIME format with a boundary delimiter.

**Example: Mixed Read and Write Operations**

```http
POST /odata/$batch HTTP/1.1
Content-Type: multipart/mixed; boundary=batch_123

--batch_123
Content-Type: application/http

GET /odata/users HTTP/1.1

--batch_123
Content-Type: application/http

GET /odata/users('user1') HTTP/1.1

--batch_123
Content-Type: multipart/mixed; boundary=changeset_456

--changeset_456
Content-Type: application/http

POST /odata/users HTTP/1.1
Content-Type: application/json

{"name":"Alice","email":"alice@example.com"}

--changeset_456
Content-Type: application/http

POST /odata/projects HTTP/1.1
Content-Type: application/json

{"name":"Project Alpha","owner":"user1"}

--changeset_456--
--batch_123--
```

### Changesets (Atomic Operations)

Changesets are groups of write operations (POST, PATCH, PUT, DELETE) that are executed atomically. Either all operations in a changeset succeed, or all fail and are rolled back.

**Example: Atomic Multi-Entity Creation**

```http
POST /odata/$batch HTTP/1.1
Content-Type: multipart/mixed; boundary=batch_123

--batch_123
Content-Type: multipart/mixed; boundary=changeset_456

--changeset_456
Content-Type: application/http

POST /odata/users HTTP/1.1
Content-Type: application/json

{"name":"Alice","email":"alice@example.com"}

--changeset_456
Content-Type: application/http

POST /odata/users HTTP/1.1
Content-Type: application/json

{"name":"Bob","email":"bob@example.com"}

--changeset_456
Content-Type: application/http

POST /odata/users HTTP/1.1
Content-Type: application/json

{"name":"Charlie","email":"charlie@example.com"}

--changeset_456--
--batch_123--
```

**Atomic Behavior:**
- If any operation in the changeset fails, **all operations are rolled back**
- No partial commits - it's all or nothing
- Ideal for maintaining data consistency

### Enhanced Error Handling

The plugin provides detailed error information when batch operations fail:

**Error Response Format:**

```json
{
  "error": {
    "code": "CHANGESET_FAILED",
    "message": "Changeset operation 2/5 failed: Validation failed for field 'email'",
    "details": {
      "completedOperations": 1,
      "totalOperations": 5,
      "rollbackAttempted": true
    }
  }
}
```

**Error Details:**
- `code` - Error code identifying the failure type
- `message` - Detailed error message including which operation failed
- `details.completedOperations` - Number of operations completed before failure
- `details.totalOperations` - Total number of operations in the changeset
- `details.rollbackAttempted` - Whether rollback was attempted

### Batch Operation Best Practices

1. **Use Changesets for Related Writes**
   - Group related POST/PATCH/DELETE operations in a changeset
   - Ensures data consistency across multiple entities

2. **Separate Read and Write Operations**
   - Put read operations (GET) outside changesets
   - Only write operations (POST, PATCH, PUT, DELETE) should be in changesets

3. **Handle Errors Gracefully**
   - Check for `CHANGESET_FAILED` error code
   - Use the `details` object to understand what failed
   - Implement retry logic if appropriate

4. **Limit Batch Size**
   - Keep batch requests reasonable in size
   - Consider breaking very large batches into multiple requests

**Example: JavaScript Client**

```javascript
async function createMultipleUsers(users) {
  const boundary = `batch_${Date.now()}`;
  const changesetBoundary = `changeset_${Date.now()}`;
  
  let body = '';
  
  // Start changeset
  body += `--${boundary}\r\n`;
  body += `Content-Type: multipart/mixed; boundary=${changesetBoundary}\r\n\r\n`;
  
  // Add each user creation
  users.forEach(user => {
    body += `--${changesetBoundary}\r\n`;
    body += `Content-Type: application/http\r\n\r\n`;
    body += `POST /odata/users HTTP/1.1\r\n`;
    body += `Content-Type: application/json\r\n\r\n`;
    body += JSON.stringify(user) + '\r\n';
  });
  
  // Close changeset and batch
  body += `--${changesetBoundary}--\r\n`;
  body += `--${boundary}--\r\n`;
  
  const response = await fetch('http://localhost:8080/odata/$batch', {
    method: 'POST',
    headers: {
      'Content-Type': `multipart/mixed; boundary=${boundary}`
    },
    body
  });
  
  if (!response.ok) {
    const error = await response.json();
    console.error('Batch operation failed:', error);
    
    if (error.error?.code === 'CHANGESET_FAILED') {
      console.error(`Failed at operation ${error.error.details.completedOperations + 1}`);
      console.error(`Rollback attempted: ${error.error.details.rollbackAttempted}`);
    }
    throw new Error(error.error?.message || 'Batch operation failed');
  }
  
  return response;
}

// Usage
const users = [
  { name: 'Alice', email: 'alice@example.com' },
  { name: 'Bob', email: 'bob@example.com' },
  { name: 'Charlie', email: 'charlie@example.com' }
];

try {
  await createMultipleUsers(users);
  console.log('All users created successfully');
} catch (error) {
  console.error('Failed to create users:', error);
}
```

## Type Mapping

ObjectQL field types are automatically mapped to OData EDM types:

| ObjectQL Type | EDM Type |
|---------------|----------|
| text, textarea, email, url | Edm.String |
| number, currency, percent | Edm.Double |
| autonumber | Edm.Int32 |
| boolean | Edm.Boolean |
| date | Edm.Date |
| datetime | Edm.DateTimeOffset |
| select | Edm.String |
| lookup, master_detail | Edm.String (ID reference) |

## Architecture

This plugin follows the ObjectStack protocol plugin pattern:

1. **RuntimePlugin Interface** - Implements the standard plugin lifecycle
2. **ObjectStackRuntimeProtocol Bridge** - Uses the protocol bridge for all kernel interactions
3. **No Direct DB Access** - All data operations through the bridge layer
4. **Lifecycle Management** - Proper initialization and cleanup

```typescript
export class ODataV4Plugin implements RuntimePlugin {
  async install(ctx: RuntimeContext) {
    // Initialize protocol bridge
    this.protocol = new ObjectStackRuntimeProtocol(ctx.engine);
  }

  async onStart(ctx: RuntimeContext) {
    // Start HTTP server
    // Use this.protocol.getMetaTypes(), this.protocol.findData(), etc.
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
