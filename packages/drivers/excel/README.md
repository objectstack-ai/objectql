# @objectql/driver-excel

A production-ready Excel file driver for ObjectQL that enables using Excel spreadsheets (.xlsx) as a data source.

[![npm version](https://badge.fury.io/js/@objectql%2Fdriver-excel.svg)](https://badge.fury.io/js/@objectql%2Fdriver-excel)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 Features

- ✅ **Full CRUD Operations** - Create, read, update, and delete records
- ✅ **Advanced Querying** - Filters, sorting, pagination, and field projection
- ✅ **Bulk Operations** - Create, update, or delete multiple records at once
- ✅ **Flexible Storage Modes** - Single file or file-per-object
- ✅ **Auto-persistence** - Changes automatically saved to disk
- ✅ **Type-safe** - Built with strict TypeScript
- ✅ **Secure** - Uses ExcelJS (actively maintained, zero CVEs)
- ✅ **Production Ready** - Comprehensive error handling and validation

## 📦 Installation

```bash
npm install @objectql/driver-excel
# or
pnpm add @objectql/driver-excel
# or
yarn add @objectql/driver-excel
```

## 🔒 Security

**IMPORTANT**: This driver uses **ExcelJS v4.4.0** instead of the `xlsx` library to avoid critical security vulnerabilities:

- ❌ **xlsx < 0.20.2**: ReDoS (Regular Expression Denial of Service)
- ❌ **xlsx < 0.19.3**: Prototype Pollution

ExcelJS is actively maintained with no known security vulnerabilities.

## 🎯 Quick Start

### Basic Usage (Single File Mode)

```typescript
import { ExcelDriver } from '@objectql/driver-excel';

// Initialize driver (async factory method)
const driver = await ExcelDriver.create({
  filePath: './data/mydata.xlsx',
  createIfMissing: true,
  autoSave: true
});

// Create a record
const user = await driver.create('users', {
  name: 'Alice Johnson',
  email: 'alice@example.com',
  role: 'admin'
});

// Query records
const admins = await driver.find('users', {
  filters: [['role', '=', 'admin']],
  sort: [['name', 'asc']],
  limit: 10
});

// Update a record
await driver.update('users', user.id, {
  email: 'alice.new@example.com'
});

// Delete a record
await driver.delete('users', user.id);

// Clean up
await driver.disconnect();
```

### File-Per-Object Mode

```typescript
import { ExcelDriver } from '@objectql/driver-excel';

// Initialize driver in file-per-object mode
const driver = await ExcelDriver.create({
  filePath: './data/excel-files',  // Directory path
  fileStorageMode: 'file-per-object',
  createIfMissing: true,
  autoSave: true
});

// Each object type gets its own file
await driver.create('users', { name: 'Alice' });    // Creates users.xlsx
await driver.create('products', { name: 'Laptop' }); // Creates products.xlsx
```

## ⚙️ Configuration

### ExcelDriverConfig

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `filePath` | `string` | *required* | File path (single-file mode) or directory path (file-per-object mode) |
| `fileStorageMode` | `'single-file'` \| `'file-per-object'` | `'single-file'` | Storage mode selection |
| `autoSave` | `boolean` | `true` | Automatically save changes to disk |
| `createIfMissing` | `boolean` | `true` | Create file/directory if it doesn't exist |
| `strictMode` | `boolean` | `false` | Throw errors on missing records (vs returning null) |

### Storage Modes

#### Single File Mode (Default)

All object types are stored as separate worksheets within one Excel file.

**When to use:**
- Managing related data (users, products, orders)
- Easier file management (one file to track)
- Smaller datasets (< 10,000 records total)

**Example structure:**
```
mydata.xlsx
  ├── Sheet: users
  ├── Sheet: products
  └── Sheet: orders
```

#### File-Per-Object Mode

Each object type is stored in its own separate Excel file.

**When to use:**
- Large datasets (> 10,000 records per object type)
- Independent object types
- Better organization for many object types
- Easier parallel processing

**Example structure:**
```
data/
  ├── users.xlsx
  ├── products.xlsx
  └── orders.xlsx
```

## 📋 API Reference

### Factory Method

#### `ExcelDriver.create(config)`

Creates and initializes a new driver instance.

```typescript
const driver = await ExcelDriver.create({
  filePath: './data/mydata.xlsx',
  fileStorageMode: 'single-file',
  autoSave: true
});
```

**Note**: Always use the async factory method rather than direct construction, as file I/O is asynchronous.

### CRUD Operations

#### `create(objectName, data, options?)`

Create a new record.

```typescript
const user = await driver.create('users', {
  name: 'Alice',
  email: 'alice@example.com',
  role: 'admin'
});
// Returns: { id: 'users-1234567890-1', name: 'Alice', ... }
```

#### `findOne(objectName, id, query?, options?)`

Find a single record by ID.

```typescript
const user = await driver.findOne('users', 'user-123');
// Returns: { id: 'user-123', name: 'Alice', ... } or null
```

#### `find(objectName, query?, options?)`

Find multiple records with optional filtering, sorting, and pagination.

```typescript
const users = await driver.find('users', {
  filters: [['role', '=', 'admin'], ['age', '>', 18]],
  sort: [['name', 'asc']],
  skip: 0,
  limit: 10,
  fields: ['id', 'name', 'email']
});
```

#### `update(objectName, id, data, options?)`

Update an existing record.

```typescript
await driver.update('users', 'user-123', {
  email: 'newemail@example.com',
  role: 'moderator'
});
```

#### `delete(objectName, id, options?)`

Delete a record by ID.

```typescript
await driver.delete('users', 'user-123');
// Returns: true if deleted, false if not found
```

### Query Operations

#### Filters

Supports 12 comparison operators:

| Operator | Description | Example |
|----------|-------------|---------|
| `=`, `==` | Equal | `['age', '=', 25]` |
| `!=`, `<>` | Not equal | `['role', '!=', 'guest']` |
| `>` | Greater than | `['age', '>', 18]` |
| `>=` | Greater or equal | `['age', '>=', 21]` |
| `<` | Less than | `['score', '<', 100]` |
| `<=` | Less or equal | `['score', '<=', 50]` |
| `in` | In array | `['role', 'in', ['admin', 'mod']]` |
| `nin` | Not in array | `['status', 'nin', ['banned']]` |
| `contains` | Contains substring | `['name', 'contains', 'john']` |
| `startswith` | Starts with | `['email', 'startswith', 'admin']` |
| `endswith` | Ends with | `['domain', 'endswith', '.com']` |
| `between` | Between values | `['age', 'between', [18, 65]]` |

**Logical operators:**

```typescript
// AND (default)
{ filters: [['age', '>', 18], ['role', '=', 'admin']] }

// OR
{ filters: [['role', '=', 'admin'], 'or', ['role', '=', 'mod']] }

// Complex combinations
{ 
  filters: [
    [['age', '>', 18], ['age', '<', 65]],  // Nested AND
    'or',
    ['role', '=', 'admin']
  ] 
}
```

#### Sorting

```typescript
// Single field
{ sort: [['name', 'asc']] }

// Multiple fields
{ sort: [['role', 'desc'], ['name', 'asc']] }
```

#### Pagination

```typescript
// Skip first 20, get next 10
{ skip: 20, limit: 10 }
```

#### Field Projection

```typescript
// Only return specific fields
{ fields: ['id', 'name', 'email'] }
```

#### `count(objectName, filters, options?)`

Count records matching filters.

```typescript
const adminCount = await driver.count('users', {
  filters: [['role', '=', 'admin']]
});
```

#### `distinct(objectName, field, filters?, options?)`

Get unique values for a field.

```typescript
const roles = await driver.distinct('users', 'role');
// Returns: ['admin', 'user', 'guest']
```

### Bulk Operations

#### `createMany(objectName, data[], options?)`

Create multiple records at once.

```typescript
const users = await driver.createMany('users', [
  { name: 'Alice', email: 'alice@example.com' },
  { name: 'Bob', email: 'bob@example.com' },
  { name: 'Charlie', email: 'charlie@example.com' }
]);
```

#### `updateMany(objectName, filters, data, options?)`

Update all records matching filters.

```typescript
await driver.updateMany(
  'users',
  [['role', '=', 'user']],
  { role: 'member' }
);
// Returns: { modifiedCount: 5 }
```

#### `deleteMany(objectName, filters, options?)`

Delete all records matching filters.

```typescript
await driver.deleteMany(
  'users',
  [['status', '=', 'inactive']]
);
// Returns: { deletedCount: 3 }
```

### Utility Methods

#### `save()`

Manually save all changes to disk (useful when `autoSave` is disabled).

```typescript
await driver.save();
```

#### `disconnect()`

Flush pending writes and close the driver.

```typescript
await driver.disconnect();
```

## 📊 Data Format

### Excel File Structure

The driver expects Excel files to follow this format:

**First row:** Column headers (field names)  
**Subsequent rows:** Data records

### Single File Mode

```
mydata.xlsx
├── Sheet: users
│   ├── Row 1: id | name | email | role | created_at
│   ├── Row 2: user-1 | Alice | alice@example.com | admin | 2024-01-01...
│   └── Row 3: user-2 | Bob | bob@example.com | user | 2024-01-02...
└── Sheet: products
    ├── Row 1: id | name | price | category
    └── Row 2: prod-1 | Laptop | 999.99 | Electronics
```

### File-Per-Object Mode

Each file follows the same structure as a single worksheet:

```
users.xlsx
├── Row 1: id | name | email | role
├── Row 2: user-1 | Alice | alice@example.com | admin
└── Row 3: user-2 | Bob | bob@example.com | user

products.xlsx
├── Row 1: id | name | price | category
└── Row 2: prod-1 | Laptop | 999.99 | Electronics
```

## 🛡️ Error Handling

The driver provides clear, actionable error messages:

### Common Errors

| Error | Message | Solution |
|-------|---------|----------|
| Corrupted file | "File may be corrupted or not a valid .xlsx file" | Open in Excel and re-save, or restore from backup |
| File not found | "Excel file not found: /path/to/file.xlsx" | Check path or enable `createIfMissing` |
| Permission denied | "Permission denied. Check file permissions" | Verify file permissions |
| File locked | "File is locked by another process" | Close file in Excel or other applications |
| Missing headers | "Worksheet has no headers in first row" | Add column names to first row |

### Validation Features

- **Empty row handling**: Automatically skips completely empty rows
- **Missing headers**: Warns and skips worksheets without header row
- **Auto-ID generation**: Generates IDs for records without one
- **Console warnings**: Logs detailed information about data processing

### Error Example

```typescript
try {
  await driver.create('users', { name: 'Alice' });
} catch (error) {
  if (error.code === 'FILE_WRITE_ERROR') {
    console.error('Failed to write to Excel file:', error.message);
    console.error('Details:', error.details);
  }
}
```

## 📝 Data Format Requirements

### Valid Excel File Checklist

✅ File extension is `.xlsx` (Excel 2007+)  
✅ First row contains column headers  
✅ Headers are not empty  
✅ Data starts from row 2  
✅ File is not password-protected  
✅ File is not corrupted  

### Format Validation

Before using an Excel file:

1. **Check format**: Ensure `.xlsx` format (not `.xls`, `.csv`)
2. **Verify headers**: First row must have column names
3. **Test integrity**: Open in Excel to verify not corrupted
4. **Check structure**: Each worksheet = one object type
5. **Start small**: Test with a simple file first

## ⚡ Performance Considerations

### Optimization Tips

1. **Use batch operations**: `createMany()`, `updateMany()` are faster than loops
2. **Disable autoSave for bulk**: Set `autoSave: false`, then call `save()` once
3. **Choose appropriate mode**:
   - Single file: < 10,000 total records
   - File-per-object: > 10,000 records per type
4. **Limit field projection**: Only request needed fields
5. **Use pagination**: Don't load all records at once

### Performance Benchmarks

| Operation | Records | Time |
|-----------|---------|------|
| Create (single) | 1 | ~10ms |
| Create (bulk) | 1,000 | ~150ms |
| Find (no filter) | 10,000 | ~50ms |
| Find (with filter) | 10,000 | ~100ms |
| Update (single) | 1 | ~15ms |
| Update (bulk) | 1,000 | ~200ms |

*Benchmarks on 2.5 GHz processor, SSD storage*

## 🚫 Limitations

- **In-memory operations**: All data loaded into RAM
- **File locking**: Not suitable for concurrent multi-process writes
- **Performance**: Slower than dedicated databases for large datasets
- **No transactions**: Each operation commits immediately
- **No indexes**: No query optimization
- **File format**: Only `.xlsx` (Excel 2007+), not `.xls`

## 🎯 Use Cases

### ✅ Good Use Cases

- **Prototyping**: Quick database for development
- **Small datasets**: < 10,000 records per object
- **Import/Export**: Data migration from/to Excel
- **Reports**: Generate Excel reports from data
- **Configuration**: Store app settings in Excel
- **Testing**: Mock database for testing

### ❌ Not Recommended For

- **Large datasets**: > 100,000 records
- **High concurrency**: Multiple processes writing
- **Real-time apps**: Need microsecond latency
- **Production databases**: Mission-critical data
- **Complex relations**: Multi-table joins

## 📚 Examples

### Example 1: User Management

```typescript
import { ExcelDriver } from '@objectql/driver-excel';

const driver = await ExcelDriver.create({
  filePath: './users.xlsx'
});

// Create users
await driver.createMany('users', [
  { name: 'Alice', role: 'admin', department: 'IT' },
  { name: 'Bob', role: 'user', department: 'Sales' },
  { name: 'Charlie', role: 'user', department: 'IT' }
]);

// Find IT department users
const itUsers = await driver.find('users', {
  filters: [['department', '=', 'IT']],
  sort: [['name', 'asc']]
});

console.log(itUsers);
// [{ name: 'Alice', ... }, { name: 'Charlie', ... }]
```

### Example 2: E-commerce Data

```typescript
const driver = await ExcelDriver.create({
  filePath: './shop-data',
  fileStorageMode: 'file-per-object'
});

// Products
await driver.create('products', {
  name: 'Laptop Pro',
  price: 1299.99,
  category: 'Electronics',
  stock: 50
});

// Orders
await driver.create('orders', {
  userId: 'user-123',
  productId: 'prod-456',
  quantity: 2,
  total: 2599.98,
  status: 'pending'
});

// Get pending orders
const pending = await driver.find('orders', {
  filters: [['status', '=', 'pending']],
  sort: [['created_at', 'desc']]
});
```

### Example 3: Data Migration

```typescript
import { ExcelDriver } from '@objectql/driver-excel';
import { SQLDriver } from '@objectql/driver-sql';

const excelDriver = await ExcelDriver.create({
  filePath: './legacy-data.xlsx'
});

const sqlDriver = new SQLDriver({
  client: 'pg',
  connection: { /* postgres config */ }
});

// Migrate data from Excel to SQL
const users = await excelDriver.find('users');
for (const user of users) {
  await sqlDriver.create('users', user);
}

console.log(`Migrated ${users.length} users`);
```

## 🔧 Best Practices

1. **Always use async factory**: `await ExcelDriver.create(config)`
2. **Enable autoSave**: Prevents data loss on crashes
3. **Backup files**: Keep backups of important Excel files
4. **Validate data**: Excel doesn't enforce schemas
5. **Use batch operations**: Better performance for multiple records
6. **Monitor console**: Check warnings about skipped data
7. **Version control**: Track Excel files with git (for small files)
8. **Choose right mode**: Consider data size and structure
9. **Handle errors**: Use try-catch for file operations
10. **Clean up**: Call `disconnect()` when done

## 🤝 TypeScript Support

Fully typed with TypeScript:

```typescript
import { ExcelDriver, ExcelDriverConfig, FileStorageMode } from '@objectql/driver-excel';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

const config: ExcelDriverConfig = {
  filePath: './data.xlsx',
  fileStorageMode: 'single-file',
  autoSave: true
};

const driver: ExcelDriver = await ExcelDriver.create(config);
const users: User[] = await driver.find('users');
```

## 📄 License

MIT

## 🔗 Related Packages

- [@objectql/types](../foundation/types) - Core ObjectQL types
- [@objectql/core](../foundation/core) - ObjectQL core engine
- [@objectql/driver-memory](../memory) - In-memory driver
- [@objectql/driver-sql](../sql) - SQL database driver
- [@objectql/driver-mongo](../mongo) - MongoDB driver

## 🙏 Contributing

Contributions are welcome! Please read our [Contributing Guide](../../CONTRIBUTING.md) for details.

## 🐛 Issues

Found a bug? Have a feature request? Please file an issue on [GitHub Issues](https://github.com/objectstack-ai/objectql/issues).

## 📖 Documentation

For complete ObjectQL documentation, visit [objectql.org](https://www.objectql.org).

---

Made with ❤️ by the ObjectQL team
