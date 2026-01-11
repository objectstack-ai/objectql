# Validation Rule Metadata

Validation rules enforce data quality and business rules at the metadata level. They ensure data integrity before it reaches the database. Rules are designed to be both machine-executable and AI-understandable, with clear business intent.

## 1. Overview

ObjectQL's validation system provides:

- **Field-level validation**: Built-in type validation (email, URL, range, etc.)
- **Cross-field validation**: Validate relationships between fields
- **Business rule validation**: Declarative rules with clear intent
- **Async validation**: External API validation (uniqueness, external system checks)
- **Conditional validation**: Rules that apply only in specific contexts
- **State machine validation**: Enforce valid state transitions

**File Naming Convention:** `[object_name].validation.yml`

## 2. Root Structure

```yaml
name: project_validation
object: projects
description: Validation rules for project object

# AI-friendly context (optional)
ai_context:
  intent: "Ensure project data integrity and enforce business rules"
  validation_strategy: "Fail fast with clear error messages"

# Validation Rules
rules:
  # Rule 1: Cross-Field Validation with AI Context
  - name: valid_date_range
    type: cross_field
    
    # AI context explains the business rule
    ai_context:
      intent: "Ensure timeline makes logical sense"
      business_rule: "Projects cannot end before they start"
      error_impact: high  # high, medium, low
    
    # Declarative rule (AI can generate implementations)
    rule:
      field: end_date
      operator: ">="
      compare_to: start_date
    
    message: "End date must be on or after start date"
    error_code: "INVALID_DATE_RANGE"
  
  # Rule 2: Business Rule with Intent
  - name: budget_limit
    type: business_rule
    
    ai_context:
      intent: "Prevent projects from exceeding department budget allocation"
      business_rule: "Each department has a budget limit. Individual projects cannot exceed it."
      data_dependency: "Requires department.budget_limit field"
      examples:
        valid:
          - project_budget: 50000
            department_budget_limit: 100000
        invalid:
          - project_budget: 150000
            department_budget_limit: 100000
    
    # Declarative constraint (AI can optimize implementation)
    constraint:
      expression: "budget <= department.budget_limit"
      relationships:
        department:
          via: department_id
          field: budget_limit
    
    message: "Project budget (${{budget}}) exceeds department limit (${{department.budget_limit}})"
    error_code: "BUDGET_EXCEEDS_LIMIT"
    
    trigger:
      - create
      - update
    
    fields:
      - budget
      - department_id
  
  # Rule 3: State Machine with Transitions
  - name: status_transition
    type: state_machine
    field: status
    
    ai_context:
      intent: "Control valid status transitions throughout project lifecycle"
      business_rule: "Projects follow a controlled workflow"
      visualization: |
        planning → active → completed
                ↓           ↓
             cancelled ← on_hold
    
    transitions:
      planning:
        allowed_next: [active, cancelled]
        ai_context:
          rationale: "Can start work or cancel before beginning"
      
      active:
        allowed_next: [on_hold, completed, cancelled]
        ai_context:
          rationale: "Can pause, finish, or cancel ongoing work"
      
      on_hold:
        allowed_next: [active, cancelled]
        ai_context:
          rationale: "Can resume or cancel paused projects"
      
      completed:
        allowed_next: []
        is_terminal: true
        ai_context:
          rationale: "Finished projects cannot change state"
      
      cancelled:
        allowed_next: []
        is_terminal: true
        ai_context:
          rationale: "Cancelled projects are final"
    
    message: "Invalid status transition from {{old_status}} to {{new_status}}"
    error_code: "INVALID_STATE_TRANSITION"
```

## 3. Validation Rule Types

### 3.1 Field Validation (Built-in)

Field validations are defined directly in the object definition with AI context:

```yaml
# In object.yml
fields:
  email:
    type: email
    required: true
    validation:
      format: email
      message: Please enter a valid email address
    
    ai_context:
      intent: "User's primary contact email"
      validation_rationale: "Email format required for notifications"
  
  age:
    type: number
    validation:
      min: 0
      max: 150
      message: Age must be between 0 and 150
    
    ai_context:
      intent: "Person's age in years"
      validation_rationale: "Realistic human age range"
      examples: [25, 42, 67]
  
  username:
    type: text
    required: true
    validation:
      min_length: 3
      max_length: 20
      pattern: "^[a-zA-Z0-9_]+$"
      message: "Username must be 3-20 alphanumeric characters or underscores"
    
    ai_context:
      intent: "Unique user identifier for login"
      validation_rationale: "Prevent special characters that cause URL issues"
      examples: ["john_doe", "alice123", "bob_smith"]
      avoid: ["user@123", "test!", "a"]  # Too short or invalid chars
```
      regex: ^[a-zA-Z0-9_]+$
      message: Username must be 3-20 alphanumeric characters or underscores
  
  website:
    type: url
    validation:
      format: url
      protocols: [http, https]
      message: Please enter a valid URL
    
    ai_context:
      intent: "Company or personal website"
      examples: ["https://example.com", "https://www.company.com"]
  
  password:
    type: password
    required: true
    validation:
      min_length: 8
      regex: ^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]
      message: Password must contain uppercase, lowercase, number and special character
    
    ai_context:
      intent: "Secure user password"
      validation_rationale: "Strong password policy for security compliance"
```

### 3.2 Cross-Field Validation

Validate relationships between multiple fields with clear business intent:

```yaml
rules:
  # Date comparison with AI context
  - name: end_after_start
    type: cross_field
    
    ai_context:
      intent: "Ensure logical timeline"
      business_rule: "Events/projects cannot end before they start"
      error_impact: high
    
    rule:
      field: end_date
      operator: ">="
      compare_to: start_date
    
    message: "End date must be on or after start date"
    error_code: "INVALID_DATE_RANGE"
    severity: error
  
  # Conditional requirement with reasoning
  - name: reason_required_for_rejection
    type: cross_field
    
    ai_context:
      intent: "Require explanation for rejections"
      business_rule: "Users must document why something was rejected"
      compliance: "Audit trail requirement"
    
    rule:
      if:
        field: status
        operator: "="
        value: rejected
      then:
        field: rejection_reason
        operator: "!="
        value: null
    
    message: "Rejection reason is required when status is 'rejected'"
    error_code: "REJECTION_REASON_REQUIRED"
  
  # Sum validation with business context
  - name: total_percentage
    type: cross_field
    
    ai_context:
      intent: "Ensure percentages add up correctly"
      business_rule: "Distribution must total 100%"
      examples:
        valid:
          - discount: 20, tax: 10, other: 70  # = 100
        invalid:
          - discount: 20, tax: 10, other: 60  # = 90
    
    rule:
      expression: "discount_percentage + tax_percentage + other_percentage"
      operator: "="
      value: 100
    
    message: "Total percentage must equal 100% (currently: {{sum}}%)"
    error_code: "INVALID_PERCENTAGE_SUM"
```

### 3.3 Business Rule Validation

Declarative business rules that AI can understand and optimize:

```yaml
rules:
  # Declarative business rule
  - name: budget_within_limits
    type: business_rule
    
    ai_context:
      intent: "Prevent budget overruns"
      business_rule: "Project budgets must be within approved department limits"
      data_source: "department.annual_budget_limit"
      
      decision_logic: |
        If project.budget > department.budget_limit:
          - Require executive_approval = true
          - Or reject with error
    
    # AI can generate optimal implementation
    constraint:
      expression: "budget <= department.budget_limit OR executive_approval = true"
      relationships:
        department:
          via: department_id
          fields: [budget_limit]
    
    message: "Budget exceeds department limit (${{department.budget_limit}}). Executive approval required - please add executive_approval_id field and route to executive for review."
    error_code: "BUDGET_LIMIT_EXCEEDED"
    
    trigger: [create, update]
    fields: [budget, department_id, executive_approval]
  
  # Multi-condition business rule
  - name: manager_approval_required
    type: business_rule
    
    ai_context:
      intent: "Enforce approval policy for high-value transactions"
      business_rule: |
        Transactions require manager approval if:
        - Amount > $10,000 OR
        - Customer is flagged as high-risk OR
        - Payment terms exceed 60 days
      
      approval_matrix:
        - amount > 10000: requires manager
        - amount > 50000: requires director
        - amount > 200000: requires executive
    
    constraint:
      any_of:
        - field: amount
          operator: ">"
          value: 10000
        - field: customer.risk_level
          operator: "="
          value: high
        - field: payment_terms_days
          operator: ">"
          value: 60
      
      then_require:
        - field: manager_approved_by
          operator: "!="
          value: null
    
    message: "Manager approval required for this transaction"
    error_code: "APPROVAL_REQUIRED"
```

### 3.4 Custom Validation (When Needed)

For complex logic that can't be expressed declaratively, provide implementation with clear intent:

```yaml
rules:
  # Custom validation with AI-understandable intent
  - name: credit_check
    type: custom
    
    ai_context:
      intent: "Verify customer has sufficient credit"
      business_rule: "Total outstanding + new order cannot exceed credit limit"
      external_dependency: "Customer credit system"
      
      algorithm: |
        1. Fetch customer's current outstanding balance
        2. Add proposed order amount
        3. Compare to customer credit limit
        4. Reject if would exceed limit
    
    message: "Customer credit limit exceeded"
    error_code: "CREDIT_LIMIT_EXCEEDED"
    severity: error
    
    trigger: [create, update]
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
