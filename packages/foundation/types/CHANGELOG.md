# @objectql/core

## 1.7.2

### Patch Changes

- Release patch version 1.7.2

## 1.7.1

### Patch Changes

- Release small version update with latest improvements

## 1.7.0

### Minor Changes

- Release version 1.7.0 with improvements and bug fixes:
  - Updated default port for ObjectQL Studio to 5555
  - Improved port listening logic in Studio
  - Enhanced stability and performance

## 1.6.1

## 1.6.0

### Minor Changes

- Minor version release - 1.6.0

## 1.5.0

### Minor Changes

- Minor version release - 1.5.0

## 1.4.0

### Minor Changes

- Release version 1.4.0 with new features and enhancements:
  - Added complete REST API implementation with CRUD operations
  - Enhanced error handling with standardized error codes and HTTP status mapping
  - Added AI context support for tracking intent and use cases
  - Enhanced metadata API with detailed field information and action listing
  - Improved JSON-RPC API with better error categorization
  - Added hooks and actions validation and implementation
  - Updated documentation and examples

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
