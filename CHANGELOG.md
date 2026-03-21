# Changelog

All notable changes to the ObjectQL monorepo are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **`apps/demo`** — standalone Vercel-deployable demo application ([#issue](https://github.com/objectstack-ai/objectql/issues)):
  - `vercel.json` — Vercel deployment configuration (custom serverless, 1 GiB memory, 60 s timeout).
  - `api/[[...route]].ts` — catch-all serverless entry point bootstrapping the ObjectStack kernel with ObjectQL plugins, InMemoryDriver, Auth, Console, and Studio UIs.
  - `scripts/build-vercel.sh` — ordered build script for all workspace dependencies.
  - `scripts/patch-symlinks.cjs` — pnpm symlink dereference for Vercel bundling.
  - `objectstack.config.ts` — local development configuration reusing the project-tracker showcase.
  - `README.md` — deployment documentation for both local and Vercel workflows.
  - Root `demo:dev` script for quick local start.
