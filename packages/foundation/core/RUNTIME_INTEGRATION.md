# ObjectStack Runtime Integration

This document explains the integration of `@objectstack/runtime` and `@objectstack/objectql` into the ObjectQL platform.

## Overview

As of version 3.0.1, ObjectQL core natively uses the ObjectStack runtime packages:

- **@objectstack/spec@0.1.2**: Protocol specification with standard `DriverInterface`
- **@objectstack/objectql@0.1.1**: Core ObjectQL engine with driver management
- **@objectstack/runtime@0.1.1**: Runtime kernel with application lifecycle orchestration

## Architecture

### Package Relationship

```
@objectql/core (this package)
├── Uses @objectstack/objectql for driver management
├── Natively uses @objectstack/spec.DriverInterface (no wrapper)
└── Re-exports types from @objectstack/runtime
```

### Driver Management Integration

**Breaking Change (v3.0.1):** The core package now **natively uses** `DriverInterface` from `@objectstack/spec`:

```typescript
import { ObjectQL } from '@objectql/core';
import type { DriverInterface } from '@objectstack/spec';

// Drivers must implement DriverInterface from @objectstack/spec
const app = new ObjectQL({
    datasources: {
        default: myDriver  // Must be DriverInterface
    }
});

await app.init();
```

### Type Exports

The core package exports types from the ObjectStack packages:

```typescript
// Driver development types
export type { 
  DriverInterface,
  DriverOptions, 
  QueryAST 
} from '@objectstack/spec';

// Runtime integration types
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
- **Native driver management via @objectstack/objectql**

The `ObjectQLEngine` from `@objectstack/objectql` is a **simpler, lightweight** implementation suitable for:

- Basic CRUD operations
- Simple driver management
- Minimal runtime overhead

### Driver Management (No Compatibility Layer)

ObjectQL now directly uses drivers conforming to `@objectstack/spec.DriverInterface`:

```typescript
// In @objectql/core
import { DriverInterface } from '@objectstack/spec';

private datasources: Record<string, DriverInterface> = {};
private stackEngine: ObjectStackEngine;

constructor(config: ObjectQLConfig) {
    this.stackEngine = new ObjectStackEngine({});
    
    // Register drivers directly (no wrapping)
    for (const [name, driver] of Object.entries(config.datasources)) {
        this.stackEngine.registerDriver(driver, name === 'default');
    }
}
```

### Simplified Lifecycle

The ObjectStack engine handles all driver lifecycle management:

```typescript
async close() {
    // ObjectStack engine manages all driver disconnect logic
    await this.stackEngine.destroy();
}
```

### Custom Driver Development

To build custom drivers for ObjectStack, implement `DriverInterface` from `@objectstack/spec`:

```typescript
import { DriverInterface, QueryAST } from '@objectstack/spec';

export class MyCustomDriver implements DriverInterface {
    name = 'MyDriver';
    version = '1.0.0';
    
    async connect() {
        // Initialize connection
    }
    
    async disconnect() {
        // Close connection
    }
    
    async find(object: string, query: QueryAST, options?: any) {
        // Query implementation
        return [];
    }
    
    async create(object: string, data: any, options?: any) {
        // Create implementation
        return data;
    }
    
    async update(object: string, id: string, data: any, options?: any) {
        // Update implementation
        return data;
    }
    
    async delete(object: string, id: string, options?: any) {
        // Delete implementation
    }
}
```

Register with ObjectQL:

```typescript
import { ObjectQL } from '@objectql/core';
import { MyCustomDriver } from './my-driver';

const app = new ObjectQL({
    datasources: {
        default: new MyCustomDriver()
    }
});

// Or register dynamically
app.registerDriver('mydb', new MyCustomDriver(), false);
```

## Breaking Changes

### v3.0.1: Native DriverInterface Adoption

**What Changed:**
- `ObjectQLConfig.datasources` now requires `Record<string, DriverInterface>` (from `@objectstack/spec`)
- Removed compatibility wrapper for old `Driver` type
- `app.registerDriver()` now accepts `DriverInterface` instead of legacy `Driver`
- `app.datasource()` now returns `DriverInterface`
- Driver lifecycle is fully managed by ObjectStack engine

**Migration Guide:**

Old code (deprecated):
```typescript
import { Driver } from '@objectql/types';

class MyDriver implements Driver {
    // Old Driver interface
}
```

New code (required):
```typescript
import { DriverInterface, QueryAST } from '@objectstack/spec';

class MyDriver implements DriverInterface {
    name = 'MyDriver';
    version = '1.0.0';
    
    async connect() { }
    async disconnect() { }
    async find(object: string, query: QueryAST, options?: any) { }
    async create(object: string, data: any, options?: any) { }
    async update(object: string, id: string, data: any, options?: any) { }
    async delete(object: string, id: string, options?: any) { }
}
```

## Usage

### Using the Full-Featured ObjectQL (Recommended)

```typescript
import { ObjectQL } from '@objectql/core';
import { MemoryDriver } from '@objectql/driver-memory';

const app = new ObjectQL({
  datasources: { default: new MemoryDriver() }
});

await app.init();
const ctx = app.createContext({ userId: 'user123' });
const repo = ctx.object('todo');
const items = await repo.find({});
```

### Using Type Definitions

```typescript
import type { DriverInterface, QueryAST } from '@objectql/core';

// Use types for compile-time checking (type-only import)
function validateQuery(query: QueryAST): boolean {
  return query.object !== undefined;
}
```

## Compatibility

- **@objectstack/spec@0.1.2**: Standard `DriverInterface` protocol
- **@objectstack/objectql@0.1.1**: Provides driver registration and lifecycle management
- **Breaking Change**: Old `Driver` type from `@objectql/types` is no longer supported
- **Tests**: All tests updated to use `DriverInterface`

## Future Plans

The native integration with `@objectstack/objectql` enables:

1. Standardized driver interface across the ObjectStack ecosystem
2. Plugin system for extending driver capabilities
3. Unified driver management across multiple packages
4. Driver marketplace and discovery

## Related Documentation

- [ObjectQL Types](../types/README.md)
- [ObjectQL Platform Node](../platform-node/README.md)
- [@objectstack/spec on npm](https://www.npmjs.com/package/@objectstack/spec)
- [@objectstack/runtime on npm](https://www.npmjs.com/package/@objectstack/runtime)
- [@objectstack/objectql on npm](https://www.npmjs.com/package/@objectstack/objectql)
