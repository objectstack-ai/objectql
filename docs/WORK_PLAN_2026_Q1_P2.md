# ObjectQL Work Plan — 2026 Q1 Phase 2 (Browser WASM Drivers)

> Created: 2026-02-08 | Status: **Active**  
> Predecessor: Q1 Phase 1 (Build Chain, Governance, Tests, RBAC) — **Completed**  
> Focus: Browser-native SQL drivers via WebAssembly

---

## Context & Motivation

ObjectQL's core principle is **"Compiler, Not ORM"** — it compiles QueryAST into optimized, dialect-specific SQL. All server-side SQL databases (PostgreSQL, MySQL, SQLite) are already supported through `@objectql/driver-sql` + Knex.

However, **browser environments have no SQL driver**. The recently removed `driver-localstorage` was a `driver-memory` wrapper with 5MB localStorage persistence — fundamentally unsuitable for production browser apps.

Modern browsers now support:
- **WebAssembly** — run full database engines at near-native speed
- **OPFS** (Origin Private File System) — GB-scale persistent storage
- **SharedArrayBuffer** — cross-tab database access

This plan adds two WASM-based SQL drivers that **reuse the existing Knex compilation pipeline**, bringing the full ObjectQL query engine to browsers.

---

## P0 — `@objectql/driver-sqlite-wasm`

| Field | Value |
|-------|-------|
| **Package** | `packages/drivers/sqlite-wasm` |
| **NPM Name** | `@objectql/driver-sqlite-wasm` |
| **Priority** | P0 — Primary browser driver |
| **Underlying Library** | [wa-sqlite](https://github.com/nicolo-ribaudo/wa-sqlite) (switchable, not exposed in public API) |
| **Target Environments** | Browsers with WASM support (95%+ global coverage) |
| **WASM Bundle Size** | ~300KB gzip |

### Architecture

```
QueryAST → Knex (client: 'sqlite3') → SQL string → wa-sqlite WASM → OPFS/Memory
```

The driver reuses `driver-sql`'s Knex SQLite dialect. The only new code is the **connection layer** — replacing Node.js `better-sqlite3` with wa-sqlite's WASM bindings.

### Scope

| Task | Description | Est. |
|------|-------------|------|
| **S0-1** | Package scaffolding (`package.json`, `tsconfig.json`, exports) | 1h |
| **S0-2** | Implement `SqliteWasmDriver` class extending or wrapping `SqlDriver` | 4h |
| **S0-3** | Custom Knex client adapter for wa-sqlite | 4h |
| **S0-4** | OPFS persistence backend (data survives page refresh) | 4h |
| **S0-5** | In-memory fallback (no persistence, for testing/SSR) | 1h |
| **S0-6** | `DriverCapabilities` declaration (no `beginTransaction` if single-thread) | 1h |
| **S0-7** | TCK conformance tests via `@objectql/driver-tck` | 4h |
| **S0-8** | Unit tests (OPFS init, persistence, quota, health check) | 4h |
| **S0-9** | Documentation page (`content/docs/drivers/sqlite-wasm.mdx`) | 2h |
| **S0-10** | Update browser example (`examples/integrations/browser`) | 2h |

### Config Interface (Draft)

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

### Key Decisions

1. **Composition over inheritance**: Wrap `SqlDriver` internally rather than extend it — the Knex instance uses a custom client adapter, but all query building logic is delegated to `SqlDriver`.
2. **Library-agnostic**: Public API references "SQLite WASM", never "wa-sqlite". Underlying library can switch to sql.js or official SQLite WASM without breaking changes.
3. **No Node.js support**: This driver throws `ObjectQLError({ code: 'ENVIRONMENT_ERROR' })` if `globalThis.WebAssembly` is undefined.

### Success Criteria

- [ ] `pnpm build` succeeds with new package
- [ ] TCK tests pass (skip: transactions if single-connection, joins if unsupported)
- [ ] Browser example works with OPFS persistence (data survives refresh)
- [ ] Bundle size < 400KB gzip (driver + WASM)
- [ ] Documentation published

---

## P1 — `@objectql/driver-pg-wasm`

| Field | Value |
|-------|-------|
| **Package** | `packages/drivers/pg-wasm` |
| **NPM Name** | `@objectql/driver-pg-wasm` |
| **Priority** | P1 — Advanced browser driver |
| **Underlying Library** | [PGlite](https://github.com/nicolo-ribaudo/pglite) (ElectricSQL) |
| **Target Environments** | Browsers with WASM support |
| **WASM Bundle Size** | ~3MB gzip |

### Architecture

```
QueryAST → Knex (client: 'pg') → SQL string → PGlite WASM → IndexedDB/OPFS
```

Reuses `driver-sql`'s Knex PostgreSQL dialect. Provides full PG feature set in the browser: JSONB, full-text search, arrays, range types.

### Scope

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

### Config Interface (Draft)

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

### Key Decisions

1. **Deferred until P0 ships**: P1 starts after `driver-sqlite-wasm` is stable and TCK-passing.
2. **Larger bundle trade-off**: ~3MB is acceptable for apps that genuinely need PG features. Document this clearly so users choose SQLite WASM when they don't need PG-specific capabilities.
3. **Extension system**: PGlite supports loading extensions (pgvector, etc.). Expose via config but don't bundle by default.

### Success Criteria

- [ ] TCK tests pass
- [ ] JSONB query operators work end-to-end
- [ ] Persistence across page refresh verified
- [ ] Documentation published

---

## Shared Infrastructure

Both drivers share common patterns that should be extracted:

| Component | Location | Purpose |
|-----------|----------|---------|
| WASM loader utility | `packages/drivers/sqlite-wasm/src/wasm-loader.ts` | Lazy-load WASM binary, handle CDN/local paths |
| Environment detection | Shared in both drivers | Check `WebAssembly`, `navigator.storage`, OPFS availability |
| Knex custom client pattern | Can be abstracted if both drivers follow same adapter shape | Reduce duplication between S0-3 and P1-3 |

---

## Updated Driver Matrix

| Driver | Environment | Persistence | Query Engine | Status |
|--------|-------------|-------------|--------------|--------|
| `driver-sql` | Node.js | PostgreSQL, MySQL, SQLite | Knex → SQL | ✅ Stable |
| `driver-mongo` | Node.js | MongoDB | Native driver | ✅ Stable |
| `driver-memory` | Universal | None (ephemeral) | In-memory scan | ✅ Stable |
| `driver-fs` | Node.js | JSON files | In-memory scan | ✅ Stable |
| `driver-excel` | Node.js | .xlsx files | In-memory scan | ✅ Stable |
| `driver-redis` | Node.js | Redis | Key-value | ✅ Stable |
| `driver-sdk` | Universal | Remote HTTP | Proxy | ✅ Stable |
| **`driver-sqlite-wasm`** | **Browser** | **OPFS** | **Knex → SQL → WASM** | **🆕 P0** |
| **`driver-pg-wasm`** | **Browser** | **IDB/OPFS** | **Knex → SQL → WASM** | **🆕 P1** |

---

## Timeline

| Week | Milestone |
|------|-----------|
| W1 | P0 scaffolding + Knex adapter + basic CRUD |
| W2 | P0 OPFS persistence + TCK + tests |
| W3 | P0 docs + browser example + stabilize |
| W4 | P1 scaffolding + Knex adapter + basic CRUD |
| W5 | P1 persistence + PG features + TCK |
| W6 | P1 docs + final verification |

---

## Removed Packages

| Package | Reason | Date |
|---------|--------|------|
| `@objectql/driver-localstorage` | localStorage 5MB limit, sync API blocks UI, no query indexing. `driver-memory` sufficient for demos. Replaced by `driver-sqlite-wasm` for browser persistence. | 2026-02-08 |
| `@objectql/driver-utils` | Zero consumers, all functionality duplicated from core. | 2026-02-07 |
