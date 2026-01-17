# @objectql/driver-redis

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

## 1.9.1

### Patch Changes

- Release version bump with latest improvements and bug fixes
- Updated dependencies
  - @objectql/types@1.9.1

## 1.9.0

### Minor Changes

- Major documentation update and VS Code extension improvements
  - Completely revised getting started documentation with emphasis on YAML-based metadata approach
  - Improved quick start instructions for better onboarding experience
  - Added comprehensive VS Code extension recommendations to example projects
  - Enhanced developer experience with .vscode/extensions.json files
  - Updated README to highlight the importance of the ObjectQL VS Code extension
  - Added detailed documentation for all core features and API endpoints

### Patch Changes

- Updated dependencies
  - @objectql/types@1.9.0

## 1.8.4

### Patch Changes

- Release version 1.8.4 with latest improvements and bug fixes
- **Note**: Version synchronized with other ObjectQL packages per fixed versioning policy
- Updated dependencies
  - @objectql/types@1.8.4

## [0.1.0] - 2026-01-15

### Added

- Initial example implementation of Redis driver for ObjectQL
- Basic CRUD operations (Create, Read, Update, Delete)
- Query filtering support (in-memory)
- Sorting support (in-memory)
- Pagination (skip/limit)
- Count operations
- Comprehensive test suite
- Documentation and usage examples

### Notes

- This is an **example/template implementation** for educational purposes
- Not recommended for production use with large datasets due to full key scanning
- Serves as a reference for creating custom ObjectQL drivers

### Known Limitations

- Uses KEYS command which scans all keys (inefficient for large datasets)
- All filtering and sorting done in-memory
- No native aggregation support
- No transaction support
- No schema introspection

### Recommendations for Production

- Implement RedisJSON module integration
- Add RedisSearch for indexed queries
- Create secondary indexes using Redis Sets
- Implement cursor-based pagination
- Add connection pooling and retry logic
