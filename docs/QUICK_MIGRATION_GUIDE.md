# ObjectQL v4.0 Migration Quick Reference

**For developers migrating from v3.x to v4.0**

## TL;DR

ObjectQL v4.0 repositions the framework as a **query extension plugin** for ObjectStack runtime instead of a standalone ORM.

**Main Change**: Install `@objectstack/runtime` first, then add ObjectQL as a plugin.

## Installation

### v3.x (Old)
```bash
npm install @objectql/core @objectql/driver-sql
```

### v4.0 (New)
```bash
# First, install ObjectStack runtime
npm install @objectstack/runtime @objectstack/objectql @objectstack/spec

# Then, add ObjectQL query extensions
npm install @objectql/core @objectql/driver-sql
```

## Basic Usage

### v3.x (Old)
```typescript
import { ObjectQL } from '@objectql/core';
import { SQLDriver } from '@objectql/driver-sql';

const app = new ObjectQL({
  datasources: {
    default: new SQLDriver({
      client: 'postgresql',
      connection: process.env.DATABASE_URL
    })
  }
});

await app.init();

const ctx = app.createContext({ userId: 'user123' });
const users = ctx.object('users');
const results = await users.find({ filters: [{ field: 'active', operator: '=', value: true }] });
```

### v4.0 (New - Recommended)
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

// 3. Start runtime
await runtime.start();

// 4. Use query features (same as before)
const ctx = runtime.createContext({ userId: 'user123' });
const users = ctx.object('users');
const results = await users.find({ 
  filters: [{ field: 'active', operator: '=', value: true }] 
});
```

### v4.0 (Backward Compatible - Deprecated)
```typescript
// Still works in v4.0 but will be removed in v5.0
import { ObjectQL } from '@objectql/core';
import { SQLDriver } from '@objectql/driver-sql';

const app = new ObjectQL({
  datasources: {
    default: new SQLDriver({
      client: 'postgresql',
      connection: process.env.DATABASE_URL
    })
  }
});

await app.init(); // Wraps ObjectStackKernel internally
```

## What Changed

### Package Dependencies

#### v3.x
```json
{
  "dependencies": {
    "@objectql/core": "^3.0.0",
    "@objectql/driver-sql": "^3.0.0"
  }
}
```

#### v4.0
```json
{
  "dependencies": {
    "@objectstack/runtime": "^0.2.0",
    "@objectstack/objectql": "^0.2.0",
    "@objectql/core": "^4.0.0",
    "@objectql/driver-sql": "^4.0.0"
  }
}
```

### Type Imports

#### v3.x
```typescript
import type { 
  Driver, 
  QueryFilter, 
  ObjectConfig,
  MetadataRegistry 
} from '@objectql/types';
```

#### v4.0
```typescript
// Query-specific types from ObjectQL
import type { 
  QueryFilter, 
  QueryOptions,
  QueryHint 
} from '@objectql/types';

// General types from ObjectStack
import type {
  DriverInterface,
  ObjectConfig,
  MetadataRegistry
} from '@objectstack/spec';
```

### Driver Implementation

#### v3.x
```typescript
import { Driver } from '@objectql/types';

class MyDriver implements Driver {
  async find(object: string, query: any) {
    // Implementation
  }
  // Other methods...
}
```

#### v4.0
```typescript
import { DriverInterface, QueryAST } from '@objectstack/spec';

class MyDriver implements DriverInterface {
  name = 'MyDriver';
  version = '1.0.0';
  
  async connect() { }
  async disconnect() { }
  
  async find(object: string, query: QueryAST, options?: any) {
    // Implementation
  }
  
  async create(object: string, data: any, options?: any) { }
  async update(object: string, id: string, data: any, options?: any) { }
  async delete(object: string, id: string, options?: any) { }
}
```

## Feature Mapping

| Feature | v3.x Location | v4.0 Location |
|---------|---------------|---------------|
| Basic CRUD | @objectql/core | @objectstack/objectql |
| Query Builder | @objectql/core | @objectql/core |
| Query Optimization | Not available | @objectql/core (new!) |
| Query Analysis | Not available | @objectql/core (new!) |
| Validation | @objectql/core | @objectstack/runtime |
| Hooks | @objectql/core | @objectstack/runtime (general)<br>@objectql/core (query hooks) |
| Actions | @objectql/core | @objectstack/runtime (general)<br>@objectql/core (query actions) |
| Metadata Registry | @objectql/core | @objectstack/types |
| Context | @objectql/core | @objectstack/runtime |
| Formulas | @objectql/core | @objectstack/runtime |

## New Features in v4.0

### Query Optimization
```typescript
import { QueryOptimizer } from '@objectql/core';

const optimizer = new QueryOptimizer({
  enableIndexHints: true,
  enableJoinOptimization: true
});

const optimizedQuery = await optimizer.optimize(myQuery);
```

### Query Analysis
```typescript
import { QueryAnalyzer } from '@objectql/core';

const analyzer = new QueryAnalyzer();
const analysis = await analyzer.analyze(queryResult);

console.log(`Duration: ${analysis.duration}ms`);
console.log(`Rows scanned: ${analysis.rowsScanned}`);
console.log(`Suggestions:`, analysis.suggestions);
```

### Query Explain Plans (SQL Driver)
```typescript
const driver = new SQLDriver({ /* config */ });

// Get query execution plan
const plan = await driver.explain('users', myQuery);
console.log('Query plan:', plan);
```

## CLI Changes

### v3.x
```bash
objectql init my-app
objectql dev
objectql generate object user
```

### v4.0
```bash
# Project management (delegate to @objectstack CLI)
objectstack init my-app --plugin objectql
objectstack dev
objectstack generate object user

# Query-specific commands (ObjectQL CLI)
objectql query analyze query.json
objectql query optimize query.json
objectql query explain query.json
objectql query debug --watch
objectql query profile query.json
```

## Breaking Changes

### 1. Driver Interface
- ❌ Old `Driver` interface removed
- ✅ Must implement `DriverInterface` from `@objectstack/spec`

### 2. Type Locations
- ❌ Some types moved from `@objectql/types` to `@objectstack/types` or `@objectstack/spec`
- ✅ Re-exports provided for backward compatibility in v4.0
- ⚠️ Re-exports will be removed in v5.0

### 3. Plugin System
- ❌ Old plugin format `{ id, onEnable }` removed
- ✅ Must implement `RuntimePlugin` from `@objectstack/runtime`

### 4. Package Structure
- ❌ Some features extracted from `@objectql/core`
- ✅ Use `@objectstack` packages for general features
- ✅ ObjectQL focuses on query extensions

## Migration Checklist

- [ ] Install `@objectstack/runtime`, `@objectstack/objectql`, `@objectstack/spec`
- [ ] Update `@objectql/*` packages to v4.0
- [ ] Update driver implementations to use `DriverInterface`
- [ ] Update type imports (use compatibility guide)
- [ ] Update application initialization to use plugin architecture
- [ ] Update custom plugins to implement `RuntimePlugin`
- [ ] Test all features
- [ ] Update documentation

## Common Issues

### Issue: "Cannot find module @objectstack/runtime"
**Solution**: Install @objectstack dependencies
```bash
npm install @objectstack/runtime @objectstack/objectql @objectstack/spec
```

### Issue: "Driver does not implement DriverInterface"
**Solution**: Update driver to implement all required methods
```typescript
import { DriverInterface } from '@objectstack/spec';

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

### Issue: "Type 'ObjectConfig' cannot be found"
**Solution**: Import from @objectstack
```typescript
// Before
import type { ObjectConfig } from '@objectql/types';

// After
import type { ObjectConfig } from '@objectstack/spec';
// Or use re-export (v4.0 only, removed in v5.0)
import type { ObjectConfig } from '@objectql/types';
```

### Issue: "app.init() is deprecated"
**Solution**: Use plugin architecture
```typescript
// Old (deprecated but works in v4.0)
const app = new ObjectQL({ datasources: { default: driver } });
await app.init();

// New (recommended)
const runtime = new ObjectStack({
  plugins: [new ObjectQLPlugin()]
});
runtime.registerDriver('default', driver);
await runtime.start();
```

## Support & Resources

### Documentation
- [Complete Migration Guide](./MIGRATION_TO_OBJECTSTACK_RUNTIME.md)
- [Architecture Specification](./docs/objectstack-plugin-architecture.md)
- [Implementation Roadmap](./docs/implementation-roadmap.md)
- [Decision Matrix](./docs/migration-decision-matrix.md)

### Getting Help
- GitHub Issues: https://github.com/objectstack-ai/objectql/issues
- Discussions: https://github.com/objectstack-ai/objectql/discussions
- Discord: [ObjectStack Community]

### Version Support
- **v4.x**: Active development (current)
- **v3.x**: LTS support for 12 months (security fixes only)
- **v2.x**: End of life (no support)

## Automated Migration

We provide a migration tool to help automate the upgrade:

```bash
npx @objectql/migrate v3-to-v4

# This will:
# 1. Update package.json dependencies
# 2. Rewrite imports
# 3. Convert ObjectQL → ObjectStack + ObjectQLPlugin
# 4. Add @objectstack dependencies
# 5. Update configuration files
```

## Example Migration

Here's a complete before/after example:

### v3.x Example
```typescript
// app.ts (v3.x)
import { ObjectQL } from '@objectql/core';
import { SQLDriver } from '@objectql/driver-sql';
import type { Driver } from '@objectql/types';

const driver: Driver = new SQLDriver({
  client: 'postgresql',
  connection: {
    host: 'localhost',
    database: 'myapp'
  }
});

const app = new ObjectQL({
  datasources: { default: driver }
});

await app.init();

app.registerObject({
  name: 'users',
  fields: {
    name: { type: 'text', required: true },
    email: { type: 'text', required: true }
  }
});

const ctx = app.createContext({ isSystem: true });
const users = ctx.object('users');
await users.create({ name: 'John', email: 'john@example.com' });
```

### v4.0 Migration
```typescript
// app.ts (v4.0)
import { ObjectStack } from '@objectstack/runtime';
import { ObjectQLPlugin } from '@objectql/core';
import { SQLDriver } from '@objectql/driver-sql';
import type { DriverInterface } from '@objectstack/spec';

const driver: DriverInterface = new SQLDriver({
  client: 'postgresql',
  connection: {
    host: 'localhost',
    database: 'myapp'
  }
});

const runtime = new ObjectStack({
  plugins: [
    new ObjectQLPlugin({
      enableQueryOptimization: true,
      enableQueryAnalyzer: true
    })
  ]
});

runtime.registerDriver('default', driver);
await runtime.start();

runtime.registerObject({
  name: 'users',
  fields: {
    name: { type: 'text', required: true },
    email: { type: 'text', required: true }
  }
});

const ctx = runtime.createContext({ isSystem: true });
const users = ctx.object('users');
await users.create({ name: 'John', email: 'john@example.com' });

// New feature: Query analysis
const results = await users.find({});
const analysis = await runtime.query.analyze(results.query);
console.log('Query performance:', analysis);
```

## FAQ

**Q: Do I have to migrate to v4.0 immediately?**  
A: No, v3.x will be supported with security fixes for 12 months.

**Q: Will my v3.x code break in v4.0?**  
A: Basic usage is backward compatible. Advanced usage may need updates.

**Q: Why the architectural change?**  
A: To reduce code duplication, improve maintainability, and focus ObjectQL on query excellence.

**Q: What if @objectstack doesn't have a feature I need?**  
A: We'll work with the @objectstack team to add it, or keep it in ObjectQL temporarily.

**Q: When will v5.0 remove backward compatibility?**  
A: Estimated 12-18 months after v4.0 release.

**Q: Can I use ObjectQL without @objectstack?**  
A: No, v4.0+ requires @objectstack/runtime as the base framework.

---

**Need help?** Open an issue on GitHub or join our Discord community!
