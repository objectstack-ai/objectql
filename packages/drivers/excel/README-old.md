# @objectql/driver-excel

Excel file driver for ObjectQL - Read and write data from Excel spreadsheets (.xlsx).

## Features

✅ **Full CRUD Operations** - Create, read, update, and delete records  
✅ **Excel File Storage** - Use Excel files as a data source  
✅ **Multiple Worksheets** - Each object type gets its own worksheet  
✅ **Query Support** - Filters, sorting, pagination, and field projection  
✅ **Auto-persistence** - Changes automatically saved to file  
✅ **Type-safe** - Built with strict TypeScript  
✅ **Zero Config** - Works out of the box with minimal setup  
✅ **Secure** - Uses ExcelJS (no known CVEs, actively maintained)  

## Security

**IMPORTANT**: This driver uses **ExcelJS v4.4.0** instead of the `xlsx` library to avoid critical security vulnerabilities:

- ❌ **xlsx < 0.20.2**: ReDoS (Regular Expression Denial of Service)
- ❌ **xlsx < 0.19.3**: Prototype Pollution

ExcelJS is actively maintained with no known security vulnerabilities.

## Installation

```bash
pnpm add @objectql/driver-excel
```

## Quick Start

```typescript
import { ExcelDriver } from '@objectql/driver-excel';

// Create driver instance (async factory method)
const driver = await ExcelDriver.create({
  filePath: './data/mydata.xlsx',
  createIfMissing: true,
  autoSave: true
});

// Create records
const user = await driver.create('users', {
  name: 'Alice',
  email: 'alice@example.com',
  role: 'admin'
});

// Query records
const users = await driver.find('users', {
  filters: [['role', '=', 'admin']],
  sort: [['name', 'asc']],
  limit: 10
});

// Update records
await driver.update('users', user.id, {
  email: 'alice.new@example.com'
});

// Delete records
await driver.delete('users', user.id);
```

## Important: Async Initialization

Due to the async nature of ExcelJS file operations, you must use the **async factory method**:

```typescript
// ✅ Correct - Use factory method
const driver = await ExcelDriver.create(config);

// ❌ Incorrect - Direct constructor doesn't load file
const driver = new ExcelDriver(config);
```

## Configuration

### ExcelDriverConfig

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `filePath` | `string` | *required* | Path to the Excel file |
| `autoSave` | `boolean` | `true` | Automatically save changes to file |
| `createIfMissing` | `boolean` | `true` | Create file if it doesn't exist |
| `strictMode` | `boolean` | `false` | Throw errors on missing records |

### Example Configuration

```typescript
const driver = new ExcelDriver({
  filePath: './data/database.xlsx',
  autoSave: true,        // Save on every change
  createIfMissing: true, // Create file if not exists
  strictMode: false      // Don't throw on missing records
});
```

## How It Works

### Data Storage Format

**Important**: The Excel file must follow this structure:

- **One file** contains multiple worksheets
- **Each worksheet = One object type** (e.g., `users`, `products`)
- **First row = Column headers** (field names like `id`, `name`, `email`)
- **Subsequent rows = Data records**

Example Excel structure:

**Sheet: users**
| id | name | email | role | created_at |
|----|------|-------|------|------------|
| user-1 | Alice | alice@example.com | admin | 2024-01-01T00:00:00Z |
| user-2 | Bob | bob@example.com | user | 2024-01-02T00:00:00Z |

**Sheet: products**
| id | name | price | category |
|----|------|-------|----------|
| prod-1 | Laptop | 999.99 | Electronics |

### Workflow

1. **Load**: Reads Excel file into memory on initialization
2. **Query**: Performs operations in-memory (fast!)
3. **Persist**: Writes changes back to Excel file
4. **Auto-save**: Enabled by default for data safety

### Error Handling

The driver provides clear error messages for common issues:

**Corrupted or Invalid Files:**
```
Failed to read Excel file - File may be corrupted or not a valid .xlsx file
```

**File Format Issues:**
- Missing headers: Worksheets without headers in the first row are skipped with a warning
- Empty rows: Completely empty rows are automatically skipped
- Missing ID field: IDs are auto-generated if not present

**File Access Issues:**
```
Failed to read Excel file - Permission denied. Check file permissions.
Failed to read Excel file - File is locked by another process. Close it and try again.
```

**Data Format Mismatch:**
If an existing Excel file doesn't match the expected format (no headers, wrong structure), the driver will:
1. Log a warning to the console
2. Skip problematic worksheets
3. Continue loading valid worksheets
4. You can check console output for warnings about skipped data

## API Reference

### CRUD Operations

#### `create(objectName, data, options?)`
Create a new record.

```typescript
const user = await driver.create('users', {
  name: 'Alice',
  email: 'alice@example.com'
});
```

#### `findOne(objectName, id, query?, options?)`
Find a single record by ID.

```typescript
const user = await driver.findOne('users', 'user-123');
```

#### `find(objectName, query?, options?)`
Find multiple records with optional filtering, sorting, and pagination.

```typescript
const users = await driver.find('users', {
  filters: [['role', '=', 'admin']],
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
  email: 'newemail@example.com'
});
```

#### `delete(objectName, id, options?)`
Delete a record.

```typescript
await driver.delete('users', 'user-123');
```

### Query Operations

#### `count(objectName, filters, options?)`
Count records matching filters.

```typescript
const count = await driver.count('users', {
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
await driver.createMany('users', [
  { name: 'Alice', email: 'alice@example.com' },
  { name: 'Bob', email: 'bob@example.com' }
]);
```

#### `updateMany(objectName, filters, data, options?)`
Update multiple records matching filters.

```typescript
await driver.updateMany(
  'users',
  [['role', '=', 'user']],
  { role: 'member' }
);
```

#### `deleteMany(objectName, filters, options?)`
Delete multiple records matching filters.

```typescript
await driver.deleteMany(
  'users',
  [['status', '=', 'inactive']]
);
```

### Utility Methods

#### `save()`
Manually save the workbook to file.

```typescript
await driver.save();
```

#### `disconnect()`
Flush any pending writes and close the driver.

```typescript
await driver.disconnect();
```

## Filter Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `=`, `==` | Equals | `['age', '=', 25]` |
| `!=`, `<>` | Not equals | `['status', '!=', 'inactive']` |
| `>` | Greater than | `['age', '>', 18]` |
| `>=` | Greater or equal | `['age', '>=', 18]` |
| `<` | Less than | `['age', '<', 65]` |
| `<=` | Less or equal | `['age', '<=', 65]` |
| `in` | In array | `['role', 'in', ['admin', 'user']]` |
| `nin` | Not in array | `['status', 'nin', ['banned', 'deleted']]` |
| `contains` | String contains | `['name', 'contains', 'ali']` |
| `startswith` | String starts with | `['email', 'startswith', 'admin']` |
| `endswith` | String ends with | `['email', 'endswith', '@example.com']` |
| `between` | Between values | `['age', 'between', [18, 65]]` |

### Complex Filters

```typescript
// AND conditions (default)
const admins = await driver.find('users', {
  filters: [
    ['role', '=', 'admin'],
    ['status', '=', 'active']
  ]
});

// OR conditions
const results = await driver.find('users', {
  filters: [
    ['role', '=', 'admin'],
    'or',
    ['role', '=', 'moderator']
  ]
});
```

## Use Cases

### 1. Data Import/Export

```typescript
// Import from existing Excel file
const driver = new ExcelDriver({
  filePath: './imports/customers.xlsx'
});

const customers = await driver.find('customers');
console.log(`Imported ${customers.length} customers`);
```

### 2. Simple Database for Prototyping

```typescript
// Use Excel as a quick database during development
const db = new ExcelDriver({
  filePath: './dev-data.xlsx',
  createIfMissing: true
});

await db.create('tasks', {
  title: 'Build prototype',
  status: 'in-progress'
});
```

### 3. Report Generation

```typescript
// Generate Excel reports from application data
const driver = new ExcelDriver({
  filePath: './reports/monthly-report.xlsx'
});

await driver.createMany('sales', salesData);
await driver.createMany('analytics', analyticsData);
```

### 4. Data Migration

```typescript
// Migrate data from Excel to another database
const excelDriver = new ExcelDriver({
  filePath: './legacy-data.xlsx'
});

const sqlDriver = new SqlDriver(config);

const records = await excelDriver.find('users');
for (const record of records) {
  await sqlDriver.create('users', record);
}
```

## Limitations

- **In-memory operations**: Large files (10,000+ rows) may consume significant memory
- **File locking**: Not suitable for concurrent multi-process writes
- **Performance**: Slower than dedicated databases for large datasets
- **Query optimization**: No indexes or query optimization
- **File format**: Only supports .xlsx format (Excel 2007+), not .xls (Excel 97-2003)

## Data Format Requirements

To ensure proper operation, Excel files must follow these requirements:

### File Structure
✅ **Valid .xlsx file** (Excel 2007+ format)  
✅ **First row contains headers** (column names)  
✅ **One worksheet per object type**  
✅ **Consistent column structure** within each worksheet  

### Common Issues and Solutions

| Issue | Symptom | Solution |
|-------|---------|----------|
| Corrupted file | `FILE_READ_ERROR: File may be corrupted` | Open in Excel, save as new .xlsx file, or restore from backup |
| No headers | Warning: `Worksheet has no headers` | Add column names in first row (id, name, email, etc.) |
| File locked | `File is locked by another process` | Close the file in Excel or other applications |
| Permission denied | `Permission denied` | Check file permissions, run with appropriate access rights |
| Wrong format | Data not loading | Ensure first row has headers, data starts from row 2 |
| Empty rows | Rows skipped | Empty rows are automatically ignored, check console warnings |

### Validating Your Excel File

Before using an Excel file with the driver:

1. **Check file format**: Ensure it's `.xlsx` (not `.xls`, `.csv`, or other formats)
2. **Verify headers**: First row of each worksheet should contain column names
3. **Check for corruption**: Open file in Excel to verify it's not corrupted
4. **Review structure**: Each worksheet should represent one object type
5. **Test with small file first**: Start with a simple file to verify compatibility

## Best Practices

1. **Use for appropriate scale**: Best for < 10,000 records per sheet
2. **Enable autoSave**: Prevents data loss on crashes
3. **Backup files**: Keep backups of important Excel files
4. **Validate data**: Excel doesn't enforce schemas - validate in your app
5. **Batch operations**: Use `createMany`/`updateMany` for better performance
6. **Monitor console warnings**: Check for warnings about skipped worksheets or rows
7. **Use version control**: Track Excel file changes with git for critical data

## TypeScript Support

Fully typed with TypeScript:

```typescript
import { ExcelDriver, ExcelDriverConfig } from '@objectql/driver-excel';

const config: ExcelDriverConfig = {
  filePath: './data.xlsx',
  autoSave: true
};

const driver: ExcelDriver = new ExcelDriver(config);
```

## License

MIT

## Related

- [@objectql/types](../foundation/types) - Core ObjectQL types
- [@objectql/driver-memory](../memory) - In-memory driver
- [@objectql/driver-sql](../sql) - SQL database driver
- [@objectql/driver-mongo](../mongo) - MongoDB driver
