# Server Plugin Refactor - Implementation Summary

## Overview

This document summarizes the implementation of the server-side refactor using a plugin-based architecture, as requested in the issue: "参考这个包以插件的方式重构服务端，@objectstack/plugin-hono-server" (Refactor the server side using a plugin approach, referencing @objectstack/plugin-hono-server).

## What Was Implemented

### 1. New Plugin Package: `@objectql/plugin-server`

**Location**: `/packages/plugins/server/`

A new plugin package that encapsulates all HTTP server functionality:

- **ServerPlugin Class**: Implements the `ObjectQLPlugin` interface
- **Core Features**:
  - JSON-RPC API support
  - REST API support
  - GraphQL API support
  - Metadata API support
  - File upload/download support
  - Configurable routes
  - Custom middleware support
  - Auto-start capability

**Key Files**:
- `src/plugin.ts` - Main ServerPlugin implementation
- `src/server.ts` - Core ObjectQLServer logic
- `src/adapters/node.ts` - Node.js HTTP adapter
- `src/adapters/rest.ts` - REST API adapter
- `src/adapters/graphql.ts` - GraphQL adapter
- `src/adapters/hono.ts` - **NEW** Hono framework adapter
- `src/metadata.ts` - Metadata API handler
- `src/file-handler.ts` - File upload/download handlers
- `src/storage.ts` - File storage abstraction
- `src/openapi.ts` - OpenAPI spec generation
- `src/types.ts` - Type definitions
- `src/utils.ts` - Utility functions

### 2. Hono Framework Adapter

**Function**: `createHonoAdapter(app: IObjectQL, options?: HonoAdapterOptions)`

The Hono adapter enables ObjectQL to work seamlessly with the Hono web framework:

```typescript
import { Hono } from 'hono';
import { createHonoAdapter } from '@objectql/plugin-server';

const server = new Hono();
const objectqlHandler = createHonoAdapter(app);
server.all('/api/*', objectqlHandler);
```

**Features**:
- Full JSON-RPC API support
- Complete REST API implementation
- Metadata API endpoints
- Error handling with proper HTTP status codes
- Type-safe integration

### 3. Backward Compatibility

The existing `@objectql/server` package remains fully functional:

- All exports preserved
- Added deprecation notice pointing to new plugin
- All existing tests (129 tests) passing
- No breaking changes for existing users

### 4. Example Implementation

**Location**: `/examples/integrations/hono-server/`

A complete working example demonstrating:
- Hono server setup
- ObjectQL integration using the new adapter
- CORS configuration
- Sample data creation
- Web UI with API documentation
- Test commands

## Architecture

### Plugin-Based Design

```
┌─────────────────────────────────────────┐
│         ObjectQL Core                   │
│  (Foundation packages)                  │
└──────────────┬──────────────────────────┘
               │
               │ Plugin Interface
               │
┌──────────────▼──────────────────────────┐
│    @objectql/plugin-server              │
│                                         │
│  ┌─────────────────────────────────┐  │
│  │   ServerPlugin                   │  │
│  │   - setup(app: IObjectQL)       │  │
│  │   - start()                      │  │
│  │   - stop()                       │  │
│  └─────────────────────────────────┘  │
│                                         │
│  ┌─────────────────────────────────┐  │
│  │   Adapters                       │  │
│  │   - Node.js HTTP                 │  │
│  │   - REST                         │  │
│  │   - GraphQL                      │  │
│  │   - Hono ⭐                      │  │
│  └─────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### Usage Patterns

#### Pattern 1: Direct Plugin Usage

```typescript
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

#### Pattern 2: Hono Integration

```typescript
const app = new ObjectQL({ /* ... */ });
await app.init();

const server = new Hono();
const objectqlHandler = createHonoAdapter(app);
server.all('/api/*', objectqlHandler);

serve({ fetch: server.fetch, port: 3000 });
```

#### Pattern 3: Express Integration (Traditional)

```typescript
const app = new ObjectQL({ /* ... */ });
await app.init();

const server = express();
const objectqlHandler = createNodeHandler(app);
server.all('/api/*', objectqlHandler);

server.listen(3000);
```

## Benefits

1. **Modularity**: Server functionality is now a plugin, not core dependency
2. **Extensibility**: Easy to add new framework adapters (Fastify, Koa, etc.)
3. **Flexibility**: Choose your preferred web framework
4. **Edge Computing**: Hono adapter enables deployment to edge runtimes
5. **Type Safety**: Full TypeScript support throughout
6. **Backward Compatible**: Existing code continues to work

## Testing

All tests passing:
- **9 test suites** covering:
  - Node.js adapter
  - REST API
  - GraphQL API
  - Metadata API
  - File uploads
  - OpenAPI generation
  - Custom routes
- **129 tests total**
- Manual testing of Hono server with curl commands ✅

## Files Changed/Added

### New Files (21 files)
- `/packages/plugins/server/*` - Complete plugin package
- `/examples/integrations/hono-server/*` - Hono example

### Modified Files (2 files)
- `/pnpm-workspace.yaml` - Added plugins workspace
- `/packages/runtime/server/src/index.ts` - Added deprecation notice

## Future Enhancements

Potential next steps:
1. Add more framework adapters (Fastify, Koa, etc.)
2. Create plugin-specific tests
3. Add performance benchmarks
4. Create deployment guides for edge platforms
5. Add WebSocket support
6. Create standalone server binary

## References

- Issue: "参考这个包以插件的方式重构服务端，@objectstack/plugin-hono-server"
- Hono Framework: https://hono.dev/
- ObjectQL Plugin System: `/apps/site/content/docs/server/plugins.mdx`
