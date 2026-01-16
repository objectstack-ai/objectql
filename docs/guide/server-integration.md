# Server Integration

ObjectQL is designed to be framework-agnostic. While it can be used directly as a library, we provide a standard `@objectql/server` package to expose your application via HTTP.

## The `@objectql/server` Package

This package provides a standardized way to handle HTTP requests, similar to libraries like `better-auth`. It receives a standard JSON request body and routes it to the correct internal ObjectQL operation (`find`, `create`, `action`, etc.).

### Installation

```bash
pnpm add @objectql/server
```

## Supported Frameworks

### 1. Node.js (Raw HTTP)

You can mount the handler directly on a native Node.js `http.Server`.

```typescript
import { createNodeHandler } from '@objectql/server';
import { app } from './my-objectql-app'; // Your ObjectQL instance
import { createServer } from 'http';

const server = createServer(createNodeHandler(app));
server.listen(3000);
```

### 2. Express

Mount ObjectQL on any route path.

```typescript
import express from 'express';
import { createNodeHandler } from '@objectql/server';
import { app } from './my-objectql-app';

const server = express();
// ObjectQL server adapter handles body parsing automatically,
// but works fine if you already used express.json()
server.all('/api/objectql', createNodeHandler(app));

server.listen(3000);
```

### 3. Next.js (Pages Router)

```typescript
// pages/api/objectql.ts
import { createNodeHandler } from '@objectql/server';
import { app } from '../../lib/store';

export const config = {
  api: {
    bodyParser: false, // Let ObjectQL handle it, or true if you prefer
  },
};

export default createNodeHandler(app);
```

## The Protocol

The server exposes a single endpoint that accepts POST requests with a JSON body defined by `ObjectQLRequest`:

```typescript
interface ObjectQLRequest {
    op: 'find' | 'findOne' | 'create' | 'update' | 'delete' | 'count' | 'action';
    object: string;
    args: any;
    user?: any; // For passing authentication context
}
```

## 📖 OpenAPI Support

`@objectql/server` automatically generates an OpenAPI 3.0 specification from your registered schema.
This powers the built-in **API Docs** (available at `/docs` in CLI mode).

You can access the raw spec by appending `/openapi.json` to your handler's mount path.

**Example URLs:**
*   **CLI Serve:** `http://localhost:3000/openapi.json`
*   **Express (mounted at /api/objectql):** `http://localhost:3000/api/objectql/openapi.json`
*   **Next.js (pages/api/objectql.ts):** `http://localhost:3000/api/objectql/openapi.json`

This JSON file describes your data objects as "Virtual REST" endpoints (`GET /user`, `POST /user`, etc.), allowing you to easily import them into **Scalar**, **Swagger UI**, **Postman**, or other API tools for visualization and testing.

## Example Usage

**Example (cURL):**

```bash
curl -X POST http://localhost:3000/api/objectql \
  -H "Content-Type: application/json" \
  -d '{
    "op": "create",
    "object": "User",
    "args": {
      "data": { "name": "Alice", "email": "alice@example.com" }
    }
  }'
```

## Dev Server

For rapid prototyping, `@objectql/cli` provides a built-in dev server.

```bash
# Serves the current directory schema on port 3000
objectql serve
```

See [CLI Documentation](../package/cli) for more details.
