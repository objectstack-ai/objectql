# Release Notes - Version 4.0.4

**Release Date:** February 2, 2026  
**Version:** 4.0.4  
**Type:** Patch Release

## Overview

This patch release (v4.0.4) includes important bug fixes, driver improvements, and enhanced test coverage across the entire ObjectQL ecosystem. All packages in the monorepo have been synchronized to version 4.0.4.

## What's New

### Driver Improvements

#### MongoDB Driver
- ✅ Fixed bulk operations (insertMany, updateMany, deleteMany)
- ✅ Added transaction support for atomic operations
- ✅ Improved type safety in update methods
- ✅ Better handling of atomic operators ($set, $inc, etc.)
- ✅ Fixed return value expectations for consistency

#### FileSystem Driver
- ✅ Fixed TCK test compatibility with dataDir parameter
- ✅ Improved file system operations and error handling

#### SQL Driver
- ✅ Enhanced TCK test compatibility
- ✅ Fixed test failures and improved stability
- ✅ Better support for different SQL dialects

#### Redis Driver
- ✅ Improved TCK test configuration
- ✅ Updated dependencies for better compatibility
- ✅ Enhanced query support

#### Driver Utilities
- ✅ Added new `@objectql/driver-utils` package for shared functionality
- ✅ Common utilities for driver development
- ✅ Standardized implementation patterns

### Testing & Quality Assurance

- ✅ Added comprehensive TCK (Technology Compatibility Kit) compliance tests for all drivers
- ✅ Expanded TCK test suite from basic tests to 30+ comprehensive tests
- ✅ Enhanced test infrastructure with better error handling
- ✅ Added `--passWithNoTests` flag for packages without tests
- ✅ Improved integration test coverage

### Type Safety Enhancements

- ✅ Improved type safety in MongoDB driver update methods
- ✅ Better handling of atomic operators with proper TypeScript types
- ✅ Enhanced type definitions across driver layer
- ✅ Stricter type checking for query operations

### Documentation

- ✅ Added comprehensive driver documentation
- ✅ Enhanced official documentation with Phase 2 implementation summaries
- ✅ Improved protocol layer documentation
- ✅ Better examples and usage guides

### Infrastructure

- ✅ Standardized driver layer implementation
- ✅ Enhanced protocol layer with better abstraction
- ✅ Improved GitHub Actions workflow configurations
- ✅ Better CI/CD pipeline stability
- ✅ Fixed changeset configuration for proper versioning

## Packages Updated

All ObjectQL packages have been updated to version 4.0.4:

### Foundation Layer
- `@objectql/types@4.0.4` - Core type definitions
- `@objectql/core@4.0.4` - Core engine
- `@objectql/platform-node@4.0.4` - Node.js platform utilities
- `@objectql/plugin-security@4.0.4` - Security plugin
- `@objectql/plugin-validator@4.0.4` - Validation plugin
- `@objectql/plugin-formula@4.0.4` - Formula plugin
- `@objectql/plugin-ai-agent@4.0.4` - AI agent plugin

### Drivers
- `@objectql/driver-sql@4.0.4` - SQL database driver
- `@objectql/driver-mongo@4.0.4` - MongoDB driver
- `@objectql/driver-redis@4.0.4` - Redis driver
- `@objectql/driver-memory@4.0.4` - In-memory driver
- `@objectql/driver-fs@4.0.4` - File system driver
- `@objectql/driver-localstorage@4.0.4` - LocalStorage driver
- `@objectql/driver-excel@4.0.4` - Excel driver
- `@objectql/driver-utils@4.0.4` - Driver utilities
- `@objectql/sdk@4.0.4` - Remote HTTP driver/SDK

### Protocols
- `@objectql/protocol-graphql@4.0.4` - GraphQL protocol
- `@objectql/protocol-odata-v4@4.0.4` - OData v4 protocol
- `@objectql/protocol-json-rpc@4.0.4` - JSON-RPC protocol
- `@objectql/protocol-tck@4.0.4` - Protocol TCK

### Tools
- `@objectql/cli@4.0.4` - Command-line interface
- `@objectql/create@4.0.4` - Project scaffolding tool
- `@objectql/driver-tck@4.0.4` - Driver TCK

### Examples
- `@objectql/example-hello-world@4.0.4`
- `@objectql/example-project-tracker@4.0.4`
- `@objectql/example-enterprise-erp@4.0.4`
- `@objectql/example-excel-demo@4.0.4`
- `@objectql/example-express-server@4.0.4`
- `@objectql/example-browser@4.0.4`
- `@objectql/example-multi-protocol-server@4.0.4`

## Installation

To upgrade to version 4.0.4, update your package.json dependencies:

```json
{
  "dependencies": {
    "@objectql/core": "^4.0.4",
    "@objectql/driver-sql": "^4.0.4"
  }
}
```

Then run:
```bash
npm install
# or
pnpm install
# or
yarn install
```

## Migration Guide

This is a **patch release** with no breaking changes. Simply update your package versions and reinstall dependencies.

### MongoDB Driver Users

If you're using the MongoDB driver's bulk operations (insertMany, updateMany, deleteMany), the return values are now more consistent with the driver API. No code changes are required, but you may notice improved type safety.

### FileSystem Driver Users

If you're using the FileSystem driver with TCK tests, the driver now properly handles the `dataDir` parameter. Existing code will continue to work without changes.

## Build Status

✅ **30 of 31 packages built successfully**  
✅ **Version synchronization verified (23 core packages)**  
✅ **All core packages ready for publication**

**Note:** The documentation site build failed due to network constraints (Google Fonts), but all core packages built successfully and are ready for publication.

## Breaking Changes

None. This release maintains full backward compatibility with v4.0.3.

## Known Issues

- The documentation site (`@objectql/site`) build fails in restricted network environments due to Google Fonts dependency. This does not affect core package functionality.

## Next Steps

After merging this PR:
1. Packages can be published to npm using `pnpm run release`
2. A git tag `@objectql/types@4.0.4` (or similar) will be created automatically
3. A GitHub release should be created from the tag

## Upgrade Recommendations

We recommend all users upgrade to v4.0.4 to benefit from:
- Improved MongoDB driver stability
- Better test coverage across all drivers
- Enhanced type safety
- Bug fixes and performance improvements

## Links

- [GitHub Repository](https://github.com/objectstack-ai/objectql)
- [Documentation](https://protocol.objectstack.ai)
- [Changelog](./packages/foundation/types/CHANGELOG.md)

---

**For questions or issues, please open an issue on GitHub.**
