# @objectql/create

## 4.0.3

### Patch Changes

- **Patch Release v4.0.3**

  This patch release includes infrastructure improvements and development experience enhancements:
  - Refactored dev server setup for improved configuration handling
  - Enhanced example scripts and development workflow
  - Updated build and test infrastructure
  - Improved documentation and developer tools
  - Bug fixes and stability improvements

## 4.0.2

### Patch Changes

- **Patch Release v4.0.2**

  This patch release includes:
  - Infrastructure improvements and maintenance updates
  - Enhanced stability and reliability
  - Bug fixes and performance optimizations

## 4.0.1

### Patch Changes

- **Release Version 4.0.1**

  This patch release includes the latest repository improvements and infrastructure updates:
  - Added comprehensive GitHub workflows for CI/CD, testing, and quality assurance
  - Enhanced documentation and developer experience
  - Improved build and release processes with Changesets
  - Added Excel driver for reading/writing Excel files as data sources
  - Repository structure and tooling improvements
  - Bug fixes and stability enhancements

## 3.0.1

### Patch Changes

- 79d04e1: Patch release for January 2026 updates

  This patch includes minor improvements and maintenance updates:
  - Enhanced type safety across core packages
  - Improved error handling in drivers
  - Documentation updates
  - Performance optimizations

- faeef39: Release version 1.9.2 with latest improvements and bug fixes

  This patch release includes stability improvements and bug fixes backported from the development branch.

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

## 1.0.2

### Patch Changes

- Release version bump with latest improvements and bug fixes
