# ObjectQL Plugins

This directory contains official ObjectQL plugins that extend the core query functionality.

## Overview

ObjectQL v4.0 is built on a plugin-based architecture. Each plugin provides specialized functionality:

- **Query Processors**: Validate, optimize, and transform queries
- **Repository Extensions**: Add batch operations, audit tracking, soft deletes
- **Feature Plugins**: Formula engines, AI query generation, caching
- **Driver Plugins**: Database adapters (SQL, MongoDB, Redis, etc.)

## Plugin Categories

### Query Processing Plugins

Enhance the query execution pipeline:

- `query-validation` - Query AST validation
- `query-optimizer` - Query optimization and performance improvements  
- `query-cache` - Query result caching

### Repository Plugins

Extend repository capabilities:

- `advanced-repository` - Batch operations, upsert, soft delete, audit tracking

### Feature Plugins

Add specialized capabilities:

- `formula-engine` - Formula parsing and evaluation
- `ai-query-generator` - Natural language to QueryAST conversion

## Creating a Plugin

All plugins must implement one of the plugin interfaces from `@objectql/types`:

```typescript
import { QueryProcessorPlugin } from '@objectql/types';

export function myPlugin(): QueryProcessorPlugin {
  return {
    name: '@objectql/my-plugin',
    version: '1.0.0',
    type: 'query-processor',
    
    async setup(runtime) {
      // Initialize plugin
    },
    
    async validateQuery(ast, context) {
      // Validate query
      return { valid: true, errors: [] };
    },
    
    async beforeQuery(ast, context) {
      // Transform query before execution
      return ast;
    }
  };
}
```

## Plugin Development

See [PLUGIN_ARCHITECTURE.md](../../PLUGIN_ARCHITECTURE.md) for detailed documentation on:

- Plugin types and interfaces
- Lifecycle hooks
- Plugin composition
- Best practices
- Testing strategies

## Official Plugins

Plugins will be added as they are migrated from the v3.x architecture:

- [ ] `@objectql/query-validation` - Week 7-8
- [ ] `@objectql/advanced-repository` - Week 9-10
- [ ] `@objectql/formula-engine` - Week 11-12
- [ ] `@objectql/query-optimizer` - Week 13-14
- [ ] `@objectql/query-cache` - Week 15-16
- [ ] `@objectql/ai-query-generator` - Week 17-18

See [IMPLEMENTATION_ROADMAP.md](../../IMPLEMENTATION_ROADMAP.md) for the full migration timeline.

## Community Plugins

Community-developed plugins will be listed here as they become available.

## License

MIT © ObjectStack Inc.
