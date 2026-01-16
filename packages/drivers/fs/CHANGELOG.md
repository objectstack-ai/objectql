# Changelog

All notable changes to the @objectql/driver-fs package will be documented in this file.

## [0.1.1] - 2024-01-16

### Added
- `initialData` configuration option to pre-populate data on initialization
- `clear(objectName)` method to clear all data for a specific object
- `clearAll()` method to clear all data from all objects
- `invalidateCache(objectName)` method to force cache reload
- `getCacheSize()` method to get the number of cached objects
- Chinese documentation (README.zh-CN.md)
- Better error handling for invalid JSON files
- Support for empty JSON files

### Improved
- Enhanced JSON parse error messages with more detailed information
- Better documentation with examples for all new features
- Added 7 new test cases (total: 36 tests)
- TypeScript configuration for proper workspace resolution

## [0.1.0] - 2024-01-16

### Added
- Initial release of FileSystem Driver for ObjectQL
- One JSON file per table/object type
- Atomic write operations with temp file + rename strategy
- Automatic backup files (`.bak`) on write
- Full query support (filters, sorting, pagination, field projection)
- Support for all standard Driver interface methods:
  - find, findOne, create, update, delete
  - count, distinct
  - createMany, updateMany, deleteMany
- Pretty-printed JSON for human readability
- Zero external dependencies (only @objectql/types)
- Comprehensive test suite with 30+ test cases
- Complete documentation and examples
