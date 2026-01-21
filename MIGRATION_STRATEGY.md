# ObjectQL Migration to @objectstack/runtime Architecture

## Executive Summary

This document outlines the comprehensive strategy for migrating ObjectQL from a standalone framework to a **plugin-based architecture** built on top of @objectstack/runtime. The goal is to reposition this repository as a specialized **query extension plugin** for the ObjectStack ecosystem.

## Vision & Objectives

### New Repository Role
**From:** Full-featured, standalone ORM framework  
**To:** Specialized query plugin repository for @objectstack/runtime

### Core Principles
1. **Plugin-First Architecture**: All query-related functionality as composable plugins
2. **Runtime Delegation**: Leverage @objectstack/runtime for application lifecycle, metadata, and core operations
3. **Backward Compatibility**: Maintain API compatibility during transition period
4. **Minimal Core**: Keep only query-specific logic in this repository

## Current State Analysis

### Existing @objectstack Integration (v3.0.1)

✅ **Already Integrated:**
- `@objectstack/spec@0.1.2` - Driver interface protocol
- `@objectstack/runtime@0.1.1` - Runtime kernel (type exports only)
- `@objectstack/objectql@0.1.1` - Core engine (type exports only)

❌ **Not Yet Using:**
- @objectstack/runtime application lifecycle
- @objectstack/runtime plugin system
- @objectstack/runtime metadata registry
- @objectstack/runtime context management
- @objectstack/runtime validation engine

### Current Architecture

```
@objectql/core (Current - Standalone)
├── Own metadata registry
├── Own driver management
├── Own hooks system
├── Own actions system
├── Own validation engine
├── Own formula engine
├── Own AI agent integration
└── Own repository pattern
```

### Target Architecture

```
@objectstack/runtime (Foundation)
├── Application lifecycle
├── Metadata registry
├── Plugin system
├── Context management
├── Core validation
└── Driver orchestration

@objectql/* (Query Plugins)
├── @objectql/query-validation (plugin)
├── @objectql/query-optimizer (plugin)
├── @objectql/query-cache (plugin)
├── @objectql/formula-engine (plugin)
├── @objectql/ai-query-generator (plugin)
└── @objectql/advanced-repository (plugin)
```

## Migration Strategy

### Phase-Based Approach

#### Phase 1: Foundation Analysis (Week 1-2)
**Goal:** Deep understanding and planning

**Tasks:**
1. Map all @objectql/core functionality to @objectstack/runtime equivalents
2. Identify functionality that belongs in @objectstack/runtime vs. plugins
3. Create detailed dependency graph
4. Design plugin interfaces and boundaries
5. Plan backward compatibility strategy

**Deliverables:**
- Detailed feature comparison matrix
- Plugin architecture design document
- Migration decision tree
- Rollback plan

#### Phase 2: Runtime Kernel Integration (Week 3-4)
**Goal:** Replace core engine with @objectstack/runtime

**Tasks:**
1. Replace ObjectQL app class with @objectstack/runtime kernel
2. Migrate initialization flow to runtime bootstrap
3. Update metadata registry to use runtime's registry
4. Implement compatibility layer for existing APIs
5. Update tests to validate runtime integration

**Breaking Changes:**
- ObjectQL constructor signature changes
- Initialization pattern changes
- Internal APIs deprecated

**Compatibility Layer:**
```typescript
// Old API (deprecated but supported)
const app = new ObjectQL({ datasources: {...} });
await app.init();

// New API (preferred)
import { createRuntime } from '@objectstack/runtime';
import { queryPlugin } from '@objectql/query-plugin';

const runtime = createRuntime({
  plugins: [queryPlugin()]
});
await runtime.initialize();
```

#### Phase 3: Driver Plugin Migration (Week 5-6)
**Goal:** Drivers as @objectstack/runtime plugins

**Tasks:**
1. Create driver plugin wrapper for @objectstack/runtime
2. Migrate each driver to plugin model
3. Update driver registration to runtime plugin system
4. Implement driver lifecycle hooks
5. Update driver documentation

**Plugin Structure:**
```typescript
export function sqlDriverPlugin(config: SQLConfig): RuntimePlugin {
  return {
    name: '@objectql/driver-sql',
    version: '4.0.0',
    
    async setup(runtime: Runtime) {
      const driver = new SQLDriver(config);
      runtime.registerDriver(driver);
    },
    
    async teardown(runtime: Runtime) {
      await runtime.getDriver('sql').disconnect();
    }
  };
}
```

#### Phase 4: Query Functionality as Plugins (Week 7-10)
**Goal:** Extract all query-related logic into composable plugins

**Plugins to Create:**

1. **@objectql/query-validation**
   - Field validation
   - Cross-field validation
   - Custom validators
   - Error formatting

2. **@objectql/query-optimizer**
   - Query plan optimization
   - Index hints
   - Join optimization
   - Projection pruning

3. **@objectql/query-cache**
   - Result caching
   - Query normalization
   - Cache invalidation
   - TTL management

4. **@objectql/formula-engine**
   - Formula parsing
   - Expression evaluation
   - Built-in functions
   - Custom function registration

5. **@objectql/ai-query-generator**
   - Natural language to query AST
   - Query suggestion
   - Semantic understanding
   - Context-aware generation

6. **@objectql/advanced-repository**
   - Enhanced CRUD operations
   - Batch operations
   - Transaction management
   - Event tracking

**Plugin API Design:**
```typescript
export interface QueryPlugin extends RuntimePlugin {
  // Query lifecycle hooks
  beforeQuery?(ast: QueryAST): Promise<QueryAST>;
  afterQuery?(result: any): Promise<any>;
  
  // Validation hooks
  validateQuery?(ast: QueryAST): Promise<ValidationResult>;
  
  // Optimization hooks
  optimizeQuery?(ast: QueryAST): Promise<QueryAST>;
}
```

#### Phase 5: Hooks & Actions as Runtime Features (Week 11-12)
**Goal:** Align with @objectstack/runtime event system

**Tasks:**
1. Map ObjectQL hooks to runtime events
2. Migrate action system to runtime commands
3. Update registration APIs
4. Implement backward compatibility
5. Update event documentation

**Mapping:**
```typescript
// Old: ObjectQL hooks
app.on('beforeCreate', 'users', async (ctx) => {});

// New: Runtime events
runtime.on('entity.beforeCreate', 'users', async (ctx) => {});

// Old: ObjectQL actions
app.registerAction('users', 'approve', async (ctx) => {});

// New: Runtime commands
runtime.registerCommand('users.approve', async (ctx) => {});
```

#### Phase 6: Repository Pattern Enhancement (Week 13-14)
**Goal:** Repository as thin wrapper over runtime context

**Tasks:**
1. Refactor ObjectRepository to use runtime context
2. Delegate operations to runtime
3. Add plugin hooks to repository methods
4. Update query builder integration
5. Enhance with plugin capabilities

**New Repository:**
```typescript
class RuntimeRepository {
  constructor(
    private runtime: Runtime,
    private objectName: string,
    private context: RuntimeContext
  ) {}
  
  async find(query: QueryAST) {
    // Plugin hooks: beforeQuery
    const optimized = await this.runtime.executeHook(
      'query.beforeExecute',
      query
    );
    
    // Execute via runtime
    const result = await this.runtime.execute(optimized);
    
    // Plugin hooks: afterQuery
    return await this.runtime.executeHook(
      'query.afterExecute',
      result
    );
  }
}
```

#### Phase 7: Tools & CLI Update (Week 15-16)
**Goal:** Tools that generate @objectstack/runtime compatible code

**Tasks:**
1. Update CLI to generate runtime-based projects
2. Update create templates
3. Update VSCode extension schemas
4. Update dev server for runtime
5. Update code generation

#### Phase 8: Documentation & Examples (Week 17-18)
**Goal:** Comprehensive documentation for new architecture

**Documents to Create/Update:**
1. Migration Guide (detailed steps)
2. Plugin Development Guide
3. Architecture Overview
4. API Reference (new APIs)
5. Breaking Changes Guide
6. FAQ for migration

**Examples to Update:**
- Hello World → Runtime-based
- Project Tracker → Plugin composition
- Enterprise ERP → Advanced plugins
- Browser Integration → Runtime in browser
- Custom Driver → Runtime driver plugin

#### Phase 9: Testing & Validation (Week 19-20)
**Goal:** Ensure quality and compatibility

**Testing Strategy:**
1. Unit tests for all plugins
2. Integration tests for runtime
3. Backward compatibility tests
4. Performance benchmarks
5. Security audit
6. Cross-environment testing

**Quality Gates:**
- ✅ 90%+ test coverage
- ✅ All existing tests pass with compatibility layer
- ✅ No performance regression
- ✅ Zero high-severity security issues
- ✅ All examples functional

#### Phase 10: Release & Support (Week 21-22)
**Goal:** Smooth transition for users

**Release Plan:**
1. Alpha release (internal testing)
2. Beta release (early adopters)
3. RC release (community feedback)
4. GA release (production ready)

**Version Strategy:**
- v3.x → v4.0.0 (major breaking change)
- v3.x maintenance for 6 months
- Deprecation warnings in v3.x
- Migration tools provided

## Technical Decisions

### 1. Backward Compatibility Strategy

**Approach:** Dual API support during transition

```typescript
// @objectql/core v4.0.0
export class ObjectQL {
  private runtime: Runtime;
  
  constructor(config: ObjectQLConfig | RuntimeConfig) {
    if (isLegacyConfig(config)) {
      console.warn('Legacy API detected. Please migrate to @objectstack/runtime');
      this.runtime = createRuntimeFromLegacy(config);
    } else {
      this.runtime = createRuntime(config);
    }
  }
}
```

**Deprecation Timeline:**
- v4.0.0: Legacy API supported with warnings
- v4.1.0: Legacy API deprecated (still functional)
- v5.0.0: Legacy API removed

### 2. Plugin Loading Strategy

**Options:**
1. **Static Import** - Compile-time plugin inclusion
2. **Dynamic Import** - Runtime plugin loading
3. **Hybrid** - Core plugins static, extensions dynamic

**Decision:** Hybrid approach
- Core query plugins: Static (bundled)
- Extended plugins: Dynamic (on-demand)
- Driver plugins: Dynamic (environment-specific)

### 3. Metadata Ownership

**Decision:** Migrate to @objectstack/runtime metadata registry

**Rationale:**
- Centralized schema management
- Cross-plugin metadata sharing
- Consistent validation
- Better tooling support

**Migration:**
```typescript
// Old: Local registry
this.metadata = new MetadataRegistry();

// New: Runtime registry
const registry = runtime.getRegistry();
registry.registerObject({...});
```

### 4. Context Management

**Decision:** Use @objectstack/runtime context

**Benefits:**
- Unified context across plugins
- Better security (RBAC integrated)
- Consistent transaction management
- Audit trail built-in

### 5. Query AST Standard

**Decision:** Adopt @objectstack/spec QueryAST

**Impact:**
- All drivers use same AST format
- Query builder generates standard AST
- Validation against standard schema
- Cross-driver query portability

## Risk Assessment

### High Risk
1. **Breaking Changes Impact**
   - Mitigation: Comprehensive compatibility layer, clear migration guide
   
2. **Performance Regression**
   - Mitigation: Continuous benchmarking, optimization focus

3. **Plugin System Complexity**
   - Mitigation: Clear plugin API, extensive examples, helper utilities

### Medium Risk
1. **Documentation Lag**
   - Mitigation: Docs-first approach, community feedback

2. **Third-party Integration Issues**
   - Mitigation: Early beta release, partnership program

### Low Risk
1. **Tool Compatibility**
   - Mitigation: VSCode extension update included

2. **Example Maintenance**
   - Mitigation: Automated example testing

## Success Metrics

### Technical Metrics
- [ ] 100% driver compatibility with @objectstack/spec
- [ ] 90%+ test coverage maintained
- [ ] <10% performance overhead vs. v3.x
- [ ] Zero critical security vulnerabilities

### User Metrics
- [ ] 80%+ user migration within 6 months
- [ ] <5% increase in issue reports post-release
- [ ] Positive community feedback on plugin system
- [ ] Active plugin ecosystem (5+ third-party plugins)

### Code Quality Metrics
- [ ] All packages follow @objectstack conventions
- [ ] Reduced core package size by 60%+
- [ ] Improved modularity score
- [ ] Decreased coupling between packages

## Timeline Summary

| Phase | Duration | Completion |
|-------|----------|------------|
| Analysis | 2 weeks | Week 2 |
| Runtime Integration | 2 weeks | Week 4 |
| Driver Migration | 2 weeks | Week 6 |
| Plugin Development | 4 weeks | Week 10 |
| Hooks/Actions | 2 weeks | Week 12 |
| Repository Update | 2 weeks | Week 14 |
| Tools Update | 2 weeks | Week 16 |
| Documentation | 2 weeks | Week 18 |
| Testing | 2 weeks | Week 20 |
| Release | 2 weeks | Week 22 |

**Total Duration:** ~5-6 months

## Next Steps

### Immediate Actions (This Week)
1. ✅ Create migration strategy document (this document)
2. ⏭️ Set up @objectstack/runtime development environment
3. ⏭️ Create feature comparison matrix
4. ⏭️ Design plugin architecture diagram
5. ⏭️ Schedule team review meeting

### Phase 1 Kickoff (Next Week)
1. Deep dive into @objectstack/runtime codebase
2. Map ObjectQL features to runtime equivalents
3. Prototype first plugin (query-validation)
4. Create migration decision tree
5. Draft backward compatibility design

## Appendix

### A. Package Dependency Changes

**Before Migration:**
```
@objectql/core
└── @objectql/types

@objectql/driver-sql
├── @objectql/types
└── knex
```

**After Migration:**
```
@objectql/query-validation (plugin)
├── @objectstack/runtime
└── @objectstack/spec

@objectql/driver-sql (plugin)
├── @objectstack/runtime
├── @objectstack/spec
└── knex
```

### B. Configuration Changes

**Before (v3.x):**
```typescript
const app = new ObjectQL({
  datasources: {
    default: new SQLDriver({ connection: '...' })
  },
  plugins: [validationPlugin]
});
```

**After (v4.x):**
```typescript
import { createRuntime } from '@objectstack/runtime';
import { sqlDriverPlugin } from '@objectql/driver-sql';
import { queryValidationPlugin } from '@objectql/query-validation';

const runtime = createRuntime({
  plugins: [
    sqlDriverPlugin({ connection: '...' }),
    queryValidationPlugin()
  ]
});
```

### C. Reference Links

- [@objectstack/runtime Documentation](https://github.com/objectstack-ai/runtime)
- [@objectstack/spec Specification](https://github.com/objectstack-ai/spec)
- [ObjectQL v3.x Documentation](./README.md)
- [Plugin Development Guide](./docs/guide/plugin-development.md) (To be created)

---

**Document Version:** 1.0.0  
**Last Updated:** 2026-01-21  
**Status:** Draft - Awaiting Review
