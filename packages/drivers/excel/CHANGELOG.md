# @objectql/driver-excel

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

### Dependencies

- xlsx@^0.18.5 - Excel file read/write library
- @objectql/types@workspace:* - Core ObjectQL types
