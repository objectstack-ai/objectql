# ObjectQL Migration to @objectstack/runtime Architecture

## Executive Summary

This document outlines the comprehensive migration plan for transitioning the ObjectQL repository from a standalone ORM framework to a **plugin ecosystem** built on top of the @objectstack/runtime architecture.

**Key Principle**: This repository will become a collection of query-related plugin extensions for the ObjectStack framework, focusing on enhanced query capabilities, multiple database drivers, and developer tools.

---

## Current State Analysis

### Repository Overview
- **Total TypeScript Files**: 97 source files
- **Package Count**: 12 packages organized in 4 layers
- **Current Dependencies**: Already uses @objectstack/spec (0.2.0), @objectstack/runtime (0.1.1), @objectstack/objectql (0.1.1)

### Package Structure

#### Foundation Layer
1. **@objectql/types** (376KB)
   - Type definitions and interfaces
   - Currently has dependency on @objectstack/spec
   - Contains ObjectQL-specific types that may overlap with @objectstack

2. **@objectql/core** (352KB)
   - Main runtime engine
   - Includes: Repository, Validator, FormulaEngine, App, AI Agent
   - Already imports types from @objectstack/runtime and @objectstack/objectql
   - Needs refactoring to avoid duplicating base runtime functionality

3. **@objectql/platform-node** (132KB)
   - Node.js platform utilities
   - File system integration, YAML loading, plugin management
   - Uses @objectstack/spec

#### Driver Layer (9 Drivers)
- **@objectql/driver-sql** (116KB) - PostgreSQL, MySQL, SQLite, SQL Server
- **@objectql/driver-mongo** (92KB) - MongoDB with aggregation pipeline
- **@objectql/driver-memory** (80KB) - Universal in-memory driver
- **@objectql/driver-localstorage** (84KB) - Browser storage
- **@objectql/driver-fs** (96KB) - File system JSON storage
- **@objectql/driver-excel** (120KB) - Excel file support
- **@objectql/driver-redis** (68KB) - Redis key-value store
- **@objectql/driver-sdk** (76KB) - Remote HTTP driver

#### Runtime Layer
- **@objectql/server** (288KB) - HTTP server with GraphQL and REST

#### Tools Layer
- **@objectql/cli** (256KB) - Command-line interface
- **@objectql/create** (44KB) - Project scaffolding
- **vscode-objectql** (308KB) - VS Code extension

---

## Target Architecture

### New Positioning

```
┌─────────────────────────────────────────────────────────────┐
│                    @objectstack/runtime                      │
│  (Core Runtime, Base Query Engine, Plugin System)            │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│               ObjectQL Plugin Ecosystem                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Query Engine │  │   Drivers    │  │ Dev Tools    │      │
│  │  Extensions  │  │  SQL/Mongo/  │  │  CLI/VSCode  │      │
│  │              │  │   Memory...  │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Package Transformation

| Current Package | New Role | Changes Required |
|----------------|----------|------------------|
| @objectql/types | Query Type Extensions | Remove overlaps with @objectstack/types, keep only query-specific types |
| @objectql/core | Query Engine Plugin | Extract runtime logic, keep Repository/Validator/Formula as plugins |
| @objectql/platform-node | Platform Adapter Plugin | Align with @objectstack plugin loading |
| @objectql/driver-* | Driver Plugins | Implement @objectstack DriverInterface |
| @objectql/server | Server Plugin | Extend @objectstack/runtime server |
| @objectql/cli | CLI Plugin | Work with @objectstack projects |
| vscode-objectql | Editor Extension | Reference @objectstack/spec |

---

## Migration Strategy

### Phase 1: Dependency Alignment (Week 1-2)

**Objective**: Update all packages to use latest @objectstack/* versions

**Tasks**:
1. Update package.json files across all packages
   ```json
   {
     "peerDependencies": {
       "@objectstack/runtime": "^0.2.0",
       "@objectstack/spec": "^0.2.0",
       "@objectstack/objectql": "^0.2.0"
     }
   }
   ```

2. Run dependency audit
   ```bash
   pnpm update @objectstack/runtime @objectstack/spec @objectstack/objectql
   pnpm install
   ```

3. Fix compilation errors from API changes

**Success Criteria**:
- ✅ All packages build successfully
- ✅ No duplicate type definitions
- ✅ Tests pass with new dependencies

---

### Phase 2: Types Consolidation (Week 2-3)

**Objective**: Eliminate type duplication between @objectql/types and @objectstack

**Tasks**:

1. **Audit Type Overlaps**
   - Create mapping document: ObjectQL type → @objectstack equivalent
   - Identify ObjectQL-specific types to keep (query extensions, repository patterns)

2. **Refactor @objectql/types**
   ```typescript
   // Before
   export interface ObjectConfig { ... }
   export interface QueryFilter { ... }
   
   // After
   export type { ServiceObject as ObjectConfig } from '@objectstack/spec';
   export interface QueryExtensions {
     // Only ObjectQL-specific query enhancements
   }
   ```

3. **Update Imports Across Codebase**
   - Replace `@objectql/types` imports with `@objectstack/spec` where applicable
   - Use find/replace with verification

**Success Criteria**:
- ✅ @objectql/types only exports ObjectQL-specific extensions
- ✅ No duplicate interfaces
- ✅ All packages compile and test

---

### Phase 3: Core Engine Refactoring (Week 3-5)

**Objective**: Transform @objectql/core into a plugin for @objectstack/runtime

**Current Core Components**:
- `app.ts` - Main ObjectQL application class
- `repository.ts` - CRUD operations wrapper
- `validator.ts` - Validation engine
- `formula-engine.ts` - Formula calculation
- `ai-agent.ts` - AI integration
- `hook.ts` - Lifecycle hooks
- `action.ts` - Custom actions

**Refactoring Plan**:

1. **App.ts → Plugin Registration**
   ```typescript
   // Before: Standalone App
   export class ObjectQL implements IObjectQL {
     constructor(config: ObjectQLConfig) { ... }
   }
   
   // After: Plugin for ObjectStack
   import { ObjectStackKernel, Plugin } from '@objectstack/runtime';
   
   export class ObjectQLPlugin implements Plugin {
     name = '@objectql/query-extensions';
     
     install(kernel: ObjectStackKernel) {
       // Register repository pattern
       // Register validators
       // Register formula engine
     }
   }
   ```

2. **Repository Pattern as Plugin**
   - Keep the Repository pattern as an ObjectQL enhancement
   - Register it as middleware in @objectstack/runtime
   - Maintain API compatibility

3. **Validator as Plugin**
   - Integrate with @objectstack validation system
   - Keep ObjectQL-specific validation rules

4. **Formula Engine as Plugin**
   - Register as @objectstack formula provider
   - Maintain compatibility with existing formulas

**Success Criteria**:
- ✅ ObjectQL works as plugin to @objectstack/runtime
- ✅ Existing API maintained through compatibility layer
- ✅ All core features accessible via plugin system

---

### Phase 4: Driver Migration (Week 5-7)

**Objective**: Ensure all drivers implement @objectstack DriverInterface

**Per-Driver Migration**:

1. **SQL Driver**
   ```typescript
   // Implement standard interface
   import { DriverInterface, QueryAST } from '@objectstack/spec';
   
   export class SQLDriver implements DriverInterface {
     async execute(ast: QueryAST): Promise<any> {
       // Use @objectstack/objectql for AST parsing
       // Keep Knex as implementation detail
     }
   }
   ```

2. **Test Against @objectstack/objectql**
   - Ensure query AST compatibility
   - Validate all CRUD operations
   - Test transactions and advanced queries

3. **Documentation Update**
   - Show driver usage with @objectstack/runtime
   - Provide migration examples

**Priority Order**:
1. SQL (most used)
2. Memory (testing)
3. MongoDB
4. SDK (remote)
5. Others (LocalStorage, FS, Excel, Redis)

**Success Criteria**:
- ✅ Each driver passes @objectstack compatibility tests
- ✅ Drivers work with @objectstack/objectql query engine
- ✅ No breaking changes to existing driver APIs

---

### Phase 5: Runtime & Tools Update (Week 7-8)

**Objective**: Update runtime and development tools for @objectstack integration

**@objectql/server**:
1. Extend @objectstack/runtime server adapter
2. Keep GraphQL and REST as plugin layers
3. Update example apps to use new architecture

**@objectql/cli**:
1. Add @objectstack project detection
2. Update scaffolding templates
3. Add migration command: `objectql migrate to-objectstack`

**VSCode Extension**:
1. Update JSON schemas to reference @objectstack/spec
2. Add IntelliSense for @objectstack + ObjectQL plugins
3. Update snippets

**Success Criteria**:
- ✅ Server runs on @objectstack/runtime
- ✅ CLI creates @objectstack-compatible projects
- ✅ VSCode extension provides full support

---

### Phase 6: Documentation & Examples (Week 8-9)

**Objective**: Complete documentation for plugin architecture

**Documentation Updates**:

1. **README.md**
   ```markdown
   # ObjectQL - Query Plugin Ecosystem for ObjectStack
   
   ObjectQL provides advanced query capabilities, multiple database drivers,
   and developer tools as plugins for the @objectstack/runtime framework.
   ```

2. **Migration Guide** (MIGRATION_GUIDE.md)
   - Step-by-step for existing ObjectQL users
   - Code examples before/after
   - Breaking changes and workarounds

3. **Plugin Development Guide**
   - How to create ObjectQL plugins
   - Driver development guide
   - Integration with @objectstack

**Example Updates**:
1. Update all examples to use @objectstack/runtime
2. Show ObjectQL as plugin extension
3. Demonstrate driver usage

**Success Criteria**:
- ✅ All documentation reflects plugin architecture
- ✅ Examples work with @objectstack/runtime
- ✅ Migration guide tested by actual users

---

### Phase 7: Testing & Validation (Week 9-10)

**Objective**: Comprehensive testing of the new architecture

**Test Categories**:

1. **Integration Tests**
   ```typescript
   describe('@objectstack/runtime + ObjectQL', () => {
     test('loads ObjectQL plugin', async () => {
       const kernel = new ObjectStackKernel();
       kernel.use(new ObjectQLPlugin());
       await kernel.init();
       // Verify plugin loaded
     });
   });
   ```

2. **Driver Compatibility Tests**
   - Test each driver with @objectstack/objectql
   - Validate query AST translation
   - Performance benchmarks

3. **Backward Compatibility Tests**
   - Ensure existing code works with compatibility layer
   - Document breaking changes

4. **End-to-End Tests**
   - Complete app scenarios
   - Multi-driver scenarios
   - Real-world use cases

**Success Criteria**:
- ✅ 100% of existing tests pass
- ✅ New integration tests pass
- ✅ Performance within 5% of previous version

---

### Phase 8: Publishing & Release (Week 10-11)

**Objective**: Release plugin-based architecture

**Pre-Release**:
1. Update all package versions to 4.0.0 (major version bump)
2. Update CHANGELOG.md for all packages
3. Create deprecation notices for standalone usage
4. Prepare migration tools

**Release Process**:
1. Publish @objectql/types@4.0.0
2. Publish @objectql/core@4.0.0
3. Publish all drivers@4.0.0
4. Publish tools@4.0.0
5. Update documentation site

**Post-Release**:
1. Monitor GitHub issues
2. Provide migration support
3. Update examples and templates

**Success Criteria**:
- ✅ All packages published successfully
- ✅ No critical bugs in first week
- ✅ Positive community feedback

---

## Risk Assessment & Mitigation

### High-Risk Areas

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking existing apps | HIGH | Maintain compatibility layer, provide migration tools |
| @objectstack API changes | HIGH | Use peer dependencies, version pinning |
| Driver incompatibilities | MEDIUM | Comprehensive testing, staged rollout |
| Performance regression | MEDIUM | Benchmarking, optimization passes |
| Documentation gaps | LOW | User testing, feedback cycles |

### Rollback Plan

If critical issues arise:
1. Maintain v3.x branch for 6 months
2. Provide automated rollback tool
3. Clear communication with community

---

## Success Metrics

### Technical Metrics
- ✅ All 97 source files successfully migrated
- ✅ Zero duplicate type definitions
- ✅ All 9 drivers implement DriverInterface
- ✅ Test coverage maintained at 80%+
- ✅ Build time < 30 seconds
- ✅ Performance within 5% of v3.x

### Community Metrics
- ✅ Migration guide used by 50+ users
- ✅ < 5 critical bugs in first month
- ✅ Positive feedback from early adopters
- ✅ 3+ community plugin contributions

---

## Timeline Summary

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| 1. Dependency Alignment | 2 weeks | Updated dependencies, clean builds |
| 2. Types Consolidation | 1 week | Deduplicated types |
| 3. Core Refactoring | 2 weeks | Plugin-based core |
| 4. Driver Migration | 2 weeks | Compatible drivers |
| 5. Runtime & Tools | 1 week | Updated tooling |
| 6. Documentation | 1 week | Complete docs |
| 7. Testing | 1 week | Validated system |
| 8. Publishing | 1 week | Released v4.0 |

**Total Duration**: 11 weeks

---

## Next Steps

1. **Immediate** (This Week):
   - [ ] Review and approve this migration plan
   - [ ] Set up project tracking (GitHub Projects/Issues)
   - [ ] Create feature branch: `feature/objectstack-migration`

2. **Phase 1 Kickoff** (Next Week):
   - [ ] Update root package.json
   - [ ] Update all workspace dependencies
   - [ ] Run initial build and test verification

3. **Communication**:
   - [ ] Announce migration plan to community
   - [ ] Create RFC for feedback
   - [ ] Set up migration support channels

---

## Appendix

### Key @objectstack Packages

- **@objectstack/runtime** (0.2.0): Core runtime and plugin system
- **@objectstack/spec** (0.2.0): Protocol specifications and types
- **@objectstack/objectql** (0.2.0): Base query engine
- **@objectstack/types** (0.2.0): TypeScript type definitions

### Reference Links

- ObjectStack Runtime: https://www.npmjs.com/package/@objectstack/runtime
- ObjectStack Spec: https://www.npmjs.com/package/@objectstack/spec
- ObjectStack ObjectQL: https://www.npmjs.com/package/@objectstack/objectql

### Contact & Support

For questions about this migration:
- GitHub Issues: https://github.com/objectstack-ai/objectql/issues
- Discussion: Create RFC in discussions tab
- Email: maintainers@objectstack.com (if available)

---

**Document Version**: 1.0  
**Last Updated**: 2026-01-21  
**Status**: Draft - Awaiting Review
