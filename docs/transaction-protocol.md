# Transaction Protocol for ObjectQL Drivers

## Overview

This document defines the standard transaction protocol that all ObjectQL drivers should implement when supporting transactional operations. The protocol ensures consistent behavior across different database backends while accommodating their specific transaction mechanisms.

## Transaction Interface

All drivers supporting transactions MUST implement the following methods from the `Driver` interface:

```typescript
interface Driver {
    // Transaction lifecycle methods
    beginTransaction(): Promise<any>;
    commitTransaction(transaction: any): Promise<void>;
    rollbackTransaction(transaction: any): Promise<void>;
}
```

## Transaction Lifecycle

### 1. Begin Transaction

**Method:** `beginTransaction()`

**Purpose:** Start a new transaction and return a transaction object/handle.

**Return Value:** A transaction handle that can be passed to other driver methods. The specific type depends on the driver implementation:
- **Memory Driver**: Custom transaction object with `{ id, snapshot, operations }`
- **SQL Driver**: Knex.Transaction object
- **MongoDB Driver**: MongoDB ClientSession object

**Example:**
```typescript
const tx = await driver.beginTransaction();
```

### 2. Execute Operations

**Purpose:** Perform CRUD operations within the transaction context.

**Implementation:** All CRUD methods (`create`, `update`, `delete`, etc.) MUST accept an optional `options` parameter that can include the transaction handle.

**Pattern:**
```typescript
interface OperationOptions {
    transaction?: any;  // Transaction handle from beginTransaction()
    session?: any;      // Alternative name used by MongoDB
    // ... other options
}

async create(objectName: string, data: any, options?: OperationOptions): Promise<any>
async update(objectName: string, id: string | number, data: any, options?: OperationOptions): Promise<any>
async delete(objectName: string, id: string | number, options?: OperationOptions): Promise<any>
```

**Example:**
```typescript
const tx = await driver.beginTransaction();
try {
    await driver.create('users', { name: 'Alice' }, { transaction: tx });
    await driver.create('orders', { userId: 'alice' }, { transaction: tx });
    await driver.commitTransaction(tx);
} catch (error) {
    await driver.rollbackTransaction(tx);
    throw error;
}
```

### 3. Commit Transaction

**Method:** `commitTransaction(transaction: any)`

**Purpose:** Commit all operations performed within the transaction, making them permanent.

**Behavior:**
- MUST persist all changes made within the transaction
- MUST release transaction resources
- SHOULD throw an error if commit fails
- MAY throw an error if transaction is not in a valid state

**Example:**
```typescript
await driver.commitTransaction(tx);
```

### 4. Rollback Transaction

**Method:** `rollbackTransaction(transaction: any)`

**Purpose:** Abort the transaction and discard all changes made within it.

**Behavior:**
- MUST discard all changes made within the transaction
- MUST release transaction resources
- SHOULD NOT throw an error even if already rolled back
- MUST restore data to the state before beginTransaction()

**Example:**
```typescript
await driver.rollbackTransaction(tx);
```

## Driver-Specific Implementation Examples

### Memory Driver

Uses in-memory snapshots to implement transactions:

```typescript
interface MemoryTransaction {
    id: string;
    snapshot: Map<string, any>;
    operations: Array<{ type: 'set' | 'delete'; key: string; value?: any }>;
}

async beginTransaction(): Promise<MemoryTransaction> {
    const txId = nanoid();
    const snapshot = new Map(this.store);
    
    const transaction: MemoryTransaction = {
        id: txId,
        snapshot,
        operations: []
    };
    
    this.transactions.set(txId, transaction);
    return transaction;
}

async commitTransaction(transaction: MemoryTransaction): Promise<void> {
    // Apply all operations
    for (const op of transaction.operations) {
        if (op.type === 'set') {
            this.store.set(op.key, op.value);
        } else {
            this.store.delete(op.key);
        }
    }
    this.transactions.delete(transaction.id);
}

async rollbackTransaction(transaction: MemoryTransaction): Promise<void> {
    // Restore from snapshot
    this.store = new Map(transaction.snapshot);
    this.transactions.delete(transaction.id);
}
```

### SQL Driver (Knex)

Uses Knex.js transaction API:

```typescript
async beginTransaction(): Promise<Knex.Transaction> {
    return await this.knex.transaction();
}

async commitTransaction(trx: Knex.Transaction): Promise<void> {
    await trx.commit();
}

async rollbackTransaction(trx: Knex.Transaction): Promise<void> {
    await trx.rollback();
}

// In CRUD methods:
private getBuilder(objectName: string, options?: any) {
    let builder = this.knex(objectName);
    if (options?.transaction) {
        builder = builder.transacting(options.transaction);
    }
    return builder;
}
```

### MongoDB Driver

Uses MongoDB ClientSession:

```typescript
import { ClientSession } from 'mongodb';

async beginTransaction(): Promise<ClientSession> {
    const session = this.client.startSession();
    session.startTransaction();
    return session;
}

async commitTransaction(session: ClientSession): Promise<void> {
    try {
        await session.commitTransaction();
    } finally {
        await session.endSession();
    }
}

async rollbackTransaction(session: ClientSession): Promise<void> {
    try {
        await session.abortTransaction();
    } finally {
        await session.endSession();
    }
}

// In CRUD methods:
async create(objectName: string, data: any, options?: any) {
    const collection = await this.getCollection(objectName);
    const mongoOptions = options?.session ? { session: options.session } : {};
    const result = await collection.insertOne(data, mongoOptions);
    return result;
}
```

## Compatibility Matrix

| Driver | Transaction Support | Implementation | Isolation Level |
|--------|-------------------|----------------|-----------------|
| Memory | ✅ Full | Snapshot-based | SERIALIZABLE |
| SQL (Knex) | ✅ Full | Database native | Configurable |
| MongoDB | ✅ Full | ClientSession | Snapshot |
| Redis | ❌ Not supported | - | - |
| Excel | ❌ Not supported | - | - |
| FileSystem | ❌ Not supported | - | - |
| LocalStorage | ❌ Not supported | - | - |

## References

- [MongoDB Multi-Document Transactions](https://docs.mongodb.com/manual/core/transactions/)
- [PostgreSQL Transaction Isolation](https://www.postgresql.org/docs/current/transaction-iso.html)
- [ObjectQL Driver TCK](../packages/tools/driver-tck/README.md)
