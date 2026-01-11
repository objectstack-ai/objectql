# Workflow & Process Metadata

Workflow metadata defines automated business processes, approvals, and state-based orchestration. Workflows coordinate actions across objects, users, and external systems. They are designed to be both executable and AI-understandable with clear business intent.

## 1. Overview

Workflow features include:

- **Process Automation**: Auto-execute actions based on triggers
- **Approval Processes**: Multi-step approval chains with SLAs
- **State Machines**: Control valid state transitions
- **Scheduled Processes**: Time-based automation
- **Event-Driven**: React to record changes
- **Integration**: Connect with external systems

**File Naming Convention:** `[workflow_name].workflow.yml`

## 2. Root Structure with AI Context

```yaml
name: order_approval_workflow
label: Order Approval Process
description: Multi-level approval workflow for orders
object: orders
version: 1.0

# AI-friendly context
ai_context:
  intent: "Ensure large orders are approved before processing"
  business_process: "Orders over $1,000 require manager approval. Orders over $10,000 require director approval."
  typical_duration: "2-5 business days"
  sla: "Must complete within 7 days"
  
  # Help AI understand when this triggers
  triggers_when:
    - "High-value order created"
    - "Existing order amount increased above threshold"
  
  # Business outcomes
  outcomes:
    approved: "Order proceeds to fulfillment"
    rejected: "Order is cancelled, customer notified"

# Workflow Type
type: approval  # approval, automation, scheduled

# Trigger Conditions with Context
trigger:
  event: create_or_update
  
  conditions:
    - field: amount
      operator: ">"
      value: 1000
      ai_context: "Only high-value orders need approval"
    
    - field: status
      operator: "="
      value: pending_approval
      ai_context: "Only orders awaiting approval"

# Workflow Steps with Decision Criteria
steps:
  - name: manager_approval
    label: Manager Approval
    type: approval
    
    # AI context for this step
    ai_context:
      intent: "Direct manager validates order details and customer standing"
      
      # Help AI understand approval criteria
      decision_criteria:
        - "Customer has good payment history"
        - "Order amount is reasonable for customer size"
        - "Inventory is available"
        - "Pricing is correct"
      
      typical_decision_time: "1-2 business days"
      escalation_if_no_response: "3 days"
    
    # SLA tracking
    sla:
      response_time: 2 days
      escalation:
        after: 3 days
        escalate_to: role:director
    
    assignee:
      type: field
      field: manager_id
      ai_context: "Route to customer's account manager"
    
    actions:
      approve:
        ai_context:
          intent: "Manager approves, proceed to director if amount high"
        
        # Conditional next step
        next_step: director_approval
        next_step_condition:
          field: amount
          operator: ">"
          value: 10000
        
        next_step_else: complete_workflow
        
        update_fields:
          approval_level: manager_approved
          manager_approved_at: $now
          manager_approved_by: $current_user
        
        notifications:
          - recipient: $record.requester
            template: manager_approved
      
      reject:
        ai_context:
          intent: "Manager denies order"
          requires_reason: true
        
        next_step: end
        
        update_fields:
          status: rejected
          rejection_level: manager
          rejection_reason: $input.reason
        
        required_input:
          reason:
            type: textarea
            min_length: 20
            label: "Reason for rejection"
        
        notifications:
          - recipient: $record.requester
            template: order_rejected
  
  - name: director_approval
    label: Director Approval
    type: approval
    
    ai_context:
      intent: "Executive approval for high-value orders"
      
      decision_criteria:
        - "Strategic fit with company goals"
        - "ROI justification"
        - "Budget availability"
        - "Risk assessment"
      
      typical_decision_time: "2-3 business days"
    
    # Only run this step if condition met
    condition:
      field: amount
      operator: ">"
      value: 10000
    
    sla:
      response_time: 3 days
      escalation:
        after: 4 days
        escalate_to: role:vp
    
    assignee:
      type: role
      role: director
      ai_context: "Route to sales director"
    
    actions:
      approve:
        next_step: complete_workflow
        
        update_fields:
          status: approved
          approval_level: director_approved
          director_approved_at: $now
      
      reject:
        next_step: end
        
        update_fields:
          status: rejected
          rejection_level: director
  
  - name: complete_workflow
    type: automated
    label: Finalize Approval
    
    ai_context:
      intent: "Automatically activate approved order"
    
    actions:
      - update_fields:
          status: approved
          approved_at: $now
      
      - create_record:
          object: fulfillment_order
          fields:
            order_id: $record.id
            status: pending
      
      - send_notification:
          recipients: [$record.requester, $record.sales_rep]
          template: order_approved_ready_to_fulfill

# Notifications with Context
notifications:
  - event: step_assigned
    recipients:
      - $assignee
    template: approval_request
    ai_context: "Notify approver they have a pending decision"
  
  - event: workflow_approved
    recipients:
      - $record.requester
      - $record.manager
    template: order_approved
    ai_context: "Notify stakeholders of successful approval"
  
  - event: workflow_rejected
    recipients:
      - $record.requester
    template: order_rejected

# Deadlines
deadlines:
  - step: manager_approval
    duration: 48 hours
    escalation:
      - send_reminder: 24 hours
      - auto_approve: 48 hours
```

## 3. Workflow Types

### 3.1 Approval Workflows

Multi-step approval processes:

```yaml
name: expense_approval
type: approval
object: expenses

trigger:
  event: create_or_update
  conditions:
    - field: status
      operator: "="
      value: submitted

steps:
  # Step 1: Direct Manager
  - name: manager_review
    type: approval
    label: Manager Review
    assignee:
      type: field
      field: employee.manager_id
    
    due_in: 3 days
    
    actions:
      approve:
        condition:
          field: amount
          operator: "<="
          value: 5000
        next_step: end
        update_fields:
          status: approved
      
      approve_with_escalation:
        condition:
          field: amount
          operator: ">"
          value: 5000
        next_step: finance_review
      
      reject:
        next_step: end
        update_fields:
          status: rejected
  
  # Step 2: Finance Review (conditional)
  - name: finance_review
    type: approval
    label: Finance Team Review
    assignee:
      type: queue
      queue: finance_approvals
    
    due_in: 5 days
    
    actions:
      approve:
        next_step: end
        update_fields:
          status: approved
      
      send_back:
        next_step: manager_review
        update_fields:
          status: needs_revision
      
      reject:
        next_step: end
        update_fields:
          status: rejected
```

### 3.2 Automation Workflows

Process automation without human intervention:

```yaml
name: new_customer_onboarding
type: automation
object: customers

trigger:
  event: create
  conditions:
    - field: status
      operator: "="
      value: new

steps:
  # Step 1: Send Welcome Email
  - name: send_welcome
    type: action
    action: send_email
    params:
      template: customer_welcome
      to: $record.email
      subject: Welcome to Our Platform
    
    on_success:
      next_step: create_account
    
    on_error:
      retry: 3
      retry_delay: 5 minutes
  
  # Step 2: Create User Account
  - name: create_account
    type: create_record
    object: user_accounts
    data:
      email: $record.email
      customer_id: $record.id
      role: customer
      send_activation: true
    
    on_success:
      next_step: assign_to_sales
  
  # Step 3: Assign to Sales Rep
  - name: assign_to_sales
    type: update_record
    data:
      sales_rep: $auto_assign_sales_rep
      onboarding_status: assigned
    
    on_success:
      next_step: create_tasks
  
  # Step 4: Create Onboarding Tasks
  - name: create_tasks
    type: bulk_create
    object: tasks
    records:
      - name: Initial Call
        assignee: $record.sales_rep
        due_date: $now + 1 day
        priority: high
      
      - name: Product Demo
        assignee: $record.sales_rep
        due_date: $now + 3 days
        priority: medium
      
      - name: Follow-up
        assignee: $record.sales_rep
        due_date: $now + 7 days
        priority: low
    
    on_success:
      next_step: end
```

### 3.3 Scheduled Workflows

Time-based automation:

```yaml
name: monthly_report_generation
type: scheduled
description: Generate and send monthly reports

# Schedule Configuration
schedule:
  type: cron
  expression: "0 9 1 * *"  # 9 AM on 1st of every month
  timezone: America/New_York

steps:
  # Generate Report
  - name: generate_report
    type: action
    action: generate_monthly_report
    params:
      report_type: sales_summary
      period: previous_month
    
    on_success:
      next_step: send_to_management
  
  # Send Report
  - name: send_to_management
    type: action
    action: send_email
    params:
      template: monthly_report
      to: management_team
      attachment: $previous_step.report_file
    
    on_success:
      next_step: archive_report
  
  # Archive
  - name: archive_report
    type: create_record
    object: report_archive
    data:
      report_type: monthly_sales
      generated_date: $now
      file: $step.generate_report.report_file
```

## 4. Workflow Triggers

### 4.1 Event Triggers

```yaml
trigger:
  # Record Events
  event: create            # Record created
  # event: update          # Record updated
  # event: delete          # Record deleted
  # event: create_or_update
  
  # Specific Field Changes
  field_changes:
    - status
    - priority
  
  # Conditions
  conditions:
    - field: status
      operator: "="
      value: submitted
    
    - type: and
    
    - field: amount
      operator: ">"
      value: 1000
  
  # Frequency Control
  run_once: true  # Don't re-trigger if conditions met again
```

### 4.2 Time Triggers

```yaml
trigger:
  # Scheduled
  type: scheduled
  schedule:
    type: cron
    expression: "0 */6 * * *"  # Every 6 hours
  
  # Or simple interval
  # schedule:
  #   type: interval
  #   every: 6 hours
  
  # Time-based on field
  # type: time_based
  # field: due_date
  # offset: -1 day  # 1 day before due date
```

### 4.3 Manual Triggers

```yaml
trigger:
  type: manual
  
  # Available as button/action
  button_label: Start Approval Process
  
  # Permissions
  can_trigger:
    - admin
    - manager
  
  # Confirm before start
  confirm_message: Start approval workflow for this order?
```

## 5. Workflow Steps

### 5.1 Approval Steps

```yaml
steps:
  - name: review_step
    type: approval
    label: Review & Approve
    
    # Who approves
    assignee:
      type: field       # field, role, user, queue, formula
      field: manager_id
    
    # Due date
    due_in: 3 days
    
    # Available actions
    actions:
      approve:
        label: Approve
        next_step: next_approval
        update_fields:
          approval_status: approved
      
      reject:
        label: Reject
        next_step: end
        update_fields:
          approval_status: rejected
      
      send_back:
        label: Request Changes
        next_step: revision
        update_fields:
          status: needs_revision
    
    # Comments
    require_comments: true
    comments_label: Approval Notes
```

### 5.2 Action Steps

Execute actions or custom code:

```yaml
steps:
  - name: notify_team
    type: action
    action: send_notification
    params:
      message: New order requires attention
      recipients: $record.team_members
    
    retry_policy:
      max_attempts: 3
      backoff: exponential
    
    on_success:
      next_step: update_status
    
    on_error:
      next_step: error_handler
```

### 5.3 Update Steps

Update record data:

```yaml
steps:
  - name: mark_processed
    type: update
    update_fields:
      status: processed
      processed_date: $now
      processed_by: $current_user
    
    on_success:
      next_step: notify_requester
```

### 5.4 Create Steps

Create related records:

```yaml
steps:
  - name: create_invoice
    type: create
    object: invoices
    data:
      order_id: $record.id
      customer_id: $record.customer_id
      amount: $record.total_amount
      due_date: $now + 30 days
      status: pending
    
    on_success:
      next_step: send_invoice
```

### 5.5 Conditional Steps

Branch based on conditions:

```yaml
steps:
  - name: route_by_amount
    type: conditional
    branches:
      # High value
      - condition:
          field: amount
          operator: ">"
          value: 50000
        next_step: cfo_approval
      
      # Medium value
      - condition:
          field: amount
          operator: ">"
          value: 10000
        next_step: director_approval
      
      # Default
      - default: true
        next_step: manager_approval
```

### 5.6 Wait Steps

Pause workflow:

```yaml
steps:
  - name: wait_for_payment
    type: wait
    
    # Wait for condition
    wait_for:
      field: payment_status
      operator: "="
      value: paid
    
    # Or wait for duration
    # duration: 3 days
    
    # Timeout
    timeout: 30 days
    on_timeout:
      next_step: cancel_order
```

### 5.7 Parallel Steps

Execute multiple steps concurrently:

```yaml
steps:
  - name: parallel_notifications
    type: parallel
    steps:
      - name: email_customer
        type: action
        action: send_email
        params:
          to: $record.customer.email
      
      - name: sms_customer
        type: action
        action: send_sms
        params:
          to: $record.customer.phone
      
      - name: update_crm
        type: action
        action: sync_to_crm
    
    # Wait for all or any
    wait_for: all  # or 'any'
    
    on_complete:
      next_step: mark_notified
```

## 6. Workflow Variables

Access and store data during workflow execution:

```yaml
variables:
  # Initialize variables
  approval_count:
    type: number
    default: 0
  
  approvers_list:
    type: array
    default: []

steps:
  - name: increment_approvals
    type: update_variable
    variable: approval_count
    operation: increment
    value: 1
  
  - name: add_approver
    type: update_variable
    variable: approvers_list
    operation: append
    value: $current_user.id
```

## 7. Escalation Rules

Handle overdue approvals:

```yaml
escalation:
  # Reminder
  - after: 24 hours
    action: send_reminder
    recipients:
      - $assignee
    template: approval_reminder
  
  # Escalate to manager
  - after: 48 hours
    action: reassign
    assignee:
      type: field
      field: assignee.manager_id
    notify: true
  
  # Auto-approve
  - after: 72 hours
    action: auto_approve
    update_fields:
      approval_status: auto_approved
      approval_note: Auto-approved due to timeout
```

## 8. Error Handling

```yaml
error_handling:
  # Retry policy
  retry:
    enabled: true
    max_attempts: 3
    backoff: exponential  # linear, exponential
    initial_delay: 5 minutes
  
  # On permanent failure
  on_error:
    action: send_notification
    recipients:
      - workflow_admin
    template: workflow_error
    
    # Cancel or continue
    continue_workflow: false
  
  # Compensation
  compensation_steps:
    - name: rollback_changes
      type: action
      action: rollback_transaction
```

## 9. Notifications

Configure workflow notifications:

```yaml
notifications:
  # Step Assignment
  - event: step_assigned
    recipients:
      - $assignee
    template: task_assigned
    channels: [email, in_app]
  
  # Approval Actions
  - event: approved
    recipients:
      - $record.requester
      - $record.manager
    template: approval_granted
  
  - event: rejected
    recipients:
      - $record.requester
    template: approval_rejected
  
  # Escalation
  - event: escalated
    recipients:
      - $new_assignee
      - workflow_admin
    template: workflow_escalated
  
  # Completion
  - event: completed
    recipients:
      - $record.owner
      - $workflow_participants
    template: workflow_completed
```

## 10. Workflow Versioning

```yaml
name: order_approval
version: 2.0
version_notes: Added finance approval step

# Version Control
versioning:
  strategy: major_version  # major_version, always_new
  
  # Handle in-flight workflows
  in_flight_behavior: complete_old_version
  # Options:
  # - complete_old_version: Continue with old version
  # - migrate_to_new: Move to new version
  # - cancel: Cancel old workflows
```

## 11. Workflow Analytics

Track workflow performance:

```yaml
analytics:
  enabled: true
  
  metrics:
    - average_duration
    - step_duration
    - approval_rate
    - rejection_rate
    - escalation_count
    - timeout_count
  
  # SLA targets
  sla:
    total_duration: 5 days
    step_duration:
      manager_approval: 2 days
      director_approval: 3 days
```

## 12. Sub-Workflows

Call other workflows:

```yaml
steps:
  - name: trigger_sub_workflow
    type: sub_workflow
    workflow: background_check_workflow
    
    # Pass data
    inputs:
      candidate_id: $record.id
      priority: high
    
    # Wait for completion
    wait_for_completion: true
    
    on_complete:
      next_step: review_background_check
```

## 13. Integration Steps

Connect with external systems:

```yaml
steps:
  - name: sync_to_salesforce
    type: integration
    integration: salesforce
    operation: create
    object: Opportunity
    
    mapping:
      Name: $record.name
      Amount: $record.budget
      CloseDate: $record.end_date
      StageName: Prospecting
    
    on_success:
      update_fields:
        salesforce_id: $response.id
        sync_status: synced
```

## 14. Implementation Example

```typescript
// src/workflows/order_approval.workflow.yml
import { WorkflowDefinition } from '@objectql/types';

export const order_approval: WorkflowDefinition = {
  name: 'order_approval',
  type: 'approval',
  object: 'orders',
  trigger: {
    event: 'create_or_update',
    conditions: [
      ['amount', '>', 1000],
      'and',
      ['status', '=', 'pending_approval']
    ]
  },
  steps: [
    {
      name: 'manager_approval',
      type: 'approval',
      assignee: {
        type: 'field',
        field: 'manager_id'
      },
      actions: {
        approve: { next_step: 'end' },
        reject: { next_step: 'end' }
      }
    }
  ]
};
```

## 15. Best Practices

1. **Clear Naming**: Use descriptive workflow and step names
2. **Error Handling**: Always define error handling strategies
3. **Testing**: Test workflows with edge cases
4. **Monitoring**: Enable analytics and logging
5. **Documentation**: Document business logic and decisions
6. **Versioning**: Use versioning for workflow changes
7. **Performance**: Avoid long-running synchronous steps
8. **Security**: Validate permissions at each step

## 16. Related Specifications

- [Actions](./action.md) - Custom operations
- [Hooks](./hook.md) - Event triggers
- [Permissions](./permission.md) - Access control
- [Validation](./validation.md) - Data validation
