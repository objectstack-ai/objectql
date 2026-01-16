# @objectql/driver-excel

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
- @objectql/types@workspace:* - Core ObjectQL types

### API Changes

- Constructor requires async initialization via `ExcelDriver.create()` factory method
- All file I/O operations are properly async for better performance
