# ObjectQL Migration Summary

## What is this migration about?

ObjectQL is transitioning from a **standalone ORM framework** to a **plugin ecosystem for ObjectStack**. This repositions ObjectQL as a collection of query-related extensions built on top of the @objectstack/runtime architecture.

## Why this migration?

1. **Avoid Duplication**: @objectstack/runtime already provides core runtime, query engine, and plugin system functionality
2. **Better Separation of Concerns**: ObjectQL focuses on what it does best - advanced query capabilities and database drivers
3. **Leverage ObjectStack Ecosystem**: Benefit from the broader ObjectStack platform and community
4. **Plugin Architecture**: Make ObjectQL components more modular and composable

## What changes for users?

### Current Usage (v3.x)
```typescript
import { ObjectQL } from '@objectql/core';
import { SQLDriver } from '@objectql/driver-sql';

const app = new ObjectQL({
  datasources: {
    default: new SQLDriver(config)
  }
});

await app.init();
const ctx = app.createContext({ isSystem: true });
const users = ctx.object('users');
await users.find({ filters: [/*...*/] });
```

### New Usage (v4.x - Plugin Model)
```typescript
import { ObjectStackKernel } from '@objectstack/runtime';
import { ObjectQLPlugin } from '@objectql/core';
import { SQLDriver } from '@objectql/driver-sql';

const kernel = new ObjectStackKernel({
  datasources: {
    default: new SQLDriver(config)
  }
});

// Install ObjectQL plugin for enhanced query features
kernel.use(new ObjectQLPlugin());

await kernel.init();
const ctx = kernel.createContext({ isSystem: true });
const users = ctx.object('users');
await users.find({ filters: [/*...*/] }); // Same API!
```

### Backward Compatibility (v4.x)
```typescript
// Legacy API still works through compatibility layer
import { ObjectQL } from '@objectql/core';
import { SQLDriver } from '@objectql/driver-sql';

const app = new ObjectQL({
  datasources: { default: new SQLDriver(config) }
});
// Internally uses ObjectStack kernel + ObjectQL plugin
```

## What stays the same?

✅ **Repository Pattern API** - `find()`, `create()`, `update()`, `delete()` methods  
✅ **All 9 Database Drivers** - SQL, MongoDB, Memory, LocalStorage, FS, Excel, Redis, SDK  
✅ **Validation Engine** - Field validation, cross-field validation, custom validators  
✅ **Formula Engine** - Computed fields and formula expressions  
✅ **AI Agent** - Query generation and explanation  
✅ **Developer Tools** - CLI, VSCode extension, project scaffolding  

## What changes?

🔄 **Architecture** - Built on @objectstack/runtime instead of standalone  
🔄 **Type System** - Uses @objectstack/spec as base, ObjectQL adds extensions  
🔄 **Driver Interface** - Implements @objectstack DriverInterface  
🔄 **Plugin System** - Components are plugins, not monolithic  
🔄 **Package Dependencies** - @objectstack/* as peer dependencies  

## Migration Timeline

| Phase | Duration | Status |
|-------|----------|--------|
| 1. Dependency Alignment | 2 weeks | 📅 Planning |
| 2. Types Consolidation | 1 week | 📅 Planning |
| 3. Core Refactoring | 2 weeks | 📅 Planning |
| 4. Driver Migration | 2 weeks | 📅 Planning |
| 5. Runtime & Tools | 1 week | 📅 Planning |
| 6. Documentation | 1 week | 📅 Planning |
| 7. Testing | 1 week | 📅 Planning |
| 8. Publishing | 1 week | 📅 Planning |

**Total Estimated Time**: 11 weeks

## Current Status

✅ **Assessment Complete** - Repository analyzed, dependencies identified  
✅ **Migration Plan Created** - Comprehensive 8-phase plan documented  
✅ **Implementation Roadmap** - Detailed task breakdown with code examples  
📅 **Next**: Begin Phase 1 - Dependency Alignment

## Key Documents

1. **[MIGRATION_TO_OBJECTSTACK.md](./MIGRATION_TO_OBJECTSTACK.md)** - Full migration plan (English)
2. **[MIGRATION_TO_OBJECTSTACK.zh-CN.md](./MIGRATION_TO_OBJECTSTACK.zh-CN.md)** - 完整迁移计划（中文）
3. **[IMPLEMENTATION_ROADMAP.md](./IMPLEMENTATION_ROADMAP.md)** - Actionable tasks with code

## Package Transformation

| Package | Current Role | New Role |
|---------|-------------|----------|
| @objectql/types | Type definitions | Query type extensions only |
| @objectql/core | Runtime engine | Query engine plugin |
| @objectql/platform-node | Platform layer | Platform plugin utilities |
| @objectql/driver-sql | SQL driver | @objectstack-compatible SQL driver |
| @objectql/driver-mongo | MongoDB driver | @objectstack-compatible Mongo driver |
| @objectql/driver-memory | Memory driver | @objectstack-compatible Memory driver |
| @objectql/driver-* | Other drivers | @objectstack-compatible drivers |
| @objectql/server | HTTP server | Server plugin for @objectstack/runtime |
| @objectql/cli | CLI tool | ObjectStack-aware CLI |
| vscode-objectql | VS Code extension | ObjectStack + ObjectQL extension |

## Risk Mitigation

### Potential Risks
1. **Breaking Changes** - Some APIs may change
2. **Performance** - Need to ensure no regression
3. **Community Impact** - Users need to migrate

### Mitigation Strategies
1. **Compatibility Layer** - Maintain v3.x API surface
2. **Comprehensive Testing** - 100% test coverage maintained
3. **Migration Tools** - Automated migration assistance
4. **Documentation** - Clear migration guide with examples
5. **Support Period** - v3.x maintained for 6 months

## Success Metrics

### Technical
- ✅ All 97 source files successfully migrated
- ✅ Zero duplicate type definitions
- ✅ All 9 drivers implement @objectstack DriverInterface
- ✅ Test coverage ≥ 80%
- ✅ Performance within 5% of v3.x

### Community
- ✅ 50+ successful migrations using guide
- ✅ < 5 critical bugs in first month
- ✅ Positive early adopter feedback
- ✅ 3+ community plugin contributions

## Questions?

- **GitHub Issues**: https://github.com/objectstack-ai/objectql/issues
- **Discussions**: Create topic in repository discussions
- **Migration Support**: Tag issues with `migration` label

---

**Last Updated**: 2026-01-21  
**Status**: Planning Phase  
**Version**: v3.x → v4.x migration
