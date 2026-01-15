# ObjectQL Browser LocalStorage Demo

> 💾 **Persistent Browser Storage** - ObjectQL with LocalStorage driver for data that survives page refreshes.

This example demonstrates how to use ObjectQL in a web browser with the **LocalStorage Driver** for persistent, client-side data storage.

## Overview

Unlike the Memory Driver demo (data lost on refresh), this demo uses **LocalStorage** to persist data across browser sessions. Perfect for offline apps and PWAs!

## Features Demonstrated

- ✅ **Persistent Storage** - Data survives page refreshes
- ✅ **Offline-First** - Works without internet connection
- ✅ **Live CRUD Operations** - Create, Read, Update, Delete
- ✅ **Namespace Isolation** - No conflicts with other apps
- ✅ **Storage Management** - Clear, export, import data
- ✅ **Zero Backend** - Pure client-side application

## Quick Start

Simply open `index.html` in your browser:

```bash
# From the examples/browser-localstorage-demo directory
open index.html
# or
python3 -m http.server 8080
# Then visit http://localhost:8080
```

With build step:

```bash
pnpm install
pnpm dev
```

## Differences from Memory Driver

| Feature | Memory Driver | LocalStorage Driver |
|---------|---------------|---------------------|
| **Persistence** | ❌ Lost on refresh | ✅ Survives refresh |
| **Storage Limit** | RAM (~GB) | ~5-10MB |
| **Performance** | ⚡ Fastest | 🏃 Fast |
| **Use Case** | Prototyping | Production PWAs |
| **Data Export** | Manual | Built-in |

## Usage Examples

### Basic Setup

```javascript
import { ObjectQL } from '@objectql/core';
import { LocalStorageDriver } from '@objectql/driver-localstorage';

// Initialize with namespace
const driver = new LocalStorageDriver({
  namespace: 'my-task-app'
});

const app = new ObjectQL({
  datasources: { default: driver }
});

// Define schema
app.registerObject({
  name: 'tasks',
  fields: {
    title: { type: 'text', required: true },
    completed: { type: 'boolean', defaultValue: false }
  }
});

await app.init();

// Data persists automatically!
```

### Data Management

```javascript
// Check storage usage
console.log(`Records in storage: ${driver.getSize()}`);

// Clear all data for this namespace
await driver.clear();

// Data persists across page refreshes
// Refresh the page - your data is still there!
```

## Related Examples

- [Memory Driver Demo](../browser-demo/) - In-memory (no persistence)
- [Task Manager Tutorial](../tutorials/tutorial-task-manager/) - Full app example
- [LocalStorage Driver Docs](../../packages/drivers/localstorage/README.md) - Full API

## License

MIT - Same as ObjectQL
