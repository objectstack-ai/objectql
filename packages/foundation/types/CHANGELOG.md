# @objectql/types

## 3.0.0

### Major Changes

- 38b01f4: **Major Release: Version 2.0.0 - Unified Package Versioning**

  This is a coordinated major release that unifies all ObjectQL packages to version 2.0.0, establishing a synchronized versioning strategy across the entire ecosystem.

  ### 🎯 Key Changes

  - **Unified Versioning**: All core packages now share the same version number (2.0.0)
  - **Fixed Group Management**: Updated changeset configuration to include all @objectql packages in the fixed versioning group
  - **Simplified Maintenance**: Future releases will automatically maintain version consistency across the entire monorepo

  ### 📦 Packages Included

  All ObjectQL packages are now synchronized at version 2.0.0:

  - Foundation: `@objectql/types`, `@objectql/core`, `@objectql/platform-node`
  - Drivers: `@objectql/driver-sql`, `@objectql/driver-mongo`, `@objectql/driver-redis`, `@objectql/driver-fs`, `@objectql/driver-memory`, `@objectql/driver-localstorage`, `@objectql/driver-excel`, `@objectql/sdk`
  - Runtime: `@objectql/server`
  - Tools: `@objectql/cli`, `@objectql/create`

  ### ⚠️ Breaking Changes

  This is marked as a major version due to the version number change. The API remains stable and backward compatible. No code changes are required when upgrading.

  ### 🔄 Migration

  Simply update all `@objectql/*` packages to `^2.0.0` in your `package.json`:

  ```json
  {
    "dependencies": {
      "@objectql/core": "^2.0.0",
      "@objectql/driver-sql": "^2.0.0"
    }
  }
  ```

  ### 📝 Notes

  This release establishes a foundation for coordinated major releases across the ObjectQL ecosystem, ensuring compatibility and simplifying dependency management for users.

## 1.9.2

### Patch Changes

- Release version 1.9.2 with latest improvements and bug fixes

  This patch release includes stability improvements and bug fixes backported from the development branch.

## 1.9.1

### Patch Changes

- Release version bump with latest improvements and bug fixes

## 1.9.0

### Minor Changes

- Major documentation update and VS Code extension improvements
  - Completely revised getting started documentation with emphasis on YAML-based metadata approach
  - Improved quick start instructions for better onboarding experience
  - Added comprehensive VS Code extension recommendations to example projects
  - Enhanced developer experience with .vscode/extensions.json files
  - Updated README to highlight the importance of the ObjectQL VS Code extension
  - Added detailed documentation for all core features and API endpoints

## 1.8.4

### Patch Changes

- Release version 1.8.4 with latest improvements and bug fixes

## 1.8.3

### Patch Changes

- Release patch version 1.8.3

  Small version update with latest improvements and bug fixes.

## 1.8.2

### Patch Changes

- Patch release v1.8.2 - Small version update with latest improvements

## 1.8.1

### Patch Changes

- Patch release with documentation updates and bug fixes

## 1.8.0

### Minor Changes

- Release minor version 1.8.0

## 1.7.3

### Patch Changes

- Release patch version 1.7.3 with latest improvements and bug fixes

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
