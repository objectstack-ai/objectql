# @objectql/core

## 1.3.1

### Patch Changes

- Align versions for monorepo packages.
  - @objectql/driver-remote@1.3.1
  - @objectql/types@1.3.1

## 1.3.0

### Minor Changes

- Refactor core architecture: split logic into modules (driver, remote, action, hook, object, plugin).
  Rename `ObjectRegistry` to `MetadataRegistry` to support generic metadata.
  Add `addLoader` API to support custom metadata loaders in plugins.
  Update initialization lifecycle to allow plugins to register loaders before source scanning.

### Patch Changes

- Updated dependencies
  - @objectql/types@1.3.0
  - @objectql/driver-remote@0.1.1

## 1.2.0

### Minor Changes

- 7df2977: 拆分 objectos

### Patch Changes

- Updated dependencies [7df2977]
  - @objectql/types@1.2.0
