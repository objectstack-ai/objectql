# ObjectQL Work Plan — 2026 Q3: Edge Runtime & Offline Sync

> Created: 2026-02-08 | Status: **Planned** | Target: 2026-07 — 2026-09  
> Current Version: **4.2.0** | Prerequisite: Q1 Phase 2 (WASM Drivers), Q2 (Protocol Maturity)  
> Parent Document: [WORK_PLAN_2026_Q1_P2.md](./WORK_PLAN_2026_Q1_P2.md)

---

## Table of Contents

- [Overview](#overview)
- [Part A: Edge Runtime Support](#part-a-edge-runtime-support)
  - [Architecture](#architecture)
  - [E-1: Cloudflare Workers Adapter](#e-1-cloudflare-workers-adapter)
  - [E-2: Deno Deploy Validation](#e-2-deno-deploy-validation)
  - [E-3: Vercel Edge Validation](#e-3-vercel-edge-validation)
  - [E-4: Bun Compatibility](#e-4-bun-compatibility)
  - [E-5: Edge Documentation](#e-5-edge-documentation)
- [Part B: Offline-First Sync Protocol](#part-b-offline-first-sync-protocol)
  - [Sync Architecture](#sync-architecture)
  - [SY-1: Sync Protocol Specification](#sy-1-sync-protocol-specification)
  - [SY-2: Client-Side Change Tracking](#sy-2-client-side-change-tracking)
  - [SY-3: Server Sync Endpoint](#sy-3-server-sync-endpoint)
  - [SY-4: Conflict Resolution Engine](#sy-4-conflict-resolution-engine)
  - [SY-5: Integration Tests](#sy-5-integration-tests)
  - [SY-6: Documentation & Example PWA](#sy-6-documentation--example-pwa)
- [Type Contracts (Defined)](#type-contracts-defined)
- [Timeline](#timeline)
- [Success Criteria](#success-criteria)
- [Architecture Decisions](#architecture-decisions)

---

## Overview

ObjectQL Core is **universal** — zero Node.js native modules in `@objectql/core` or `@objectql/types`. Combined with browser WASM drivers (Q1) and protocol maturity (Q2), Q3 completes the platform story:

1. **Edge Runtime Support** — Validate and adapt ObjectQL for Cloudflare Workers, Deno Deploy, Vercel Edge, and Bun.
2. **Offline-First Sync** — A bidirectional sync protocol between client-side WASM drivers and server-side data stores.

**Prerequisites:**
- ✅ `@objectql/core` — Universal, no Node.js natives
- ✅ `@objectql/driver-memory` — Universal, runs in all environments
- 🔄 `@objectql/driver-sqlite-wasm` — Browser WASM driver (Q1 P2)
- 🔄 `@objectql/driver-pg-wasm` — Browser WASM driver (Q1 P2)
- 🔄 Protocol compliance ≥ 95% (Q2)

---

## Part A: Edge Runtime Support

> Duration: **4 weeks** | Priority: P0

### Architecture

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

**Key Principle: No new core changes.** Each edge adapter is a thin wrapper that:
1. Detects the runtime environment
2. Binds platform-native storage to an ObjectQL driver
3. Adapts the request/response lifecycle (stateless, request-scoped connections)

### Edge Runtime Matrix

| Runtime | Driver Options | Storage | Constraints |
|---------|---------------|---------|-------------|
| **Cloudflare Workers** | `driver-sqlite-wasm` (D1), `driver-memory` | D1, KV, R2 | 30s CPU, 128MB RAM |
| **Deno Deploy** | `driver-sql` (Deno Postgres), `driver-memory` | Deno KV, Deno Postgres | 50s wall-clock |
| **Vercel Edge** | `driver-sdk` (remote), `driver-memory` | External only (Vercel KV/Postgres via SDK) | 25s, 4MB body |
| **Bun** | All Node.js drivers | Full Node.js compat | No significant limits |

### E-1: Cloudflare Workers Adapter

| Field | Value |
|-------|-------|
| **Package** | `packages/adapters/cloudflare` |
| **NPM Name** | `@objectql/adapter-cloudflare` |
| **Priority** | P0 — Primary edge target |
| **Est.** | 2 weeks |

**Scope:**

| Task | Description | Est. |
|------|-------------|------|
| **E-1.1** | Package scaffolding (`package.json`, `tsconfig.json`, `wrangler.toml` template) | 2h |
| **E-1.2** | `CloudflareAdapter` class — request-scoped ObjectQL initialization | 4h |
| **E-1.3** | D1 driver binding — wrap Cloudflare D1 binding as SQLite-compatible Knex client | 8h |
| **E-1.4** | KV cache integration — optional query result caching via Cloudflare KV | 4h |
| **E-1.5** | Hono integration — `createObjectQLHandler(env)` factory for Hono on Workers | 4h |
| **E-1.6** | Environment detection utility (`isCloudflareWorker()`) | 1h |
| **E-1.7** | Unit tests (adapter initialization, D1 binding, request lifecycle) | 8h |
| **E-1.8** | Integration test with Miniflare (local Workers simulator) | 8h |
| **E-1.9** | Example Worker (`examples/edge/cloudflare-worker/`) | 4h |

**Config Interface:**
```typescript
export interface CloudflareAdapterConfig {
    /** D1 database binding name from wrangler.toml. Default: 'DB' */
    d1Binding?: string;
    /** Optional KV namespace for query cache. Default: undefined (no cache) */
    kvCacheBinding?: string;
    /** Cache TTL in seconds for KV-cached queries. Default: 60 */
    cacheTtl?: number;
}
```

**Key Decisions:**
1. D1 binding wraps the native `D1Database` API — no WASM needed (D1 is server-side SQLite).
2. The adapter creates a fresh ObjectQL instance per request (stateless).
3. Plugins (security, validator) are instantiated once, reused across requests.

### E-2: Deno Deploy Validation

| Field | Value |
|-------|-------|
| **Package** | `packages/adapters/deno` |
| **NPM Name** | `@objectql/adapter-deno` |
| **Priority** | P1 |
| **Est.** | 1 week |

**Scope:**

| Task | Description | Est. |
|------|-------------|------|
| **E-2.1** | Package scaffolding (Deno-compatible `deno.json` + npm compat) | 2h |
| **E-2.2** | `DenoAdapter` class — Deno.serve integration | 4h |
| **E-2.3** | Deno Postgres driver validation — verify `driver-sql` with `deno-postgres` client | 4h |
| **E-2.4** | Deno KV exploration — optional alternative to PostgreSQL for simple use cases | 4h |
| **E-2.5** | Unit tests (Deno test runner) | 4h |
| **E-2.6** | Example (`examples/edge/deno-deploy/`) | 4h |

**Key Decisions:**
1. Deno has excellent Node.js compatibility — `@objectql/core` should work without modifications.
2. Primary driver: `@objectql/driver-sql` with Deno-native PostgreSQL client.
3. No Deno-specific driver needed; validation focuses on compatibility testing.

### E-3: Vercel Edge Validation

| Field | Value |
|-------|-------|
| **Package** | `packages/adapters/vercel-edge` |
| **NPM Name** | `@objectql/adapter-vercel-edge` |
| **Priority** | P1 |
| **Est.** | 3 days |

**Scope:**

| Task | Description | Est. |
|------|-------------|------|
| **E-3.1** | Package scaffolding | 1h |
| **E-3.2** | `VercelEdgeAdapter` — Next.js Edge Route handler factory | 4h |
| **E-3.3** | Validate `driver-sdk` and `driver-memory` in Edge Runtime | 4h |
| **E-3.4** | Example Next.js app (`examples/edge/vercel-edge/`) | 4h |
| **E-3.5** | Unit tests | 4h |

**Key Decisions:**
1. Vercel Edge has no persistent storage — use `driver-sdk` to proxy to a remote ObjectQL server.
2. `driver-memory` is valid for read-heavy, cache-style workloads.
3. No custom driver needed.

### E-4: Bun Compatibility

| Field | Value |
|-------|-------|
| **Package** | No new package — compatibility validated in existing drivers |
| **Priority** | P2 |
| **Est.** | 3 days |

**Scope:**

| Task | Description | Est. |
|------|-------------|------|
| **E-4.1** | Run full driver TCK suite under Bun runtime | 4h |
| **E-4.2** | Fix any Bun-specific incompatibilities in core/drivers | 8h |
| **E-4.3** | Validate `bun:sqlite` as alternative to `better-sqlite3` | 4h |
| **E-4.4** | Example (`examples/edge/bun/`) | 2h |
| **E-4.5** | Document Bun-specific notes | 1h |

**Key Decisions:**
1. Bun is a drop-in Node.js replacement — no adapter package needed.
2. `bun:sqlite` is a candidate for zero-dependency SQLite on Bun.
3. Focus: validate, don't rewrite.

### E-5: Edge Documentation

| Task | Description | Est. |
|------|-------------|------|
| **E-5.1** | `content/docs/server/edge.mdx` — Edge runtime overview and comparison | 4h |
| **E-5.2** | `content/docs/server/cloudflare.mdx` — Cloudflare Workers guide | 4h |
| **E-5.3** | `content/docs/server/deno.mdx` — Deno Deploy guide | 2h |
| **E-5.4** | `content/docs/server/vercel-edge.mdx` — Vercel Edge guide | 2h |
| **E-5.5** | `content/docs/server/bun.mdx` — Bun compatibility guide | 2h |
| **E-5.6** | Update `content/docs/server/meta.json` — Add edge runtime pages | 1h |

---

## Part B: Offline-First Sync Protocol

> Duration: **6 weeks** | Priority: P0

### Sync Architecture

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
│  │  4. Return: mutation results + server changes since       │   │
│  │            client's last checkpoint                       │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Change Log (Server-side)                                 │   │
│  │  Append-only record of all mutations + server version     │   │
│  │  Used to compute delta for each client                    │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

**Protocol Flow:**

1. **Online**: Client reads/writes directly via `driver-sdk` or WASM driver (no log).
2. **Offline**: Client writes to local WASM driver + appends to mutation log.
3. **Reconnect**: Sync engine pushes mutation log to server, receives server delta.
4. **Conflict**: Server detects conflicting versions, applies configured strategy.
5. **Resolution**: Client applies server delta, clears acknowledged mutations from log.

### SY-1: Sync Protocol Specification

| Field | Value |
|-------|-------|
| **Deliverable** | `@objectstack/spec` — Sync Protocol RFC |
| **Priority** | P0 — Must be defined before implementation |
| **Est.** | 1 week |

**Scope:**

| Task | Description | Est. |
|------|-------------|------|
| **SY-1.1** | Define wire format: `SyncPushRequest`, `SyncPushResponse` (JSON) | 4h |
| **SY-1.2** | Define `MutationLogEntry` schema (Zod) | 2h |
| **SY-1.3** | Define `SyncConflict` schema and resolution strategies | 4h |
| **SY-1.4** | Define checkpoint format (opaque server-assigned string) | 2h |
| **SY-1.5** | Define `SyncConfig` YAML schema (per-object opt-in) | 2h |
| **SY-1.6** | RFC document with protocol versioning strategy | 8h |

**Protocol Versioning:**
```
POST /api/sync HTTP/1.1
Content-Type: application/json
X-ObjectQL-Sync-Version: 1
```

### SY-2: Client-Side Change Tracking

| Field | Value |
|-------|-------|
| **Package** | `packages/foundation/plugin-sync` |
| **NPM Name** | `@objectql/plugin-sync` |
| **Environment** | Universal (Browser + Node.js for testing) |
| **Priority** | P0 |
| **Est.** | 2 weeks |

**Scope:**

| Task | Description | Est. |
|------|-------------|------|
| **SY-2.1** | Package scaffolding (same structure as `plugin-validator`) | 1h |
| **SY-2.2** | `MutationLogger` — append-only mutation log backed by driver storage | 8h |
| **SY-2.3** | `SyncPlugin` implements `RuntimePlugin` — hooks into `afterCreate`, `afterUpdate`, `afterDelete` to record mutations | 4h |
| **SY-2.4** | `SyncEngine` — orchestrates push/pull cycle | 8h |
| **SY-2.5** | Online/offline detection (Navigator.onLine + heartbeat) | 4h |
| **SY-2.6** | Debounced batch sync (configurable via `SyncConfig.debounce_ms`) | 4h |
| **SY-2.7** | Client-side merge — apply server delta to local WASM driver | 8h |
| **SY-2.8** | Unit tests (`MutationLogger`, `SyncEngine`, merge logic) | 8h |
| **SY-2.9** | Mutation log compaction (remove acknowledged entries) | 4h |

**Directory Structure:**
```
packages/foundation/plugin-sync/
  package.json
  tsconfig.json
  vitest.config.ts
  src/
    index.ts                    # Public exports
    sync-plugin.ts              # RuntimePlugin implementation
    engine/
      sync-engine.ts            # Push/pull orchestration
      mutation-logger.ts        # Append-only mutation log
      merge-engine.ts           # Apply server delta to local store
      connectivity.ts           # Online/offline detection
    types.ts                    # Re-exports from @objectql/types/sync
  __tests__/
    mutation-logger.spec.ts
    sync-engine.spec.ts
    merge-engine.spec.ts
    sync-plugin.spec.ts
```

**Config Interface:**
```typescript
export interface SyncPluginConfig {
    /** Server URL for sync endpoint. Required. */
    serverUrl: string;

    /** Authentication token provider */
    getAuthToken?: () => Promise<string>;

    /** Sync interval in milliseconds when online. Default: 30000 (30s) */
    syncInterval?: number;

    /** Maximum retry attempts for failed sync. Default: 5 */
    maxRetries?: number;

    /** Callback when conflicts require manual resolution */
    onConflict?: (conflicts: SyncConflict[]) => Promise<Record<string, Record<string, unknown>>>;
}
```

### SY-3: Server Sync Endpoint

| Field | Value |
|-------|-------|
| **Package** | `packages/protocols/sync` |
| **NPM Name** | `@objectql/protocol-sync` |
| **Environment** | Node.js (server-side) |
| **Priority** | P0 |
| **Est.** | 2 weeks |

**Scope:**

| Task | Description | Est. |
|------|-------------|------|
| **SY-3.1** | Package scaffolding | 1h |
| **SY-3.2** | `SyncProtocolHandler` — HTTP POST handler for `/api/sync` | 8h |
| **SY-3.3** | Server-side change log — record all mutations with server version | 8h |
| **SY-3.4** | Delta computation — compute changes since client's checkpoint | 8h |
| **SY-3.5** | Mutation validation — apply client mutations through ObjectQL Core (hooks, security, validation) | 4h |
| **SY-3.6** | Optimistic concurrency — reject mutations with stale `baseVersion` | 4h |
| **SY-3.7** | Checkpoint management — generate opaque checkpoint tokens | 4h |
| **SY-3.8** | Rate limiting and request size validation | 4h |
| **SY-3.9** | Unit tests | 8h |
| **SY-3.10** | Integration with Hono server plugin | 4h |

**Directory Structure:**
```
packages/protocols/sync/
  package.json
  tsconfig.json
  vitest.config.ts
  src/
    index.ts                    # Public exports
    sync-handler.ts             # HTTP handler
    change-log.ts               # Server-side change log
    delta-computer.ts           # Compute delta since checkpoint
    version-manager.ts          # Server version tracking
  __tests__/
    sync-handler.spec.ts
    change-log.spec.ts
    delta-computer.spec.ts
```

**Server-Side Change Log Schema:**
```sql
-- Auto-created by ObjectQL when sync is enabled for any object
CREATE TABLE _objectql_change_log (
    id          BIGINT PRIMARY KEY AUTO_INCREMENT,
    object_name VARCHAR(255) NOT NULL,
    record_id   VARCHAR(255) NOT NULL,
    operation   VARCHAR(10) NOT NULL,  -- 'create' | 'update' | 'delete'
    data        JSON,
    version     BIGINT NOT NULL,
    client_id   VARCHAR(255),
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_object_version (object_name, version),
    INDEX idx_created_at (created_at)
);
```

### SY-4: Conflict Resolution Engine

| Field | Value |
|-------|-------|
| **Location** | `packages/foundation/plugin-sync/src/engine/conflict-resolver.ts` |
| **Priority** | P0 |
| **Est.** | 1 week |

**Scope:**

| Task | Description | Est. |
|------|-------------|------|
| **SY-4.1** | `LastWriteWinsResolver` — timestamp-based resolution | 4h |
| **SY-4.2** | `CrdtResolver` — field-level CRDT merge (LWW-Register per field) | 8h |
| **SY-4.3** | `ManualResolver` — flag conflicts for application-level resolution | 4h |
| **SY-4.4** | `ConflictResolverFactory` — select resolver based on `SyncConfig.strategy` | 2h |
| **SY-4.5** | Conflict audit trail — record conflict details for debugging | 4h |
| **SY-4.6** | Unit tests (all three strategies) | 8h |

**Conflict Resolution Strategies:**

| Strategy | Behavior | Use Case |
|----------|----------|----------|
| `last-write-wins` | Most recent timestamp wins. Per-record granularity. | Simple apps, low conflict probability |
| `crdt` | LWW-Register per field. Fields merge independently. No conflicts. | Collaborative editing, high concurrency |
| `manual` | Conflicts flagged to application via `onConflict` callback. | Business-critical data requiring human review |

**CRDT Implementation (LWW-Register):**
```typescript
// Each field carries a (value, timestamp) pair.
// During merge, the field with the latest timestamp wins.
interface LWWField {
    value: unknown;
    timestamp: string;  // ISO 8601
}

// Merge: for each conflicting field, compare timestamps
function mergeLWW(clientField: LWWField, serverField: LWWField): LWWField {
    return clientField.timestamp > serverField.timestamp ? clientField : serverField;
}
```

### SY-5: Integration Tests

| Task | Description | Est. |
|------|-------------|------|
| **SY-5.1** | End-to-end test: offline create → reconnect → sync → verify server | 4h |
| **SY-5.2** | End-to-end test: concurrent edits → conflict → resolution | 4h |
| **SY-5.3** | End-to-end test: multi-client sync (3 clients, 1 server) | 8h |
| **SY-5.4** | Performance test: 1000 mutations batch sync | 4h |
| **SY-5.5** | Stress test: network interruption during sync (retry/resume) | 4h |

### SY-6: Documentation & Example PWA

| Task | Description | Est. |
|------|-------------|------|
| **SY-6.1** | `content/docs/data-access/offline-sync.mdx` — Sync protocol guide | 4h |
| **SY-6.2** | `content/docs/data-access/conflict-resolution.mdx` — Strategy comparison | 4h |
| **SY-6.3** | Example PWA (`examples/integrations/offline-pwa/`) — Todo app with offline sync | 8h |
| **SY-6.4** | Update `content/docs/data-access/meta.json` | 1h |
| **SY-6.5** | Update `content/docs/drivers/` — Note sync compatibility per driver | 2h |

---

## Type Contracts (Defined)

> Step 1 of the 4-Step Atomic Workflow: **Define the Type (Contract)**

The following types have been added to `@objectql/types` as part of this work plan:

### `packages/foundation/types/src/sync.ts`

| Type | Purpose |
|------|---------|
| `SyncStrategy` | `'last-write-wins' \| 'crdt' \| 'manual'` |
| `SyncConfig` | Per-object sync configuration (YAML `sync:` key) |
| `MutationOperation` | `'create' \| 'update' \| 'delete'` |
| `MutationLogEntry` | Client-side mutation log record |
| `SyncConflict` | Server-detected merge conflict descriptor |
| `SyncMutationResult` | Per-mutation sync outcome (applied/conflict/rejected) |
| `SyncPushRequest` | Client → Server sync payload |
| `SyncPushResponse` | Server → Client sync response |
| `SyncServerChange` | Individual server-side change in delta |
| `SyncEndpointConfig` | Server sync endpoint configuration |

### `packages/foundation/types/src/edge.ts`

| Type | Purpose |
|------|---------|
| `EdgeRuntime` | Supported edge runtime discriminator |
| `EdgeDriverBinding` | Maps ObjectQL driver to edge-platform storage |
| `EdgeAdapterConfig` | Edge adapter configuration |
| `EdgeCapabilities` | Platform API availability declaration |
| `EDGE_CAPABILITIES` | Predefined capability profiles per runtime |

### Updated Types

| File | Change |
|------|--------|
| `object.ts` | Added `sync?: SyncConfig` to `ObjectConfig` |
| `driver.ts` | Added `mutationLog?: boolean` and `changeTracking?: boolean` to `DriverCapabilities` |
| `index.ts` | Added `export * from './sync'` and `export * from './edge'` |

---

## Timeline

| Week | Phase | Milestone |
|------|-------|-----------|
| **W1** | Edge | Cloudflare Workers adapter scaffolding + D1 binding |
| **W2** | Edge | Cloudflare Workers integration tests + Hono handler |
| **W3** | Edge | Deno Deploy + Vercel Edge validation |
| **W4** | Edge | Bun compatibility + Edge documentation |
| **W5** | Sync | Sync protocol spec (SY-1) + MutationLogger (SY-2 start) |
| **W6** | Sync | SyncPlugin + SyncEngine (SY-2 complete) |
| **W7** | Sync | Server sync endpoint (SY-3) |
| **W8** | Sync | Server change log + delta computation (SY-3 complete) |
| **W9** | Sync | Conflict resolution engine (SY-4) |
| **W10** | Sync | Integration tests (SY-5) + Documentation + Example PWA (SY-6) |

---

## Success Criteria

### Part A: Edge Runtime

- [ ] Cloudflare Workers example deploys and passes CRUD operations via D1
- [ ] Deno Deploy example serves ObjectQL queries via Deno Postgres
- [ ] Vercel Edge example proxies queries via `driver-sdk`
- [ ] Bun passes full driver TCK suite for `driver-sql` and `driver-memory`
- [ ] Edge documentation published (`content/docs/server/edge.mdx` + per-runtime guides)
- [ ] Zero changes to `@objectql/core` — all adaptation is in adapter packages

### Part B: Offline-First Sync

- [ ] Client-side mutation log records offline operations correctly
- [ ] Sync engine pushes mutations and receives server delta on reconnect
- [ ] Last-write-wins resolution works for concurrent field edits
- [ ] CRDT (LWW-Register) resolution merges fields without conflicts
- [ ] Manual resolution callback is invoked for flagged conflicts
- [ ] Server-side change log retains 30 days of history by default
- [ ] Example PWA works offline, syncs on reconnect, resolves conflicts
- [ ] Security: All sync mutations pass through ObjectQL hooks (RBAC, validation)
- [ ] Performance: 1000-mutation batch sync completes in < 5 seconds
- [ ] Sync protocol versioned (`X-ObjectQL-Sync-Version: 1`) for future evolution

---

## Architecture Decisions

### ADR-005: Edge adapters as separate packages

**Context:** ObjectQL Core is already universal. Edge runtime support requires platform-specific binding code (D1, Deno KV, etc.) that should not pollute the core.

**Decision:** Each edge runtime gets its own adapter package under `packages/adapters/`. These packages depend on `@objectql/core` and `@objectql/types` but introduce no changes to them.

**Rationale:**
- Keeps core universal and dependency-free
- Adapter packages can version independently if needed
- Users only install the adapter for their target platform
- Platform-specific APIs (D1, Deno.serve) are isolated

**Status:** Accepted.

### ADR-006: Sync protocol as opt-in per object

**Context:** Not all objects need offline sync. Global sync would create unnecessary overhead and complexity.

**Decision:** Sync is configured per-object via the `sync` key in `*.object.yml`. Objects without `sync.enabled: true` are not tracked.

**Rationale:**
- Minimizes performance impact (no mutation logging for non-synced objects)
- Gives developers explicit control over sync behavior
- Conflict resolution strategy can vary per object
- Aligns with ObjectQL's metadata-driven philosophy

**Status:** Accepted.

### ADR-007: Checkpoint-based sync (not timestamp-based)

**Context:** Timestamp-based sync requires synchronized clocks between client and server. Clock skew causes data loss.

**Decision:** Use server-assigned opaque checkpoint tokens. The server generates a checkpoint after each sync, the client stores it, and sends it back on the next sync. The server computes the delta since that checkpoint.

**Rationale:**
- No clock synchronization required
- Server has full control over delta computation
- Checkpoints are tamper-resistant (server-generated)
- Compatible with both SQL (sequence numbers) and NoSQL (opaque tokens) backends

**Status:** Accepted.

### ADR-008: Sync mutations go through full ObjectQL hook pipeline

**Context:** Offline mutations could bypass server-side security and validation if applied directly to the database.

**Decision:** All client mutations received via the sync endpoint are replayed through the standard ObjectQL Repository → Hook → Driver pipeline. Security (`plugin-security`), validation (`plugin-validator`), and workflow (`plugin-workflow`) all apply.

**Rationale:**
- No security bypass — RBAC/FLS/RLS enforced even for offline edits
- Validation rules catch invalid data before persistence
- State machine transitions are validated by workflow engine
- Audit trail is maintained for all mutations

**Status:** Accepted.

### ADR-009: CRDT strategy uses LWW-Register per field

**Context:** Full CRDT implementations (e.g., Yjs, Automerge) are complex and require special data structures. ObjectQL operates on structured records, not collaborative text.

**Decision:** Use LWW-Register (Last-Writer-Wins Register) at the field level. Each field independently resolves to the most recent write. This is a well-understood CRDT that works for structured data.

**Rationale:**
- Simple to implement and reason about
- No special data structures needed — works with existing drivers
- Field-level granularity avoids whole-record conflicts
- Well-suited for form-based applications (most ObjectQL use cases)
- Can upgrade to more sophisticated CRDTs (e.g., counters, sets) in future versions

**Status:** Accepted.

---

## New Package Summary

| Package | NPM Name | Location | Environment |
|---------|----------|----------|-------------|
| `@objectql/adapter-cloudflare` | `@objectql/adapter-cloudflare` | `packages/adapters/cloudflare` | Cloudflare Workers |
| `@objectql/adapter-deno` | `@objectql/adapter-deno` | `packages/adapters/deno` | Deno Deploy |
| `@objectql/adapter-vercel-edge` | `@objectql/adapter-vercel-edge` | `packages/adapters/vercel-edge` | Vercel Edge |
| `@objectql/plugin-sync` | `@objectql/plugin-sync` | `packages/foundation/plugin-sync` | Universal |
| `@objectql/protocol-sync` | `@objectql/protocol-sync` | `packages/protocols/sync` | Node.js |
