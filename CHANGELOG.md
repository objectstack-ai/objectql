# Changelog

All notable changes to the ObjectQL monorepo are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- **`apps/demo` Vercel deployment** — fixed connection timeout / invalid response on all routes (`/console`, `/api/v1`, etc.) after deploying to Vercel:
  - **`apps/demo/scripts/build-vercel.sh`** — added explicit `node scripts/patch-symlinks.cjs` call (Phase 0) before any `pnpm --filter` build steps. `vercel.json` uses `pnpm install --ignore-scripts` which skips the `postinstall` hook, so the patch script must be called directly from the build script.
  - **`apps/demo/scripts/patch-symlinks.cjs`** — removed the `process.env.VERCEL` early-exit guard. The script is now called explicitly from `build-vercel.sh` (which only runs on Vercel), making the guard redundant. Removing it also allows manual local testing of Vercel-like environments.
  - **`apps/demo/vercel.json`** — expanded `includeFiles` glob to cover `packages/*/dist` (all workspace package dist directories) and `node_modules/@objectstack/service-i18n/dist`, ensuring all runtime dependencies are bundled into the serverless function. Added `pino`, `thread-stream`, `sonic-boom`, `pino-abstract-transport`, and `pino-std-serializers` to `includeFiles` to ensure all pino runtime files are bundled (nft misses them because the logger loads pino inside a try/catch).
  - **`apps/demo/package.json`** and **`pnpm-lock.yaml`** — added `pino@^10.3.1` as an explicit devDependency so pnpm creates a direct symlink that Phase 2 of `patch-symlinks.cjs` can fully dereference, and Vercel's nft can statically trace it.
- **`apps/demo/scripts/patch-symlinks.cjs`** — enhanced to automatically resolve and copy ALL transitive dependencies before dereferencing symlinks. Previously, only direct dependencies listed in `apps/demo/package.json` were available after symlink dereferencing, causing `ERR_MODULE_NOT_FOUND` for transitive deps like `@objectstack/rest`, `zod`, `pino`, `better-auth`, etc. The script now walks each package's pnpm virtual store context (`.pnpm/<name>@<ver>/node_modules/`) and copies any missing sibling dependency into the top-level `node_modules/`, repeating until the full transitive closure is present.
- **`apps/demo`** — added explicit `@objectstack/spec` and `zod` devDependencies as defense-in-depth for Vercel deployment.
- **`@objectql/types`** — moved `@objectstack/spec` and `zod` from `devDependencies` to `dependencies`. The compiled JS output contains runtime imports of `@objectstack/spec` (via `z.infer<typeof Data.X>` patterns), so they must be declared as production dependencies.

### Added

- **`apps/demo`** — standalone Vercel-deployable demo application ([#issue](https://github.com/objectstack-ai/objectql/issues)):
  - `vercel.json` — Vercel deployment configuration (custom serverless, 1 GiB memory, 60 s timeout).
  - `api/[[...route]].ts` — catch-all serverless entry point bootstrapping the ObjectStack kernel with ObjectQL plugins, InMemoryDriver, Auth, Console, and Studio UIs.
  - `scripts/build-vercel.sh` — ordered build script for all workspace dependencies.
  - `scripts/patch-symlinks.cjs` — pnpm symlink dereference for Vercel bundling.
  - `objectstack.config.ts` — local development configuration reusing the project-tracker showcase.
  - `README.md` — deployment documentation for both local and Vercel workflows.
  - Root `demo:dev` script for quick local start.
