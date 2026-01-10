# Logic: Actions (RPC)

Actions (Remote Procedure Calls) allow you to define custom backend functions that go beyond simple CRUD. They are integrated into the metadata, meaning the Frontend knows exactly how to render them (buttons, confirmation dialogs, forms).

## 1. Defining Actions

Actions require two parts:
1.  **Declaration**: in `*.object.yml` (Defines the "What" and "UI").
2.  **Implementation**: in `*.action.ts` (Defines the "How").

### Step 1: Declare in YAML

```yaml
# invoice.object.yml
actions:
  mark_paid:
    type: record           # Appears on a specific row
    label: Mark as Paid
    icon: standard:money
    confirm_text: "Are you sure? This will trigger a receipt email."
    params:                # Form Input Schema
      note:
        type: textarea
        label: Payment Note
      method:
        type: select
        options: [cash, card, transfer]
```

### Step 2: Implement in TypeScript

Use the `ActionDefinition` type for full type safety, including inputs.

```typescript
// invoice.action.ts
import { ActionDefinition } from '@objectql/types';
import { Invoice } from './types';

interface PayInput {
    note?: string;
    method: 'cash' | 'card' | 'transfer';
}

export const mark_paid: ActionDefinition<Invoice, PayInput> = {
    handler: async ({ id, input, api, user }) => {
        // 1. Validate
        const invoice = await api.findOne('invoice', id);
        if (invoice.status === 'Paid') throw new Error("Already paid");

        // 2. Execute Logic
        await api.update('invoice', id, {
            status: 'Paid',
            payment_method: input.method,
            payment_note: input.note,
            paid_by: user.id
        });

        // 3. Return a result (optional)
        return { success: true };
    }
};
```

## 2. Global vs Record Actions

*   **Record Actions (`type: record`)**:
    *   **Context**: Receives a specific `id`.
    *   **UI**: Rendered as buttons on a Detail Page or List Item.
    *   **Example**: Approve, Convert, Print.

*   **Global Actions (`type: global`)**:
    *   **Context**: No `id`. Operates on the collection or system.
    *   **UI**: Rendered as buttons on the List View toolbar.
    *   **Example**: Import CSV, Sync All, Generate Report.

## 3. Schema Reuse

The best part of ObjectQL Actions is that the `params` definition reuses the standard **Field Schema**.

This means you can use:
*   `type: lookup` to pick a related User.
*   `type: file` to upload an attachment for the action.
*   `required: true` to enforce inputs.

Frontend frameworks can render an "Action Form" automatically using the same component used for regular Record Create/Edit forms.
