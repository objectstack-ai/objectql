# @objectql/core Refactoring Design Document

> **Author:** ObjectStack Architecture Team  
> **Date:** 2026-02-10  
> **Updated:** 2026-02-11  
> **Status:** Ready for Implementation — Upstream prerequisites met  
> **Scope:** Decompose `@objectql/core`, align with `@objectstack/objectql` plugin extension model  
> **Upstream Repo:** https://github.com/objectstack-ai/spec (v2.0.5+, latest commit `33646a7`)  
> **Local Repo:** https://github.com/objectstack-ai/objectql (v4.2.0)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current Architecture Analysis](#2-current-architecture-analysis)
3. [Problem Statement & Motivation](#3-problem-statement--motivation)
4. [Target Architecture](#4-target-architecture)
5. [Upstream Spec Changes Required](#5-upstream-spec-changes-required)
6. [Local Project Changes Required](#6-local-project-changes-required)
7. [Decomposition Strategy](#7-decomposition-strategy)
8. [Migration Plan](#8-migration-plan)
9. [Risk Assessment](#9-risk-assessment)
10. [Appendix](#10-appendix)

---

## 1. Executive Summary

This document proposes **decomposing `@objectql/core`** from a monolithic runtime engine into a set of **focused, composable plugins** that extend the upstream `@objectstack/objectql` engine. The goal is to eliminate feature duplication between the local `@objectql/core` and the upstream `@objectstack/objectql`, establish a clear plugin boundary, and enable the local project to evolve as a **thin extension layer** rather than a parallel implementation.

### Key Decisions

| Decision | Rationale |
|----------|-----------|
| **Adopt upstream `ObjectQL` engine** as the canonical data engine | Eliminates ~500 LOC of duplicated CRUD/hook/middleware logic in local `app.ts` |
| **Convert local features into `RuntimePlugin` extensions** | Aligns with ObjectStack microkernel architecture; enables hot-swap and isolation |
| **Propose upstream spec enhancements** for missing extension points | Enables plugin-level query optimization |
| **Phase the migration** across 3 incremental stages | Reduces risk; allows validation at each checkpoint |

### Impact Summary

| Metric | Before | After |
|--------|--------|-------|
| `@objectql/core` LOC | ~3,500 | ~800 (thin re-exports + plugin orchestrator) |
| Duplication with upstream | High (CRUD, hooks, middleware, repository, protocol) | Near-zero |
| Plugin count (new) | 0 dedicated | 2 new plugins extracted |
| Upstream PRs needed | 0 | ~~1-2 PRs to `@objectstack/spec`~~ → ✅ 0 (all merged) |

---

## 2. Current Architecture Analysis

### 2.1 Local `@objectql/core` (v4.2.0) — Module Inventory

```
packages/foundation/core/src/
├── app.ts                   # ObjectQL class — main runtime (wraps ObjectKernel)
├── plugin.ts                # ObjectQLPlugin — RuntimePlugin bridge
├── repository.ts            # ObjectRepository — CRUD + hook lifecycle
├── protocol.ts              # ObjectStackProtocolImplementation
├── gateway.ts               # ObjectGateway — multi-protocol API router
├── util.ts                  # Schema conversion utilities
├── index.ts                 # Public API surface
├── query/
│   ├── query-service.ts     # QueryService — query execution + profiling
│   ├── query-builder.ts     # QueryBuilder — UnifiedQuery → QueryAST
│   ├── filter-translator.ts # FilterTranslator — filter format bridge
│   ├── query-analyzer.ts    # QueryAnalyzer — performance introspection
│   └── index.ts
├── optimizations/
│   ├── CompiledHookManager.ts
│   ├── DependencyGraph.ts
│   ├── GlobalConnectionPool.ts
│   ├── LazyMetadataLoader.ts
│   ├── OptimizedMetadataRegistry.ts
│   ├── OptimizedValidationEngine.ts
│   ├── QueryCompiler.ts
│   ├── SQLQueryOptimizer.ts
│   └── index.ts
└── ai/
    ├── index.ts
    └── registry.ts           # InMemoryModelRegistry, InMemoryPromptRegistry
```

**Dependencies:**
- `@objectstack/core` (^2.0.5)
- `@objectstack/objectql` (^2.0.5)
- `@objectstack/runtime` (^2.0.5)
- `@objectstack/spec` (^2.0.5)
- `@objectql/types` (workspace)
- `@objectql/plugin-validator` (workspace)
- `@objectql/plugin-formula` (workspace)
- `zod`, `js-yaml`

### 2.2 Upstream `@objectstack/objectql` (v2.0.5) — Module Inventory

```
packages/objectql/src/          (in objectstack-ai/spec repo)
├── engine.ts                   # ObjectQL class — IDataEngine implementation
├── plugin.ts                   # ObjectQLPlugin — Kernel Plugin (init/start)
├── protocol.ts                 # ObjectStackProtocolImplementation (29KB)
├── registry.ts                 # SchemaRegistry — FQN-based object registry (22KB)
├── metadata-facade.ts          # MetadataFacade — registry → service bridge
└── index.ts                    # Exports
```

**Key Classes:**
- `ObjectQL` (engine.ts): Full IDataEngine — `find`, `findOne`, `insert`, `update`, `delete`, `count`, `aggregate`, `execute`; hook system (`registerHook`, `triggerHooks`); middleware chain; driver management; `ObjectRepository`; `ScopedContext`
- `ObjectQLPlugin` (plugin.ts): Kernel plugin — registers `objectql`, `metadata`, `data`, `protocol` services; audit hooks; tenant middleware
- `SchemaRegistry` (registry.ts): Global singleton — FQN support, ownership model, object/field/permission/trigger management
- `ObjectStackProtocolImplementation` (protocol.ts): Full protocol handler — discovery, data ops, analytics, batch

### 2.3 Feature Overlap Matrix

| Feature | Local `@objectql/core` | Upstream `@objectstack/objectql` | Status |
|---------|----------------------|----------------------------------|--------|
| **CRUD Operations** | `ObjectQL.create/find/update/delete` via kernel | `ObjectQL.find/findOne/insert/update/delete/count/aggregate` | **DUPLICATED** |
| **Hook System** | `CompiledHookManager` + `app.triggerHook()` | `registerHook/triggerHooks` (priority, per-object) | **DUPLICATED** |
| **Middleware Chain** | Not explicit (hook-based) | `registerMiddleware` (onion model) | Upstream richer |
| **Repository Pattern** | `ObjectRepository` (CRUD + hooks) | `ObjectRepository` (thin, context-scoped) | **DUPLICATED** |
| **Protocol Implementation** | `ObjectStackProtocolImplementation` | `ObjectStackProtocolImplementation` | **DUPLICATED** |
| **Schema Registry** | Re-exports `SchemaRegistry` | Owns `SchemaRegistry` (FQN, ownership) | Upstream is source |
| **Audit Hooks** | Not in core (deferred to plugins) | Auto-stamps `createdBy/modifiedBy` in plugin | Upstream richer |
| **Tenant Isolation** | Via `plugin-multitenancy` | Built-in middleware in plugin | Both have it |
| **Query Service** | `QueryService` (profiling, routing) | Inline in `find/findOne` | **LOCAL ONLY** |
| **Query Analyzer** | `QueryAnalyzer` (explain, stats) | Not present | **LOCAL ONLY** |
| **Query Builder** | `QueryBuilder` (UnifiedQuery→AST) | `toQueryAST` (inline) | **DUPLICATED** (different APIs) |
| **Filter Translator** | `FilterTranslator` | Inline in engine | **DUPLICATED** (pass-through) |
| **Gateway** | `ObjectGateway` (multi-protocol router) | Not present | **OUT OF SCOPE** — server-side API already exists upstream |
| **Optimizations** | 8 modules (connection pool, LRU, etc.) | Not present | **LOCAL ONLY** |
| **AI Registry** | `InMemoryModelRegistry/PromptRegistry` | Not present | **OUT OF SCOPE** — separate AI project handles this |
| **Validator/Formula** | Via plugin references | Not present | **LOCAL ONLY** |

### 2.4 Dependency Graph (Current)

```
┌──────────────────────────────────────────────────────────────┐
│   @objectql/core                                             │
│   ┌───────────────────────────────────────────────────────┐  │
│   │ app.ts (ObjectQL) ──wraps──▶ ObjectKernel             │  │
│   │                    ──wraps──▶ RuntimeObjectQL          │  │
│   │                    ──uses───▶ SchemaRegistry           │  │
│   │                    ──uses───▶ CompiledHookManager      │  │
│   │                    ──loads──▶ ValidatorPlugin           │  │
│   │                    ──loads──▶ FormulaPlugin             │  │
│   ├───────────────────────────────────────────────────────┤  │
│   │ plugin.ts (ObjectQLPlugin)                             │  │
│   │   ──creates──▶ QueryService, QueryAnalyzer             │  │
│   │   ──creates──▶ ObjectStackProtocolImplementation       │  │
│   │   ──bridges──▶ kernel CRUD → drivers                   │  │
│   ├───────────────────────────────────────────────────────┤  │
│   │ repository.ts (ObjectRepository)                       │  │
│   │   ──delegates──▶ kernel.find/create/update/delete      │  │
│   │   ──triggers──▶ hookManager.before*/after*             │  │
│   ├───────────────────────────────────────────────────────┤  │
│   │ query/* (QueryService, QueryBuilder, etc.)             │  │
│   │ optimizations/* (8 modules)                            │  │
│   │ gateway.ts (ObjectGateway) — OUT OF SCOPE              │  │
│   │ ai/* (Model/Prompt registries) — OUT OF SCOPE          │  │
│   └───────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
         │ depends on                          │ depends on
         ▼                                     ▼
┌────────────────────────┐    ┌──────────────────────────────┐
│ @objectstack/objectql  │    │ @objectstack/runtime         │
│  • ObjectQL (engine)   │    │  • ObjectKernel              │
│  • SchemaRegistry      │    │  • DriverPlugin              │
│  • ObjectQLPlugin      │    │  • AppPlugin                 │
│  • Protocol impl       │    │  • HttpDispatcher            │
└────────────────────────┘    └──────────────────────────────┘
         │                             │
         ▼                             ▼
┌────────────────────────┐    ┌──────────────────────────────┐
│ @objectstack/core      │    │ @objectstack/spec            │
│  • Plugin, PluginCtx   │    │  • Data.*, Automation.*      │
│  • Logger              │    │  • System.*, UI.*            │
│  • Service Registry    │    │  • Zod schemas               │
└────────────────────────┘    └──────────────────────────────┘
```

**Problem:** Local `@objectql/core` wraps both `ObjectKernel` AND `RuntimeObjectQL` (upstream engine), creating a double-wrapper that duplicates CRUD routing, hooks, and metadata management. The local `ObjectQL` class re-implements features already present in the upstream `ObjectQL` engine.

---

## 3. Problem Statement & Motivation

### 3.1 Feature Duplication

The local `@objectql/core` duplicates **~60% of upstream functionality**:

1. **CRUD Operations:** Local `ObjectQL` class wraps kernel, which wraps the upstream engine. Three layers of indirection for a single `find()` call.
2. **Hook System:** Local `CompiledHookManager` provides optimized hooks, but the upstream engine already has priority-based, per-object hooks. Two hook systems run in parallel.
3. **Repository Pattern:** Both local and upstream provide `ObjectRepository`. The local version adds hook lifecycle integration; the upstream provides context-scoped execution.
4. **Protocol Implementation:** Both repos have `ObjectStackProtocolImplementation`. The local version is a simplified wrapper around the upstream's full implementation.

### 3.2 Maintenance Burden

- Every upstream spec update requires checking local code for drift
- Bug fixes in one location may not propagate to the other
- Two hook systems create confusion about which one fires when
- Type definitions diverge between `@objectql/types` and upstream `@objectstack/spec`

### 3.3 Architecture Misalignment

The ObjectStack architecture prescribes a **microkernel + plugin** model:
```
Kernel → Plugin → Service
```

But the local `@objectql/core` bypasses this by wrapping the kernel:
```
Local ObjectQL → ObjectKernel → Upstream ObjectQL → Drivers
```

This creates an unnecessary abstraction layer that makes debugging harder and prevents clean plugin composition.

### 3.4 Goals

1. **Eliminate duplication:** Remove reimplemented CRUD, hooks, repository, and protocol logic
2. **Adopt upstream engine:** Use `@objectstack/objectql.ObjectQL` as the canonical data engine
3. **Extract unique value:** Convert local-only features (QueryService, Optimizations) into composable plugins
4. **Deprecate out-of-scope modules:** Gateway (covered by upstream server) and AI registry (separate project) remain in-place but are not extracted as new plugins
4. **Clean dependency graph:** Local packages depend on upstream; never the reverse
5. **Preserve API compatibility:** Existing consumers of `@objectql/core` should require minimal changes

---

## 4. Target Architecture

### 4.1 New Package Structure

```
packages/foundation/
├── types/                    # @objectql/types (unchanged — "Constitution")
├── core/                     # @objectql/core (SLIMMED — orchestrator + re-exports)
│   └── src/
│       ├── index.ts          # Re-exports from upstream + local plugins
│       └── kernel-factory.ts # Convenience factory: createObjectQLKernel()
│
├── plugin-query/             # NEW: @objectql/plugin-query
│   └── src/
│       ├── plugin.ts         # RuntimePlugin: QueryService + QueryAnalyzer
│       ├── query-service.ts  # (moved from core/query/)
│       ├── query-builder.ts
│       ├── query-analyzer.ts
│       └── index.ts
│
├── plugin-optimizations/     # NEW: @objectql/plugin-optimizations
│   └── src/
│       ├── plugin.ts         # RuntimePlugin: kernel optimizations
│       ├── CompiledHookManager.ts
│       ├── GlobalConnectionPool.ts
│       ├── QueryCompiler.ts
│       ├── SQLQueryOptimizer.ts
│       ├── DependencyGraph.ts
│       ├── LazyMetadataLoader.ts
│       ├── OptimizedMetadataRegistry.ts
│       ├── OptimizedValidationEngine.ts
│       └── index.ts
│
├── plugin-security/          # (existing — unchanged)
├── plugin-validator/         # (existing — unchanged)
├── plugin-formula/           # (existing — unchanged)
├── plugin-sync/              # (existing — unchanged)
├── plugin-workflow/          # (existing — unchanged)
├── plugin-multitenancy/      # (existing — unchanged)
├── platform-node/            # (existing — unchanged)
└── edge-adapter/             # (existing — unchanged)
```

> **Note:** `gateway.ts` and `ai/` modules remain in `@objectql/core` as-is (not extracted).
> - **Gateway** is out of scope — the upstream server (`@objectstack/plugin-hono-server`) already provides the API layer.
> - **AI Registry** is out of scope — a separate dedicated AI project handles model/prompt management.

### 4.2 New Dependency Graph (Target)

```
                    ┌──────────────────────────────┐
                    │   @objectql/core (SLIM)       │
                    │   • createObjectQLKernel()     │
                    │   • Re-exports from upstream   │
                    └──────────┬───────────────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                     │
          ▼                                     ▼
┌─────────────────┐                    ┌──────────────────┐
│plugin-query     │                    │plugin-optimizations│
│ QueryService    │                    │ ConnectionPool    │
│ QueryAnalyzer   │                    │ QueryCompiler     │
│ QueryBuilder    │                    │ HookManager       │
└────────┬────────┘                    └────────┬─────────┘
         │                                      │
         └──────────────┬───────────────────────┘
                        │ all depend on
                             ▼
             ┌───────────────────────────────┐
             │  @objectstack/objectql        │
             │  (upstream engine — canonical) │
             │  • ObjectQL (IDataEngine)      │
             │  • SchemaRegistry             │
             │  • ObjectQLPlugin             │
             │  • Protocol Implementation    │
             └───────────────┬───────────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
     ┌──────────────┐ ┌───────────┐ ┌──────────────┐
     │@objectstack/ │ │@objectstack│ │@objectstack/ │
     │  runtime     │ │  /core    │ │  spec        │
     └──────────────┘ └───────────┘ └──────────────┘
```

### 4.3 Kernel Bootstrap (Target)

```typescript
import { ObjectStackKernel } from '@objectstack/runtime';
import { ObjectQLPlugin } from '@objectstack/objectql';
import { InMemoryDriver } from '@objectstack/driver-memory';
import { HonoServerPlugin } from '@objectstack/plugin-hono-server';

// ObjectQL extension plugins (this project)
import { QueryPlugin } from '@objectql/plugin-query';
import { OptimizationsPlugin } from '@objectql/plugin-optimizations';
import { ValidatorPlugin } from '@objectql/plugin-validator';
import { FormulaPlugin } from '@objectql/plugin-formula';
import { SecurityPlugin } from '@objectql/plugin-security';
import { WorkflowPlugin } from '@objectql/plugin-workflow';
import { MultiTenancyPlugin } from '@objectql/plugin-multitenancy';

// App Manifests
import CrmApp from './apps/crm/objectstack.config';

(async () => {
  const kernel = new ObjectStackKernel([
    // Upstream core
    new ObjectQLPlugin(),           // Data engine + schema registry
    new InMemoryDriver(),           // Driver
    new HonoServerPlugin({ port: 3004 }),

    // ObjectQL extensions (this project)
    new QueryPlugin(),              // Query profiling & analysis
    new OptimizationsPlugin(),      // Connection pooling, LRU cache
    new ValidatorPlugin(),          // Metadata-driven validation
    new FormulaPlugin(),            // Computed fields
    new SecurityPlugin(),           // RBAC, FLS, RLS
    new WorkflowPlugin(),           // State machines
    new MultiTenancyPlugin(),       // Tenant isolation

    // Apps
    CrmApp,
  ]);

  await kernel.start();
})();
```

### 4.4 Simplified `@objectql/core` (Target)

After refactoring, `@objectql/core` becomes a **convenience facade**:

```typescript
// packages/foundation/core/src/index.ts (TARGET)

// ── Re-export upstream canonical engine ──
export {
  ObjectQL,
  ObjectRepository,
  ScopedContext,
  SchemaRegistry,
  ObjectQLPlugin,
  ObjectStackProtocolImplementation,
  MetadataFacade,
  computeFQN,
  parseFQN,
  RESERVED_NAMESPACES,
  DEFAULT_OWNER_PRIORITY,
  DEFAULT_EXTENDER_PRIORITY,
} from '@objectstack/objectql';

export type {
  ObjectContributor,
  ObjectQLHostContext,
  HookHandler,
  HookEntry,
  OperationContext,
  EngineMiddleware,
} from '@objectstack/objectql';

// ── Re-export types for API compatibility ──
export type { ObjectKernel } from '@objectstack/runtime';
export { QueryAST } from '@objectql/types';

// ── Convenience factory ──
export { createObjectQLKernel } from './kernel-factory';
```

```typescript
// packages/foundation/core/src/kernel-factory.ts (TARGET)

import { ObjectStackKernel } from '@objectstack/runtime';
import { ObjectQLPlugin } from '@objectstack/objectql';
import type { Plugin } from '@objectstack/core';

export interface ObjectQLKernelOptions {
  plugins?: Plugin[];
  // other convenience options
}

export function createObjectQLKernel(options: ObjectQLKernelOptions = {}) {
  return new ObjectStackKernel([
    new ObjectQLPlugin(),
    ...(options.plugins || []),
  ]);
}
```

---

## 5. Upstream Spec Changes Required

### 5.1 Overview

> **🟢 Status (2026-02-11): All upstream prerequisites are now met.**
> Evaluated against upstream commit [`33646a7`](https://github.com/objectstack-ai/spec/commit/33646a782cc5cb076e404a3178e84b8fd5fd7087) (2026-02-11).

The following upstream enhancements were identified as prerequisites for this refactoring. All have been implemented in the upstream `@objectstack/spec` repository:

| # | Change | Upstream Package | Type | Status |
|---|--------|-----------------|------|--------|
| 5.1.1 | Query Profiling Hook Extension Point | `@objectstack/objectql` | Feature | ✅ **Met** — Middleware API exists; `OperationContext` and `EngineMiddleware` types exported |
| 5.1.2 | Optimization Integration Hooks | `@objectstack/core` | Feature | ✅ **Met** — `replaceService<T>()` added to `PluginContext` interface and implemented |

> **Removed from scope:**
> - ~~Gateway / Protocol Router Extension Point~~ — The upstream server (`@objectstack/plugin-hono-server`) already provides the API layer; no gateway plugin is needed.
> - ~~AI Service Registry Interface~~ — AI model/prompt management is handled by a separate dedicated project.

### 5.1.1 Query Profiling Hook Extension Point

**Problem:** The local `QueryService` wraps driver CRUD calls with profiling (execution time, rows scanned, index usage). The upstream engine had no extension point for injecting profiling around driver calls.

**Resolution: ✅ Use existing middleware — no dedicated `QueryProfiler` interface needed.**

The upstream `ObjectQL` engine already provides `registerMiddleware(fn, options)` with onion-model execution, and exports both `OperationContext` and `EngineMiddleware` types for plugin authors. The local `QueryPlugin` can register a profiling middleware directly:

```typescript
// In QueryPlugin.init():
ql.registerMiddleware(async (opCtx, next) => {
  const start = performance.now();
  await next();
  const duration = performance.now() - start;
  this.analyzer.record(opCtx.object, opCtx.operation, duration);
});
```

**Upstream evidence:**
- `packages/objectql/src/engine.ts` — `registerMiddleware(fn: EngineMiddleware, options?: { object?: string }): void`
- `packages/objectql/src/index.ts` — `export type { OperationContext, EngineMiddleware } from './engine.js'`
- Merged via [PR #597](https://github.com/objectstack-ai/spec/pull/597) (2026-02-11)

### 5.1.2 Optimization Integration Hooks

**Problem:** The local `OptimizationsPlugin` wants to replace/enhance kernel internals (metadata registry, hook manager, connection pooling). The upstream kernel didn't expose these as replaceable services.

**Resolution: ✅ `replaceService<T>()` API added to upstream `PluginContext`.**

The upstream `@objectstack/core` now provides a first-class `replaceService` method:

```typescript
// PluginContext interface (packages/core/src/types.ts):
replaceService<T>(name: string, implementation: T): void;
```

This is fully implemented in:
- `ObjectKernel` (`packages/core/src/kernel.ts`) — validates service exists, replaces in both service map and `PluginLoader`
- `ObjectKernelBase` (`packages/core/src/kernel-base.ts`) — supports both `Map` and `IServiceRegistry` backends
- `PluginLoader` (`packages/core/src/plugin-loader.ts`) — `replaceService()` with existence validation

**Usage (in OptimizationsPlugin):**

```typescript
// In OptimizationsPlugin.start():
const existingMetadata = ctx.getService('metadata');
const optimizedMetadata = new OptimizedMetadataRegistry(existingMetadata);
ctx.replaceService('metadata', optimizedMetadata); // first-class API
```

**Upstream evidence:**
- Merged via commit [`b6b411e`](https://github.com/objectstack-ai/spec/commit/b6b411e8db38065ce1e0f95ba9b5b3ce26ab8bad) — "feat(core): add replaceService to PluginContext for optimization integration hooks"
- Validation fix via commit [`a5a5742`](https://github.com/objectstack-ai/spec/commit/a5a5742289d7cf3d0cadb59bcedc2507a0401e63) — "fix: add validation to PluginLoader.replaceService for consistency"

### 5.2 Summary of Upstream PRs

> **🟢 All upstream prerequisites are complete. No blocking PRs remain.**

| PR | Target Repo | Target Package | Description | Status |
|----|------------|----------------|-------------|--------|
| **PR-1** | objectstack-ai/spec | `@objectstack/objectql` | Export `OperationContext` and `EngineMiddleware` types for plugin authors | ✅ **Merged** (PR #597) |
| **PR-2** | objectstack-ai/spec | `@objectstack/core` | Add `replaceService` to `PluginContext` interface | ✅ **Merged** (commit `b6b411e`) |

Additionally, the upstream has added **16+ formal service contract interfaces** in `@objectstack/spec/contracts` (PRs [#599](https://github.com/objectstack-ai/spec/pull/599), [#600](https://github.com/objectstack-ai/spec/pull/600)), including `IMetadataService`, `IAuthService`, `IAnalyticsService`, `IAIService`, `IRealtimeService`, and more. These contracts further strengthen the plugin boundary for the local refactoring.

> **Removed from scope:**
> - ~~Add `gateway` to `CoreServiceName` enum~~ — Gateway plugin is not needed (upstream server handles API).
> - ~~Add AI `ModelRegistryEntry`/`PromptRegistryEntry` schemas~~ — AI is handled by a separate project.

---

## 6. Local Project Changes Required

### 6.1 Files to Remove (Duplicated with Upstream)

| File | Reason | Upstream Equivalent |
|------|--------|-------------------|
| `core/src/app.ts` | ObjectQL class duplicates upstream engine | `@objectstack/objectql` `ObjectQL` |
| `core/src/protocol.ts` | Protocol impl duplicates upstream | `@objectstack/objectql` `ObjectStackProtocolImplementation` |
| `core/src/repository.ts` | Repository duplicates upstream | `@objectstack/objectql` `ObjectRepository` |
| `core/src/query/filter-translator.ts` | Pass-through; format converged | Upstream inline logic |

### 6.2 Files to Move (Extracted to New Plugins)

| File | From | To | New Plugin |
|------|------|----|------------|
| `core/src/query/query-service.ts` | `@objectql/core` | `@objectql/plugin-query` | QueryPlugin |
| `core/src/query/query-builder.ts` | `@objectql/core` | `@objectql/plugin-query` | QueryPlugin |
| `core/src/query/query-analyzer.ts` | `@objectql/core` | `@objectql/plugin-query` | QueryPlugin |
| `core/src/optimizations/*` | `@objectql/core` | `@objectql/plugin-optimizations` | OptimizationsPlugin |

> **Not extracted (remain in `@objectql/core` as-is):**
> - `core/src/gateway.ts` — Gateway is not needed as a separate plugin; the upstream server handles API routing.
> - `core/src/ai/*` — AI registry is managed by a separate dedicated project.

### 6.3 Files to Modify

| File | Change |
|------|--------|
| `core/src/index.ts` | Replace local exports with re-exports from upstream + new plugins |
| `core/src/plugin.ts` | Simplify to thin orchestrator; remove CRUD bridge code |
| `core/package.json` | Remove direct deps on `@objectql/plugin-validator`, `@objectql/plugin-formula`; add new plugin deps |
| All existing plugins | No changes needed — they already use `RuntimePlugin` interface |
| All drivers | No changes needed — they implement `DriverInterface` |
| All protocols | No changes needed — they depend on `@objectql/types` |

### 6.4 New Plugin Contracts

#### QueryPlugin (`@objectql/plugin-query`)

```typescript
export class QueryPlugin implements RuntimePlugin {
  name = '@objectql/plugin-query';
  version = '4.2.0';

  async install(ctx: RuntimeContext): Promise<void> {
    const kernel = ctx.engine || ctx;
    const logger = kernel.logger || new ConsoleLogger({ name: this.name });

    // Create query service using upstream ObjectQL's driver access
    const queryService = new QueryService(kernel, logger);
    const queryAnalyzer = new QueryAnalyzer(kernel, logger);

    // Attach to kernel for consumer access
    (kernel as any).queryService = queryService;
    (kernel as any).queryAnalyzer = queryAnalyzer;

    // Register profiling middleware on the upstream ObjectQL engine
    const ql = kernel.getService?.('objectql') || kernel;
    if (ql.registerMiddleware) {
      ql.registerMiddleware(async (opCtx, next) => {
        const start = performance.now();
        await next();
        queryService.recordMetrics(opCtx, performance.now() - start);
      });
    }
  }
}
```

#### OptimizationsPlugin (`@objectql/plugin-optimizations`)

```typescript
export class OptimizationsPlugin implements RuntimePlugin {
  name = '@objectql/plugin-optimizations';
  version = '4.2.0';

  async install(ctx: RuntimeContext): Promise<void> {
    const kernel = ctx.engine || ctx;
    
    // Wrap metadata registry with optimized version
    const existingRegistry = kernel.metadata;
    if (existingRegistry) {
      const optimized = new OptimizedMetadataRegistry(existingRegistry);
      (kernel as any).metadata = optimized;
    }

    // Initialize connection pooling
    const connectionPool = new GlobalConnectionPool();
    (kernel as any).connectionPool = connectionPool;

    // Initialize query compiler (LRU cache)
    const queryCompiler = new QueryCompiler();
    (kernel as any).queryCompiler = queryCompiler;
  }
}
```

---

## 7. Decomposition Strategy

### 7.1 Extraction Order

The decomposition follows a **bottom-up** approach, extracting leaf modules first:

```
Phase 1: Extract optimizations            → @objectql/plugin-optimizations
Phase 2: Extract query service + analyzer → @objectql/plugin-query
Phase 3: Slim core (remove duplicates)    → @objectql/core (re-exports only)
```

> **Not extracted:** `gateway.ts` (upstream server handles API) and `ai/` (separate project) remain in `@objectql/core` as-is.

### 7.2 API Compatibility Strategy

To avoid breaking changes for existing consumers:

1. **Re-export everything:** `@objectql/core` re-exports all classes from their new locations
2. **Deprecation warnings:** Add `@deprecated` JSDoc tags to re-exports that move
3. **Subpath exports:** Add `@objectql/core/query` as subpath export mapping to new package
4. **Major version bump:** Schedule a v5.0 release where deprecated re-exports are removed

```typescript
// @objectql/core/index.ts (transition period)
/** @deprecated Import from '@objectql/plugin-query' instead */
export { QueryService } from '@objectql/plugin-query';
```

---

## 8. Migration Plan

### Phase 1: Foundation (Week 1) — No Breaking Changes

- [ ] Create `@objectql/plugin-optimizations` package; move `optimizations/` modules
- [ ] Add re-exports in `@objectql/core` for backward compatibility
- [ ] Update `pnpm-workspace.yaml` for new packages
- [ ] Verify all existing tests pass
- [ ] **Checkpoint:** No consumer code changes needed

### Phase 2: Query Extraction (Week 2)

- [ ] Create `@objectql/plugin-query` package; move `query/` modules
- [ ] Adapt `QueryService` to use upstream engine's middleware for profiling
- [ ] Remove `filter-translator.ts` (pass-through)
- [ ] Add re-exports in `@objectql/core`
- [ ] Update tests for new import paths
- [ ] **Checkpoint:** Query features work via plugin registration

### Phase 3: Core Slimming (Week 3)

- [x] ~~Submit upstream PRs (§5.2)~~ — All upstream prerequisites already merged (see §5)
- [ ] Remove `app.ts` (local ObjectQL class)
- [ ] Remove `protocol.ts` (duplicated)
- [ ] Remove `repository.ts` (duplicated)
- [ ] Simplify `plugin.ts` to thin orchestrator
- [ ] Update `index.ts` to re-export from upstream
- [ ] Add `kernel-factory.ts` convenience function
- [ ] Update all downstream consumers (protocols, drivers, examples)
- [ ] Run full test suite; fix any regressions
- [ ] **Checkpoint:** Core is <800 LOC, all tests green

### Phase 4: Upstream Integration (Week 4+)

- [x] ~~Merge upstream PRs~~ — All prerequisites merged as of 2026-02-11
- [ ] Update `@objectstack/*` dependency versions to include `replaceService` and type exports
- [ ] Remove local workarounds once upstream changes are released
- [ ] Tag v5.0 release

---

## 9. Risk Assessment

### 9.1 Risk Matrix

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| ~~**Upstream rejects PRs**~~ | ~~Medium~~ | ~~High~~ | ✅ **Eliminated** — All upstream PRs merged as of 2026-02-11 |
| **API breaking changes** | Medium | High | Phase approach with deprecated re-exports; v5.0 major release for removals |
| **Hook behavior difference** | Low | Medium | Comprehensive hook integration tests; compare local vs upstream execution order |
| **Performance regression** | Low | Medium | Benchmark before/after; `OptimizationsPlugin` preserves all existing optimizations |
| **Driver compatibility** | Low | Low | Drivers depend on `@objectql/types`, not `@objectql/core` — no driver changes needed |
| **Protocol test failures** | Medium | Medium | Protocol TCK tests run against new plugin architecture before merge |
| **CI pipeline breakage** | Low | Medium | Turbo build order updated for new packages; incremental validation |

### 9.2 Rollback Plan

Each phase produces independently deployable packages. If Phase N fails:
1. Revert the phase N changes
2. Keep Phase 1..N-1 results (they're additive, not destructive)
3. Re-exports in `@objectql/core` ensure consumers never break

### 9.3 Non-Goals

- **Not changing `@objectql/types`:** The types package remains the "Constitution" and is unaffected
- **Not changing existing plugins:** `plugin-security`, `plugin-validator`, etc. are already properly structured
- **Not changing drivers:** Driver packages depend on types, not core
- **Not removing `@objectql/core`:** The package persists as a convenience facade

---

## 10. Appendix

### 10.1 Upstream `@objectstack/objectql` Engine API Surface

```typescript
class ObjectQL implements IDataEngine {
  // Core Data Operations
  find(object: string, query?: DataEngineQueryOptions): Promise<any[]>
  findOne(objectName: string, query?: DataEngineQueryOptions): Promise<any>
  insert(object: string, data: any, options?: DataEngineInsertOptions): Promise<any>
  update(object: string, data: any, options?: DataEngineUpdateOptions): Promise<any>
  delete(object: string, options?: DataEngineDeleteOptions): Promise<any>
  count(object: string, query?: DataEngineCountOptions): Promise<number>
  aggregate(object: string, query: DataEngineAggregateOptions): Promise<any[]>
  execute(command: any, options?: Record<string, any>): Promise<any>
  
  // Driver Management
  registerDriver(driver: DriverInterface, isDefault?: boolean): void
  getDriver(object?: string): DriverInterface
  
  // Hook System (priority-based, per-object)
  registerHook(event: string, handler: HookHandler, options?: { object?: string | string[]; priority?: number }): void
  triggerHooks(event: string, context: HookContext): Promise<void>
  
  // Middleware (onion model)
  registerMiddleware(fn: EngineMiddleware, options?: { object?: string }): void
  
  // App / Plugin Loading
  use(manifestPart: any, runtimePart?: any): Promise<void>
  registerApp(manifest: any): void
  
  // Schema Registry
  get registry(): typeof SchemaRegistry
  
  // Context Factory
  createContext(ctx: Partial<ExecutionContext>): ScopedContext
  
  // Status
  getStatus(): ServiceStatus
}
```

### 10.2 Upstream `@objectstack/objectql` Plugin API Surface

```typescript
class ObjectQLPlugin implements Plugin {
  name = 'com.objectstack.engine.objectql';
  
  // Lifecycle
  init(ctx: PluginContext): Promise<void>   // Register services: objectql, metadata, data, protocol
  start(ctx: PluginContext): Promise<void>  // Discover drivers, apps; register audit hooks & tenant middleware
  
  // Auto-registered hooks:
  // - beforeInsert: auto-stamp createdBy/modifiedBy/created_at/modified_at/space_id
  // - beforeUpdate: auto-stamp modifiedBy/modified_at
  // - beforeUpdate: auto-fetch previousData
  // - beforeDelete: auto-fetch previousData
  
  // Auto-registered middleware:
  // - Tenant isolation (inject space_id filter for multi-tenant ops)
}
```

### 10.3 Current Local `@objectql/core` Public API

```typescript
// Classes
export class ObjectQL implements IObjectQL           // → REMOVE (use upstream)
export class ObjectQLPlugin implements RuntimePlugin // → SIMPLIFY (thin orchestrator)
export class ObjectRepository                        // → REMOVE (use upstream)
export class ObjectGateway                           // → KEEP in core (upstream server handles API)
export class QueryService                            // → MOVE to plugin-query
export class QueryBuilder                            // → MOVE to plugin-query
export class QueryAnalyzer                           // → MOVE to plugin-query
export class FilterTranslator                        // → REMOVE (pass-through)
export class ObjectStackProtocolImplementation       // → REMOVE (use upstream)

// Optimizations
export class CompiledHookManager                     // → MOVE to plugin-optimizations
export class DependencyGraph                         // → MOVE to plugin-optimizations
export class GlobalConnectionPool                    // → MOVE to plugin-optimizations
export class LazyMetadataLoader                      // → MOVE to plugin-optimizations
export class OptimizedMetadataRegistry               // → MOVE to plugin-optimizations
export class OptimizedValidationEngine               // → MOVE to plugin-optimizations
export class QueryCompiler                           // → MOVE to plugin-optimizations
export class SQLQueryOptimizer                       // → MOVE to plugin-optimizations

// AI (kept in core — separate AI project handles model/prompt management)
export class InMemoryModelRegistry                   // → KEEP in core
export class InMemoryPromptRegistry                  // → KEEP in core
export function createDefaultAiRegistry()            // → KEEP in core

// Re-exports (remain)
export { ObjectKernel } from '@objectstack/runtime'
export { SchemaRegistry, computeFQN, parseFQN, ... } from '@objectstack/objectql'
export type { DriverInterface, StateMachineConfig, ... } // spec types
```

### 10.4 Glossary

| Term | Definition |
|------|-----------|
| **ObjectKernel** | The microkernel from `@objectstack/runtime` that manages plugin lifecycles |
| **RuntimePlugin** | Interface for plugins: `install()`, `onStart()`, `onStop()` |
| **Plugin** (upstream) | Interface from `@objectstack/core`: `init()`, `start()`, `destroy()` |
| **IDataEngine** | Interface from `@objectstack/core` defining CRUD operations |
| **SchemaRegistry** | Global singleton managing object schemas with FQN support |
| **FQN** | Fully Qualified Name — namespaced identifier for objects (e.g., `com.acme.crm.user`) |
| **QueryAST** | Abstract Syntax Tree for queries (from `@objectstack/spec/data`) |
| **HookContext** | Context object passed to lifecycle hooks (from `@objectstack/spec/data`) |
| **OperationContext** | Context for middleware chain (operation, AST, result) — exported from `@objectstack/objectql` |
| **EngineMiddleware** | Onion-model middleware type for data operations — exported from `@objectstack/objectql` |
| **CoreServiceName** | Enum of recognized kernel services (metadata, data, analytics, auth, etc.) |
| **replaceService** | `PluginContext` method for swapping kernel service implementations (added upstream for §5.1.2) |

### 10.5 Upstream Compliance Verification (2026-02-11)

Evaluated against upstream `@objectstack/spec` commit [`33646a7`](https://github.com/objectstack-ai/spec/commit/33646a782cc5cb076e404a3178e84b8fd5fd7087).

#### Exports Verification (`@objectstack/objectql`)

The following types and classes are confirmed exported from `packages/objectql/src/index.ts`:

| Export | Type | Required By |
|--------|------|-------------|
| `ObjectQL` | Class | §4.4 (re-export as canonical engine) |
| `ObjectRepository` | Class | §4.4 (re-export) |
| `ScopedContext` | Class | §4.4 (re-export) |
| `SchemaRegistry` | Class | §4.4 (re-export) |
| `ObjectQLPlugin` | Class | §4.3 (kernel bootstrap) |
| `ObjectStackProtocolImplementation` | Class | §4.4 (re-export) |
| `MetadataFacade` | Class | §4.4 (re-export) |
| `computeFQN`, `parseFQN` | Function | §4.4 (re-export) |
| `RESERVED_NAMESPACES`, `DEFAULT_OWNER_PRIORITY`, `DEFAULT_EXTENDER_PRIORITY` | Constant | §4.4 (re-export) |
| `ObjectContributor` | Type | §4.4 (re-export) |
| `ObjectQLHostContext` | Type | §4.4 (re-export) |
| `HookHandler`, `HookEntry` | Type | §4.4 (re-export) |
| `OperationContext` | Type | §5.1.1 (query profiling middleware) |
| `EngineMiddleware` | Type | §5.1.1 (query profiling middleware) |

#### `PluginContext` API Verification (`@objectstack/core`)

The `PluginContext` interface in `packages/core/src/types.ts` exposes:

| Method | Signature | Required By |
|--------|-----------|-------------|
| `registerService` | `(name: string, service: any): void` | Standard plugin registration |
| `getService` | `<T>(name: string): T` | Service discovery |
| `replaceService` | `<T>(name: string, implementation: T): void` | §5.1.2 (optimization hooks) |
| `getServices` | `(): Map<string, any>` | Service enumeration |
| `hook` | `(name: string, handler: Function): void` | Hook registration |
| `trigger` | `(name: string, ...args: any[]): Promise<void>` | Hook triggering |
| `logger` | `Logger` | Logging |
| `getKernel` | `(): ObjectKernel` | Advanced use cases |

#### Engine Middleware Verification (`@objectstack/objectql`)

The `ObjectQL` engine in `packages/objectql/src/engine.ts` confirms:
- `registerMiddleware(fn: EngineMiddleware, options?: { object?: string }): void` — onion-model middleware
- `registerHook(event, handler, options)` — priority-based, per-object hooks
- `triggerHooks(event, context)` — hook execution with object matching
- All CRUD operations execute through `executeWithMiddleware()` pipeline

---

**End of Document**
