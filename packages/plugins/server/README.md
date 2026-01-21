# @objectql/plugin-server

HTTP server plugin for ObjectQL. Provides Express, Hono, and custom HTTP server support with JSON-RPC, REST, GraphQL, and Metadata APIs.

## Installation

```bash
npm install @objectql/plugin-server
```

## Usage

### As a Plugin

```typescript
import { ObjectQL } from '@objectql/core';
import { ServerPlugin } from '@objectql/plugin-server';

const app = new ObjectQL({
    datasources: { /* ... */ },
    plugins: [
        new ServerPlugin({
            port: 3000,
            autoStart: true,
            enableREST: true,
            enableRPC: true,
            enableMetadata: true
        })
    ]
});

await app.init();
```

### With Hono Framework

```typescript
import { Hono } from 'hono';
import { ObjectQL } from '@objectql/core';
import { createHonoAdapter } from '@objectql/plugin-server/adapters/hono';

const app = new ObjectQL({ /* ... */ });
await app.init();

const server = new Hono();
const objectqlHandler = createHonoAdapter(app);

server.all('/api/*', objectqlHandler);

export default server;
```

### With Express

```typescript
import express from 'express';
import { ObjectQL } from '@objectql/core';
import { createNodeHandler } from '@objectql/plugin-server';

const app = new ObjectQL({ /* ... */ });
await app.init();

const server = express();
const objectqlHandler = createNodeHandler(app);

server.all('/api/*', objectqlHandler);

server.listen(3000);
```

## Features

### JSON-RPC API
- Protocol-first approach
- Supports all ObjectQL operations
- Type-safe requests and responses

### REST API
- Standard HTTP methods (GET, POST, PUT, DELETE)
- RESTful resource endpoints
- Query parameter support

### GraphQL API
- Auto-generated schema from ObjectQL metadata
- Support for queries and mutations
- Introspection support

### Metadata API
- Explore object schemas
- Discover available operations
- Runtime schema inspection

### File Upload/Download
- Single and batch file uploads
- Secure file storage
- File download support

## Configuration Options

```typescript
interface ServerPluginOptions {
    port?: number;                    // Default: 3000
    host?: string;                    // Default: 'localhost'
    routes?: ApiRouteConfig;          // Custom route configuration
    fileStorage?: IFileStorage;       // Custom file storage
    enableGraphQL?: boolean;          // Default: false
    enableREST?: boolean;             // Default: true
    enableMetadata?: boolean;         // Default: true
    enableRPC?: boolean;              // Default: true
    autoStart?: boolean;              // Default: false
    middleware?: Function[];          // Custom middleware
}
```

## API Routes

Default routes (customizable):
- JSON-RPC: `/api/objectql`
- REST: `/api/data`
- GraphQL: `/api/graphql`
- Metadata: `/api/metadata`
- Files: `/api/files`

## License

MIT
