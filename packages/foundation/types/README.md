# @objectql/types

Type definitions for the ObjectQL system, including object schemas, field configurations, validation rules, queries, hooks, and actions.

## Features

- **Object & Field Types**: Define data models with `ObjectConfig` and `FieldConfig`
- **Query Types**: Type-safe query definitions with `UnifiedQuery`
- **Validation Types**: Comprehensive validation rule types and interfaces
- **Hook & Action Types**: Event-driven logic type definitions
- **Driver Interface**: Abstraction layer for database drivers
- **AI Context**: Metadata for AI-friendly documentation

## Installation

```bash
npm install @objectql/types
```

## Exported Types

### Core Types
- `ObjectConfig` - Object schema definition
- `FieldConfig` - Field configuration with validation
- `FieldType` - Supported field data types
- `ObjectDoc` - Base interface for all documents

### Validation Types
- `ValidationRule` - Base validation rule interface
- `AnyValidationRule` - Union of all validation rule types
- `ValidationContext` - Context provided to validators
- `ValidationResult` - Result of validation execution
- `ValidationRuleResult` - Result of a single rule
- `ValidationError` - Validation error class
- `ValidatorOptions` - Configuration for Validator class

**Validation Rule Types:**
- `CrossFieldValidationRule` - Compare fields with operators
- `StateMachineValidationRule` - Enforce state transitions
- `BusinessRuleValidationRule` - Complex business rules
- `UniquenessValidationRule` - Uniqueness constraints
- `DependencyValidationRule` - Related record validation
- `CustomValidationRule` - Custom validation functions

**Helper Types:**
- `ValidationRuleType` - Types of validation rules
- `ValidationSeverity` - Error severity levels (error, warning, info)
- `ValidationTrigger` - When to run validation (create, update, delete)
- `ValidationOperator` - Comparison operators (=, !=, >, >=, <, <=, in, contains, etc.)
- `ValidationCondition` - Condition structure for rules
- `ValidationAiContext` - AI-friendly metadata for rules
- `FieldValidation` - Field-level validation configuration

### Query Types
- `UnifiedQuery` - Generic query structure
- `QueryFilter` - Filter conditions
- `QuerySort` - Sort specifications

### Hook & Action Types
- `HookContext` - Context for hook execution
- `ActionContext` - Context for action execution
- `HookHandler` - Hook function signature
- `ActionHandler` - Action function signature

### Driver Types
- `Driver` - Database driver interface
- `DriverConfig` - Driver configuration

## Usage Examples

### Object Definition with Validation

```typescript
import { ObjectConfig, FieldConfig } from '@objectql/types';

const projectObject: ObjectConfig = {
    name: 'project',
    label: 'Project',
    fields: {
        name: {
            type: 'text',
            label: 'Project Name',
            required: true,
            validation: {
                min_length: 3,
                max_length: 100,
                pattern: '^[a-zA-Z0-9\\s]+$',
                message: 'Name must be 3-100 alphanumeric characters'
            }
        },
        email: {
            type: 'email',
            validation: {
                format: 'email',
                message: 'Please enter a valid email address'
            }
        },
        status: {
            type: 'select',
            options: [
                { label: 'Planning', value: 'planning' },
                { label: 'Active', value: 'active' },
                { label: 'Completed', value: 'completed' }
            ],
            ai_context: {
                intent: 'Track project lifecycle',
                rationale: 'Projects follow a controlled workflow'
            }
        }
    },
    validation: {
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
            }
        ]
    }
};
```

### Validation Rule Definition

```typescript
import { 
    CrossFieldValidationRule, 
    StateMachineValidationRule,
    ValidationContext 
} from '@objectql/types';

// Cross-field validation
const dateRangeRule: CrossFieldValidationRule = {
    name: 'valid_date_range',
    type: 'cross_field',
    rule: {
        field: 'end_date',
        operator: '>=',
        compare_to: 'start_date'
    },
    message: 'End date must be on or after start date',
    severity: 'error',
    trigger: ['create', 'update']
};

// State machine validation
const statusRule: StateMachineValidationRule = {
    name: 'status_transition',
    type: 'state_machine',
    field: 'status',
    transitions: {
        planning: {
            allowed_next: ['active', 'cancelled'],
            ai_context: {
                rationale: 'Can start work or cancel before beginning'
            }
        },
        active: {
            allowed_next: ['completed', 'cancelled']
        },
        completed: {
            allowed_next: [],
            is_terminal: true
        }
    },
    message: 'Invalid status transition from {{old_status}} to {{new_status}}'
};
```

### Using Validation Context

```typescript
import { ValidationContext, ValidationTrigger } from '@objectql/types';

const context: ValidationContext = {
    record: {
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        status: 'active'
    },
    previousRecord: {
        status: 'planning'
    },
    operation: 'update',
    changedFields: ['status'],
    metadata: {
        objectName: 'project',
        ruleName: 'status_transition'
    }
};
```

## Type Reference

### ValidationRule

Base interface for all validation rules:

```typescript
interface ValidationRule {
    name: string;
    type: ValidationRuleType;
    message: string | Record<string, string>;
    error_code?: string;
    severity?: ValidationSeverity;
    trigger?: ValidationTrigger[];
    fields?: string[];
    context?: string[];
    skip_bulk?: boolean;
    ai_context?: ValidationAiContext;
    apply_when?: ValidationCondition;
    async?: boolean;
    timeout?: number;
}
```

### ValidationCondition

Condition structure for validation rules:

```typescript
interface ValidationCondition {
    field?: string;
    operator?: ValidationOperator;
    value?: any;
    compare_to?: string;  // For cross-field comparison
    expression?: string;
    all_of?: ValidationCondition[];
    any_of?: ValidationCondition[];
}
```

### FieldValidation

Field-level validation configuration:

```typescript
interface FieldValidation {
    format?: 'email' | 'url' | 'phone' | 'date' | 'datetime';
    protocols?: string[];
    min?: number;
    max?: number;
    min_length?: number;
    max_length?: number;
    pattern?: string;
    message?: string;
}
```

## See Also

- [@objectql/core](../core) - Core engine with Validator class
- [Validation Specification](../../docs/spec/validation.md) - Complete validation metadata specification

