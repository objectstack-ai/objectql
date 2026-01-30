# @objectql/plugin-validator

Validation engine plugin for ObjectQL - Field-level, cross-field, state machine, business rule, and uniqueness validation.

## Overview

The Validator Plugin provides comprehensive data validation capabilities for ObjectQL applications. It supports multiple validation rule types, conditional logic, internationalization, and integrates seamlessly with the ObjectQL lifecycle.

## Features

- **Field-Level Validation**: Required, format, pattern, min/max, length constraints
- **Cross-Field Validation**: Compare values across multiple fields
- **State Machine Validation**: Control status transitions with allowed/forbidden paths
- **Business Rule Validation**: Complex conditional logic with all_of/any_of operators
- **Uniqueness Validation**: Single-field or composite uniqueness constraints
- **Conditional Triggers**: Apply rules based on operation type or field changes
- **Internationalization**: Multi-language validation messages
- **Severity Levels**: Error, warning, and info message severities

## Installation

```bash
pnpm add @objectql/plugin-validator
```

## Usage

### Basic Setup

```typescript
import { ObjectStackKernel } from '@objectstack/runtime';
import { ValidatorPlugin } from '@objectql/plugin-validator';

const kernel = new ObjectStackKernel([
  // Your application config
  myApp,
  
  // Add the validator plugin
  new ValidatorPlugin({
    language: 'en',
    languageFallback: ['en', 'zh-CN'],
    enableMutationValidation: true
  })
]);

await kernel.start();
```

### Defining Validation Rules

In your validation metadata file (e.g., `*.validation.yml`):

```yaml
object: project
rules:
  # Field-level validation
  - name: name_required
    type: cross_field
    trigger: [create, update]
    fields: [name]
    rule:
      field: name
      operator: "!="
      value: null
    message: "Project name is required"
    severity: error

  # Date range validation
  - name: valid_date_range
    type: cross_field
    trigger: [create, update]
    fields: [start_date, end_date]
    rule:
      field: end_date
      operator: ">="
      compare_to: start_date
    message:
      en: "End date must be after start date"
      zh-CN: "结束日期必须晚于开始日期"
    severity: error

  # State machine
  - name: status_transition
    type: state_machine
    field: status
    trigger: [update]
    transitions:
      planning:
        allowed_next: [active, cancelled]
      active:
        allowed_next: [completed, on_hold]
      on_hold:
        allowed_next: [active, cancelled]
      completed:
        allowed_next: []  # Terminal state
      cancelled:
        allowed_next: []  # Terminal state
    message: "Invalid status transition from {{old_status}} to {{new_status}}"
    severity: error

  # Uniqueness
  - name: unique_project_code
    type: unique
    trigger: [create, update]
    fields: [project_code]
    scope:
      field: organization_id
      operator: "="
      compare_to: organization_id
    message: "Project code must be unique within organization"
    severity: error
```

### Configuration Options

```typescript
interface ValidatorPluginConfig {
  // Preferred language for messages
  language?: string;
  
  // Fallback languages
  languageFallback?: string[];
  
  // Enable validation on queries
  enableQueryValidation?: boolean;
  
  // Enable validation on mutations (create/update)
  enableMutationValidation?: boolean;
}
```

## Validation Rule Types

### 1. Cross-Field Validation

Compare values across multiple fields:

```yaml
- name: budget_check
  type: cross_field
  rule:
    field: actual_cost
    operator: "<="
    compare_to: budget_limit
  message: "Actual cost cannot exceed budget"
```

### 2. State Machine Validation

Control state transitions:

```yaml
- name: workflow_state
  type: state_machine
  field: status
  transitions:
    draft: [submitted]
    submitted: [approved, rejected]
    approved: [archived]
    rejected: [draft]
```

### 3. Uniqueness Validation

Ensure field uniqueness:

```yaml
- name: unique_email
  type: unique
  field: email
  case_sensitive: false
  message: "Email address already in use"
```

### 4. Business Rule Validation

Complex conditional logic:

```yaml
- name: approval_required
  type: business_rule
  constraint:
    all_of:
      - field: amount
        operator: ">"
        value: 10000
      - field: status
        operator: "="
        value: pending
    then_require:
      - field: approver_id
        operator: "!="
        value: null
  message: "Approval required for amounts over $10,000"
```

## Operators

Supported comparison operators:

- `=`, `!=` - Equality/inequality
- `>`, `>=`, `<`, `<=` - Numeric comparison
- `in`, `not_in` - Array membership
- `contains`, `not_contains` - String containment
- `starts_with`, `ends_with` - String prefix/suffix

## Triggers

Control when rules are applied:

- `create` - On record creation
- `update` - On record update
- `delete` - On record deletion

## Examples

### Email Format Validation

```yaml
email:
  type: email
  required: true
  validation:
    format: email
    message: "Please enter a valid email address"
```

### Conditional Required Fields

```yaml
- name: shipping_address_required
  type: business_rule
  constraint:
    all_of:
      - field: order_type
        operator: "="
        value: physical
    then_require:
      - field: shipping_address
        operator: "!="
        value: null
  message: "Shipping address is required for physical orders"
```

## API Reference

See the [full API documentation](../../docs/api/plugin-validator.md) for detailed information about:

- `Validator` class
- `ValidatorPlugin` class
- Validation rule types
- Type definitions

## License

MIT © ObjectStack Inc.
