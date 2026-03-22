# Changelog

All notable changes to the ObjectQL monorepo are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **`@objectql/plugin-analytics`** — new analytics/BI plugin providing multi-database analytical query support. Implements the `IAnalyticsService` contract from `@objectstack/spec` with strategy-based driver dispatch:
  - `NativeSQLStrategy` — pushes analytics to SQL databases via Knex (Postgres, SQLite, MySQL).
  - `ObjectQLStrategy` — delegates to driver's native `aggregate()` method (MongoDB, etc.).
  - `MemoryFallbackStrategy` — in-memory aggregation for dev/test environments.
  - `CubeRegistry` — supports manifest-based and automatic model/metadata-inferred cube definitions.
  - `SemanticCompiler` — compiles `AnalyticsQuery` + `CubeDefinition` into driver-agnostic `LogicalPlan`.
  - `generateSql()` — SQL dry-run/explanation support for query debugging.
  - `AnalyticsPlugin` — kernel plugin registering `'analytics'` service for REST API discovery.

### Fixed

- **`apps/demo`** — added `whatwg-url`, `tr46`, and `webidl-conversions` as explicit devDependencies and to `vercel.json` `includeFiles`. These are transitive dependencies of `node-fetch@2.7.0` (used by `cross-fetch@4.1.0`) that must be bundled into Vercel's serverless function. Without them, the deployment fails with `Cannot find module 'whatwg-url/index.js'`.
- **`apps/demo/scripts/patch-symlinks.cjs`** — enhanced to automatically resolve and copy ALL transitive dependencies before dereferencing symlinks. Previously, only direct dependencies listed in `apps/demo/package.json` were available after symlink dereferencing, causing `ERR_MODULE_NOT_FOUND` for transitive deps like `@objectstack/rest`, `zod`, `pino`, `better-auth`, etc. The script now walks each package's pnpm virtual store context (`.pnpm/<name>@<ver>/node_modules/`) and copies any missing sibling dependency into the top-level `node_modules/`, repeating until the full transitive closure is present.
- **`apps/demo`** — added explicit `@objectstack/spec` and `zod` devDependencies as defense-in-depth for Vercel deployment.
- **`@objectql/types`** — moved `@objectstack/spec` and `zod` from `devDependencies` to `dependencies`. The compiled JS output contains runtime imports of `@objectstack/spec` (via `z.infer<typeof Data.X>` patterns), so they must be declared as production dependencies.

### Changed

- **`apps/demo`** — switched default data driver from `@objectstack/driver-memory` (InMemoryDriver) to `@objectql/driver-turso` (TursoDriver). When `TURSO_DATABASE_URL` is set, the demo uses a persistent Turso/libSQL database; otherwise falls back to InMemoryDriver for zero-config local development.
  - `objectstack.config.ts` — environment-aware `createDefaultDriver()` selects Turso or MemoryDriver.
  - `api/[[...route]].ts` — Vercel serverless handler uses TursoDriver with `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `TURSO_SYNC_URL`, and `TURSO_SYNC_INTERVAL` env vars.
  - `scripts/build-vercel.sh` — now builds `@objectql/driver-turso` alongside other drivers.
  - `README.md` — documents new Turso environment variables and architecture.

### Added

- **`apps/demo`** — standalone Vercel-deployable demo application ([#issue](https://github.com/objectstack-ai/objectql/issues)):
  - `vercel.json` — Vercel deployment configuration (custom serverless, 1 GiB memory, 60 s timeout).
  - `api/[[...route]].ts` — catch-all serverless entry point bootstrapping the ObjectStack kernel with ObjectQL plugins, InMemoryDriver, Auth, Console, and Studio UIs.
  - `scripts/build-vercel.sh` — ordered build script for all workspace dependencies.
  - `scripts/patch-symlinks.cjs` — pnpm symlink dereference for Vercel bundling.
  - `objectstack.config.ts` — local development configuration reusing the project-tracker showcase.
  - `README.md` — deployment documentation for both local and Vercel workflows.
  - Root `demo:dev` script for quick local start.
