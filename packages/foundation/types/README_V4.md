# @objectql/types v4.0

**Query-specific type definitions for ObjectQL - A plugin for @objectstack/runtime**

> **⚠️ Version 4.0 Migration Notice**  
> This package has been refactored as part of the migration to @objectstack/runtime plugin architecture.  
> Many types have moved to @objectstack packages. See [Migration Guide](#migration-from-v3x) below.

## What's New in v4.0

- 🎯 **Focused Scope**: Only query-specific types (67% size reduction)
- 🔌 **Plugin Architecture**: Types for ObjectQL as @objectstack plugin
- 🔄 **Backward Compatible**: Re-exports from @objectstack for smooth migration
- 📦 **Smaller Bundle**: From ~150KB to ~50KB
- 📚 **Better Organization**: Clear separation between query and general types

## Installation

```bash
# Install ObjectStack runtime first
npm install @objectstack/runtime @objectstack/spec

# Then add ObjectQL query types
npm install @objectql/types
```

## Package Architecture

### Query-Specific Types (Core ObjectQL)

These are the types that define ObjectQL's query extension capabilities:

```typescript
import { 
  UnifiedQuery,      // Advanced query interface
  Filter,            // Query filter conditions
  AggregateOption,   // Aggregation functions
  IntrospectedTable, // Database introspection
  ObjectQLRepository // Query repository pattern
} from '@objectql/types';
```

### Re-exported Types (Backward Compatibility)

For convenience and backward compatibility, we re-export common types from @objectstack:

```typescript
// ⚠️ Deprecated: Import directly from @objectstack in new code
import { FilterCondition, RuntimePlugin } from '@objectql/types';

// ✅ Recommended: Import from @objectstack directly
import { FilterCondition } from '@objectstack/spec';
import { RuntimePlugin } from '@objectstack/runtime';
```

## Core Query Types

### UnifiedQuery

Generic query structure for all ObjectQL drivers:

```typescript
import { UnifiedQuery } from '@objectql/types';

const query: UnifiedQuery = {
  fields: ['id', 'name', 'email'],
  filters: {
    status: { $eq: 'active' },
    age: { $gte: 18, $lte: 65 }
  },
  sort: [
    ['created_at', 'desc'],
    ['name', 'asc']
  ],
  skip: 0,
  limit: 50
};
```

### Filter (Modern Syntax)

MongoDB/Prisma-style object-based filter syntax:

```typescript
import { Filter } from '@objectql/types';

const filter: Filter = {
  // Implicit equality
  status: 'active',
  
  // Explicit operators
  age: { $gte: 18, $lte: 65 },
  
  // String operators
  name: { $contains: 'John' },
  
  // Set operators
  category: { $in: ['tech', 'science'] },
  
  // Logical operators
  $or: [
    { email: { $contains: '@company.com' } },
    { verified: true }
  ]
};
```

### AggregateOption

Aggregation function definitions:

```typescript
import { AggregateOption } from '@objectql/types';

const aggregations: AggregateOption[] = [
  { func: 'count', field: '*', alias: 'total_count' },
  { func: 'sum', field: 'amount', alias: 'total_amount' },
  { func: 'avg', field: 'age', alias: 'average_age' },
  { func: 'max', field: 'salary', alias: 'max_salary' }
];
```

### IntrospectedTable

Database introspection metadata for query optimization:

```typescript
import { IntrospectedTable, IntrospectedColumn } from '@objectql/types';

const tableMetadata: IntrospectedTable = {
  name: 'users',
  columns: [
    {
      name: 'id',
      type: 'integer',
      nullable: false,
      isPrimary: true
    },
    {
      name: 'email',
      type: 'varchar',
      nullable: false,
      isUnique: true,
      maxLength: 255
    }
  ],
  foreignKeys: [
    {
      columnName: 'org_id',
      referencedTable: 'organizations',
      referencedColumn: 'id'
    }
  ]
};
```

## Migration from v3.x

### What Changed

| Type | v3.x Location | v4.0 Location | Action Required |
|------|---------------|---------------|-----------------|
| `FilterCondition` | `@objectql/types` | `@objectstack/spec` | Update import (or use re-export) |
| `RuntimePlugin` | `@objectql/types` | `@objectstack/runtime` | Update import (or use re-export) |
| `UnifiedQuery` | `@objectql/types` | `@objectql/types` | No change ✅ |
| `Filter` | `@objectql/types` | `@objectql/types` | No change ✅ |
| `ObjectConfig` | `@objectql/types` | `@objectstack/types` | Update import (future) |
| `FieldConfig` | `@objectql/types` | `@objectstack/types` | Update import (future) |

### Migration Examples

#### Option 1: Update Imports (Recommended)

```typescript
// Before (v3.x)
import { 
  FilterCondition, 
  ObjectConfig, 
  UnifiedQuery 
} from '@objectql/types';

// After (v4.0 - Recommended)
import { FilterCondition } from '@objectstack/spec';
import { ObjectConfig } from '@objectstack/types'; // Future
import { UnifiedQuery } from '@objectql/types';
```

#### Option 2: Use Re-exports (Backward Compatible)

```typescript
// Still works in v4.0, but deprecated
import { 
  FilterCondition,  // ⚠️ Deprecated
  UnifiedQuery      // ✅ OK
} from '@objectql/types';
```

### Deprecation Timeline

- **v4.0**: Re-exports available, deprecated warnings in TypeScript
- **v4.x**: Re-exports maintained for compatibility
- **v5.0**: Re-exports removed, must import from @objectstack directly

## Usage with @objectstack Runtime

ObjectQL v4.0 is designed as a plugin for @objectstack/runtime:

```typescript
import { ObjectStack } from '@objectstack/runtime';
import { ObjectQLPlugin } from '@objectql/core';
import { UnifiedQuery } from '@objectql/types';

// Initialize runtime with ObjectQL plugin
const runtime = new ObjectStack({
  plugins: [
    new ObjectQLPlugin({
      enableQueryOptimization: true,
      enableQueryAnalyzer: true
    })
  ]
});

await runtime.start();

// Use query types
const ctx = runtime.createContext({ userId: 'user123' });
const users = ctx.object('users');

const query: UnifiedQuery = {
  filters: { status: 'active' },
  sort: [['name', 'asc']],
  limit: 10
};

const results = await users.find(query);
```

## Type Categories

### ✅ Query-Specific (Stay in @objectql/types)

- `UnifiedQuery` - Query interface
- `Filter` - Query filters
- `AggregateOption` - Aggregation
- `IntrospectedTable` - DB introspection
- `IntrospectedColumn` - Column metadata
- `IntrospectedForeignKey` - FK metadata
- `ObjectQLRepository` - Query repository

### 🔄 Re-exported for Compatibility

- `FilterCondition` - From `@objectstack/spec`
- `RuntimePlugin` - From `@objectstack/runtime`

### ⏳ Under Review (May Move in Future)

- `ObjectConfig` - May move to `@objectstack/types`
- `FieldConfig` - May move to `@objectstack/types`
- `ValidationRule` - May move to `@objectstack/runtime`
- UI-related types - May move to `@objectui`

## Documentation

- [Type Migration Guide](./TYPE_MIGRATION.md) - Detailed migration tracking
- [Main Migration Plan](../../../MIGRATION_TO_OBJECTSTACK_RUNTIME.md)
- [Architecture Specification](../../../docs/objectstack-plugin-architecture.md)
- [Quick Migration Guide](../../../docs/QUICK_MIGRATION_GUIDE.md)

## Related Packages

### ObjectStack Ecosystem

- [@objectstack/runtime](https://npmjs.com/package/@objectstack/runtime) - Base runtime kernel
- [@objectstack/spec](https://npmjs.com/package/@objectstack/spec) - Protocol specification
- [@objectstack/objectql](https://npmjs.com/package/@objectstack/objectql) - Core ObjectQL engine

### ObjectQL Packages

- [@objectql/core](../core) - Query extension plugin
- [@objectql/driver-sql](../../drivers/sql) - SQL query optimization
- [@objectql/driver-mongo](../../drivers/mongo) - MongoDB query extensions

## Contributing

See [CONTRIBUTING.md](../../../docs/contributing.md) for guidelines.

## License

MIT © ObjectStack Inc.

---

**Version**: 4.0.0-alpha.1  
**Status**: In active development (Week 2 of migration)  
**Last Updated**: 2026-01-22
