# Validation Rule Metadata

Validation rules enforce data quality and business rules at the metadata level. They ensure data integrity before it reaches the database.

## 1. Overview

ObjectQL's validation system provides:

- **Field-level validation**: Built-in type validation (email, URL, range, etc.)
- **Cross-field validation**: Validate relationships between fields
- **Custom validation rules**: Complex business logic validation
- **Async validation**: External API validation (uniqueness, external system checks)
- **Conditional validation**: Rules that apply only in specific contexts

**File Naming Convention:** `[object_name].validation.yml`

## 2. Root Structure

```yaml
name: project_validation
object: projects
description: Validation rules for project object

# Validation Rules
rules:
  # Rule 1: Date Range Validation
  - name: valid_date_range
    type: cross_field
    message: End date must be after start date
    condition:
      field: end_date
      operator: ">"
      compare_to: start_date
  
  # Rule 2: Budget Validation
  - name: budget_limit
    type: custom
    message: Budget cannot exceed department limit
    trigger:
      - create
      - update
    fields:
      - budget
    validator: |
      async function validate(record, context) {
        const dept = await context.api.findOne('departments', record.department_id);
        return record.budget <= dept.budget_limit;
      }
  
  # Rule 3: Status Transition
  - name: status_transition
    type: state_machine
    field: status
    message: Invalid status transition
    transitions:
      draft:
        - planning
      planning:
        - in_progress
        - cancelled
      in_progress:
        - on_hold
        - completed
        - cancelled
      on_hold:
        - in_progress
        - cancelled
      completed: []
      cancelled: []
```

## 3. Validation Rule Types

### 3.1 Field Validation (Built-in)

Defined directly in field configuration:

```yaml
# In object.yml
fields:
  email:
    type: email
    required: true
    validation:
      format: email
      message: Please enter a valid email address
  
  age:
    type: number
    validation:
      min: 0
      max: 150
      message: Age must be between 0 and 150
  
  username:
    type: text
    required: true
    validation:
      min_length: 3
      max_length: 20
      regex: ^[a-zA-Z0-9_]+$
      message: Username must be 3-20 alphanumeric characters
  
  website:
    type: url
    validation:
      format: url
      protocols: [http, https]
      message: Please enter a valid URL
  
  password:
    type: password
    required: true
    validation:
      min_length: 8
      regex: ^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]
      message: Password must contain uppercase, lowercase, number and special character
```

### 3.2 Cross-Field Validation

Validate relationships between multiple fields:

```yaml
rules:
  # Date comparison
  - name: end_after_start
    type: cross_field
    message: End date must be after start date
    severity: error
    condition:
      field: end_date
      operator: ">="
      compare_to: start_date
  
  # Conditional requirement
  - name: reason_required_for_rejection
    type: cross_field
    message: Rejection reason is required
    condition:
      if:
        field: status
        operator: "="
        value: rejected
      then:
        field: rejection_reason
        operator: "!="
        value: null
  
  # Sum validation
  - name: total_percentage
    type: cross_field
    message: Total percentage must equal 100
    condition:
      expression: discount_percentage + tax_percentage + other_percentage
      operator: "="
      value: 100
```

### 3.3 Custom Validation

Complex business logic validation:

```yaml
rules:
  # JavaScript validation function
  - name: credit_check
    type: custom
    message: Customer credit limit exceeded
    severity: error
    trigger:
      - create
      - update
    fields:
      - amount
      - customer_id
    validator: |
      async function validate(record, context) {
        const customer = await context.api.findOne('customers', record.customer_id);
        const totalOrders = await context.api.sum('orders', 'amount', [
          ['customer_id', '=', record.customer_id],
          ['status', 'in', ['pending', 'processing']]
        ]);
        
        return (totalOrders + record.amount) <= customer.credit_limit;
      }
    error_message_template: "Order amount ${amount} exceeds customer credit limit ${customer.credit_limit}"
  
  # External API validation
  - name: tax_id_verification
    type: custom
    message: Invalid tax ID
    async: true
    validator: |
      async function validate(record, context) {
        const response = await context.http.post('https://api.tax.gov/verify', {
          tax_id: record.tax_id
        });
        return response.data.valid;
      }
```

### 3.4 Uniqueness Validation

Ensure field values are unique:

```yaml
rules:
  # Simple uniqueness
  - name: unique_email
    type: unique
    field: email
    message: Email address already exists
    case_sensitive: false
  
  # Composite uniqueness
  - name: unique_name_per_project
    type: unique
    fields:
      - project_id
      - name
    message: Task name must be unique within project
  
  # Conditional uniqueness
  - name: unique_active_subscription
    type: unique
    field: user_id
    message: User already has an active subscription
    scope:
      field: status
      operator: "="
      value: active
```

### 3.5 State Machine Validation

Control valid state transitions:

```yaml
rules:
  - name: order_status_flow
    type: state_machine
    field: status
    message: Invalid status transition
    initial_states:
      - draft
    
    transitions:
      draft:
        - submitted
        - cancelled
      
      submitted:
        - approved
        - rejected
        
      approved:
        - processing
        - cancelled
      
      processing:
        - shipped
        - on_hold
        - cancelled
      
      shipped:
        - delivered
        - returned
      
      delivered:
        - returned  # Within 30 days
      
      on_hold:
        - processing
        - cancelled
      
      # Terminal states
      returned: []
      cancelled: []
    
    # Additional conditions
    transition_conditions:
      shipped_to_delivered:
        from: shipped
        to: delivered
        condition:
          # Can only mark as delivered after 1 day
          field: shipped_date
          operator: "<"
          value: $current_date - 1 day
```

### 3.6 Dependency Validation

Validate related record constraints:

```yaml
rules:
  # Parent record validation
  - name: active_project_required
    type: dependency
    message: Cannot create task for inactive project
    condition:
      lookup:
        object: projects
        match_field: project_id
        validate:
          field: status
          operator: "="
          value: active
  
  # Child record validation
  - name: cannot_delete_with_tasks
    type: dependency
    message: Cannot delete project with active tasks
    trigger: [delete]
    condition:
      has_related:
        object: tasks
        relation_field: project_id
        filter:
          - field: status
            operator: "!="
            value: completed
```

## 4. Validation Severity Levels

```yaml
rules:
  # Error - Blocks save
  - name: required_field_check
    type: custom
    severity: error
    message: Critical field missing
    
  # Warning - Shows warning but allows save
  - name: recommended_field
    type: custom
    severity: warning
    message: It's recommended to fill this field
    
  # Info - Just informational
  - name: data_quality_suggestion
    type: custom
    severity: info
    message: Consider adding more details
```

## 5. Validation Triggers

Control when validation rules execute:

```yaml
rules:
  - name: budget_approval_check
    type: custom
    # Only run on specific operations
    trigger:
      - create
      - update
    
    # Only run when specific fields change
    fields:
      - budget
      - department_id
    
    # Only run in specific contexts
    context:
      - ui  # From UI forms
      - api # From API calls
    
    # Skip in bulk operations
    skip_bulk: true
    
    validator: |
      function validate(record) {
        return record.budget <= 100000 || record.approval_status === 'approved';
      }
```

## 6. Validation Groups

Organize related validation rules:

```yaml
validation_groups:
  # Basic data quality
  - name: data_quality
    description: Basic field validation
    rules:
      - required_fields
      - valid_formats
      - value_ranges
  
  # Business rules
  - name: business_logic
    description: Business rule validation
    rules:
      - credit_check
      - inventory_check
      - pricing_rules
  
  # Compliance
  - name: compliance
    description: Regulatory compliance
    rules:
      - gdpr_consent
      - data_retention
      - audit_trail
  
  # Advanced
  - name: advanced
    description: Complex validation (may be slow)
    rules:
      - external_api_checks
      - complex_calculations
    
    # Run asynchronously
    async: true
    
    # Can be skipped for performance
    required: false
```

## 7. Conditional Validation

Rules that only apply in certain contexts:

```yaml
rules:
  - name: international_shipping_validation
    type: custom
    message: International orders require customs declaration
    
    # Only apply when shipping internationally
    apply_when:
      field: shipping_country
      operator: "!="
      value: US
    
    validator: |
      function validate(record) {
        return record.customs_declaration !== null;
      }
  
  - name: high_value_approval
    type: custom
    message: Orders over $10,000 require manager approval
    
    # Only apply for high-value orders
    apply_when:
      field: total_amount
      operator: ">"
      value: 10000
    
    validator: |
      function validate(record) {
        return record.manager_approval_id !== null;
      }
```

## 8. Async Validation

For validation requiring external API calls or complex queries:

```yaml
rules:
  - name: email_deliverability
    type: async
    message: Email address is not deliverable
    async: true
    timeout: 5000  # 5 second timeout
    
    validator: |
      async function validate(record, context) {
        try {
          const result = await context.http.post('https://api.emailvalidation.com/check', {
            email: record.email
          });
          return result.data.deliverable;
        } catch (error) {
          // On timeout or error, allow (fail open)
          return true;
        }
      }
  
  - name: inventory_available
    type: async
    message: Insufficient inventory
    
    validator: |
      async function validate(record, context) {
        const inventory = await context.api.findOne('inventory', {
          filters: [['sku', '=', record.sku]]
        });
        
        return inventory.available_quantity >= record.quantity;
      }
```

## 9. Validation Messages

### 9.1 Static Messages

```yaml
rules:
  - name: simple_rule
    type: custom
    message: This is a simple error message
```

### 9.2 Template Messages

Use placeholders for dynamic messages:

```yaml
rules:
  - name: template_message
    type: custom
    message: "Field ${field_name} must be between ${min} and ${max}"
    message_params:
      field_name: amount
      min: 0
      max: 1000
```

### 9.3 Function Messages

Generate messages dynamically:

```yaml
rules:
  - name: dynamic_message
    type: custom
    message: |
      function getMessage(record, context) {
        return `Budget $${record.budget} exceeds department limit $${context.department.limit}`;
      }
```

### 9.4 Internationalized Messages

```yaml
rules:
  - name: i18n_message
    type: custom
    message:
      en: Please enter a valid email address
      zh-CN: 请输入有效的电子邮件地址
      es: Por favor, introduce una dirección de correo electrónico válida
```

## 10. Validation Context

Validators receive a rich context object:

```typescript
interface ValidationContext {
  // Current record data
  record: any;
  
  // Previous data (for updates)
  previousRecord?: any;
  
  // Current user
  user: User;
  
  // API access
  api: ObjectQLAPI;
  
  // HTTP client for external calls
  http: HttpClient;
  
  // Operation type
  operation: 'create' | 'update' | 'delete';
  
  // Additional metadata
  metadata: {
    objectName: string;
    ruleName: string;
  };
}
```

## 11. Performance Optimization

### 11.1 Rule Caching

```yaml
validation:
  # Cache validation results
  cache:
    enabled: true
    ttl: 300  # 5 minutes
    
    # Cache key includes these fields
    cache_key_fields:
      - id
      - updated_at
```

### 11.2 Batch Validation

```yaml
rules:
  - name: batch_inventory_check
    type: custom
    
    # Support batch validation
    batch_enabled: true
    batch_size: 100
    
    validator: |
      async function validateBatch(records, context) {
        // Validate multiple records in one query
        const skus = records.map(r => r.sku);
        const inventory = await context.api.find('inventory', {
          filters: [['sku', 'in', skus]]
        });
        
        // Return validation result for each record
        return records.map(record => {
          const inv = inventory.find(i => i.sku === record.sku);
          return inv && inv.available_quantity >= record.quantity;
        });
      }
```

## 12. Implementation Example

```typescript
// src/objects/order.validation.yml
import { ValidationRuleDefinition } from '@objectql/types';

export const order_validation: ValidationRuleDefinition = {
  name: 'order_validation',
  object: 'orders',
  rules: [
    {
      name: 'valid_total',
      type: 'cross_field',
      message: 'Total must equal subtotal + tax',
      condition: {
        expression: 'total === subtotal + tax'
      }
    },
    {
      name: 'customer_credit_check',
      type: 'custom',
      async: true,
      validator: async (record, context) => {
        const customer = await context.api.findOne('customers', record.customer_id);
        return record.amount <= customer.available_credit;
      }
    }
  ]
};
```

## 13. Best Practices

1. **Validate Early**: Catch errors before database operations
2. **Clear Messages**: Provide actionable error messages
3. **Performance**: Minimize async validations, use caching
4. **User Experience**: Use severity levels appropriately (error vs warning)
5. **Testing**: Test validation rules with edge cases
6. **Documentation**: Document complex validation logic
7. **Reusability**: Create reusable validation functions
8. **Fail Fast**: Order rules by likelihood of failure

## 14. Error Handling

```yaml
validation:
  # Error handling strategy
  on_error:
    # Collect all errors vs fail on first
    mode: collect_all  # or 'fail_fast'
    
    # Maximum errors to collect
    max_errors: 10
    
    # Include field path in errors
    include_field_path: true
    
    # Format
    error_format:
      type: structured
      include_rule_name: true
      include_severity: true
```

## 15. Related Specifications

- [Objects & Fields](./object.md) - Data model definition
- [Hooks](./hook.md) - Pre/post operation logic
- [Permissions](./permission.md) - Access control
- [Forms](./form.md) - UI form validation
