/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Permission and Security Metadata Types
 * 
 * This module defines the TypeScript interfaces for ObjectQL's permission system,
 * implementing role-based access control (RBAC), field-level security, and
 * record-level rules.
 * 
 * Based on specification: docs/spec/permission.md
 */

/**
 * Basic CRUD operations for object-level permissions
 */
export type ObjectOperation = 
    | 'create'      // Create new records
    | 'read'        // View existing records
    | 'update'      // Modify existing records
    | 'delete'      // Delete records
    | 'view_all'    // See all records (bypass ownership rules)
    | 'modify_all'; // Edit all records (bypass ownership rules)

/**
 * Field-level operations
 */
export type FieldOperation = 'read' | 'update';

/**
 * Comparison operators for permission conditions
 */
export type PermissionOperator = 
    | '='
    | '!='
    | '>'
    | '>='
    | '<'
    | '<='
    | 'in'
    | 'not_in'
    | 'contains'
    | 'not_contains'
    | 'starts_with'
    | 'ends_with';

/**
 * Object-level permissions controlling CRUD operations
 */
export interface ObjectPermissions {
    /** Roles that can create new records */
    create?: string[];
    /** Roles that can view records */
    read?: string[];
    /** Roles that can update records */
    update?: string[];
    /** Roles that can delete records */
    delete?: string[];
    /** Roles that can view all records (bypass ownership rules) */
    view_all?: string[];
    /** Roles that can modify all records (bypass ownership rules) */
    modify_all?: string[];
}

/**
 * Field-level permissions for a specific field
 */
export interface FieldPermission {
    /** Roles that can read this field */
    read?: string[];
    /** Roles that can update this field */
    update?: string[];
}

/**
 * Map of field names to their permissions
 */
export type FieldPermissions = Record<string, FieldPermission>;

/**
 * Condition type for record-level rules
 */
export type ConditionType = 
    | 'simple'    // Single field comparison
    | 'complex'   // Multiple conditions with AND/OR
    | 'formula'   // Custom JavaScript/formula expression
    | 'lookup';   // Check related record data

/**
 * Simple condition for a single field comparison
 */
export interface SimpleCondition {
    type?: 'simple';
    /** Field to check */
    field: string;
    /** Comparison operator */
    operator: PermissionOperator;
    /** Value to compare against (can include variables like $current_user.id) */
    value: any;
}

/**
 * Simple condition element (inline form for complex expressions)
 */
export interface ConditionElement {
    field: string;
    operator: PermissionOperator;
    value: any;
}

/**
 * Expression element in complex conditions
 */
export type ConditionExpression = 
    | SimpleCondition
    | ConditionElement
    | 'and'
    | 'or';

/**
 * Complex condition with multiple clauses
 */
export interface ComplexCondition {
    type: 'complex';
    /** Array of conditions and logical operators */
    expression: ConditionExpression[];
}

/**
 * Formula-based condition using custom logic
 */
export interface FormulaCondition {
    type: 'formula';
    /** JavaScript expression or formula */
    formula: string;
}

/**
 * Lookup condition checking related record data
 */
export interface LookupCondition {
    type: 'lookup';
    /** Related object to check */
    object: string;
    /** Field linking to related object */
    via: string;
    /** Condition to check on related object */
    condition: RecordRuleCondition;
}

/**
 * Union type for all condition types
 */
export type RecordRuleCondition = 
    | SimpleCondition 
    | ComplexCondition 
    | FormulaCondition 
    | LookupCondition;

/**
 * Permissions granted by a record rule
 */
export interface RecordRulePermissions {
    /** Grant read permission */
    read?: boolean;
    /** Grant update permission */
    update?: boolean;
    /** Grant delete permission */
    delete?: boolean;
}

/**
 * Record-level rule for dynamic access control
 */
export interface RecordRule {
    /** Unique name of the rule */
    name: string;
    /** Priority (higher priority rules take precedence, default: 0) */
    priority?: number;
    /** Human-readable description */
    description?: string;
    /** Condition for applying this rule */
    condition: RecordRuleCondition;
    /** Permissions granted when condition matches */
    permissions: RecordRulePermissions;
}

/**
 * Sharing rule type
 */
export type SharingRuleType = 
    | 'manual'    // Users can manually share records
    | 'criteria'  // Automatic sharing based on criteria
    | 'team';     // Team-based sharing

/**
 * Who to share with
 */
export interface SharedWith {
    type: 'role' | 'team' | 'user' | 'group';
    roles?: string[];
    teams?: string[];
    users?: string[];
    groups?: string[];
}

/**
 * Base sharing rule
 */
export interface BaseSharingRule {
    /** Unique name of the rule */
    name: string;
    /** Type of sharing rule */
    type: SharingRuleType;
    /** Description */
    description?: string;
    /** Whether this rule is enabled */
    enabled?: boolean;
    /** Permissions granted through sharing */
    permissions: RecordRulePermissions;
}

/**
 * Manual sharing rule - users can manually share records
 */
export interface ManualSharingRule extends BaseSharingRule {
    type: 'manual';
}

/**
 * Criteria-based sharing rule - automatic sharing
 */
export interface CriteriaSharingRule extends BaseSharingRule {
    type: 'criteria';
    /** Condition for automatic sharing */
    condition: RecordRuleCondition;
    /** Who to share with */
    shared_with: SharedWith;
}

/**
 * Team-based sharing rule
 */
export interface TeamSharingRule extends BaseSharingRule {
    type: 'team';
    /** Field containing team ID */
    team_field: string;
}

/**
 * Union type for all sharing rules
 */
export type SharingRule = ManualSharingRule | CriteriaSharingRule | TeamSharingRule;

/**
 * Condition for action execution
 */
export interface ActionCondition {
    /** Field to check */
    field: string;
    /** Comparison operator */
    operator: PermissionOperator;
    /** Value to compare */
    value: any;
}

/**
 * Rate limiting configuration for actions
 */
export interface ActionRateLimit {
    /** Maximum requests per hour */
    requests_per_hour?: number;
    /** Maximum requests per day */
    requests_per_day?: number;
}

/**
 * Permission configuration for a specific action
 */
export interface ActionPermission {
    /** Roles that can execute this action */
    execute: string[];
    /** Conditions that must be met for execution */
    conditions?: ActionCondition[];
    /** Rate limiting */
    rate_limit?: ActionRateLimit;
}

/**
 * Map of action names to their permissions
 */
export type ActionPermissions = Record<string, ActionPermission>;

/**
 * Field restrictions for a view
 */
export interface ViewFieldRestriction {
    /** Field name */
    [fieldName: string]: {
        /** Roles that can see this field in the view */
        visible_to: string[];
    };
}

/**
 * Permission configuration for a specific view
 */
export interface ViewPermission {
    /** Roles that can access this view */
    access: string[];
    /** Field-level restrictions within the view */
    field_restrictions?: ViewFieldRestriction;
}

/**
 * Map of view names to their permissions
 */
export type ViewPermissions = Record<string, ViewPermission>;

/**
 * Row-level security configuration
 */
export interface RowLevelSecurity {
    /** Whether RLS is enabled */
    enabled: boolean;
    /** Default rule applied to all users */
    default_rule?: SimpleCondition;
    /** Exceptions to the default rule */
    exceptions?: Array<{
        /** Role to apply exception to */
        role: string;
        /** Whether to bypass RLS entirely */
        bypass?: boolean;
        /** Custom condition for this role */
        condition?: RecordRuleCondition;
    }>;
}

/**
 * Field masking configuration for a specific field
 */
export interface FieldMaskConfig {
    /** Mask format (e.g., "****-****-****-{last4}") */
    mask_format: string;
    /** Roles that can see the unmasked value */
    visible_to: string[];
}

/**
 * Map of field names to their masking configuration
 */
export type FieldMasking = Record<string, FieldMaskConfig>;

/**
 * Audit event type
 */
export type AuditEventType = 
    | 'permission_grant'
    | 'permission_revoke'
    | 'access_denied'
    | 'sensitive_field_access';

/**
 * Alert configuration for suspicious activity
 */
export interface AuditAlert {
    /** Event type to alert on */
    event: AuditEventType;
    /** Number of events to trigger alert */
    threshold: number;
    /** Time window in minutes */
    window_minutes: number;
    /** Who to notify (roles or user IDs) */
    notify: string[];
}

/**
 * Audit trail configuration
 */
export interface AuditConfig {
    /** Whether auditing is enabled */
    enabled: boolean;
    /** Events to log */
    events?: AuditEventType[];
    /** Retention period in days */
    retention_days?: number;
    /** Alert configurations */
    alerts?: AuditAlert[];
}

/**
 * Complete permission configuration for an object
 */
export interface PermissionConfig {
    /** Unique name of the permission configuration */
    name: string;
    /** Object this permission applies to */
    object: string;
    /** Description */
    description?: string;
    
    /** 
     * Roles referenced in this permission configuration.
     * 
     * Best Practice: Define roles centrally in ApplicationConfig and reference them here.
     * This field serves to:
     * 1. Document which roles apply to this object
     * 2. Validate that only defined roles are used
     * 3. Support standalone usage without application context
     * 
     * Example:
     * - Define in app: permissions.roles: [admin, manager, user]
     * - Reference here: roles: [admin, manager, user]
     */
    roles?: string[];
    
    /** Object-level permissions */
    object_permissions?: ObjectPermissions;
    
    /** Field-level security */
    field_permissions?: FieldPermissions;
    
    /** Record-level access rules */
    record_rules?: RecordRule[];
    
    /** Sharing rules */
    sharing_rules?: SharingRule[];
    
    /** Action permissions */
    action_permissions?: ActionPermissions;
    
    /** View permissions */
    view_permissions?: ViewPermissions;
    
    /** Row-level security */
    row_level_security?: RowLevelSecurity;
    
    /** Field masking */
    field_masking?: FieldMasking;
    
    /** Audit configuration */
    audit?: AuditConfig;
}

/**
 * Context for permission checks
 */
export interface PermissionCheckContext {
    /** Current user */
    user: {
        id: string;
        /** User roles (array for consistency, single role represented as one-element array) */
        roles?: string[];
        department_id?: string;
        team_id?: string;
        [key: string]: any;
    };
    /** Object name */
    object: string;
    /** Operation to check */
    operation: ObjectOperation | FieldOperation;
    /** Record ID (for record-level checks) */
    recordId?: string;
    /** Field name (for field-level checks) */
    field?: string;
    /** Record data (for condition evaluation) */
    record?: any;
}

/**
 * Result of a permission check
 */
export interface PermissionCheckResult {
    /** Whether permission is granted */
    granted: boolean;
    /** Reason if denied */
    reason?: string;
    /** Rule that granted/denied access */
    rule?: string;
}
