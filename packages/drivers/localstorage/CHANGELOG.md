# Changelog

All notable changes to the LocalStorage Driver for ObjectQL will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-01-15

### Added
- Initial release of LocalStorage Driver
- Full implementation of ObjectQL Driver interface
- Browser localStorage persistence
- Automatic JSON serialization/deserialization
- Namespace support to avoid key conflicts
- Storage quota error handling
- Complete query support (filters, sorting, pagination)
- Bulk operations (createMany, updateMany, deleteMany)
- Distinct value queries
- Initial data loading
- Strict mode for error handling
- Comprehensive test suite (31 tests)
- Full documentation and README
- Support for all ObjectQL query operators:
  - Comparison: =, !=, >, >=, <, <=
  - Set: in, nin
  - String: contains, startswith, endswith
  - Range: between
  - Logical: and, or
- Utility methods (clear, getSize)
- Custom storage support for testing
- TypeScript type definitions

### Features
- ✅ Production-ready for browser-based applications
- ✅ Data persists across page refreshes
- ✅ Works in all modern browsers
- ✅ Namespace isolation for multi-app scenarios
- ✅ Graceful quota exceeded handling
- ✅ Zero external dependencies

### Use Cases
- Progressive Web Apps (PWAs)
- Client-side web applications
- Browser extensions
- User preference storage
- Offline-first applications
- Prototyping without backend

### Performance
- Create: O(1)
- Read by ID: O(1)
- Update: O(1)
- Delete: O(1)
- Find/Query: O(n)
- Count: O(n)
- Sort: O(n log n)

### Storage
- Key format: `{namespace}:{objectName}:{id}`
- Default namespace: `objectql`
- Typical browser limit: 5-10MB per origin
- Automatic JSON serialization

### Documentation
- Comprehensive README with examples
- API reference
- Configuration guide
- Storage management guide
- Browser compatibility information
- Migration guide
- Best practices
- Troubleshooting section

[0.1.0]: https://github.com/objectstack-ai/objectql/releases/tag/%40objectql/driver-localstorage%400.1.0
