# Form Definition

Forms define data entry layouts and configurations for creating and editing records. They control which fields are visible, their validation rules, and the user experience for data input.

**File Naming Convention:** `<form_name>.form.yml`

The filename (without the `.form.yml` extension) automatically becomes the form's identifier. This eliminates the need for a redundant `name` property inside the file.

**Examples:**
- `project_create.form.yml` → Form identifier: `project_create`
- `customer_edit.form.yml` → Form identifier: `customer_edit`
- `quick_task.form.yml` → Form identifier: `quick_task`

Files should use **snake_case** for multi-word names.

## 1. Root Properties

| Property | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `label` | `string` | **Required** | Human-readable form title (e.g., "Create Project"). |
| `object` | `string` | **Required** | Object this form creates/edits. |
| `type` | `string` | Optional | Form type: `create`, `edit`, `clone`, `wizard`. Default: `create`. |
| `description` | `string` | Optional | Internal description of the form purpose. |
| `sections` | `array` | **Required** | Form sections containing fields. |
| `layout` | `object` | Optional | Layout configuration (columns, spacing, etc.). |
| `validation` | `object` | Optional | Additional validation rules. |
| `actions` | `object` | Optional | Form action buttons configuration. |
| `defaults` | `object` | Optional | Default field values. |
| `read_only_fields` | `array` | Optional | Fields that cannot be edited. |
| `hidden_fields` | `array` | Optional | Fields hidden from user but included in submission. |
| `permissions` | `object` | Optional | Access control for the form. |
| `ai_context` | `object` | Optional | AI-friendly context for understanding form purpose. |

## 2. Form Types

### 2.1 Create Form

Form for creating new records.

```yaml
# File: project_create.form.yml

label: Create Project
object: project
type: create

sections:
  # Basic Information
  - label: Project Information
    fields:
      - name:
          required: true
          placeholder: Enter project name
      
      - description:
          type: textarea
          rows: 4
      
      - status:
          default: planning
      
      - owner:
          default: $current_user.id

  # Timeline
  - label: Timeline
    fields:
      - start_date:
          default: $today
      
      - end_date:
          required: true
          validation:
            min: $field.start_date

  # Budget
  - label: Budget
    fields:
      - budget_amount:
          format: currency
          required: true
      
      - budget_category:
          type: select
          options:
            - capital
            - operational
            - research

# Default values
defaults:
  status: planning
  priority: medium
  owner_id: $current_user.id

# Form actions
actions:
  submit:
    label: Create Project
    on_success:
      redirect: /projects/:id
      message: Project created successfully
  
  cancel:
    label: Cancel
    redirect: /projects

ai_context:
  intent: "Form for creating new projects with timeline and budget"
  domain: project_management
```

### 2.2 Edit Form

Form for modifying existing records.

```yaml
# File: customer_edit.form.yml

label: Edit Customer
object: customer
type: edit

sections:
  - label: Basic Information
    fields:
      - name
      - email
      - phone
      - company
  
  - label: Address
    columns: 2
    fields:
      - street
      - city
      - state
      - zip_code
  
  - label: Classification
    fields:
      - industry
      - tier
      - account_manager

# Read-only fields
read_only_fields:
  - created_at
  - created_by
  - id

# Actions
actions:
  submit:
    label: Save Changes
    on_success:
      message: Customer updated successfully
      stay_on_page: true
  
  delete:
    label: Delete Customer
    confirm: Are you sure you want to delete this customer?
    permission: delete_customer

ai_context:
  intent: "Edit existing customer information"
  domain: crm
```

### 2.3 Clone Form

Form for duplicating records with modifications.

```yaml
# File: project_clone.form.yml

label: Clone Project
object: project
type: clone

# Fields to clone (others excluded)
clone_fields:
  - name
  - description
  - status
  - budget_amount
  - owner

sections:
  - label: New Project Details
    fields:
      - name:
          label: New Project Name
          required: true
          default: $source.name + " (Copy)"
      
      - description:
          default: $source.description
      
      - start_date:
          required: true
          default: $today
      
      - end_date:
          required: true

# Exclude from clone
exclude_fields:
  - id
  - created_at
  - created_by
  - tasks # Don't clone related tasks

ai_context:
  intent: "Clone project with modified timeline and name"
  domain: project_management
```

### 2.4 Wizard Form

Multi-step form for complex data entry.

```yaml
# File: employee_onboarding.form.yml

label: Employee Onboarding
object: employee
type: wizard

steps:
  # Step 1: Personal Information
  - label: Personal Information
    description: Basic employee details
    sections:
      - fields:
          - first_name
          - last_name
          - email
          - phone
          - date_of_birth
  
  # Step 2: Employment Details
  - label: Employment Details
    description: Job and compensation information
    sections:
      - label: Position
        fields:
          - job_title
          - department
          - manager
          - start_date
      
      - label: Compensation
        fields:
          - salary
          - employment_type
          - pay_frequency
  
  # Step 3: Benefits
  - label: Benefits Selection
    description: Choose benefit options
    sections:
      - fields:
          - health_insurance
          - dental_insurance
          - retirement_plan
          - pto_days
  
  # Step 4: Documents
  - label: Documents
    description: Upload required documents
    sections:
      - fields:
          - resume:
              type: file
              accept: .pdf,.doc,.docx
          - id_document:
              type: file
              required: true

# Wizard navigation
navigation:
  show_progress: true
  allow_back: true
  validate_step: true # Validate before proceeding

actions:
  submit:
    label: Complete Onboarding
    on_success:
      redirect: /employees/:id
      message: Employee onboarding completed

ai_context:
  intent: "Multi-step wizard for comprehensive employee onboarding"
  domain: hr
```

## 3. Form Sections

Sections organize fields into logical groups.

```yaml
sections:
  # Basic section
  - label: Contact Information
    fields:
      - name
      - email
      - phone
  
  # Section with columns
  - label: Address
    columns: 2
    fields:
      - street
      - city
      - state
      - zip_code
  
  # Collapsible section
  - label: Additional Details
    collapsible: true
    collapsed: true
    fields:
      - notes
      - tags
  
  # Conditional section
  - label: Shipping Details
    visible_when:
      field: needs_shipping
      operator: "="
      value: true
    fields:
      - shipping_address
      - shipping_method
```

## 4. Field Configuration

### 4.1 Field Properties

```yaml
fields:
  - name:
      label: Project Name
      required: true
      placeholder: Enter project name
      help_text: Choose a descriptive name
      max_length: 100
  
  - description:
      type: textarea
      rows: 4
      max_length: 1000
  
  - status:
      type: select
      options:
        - value: planning
          label: Planning
        - value: active
          label: Active
        - value: completed
          label: Completed
      default: planning
  
  - start_date:
      type: date
      required: true
      min: $today
      default: $today
  
  - budget:
      type: number
      format: currency
      min: 0
      step: 100
```

### 4.2 Field Types

```yaml
fields:
  # Text inputs
  - name:
      type: text
  
  - email:
      type: email
  
  - phone:
      type: phone
  
  - url:
      type: url
  
  # Numeric inputs
  - quantity:
      type: number
      min: 0
      max: 1000
  
  - price:
      type: currency
  
  - percentage:
      type: percent
  
  # Date/Time
  - due_date:
      type: date
  
  - meeting_time:
      type: datetime
  
  - duration:
      type: time
  
  # Selection
  - category:
      type: select
      options: [option1, option2]
  
  - tags:
      type: multiselect
      options: [tag1, tag2, tag3]
  
  - priority:
      type: radio
      options: [low, medium, high]
  
  - features:
      type: checkbox_group
      options: [feature1, feature2]
  
  # Boolean
  - is_active:
      type: checkbox
      default: true
  
  - accept_terms:
      type: toggle
  
  # Text areas
  - description:
      type: textarea
      rows: 5
  
  - notes:
      type: richtext
  
  # Relationships
  - owner:
      type: lookup
      reference_to: users
      searchable: true
  
  - related_projects:
      type: master_detail
      reference_to: projects
  
  # Files
  - attachment:
      type: file
      accept: .pdf,.doc
      max_size: 5242880 # 5MB
  
  - photos:
      type: file
      multiple: true
      accept: image/*
```

### 4.3 Conditional Fields

Show/hide fields based on other field values.

```yaml
fields:
  - event_type:
      type: select
      options:
        - in_person
        - virtual
        - hybrid
  
  - venue_address:
      visible_when:
        field: event_type
        operator: in
        value: [in_person, hybrid]
  
  - video_link:
      visible_when:
        field: event_type
        operator: in
        value: [virtual, hybrid]
      required_when:
        field: event_type
        operator: "="
        value: virtual
```

## 5. Validation

### 5.1 Field-Level Validation

```yaml
fields:
  - email:
      type: email
      required: true
      validation:
        format: email
        message: Please enter a valid email address
  
  - age:
      type: number
      validation:
        min: 18
        max: 120
        message: Age must be between 18 and 120
  
  - username:
      type: text
      validation:
        pattern: ^[a-z0-9_]{3,20}$
        message: Username must be 3-20 characters, lowercase letters, numbers, and underscores only
```

### 5.2 Cross-Field Validation

```yaml
validation:
  # End date must be after start date
  - rule: date_range
    fields: [start_date, end_date]
    condition:
      field: end_date
      operator: ">"
      compare_to: start_date
    message: End date must be after start date
  
  # Conditional requirement
  - rule: conditional_required
    when:
      field: needs_approval
      operator: "="
      value: true
    then:
      required: [approver, approval_reason]
```

### 5.3 Custom Validation

```yaml
validation:
  # Custom validation function
  - rule: custom
    name: check_budget_limit
    message: Budget exceeds department limit
    function: |
      async function validate(data, context) {
        const dept = await context.repo.findOne('department', data.department_id);
        return data.budget <= dept.budget_limit;
      }
```

## 6. Layout Options

### 6.1 Column Layout

```yaml
layout:
  columns: 2
  gap: 16

sections:
  - label: Contact Details
    fields:
      - name          # Spans 2 columns by default
      - email:
          columns: 1  # Takes 1 column
      - phone:
          columns: 1  # Takes 1 column
```

### 6.2 Responsive Layout

```yaml
layout:
  desktop:
    columns: 2
  tablet:
    columns: 1
  mobile:
    columns: 1
```

### 6.3 Custom Styling

```yaml
sections:
  - label: Important Notice
    style:
      background: warning
      padding: 16
      border: true
    fields:
      - important_note
```

## 7. Form Actions

### 7.1 Standard Actions

```yaml
actions:
  # Primary submit button
  submit:
    label: Save
    icon: standard:save
    variant: primary
    on_success:
      message: Record saved successfully
      redirect: /objects/:object/:id
  
  # Secondary cancel button
  cancel:
    label: Cancel
    variant: secondary
    redirect: /objects/:object
  
  # Additional action
  save_and_new:
    label: Save & New
    on_success:
      message: Record saved
      redirect: /objects/:object/create
```

### 7.2 Custom Actions

```yaml
actions:
  # Custom save with approval
  submit_for_approval:
    label: Submit for Approval
    variant: primary
    before_save:
      - set_field:
          status: pending_approval
      - call_action:
          action: send_approval_notification
    on_success:
      message: Submitted for approval
      redirect: /objects/:object/:id
```

## 8. Complete Examples

### Example 1: Contact Form

```yaml
# File: contact_create.form.yml

label: Create Contact
object: contact
type: create

sections:
  # Basic Information
  - label: Basic Information
    fields:
      - first_name:
          required: true
          placeholder: First Name
      
      - last_name:
          required: true
          placeholder: Last Name
      
      - email:
          type: email
          required: true
          validation:
            format: email
      
      - phone:
          type: phone
          format: (###) ###-####
  
  # Company Details
  - label: Company
    fields:
      - account:
          type: lookup
          reference_to: accounts
          required: true
          searchable: true
      
      - title:
          placeholder: Job Title
      
      - department:
          type: select
          options:
            - Sales
            - Marketing
            - Engineering
            - Support
  
  # Address
  - label: Address
    columns: 2
    collapsible: true
    fields:
      - street
      - city
      - state
      - zip_code

defaults:
  status: active
  owner_id: $current_user.id

actions:
  submit:
    label: Create Contact
    on_success:
      message: Contact created successfully
      redirect: /contacts/:id
  
  cancel:
    label: Cancel
    redirect: /contacts

ai_context:
  intent: "Create new business contact with company association"
  domain: crm
```

### Example 2: Order Entry Form

```yaml
# File: order_entry.form.yml

label: New Order
object: order
type: create

sections:
  # Customer Selection
  - label: Customer
    fields:
      - customer:
          type: lookup
          reference_to: customers
          required: true
          searchable: true
          on_change:
            - populate_field:
                shipping_address: $selected.default_address
  
  # Order Items
  - label: Order Items
    type: line_items
    relationship: order_items
    fields:
      - product:
          type: lookup
          reference_to: products
          required: true
      
      - quantity:
          type: number
          min: 1
          default: 1
      
      - unit_price:
          type: currency
          readonly: true
          auto_populate: $product.price
      
      - total:
          type: formula
          formula: quantity * unit_price
          readonly: true
  
  # Shipping
  - label: Shipping
    fields:
      - shipping_address:
          type: address
          required: true
      
      - shipping_method:
          type: select
          options:
            - Standard
            - Express
            - Overnight
          default: Standard
      
      - requested_delivery:
          type: date
          min: $today + 2

# Validation
validation:
  - rule: minimum_order
    condition:
      formula: order_items.sum(total) >= 100
    message: Minimum order amount is $100

# Totals (calculated)
calculated_fields:
  subtotal:
    formula: order_items.sum(total)
  
  tax:
    formula: subtotal * 0.08
  
  shipping_cost:
    formula: |
      shipping_method === 'Standard' ? 10 :
      shipping_method === 'Express' ? 25 : 50
  
  total:
    formula: subtotal + tax + shipping_cost

actions:
  submit:
    label: Place Order
    on_success:
      message: Order placed successfully
      send_email:
        to: $customer.email
        template: order_confirmation
      redirect: /orders/:id

ai_context:
  intent: "Create sales order with line items and shipping details"
  domain: e-commerce
```

### Example 3: Task Quick Create

```yaml
# File: task_quick.form.yml

label: Quick Task
object: task
type: create
description: Simplified form for quick task creation

# Single section, minimal fields
sections:
  - fields:
      - title:
          required: true
          placeholder: What needs to be done?
          autofocus: true
      
      - due_date:
          type: date
          default: $today + 7
      
      - priority:
          type: select
          options: [Low, Medium, High]
          default: Medium

# Auto-populate fields
defaults:
  status: todo
  assignee_id: $current_user.id
  project_id: $context.project_id # From URL context

# Quick save
actions:
  submit:
    label: Create Task
    on_success:
      message: Task created
      close_modal: true
      refresh_list: true

ai_context:
  intent: "Quick task creation form for minimal friction"
  domain: task_management
  use_cases:
    - "Create task from email"
    - "Add task during meeting"
    - "Quick capture from mobile"
```

## 9. Best Practices

### 9.1 User Experience

- **Logical grouping**: Organize related fields into sections
- **Progressive disclosure**: Use collapsible sections for optional fields
- **Clear labels**: Use descriptive field labels and help text
- **Smart defaults**: Pre-fill fields when possible
- **Inline validation**: Validate as user types, not just on submit

### 9.2 Performance

- **Lazy load options**: Load lookup options on demand
- **Optimize dependencies**: Minimize field dependencies
- **Debounce validation**: Don't validate on every keystroke
- **Cache lookups**: Cache frequently used lookup data

### 9.3 Accessibility

- **Keyboard navigation**: Support tab order and keyboard shortcuts
- **Screen reader friendly**: Use proper labels and ARIA attributes
- **Focus management**: Set autofocus appropriately
- **Error messages**: Clear, actionable error messages

### 9.4 Security

- **Server validation**: Always validate on server, not just client
- **CSRF protection**: Include CSRF tokens in forms
- **Sanitize inputs**: Prevent XSS and injection attacks
- **Permission checks**: Verify user can create/edit before showing form

## 10. Integration with Other Metadata

Forms integrate with:

- **Objects**: Use object field definitions
- **Validation**: Apply object validation rules
- **Permissions**: Respect field-level permissions
- **Actions**: Trigger actions on form events
- **Hooks**: Fire hooks on create/update
- **Formulas**: Calculate formula fields in real-time

## 11. AI Context Guidelines

```yaml
ai_context:
  # Business purpose
  intent: "Simplified lead capture form for trade shows"
  
  # Domain
  domain: sales
  
  # Use cases
  use_cases:
    - "Capture leads at events"
    - "Quick data entry from mobile"
    - "Minimal friction lead generation"
  
  # Form characteristics
  characteristics:
    - "Minimal fields for speed"
    - "Mobile-optimized layout"
    - "Offline capable"
```

## See Also

- [Objects](./object.md) - Data model definitions
- [Validation](./validation.md) - Validation rules
- [Pages](./page.md) - UI page definitions
- [Permissions](./permission.md) - Access control
