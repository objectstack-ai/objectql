# ObjectQL Work Plan — 2026 Q1 (Phase 1 Completion)

> Generated: 2026-02-06 | Status: **Active**  
> Roadmap Phase: 1 (Core Alignment, RBAC, Zod Schemas, Logging)

## Executive Summary

A full monorepo scan revealed **critical build-chain blockers** that prevent compilation of the core engine and all three plugin packages. This plan prioritizes unblocking the build pipeline first, then addresses architectural governance, test coverage, and roadmap alignment.

---

## Phase A: Build Chain Repair (Priority: CRITICAL)

Unblock the entire compilation pipeline. All subsequent work depends on this.

### A1 — Unify Zod Version ✅

| Field | Value |
|-------|-------|
| **Status** | ✅ Completed |
| **Problem** | `@objectql/core` depended on `zod ^4.3.6` while every other package uses `zod ^3.23.8`. |
| **Resolution** | Downgraded `@objectql/core` to `zod ^3.23.8`. All 3 usages in core are compile-time only (`z.infer<>`) so no API migration was needed. |
| **Files Changed** | `packages/foundation/core/package.json` |

### A2 — Fix Missing Type Exports in `@objectql/types` ✅

| Field | Value |
|-------|-------|
| **Status** | ✅ Completed |
| **Problem** | Types appeared missing because `dist/` was stale (built from an older source). The source already had `RuntimePlugin`, `RuntimeContext`, `MetadataItem`, `Filter`, `QueryAST`, `ApiRequest`, `ApiResponse`, `GatewayProtocol` etc. |
| **Resolution** | Rebuilt `@objectql/types` with `pnpm build`. All exports now available. Also removed unused `Data` import from `object.ts`. |

### A3 — Fix `@objectql/core` TypeScript Errors (93→0) ✅

| Field | Value |
|-------|-------|
| **Status** | ✅ Completed |
| **Root Cause** | All 93 errors were caused by: (1) `node_modules` not installed (`@objectstack/spec`, `zod`, `@objectstack/runtime` missing), (2) stale `@objectql/types` dist. **No source code changes were needed in core.** |
| **Resolution** | `pnpm install` + rebuild types + rebuild plugins → core compiles with 0 errors. |

### A4 — Build the 3 Plugin Packages ✅

| Field | Value |
|-------|-------|
| **Status** | ✅ Completed |
| **Resolution** | All 3 plugin packages (`plugin-formula`, `plugin-security`, `plugin-validator`) compile clean and produce `dist/` output after dependency install. No source changes needed. |

### A5 — Clean Up Ghost `runtime/server` Package ✅

| Field | Value |
|-------|-------|
| **Status** | ✅ Completed |
| **Resolution** | Removed `packages/runtime/server/` entirely. It contained only stale `dist/` artifacts with no `package.json` or `src/`. |

---

## Phase B: Architecture Governance (Priority: HIGH)

Enforce the "Constitution" (`@objectql/types`) rules and clean up layering violations.

### B1 — ~~Remove Runtime Dependencies from `@objectql/types`~~ ✅ RESOLVED

| Field | Value |
|-------|-------|
| **Status** | ✅ Resolved — Not a real issue |
| **Analysis** | `@objectql/types` uses `z.infer<typeof Data.XXXSchema>` to derive TypeScript types from `@objectstack/spec` Zod schemas. This is a **compile-time only** operation. The compiled `dist/*.js` contains ZERO references to `@objectstack/spec` or `zod`. The compiled `dist/*.d.ts` contains flattened pure TypeScript interfaces. |
| **Action Taken** | Moved `@objectstack/spec` from `dependencies` to `devDependencies` in `package.json`. Both `@objectstack/spec` and `zod` are now correctly classified as devDependencies. Updated `.github/copilot-instructions.md` to reflect the "Protocol-Derived Types" architecture. |

### B2 — Unify `DriverConfig` / `DriverCapabilities` Types ✅

| Field | Value |
|-------|-------|
| **Status** | ✅ Completed |
| **Problem** | Each of the 9 drivers independently defines identical `DriverConfig` and `DriverCapabilities` interfaces. |
| **Resolution** | Defined canonical `DriverCapabilities` interface (31 fields aligned with `@objectstack/spec`), `DriverType` enum, `BaseDriverConfig`, and `IsolationLevel` in `@objectql/types`. Removed 6 duplicate method declarations from the `Driver` interface (`aggregate`, `distinct`, `beginTransaction`, `commitTransaction`, `rollbackTransaction`, `disconnect`). |
| **Files Changed** | `packages/foundation/types/src/driver.ts` |

### B3 — Remove `@objectql/driver-utils` (Dead Code) ✅

| Field | Value |
|-------|-------|
| **Status** | ✅ Completed |
| **Problem** | 990 lines of utility code (QueryAST, filters, transactions) with zero consumers. |
| **Resolution** | Removed `packages/drivers/utils/` entirely. Zero packages depended on it; all functionality was duplicated from core. |
| **Files Removed** | `packages/drivers/utils/` (entire directory) |

### B4 — Add `exports` Field to All Packages ✅

| Field | Value |
|-------|-------|
| **Status** | ✅ Completed |
| **Problem** | No package defines conditional `exports` — all use legacy `main`/`types` entries. |
| **Resolution** | Added `"exports": { ".": { "types": "./dist/index.d.ts", "default": "./dist/index.js" } }` to 17 packages across foundation, drivers, protocols, and tools layers. |
| **Files Changed** | 17 `package.json` files |

### B5 — Fix `platform-node` Layer Violation ✅

| Field | Value |
|-------|-------|
| **Status** | ✅ Completed |
| **Problem** | `platform-node`'s `tsconfig.json` references `../../drivers/sql` and `../../drivers/mongo`, creating a foundation→driver cross-layer dependency. |
| **Resolution** | Removed both cross-layer references from `tsconfig.json`. |
| **Files Changed** | `packages/foundation/platform-node/tsconfig.json` |

---

## Phase C: Test Coverage (Priority: MEDIUM)

### C1 — `plugin-security` Tests

2,384 lines of RBAC/FLS/RLS code with only 1 test file. Add unit tests for:
- Role resolution, Field-Level Security, Record-Level Security
- Permission evaluation, Sharing rules

### C2 — `plugin-validator` TODO Implementation

Implement the 2 stubs:
- Custom validator execution
- Safe expression evaluation

### C3 — `@objectql/cli` Tests

16 commands with only 1 test file. Add at least smoke tests for each command group.

### C4 — ~~`driver-utils` Tests~~ N/A

Package removed in B3.

### C5 — Full CI Verification

Run `pnpm build && pnpm test` across the entire monorepo and achieve green CI.

---

## Phase D: Roadmap Phase 1 Completion

### D1 — Complete RBAC Storage Backends

Implement the TODO stubs in `plugin-security`:
- Redis storage backend
- Database storage backend

### D2 — Structured Logging Framework

Integrate structured logging as specified in the v0.9.0 roadmap.

### D3 — AI Namespace Preparation

Current compliance: 40%. Begin foundational work for:
- RAG integration points
- Model Registry interfaces
- Prompt template system

---

## Known Issues Registry

| ID | Severity | Package | Description |
|----|----------|---------|-------------|
| ISS-001 | ✅ Resolved | `core` | 93 TS errors → 0 after `pnpm install` + types rebuild |
| ISS-002 | ✅ Resolved | `core` | Zod downgraded from `^4.3.6` to `^3.23.8` |
| ISS-003 | ✅ Resolved | `plugin-*` (×3) | All 3 plugins now produce `dist/` |
| ISS-004 | ✅ Resolved | `runtime/server` | Ghost directory removed |
| ISS-005 | ✅ Resolved | `types` | Types were present in source, stale `dist/` was the issue |
| ISS-006 | ✅ Resolved | `types` | `@objectstack/spec` and `zod` correctly moved to devDependencies — compile-time only |
| ISS-007 | ✅ Resolved | `driver-utils` | Package removed entirely (zero consumers) |
| ISS-008 | 🟡 Medium | `plugin-security` | 1 test for 2,384 LOC |
| ISS-009 | 🟡 Medium | `plugin-validator` | 2 TODO stubs unimplemented |
| ISS-010 | 🟡 Medium | `cli` | Source version != package.json version |
| ISS-011 | 🟡 Medium | `localstorage` | Compression feature flagged but unimplemented |
| ISS-012 | 🟡 Medium | `protocol-rest` | Missing `"type": "module"` unlike sibling protocols |
| ISS-013 | ✅ Resolved | `platform-node` | Cross-layer tsconfig references removed |
| ISS-014 | ✅ Resolved | All packages | `exports` field added to 17 packages |
| ISS-015 | 🟢 Low | `sdk` | Named `@objectql/sdk` instead of `@objectql/driver-sdk` |

---

## Build & Test Results (2026-02-06, updated after Phase B)

```
pnpm build: 29 successful, 29 total ✅ (2 ghost packages removed: runtime/server, driver-utils)
pnpm test:  49 successful, 49 total ✅ (excluding driver-mongo & driver-redis — require running servers)
```

## Success Criteria

- [x] `pnpm build` succeeds for all 30 packages (0 errors)
- [ ] `pnpm test` passes with ≥80% coverage on foundation layer
- [ ] Zero circular dependencies
- [x] `@objectql/types` has zero runtime dependencies (compile-time spec derivation only)
- [x] All plugins produce valid `dist/` output
- [ ] CI pipeline green end-to-end
