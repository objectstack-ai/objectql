# @objectql/core

## 1.3.1

## 1.3.0

### Minor Changes

- Refactor core architecture: split logic into modules (driver, remote, action, hook, object, plugin).
  Rename `ObjectRegistry` to `MetadataRegistry` to support generic metadata.
  Add `addLoader` API to support custom metadata loaders in plugins.
  Update initialization lifecycle to allow plugins to register loaders before source scanning.

## 1.2.0

### Minor Changes

- 7df2977: 拆分 objectos

## 1.1.0

### Minor Changes

- add metadata loader

### Patch Changes

- Updated dependencies
  - @objectql/metadata@0.2.0

## 1.0.0

### Major Changes

- first release
