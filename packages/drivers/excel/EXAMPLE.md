# Excel Driver - Simple Example

This example demonstrates how to use the Excel Driver for ObjectQL.

## Installation

```bash
pnpm add @objectql/driver-excel
```

## Basic Usage

```typescript
import { ExcelDriver } from '@objectql/driver-excel';

// Initialize driver with Excel file
const driver = new ExcelDriver({
  filePath: './data/mydata.xlsx',
  createIfMissing: true,
  autoSave: true
});

// Create records
const user1 = await driver.create('users', {
  name: 'Alice Johnson',
  email: 'alice@example.com',
  role: 'admin',
  age: 30
});

const user2 = await driver.create('users', {
  name: 'Bob Smith',
  email: 'bob@example.com',
  role: 'user',
  age: 25
});

// Query records
const allUsers = await driver.find('users');
console.log('All users:', allUsers);

// Filter records
const admins = await driver.find('users', {
  filters: [['role', '=', 'admin']]
});
console.log('Admin users:', admins);

// Sort and paginate
const sortedUsers = await driver.find('users', {
  sort: [['age', 'desc']],
  limit: 10
});
console.log('Sorted users:', sortedUsers);

// Update a record
await driver.update('users', user1.id, {
  email: 'alice.new@example.com'
});

// Delete a record
await driver.delete('users', user2.id);

// Count records
const count = await driver.count('users', {});
console.log('Total users:', count);

// Clean up
await driver.disconnect();
```

## Advanced Features

### Multiple Object Types (Worksheets)

```typescript
// Create products
await driver.create('products', {
  name: 'Laptop',
  price: 999.99,
  category: 'Electronics'
});

// Create orders
await driver.create('orders', {
  userId: user1.id,
  productId: 'product-123',
  quantity: 2,
  total: 1999.98
});

// Each object type is stored in its own worksheet
const products = await driver.find('products');
const orders = await driver.find('orders');
```

### Complex Filters

```typescript
// AND conditions
const results = await driver.find('users', {
  filters: [
    ['age', '>', 18],
    ['role', '=', 'admin']
  ]
});

// OR conditions
const results2 = await driver.find('users', {
  filters: [
    ['role', '=', 'admin'],
    'or',
    ['role', '=', 'moderator']
  ]
});

// Contains search
const searchResults = await driver.find('users', {
  filters: [['name', 'contains', 'john']]
});
```

### Bulk Operations

```typescript
// Create many
await driver.createMany('users', [
  { name: 'User 1', email: 'user1@example.com' },
  { name: 'User 2', email: 'user2@example.com' },
  { name: 'User 3', email: 'user3@example.com' }
]);

// Update many
await driver.updateMany(
  'users',
  [['role', '=', 'user']],
  { role: 'member' }
);

// Delete many
await driver.deleteMany(
  'users',
  [['status', '=', 'inactive']]
);
```

### Manual Save Control

```typescript
// Disable auto-save for batch operations
const driver = new ExcelDriver({
  filePath: './data/batch.xlsx',
  autoSave: false
});

// Perform multiple operations
for (let i = 0; i < 1000; i++) {
  await driver.create('records', { index: i });
}

// Save once at the end
await driver.save();
```

## Excel File Structure

The Excel file will look like this:

**Sheet: users**
| id | name | email | role | age | created_at | updated_at |
|----|------|-------|------|-----|------------|------------|
| users-1234-1 | Alice Johnson | alice@example.com | admin | 30 | 2024-01-01T... | 2024-01-01T... |
| users-1234-2 | Bob Smith | bob@example.com | user | 25 | 2024-01-02T... | 2024-01-02T... |

**Sheet: products**
| id | name | price | category | created_at | updated_at |
|----|------|-------|----------|------------|------------|
| products-1234-1 | Laptop | 999.99 | Electronics | 2024-01-01T... | 2024-01-01T... |

## Use Cases

1. **Data Import/Export**: Import existing Excel data or export application data to Excel
2. **Prototyping**: Quick database for development without setting up a real database
3. **Reports**: Generate Excel reports from application data
4. **Data Migration**: Migrate data from Excel to other databases
5. **Small Projects**: Simple storage for projects with limited data needs

## Performance Considerations

- Best for datasets < 10,000 records per sheet
- All operations are in-memory (fast queries, but uses RAM)
- Auto-save writes to disk on every change (disable for batch operations)
- Not suitable for concurrent multi-process access

## Next Steps

- Explore the [full API documentation](./README.md)
- Check out other drivers: [SQL](../sql), [MongoDB](../mongo), [Memory](../memory)
- Learn about [ObjectQL](../../../README.md)
