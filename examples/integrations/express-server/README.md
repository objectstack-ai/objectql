# Express Server Example - Migrated to @objectstack/runtime Pattern

This example demonstrates the migration from the legacy ObjectQL initialization pattern to the modern @objectstack/runtime pattern.

## What Changed

### Before (Legacy Pattern)
```typescript
// ❌ Old Pattern
import express from 'express';
import { ObjectQL } from '@objectql/core';
import { ObjectLoader } from '@objectql/platform-node';
import { createNodeHandler } from '@objectql/server';

const app = new ObjectQL({ datasources: {...} });
const loader = new ObjectLoader(app.metadata);
loader.load(rootDir); // Loads *.object.yml files

app.init().then(() => {
  const server = express();
  server.all('/api/objectql*', createNodeHandler(app));
  server.listen(3004);
});
```

### After (Runtime Pattern)
```typescript
// ✅ New Pattern
import { ObjectStackKernel } from '@objectstack/runtime';
import { ObjectQLPlugin } from '@objectql/core';

const appConfig = {
  name: 'my-app',
  objects: {
    User: { name: 'User', fields: {...} },
    Task: { name: 'Task', fields: {...} }
  }
};

const kernel = new ObjectStackKernel([
  appConfig,
  new SqlDriver({...}),
  new ObjectQLPlugin(),
  new JSONRPCPlugin({ port: 3004 }),
  new GraphQLPlugin({ port: 4000 })
]);

await kernel.start();
```

## Key Improvements

1. **Declarative Configuration**: Object schemas are defined as TypeScript/JavaScript objects instead of YAML files
2. **Plugin Architecture**: Protocol support (JSON-RPC, GraphQL, OData) via plugins
3. **Micro-Kernel Pattern**: All components (apps, drivers, plugins) registered uniformly
4. **No File I/O**: No file system dependencies - works in any JavaScript environment

## Migration Checklist

- [x] Convert `*.object.yml` files to TypeScript configuration objects
- [x] Remove `@objectql/platform-node` dependency (ObjectLoader)
- [x] Remove `@objectql/server` dependency (createNodeHandler, createRESTHandler)
- [x] Remove `express` dependency  
- [x] Add protocol plugins (`@objectql/protocol-json-rpc`, `@objectql/protocol-graphql`)
- [x] Update initialization to use ObjectStackKernel pattern

## Current Status

✅ **Migration Complete** - This example now uses the modern @objectstack/runtime pattern with the ObjectStackKernel.

## Run

```bash
pnpm install
pnpm build
pnpm start
```

## Learn More

- [Micro-Kernel Architecture](../../../MICRO_KERNEL_ARCHITECTURE.md)
- [Protocol Plugins](../../../packages/protocols/README.md)
- [Multi-Protocol Server Example](../../protocols/multi-protocol-server/)
