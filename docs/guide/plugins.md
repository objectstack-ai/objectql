# Plugin System

Plugins allow you to extend the core functionality of ObjectQL by intercepting lifecycle events, modifying metadata, or injecting new services.

## The Plugin Interface

A plugin is simply a class (or object) implementing `ObjectQLPlugin`.

```typescript
import { IObjectQL } from '@objectql/types';

export interface ObjectQLPlugin {
    name: string;
    setup(app: IObjectQL): void | Promise<void>;
}
```

The `setup` method is called during `db.init()`, **before** the database drivers are initialized. This gives plugins a chance to modify the schema metadata.

## Capabilities

1.  **Metadata Mutation**: Modify `app.metadata` to inject fields or create objects dynamically.
2.  **Global Hooks**: Use `app.on()` to listen to events on *all* objects.
3.  **Action Registry**: Register new actions via `app.registerAction()`.

## Example: Soft Delete Plugin

This plugin automatically handles "Soft Delete" logic:
1.  Injects an `isDeleted` field to all objects.
2.  Intercepts `delete` operations to perform an update instead.
3.  Intercepts `find` operations to filter out deleted records.

```typescript
import { ObjectQLPlugin, IObjectQL } from '@objectql/types';

export class SoftDeletePlugin implements ObjectQLPlugin {
    name = 'soft-delete';
    
    setup(app: IObjectQL) {
        // 1. Inject 'isDeleted' field
        const objects = app.metadata.list('object');
        for (const obj of objects) {
            if (!obj.fields.isDeleted) {
                obj.fields.isDeleted = { type: 'boolean', default: false };
            }
        }

        // 2. Intercept DELETE -> UPDATE
        app.on('before:delete', '*', async (ctx) => {
            // Prevent actual deletion
            ctx.preventDefault(); 
            
            // Execute internal update
            // We use a custom action or system updated to bypass recursion if needed
            await app.executeAction(ctx.objectName, 'internalUpdate', {
                id: ctx.id,
                isDeleted: true
            });
        });

        // 3. Intercept FIND -> Filter
        app.on('before:find', '*', async (ctx) => {
             if (ctx.query) {
                 ctx.query.filters = {
                     ...(ctx.query.filters || {}),
                     isDeleted: false
                 }
             }
        });
    }
}
```

## Usage

```typescript
const db = new ObjectQL({
    connection: 'sqlite://data.db',
    plugins: [
        new SoftDeletePlugin()
    ]
});
```
