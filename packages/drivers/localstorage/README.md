# LocalStorage Driver for ObjectQL

> ✅ **Production-Ready** - Browser-based persistent storage driver for client-side applications.

## Overview

The LocalStorage Driver is a production-ready implementation of the ObjectQL Driver interface that persists data to browser localStorage. It provides full query support with automatic serialization, making it perfect for client-side applications that need data persistence across sessions.

## Features

- ✅ **Browser LocalStorage Persistence** - Data survives page refreshes
- ✅ **Full Query Support** - Filters, sorting, pagination, field projection
- ✅ **Automatic Serialization** - JSON serialization/deserialization
- ✅ **Namespace Support** - Avoid key conflicts with multiple apps
- ✅ **Storage Quota Management** - Handles quota exceeded errors
- ✅ **Bulk Operations** - createMany, updateMany, deleteMany
- ✅ **TypeScript** - Full type safety and IntelliSense support
- ✅ **Zero Dependencies** - Only depends on @objectql/types

## Use Cases

This driver is perfect for:

1. **Progressive Web Apps (PWAs)** - Offline-first applications
2. **Client-Side Web Applications** - Persistent user data without a backend
3. **Browser Extensions** - Local data storage for extensions
4. **User Preferences** - Save settings and configuration
5. **Offline Mode** - Cache data for offline access
6. **Prototyping** - Quick development without backend setup

## Installation

```bash
npm install @objectql/driver-localstorage
```

## Basic Usage

```typescript
import { ObjectQL } from '@objectql/core';
import { LocalStorageDriver } from '@objectql/driver-localstorage';

// Initialize the driver
const driver = new LocalStorageDriver();

// Create ObjectQL instance
const app = new ObjectQL({
  datasources: { default: driver }
});

// Register your schema
app.registerObject({
  name: 'tasks',
  fields: {
    title: { type: 'text', required: true },
    completed: { type: 'boolean', defaultValue: false },
    priority: { type: 'select', options: ['low', 'medium', 'high'] }
  }
});

await app.init();

// Use it!
const ctx = app.createContext({ isSystem: true });
const repo = ctx.object('tasks');

// Create (persists to localStorage)
const task = await repo.create({
  title: 'Build awesome app',
  priority: 'high'
});

// Data persists across page refreshes!
```

## Configuration Options

### Basic Configuration

```typescript
const driver = new LocalStorageDriver();
```

### With Custom Namespace

```typescript
const driver = new LocalStorageDriver({
  namespace: 'myapp'  // Avoids conflicts with other apps
});
```

### With Initial Data

```typescript
const driver = new LocalStorageDriver({
  initialData: {
    users: [
      { id: '1', name: 'Alice', email: 'alice@example.com' },
      { id: '2', name: 'Bob', email: 'bob@example.com' }
    ]
  }
});
```

### With Strict Mode

```typescript
const driver = new LocalStorageDriver({
  strictMode: true  // Throws errors for missing records
});
```

### For Testing (with mock storage)

```typescript
// Use with jsdom or mock localStorage
const driver = new LocalStorageDriver({
  storage: mockLocalStorage
});
```

## How Data is Stored

Records are stored as JSON strings with keys formatted as:

```
{namespace}:{objectName}:{id}
```

Example:
```
objectql:tasks:task-1234567890-1 → {"id":"task-1234567890-1","title":"Build app",...}
```

## Storage Limits

LocalStorage typically has a 5-10MB limit per origin. The driver handles quota exceeded errors gracefully:

```typescript
try {
  await driver.create('tasks', { /* large data */ });
} catch (error) {
  if (error.code === 'STORAGE_QUOTA_EXCEEDED') {
    // Handle quota exceeded
    console.log('Storage full! Please clear some data.');
  }
}
```

## API Reference

The LocalStorage Driver implements the full Driver interface. See the [Memory Driver documentation](../memory/README.md) for detailed API examples, as both drivers support the same query operations.

### Key Methods

- `find(objectName, query, options)` - Query records
- `findOne(objectName, id, query, options)` - Get single record
- `create(objectName, data, options)` - Create record
- `update(objectName, id, data, options)` - Update record
- `delete(objectName, id, options)` - Delete record
- `count(objectName, filters, options)` - Count records
- `distinct(objectName, field, filters, options)` - Get unique values
- `createMany`, `updateMany`, `deleteMany` - Bulk operations
- `clear()` - Clear all data for this namespace
- `getSize()` - Get number of stored records

## Supported Query Operators

All standard ObjectQL query operators are supported:

- **Comparison**: `=`, `!=`, `>`, `>=`, `<`, `<=`
- **Set**: `in`, `nin`
- **String**: `contains`, `startswith`, `endswith`
- **Range**: `between`
- **Logical**: `and`, `or`

## Examples

### Offline Task Manager

```typescript
import { LocalStorageDriver } from '@objectql/driver-localstorage';

// Initialize driver with app namespace
const driver = new LocalStorageDriver({
  namespace: 'task-manager'
});

// Create tasks (persists automatically)
await driver.create('tasks', {
  title: 'Review pull request',
  completed: false,
  dueDate: '2026-01-20'
});

// Query tasks
const pending = await driver.find('tasks', {
  filters: [['completed', '=', false]],
  sort: [['dueDate', 'asc']]
});

// Update task
await driver.update('tasks', taskId, {
  completed: true
});

// Data persists across page refreshes!
```

### User Preferences

```typescript
const driver = new LocalStorageDriver({
  namespace: 'app-preferences'
});

// Save preferences
await driver.create('settings', {
  id: 'user-settings',
  theme: 'dark',
  language: 'en',
  notifications: true
});

// Load preferences on next visit
const settings = await driver.findOne('settings', 'user-settings');
```

### Multiple Namespaces

```typescript
// Separate drivers for different parts of your app
const userDriver = new LocalStorageDriver({ namespace: 'user-data' });
const cacheDriver = new LocalStorageDriver({ namespace: 'api-cache' });

await userDriver.create('profile', { name: 'Alice' });
await cacheDriver.create('posts', { title: 'Cached post' });

// Clear cache without affecting user data
await cacheDriver.clear();
```

## Comparison with Other Drivers

| Feature | LocalStorage | Memory | SQL | MongoDB |
|---------|-------------|--------|-----|---------|
| **Persistence** | ✅ Browser | ❌ No | ✅ Database | ✅ Database |
| **Environment** | 🌐 Browser | 🌐 Universal | 🖥️ Server | 🖥️ Server |
| **Setup Required** | ❌ None | ❌ None | ✅ Database | ✅ Database |
| **Storage Limit** | ~5-10MB | RAM | Large | Large |
| **Performance** | 🏃 Fast | ⚡ Fastest | 🐢 Slower | 🏃 Fast |
| **Dependencies** | 0 | 0 | 2-3 | 1 |

## Limitations

1. **Browser Only** - Requires browser localStorage API
2. **Storage Quota** - Limited to ~5-10MB (varies by browser)
3. **Synchronous API** - LocalStorage API is synchronous (blocking)
4. **Single Tab** - Changes not immediately visible across tabs
5. **String Only** - All data serialized to JSON strings
6. **No Indexes** - Queries scan all records (O(n))

## Best Practices

### 1. Use Namespaces

```typescript
// Good - prevents conflicts
const driver = new LocalStorageDriver({
  namespace: 'my-app-v1'
});

// Avoid - may conflict with other apps
const driver = new LocalStorageDriver();
```

### 2. Handle Storage Errors

```typescript
try {
  await driver.create('tasks', largeData);
} catch (error) {
  if (error.code === 'STORAGE_QUOTA_EXCEEDED') {
    // Prompt user to clear old data
    await driver.deleteMany('tasks', [
      ['completed', '=', true]
    ]);
  }
}
```

### 3. Clear Old Data

```typescript
// Clear completed tasks older than 30 days
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

await driver.deleteMany('tasks', [
  ['completed', '=', true],
  'and',
  ['completedAt', '<', thirtyDaysAgo.toISOString()]
]);
```

### 4. Monitor Storage Usage

```typescript
// Check storage size
const size = driver.getSize();
console.log(`Storing ${size} records`);

// Estimate storage usage
const estimate = navigator.storage?.estimate();
if (estimate) {
  const { usage, quota } = await estimate;
  const percentUsed = (usage! / quota!) * 100;
  console.log(`Storage: ${percentUsed.toFixed(2)}% used`);
}
```

## Migration Guide

### From Memory Driver

```typescript
// Before (data lost on refresh)
import { MemoryDriver } from '@objectql/driver-memory';
const driver = new MemoryDriver();

// After (data persists)
import { LocalStorageDriver } from '@objectql/driver-localstorage';
const driver = new LocalStorageDriver();
```

### From IndexedDB

```typescript
// LocalStorage is simpler but has lower capacity
// Use IndexedDB for > 10MB data

// Small data (< 5MB): Use LocalStorage
const driver = new LocalStorageDriver();

// Large data (> 5MB): Use IndexedDB (future driver)
// const driver = new IndexedDBDriver();
```

## Browser Compatibility

The LocalStorage Driver works in all modern browsers:

- ✅ Chrome 4+
- ✅ Firefox 3.5+
- ✅ Safari 4+
- ✅ Edge (all versions)
- ✅ Opera 10.5+

## Troubleshooting

### Storage Quota Exceeded

```typescript
// Problem: localStorage is full
// Solution: Clear old data
await driver.clear();

// Or delete specific records
await driver.deleteMany('tasks', [
  ['archived', '=', true]
]);
```

### Data Not Persisting

```typescript
// Check if localStorage is available
if (typeof localStorage === 'undefined') {
  console.error('localStorage not available');
  // Fallback to MemoryDriver
}

// Check browser privacy mode
// Private/Incognito mode may have limitations
```

### Slow Queries

```typescript
// Problem: Too many records to scan
const all = await driver.find('tasks', {});  // Scans all records

// Solution: Add filters to reduce result set
const filtered = await driver.find('tasks', {
  filters: [['status', '=', 'active']],
  limit: 50
});
```

## Related Documentation

- [Memory Driver](../memory/README.md) - In-memory driver
- [Driver Interface Reference](../../foundation/types/src/driver.ts)
- [ObjectQL Core Documentation](../../foundation/core/README.md)

## License

MIT - Same as ObjectQL

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for version history.
