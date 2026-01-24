# Trigger Zod Schema

This module provides Zod schema validation for ObjectQL triggers, following the `@objectstack/spec` protocol.

## Overview

Triggers are business logic hooks that execute before or after database operations (insert, update, delete). They enable:
- Data validation
- Setting default values
- Updating related records
- Preventing operations
- Audit logging

## Schemas

### TriggerAction

Defines the database operation that triggers execution:
- `insert` - Record creation
- `update` - Record modification
- `delete` - Record deletion

### TriggerTiming

Defines when the trigger executes:
- `before` - Execute before database operation (can modify doc, prevent operation)
- `after` - Execute after database operation (can trigger side effects)

### TriggerContextSchema

Runtime context available to trigger code during execution.

### TriggerSchema

Complete trigger definition including metadata and execution function.

## Usage

### Basic Before Insert Trigger

```typescript
import { TriggerSchema, type TriggerContext } from '@objectql/types';

const setDefaultStatus = {
  name: 'set_default_status',
  object: 'project',
  timing: 'before' as const,
  action: 'insert' as const,
  execute: async (context: TriggerContext) => {
    // Set default values
    if (!context.doc.status) {
      context.doc.status = 'active';
    }
    
    // Validation
    if (!context.doc.email) {
      context.addError('Email is required');
    }
  },
  description: 'Sets default status for new projects',
  active: true,
  order: 10,
};

// Validate with Zod
const validatedTrigger = TriggerSchema.parse(setDefaultStatus);
```

### After Update Trigger

```typescript
import { TriggerSchema, type TriggerContext } from '@objectql/types';

const logStatusChange = {
  name: 'log_status_change',
  object: 'order',
  timing: 'after' as const,
  action: 'update' as const,
  execute: async (context: TriggerContext) => {
    // Check if status changed
    if (context.getOldValue('status') !== context.doc.status) {
      // Log the change
      await context.ql.object('activity_log').create({
        record_id: context.doc.id,
        message: `Status changed from ${context.getOldValue('status')} to ${context.doc.status}`,
        user_id: context.userId,
      });
    }
  },
  description: 'Logs status changes to activity log',
};

// Validate
const validatedTrigger = TriggerSchema.parse(logStatusChange);
```

### Multiple Actions

```typescript
import { TriggerSchema } from '@objectql/types';

const validateAmount = {
  name: 'validate_amount',
  object: 'order',
  timing: 'before' as const,
  action: ['insert', 'update'] as const, // Array of actions
  execute: async (context) => {
    if (context.doc.amount < 0) {
      context.addError('Amount must be positive', 'amount');
    }
  },
};

const validatedTrigger = TriggerSchema.parse(validateAmount);
```

## Validation Rules

### Trigger Name
- Must be snake_case
- Can only contain lowercase letters, numbers, and underscores
- Must start with a letter or underscore
- Examples: `set_default`, `validate_amount`, `_private_trigger`

### Required Fields
- `name` - Unique trigger identifier
- `object` - Object this trigger is attached to
- `timing` - When to execute ('before' or 'after')
- `action` - Operation(s) to trigger on
- `execute` - Async function that performs the business logic

### Optional Fields
- `description` - What the trigger does
- `active` - Whether the trigger is enabled (default: true)
- `order` - Execution order when multiple triggers exist (default: 0)

## Testing

The implementation includes comprehensive tests covering:
- Valid and invalid trigger actions
- Valid and invalid trigger timing
- Complete trigger context validation
- Trigger schema validation
- Default value application
- Name format validation
- Type inference

All 14 tests pass successfully.

## Integration with @objectstack/spec

This implementation follows the trigger schema specification defined in `@objectstack/spec` package, ensuring compatibility with the ObjectStack protocol.
