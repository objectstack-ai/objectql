# ObjectQL Custom Actions (RPC)

**Version:** 1.0.0

## 1. Overview

**Custom Actions** allow you to define server-side business logic that is exposed via the API but does not fit into standard CRUD operations. They follow the **Remote Procedure Call (RPC)** pattern.

Common use cases include:
*   **Complex Transactions:** "Convert Lead to Opportunity" (involves creating/updating multiple records).
*   **External Integrations:** "Send Invoice via Email" or "Sync to SAP".
*   **State Transitions:** "Approve Contract" (specific validation logic + status update).
*   **Calculations:** "Calculate Loan Amortization Schedule".

## 2. Defining Actions

Actions are defined as part of the Object Metadata.

### 2.1 Metadata Structure (YAML)

You can define the action signature, input parameters, and return type in the Object's YAML file.

```yaml
# objects/contracts.object.yml
name: contracts
label: Service Contract
fields:
  title: 
    type: text
  status:
    type: select
    options: [draft, active, terminated]

# === Action Definitions ===
actions:
  terminate:
    label: Terminate Contract
    description: Ends the contract and explicitly calculates penalties.
    
    # 2.1.1 Input Parameters (Argument Schema)
    params:
      reason:
        type: text
        required: true
      penalty_amount:
        type: currency
        required: false
      effective_date:
        type: date

    # 2.1.2 Return Type (Optional)
    # If omitted, returns void or any.
    result:
      type: object 
```

### 2.2 Action Properties

| Property | Type | Description |
| :--- | :--- | :--- |
| `label` | string | Display name (for UI buttons). |
| `description` | string | Help text. |
| `params` | Record<string, FieldConfig> | Schema for input arguments. Supports validation. |
| `result` | FieldType \| Object | Return type definition. |
| `roles` | string[] | (Optional) Restrict execution to specific roles. |

## 3. Implementing Action Logic

Action handlers are TypeScript functions registered alongside the object.
Similar to Triggers, expected convention is `*.actions.ts`.

### 3.1 Handler Signature

```typescript
// objects/contracts/contracts.actions.ts
import { defineAction } from '@objectql/core';

export default defineAction({
  object: 'contracts',
  name: 'terminate', // Must match metadata key
  
  async handler({ ctx, id, params }) {
    // 1. Validate Business Logic
    const contract = await ctx.object('contracts').findOne(id);
    if (contract.status === 'terminated') {
      throw new Error("Contract is already terminated.");
    }

    // 2. Perform Updates (Atomic Transaction inherited from ctx)
    await ctx.object('contracts').update(id, {
      status: 'terminated',
      termination_reason: params.reason,
      termination_date: params.effective_date || new Date()
    });

    // 3. Create Related Records
    if (params.penalty_amount > 0) {
      await ctx.object('invoices').create({
        contract_id: id,
        amount: params.penalty_amount,
        type: 'penalty'
      });
    }

    // 4. Return Result
    return { success: true, terminated_at: new Date() };
  }
});
```

### 3.2 Context & Arguments

The handler receives a context object:

| Property | Type | Description |
| :--- | :--- | :--- |
| `ctx` | `ObjectQLContext` | The current user session and transaction scope. |
| `id` | `string \| undefined` | The record ID. **Undefined** if the action is static (Object-level). |
| `params` | `any` | The validated input arguments matching the YAML `params` definition. |

## 4. Invoking Actions

### 4.1 Server-Side (Node.js)

```typescript
// Call an action on a specific record instance
const result = await ctx.object('contracts').call('terminate', 'c-100', {
  reason: "Breach of SLA",
  penalty_amount: 500
});
```

### 4.2 API Request (REST)

**Record Actions (Bound to Instance)**

**POST** `/api/v1/object/:objectName/:recordId/:actionName`

```json
// POST /api/v1/object/contracts/c-100/terminate
{
  "reason": "Customer Request"
}
```

**Object Actions (Static / Collection Level)**

Use this for bulk operations, imports, or creating generalized records.

**POST** `/api/v1/object/:objectName/:actionName`

```json
// POST /api/v1/object/contracts/calculate_forecast
{
  "year": 2024
}
```

## 5. Security & Validation

### 5.1 Parameter Validation
The engine automatically validates `params` against the metadata definition (required fields, types) *before* executing the handler.

### 5.2 Permissions
*   **Object Level:** User must have `allowRead` access to the object.
*   **Action Level:** If `roles` property is defined in YAML, only listed roles can execute.
*   **Record Level:** If `id` is provided, standard Record Level Security (RLS) applies to fetching the record context.
