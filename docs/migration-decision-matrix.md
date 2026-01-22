# ObjectQL Migration Decision Matrix

**Purpose**: Quick reference guide for deciding where features belong during migration

## Decision Tree

```
Is the feature related to data queries?
├─ YES → Is it basic CRUD?
│  ├─ YES → @objectstack/objectql (delegate)
│  └─ NO → Is it advanced query optimization?
│     ├─ YES → Keep in @objectql/core ✅
│     └─ NO → Is it query analysis/debugging?
│        ├─ YES → Keep in @objectql/core ✅
│        └─ NO → Evaluate case-by-case
│
└─ NO → Is it runtime/lifecycle management?
   ├─ YES → @objectstack/runtime (delegate) 🔄
   └─ NO → Is it a specialized data source driver?
      ├─ YES → Keep in @objectql/driver-* ✅
      └─ NO → Move to @objectstack 🔄
```

## Feature Classification Matrix

### Core Engine Features

| Feature | Current Location | Target Location | Action | Reason |
|---------|-----------------|-----------------|--------|---------|
| MetadataRegistry | @objectql/core | @objectstack/types | 🔄 Move | General-purpose metadata |
| ObjectQL class | @objectql/core | @objectql/core | ✅ Keep (deprecated) | Backward compatibility wrapper |
| ObjectQLPlugin | @objectql/core | @objectql/core | ✅ Keep | Main plugin implementation |
| QueryBuilder | @objectql/core | @objectql/core | ✅ Keep | Query-specific feature |
| QueryOptimizer | @objectql/core | @objectql/core | ✅ Keep | Query-specific feature |
| QueryAnalyzer | @objectql/core | @objectql/core | ✅ Keep | Query-specific feature |
| Repository pattern | @objectql/core | Evaluate | ⚠️ Split | CRUD → objectql, Query features → objectql |
| Context management | @objectql/core | @objectstack/runtime | 🔄 Move | General-purpose runtime |
| Hook system | @objectql/core | Evaluate | ⚠️ Split | Query hooks → objectql, others → objectstack |
| Action system | @objectql/core | Evaluate | ⚠️ Split | Query actions → objectql, others → objectstack |
| Validator | @objectql/core | @objectstack/runtime | 🔄 Move | General-purpose validation |
| Formula engine | @objectql/core | @objectstack/runtime | 🔄 Move | General-purpose formulas |
| AI integration | @objectql/core | Separate package | 🔄 Extract | Should be @objectql/ai-query or @objectstack/ai |

### Type Definitions

| Type | Current Location | Target Location | Action | Reason |
|------|-----------------|-----------------|--------|---------|
| QueryFilter | @objectql/types | @objectql/types | ✅ Keep | Query-specific |
| QueryOptions | @objectql/types | @objectql/types | ✅ Keep | Query-specific |
| QueryResult | @objectql/types | @objectql/types | ✅ Keep | Query-specific |
| SortField | @objectql/types | @objectql/types | ✅ Keep | Query-specific |
| FilterCondition | @objectql/types | Re-export from @objectstack/spec | 🔄 Re-export | Protocol definition |
| IndexSchema | @objectql/types | @objectql/types | ✅ Keep | Query optimization |
| QueryHint | @objectql/types | @objectql/types | ✅ Keep | Query optimization |
| QueryPerformanceMetrics | @objectql/types | @objectql/types | ✅ Keep | Query analysis |
| ObjectConfig | @objectql/types | @objectstack/types | 🔄 Move | General metadata |
| FieldConfig | @objectql/types | @objectstack/types | 🔄 Move | General metadata |
| Driver (interface) | @objectql/types | @objectstack/spec | 🔄 Use DriverInterface | Protocol standard |
| IObjectQL | @objectql/types | @objectql/types | ✅ Keep | ObjectQL API contract |
| ObjectQLContext | @objectql/types | @objectstack/types | 🔄 Move | General runtime context |
| HookHandler | @objectql/types | Evaluate | ⚠️ Split | Query hooks → objectql |
| ActionHandler | @objectql/types | Evaluate | ⚠️ Split | Query actions → objectql |

### Platform Utilities

| Utility | Current Location | Target Location | Action | Reason |
|---------|-----------------|-----------------|--------|---------|
| YAML loader | @objectql/platform-node | @objectstack/runtime | 🔄 Move | General-purpose |
| File system ops | @objectql/platform-node | @objectstack/runtime | 🔄 Move | General-purpose |
| Plugin loader | @objectql/platform-node | @objectstack/runtime | 🔄 Move | Runtime feature |
| Config manager | @objectql/platform-node | @objectstack/runtime | 🔄 Move | Runtime feature |
| Glob utilities | @objectql/platform-node | @objectstack/runtime | 🔄 Move | General-purpose |
| Query metadata loader | @objectql/platform-node | @objectql/platform-node | ✅ Keep | Query-specific metadata |

### Drivers

| Driver | Current Location | Target Location | Action | Reason |
|--------|-----------------|-----------------|--------|---------|
| @objectql/driver-sql | packages/drivers/sql | packages/drivers/sql | ✅ Keep | Query optimization for SQL |
| @objectql/driver-mongo | packages/drivers/mongo | packages/drivers/mongo | ✅ Keep | MongoDB query extensions |
| @objectql/driver-memory | packages/drivers/memory | packages/drivers/memory | ✅ Keep | Testing & development |
| @objectql/driver-localstorage | packages/drivers/localstorage | packages/drivers/localstorage | ✅ Keep | Browser query storage |
| @objectql/driver-fs | packages/drivers/fs | packages/drivers/fs | ✅ Keep | File system queries |
| @objectql/driver-excel | packages/drivers/excel | packages/drivers/excel | ✅ Keep | Excel file queries |
| @objectql/driver-redis | packages/drivers/redis | packages/drivers/redis | ✅ Keep | Redis query operations |
| @objectql/sdk | packages/drivers/sdk | Evaluate | ⚠️ Consider | Remote HTTP - might be general |

**All drivers must**:
- Implement `DriverInterface` from `@objectstack/spec`
- Be marked as `objectstack-plugin` in keywords
- Have `@objectstack/spec` as peerDependency

### Runtime Features

| Feature | Current Location | Target Location | Action | Reason |
|---------|-----------------|-----------------|--------|---------|
| HTTP server | @objectql/server | Evaluate | ⚠️ Split | Query APIs → objectql, REST → objectstack |
| Metadata API | @objectql/server | @objectstack/runtime | 🔄 Move | General metadata serving |
| Query API | @objectql/server | @objectql/server | ✅ Keep | Query-specific endpoints |
| GraphQL adapter | @objectql/server | Evaluate | ⚠️ Consider | Might be separate plugin |
| REST adapter | @objectql/server | @objectstack/runtime | 🔄 Move | General-purpose REST |

### CLI Tools

| Command | Current Location | Target Location | Action | Reason |
|---------|-----------------|-----------------|--------|---------|
| `objectql init` | @objectql/cli | @objectstack/cli | 🔄 Move | Project initialization |
| `objectql dev` | @objectql/cli | @objectstack/cli | 🔄 Move | Dev server |
| `objectql generate` | @objectql/cli | @objectstack/cli | 🔄 Move | Code generation |
| `objectql query analyze` | @objectql/cli | @objectql/cli | ✅ Keep | Query analysis |
| `objectql query optimize` | @objectql/cli | @objectql/cli | ✅ Keep | Query optimization |
| `objectql query debug` | @objectql/cli | @objectql/cli | ✅ Keep | Query debugging |
| `objectql query profile` | @objectql/cli | @objectql/cli | ✅ Keep | Query profiling |
| `objectql query explain` | @objectql/cli | @objectql/cli | ✅ Keep | Query plan explanation |

### VS Code Extension

| Feature | Current Location | Target Location | Action | Reason |
|---------|-----------------|-----------------|--------|---------|
| .object.yml validation | vscode-objectql | @objectstack extension | 🔄 Move | General metadata |
| .validation.yml syntax | vscode-objectql | @objectstack extension | 🔄 Move | General validation |
| .permission.yml syntax | vscode-objectql | @objectstack extension | 🔄 Move | General permissions |
| Query syntax highlighting | vscode-objectql | vscode-objectql | ✅ Keep | Query-specific |
| Query validation | vscode-objectql | vscode-objectql | ✅ Keep | Query-specific |
| Query auto-complete | vscode-objectql | vscode-objectql | ✅ Keep | Query-specific |
| Query performance hints | vscode-objectql | vscode-objectql | ✅ Keep | Query-specific |
| Index suggestions | vscode-objectql | vscode-objectql | ✅ Keep | Query optimization |
| Project scaffolding | vscode-objectql | @objectstack extension | 🔄 Move | General project mgmt |

### Examples

| Example | Action | New Focus |
|---------|--------|-----------|
| quickstart/hello-world | ✅ Rewrite | Show @objectstack + ObjectQL plugin |
| showcase/enterprise-erp | ✅ Rewrite | Show ObjectQL query features |
| showcase/project-tracker | ✅ Rewrite | Show ObjectQL query features |
| integrations/browser | ✅ Rewrite | Browser + ObjectQL queries |
| integrations/express-server | ✅ Rewrite | Express + @objectstack + ObjectQL |
| drivers/excel-demo | ✅ Keep & Update | Excel driver showcase |
| drivers/fs-demo | ✅ Keep & Update | File system driver showcase |

**All examples should**:
- Start with @objectstack installation
- Show ObjectQL as plugin installation
- Demonstrate query-specific features
- Include performance optimization examples

## Quick Decision Checklist

When evaluating a feature, ask:

1. **Is it query-related?**
   - [ ] YES → Likely stays in ObjectQL
   - [ ] NO → Likely moves to @objectstack

2. **Does @objectstack/runtime already provide it?**
   - [ ] YES → Remove from ObjectQL, delegate
   - [ ] NO → Continue evaluation

3. **Is it a specialized data source?**
   - [ ] YES → Keep as ObjectQL driver
   - [ ] NO → Continue evaluation

4. **Is it used by multiple features?**
   - [ ] Query-only → Keep in ObjectQL
   - [ ] Multiple domains → Move to @objectstack

5. **What's the primary user?**
   - [ ] Query developers → Keep in ObjectQL
   - [ ] All developers → Move to @objectstack

## Common Scenarios

### Scenario 1: Hook System

**Question**: Where do hooks belong?

**Answer**: Split by purpose
- Query hooks (beforeQuery, afterQuery, onQueryOptimize) → @objectql/core
- Data hooks (beforeCreate, afterUpdate) → @objectstack/runtime
- Custom hooks → User's plugin

### Scenario 2: Validation

**Question**: Where does validation belong?

**Answer**: General validation → @objectstack
- Data validation (required, min, max) → @objectstack/runtime
- Query validation (filter syntax, query structure) → @objectql/core

### Scenario 3: Repository Pattern

**Question**: Where does Repository belong?

**Answer**: Split implementation
- Base repository (CRUD) → @objectstack/objectql
- Query extensions (find with optimizations) → @objectql/core
- ObjectQL provides enhanced repository as plugin

### Scenario 4: Formula Engine

**Question**: Where do formulas belong?

**Answer**: General formulas → @objectstack
- Field formulas (sum, concat) → @objectstack/runtime
- Query formulas (aggregations) → @objectql/core (if unique)

### Scenario 5: Metadata Registry

**Question**: Where does MetadataRegistry belong?

**Answer**: Base → @objectstack, extensions → ObjectQL
- Base registry (register/get objects) → @objectstack/types
- Query metadata (indexes, hints) → @objectql/types

## Implementation Priority

### Phase 1: High Priority (Core functionality)

1. ✅ ObjectQLPlugin implementation
2. ✅ DriverInterface migration for all drivers
3. ✅ QueryBuilder, QueryOptimizer, QueryAnalyzer
4. ✅ Type definition cleanup (@objectql/types)

### Phase 2: Medium Priority (Tools & Examples)

5. ⚠️ CLI command separation
6. ⚠️ VS Code extension split
7. ⚠️ Example rewrites
8. ⚠️ Documentation updates

### Phase 3: Low Priority (Optional features)

9. 🔄 Server package evaluation
10. 🔄 AI integration extraction
11. 🔄 Performance optimizations
12. 🔄 Advanced plugin features

## Legend

- ✅ **Keep**: Feature stays in ObjectQL
- 🔄 **Move**: Feature moves to @objectstack
- ⚠️ **Split**: Feature split between ObjectQL and @objectstack
- 🔍 **Evaluate**: Needs detailed analysis
- ❌ **Remove**: Feature removed (deprecated)

## Notes

1. **When in doubt**: Bias toward @objectstack for general features
2. **Exception**: If @objectstack doesn't provide it yet, keep temporarily
3. **Coordination**: Work with @objectstack team for features to move
4. **Deprecation**: Mark legacy features with deprecation warnings
5. **Documentation**: Document every decision with reasoning

---

**Last Updated**: 2026-01-22  
**Review**: Weekly during migration
