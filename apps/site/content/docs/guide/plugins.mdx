# Plugin System

Plugins are the primary way to extend ObjectQL. They allow you to bundle behavior, schema modifications, and logic (hooks/actions) into reusable units.

## 1. Anatomy of a Plugin

A plugin is simply an object that implements the `ObjectQLPlugin` interface.

```typescript
import { IObjectQL } from '@objectql/types';

export interface ObjectQLPlugin {
    /**
     * The unique name of the plugin
     */
    name: string;
    
    /**
     * Called during initialization, before drivers connect.
     * @param app The ObjectQL instance
     */
    setup(app: IObjectQL): void | Promise<void>;
}
```

## 2. Execution Lifecycle

Understanding valid execution timing is critical.

1.  **Phase 1: Construction (`new ObjectQL`)**
    *   Load Metadata from `packages`.
    *   Load Metadata from `source` directories (`*.object.yml`).
    *   Load Metadata from `config.objects`.
    *   **Result:** `app.metadata` holds all static definitions.

2.  **Phase 2: Initialization (`await app.init()`)**
    *   **Step A: Remotes:** Fetch metadata from remote services.
    *   **Step B: Plugins (`plugin.setup`)**:  <-- **YOU ARE HERE**
        *   This is the last chance to modify metadata before it touches the DB.
        *   You can access all objects loaded in Phase 1 & Step A.
    *   **Step C: Drivers:** Drivers connect and synchronize schema (create tables, etc.).

## 3. Creating Plugins

You can define plugins in two styles: **Object** or **Class**.

### Option A: Object Style (Simpler)
Useful for stateless, simple logic or one-off modifications.

```typescript
const MySimplePlugin = {
    name: 'my-simple-plugin',
    setup(app) {
        app.on('before:create', 'user', async (ctx) => {
            console.log('Creating user...');
        });
    }
};
```

### Option B: Class Style (Recommended)
Useful when your plugin needs to maintain internal state, configuration, or complex initialization logic.

```typescript
class MyComplexPlugin implements ObjectQLPlugin {
    name = 'my-complex-plugin';
    private config;

    constructor(config = {}) {
        this.config = config;
    }

    async setup(app: IObjectQL) {
        // Access config here
        if (this.config.enableLogging) {
            app.on('before:*', '*', async (ctx) => {
                console.log(`[${ctx.event}] ${ctx.objectName}`);
            });
        }
    }
}
```

## 3. Loading Plugins

Plugins are passed to the `ObjectQL` constructor via the `plugins` array. The loader is very flexible.

### Method 1: Inline Instance
Pass the plugin object or class instance directly.

```typescript
const db = new ObjectQL({
    plugins: [
        MySimplePlugin,          // Object
        new MyComplexPlugin({})  // Class Instance
    ]
});
```

### Method 2: NPM Package (String)
You can specify the package name as a string. ObjectQL uses `require()` (Node.js) to resolve it.

```typescript
const db = new ObjectQL({
    plugins: [
        '@objectql/plugin-audit', // Searches node_modules
        './local-plugins/my-plugin' // Relative path
    ]
});
```

#### Package Resolution Rules
When loading from a string, ObjectQL tries to find the plugin in the exported module in this order:

1.  **Class Constructor**: If the module exports a Class (default or module.exports), it tries to instantiation it (`new Plugin()`).
2.  **Plugin Object**: If the module exports an object with a `setup` function, it uses it directly.
3.  **Default Export**: If the module has a `default` export, it checks that recursively.

**Example Package (`node_modules/my-plugin/index.js`):**
```javascript
// This works
module.exports = class MyPlugin { ... }

// This also works
module.exports = { name: '..', setup: () => {} }

// This also works (ESM/TS)
export default class MyPlugin { ... }
```

## 4. What can Plugins do?

The `setup(app)` method gives you full access to the `ObjectQL` instance.

### A. Manipulate Metadata (Schema)
Plugins have full control over the schema. You can modify existing objects or register new ones.

**Example 1: Injecting a global field**
```typescript
setup(app) {
    const allObjects = app.metadata.list('object');
    for (const obj of allObjects) {
        // Add 'createdAt' to every object if missing
        if (!obj.fields.createdAt) {
            obj.fields.createdAt = { type: 'datetime' };
        }
    }
}
```

**Example 2: Registering a new Object**
Plugins can bundle their own data models (e.g. an audit log table).

```typescript
setup(app) {
    app.registerObject({
        name: 'audit_log',
        fields: {
            action: { type: 'string' },
            userId: { type: 'string' },
            timestamp: { type: 'datetime' }
        }
    });
}
```

**Example 3: Scanning a Directory**
Plugins can also scan a directory to load metadata files, just like the main application. This is useful for bundling a set of objects.

```typescript
import * as path from 'path';

setup(app) {
    // Scan the 'objects' folder inside the plugin directory
    const objectsDir = path.join(__dirname, 'objects');
    app.loadFromDirectory(objectsDir);
}
```

### B. Register Global Hooks
Listen to lifecycle events on specific objects or `*` (wildcard).

```typescript
setup(app) {
    app.on('before:delete', '*', async (ctx) => {
        if (ctx.objectName === 'system_log') {
            throw new Error("Logs cannot be deleted");
        }
    });
}
```

### C. Register Custom Actions
Add new capabilities to objects.

```typescript
setup(app) {
    // Usage: objectql.executeAction('user', 'sendEmail', { ... })
    app.registerAction('user', 'sendEmail', async (ctx) => {
        await emailService.send(ctx.args.to, ctx.args.body);
    });
}
```

### D. Custom Metadata Loaders
Plugins can register new loaders to scan for custom file types (e.g. `*.workflow.yml`). This allows ObjectQL to act as a unified metadata engine.

```typescript
import * as yaml from 'js-yaml';

setup(app) {
    app.addLoader({
        name: 'workflow-loader',
        glob: ['**/*.workflow.yml'],
        handler: (ctx) => {
            const doc = yaml.load(ctx.content);
            const workflowName = doc.name;
            
            // Register into MetadataRegistry with a custom type
            ctx.registry.register('workflow', {
                type: 'workflow',
                id: workflowName,
                path: ctx.file,
                content: doc
            });
        }
    });
}
```

### E. Manage Modules
Plugins can dynamically load or unload other modules. This is useful for plugins that act as "features" which bring in a set of dependencies.

```typescript
setup(app) {
    // Dynamically load another module
    app.addModule('@objectos/standard-objects');

    // Or remove a module if it conflicts with this plugin
    app.removeModule('@objectos/legacy-objects');
}
```

## 5. Scope Isolation


When a plugin is loaded via **Package Name** (Method 2), ObjectQL automatically marks the hooks and actions registered by that plugin with its package name.

This allows `app.removePackage('@objectql/plugin-auth')` to cleanly remove all hooks and actions associated with that plugin, without affecting others.
