# ObjectStack Runtime Integration

This document explains the integration of `@objectstack/runtime` and `@objectstack/objectql` into the ObjectQL platform.

## Overview

As of version 3.0.1, ObjectQL core integrates with the latest ObjectStack runtime packages:

- **@objectstack/spec@0.1.2**: Protocol specification with TypeScript interfaces
- **@objectstack/objectql@0.1.1**: Core ObjectQL engine with basic driver management
- **@objectstack/runtime@0.1.1**: Runtime kernel with application lifecycle orchestration

## Architecture

### Package Relationship

```
@objectql/core (this package)
├── Extends/complements @objectstack/objectql
├── Uses types from @objectstack/spec
└── Re-exports types from @objectstack/runtime
```

### Type Exports

The core package exports types from the runtime packages for API compatibility:

```typescript
// Type-only exports to avoid runtime issues
export type { 
  ObjectStackKernel, 
  ObjectStackRuntimeProtocol 
} from '@objectstack/runtime';

export type { 
  ObjectQL as ObjectQLEngine, 
  SchemaRegistry 
} from '@objectstack/objectql';
```

## Implementation Details

### Current ObjectQL vs. ObjectQLEngine

The current `ObjectQL` class in this package is a **production-ready, feature-rich** implementation that includes:

- Full metadata registry
- Hooks system
- Actions system
- Validation engine
- Repository pattern
- Formula engine
- AI integration

The `ObjectQLEngine` from `@objectstack/objectql` is a **simpler, lightweight** implementation suitable for:

- Basic CRUD operations
- Simple driver management
- Minimal runtime overhead

### Why Type-Only Exports?

The `@objectstack/objectql` package currently has a configuration issue where it points to source files instead of compiled dist files. To avoid runtime errors, we use **type-only imports** which provide TypeScript type checking without executing the runtime code.

## Usage

### Using the Full-Featured ObjectQL (Recommended)

```typescript
import { ObjectQL } from '@objectql/core';

const app = new ObjectQL({
  registry: new MetadataRegistry(),
  datasources: { default: driver }
});

await app.init();
const ctx = app.createContext({ userId: 'user123' });
const repo = ctx.object('todo');
const items = await repo.find({});
```

### Using Type Definitions from Runtime

```typescript
import type { ObjectStackKernel, SchemaRegistry } from '@objectql/core';

// Use types for compile-time checking
function processKernel(kernel: ObjectStackKernel) {
  // Your code here
}
```

## Migration Path

If you want to use the simpler `@objectstack/objectql` implementation:

1. Install it directly: `npm install @objectstack/objectql`
2. Import from the package: `import { ObjectQL } from '@objectstack/objectql'`
3. Note: Ensure the package is properly built before use

## Compatibility

- **@objectstack/spec@0.1.2**: Introduces `searchable` field requirement on FieldConfig
- **Backward Compatible**: All existing ObjectQL APIs remain unchanged
- **Tests**: 236 tests pass successfully, confirming backward compatibility

## Future Plans

Once the `@objectstack/objectql` package configuration is fixed, we may:

1. Use it as a base class for our ObjectQL implementation
2. Move framework-specific features to plugins
3. Provide both lightweight and full-featured options

## Related Documentation

- [ObjectQL Types](../types/README.md)
- [ObjectQL Platform Node](../platform-node/README.md)
- [@objectstack/spec on npm](https://www.npmjs.com/package/@objectstack/spec)
- [@objectstack/runtime on npm](https://www.npmjs.com/package/@objectstack/runtime)
