# @objectql/core

The core ORM and runtime engine for ObjectQL. This package handles object querying, CRUD operations, database driver coordination, and transaction management.

## Features

- **Unified Query Language**: A generic way to query data across different databases (SQL, Mongo, etc.).
- **Repository Pattern**: `ObjectRepository` for managing object records.
- **Driver Agnostic**: Abstraction layer for database drivers.
- **Dynamic Schema**: Loads object definitions from `@objectql/metadata`.
- **Hooks & Actions**: Runtime logic injection.

## Installation

```bash
npm install @objectql/core
```

## Usage

```typescript
import { ObjectQL } from '@objectql/core';
import { MetadataRegistry } from '@objectql/metadata';
// Import a driver, e.g., @objectql/driver-knex

const objectql = new ObjectQL({
    datasources: {
        default: new MyDriver({ ... })
    }
});

await objectql.init();

// Use context for operations
const ctx = objectql.createContext({ userId: 'u-1' });
const projects = await ctx.object('project').find({
    filters: [['status', '=', 'active']]
});
```

## Shared Metadata

You can pass an existing `MetadataRegistry` (e.g., from a low-code platform loader) to ObjectQL:

```typescript
const registry = new MetadataRegistry();
// ... pre-load metadata ...

const objectql = new ObjectQL({
    registry: registry,
    datasources: { ... }
});
```
