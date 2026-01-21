# Runtime Core Architecture

## Overview

The `@objectql/runtime-core` package implements the core plugin system and query pipeline for ObjectQL, following the principle of **Protocol/Spec vs Runtime/Implementation** separation.

## Architecture Principles

### 1. Protocol Layer (from `@objectql/types`)
- **BasePlugin**: Interface defining plugin structure with metadata and lifecycle
- **QueryProcessorPlugin**: Interface for plugins that process queries
- **PluginMetadata**: Standardized plugin information including dependencies

### 2. Runtime Layer (this package)
- **PluginManager**: Implements dependency resolution and lifecycle management
- **QueryPipeline**: Implements async series waterfall query processing
- **Runtime**: Orchestrates plugins and provides query execution

## Key Components

### PluginManager

**Responsibilities:**
- Register plugins
- Resolve dependencies using topological sort
- Boot plugins in dependency order
- Manage plugin lifecycle (setup/teardown)

**Algorithm: Topological Sort**
```typescript
// Ensures dependencies are initialized before dependents
// Detects circular dependencies
// Throws errors for missing dependencies
```

**Example:**
```typescript
const manager = new PluginManager();
manager.register(pluginA); // No dependencies
manager.register(pluginB); // Depends on A
manager.register(pluginC); // Depends on B

await manager.boot(runtime);
// Execution order: A → B → C
```

### QueryPipeline

**Responsibilities:**
- Execute queries through registered processors
- Implement async series waterfall pattern
- Validate queries before execution
- Transform queries and results through plugin chain

**Execution Flow:**
```
1. validateQuery (all plugins)
   ↓
2. beforeQuery (waterfall: plugin1 → plugin2 → ...)
   ↓
3. execute (driver)
   ↓
4. afterQuery (waterfall: plugin1 → plugin2 → ...)
   ↓
5. return results
```

**Waterfall Pattern:**
- Each plugin receives output from previous plugin
- Plugins can transform queries/results
- Final output is returned to caller

**Example:**
```typescript
// Plugin 1 adds field
beforeQuery(query) {
  return { ...query, fields: ['id', 'name'] };
}

// Plugin 2 adds filter (receives plugin 1's output)
beforeQuery(query) {
  return { ...query, filters: [['active', '=', true]] };
}

// Final query: { fields: ['id', 'name'], filters: [['active', '=', true]] }
```

### Runtime

**Responsibilities:**
- Provide factory function `createRuntime()`
- Manage plugin manager and query pipeline
- Expose simple API for query execution
- Handle initialization and shutdown

**API:**
```typescript
interface Runtime {
  pluginManager: PluginManager;
  init(): Promise<void>;
  query(object, query, context): Promise<any[]>;
  shutdown(): Promise<void>;
  setQueryExecutor(executor): void;
}
```

## Usage Pattern

```typescript
// 1. Define plugins
const myPlugin: BasePlugin = {
  metadata: {
    name: 'my-plugin',
    dependencies: ['base-plugin']
  },
  async setup(runtime) {
    // Initialize plugin
  }
};

// 2. Create runtime
const runtime = createRuntime({
  plugins: [myPlugin]
});

// 3. Set executor
runtime.setQueryExecutor(async (object, query) => {
  // Execute query against database
});

// 4. Initialize
await runtime.init();

// 5. Execute queries
const results = await runtime.query('project', {
  filters: [['status', '=', 'active']]
});

// 6. Shutdown
await runtime.shutdown();
```

## Design Decisions

### 1. Separation of Concerns
- **Types** define interfaces (what)
- **Runtime** implements logic (how)
- No circular dependencies between packages

### 2. Topological Sort for Dependencies
- Ensures correct initialization order
- Detects circular dependencies early
- Provides clear error messages

### 3. Async Series Waterfall
- Allows plugins to transform data sequentially
- Each plugin sees previous plugin's changes
- Enables powerful composition patterns

### 4. Error Handling
- Custom error types (PluginError, PipelineError)
- Include plugin name in errors for debugging
- Graceful shutdown even if teardown fails

## Testing

The package includes 39 tests covering:
- Plugin registration and lifecycle
- Dependency resolution (simple, complex, diamond, circular)
- Query pipeline execution (validation, waterfall, errors)
- Integration scenarios

Run tests:
```bash
pnpm test
```

## Future Enhancements

Potential improvements:
1. Plugin versioning and compatibility checking
2. Hot plugin reload
3. Plugin communication via events
4. Performance monitoring hooks
5. Plugin sandboxing for security
