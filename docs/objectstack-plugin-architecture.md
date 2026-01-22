# ObjectQL as an ObjectStack Plugin - Architecture Specification

**Version:** 1.0  
**Date:** 2026-01-22  
**Status:** Planning

## Overview

This document defines the technical architecture for ObjectQL as a plugin within the ObjectStack runtime ecosystem.

## Architecture Principles

### 1. Plugin-First Design

ObjectQL is a **query extension plugin** for ObjectStack, not a standalone framework.

```typescript
// ❌ Old (Standalone)
import { ObjectQL } from '@objectql/core';
const app = new ObjectQL({ datasources: { default: driver } });

// ✅ New (Plugin)
import { ObjectStack } from '@objectstack/runtime';
import { ObjectQLPlugin } from '@objectql/core';

const runtime = new ObjectStack({
  plugins: [
    new ObjectQLPlugin({
      enableQueryOptimization: true,
      enableAdvancedFilters: true
    })
  ]
});
```

### 2. Dependency Hierarchy

```
@objectstack/runtime (Base Runtime)
  ├── @objectstack/spec (Protocol Specification)
  ├── @objectstack/types (Base Types)
  └── @objectstack/objectql (Core ObjectQL Engine)
      └── @objectql/core (Query Extensions Plugin)
          ├── @objectql/driver-sql (SQL Query Extensions)
          ├── @objectql/driver-mongo (MongoDB Query Extensions)
          └── ... (Other specialized drivers)
```

### 3. Scope Boundaries

#### What Belongs in ObjectQL (Query-Specific)

✅ **Query DSL & Optimization**
- Advanced filter syntax and operators
- Query builder fluent API
- Query optimization engine
- Query performance analyzer
- Query result transformers

✅ **Specialized Query Drivers**
- SQL query optimizations (joins, indexes, explain plans)
- MongoDB aggregation pipeline extensions
- Excel file querying
- Redis as query target
- File system querying

✅ **Query Development Tools**
- Query syntax highlighting (VS Code)
- Query validation and linting
- Query debugging CLI commands
- Query performance profiler
- Query plan visualizer

✅ **Query Metadata**
- Index definitions and hints
- Query performance metadata
- Query caching strategies
- Join relationship definitions

#### What Belongs in @objectstack (General Runtime)

🔄 **Core Runtime Features** (delegated to @objectstack/runtime)
- Application lifecycle management
- Plugin system and orchestration
- Context and session management
- Configuration management
- Event bus and messaging

🔄 **Data Operations** (delegated to @objectstack/objectql)
- Basic CRUD operations (create, read, update, delete)
- Transaction management
- Data validation (general-purpose)
- Schema management
- Migration system

🔄 **Metadata System** (delegated to @objectstack/types)
- Base object definitions
- Field type system
- Permission system
- Workflow definitions

## Package Architecture

### Core Packages

#### @objectql/types

**Purpose**: Query-specific type definitions

**Exports**:
```typescript
// Query Types
export type QueryFilter = ...;
export type QueryOptions = ...;
export type QueryResult<T> = ...;

// Query Performance
export type QueryPerformanceMetrics = ...;
export type QueryPlan = ...;
export type QueryHint = ...;

// Index Types
export type IndexSchema = ...;
export type IndexHint = ...;

// Re-exports from @objectstack for convenience
export type { DriverInterface } from '@objectstack/spec';
export type { MetadataRegistry } from '@objectstack/types';
```

**Dependencies**:
```json
{
  "dependencies": {
    "@objectstack/spec": "^0.2.0",
    "@objectstack/types": "^0.2.0"
  }
}
```

#### @objectql/core

**Purpose**: Query extension plugin implementation

**Exports**:
```typescript
// Main Plugin
export class ObjectQLPlugin implements RuntimePlugin {
  name = '@objectql/core';
  
  async install(ctx: RuntimeContext): Promise<void> {
    // Register query extensions
  }
}

// Query Builder
export class QueryBuilder {
  // Advanced query construction
}

// Query Optimizer
export class QueryOptimizer {
  // Query performance optimization
}

// Query Analyzer
export class QueryAnalyzer {
  // Query introspection and analysis
}

// Legacy compatibility wrapper (deprecated)
export class ObjectQL {
  // Wraps ObjectStackKernel for backward compatibility
  // Will be removed in v5.0.0
}
```

**Dependencies**:
```json
{
  "dependencies": {
    "@objectql/types": "workspace:*",
    "@objectstack/runtime": "^0.2.0",
    "@objectstack/objectql": "^0.2.0",
    "@objectstack/spec": "^0.2.0"
  }
}
```

**Size Target**: ~300KB (down from ~950KB)

### Driver Packages

Each driver package is an **independent plugin** that can be installed separately.

#### Package Pattern

```json
{
  "name": "@objectql/driver-{name}",
  "version": "4.0.0",
  "keywords": [
    "objectstack-plugin",
    "objectql",
    "query-driver",
    "{database-type}"
  ],
  "peerDependencies": {
    "@objectstack/spec": "^0.2.0",
    "@objectql/core": "^4.0.0"
  }
}
```

#### Driver Implementation

```typescript
import { DriverInterface } from '@objectstack/spec';

export class SQLDriver implements DriverInterface {
  name = 'ObjectQL-SQL';
  version = '4.0.0';
  
  // Standard driver methods
  async connect() { }
  async find(object: string, query: QueryAST) {
    // SQL-specific query optimization
  }
  
  // ObjectQL-specific query extensions
  async explain(object: string, query: QueryAST): Promise<QueryPlan> {
    // Return query execution plan
  }
  
  async optimize(object: string, query: QueryAST): Promise<QueryAST> {
    // Return optimized query
  }
}
```

### Tool Packages

#### @objectql/cli

**Purpose**: Query-specific CLI commands

**Commands**:
```bash
# Query Analysis
objectql query analyze <query.json>
objectql query optimize <query.json>
objectql query explain <query.json>
objectql query validate <query.json>

# Query Debugging
objectql query debug --watch
objectql query profile <query.json>
objectql query trace <query.json>

# Integration with @objectstack CLI
objectstack dev --plugin objectql
objectstack generate query --type advanced
```

**Implementation**:
```typescript
import { CLIPlugin } from '@objectstack/cli';

export class ObjectQLCLI implements CLIPlugin {
  name = 'objectql';
  
  commands = [
    {
      name: 'query:analyze',
      handler: analyzeQueryCommand
    },
    // ... other commands
  ];
}
```

#### vscode-objectql

**Purpose**: Query-specific VS Code features

**Features**:
- Query syntax highlighting for JSON/YAML query files
- Query validation and IntelliSense
- Query performance hints
- Query plan visualization
- Index suggestion

**Activation**:
```json
{
  "activationEvents": [
    "onLanguage:objectql-query",
    "workspaceContains:**/*.query.json",
    "workspaceContains:**/*.query.yml"
  ]
}
```

## Usage Patterns

### Basic Usage (Plugin Mode)

```typescript
import { ObjectStack } from '@objectstack/runtime';
import { ObjectQLPlugin } from '@objectql/core';
import { SQLDriver } from '@objectql/driver-sql';

// 1. Create runtime with ObjectQL plugin
const runtime = new ObjectStack({
  plugins: [
    new ObjectQLPlugin({
      enableQueryOptimization: true,
      enableQueryAnalyzer: true
    })
  ]
});

// 2. Register drivers
runtime.registerDriver('default', new SQLDriver({
  client: 'postgresql',
  connection: process.env.DATABASE_URL
}));

// 3. Initialize
await runtime.start();

// 4. Use query features
const ctx = runtime.createContext({ userId: 'user123' });
const repo = ctx.object('users');

// Advanced query with ObjectQL extensions
const results = await repo.find({
  filters: [
    { field: 'age', operator: '>=', value: 18 },
    { field: 'status', operator: 'in', value: ['active', 'verified'] }
  ],
  sort: [{ field: 'created_at', order: 'desc' }],
  limit: 50,
  // ObjectQL query extension
  hints: {
    useIndex: 'idx_users_age_status',
    explain: true
  }
});

// Query performance analysis (ObjectQL feature)
const analysis = await runtime.query.analyze(results.query);
console.log(`Query time: ${analysis.duration}ms`);
console.log(`Rows scanned: ${analysis.rowsScanned}`);
console.log(`Optimization suggestions:`, analysis.suggestions);
```

### Advanced Usage (Query Optimization)

```typescript
import { QueryOptimizer } from '@objectql/core';

const optimizer = new QueryOptimizer({
  enableIndexHints: true,
  enableJoinOptimization: true,
  enableQueryRewrite: true
});

// Original query
const originalQuery = {
  object: 'orders',
  filters: [
    { field: 'customer.country', operator: '=', value: 'US' },
    { field: 'total', operator: '>', value: 100 },
    { field: 'status', operator: '=', value: 'shipped' }
  ]
};

// Optimize query
const optimizedQuery = await optimizer.optimize(originalQuery);

console.log('Original:', originalQuery);
console.log('Optimized:', optimizedQuery);
// Optimized query might reorder filters, add index hints, etc.
```

### Specialized Driver Usage

```typescript
import { ExcelDriver } from '@objectql/driver-excel';

// Query Excel file as database
const excelDriver = new ExcelDriver({
  file: './sales-data.xlsx'
});

runtime.registerDriver('excel', excelDriver);

// Query Excel like a database
const ctx = runtime.createContext({ isSystem: true });
const sales = ctx.object('sales', { datasource: 'excel' });

const report = await sales.aggregate([
  {
    $match: { region: 'North America' }
  },
  {
    $group: {
      _id: '$product',
      total: { $sum: '$amount' }
    }
  },
  {
    $sort: { total: -1 }
  }
]);
```

## Migration Path

### Phase 1: Backward Compatibility (v4.0 - v4.x)

Support both modes:

```typescript
// Legacy mode (deprecated, will be removed in v5.0)
import { ObjectQL } from '@objectql/core';
const app = new ObjectQL({ datasources: { default: driver } });

// Plugin mode (recommended)
import { ObjectStack } from '@objectstack/runtime';
import { ObjectQLPlugin } from '@objectql/core';
const app = new ObjectStack({ plugins: [new ObjectQLPlugin()] });
```

### Phase 2: Plugin-Only (v5.0+)

Remove `ObjectQL` class, plugin mode only:

```typescript
// Only plugin mode supported
import { ObjectStack } from '@objectstack/runtime';
import { ObjectQLPlugin } from '@objectql/core';

const runtime = new ObjectStack({
  plugins: [new ObjectQLPlugin()]
});
```

### Migration Tool

```bash
# Automated migration assistant
npx @objectql/migrate v3-to-v4

# This will:
# 1. Update package.json dependencies
# 2. Rewrite imports
# 3. Convert ObjectQL → ObjectStack + ObjectQLPlugin
# 4. Add @objectstack dependencies
# 5. Update configuration files
```

## Performance Considerations

### Bundle Size Reduction

| Package | v3.x Size | v4.x Target | Reduction |
|---------|-----------|-------------|-----------|
| @objectql/core | ~950KB | ~300KB | 68% |
| @objectql/types | ~150KB | ~50KB | 67% |
| @objectql/platform-node | ~200KB | ~80KB | 60% |
| **Total** | **~1.3MB** | **~430KB** | **67%** |

Size reduced by delegating to @objectstack packages.

### Runtime Performance

- Query execution: < 5% regression (due to plugin overhead)
- Query optimization: 20-50% improvement (new optimizer)
- Memory usage: 30% reduction (shared runtime)

## Testing Strategy

### Unit Tests

```typescript
import { ObjectStack } from '@objectstack/runtime';
import { ObjectQLPlugin } from '@objectql/core';
import { createMockDriver } from '@objectstack/testing';

describe('ObjectQLPlugin', () => {
  it('should register query extensions', async () => {
    const runtime = new ObjectStack({
      plugins: [new ObjectQLPlugin()]
    });
    
    await runtime.start();
    
    expect(runtime.hasFeature('query.optimize')).toBe(true);
    expect(runtime.hasFeature('query.analyze')).toBe(true);
  });
});
```

### Integration Tests

```typescript
import { ObjectStack } from '@objectstack/runtime';
import { ObjectQLPlugin } from '@objectql/core';
import { SQLDriver } from '@objectql/driver-sql';

describe('ObjectQL SQL Integration', () => {
  let runtime: ObjectStack;
  
  beforeAll(async () => {
    runtime = new ObjectStack({
      plugins: [new ObjectQLPlugin()]
    });
    
    runtime.registerDriver('default', new SQLDriver({
      client: 'sqlite3',
      connection: ':memory:'
    }));
    
    await runtime.start();
  });
  
  it('should optimize complex queries', async () => {
    // Test implementation
  });
});
```

## Documentation Structure

```
docs/
├── README.md (Updated to show as plugin)
├── objectstack-plugin-architecture.md (This document)
├── guides/
│   ├── installation.md (How to install with @objectstack)
│   ├── query-optimization.md (Query features)
│   ├── custom-drivers.md (Building drivers)
│   └── migration-from-v3.md (Upgrade guide)
├── api/
│   ├── plugin-api.md
│   ├── query-builder.md
│   └── drivers.md
└── reference/
    ├── query-syntax.md
    ├── filter-operators.md
    └── performance-tuning.md
```

## Release Checklist

### v4.0.0 Release

- [ ] All packages updated to plugin architecture
- [ ] @objectstack dependencies configured
- [ ] Migration guide complete
- [ ] Examples updated
- [ ] Documentation updated
- [ ] Tests passing (100% coverage)
- [ ] Performance benchmarks acceptable
- [ ] Backward compatibility layer working
- [ ] CLI commands working with @objectstack
- [ ] VS Code extension updated
- [ ] CHANGELOG.md complete for each package
- [ ] npm packages published
- [ ] GitHub release created
- [ ] Blog post published
- [ ] Community announcement

## Support & Maintenance

### Version Support

- **v4.x**: Active development (current)
- **v3.x**: LTS support for 12 months (security fixes only)
- **v2.x**: End of life (no support)

### Compatibility Matrix

| ObjectQL | @objectstack/runtime | Node.js | Status |
|----------|---------------------|---------|--------|
| 4.0.x | ^0.2.0 | 18.x, 20.x, 22.x | ✅ Active |
| 3.x | - (standalone) | 16.x, 18.x, 20.x | 🔄 LTS |
| 2.x | - | 14.x, 16.x | ❌ EOL |

## Conclusion

This architecture transforms ObjectQL from a standalone ORM into a focused, high-performance **query extension plugin** for the ObjectStack ecosystem.

**Key Benefits**:
1. Clear separation of concerns
2. Reduced code duplication and bundle size
3. Better maintenance through delegation
4. Modular, plugin-based architecture
5. Focus on query excellence

---

**Next Steps**: See [MIGRATION_TO_OBJECTSTACK_RUNTIME.md](../MIGRATION_TO_OBJECTSTACK_RUNTIME.md) for detailed implementation checklist.
