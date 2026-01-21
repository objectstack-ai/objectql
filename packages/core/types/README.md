# @objectql/types

Type definitions and plugin interfaces for ObjectQL v4.0.

## Overview

This package provides the core TypeScript type definitions for ObjectQL's plugin architecture. It includes:

- **Plugin Interfaces**: Define custom query plugins, repository extensions, and query processors
- **Query Types**: Type-safe query construction and manipulation
- **Helper Types**: Utility types for working with ObjectQL queries

## Key Principles

1. **Zero Dependencies on Internal Packages**: This package depends only on `@objectstack/spec` and `@objectstack/runtime`
2. **Protocol-Driven**: Types define the contract, implementation follows
3. **Strict Type Safety**: All types use TypeScript strict mode

## Installation

```bash
npm install @objectql/types
```

## Usage

```typescript
import { QueryPlugin, RepositoryPlugin, UnifiedQuery } from '@objectql/types';

// Define a custom query plugin
export function myQueryPlugin(): QueryPlugin {
  return {
    name: '@myorg/query-plugin',
    version: '1.0.0',
    type: 'query-processor',
    async beforeQuery(ast, context) {
      // Transform query before execution
      return ast;
    }
  };
}
```

## Migration from v3.x

In v4.0, ObjectQL has transitioned to a plugin-based architecture built on `@objectstack/runtime`:

- **Driver Interface**: Now uses `DriverInterface` from `@objectstack/spec`
- **Metadata & Context**: Now managed by `@objectstack/runtime`
- **Hooks & Actions**: Now part of `@objectstack/runtime`

This package focuses exclusively on query-specific types and plugin interfaces.

## License

MIT © ObjectStack Inc.
