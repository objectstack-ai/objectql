# Changelog

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
