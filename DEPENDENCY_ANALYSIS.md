# ObjectQL Dependency Analysis

**Generated**: 2026-01-31  
**Monorepo Version**: 4.0.x

## Executive Summary

This document analyzes the dependency structure of the ObjectQL monorepo to identify potential issues, circular dependencies, and areas for improvement.

### Key Findings

✅ **Strengths:**
- Clear separation of concerns with 5 distinct layers
- Types package serves as foundation (minimal dependencies)
- All drivers only depend on `@objectql/types` (clean architecture)
- Workspace protocol (`workspace:*`) correctly used for internal packages

⚠️ **Issues Identified:**
1. **Potential Circular Dependency Risk**: Plugins depend on `@objectstack/core` which may import from `@objectql/core`
2. **Version Inconsistency**: Protocol packages at v0.1.0 while others at v4.0.2
3. **External Dependencies**: Heavy reliance on `@objectstack/*` packages (external npm packages)

---

## Layer-by-Layer Analysis

### Foundation Layer (7 packages)

#### @objectql/types (v4.0.2) - The Constitution ✅
**Status**: CLEAN - Minimal external dependencies

**Dependencies:**
- `@objectstack/spec`: ^0.6.1 (external)
- `@objectstack/objectql`: ^0.6.1 (external)

**Dependents:** All other packages depend on this

**Assessment**: ✅ Correctly positioned as foundation. Per architecture rules, this should have ZERO dependencies on other @objectql packages. External @objectstack dependencies are acceptable.

---

#### @objectql/core (v4.0.2) - The Engine ⚠️
**Status**: POTENTIAL CIRCULAR DEPENDENCY RISK

**Internal Dependencies:**
- `@objectql/types`: workspace:* ✅
- `@objectql/plugin-formula`: workspace:* ⚠️
- `@objectql/plugin-validator`: workspace:* ⚠️

**External Dependencies:**
- `@objectstack/spec`: ^0.6.1
- `@objectstack/runtime`: ^0.6.1
- `@objectstack/objectql`: ^0.6.1
- `@objectstack/core`: ^0.6.1

**Risk Analysis:**
```
@objectql/core → @objectql/plugin-formula → @objectstack/core
@objectql/core → @objectql/plugin-validator → @objectstack/core
```

**Recommendation**: 
1. Verify that `@objectstack/core` does NOT import from `@objectql/core`
2. If circular dependency exists, extract plugin interfaces to `@objectql/types`
3. Consider making plugins optional (lazy loading)

---

#### @objectql/plugin-validator (v4.0.2) ⚠️
#### @objectql/plugin-formula (v4.0.2) ⚠️
#### @objectql/plugin-security (v4.0.2) ⚠️

**Common Pattern:**
```
@objectql/types: workspace:* ✅
@objectstack/core: ^0.6.1 ⚠️
```

**Issue**: All plugins depend on external `@objectstack/core`, which might create circular imports if `@objectstack/core` imports from `@objectql/core`.

**Recommended Fix:**
- Move plugin interfaces to `@objectql/types`
- Plugins should ONLY depend on `@objectql/types`
- Core should dynamically load plugins via dependency injection

---

#### @objectql/platform-node (v4.0.2) ✅
**Status**: CLEAN

**Dependencies:**
- `@objectql/core`: workspace:*
- `@objectql/types`: workspace:*
- `@objectstack/spec`: ^0.6.1

**Assessment**: ✅ Proper dependency chain. Platform layer correctly sits above core.

---

#### @objectql/plugin-ai-agent (v4.0.2) ✅
**Status**: CLEAN

**Dependencies:**
- `@objectql/types`: workspace:*
- `@objectql/plugin-validator`: workspace:*

**Assessment**: ✅ No external @objectstack dependencies. Clean plugin design.

---

### Drivers Layer (8 packages)

#### All Drivers (excel, fs, localstorage, memory, mongo, redis, sdk, sql) ✅
**Status**: EXCELLENT - Uniform Architecture

**Common Pattern:**
```json
{
  "@objectql/types": "workspace:*",
  "@objectstack/spec": "^0.6.1"
}
```

**Assessment**: ✅ PERFECT. All drivers have identical, minimal dependency footprint. They only depend on:
1. Type definitions (`@objectql/types`)
2. Protocol specification (`@objectstack/spec`)

This is the **gold standard** for driver architecture.

---

### Protocols Layer (3 packages)

#### @objectql/protocol-graphql (v0.1.0) ⚠️
#### @objectql/protocol-json-rpc (v0.1.0) ⚠️
#### @objectql/protocol-odata-v4 (v0.1.0) ⚠️

**Common Pattern:**
```json
{
  "@objectql/types": "workspace:*",
  "@objectstack/spec": "^0.6.1"
}
```

**Issues:**
1. ⚠️ **Version Inconsistency**: v0.1.0 vs v4.0.2 for rest of monorepo
2. ✅ **Dependencies**: Clean and minimal

**Recommendation**: Update protocol package versions to match monorepo version (4.0.x)

---

### Runtime Layer (1 package)

#### @objectql/server (v4.0.2) ✅
**Status**: CLEAN

**Dependencies:**
- `@objectql/core`: workspace:*
- `@objectql/types`: workspace:*

**Assessment**: ✅ Proper position in stack. No external @objectstack dependencies.

---

### Tools Layer (3 packages)

#### @objectql/cli (v4.0.2) ✅
**Status**: CLEAN - Proper Tool Dependencies

**Dependencies:**
- `@objectql/types`: workspace:*
- `@objectql/core`: workspace:*
- `@objectql/plugin-validator`: workspace:*
- `@objectql/plugin-ai-agent`: workspace:*
- `@objectql/server`: workspace:*
- `@objectql/driver-sql`: workspace:*
- `@objectql/platform-node`: workspace:*

**Assessment**: ✅ CLI appropriately depends on multiple packages. No external @objectstack deps.

#### @objectql/create (v4.0.2) ✅
**Dependencies:** NONE

**Assessment**: ✅ Standalone scaffolding tool. No dependencies needed.

#### vscode-objectql (v4.0.0) ⚠️
**Version**: v4.0.0 (should be v4.0.2)

---

## Dependency Graph

```
Layer 0: External Packages
  ├─ @objectstack/spec (v0.6.1)
  ├─ @objectstack/core (v0.6.1)
  ├─ @objectstack/runtime (v0.6.1)
  └─ @objectstack/objectql (v0.6.1)

Layer 1: Types (The Constitution)
  └─ @objectql/types
       ├─ Depends on: @objectstack/spec, @objectstack/objectql
       └─ Used by: ALL packages

Layer 2: Plugins (Feature Extensions)
  ├─ @objectql/plugin-validator (⚠️ depends on @objectstack/core)
  ├─ @objectql/plugin-formula (⚠️ depends on @objectstack/core)
  ├─ @objectql/plugin-security (⚠️ depends on @objectstack/core)
  └─ @objectql/plugin-ai-agent ✅

Layer 3: Core Engine
  └─ @objectql/core
       ├─ Depends on: types, plugin-validator, plugin-formula
       └─ Depends on: @objectstack/* (⚠️ potential circular)

Layer 4: Platform Adapters
  └─ @objectql/platform-node
       └─ Depends on: core, types

Layer 5: Data Drivers (8 packages)
  ├─ All drivers ✅
  └─ Only depend on: types, @objectstack/spec

Layer 6: Protocol Adapters (3 packages)
  ├─ graphql, json-rpc, odata-v4
  └─ Only depend on: types, @objectstack/spec

Layer 7: Runtime
  └─ @objectql/server
       └─ Depends on: core, types

Layer 8: Developer Tools
  ├─ @objectql/cli (depends on: many)
  ├─ @objectql/create (standalone)
  └─ vscode-objectql (standalone)
```

---

## Critical Action Items

### Priority 1: Resolve Circular Dependency Risk 🔴

**Problem**: 
```
@objectql/core → @objectql/plugin-{validator,formula,security} → @objectstack/core
```

If `@objectstack/core` imports from `@objectql/core`, this creates a circular dependency.

**Solution Options:**

1. **Option A: Move Plugin Interfaces to Types** (Recommended)
   ```
   - Move plugin interfaces to @objectql/types
   - Plugins depend ONLY on @objectql/types
   - Remove @objectstack/core dependency from plugins
   ```

2. **Option B: Make @objectstack/* stub packages**
   ```
   - Clarify @objectstack/* are external protocol definitions
   - Ensure they NEVER import from @objectql/*
   ```

3. **Option C: Lazy Plugin Loading**
   ```
   - Core declares plugin interfaces
   - Plugins implement interfaces
   - Core dynamically loads plugins (no compile-time dependency)
   ```

---

### Priority 2: Version Standardization 🟡

**Issues:**
- Protocol packages: v0.1.0
- VS Code extension: v4.0.0
- All others: v4.0.2

**Action:**
```bash
# Update protocol packages to v4.0.2
pnpm changeset add
# Select:
# - @objectql/protocol-graphql
# - @objectql/protocol-json-rpc
# - @objectql/protocol-odata-v4
# - vscode-objectql
# Version: minor (to 4.0.2)
```

---

### Priority 3: Document External Dependencies 🟡

**Create**: `EXTERNAL_DEPENDENCIES.md`

Document the purpose and relationship of:
- `@objectstack/spec` - What is it? Why do we depend on it?
- `@objectstack/core` - Is this a different package or circular ref?
- `@objectstack/runtime` - What does it provide?
- `@objectstack/objectql` - How does this relate to @objectql/core?

---

## Best Practices Observed ✅

1. **Clean Driver Architecture**: All 8 drivers follow identical dependency pattern
2. **Workspace Protocol**: Correctly uses `workspace:*` for internal packages
3. **Type-First**: `@objectql/types` serves as foundation
4. **Layer Separation**: Clear boundaries between foundation/drivers/protocols/runtime/tools

---

## Recommendations

### Short Term (This Sprint)
1. ✅ Document external @objectstack/* packages
2. ✅ Standardize versions to 4.0.2
3. ⚠️ Investigate circular dependency risk

### Medium Term (Next Sprint)
1. Move plugin interfaces to @objectql/types
2. Create dependency visualization tool
3. Add pre-commit hook to prevent circular deps

### Long Term (Backlog)
1. Consider extracting @objectstack/* to this monorepo
2. Implement plugin lazy loading
3. Create automated dependency audit script

---

## Conclusion

The ObjectQL monorepo has a **well-architected dependency structure** with a few areas requiring attention:

**Strengths:**
- ✅ Clean driver layer (8 packages with identical patterns)
- ✅ Type-first architecture
- ✅ Clear layer separation

**Needs Improvement:**
- ⚠️ Potential circular dependency with plugins
- ⚠️ Version inconsistency across packages
- ⚠️ Unclear relationship with @objectstack/* external packages

**Overall Grade**: B+ (Good architecture with minor issues to address)
