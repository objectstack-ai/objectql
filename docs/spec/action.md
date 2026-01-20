# Action (Server Function) Specification

Learn how to define custom server-side functions (RPCs) attached to objects. This specification covers action metadata, parameters, permissions, and patterns for implementing complex business operations beyond standard CRUD.

Unlike Hooks (which trigger automatically), Actions are explicitly invoked by the client (API, Button, Scheduled Task).

## 1. Concepts

### 1.1 Scope (`type`)
*   **Global Actions**: Operate on the collection level.
    *   *Examples:* "Import CSV", "Generate Monthly Report", "Sync with External API".
    *   *Context:* No `id`.
*   **Record Actions**: Operate on a specific record instance.
    *   *Examples:* "Approve", "Reject", "Send Email", "Clone".
    *   *Context:* Has `id`.

### 1.2 Schema-First Inputs
Input parameters (`params`) are defined using the same `FieldConfig` schema as object fields. This gives you free validation, type coercion, and UI generation.

## 2. Configuration (YAML)

Actions are declared in your object definition file (`<object_name>.object.yml`).

```yaml
# File: order.object.yml
# Object name is inferred from filename!

label: Order
fields:
  # ... field definitions

# Custom Actions
actions:
  # 1. A Record Action (Button on a row)
  approve_order:
    type: record
    label: Approve Order
    icon: standard:approval
    confirm_text: "Are you sure you want to approve this order? This cannot be undone."
    params:
      comment:
        type: textarea
        required: true
        label: Approval Reason
  
  # 2. A Global Action (Button on list view)
  sync_jira:
    type: global
    label: Sync from Jira
    internal: true # Not exposed to public API
    params:
      project_key:
        type: text
        required: true
```

## 3. Implementation (TypeScript)

Implement the logic in a companion `<object_name>.action.ts` file.

**File Naming Convention:** `<object_name>.action.ts`

The filename (without `.action.ts`) must match your object name to enable automatic binding.

**Examples:**
- `order.action.ts` → Actions for `order` object
- `project.action.ts` → Actions for `project` object

```typescript
// File: order.action.ts
import { ActionDefinition } from '@objectql/types';
import { Order } from './types';

// Input Type Definition
interface ApproveInput {
    comment: string;
}

export const approve_order: ActionDefinition<Order, ApproveInput> = {
    type: 'record',
    
    // Logic
    handler: async ({ id, input, api, user }) => {
        // 1. Fetch current state
        const order = await api.findOne('order', id);
        
        if (order.status !== 'Draft') {
            throw new Error("Only draft orders can be approved");
        }

        // 2. Perform updates using Atomic Operations or Transactions
        await api.update('order', id, {
            status: 'Approved',
            approved_by: user.id,
            approval_comment: input.comment,
            approved_at: new Date()
        });

        // 3. Return result to client
        return { success: true, new_status: 'Approved' };
    }
}
```

## 4. Why this design is "Optimal"?

1.  **Unified Schema**: Inputs use the same definitions as Database fields. If you know how to define a table, you know how to define an API argument.
2.  **UI Ready**: The metadata (`label`, `icon`, `confirm_text`, `params`) contains everything a frontend framework (like React Admin or Salesforce Lightning) needs to render a button and a modal form **automatically**.
3.  **Type Safety**: The `ActionDefinition<Entity, Input, Output>` generic ensures your handler code respects the contract.

## 5. Loading & Registration (Standard)

To ensure the Metadata Loader can automatically bind your actions to the correct object, you must follow the file naming convention:

*   **Object Definition**: `mypackage/objects/invoice.object.yml`
*   **Action Implementation**: `mypackage/objects/invoice.action.ts` (or `.js`)

The loader extracts the `objectName` from the filename (everything before `.action.`).

```typescript
// mypackage/objects/invoice.action.ts
export const approve_invoice: ActionDefinition<Invoice> = { ... };
export const reject_invoice: ActionDefinition<Invoice> = { ... };
```

The loader will register `approve_invoice` and `reject_invoice` as actions for the `invoice` object.
