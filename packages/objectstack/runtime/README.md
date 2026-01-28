# @objectstack/runtime

ObjectStack Runtime - Core Runtime Types and Micro-Kernel

This package contains the runtime type definitions and micro-kernel implementation for the ObjectStack ecosystem.

## Purpose

The runtime package provides:
- **RuntimePlugin interface** - For protocol adapters and feature plugins
- **RuntimeContext interface** - Access to the kernel during plugin execution
- **ObjectStackKernel** - The micro-kernel that orchestrates all components
- **ObjectStackRuntimeProtocol** - Bridge layer between protocols and the kernel

## Micro-Kernel Architecture

The ObjectStack kernel follows the **micro-kernel pattern**, accepting a heterogeneous array of components:

### Component Types

1. **Application Configs** - Application manifests with metadata definitions
2. **Drivers** - Database/storage adapters (SQL, MongoDB, Redis, etc.)
3. **Plugins** - Protocol adapters (GraphQL, OData, REST) and feature plugins (Validator, Formulas, etc.)

### Example Usage

```typescript
import { ObjectStackKernel } from '@objectstack/runtime';
import { InMemoryDriver } from '@objectql/driver-memory';
import { GraphQLPlugin } from '@objectql/protocol-graphql';
import { ObjectQLPlugin } from '@objectql/core';

// Define application manifest
const myApp = {
  name: 'my-app',
  label: 'My Application',
  objects: {
    users: {
      name: 'users',
      label: 'Users',
      fields: {
        name: { type: 'text', label: 'Name' },
        email: { type: 'email', label: 'Email' }
      }
    }
  }
};

// Create kernel with all components
const kernel = new ObjectStackKernel([
  myApp,                                  // Application config
  new InMemoryDriver(),                   // Driver
  new ObjectQLPlugin(),                   // Core features (auto-detects drivers)
  new GraphQLPlugin({ port: 4000 })      // Protocol
]);

// Start the kernel
await kernel.start();

// The kernel will:
// 1. Load application manifests
// 2. Connect drivers
// 3. Install plugins
// 4. Start plugins (servers, services)
```

## Component Initialization Phases

The kernel initializes components in a specific order:

1. **Phase 1: Load Application Manifests**
   - Register objects, fields, and metadata from app configs
   - Populate the metadata registry

2. **Phase 2: Connect Drivers**
   - Call `connect()` on all drivers
   - Establish database connections

3. **Phase 3: Install Plugins**
   - Call `install(ctx)` on all plugins
   - Register hooks, actions, and services

4. **Phase 4: Start Plugins**
   - Call `onStart(ctx)` on all plugins
   - Start protocol servers and background services

## Creating Plugins

Plugins implement the `RuntimePlugin` interface:

```typescript
import type { RuntimePlugin, RuntimeContext } from '@objectstack/runtime';

export class MyPlugin implements RuntimePlugin {
  name = '@my-org/my-plugin';
  version = '1.0.0';
  
  async install(ctx: RuntimeContext): Promise<void> {
    // Initialize state, register hooks
    console.log('Installing plugin...');
  }
  
  async onStart(ctx: RuntimeContext): Promise<void> {
    // Start servers, connect to services
    console.log('Starting plugin...');
  }
  
  async onStop(ctx: RuntimeContext): Promise<void> {
    // Cleanup resources
    console.log('Stopping plugin...');
  }
}
```

## Protocol Bridge

The `ObjectStackRuntimeProtocol` class provides a standardized API for protocol plugins to interact with the kernel without direct database access:

```typescript
import { ObjectStackRuntimeProtocol } from '@objectstack/runtime';

// In your plugin's install hook:
async install(ctx: RuntimeContext): Promise<void> {
  this.protocol = new ObjectStackRuntimeProtocol(ctx.engine);
}

// Use the protocol bridge in your plugin:
async onStart(ctx: RuntimeContext): Promise<void> {
  // Get metadata
  const objects = this.protocol.getMetaTypes();
  
  // Query data
  const result = await this.protocol.findData('users', {
    where: { active: true }
  });
  
  // Create data
  const user = await this.protocol.createData('users', {
    name: 'John Doe',
    email: 'john@example.com'
  });
}
```

## Migration Notes

### From v3.x to v4.0 (Micro-Kernel)

**Before (v3.x)**:
```typescript
const kernel = new ObjectStackKernel([
  new GraphQLPlugin({ port: 4000 })
]);

// Manually register metadata
kernel.metadata.register('object', {
  type: 'object',
  id: 'users',
  content: { /* ... */ }
});
```

**After (v4.0)**:
```typescript
const kernel = new ObjectStackKernel([
  { name: 'my-app', objects: { users: { /* ... */ } } }, // Auto-registered
  new GraphQLPlugin({ port: 4000 })
]);
```

The new pattern is more declarative and follows the micro-kernel architecture where everything is a loadable component.

## API Reference

### RuntimePlugin

```typescript
interface RuntimePlugin {
  name: string;
  version?: string;
  install?(ctx: RuntimeContext): void | Promise<void>;
  onStart?(ctx: RuntimeContext): void | Promise<void>;
  onStop?(ctx: RuntimeContext): void | Promise<void>;
}
```

### RuntimeContext

```typescript
interface RuntimeContext {
  engine: ObjectStackKernel;
}
```

### ObjectStackKernel

```typescript
class ObjectStackKernel {
  constructor(components: KernelComponent[]);
  
  // Lifecycle
  start(): Promise<void>;
  stop(): Promise<void>;
  
  // Metadata
  metadata: MetadataRegistry;
  hooks: HookManager;
  actions: ActionManager;
  
  // Drivers
  getDriver(nameOrType?: string): RuntimeDriver | undefined;
  getAllDrivers(): RuntimeDriver[];
  
  // CRUD operations (overridden by ObjectQLPlugin)
  find(objectName: string, query: unknown): Promise<{ value: unknown[]; count: number }>;
  get(objectName: string, id: string): Promise<unknown>;
  create(objectName: string, data: unknown): Promise<unknown>;
  update(objectName: string, id: string, data: unknown): Promise<unknown>;
  delete(objectName: string, id: string): Promise<boolean>;
}
```

## License

MIT
