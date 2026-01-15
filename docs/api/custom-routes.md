# Custom API Routes Configuration

## Overview

ObjectQL allows you to configure custom API route paths during initialization instead of using hardcoded default paths. This feature provides flexibility for:

- **API Versioning**: Use paths like `/v1/api`, `/v2/api`
- **Custom Naming**: Use domain-specific naming like `/resources`, `/schema`
- **Multiple API Instances**: Run multiple ObjectQL instances with different paths
- **Integration Requirements**: Align with existing API structures

## Default Routes

By default, ObjectQL uses these API paths:

| Endpoint Type | Default Path | Description |
|--------------|--------------|-------------|
| JSON-RPC | `/api/objectql` | Remote procedure calls |
| REST Data API | `/api/data` | CRUD operations on objects |
| Metadata API | `/api/metadata` | Schema and metadata information |
| File Operations | `/api/files` | File upload and download |

## Configuration

### Basic Usage

Configure custom routes when creating handlers:

```typescript
import { createNodeHandler, createRESTHandler, createMetadataHandler } from '@objectql/server';

// Define custom routes
const customRoutes = {
    rpc: '/v1/rpc',
    data: '/v1/resources',
    metadata: '/v1/schema',
    files: '/v1/storage'
};

// Create handlers with custom routes
const nodeHandler = createNodeHandler(app, { routes: customRoutes });
const restHandler = createRESTHandler(app, { routes: customRoutes });
const metadataHandler = createMetadataHandler(app, { routes: customRoutes });
```

### Route Configuration Interface

```typescript
interface ApiRouteConfig {
    /** 
     * Base path for JSON-RPC endpoint 
     * @default '/api/objectql'
     */
    rpc?: string;
    
    /** 
     * Base path for REST data API 
     * @default '/api/data'
     */
    data?: string;
    
    /** 
     * Base path for metadata API 
     * @default '/api/metadata'
     */
    metadata?: string;
    
    /** 
     * Base path for file operations 
     * @default '/api/files'
     */
    files?: string;
}
```

## Complete Example

```typescript
import express from 'express';
import { ObjectQL } from '@objectql/core';
import { SqlDriver } from '@objectql/driver-sql';
import { createNodeHandler, createRESTHandler, createMetadataHandler } from '@objectql/server';

async function main() {
    // 1. Initialize ObjectQL
    const app = new ObjectQL({
        datasources: {
            default: new SqlDriver({
                client: 'sqlite3',
                connection: { filename: ':memory:' },
                useNullAsDefault: true
            })
        }
    });
    
    // Register your objects
    app.registerObject({
        name: 'user',
        label: 'User',
        fields: {
            name: { type: 'text', label: 'Name' },
            email: { type: 'email', label: 'Email' }
        }
    });
    
    await app.init();
    
    // 2. Define custom API routes
    const customRoutes = {
        rpc: '/v1/rpc',
        data: '/v1/resources',
        metadata: '/v1/schema',
        files: '/v1/storage'
    };
    
    // 3. Create handlers with custom routes
    const nodeHandler = createNodeHandler(app, { routes: customRoutes });
    const restHandler = createRESTHandler(app, { routes: customRoutes });
    const metadataHandler = createMetadataHandler(app, { routes: customRoutes });
    
    // 4. Setup Express with custom paths
    const server = express();
    
    server.all('/v1/rpc*', nodeHandler);
    server.all('/v1/resources/*', restHandler);
    server.all('/v1/schema*', metadataHandler);
    
    server.listen(3000, () => {
        console.log('🚀 Server running with custom routes');
        console.log('  JSON-RPC:  http://localhost:3000/v1/rpc');
        console.log('  REST API:  http://localhost:3000/v1/resources');
        console.log('  Metadata:  http://localhost:3000/v1/schema');
        console.log('  Files:     http://localhost:3000/v1/storage');
    });
}

main().catch(console.error);
```

## Using Custom Routes

### JSON-RPC Endpoint

**Default:** `POST /api/objectql`
**Custom:** `POST /v1/rpc`

```bash
curl -X POST http://localhost:3000/v1/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "op": "find",
    "object": "user",
    "args": {}
  }'
```

### REST Data API

**Default:** `/api/data/:object`
**Custom:** `/v1/resources/:object`

```bash
# List users
curl http://localhost:3000/v1/resources/user

# Get specific user
curl http://localhost:3000/v1/resources/user/123

# Create user
curl -X POST http://localhost:3000/v1/resources/user \
  -H "Content-Type: application/json" \
  -d '{"name": "Alice", "email": "alice@example.com"}'

# Update user
curl -X PUT http://localhost:3000/v1/resources/user/123 \
  -H "Content-Type: application/json" \
  -d '{"name": "Alice Updated"}'

# Delete user
curl -X DELETE http://localhost:3000/v1/resources/user/123
```

### Metadata API

**Default:** `/api/metadata`
**Custom:** `/v1/schema`

```bash
# List all objects
curl http://localhost:3000/v1/schema/objects

# Get object details
curl http://localhost:3000/v1/schema/object/user

# Get field metadata
curl http://localhost:3000/v1/schema/object/user/fields/email

# List object actions
curl http://localhost:3000/v1/schema/object/user/actions
```

### File Operations

**Default:** `/api/files`
**Custom:** `/v1/storage`

```bash
# Upload file
curl -X POST http://localhost:3000/v1/storage/upload \
  -F "file=@myfile.pdf" \
  -F "object=document" \
  -F "field=attachment"

# Download file
curl http://localhost:3000/v1/storage/abc123
```

## Client SDK Configuration

The ObjectQL SDK clients also support custom route configuration:

### Data API Client

```typescript
import { DataApiClient } from '@objectql/sdk';

const client = new DataApiClient({
    baseUrl: 'http://localhost:3000',
    dataPath: '/v1/resources'  // Custom data path
});

const users = await client.list('user');
```

### Metadata API Client

```typescript
import { MetadataApiClient } from '@objectql/sdk';

const client = new MetadataApiClient({
    baseUrl: 'http://localhost:3000',
    metadataPath: '/v1/schema'  // Custom metadata path
});

const objects = await client.listObjects();
```

### Remote Driver

```typescript
import { RemoteDriver } from '@objectql/sdk';

const driver = new RemoteDriver(
    'http://localhost:3000',
    '/v1/rpc'  // Custom RPC path
);
```

## Common Use Cases

### API Versioning

Support multiple API versions simultaneously:

```typescript
// API v1
const v1Routes = {
    rpc: '/api/v1/rpc',
    data: '/api/v1/data',
    metadata: '/api/v1/metadata',
    files: '/api/v1/files'
};

// API v2
const v2Routes = {
    rpc: '/api/v2/rpc',
    data: '/api/v2/data',
    metadata: '/api/v2/metadata',
    files: '/api/v2/files'
};

const v1Handler = createNodeHandler(appV1, { routes: v1Routes });
const v2Handler = createNodeHandler(appV2, { routes: v2Routes });

server.all('/api/v1/*', v1Handler);
server.all('/api/v2/*', v2Handler);
```

### Domain-Specific Naming

Use business-friendly terminology:

```typescript
const businessRoutes = {
    rpc: '/business/operations',
    data: '/business/entities',
    metadata: '/business/definitions',
    files: '/business/documents'
};
```

### Multi-Tenant Applications

Isolate APIs per tenant:

```typescript
app.use('/:tenantId/api/*', (req, res, next) => {
    const tenantRoutes = {
        rpc: `/${req.params.tenantId}/api/rpc`,
        data: `/${req.params.tenantId}/api/data`,
        metadata: `/${req.params.tenantId}/api/metadata`,
        files: `/${req.params.tenantId}/api/files`
    };
    
    const handler = createNodeHandler(
        getTenantApp(req.params.tenantId),
        { routes: tenantRoutes }
    );
    
    handler(req, res);
});
```

## Backward Compatibility

All handlers maintain backward compatibility:

- If no `routes` option is provided, default paths are used
- Existing applications continue to work without changes
- Migration to custom routes is opt-in

```typescript
// This still works with default routes
const handler = createNodeHandler(app);  
// Uses /api/objectql, /api/data, /api/metadata, /api/files
```

## Best Practices

1. **Consistency**: Use the same route structure across all handlers
2. **Documentation**: Document your custom routes for API consumers
3. **Versioning**: Consider using versioned paths for production APIs
4. **Testing**: Test custom routes thoroughly before deployment
5. **Migration**: Plan gradual migration if changing existing routes

## Related Documentation

- [REST API Reference](./rest.md)
- [JSON-RPC API Reference](./json-rpc.md)
- [Metadata API Reference](./metadata.md)
- [Client SDK Guide](./client-sdk.md)
