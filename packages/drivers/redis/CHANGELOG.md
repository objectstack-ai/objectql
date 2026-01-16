# @objectql/driver-redis

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
