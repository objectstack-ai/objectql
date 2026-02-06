# ObjectQL Work Plan — 2026 Q1 (Phase 1 Completion)

> Generated: 2026-02-06 | Status: **Active**  
> Roadmap Phase: 1 (Core Alignment, RBAC, Zod Schemas, Logging)

## Executive Summary

A full monorepo scan revealed **critical build-chain blockers** that prevent compilation of the core engine and all three plugin packages. This plan prioritizes unblocking the build pipeline first, then addresses architectural governance, test coverage, and roadmap alignment.

---

## Phase A: Build Chain Repair (Priority: CRITICAL)

Unblock the entire compilation pipeline. All subsequent work depends on this.

### A1 — Unify Zod Version

| Field | Value |
|-------|-------|
| **Status** | 🔴 Not Started |
| **Problem** | `@objectql/core` depends on `zod ^4.3.6` while every other package uses `zod ^3.23.8`. Zod v3→v4 has breaking API changes. |
| **Action** | Downgrade `@objectql/core` to `zod ^3.23.8` to match the ecosystem. Update any v4-specific API calls (`z.string()` → check for schema changes). |
| **Files** | `packages/foundation/core/package.json`, all `*.ts` files using Zod in core |

### A2 — Fix Missing Type Exports in `@objectql/types`

| Field | Value |
|-------|-------|
| **Status** | 🔴 Not Started |
| **Problem** | `PluginContext`, `PluginResult`, and `MetadataItem` are referenced by 3+ plugin packages but do not exist in `@objectql/types`. |
| **Action** | Define these interfaces in `@objectql/types/src/` and re-export from the barrel index. |
| **Files** | `packages/foundation/types/src/plugin.ts` (new or existing), `packages/foundation/types/src/index.ts` |

### A3 — Fix `@objectql/core` TypeScript Errors (93 errors)

| Field | Value |
|-------|-------|
| **Status** | 🔴 Not Started |
| **Problem** | 93 TS compilation errors in core — broken type references, missing module paths, type incompatibilities. |
| **Action** | After A1 and A2, systematically resolve remaining errors: fix import paths, align type signatures, remove references to non-existent modules. |
| **Files** | `packages/foundation/core/src/**/*.ts` |

### A4 — Build the 3 Plugin Packages

| Field | Value |
|-------|-------|
| **Status** | 🔴 Not Started |
| **Problem** | `plugin-formula`, `plugin-security`, and `plugin-validator` have no `dist/` build output. |
| **Action** | Fix their TS errors (dependent on A2/A3), then run `pnpm build` for each. |
| **Files** | `packages/foundation/plugin-*/` |

### A5 — Clean Up Ghost `runtime/server` Package

| Field | Value |
|-------|-------|
| **Status** | 🔴 Not Started |
| **Problem** | `packages/runtime/server/` has no `package.json` or `src/` — only stale `dist/` artifacts. Not recognized by pnpm workspace. |
| **Action** | Remove the directory entirely, or scaffold it properly with `package.json` + `src/`. |
| **Files** | `packages/runtime/server/` |

---

## Phase B: Architecture Governance (Priority: HIGH)

Enforce the "Constitution" (`@objectql/types`) rules and clean up layering violations.

### B1 — Remove Runtime Dependencies from `@objectql/types`

| Field | Value |
|-------|-------|
| **Problem** | `@objectql/types` imports `@objectstack/spec` and `zod` at runtime, violating the zero-dependency rule. |
| **Action** | Move runtime Zod usage to `@objectql/core`. Keep `@objectql/types` as pure TS interfaces/enums/errors only. |

### B2 — Unify `DriverConfig` / `DriverCapabilities` Types

| Field | Value |
|-------|-------|
| **Problem** | Each of the 9 drivers independently defines identical `DriverConfig` and `DriverCapabilities` interfaces. |
| **Action** | Define canonical types in `@objectql/types`, have all drivers import from there. |

### B3 — Evaluate `@objectql/driver-utils` (Dead Code)

| Field | Value |
|-------|-------|
| **Problem** | 990 lines of utility code (QueryAST, filters, transactions) with zero consumers. |
| **Action** | Either integrate into drivers or remove. The only test file is an empty placeholder. |

### B4 — Add `exports` Field to All Packages

| Field | Value |
|-------|-------|
| **Problem** | No package defines conditional `exports` — all use legacy `main`/`types` entries. |
| **Action** | Add proper `exports` map supporting ESM/CJS dual mode. |

### B5 — Fix `platform-node` Layer Violation

| Field | Value |
|-------|-------|
| **Problem** | `platform-node`'s `tsconfig.json` references `../../drivers/mongo`, creating a foundation→driver dependency. |
| **Action** | Remove the cross-layer reference. |

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

### C4 — `driver-utils` Tests (if retained)

If B3 decides to keep the package, write comprehensive unit tests.

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
| ISS-001 | 🔴 Critical | `core` | 93 TypeScript compilation errors |
| ISS-002 | 🔴 Critical | `core` | Zod v4 vs ecosystem v3 version split |
| ISS-003 | 🔴 Critical | `plugin-*` (×3) | No build output (`dist/`) |
| ISS-004 | 🔴 Critical | `runtime/server` | Ghost package — no source, no package.json |
| ISS-005 | 🟠 High | `types` | Missing `PluginContext`/`PluginResult` exports |
| ISS-006 | 🟠 High | `types` | Runtime dependencies violate zero-dep rule |
| ISS-007 | 🟠 High | `driver-utils` | 990 lines of dead code, zero consumers |
| ISS-008 | 🟡 Medium | `plugin-security` | 1 test for 2,384 LOC |
| ISS-009 | 🟡 Medium | `plugin-validator` | 2 TODO stubs unimplemented |
| ISS-010 | 🟡 Medium | `cli` | Source version != package.json version |
| ISS-011 | 🟡 Medium | `localstorage` | Compression feature flagged but unimplemented |
| ISS-012 | 🟡 Medium | `protocol-rest` | Missing `"type": "module"` unlike sibling protocols |
| ISS-013 | 🟢 Low | `platform-node` | tsconfig references driver layer |
| ISS-014 | 🟢 Low | All packages | No conditional `exports` field |
| ISS-015 | 🟢 Low | `sdk` | Named `@objectql/sdk` instead of `@objectql/driver-sdk` |

---

## Success Criteria

- [ ] `pnpm build` succeeds for all 31 packages (0 errors)
- [ ] `pnpm test` passes with ≥80% coverage on foundation layer
- [ ] Zero circular dependencies
- [ ] `@objectql/types` has zero runtime dependencies
- [ ] All plugins produce valid `dist/` output
- [ ] CI pipeline green end-to-end
