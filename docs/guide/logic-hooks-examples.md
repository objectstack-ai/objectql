# Hooks Example

ObjectQL allows defining business logic via hooks loaded from files.
A hook file should be named using the pattern `*.hook.ts` (or `*.hook.js`) and should start by exporting the object name it listens to.

## File Structure

```
src/
  objects/
    project.object.yml
    project.hook.ts
```

## Example: project.hook.ts

```typescript
import { HookContext } from '@objectql/core';

// 1. Define which object this hook applies to
export const listenTo = 'projects';

// 2. Export hook functions matching the event names
export async function beforeFind(context: HookContext) {
    // Example: Row Level Security (RLS)
    // If not system admin, restrict query to records owned by the user.
    if (!context.ctx.isSystem && context.ctx.userId) {
        console.log(`[Hook] Restricting access for user: ${context.ctx.userId}`);
        
        // context.utils.restrict injexts a filter safely into the query.
        context.utils.restrict(['owner', '=', context.ctx.userId]);
    }
}

export async function beforeCreate(context: HookContext) {
    // Example: Auto-assign owner
    if (context.doc) {
        if (!context.doc.owner && context.ctx.userId) {
            context.doc.owner = context.ctx.userId;
        }
        // Validation example
        if (context.doc.amount < 0) {
            throw new Error("Amount cannot be negative");
        }
    }
}

export async function afterCreate(context: HookContext) {
    console.log(`Created new record with ID: ${context.doc._id}`);
}
```

## Supported Events

- `beforeFind`, `afterFind`
- `beforeCreate`, `afterCreate`
- `beforeUpdate`, `afterUpdate`
- `beforeDelete`, `afterDelete`
- `beforeAggregate` (Partial)

## Building & Loading

Ensure your build process compiles `.hook.ts` files to `.hook.js` alongside your YAML definitions.
The loader will automatically discover and load these files when you call:

```typescript
app.loadFromDirectory(path.join(__dirname, 'objects'));
```
