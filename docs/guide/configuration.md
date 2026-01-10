# Configuration

ObjectQL is configured by passing an `ObjectQLConfig` object to the constructor.

## Basic Layout

```typescript
// objectql.config.ts
import { ObjectQL } from '@objectql/core';

export const db = new ObjectQL({
    connection: 'sqlite://data.db', // 1. Infrastructure
    presets: ['@objectql/preset-auth'], // 2. Base Capabilities
    source: ['src'], // 3. Application Logic
    plugins: [] // 4. Extensions
});
```

## Reference

### `connection` (string)
The Connection String URI defining the database connection.
*   `sqlite://path/to/db`
*   `postgres://user:pass@host:5432/db`
*   `mongodb://host:27017/db`

The engine will automatically load the appropriate driver (`@objectql/driver-knex` or `@objectql/driver-mongo`).

### `source` (string | string[])
One or more directory paths (relative or absolute) containing your schema files (`*.object.yml`).
The loader scans these directories recursively.

### `presets` (string[])
A list of NPM packages to load as presets.
ObjectQL will try to resolve the package and load schema files from its directory.
Useful for sharing common business objects (User, Role, File, etc.).

### `plugins` ((ObjectQLPlugin | string)[])
A list of plugin instances OR package names to extend the core functionality.
See [Plugin System](./plugins.html) for details.

### `objects` (Record<string, ObjectConfig>)
(Advanced) In-memory definition of objects. Useful for dynamic runtime schema generation.
Objects defined here take highest priority.
