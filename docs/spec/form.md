# Form Metadata

Form metadata defines the structure, layout, and behavior of data entry forms. Forms are the primary interface for creating and editing records.

## 1. Overview

Form metadata provides:

- **Layout definition**: Multi-column layouts, sections, tabs
- **Field configuration**: Labels, help text, default values, placeholders
- **Conditional logic**: Show/hide fields based on conditions
- **Validation**: Real-time field validation
- **Workflow integration**: Multi-step forms, wizards
- **Responsive design**: Mobile-optimized layouts

**File Naming Convention:** `[object_name].form.yml` or `[form_name].form.yml`

## 2. Root Structure

```yaml
name: project_form
label: Project Information
type: edit  # create, edit, view
object: projects
description: Form for creating and editing projects

# Layout Configuration
layout:
  columns: 2
  sections:
    - name: basic_info
      label: Basic Information
      columns: 2
      fields:
        - name
        - status
        - priority
        - category
    
    - name: details
      label: Project Details
      columns: 1
      fields:
        - description
        - objectives
        - deliverables
    
    - name: timeline
      label: Timeline & Budget
      columns: 2
      fields:
        - start_date
        - end_date
        - budget
        - estimated_hours
    
    - name: assignment
      label: Team Assignment
      columns: 2
      fields:
        - owner
        - team
        - department

# Field Overrides
field_config:
  description:
    rows: 5
    placeholder: Enter detailed project description
    help_text: Provide comprehensive project overview
  
  status:
    default_value: draft
    help_text: Current project status
  
  budget:
    prefix: $
    format: currency
    help_text: Total project budget

# Conditional Display
conditional_logic:
  - condition:
      field: status
      operator: "="
      value: completed
    actions:
      - show_fields: [completion_date, final_cost]
      - hide_fields: [estimated_hours]
  
  - condition:
      field: budget
      operator: ">"
      value: 100000
    actions:
      - show_fields: [approval_required, approver]
      - mark_required: [approver]

# Actions
actions:
  primary:
    - label: Save
      action: save
      icon: save
    - label: Save & New
      action: save_and_new
      icon: add
  
  secondary:
    - label: Cancel
      action: cancel
      icon: close

# Validation
validation:
  on_change: true
  on_submit: true
  show_errors_inline: true
```

## 3. Form Types

| Type | Description | Use Case |
|:---|:---|:---|
| `create` | New record creation | Creating new entities |
| `edit` | Record editing | Updating existing records |
| `view` | Read-only display | Viewing record details |
| `wizard` | Multi-step form | Complex data entry workflows |
| `inline` | Inline editing | Quick edits in lists/grids |
| `quick_create` | Minimal quick form | Fast record creation |

## 4. Layout Sections

Organize fields into logical groups:

```yaml
layout:
  # Global layout settings
  columns: 2
  spacing: medium
  
  sections:
    # Basic Section
    - name: personal_info
      label: Personal Information
      description: Employee basic details
      columns: 2
      collapsible: true
      collapsed: false
      fields:
        - first_name
        - last_name
        - email
        - phone
    
    # Full-width Section
    - name: address
      label: Address
      columns: 1
      fields:
        - street
        - city
        - state
        - zip_code
    
    # Nested Sections
    - name: employment
      label: Employment Details
      sections:
        - name: position
          label: Position
          fields:
            - title
            - department
            - manager
        
        - name: compensation
          label: Compensation
          fields:
            - salary
            - bonus
            - stock_options
```

## 5. Field Configuration

Override object-level field definitions:

```yaml
field_config:
  # Text Field
  email:
    label: Email Address
    placeholder: user@example.com
    help_text: Primary contact email
    required: true
    autocomplete: email
    validation:
      format: email
  
  # Number Field
  budget:
    label: Project Budget
    prefix: $
    suffix: USD
    format: currency
    decimal_places: 2
    min: 0
    max: 1000000
    step: 1000
    help_text: Total allocated budget
  
  # Select Field
  status:
    label: Status
    help_text: Current project status
    default_value: draft
    style: dropdown  # dropdown, radio, buttons
  
  # Lookup Field
  owner:
    label: Project Owner
    help_text: Responsible person
    search_fields: [name, email]
    display_format: "{name} ({email})"
    create_new: true  # Allow creating new record
  
  # Date Field
  start_date:
    label: Start Date
    help_text: Project kickoff date
    min_date: today
    max_date: +1 year
    default_value: today
    format: MM/DD/YYYY
  
  # Textarea
  description:
    label: Description
    placeholder: Enter detailed description
    rows: 5
    max_length: 5000
    show_character_count: true
    rich_text: false
  
  # Checkbox
  is_public:
    label: Public Project
    help_text: Visible to all users
    default_value: false
  
  # File Upload
  attachments:
    label: Attachments
    help_text: Upload relevant documents
    multiple: true
    accept: [.pdf, .doc, .docx, .xls, .xlsx]
    max_size: 10MB
    max_files: 5
```

## 6. Conditional Logic

Show/hide fields and control behavior based on conditions:

```yaml
conditional_logic:
  # Show/Hide Fields
  - name: show_international_fields
    condition:
      field: country
      operator: "!="
      value: US
    actions:
      - show_fields: [passport_number, visa_status]
      - hide_fields: [ssn]
  
  # Make Fields Required
  - name: require_reason_for_delay
    condition:
      field: status
      operator: "="
      value: delayed
    actions:
      - mark_required: [delay_reason, estimated_recovery_date]
  
  # Change Field Properties
  - name: readonly_after_approval
    condition:
      field: approval_status
      operator: "="
      value: approved
    actions:
      - readonly_fields: [budget, scope, timeline]
  
  # Multiple Conditions (AND)
  - name: high_value_approval
    condition:
      type: and
      conditions:
        - field: amount
          operator: ">"
          value: 10000
        - field: department
          operator: "="
          value: finance
    actions:
      - show_fields: [cfo_approval]
      - mark_required: [cfo_approval]
  
  # Multiple Conditions (OR)
  - name: special_handling
    condition:
      type: or
      conditions:
        - field: priority
          operator: "="
          value: urgent
        - field: vip_customer
          operator: "="
          value: true
    actions:
      - show_section: special_instructions
      - set_field_value:
          field: requires_review
          value: true
```

## 7. Tabs Layout

Organize complex forms into tabs:

```yaml
layout:
  type: tabs
  tabs:
    # Tab 1: Basic Info
    - name: basic
      label: Basic Information
      icon: info
      sections:
        - name: details
          fields:
            - name
            - description
            - status
    
    # Tab 2: Advanced
    - name: advanced
      label: Advanced Settings
      icon: settings
      sections:
        - name: configuration
          fields:
            - priority
            - tags
            - custom_fields
    
    # Tab 3: Related Records
    - name: related
      label: Related Items
      icon: link
      sections:
        - name: tasks
          type: related_list
          object: tasks
          relation: project_id
          
        - name: documents
          type: related_list
          object: documents
          relation: project_id
```

## 8. Wizard Forms

Multi-step forms for complex workflows:

```yaml
name: project_wizard
type: wizard
object: projects

steps:
  # Step 1: Basic Info
  - name: basic
    label: Basic Information
    description: Enter project fundamentals
    fields:
      - name
      - description
      - category
    validation:
      required: [name, category]
    
    # Show only if validation passes
    allow_next: true
  
  # Step 2: Team
  - name: team
    label: Team Assignment
    description: Assign team members
    fields:
      - owner
      - team_members
      - department
    
    # Skip if single-person project
    skip_if:
      field: project_type
      operator: "="
      value: individual
  
  # Step 3: Timeline
  - name: timeline
    label: Timeline & Budget
    description: Set schedule and budget
    fields:
      - start_date
      - end_date
      - budget
      - milestones
  
  # Step 4: Review
  - name: review
    label: Review & Submit
    description: Review all information
    type: summary
    
    # Show summary of all fields
    summary_sections:
      - label: Basic Information
        fields: [name, description, category]
      - label: Team
        fields: [owner, team_members]
      - label: Timeline
        fields: [start_date, end_date, budget]

# Wizard Navigation
wizard_config:
  allow_back: true
  allow_skip: false
  show_progress: true
  save_draft: true
  
  buttons:
    back: Previous
    next: Next
    finish: Create Project
```

## 9. Field Groups

Group related fields visually:

```yaml
layout:
  sections:
    - name: contact
      label: Contact Information
      
      # Field Groups within Section
      field_groups:
        # Primary Contact
        - label: Primary Contact
          columns: 2
          fields:
            - primary_email
            - primary_phone
        
        # Secondary Contact
        - label: Secondary Contact
          columns: 2
          collapsible: true
          collapsed: true
          fields:
            - secondary_email
            - secondary_phone
```

## 10. Inline Editing

Quick edit configuration:

```yaml
name: task_inline_edit
type: inline
object: tasks

# Fields available for inline edit
editable_fields:
  - status
  - priority
  - assignee
  - due_date

# Quick action buttons
quick_actions:
  - label: Complete
    action: update
    values:
      status: completed
      completed_date: $current_date
  
  - label: Reassign
    action: show_field
    field: assignee
```

## 11. Quick Create Form

Minimal form for fast data entry:

```yaml
name: task_quick_create
type: quick_create
object: tasks
label: Quick Add Task

# Minimal required fields
fields:
  - name
  - assignee
  - due_date

# Auto-fill fields
defaults:
  status: open
  priority: medium
  created_by: $current_user

# After creation
after_create:
  action: close  # or 'stay', 'redirect'
  message: Task created successfully
```

## 12. Dynamic Fields

Add/remove field groups dynamically:

```yaml
layout:
  sections:
    - name: contacts
      label: Contact Persons
      type: repeatable
      
      # Field group that can be repeated
      field_group:
        - name
        - email
        - phone
        - role
      
      # Configuration
      min_items: 1
      max_items: 10
      add_button_label: Add Contact
      remove_button_label: Remove
```

## 13. Form Actions

Define available actions on the form:

```yaml
actions:
  # Primary Actions (prominent buttons)
  primary:
    - label: Save
      action: save
      icon: save
      hotkey: Ctrl+S
      
    - label: Save & Close
      action: save_and_close
      icon: save_close
  
  # Secondary Actions (less prominent)
  secondary:
    - label: Save as Draft
      action: save
      values:
        status: draft
      icon: draft
    
    - label: Cancel
      action: cancel
      icon: close
      confirm: Discard changes?
  
  # Custom Actions
  custom:
    - label: Send for Approval
      action: custom
      handler: send_for_approval
      icon: send
      
      # Only show when ready
      visible_when:
        field: status
        operator: "="
        value: ready_for_approval
```

## 14. Form Validation

```yaml
validation:
  # When to validate
  on_change: true        # Validate as user types
  on_blur: true          # Validate when field loses focus
  on_submit: true        # Validate before submit
  
  # How to show errors
  show_errors_inline: true
  show_error_summary: true
  error_summary_position: top
  
  # Validation rules
  rules:
    - fields: [start_date, end_date]
      validator: |
        function validate(values) {
          return values.end_date > values.start_date;
        }
      message: End date must be after start date
```

## 15. Responsive Design

Mobile-optimized layouts:

```yaml
layout:
  # Desktop layout
  desktop:
    columns: 2
    sections: [...]
  
  # Tablet layout
  tablet:
    columns: 1
    compact_sections: true
  
  # Mobile layout
  mobile:
    columns: 1
    stack_fields: true
    hide_labels: false
    
    # Show only essential fields
    visible_fields:
      - name
      - status
      - priority
      - due_date
```

## 16. Field Dependencies

Load field options based on other field values:

```yaml
field_config:
  state:
    type: select
    label: State
  
  city:
    type: select
    label: City
    depends_on: state
    
    # Load cities based on selected state
    options_query:
      object: cities
      filters:
        - field: state
          operator: "="
          value: $state
      fields: [name]
      sort:
        - field: name
          direction: asc
```

## 17. Auto-save

Automatically save form progress:

```yaml
auto_save:
  enabled: true
  interval: 30000  # 30 seconds
  mode: draft      # Save as draft
  
  # Show indicator
  show_indicator: true
  indicator_position: top-right
  
  # Recovery
  enable_recovery: true
  recovery_prompt: You have unsaved changes. Restore?
```

## 18. Form Events & Hooks

Execute logic on form events:

```yaml
events:
  # Before form loads
  on_load: |
    async function onLoad(context) {
      // Pre-populate fields
      if (context.user.department) {
        context.setFieldValue('department', context.user.department);
      }
    }
  
  # When field changes
  on_field_change:
    budget:
      handler: |
        function onChange(value, context) {
          // Auto-calculate tax
          const tax = value * 0.1;
          context.setFieldValue('estimated_tax', tax);
        }
  
  # Before submit
  on_before_submit: |
    async function beforeSubmit(values, context) {
      // Final validation
      if (values.amount > 10000 && !values.approval) {
        context.showError('High-value orders require approval');
        return false;
      }
      return true;
    }
  
  # After successful submit
  on_success: |
    function onSuccess(result, context) {
      context.showMessage('Record saved successfully');
      context.redirect(`/projects/${result.id}`);
    }
  
  # On error
  on_error: |
    function onError(error, context) {
      context.showError(`Failed to save: ${error.message}`);
    }
```

## 19. Form Modes

Different modes for different contexts:

```yaml
modes:
  # Create mode
  create:
    title: New Project
    show_fields: [name, description, owner, start_date]
    defaults:
      status: draft
      created_by: $current_user
  
  # Edit mode
  edit:
    title: Edit Project
    show_fields: [name, description, status, owner, start_date, end_date]
    readonly_fields: [created_by, created_at]
  
  # Clone mode
  clone:
    title: Clone Project
    show_fields: [name, description, owner]
    exclude_fields: [id, created_at, created_by]
    field_overrides:
      name:
        default_value: "Copy of {original_name}"
```

## 20. Implementation Example

```typescript
// src/forms/project.form.yml
import { FormDefinition } from '@objectql/types';

export const project_form: FormDefinition = {
  name: 'project_form',
  type: 'edit',
  object: 'projects',
  layout: {
    columns: 2,
    sections: [
      {
        name: 'basic',
        label: 'Basic Information',
        fields: ['name', 'description', 'status']
      }
    ]
  },
  field_config: {
    status: {
      default_value: 'draft'
    }
  }
};
```

## 21. Best Practices

1. **User Experience**: Group related fields logically
2. **Progressive Disclosure**: Show advanced fields only when needed
3. **Clear Labels**: Use descriptive labels and help text
4. **Validation**: Validate early and provide clear error messages
5. **Performance**: Lazy-load heavy components
6. **Accessibility**: Support keyboard navigation and screen readers
7. **Mobile**: Design for mobile-first
8. **Defaults**: Set sensible default values

## 22. Related Specifications

- [Objects & Fields](./object.md) - Data model
- [Views](./view.md) - Display layouts
- [Validation](./validation.md) - Validation rules
- [Actions](./action.md) - Form actions
