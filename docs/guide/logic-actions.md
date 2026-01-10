# Logic: Actions (RPC)

Actions (Remote Procedure Calls) allow you to define custom backend functions that go beyond simple CRUD. They are integrated into the metadata, meaning the Frontend knows exactly how to render them (buttons, confirmation dialogs, forms) and the Backend knows how to validate them.

## 1. What is an Action?

Unlike a Hook (which reacts to CRUD events), an **Action** is explicitly invoked by a user or a system.

| Feature | Action | Hook |
| :--- | :--- | :--- |
| **Trigger** | Explicit (Button, API Call) | Implicit (Database Event) |
| **Input** | Custom Arguments (`params`) | Database Record |
| **Output** | Custom Result (JSON) | None (Void) |
| **Use Case** | "Approve Invoice", "Sync LDAP" | "Validation", "Audit Log" |

## 2. Defining Actions

Actions require two parts:
1.  **Declaration**: in `*.object.yml` (Defines the "Interface" & "UI").
2.  **Implementation**: in `*.action.ts` (Defines the "Logic").

### Step 1: Declare in YAML

Define the action's signature in the Object file.

```yaml
# invoice.object.yml
actions:
  mark_paid:
    type: record           # 'record' = acts on a specific row (needs ID)
    label: Mark as Paid
    icon: standard:money
    confirm_text: "Are you sure? This will trigger a receipt email."
    params:                # Input arguments (Schema)
      note:
        type: textarea
        label: Payment Note
        required: false
      method:
        type: select
        options: [cash, card, transfer]
        default: transfer

  import_csv:
    type: global           # 'global' = acts on the collection
    label: Import Invoices
    params:
      file_url:
        type: text
```

### Step 2: Implement in TypeScript

Create a corresponding `.action.ts` file in the same directory.
Use the `ActionDefinition` type for full type safety.

```typescript
// invoice.action.ts
import { ActionDefinition } from '@objectql/types';
// import { Invoice } from './types'; // generated types

interface PayInput {
    note?: string;
    method: 'cash' | 'card' | 'transfer';
}

export const mark_paid: ActionDefinition<any, PayInput> = {
    handler: async ({ id, input, api, user, objectName }) => {
        // 1. Fetch current state
        const invoice = await api.findOne(objectName, id);
        if (!invoice) throw new Error("Invoice not found");
        
        if (invoice.status === 'Paid') {
            throw new Error("Invoice is already paid.");
        }

        // 2. Perform updates
        await api.update(objectName, id, {
            status: 'Paid',
            payment_method: input.method,
            payment_note: input.note,
            paid_by: user?.id,
            paid_at: new Date()
        });

        // 3. Return result to UI
        return { 
            success: true, 
            message: `Invoice #${invoice.code} marked as paid.` 
        };
    }
};

interface ImportInput {
    file_url: string;
}

export const import_csv: ActionDefinition<any, ImportInput> = {
    handler: async ({ input, api }) => {
        // Logic to download CSV and parse it...
        return { count: 100 };
    }
};
```

## 3. Action Context (`ctx`)

The `handler` function receives a single context object with the following properties:

| Property | Type | Description |
| :--- | :--- | :--- |
| `objectName` | `string` | The API name of the object (e.g., `invoice`). |
| `actionName` | `string` | The API name of the action (e.g., `mark_paid`). |
| `id` | `string \| number` | **(Record Actions only)** The ID of the target record. |
| `input` | `T` | The validated arguments passed by the caller. |
| `api` | `HookAPI` | Database API (`find`, `create`, `update`, `delete`, `count`). |
| `user` | `object` | The current session user (contains `id`, `name`, etc.). |

## 4. Parameter Types

The `params` section in YAML supports the same types as Object Fields. This allows the Frontend to auto-generate beautiful forms.

*   `text`, `textarea`, `number`, `boolean`, `date`, `datetime`
*   `select` (Dropdown)
*   `lookup` (Reference to another object)
*   `file` (Attachment)

**Example: Lookup Parameter**
```yaml
params:
  assign_to:
    type: lookup
    reference: user
    label: Assign To Staff
```

## 5. Invoking Actions

### A. Via Server-Side Code (`app.executeAction`)

You can call actions from other parts of your backend (e.g., Cron jobs, Webhooks).

```typescript
// Cron Job
await app.executeAction('invoice', 'mark_paid', {
    id: 'inv_123',
    input: {
        method: 'card', 
        note: 'Auto-processed'
    },
    user: { id: 'system' } // Simulate a user
});
```

### B. Via HTTP API (RPC)

ObjectQL Server uses a unified RPC endpoint (typically mounted at `/api/objectql`).

```http
POST /api/objectql
Content-Type: application/json

{
    "op": "action",
    "object": "invoice",
    "args": {
        "action": "mark_paid",
        "id": "inv_123",
        "input": {
            "method": "cash",
            "note": "Paid at counter"
        }
    }
}
```

> **Note on Versioning:** It is recommended to mount the ObjectQL handler under a versioned prefix like `/api/v1/objectql` in your Express/Node app to manage future breaking changes.

### C. Via Frontend SDK

```javascript
// React / Client Code
await objectql.action('invoice', 'mark_paid').call({
    id: recordId,
    input: { method: 'cash' }
});
```

## 6. Transaction Safety

By default, Actions are **NOT** automatically wrapped in a database transaction. If you need atomicity (all-or-nothing), you should manage it manually, or if using a driver that supports it, rely on the `api` methods which might share a transaction context if configured (though `HookAPI` is currently stateless).

*Future versions of ObjectQL may introduce transactional decorators.*

## 7. Best Practices

1.  **Thin Controllers**: Keep your `.action.ts` handlers relatively thin. If the logic is complex, move it to a dedicated Service class.
2.  **Input Validation**: Although ObjectQL checks types defined in YAML, always validate business rules (e.g., "Amount must be positive") inside the handler.
3.  **Return JSON**: Always return a JSON serializable object. Do not return database cursors or complex class instances.
