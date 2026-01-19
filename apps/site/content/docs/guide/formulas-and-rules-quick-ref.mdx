# Formulas & Rules Quick Reference

**Quick syntax reference for ObjectQL formulas and validation rules.**

For complete documentation, see:
- 📖 [English Guide](./formulas-and-rules.md)

## Formula Syntax Quick Reference

### Basic Formula

```yaml
calculated_field:
  type: formula
  expression: "field1 + field2"
  data_type: number
```

### Common Patterns

```yaml
# Arithmetic
profit:
  type: formula
  expression: "revenue - cost"
  data_type: currency

# String concatenation
full_name:
  type: formula
  expression: "first_name + ' ' + last_name"
  data_type: text

# Conditional
status_label:
  type: formula
  expression: "score > 80 ? 'High' : 'Low'"
  data_type: text

# Date math
days_old:
  type: formula
  expression: "$today - created_date"
  data_type: number

# Lookup reference
owner_email:
  type: formula
  expression: "project.owner.email"
  data_type: text
```

### Special Variables

| Variable | Example |
|----------|---------|
| `$today` | Current date |
| `$now` | Current timestamp |
| `$current_user.id` | Current user ID |
| `$current_user.name` | Current user name |

## Validation Rules Quick Reference

### Field Validation

```yaml
# In object.yml
fields:
  email:
    type: email
    required: true
    validation:
      format: email
      message: "Please enter a valid email"
  
  age:
    type: number
    validation:
      min: 0
      max: 150
```

### Cross-Field Validation

```yaml
# In project.validation.yml
rules:
  - name: valid_date_range
    type: cross_field
    rule:
      field: end_date
      operator: ">="
      compare_to: start_date
    message: "End date must be after start date"
```

### Conditional Validation

```yaml
rules:
  - name: description_required_for_high_budget
    type: conditional
    condition:
      field: budget
      operator: ">"
      value: 10000
    rule:
      field: description
      operator: "not_empty"
    message: "Description required for budgets over $10,000"
```

### State Machine

```yaml
rules:
  - name: status_transition
    type: state_machine
    field: status
    transitions:
      draft:
        allowed_next: [submitted, cancelled]
      submitted:
        allowed_next: [approved, rejected]
      approved:
        allowed_next: []
        is_terminal: true
```

## Operators Quick Reference

### Comparison

| Operator | Example |
|----------|---------|
| `=` | `field: status, operator: "=", value: "active"` |
| `!=` | `field: status, operator: "!=", value: null` |
| `>` | `field: amount, operator: ">", value: 1000` |
| `>=` | `field: end_date, operator: ">=", compare_to: start_date` |
| `<` | `field: age, operator: "<", value: 18` |
| `<=` | `field: discount, operator: "<=", value: 1` |
| `in` | `field: status, operator: "in", value: ["active", "pending"]` |
| `not_in` | `field: status, operator: "not_in", value: ["deleted"]` |
| `contains` | `field: tags, operator: "contains", value: "urgent"` |
| `not_empty` | `field: description, operator: "not_empty"` |

### Logical

```yaml
# AND - all must be true
condition:
  all_of:
    - field: status
      operator: "="
      value: active
    - field: amount
      operator: ">"
      value: 1000

# OR - any must be true
condition:
  any_of:
    - field: priority
      operator: "="
      value: high
    - field: amount
      operator: ">"
      value: 10000

# NOT - must be false
condition:
  none_of:
    - field: status
      operator: "="
      value: deleted
```

## Permission Rules Quick Reference

```yaml
# In project.permission.yml
rules:
  - name: owner_full_access
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

## Common Use Cases

### Budget Validation

```yaml
rules:
  - name: budget_approval_required
    type: conditional
    condition:
      field: budget
      operator: ">"
      value: 50000
    rule:
      field: approved_by
      operator: "not_empty"
    message: "Budget over $50K requires approval"
```

### Date Range Validation

```yaml
rules:
  - name: valid_date_range
    type: cross_field
    rule:
      field: end_date
      operator: ">="
      compare_to: start_date
    message: "End date must be after start date"
```

### Status Workflow

```yaml
rules:
  - name: order_workflow
    type: state_machine
    field: status
    transitions:
      draft:
        allowed_next: [submitted, cancelled]
      submitted:
        allowed_next: [approved, rejected]
      approved:
        allowed_next: [processing, cancelled]
      processing:
        allowed_next: [shipped, cancelled]
      shipped:
        allowed_next: [delivered]
      delivered:
        allowed_next: []  # terminal
```

### Calculated Metrics

```yaml
# Profit margin
profit_margin:
  type: formula
  expression: "(revenue - cost) / revenue * 100"
  data_type: percent

# Days since creation
age_days:
  type: formula
  expression: "$today - created_date"
  data_type: number

# Full address
full_address:
  type: formula
  expression: "street + ', ' + city + ', ' + state + ' ' + zip"
  data_type: text
```

## Related Docs

- 📖 [Complete Formulas & Rules Guide](./formulas-and-rules.md)
- 📖 [Object Definitions](../spec/object.md)
- 📖 [Validation Spec](../spec/validation.md)
- 📖 [Permission Spec](../spec/permission.md)
