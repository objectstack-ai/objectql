# ObjectQL Work Plan — 2026 Roadmap

> Created: 2026-02-08 | Last Updated: 2026-02-08 | Status: **Active**  
> Current Version: **4.2.0** (all packages aligned, except `vscode-objectql` at 4.1.0)  
> Runtime: `@objectstack/cli` (Kernel pattern) — `@objectql/server` deprecated, `packages/runtime/` removed.

---

## Table of Contents

- [Completed: Q1 Phase 1](#completed-q1-phase-1)
- [Active: Q1 Phase 2 — Browser WASM Drivers](#active-q1-phase-2--browser-wasm-drivers)
- [Next: Q1 Phase 3 — Housekeeping & Workflow](#next-q1-phase-3--housekeeping--workflow)
- [Q2 — Protocol Maturity & Multi-Tenancy](#q2--protocol-maturity--multi-tenancy)
- [Q3 — Edge Runtime & Offline Sync](#q3--edge-runtime--offline-sync)
- [Q4 — Plugin Marketplace & Stabilization](#q4--plugin-marketplace--stabilization)
- [Package Matrix](#package-matrix)
- [Removed Packages](#removed-packages)
- [Architecture Decisions Record](#architecture-decisions-record)

---

## Completed: Q1 Phase 1

> Status: **Completed** | Duration: 2025-12 — 2026-01

| Deliverable | Status |
|-------------|--------|
| pnpm workspace + Turborepo build chain | ✅ |
| Conventional Commits + Changesets | ✅ |
| `@objectql/plugin-security` — RBAC, FLS, RLS with AST-level enforcement | ✅ |
| `@objectql/plugin-validator` — 5-type validation engine (field, cross-field, state_machine, unique, business_rule) | ✅ |
| `@objectql/plugin-formula` — Computed fields with sandboxed JS expressions | ✅ |
| `@objectql/driver-tck` + `@objectql/protocol-tck` — Conformance test suites | ✅ |
| Removed `@objectql/driver-localstorage`, `@objectql/driver-utils` | ✅ |
| All 21 packages build + test clean (excl. Mongo/Redis needing live servers) | ✅ |

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
| **Target Environments** | Browsers with WASM support (95%+ global coverage) |
| **WASM Bundle Size** | ~300KB gzip |

**Architecture:**
```
QueryAST → Knex (client: 'sqlite3') → SQL string → wa-sqlite WASM → OPFS/Memory
```

**Scope:**

| Task | Description | Est. |
|------|-------------|------|
| **S0-1** | Package scaffolding (`package.json`, `tsconfig.json`, exports) | 1h |
| **S0-2** | Implement `SqliteWasmDriver` class wrapping `SqlDriver` (composition) | 4h |
| **S0-3** | Custom Knex client adapter for wa-sqlite | 4h |
| **S0-4** | OPFS persistence backend (data survives page refresh) | 4h |
| **S0-5** | In-memory fallback (no persistence, for testing/SSR) | 1h |
| **S0-6** | `DriverCapabilities` declaration | 1h |
| **S0-7** | TCK conformance tests via `@objectql/driver-tck` | 4h |
| **S0-8** | Unit tests (OPFS init, persistence, quota, health check) | 4h |
| **S0-9** | Documentation page (`content/docs/drivers/sqlite-wasm.mdx`) | 2h |
| **S0-10** | Update browser example (`examples/integrations/browser`) | 2h |

**Config Interface (Draft):**
```typescript
export interface SqliteWasmDriverConfig {
  /** Storage backend: 'opfs' for persistent, 'memory' for ephemeral. Default: 'opfs' */
  storage?: 'opfs' | 'memory';
  /** Database filename in OPFS. Default: 'objectql.db' */
  filename?: string;
  /** Enable WAL mode for better read concurrency. Default: true */
  walMode?: boolean;
  /** Page size in bytes. Default: 4096 */
  pageSize?: number;
}
```

**Key Decisions:**
1. **Composition over inheritance** — Wrap `SqlDriver` internally; Knex instance uses a custom client adapter, all query building logic delegated to `SqlDriver`.
2. **Library-agnostic** — Public API references "SQLite WASM", never "wa-sqlite". Underlying library switchable without breaking changes.
3. **No Node.js support** — Throws `ObjectQLError({ code: 'ENVIRONMENT_ERROR' })` if `globalThis.WebAssembly` is undefined.

**Success Criteria:**
- [ ] `pnpm build` succeeds with new package
- [ ] TCK tests pass (skip: transactions if single-connection)
- [ ] Browser example works with OPFS persistence (data survives refresh)
- [ ] Bundle size < 400KB gzip (driver + WASM)
- [ ] Documentation published

### P1 — `@objectql/driver-pg-wasm`

| Field | Value |
|-------|-------|
| **Package** | `packages/drivers/pg-wasm` |
| **Priority** | P1 — Advanced browser driver (starts after P0 ships) |
| **Underlying Library** | [PGlite](https://github.com/nicolo-ribaudo/pglite) (ElectricSQL) |
| **WASM Bundle Size** | ~3MB gzip |

**Architecture:**
```
QueryAST → Knex (client: 'pg') → SQL string → PGlite WASM → IndexedDB/OPFS
```

**Scope:**

| Task | Description | Est. |
|------|-------------|------|
| **P1-1** | Package scaffolding | 1h |
| **P1-2** | Implement `PgWasmDriver` class | 4h |
| **P1-3** | Custom Knex client adapter for PGlite | 4h |
| **P1-4** | IndexedDB/OPFS persistence backend | 4h |
| **P1-5** | PG-specific features: JSONB operators, full-text search | 4h |
| **P1-6** | TCK conformance tests | 4h |
| **P1-7** | Unit tests | 4h |
| **P1-8** | Documentation page (`content/docs/drivers/pg-wasm.mdx`) | 2h |

**Config Interface (Draft):**
```typescript
export interface PgWasmDriverConfig {
  /** Storage backend. Default: 'idb' (IndexedDB) */
  storage?: 'idb' | 'opfs' | 'memory';
  /** Database name. Default: 'objectql' */
  database?: string;
  /** Enable PGlite extensions (e.g., vector, full-text). Default: [] */
  extensions?: string[];
}
```

**Key Decisions:**
1. Deferred until P0 ships and is TCK-passing.
2. ~3MB bundle is acceptable for apps needing PG features. Document so users choose SQLite WASM when PG-specific features are unnecessary.
3. PGlite extensions (pgvector, etc.) exposed via config but not bundled by default.

### Shared Infrastructure

| Component | Location | Purpose |
|-----------|----------|---------|
| WASM loader utility | `packages/drivers/sqlite-wasm/src/wasm-loader.ts` | Lazy-load WASM binary, handle CDN/local paths |
| Environment detection | Shared in both drivers | Check `WebAssembly`, `navigator.storage`, OPFS availability |
| Knex custom client pattern | Abstractable if both drivers follow same adapter shape | Reduce duplication between S0-3 and P1-3 |

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

| Task | Description | Est. |
|------|-------------|------|
| **H-1** | Delete `packages/runtime/` empty directory | 5min |
| **H-2** | Update `README.md` — remove `@objectql/server` from Runtime Layer table; remove `driver-localstorage` from Driver Layer table; add WASM drivers | 1h |
| **H-3** | Update `README.md` — replace `@objectql/server` references with `@objectstack/cli` + `HonoServerPlugin` pattern | 1h |
| **H-4** | Clean `cli/src/commands/doctor.ts` — remove `@objectql/server` from `corePackages` check list | 30min |
| **H-5** | Clean `sdk/README.md` — remove `@objectql/server` link in Architecture section | 30min |
| **H-6** | Bump `vscode-objectql` from 4.1.0 → 4.2.0 to align with monorepo | 1h |
| **H-7** | Update `examples/integrations/express-server/README.md` — mark migration as complete, remove "waiting for runtime fix" note | 30min |
| **H-8** | Audit all CHANGELOG.md files for `@objectql/server` references — add deprecation note | 1h |

### Part B: `@objectql/plugin-workflow` (3 weeks)

> **Decision: In-Monorepo Plugin (not a separate project)**  
> Rationale: Deep dependency on `@objectql/types` (StateMachineConfig), `CompiledHookManager` internal API, and `plugin-validator`'s state machine validation. Keeping it in-monorepo ensures synchronized versioning and type safety.

> **Decision: Does NOT affect SQL generation**  
> The Workflow Engine operates at the Hook/Validation layer (`beforeUpdate`), above the query compilation pipeline. It intercepts state field changes and either allows or denies them. The actual SQL statement (`UPDATE x SET status = ? WHERE id = ?`) is unchanged — the driver layer is never modified.

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

**Package:** `packages/foundation/plugin-workflow`

**What exists today:**
- `@objectstack/spec` defines full XState-level `StateMachineSchema` (compound/parallel/final states, guards, entry/exit actions, hierarchical nesting)
- `@objectql/types` derives `StateMachineConfig`, mounted on `ObjectConfig.stateMachine` and `ObjectConfig.stateMachines`
- `plugin-validator` has simplified `validateStateMachine()` — only checks `allowed_next` transitions

**What's missing:** A runtime engine to interpret and execute the full `StateMachineConfig` (guards, actions, compound states).

**Scope:**

| Task | Description | Est. |
|------|-------------|------|
| **W-1** | Package scaffolding (same structure as `plugin-validator`) | 1h |
| **W-2** | `StateMachineEngine` — interpret `StateMachineConfig`, evaluate state transitions | 8h |
| **W-3** | `GuardEvaluator` — evaluate `cond` guards against record data + context | 4h |
| **W-4** | `ActionExecutor` — execute entry/exit/transition actions | 4h |
| **W-5** | `WorkflowPlugin` implements `RuntimePlugin` — registers `beforeUpdate` hooks | 4h |
| **W-6** | Integration with `plugin-validator` — replace simplified `validateStateMachine()` with full engine delegation | 4h |
| **W-7** | Workflow instance persistence — `_workflow_instance` internal object for audit trail | 4h |
| **W-8** | Unit tests (`StateMachineEngine`, `GuardEvaluator`, compound states) | 8h |
| **W-9** | Integration tests (end-to-end with Memory driver) | 4h |
| **W-10** | Documentation (`content/docs/logic/workflow.mdx`) | 4h |

**Directory Structure:**
```
packages/foundation/plugin-workflow/
  package.json
  tsconfig.json
  src/
    index.ts                    # Public exports
    workflow-plugin.ts          # RuntimePlugin implementation
    engine/
      state-machine-engine.ts   # Interpret StateMachineConfig
      guard-evaluator.ts        # Evaluate cond references
      action-executor.ts        # Execute entry/exit/transition actions
    types.ts                    # WorkflowInstance, ExecutionContext, TransitionResult
  __tests__/
    state-machine-engine.spec.ts
    guard-evaluator.spec.ts
    workflow-plugin.spec.ts
    integration.spec.ts
```

**Config Interface (Draft):**
```typescript
export interface WorkflowPluginConfig {
  /** Enable audit trail persistence. Default: false */
  enableAuditTrail?: boolean;

  /** Custom guard resolver — for guards that need external data. Default: built-in */
  guardResolver?: (guardRef: string, context: any) => Promise<boolean>;

  /** Custom action executor — for actions that trigger external systems. Default: built-in */
  actionExecutor?: (actionRef: string, context: any) => Promise<void>;
}
```

**Success Criteria:**
- [ ] Simple state transitions work (draft → active → done)
- [ ] Guard conditions block invalid transitions with `ObjectQLError({ code: 'TRANSITION_DENIED' })`
- [ ] Entry/exit actions execute in correct order
- [ ] Compound (nested) states resolve correctly
- [ ] TCK test case: YAML input → transition attempt → expected result
- [ ] Zero changes to `@objectql/core` query pipeline or any driver
- [ ] Documentation published

---

## Q2 — Protocol Maturity & Multi-Tenancy

> Status: **Planned** | Target: 2026-04 — 2026-06

### Part A: Protocol Layer Enhancement (6 weeks)

Current compliance: GraphQL 85%, OData V4 80%, JSON-RPC 90%. Target: **95%+** across all three.

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
| **JSON-RPC** | Batch request support (JSON-RPC spec §6) | P1 | 3d |

**Success Criteria:**
- [ ] Protocol TCK compliance ≥ 95% for all three protocols
- [ ] GraphQL Subscriptions work for create/update/delete events
- [ ] OData `$expand` supports 2-level deep nesting
- [ ] All protocol docs updated in `content/docs/`

### Part B: `@objectql/plugin-multitenancy` (4 weeks)

> **Decision: Plugin, not Core modification**  
> Core remains zero-assumption. Tenant isolation is injected via hook-based filter rewriting.

| Task | Description | Est. |
|------|-------------|------|
| **MT-1** | Package scaffolding | 1h |
| **MT-2** | `MultiTenancyPlugin` — auto-inject `tenant_id` filter on all queries | 4h |
| **MT-3** | `beforeCreate` hook — auto-set `tenant_id` from context | 2h |
| **MT-4** | Tenant-scoped schema isolation (optional: separate tables/schemas per tenant) | 8h |
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
> 📄 **Detailed Work Plan: [WORK_PLAN_2026_Q3.md](./WORK_PLAN_2026_Q3.md)**
> 🧩 **Type Contracts Defined:** `@objectql/types` — `sync.ts`, `edge.ts`

### Part A: Edge Runtime Support (4 weeks)

ObjectQL Core is already universal (zero Node.js native modules). This phase validates and documents deployment to edge environments.

| Target | Runtime | Driver | Status |
|--------|---------|--------|--------|
| Cloudflare Workers | Workerd | `driver-memory`, `driver-sqlite-wasm` (D1) | Planned |
| Deno Deploy | Deno | `driver-memory`, `driver-sql` (Deno Postgres) | Planned |
| Vercel Edge Functions | V8 | `driver-memory`, `driver-sdk` | Planned |
| Bun | Bun | All Node.js drivers | Planned |

| Task | Description | Est. |
|------|-------------|------|
| **E-1** | Cloudflare Workers adapter + D1 driver binding | 2w |
| **E-2** | Deno Deploy validation + example | 1w |
| **E-3** | Vercel Edge validation + example | 3d |
| **E-4** | Bun compatibility test suite | 3d |
| **E-5** | Documentation (`content/docs/server/edge.mdx`) | 1w |

### Part B: Offline-First Sync Protocol (6 weeks)

With Browser WASM drivers (Q1) + Server Runtime (existing), build a **Client ↔ Server bidirectional sync protocol**.

| Task | Description | Est. |
|------|-------------|------|
| **SY-1** | Sync protocol spec (conflict resolution strategy: last-write-wins vs CRDT) | 1w |
| **SY-2** | Change tracking — append-only mutation log on client-side WASM driver | 2w |
| **SY-3** | Server sync endpoint — accept client changelog, merge, push server changes | 2w |
| **SY-4** | Conflict resolution engine | 1w |
| **SY-5** | Integration tests (offline → reconnect → sync) | 1w |
| **SY-6** | Documentation + example PWA | 1w |

**Key Decision:** Sync protocol is an **opt-in feature** per object (configured in YAML metadata), not a global behavior.

```yaml
# story.object.yml
name: story
sync:
  enabled: true
  strategy: last-write-wins    # or 'crdt'
  conflict_fields: [status]    # fields requiring manual merge
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
| Performance benchmark suite | Automated CI benchmarks (`scripts/benchmarks/core-perf.ts` expansion) |
| Protocol compliance to 100% | Final push for all three protocols |
| v5.0 release | Major version with stable public API guarantee |

---

## Package Matrix

> All packages at **4.2.0** unless noted.

### Foundation Layer

| Package | NPM Name | Environment | Description |
|---------|----------|-------------|-------------|
| `packages/foundation/types` | `@objectql/types` | Universal | **The Constitution.** Protocol-derived TypeScript types. Zero runtime deps. |
| `packages/foundation/core` | `@objectql/core` | Universal | **The Engine.** QueryBuilder, QueryCompiler, Repository, HookManager. No Node.js natives. |
| `packages/foundation/platform-node` | `@objectql/platform-node` | Node.js | File system integration, YAML loading, glob-based plugin discovery. |
| `packages/foundation/plugin-security` | `@objectql/plugin-security` | Universal | RBAC, Field-Level Security, Row-Level Security with AST-level enforcement. |
| `packages/foundation/plugin-validator` | `@objectql/plugin-validator` | Universal | 5-type validation engine: field, cross-field, state_machine, unique, business_rule. |
| `packages/foundation/plugin-formula` | `@objectql/plugin-formula` | Universal | Computed fields with JavaScript expressions in a sandboxed evaluator. |
| `packages/foundation/plugin-workflow` | `@objectql/plugin-workflow` | Universal | **🆕 Q1 P3.** State machine executor with guards, actions, compound states. |

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

### Tools Layer

| Package | NPM Name | Description |
|---------|----------|-------------|
| `packages/tools/cli` | `@objectql/cli` | Metadata scaffolding, type generation, dev workflow |
| `packages/tools/create` | `@objectql/create` | `npm create @objectql@latest` project generator |
| `packages/tools/driver-tck` | `@objectql/driver-tck` | Driver technology compatibility kit |
| `packages/tools/protocol-tck` | `@objectql/protocol-tck` | Protocol technology compatibility kit |
| `packages/tools/vscode-objectql` | `vscode-objectql` (4.1.0) | VS Code extension: IntelliSense, validation, snippets |

### External Dependencies (Not in this repo)

| Package | Owner | Role in ObjectQL |
|---------|-------|-----------------|
| `@objectstack/cli` | ObjectStack | Kernel bootstrapper (`objectstack serve`) |
| `@objectstack/core` | ObjectStack | Kernel runtime, plugin lifecycle |
| `@objectstack/plugin-hono-server` | ObjectStack | HTTP server (Hono-based) |
| `@objectstack/spec` | ObjectStack | Formal protocol specifications (Zod schemas) |
| AI Agent / AI tooling | **Separate project** | Not in this monorepo |

---

## Removed Packages

| Package | Reason | Date |
|---------|--------|------|
| `@objectql/driver-localstorage` | localStorage 5MB limit, sync API blocks UI, no query indexing. Replaced by `driver-sqlite-wasm`. | 2026-02-08 |
| `@objectql/driver-utils` | Zero consumers, all functionality duplicated in core. | 2026-02-07 |
| `@objectql/server` | Responsibilities fully absorbed by `@objectstack/plugin-hono-server` + protocol plugins. CLI uses `@objectstack/cli` directly. `packages/runtime/` empty directory to be deleted in Q1 P3 H-1. | 2026-02-08 |

---

## Architecture Decisions Record

### ADR-001: No `@objectql/server` package

**Context:** `@objectql/server` existed from v1.7 through v4.0 as an Express-based HTTP adapter. With the migration to the ObjectStack Kernel pattern, its responsibilities were decomposed:

- HTTP serving → `@objectstack/plugin-hono-server`
- REST routes → `@objectql/protocol-json-rpc` (replaces legacy REST)
- GraphQL routes → `@objectql/protocol-graphql`
- OData routes → `@objectql/protocol-odata-v4`
- Startup → `@objectstack/cli` (`objectstack serve`)

**Decision:** Do not create or maintain `@objectql/server`. Delete `packages/runtime/` empty directory. Update all documentation references.

**Status:** Accepted.

### ADR-002: Workflow Engine as in-monorepo plugin

**Context:** ObjectQL's `@objectstack/spec` defines a full XState-level `StateMachineSchema` (compound/parallel/final states, guards, entry/exit actions). `@objectql/types` derives `StateMachineConfig` and mounts it on `ObjectConfig`. Currently, only `plugin-validator` does simplified `allowed_next` transition checks.

**Decision:** Implement as `packages/foundation/plugin-workflow` — a `RuntimePlugin` that registers `beforeUpdate` hooks to intercept state field changes and execute the full state machine logic.

**Rationale:**
- Deep dependency on internal types (`StateMachineConfig`, `HookContext`, `CompiledHookManager`)
- Must synchronize versioning with `@objectql/types`
- Does NOT affect SQL generation — operates purely at Hook/Validation layer

**Status:** Accepted.

### ADR-003: AI Agent is a separate project

**Context:** AI-powered code generation and schema-aware tooling are critical differentiators for ObjectQL.

**Decision:** AI Agent development is maintained in a separate repository, not in this monorepo. This monorepo provides the protocol foundation (`@objectql/types`, `@objectstack/spec`) that the AI project consumes.

**Status:** Accepted.

### ADR-004: Multi-tenancy as plugin, not core

**Context:** Multi-tenancy requires query filter injection, automatic field population, and cross-tenant isolation.

**Decision:** Implement as `@objectql/plugin-multitenancy`. Core remains zero-assumption. Tenant isolation is injected via `beforeFind`/`beforeCreate`/`beforeUpdate` hooks.

**Status:** Accepted.
