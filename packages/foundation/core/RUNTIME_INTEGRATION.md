# ObjectStack Runtime Integration

This document explains the integration of `@objectstack/runtime` and `@objectstack/objectql` into the ObjectQL platform.

## Overview

As of version 4.0.0, ObjectQL core uses the ObjectStack runtime packages with plugin architecture:

- **@objectstack/spec@0.2.0**: Protocol specification with standard `DriverInterface`
- **@objectstack/objectql@0.2.0**: Core ObjectQL engine with driver management
- **@objectstack/runtime@0.2.0**: Runtime kernel with application lifecycle orchestration and plugin system

## Architecture

### Package Relationship

```
@objectql/core (this package)
├── Wraps ObjectStackKernel from @objectstack/runtime
├── Implements ObjectQLPlugin for enhanced features
├── Uses @objectstack/objectql for driver management
├── Natively uses @objectstack/spec.DriverInterface (no wrapper)
└── Re-exports types from @objectstack/runtime
```

### Plugin Architecture (v4.0.0)

**Breaking Change (v4.0.0):** The core package now **wraps `ObjectStackKernel`** and uses a plugin architecture:

```typescript
import { ObjectQL, ObjectQLPlugin } from '@objectql/core';
import type { DriverInterface } from '@objectstack/spec';

// ObjectQL now wraps ObjectStackKernel internally
const app = new ObjectQL({
    datasources: {
        default: myDriver  // Must be DriverInterface
    }
});

// Access the kernel if needed
const kernel = app.getKernel();

await app.init(); // This calls kernel.start() internally
```

### ObjectQLPlugin

The new `ObjectQLPlugin` class implements the `RuntimePlugin` interface from `@objectstack/runtime`:

```typescript
import { ObjectQLPlugin, ObjectQLPluginConfig } from '@objectql/core';

// Configure the plugin
const plugin = new ObjectQLPlugin({
    enableRepository: true,
    enableValidator: true,
    enableFormulas: true,
    enableAI: true
});

// The plugin is automatically registered when you create an ObjectQL instance
const app = new ObjectQL({ datasources: {} });
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
- **Wraps ObjectStackKernel for plugin architecture**
- **Native driver management via @objectstack/objectql**

The `ObjectQLEngine` from `@objectstack/objectql` is a **simpler, lightweight** implementation suitable for:

- Basic CRUD operations
- Simple driver management
- Minimal runtime overhead

### Kernel Integration

ObjectQL now wraps the `ObjectStackKernel` to provide plugin architecture and lifecycle management:

```typescript
// In @objectql/core
import { ObjectStackKernel } from '@objectstack/runtime';
import { ObjectQLPlugin } from './plugin';

export class ObjectQL implements IObjectQL {
    private kernel: ObjectStackKernel;
    private kernelPlugins: any[] = [];
    
    constructor(config: ObjectQLConfig) {
        // Add the ObjectQL plugin to provide enhanced features
        this.kernelPlugins.push(new ObjectQLPlugin());
        
        // Create the kernel instance
        this.kernel = new ObjectStackKernel(this.kernelPlugins);
    }
    
    async init() {
        console.log('[ObjectQL] Initializing with ObjectStackKernel...');
        
        // Start the kernel first - this will install and start all plugins
        await this.kernel.start();
        
        // Continue with legacy initialization...
    }
    
    /**
     * Get the underlying ObjectStackKernel instance
     * for advanced usage scenarios
     */
    getKernel(): ObjectStackKernel {
        return this.kernel;
    }
}
```

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

### v4.0.0: Plugin Architecture

**What Changed:**
- `ObjectQL` now wraps `ObjectStackKernel` from `@objectstack/runtime`
- New `ObjectQLPlugin` class implements `RuntimePlugin` interface
- Initialization process now calls `kernel.start()` which installs and starts all plugins
- Dependencies updated to `@objectstack/*@0.2.0`
- New `getKernel()` method provides access to the underlying kernel
- **Removed legacy plugin support** - all plugins must now implement the `RuntimePlugin` interface

**Migration Guide:**

The ObjectQL API remains the same:
```typescript
import { ObjectQL } from '@objectql/core';
import { MyDriver } from './my-driver';

const app = new ObjectQL({
    datasources: {
        default: new MyDriver()
    }
});

await app.init(); // Calls kernel.start() internally
```

Access the kernel for advanced use cases:
```typescript
const kernel = app.getKernel(); // Must call after init()
```

**Plugin Migration:**

Old plugins with `onEnable` hook are no longer supported. Migrate to `RuntimePlugin`:

```typescript
// Old (no longer supported)
const plugin = {
    id: 'my-plugin',
    onEnable: async (context) => {
        // initialization logic
    }
};

// New (required)
import type { RuntimePlugin, RuntimeContext } from '@objectstack/runtime';

class MyPlugin implements RuntimePlugin {
    name = 'my-plugin';
    
    async install(ctx: RuntimeContext): Promise<void> {
        // installation logic
    }
    
    async onStart(ctx: RuntimeContext): Promise<void> {
        // startup logic
    }
}

const plugin = new MyPlugin();
```

### v3.0.1: Native DriverInterface Adoption

**What Changed:**
- `ObjectQLConfig.datasources` now requires `Record<string, DriverInterface>` (from `@objectstack/spec`)
- Removed compatibility wrapper for old `Driver` type
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
