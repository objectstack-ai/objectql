# Formulas and Rules Syntax Guide

This guide covers the complete syntax for formulas and validation rules in ObjectQL. Understanding these patterns will help you create powerful calculated fields and enforce business rules.

## Table of Contents

1. [Formula Syntax](#formula-syntax)
2. [Validation Rule Syntax](#validation-rule-syntax)
3. [Permission Rule Syntax](#permission-rule-syntax)
4. [Expression Evaluation](#expression-evaluation)
5. [Common Operators](#common-operators)
6. [Best Practices](#best-practices)

## Formula Syntax

Formulas are used to create calculated fields that derive their values from other fields or expressions. They are read-only and automatically computed.

### Basic Formula Structure

```yaml
fields:
  field_name:
    type: formula
    expression: "field1 + field2"
    data_type: number  # Result type: number, text, date, boolean
```

### Expression Syntax

ObjectQL formulas use **JavaScript-style expressions** with field references:

#### Field References

```yaml
# Simple field reference - use field name directly
calc_total:
  type: formula
  expression: "price * quantity"
  data_type: number

# With curly braces (alternative syntax)
calc_total_alt:
  type: formula
  expression: "{price} * {quantity}"
  data_type: number
```

#### Arithmetic Operations

```yaml
# Addition
profit:
  type: formula
  expression: "revenue - cost"
  data_type: currency

# Multiplication
area:
  type: formula
  expression: "width * height"
  data_type: number

# Division
average_score:
  type: formula
  expression: "total_score / num_attempts"
  data_type: number

# Percentage
profit_margin:
  type: formula
  expression: "(revenue - cost) / revenue * 100"
  data_type: percent
```

#### String Operations

```yaml
# Concatenation
full_name:
  type: formula
  expression: "first_name + ' ' + last_name"
  data_type: text

# String methods
uppercase_name:
  type: formula
  expression: "name.toUpperCase()"
  data_type: text
```

#### Date Calculations

```yaml
# Date difference
days_open:
  type: formula
  expression: "$today - created_date"
  data_type: number

# Date comparison
is_overdue:
  type: formula
  expression: "due_date < $today && status != 'completed'"
  data_type: boolean
```

#### Conditional Formulas

```yaml
# Simple if/else
priority_label:
  type: formula
  expression: "score > 80 ? 'High' : 'Low'"
  data_type: text

# Multi-condition
status_category:
  type: formula
  expression: |
    if (amount > 10000) {
      return 'High Value';
    } else if (amount > 1000) {
      return 'Medium Value';
    } else {
      return 'Low Value';
    }
  data_type: text
```

#### Lookup Field References

```yaml
# Access related object fields using dot notation
account_owner_name:
  type: formula
  expression: "customer.account.owner.name"
  data_type: text

# Nested lookups
region_manager:
  type: formula
  expression: "account.region.manager.email"
  data_type: text
```

### Special Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `$today` | Current date (YYYY-MM-DD) | `$today - created_date` |
| `$now` | Current timestamp | `$now` |
| `$current_user.id` | Current user ID | `owner_id == $current_user.id` |
| `$current_user.name` | Current user name | `$current_user.name` |

### Formula Examples

#### Revenue Calculations

```yaml
# Simple profit
profit:
  type: formula
  expression: "revenue - cost"
  data_type: currency

# Profit margin percentage
profit_margin:
  type: formula
  expression: "(revenue - cost) / revenue * 100"
  data_type: percent

# Discounted price
final_price:
  type: formula
  expression: "list_price * (1 - discount_rate)"
  data_type: currency
```

#### Date & Time

```yaml
# Age calculation
days_since_created:
  type: formula
  expression: "$today - created_date"
  data_type: number

# Is expired
is_expired:
  type: formula
  expression: "expiration_date < $today"
  data_type: boolean

# Duration
project_duration_days:
  type: formula
  expression: "end_date - start_date"
  data_type: number
```

#### Status & Categorization

```yaml
# Risk level based on multiple factors
risk_level:
  type: formula
  expression: |
    if (amount > 100000 && customer.credit_score < 600) {
      return 'High Risk';
    } else if (amount > 50000 || customer.credit_score < 700) {
      return 'Medium Risk';
    } else {
      return 'Low Risk';
    }
  data_type: text

# Priority score
priority_score:
  type: formula
  expression: |
    (urgency_level * 0.4) + 
    (impact_level * 0.4) + 
    (customer_tier * 0.2)
  data_type: number
```

## Validation Rule Syntax

Validation rules enforce data quality and business logic. They can be simple field checks or complex cross-field validations.

### Rule Types

ObjectQL supports several types of validation rules:

1. **Field Validation** - Single field constraints
2. **Cross-Field Validation** - Compare multiple fields
3. **Conditional Validation** - Apply rules based on conditions
4. **State Machine** - Enforce state transitions
5. **Business Rule** - Complex business logic
6. **Custom Validation** - JavaScript functions

### Field Validation

Defined directly in field configuration:

```yaml
# In object.yml
fields:
  email:
    type: email
    required: true
    validation:
      format: email
      message: "Please enter a valid email address"
  
  age:
    type: number
    validation:
      min: 0
      max: 150
      message: "Age must be between 0 and 150"
  
  username:
    type: text
    required: true
    validation:
      min_length: 3
      max_length: 20
      pattern: "^[a-zA-Z0-9_]+$"
      message: "Username must be 3-20 alphanumeric characters"
```

### Cross-Field Validation

Compare values between multiple fields:

```yaml
# In project.validation.yml
rules:
  - name: valid_date_range
    type: cross_field
    rule:
      field: end_date
      operator: ">="
      compare_to: start_date
    message: "End date must be on or after start date"
    error_code: "INVALID_DATE_RANGE"
```

#### Supported Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `=` | Equals | `field: status, operator: "=", value: "active"` |
| `!=` | Not equals | `field: status, operator: "!=", value: null` |
| `>` | Greater than | `field: end_date, operator: ">", compare_to: start_date` |
| `>=` | Greater than or equal | `field: budget, operator: ">=", value: 0` |
| `<` | Less than | `field: age, operator: "<", value: 18` |
| `<=` | Less than or equal | `field: discount, operator: "<=", value: 1` |
| `in` | In array | `field: status, operator: "in", value: ["active", "pending"]` |
| `not_in` | Not in array | `field: status, operator: "not_in", value: ["deleted"]` |
| `contains` | String/array contains | `field: tags, operator: "contains", value: "urgent"` |
| `not_empty` | Field is not empty | `field: description, operator: "not_empty"` |

### Conditional Validation

Apply validation only when certain conditions are met:

```yaml
rules:
  - name: description_required_for_high_budget
    type: conditional
    description: "Description is required for high budget projects"
    condition:
      field: budget
      operator: ">"
      value: 10000
    rule:
      field: description
      operator: "not_empty"
    message: "Description is required for projects over $10,000"
```

### State Machine Validation

Enforce valid state transitions:

```yaml
rules:
  - name: status_transition
    type: state_machine
    field: status
    transitions:
      planning:
        allowed_next: [active, cancelled]
      active:
        allowed_next: [on_hold, completed, cancelled]
      on_hold:
        allowed_next: [active, cancelled]
      completed:
        allowed_next: []
        is_terminal: true
      cancelled:
        allowed_next: []
        is_terminal: true
    message: "Invalid status transition from {{old_status}} to {{new_status}}"
    error_code: "INVALID_STATE_TRANSITION"
```

### Business Rule Validation

Complex business logic with multiple conditions:

```yaml
rules:
  - name: budget_within_limits
    type: business_rule
    constraint:
      expression: "budget <= department.budget_limit OR executive_approval = true"
      relationships:
        department:
          via: department_id
          fields: [budget_limit]
    message: "Budget exceeds department limit. Executive approval required."
    error_code: "BUDGET_LIMIT_EXCEEDED"
    trigger: [create, update]
    fields: [budget, department_id, executive_approval]
```

### Custom Validation

JavaScript validation functions for complex logic:

```yaml
rules:
  - name: credit_check
    type: custom
    message: "Customer credit limit exceeded"
    error_code: "CREDIT_LIMIT_EXCEEDED"
    trigger: [create, update]
    fields: [amount, customer_id]
    validator: |
      async function validate(record, context) {
        const customer = await context.api.findOne('customers', record.customer_id);
        const totalOrders = await context.api.sum('orders', 'amount', [
          ['customer_id', '=', record.customer_id],
          ['status', 'in', ['pending', 'processing']]
        ]);
        
        return (totalOrders + record.amount) <= customer.credit_limit;
      }
```

## Permission Rule Syntax

Permission rules control data access based on user roles and record conditions.

### Basic Permission Rules

```yaml
# In project.permission.yml
rules:
  - name: owner_full_access
    description: "Record owner has full access"
    priority: 10
    condition:
      field: owner_id
      operator: "="
      value: $current_user.id
    permissions:
      read: true
      create: true
      update: true
      delete: true
```

### Complex Conditions

```yaml
rules:
  - name: public_approved_read_only
    description: "Public approved records are read-only"
    condition:
      all_of:
        - field: status
          operator: "="
          value: approved
        - field: is_public
          operator: "="
          value: true
    permissions:
      read: true
      update: false
      delete: false
```

### Conditional Operators

| Operator | Description |
|----------|-------------|
| `all_of` | All conditions must be true (AND) |
| `any_of` | Any condition must be true (OR) |
| `none_of` | No conditions can be true (NOT) |

## Expression Evaluation

### Expression Context

When expressions are evaluated, they have access to:

1. **Record Fields** - Current record data
2. **Related Records** - Via lookup/master-detail relationships
3. **System Variables** - `$today`, `$now`, `$current_user`
4. **Previous Values** - For update operations (in validation)

### Evaluation Order

1. Field-level validations (required, format, range)
2. Cross-field validations
3. Business rule validations
4. Custom validations
5. State machine validations

### Error Handling

```yaml
rules:
  - name: safe_division
    type: custom
    validator: |
      function validate(record) {
        if (record.denominator === 0) {
          return false;
        }
        return (record.numerator / record.denominator) < 100;
      }
    message: "Result must be less than 100 (division by zero not allowed)"
```

## Common Operators

### Comparison Operators

```javascript
// Equality
field = value
field != value

// Numerical comparison
field > value
field >= value
field < value
field <= value

// Set membership
field in [value1, value2, value3]
field not_in [value1, value2]

// String operations
field contains "substring"
field starts_with "prefix"
field ends_with "suffix"

// Existence
field is_null
field is_not_null
field not_empty
```

### Logical Operators

```yaml
# AND - All conditions must be true
condition:
  all_of:
    - field: status
      operator: "="
      value: active
    - field: budget
      operator: ">"
      value: 1000

# OR - At least one condition must be true
condition:
  any_of:
    - field: priority
      operator: "="
      value: high
    - field: amount
      operator: ">"
      value: 10000

# NOT - Condition must be false
condition:
  none_of:
    - field: status
      operator: "="
      value: deleted
```

### Array Filters

Used in query language for filtering records:

```javascript
// Basic filter - [field, operator, value]
["status", "=", "active"]

// Multiple filters with AND
[
  ["status", "=", "active"],
  "and",
  ["amount", ">", 1000]
]

// Multiple filters with OR
[
  ["priority", "=", "high"],
  "or",
  ["amount", ">", 50000]
]

// Complex nested conditions
[
  ["status", "=", "active"],
  "and",
  [
    ["priority", "=", "high"],
    "or",
    ["amount", ">", 10000]
  ]
]
```

## Best Practices

### Formula Best Practices

1. **Keep formulas simple** - Complex logic should be in hooks or actions
2. **Use appropriate data types** - Specify correct `data_type` for the result
3. **Handle null values** - Use conditional checks for optional fields
4. **Document complex formulas** - Add comments explaining business logic
5. **Test edge cases** - Verify division by zero, null values, etc.

```yaml
# Good - Simple and clear
discount_amount:
  type: formula
  expression: "list_price * discount_rate"
  data_type: currency

# Good - Handles null
full_name:
  type: formula
  expression: "(first_name || '') + ' ' + (last_name || '')"
  data_type: text

# Avoid - Too complex for a formula
complex_score:
  type: formula
  expression: |
    var base = weight * coefficient;
    for (var i = 0; i < iterations; i++) {
      base = base * (1 + rate);
    }
    return base;
  data_type: number
  # Better: Move to a hook or action
```

### Validation Rule Best Practices

1. **Use declarative rules when possible** - Prefer `cross_field` over `custom`
2. **Provide clear error messages** - Help users understand what's wrong
3. **Set appropriate severity** - Use `error`, `warning`, or `info`
4. **Order rules by likelihood of failure** - Fast-fail optimization
5. **Use AI context** - Help AI tools understand business intent

```yaml
# Good - Clear message and intent
rules:
  - name: valid_date_range
    type: cross_field
    ai_context:
      intent: "Ensure timeline is logical"
      business_rule: "Projects cannot end before they start"
    rule:
      field: end_date
      operator: ">="
      compare_to: start_date
    message: "End date must be on or after start date"
    severity: error

# Good - Conditional validation
  - name: approval_required_for_high_value
    type: conditional
    condition:
      field: amount
      operator: ">"
      value: 50000
    rule:
      field: approved_by
      operator: "not_empty"
    message: "Approval required for transactions over $50,000"
    severity: error
```

### Performance Optimization

1. **Minimize async validations** - They slow down operations
2. **Use indexes** - For fields used in validation lookups
3. **Cache validation results** - When appropriate
4. **Batch validation** - For bulk operations

```yaml
rules:
  - name: inventory_check
    type: custom
    batch_enabled: true
    batch_size: 100
    validator: |
      async function validateBatch(records, context) {
        const skus = records.map(r => r.sku);
        const inventory = await context.api.find('inventory', {
          filters: [['sku', 'in', skus]]
        });
        
        return records.map(record => {
          const inv = inventory.find(i => i.sku === record.sku);
          return inv && inv.available_quantity >= record.quantity;
        });
      }
```

## Related Documentation

- [Object Definition](../spec/object.md) - Complete object metadata reference
- [Validation Rules](../spec/validation.md) - Detailed validation specification
- [Permission Rules](../spec/permission.md) - Access control documentation
- [Query Language](../spec/query-language.md) - Query syntax and filters
- [Hooks & Actions](./logic-hooks.md) - Custom business logic

## Examples

For working examples, see:

- `/packages/starters/basic/src/modules/projects/` - Project validation examples
- `/packages/starters/enterprise/src/modules/crm/` - CRM business rules
- `/examples/tutorials/` - Tutorial projects with formulas and rules
