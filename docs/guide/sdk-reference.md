# ObjectQL API

**Version:** 1.0.0

## 1. Overview

The Client API adopts a **Context-Bound Repository Pattern**.
Instead of using a global static object, all interactions start with a `Context` (Session) that encapsulates the current user identity, tenancy, and transaction scope.

## 2. The Context Object (`ctx`)

### 2.1 Interface Definition

The `ctx` object is the core entry point for all data operations.

```typescript
interface ObjectQLContext {
  // === Identity & Isolation ===
  userId?: string;                        // Current User ID
  spaceId?: string;                       // Multi-tenancy Isolation (Organization ID)
  roles: string[];                        // RBAC Roles

  // === Execution Flags ===
  /**
   * Sudo Mode / System Bypass.
   * - true: Bypasses all permission checks (CRUD, Field Level Security, Record Level Security).
   * - false/undefined: Enforces all permission checks based on 'roles'.
   */
  isSystem?: boolean;

  /**
   * Trigger Control.
   * - true: Skips all lifecycle hooks (beforeCreate, afterUpdate, etc.).
   * - Useful for bulk data imports or raw data correction to prevent side effects.
   * - Requires 'isSystem: true' (Security Safeguard).
   */
  ignoreTriggers?: boolean;

  // === Data Entry Point ===
  /**
   * Returns a repository proxy bound to this context.
   * All operations performed via this proxy inherit userId, spaceId, and transaction.
   */
  object(entityName: string): ObjectRepository;

  /**
   * Execute a function within a transaction.
   * The callback receives a new context 'trxCtx' which inherits userId and spaceId from this context.
   */
  transaction(callback: (trxCtx: ObjectQLContext) => Promise<any>): Promise<any>;

  /**
   * Returns a new context with system privileges (isSystem: true).
   * It shares the same transaction scope as the current context.
   */
  sudo(): ObjectQLContext;
}

```

### 2.2 Initializing a Context

You should create a context at the beginning of a request (e.g., in an API middleware).

```typescript
const objectql = require('@objectql/core');

// Create a context from HTTP request info
const ctx = objectql.createContext({
  userId: 'u-001',
  spaceId: 's-100',
  roles: ['admin']
});

// Now use 'ctx' to interact with data
const orders = await ctx.object('orders').find();

```

## 3. Query API (Read)

**Note:** You do **not** need to pass `userId` or `spaceId` in the options. They are injected automatically by `ctx`.

### 3.1 `find(query)`

Retrieves a list of records.

```typescript
// The engine automatically applies: WHERE space_id = 's-100'
const results = await ctx.object('orders').find({
  fields: ['name', 'amount', 'status'],
  filters: [['status', '=', 'paid']]
});

```

### 3.2 `findOne(id | query)`

Retrieves a single record.

**By ID:**

```typescript
const order = await ctx.object('orders').findOne('o-123');

```

**By Criteria:**

```typescript
const openOrder = await ctx.object('orders').findOne({
  filters: [['status', '=', 'open'], 'and', ['owner', '=', ctx.userId]]
});

```

### 3.3 `count(filters)`

Efficiently counts records matching a filter.

```typescript
const count = await ctx.object('orders').count([['status', '=', 'paid']]);

```

### 3.4 `aggregate(query)`

Performs database-side aggregation.

```typescript
const stats = await ctx.object('orders').aggregate({
  groupBy: ['category'],
  aggregate: {
    'amount': 'sum',
    'id': 'count'
  }
});

```

### 3.5 `distinct(field, filters)`

Retrieves a list of unique values for a specific field, optionally filtered.

```typescript
// Get all unique cities from customers in the 'US'
const cities = await ctx.object('customers').distinct('billing_city', [['country', '=', 'US']]);
// Result: ['New York', 'San Francisco', 'Chicago']
```

## 4. Mutation API (Write)

### 4.1 `create(doc)`

Creates a new record.

* **Triggers:** `beforeCreate`, `afterCreate`
* **Auto-fill:** `created_by`, `space_id` are automatically populated from `ctx`.

```typescript
const newOrder = await ctx.object('orders').create({
  name: "Service Contract",
  amount: 2000,
  customer_id: "c-001"
});

```

### 4.2 `update(id, doc)`

Updates an existing record.

* **Triggers:** `beforeUpdate`, `afterUpdate`
* **Atomic Operators:** Supports `$inc`, `$set`, `$push` (MongoDB style).

```typescript
// Standard Update
await ctx.object('orders').update('o-123', {
  status: 'approved'
});

// Atomic Increment (Concurrency Safe)
await ctx.object('inventory').update('i-999', {
  $inc: { stock: -1 }
});

```

### 4.3 `delete(id)`

Deletes a record.

* **Triggers:** `beforeDelete`, `afterDelete`

```typescript
await ctx.object('orders').delete('o-123');

```

### 4.4 `findOneAndUpdate(query, update, options)`

Atomically finds a record, modifies it, and returns the document. Useful for job queues, counters, and state machines.

*   **options.returnNew**: If `true`, returns the document *after* the update. If `false` (default), returns the document *before* the update.
*   **options.upsert**: If `true`, creates a new record if no match is found.

```typescript
// Assignment: Find the oldest unassigned task and assign it to me
const task = await ctx.object('tasks').findOneAndUpdate(
    // Filters
    [['status', '=', 'pending'], 'and', ['assignee', '=', null]], 
    // Update
    { assignee: ctx.userId, status: 'in_progress' },
    // Sort & Options
    { 
        sort: [['created_at', 'asc']],
        returnNew: true 
    }
);
```

### 4.5 `update(id, doc, options)` with Upsert

The standard update can also support `upsert` semantics if supported by the driver.

```typescript
// Update setting if exists, otherwise create it with specific ID
await ctx.object('user_settings').update('setting-key-001', {
  theme: 'dark'
}, { upsert: true });
```

## 5. Advanced Features

### 5.1 Relational Queries (Expand/JOIN)

Fetch related data in a single request.

```typescript
const orders = await ctx.object('orders').find({
  fields: ['name', 'amount'],
  expand: {
    customer: {
      fields: ['name', 'email']
    },
    line_items: {
      fields: ['product', 'quantity', 'price'],
      sort: [['price', 'desc']]
    }
  }
});

```

### 5.2 System Privileges & Execution Control

To perform administrative tasks, you can elevate the context privileges or control the execution pipeline.

**Sudo Mode (`isSystem`)**

Bypasses all permission checks (CRUD, FLS, RLS). Use this when the system needs to perform operations that the user is not allowed to do directly.

```typescript
// 'isSystem: true' grants full access
const systemCtx = objectql.createContext({ isSystem: true });
await systemCtx.object('audit_logs').delete('log-old-001');
```

**Bypassing Triggers (`ignoreTriggers`)**

To insert raw data without executing business logic (hooks), set `ignoreTriggers: true`. This is often used during data migration or restoration.
*Note: This flag usually requires `isSystem: true` to prevent security circumvention.*

```typescript
// Create a context for raw data import
const importCtx = objectql.createContext({
  isSystem: true,
  ignoreTriggers: true
});

// Creates record WITHOUT executing 'beforeCreate'/'afterCreate' hooks
await importCtx.object('orders').create({
  _id: 'restored-o-001',
  name: "Restored Order"
});
```

### 5.3 Batch Operations (Bulk)

Efficiently handle large datasets in a single database request.

*   **Atomicity:** Depends on the underlying driver. (MongoDB/SQL usually support atomic transactions).
*   **Triggers:** Hooks are executed for *each* record (unless `ignoreTriggers: true`).

```typescript
// Bulk Create
await ctx.object('line_items').createMany([
  { product: 'p-1', quantity: 10 },
  { product: 'p-2', quantity: 5 }
]);

// Bulk Update (Criteria-based)
// Updates ALL records matching the filter.
await ctx.object('tasks').updateMany(
  [['status', '=', 'pending'], 'and', ['due_date', '<', '2023-01-01']], // Filter
  { status: 'overdue' } // Patch
);

// Bulk Delete
await ctx.object('logs').deleteMany([['created_at', '<', '2022-01-01']]);
```

### 5.4 Metadata Introspection

Access object definitions at runtime. Essential for building dynamic UIs or validation layers.

```typescript
const schema = await ctx.object('orders').getSchema();
console.log(schema.label); // "Sales Order"
console.log(schema.fields['amount'].type); // "currency"
```

### 5.5 Custom Actions (RPC)

Execute complex server-side business logic that doesn't fit into standard CRUD operations. Actions are defined in the object's metadata.

```typescript
// Call a custom 'approve' action defined on the 'contracts' object
const result = await ctx.object('contracts').call('approve', {
  contractId: 'c-100',
  comments: 'LGTM'
});
```

## 6. Transaction Management

The `ctx` pattern makes transaction management seamless. You don't need to pass `trx` handles manually; they are encapsulated within a new transaction-bound context.

```typescript
// Assume 'ctx' is already initialized with user identity
await ctx.transaction(async (trxCtx) => {
  // 'trxCtx' is a special context bound to the transaction.
  // It inherits userId, spaceId from 'ctx'.

  // 1. Create Invoice
  const invoice = await trxCtx.object('invoices').create({
    order_id: 'o-123',
    total: 5000
  });

  // 2. Update Order Status
  // If this fails, Step 1 is rolled back.
  await trxCtx.object('orders').update('o-123', {
    status: 'invoiced',
    invoice_id: invoice.id
  });
});

```
