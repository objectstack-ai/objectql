# ObjectQL Plugin Architecture Design

## Overview

This document defines the plugin architecture for ObjectQL 4.0, where the repository transitions from a standalone framework to a **collection of specialized query plugins** built on @objectstack/runtime.

## Design Principles

### 1. Plugin-First Philosophy
**Every feature is a Plugin.** Even core query functionality is modular and composable.

### 2. Clear Separation of Concerns
- **@objectstack/runtime**: Application lifecycle, metadata, security, transactions
- **@objectql plugins**: Query-specific functionality, optimizations, extensions

### 3. Minimal Core, Maximal Flexibility
Keep the base runtime lightweight. Add functionality through plugins.

### 4. Type-Safe Plugin API
All plugin interfaces are strictly typed with TypeScript.

## Plugin Types

### 1. Driver Plugins
**Purpose:** Data source adapters (SQL, MongoDB, Redis, etc.)

**Interface:**
```typescript
import { RuntimePlugin } from '@objectstack/runtime';
import { DriverInterface } from '@objectstack/spec';

export interface DriverPlugin extends RuntimePlugin {
  driver: DriverInterface;
}

export function createDriverPlugin(
  driver: DriverInterface,
  options?: DriverPluginOptions
): DriverPlugin {
  return {
    name: `@objectql/driver-${driver.name}`,
    version: driver.version,
    type: 'driver',
    
    driver,
    
    async setup(runtime: Runtime) {
      await driver.connect();
      runtime.registerDriver(driver);
    },
    
    async teardown(runtime: Runtime) {
      await driver.disconnect();
      runtime.unregisterDriver(driver.name);
    }
  };
}
```

**Example Usage:**
```typescript
import { createRuntime } from '@objectstack/runtime';
import { SQLDriver } from '@objectql/driver-sql';
import { createDriverPlugin } from '@objectql/core';

const runtime = createRuntime({
  plugins: [
    createDriverPlugin(new SQLDriver({
      client: 'postgresql',
      connection: 'postgresql://localhost/db'
    }))
  ]
});
```

### 2. Query Processing Plugins
**Purpose:** Enhance query execution pipeline

**Interface:**
```typescript
import { QueryAST } from '@objectstack/spec';

export interface QueryProcessorPlugin extends RuntimePlugin {
  // Pre-processing hook
  beforeQuery?(
    ast: QueryAST,
    context: RuntimeContext
  ): Promise<QueryAST>;
  
  // Post-processing hook
  afterQuery?(
    result: any,
    context: RuntimeContext
  ): Promise<any>;
  
  // Validation hook
  validateQuery?(
    ast: QueryAST,
    context: RuntimeContext
  ): Promise<ValidationResult>;
  
  // Optimization hook
  optimizeQuery?(
    ast: QueryAST,
    context: RuntimeContext
  ): Promise<QueryAST>;
}
```

**Example: Query Validation Plugin**
```typescript
export function queryValidationPlugin(
  options?: ValidationOptions
): QueryProcessorPlugin {
  return {
    name: '@objectql/query-validation',
    version: '4.0.0',
    type: 'query-processor',
    
    async validateQuery(ast: QueryAST, context: RuntimeContext) {
      const errors: ValidationError[] = [];
      
      // Validate object exists
      if (!context.runtime.hasObject(ast.object)) {
        errors.push({
          field: 'object',
          message: `Object '${ast.object}' not found`
        });
      }
      
      // Validate fields exist
      const objectMeta = context.runtime.getObject(ast.object);
      for (const field of ast.fields || []) {
        if (!objectMeta.fields[field]) {
          errors.push({
            field,
            message: `Field '${field}' not found on object '${ast.object}'`
          });
        }
      }
      
      // Validate filter expressions
      if (ast.filters) {
        errors.push(...validateFilters(ast.filters, objectMeta));
      }
      
      return {
        valid: errors.length === 0,
        errors
      };
    },
    
    async beforeQuery(ast: QueryAST, context: RuntimeContext) {
      const validation = await this.validateQuery(ast, context);
      if (!validation.valid) {
        throw new QueryValidationError(validation.errors);
      }
      return ast;
    }
  };
}
```

### 3. Repository Extension Plugins
**Purpose:** Extend repository capabilities with advanced features

**Interface:**
```typescript
export interface RepositoryPlugin extends RuntimePlugin {
  // Extend repository with custom methods
  extendRepository?(
    repository: BaseRepository,
    context: RuntimeContext
  ): void;
  
  // CRUD lifecycle hooks
  beforeCreate?(data: any, context: RuntimeContext): Promise<any>;
  afterCreate?(result: any, context: RuntimeContext): Promise<any>;
  beforeUpdate?(id: string, data: any, context: RuntimeContext): Promise<any>;
  afterUpdate?(result: any, context: RuntimeContext): Promise<any>;
  beforeDelete?(id: string, context: RuntimeContext): Promise<void>;
  afterDelete?(id: string, context: RuntimeContext): Promise<void>;
  beforeFind?(query: QueryAST, context: RuntimeContext): Promise<QueryAST>;
  afterFind?(results: any[], context: RuntimeContext): Promise<any[]>;
}
```

**Example: Advanced Repository Plugin**
```typescript
export function advancedRepositoryPlugin(): RepositoryPlugin {
  return {
    name: '@objectql/advanced-repository',
    version: '4.0.0',
    type: 'repository',
    
    extendRepository(repo: BaseRepository, context: RuntimeContext) {
      // Add batch operations
      repo.createMany = async (records: any[]) => {
        const results = [];
        for (const record of records) {
          results.push(await repo.create(record));
        }
        return results;
      };
      
      // Add upsert operation
      repo.upsert = async (id: string, data: any) => {
        const exists = await repo.findOne({ filters: { _id: id } });
        return exists 
          ? repo.update(id, data)
          : repo.create({ ...data, _id: id });
      };
      
      // Add soft delete
      repo.softDelete = async (id: string) => {
        return repo.update(id, { 
          _deleted: true, 
          _deletedAt: new Date() 
        });
      };
    },
    
    async beforeCreate(data: any, context: RuntimeContext) {
      // Add audit fields
      return {
        ...data,
        _createdBy: context.userId,
        _createdAt: new Date()
      };
    },
    
    async beforeUpdate(id: string, data: any, context: RuntimeContext) {
      // Add audit fields
      return {
        ...data,
        _updatedBy: context.userId,
        _updatedAt: new Date()
      };
    }
  };
}
```

### 4. Feature Plugins
**Purpose:** Add specialized capabilities (formulas, AI, caching, etc.)

**Interface:**
```typescript
export interface FeaturePlugin extends RuntimePlugin {
  // Plugin-specific features
  features: {
    [key: string]: any;
  };
  
  // Register feature with runtime
  registerFeature?(
    runtime: Runtime,
    context: RuntimeContext
  ): Promise<void>;
}
```

**Example: Formula Engine Plugin**
```typescript
export function formulaEnginePlugin(
  options?: FormulaOptions
): FeaturePlugin {
  const engine = new FormulaEngine(options);
  
  return {
    name: '@objectql/formula-engine',
    version: '4.0.0',
    type: 'feature',
    
    features: {
      evaluate: (expression: string, context: any) => {
        return engine.evaluate(expression, context);
      },
      
      registerFunction: (name: string, fn: Function) => {
        engine.registerFunction(name, fn);
      }
    },
    
    async setup(runtime: Runtime) {
      // Register built-in functions
      engine.registerFunction('NOW', () => new Date());
      engine.registerFunction('SUM', (...args) => 
        args.reduce((a, b) => a + b, 0)
      );
      
      // Make engine available on runtime
      runtime.registerFeature('formula', engine);
    }
  };
}
```

**Example: AI Query Generator Plugin**
```typescript
export function aiQueryGeneratorPlugin(
  options: AIOptions
): FeaturePlugin {
  return {
    name: '@objectql/ai-query-generator',
    version: '4.0.0',
    type: 'feature',
    
    features: {
      generateQuery: async (
        naturalLanguage: string,
        context: RuntimeContext
      ): Promise<QueryAST> => {
        const schema = context.runtime.getSchema();
        const prompt = buildPrompt(naturalLanguage, schema);
        
        const response = await callLLM(prompt, options);
        return parseQueryAST(response);
      },
      
      suggestQueries: async (
        partial: string,
        context: RuntimeContext
      ): Promise<string[]> => {
        // AI-powered query suggestions
        return suggestionsFromContext(partial, context);
      }
    },
    
    async setup(runtime: Runtime) {
      runtime.registerFeature('ai', this.features);
    }
  };
}
```

### 5. Query Optimization Plugins
**Purpose:** Improve query performance

**Example: Query Cache Plugin**
```typescript
export function queryCachePlugin(
  options?: CacheOptions
): QueryProcessorPlugin {
  const cache = new QueryCache(options);
  
  return {
    name: '@objectql/query-cache',
    version: '4.0.0',
    type: 'query-processor',
    
    async beforeQuery(ast: QueryAST, context: RuntimeContext) {
      const cacheKey = generateCacheKey(ast, context);
      const cached = await cache.get(cacheKey);
      
      if (cached) {
        // Return cached result (skip query execution)
        context.skipExecution = true;
        context.cachedResult = cached;
      }
      
      return ast;
    },
    
    async afterQuery(result: any, context: RuntimeContext) {
      if (!context.skipExecution) {
        const cacheKey = generateCacheKey(context.query, context);
        await cache.set(cacheKey, result, options?.ttl);
      }
      return result;
    }
  };
}
```

**Example: Query Optimizer Plugin**
```typescript
export function queryOptimizerPlugin(): QueryProcessorPlugin {
  return {
    name: '@objectql/query-optimizer',
    version: '4.0.0',
    type: 'query-processor',
    
    async optimizeQuery(ast: QueryAST, context: RuntimeContext) {
      let optimized = { ...ast };
      
      // Remove redundant fields
      optimized = pruneFields(optimized);
      
      // Optimize filters
      optimized = optimizeFilters(optimized);
      
      // Add index hints
      optimized = addIndexHints(optimized, context);
      
      // Optimize joins
      optimized = optimizeJoins(optimized);
      
      return optimized;
    },
    
    async beforeQuery(ast: QueryAST, context: RuntimeContext) {
      return await this.optimizeQuery(ast, context);
    }
  };
}
```

## Plugin Composition

### Plugin Loading Order

1. **Driver Plugins** - Initialize data sources
2. **Query Processor Plugins** - Set up query pipeline
3. **Repository Plugins** - Extend repository capabilities
4. **Feature Plugins** - Add specialized features

### Plugin Dependencies

```typescript
export interface PluginMetadata {
  name: string;
  version: string;
  type: PluginType;
  
  // Plugin dependencies
  dependencies?: string[];
  
  // Optional dependencies
  optionalDependencies?: string[];
  
  // Conflicts with other plugins
  conflicts?: string[];
}
```

**Example:**
```typescript
export function advancedRepositoryPlugin(): RepositoryPlugin {
  return {
    name: '@objectql/advanced-repository',
    version: '4.0.0',
    type: 'repository',
    
    // Requires at least one driver
    dependencies: ['@objectql/driver-*'],
    
    // Works better with validation
    optionalDependencies: ['@objectql/query-validation'],
    
    // Conflicts with legacy repository
    conflicts: ['@objectql/legacy-repository']
  };
}
```

### Plugin Configuration

```typescript
import { createRuntime } from '@objectstack/runtime';
import { sqlDriverPlugin } from '@objectql/driver-sql';
import { queryValidationPlugin } from '@objectql/query-validation';
import { queryOptimizerPlugin } from '@objectql/query-optimizer';
import { queryCachePlugin } from '@objectql/query-cache';
import { advancedRepositoryPlugin } from '@objectql/advanced-repository';
import { formulaEnginePlugin } from '@objectql/formula-engine';

const runtime = createRuntime({
  plugins: [
    // 1. Drivers (required)
    sqlDriverPlugin({
      client: 'postgresql',
      connection: process.env.DATABASE_URL
    }),
    
    // 2. Query processors (optional but recommended)
    queryValidationPlugin({
      strict: true,
      allowUnknownFields: false
    }),
    queryOptimizerPlugin(),
    queryCachePlugin({
      ttl: 60000, // 1 minute
      maxSize: 1000
    }),
    
    // 3. Repository extensions
    advancedRepositoryPlugin(),
    
    // 4. Features
    formulaEnginePlugin({
      customFunctions: {
        CUSTOM_FN: (arg) => arg.toUpperCase()
      }
    })
  ]
});

await runtime.initialize();
```

## Plugin Development Guide

### Creating a New Plugin

#### Step 1: Define Plugin Interface
```typescript
// src/types.ts
import { RuntimePlugin } from '@objectstack/runtime';

export interface MyPluginOptions {
  enabled?: boolean;
  config?: any;
}

export interface MyPlugin extends RuntimePlugin {
  // Plugin-specific methods
  myMethod(arg: any): Promise<any>;
}
```

#### Step 2: Implement Plugin
```typescript
// src/plugin.ts
import { Runtime, RuntimeContext } from '@objectstack/runtime';
import { MyPlugin, MyPluginOptions } from './types';

export function myPlugin(options?: MyPluginOptions): MyPlugin {
  return {
    name: '@objectql/my-plugin',
    version: '1.0.0',
    type: 'custom',
    
    async setup(runtime: Runtime) {
      // Initialize plugin
      console.log('MyPlugin initialized');
    },
    
    async teardown(runtime: Runtime) {
      // Cleanup
      console.log('MyPlugin teardown');
    },
    
    async myMethod(arg: any) {
      // Plugin logic
      return processArg(arg);
    }
  };
}
```

#### Step 3: Add Tests
```typescript
// src/plugin.test.ts
import { createRuntime } from '@objectstack/runtime';
import { myPlugin } from './plugin';

describe('MyPlugin', () => {
  it('should initialize correctly', async () => {
    const runtime = createRuntime({
      plugins: [myPlugin({ enabled: true })]
    });
    
    await runtime.initialize();
    expect(runtime.hasPlugin('@objectql/my-plugin')).toBe(true);
  });
  
  it('should execute myMethod', async () => {
    const plugin = myPlugin();
    const result = await plugin.myMethod('test');
    expect(result).toBeDefined();
  });
});
```

#### Step 4: Document Plugin
```markdown
# @objectql/my-plugin

My awesome plugin for ObjectQL.

## Installation

```bash
npm install @objectql/my-plugin
```

## Usage

```typescript
import { createRuntime } from '@objectstack/runtime';
import { myPlugin } from '@objectql/my-plugin';

const runtime = createRuntime({
  plugins: [
    myPlugin({
      enabled: true,
      config: {}
    })
  ]
});
\`\`\`

## API

### Options

- `enabled` - Enable/disable plugin
- `config` - Plugin configuration

### Methods

- `myMethod(arg)` - Does something cool
```

## Plugin Registry

### Official Plugins

| Plugin | Type | Status | Description |
|--------|------|--------|-------------|
| @objectql/driver-sql | Driver | ✅ Stable | SQL databases (PostgreSQL, MySQL, SQLite) |
| @objectql/driver-mongo | Driver | ✅ Stable | MongoDB database |
| @objectql/driver-memory | Driver | ✅ Stable | In-memory storage |
| @objectql/driver-sdk | Driver | ✅ Stable | Remote HTTP API |
| @objectql/query-validation | Processor | 🚧 Beta | Query validation |
| @objectql/query-optimizer | Processor | 🚧 Beta | Query optimization |
| @objectql/query-cache | Processor | 🚧 Beta | Query caching |
| @objectql/advanced-repository | Repository | 🚧 Beta | Enhanced repository |
| @objectql/formula-engine | Feature | 🚧 Beta | Formula evaluation |
| @objectql/ai-query-generator | Feature | 🔄 Alpha | AI query generation |

### Community Plugins

*(To be populated as community develops plugins)*

## Best Practices

### 1. Single Responsibility
Each plugin should do one thing well.

### 2. Minimal Dependencies
Avoid heavy dependencies. Keep plugins lightweight.

### 3. Type Safety
Always use TypeScript with strict mode.

### 4. Error Handling
Handle errors gracefully and provide meaningful messages.

```typescript
async beforeQuery(ast: QueryAST, context: RuntimeContext) {
  try {
    return await this.validateQuery(ast, context);
  } catch (error) {
    throw new PluginError(
      `${this.name}: Validation failed`,
      { cause: error }
    );
  }
}
```

### 5. Performance
Minimize overhead in hot paths (query execution).

### 6. Testing
Maintain >90% test coverage.

### 7. Documentation
Provide clear examples and API documentation.

## Plugin Versioning

Follow Semantic Versioning (semver):
- **Major (4.0.0)**: Breaking changes
- **Minor (4.1.0)**: New features, backward compatible
- **Patch (4.0.1)**: Bug fixes

## Next Steps

1. Review plugin interfaces with team
2. Prototype first plugin (query-validation)
3. Establish plugin testing standards
4. Create plugin development template
5. Build plugin discovery mechanism

---

**Document Version:** 1.0.0  
**Last Updated:** 2026-01-21  
**Status:** Draft - Pending Review
