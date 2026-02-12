# ObjectQL — 2026 Roadmap

> Created: 2026-02-08 | Last Updated: 2026-02-12 | Status: **Active**  
> Current Version: **4.2.0** (all packages aligned)  
> Runtime: `@objectstack/cli` v3.0.0 (Kernel pattern) — `@objectql/server` removed, `packages/runtime/` removed.  
> @objectstack Platform: **v3.0.0**

---

## Table of Contents

- [Executive Summary](#executive-summary)
- [Timeline Overview](#timeline-overview)
- [Completed: Q1 Phase 1 — Foundation](#completed-q1-phase-1--foundation)
- [Active: Q1 Phase 2 — Browser WASM Drivers](#active-q1-phase-2--browser-wasm-drivers)
- [Next: Q1 Phase 3 — Housekeeping & Workflow](#next-q1-phase-3--housekeeping--workflow)
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
- [Q4 — Plugin Marketplace & Stabilization](#q4--plugin-marketplace--stabilization)
- [Package Matrix](#package-matrix)
- [Removed Packages](#removed-packages)
- [Codebase Audit Findings](#codebase-audit-findings)
- [Architecture Decisions Record](#architecture-decisions-record)

---

## Executive Summary

ObjectQL is the **Standard Protocol for AI Software Generation** — a universal database compiler that transforms declarative metadata (JSON/YAML) into type-safe, optimized database queries. This roadmap tracks the full 2026 development plan across all 30+ packages in the monorepo.

### 2026 Strategy

| Quarter | Theme | Key Deliverables |
|---------|-------|-----------------|
| **Q1** | Foundation & Browser | WASM drivers, workflow engine, codebase cleanup, core refactoring |
| **Q2** | Protocol Maturity | GraphQL subscriptions, OData `$expand`, multi-tenancy plugin |
| **Q3** | Edge & Offline | Cloudflare/Deno/Vercel adapters, offline-first sync protocol |
| **Q4** | Marketplace & v5.0 | Plugin marketplace, public API stabilization, v5.0 release |

### Code Quality Targets (Cross-Cutting)

| Category | Current State | Target State |
|----------|---------------|--------------|
| `any` type usage | ~330 instances | < 50 (critical path zero) |
| Error handling | Mixed (`throw new Error` ~100, `ObjectQLError` ~35) | 100% `ObjectQLError` |
| Test coverage | All packages have tests, but tools layer is weak | Full coverage with ≥ 80% per package |
| Console logging | ~60 `console.*` calls in production source | Zero in source; structured logging via hooks |
| ESLint rules | 11 rules disabled | Progressive re-enablement |
| Protocol compliance | GraphQL 85%, OData 80%, JSON-RPC 90% | 95%+ all protocols |

### Completed Milestones

- ✅ Phases 1A (ObjectQLError migration), 3 (logging), 4 (ESLint all waves), 5A (TODO elimination), 6 (error-handling + architecture guides)
- ✅ Core refactoring: `@objectql/core` decomposed from ~3,500 to ~800 LOC ([PR #373](https://github.com/objectstack-ai/objectql/pull/373))
- ✅ `@objectstack/*` platform upgraded to **v3.0.0**
- ✅ Phase 7 partial (sideEffects), Phase 2 partial (create tests)

---

## Timeline Overview

```
2026 Q1                          Q2                    Q3                    Q4
├─ Phase 1 (Done) ──┤           │                     │                     │
├─ Phase 2 (Active) ──┤         │                     │                     │
│  WASM Drivers       │         │                     │                     │
├─ Phase 3 (Next) ────┤         │                     │                     │
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

## Active: Q1 Phase 2 — Browser WASM Drivers

> Status: **Active** | Target: 6 weeks (W1-W6)  
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
- [ ] `pnpm build` succeeds with new package
- [ ] TCK tests pass
- [ ] Browser example works with OPFS persistence
- [ ] Bundle size < 400KB gzip
- [ ] Documentation published

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

## Next: Q1 Phase 3 — Housekeeping & Workflow

> Status: **Planned** | Target: 4 weeks  
> Focus: Codebase cleanup, legacy removal, and Workflow Engine plugin

### Part A: Housekeeping (1 week)

Technical debt accumulated from the v3 → v4 migration. These are non-breaking cleanups.

| Task | Description | Est. | Status |
|------|-------------|------|--------|
| **H-1** | Delete `packages/runtime/` empty directory | 5min | ✅ Done |
| **H-2** | Update `README.md` — remove deprecated packages, add WASM drivers | 1h | ⏳ |
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
- [ ] Simple state transitions work (draft → active → done)
- [ ] Guard conditions block invalid transitions with `ObjectQLError({ code: 'TRANSITION_DENIED' })`
- [ ] Entry/exit actions execute in correct order
- [ ] Compound (nested) states resolve correctly
- [ ] Zero changes to `@objectql/core` query pipeline or any driver

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

#### 1B. `any` Type Reduction ⏳ Remaining

Current: ~330 instances. Target: < 50 (justified edge cases only).

| `any` Location | Replacement Strategy |
|----------------|---------------------|
| Type definitions (`@objectql/types`) | `unknown`, generics `<T>`, Zod inferred types |
| Driver implementations | `Record<string, unknown>` |
| Protocol handlers | `unknown` + type guards |
| Plugin hooks | Generic `HookContext<T>` |
| `as any` casts | Proper type narrowing |

### Phase 2: Test Coverage & Quality Gates

> Priority: **P0 — Critical** | Est: 2 weeks

| Package | Current Tests | Gap | Action |
|---------|---------------|-----|--------|
| **@objectql/create** | 0 files | Full | Add scaffolding output tests |
| **@objectql/cli** | 1 file | High | Add per-command unit tests |
| **vscode-objectql** | 0 files | Full | Add extension activation tests |
| **@objectql/sdk** | 1 file | Medium | Add retry, timeout, auth tests |
| **@objectql/driver-pg-wasm** | 1 file | Medium | Add OPFS, fallback, JSONB tests |
| **@objectql/driver-sqlite-wasm** | 1 file | Medium | Add OPFS, WAL, fallback tests |

**CI Quality Gates:**

| Gate | Current | Target |
|------|---------|--------|
| Build | ✅ | ✅ |
| Unit tests | ✅ | ✅ + coverage threshold |
| Coverage threshold | None | ≥ 80% per package |
| ESLint | ✅ (many rules off) | ✅ (progressive strictness) |
| TCK conformance | Manual | CI-automated |

### Phase 3: Console Logging & Observability ✅ Completed

- [x] Audit all `console.*` calls
- [x] Remove debug-only `console.log` from drivers
- [x] Replace necessary logging with hook-based events
- [x] Keep `console.*` only in `@objectql/cli`
- [x] Add ESLint `no-console` with CLI override

### Phase 4: ESLint Strictness Progression ✅ Completed (All Waves)

All 5 waves completed. Rules re-enabled: `prefer-const`, `no-useless-catch`, `no-empty`, `no-unused-vars`, `no-case-declarations`, `no-useless-escape`, `no-require-imports`, `no-explicit-any` (warn), `no-empty-object-type`, `no-unsafe-function-type`, `no-this-alias`.

### Phase 5: TODO Elimination & Protocol Compliance

#### 5A. TODO/FIXME/HACK Elimination ✅ Completed

- [x] All 9 TODO items resolved across CLI, OData

#### 5B. Protocol Compliance ⏳ Remaining → Q2

| Protocol | Current | Target | Key Gaps |
|----------|---------|--------|----------|
| **GraphQL** | 85% | 95% | Subscriptions, Federation v2, N+1 DataLoader |
| **OData V4** | 80% | 95% | `$expand`, `$count` inline, `$batch` |
| **JSON-RPC** | 90% | 95% | `object.count()`, `action.execute()`, batch |

### Phase 6: Documentation & DX

#### 6A. Housekeeping ⏳ → Q1 Phase 3

See [Q1 Phase 3 Part A](#part-a-housekeeping-1-week) above.

#### 6B. New Documentation Needs

| Document | Location | Purpose |
|----------|----------|---------|
| Error handling guide | `content/docs/guides/error-handling.mdx` | `ObjectQLError` pattern, error codes |
| Plugin development guide | `content/docs/extending/plugin-development.mdx` | How to build a custom plugin |
| Driver development guide | `content/docs/extending/driver-development.mdx` | How to implement a new driver |
| Architecture overview | `content/docs/guides/architecture.mdx` | Updated architecture diagram |
| Migration guide (v4 → v5) | `content/docs/guides/migration-v5.mdx` | Breaking changes, deprecated API removal |

#### 6C. VSCode Extension Alignment

| Task | Description |
|------|-------------|
| Bump version to 4.2.0 | Align with monorepo |
| Add basic test suite | Extension activation, schema validation, snippet tests |
| Publish to VS Code Marketplace | If not already published |

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
| **BO-4** | Add `sideEffects: false` to all package.json files | ✅ Done |

#### 7C. Driver Performance Benchmarks ⏳ Remaining

| Benchmark | Metric | Target |
|-----------|--------|--------|
| Memory driver — 10K inserts | ops/sec | Baseline |
| SQL driver (SQLite) — 10K inserts | ops/sec | Baseline |
| Redis driver — 10K inserts | ops/sec | Baseline |
| Memory driver — complex aggregation (1M records) | latency p99 | Baseline |
| SQL driver — JOIN query (100K records) | latency p99 | Baseline |

---

## Q2 — Protocol Maturity & Multi-Tenancy

> Status: **Planned** | Target: 2026-04 — 2026-06

### Part A: Protocol Layer Enhancement (6 weeks)

Target: **95%+ compliance** across all three protocols.

| Protocol | Feature | Priority | Est. |
|----------|---------|----------|------|
| **GraphQL** | Subscriptions (WebSocket) | P0 | 2w |
| **GraphQL** | Federation v2 support | P1 | 2w |
| **GraphQL** | N+1 DataLoader integration | P0 | 1w |
| **OData V4** | `$expand` (nested entity loading) | P0 | 2w |
| **OData V4** | `$count` inline/standalone | P0 | 3d |
| **OData V4** | `$batch` multi-operation requests | P1 | 1w |
| **JSON-RPC** | `object.count()` method | P0 | 2d |
| **JSON-RPC** | `action.execute()` method | P0 | 2d |
| **JSON-RPC** | Batch request support (spec §6) | P1 | 3d |

**Success Criteria:**
- [ ] Protocol TCK compliance ≥ 95% for all three protocols
- [ ] GraphQL Subscriptions work for create/update/delete events
- [ ] OData `$expand` supports 2-level deep nesting
- [ ] All protocol docs updated in `content/docs/`

### Part B: `@objectql/plugin-multitenancy` (4 weeks)

> **Decision: Plugin, not Core modification** — Core remains zero-assumption. Tenant isolation is injected via hook-based filter rewriting.

| Task | Description | Est. |
|------|-------------|------|
| **MT-1** | Package scaffolding | 1h |
| **MT-2** | `MultiTenancyPlugin` — auto-inject `tenant_id` filter on all queries | 4h |
| **MT-3** | `beforeCreate` hook — auto-set `tenant_id` from context | 2h |
| **MT-4** | Tenant-scoped schema isolation (optional) | 8h |
| **MT-5** | Integration with `plugin-security` — tenant-aware RBAC | 4h |
| **MT-6** | Cross-tenant query prevention (strict mode) | 4h |
| **MT-7** | Unit + integration tests | 8h |
| **MT-8** | Documentation (`content/docs/extending/multitenancy.mdx`) | 4h |

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

## Q3 — Edge Runtime & Offline Sync

> Status: **Planned** | Target: 2026-07 — 2026-09  
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
- [ ] Cloudflare Workers example deploys and passes CRUD via D1
- [ ] Deno Deploy example serves queries via Deno Postgres
- [ ] Vercel Edge example proxies queries via `driver-sdk`
- [ ] Bun passes full driver TCK suite
- [ ] Zero changes to `@objectql/core`

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
- [ ] Mutation log records offline operations correctly
- [ ] Sync engine pushes mutations and receives server delta on reconnect
- [ ] All three conflict strategies work (LWW, CRDT, manual)
- [ ] Security: All sync mutations pass through ObjectQL hooks
- [ ] Performance: 1000-mutation batch sync < 5 seconds
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
| Performance benchmark suite | Automated CI benchmarks |
| Protocol compliance to 100% | Final push for all three protocols |
| v5.0 release | Major version with stable public API guarantee |

---

## Package Matrix

> All packages at **4.2.0** unless noted.

### Foundation Layer

| Package | NPM Name | Environment | Description |
|---------|----------|-------------|-------------|
| `packages/foundation/types` | `@objectql/types` | Universal | **The Constitution.** Protocol-derived TypeScript types. Zero runtime deps. |
| `packages/foundation/core` | `@objectql/core` | Universal | **The Engine.** Plugin orchestrator, repository pattern, kernel factory. |
| `packages/foundation/plugin-query` | `@objectql/plugin-query` | Universal | QueryService, QueryBuilder, QueryAnalyzer, FilterTranslator. |
| `packages/foundation/plugin-optimizations` | `@objectql/plugin-optimizations` | Universal | Connection pooling, query compilation, compiled hooks, lazy metadata. |
| `packages/foundation/platform-node` | `@objectql/platform-node` | Node.js | File system integration, YAML loading, glob-based plugin discovery. |
| `packages/foundation/plugin-security` | `@objectql/plugin-security` | Universal | RBAC, FLS, RLS with AST-level enforcement. |
| `packages/foundation/plugin-validator` | `@objectql/plugin-validator` | Universal | 5-type validation engine. |
| `packages/foundation/plugin-formula` | `@objectql/plugin-formula` | Universal | Computed fields with sandboxed JS expressions. |
| `packages/foundation/plugin-workflow` | `@objectql/plugin-workflow` | Universal | State machine executor with guards, actions, compound states. |
| `packages/foundation/plugin-multitenancy` | `@objectql/plugin-multitenancy` | Universal | Tenant isolation via hook-based filter rewriting. |

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
| `packages/protocols/graphql` | `@objectql/protocol-graphql` | 85% → 95% (Q2) | ⚠️ Good |
| `packages/protocols/odata-v4` | `@objectql/protocol-odata-v4` | 80% → 95% (Q2) | ⚠️ Good |
| `packages/protocols/json-rpc` | `@objectql/protocol-json-rpc` | 90% → 95% (Q2) | ✅ Excellent |
| `packages/protocols/sync` | `@objectql/protocol-sync` | — | 🆕 Q3 |

### Tools Layer

| Package | NPM Name | Description |
|---------|----------|-------------|
| `packages/tools/cli` | `@objectql/cli` | Metadata scaffolding, type generation, dev workflow |
| `packages/tools/create` | `@objectql/create` | `npm create @objectql@latest` project generator |
| `packages/tools/driver-tck` | `@objectql/driver-tck` | Driver technology compatibility kit |
| `packages/tools/protocol-tck` | `@objectql/protocol-tck` | Protocol technology compatibility kit |
| `packages/tools/vscode-objectql` | `vscode-objectql` (4.1.0) | VS Code extension: IntelliSense, validation, snippets |

### External Dependencies (Not in this repo)

| Package | Owner | Version | Role in ObjectQL |
|---------|-------|---------|-----------------|
| `@objectstack/cli` | ObjectStack | 3.0.0 | Kernel bootstrapper (`objectstack serve`) |
| `@objectstack/core` | ObjectStack | 3.0.0 | Kernel runtime, plugin lifecycle |
| `@objectstack/plugin-hono-server` | ObjectStack | 3.0.0 | HTTP server (Hono-based) |
| `@objectstack/spec` | ObjectStack | 3.0.0 | Formal protocol specifications (Zod schemas) |
| `@objectstack/runtime` | ObjectStack | 3.0.0 | Core runtime & query engine |
| `@objectstack/objectql` | ObjectStack | 3.0.0 | ObjectQL runtime bridge |
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

### Package Health Matrix

| Package | `any` Count | Error Pattern | Tests | Console Calls | TODOs |
|---------|-------------|---------------|-------|---------------|-------|
| **@objectql/types** | 85 | N/A (types only) | 3 files | 0 | 0 |
| **@objectql/core** | 103 | `Error` (~30) | 14 files | 1 | 0 |
| **@objectql/plugin-security** | 59 | `ObjectQLError` (6) | 8 files | 0 | 0 |
| **@objectql/protocol-graphql** | 58 | `Error` (4) | 4 files | 0 | 3 |
| **@objectql/driver-sql** | 54 | `Error` (7) | 6 files | 13 | 0 |
| **@objectql/driver-memory** | 51 | Mixed (7+7) | 2 files | 0 | 0 |
| **@objectql/driver-redis** | 48 | `Error` (10) | 2 files | 19 | 0 |
| **@objectql/driver-mongo** | 47 | `Error` (9) | 4 files | 4 | 0 |
| **@objectql/protocol-json-rpc** | 37 | `Error` (8) | 4 files | 15 | 0 |
| **@objectql/protocol-odata-v4** | 32 | `Error` (7) | 3 files | 0 | 3 |
| Others | < 30 each | Various | — | — | — |

### `as any` Cast Distribution

1. `foundation/core` — 56 casts
2. `drivers/sql` — 18 casts
3. `drivers/sqlite-wasm` — 15 casts
4. `protocols/json-rpc` — 15 casts
5. `foundation/plugin-security` — 11 casts

### Dependency Graph Observations

- **`@objectql/types`** correctly has ZERO production dependencies (pure types)
- **`@objectql/core`** depends on `plugin-formula` and `plugin-validator` — tight coupling noted
- All `@objectstack/*` packages are at **v3.0.0** — aligned
- **`mingo`** (used in memory driver) is the only non-standard query engine dependency
- **`knex`** is shared across `driver-sql`, `driver-pg-wasm`, `driver-sqlite-wasm`

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

---

> **Historical Reference:** The core refactoring design document is archived at `docs/DESIGN_CORE_REFACTOR.md` (Status: ✅ Completed — [PR #373](https://github.com/objectstack-ai/objectql/pull/373)).
