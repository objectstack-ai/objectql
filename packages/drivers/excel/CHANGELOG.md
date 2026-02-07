# @objectql/driver-excel

## 4.2.0

### Minor Changes

- Release v4.2.0
  - Protocol layer: Added GraphQL, JSON-RPC, and OData v4 protocol adapters
  - Drivers: Added Excel, filesystem, and Redis drivers
  - Plugins: Added formula engine, security RBAC, and validator plugins
  - CLI: Added `objectql create` scaffolding tool
  - Core: Performance improvements and strict type enforcement
  - Testing: Added Driver TCK and Protocol TCK conformance suites

### Patch Changes

- Updated dependencies
  - @objectql/types@4.2.0
  - @objectql/driver-memory@4.2.0

## 4.0.6

### Patch Changes

- @objectql/driver-memory@4.0.6
- @objectql/types@4.0.6

## 4.0.5

### Patch Changes

- Patch release 4.0.5 - Bug fixes and stability improvements
- Updated dependencies
  - @objectql/driver-memory@4.0.5
  - @objectql/types@4.0.5

## 4.0.4

### Patch Changes

- **Patch Release v4.0.4**

  This patch release includes bug fixes, driver improvements, and enhanced test coverage:

  ### Driver Improvements
  - **MongoDB Driver**: Fixed bulk operations, transaction support, and type safety improvements
  - **FileSystem Driver**: Fixed TCK test compatibility with dataDir parameter
  - **SQL Driver**: Enhanced TCK test compatibility and fixed test failures
  - **Redis Driver**: Improved TCK test configuration and dependencies
  - **Driver Utils**: Added shared utilities package for cross-driver functionality

  ### Testing & Quality
  - Added comprehensive TCK (Technology Compatibility Kit) compliance tests for all drivers
  - Expanded TCK test suite to 30+ comprehensive tests
  - Enhanced test infrastructure with better error handling
  - Added --passWithNoTests flag for packages without tests

  ### Type Safety
  - Improved type safety in MongoDB driver update methods
  - Better handling of atomic operators in MongoDB driver
  - Enhanced type definitions across driver layer

  ### Documentation
  - Added comprehensive driver documentation
  - Enhanced official documentation with Phase 2 implementation summaries
  - Improved protocol layer documentation

  ### Infrastructure
  - Standardized driver layer implementation
  - Enhanced protocol layer with better abstraction
  - Improved GitHub Actions workflow configurations
  - Better CI/CD pipeline stability

  This release maintains full backward compatibility with v4.0.3.

- Updated dependencies
  - @objectql/driver-memory@4.0.4
  - @objectql/types@4.0.4

## 4.0.3

### Patch Changes

- **Patch Release v4.0.3**

  This patch release includes infrastructure improvements and development experience enhancements:
  - Refactored dev server setup for improved configuration handling
  - Enhanced example scripts and development workflow
  - Updated build and test infrastructure
  - Improved documentation and developer tools
  - Bug fixes and stability improvements

- Updated dependencies
  - @objectql/driver-memory@4.0.3
  - @objectql/types@4.0.3

## 4.0.2

### Patch Changes

- **Patch Release v4.0.2**

  This patch release includes:
  - Infrastructure improvements and maintenance updates
  - Enhanced stability and reliability
  - Bug fixes and performance optimizations

- Updated dependencies
  - @objectql/types@4.0.2

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

- Updated dependencies
  - @objectql/types@4.0.1

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

- Updated dependencies [79d04e1]
- Updated dependencies [faeef39]
  - @objectql/types@3.0.1

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

## 0.2.1

### Patch Changes

- Release version bump with latest improvements and bug fixes
- Updated dependencies
  - @objectql/types@1.9.1

## 0.2.0 - 2024-01-16

### Added

- **File Storage Modes**: New `fileStorageMode` configuration option
  - `single-file` mode: All object types in one Excel file (default, existing behavior)
  - `file-per-object` mode: Each object type in a separate Excel file
- Complete English documentation in README
- Additional tests for file-per-object mode (39 total tests now)
- Examples for both storage modes

### Improved

- Better documentation with comprehensive API reference
- Usage examples for common scenarios
- Performance benchmarks and optimization tips
- Detailed error handling guide

## 0.1.0 - 2024-01-16

### Added

- Initial release of Excel Driver for ObjectQL
- Full CRUD operations (create, read, update, delete)
- Query support with filters, sorting, and pagination
- Bulk operations (createMany, updateMany, deleteMany)
- Multiple worksheet support (one sheet per object type)
- Auto-save and manual save options
- File persistence with Excel (.xlsx) format
- Comprehensive test suite with 36 passing tests
- Complete documentation and examples
- TypeScript support with strict typing
- Compatible with @objectql/types Driver interface

### Security

- **IMPORTANT**: Uses ExcelJS (v4.4.0) instead of xlsx library to avoid known security vulnerabilities
- ExcelJS has no known CVEs and is actively maintained
- Secure against ReDoS (Regular Expression Denial of Service) attacks
- Protected from Prototype Pollution vulnerabilities

### Features

- ✅ Read from existing Excel files
- ✅ Write data back to Excel files
- ✅ Create new Excel files automatically
- ✅ Support for multiple object types (worksheets)
- ✅ Filter operators: =, !=, >, >=, <, <=, in, nin, contains, startswith, endswith, between
- ✅ Logical operators: AND, OR
- ✅ Sorting (ascending/descending)
- ✅ Pagination (skip/limit)
- ✅ Field projection
- ✅ Count and distinct queries
- ✅ Error handling with ObjectQLError
- ✅ Strict mode support
- ✅ Auto-generated IDs
- ✅ Timestamps (created_at, updated_at)
- ✅ Async/await API with factory pattern

### Dependencies

- exceljs@^4.4.0 - Secure Excel file read/write library (actively maintained, no known CVEs)
- @objectql/types@workspace:\* - Core ObjectQL types

### API Changes

- Constructor requires async initialization via `ExcelDriver.create()` factory method
- All file I/O operations are properly async for better performance
