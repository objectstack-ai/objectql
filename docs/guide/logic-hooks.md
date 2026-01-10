# Logic: Hooks (Triggers)

Hooks allow you to inject business logic into the database lifecycle. They are powerful, typed, and context-aware.

## 1. File Structure
Hooks live in `*.hook.ts` files alongside your object definitions. The loader automatically binds them based on the filename.

*   `objects/todo.object.yml`
*   `objects/todo.hook.ts`

## 2. Defining Hooks

Export a default object that satisfies the `ObjectHookDefinition<T>` interface.

```typescript
// objects/todo.hook.ts
import { ObjectHookDefinition } from '@objectql/types';
import { Todo } from './types'; // Generated types

const hooks: ObjectHookDefinition<Todo> = {
    
    // Validate data before insertion
    beforeCreate: async ({ data, user }) => {
        if (!data.title) {
            throw new Error("Title is required");
        }
        data.owner_id = user?.id;
    },

    // Check state changes before update
    // 'previousData' is automatically fetched for you!
    beforeUpdate: async ({ id, data, previousData, isModified }) => {
        if (isModified('status')) {
             if (previousData.status === 'Archived') {
                 throw new Error("Cannot modify archived todos");
             }
        }
    },

    // Side-effects after successful commitment
    afterCreate: async ({ result, api }) => {
        await api.create('log', {
            message: `New Todo Created: ${result.title}`
        });
    }
}

export default hooks;
```

## 3. The Hook Context

The context passed to your function is **Operation-Specific**.

| Property | Available In | Description |
| :--- | :--- | :--- |
| `api` | All | Restricted driver API to perform DB operations (`find`, `create`, etc). |
| `user` | All | The current user session. |
| `state` | All | Shared storage to pass data from `before` -> `after` hooks. |
| `data` | Create/Update | The payload being written. |
| `previousData` | Update | The record as it exists in DB *before* this update. |
| `isModified(field)`| Update | Helper to check if a field is changing. |
| `query` | Find/Count | The query AST. Useful for row-level security. |

### Row-Level Security Example

```typescript
beforeFind: async ({ query, user }) => {
    // Forcefully filter all queries to only show user's own data
    if (!user.isAdmin) {
        query.filters.push(['owner_id', '=', user.id]);
    }
}
```
