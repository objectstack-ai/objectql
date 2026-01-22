# ObjectQL Migration to @objectstack/runtime - Complete Evaluation

**Date:** 2026-01-22  
**Version:** 1.0  
**Status:** Planning Phase

## Executive Summary

This document provides a comprehensive evaluation and checklist for migrating the ObjectQL repository to function as a **plugin repository** within the ObjectStack ecosystem. The core principle is:

> **ObjectQL should be a query-extension plugin for @objectstack/runtime, not a standalone ORM framework.**

## Current State Analysis

### What ObjectQL Is Today

ObjectQL is currently a **full-featured, metadata-driven ORM framework** with:

1. **Foundation Layer**
   - `@objectql/types`: Type definitions and interfaces
   - `@objectql/core`: Complete runtime engine with validation, repository pattern, hooks, actions, formulas
   - `@objectql/platform-node`: Node.js-specific utilities (file system, YAML loading)

2. **Driver Layer**
   - 8 database drivers (SQL, MongoDB, Memory, LocalStorage, FileSystem, Excel, Redis, SDK)
   - Each implements the Driver interface

3. **Runtime Layer**
   - `@objectql/server`: HTTP server adapter with REST APIs

4. **Tools Layer**
   - `@objectql/cli`: Complete CLI with project scaffolding
   - `vscode-objectql`: VS Code extension with IntelliSense

### What @objectstack/runtime Provides

Based on the package analysis:

- **@objectstack/spec@0.2.0**: Protocol specification with standard `DriverInterface`
- **@objectstack/objectql@0.2.0**: Core ObjectQL engine with driver management
- **@objectstack/runtime@0.2.0**: Runtime kernel with application lifecycle and plugin system
- **@objectstack/types@0.2.0**: Base type definitions

### Current Integration Status

✅ **Already Integrated:**
- ObjectQL core wraps `ObjectStackKernel`
- `ObjectQLPlugin` implements `RuntimePlugin` interface
- Drivers use `DriverInterface` from @objectstack/spec (partially)
- Dependencies declared in package.json

⚠️ **Partially Integrated:**
- Some drivers still use legacy `Driver` interface
- Type definitions have duplicates with @objectstack packages
- Core still has full ORM features (should be minimal extensions)

❌ **Not Yet Migrated:**
- Repository positioning (README, docs still show as standalone framework)
- Examples don't emphasize plugin architecture
- Heavy feature set in core (should delegate to @objectstack)

## Migration Strategy

### Guiding Principles

1. **Plugin-First Architecture**: ObjectQL extends @objectstack with query-specific features
2. **Minimal Core**: Core should only contain query extensions, not duplicate runtime features
3. **Delegation Over Duplication**: Use @objectstack packages for common functionality
4. **Backward Compatibility**: Provide migration path for existing users
5. **Clear Boundaries**: Define what belongs in ObjectQL vs @objectstack

### What Stays in ObjectQL

These are **query-specific extensions** that ObjectStack doesn't provide:

1. **Query DSL Extensions**
   - Advanced filter syntax
   - Aggregation pipeline builders
   - Join optimizations
   - Query performance analyzers

2. **Query-Specific Drivers**
   - Specialized database adapters (Excel, Redis as query targets)
   - Query optimization layers
   - Query result transformers

3. **Query Tools**
   - CLI commands for query debugging
   - VS Code query syntax highlighting
   - Query performance profilers

4. **Query Metadata**
   - Index definitions
   - Query hints
   - Performance metadata

### What Should Move to @objectstack

These are **general runtime features** that shouldn't be in a query plugin:

1. **Core Runtime Features**
   - Application lifecycle (kernel already does this)
   - Generic plugin system (runtime provides this)
   - Base metadata registry (should be in @objectstack/types)
   - Context management (should be in runtime)

2. **Data Features**
   - Basic CRUD operations (objectql package provides this)
   - Validation engine (if general-purpose)
   - Hook system (if general-purpose)
   - Action system (if general-purpose)

3. **Platform Utilities**
   - Generic file system operations
   - YAML/JSON loading (unless query-specific)
   - Configuration management

4. **Server Features**
   - Generic HTTP server adapter
   - REST API (unless query-specific endpoints)
   - Authentication/Authorization (general-purpose)

## Detailed Migration Checklist

### Phase 1: Foundation Refactoring

#### 1.1 @objectql/types Package

**Goal**: Reduce to query-specific type definitions only.

```typescript
// Keep (Query-Specific):
- QueryFilter, FilterCondition, SortField
- QueryOptions, QueryResult
- IndexSchema, QueryHint
- QueryPerformanceMetrics

// Move to @objectstack/types:
- MetadataRegistry (if general-purpose)
- ObjectConfig, FieldConfig (base definitions)
- Driver interface (already in @objectstack/spec)
- Context, ContextOptions

// Remove (Duplicate):
- Types that exist in @objectstack/spec
- Types that exist in @objectstack/types
```

**Tasks**:
- [ ] Audit all type definitions in src/
- [ ] Identify duplicates with @objectstack packages
- [ ] Create mapping: ObjectQL type → @objectstack type
- [ ] Update imports across codebase
- [ ] Add re-exports for backward compatibility
- [ ] Update package.json dependencies
- [ ] Write migration guide for type changes

#### 1.2 @objectql/core Package

**Goal**: Transform into a lightweight query-extension plugin.

**Current Size**: ~952KB  
**Target Size**: ~300KB (query features only)

**Keep**:
```typescript
- QueryBuilder: Advanced query construction
- QueryOptimizer: Query performance optimization
- QueryAnalyzer: Query introspection and analysis
- ObjectQLPlugin: Runtime plugin implementation
- Repository: If query-specific (delegate CRUD to @objectstack/objectql)
```

**Remove/Delegate**:
```typescript
- Full MetadataRegistry → Use @objectstack registry
- Generic Validator → Use @objectstack validation
- Hook system (unless query-specific) → @objectstack hooks
- Action system (unless query-specific) → @objectstack actions
- Formula engine (unless query-specific) → @objectstack formulas
- AI integration → Should be separate package or in @objectstack
```

**Tasks**:
- [ ] Create feature matrix: Keep vs Delegate vs Remove
- [ ] Refactor ObjectQL class to minimal plugin wrapper
- [ ] Delegate to ObjectStackKernel for non-query features
- [ ] Update ObjectQLPlugin to register query extensions only
- [ ] Remove or extract general-purpose features
- [ ] Update tests to use @objectstack mocks
- [ ] Measure and document size reduction

#### 1.3 @objectql/platform-node Package

**Goal**: Node.js utilities for query operations only.

**Keep**:
```typescript
- Query metadata loaders (if YAML/JSON are query-specific)
- Node.js-specific query optimizations
- File-based query caching
```

**Remove/Delegate**:
```typescript
- Generic file system operations → @objectstack
- Generic YAML loading → @objectstack
- Plugin loading system → @objectstack/runtime
- Configuration management → @objectstack
```

**Tasks**:
- [ ] Audit all utilities in src/
- [ ] Identify query-specific vs general utilities
- [ ] Move general utilities to @objectstack (if appropriate)
- [ ] Update dependencies
- [ ] Update documentation

### Phase 2: Driver Ecosystem

#### 2.1 Core Query Drivers

**Keep as ObjectQL Plugins**:
- `@objectql/driver-sql`: Query optimization for SQL databases
- `@objectql/driver-mongo`: MongoDB aggregation pipeline extensions
- `@objectql/driver-memory`: In-memory query engine for testing

**Evaluate for @objectstack**:
- `@objectql/sdk`: Generic remote driver (might belong in @objectstack)

**Tasks per Driver**:
- [ ] Ensure implements DriverInterface from @objectstack/spec
- [ ] Remove legacy Driver interface usage
- [ ] Add query-specific optimizations
- [ ] Update package.json to show as ObjectQL plugin
- [ ] Add metadata: `"keywords": ["objectql-plugin", "query-driver"]`
- [ ] Update documentation to show plugin usage

#### 2.2 Specialized Drivers

**Keep as ObjectQL Extensions**:
- `@objectql/driver-excel`: Query Excel files as data source
- `@objectql/driver-fs`: Query file system as database
- `@objectql/driver-redis`: Query Redis as data source
- `@objectql/driver-localstorage`: Browser query capabilities

These are **unique query extensions** that shouldn't be in base runtime.

**Tasks**:
- [ ] Mark as experimental/specialized in documentation
- [ ] Ensure they work as standalone plugins
- [ ] Add installation instructions for each
- [ ] Create examples for each driver
- [ ] Performance benchmarks

### Phase 3: Runtime & Server

#### 3.1 @objectql/server Package

**Decision Point**: Does this belong in ObjectQL?

**Option A: Keep (Query-Specific Server)**
- If it provides query-specific HTTP endpoints
- If it adds query performance monitoring APIs
- If it's a query execution server

**Option B: Move to @objectstack**
- If it's a generic REST server
- If it's general-purpose metadata APIs
- If it doesn't add query-specific features

**Tasks**:
- [ ] Audit all endpoints in server package
- [ ] Categorize: query-specific vs general
- [ ] If keeping: refactor to plugin architecture
- [ ] If moving: coordinate with @objectstack team
- [ ] Update examples to use new architecture

### Phase 4: Developer Tools

#### 4.1 @objectql/cli Package

**Keep**: Query-specific commands
```bash
objectql query validate <query.json>
objectql query analyze <query.json>
objectql query optimize <query.json>
objectql query debug --watch
```

**Delegate**: Project management
```bash
objectql init       → @objectstack/cli init --plugin objectql
objectql dev        → @objectstack/cli dev
objectql generate   → @objectstack/cli generate
```

**Tasks**:
- [ ] Refactor CLI to work as plugin to @objectstack CLI
- [ ] Extract query commands to separate module
- [ ] Update help text to show as ObjectQL extension
- [ ] Create integration guide for @objectstack CLI
- [ ] Update installation instructions

#### 4.2 vscode-objectql Extension

**Keep**: Query-specific features
- Query syntax highlighting
- Query validation
- Query auto-completion
- Query performance hints

**Coordinate with @objectstack**:
- General .object.yml validation → base extension
- General .validation.yml syntax → base extension
- Project management → base extension

**Tasks**:
- [ ] Split features: base vs query-specific
- [ ] Coordinate with @objectstack extension (if exists)
- [ ] Update extension.json to show as ObjectQL plugin
- [ ] Add activation events for query files only
- [ ] Update marketplace description

### Phase 5: Examples & Documentation

#### 5.1 Examples Refactoring

**Current Structure**:
```
examples/
  quickstart/hello-world/
  showcase/enterprise-erp/
  showcase/project-tracker/
  integrations/browser/
  integrations/express-server/
  drivers/excel-demo/
  drivers/fs-demo/
```

**New Structure** (Show Plugin Usage):
```
examples/
  quickstart/
    01-install-objectstack-with-objectql/
    02-first-query/
    03-advanced-filters/
  query-features/
    aggregations/
    joins/
    performance/
  specialized-drivers/
    excel-queries/
    redis-queries/
    filesystem-queries/
```

**Tasks**:
- [ ] Rewrite all examples to show @objectstack + ObjectQL plugin
- [ ] Start each example with @objectstack installation
- [ ] Show ObjectQL as extension/plugin
- [ ] Add comments explaining plugin architecture
- [ ] Update README for each example

#### 5.2 Documentation Overhaul

**README.md Updates**:

```markdown
# ObjectQL - Query Extensions for ObjectStack

**Advanced query capabilities for the ObjectStack framework.**

ObjectQL extends [ObjectStack](https://github.com/objectstack) with:
- 🔍 Advanced query DSL and filters
- 🚀 Query performance optimization
- 🔌 Specialized data source drivers (Excel, Redis, FileSystem)
- 🛠️ Query debugging and analysis tools

## Installation

```bash
# First, install ObjectStack
npm install @objectstack/runtime @objectstack/objectql

# Then, add ObjectQL query extensions
npm install @objectql/core @objectql/driver-sql
```

## Quick Start

```typescript
import { ObjectStack } from '@objectstack/runtime';
import { ObjectQLPlugin } from '@objectql/core';

const app = new ObjectStack({
  plugins: [
    new ObjectQLPlugin({
      enableQueryOptimization: true,
      enableQueryAnalyzer: true
    })
  ]
});
```
```

**Tasks**:
- [ ] Rewrite README.md completely
- [ ] Update all documentation to show plugin usage
- [ ] Create new "Plugin Development Guide"
- [ ] Update RUNTIME_INTEGRATION.md
- [ ] Create MIGRATION_FROM_V3.md guide
- [ ] Update architecture diagrams
- [ ] Add badges showing @objectstack compatibility

### Phase 6: Package Configuration

#### 6.1 Package.json Updates

**For All Packages**:
```json
{
  "keywords": [
    "objectstack-plugin",
    "objectql",
    "query-extension"
  ],
  "peerDependencies": {
    "@objectstack/runtime": "^0.2.0",
    "@objectstack/objectql": "^0.2.0",
    "@objectstack/spec": "^0.2.0"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/objectstack-ai/objectql",
    "directory": "packages/..."
  }
}
```

**Tasks**:
- [ ] Update all package.json files
- [ ] Add peerDependencies for @objectstack packages
- [ ] Update keywords to show as plugins
- [ ] Set correct version constraints
- [ ] Update descriptions to mention ObjectStack
- [ ] Add funding information
- [ ] Update author/maintainer info

#### 6.2 Workspace Configuration

**pnpm-workspace.yaml**:
- Keep current structure (still monorepo)
- Add build order to ensure @objectstack deps first
- Update scripts to reference base runtime

**Tasks**:
- [ ] Review workspace configuration
- [ ] Update build scripts
- [ ] Add pre-build checks for @objectstack packages
- [ ] Update CI/CD pipeline
- [ ] Configure package publishing order

### Phase 7: Testing & Validation

#### 7.1 Test Migration

**Update Test Strategy**:
```typescript
// Old (Standalone):
import { ObjectQL } from '@objectql/core';
const app = new ObjectQL({ datasources: { default: driver } });

// New (Plugin):
import { ObjectStack } from '@objectstack/runtime';
import { ObjectQLPlugin } from '@objectql/core';

const app = new ObjectStack({
  plugins: [new ObjectQLPlugin()],
  datasources: { default: driver }
});
```

**Tasks**:
- [ ] Audit all test files
- [ ] Update to use plugin architecture
- [ ] Create test helpers for ObjectStack + ObjectQL
- [ ] Ensure all tests pass with new architecture
- [ ] Add integration tests for plugin interaction
- [ ] Performance regression tests
- [ ] Create test coverage report

#### 7.2 Compatibility Testing

**Version Matrix**:
- @objectstack/runtime: 0.2.0, 0.3.0, ...
- @objectql/core: 4.0.0, 4.1.0, ...
- Node.js: 18.x, 20.x, 22.x

**Tasks**:
- [ ] Create compatibility test matrix
- [ ] Test all driver combinations
- [ ] Test all example applications
- [ ] Browser compatibility tests
- [ ] Performance benchmarks vs v3
- [ ] Document breaking changes
- [ ] Create migration validation script

### Phase 8: Release & Migration

#### 8.1 Versioning Strategy

**Proposed Versions**:
- `@objectql/core@4.0.0`: Breaking change (plugin architecture)
- `@objectql/types@4.0.0`: Breaking change (removed duplicates)
- All drivers: `@4.0.0` (require new core)
- All tools: `@4.0.0` (require new core)

**Tasks**:
- [ ] Create CHANGELOG.md for each package
- [ ] Document all breaking changes
- [ ] Create upgrade guide
- [ ] Add deprecation warnings in v3.x
- [ ] Plan LTS support for v3.x
- [ ] Set EOL date for v3.x

#### 8.2 Migration Guide

**Create Comprehensive Guide**:
- v3 → v4 migration steps
- Code examples: before/after
- Common migration issues
- Automated migration script (if possible)
- FAQ section

**Tasks**:
- [ ] Write MIGRATING_FROM_V3.md
- [ ] Create code mod tool (if feasible)
- [ ] Record video tutorial
- [ ] Create migration checklist for users
- [ ] Set up community support channels
- [ ] Prepare blog post announcement

## Implementation Phases

### Timeline (Estimated)

**Phase 1: Planning & Design** (2 weeks)
- Complete this evaluation
- Get stakeholder approval
- Finalize architectural decisions

**Phase 2: Foundation Refactoring** (4 weeks)
- Refactor types, core, platform-node
- Update internal dependencies
- Create base plugin architecture

**Phase 3: Driver Migration** (3 weeks)
- Update all drivers
- Ensure DriverInterface compliance
- Test driver ecosystem

**Phase 4: Tools & Runtime** (3 weeks)
- Refactor CLI, VS Code extension
- Update server package
- Create developer tools

**Phase 5: Examples & Docs** (2 weeks)
- Rewrite all examples
- Update documentation
- Create migration guides

**Phase 6: Testing & Validation** (2 weeks)
- Comprehensive testing
- Performance validation
- Community beta testing

**Phase 7: Release** (1 week)
- Final QA
- Package publishing
- Announcement and support

**Total**: ~17 weeks (~4 months)

## Success Criteria

### Technical Metrics

- [ ] Core package size reduced by 50%+ (from ~950KB to ~400KB)
- [ ] Zero duplicate types with @objectstack packages
- [ ] All packages use @objectstack peerDependencies
- [ ] 100% test coverage maintained
- [ ] Performance regression < 5%
- [ ] All examples work with plugin architecture

### Documentation Metrics

- [ ] README clearly shows as ObjectStack plugin
- [ ] Complete migration guide available
- [ ] All examples updated
- [ ] API documentation complete
- [ ] Architecture diagrams updated

### Community Metrics

- [ ] Migration guide shared with users
- [ ] Beta testing with real projects
- [ ] Support channels established
- [ ] FAQ addressing common issues
- [ ] Positive community feedback

## Risks & Mitigations

### Risk 1: Breaking Changes

**Risk**: v4 breaks all existing code  
**Mitigation**:
- Provide comprehensive migration guide
- Create automated migration tool
- Maintain v3.x LTS for 12 months
- Add compatibility layer if feasible

### Risk 2: @objectstack Dependency

**Risk**: Dependent on external package updates  
**Mitigation**:
- Clear SLA with @objectstack team
- Version pinning strategy
- Contribute to @objectstack if needed
- Maintain fallback implementations

### Risk 3: Scope Creep

**Risk**: Unclear boundaries (what stays vs moves)  
**Mitigation**:
- Clear decision framework
- Stakeholder approval required
- Document all decisions
- Regular scope reviews

### Risk 4: User Adoption

**Risk**: Users don't migrate to v4  
**Mitigation**:
- Clear value proposition
- Easy migration path
- Excellent documentation
- Community support
- Highlight new features

## Decision Framework

When deciding if a feature belongs in ObjectQL or @objectstack:

1. **Is it query-specific?**
   - YES → Keep in ObjectQL
   - NO → Consider moving to @objectstack

2. **Does @objectstack already provide it?**
   - YES → Remove from ObjectQL, use @objectstack
   - NO → Evaluate if it should be in @objectstack

3. **Is it a specialized driver?**
   - YES → Keep in ObjectQL (if unique)
   - NO → Might belong in @objectstack

4. **Is it a development tool?**
   - Query-specific → Keep in ObjectQL
   - General-purpose → Coordinate with @objectstack

5. **When in doubt:**
   - Bias toward @objectstack for general features
   - Keep in ObjectQL only if clearly query-specific

## Next Steps

### Immediate Actions (Week 1)

1. **Stakeholder Review**
   - [ ] Share this document with team
   - [ ] Get approval on migration strategy
   - [ ] Finalize timeline

2. **Technical Setup**
   - [ ] Create feature branch: `migration/objectstack-runtime-v4`
   - [ ] Set up migration tracking board
   - [ ] Create RFC template for decisions

3. **Community Communication**
   - [ ] Draft announcement
   - [ ] Prepare FAQ
   - [ ] Set up migration discussion channel

### Weekly Milestones

- **Week 2-3**: Phase 1 (Foundation) complete
- **Week 4-6**: Phase 2 (Drivers) complete
- **Week 7-9**: Phase 3 (Tools) complete
- **Week 10-11**: Phase 4 (Examples) complete
- **Week 12-13**: Phase 5 (Testing) complete
- **Week 14**: Phase 6 (Release) complete

## Conclusion

This migration transforms ObjectQL from a **standalone ORM framework** into a **specialized query-extension plugin** for the ObjectStack ecosystem.

**Key Benefits**:
1. ✅ Clear separation of concerns
2. ✅ Reduced code duplication
3. ✅ Better maintenance (delegate to @objectstack)
4. ✅ Modular architecture
5. ✅ Focused on query excellence

**Key Challenges**:
1. ⚠️ Breaking changes require user migration
2. ⚠️ Dependency on @objectstack packages
3. ⚠️ Significant refactoring effort
4. ⚠️ Need clear communication

**Recommendation**: **Proceed with migration** using the phased approach outlined above.

---

**Document Owner**: ObjectQL Architecture Team  
**Last Updated**: 2026-01-22  
**Next Review**: Weekly during migration
