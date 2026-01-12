# @objectql/core

The core ORM and runtime engine for ObjectQL. This package handles object querying, CRUD operations, database driver coordination, transaction management, and **metadata-driven validation**.

## Features

- **Unified Query Language**: A generic way to query data across different databases (SQL, Mongo, etc.).
- **Repository Pattern**: `ObjectRepository` for managing object records.
- **Driver Agnostic**: Abstraction layer for database drivers.
- **Dynamic Schema**: Loads object definitions from metadata.
- **Hooks & Actions**: Runtime logic injection.
- **Validation Engine**: Metadata-driven validation with field-level, cross-field, and state machine rules.

## Installation

```bash
npm install @objectql/core @objectql/types
```

## Usage

### Basic Setup

```typescript
import { ObjectQL } from '@objectql/core';
// Import a driver, e.g., @objectql/driver-sql

const objectql = new ObjectQL({
    datasources: {
        default: new MyDriver({ ... })
    }
});

await objectql.init();

// Use context for operations
const ctx = objectql.createContext({ userId: 'u-1' });
const projects = await ctx.object('project').find({
    filters: [['status', '=', 'active']]
});
```

### Validation System

The validation system allows you to define validation rules in your object metadata and execute them programmatically.

#### Field-Level Validation

Define validation rules directly in field configuration:

```typescript
import { ObjectConfig } from '@objectql/types';

const projectObject: ObjectConfig = {
    name: 'project',
    fields: {
        email: {
            type: 'email',
            required: true,
            validation: {
                format: 'email',
                message: 'Please enter a valid email address'
            }
        },
        budget: {
            type: 'currency',
            validation: {
                min: 0,
                max: 10000000,
                message: 'Budget must be between 0 and 10,000,000'
            }
        },
        name: {
            type: 'text',
            required: true,
            validation: {
                min_length: 3,
                max_length: 100,
                pattern: '^[a-zA-Z0-9\\s]+$',
                message: 'Name must be 3-100 alphanumeric characters'
            }
        }
    }
};
```

#### Using the Validator Class

Execute validation rules programmatically:

```typescript
import { Validator } from '@objectql/core';
import { ValidationContext, CrossFieldValidationRule } from '@objectql/types';

// Create validator with optional language configuration
const validator = new Validator({
    language: 'en',
    languageFallback: ['en', 'zh-CN']
});

// Define cross-field validation rules
const rules: CrossFieldValidationRule[] = [
    {
        name: 'valid_date_range',
        type: 'cross_field',
        rule: {
            field: 'end_date',
            operator: '>=',
            compare_to: 'start_date'  // Cross-field comparison
        },
        message: 'End date must be on or after start date',
        error_code: 'INVALID_DATE_RANGE'
    }
];

// Validate a record
const context: ValidationContext = {
    record: {
        start_date: '2024-01-01',
        end_date: '2024-12-31'
    },
    operation: 'create'
};

const result = await validator.validate(rules, context);

if (!result.valid) {
    console.log('Validation errors:', result.errors);
    // Output: Array of ValidationRuleResult objects
}
```

#### State Machine Validation

Enforce valid state transitions:

```typescript
import { StateMachineValidationRule } from '@objectql/types';

const statusRule: StateMachineValidationRule = {
    name: 'status_transition',
    type: 'state_machine',
    field: 'status',
    transitions: {
        planning: {
            allowed_next: ['active', 'cancelled']
        },
        active: {
            allowed_next: ['on_hold', 'completed', 'cancelled']
        },
        completed: {
            allowed_next: [],
            is_terminal: true
        }
    },
    message: 'Invalid status transition from {{old_status}} to {{new_status}}',
    error_code: 'INVALID_STATE_TRANSITION'
};

// Validate on update
const updateContext: ValidationContext = {
    record: { status: 'completed' },
    previousRecord: { status: 'active' },
    operation: 'update'
};

const result = await validator.validate([statusRule], updateContext);
```

#### Validation in Object Configuration

Add validation rules to your object metadata:

```typescript
const projectConfig: ObjectConfig = {
    name: 'project',
    fields: {
        // ... field definitions
    },
    validation: {
        ai_context: {
            intent: 'Ensure project data integrity',
            validation_strategy: 'Fail fast with clear error messages'
        },
        rules: [
            {
                name: 'valid_date_range',
                type: 'cross_field',
                rule: {
                    field: 'end_date',
                    operator: '>=',
                    compare_to: 'start_date'
                },
                message: 'End date must be on or after start date',
                error_code: 'INVALID_DATE_RANGE'
            },
            {
                name: 'status_transition',
                type: 'state_machine',
                field: 'status',
                transitions: {
                    planning: { allowed_next: ['active', 'cancelled'] },
                    active: { allowed_next: ['completed', 'cancelled'] }
                },
                message: 'Invalid status transition'
            }
        ]
    }
};
```

#### Validation Features

**Supported Validation Types:**
- `field` - Built-in field validation (required, format, min/max, length, pattern)
- `cross_field` - Validate relationships between fields
- `state_machine` - Enforce valid state transitions
- `unique` - Uniqueness validation (stub - requires database integration)
- `business_rule` - Complex business rules (stub - requires expression evaluation)
- `custom` - Custom validation logic (stub - requires safe function execution)
- `dependency` - Related record validation (stub - requires database integration)

**Comparison Operators:**
- `=`, `!=` - Equality/inequality
- `>`, `>=`, `<`, `<=` - Comparison
- `in`, `not_in` - Array membership
- `contains`, `not_contains` - String containment
- `starts_with`, `ends_with` - String prefix/suffix

**Validation Triggers:**
- `create` - Run on record creation
- `update` - Run on record update
- `delete` - Run on record deletion

**Severity Levels:**
- `error` - Blocks the operation
- `warning` - Shows warning but allows operation
- `info` - Informational message

**Advanced Features:**
- Field-specific triggers (validate only when specific fields change)
- Conditional validation with `apply_when`
- Template message formatting with `{{field}}` placeholders
- Internationalization support with language fallback
- AI context for documentation and LLM understanding

## Shared Metadata

You can pass an existing `MetadataRegistry` to ObjectQL:

```typescript
const registry = new MetadataRegistry();
// ... pre-load metadata ...

const objectql = new ObjectQL({
    registry: registry,
    datasources: { ... }
});
```

## API Reference

### Validator Class

**Constructor:**
```typescript
new Validator(options?: ValidatorOptions)
```

**Options:**
- `language?: string` - Preferred language for validation messages (default: 'en')
- `languageFallback?: string[]` - Fallback languages (default: ['en', 'zh-CN'])

**Methods:**

- `validate(rules: AnyValidationRule[], context: ValidationContext): Promise<ValidationResult>`
  - Executes validation rules against a record
  - Returns validation result with errors, warnings, and info messages

- `validateField(fieldName: string, fieldConfig: FieldConfig, value: any, context: ValidationContext): Promise<ValidationRuleResult[]>`
  - Validates a single field value
  - Returns array of validation results

## See Also

- [@objectql/types](../types) - Type definitions including validation types
- [Validation Specification](../../docs/spec/validation.md) - Complete validation metadata specification
