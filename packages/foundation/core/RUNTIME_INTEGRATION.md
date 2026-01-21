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
├── Uses @objectstack/objectql for driver management
├── Extends with hooks, actions, validation, and repository pattern
├── Uses types from @objectstack/spec
└── Re-exports types from @objectstack/runtime
```

### Driver Management Integration

The core package now delegates driver management to `@objectstack/objectql`:

```typescript
import { ObjectQL } from '@objectql/core';

const app = new ObjectQL({
    datasources: {
        default: myDriver
    }
});

// Drivers are managed by @objectstack/objectql internally
await app.init();

// Access the ObjectStack engine for advanced driver management
const stackEngine = app.getStackEngine();
```

### Type Exports

The core package exports types from the runtime packages for API compatibility:

```typescript
// Type exports for driver development
export type { 
  DriverInterface,
  DriverOptions, 
  QueryAST 
} from '@objectstack/spec';

// Type exports for runtime integration
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
- **Driver management via @objectstack/objectql**

The `ObjectQLEngine` from `@objectstack/objectql` is a **simpler, lightweight** implementation suitable for:

- Basic CRUD operations
- Simple driver management
- Minimal runtime overhead

### Driver Management

ObjectQL now wraps drivers to work with the ObjectStack engine:

```typescript
// In @objectql/core
private stackEngine: ObjectStackEngine;

constructor(config: ObjectQLConfig) {
    this.stackEngine = new ObjectStackEngine({});
    
    // Wrap and register drivers
    for (const [name, driver] of Object.entries(config.datasources)) {
        const wrappedDriver = this.wrapDriver(name, driver);
        this.stackEngine.registerDriver(wrappedDriver, name === 'default');
    }
}
```

### Custom Driver Development

To build custom drivers for ObjectStack:

1. **Implement DriverInterface from @objectstack/spec**:

```typescript
import { DriverInterface, QueryAST } from '@objectstack/spec';

export class MyCustomDriver implements DriverInterface {
    name = 'MyDriver';
    version = '1.0.0';
    
    async connect() { }
    async disconnect() { }
    async find(object: string, query: QueryAST) { }
    async create(object: string, data: any) { }
    async update(object: string, id: string, data: any) { }
    async delete(object: string, id: string) { }
}
```

2. **Register with ObjectQL**:

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
import type { DriverInterface, QueryAST } from '@objectql/core';

// Use types for compile-time checking
function processQuery(driver: DriverInterface, query: QueryAST) {
  // Your code here
}
```

## Migration Path

If you want to use the simpler `@objectstack/objectql` implementation:

1. Install it directly: `npm install @objectstack/objectql`
2. Import from the package: `import { ObjectQL } from '@objectstack/objectql'`
3. Note: You'll lose hooks, actions, validation, and other advanced features

## Compatibility

- **@objectstack/spec@0.1.2**: Introduces `DriverInterface` with standard query format
- **@objectstack/objectql@0.1.1**: Provides driver registration and management
- **Backward Compatible**: All existing ObjectQL APIs remain unchanged
- **Tests**: All tests pass successfully, confirming backward compatibility

## Future Plans

The integration with `@objectstack/objectql` enables:

1. Standardized driver interface across the ObjectStack ecosystem
2. Plugin system for extending driver capabilities
3. Unified driver management across multiple packages
4. Future: Driver marketplace and discovery

## Related Documentation

- [ObjectQL Types](../types/README.md)
- [ObjectQL Platform Node](../platform-node/README.md)
- [@objectstack/spec on npm](https://www.npmjs.com/package/@objectstack/spec)
- [@objectstack/runtime on npm](https://www.npmjs.com/package/@objectstack/runtime)
- [@objectstack/objectql on npm](https://www.npmjs.com/package/@objectstack/objectql)
