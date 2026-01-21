# @objectql/server

> **⚠️ DEPRECATED**: This package has been replaced by `@objectql/plugin-server`.
> 
> This package now serves as a compatibility layer that re-exports from `@objectql/plugin-server`.
> Please migrate to `@objectql/plugin-server` for the latest features and updates.

## Migration Guide

### From @objectql/server to @objectql/plugin-server

**Old way (still works, but deprecated):**

```typescript
import { createNodeHandler } from '@objectql/server';

const handler = createNodeHandler(app);
```

**New way (recommended):**

```typescript
import { createNodeHandler } from '@objectql/plugin-server';

const handler = createNodeHandler(app);
```

### Using the Plugin Directly

For new projects, use the plugin-based approach:

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
            enableRPC: true
        })
    ]
});

await app.init();
```

### Hono Framework Support

The new plugin package supports modern frameworks like Hono:

```typescript
import { Hono } from 'hono';
import { createHonoAdapter } from '@objectql/plugin-server';

const server = new Hono();
const objectqlHandler = createHonoAdapter(app);
server.all('/api/*', objectqlHandler);
```

## Why the Change?

The server functionality has been refactored into a plugin-based architecture to:

1. **Enable Framework Agnostic Design**: Support multiple web frameworks (Express, Hono, Fastify, etc.)
2. **Improve Modularity**: Server capabilities are now optional plugins
3. **Support Edge Computing**: Hono adapter enables deployment to edge runtimes
4. **Better Extensibility**: Easier to add new adapters and features

## Installation

For new projects, install the plugin package directly:

```bash
pnpm add @objectql/plugin-server
```

For legacy support (compatibility layer):

```bash
pnpm add @objectql/server
```

## Documentation

For complete documentation, see:
- [@objectql/plugin-server README](../../plugins/server/README.md)
- [Examples](../../../examples/integrations/)

## License

MIT
