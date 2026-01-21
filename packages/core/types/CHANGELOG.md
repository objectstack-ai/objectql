# @objectql/types v4.0.0

## [4.0.0] - 2026-01-21

### Breaking Changes

- Complete rewrite of type system for plugin-based architecture
- Removed types now in @objectstack/spec:
  - `Driver` interface (use `DriverInterface` from @objectstack/spec)
- Removed types now in @objectstack/runtime:
  - `MetadataRegistry` class
  - `Context` types
  - `Hook` types
  - `Action` types

### Added

- New plugin interfaces:
  - `QueryProcessorPlugin` - For query validation, optimization, and transformation
  - `RepositoryPlugin` - For extending repository with batch operations, audit tracking
  - `BasePlugin` - Base interface for all plugins
- Query-specific types:
  - `UnifiedQuery` - Core query structure
  - `FilterExpression` - Type-safe filter expressions
  - `QueryResult` - Query result wrapper with pagination
  - `QueryOptions` - Query execution options
- Runtime types:
  - `RuntimeContext` - Context available to plugins during execution
  - `ValidationResult` - Query validation result
  - `ValidationError` - Validation error details

### Dependencies

- Added `@objectstack/spec` ^0.2.0
- Added `@objectstack/runtime` ^0.2.0

### Migration Guide

If you were using types that are now removed:

```typescript
// Old (v3.x)
import { Driver, MetadataRegistry, Hook } from '@objectql/types';

// New (v4.x)
import { DriverInterface } from '@objectstack/spec';
// MetadataRegistry, Hook, Action are now part of @objectstack/runtime
```

For plugin development:

```typescript
// New in v4.x
import { QueryProcessorPlugin, RepositoryPlugin } from '@objectql/types';

export function myPlugin(): QueryProcessorPlugin {
  return {
    name: '@myorg/plugin',
    version: '1.0.0',
    type: 'query-processor',
    async beforeQuery(ast, context) {
      // Transform query
      return ast;
    }
  };
}
```
