# ObjectQL Refactoring - Implementation Checklist (Revised)

**Version:** 1.1 (Simplified - User Feedback)  
**Date:** 2026-01-30  
**Reference:** [KERNEL_REFACTORING_RECOMMENDATION.md](./KERNEL_REFACTORING_RECOMMENDATION.md)

**User Feedback:** "我不希望拆得这么细，objectql相关的还是放在这个仓库中"  
Translation: "I don't want to split it so finely, objectql-related things should remain in this repository"

**Revised Strategy:** Extract only ObjectStack ecosystem components (runtime + protocols), keep all ObjectQL components together.

---

## Phase 0: Decision Making (This Week)

### Critical Decisions

- [ ] **Decision 1:** Review and approve the revised refactoring strategy
  - [ ] Read [KERNEL_REFACTORING_SUMMARY.md](./KERNEL_REFACTORING_SUMMARY.md) (bilingual, ~10 min)
  - [ ] Review [KERNEL_REFACTORING_RECOMMENDATION.md](./KERNEL_REFACTORING_RECOMMENDATION.md) (comprehensive)
  - [ ] Approve strategy

- [x] **Decision 2:** Keep ObjectQL components together? ✅ **YES (Confirmed)**
  - All drivers stay in ObjectQL repo
  - All tools stay in ObjectQL repo  
  - All examples stay in ObjectQL repo

- [x] **Decision 3:** Extract ObjectStack components? ✅ **YES (Confirmed)**
  - Runtime server → separate repo
  - Protocol plugins → separate repo

---

## Phase 1: Repository Setup (Week 1-2)

### 1.1 Create New Repositories (2 repos only)

- [ ] Create `objectstack-ai/objectstack-runtime`
  ```bash
  gh repo create objectstack-ai/objectstack-runtime --public \
    --description "Runtime server adapters for ObjectStack ecosystem" \
    --license mit
  ```

- [ ] Create `objectstack-ai/objectstack-protocols`
  ```bash
  gh repo create objectstack-ai/objectstack-protocols --public \
    --description "Protocol plugins (GraphQL, OData, JSON-RPC) for ObjectStack" \
    --license mit
  ```

### 1.2 Initialize objectstack-runtime Repository

- [ ] Clone and initialize
  ```bash
  git clone https://github.com/objectstack-ai/objectstack-runtime
  cd objectstack-runtime
  pnpm init
  ```

- [ ] Create monorepo structure
  ```bash
  mkdir -p packages/server
  echo 'packages:\n  - "packages/*"' > pnpm-workspace.yaml
  cp ../objectql/tsconfig.base.json .
  cp ../objectql/.gitignore .
  ```

- [ ] Set up CI/CD
  ```bash
  mkdir -p .github/workflows
  # Copy CI workflow from objectql or create new one
  ```

### 1.3 Initialize objectstack-protocols Repository

- [ ] Clone and initialize
  ```bash
  git clone https://github.com/objectstack-ai/objectstack-protocols
  cd objectstack-protocols
  pnpm init
  ```

- [ ] Create monorepo structure
  ```bash
  mkdir -p packages/graphql packages/json-rpc packages/odata-v4
  echo 'packages:\n  - "packages/*"' > pnpm-workspace.yaml
  cp ../objectql/tsconfig.base.json .
  cp ../objectql/.gitignore .
  ```

- [ ] Set up CI/CD
  ```bash
  mkdir -p .github/workflows
  # Copy CI workflow from objectql or create new one
  ```

---

## Phase 2: Package Migration (Week 3)

### 2.1 Migrate Runtime Server

- [ ] Split runtime/server from objectql repo
  ```bash
  cd objectql
  git subtree split -P packages/runtime/server -b migrate-runtime-server
  ```

- [ ] Add to objectstack-runtime repo
  ```bash
  cd ../objectstack-runtime
  git subtree add --squash --prefix=packages/server ../objectql migrate-runtime-server
  ```

- [ ] Update package.json in objectstack-runtime/packages/server
  - [ ] Change name to `@objectstack/runtime`
  - [ ] Update dependencies:
    ```json
    {
      "peerDependencies": {
        "@objectql/types": "^5.0.0",
        "@objectql/core": "^5.0.0"
      }
    }
    ```

- [ ] Test the migrated package
  ```bash
  cd packages/server
  pnpm install
  pnpm run build
  pnpm run test
  ```

### 2.2 Migrate Protocol Plugins

- [ ] Split protocols/graphql
  ```bash
  cd objectql
  git subtree split -P packages/protocols/graphql -b migrate-protocol-graphql
  cd ../objectstack-protocols
  git subtree add --squash --prefix=packages/graphql ../objectql migrate-protocol-graphql
  ```

- [ ] Split protocols/json-rpc
  ```bash
  cd objectql
  git subtree split -P packages/protocols/json-rpc -b migrate-protocol-jsonrpc
  cd ../objectstack-protocols
  git subtree add --squash --prefix=packages/json-rpc ../objectql migrate-protocol-jsonrpc
  ```

- [ ] Split protocols/odata-v4
  ```bash
  cd objectql
  git subtree split -P packages/protocols/odata-v4 -b migrate-protocol-odata
  cd ../objectstack-protocols
  git subtree add --squash --prefix=packages/odata-v4 ../objectql migrate-protocol-odata
  ```

- [ ] Update all protocol package.json files
  - [ ] Update names to `@objectstack/protocol-*`
  - [ ] Update dependencies to `^5.0.0` for ObjectQL packages
  - [ ] Test each protocol package

### 2.3 Publish Initial Versions

- [ ] Publish `@objectstack/runtime@1.0.0`
  ```bash
  cd objectstack-runtime/packages/server
  npm publish --access public
  ```

- [ ] Publish `@objectstack/protocol-graphql@1.0.0`
- [ ] Publish `@objectstack/protocol-json-rpc@1.0.0`
- [ ] Publish `@objectstack/protocol-odata-v4@1.0.0`

---

## Phase 3: ObjectQL Cleanup (Week 3-4)

### 3.1 Remove Migrated Packages from ObjectQL

- [ ] Delete migrated ObjectStack packages
  ```bash
  cd objectql
  git rm -r packages/runtime/server
  git rm -r packages/protocols/graphql
  git rm -r packages/protocols/json-rpc
  git rm -r packages/protocols/odata-v4
  ```

- [ ] Update `pnpm-workspace.yaml`
  ```yaml
  packages:
    - "packages/foundation/*"
    - "packages/drivers/*"
    - "packages/tools/*"
    # Removed: packages/runtime/*, packages/protocols/*
  ```

- [ ] Update root `package.json`
  - [ ] Remove scripts for moved packages
  - [ ] Update version to `5.0.0`

### 3.2 Update Documentation

- [ ] Update `README.md`
  - [ ] Remove references to runtime server package
  - [ ] Add links to objectstack-runtime repo
  - [ ] Add links to objectstack-protocols repo
  - [ ] Update installation instructions
  - [ ] Update architecture diagrams

- [ ] Create `MIGRATION.md`
  - [ ] Document changes from v4.x to v5.x
  - [ ] Provide code migration examples
  - [ ] List new package locations for ObjectStack components

- [ ] Update `ARCHITECTURE.md`
  - [ ] Document ObjectQL as full-stack framework
  - [ ] Document ObjectStack as separate ecosystem
  - [ ] Link to external repositories

### 3.3 Update CI/CD

- [ ] Update `.github/workflows/` to reflect new structure
- [ ] Remove runtime-specific test jobs
- [ ] Remove protocol-specific test jobs
- [ ] Ensure all ObjectQL packages (drivers, tools) still tested

### 3.4 Commit and Tag

- [ ] Commit all cleanup changes
  ```bash
  git add .
  git commit -m "refactor: ObjectQL 5.0 - Extract ObjectStack to separate repositories"
  git tag v5.0.0-alpha.1
  git push origin main --tags
  ```

---

## Phase 4: Kernel Optimizations (Week 4-10)

### 4.1 Optimization 1: Indexed Metadata Registry

- [ ] Create `packages/foundation/core/src/metadata-registry-optimized.ts`
- [ ] Implement secondary indexes (package, dependency, tag)
- [ ] Add cache versioning
- [ ] Write tests
- [ ] Run benchmarks (target: 10x improvement)
- [ ] Replace old implementation

**Expected Result:**
```
Before: unregisterPackage() = 10ms with 1000 items
After:  unregisterPackage() = 1ms with 1000 items  
```

### 4.2 Optimization 2: Query AST Compilation + LRU Cache

- [ ] Create `packages/foundation/core/src/query-compiler.ts`
- [ ] Implement AST hashing function
- [ ] Add LRU cache (default: 1000 entries)
- [ ] Compile AST to optimized execution plan
- [ ] Write tests
- [ ] Run benchmarks (target: 10x improvement)

**Expected Result:**
```
Before: query planning = 1ms per execution
After:  query planning = 0.1ms per execution (cached)
```

### 4.3 Optimization 3: Hook Pipeline Compilation

- [ ] Create `packages/foundation/core/src/hook-manager-compiled.ts`
- [ ] Pre-compile hook patterns at registration time
- [ ] Group hooks by event type
- [ ] Add parallel execution support
- [ ] Write tests
- [ ] Run benchmarks (target: 5x improvement)

**Expected Result:**
```
Before: runHooks() = 0.5ms (pattern matching every time)
After:  runHooks() = 0.1ms (direct lookup + parallel)
```

### 4.4 Optimization 4: Connection Pool Management

- [ ] Create `packages/foundation/core/src/connection-pool.ts`
- [ ] Implement global connection pool manager
- [ ] Add per-driver and total limits
- [ ] Add connection monitoring
- [ ] Write tests
- [ ] Run benchmarks (target: 5x improvement)

**Expected Result:**
```
Before: connection acquisition = 5ms
After:  connection acquisition = 1ms
```

### 4.5 Optimization 5: Validation Engine

- [ ] Create `packages/foundation/core/src/validation-engine-compiled.ts`
- [ ] Compile JSON schemas to validators once
- [ ] Cache validators per object type
- [ ] Write tests
- [ ] Run benchmarks (target: 3x improvement)

**Expected Result:**
```
Before: validate() = 0.3ms (AJV created every time)
After:  validate() = 0.1ms (compiled validator)
```

### 4.6 Optimization 6: Lazy Metadata Loading

- [ ] Create `packages/foundation/core/src/lazy-metadata-loader.ts`
- [ ] Implement on-demand loading
- [ ] Add predictive preloading for related objects
- [ ] Write tests
- [ ] Run benchmarks (target: 10x startup improvement)

**Expected Result:**
```
Before: startup time = 2000ms (load all metadata)
After:  startup time = 200ms (lazy loading)
```

### 4.7 Optimization 7: TypeScript Type Generation

- [ ] Create `packages/foundation/core/src/type-generator-async.ts`
- [ ] Use worker threads for parallel generation
- [ ] Make generation non-blocking
- [ ] Write tests
- [ ] Run benchmarks (target: 5x improvement)

**Expected Result:**
```
Before: type generation = 500ms (blocking)
After:  type generation = 100ms (non-blocking, parallel)
```

### 4.8 Optimization 8: Smart Dependency Graph

- [ ] Create `packages/foundation/core/src/dependency-graph.ts`
- [ ] Build DAG from object relationships
- [ ] Implement topological sort
- [ ] Add automatic cascade operations
- [ ] Write tests

**Expected Result:**
```
Before: Manual cascade deletes required
After:  Automatic cascade with correct ordering
```

### 4.9 Optimization 9: Query Optimizer

- [ ] Create `packages/foundation/core/src/query-optimizer.ts`
- [ ] Add index-aware query rewriting
- [ ] Implement join reordering
- [ ] Add SQL-specific optimizations
- [ ] Write tests
- [ ] Run benchmarks (target: 2-5x improvement)

**Expected Result:**
```
Before: query execution = 100ms (no optimization)
After:  query execution = 20-50ms (optimized)
```

### 4.10 Optimization 10: Memory-Mapped Metadata

- [ ] Create `packages/foundation/core/src/shared-metadata-store.ts`
- [ ] Use SharedArrayBuffer for metadata storage
- [ ] Reduce heap fragmentation
- [ ] Write tests
- [ ] Run benchmarks (target: 50% memory reduction)

**Expected Result:**
```
Before: metadata memory = 100MB (heap allocated)
After:  metadata memory = 50MB (off-heap)
```

### 4.11 Add Comprehensive Benchmarks

- [ ] Create `benchmarks/metadata-ops.bench.ts`
- [ ] Create `benchmarks/query-compilation.bench.ts`
- [ ] Create `benchmarks/validation.bench.ts`
- [ ] Create `benchmarks/hook-execution.bench.ts`
- [ ] Add benchmark CI job

### 4.12 Update Tests

- [ ] Ensure all optimizations have unit tests
- [ ] Add integration tests for optimized paths
- [ ] Verify backward compatibility
- [ ] Run full test suite

---

## Phase 5: Ecosystem Alignment (Week 11-12)

### 5.1 Update ObjectStack Packages

- [ ] Update objectstack-runtime to depend on `@objectql/types@^5.0.0`
- [ ] Update objectstack-protocols to depend on `@objectql/types@^5.0.0`
- [ ] Test integration between ObjectQL and ObjectStack

### 5.2 Create Migration Guide

- [ ] Write `MIGRATION-v4-to-v5.md`
  - [ ] Installation changes for ObjectStack components
  - [ ] Import path changes (runtime + protocols)
  - [ ] Code examples (before/after)
  - [ ] Breaking changes list

### 5.3 Update Examples

- [ ] Update examples to use new ObjectStack package structure
- [ ] Test all examples
- [ ] Update example documentation

### 5.4 Publish ObjectQL 5.0.0

- [ ] Run full test suite
- [ ] Run all benchmarks
- [ ] Update CHANGELOG.md
- [ ] Publish `@objectql/types@5.0.0`
- [ ] Publish `@objectql/core@5.0.0`
- [ ] Publish `@objectql/platform-node@5.0.0`
- [ ] Publish `@objectql/plugin-security@5.0.0`
- [ ] Publish all 8 driver packages as `@objectql/driver-*@5.0.0`
- [ ] Publish `@objectql/cli@5.0.0`
- [ ] Publish `create-objectql@5.0.0`
- [ ] Tag release
  ```bash
  git tag v5.0.0
  git push origin v5.0.0
  ```

### 5.5 Announcement

- [ ] Write blog post announcing ObjectQL 5.0
- [ ] Update objectql.org website
- [ ] Post on social media
- [ ] Update GitHub repository description

---

## Success Metrics Tracking

### Performance Metrics

| Metric | Baseline (v4.x) | Target (v5.x) | Actual (v5.x) | Status |
|--------|-----------------|---------------|---------------|--------|
| Metadata operation latency | 0.1ms | 0.01ms | _______ | ⏳ |
| Query planning time | 1ms | 0.1ms | _______ | ⏳ |
| Hook execution overhead | 0.5ms | 0.1ms | _______ | ⏳ |
| Build time (ObjectQL) | 5min | 4min | _______ | ⏳ |
| Test suite (ObjectQL) | 10min | 8min | _______ | ⏳ |

### Code Quality Metrics

| Metric | Baseline | Target | Actual | Status |
|--------|----------|--------|--------|--------|
| ObjectQL LOC | ~150K | ~130K | _______ | ⏳ |
| Number of repositories | 1 | 3 | _______ | ⏳ |
| Test coverage | 80% | 90% | _______ | ⏳ |

---

## Notes

Use this space to track decisions, blockers, and learnings:

**Decisions Made:**
- User confirmed: Keep all ObjectQL components together
- Extract only ObjectStack components (runtime + protocols)

**Blockers:**
- 

**Learnings:**
- 

---

**Status:** 🚀 Ready to Begin  
**Owner:** @hotlong  
**Timeline:** 12 weeks to ObjectQL 5.0 (revised from 16 weeks)

