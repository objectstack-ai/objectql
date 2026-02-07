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

### C1 — `plugin-security` Tests ✅

| Field | Value |
|-------|-------|
| **Status** | ✅ Completed |
| **Before** | 1 test file (query-trimmer), 13 tests |
| **After** | 6 test files, **136 tests** covering: PermissionGuard (object/field/record/RLS + caching), FieldMasker (7 mask formats + FLS removal), PermissionLoader (storage init + precompile + 12 operators), ConfigSchema (Zod defaults + validation), Plugin integration (install + hooks + audit) |
| **Files Created** | `__tests__/permission-guard.test.ts`, `__tests__/field-masker.test.ts`, `__tests__/permission-loader.test.ts`, `__tests__/config-schema.test.ts`, `__tests__/plugin.test.ts` |

### C2 — `plugin-validator` TODO Implementation ✅

| Field | Value |
|-------|-------|
| **Status** | ✅ Completed |
| **Implemented** | (1) `validateCustom()` — custom validator expressions via Function constructor in strict mode. (2) `evaluateCondition()` expression evaluation — safe expression eval. (3) `validateBusinessRule()` constraint.expression — same safe eval. |
| **Tests Added** | 11 new tests: custom validators (pass/fail/error/template/context), expression evaluation (business rules, conditions, error handling) |
| **Files Changed** | `src/validator.ts` (3 stubs → working implementations), `test/validator.test.ts` (+11 tests) |

### C3 — `@objectql/cli` Tests ✅

| Field | Value |
|-------|-------|
| **Status** | ✅ Resolved — No real issue |
| **Analysis** | The "lint failure" in test output is expected behavior — the CLI's own `lint` command intentionally tests invalid metadata naming. The `❌ Linting failed with errors` messages are stdout from a test case that validates the error path. All 18 tests pass (2 skipped). |

### C4 — ~~`driver-utils` Tests~~ N/A

Package removed in B3.

### C5 — Full CI Verification ✅

| Field | Value |
|-------|-------|
| **Status** | ✅ Completed |
| **Build** | `pnpm build` — 29/29 successful |
| **Tests** | `pnpm test` — 49/49 tasks, 1,582 tests passed |
| **Excluded** | `driver-mongo` and `driver-redis` (require running external servers — infrastructure dependency, not code bug) |

---

## Phase D: Roadmap Phase 1 Completion

### D1 — Complete RBAC Storage Backends ✅

| Field | Value |
|-------|-------|
| **Status** | ✅ Completed |
| **Implemented** | `RedisPermissionStorage` and `DatabasePermissionStorage` with ObjectQLError-based validation and deterministic reload behavior. |
| **Files Changed** | `packages/foundation/plugin-security/src/storage-redis.ts`, `packages/foundation/plugin-security/src/storage-database.ts`, `packages/foundation/plugin-security/src/permission-loader.ts` |

### D2 — Structured Logging Framework ✅

| Field | Value |
|-------|-------|
| **Status** | ✅ Completed |
| **Implemented** | Unified `Logger` usage via `@objectql/types` across core gateway, hook manager, and plugins; removed external `createLogger` dependency in foundation plugins. |
| **Files Changed** | `packages/foundation/core/src/gateway.ts`, `packages/foundation/core/src/optimizations/CompiledHookManager.ts`, `packages/foundation/core/src/plugin.ts`, `packages/foundation/plugin-security/src/plugin.ts`, `packages/foundation/plugin-security/src/permission-loader.ts`, `packages/foundation/plugin-formula/src/formula-plugin.ts`, `packages/foundation/plugin-validator/src/validator-plugin.ts` |

### D3 — AI Namespace Preparation ✅ (Foundational)

| Field | Value |
|-------|-------|
| **Status** | ✅ Foundational Complete |
| **Implemented** | Runtime AI namespace types (`AiRegistry`, `ModelRegistry`, `PromptRegistry`, RAG interfaces) + core in-memory registries + docs. |
| **Files Changed** | `packages/foundation/types/src/ai.ts`, `packages/foundation/core/src/ai/registry.ts`, `packages/foundation/core/src/plugin.ts`, `content/docs/extending/ai.mdx`, `content/docs/extending/meta.json` |

---

## Phase E: v1 Release Stabilization (Priority: CRITICAL)

### E1 — CLI Scope Alignment ✅

| Field | Value |
|-------|-------|
| **Status** | ✅ Completed |
| **Decision** | Runtime lifecycle commands are delegated to `@objectstack/cli`. `@objectql/cli` focuses on metadata, DB workflows, i18n, and tooling. |
| **Files Changed** | `packages/tools/cli/src/register/lifecycle.ts`, `packages/tools/cli/src/register/tools.ts`, `packages/tools/cli/README.md`, `content/docs/getting-started/cli.mdx` |

### E2 — Performance Baseline (Core + Plugins)

| Field | Value |
|-------|-------|
| **Status** | ⏳ Planned |
| **Scope** | Hook execution p95, permission checks p95, query execution p95, memory usage under load |
| **Artifacts** | `scripts/benchmarks/core-perf.ts`, `docs/perf/BASELINE.md` |

### E3 — Compatibility Hardening

| Field | Value |
|-------|-------|
| **Status** | ⏳ Planned |
| **Scope** | CLI delegation stability, config detection, backward-compatible behaviors |
| **Artifacts** | Regression tests + docs |

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
| ISS-008 | ✅ Resolved | `plugin-security` | Test coverage expanded (1→6 files, 13→136 tests) |
| ISS-009 | ✅ Resolved | `plugin-validator` | TODO stubs implemented with tests |
| ISS-010 | ✅ Resolved | `cli` | Version sourced from package.json; CLI scope delegated to @objectstack/cli |
| ISS-011 | 🟡 Medium | `localstorage` | Compression feature flagged but unimplemented |
| ISS-012 | ✅ Resolved | `protocol-rest` | Ghost project reference in root `tsconfig.json` caused Vite to fail when parsing projects — removed reference |
| ISS-013 | ✅ Resolved | `platform-node` | Cross-layer tsconfig references removed |
| ISS-014 | ✅ Resolved | All packages | `exports` field added to 17 packages |
| ISS-015 | 🟢 Low | `sdk` | Named `@objectql/sdk` instead of `@objectql/driver-sdk` |
| ISS-016 | ✅ Resolved | `plugin-security` | (a) Test assertions expected "not yet implemented" but D1 was already complete — fixed to match actual error messages. (b) `reload()` method had array-mutation bug during iteration — fixed with shallow copy. |

---

## Build & Test Results (2026-02-07, updated after final verification)

```
pnpm build: 29 successful, 29 total ✅ (2 ghost packages removed: runtime/server, driver-utils)
pnpm test:  47 successful, 47 total ✅ (excluding driver-mongo & driver-redis — require running servers)
             1,628 tests passed across all packages (updated count after fixes)
```

### Test Coverage Improvements (Phase C)
| Package | Before | After |
|---------|--------|-------|
| `plugin-security` | 1 test file / 13 tests | 6 test files / 165 tests (+ storage backends fixed) |
| `plugin-validator` | 3 test files / 71 tests | 3 test files / 82 tests (+11, stubs implemented) |
| `@objectql/types` | 0 tests / package broken | 3 test files / 46 tests (tsconfig.json fixed) |

## Success Criteria

- [x] `pnpm build` succeeds for all 29 packages (0 errors)
- [x] `pnpm test` passes — 47/47 tasks, 1,628 tests (excludes infra-dependent drivers)
- [x] Zero circular dependencies
- [x] `@objectql/types` has zero runtime dependencies (compile-time spec derivation only)
- [x] All plugins produce valid `dist/` output
- [x] CI pipeline green end-to-end
- [x] `plugin-security` test coverage: 1 → 6 test files, 13 → 165 tests (added storage backend tests + fixed reload bug)
- [x] `plugin-validator` TODO stubs: 3 stubs → 3 working implementations
- [x] `@objectql/types` tests: 0 → 46 tests (fixed ghost protocol-rest reference)
- [x] All Phase D roadmap items verified as complete (storage backends, structured logging, AI namespace)
