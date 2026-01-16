# Configuration

ObjectQL is configured by passing an `ObjectQLConfig` object to the constructor.

## Basic Layout

```typescript
// objectql.config.ts
import { ObjectQL } from '@objectql/core';

export const db = new ObjectQL({
    connection: 'sqlite://data.db', // 1. Infrastructure
    modules: [
         '@my-org/module-crm',    // 2. External Module (NPM)
         './src/modules/billing'  // 3. Local Module
    ],
    // source: ... (Deprecated, use modules)
    plugins: [] // 4. Extensions
});
```

## Reference

### `connection` (string)
The Connection String URI defining the database connection.
*   `sqlite://path/to/db`
*   `postgres://user:pass@host:5432/db`
*   `mongodb://host:27017/db`

The engine will automatically load the appropriate driver (`@objectql/driver-sql` or `@objectql/driver-mongo`).

### `modules` (string[])
A list of modules to load. A module can be:
1.  **An NPM Package**: (e.g., `@objectql/starter-crm`). The loader resolves the package and looks for `src` or root directory files.
2.  **A Local Directory**: (e.g., `./src/my-module`). The loader scans the directory for schema files (`*.object.yml`).

This unifies the previous concepts of `source`, `dir` and `presets`.

### `plugins` ((ObjectQLPlugin | string)[])
A list of plugin instances OR package names to extend the core functionality.
See [Plugin System](./plugins.html) for details.

### `objects` (Record<string, ObjectConfig>)
(Advanced) In-memory definition of objects. Useful for dynamic runtime schema generation.
Objects defined here take highest priority.
