# @objectql/protocol-odata-v4

OData V4 Protocol Plugin for ObjectStack

## Overview

This plugin provides full OData V4 protocol support for ObjectStack applications. It automatically generates OData metadata (EDMX) from ObjectStack metadata and provides a RESTful API for querying and manipulating data.

## Features

- ✅ **Service Document** (`/`) - Discover available entity sets
- ✅ **Metadata Document** (`/$metadata`) - EDMX schema generation
- ✅ **Entity Queries** - Query entity sets with OData query options
- ✅ **Query Options** - Support for `$filter`, `$select`, `$orderby`, `$top`, `$skip`, `$count`
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
import { ObjectStackKernel } from '@objectstack/runtime';
import { ODataV4Plugin } from '@objectql/protocol-odata-v4';

const kernel = new ObjectStackKernel([
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
