# Hooks (Triggers)

Hooks allow you to execute server-side logic before or after database operations. They are the primary mechanism for implementing business logic, validation, and side effects in ObjectQL.

## 1. Overview

**File Naming Convention:** `<object_name>.hook.ts`

Hook implementation files should be named to match the object they apply to, and placed alongside your object definition files.

**Examples:**
- `project.hook.ts` → Hooks for `project` object
- `customer_order.hook.ts` → Hooks for `customer_order` object

### The "Optimal" Design Philosophy

Unlike traditional ORMs that provide generic contexts, ObjectQL hooks are **Typed**, **Context-Aware**, and **Smart**.

*   **Type Safety**: Contexts are generic (e.g., `UpdateHookContext<Project>`), giving you autocomplete for fields.
*   **Separation of Concerns**: `before` hooks focus on validation/mutation; `after` hooks focus on side-effects.
*   **Change Tracking**: Built-in helpers like `isModified()` simplify "diff" logic.

## 2. Supported Hooks

| Hook | Operation | Context Properties | Purpose |
| :--- | :--- | :--- | :--- |
| `beforeFind` | Find/Count | `query` | Modify query filters, enforce security. |
| `afterFind` | Find/Count | `query`, `result` | Transform results, logging. |
| `beforeCreate` | Create | `data` | Validate inputs, set defaults, calculate fields. |
| `afterCreate` | Create | `data`, `result` | Send welcome emails, create related records. |
| `beforeUpdate` | Update | `id`, `data`, `previousData` | Validate state transitions (e.g., draft -> published). |
| `afterUpdate` | Update | `id`, `data`, `previousData` | Notifications based on changes. |
| `beforeDelete` | Delete | `id` | Check dependency constraints. |
| `afterDelete` | Delete | `id`, `result` | Cleanup external resources (S3 files, etc). |

## 3. Implementation

The recommended way to define hooks is using the `ObjectHookDefinition` interface.

```typescript
// File: project.hook.ts
// Hooks for the "project" object (name matches object definition file)

import { ObjectHookDefinition } from '@objectql/types';
import { Project } from './types'; // Your generated type

const hooks: ObjectHookDefinition<Project> = {
    
    // 1. Validation & Defaulting
    beforeCreate: async ({ data, user, api }) => {
        if (!data.name) {
            throw new Error("Project name is required");
        }
        
        // Auto-assign owner
        data.owner_id = user?.id;
        
        // Check uniqueness via API
        const existing = await api.count('project', [['name', '=', data.name]]);
        if (existing > 0) throw new Error("Name taken");
    },

    // 2. State Transition Logic
    beforeUpdate: async ({ data, previousData, isModified }) => {
        // 'previousData' is automatically fetched by the engine
        
        if (isModified('status')) {
            if (previousData.status === 'Completed' && data.status !== 'Completed') {
                throw new Error("Cannot reopen a completed project");
            }
        }
    },

    // 3. Side Effects (Notifications)
    afterUpdate: async ({ isModified, data, api }) => {
        if (isModified('status') && data.status === 'Completed') {
            await api.create('notification', {
                message: `Project ${data.name} finished!`,
                user_id: data.owner_id
            });
        }
    }
};

export default hooks;
```

## 4. Hook Context API

The context object passed to your function is tailored to the operation.

### 4.1 Base Properties (Available Everywhere)
*   `objectName`: string
*   `api`: The internal ObjectQL driver instance (for running queries).
*   `user`: The current user session.
*   `state`: A shared object to pass data from `before` to `after` hooks.

### 4.2 Update Context (`beforeUpdate` / `afterUpdate`)
*   `data`: The partial object containing changes.
*   `previousData`: The full record **before** the update.
*   `isModified(field)`: Returns `true` if the field is present in `data` AND different from `previousData`.

### 4.3 Query Context (`beforeFind`)
*   `query`: The AST of the query. You can inject extra filters here.

```typescript
beforeFind: async ({ query, user }) => {
    // Force multi-tenancy filter
    query.filters.push(['organization_id', '=', user.org_id]);
}
```

## 5. Loading & Registration

Hooks follow the same convention-based loading strategy as Actions.

*   **File Name**: `[object_name].hook.ts` (e.g., `user.hook.ts`)
*   **Exports**: Must export a default object complying with `ObjectHookDefinition`, or named exports matching hook methods.

```typescript
// src/objects/user.hook.ts
import { ObjectHookDefinition } from '@objectql/types';

const hooks: ObjectHookDefinition = {
    beforeCreate: async (ctx) => { ... }
};

export default hooks;
```
