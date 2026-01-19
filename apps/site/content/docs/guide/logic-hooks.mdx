# Logic Hooks

Hooks (often called "Triggers" in SQL databases) allow you to intercept database operations to inject custom logic. They are transaction-aware and fully typed.

## 1. Registration Methods

You can define hooks in two ways: **File-based** (Static) or **Programmatic** (Dynamic).

### A. File-based (Recommended)
Place a `*.hook.ts` file next to your object definition. The loader automatically discovers it.

**File:** `src/objects/project.hook.ts`

```typescript
import { ObjectHookDefinition } from '@objectql/types';

const hooks: ObjectHookDefinition = {
    beforeCreate: async (ctx) => {
        // ...
    },
    afterUpdate: async (ctx) => {
        // ...
    }
};

export default hooks;
```

### B. Programmatic (Dynamic)
Use the `app.on()` API, typically inside a [Plugin](./plugins.md).

```typescript
app.on('before:create', 'project', async (ctx) => {
    // ...
});

// Wildcard listener
app.on('after:delete', '*', async (ctx) => {
    console.log(`Object ${ctx.objectName} deleted record ${ctx.id}`);
});
```

## 2. Event Lifecycle

| Event Name | Description | Common Use Case |
| :--- | :--- | :--- |
| `before:create` | Before inserting a new record. | Validation, Default Values, ID generation. |
| `after:create` | After insertion is committed. | Notifications, downstream sync. |
| `before:update` | Before modifying an existing record. | Permission checks, Immutable field protection. |
| `after:update` | After modification is committed. | Audit logging, history tracking. |
| `before:delete` | Before removing a record. | Referential integrity checks. |
| `after:delete` | After removal is committed. | Clean up related resources (e.g. S3 files). |
| `before:find` | Before executing a query. | **Row-Level Security (RLS)**, Force filters. |
| `after:find` | After fetching results. | Decryption, Sensitive data masking. |

## 3. The Hook Context

The context object (`ctx`) changes based on the event type.

### Common Properties (Available Everywhere)

| Property | Type | Description |
| :--- | :--- | :--- |
| `objectName` | `string` | The name of the object being operated on. |
| `user` | `ObjectQLUser` | Current user session/context. |
| `broker` | `IStation` | (If Microservices enabled) Station broker instance. |

### Mutation Context (Create/Update/Delete)

| Property | Type | Available In | Description |
| :--- | :--- | :--- | :--- |
| `data` | `Any` | Create/Update | The data payload being written. **Mutable**. |
| `id` | `string` | Update/Delete | The ID of the record being acted upon. |
| `previousData` | `Any` | Update/Delete | The existing record fetched from DB before operation. |
| `result` | `Any` | After * | The final result returned from the driver. |

### Query Context (Find)

| Property | Type | Description |
| :--- | :--- | :--- |
| `query` | `steedos-filters` | The query AST (filters, fields, sort). **Mutable**. |
| `result` | `Any[]` | (After Find) The array of records found. **Mutable**. |

## 4. Common Patterns & Examples

### A. Validation & Default Values
Throwing an error inside a `before` hook aborts the transaction.

```typescript
beforeCreate: async ({ data, user }) => {
    if (data.amount < 0) {
        throw new Error("Amount cannot be negative");
    }
    // Set default owner if not provided
    if (!data.owner) {
        data.owner = user.userId;
    }
}
```

### B. Immutable Fields Protection
Prevent users from changing critical fields during update.

```typescript
beforeUpdate: async ({ data, previousData }) => {
    if (data.code !== undefined && data.code !== previousData.code) {
        throw new Error("Cannot change project code once created.");
    }
}
```

### C. Row-Level Security (RLS)
The most secure place to enforce permissions is `before:find`. This injects filters into *every* query (API, GraphQL, or internal).

```typescript
beforeFind: async ({ query, user }) => {
    if (!user.is_admin) {
        // Enforce: owners can only see their own records
        // Merging into existing filters
        query.filters = [
            (query.filters || []), 
            ['owner', '=', user.userId]
        ];
    }
}
```

### D. Side Effects (Notifications)
Use `after` hooks for logic that strictly relies on success.

```typescript
afterCreate: async ({ data, objectName }) => {
    await NotificationService.send({
        to: data.owner,
        message: `New ${objectName} created.`
    });
}
```

### E. Result Masking
Hide sensitive fields based on rules.

```typescript
afterFind: async ({ result, user }) => {
    if (!user.has_permission('view_salary')) {
        result.forEach(record => {
            delete record.salary;
            delete record.bonus;
        });
    }
}
```

### F. Auto-Numbering / ID Generation
Generate complex business keys.

```typescript
beforeCreate: async ({ data }) => {
    if (!data.code) {
        data.code = await SequenceService.next('PROJECT_CODE');
    }
}
```

### G. Conditional Deletion
Use `previousData` in delete hooks to prevent deleting records based on their state.

```typescript
beforeDelete: async ({ previousData, user }) => {
    // Prevent deletion if project is active
    if (previousData.status === 'active') {
         throw new Error("Cannot delete an active project. Archive it first.");
    }
}
```

## 5. Transaction Safety

Hooks participate in the database transaction.
*   If a `before` hook throws -> The DB operation is never executed.
*   If the DB operation fails -> `after` hooks are never executed.
*   If an `after` hook throws -> **The entire transaction rolls back** (including the DB write).

> **Tip:** If you want a "Fire and Forget" action that shouldn't rollback the transaction (e.g. sending an email), wrap your logic in a `try/catch` or execute it without `await`.
