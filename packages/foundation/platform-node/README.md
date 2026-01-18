# @objectql/platform-node

Node.js platform utilities for ObjectQL - File system integration, YAML loading, and plugin management.

## Features

- **📂 File System Metadata Loader** - Automatically discover and load `.object.yml`, `.validation.yml`, `.permission.yml` files from directories
- **🔌 Plugin System** - Dynamic loading and management of ObjectQL plugins
- **📦 Module System** - Package and module discovery for organized project structures
- **🚀 Driver Registration** - Simplified database driver configuration
- **🔍 Convention-Based Discovery** - Automatic metadata scanning using glob patterns
- **⚡ Hot Reload Ready** - File watching support for development workflows

## Installation

```bash
npm install @objectql/platform-node @objectql/core @objectql/types
```

## Quick Start

### Basic Metadata Loading

```typescript
import { ObjectQL } from '@objectql/core';
import { ObjectLoader } from '@objectql/platform-node';
import * as path from 'path';

// Initialize ObjectQL
const app = new ObjectQL({
    datasources: {
        default: new SqlDriver({ /* config */ })
    }
});

// Create loader and load metadata from directory
const loader = new ObjectLoader(app.metadata);
loader.load(path.join(__dirname, 'src/objects'));

await app.init();
```

### With Custom Directory Structure

```typescript
import { ObjectLoader } from '@objectql/platform-node';

const loader = new ObjectLoader(app.metadata);

// Load from multiple directories
loader.load('./src/core/objects');
loader.load('./src/plugins/crm/objects');
loader.load('./src/plugins/project/objects');

// Load specific file types
loader.load('./src/validations', {
    include: ['**/*.validation.yml']
});
```

## API Reference

### ObjectLoader

The main class for loading metadata files from the file system.

#### Constructor

```typescript
new ObjectLoader(registry: MetadataRegistry)
```

**Parameters:**
- `registry` - The MetadataRegistry from ObjectQL instance

#### Methods

##### `load(dirPath: string, options?: LoadOptions): void`

Load metadata files from a directory.

```typescript
loader.load('./src/objects');

// With options
loader.load('./src', {
    include: ['**/*.object.yml', '**/*.validation.yml'],
    exclude: ['**/node_modules/**', '**/test/**']
});
```

**Options:**
- `include?: string[]` - Glob patterns to include (default: all supported types)
- `exclude?: string[]` - Glob patterns to exclude

##### `use(plugin: LoaderPlugin): void`

Register a custom loader plugin for handling additional file types.

```typescript
loader.use({
    name: 'custom-metadata',
    glob: ['**/*.custom.yml'],
    handler: (ctx) => {
        const data = yaml.load(ctx.content);
        // Process and register custom metadata
    }
});
```

### Plugin Loading

Load external plugins dynamically.

#### `loadPlugin(packageName: string): ObjectQLPlugin`

```typescript
import { loadPlugin } from '@objectql/platform-node';

const plugin = loadPlugin('@objectql/plugin-audit');
app.use(plugin);
```

The plugin loader:
- Resolves the package from `node_modules`
- Supports both class-based and instance-based plugins
- Automatically instantiates classes if needed
- Searches default export and named exports

### Driver Registration

Simplified driver registration for Node.js environments.

```typescript
import { registerDriver } from '@objectql/platform-node';
import { SqlDriver } from '@objectql/driver-sql';

registerDriver(app, 'default', new SqlDriver({
    client: 'postgresql',
    connection: {
        host: 'localhost',
        port: 5432,
        database: 'myapp',
        user: 'postgres',
        password: 'password'
    }
}));
```

## Supported Metadata File Types

The loader automatically handles these file patterns:

| Pattern | Description |
|---------|-------------|
| `**/*.object.yml` | Object/Entity definitions |
| `**/*.object.yaml` | Object definitions (YAML format) |
| `**/*.validation.yml` | Validation rules |
| `**/*.permission.yml` | Permission/RBAC rules |
| `**/*.hook.yml` | Lifecycle hooks metadata |
| `**/*.action.yml` | Custom action definitions |
| `**/*.workflow.yml` | Workflow automation |
| `**/*.app.yml` | Application configuration |
| `**/*.data.yml` | Initial/seed data |

## Project Structure Examples

### Standard Structure

```
my-app/
├── src/
│   ├── objects/
│   │   ├── user.object.yml
│   │   ├── project.object.yml
│   │   └── task.object.yml
│   ├── validations/
│   │   ├── user.validation.yml
│   │   └── project.validation.yml
│   └── permissions/
│       ├── user.permission.yml
│       └── project.permission.yml
└── objectql.config.ts
```

### Modular Structure

```
my-app/
├── src/
│   ├── modules/
│   │   ├── crm/
│   │   │   ├── objects/
│   │   │   │   ├── customer.object.yml
│   │   │   │   └── opportunity.object.yml
│   │   │   └── validations/
│   │   │       └── customer.validation.yml
│   │   └── project/
│   │       ├── objects/
│   │       │   ├── project.object.yml
│   │       │   └── milestone.object.yml
│   │       └── permissions/
│   │           └── project.permission.yml
└── objectql.config.ts
```

## Complete Example

### objectql.config.ts

```typescript
import { ObjectQL } from '@objectql/core';
import { SqlDriver } from '@objectql/driver-sql';
import { ObjectLoader, loadPlugin } from '@objectql/platform-node';
import * as path from 'path';

// Initialize ObjectQL
const app = new ObjectQL({
    datasources: {
        default: new SqlDriver({
            client: 'sqlite3',
            connection: {
                filename: path.join(__dirname, 'dev.sqlite3')
            },
            useNullAsDefault: true
        })
    }
});

// Load metadata from file system
const loader = new ObjectLoader(app.metadata);

// Load core objects
loader.load(path.join(__dirname, 'src/objects'));

// Load module-specific metadata
loader.load(path.join(__dirname, 'src/modules/crm'));
loader.load(path.join(__dirname, 'src/modules/project'));

// Load plugins
try {
    const auditPlugin = loadPlugin('@objectql/plugin-audit');
    app.use(auditPlugin);
} catch (e) {
    console.log('Audit plugin not installed');
}

export default app;
```

## Advanced Usage

### Custom Loader Plugin

Create custom handlers for specialized file types:

```typescript
import { LoaderPlugin } from '@objectql/types';
import * as yaml from 'js-yaml';

const customPlugin: LoaderPlugin = {
    name: 'report-loader',
    glob: ['**/*.report.yml'],
    handler: (ctx) => {
        const report = yaml.load(ctx.content);
        
        // Validate report structure
        if (!report.name || !report.query) {
            console.warn(`Invalid report in ${ctx.file}`);
            return;
        }
        
        // Register report in metadata
        ctx.registry.addEntry('report', report.name, {
            ...report,
            _source: ctx.file
        });
    }
};

loader.use(customPlugin);
```

### Conditional Loading

Load different metadata based on environment:

```typescript
const loader = new ObjectLoader(app.metadata);

// Always load core
loader.load('./src/objects');

// Environment-specific
if (process.env.NODE_ENV === 'development') {
    loader.load('./src/dev-objects');
    loader.load('./src/test-data');
} else if (process.env.NODE_ENV === 'production') {
    loader.load('./src/production-objects');
}
```

### Error Handling

```typescript
const loader = new ObjectLoader(app.metadata);

try {
    loader.load('./src/objects');
} catch (error) {
    console.error('Failed to load metadata:', error);
    
    if (error.code === 'ENOENT') {
        console.error('Directory not found. Creating...');
        fs.mkdirSync('./src/objects', { recursive: true });
    }
    
    throw error;
}
```

## File Watching (Development)

While the loader doesn't include built-in file watching, you can easily add it:

```typescript
import * as chokidar from 'chokidar';

const loader = new ObjectLoader(app.metadata);
const watchPath = path.join(__dirname, 'src/objects');

// Initial load
loader.load(watchPath);

// Watch for changes
if (process.env.NODE_ENV === 'development') {
    const watcher = chokidar.watch('**/*.object.yml', {
        cwd: watchPath,
        ignoreInitial: true
    });
    
    watcher.on('change', (filePath) => {
        console.log(`Reloading ${filePath}...`);
        
        // Clear and reload
        app.metadata.clear();
        loader.load(watchPath);
        
        // Re-initialize
        app.init();
    });
}
```

## Module Discovery

The platform-node package includes utilities for discovering packages and modules:

```typescript
import { discoverModules } from '@objectql/platform-node';

// Discover all modules in a directory
const modules = discoverModules('./src/modules');

for (const module of modules) {
    console.log(`Loading module: ${module.name}`);
    loader.load(module.path);
}
```

## Best Practices

### 1. Organize by Feature

```
src/
  modules/
    users/
      objects/
      validations/
      permissions/
      hooks/
    projects/
      objects/
      validations/
```

### 2. Use Consistent Naming

- Match file names to object names: `user.object.yml` for object "user"
- Use singular names: `project`, not `projects`
- Use lowercase with underscores: `project_task`, not `ProjectTask`

### 3. Separate Concerns

Keep different metadata types in separate files:
- `user.object.yml` - Object structure
- `user.validation.yml` - Validation rules
- `user.permission.yml` - Access control

### 4. Environment Configuration

```typescript
// Load base configuration
loader.load('./src/objects');

// Add environment-specific overrides
if (process.env.NODE_ENV === 'production') {
    loader.load('./src/objects/production');
}
```

## Troubleshooting

### Files Not Loading

**Problem:** Metadata files are not being loaded.

**Solutions:**
- Verify file extensions match: `.yml` or `.yaml`
- Check file names follow conventions: `*.object.yml`, `*.validation.yml`
- Ensure directory path is correct (absolute or relative to `process.cwd()`)
- Check for YAML syntax errors in files

### Plugin Loading Fails

**Problem:** `loadPlugin()` throws "Failed to resolve plugin" error.

**Solutions:**
- Ensure plugin package is installed: `npm install @objectql/plugin-name`
- Verify package name is correct
- Check that plugin exports a valid ObjectQL plugin
- Try using absolute path if relative resolution fails

### Performance Issues

**Problem:** Slow metadata loading on startup.

**Solutions:**
- Limit glob patterns to specific directories
- Use `exclude` patterns to skip unnecessary directories
- Consider lazy loading modules
- Cache parsed metadata in production

## TypeScript Support

Full TypeScript support with type definitions:

```typescript
import { 
    ObjectLoader, 
    LoaderPlugin, 
    LoaderHandlerContext,
    loadPlugin
} from '@objectql/platform-node';

const loader: ObjectLoader = new ObjectLoader(app.metadata);

const plugin: LoaderPlugin = {
    name: 'custom',
    glob: ['**/*.custom.yml'],
    handler: (ctx: LoaderHandlerContext) => {
        // Fully typed context
        console.log(ctx.file, ctx.content, ctx.registry);
    }
};

loader.use(plugin);
```

## Related Packages

- **[@objectql/core](../core)** - Core ObjectQL engine
- **[@objectql/types](../types)** - Type definitions
- **[@objectql/cli](../../tools/cli)** - Command-line interface

## Environment Requirements

- **Node.js**: 14.x or higher
- **TypeScript**: 4.5 or higher (for TypeScript projects)

## Dependencies

- `fast-glob` - Fast file system glob matching
- `js-yaml` - YAML parsing
- `@objectql/types` - Core type definitions
- `@objectql/core` - Core utilities

## License

MIT - Same as ObjectQL

## Contributing

Contributions are welcome! Please see the main [repository README](../../../README.md) for guidelines.

## See Also

- [ObjectQL Documentation](../../../docs)
- [Metadata File Specifications](../../../docs/spec)
- [Configuration Guide](../../../docs/guide/configuration.md)
