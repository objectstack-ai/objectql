/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Workflow and Automation Metadata Definition
 * 
 * Defines the structure for workflows, approvals, and automation processes in ObjectQL.
 * Workflows orchestrate business processes, approval chains, and automated actions.
 * 
 * Based on patterns from Salesforce Process Builder, Microsoft Power Automate, and similar platforms.
 */

import { ValidationCondition } from './validation';

/**
 * Types of workflows supported by ObjectQL
 */
export type WorkflowType = 
    | 'approval'        // Multi-step approval process
    | 'automation'      // Automated actions based on triggers
    | 'scheduled'       // Time-based scheduled workflow
    | 'sequential'      // Sequential step-by-step process
    | 'parallel'        // Parallel execution of steps
    | 'custom';         // Custom workflow logic

/**
 * Workflow trigger event types
 */
export type WorkflowTriggerEvent = 
    | 'create'              // Record created
    | 'update'              // Record updated
    | 'delete'              // Record deleted
    | 'create_or_update'    // Record created or updated
    | 'field_change'        // Specific field changed
    | 'schedule'            // Time-based schedule
    | 'manual'              // Manually triggered
    | 'webhook'             // External webhook trigger
    | 'custom';             // Custom trigger logic

/**
 * Workflow trigger configuration
 */
export interface WorkflowTrigger {
    /** Trigger event type */
    event: WorkflowTriggerEvent;
    
    /** Conditions that must be met to trigger the workflow */
    conditions?: ValidationCondition[];
    
    /** Schedule configuration (for scheduled workflows) */
    schedule?: {
        /** Cron expression */
        cron?: string;
        /** Interval in minutes */
        interval?: number;
        /** Timezone for schedule */
        timezone?: string;
    };
    
    /** Specific fields to monitor (for field_change event) */
    fields?: string[];
    
    /** Webhook configuration (for webhook triggers) */
    webhook?: {
        /** Webhook URL pattern */
        path?: string;
        /** HTTP method */
        method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
        /** Authentication required */
        auth?: boolean;
    };
}

/**
 * Workflow step types
 */
export type WorkflowStepType = 
    | 'approval'            // Approval step requiring user action
    | 'action'              // Execute an action
    | 'notification'        // Send notification
    | 'field_update'        // Update field values
    | 'create_record'       // Create a new record
    | 'condition'           // Conditional branching
    | 'wait'                // Wait for time or condition
    | 'loop'                // Loop over items
    | 'webhook'             // Call external webhook
    | 'script'              // Execute custom script
    | 'parallel'            // Execute multiple steps in parallel
    | 'custom';             // Custom step logic

/**
 * Assignee configuration for approval steps
 */
export interface WorkflowAssignee {
    /** Assignee type */
    type: 'user' | 'role' | 'field' | 'expression' | 'queue';
    
    /** Specific user ID (for type: user) */
    user?: string;
    
    /** Role name (for type: role) */
    role?: string;
    
    /** Field containing assignee (for type: field) */
    field?: string;
    
    /** Expression to evaluate assignee (for type: expression) */
    expression?: string;
    
    /** Queue name (for type: queue) */
    queue?: string;
}

/**
 * Approval step action configuration
 */
export interface ApprovalAction {
    /** Action label */
    label: string;
    
    /** Action value/identifier */
    value?: string;
    
    /** Next step to execute */
    next_step?: string;
    
    /** Workflow outcome if this action is chosen */
    outcome?: 'approved' | 'rejected' | 'pending' | 'custom';
    
    /** Field updates to apply */
    updates?: Record<string, any>;
    
    /** Comment field name */
    comment_field?: string;
    
    /** Whether comment is required */
    comment_required?: boolean;
}

/**
 * Field update configuration
 */
export interface FieldUpdateConfig {
    /** Field to update */
    field: string;
    
    /** New value */
    value?: any;
    
    /** Expression to calculate value */
    expression?: string;
    
    /** Copy value from another field */
    copy_from?: string;
}

/**
 * Notification configuration
 */
export interface NotificationConfig {
    /** Notification type */
    type: 'email' | 'sms' | 'push' | 'in_app' | 'custom';
    
    /** Recipients */
    to?: {
        /** Recipient type */
        type: 'user' | 'role' | 'field' | 'email';
        /** Value based on type */
        value?: string;
    }[];
    
    /** Email template or subject */
    subject?: string;
    
    /** Message template */
    template?: string;
    
    /** Message body */
    body?: string;
    
    /** Custom notification handler */
    handler?: string;
}

/**
 * Create record configuration
 */
export interface CreateRecordConfig {
    /** Object to create record in */
    object: string;
    
    /** Field mappings from trigger record */
    field_mappings?: Record<string, string>;
    
    /** Static field values */
    values?: Record<string, any>;
}

/**
 * Conditional branch configuration
 */
export interface ConditionalBranch {
    /** Condition to evaluate */
    condition: ValidationCondition;
    
    /** Steps to execute if condition is true */
    then_steps?: string[];
    
    /** Steps to execute if condition is false */
    else_steps?: string[];
}

/**
 * Wait configuration
 */
export interface WaitConfig {
    /** Wait type */
    type: 'duration' | 'until' | 'field_change';
    
    /** Duration to wait (ISO 8601 duration) */
    duration?: string;
    
    /** Wait until specific datetime */
    until?: string;
    
    /** Wait until field changes */
    field?: string;
    
    /** Timeout (ISO 8601 duration) */
    timeout?: string;
}

/**
 * Loop configuration
 */
export interface LoopConfig {
    /** Type of loop */
    type: 'items' | 'count' | 'while';
    
    /** Items to iterate over (field or expression) */
    items?: string;
    
    /** Number of iterations */
    count?: number;
    
    /** Condition for while loop */
    condition?: ValidationCondition;
    
    /** Steps to execute in each iteration */
    steps?: string[];
}

/**
 * Webhook call configuration
 */
export interface WebhookCallConfig {
    /** URL to call */
    url: string;
    
    /** HTTP method */
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    
    /** Headers */
    headers?: Record<string, string>;
    
    /** Request body */
    body?: any;
    
    /** Body template */
    body_template?: string;
    
    /** Authentication configuration */
    auth?: {
        type: 'basic' | 'bearer' | 'api_key' | 'oauth2';
        credentials?: Record<string, any>;
    };
    
    /** Timeout in milliseconds */
    timeout?: number;
    
    /** Retry configuration */
    retry?: {
        max_attempts?: number;
        backoff?: 'exponential' | 'linear';
    };
}

/**
 * Workflow step definition
 */
export interface WorkflowStep {
    /** Unique step identifier */
    name: string;
    
    /** Display label */
    label?: string;
    
    /** Step description */
    description?: string;
    
    /** Step type */
    type: WorkflowStepType;
    
    /** Condition to execute this step */
    condition?: ValidationCondition;
    
    /** Assignee (for approval steps) */
    assignee?: WorkflowAssignee;
    
    /** Available actions (for approval steps) */
    actions?: Record<string, ApprovalAction>;
    
    /** Field updates to apply */
    field_updates?: FieldUpdateConfig[];
    
    /** Notification configuration */
    notification?: NotificationConfig;
    
    /** Record creation configuration */
    create_record?: CreateRecordConfig;
    
    /** Conditional branching */
    conditional?: ConditionalBranch;
    
    /** Wait configuration */
    wait?: WaitConfig;
    
    /** Loop configuration */
    loop?: LoopConfig;
    
    /** Webhook configuration */
    webhook?: WebhookCallConfig;
    
    /** Custom script */
    script?: string;
    
    /** Parallel steps to execute */
    parallel_steps?: string[];
    
    /** Next step to execute (default flow) */
    next_step?: string;
    
    /** Timeout for this step (ISO 8601 duration) */
    timeout?: string;
    
    /** Error handling */
    on_error?: {
        /** Action on error */
        action: 'fail' | 'continue' | 'retry' | 'skip';
        /** Next step on error */
        next_step?: string;
        /** Retry configuration */
        retry?: {
            max_attempts?: number;
            delay?: string;
        };
    };
}

/**
 * Complete workflow configuration
 */
export interface WorkflowConfig {
    /** Unique workflow identifier */
    name: string;
    
    /** Display label */
    label: string;
    
    /** Workflow type */
    type: WorkflowType;
    
    /** Object this workflow applies to */
    object: string;
    
    /** Workflow description */
    description?: string;
    
    /** Icon for the workflow */
    icon?: string;
    
    /** Whether the workflow is active */
    is_active?: boolean;
    
    /** Trigger configuration */
    trigger: WorkflowTrigger;
    
    /** Ordered list of workflow steps */
    steps: WorkflowStep[];
    
    /** Initial step to execute */
    initial_step?: string;
    
    /** Workflow variables */
    variables?: Record<string, any>;
    
    /** Success outcome field updates */
    on_success?: {
        /** Field updates on successful completion */
        updates?: Record<string, any>;
        /** Notification on success */
        notification?: NotificationConfig;
    };
    
    /** Failure outcome configuration */
    on_failure?: {
        /** Field updates on failure */
        updates?: Record<string, any>;
        /** Notification on failure */
        notification?: NotificationConfig;
    };
    
    /** Execution timeout (ISO 8601 duration) */
    timeout?: string;
    
    /** Execution mode */
    execution_mode?: 'synchronous' | 'asynchronous';
    
    /** Priority (higher priority workflows execute first) */
    priority?: number;
    
    /** Access control */
    permissions?: {
        /** Roles that can trigger this workflow */
        execute?: string[];
        /** Roles that can view workflow history */
        view?: string[];
        /** Roles that can edit workflow configuration */
        edit?: string[];
    };
    
    /** Custom workflow configuration */
    config?: Record<string, any>;
    
    /** AI context for workflow generation */
    ai_context?: {
        /** Business process description */
        intent?: string;
        /** Process participants */
        stakeholders?: string[];
        /** Expected duration */
        duration?: string;
    };
}

/**
 * Workflow execution status
 */
export type WorkflowStatus = 
    | 'pending'          // Awaiting trigger
    | 'running'          // Currently executing
    | 'waiting'          // Waiting for approval or condition
    | 'completed'        // Successfully completed
    | 'approved'         // Approved (for approval workflows)
    | 'rejected'         // Rejected (for approval workflows)
    | 'failed'           // Failed with error
    | 'cancelled'        // Manually cancelled
    | 'timeout';         // Timed out

/**
 * Workflow instance (execution record)
 */
export interface WorkflowInstance {
    /** Instance ID */
    id: string;
    
    /** Workflow name */
    workflow_name: string;
    
    /** Record ID that triggered the workflow */
    record_id?: string;
    
    /** Current status */
    status: WorkflowStatus;
    
    /** Current step */
    current_step?: string;
    
    /** Started timestamp */
    started_at?: string;
    
    /** Completed timestamp */
    completed_at?: string;
    
    /** Triggered by user */
    triggered_by?: string;
    
    /** Error message (if failed) */
    error?: string;
    
    /** Execution context */
    context?: Record<string, any>;
    
    /** Step history */
    step_history?: Array<{
        step: string;
        status: 'completed' | 'failed' | 'skipped';
        started_at: string;
        completed_at?: string;
        actor?: string;
        result?: any;
    }>;
}
