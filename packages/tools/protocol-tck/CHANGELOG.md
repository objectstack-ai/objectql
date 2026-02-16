# Changelog

## 4.2.2

## 4.2.1

### Patch Changes

- a0aa26a: Unify all package versions and release a patch

## 4.2.0

### Minor Changes

- Release v4.2.0
  - Protocol layer: Added GraphQL, JSON-RPC, and OData v4 protocol adapters
  - Drivers: Added Excel, filesystem, and Redis drivers
  - Plugins: Added formula engine, security RBAC, and validator plugins
  - CLI: Added `objectql create` scaffolding tool
  - Core: Performance improvements and strict type enforcement
  - Testing: Added Driver TCK and Protocol TCK conformance suites

## 4.0.6

## 4.0.5

### Patch Changes

- Patch release 4.0.5 - Bug fixes and stability improvements

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

## 4.0.3

### Added

- Initial release of Protocol TCK
- Core CRUD operation tests
- Query operation tests (filter, pagination, sorting)
- Metadata operation tests
- Error handling tests
- Batch operation tests
- Performance benchmarking support
- Comprehensive test coverage for all ObjectQL protocols
