# Micro-Kernel Architecture Guide

## Overview

ObjectStack implements a **micro-kernel architecture** that provides a flexible, composable runtime for building data-driven applications. The kernel accepts heterogeneous components (applications, drivers, plugins) and orchestrates their lifecycle.

## Architecture Principles

### 1. Everything is a Component

The kernel treats all loadable items uniformly as "components":
- **Application Configs** - Declarative metadata manifests
- **Drivers** - Database/storage adapters
- **Plugins** - Protocol adapters and feature extensions

### 2. Declarative Over Imperative

Instead of imperative registration:
```typescript
// ❌ Old way - imperative
kernel.metadata.register('object', { id: 'users', ... });
kernel.addDriver(new MemoryDriver());
kernel.addPlugin(new GraphQLPlugin());
```

Use declarative component loading:
```typescript
// ✅ New way - declarative
const kernel = new ObjectStackKernel([
  { name: 'my-app', objects: { users: {...} } },
  new MemoryDriver(),
  new GraphQLPlugin()
]);
```

### 3. Separation of Concerns

- **Kernel** - Component lifecycle management
- **Drivers** - Data persistence layer
- **Plugins** - Business logic and protocols
- **Apps** - Domain metadata and schema

## Component Types

### Application Config

Represents an application with its metadata:

```typescript
interface RuntimeAppConfig {
  name: string;              // Unique identifier
  label?: string;            // Display name
  description?: string;      // Description
  objects?: Record<string, any>;  // Object definitions
  [key: string]: any;        // Custom metadata
}
```

**Example:**
```typescript
const crmApp = {
  name: 'crm',
  label: 'Customer Relationship Management',
  objects: {
    contacts: {
      name: 'contacts',
      label: 'Contacts',
      fields: {
        name: { type: 'text', label: 'Name' },
        email: { type: 'email', label: 'Email' }
      }
    },
    opportunities: {
      name: 'opportunities',
      label: 'Opportunities',
      fields: {
        name: { type: 'text', label: 'Name' },
        amount: { type: 'currency', label: 'Amount' },
        contact: { type: 'lookup', reference_to: 'contacts' }
      }
    }
  }
};
```

### Driver

Implements data persistence:

```typescript
interface RuntimeDriver {
  name?: string;
  connect?(): Promise<void>;
  disconnect?(): Promise<void>;
  find(objectName: string, query: any): Promise<any[]>;
  create(objectName: string, data: any, options: any): Promise<any>;
  update(objectName: string, id: string, data: any, options: any): Promise<any>;
  delete(objectName: string, id: string, options: any): Promise<any>;
  findOne(objectName: string, id: string): Promise<any>;
}
```

**Available Drivers:**
- `@objectql/driver-memory` - In-memory (testing, development)
- `@objectql/driver-sql` - SQL databases via Knex.js
- `@objectql/driver-mongo` - MongoDB
- `@objectql/driver-redis` - Redis
- `@objectql/driver-fs` - File system
- `@objectql/driver-excel` - Excel files
- `@objectql/driver-localstorage` - Browser LocalStorage

### Plugin

Extends kernel functionality:

```typescript
interface RuntimePlugin {
  name: string;
  version?: string;
  install?(ctx: RuntimeContext): void | Promise<void>;
  onStart?(ctx: RuntimeContext): void | Promise<void>;
  onStop?(ctx: RuntimeContext): void | Promise<void>;
}
```

**Types of Plugins:**

1. **Core Plugins** - Essential features
   - `ObjectQLPlugin` - Repository, Validator, Formulas, AI
   
2. **Protocol Plugins** - API adapters
   - `GraphQLPlugin` - GraphQL API
   - `ODataV4Plugin` - OData V4 REST API
   - `JSONRPCPlugin` - JSON-RPC 2.0
   
3. **Feature Plugins** - Optional capabilities
   - Security plugins (RBAC, FLS, RLS)
   - Audit logging
   - Caching layers
   - Workflow engines

## Initialization Sequence

The kernel follows a strict 4-phase initialization:

```
┌─────────────────────────────────────────────────────┐
│ Phase 1: Load Application Manifests                │
│ - Parse app configs                                 │
│ - Register objects in metadata registry             │
│ - Build schema structure                            │
└─────────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────┐
│ Phase 2: Connect Drivers                            │
│ - Call driver.connect()                             │
│ - Establish database connections                    │
│ - Initialize connection pools                       │
└─────────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────┐
│ Phase 3: Install Plugins                            │
│ - Call plugin.install(ctx)                          │
│ - Register hooks and actions                        │
│ - Initialize plugin state                           │
└─────────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────┐
│ Phase 4: Start Plugins                              │
│ - Call plugin.onStart(ctx)                          │
│ - Start protocol servers                            │
│ - Activate background services                      │
└─────────────────────────────────────────────────────┘
```

## Usage Patterns

### Pattern 1: Simple Single-Protocol Server

```typescript
import { ObjectStackKernel } from '@objectql/runtime';
import { MemoryDriver } from '@objectql/driver-memory';
import { GraphQLPlugin } from '@objectql/protocol-graphql';
import { ObjectQLPlugin } from '@objectql/core';

const myApp = {
  name: 'simple-app',
  objects: {
    tasks: {
      name: 'tasks',
      fields: {
        title: { type: 'text', required: true },
        done: { type: 'boolean', default: false }
      }
    }
  }
};

const kernel = new ObjectStackKernel([
  myApp,
  new MemoryDriver(),
  new ObjectQLPlugin(),
  new GraphQLPlugin({ port: 4000 })
]);

await kernel.start();
```

### Pattern 2: Multi-Protocol Server

```typescript
import { ObjectStackKernel } from '@objectql/runtime';
import { SQLDriver } from '@objectql/driver-sql';
import { GraphQLPlugin } from '@objectql/protocol-graphql';
import { ODataV4Plugin } from '@objectql/protocol-odata-v4';
import { JSONRPCPlugin } from '@objectql/protocol-json-rpc';
import { ObjectQLPlugin } from '@objectql/core';

// Define application config
const myApp = {
  name: 'my-app',
  label: 'My Application',
  objects: {
    users: {
      name: 'users',
      fields: {
        name: { type: 'text' },
        email: { type: 'email' }
      }
    }
  }
};

const kernel = new ObjectStackKernel([
  myApp,
  new SQLDriver({ /* config */ }),
  new ObjectQLPlugin(),
  new GraphQLPlugin({ port: 4000 }),
  new ODataV4Plugin({ port: 8080 }),
  new JSONRPCPlugin({ port: 9000 })
]);

await kernel.start();
// Now all three protocols expose the same data model
```

### Pattern 3: Multi-Tenant with Multiple Drivers

```typescript
const kernel = new ObjectStackKernel([
  // Tenant A - uses PostgreSQL
  { name: 'tenant-a', datasource: 'postgres', objects: {...} },
  new SQLDriver({ 
    name: 'postgres',
    client: 'postgresql',
    connection: { /* ... */ }
  }),
  
  // Tenant B - uses MongoDB
  { name: 'tenant-b', datasource: 'mongo', objects: {...} },
  new MongoDriver({ name: 'mongo', url: 'mongodb://...' }),
  
  // Shared protocol layer
  new ObjectQLPlugin(),
  new GraphQLPlugin({ port: 4000 })
]);
```

### Pattern 4: Modular Applications

```typescript
// Import pre-built applications
import CrmApp from '@my-org/crm-app/objectstack.config';
import ProjectTrackerApp from '@my-org/project-tracker/objectstack.config';
import HrApp from '@my-org/hr-app/objectstack.config';

const kernel = new ObjectStackKernel([
  CrmApp,
  ProjectTrackerApp,
  HrApp,
  new SQLDriver({ client: 'postgresql', connection: {...} }),
  new ObjectQLPlugin(),
  new GraphQLPlugin({ port: 4000 })
]);

// Single GraphQL API exposing all three applications
await kernel.start();
```

## Protocol Bridge Layer

The `ObjectStackRuntimeProtocol` provides a standardized API for plugins to interact with the kernel:

```typescript
export class MyProtocolPlugin implements RuntimePlugin {
  name = '@my-org/my-protocol';
  private protocol?: ObjectStackRuntimeProtocol;
  
  async install(ctx: RuntimeContext): Promise<void> {
    // Initialize protocol bridge
    this.protocol = new ObjectStackRuntimeProtocol(ctx.engine);
  }
  
  async onStart(ctx: RuntimeContext): Promise<void> {
    // Use protocol methods (not direct database access)
    
    // Get metadata
    const objectTypes = this.protocol.getMetaTypes();
    const userConfig = this.protocol.getMetaItem('users');
    
    // Query data
    const users = await this.protocol.findData('users', {
      where: { active: true },
      limit: 10
    });
    
    // Mutate data
    const newUser = await this.protocol.createData('users', {
      name: 'Alice',
      email: 'alice@example.com'
    });
    
    // Execute actions
    const result = await this.protocol.executeAction('users:sendWelcomeEmail', {
      userId: newUser.id
    });
  }
}
```

**Key Principle:** Plugins NEVER access the database directly. All data operations go through the protocol bridge, which ensures:
- ✅ Hooks are executed
- ✅ Validation runs
- ✅ Formulas are evaluated
- ✅ Permissions are checked
- ✅ Audit trails are created

## Component Detection

The kernel automatically detects component types using type guards:

```typescript
private isRuntimePlugin(component: any): component is RuntimePlugin {
  return typeof component.name === 'string' &&
         (component.install || component.onStart || component.onStop);
}

private isRuntimeDriver(component: any): component is RuntimeDriver {
  return component.connect || component.find || 
         component.create || component.update;
}

private isRuntimeAppConfig(component: any): component is RuntimeAppConfig {
  return typeof component.name === 'string' &&
         !isPlugin && !isDriver;
}
```

This allows mixing components freely in the array without explicit type markers.

## Best Practices

### 1. Order Independence

Components can be specified in any order:

```typescript
// ✅ All of these work the same
new ObjectStackKernel([app, driver, plugin]);
new ObjectStackKernel([plugin, app, driver]);
new ObjectStackKernel([driver, plugin, app]);
```

The kernel classifies and initializes them in the correct order automatically.

### 2. Plugin Dependencies

If your plugin depends on another plugin, use the `install` hook to check:

```typescript
async install(ctx: RuntimeContext): Promise<void> {
  const kernel = ctx.engine as any;
  if (!kernel.queryService) {
    throw new Error('This plugin requires ObjectQLPlugin to be loaded first');
  }
}
```

### 3. Graceful Shutdown

Always implement proper shutdown handling:

```typescript
const kernel = new ObjectStackKernel([...]);

process.on('SIGINT', async () => {
  await kernel.stop();  // Calls onStop() on all plugins in reverse order
  process.exit(0);
});

await kernel.start();
```

### 4. Error Handling

Plugins should handle errors gracefully:

```typescript
async onStart(ctx: RuntimeContext): Promise<void> {
  try {
    this.server = createServer(...);
    await this.server.listen(this.port);
  } catch (error) {
    console.error(`[${this.name}] Failed to start server:`, error);
    throw error;  // Let kernel handle startup failure
  }
}
```

## Testing

The micro-kernel pattern makes testing easy:

```typescript
import { describe, it, expect } from 'vitest';
import { ObjectStackKernel } from '@objectql/runtime';
import { MemoryDriver } from '@objectql/driver-memory';

describe('My Application', () => {
  it('should create users', async () => {
    const kernel = new ObjectStackKernel([
      { name: 'test', objects: { users: {...} } },
      new MemoryDriver(),
      new ObjectQLPlugin()
    ]);
    
    await kernel.start();
    
    const user = await kernel.create('users', {
      name: 'Test User',
      email: 'test@example.com'
    });
    
    expect(user).toBeDefined();
    expect(user.name).toBe('Test User');
    
    await kernel.stop();
  });
});
```

## Migration from Legacy Patterns

### From ObjectQL 3.x

**Before:**
```typescript
const app = new ObjectQL({
  datasources: {
    default: new MemoryDriver()
  }
});

app.metadata.loadDirectory('./src/metadata');
await app.init();
```

**After:**
```typescript
import { ObjectStackKernel } from '@objectql/runtime';
import appConfig from './objectstack.config';

const kernel = new ObjectStackKernel([
  appConfig,
  new MemoryDriver(),
  new ObjectQLPlugin()
]);

await kernel.start();
```

## Conclusion

The micro-kernel architecture provides:
- ✅ **Flexibility** - Mix and match any components
- ✅ **Composability** - Build complex systems from simple parts  
- ✅ **Testability** - Easy to test in isolation
- ✅ **Clarity** - Declarative component loading
- ✅ **Extensibility** - Simple plugin model

This architecture aligns with the ObjectStack vision of a "Standard Protocol for AI Software Generation" where metadata drives everything.
