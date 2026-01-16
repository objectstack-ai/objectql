# Changelog

All notable changes to the @objectql/driver-fs package will be documented in this file.

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
