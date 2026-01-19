# Migration Guide: Unified ID Field

This guide helps you migrate from the legacy `_id` field to the unified `id` field API.

## What Changed?

ObjectQL now provides a **unified `id` field** across all database drivers:

- **Before**: MongoDB used `_id`, SQL used `id` - inconsistent API
- **After**: Both drivers use `id` at the API level - consistent API

The MongoDB driver now automatically maps between `id` (API) and `_id` (database) internally.

## Benefits

✅ **Consistent API**: Write database-agnostic code  
✅ **Easier Migration**: Switch between MongoDB and SQL without code changes  
✅ **Better Developer Experience**: No need to remember which driver uses which field  
✅ **Backward Compatible**: Legacy `_id` usage still works (MongoDB only)

## Migration Steps

### 1. Update Filters

**Before:**
```typescript
// MongoDB-specific code
const query = {
  filters: [['_id', '=', 'user-123']]
};
```

**After:**
```typescript
// Works with both MongoDB and SQL
const query = {
  filters: [['id', '=', 'user-123']]
};
```

### 2. Update Document Creation

**Before:**
```typescript
// MongoDB-specific code
const user = await app.create('users', {
  _id: 'user-123',
  name: 'Alice'
});
```

**After:**
```typescript
// Works with both MongoDB and SQL
const user = await app.create('users', {
  id: 'user-123',
  name: 'Alice'
});
```

### 3. Update Field Access in Results

**Before:**
```typescript
const users = await app.find('users', {});
console.log(users[0]._id); // MongoDB
console.log(users[0].id);  // SQL
```

**After:**
```typescript
const users = await app.find('users', {});
console.log(users[0].id);  // Works for both MongoDB and SQL
```

### 4. Update Sorting

**Before:**
```typescript
const query = {
  sort: [['_id', 'desc']]  // MongoDB-specific
};
```

**After:**
```typescript
const query = {
  sort: [['id', 'desc']]  // Works for both
};
```

### 5. Update Field Projection

**Before:**
```typescript
const query = {
  fields: ['_id', 'name', 'email']  // MongoDB-specific
};
```

**After:**
```typescript
const query = {
  fields: ['id', 'name', 'email']  // Works for both
};
```

## Automated Migration

You can use a find-and-replace tool to migrate your codebase:

### Search Patterns

1. **In Filters**: `['_id',` → `['id',`
2. **In Objects**: `_id:` → `id:`
3. **In Access**: `.\_id` → `.id`
4. **In Fields**: `'_id'` → `'id'`

### Example Script

```bash
# Search for _id usage in your codebase
grep -r "_id" src/

# Use your editor's find-and-replace with caution
# Or use a tool like:
find src/ -type f -name "*.ts" -exec sed -i "s/\['_id'/\['id'/g" {} +
```

**⚠️ Warning**: Always review changes manually and test thoroughly after automated replacement.

## Backward Compatibility

### MongoDB Driver

The MongoDB driver maintains **full backward compatibility** for `_id` usage:

- `_id` in **filters** is automatically mapped to MongoDB's `_id`
- `_id` in **sorting** is automatically mapped to MongoDB's `_id`
- `_id` in **field projections** is automatically mapped to MongoDB's `_id`
- `_id` in **create operations** is mapped to `id`
- Results **always** return `id` (not `_id`)

**Example:**
```typescript
// Legacy code - fully supported for backward compatibility
const query = {
  filters: [['_id', '=', 'user-123']],
  sort: [['_id', 'desc']],
  fields: ['_id', 'name', 'email']
};
const users = await app.find('users', query);

// Results use 'id' (not '_id')
console.log(users[0].id); // 'user-123'
console.log(users[0]._id); // undefined
```

**No Breaking Changes:** Your existing queries using `_id` will continue to work without modification. However, migrating to `id` is recommended for:
- Consistency with SQL drivers
- Database portability
- Future-proofing your code

### SQL Driver

The SQL driver has always used `id`, so no migration needed for SQL-only codebases.

For codebases using MongoDB-style `_id` with SQL:
```typescript
// Legacy code with _id
const user = await app.create('users', {
  _id: 'user-123',  // Automatically mapped to 'id'
  name: 'Alice'
});

// Result uses 'id'
console.log(user.id); // 'user-123'
```

## Testing Your Migration

After migrating, verify the following:

### 1. Create Operations
```typescript
const user = await app.create('users', {
  id: 'test-123',
  name: 'Test User'
});
assert(user.id === 'test-123');
assert(user._id === undefined); // Should not have _id
```

### 2. Find Operations
```typescript
const users = await app.find('users', {
  filters: [['id', '=', 'test-123']]
});
assert(users[0].id === 'test-123');
```

### 3. Update Operations
```typescript
await app.update('users', 'test-123', {
  name: 'Updated Name'
});
const updated = await app.findOne('users', 'test-123');
assert(updated.name === 'Updated Name');
```

### 4. Sort and Projection
```typescript
const users = await app.find('users', {
  fields: ['id', 'name'],
  sort: [['id', 'asc']]
});
assert(users[0].id !== undefined);
assert(users[0]._id === undefined);
```

## Database Migration

### MongoDB Collections

No database migration needed! The MongoDB driver:
- Continues to use `_id` in the database (MongoDB requirement)
- Automatically maps `id` ↔ `_id` at the driver level
- Existing data works without changes

### SQL Tables

If you have legacy SQL tables using `_id` as the primary key:

```sql
-- The driver will detect and automatically recreate tables
-- But you can also migrate manually:

-- Option 1: Rename column (PostgreSQL)
ALTER TABLE users RENAME COLUMN _id TO id;

-- Option 2: Create new table and migrate data
CREATE TABLE users_new (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255),
  -- ... other columns
);

INSERT INTO users_new (id, name, ...)
SELECT _id, name, ... FROM users;

DROP TABLE users;
ALTER TABLE users_new RENAME TO users;
```

## Common Issues

### Issue: `undefined` for `id` field

**Cause**: Using old code that accesses `_id` on results

**Solution**: Change `result._id` to `result.id`

### Issue: Filters not working

**Cause**: Still using `_id` in filter arrays

**Solution**: Change `['_id', '=', value]` to `['id', '=', value]`

### Issue: Custom ID not working in MongoDB

**Cause**: Passing `_id` instead of `id` in create

**Solution**: Change `{ _id: 'custom' }` to `{ id: 'custom' }`

## Need Help?

If you encounter issues during migration:

1. Check the [Driver Documentation](./drivers/index.md)
2. Review the [API Reference](../api/index.md)
3. Open an issue on [GitHub](https://github.com/objectql/objectql/issues)

## Summary

| Aspect | Before (Legacy) | After (Unified) |
|--------|----------------|-----------------|
| MongoDB Filter | `['_id', '=', '123']` | `['id', '=', '123']` |
| SQL Filter | `['id', '=', '123']` | `['id', '=', '123']` |
| MongoDB Create | `{ _id: '123', ... }` | `{ id: '123', ... }` |
| SQL Create | `{ id: '123', ... }` | `{ id: '123', ... }` |
| MongoDB Result | `result._id` | `result.id` |
| SQL Result | `result.id` | `result.id` |

**Recommendation**: Migrate all code to use `id` for maximum consistency and portability.
