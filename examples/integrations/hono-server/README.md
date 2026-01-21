# ObjectQL Hono Server Example

This example demonstrates how to integrate ObjectQL with the [Hono](https://hono.dev/) web framework.

## Features

- ⚡ Fast and lightweight Hono framework
- 🔌 ObjectQL plugin-based architecture
- 📡 JSON-RPC, REST, and Metadata APIs
- 🌐 CORS support
- 💾 SQLite in-memory database

## Quick Start

```bash
# Install dependencies
pnpm install

# Start the server
pnpm dev
```

The server will start on http://localhost:3005

## API Endpoints

### JSON-RPC
```bash
curl -X POST http://localhost:3005/api/objectql \
  -H "Content-Type: application/json" \
  -d '{"op": "find", "object": "user", "args": {}}'
```

### REST API
```bash
# List all users
curl http://localhost:3005/api/data/user

# Get a specific user
curl http://localhost:3005/api/data/user/1

# Create a user
curl -X POST http://localhost:3005/api/data/user \
  -H "Content-Type: application/json" \
  -d '{"name": "John", "email": "john@example.com", "age": 30, "status": "active"}'
```

### Metadata API
```bash
# List all objects
curl http://localhost:3005/api/metadata/object

# Get user object schema
curl http://localhost:3005/api/metadata/object/user
```

## Why Hono?

Hono is a modern, ultra-lightweight web framework that works on any JavaScript runtime (Node.js, Cloudflare Workers, Deno, Bun). It's perfect for:

- Edge computing deployments
- Serverless functions
- High-performance APIs
- TypeScript-first development

## Architecture

This example uses the `@objectql/plugin-server` package which provides a clean adapter for Hono:

```typescript
import { createHonoAdapter } from '@objectql/plugin-server';

const server = new Hono();
const objectqlHandler = createHonoAdapter(app);
server.all('/api/*', objectqlHandler);
```

## Learn More

- [Hono Documentation](https://hono.dev/)
- [ObjectQL Documentation](https://objectql.org)
- [@objectql/plugin-server](../../packages/plugins/server)
