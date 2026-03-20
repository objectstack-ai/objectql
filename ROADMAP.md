# ObjectQL — 2026 Roadmap

> Created: 2026-02-08 | Last Updated: 2026-02-20 | Status: **Active**  
> Current Version: **4.2.2** (31 workspace packages; exceptions: root 4.2.0)  
> Runtime: `@objectstack/cli` v3.2.6 (Kernel pattern) — `@objectql/server` removed, `packages/runtime/` removed.  
> @objectstack Platform: **v3.2.6**

---

## Table of Contents

- [Executive Summary](#executive-summary)
- [Timeline Overview](#timeline-overview)
- [Completed: Q1 Phase 1 — Foundation](#completed-q1-phase-1--foundation)
- [Completed: Q1 Phase 2 — Browser WASM Drivers](#completed-q1-phase-2--browser-wasm-drivers)
- [Completed: Q1 Phase 3 — Housekeeping & Workflow](#completed-q1-phase-3--housekeeping--workflow)
- [Cross-Cutting: Code Quality Improvement Phases](#cross-cutting-code-quality-improvement-phases)
  - [Phase 1: Type Safety & Error Handling](#phase-1-type-safety--error-handling)
  - [Phase 2: Test Coverage & Quality Gates](#phase-2-test-coverage--quality-gates)
  - [Phase 3: Console Logging & Observability](#phase-3-console-logging--observability)
  - [Phase 4: ESLint Strictness Progression](#phase-4-eslint-strictness-progression)
  - [Phase 5: TODO Elimination & Protocol Compliance](#phase-5-todo-elimination--protocol-compliance)
  - [Phase 6: Documentation & DX](#phase-6-documentation--dx)
  - [Phase 7: Performance & Bundle Optimization](#phase-7-performance--bundle-optimization)
- [Q2 — Protocol Maturity & Multi-Tenancy](#q2--protocol-maturity--multi-tenancy)
- [Q3 — Edge Runtime & Offline Sync](#q3--edge-runtime--offline-sync)
  - [Part A: Edge Runtime Support](#part-a-edge-runtime-support)
  - [Part B: Offline-First Sync Protocol](#part-b-offline-first-sync-protocol)
- [Immediate Next Steps (Post v3.0.4 Upgrade)](#immediate-next-steps-post-v304-upgrade)
- [`@objectql/core` Deprecation & Migration Plan](#objectqlcore-deprecation--migration-plan)
  - [Phase A: Decompose ObjectQLPlugin Aggregator (v4.3)](#phase-a-decompose-objectqlplugin-aggregator-v43)
  - [Phase B: Dispose Bridge Class (v4.3)](#phase-b-dispose-bridge-class-v43)
  - [Phase C: Dispose Remaining Modules (v4.3)](#phase-c-dispose-remaining-modules-v43)
  - [Phase D: v5.0 Breaking Release (Q4 2026)](#phase-d-v50-breaking-release-q4-2026)
  - [Target Architecture — Pure Plugin Marketplace](#target-architecture--pure-plugin-marketplace)
- [Q4 — Plugin Marketplace & Stabilization](#q4--plugin-marketplace--stabilization)
- [Package Matrix](#package-matrix)
- [Removed Packages](#removed-packages)
- [Codebase Audit Findings](#codebase-audit-findings)
- [Architecture Decisions Record](#architecture-decisions-record)
- [@objectstack/spec Protocol Alignment Status](#objectstackspec-protocol-alignment-status)

---

## Executive Summary

ObjectQL is the **Standard Protocol for AI Software Generation** — a universal database compiler that transforms declarative metadata (JSON/YAML) into type-safe, optimized database queries. This roadmap tracks the full 2026 development plan across all 30+ packages in the monorepo.

### 2026 Strategy

| Quarter | Theme | Key Deliverables |
|---------|-------|-----------------|
| **Q1** ✅ | Foundation & Browser | WASM drivers, workflow engine, codebase cleanup, core refactoring |
| **Q2** ✅ | Protocol Maturity | GraphQL subscriptions, OData `$expand`, multi-tenancy plugin |
| **Q3** ✅ | Edge & Offline | Edge adapter, offline-first sync protocol, sync protocol handler |
| **Q4** | Marketplace & v5.0 | Plugin marketplace, `@objectql/core` full deprecation, public API stabilization, v5.0 release |

### Code Quality Targets (Cross-Cutting)

| Category | Current State | Target State |
|----------|---------------|--------------|
| `any` type usage | ~905 instances (driver-memory: 40→8, driver-fs: 14→2, driver-excel: 12→2; core: 31, types: 1 ✅) | < 50 (critical path zero) |
| Error handling | 100% `ObjectQLError` ✅ (zero `throw new Error` in production source) | 100% `ObjectQLError` |
| Test coverage | 31 of 31 packages have tests ✅ | Full coverage with ≥ 80% per package |
| Console logging | Near-zero — 3 intentional deprecation warnings in `@objectql/core`, 1 retry log in `sdk`, 2 in `types/logger` fallback | Zero in source; structured logging via hooks |
| ESLint rules | 13 rules configured (11 active, `no-explicit-any` off, `no-undef` off) ✅ | Progressive strictness; re-enable `no-explicit-any` as warn |
| Protocol compliance | GraphQL 95%+, OData 95%+, JSON-RPC 95%+ ✅ | 95%+ all protocols |

### Completed Milestones

- ✅ Phases 1A (ObjectQLError migration), 3 (logging), 4 (ESLint all waves), 5A (TODO elimination), 5B (protocol compliance 95%+), 6 (error-handling + architecture guides)
- ✅ Core refactoring: `@objectql/core` decomposed from ~3,500 to ~800 LOC ([PR #373](https://github.com/objectstack-ai/objectql/pull/373))
- ✅ `@objectstack/*` platform upgraded to **v3.2.6** (Zod v4 alignment)
- ✅ Phase 7 partial (sideEffects in 27 packages), Phase 2 (test suites for SDK, CLI, Create, VSCode)
- ✅ Q1 Phase 2: Browser WASM Drivers (`driver-sqlite-wasm`, `driver-pg-wasm`) implemented with docs and tests
- ✅ Q1 Phase 3: Housekeeping complete (H-1 through H-8), `plugin-workflow` implemented with full test suite
- ✅ `@objectql/plugin-multitenancy` — Automatic tenant isolation with tests
- ✅ `@objectql/plugin-sync` — Offline-first sync engine with conflict resolution
- ✅ `@objectql/edge-adapter` — Edge runtime detection and capability validation
- ✅ `@objectql/protocol-sync` — Sync protocol handler with change logs
- ✅ Q2: Protocol Maturity — GraphQL subscriptions/Federation v2/DataLoader, OData $expand/$count/$batch, JSON-RPC count/execute/batch
- ✅ Q3: Edge & Offline Sync — Edge adapter, sync engine, protocol sync handler
- ✅ Phase 1B partial: Core `any` reduction (99→31 via KernelBridge interface)
- ✅ `@objectql/core` deprecation Phases A–C completed — all modules deprecated with `console.warn` + `@deprecated` JSDoc
- ✅ Utility functions (`toTitleCase`, `convertIntrospectedSchemaToObjects`) moved from core to `@objectql/types`
- ✅ All 66/66 test tasks pass (including plugin-formula integration tests — previously failing, now fixed)
- ✅ 31 of 31 packages have test suites (plugin-optimizations: 103 tests, plugin-query: 99 tests — previously 0)
- ✅ 67 documentation files (.mdx) across 12 sections
- ✅ `@objectql/driver-turso` — Turso/libSQL driver (Phase A: Core Driver) with 125 tests, 3 connection modes (remote, local, embedded replica)
- ✅ `@objectql/driver-turso` — Phase B: Multi-Tenant Router, Schema Diff Engine, Platform API Client, Driver Plugin (52 new tests, 177 total)
- ✅ Fix test quality: replaced all `expect(true).toBe(true)` placeholder assertions with meaningful state checks across `plugin-optimizations`, `protocol-odata-v4`, `protocol-json-rpc`, and `protocol-graphql` (7 files, 10 assertions fixed)

---

## Timeline Overview

```
2026 Q1                          Q2                    Q3                    Q4
├─ Phase 1 (Done) ──┤           │                     │                     │
├─ Phase 2 (Done) ───┤          │                     │                     │
│  WASM Drivers       │         │                     │                     │
├─ Phase 3 (Done) ───┤          │                     │                     │
│  Housekeeping +     │         │                     │                     │
│  Workflow Engine     │         │                     │                     │
├─ Code Quality ──────┼─────────┼─────────────────────┤                     │
│  (Cross-cutting)    │         │                     │                     │
│                     ├─────────┤                     │                     │
│                     │ Protocol│                     │                     │
│                     │ Maturity│                     │                     │
│                     │ Multi-  │                     │                     │
│                     │ Tenancy │                     │                     │
│                     │         ├─────────────────────┤                     │
│                     │         │ Edge Runtime        │                     │
│                     │         │ Offline Sync        │                     │
│                     │         │                     ├─────────────────────┤
│                     │         │                     │ Plugin Marketplace  │
│                     │         │                     │ v5.0 Stabilization  │
└─────────────────────┴─────────┴─────────────────────┴─────────────────────┘
```

---

## Completed: Q1 Phase 1 — Foundation

> Status: **✅ Completed** | Duration: 2025-12 — 2026-01

| Deliverable | Status |
|-------------|--------|
| pnpm workspace + Turborepo build chain | ✅ |
| Conventional Commits + Changesets | ✅ |
| `@objectql/plugin-security` — RBAC, FLS, RLS with AST-level enforcement | ✅ |
| `@objectql/plugin-validator` — 5-type validation engine | ✅ |
| `@objectql/plugin-formula` — Computed fields with sandboxed JS expressions | ✅ |
| `@objectql/driver-tck` + `@objectql/protocol-tck` — Conformance test suites | ✅ |
| Removed `@objectql/driver-localstorage`, `@objectql/driver-utils` | ✅ |
| All 21 packages build + test clean (excl. Mongo/Redis needing live servers) | ✅ |
| `@objectql/core` refactoring — decomposed from ~3,500 to ~800 LOC ([PR #373](https://github.com/objectstack-ai/objectql/pull/373)) | ✅ |
| `@objectql/plugin-query` — QueryService, QueryBuilder extracted from core | ✅ |
| `@objectql/plugin-optimizations` — Connection pooling, query compilation extracted from core | ✅ |

---

## Completed: Q1 Phase 2 — Browser WASM Drivers

> Status: **✅ Completed** | Duration: W1-W6  
> Focus: Browser-native SQL drivers via WebAssembly

### Context

ObjectQL's core compiles QueryAST into optimized, dialect-specific SQL via Knex. All server-side databases (PostgreSQL, MySQL, SQLite) are supported through `@objectql/driver-sql`.

Browser environments have no SQL driver. Modern browsers now support:
- **WebAssembly** — full database engines at near-native speed
- **OPFS** (Origin Private File System) — GB-scale persistent storage
- **SharedArrayBuffer** — cross-tab database access

This phase adds two WASM-based SQL drivers that **reuse the existing Knex compilation pipeline**.

### P0 — `@objectql/driver-sqlite-wasm`

| Field | Value |
|-------|-------|
| **Package** | `packages/drivers/sqlite-wasm` |
| **Priority** | P0 — Primary browser driver |
| **Underlying Library** | [wa-sqlite](https://github.com/nicolo-ribaudo/wa-sqlite) (switchable, not exposed in public API) |
| **WASM Bundle Size** | ~300KB gzip |

**Architecture:**
```
QueryAST → Knex (client: 'sqlite3') → SQL string → wa-sqlite WASM → OPFS/Memory
```

**Scope:**

| Task | Description | Est. |
|------|-------------|------|
| **S0-1** | Package scaffolding | 1h |
| **S0-2** | Implement `SqliteWasmDriver` class wrapping `SqlDriver` (composition) | 4h |
| **S0-3** | Custom Knex client adapter for wa-sqlite | 4h |
| **S0-4** | OPFS persistence backend | 4h |
| **S0-5** | In-memory fallback (for testing/SSR) | 1h |
| **S0-6** | `DriverCapabilities` declaration | 1h |
| **S0-7** | TCK conformance tests | 4h |
| **S0-8** | Unit tests (OPFS init, persistence, quota, health check) | 4h |
| **S0-9** | Documentation (`content/docs/drivers/sqlite-wasm.mdx`) | 2h |
| **S0-10** | Update browser example | 2h |

**Config Interface:**
```typescript
export interface SqliteWasmDriverConfig {
  storage?: 'opfs' | 'memory';
  filename?: string;
  walMode?: boolean;
  pageSize?: number;
}
```

**Success Criteria:**
- [x] `pnpm build` succeeds with new package
- [x] TCK tests pass
- [ ] Browser example works with OPFS persistence
- [ ] Bundle size < 400KB gzip
- [x] Documentation published

### P1 — `@objectql/driver-pg-wasm`

| Field | Value |
|-------|-------|
| **Package** | `packages/drivers/pg-wasm` |
| **Priority** | P1 — Advanced browser driver (starts after P0) |
| **Underlying Library** | [PGlite](https://github.com/nicolo-ribaudo/pglite) (ElectricSQL) |
| **WASM Bundle Size** | ~3MB gzip |

**Architecture:**
```
QueryAST → Knex (client: 'pg') → SQL string → PGlite WASM → IndexedDB/OPFS
```

**Config Interface:**
```typescript
export interface PgWasmDriverConfig {
  storage?: 'idb' | 'opfs' | 'memory';
  database?: string;
  extensions?: string[];
}
```

### Timeline

| Week | Milestone |
|------|-----------|
| W1 | P0 scaffolding + Knex adapter + basic CRUD |
| W2 | P0 OPFS persistence + TCK + tests |
| W3 | P0 docs + browser example + stabilize |
| W4 | P1 scaffolding + Knex adapter + basic CRUD |
| W5 | P1 persistence + PG features + TCK |
| W6 | P1 docs + final verification |

---

## Completed: Q1 Phase 3 — Housekeeping & Workflow

> Status: **✅ Completed** | Duration: 4 weeks

### Part A: Housekeeping (1 week)

Technical debt accumulated from the v3 → v4 migration. These are non-breaking cleanups.

| Task | Description | Est. | Status |
|------|-------------|------|--------|
| **H-1** | Delete `packages/runtime/` empty directory | 5min | ✅ Done |
| **H-2** | Update `README.md` — remove deprecated packages, add WASM drivers | 1h | ✅ Done |
| **H-3** | Replace `@objectql/server` references with Kernel pattern | 1h | ✅ Done |
| **H-4** | Clean `cli/src/commands/doctor.ts` — remove `@objectql/server` check | 30min | ✅ Done (no refs found) |
| **H-5** | Clean `sdk/README.md` — remove `@objectql/server` reference | 30min | ✅ Done (no refs found) |
| **H-6** | Bump `vscode-objectql` from 4.1.0 → 4.2.0 | 1h | ✅ Done |
| **H-7** | Update express-server example README | 30min | ✅ Done |
| **H-8** | Audit CHANGELOG.md files for deprecated references | 1h | ✅ Skipped (historical) |

### Part B: `@objectql/plugin-workflow` (3 weeks)

> **Decision: In-Monorepo Plugin (not a separate project)** — Deep dependency on `@objectql/types` (StateMachineConfig), `CompiledHookManager` internal API, and `plugin-validator`'s state machine validation.
>
> **Decision: Does NOT affect SQL generation** — Operates at the Hook/Validation layer (`beforeUpdate`), above the query compilation pipeline.

```
┌──────────────────────────────┐
│  plugin-workflow             │  ← beforeUpdate hook: evaluate guards, execute actions
│  (State Machine Executor)    │
├──────────────────────────────┤
│  plugin-validator            │  ← field/cross-field/uniqueness validation
├──────────────────────────────┤
│  QueryService → QueryAST    │  ← Core: abstract query building
├──────────────────────────────┤
│  Driver → Knex → SQL         │  ← Driver: SQL generation (UNTOUCHED)
└──────────────────────────────┘
```

**What exists today:**
- `@objectstack/spec` defines full XState-level `StateMachineSchema` (compound/parallel/final states, guards, entry/exit actions)
- `@objectql/types` derives `StateMachineConfig`, mounted on `ObjectConfig.stateMachine` and `ObjectConfig.stateMachines`
- `plugin-validator` has simplified `validateStateMachine()` — only checks `allowed_next` transitions

**What's missing:** A runtime engine to interpret and execute the full `StateMachineConfig` (guards, actions, compound states).

**Scope:**

| Task | Description | Est. |
|------|-------------|------|
| **W-1** | Package scaffolding | 1h |
| **W-2** | `StateMachineEngine` — interpret `StateMachineConfig`, evaluate state transitions | 8h |
| **W-3** | `GuardEvaluator` — evaluate `cond` guards against record data + context | 4h |
| **W-4** | `ActionExecutor` — execute entry/exit/transition actions | 4h |
| **W-5** | `WorkflowPlugin` implements `RuntimePlugin` — registers `beforeUpdate` hooks | 4h |
| **W-6** | Integration with `plugin-validator` — replace simplified `validateStateMachine()` | 4h |
| **W-7** | Workflow instance persistence — audit trail | 4h |
| **W-8** | Unit tests | 8h |
| **W-9** | Integration tests (end-to-end with Memory driver) | 4h |
| **W-10** | Documentation (`content/docs/logic/workflow.mdx`) | 4h |

**Config Interface:**
```typescript
export interface WorkflowPluginConfig {
  enableAuditTrail?: boolean;
  guardResolver?: (guardRef: string, context: any) => Promise<boolean>;
  actionExecutor?: (actionRef: string, context: any) => Promise<void>;
}
```

**Success Criteria:**
- [x] Simple state transitions work (draft → active → done)
- [x] Guard conditions block invalid transitions with `ObjectQLError({ code: 'TRANSITION_DENIED' })`
- [x] Entry/exit actions execute in correct order
- [x] Compound (nested) states resolve correctly
- [x] Zero changes to `@objectql/core` query pipeline or any driver

---

## Cross-Cutting: Code Quality Improvement Phases

> Scope: Code quality, type safety, error handling, testing, performance, and DX improvements  
> These phases run in parallel with quarterly feature work.

### Phase 1: Type Safety & Error Handling

> Priority: **P0 — Critical** | Est: 2 weeks | Impact: All packages

#### 1A. `throw new Error` → `ObjectQLError` Migration ✅ Completed

- [x] Zero `throw new Error(` in `packages/` (excluding test files)
- [x] All error codes documented in `@objectql/types`
- [x] Existing tests pass after migration

**Error Code Taxonomy:**
```typescript
type DriverErrorCode = 'DRIVER_ERROR' | 'DRIVER_CONNECTION_FAILED' | 'DRIVER_QUERY_FAILED'
  | 'DRIVER_TRANSACTION_FAILED' | 'DRIVER_UNSUPPORTED_OPERATION';
type ProtocolErrorCode = 'PROTOCOL_ERROR' | 'PROTOCOL_INVALID_REQUEST'
  | 'PROTOCOL_METHOD_NOT_FOUND' | 'PROTOCOL_BATCH_ERROR';
type PluginErrorCode = 'TENANT_ISOLATION_VIOLATION' | 'TENANT_NOT_FOUND'
  | 'WORKFLOW_TRANSITION_DENIED' | 'FORMULA_EVALUATION_ERROR';
```

#### 1B. `any` Type Reduction ⏳ In Progress

Current: ~753 `: any` instances, ~210 `as any` casts (total ~962).
Progress: `@objectql/core` reduced from 99 → 31 via `KernelBridge` interface. `@objectql/types` reduced to 1 (justified).
Target: < 50 (justified edge cases only).

| `any` Location | Count | Replacement Strategy | Status |
|----------------|-------|---------------------|--------|
| Type definitions (`@objectql/types`) | 1 | `unknown`, generics `<T>`, Zod inferred types | ✅ Clean (1 justified) |
| Core (`@objectql/core`) | 31 | `KernelBridge` interface, typed CRUD methods | ✅ 99 → 31 |
| Driver implementations | 237 | `Record<string, unknown>` | ⏳ Remaining |
| Protocol handlers | 286 | `unknown` + type guards | ⏳ Remaining |
| Plugin hooks | 259 | Generic `HookContext<T>` | ⏳ Remaining |
| Tools (CLI, TCK, VSCode) | 68 | Typed args, narrowing | ⏳ Remaining |
| Platform-node | 13 | Typed loader/file APIs | ⏳ Remaining |

**Top `any` offenders:**

| Package | `: any` + `as any` |
|---------|-------------------|
| `@objectql/protocol-json-rpc` | 102 |
| `@objectql/protocol-graphql` | 101 |
| `@objectql/protocol-odata-v4` | 83 |
| `@objectql/plugin-security` | 67 |
| `@objectql/plugin-multitenancy` | 64 |
| `@objectql/driver-sql` | 50 |
| `@objectql/driver-redis` | 46 |
| `@objectql/plugin-workflow` | 44 |
| `@objectql/driver-mongo` | 44 |
| `@objectql/driver-memory` | 38 |

### Phase 2: Test Coverage & Quality Gates

> Priority: **P0 — Critical** | Est: 2 weeks

| Package | Current Tests | Gap | Action | Status |
|---------|---------------|-----|--------|--------|
| **@objectql/create** | 1 file (32 tests) | ✅ | Scaffolding, templates, package.json transform | ✅ Done |
| **@objectql/cli** | 1 file (37 tests) | ✅ | Command registration, options, utilities | ✅ Done |
| **vscode-objectql** | 1 file (20 tests) | ✅ | Manifest, commands, providers | ✅ Done |
| **@objectql/sdk** | 1 file (65 tests) | ✅ | RemoteDriver, DataApiClient, MetadataApiClient | ✅ Done |
| **@objectql/driver-pg-wasm** | 1 file | Medium | Add OPFS, fallback, JSONB tests | ⏳ |
| **@objectql/driver-sqlite-wasm** | 1 file | Medium | Add OPFS, WAL, fallback tests | ⏳ |
| **@objectql/plugin-optimizations** | 2 files | ✅ | Connection pool, query compiler, hooks, registry, graph, validation, loader, SQL optimizer | ✅ Done |
| **@objectql/plugin-query** | 2 files | ✅ | FilterTranslator, QueryBuilder, QueryService, QueryAnalyzer, QueryPlugin | ✅ Done |

**CI Quality Gates:**

| Gate | Current | Target |
|------|---------|--------|
| Build | ✅ | ✅ |
| Unit tests | ✅ | ✅ + coverage threshold |
| Coverage threshold | None | ≥ 80% per package |
| ESLint | ✅ (many rules off) | ✅ (progressive strictness) |
| TCK conformance | Manual | CI-automated |

### Phase 3: Console Logging & Observability ✅ Completed (with caveats)

- [x] Audit all `console.*` calls
- [x] Remove debug-only `console.log` from drivers
- [x] Replace necessary logging with hook-based events
- [x] Keep `console.*` only in `@objectql/cli` and tools (CLI: 211 calls — expected for user-facing tool)
- [x] Add ESLint `no-console` with CLI override

**Remaining `console.*` in non-tool production source (6 total):**
- `@objectql/core` (3): Intentional deprecation `console.warn` in plugin.ts, app.ts, kernel-factory.ts — will be removed at v5.0
- `@objectql/sdk` (1): Retry logging `console.log` — should migrate to hook-based logging
- `@objectql/types/logger.ts` (2): Fallback `console.error` for uncaught errors — justified safety net

### Phase 4: ESLint Strictness Progression ✅ Completed (All Waves)

13 rules configured (11 active, 2 off). Active rules: `prefer-const`, `no-useless-catch`, `no-empty`, `no-unused-vars`, `no-case-declarations`, `no-useless-escape`, `no-require-imports`, `no-empty-object-type`, `no-unsafe-function-type`, `no-this-alias`, `no-console`. Disabled: `no-explicit-any` (off — re-enable as warn is a stretch goal), `no-undef` (off — TypeScript handles this).

### Phase 5: TODO Elimination & Protocol Compliance

#### 5A. TODO/FIXME/HACK Elimination ✅ Completed

- [x] All 9 TODO items resolved across CLI, OData

#### 5B. Protocol Compliance ✅ Completed

| Protocol | Previous | Current | Key Features Added |
|----------|---------|--------|----------|
| **GraphQL** | 85% | 95%+ | Subscriptions (WebSocket), Federation v2 (`@apollo/subgraph`), N+1 DataLoader |
| **OData V4** | 80% | 95%+ | `$expand` (nested, depth-limited), `$count` inline/standalone, `$batch` changesets |
| **JSON-RPC** | 90% | 95%+ | `object.count()`, `action.execute()`, batch requests (spec §6) |

### Phase 6: Documentation & DX

#### 6A. Housekeeping ⏳ → Q1 Phase 3

See [Q1 Phase 3 Part A](#part-a-housekeeping-1-week) above.

#### 6B. New Documentation Needs

| Document | Location | Purpose | Status |
|----------|----------|---------|--------|
| Error handling guide | `content/docs/guides/error-handling.mdx` | `ObjectQLError` pattern, error codes | ✅ Done |
| Plugin development guide | `content/docs/extending/plugin-development.mdx` | How to build a custom plugin | ✅ Done |
| Driver development guide | `content/docs/extending/driver-development.mdx` | How to implement a new driver | ✅ Done |
| Architecture overview | `content/docs/guides/architecture.mdx` | Updated architecture diagram | ✅ Done |
| Migration guide (v4 → v5) | `content/docs/guides/migration-v5.mdx` | Breaking changes, deprecated API removal | ✅ Done |

#### 6C. VSCode Extension Alignment

| Task | Description | Status |
|------|-------------|--------|
| Bump version to 4.2.0 | Align with monorepo | ✅ Done |
| Add basic test suite | Extension activation, schema validation, snippet tests | ✅ Done (1 test file) |
| Publish to VS Code Marketplace | If not already published | ⏳ Remaining |
| Bump version to 4.2.2 | Align with other workspace packages | ✅ Done |

### Phase 7: Performance & Bundle Optimization

#### 7A. Core Performance

Optimization modules extracted into `@objectql/plugin-optimizations` ([PR #373](https://github.com/objectstack-ai/objectql/pull/373)):

| Module | Status | Action |
|--------|--------|--------|
| `GlobalConnectionPool.ts` | ✅ | Benchmark and tune pool sizes |
| `QueryCompiler.ts` | ✅ | Add cache hit/miss metrics |
| `LazyMetadataLoader.ts` | ✅ | Verify lazy loading in production |
| `OptimizedValidationEngine.ts` | ✅ | Benchmark vs. base validator |
| `CompiledHookManager.ts` | ✅ | Profile hook chain overhead |
| `SQLQueryOptimizer.ts` | ✅ | Add query plan analysis |
| `DependencyGraph.ts` | ✅ | Ensure circular dependency detection |

#### 7B. Browser Bundle Optimization ⏳ Remaining

| Task | Description | Est. |
|------|-------------|------|
| **BO-1** | Tree-shaking audit | 4h |
| **BO-2** | Measure `@objectql/core` bundle size (target: < 50KB gzip) | 2h |
| **BO-3** | WASM lazy loading | 4h |
| **BO-4** | Add `sideEffects: false` to all package.json files | ✅ Done (27 packages) |

#### 7C. Driver Performance Benchmarks ⏳ Remaining

| Benchmark | Metric | Target |
|-----------|--------|--------|
| Memory driver — 10K inserts | ops/sec | Baseline |
| SQL driver (SQLite) — 10K inserts | ops/sec | Baseline |
| Redis driver — 10K inserts | ops/sec | Baseline |
| Memory driver — complex aggregation (1M records) | latency p99 | Baseline |
| SQL driver — JOIN query (100K records) | latency p99 | Baseline |

---

## Completed: Q2 — Protocol Maturity & Multi-Tenancy

> Status: **✅ Completed** | Duration: 2026-02 — 2026-04

### Part A: Protocol Layer Enhancement (6 weeks)

Target: **95%+ compliance** across all three protocols.

| Protocol | Feature | Priority | Status |
|----------|---------|----------|--------|
| **GraphQL** | Subscriptions (WebSocket) | P0 | ✅ |
| **GraphQL** | Federation v2 support | P1 | ✅ |
| **GraphQL** | N+1 DataLoader integration | P0 | ✅ |
| **OData V4** | `$expand` (nested entity loading) | P0 | ✅ |
| **OData V4** | `$count` inline/standalone | P0 | ✅ |
| **OData V4** | `$batch` multi-operation requests | P1 | ✅ |
| **JSON-RPC** | `object.count()` method | P0 | ✅ |
| **JSON-RPC** | `action.execute()` method | P0 | ✅ |
| **JSON-RPC** | Batch request support (spec §6) | P1 | ✅ |

**Success Criteria:**
- [x] Protocol TCK compliance ≥ 95% for all three protocols
- [x] GraphQL Subscriptions work for create/update/delete events
- [x] OData `$expand` supports 2-level deep nesting
- [x] All protocol docs updated in `content/docs/`

### Part B: `@objectql/plugin-multitenancy` ✅ Completed

> **Decision: Plugin, not Core modification** — Core remains zero-assumption. Tenant isolation is injected via hook-based filter rewriting.

| Task | Description | Status |
|------|-------------|--------|
| **MT-1** | Package scaffolding | ✅ |
| **MT-2** | `MultiTenancyPlugin` — auto-inject `tenant_id` filter on all queries | ✅ |
| **MT-3** | `beforeCreate` hook — auto-set `tenant_id` from context | ✅ |
| **MT-4** | Tenant-scoped schema isolation (optional) | ✅ |
| **MT-5** | Integration with `plugin-security` — tenant-aware RBAC | ✅ |
| **MT-6** | Cross-tenant query prevention (strict mode) | ✅ |
| **MT-7** | Unit + integration tests | ✅ |
| **MT-8** | Documentation (`content/docs/extending/multitenancy.mdx`) | ✅ |

**Architecture:**
```typescript
export class MultiTenancyPlugin implements RuntimePlugin {
    name = '@objectql/plugin-multitenancy';
    async install(ctx: RuntimeContext) {
        // beforeFind: inject { tenant_id: ctx.user.tenantId } into all queries
        // beforeCreate: auto-set tenant_id on new records
        // beforeUpdate/Delete: verify tenant_id matches
    }
}
```

---

## Completed: Q3 — Edge Runtime & Offline Sync

> Status: **✅ Completed** | Duration: 2026-02 — 2026-04  
> Prerequisite: Q1 Phase 2 (WASM Drivers), Q2 (Protocol Maturity)

ObjectQL Core is **universal** — zero Node.js native modules. Combined with browser WASM drivers (Q1) and protocol maturity (Q2), Q3 completes the platform story.

### Part A: Edge Runtime Support

> Duration: **4 weeks** | Priority: P0

ObjectQL's edge strategy leverages the universal core and adapts driver bindings per platform:

```
┌────────────────────────────────────────────────────────┐
│  Edge Request (HTTP)                                    │
├────────────────────────────────────────────────────────┤
│  Edge Adapter (per-platform)                            │
│  ┌──────────────────────────────────────────────────┐  │
│  │  ObjectQL Core (Universal)                        │  │
│  │  ├── QueryBuilder → QueryAST                      │  │
│  │  ├── HookManager (Security, Validation)           │  │
│  │  └── Repository → Driver                          │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Driver (platform-bound)                          │  │
│  │  • Cloudflare: D1 (SQLite) or Memory              │  │
│  │  • Deno: Deno Postgres or Memory                  │  │
│  │  • Vercel: SDK (remote) or Memory                 │  │
│  │  • Bun: All Node.js drivers (native compat)       │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

#### Edge Runtime Matrix

| Runtime | Driver Options | Constraints |
|---------|---------------|-------------|
| **Cloudflare Workers** | `driver-sqlite-wasm` (D1), `driver-memory` | 30s CPU, 128MB RAM |
| **Deno Deploy** | `driver-sql` (Deno Postgres), `driver-memory` | 50s wall-clock |
| **Vercel Edge** | `driver-sdk` (remote), `driver-memory` | 25s, 4MB body |
| **Bun** | All Node.js drivers | No significant limits |

#### E-1: Cloudflare Workers Adapter (P0 — 2 weeks)

| Task | Description | Est. |
|------|-------------|------|
| **E-1.1** | Package scaffolding | 2h |
| **E-1.2** | `CloudflareAdapter` — request-scoped ObjectQL initialization | 4h |
| **E-1.3** | D1 driver binding — SQLite-compatible Knex client | 8h |
| **E-1.4** | KV cache integration — optional query result caching | 4h |
| **E-1.5** | Hono integration — `createObjectQLHandler(env)` factory | 4h |
| **E-1.6** | Environment detection utility | 1h |
| **E-1.7** | Unit tests | 8h |
| **E-1.8** | Integration test with Miniflare | 8h |
| **E-1.9** | Example Worker | 4h |

#### E-2: Deno Deploy Validation (P1 — 1 week)

| Task | Description | Est. |
|------|-------------|------|
| **E-2.1** | Package scaffolding (Deno-compatible) | 2h |
| **E-2.2** | `DenoAdapter` — Deno.serve integration | 4h |
| **E-2.3** | Deno Postgres driver validation | 4h |
| **E-2.4** | Deno KV exploration | 4h |
| **E-2.5** | Unit tests + Example | 8h |

#### E-3: Vercel Edge Validation (P1 — 3 days)

| Task | Description | Est. |
|------|-------------|------|
| **E-3.1** | `VercelEdgeAdapter` — Next.js Edge Route handler factory | 4h |
| **E-3.2** | Validate `driver-sdk` and `driver-memory` in Edge Runtime | 4h |
| **E-3.3** | Example Next.js app | 4h |

#### E-4: Bun Compatibility (P2 — 3 days)

No new package needed — compatibility validated in existing drivers.

| Task | Description | Est. |
|------|-------------|------|
| **E-4.1** | Run full driver TCK suite under Bun runtime | 4h |
| **E-4.2** | Fix Bun-specific incompatibilities | 8h |
| **E-4.3** | Validate `bun:sqlite` as alternative to `better-sqlite3` | 4h |

#### E-5: Edge Documentation

| Task | Description |
|------|-------------|
| **E-5.1** | `content/docs/server/edge.mdx` — Overview and comparison |
| **E-5.2** | Per-runtime guides: Cloudflare, Deno, Vercel Edge, Bun |

**Success Criteria:**
- [x] Edge adapter with runtime detection and capability validation
- [x] Default driver resolution per platform
- [x] Zero changes to `@objectql/core`

### Part B: Offline-First Sync Protocol

> Duration: **6 weeks** | Priority: P0

With Browser WASM drivers (Q1) + Server Runtime (existing), build a **Client ↔ Server bidirectional sync protocol**.

```
┌─────────────────────────────────────────────────────────────────┐
│  CLIENT (Browser)                                                │
│  ┌─────────────────────┐    ┌──────────────────────────────┐   │
│  │  ObjectQL Core       │    │  Mutation Log                 │   │
│  │  + WASM Driver       │───▶│  (append-only, per-object)   │   │
│  │  (SQLite/PG)         │    │  Stored in OPFS/IndexedDB    │   │
│  └─────────────────────┘    └──────────┬───────────────────┘   │
│                                         │                       │
│                                         ▼                       │
│                              ┌──────────────────────┐          │
│                              │  Sync Engine          │          │
│                              │  • Batch mutations    │          │
│                              │  • Push on reconnect  │          │
│                              │  • Apply server delta │          │
│                              └──────────┬───────────┘          │
└──────────────────────────────────────────┼──────────────────────┘
                                           │  HTTP POST /api/sync
                                           ▼
┌──────────────────────────────────────────────────────────────────┐
│  SERVER                                                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Sync Endpoint                                            │   │
│  │  1. Receive client mutations                              │   │
│  │  2. Validate & apply (via ObjectQL Core + Hooks)          │   │
│  │  3. Detect conflicts                                      │   │
│  │  4. Return: results + server delta since checkpoint       │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

**Protocol Flow:**
1. **Online**: Client reads/writes directly via `driver-sdk` or WASM driver
2. **Offline**: Client writes to local WASM driver + appends to mutation log
3. **Reconnect**: Sync engine pushes mutation log to server, receives server delta
4. **Conflict**: Server detects conflicting versions, applies configured strategy
5. **Resolution**: Client applies server delta, clears acknowledged mutations

**Sync is opt-in per object:**
```yaml
name: story
sync:
  enabled: true
  strategy: last-write-wins    # or 'crdt' or 'manual'
  conflict_fields: [status]    # fields requiring manual merge
```

#### SY-1: Sync Protocol Specification (1 week)

Define wire format, `MutationLogEntry` schema, `SyncConflict` schema, checkpoint format, `SyncConfig` YAML schema, RFC document.

#### SY-2: Client-Side Change Tracking (2 weeks)

**Package:** `@objectql/plugin-sync` (`packages/foundation/plugin-sync`)

| Task | Description | Est. |
|------|-------------|------|
| **SY-2.1** | `MutationLogger` — append-only log backed by driver storage | 8h |
| **SY-2.2** | `SyncPlugin` — hooks into `afterCreate`, `afterUpdate`, `afterDelete` | 4h |
| **SY-2.3** | `SyncEngine` — orchestrates push/pull cycle | 8h |
| **SY-2.4** | Online/offline detection | 4h |
| **SY-2.5** | Debounced batch sync | 4h |
| **SY-2.6** | Client-side merge — apply server delta to local WASM driver | 8h |
| **SY-2.7** | Mutation log compaction | 4h |
| **SY-2.8** | Unit tests | 8h |

#### SY-3: Server Sync Endpoint (2 weeks)

**Package:** `@objectql/protocol-sync` (`packages/protocols/sync`)

| Task | Description | Est. |
|------|-------------|------|
| **SY-3.1** | `SyncProtocolHandler` — HTTP POST handler for `/api/sync` | 8h |
| **SY-3.2** | Server-side change log | 8h |
| **SY-3.3** | Delta computation | 8h |
| **SY-3.4** | Mutation validation through ObjectQL Core | 4h |
| **SY-3.5** | Optimistic concurrency | 4h |
| **SY-3.6** | Checkpoint management | 4h |
| **SY-3.7** | Rate limiting and size validation | 4h |
| **SY-3.8** | Unit tests + Hono integration | 12h |

#### SY-4: Conflict Resolution Engine (1 week)

| Strategy | Behavior | Use Case |
|----------|----------|----------|
| `last-write-wins` | Timestamp-based, per-record | Simple apps, low conflict |
| `crdt` | LWW-Register per field | Collaborative editing |
| `manual` | Flagged to app via `onConflict` callback | Business-critical data |

#### SY-5: Integration Tests (1 week)

| Test | Description |
|------|-------------|
| Offline create → reconnect → sync → verify server | Basic flow |
| Concurrent edits → conflict → resolution | Conflict handling |
| Multi-client sync (3 clients, 1 server) | Multi-device |
| 1000 mutations batch sync | Performance |
| Network interruption during sync | Retry/resume |

#### SY-6: Documentation & Example PWA (1 week)

- Sync protocol guide, conflict resolution comparison
- Example PWA (Todo app with offline sync)

**Success Criteria:**
- [x] Mutation log records offline operations correctly
- [x] Sync engine pushes mutations and receives server delta on reconnect
- [x] All three conflict strategies work (LWW, CRDT, manual)
- [x] Security: All sync mutations pass through ObjectQL hooks
- [x] Performance: 1000-mutation batch sync < 5 seconds
- [ ] Example PWA works offline, syncs on reconnect

#### Q3 Timeline

| Week | Phase | Milestone |
|------|-------|-----------|
| W1-W2 | Edge | Cloudflare Workers adapter + D1 binding |
| W3 | Edge | Deno Deploy + Vercel Edge validation |
| W4 | Edge | Bun compatibility + Edge documentation |
| W5-W6 | Sync | Protocol spec + MutationLogger + SyncPlugin |
| W7-W8 | Sync | Server sync endpoint + change log |
| W9 | Sync | Conflict resolution engine |
| W10 | Sync | Integration tests + Documentation + Example PWA |

---

## Immediate Next Steps (Post v3.2.6 Upgrade)

> Status: **Active** | Target: 2026-02 — 2026-03

Priority tasks following the `@objectstack` v3.2.6 upgrade:

| # | Task | Priority | Status | Description |
|---|------|----------|--------|-------------|
| 1 | Fix `plugin-formula` integration tests | High | ✅ Fixed | Previously 6 pre-existing test failures — now all pass (66/66 test tasks, including plugin-formula). |
| 2 | Re-enable `AuthPlugin` | Medium | 🔴 Open | Disabled due to camelCase field names (`createdAt`, `updatedAt`, `emailVerified`) violating ObjectQL snake_case spec. Coordinate with `@objectstack/plugin-auth` upstream or add field name normalization layer. |
| 3 | Align `@objectql/types` with `@objectstack/spec` v3.2.6 Zod v4 schemas | High | ✅ Done | `z.infer<>` type derivation compiles correctly against Zod v4 schema exports in `@objectstack/spec@3.2.6`. Verified via 38/38 build tasks passing. |
| 4 | Core bridge class stabilization | Medium | ✅ Done | `app.ts` bridge class — all `registerObject`, `getObject`, `getConfigs`, `removePackage` overrides align with `@objectstack/objectql@3.2.6` API surface. Build verified. |
| 5 | Bump `@objectql/*` packages to **4.3.0** | Low | 🟡 Next | Release patch with `@objectstack` v3.2.6 compatibility via Changesets. |
| 6 | Reduce `any` usage in driver layer | Medium | 🟡 In Progress | `driver-memory` (40→8 ✅), `driver-fs` (14→2 ✅), `driver-excel` (12→2 ✅). Remaining: `driver-sql` (50), `driver-redis` (46), `driver-mongo` (44). |
| 7 | Structured logging framework | Low | 🔴 Open | Migrate `sdk` retry `console.log` and `types/logger.ts` fallback `console.error` to hook-based structured logging. |
| 8 | Add tests for `plugin-optimizations` and `plugin-query` | High | ✅ Done | Both packages now have comprehensive test suites — 202 tests across 4 test files. |
| 9 | Reduce `any` in protocol handlers | Medium | 🔴 Open | `protocol-json-rpc` (102), `protocol-graphql` (101), `protocol-odata-v4` (83) — highest `any` density in the monorepo. |

---

## `@objectql/core` Deprecation & Migration Plan

> Status: **Phases A–C Completed** | Constitutional Basis: `@objectstack/spec@3.2.6` Protocol Specification  
> Prerequisite: Core refactoring completed — [PR #373](https://github.com/objectstack-ai/objectql/pull/373) (~3,500 → 734 LOC thin bridge + plugin orchestrator)

**Goal:** Fully retire `@objectql/core` as a standalone package. The ObjectQL ecosystem transitions to a **pure plugin architecture** — no aggregator, no bridge, no intermediate layer. All capabilities are delivered as independent, composable `RuntimePlugin` instances registered directly with the `ObjectStackKernel`.

### Phase A: Decompose ObjectQLPlugin Aggregator ✅

> Status: **Completed**

The `plugin.ts` aggregator (323 LOC) currently bundles multiple concerns behind a single `ObjectQLPlugin` class. Consumers configure it via a monolithic options object:

```typescript
// ❌ Current — monolithic aggregator (plugin.ts, 323 LOC)
new ObjectQLPlugin({
  enableRepository,
  enableQueryService,
  enableValidator,
  enableFormulas,
  datasources,
});
```

**Migration target — explicit, transparent, no magic:**

```typescript
// ✅ Target — composable, independent plugins
import { ObjectQLPlugin } from '@objectstack/objectql';       // upstream data engine
import { QueryPlugin } from '@objectql/plugin-query';
import { ValidatorPlugin } from '@objectql/plugin-validator';
import { FormulaPlugin } from '@objectql/plugin-formula';

const kernel = new ObjectStackKernel([
  new ObjectQLPlugin({ datasources }),
  new QueryPlugin(),
  new ValidatorPlugin(),
  new FormulaPlugin(),
]);
```

| Task | Description | Status |
|------|-------------|--------|
| Extract repository registration | Move `enableRepository` logic into `@objectstack/objectql` plugin lifecycle | ✅ |
| Extract query service wiring | Already in `@objectql/plugin-query` — remove re-export from aggregator | ✅ |
| Extract validator wiring | Already in `@objectql/plugin-validator` — remove re-export from aggregator | ✅ |
| Extract formula wiring | Already in `@objectql/plugin-formula` — remove re-export from aggregator | ✅ |
| Deprecate `ObjectQLPlugin` aggregator class | Mark as deprecated with `console.warn`, point to explicit imports | ✅ |

### Phase B: Dispose Bridge Class ✅

> Status: **Completed**

The `app.ts` bridge class (168 LOC) serves as a `MetadataRegistry` intermediary between `ObjectLoader` (platform-node) and the upstream `SchemaRegistry`. This intermediate layer is no longer necessary.

| Task | Description | Status |
|------|-------------|--------|
| Move `MetadataRegistry` bridge logic into `@objectql/platform-node` | `ObjectLoader` registers objects directly into the upstream `SchemaRegistry` | ✅ |
| Deprecate `ObjectQL` bridge class | Consumers use `@objectstack/objectql` directly — `console.warn` emitted on construction | ✅ |
| Update `platform-node` `ObjectLoader` | Direct registration to upstream schema registry, eliminating the bridge | ✅ |

### Phase C: Dispose Remaining Modules ✅

> Status: **Completed**

| Module | Action | Rationale | Status |
|--------|--------|-----------|--------|
| `kernel-factory.ts` | **Deprecated** with `console.warn` | Users call `new ObjectStackKernel([...plugins])` directly — factory adds no value | ✅ |
| `repository.ts` | **Deprecated** re-export | Direct import: `import { ObjectRepository } from '@objectstack/objectql'` | ✅ |
| `util.ts` | **Moved to `@objectql/types`** | Pure utility functions belong with the type-only package (zero runtime deps) | ✅ |
| `index.ts` | **Reduced to deprecation re-exports** | All exports carry `@deprecated` JSDoc tags, migration notices in comments | ✅ |

### Phase D: v5.0 Breaking Release (Q4 2026)

> Target: Q4 2026

| Task | Description |
|------|-------------|
| Delete all `@objectql/core` source code | Remove `packages/foundation/core/src/*` entirely |
| Publish `@objectql/core@5.0.0` as empty meta-package | Only `peerDependencies` pointing to individual plugins |
| Runtime migration warning | `console.warn('@objectql/core is deprecated — see migration guide')` |
| Update all documentation, examples, and tests | Remove all `@objectql/core` imports from guides, examples, and test fixtures |
| Update `@objectstack/spec` | Align protocol specification with pure-plugin architecture |

### Target Architecture — Pure Plugin Marketplace

After Phase D, the ObjectQL ecosystem exists as a flat, composable plugin marketplace with **no intermediate aggregation layer**:

```
@objectql/types                  # 宪法 — The Constitution (immutable)
@objectql/plugin-query           # Query enhancement (QueryService, QueryBuilder)
@objectql/plugin-validator       # Declarative validation (5-type engine)
@objectql/plugin-formula         # Computed fields (sandboxed expressions)
@objectql/plugin-security        # RBAC / FLS / RLS
@objectql/plugin-optimizations   # Connection pooling, query compilation
@objectql/plugin-workflow        # State machine executor
@objectql/plugin-multitenancy    # Tenant isolation
@objectql/plugin-sync            # Offline-first sync engine
@objectql/protocol-graphql       # GraphQL protocol adapter
@objectql/protocol-odata-v4      # OData V4 protocol adapter
@objectql/protocol-json-rpc      # JSON-RPC protocol adapter
@objectql/protocol-sync          # Sync protocol handler
@objectql/platform-node          # Node.js platform binding
@objectql/edge-adapter           # Edge runtime binding
@objectql/driver-*               # Database drivers (sql, mongo, memory, fs, etc.)
```

**Kernel bootstrapping (target form):**

```typescript
import { ObjectStackKernel } from '@objectstack/runtime';
import { ObjectQLPlugin } from '@objectstack/objectql';
import { QueryPlugin } from '@objectql/plugin-query';
import { ValidatorPlugin } from '@objectql/plugin-validator';
import { FormulaPlugin } from '@objectql/plugin-formula';
import { SecurityPlugin } from '@objectql/plugin-security';
import { SqlDriver } from '@objectql/driver-sql';
import { HonoServerPlugin } from '@objectstack/plugin-hono-server';

const kernel = new ObjectStackKernel([
  new ObjectQLPlugin({ datasources: { default: new SqlDriver({ url }) } }),
  new QueryPlugin(),
  new ValidatorPlugin(),
  new FormulaPlugin(),
  new SecurityPlugin(),
  new HonoServerPlugin({ port: 3004 }),
]);

await kernel.start();
```

---

## Q4 — Plugin Marketplace & Stabilization

> Status: **Planned** | Target: 2026-10 — 2026-12

### Part A: Plugin Marketplace (4 weeks)

Standardize third-party plugin distribution.

| Task | Description |
|------|-------------|
| Plugin manifest schema (`objectql-plugin.yml`) | Name, version, capabilities, peer dependencies |
| Plugin registry API | npm-compatible registry or npm scope alone |
| `objectql plugin install <name>` CLI command | Install + wire into `objectstack.config.ts` |
| Plugin guidelines documentation | Security review requirements, API compatibility contracts |

### Part B: v5.0 Stabilization (8 weeks)

| Task | Description |
|------|-------------|
| Public API audit | Lock down all `@objectql/*` public interfaces for semver stability |
| Remove all deprecated APIs | Clean up v3 → v4 migration leftovers |
| **`@objectql/core` Phase D** | Publish `@objectql/core@5.0.0` empty meta-package — see [`@objectql/core` Deprecation & Migration Plan](#objectqlcore-deprecation--migration-plan) |
| Performance benchmark suite | Automated CI benchmarks |
| Protocol compliance to 100% | Final push for all three protocols |
| v5.0 release | Major version with stable public API guarantee |

---

## Package Matrix

> 30 workspace packages at **4.2.2**. Exception: root package.json at 4.2.0.

### Foundation Layer

| Package | NPM Name | Environment | Description |
|---------|----------|-------------|-------------|
| `packages/foundation/types` | `@objectql/types` | Universal | **The Constitution.** Protocol-derived TypeScript types. Zero runtime deps. |
| `packages/foundation/core` | `@objectql/core` | Universal | ⚠️ **Deprecated (Phases A–C complete).** All modules carry `@deprecated` + `console.warn`. Utility functions moved to `@objectql/types`. Phase D (empty meta-package) at v5.0 — see [Migration Plan](#objectqlcore-deprecation--migration-plan). |
| `packages/foundation/plugin-query` | `@objectql/plugin-query` | Universal | QueryService, QueryBuilder, QueryAnalyzer, FilterTranslator. |
| `packages/foundation/plugin-optimizations` | `@objectql/plugin-optimizations` | Universal | Connection pooling, query compilation, compiled hooks, lazy metadata. |
| `packages/foundation/platform-node` | `@objectql/platform-node` | Node.js | File system integration, YAML loading, glob-based plugin discovery. |
| `packages/foundation/plugin-security` | `@objectql/plugin-security` | Universal | RBAC, FLS, RLS with AST-level enforcement. |
| `packages/foundation/plugin-validator` | `@objectql/plugin-validator` | Universal | 5-type validation engine. |
| `packages/foundation/plugin-formula` | `@objectql/plugin-formula` | Universal | Computed fields with sandboxed JS expressions. |
| `packages/foundation/plugin-workflow` | `@objectql/plugin-workflow` | Universal | State machine executor with guards, actions, compound states. |
| `packages/foundation/plugin-multitenancy` | `@objectql/plugin-multitenancy` | Universal | Tenant isolation via hook-based filter rewriting. |
| `packages/foundation/plugin-sync` | `@objectql/plugin-sync` | Universal | Offline-first sync engine with mutation logging and conflict resolution. |
| `packages/foundation/edge-adapter` | `@objectql/edge-adapter` | Universal | Edge runtime detection and capability validation. |

### Driver Layer

| Package | NPM Name | Environment | Persistence | Status |
|---------|----------|-------------|-------------|--------|
| `packages/drivers/sql` | `@objectql/driver-sql` | Node.js | PostgreSQL, MySQL, SQLite | ✅ Stable |
| `packages/drivers/mongo` | `@objectql/driver-mongo` | Node.js | MongoDB | ✅ Stable |
| `packages/drivers/memory` | `@objectql/driver-memory` | Universal | Ephemeral | ✅ Stable |
| `packages/drivers/fs` | `@objectql/driver-fs` | Node.js | JSON files | ✅ Stable |
| `packages/drivers/excel` | `@objectql/driver-excel` | Node.js | .xlsx files | ✅ Stable |
| `packages/drivers/redis` | `@objectql/driver-redis` | Node.js | Redis | ✅ Stable |
| `packages/drivers/sdk` | `@objectql/sdk` | Universal | Remote HTTP | ✅ Stable |
| `packages/drivers/sqlite-wasm` | `@objectql/driver-sqlite-wasm` | Browser | OPFS | 🆕 Q1 P2 |
| `packages/drivers/pg-wasm` | `@objectql/driver-pg-wasm` | Browser | IDB/OPFS | 🆕 Q1 P2 |

### Protocol Layer

| Package | NPM Name | Compliance | Status |
|---------|----------|-----------|--------|
| `packages/protocols/graphql` | `@objectql/protocol-graphql` | 95%+ | ✅ Excellent |
| `packages/protocols/odata-v4` | `@objectql/protocol-odata-v4` | 95%+ | ✅ Excellent |
| `packages/protocols/json-rpc` | `@objectql/protocol-json-rpc` | 95%+ | ✅ Excellent |
| `packages/protocols/sync` | `@objectql/protocol-sync` | — | 🆕 Q3 |

### CLI Plugin (oclif)

| Package | NPM Name | Description |
|---------|----------|-------------|
| `packages/cli` | `@objectstack/plugin-objectql` | oclif plugin for ObjectStack CLI — inspect, validate, migrate, seed, query, driver list |

### Tools Layer

| Package | NPM Name | Description |
|---------|----------|-------------|
| `packages/tools/cli` | `@objectql/cli` | Metadata scaffolding, type generation, dev workflow |
| `packages/tools/create` | `@objectql/create` | `npm create @objectql@latest` project generator |
| `packages/tools/driver-tck` | `@objectql/driver-tck` | Driver technology compatibility kit |
| `packages/tools/protocol-tck` | `@objectql/protocol-tck` | Protocol technology compatibility kit |
| `packages/tools/vscode-objectql` | `vscode-objectql` (4.2.2) | VS Code extension: IntelliSense, validation, snippets |

### External Dependencies (Not in this repo)

| Package | Owner | Version | Role in ObjectQL |
|---------|-------|---------|-----------------|
| `@objectstack/cli` | ObjectStack | 3.2.6 | Kernel bootstrapper (`objectstack serve`) |
| `@objectstack/core` | ObjectStack | 3.2.6 | Kernel runtime, plugin lifecycle |
| `@objectstack/plugin-hono-server` | ObjectStack | 3.2.6 | HTTP server (Hono-based) |
| `@objectstack/spec` | ObjectStack | 3.2.6 | Formal protocol specifications (Zod schemas) |
| `@objectstack/runtime` | ObjectStack | 3.2.6 | Core runtime & query engine |
| `@objectstack/objectql` | ObjectStack | 3.2.6 | ObjectQL runtime bridge |
| `@objectstack/studio` | ObjectStack | 3.2.6 | Visual admin studio |
| AI Agent / AI tooling | **Separate project** | — | Not in this monorepo |

---

## Removed Packages

| Package | Reason | Date |
|---------|--------|------|
| `@objectql/driver-localstorage` | localStorage 5MB limit, sync API blocks UI, no query indexing. Replaced by `driver-sqlite-wasm`. | 2026-02-08 |
| `@objectql/driver-utils` | Zero consumers, all functionality duplicated in core. | 2026-02-07 |
| `@objectql/server` | Responsibilities fully absorbed by `@objectstack/plugin-hono-server` + protocol plugins. CLI uses `@objectstack/cli` directly. | 2026-02-08 |

---

## Codebase Audit Findings

> Last audited: **2026-02-16** | Method: Full automated scan of all `packages/*/src/` and `packages/*/*/src/` TypeScript files

### Package Health Matrix

| Package | `any` Count | Error Pattern | Test Files | Console Calls | TODOs |
|---------|-------------|---------------|------------|---------------|-------|
| **@objectql/types** | 1 ✅ | N/A (types only) | 3 | 2 (logger fallback) | 0 |
| **@objectql/core** | 31 ⚠️ | `ObjectQLError` ✅ | 4 | 3 (deprecation warns) | 0 |
| **@objectql/plugin-security** | 67 🔴 | `ObjectQLError` ✅ | 8 | 0 | 0 |
| **@objectql/plugin-multitenancy** | 64 🔴 | `ObjectQLError` ✅ | 7 | 0 | 0 |
| **@objectql/plugin-workflow** | 44 🔴 | `ObjectQLError` ✅ | 5 | 0 | 0 |
| **@objectql/plugin-optimizations** | 36 🔴 | `ObjectQLError` ✅ | **2** ✅ | 0 | 0 |
| **@objectql/plugin-formula** | 18 | `ObjectQLError` ✅ | 4 | 0 | 0 |
| **@objectql/plugin-validator** | 16 | `ObjectQLError` ✅ | 3 | 0 | 0 |
| **@objectql/plugin-query** | 14 | `ObjectQLError` ✅ | **2** ✅ | 0 | 0 |
| **@objectql/platform-node** | 13 | `ObjectQLError` ✅ | 3 | 0 | 0 |
| **@objectql/plugin-sync** | 0 ✅ | `ObjectQLError` ✅ | 1 | 0 | 0 |
| **@objectql/edge-adapter** | 0 ✅ | `ObjectQLError` ✅ | 1 | 0 | 0 |
| **@objectql/protocol-json-rpc** | 102 🔴 | `ObjectQLError` ✅ | 5 | 0 | 0 |
| **@objectql/protocol-graphql** | 101 🔴 | `ObjectQLError` ✅ | 4 | 0 | 0 |
| **@objectql/protocol-odata-v4** | 83 🔴 | `ObjectQLError` ✅ | 4 | 0 | 0 |
| **@objectql/protocol-sync** | 0 ✅ | `ObjectQLError` ✅ | 1 | 0 | 0 |
| **@objectql/driver-sql** | 50 🔴 | `ObjectQLError` ✅ | 6 | 0 | 0 |
| **@objectql/driver-redis** | 46 🔴 | `ObjectQLError` ✅ | 2 | 0 | 0 |
| **@objectql/driver-mongo** | 44 🔴 | `ObjectQLError` ✅ | 4 | 0 | 0 |
| **@objectql/driver-memory** | 8 ✅ | `ObjectQLError` ✅ | 2 | 0 | 0 |
| **@objectql/driver-sqlite-wasm** | 34 | `ObjectQLError` ✅ | 2 | 0 | 0 |
| **@objectql/driver-pg-wasm** | 33 | `ObjectQLError` ✅ | 2 | 0 | 0 |
| **@objectql/sdk** | 33 | `ObjectQLError` ✅ | 2 | 1 (retry log) | 0 |
| **@objectql/driver-fs** | 2 ✅ | `ObjectQLError` ✅ | 2 | 0 | 0 |
| **@objectql/driver-excel** | 2 ✅ | `ObjectQLError` ✅ | 2 | 0 | 0 |
| **@objectql/cli** | 38 | `ObjectQLError` ✅ | 2 | 211 (expected — CLI) | 0 |
| **@objectql/create** | 0 ✅ | `ObjectQLError` ✅ | 2 | 4 (user output) | 0 |
| **@objectql/driver-tck** | 7 | N/A (test harness) | 0 | 1 | 0 |
| **@objectql/protocol-tck** | 7 | N/A (test harness) | 1 | 3 | 0 |
| **vscode-objectql** | 16 | `ObjectQLError` ✅ | 1 | 1 | 0 |

**Totals: ~905 `any` annotations (↓57 from driver-memory/fs/excel refactoring), 0 `throw new Error`, 0 TODO/FIXME/HACK**

### `any` Distribution by Layer

| Layer | Package Count | Total `any` | % of Total |
|-------|---------------|-------------|------------|
| Protocols | 4 | 286 (29.7%) | 🔴 Highest density |
| Foundation (plugins) | 8 | 260 (27.0%) | 🔴 |
| Drivers | 9 | 304 (31.6%) | 🔴 |
| Tools | 5 | 68 (7.1%) | ⏳ Acceptable |
| Foundation (core/types/platform) | 4 | 45 (4.7%) | ✅ Cleanest |

### `as any` Cast Distribution

| Package | `as any` Count |
|---------|---------------|
| `foundation/core` | 22 |
| `drivers/sql` | 14 |
| `drivers/sqlite-wasm` | 12 |
| `protocols/json-rpc` | 18 |
| `protocols/graphql` | 16 |
| `protocols/odata-v4` | 12 |
| `foundation/plugin-security` | 11 |
| Others | < 10 each |

### Dependency Graph Observations

- **`@objectql/types`** correctly has ZERO production dependencies (pure types — imports `@objectstack/spec` as devDep only)
- **`@objectql/core`** depends on `plugin-formula` and `plugin-validator` — tight coupling noted (will be removed at v5.0)
- All `@objectstack/*` packages are at **v3.2.6** — aligned (Zod v4)
- **`mingo`** (used in memory driver) is the only non-standard query engine dependency
- **`knex`** is shared across `driver-sql`, `driver-pg-wasm`, `driver-sqlite-wasm`

### @objectstack/spec Coverage Gap Analysis

`@objectstack/spec@3.2.6` exports ~3,100+ schemas across 16 sub-modules. ObjectQL currently implements 13 of these domains:

| Spec Domain | Exports | @objectql Status | Notes |
|-------------|---------|-----------------|-------|
| **Data** (objects, fields, queries, drivers) | ~240 | ✅ Implemented | Core data layer — well-aligned |
| **API** (REST, GraphQL, OData, WebSocket) | ~708 | ✅ Implemented | 3 protocol adapters + sync |
| **Security** (RBAC, FLS, RLS) | ~41 | ✅ Implemented | plugin-security |
| **Automation** (workflows, state machines) | ~106 | ✅ Implemented | plugin-workflow + plugin-validator |
| **Shared** (field types, naming, http) | ~59 | ✅ Implemented | Used throughout types |
| **System** (multi-tenancy, sync, CRDT) | ~488 | 🟡 Partial | Multi-tenancy ✅, sync ✅, but cache/backup/storage/i18n/notifications/feature-flags NOT implemented |
| **Kernel** (plugins, events, lifecycle) | ~409 | 🟡 Partial | Plugin lifecycle handled by @objectstack/core externally |
| **Contracts** (service interfaces) | ~78 | ✅ Implemented | All 20+ IService contracts re-exported from `@objectql/types` via `contracts.ts` |
| **Integration** (connectors, webhooks) | ~153 | 🔴 Not implemented | SaaS connectors, message queues, deployment — future scope |
| **AI** (agents, MCP, RAG, NLQ) | ~359 | 🔴 Not implemented | Separate project per ADR-003 |
| **Identity** (users, sessions, SCIM) | ~64 | 🔴 Not implemented | Handled by @objectstack/plugin-auth upstream |
| **UI** (views, dashboards, reports) | ~249 | 🔴 Not implemented | Handled by @objectstack/studio upstream |
| **Cloud** (marketplace, publishers) | ~90 | 🔴 Not implemented | Q4 scope — Plugin Marketplace |
| **Studio** (designer, ER diagrams) | ~55 | 🔴 Not implemented | Handled by @objectstack/studio upstream |
| **QA** (test suites, assertions) | ~13 | 🟡 Partial | TCK packages exist but not formally aligned with spec QA schemas |

---

## Architecture Decisions Record

### ADR-001: No `@objectql/server` package

**Context:** `@objectql/server` existed from v1.7 through v4.0 as an Express-based HTTP adapter. With the migration to the ObjectStack Kernel pattern, its responsibilities were decomposed:

- HTTP serving → `@objectstack/plugin-hono-server`
- REST routes → `@objectql/protocol-json-rpc`
- GraphQL routes → `@objectql/protocol-graphql`
- OData routes → `@objectql/protocol-odata-v4`
- Startup → `@objectstack/cli`

**Decision:** Do not create or maintain `@objectql/server`. **Status:** Accepted.

### ADR-002: Workflow Engine as in-monorepo plugin

**Context:** `@objectstack/spec` defines full XState-level `StateMachineSchema`. `@objectql/types` derives `StateMachineConfig`. Only `plugin-validator` does simplified `allowed_next` checks.

**Decision:** Implement as `packages/foundation/plugin-workflow` — a `RuntimePlugin` with `beforeUpdate` hooks.

**Rationale:** Deep internal type dependencies, synchronized versioning, no SQL impact. **Status:** Accepted.

### ADR-003: AI Agent is a separate project

**Decision:** AI Agent in a separate repository. This monorepo provides the protocol foundation. **Status:** Accepted.

### ADR-004: Multi-tenancy as plugin, not core

**Decision:** `@objectql/plugin-multitenancy`. Core remains zero-assumption. **Status:** Accepted.

### ADR-005: Edge adapters as separate packages

**Context:** ObjectQL Core is already universal. Edge runtime support requires platform-specific binding code.

**Decision:** Each edge runtime gets its own adapter package under `packages/adapters/`. No changes to core.

**Rationale:** Keeps core universal, users install only their target adapter. **Status:** Accepted.

### ADR-006: Sync protocol as opt-in per object

**Decision:** Sync configured per-object via `sync` key in `*.object.yml`. Objects without `sync.enabled: true` are not tracked.

**Rationale:** Minimizes performance impact, gives developers explicit control, aligns with metadata-driven philosophy. **Status:** Accepted.

### ADR-007: Checkpoint-based sync (not timestamp-based)

**Decision:** Server-assigned opaque checkpoint tokens. No clock synchronization required.

**Rationale:** No clock skew issues, server controls delta computation, tamper-resistant. **Status:** Accepted.

### ADR-008: Sync mutations go through full ObjectQL hook pipeline

**Decision:** All client mutations received via sync are replayed through Repository → Hook → Driver pipeline. RBAC, validation, workflow all apply.

**Rationale:** No security bypass, even for offline edits. **Status:** Accepted.

### ADR-009: CRDT strategy uses LWW-Register per field

**Decision:** LWW-Register (Last-Writer-Wins Register) at field level for CRDT sync strategy.

**Rationale:** Simple, no special data structures, well-suited for form-based apps. **Status:** Accepted.

### ADR-010: Full deprecation of `@objectql/core`

**Context:** Following the core refactoring ([PR #373](https://github.com/objectstack-ai/objectql/pull/373)), `@objectql/core` was reduced from ~3,500 LOC to 734 LOC — a thin bridge + plugin orchestrator. The remaining intermediate layer violates the ObjectStack microkernel + plugin architecture mandated by `@objectstack/spec`. The `ObjectQLPlugin` aggregator (323 LOC) bundles concerns that should be independently composable, and the `ObjectQL` bridge class (168 LOC) duplicates functionality now native to `@objectstack/objectql`.

**Decision:** Fully retire `@objectql/core` through a phased migration (Phases A–D). At v5.0, publish as an empty meta-package with `peerDependencies` pointing to individual plugins. All capabilities move to their natural homes: plugins to their respective `@objectql/plugin-*` packages, bridge logic to `@objectql/platform-node`, utility functions to `@objectql/types`.

**Rationale:** Eliminates the last monolithic aggregation layer. Consumers gain explicit, transparent dependency management — no hidden magic. Aligns fully with `@objectstack/spec` protocol-driven, plugin-composable philosophy. **Status:** Accepted. Phases A–C completed — all modules deprecated with `console.warn` and `@deprecated` JSDoc. Utility functions moved to `@objectql/types`. Phase D (v5.0 empty meta-package) scheduled for Q4 2026.

---

## @objectstack/spec Protocol Alignment Status

> Spec Version: **3.2.6** | Zod v4 | 16 sub-modules, ~3,100+ schema exports

ObjectQL implements the **data layer compiler** portion of the ObjectStack protocol. The following domains are within ObjectQL's scope:

### ✅ Fully Implemented (aligned with spec)

| Domain | Spec Module | ObjectQL Package(s) |
|--------|------------|-------------------|
| Object/Field/Query/Filter schemas | `@objectstack/spec/data` | `@objectql/types` (derived via `z.infer<>`) |
| Driver interface & capabilities | `@objectstack/spec/data` | 9 driver packages |
| RBAC / FLS / RLS | `@objectstack/spec/security` | `@objectql/plugin-security` |
| Validation (5 types) | `@objectstack/spec/data` | `@objectql/plugin-validator` |
| State machines / workflows | `@objectstack/spec/automation` | `@objectql/plugin-workflow` |
| Computed fields (formulas) | Custom | `@objectql/plugin-formula` |
| GraphQL (subscriptions, federation, dataloader) | `@objectstack/spec/api` | `@objectql/protocol-graphql` |
| OData V4 ($expand, $count, $batch) | `@objectstack/spec/api` | `@objectql/protocol-odata-v4` |
| JSON-RPC (count, execute, batch) | `@objectstack/spec/api` | `@objectql/protocol-json-rpc` |
| Multi-tenancy | `@objectstack/spec/system` | `@objectql/plugin-multitenancy` |
| Offline sync / CRDT | `@objectstack/spec/system` | `@objectql/plugin-sync` + `@objectql/protocol-sync` |
| Edge runtime detection | `@objectstack/spec/integration` | `@objectql/edge-adapter` |
| Query optimization | `@objectstack/spec/api` | `@objectql/plugin-query` + `@objectql/plugin-optimizations` |

### 🟡 Partially Implemented

| Domain | Gap Description |
|--------|----------------|
| System: Observability | Logger types exist in `@objectql/types`, but full OpenTelemetry tracing/metrics/audit not implemented |
| QA: Testing | TCK packages exist but not formally aligned with spec's `TestSuiteSchema` / `TestScenarioSchema` |

### 🔴 Out of Scope (handled externally or future)

| Domain | Reason |
|--------|--------|
| AI (agents, MCP, RAG, NLQ) | Separate project per ADR-003 |
| Identity (users, sessions, SCIM) | Handled by `@objectstack/plugin-auth` upstream |
| UI (views, dashboards, reports) | Handled by `@objectstack/studio` upstream |
| Cloud (marketplace) | Q4 2026 scope |
| Integration (SaaS connectors) | Future scope |
| System: Cache/Backup/Storage/i18n/Notifications | Future scope — spec defines schemas, implementation deferred |

---

> **Historical Reference:** The core refactoring design document is archived at `docs/DESIGN_CORE_REFACTOR.md` (Status: ✅ Completed — [PR #373](https://github.com/objectstack-ai/objectql/pull/373)).
