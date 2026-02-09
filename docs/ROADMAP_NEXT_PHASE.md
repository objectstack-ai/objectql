# ObjectQL — Next Phase Optimization & Improvement Roadmap

> Created: 2026-02-09 | Status: **In Progress — Phases 1, 3, 4 (Wave 1-2), 5A, 6 (partial), 7 (partial) Complete**
> Current Version: **4.2.0** | @objectstack Platform: **v2.0.1**
> Scope: Code quality, type safety, error handling, testing, performance, and DX improvements

---

## Table of Contents

- [Executive Summary](#executive-summary)
- [Codebase Audit Findings](#codebase-audit-findings)
- [Phase 1: Type Safety & Error Handling Standardization](#phase-1-type-safety--error-handling-standardization)
- [Phase 2: Test Coverage & Quality Gates](#phase-2-test-coverage--quality-gates)
- [Phase 3: Console Logging & Observability](#phase-3-console-logging--observability)
- [Phase 4: ESLint Strictness Progression](#phase-4-eslint-strictness-progression)
- [Phase 5: TODO Elimination & Protocol Compliance](#phase-5-todo-elimination--protocol-compliance)
- [Phase 6: Documentation & DX](#phase-6-documentation--dx)
- [Phase 7: Performance & Bundle Optimization](#phase-7-performance--bundle-optimization)
- [Appendix: Full Audit Data](#appendix-full-audit-data)

---

## Executive Summary

A comprehensive codebase scan across all **30+ packages** in the ObjectQL monorepo reveals a maturing ecosystem with strong architecture but several categories of technical debt to address before v5.0 stabilization. This roadmap organizes improvements into **7 phases**, prioritized by impact and risk.

**Key Findings:**

| Category | Current State | Target State |
|----------|---------------|--------------|
| `any` type usage | ~330 instances across packages | < 50 (critical path zero) |
| Error handling | Mixed (`throw new Error` ~100, `ObjectQLError` ~35) | 100% `ObjectQLError` in all packages |
| Test coverage | 100% packages have tests, but tools layer is weak | Full coverage including CLI and scaffolding tools |
| Console logging | ~60 `console.*` calls in production source | Zero in source; structured logging via hooks |
| ESLint rules | 11 rules disabled (incl. `no-explicit-any`) | Progressive re-enablement |
| TODO/FIXME | 9 items (CLI, OData) | Zero |
| Protocol compliance | GraphQL 85%, OData 80%, JSON-RPC 90% | 95%+ all protocols |

---

## Codebase Audit Findings

### Package Health Matrix

| Package | Version | `any` Count | Error Pattern | Tests | Console Calls | TODOs |
|---------|---------|-------------|---------------|-------|---------------|-------|
| **@objectql/types** | 4.2.0 | 85 | N/A (types only) | 3 files | 0 | 0 |
| **@objectql/core** | 4.2.0 | 103 | `Error` (~30) | 14 files | 1 | 0 |
| **@objectql/edge-adapter** | 4.2.0 | 1 | None | 1 file | 0 | 0 |
| **@objectql/platform-node** | 4.2.0 | 3 | `Error` (2) | 3 files | 0 | 0 |
| **@objectql/plugin-formula** | 4.2.0 | 10 | `Error` (3) | 5 files | 0 | 0 |
| **@objectql/plugin-multitenancy** | 4.2.0 | 22 | `Error` (18) | 6 files | 0 | 0 |
| **@objectql/plugin-security** | 4.2.0 | 59 | `ObjectQLError` (6) | 8 files | 0 | 0 |
| **@objectql/plugin-sync** | 4.2.0 | 0 | None | 1 file | 0 | 0 |
| **@objectql/plugin-validator** | 4.2.0 | 15 | `Error` (11) | 4 files | 0 | 0 |
| **@objectql/plugin-workflow** | 4.2.0 | 13 | `Error` (3) | 4 files | 0 | 0 |
| **@objectql/driver-sql** | 4.2.0 | 54 | `Error` (7) | 6 files | 13 | 0 |
| **@objectql/driver-mongo** | 4.2.0 | 47 | `Error` (9) | 4 files | 4 | 0 |
| **@objectql/driver-memory** | 4.2.0 | 51 | Mixed (7+7) | 2 files | 0 | 0 |
| **@objectql/driver-redis** | 4.2.0 | 48 | `Error` (10) | 2 files | 19 | 0 |
| **@objectql/driver-excel** | 4.2.0 | 12 | `ObjectQLError` (8) | 2 files | 0 | 0 |
| **@objectql/driver-fs** | 4.2.0 | 16 | `ObjectQLError` (2) | 2 files | 0 | 0 |
| **@objectql/sdk** | 4.2.0 | 22 | Mixed | 1 file | 0 | 0 |
| **@objectql/driver-pg-wasm** | 4.2.0 | 25 | `ObjectQLError` (1) | 1 file | 0 | 0 |
| **@objectql/driver-sqlite-wasm** | 4.2.0 | 17 | `ObjectQLError` (1) | 1 file | 0 | 0 |
| **@objectql/protocol-graphql** | 4.2.0 | 58 | `Error` (4) | 4 files | 0 | 3 |
| **@objectql/protocol-odata-v4** | 4.2.0 | 32 | `Error` (7) | 3 files | 0 | 3 |
| **@objectql/protocol-json-rpc** | 4.2.0 | 37 | `Error` (8) | 4 files | 15 | 0 |
| **@objectql/protocol-sync** | 4.2.0 | 0 | None | 1 file | 0 | 0 |
| **@objectql/cli** | 4.2.0 | 12 | `Error` (5) | 1 file | 6 | 6 |
| **@objectql/create** | 4.2.0 | 2 | None | 0 files | 0 | 3 |
| **@objectql/driver-tck** | 4.2.0 | 7 | None | 0 files | 0 | 0 |
| **@objectql/protocol-tck** | 4.2.0 | 7 | None | 0 files | 0 | 0 |
| **vscode-objectql** | 4.1.0 | 0 | None | 0 files | 0 | 0 |

---

## Phase 1: Type Safety & Error Handling Standardization

> Priority: **P0 — Critical** | Est: 2 weeks | Impact: All packages

### 1A. Migrate all `throw new Error` → `throw new ObjectQLError`

The coding standard mandates `ObjectQLError` for all thrown errors. Currently, ~100 instances of `throw new Error` exist across the codebase, while only ~35 use `ObjectQLError`.

**Definition** (already in `@objectql/types/src/api.ts`):
```typescript
export class ObjectQLError extends Error {
    public code: ApiErrorCode | string;
    public details?: ApiErrorDetails;
    constructor(error: { code: ApiErrorCode | string; message: string; details?: ApiErrorDetails });
}
```

**Priority order** (by consumer impact):

| Priority | Package | `Error` Count | Action |
|----------|---------|---------------|--------|
| P0 | `@objectql/core` | ~30 | Migrate to `ObjectQLError` with semantic codes |
| P0 | `@objectql/plugin-multitenancy` | 18 | Migrate — these are user-facing tenant violations |
| P0 | `@objectql/plugin-validator` | 11 | Migrate — validation errors need structured codes |
| P1 | `@objectql/driver-mongo` | 9 | Migrate — driver errors need `DRIVER_ERROR` codes |
| P1 | `@objectql/driver-redis` | 10 | Migrate — same as Mongo |
| P1 | `@objectql/driver-sql` | 7 | Migrate — same pattern |
| P1 | `@objectql/driver-memory` | 7 | Migrate remaining `Error` → `ObjectQLError` |
| P2 | `@objectql/protocol-json-rpc` | 8 | Migrate — protocol errors should be typed |
| P2 | `@objectql/protocol-odata-v4` | 7 | Migrate |
| P2 | `@objectql/protocol-graphql` | 4 | Migrate |
| P2 | `@objectql/cli` | 5 | Migrate — CLI user-facing errors |
| P3 | Others | Various | Remaining low-count packages |

**Error Code Taxonomy** (new codes to define in `@objectql/types`):

```typescript
// Proposed additions to ApiErrorCode
type DriverErrorCode =
  | 'DRIVER_ERROR'
  | 'DRIVER_CONNECTION_FAILED'
  | 'DRIVER_QUERY_FAILED'
  | 'DRIVER_TRANSACTION_FAILED'
  | 'DRIVER_UNSUPPORTED_OPERATION';

type ProtocolErrorCode =
  | 'PROTOCOL_ERROR'
  | 'PROTOCOL_INVALID_REQUEST'
  | 'PROTOCOL_METHOD_NOT_FOUND'
  | 'PROTOCOL_BATCH_ERROR';

type PluginErrorCode =
  | 'TENANT_ISOLATION_VIOLATION'
  | 'TENANT_NOT_FOUND'
  | 'WORKFLOW_TRANSITION_DENIED'
  | 'FORMULA_EVALUATION_ERROR';
```

**Success Criteria:**
- [x] Zero `throw new Error(` in `packages/` (excluding test files)
- [x] All error codes documented in `@objectql/types`
- [x] Existing tests still pass after migration

### 1B. Reduce `any` type usage

Current: **~330 instances** across all packages. Target: **< 50** (with remaining being justified edge cases).

**Strategy:**

| `any` Location | Replacement Strategy | Est. |
|----------------|---------------------|------|
| Type definitions (`@objectql/types`) | Replace with `unknown`, generics `<T>`, or Zod inferred types | 3d |
| Driver implementations | Use `Record<string, unknown>` for data payloads | 2d |
| Protocol handlers | Use `unknown` + type guards for request parsing | 2d |
| Plugin hooks | Use generic `HookContext<T>` where `T` is the object type | 2d |
| `as any` casts | Replace with proper type narrowing or `as unknown as X` | 1d |

**Top priority packages** (by `any` count):

1. `@objectql/core` — 103 instances (engine internals)
2. `@objectql/types` — 85 instances (type definitions themselves)
3. `@objectql/plugin-security` — 59 instances (query/field masking)
4. `@objectql/protocol-graphql` — 58 instances (schema generation)
5. `@objectql/driver-sql` — 54 instances (Knex adapter)
6. `@objectql/driver-memory` — 51 instances (Mingo adapter)

**Note:** Some `any` usage is justified (e.g., Knex/Mingo/MongoDB API boundaries). Each instance should be reviewed individually. The ESLint rule `@typescript-eslint/no-explicit-any` is currently `"off"` — see Phase 4 for re-enablement plan.

---

## Phase 2: Test Coverage & Quality Gates

> Priority: **P0 — Critical** | Est: 2 weeks | Impact: All packages

### 2A. Fill testing gaps

| Package | Current Tests | Gap | Action |
|---------|---------------|-----|--------|
| **@objectql/create** | 0 files | Full | Add scaffolding output tests |
| **@objectql/cli** | 1 file | High | Add per-command unit tests (generate, new, doctor, migrate) |
| **vscode-objectql** | 0 files | Full | Add extension activation + provider tests |
| **@objectql/driver-tck** | 0 files (it IS a test kit) | Low | Add self-tests for TCK framework |
| **@objectql/protocol-tck** | 0 files (same) | Low | Add self-tests for TCK framework |
| **@objectql/sdk** | 1 file | Medium | Add retry logic, timeout, auth header tests |
| **@objectql/driver-pg-wasm** | 1 file | Medium | Add OPFS persistence, fallback, JSONB tests |
| **@objectql/driver-sqlite-wasm** | 1 file | Medium | Add OPFS persistence, WAL mode, fallback tests |
| **@objectql/protocol-sync** | 1 file | Medium | Add change-log, version-store, handler tests |
| **@objectql/plugin-sync** | 1 file | Medium | Add mutation-logger, conflict resolver tests |

### 2B. CI quality gates

| Gate | Current | Target |
|------|---------|--------|
| Build (all packages) | ✅ | ✅ |
| Unit tests | ✅ (per-package vitest) | ✅ + coverage threshold |
| Coverage threshold | None | ≥ 80% line coverage per package |
| ESLint | ✅ (many rules off) | ✅ (progressive strictness, see Phase 4) |
| `check-versions` | ✅ | ✅ |
| TCK conformance | Manual | CI-automated per driver/protocol |

### 2C. Benchmark regression gate

The `scripts/benchmarks/core-perf.ts` exists but is not CI-integrated.

| Task | Description | Est. |
|------|-------------|------|
| **B-1** | Establish baseline benchmark numbers | 2h |
| **B-2** | Add benchmark to CI (threshold-based, fail on > 20% regression) | 4h |
| **B-3** | Add driver-specific benchmarks (SQL, Memory, Redis) | 4h |

---

## Phase 3: Console Logging & Observability

> Priority: **P1 — Important** | Est: 1 week | Impact: Drivers, Protocols, CLI

### Problem

~60 `console.*` calls in production source code across drivers and protocols. These are problematic because:
1. No log level control (debug vs. info vs. error)
2. No structured logging (JSON format for observability)
3. Cannot be silenced in production
4. Mix of debug leftovers and intentional logging

### Distribution

| Package | `console.*` Count | Nature |
|---------|-------------------|--------|
| `@objectql/driver-redis` | 19 | Connection retries, pool stats |
| `@objectql/protocol-json-rpc` | 15 | Request/response logging |
| `@objectql/driver-sql` | 13 | Query logging, schema operations |
| `@objectql/cli` | 6 | User-facing CLI output (keep) |
| `@objectql/driver-mongo` | 4 | Connection events |
| `@objectql/driver-sqlite-wasm` | 2 | Init events |
| `@objectql/core` | 1 | Plugin registration |

### Action Plan

| Task | Description | Est. |
|------|-------------|------|
| **L-1** | Audit all `console.*` calls — categorize as DEBUG, INFO, WARN, or REMOVE | 2h |
| **L-2** | Remove debug-only `console.log` calls from drivers | 4h |
| **L-3** | Replace necessary logging with ObjectQL hook-based events (emit, not print) | 8h |
| **L-4** | Keep `console.*` only in `@objectql/cli` (user-facing terminal output) | — |
| **L-5** | Add ESLint rule `no-console` with override for CLI package only | 1h |

---

## Phase 4: ESLint Strictness Progression

> Priority: **P1 — Important** | Est: 2 weeks (incremental) | Impact: All packages

### Current State

The ESLint config (`eslint.config.mjs`) disables **11 rules**:

```javascript
"@typescript-eslint/no-explicit-any": "off",     // ~330 instances
"@typescript-eslint/no-unused-vars": "off",       // Unknown count
"@typescript-eslint/no-require-imports": "off",    // Legacy CJS imports
"@typescript-eslint/no-empty-object-type": "off",  // Empty interfaces
"no-case-declarations": "off",                     // Switch block scoping
"no-useless-escape": "off",                        // Regex escapes
"prefer-const": "off",                             // let vs const
"no-empty": "off",                                 // Empty blocks
"no-undef": "off",                                 // Undefined vars
"no-useless-catch": "off",                         // Re-throw patterns
"@typescript-eslint/no-this-alias": "off",         // this aliasing
"@typescript-eslint/no-unsafe-function-type": "off" // Function type
```

### Re-enablement Plan

Each rule should be re-enabled incrementally after fixing violations:

| Wave | Rule | Severity | Est. to Fix | Priority |
|------|------|----------|-------------|----------|
| **Wave 1** | `prefer-const` | `warn` → `error` | 1d | P1 |
| **Wave 1** | `no-useless-catch` | `error` | 1d | P1 |
| **Wave 1** | `no-empty` | `warn` | 1d | P1 |
| **Wave 2** | `@typescript-eslint/no-unused-vars` | `warn` | 2d | P1 |
| **Wave 2** | `no-case-declarations` | `error` | 1d | P1 |
| **Wave 3** | `no-useless-escape` | `error` | 1d | P2 |
| **Wave 3** | `@typescript-eslint/no-require-imports` | `error` | 2d | P2 |
| **Wave 4** | `@typescript-eslint/no-explicit-any` | `warn` | Ongoing | P2 |
| **Wave 4** | `@typescript-eslint/no-empty-object-type` | `warn` | 1d | P2 |
| **Wave 5** | `@typescript-eslint/no-unsafe-function-type` | `error` | 1d | P3 |
| **Wave 5** | `@typescript-eslint/no-this-alias` | `warn` | 1d | P3 |

**Approach:**
1. Enable one wave at a time
2. Fix all violations in that wave
3. CI enforces the rule going forward
4. Move to next wave

---

## Phase 5: TODO Elimination & Protocol Compliance

> Priority: **P1 — Important** | Est: 1 week | Impact: CLI, OData, Protocols

### 5A. Resolve all TODO/FIXME/HACK comments

| File | Line | Comment | Action |
|------|------|---------|--------|
| `tools/cli/src/commands/repl.ts` | 83 | `// HACK: We need to construct a repository.` | Refactor REPL to use proper kernel initialization |
| `tools/cli/src/commands/new.ts` | 181 | `// TODO: Implement action logic` | Implement or remove scaffold placeholder |
| `tools/cli/src/commands/new.ts` | 196 | `// TODO: Implement before insert logic` | Implement or remove scaffold placeholder |
| `tools/cli/src/commands/new.ts` | 206 | `// TODO: Implement after insert logic` | Implement or remove scaffold placeholder |
| `tools/cli/src/commands/migrate.ts` | 36 | `// TODO: Implement migration logic` | Implement migration or document as planned |
| `tools/cli/src/commands/migrate.ts` | 49 | `// TODO: Implement rollback logic` | Implement rollback or document as planned |
| `protocols/odata-v4/src/index.ts` | 1540 | `// TODO: Need to extract and store the created ID` | Implement batch operation ID tracking |
| `protocols/odata-v4/src/index.ts` | 1544 | `// TODO: Need to store the deleted record data` | Implement batch delete record tracking |
| `protocols/odata-v4/src/index.ts` | 1548 | `// TODO: Need to fetch and store previous values` | Implement batch update pre-fetch |

### 5B. Protocol compliance targets

| Protocol | Current | Target | Key Gaps |
|----------|---------|--------|----------|
| **GraphQL** | 85% | 95% | Subscriptions (WebSocket), Federation v2, N+1 DataLoader |
| **OData V4** | 80% | 95% | `$expand`, `$count` inline, `$batch` (3 TODOs above) |
| **JSON-RPC** | 90% | 95% | `object.count()`, `action.execute()`, batch requests |

---

## Phase 6: Documentation & DX

> Priority: **P2 — Moderate** | Est: 1 week | Impact: All consumers

### 6A. Housekeeping tasks (from Q1 P3 plan)

| Task | Description | Status |
|------|-------------|--------|
| H-1 | Delete `packages/runtime/` empty directory | Pending |
| H-2 | Update `README.md` — add WASM drivers, remove deprecated packages | Pending |
| H-3 | Replace `@objectql/server` references with Kernel pattern | Pending |
| H-4 | Clean `cli/src/commands/doctor.ts` — remove `@objectql/server` check | Pending |
| H-5 | Clean `sdk/README.md` — remove `@objectql/server` reference | Pending |
| H-6 | Bump `vscode-objectql` from 4.1.0 → 4.2.0 | Pending |
| H-7 | Update express-server example README | Pending |
| H-8 | Audit CHANGELOG.md files for deprecated references | Pending |

### 6B. New documentation needs

| Document | Location | Purpose |
|----------|----------|---------|
| Error handling guide | `content/docs/guides/error-handling.mdx` | Document `ObjectQLError` pattern, error codes |
| Plugin development guide | `content/docs/extending/plugin-development.mdx` | How to build a custom plugin |
| Driver development guide | `content/docs/extending/driver-development.mdx` | How to implement a new driver |
| Architecture overview | `content/docs/guides/architecture.mdx` | Updated architecture diagram with all layers |
| Migration guide (v4 → v5) | `content/docs/guides/migration-v5.mdx` | Breaking changes, deprecated API removal |

### 6C. VSCode extension alignment

| Task | Description |
|------|-------------|
| Bump version to 4.2.0 | Align with monorepo |
| Add basic test suite | Extension activation, schema validation, snippet tests |
| Publish to VS Code Marketplace | If not already published |

---

## Phase 7: Performance & Bundle Optimization

> Priority: **P2 — Moderate** | Est: 2 weeks | Impact: Core, Drivers, Browser

### 7A. Core performance

The `packages/foundation/core/src/optimizations/` directory contains advanced optimization modules that are already implemented:

| Module | Status | Action |
|--------|--------|--------|
| `GlobalConnectionPool.ts` | ✅ Implemented | Benchmark and tune pool sizes |
| `QueryCompiler.ts` | ✅ Implemented | Add cache hit/miss metrics |
| `LazyMetadataLoader.ts` | ✅ Implemented | Verify lazy loading in production |
| `OptimizedValidationEngine.ts` | ✅ Implemented | Benchmark vs. base validator |
| `CompiledHookManager.ts` | ✅ Implemented | Profile hook chain overhead |
| `SQLQueryOptimizer.ts` | ✅ Implemented | Add query plan analysis |
| `DependencyGraph.ts` | ✅ Implemented | Ensure circular dependency detection |

### 7B. Browser bundle optimization

For WASM drivers used in browser environments:

| Task | Description | Est. |
|------|-------------|------|
| **BO-1** | Tree-shaking audit — ensure dead code elimination works across packages | 4h |
| **BO-2** | Measure `@objectql/core` bundle size (target: < 50KB gzip) | 2h |
| **BO-3** | WASM lazy loading — load WASM only when first query executes | 4h |
| **BO-4** | Add `sideEffects: false` to all package.json files where applicable | 2h |

### 7C. Driver performance benchmarks

| Benchmark | Metric | Target |
|-----------|--------|--------|
| Memory driver — 10K inserts | ops/sec | Baseline establishment |
| SQL driver (SQLite) — 10K inserts | ops/sec | Baseline establishment |
| Redis driver — 10K inserts | ops/sec | Baseline establishment |
| Memory driver — complex aggregation (1M records) | latency p99 | Baseline establishment |
| SQL driver — JOIN query (100K records) | latency p99 | Baseline establishment |

---

## Appendix: Full Audit Data

### A. Error Handling Patterns by Package

**Packages using ONLY `ObjectQLError` (compliant ✅):**
- `@objectql/driver-excel` — 8 instances
- `@objectql/driver-fs` — 2 instances
- `@objectql/plugin-sync` — 0 errors thrown (data-focused)
- `@objectql/protocol-sync` — 0 errors thrown
- `@objectql/edge-adapter` — 0 errors thrown

**Packages using ONLY `Error` (non-compliant ❌):**
- `@objectql/driver-mongo` — 9 instances
- `@objectql/driver-redis` — 10 instances
- `@objectql/driver-sql` — 7 instances
- `@objectql/protocol-json-rpc` — 8 instances
- `@objectql/protocol-odata-v4` — 7 instances
- `@objectql/protocol-graphql` — 4 instances

**Packages using BOTH (partially compliant ⚠️):**
- `@objectql/core` — ~30 `Error`, 0 `ObjectQLError`
- `@objectql/driver-memory` — 7 `Error`, 7 `ObjectQLError`
- `@objectql/sdk` — mixed
- `@objectql/plugin-security` — mostly `ObjectQLError`

### B. `as any` Cast Distribution

Top packages by `as any` cast count:
1. `foundation/core` — 56 casts
2. `drivers/sql` — 18 casts
3. `drivers/sqlite-wasm` — 15 casts
4. `protocols/json-rpc` — 15 casts
5. `foundation/plugin-security` — 11 casts

### C. Dependency Graph Observations

- **`@objectql/types`** correctly has ZERO production dependencies (pure types)
- **`@objectql/core`** depends on `plugin-formula` and `plugin-validator` — tight coupling noted
- All `@objectstack/*` packages are at **v2.0.1** — aligned
- **`mingo`** (used in memory driver) is the only non-standard query engine dependency
- **`knex`** is shared across `driver-sql`, `driver-pg-wasm`, `driver-sqlite-wasm`

### D. Recommended Execution Order

```
Phase 1 (Type Safety)    ────────┐
Phase 2 (Testing)        ────────┤  Can run in parallel
Phase 3 (Logging)        ────────┘
         │
         ▼
Phase 4 (ESLint)         ────────┐  Depends on Phase 1 (any reduction)
Phase 5 (TODO/Protocol)  ────────┘
         │
         ▼
Phase 6 (Documentation)  ────────┐  Depends on Phase 5 (protocol work)
Phase 7 (Performance)    ────────┘  Independent, can start earlier
```

### E. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| `ObjectQLError` migration breaks error handling in consumers | Medium | High | Add `instanceof ObjectQLError` checks in tests; ensure `message` property backward compat |
| `any` removal causes type inference regressions | Medium | Medium | Incremental approach; one package at a time; full test suite after each package |
| ESLint re-enablement creates large PR diff | Low | Low | One rule per PR; auto-fix where possible |
| Performance regression from type narrowing overhead | Low | Low | Benchmark before/after each change |
| Bundle size increase from `ObjectQLError` class in browser | Low | Low | Class is already in `@objectql/types`; no new code |

---

*This roadmap should be reviewed and prioritized against the existing Q1-Q4 plans in `WORK_PLAN_2026_Q1_P2.md` and `WORK_PLAN_2026_Q3.md`. Phases 1-3 are recommended to execute during Q1 P3 alongside the existing housekeeping plan.*
