# Changelog

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

### Patch Changes

- Updated dependencies [38b01f4]
  - @objectql/types@3.0.0

## 1.9.2

### Patch Changes

- Release version 1.9.2 with latest improvements and bug fixes

  This patch release includes stability improvements and bug fixes backported from the development branch.

- Updated dependencies
  - @objectql/types@1.9.2

## 0.1.2

### Patch Changes

- Release version bump with latest improvements and bug fixes
- Updated dependencies
  - @objectql/types@1.9.1

## 0.1.1

### Patch Changes

- Updated dependencies
  - @objectql/types@1.9.0

All notable changes to the Memory Driver for ObjectQL will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-01-15

### Added

- Initial release of Memory Driver
- Full implementation of ObjectQL Driver interface
- Zero external dependencies
- In-memory storage using JavaScript Maps
- Complete query support (filters, sorting, pagination)
- Bulk operations (createMany, updateMany, deleteMany)
- Distinct value queries
- Initial data loading
- Strict mode for error handling
- Comprehensive test suite (22 tests)
- Full documentation and README
- Support for all ObjectQL query operators:
  - Comparison: =, !=, >, >=, <, <=
  - Set: in, nin
  - String: contains, startswith, endswith
  - Range: between
  - Logical: and, or
- Utility methods (clear, getSize)
- TypeScript type definitions

### Features

- ✅ Production-ready for non-persistent use cases
- ✅ Perfect for testing and development
- ✅ Works in all JavaScript environments (Node.js, Browser, Edge)
- ✅ High performance with O(1) CRUD operations
- ✅ Thread-safe operations
- ✅ Atomic updates and deletes

### Use Cases

- Unit testing without database setup
- Development and prototyping
- Edge/Worker environments (Cloudflare Workers, Deno Deploy)
- Client-side state management
- Temporary data caching
- CI/CD pipelines

### Performance

- Create: O(1)
- Read by ID: O(1)
- Update: O(1)
- Delete: O(1)
- Find/Query: O(n)
- Count: O(n)
- Sort: O(n log n)

### Documentation

- Comprehensive README with examples
- API reference
- Configuration guide
- Testing guide
- Performance tips
- Migration guide
- Troubleshooting section

[0.1.0]: https://github.com/objectstack-ai/objectql/releases/tag/%40objectql/driver-memory%400.1.0
