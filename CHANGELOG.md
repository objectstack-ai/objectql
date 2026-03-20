# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [Unreleased]

### Fixed

- **Console UI "No Apps Configured"**: Replaced the ad-hoc `loadObjects()` function
  in `objectstack.config.ts` with a proper `ExampleAppsPlugin` that uses
  `ObjectLoader` from `@objectql/platform-node` to recursively load all metadata
  types (`.object.yml`, `.app.yml`, `.validation.yml`, `.permission.yml`,
  `.data.yml`, `.workflow.yml`, `.page.yml`, `.menu.yml`, etc.) from both
  showcase example directories:
  - `examples/showcase/project-tracker/src` (including nested `modules/` subdirectories)
  - `examples/showcase/enterprise-erp/src`

  The plugin registers `app.*` services via `ctx.registerService()` so that the
  upstream `ObjectQLPlugin` can discover and install them during its `start()` phase,
  which makes the ConsolePlugin show the configured applications instead of the
  "No Apps Configured" placeholder.

### Removed

- Removed the ad-hoc `loadObjects()` function from `objectstack.config.ts` that
  used `fs.readdirSync` to scan only a flat directory for `*.object.yml` files.
- Removed `import * as fs` and `import * as yaml` from `objectstack.config.ts`
  (no longer needed; `ObjectLoader` handles all file I/O internally).
- Removed the top-level `objects: loadObjects(projectTrackerDir)` property from
  the exported config, which only loaded a partial, non-recursive set of object
  definitions.

### Added

- Added `ExampleAppsPlugin` to `objectstack.config.ts` — a `RuntimePlugin`
  implementation that conforms to the ObjectStack convention of loading metadata
  inside plugins rather than via manual file system code in the config.
- Added `import { ObjectLoader } from '@objectql/platform-node'` and
  `import { MetadataRegistry } from '@objectql/types'` to `objectstack.config.ts`.
