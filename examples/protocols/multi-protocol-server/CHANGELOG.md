# @objectql/example-multi-protocol-server

## 4.0.6

### Patch Changes

- Updated dependencies
  - @objectql/core@4.0.6
  - @objectql/driver-memory@4.0.6
  - @objectql/protocol-graphql@4.0.6
  - @objectql/protocol-json-rpc@4.0.6
  - @objectql/protocol-odata-v4@4.0.6
  - @objectql/types@4.0.6

## 4.0.5

### Patch Changes

- Updated dependencies
  - @objectql/core@4.0.5
  - @objectql/driver-memory@4.0.5
  - @objectql/protocol-graphql@4.0.5
  - @objectql/protocol-json-rpc@4.0.5
  - @objectql/protocol-odata-v4@4.0.5
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
  - @objectql/core@4.0.4
  - @objectql/driver-memory@4.0.4
  - @objectql/protocol-graphql@4.0.4
  - @objectql/protocol-json-rpc@4.0.4
  - @objectql/protocol-odata-v4@4.0.4
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

## 0.1.0

### Minor Changes

- Initial release of multi-protocol server example
