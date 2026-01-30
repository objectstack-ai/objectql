# ObjectQL Kernel Refactoring - Implementation Checklist

**Version:** 1.0  
**Date:** 2026-01-30  
**Reference:** [KERNEL_REFACTORING_RECOMMENDATION.md](./KERNEL_REFACTORING_RECOMMENDATION.md)

This is a practical, actionable checklist for implementing the kernel refactoring. Check off items as you complete them.

---

## Phase 0: Decision Making (This Week)

### Critical Decisions

- [ ] **Decision 1:** Review and approve the overall refactoring strategy
  - [ ] Read [KERNEL_REFACTORING_RECOMMENDATION.md](./KERNEL_REFACTORING_RECOMMENDATION.md)
  - [ ] Review the 10 proposed optimizations
  - [ ] Approve or request changes

- [ ] **Decision 2:** Keep or move `@objectql/platform-node`?
  - [ ] Option A: Keep (practical, needed for YAML loading) ⭐ **Recommended**
  - [ ] Option B: Move to `@objectstack/platform-node`
  - [ ] Decision: ______________

- [ ] **Decision 3:** Keep or move `@objectql/plugin-security`?
  - [ ] Option A: Keep (security is kernel concern) ⭐ **Recommended**
  - [ ] Option B: Move to `@objectstack/plugin-security`
  - [ ] Decision: ______________

---

## Phase 1: Repository Setup (Week 1-2)

### 1.1 Create New Repositories

- [ ] Create `objectstack-ai/objectstack-runtime`
  ```bash
  gh repo create objectstack-ai/objectstack-runtime --public \
    --description "Runtime server adapters for ObjectStack" \
    --license mit
  ```

- [ ] Create `objectstack-ai/objectstack-protocols`
  ```bash
  gh repo create objectstack-ai/objectstack-protocols --public \
    --description "Protocol plugins (GraphQL, OData, JSON-RPC) for ObjectStack" \
    --license mit
  ```

- [ ] Create `objectstack-ai/objectql-drivers`
  ```bash
  gh repo create objectstack-ai/objectql-drivers --public \
    --description "Database driver implementations for ObjectQL" \
    --license mit
  ```

- [ ] Create `objectstack-ai/objectql-tools`
  ```bash
  gh repo create objectstack-ai/objectql-tools --public \
    --description "Developer tools (CLI, scaffolding) for ObjectQL" \
    --license mit
  ```

- [ ] Create `objectstack-ai/objectql-examples`
  ```bash
  gh repo create objectstack-ai/objectql-examples --public \
    --description "Example projects and integrations for ObjectQL" \
    --license mit
  ```

### 1.2 Initialize Monorepo Structure

For each new repository, set up the basic structure:

- [ ] **objectstack-runtime**
  ```bash
  cd objectstack-runtime
  pnpm init
  mkdir -p packages/server packages/worker packages/lambda
  echo 'packages:\n  - "packages/*"' > pnpm-workspace.yaml
  cp ../objectql/tsconfig.base.json .
  cp ../objectql/.gitignore .
  ```

- [ ] **objectstack-protocols**
  ```bash
  cd objectstack-protocols
  pnpm init
  mkdir -p packages/graphql packages/json-rpc packages/odata-v4
  echo 'packages:\n  - "packages/*"' > pnpm-workspace.yaml
  cp ../objectql/tsconfig.base.json .
  ```

- [ ] **objectql-drivers**
  ```bash
  cd objectql-drivers
  pnpm init
  mkdir -p packages/sql packages/mongo packages/memory packages/redis
  mkdir -p packages/excel packages/fs packages/localstorage packages/sdk
  echo 'packages:\n  - "packages/*"' > pnpm-workspace.yaml
  cp ../objectql/tsconfig.base.json .
  ```

- [ ] **objectql-tools**
  ```bash
  cd objectql-tools
  pnpm init
  mkdir -p packages/cli packages/create packages/vscode
  echo 'packages:\n  - "packages/*"' > pnpm-workspace.yaml
  cp ../objectql/tsconfig.base.json .
  ```

- [ ] **objectql-examples**
  ```bash
  cd objectql-examples
  mkdir -p quickstart/hello-world showcase/project-tracker
  mkdir -p integrations/express-server protocols/multi-protocol-server
  ```

### 1.3 Set Up CI/CD

- [ ] Create shared GitHub Actions workflow template
  ```yaml
  # .github/workflows/ci.yml
  name: CI
  on: [push, pull_request]
  jobs:
    test:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v3
        - uses: pnpm/action-setup@v2
        - uses: actions/setup-node@v3
        - run: pnpm install
        - run: pnpm run build
        - run: pnpm run test
  ```

- [ ] Copy CI workflow to all new repositories
  - [ ] objectstack-runtime
  - [ ] objectstack-protocols
  - [ ] objectql-drivers
  - [ ] objectql-tools

---

## Phase 2: Package Migration (Week 3-4)

### 2.1 Migrate Runtime Packages

- [ ] Split `packages/runtime/server` from objectql repo
  ```bash
  cd objectql
  git subtree split -P packages/runtime/server -b migrate-runtime-server
  ```

- [ ] Add to objectstack-runtime repo
  ```bash
  cd ../objectstack-runtime
  git subtree add --squash --prefix=packages/server ../objectql migrate-runtime-server
  ```

- [ ] Update `package.json` in `objectstack-runtime/packages/server`
  - [ ] Change name to `@objectstack/runtime`
  - [ ] Update dependencies from `workspace:*` to `^5.0.0` for kernel packages
  - [ ] Add peer dependencies for `@objectql/types` and `@objectql/core`

- [ ] Test the migrated package
  ```bash
  cd packages/server
  pnpm install
  pnpm run build
  pnpm run test
  ```

### 2.2 Migrate Protocol Packages

- [ ] Split `packages/protocols/graphql`
  ```bash
  cd objectql
  git subtree split -P packages/protocols/graphql -b migrate-protocol-graphql
  cd ../objectstack-protocols
  git subtree add --squash --prefix=packages/graphql ../objectql migrate-protocol-graphql
  ```

- [ ] Split `packages/protocols/json-rpc`
  ```bash
  cd objectql
  git subtree split -P packages/protocols/json-rpc -b migrate-protocol-jsonrpc
  cd ../objectstack-protocols
  git subtree add --squash --prefix=packages/json-rpc ../objectql migrate-protocol-jsonrpc
  ```

- [ ] Split `packages/protocols/odata-v4`
  ```bash
  cd objectql
  git subtree split -P packages/protocols/odata-v4 -b migrate-protocol-odata
  cd ../objectstack-protocols
  git subtree add --squash --prefix=packages/odata-v4 ../objectql migrate-protocol-odata
  ```

- [ ] Update all protocol package.json files
  - [ ] Update package names to `@objectstack/protocol-*`
  - [ ] Update dependencies to `^5.0.0` for kernel packages
  - [ ] Test each protocol package

### 2.3 Migrate Driver Packages

For each of the 8 drivers, repeat this process:

- [ ] `@objectql/driver-sql`
  ```bash
  git subtree split -P packages/drivers/sql -b migrate-driver-sql
  cd ../objectql-drivers
  git subtree add --squash --prefix=packages/sql ../objectql migrate-driver-sql
  ```

- [ ] `@objectql/driver-mongo`
- [ ] `@objectql/driver-memory`
- [ ] `@objectql/driver-redis`
- [ ] `@objectql/driver-excel`
- [ ] `@objectql/driver-fs`
- [ ] `@objectql/driver-localstorage`
- [ ] `@objectql/driver-sdk`

- [ ] Update all driver package.json files
  - [ ] Keep package names as `@objectql/driver-*`
  - [ ] Update dependencies to `^5.0.0` for kernel packages
  - [ ] Test each driver

### 2.4 Migrate Tools Packages

- [ ] `@objectql/cli`
  ```bash
  git subtree split -P packages/tools/cli -b migrate-tool-cli
  cd ../objectql-tools
  git subtree add --squash --prefix=packages/cli ../objectql migrate-tool-cli
  ```

- [ ] `@objectql/create`
  ```bash
  git subtree split -P packages/tools/create -b migrate-tool-create
  cd ../objectql-tools
  git subtree add --squash --prefix=packages/create ../objectql migrate-tool-create
  ```

- [ ] `vscode-objectql`
  ```bash
  git subtree split -P packages/tools/vscode-objectql -b migrate-tool-vscode
  cd ../objectql-tools
  git subtree add --squash --prefix=packages/vscode ../objectql migrate-tool-vscode
  ```

### 2.5 Migrate Examples

- [ ] Copy all examples to objectql-examples repo
  ```bash
  cp -r objectql/examples/* objectql-examples/
  ```

- [ ] Update all example dependencies to use new package locations

### 2.6 Publish Initial Versions

- [ ] Publish `@objectstack/runtime@1.0.0`
- [ ] Publish `@objectstack/protocol-graphql@1.0.0`
- [ ] Publish `@objectstack/protocol-json-rpc@1.0.0`
- [ ] Publish `@objectstack/protocol-odata-v4@1.0.0`
- [ ] Publish all 8 driver packages as `@objectql/driver-*@5.0.0`
- [ ] Publish `@objectql/cli@5.0.0`
- [ ] Publish `create-objectql@5.0.0`

---

## Phase 3: ObjectQL Kernel Cleanup (Week 5)

### 3.1 Remove Migrated Packages

- [ ] Delete migrated packages from objectql repo
  ```bash
  rm -rf packages/runtime
  rm -rf packages/protocols
  rm -rf packages/drivers
  rm -rf packages/tools
  rm -rf examples
  ```

- [ ] Update `pnpm-workspace.yaml`
  ```yaml
  packages:
    - "packages/foundation/*"
    # Removed: drivers, runtime, protocols, tools
  ```

- [ ] Update root `package.json`
  - [ ] Remove scripts for moved packages
  - [ ] Remove devDependencies for driver-specific tools
  - [ ] Update version to `5.0.0`

- [ ] Update `.gitignore` if needed

### 3.2 Update Documentation

- [ ] Update `README.md`
  - [ ] Remove references to moved packages
  - [ ] Add links to new repositories
  - [ ] Update installation instructions
  - [ ] Update architecture diagrams

- [ ] Create `MIGRATION.md`
  - [ ] Document changes from v4.x to v5.x
  - [ ] Provide code migration examples
  - [ ] List new package locations

- [ ] Update `ARCHITECTURE.md`
  - [ ] Focus on kernel architecture only
  - [ ] Remove driver/protocol implementation details
  - [ ] Link to external repositories for those topics

### 3.3 Update CI/CD

- [ ] Update `.github/workflows/` to only test kernel packages
- [ ] Remove driver-specific test jobs
- [ ] Remove protocol-specific test jobs

### 3.4 Commit and Tag

- [ ] Commit all cleanup changes
  ```bash
  git add .
  git commit -m "refactor: ObjectQL 5.0 - Extract ecosystem to separate repositories"
  git tag v5.0.0-alpha.1
  git push origin main --tags
  ```

---

## Phase 4: Kernel Optimizations (Week 6-12)

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

## Phase 5: Ecosystem Alignment (Week 13-16)

### 5.1 Update External Packages

- [ ] Update objectstack-runtime to depend on `@objectql/types@^5.0.0`
- [ ] Update objectstack-protocols to depend on `@objectql/types@^5.0.0`
- [ ] Update objectql-drivers to depend on `@objectql/types@^5.0.0`
- [ ] Update objectql-tools to depend on `@objectql/core@^5.0.0`

### 5.2 Create Migration Guide

- [ ] Write `MIGRATION-v4-to-v5.md`
  - [ ] Installation changes
  - [ ] Import path changes
  - [ ] Breaking changes
  - [ ] Code examples (before/after)

### 5.3 Update Examples

- [ ] Update all examples to use new package structure
- [ ] Test all examples
- [ ] Update example documentation

### 5.4 Publish ObjectQL 5.0.0

- [ ] Run full test suite
- [ ] Run all benchmarks
- [ ] Update CHANGELOG.md
- [ ] Publish `@objectql/types@5.0.0`
- [ ] Publish `@objectql/core@5.0.0`
- [ ] Publish `@objectql/platform-node@5.0.0` (if kept)
- [ ] Publish `@objectql/plugin-security@5.0.0` (if kept)
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
| Kernel build time | 5min | 30sec | _______ | ⏳ |
| Kernel test suite | 10min | 1min | _______ | ⏳ |

### Code Quality Metrics

| Metric | Baseline | Target | Actual | Status |
|--------|----------|--------|--------|--------|
| Kernel LOC | ~150K | ~60K | _______ | ⏳ |
| Kernel dependencies | 15+ | <5 | _______ | ⏳ |
| Test coverage | 80% | 90% | _______ | ⏳ |

---

## Notes

Use this space to track decisions, blockers, and learnings:

**Decisions Made:**
- 

**Blockers:**
- 

**Learnings:**
- 

---

**Status:** 🚀 Ready to Begin  
**Owner:** @hotlong  
**Timeline:** 16 weeks to ObjectQL 5.0

