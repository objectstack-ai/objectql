# Permission & Security Metadata

Permission metadata defines access control rules for objects, fields, actions, and views. It implements role-based access control (RBAC) and field-level security.

## 1. Overview

ObjectQL's permission system provides:

- **Object-level permissions**: Control CRUD operations on entire objects
- **Field-level security**: Hide/protect sensitive fields from unauthorized users
- **Record-level rules**: Dynamic filtering based on ownership, sharing, or custom rules
- **Action permissions**: Control who can execute specific actions
- **View permissions**: Restrict access to specific UI views

**File Naming Convention:** `[object_name].permission.yml`

## 2. Root Structure

```yaml
name: project_permissions
object: projects
description: Permission rules for project object

# Role Definitions
roles:
  - admin
  - manager
  - developer
  - viewer

# Object-Level Permissions
object_permissions:
  create: [admin, manager]
  read: [admin, manager, developer, viewer]
  update: [admin, manager]
  delete: [admin]

# Field-Level Security
field_permissions:
  budget:
    read: [admin, manager]
    update: [admin]
  
  internal_notes:
    read: [admin, manager]
    update: [admin, manager]

# Record-Level Rules
record_rules:
  - name: owner_full_access
    description: Project owner has full access
    condition:
      field: owner_id
      operator: "="
      value: $current_user.id
    permissions:
      read: true
      update: true
      delete: true
  
  - name: team_member_access
    description: Team members can view and edit
    condition:
      field: team_members
      operator: contains
      value: $current_user.id
    permissions:
      read: true
      update: true
      delete: false

# Action Permissions
action_permissions:
  approve_project:
    execute: [admin, manager]
  
  archive_project:
    execute: [admin]
```

## 3. Object-Level Permissions

Control basic CRUD operations on objects.

| Permission | Description |
|:---|:---|
| `create` | Create new records |
| `read` | View existing records |
| `update` | Modify existing records |
| `delete` | Delete records |
| `view_all` | See all records (bypass ownership rules) |
| `modify_all` | Edit all records (bypass ownership rules) |

```yaml
object_permissions:
  # Standard users
  create: [user]
  read: [user]
  update: [user]  # Limited by record rules
  delete: []      # Nobody can delete
  
  # Admins have full access
  view_all: [admin]
  modify_all: [admin]
```

## 4. Field-Level Security

Restrict access to specific fields based on roles.

```yaml
field_permissions:
  # Sensitive field - admins only
  social_security_number:
    read: [admin, hr_manager]
    update: [admin]
  
  # Financial data - finance team only
  salary:
    read: [admin, finance_manager]
    update: [admin, finance_manager]
  
  # System fields - read-only for most users
  created_by:
    read: [admin, manager, user]
    update: []  # System managed
  
  # Public field - everyone can read
  name:
    read: [admin, manager, user, guest]
    update: [admin, manager, user]
```

### 4.1 Field Permission Inheritance

Fields inherit object-level permissions unless explicitly overridden.

```yaml
# If object read permission is [user], all fields are readable by [user]
# unless field_permissions specifies otherwise

object_permissions:
  read: [user]

field_permissions:
  # This field is MORE restrictive than object level
  salary:
    read: [admin]
```

## 5. Record-Level Rules

Dynamic access control based on record data and user context.

```yaml
record_rules:
  # Rule 1: Owner Access
  - name: owner_access
    priority: 100
    description: Record owner has full access
    condition:
      type: simple
      field: owner_id
      operator: "="
      value: $current_user.id
    permissions:
      read: true
      update: true
      delete: true
  
  # Rule 2: Department Access
  - name: department_access
    priority: 50
    description: Same department can view
    condition:
      type: simple
      field: department_id
      operator: "="
      value: $current_user.department_id
    permissions:
      read: true
      update: false
      delete: false
  
  # Rule 3: Complex Condition
  - name: approved_public_access
    priority: 10
    description: Approved records are public
    condition:
      type: complex
      expression:
        - field: status
          operator: "="
          value: approved
        - and
        - field: is_public
          operator: "="
          value: true
    permissions:
      read: true
      update: false
      delete: false
```

### 5.1 Rule Priority

When multiple rules match, the highest priority rule takes precedence. Default priority is 0.

### 5.2 Condition Types

| Type | Description |
|:---|:---|
| `simple` | Single field comparison |
| `complex` | Multiple conditions with AND/OR logic |
| `formula` | Custom JavaScript/formula expression |
| `lookup` | Check related record data |

### 5.3 Special Variables

Available in permission conditions:

| Variable | Description |
|:---|:---|
| `$current_user.id` | Current user's ID |
| `$current_user.role` | Current user's role |
| `$current_user.department_id` | User's department |
| `$current_user.team_id` | User's team |
| `$current_date` | Current date |
| `$current_timestamp` | Current timestamp |

## 6. Sharing Rules

Extend access beyond owner and role-based rules.

```yaml
sharing_rules:
  # Manual Sharing
  - name: manual_share
    type: manual
    description: Users can manually share records
    enabled: true
    permissions:
      read: true
      update: false
      delete: false
  
  # Criteria-based Sharing
  - name: public_projects
    type: criteria
    description: Public projects visible to all
    condition:
      field: visibility
      operator: "="
      value: public
    shared_with:
      type: role
      roles: [user, guest]
    permissions:
      read: true
      update: false
  
  # Team-based Sharing
  - name: team_sharing
    type: team
    description: Share with team members
    team_field: assigned_team_id
    permissions:
      read: true
      update: true
```

## 7. Profile-Based Permissions

Organize permissions into profiles for easier management.

```yaml
profiles:
  # System Administrator
  - name: system_admin
    label: System Administrator
    description: Full system access
    object_permissions:
      "*": [create, read, update, delete, view_all, modify_all]
    field_permissions:
      "*": [read, update]
  
  # Standard User
  - name: standard_user
    label: Standard User
    description: Regular user access
    object_permissions:
      projects: [create, read, update]
      tasks: [create, read, update, delete]
      reports: [read]
    field_permissions:
      projects.budget: [read]
      tasks.*: [read, update]
  
  # Read-Only
  - name: read_only
    label: Read Only
    description: View-only access
    object_permissions:
      "*": [read]
    field_permissions:
      "*": [read]
```

## 8. Permission Sets

Grant additional permissions beyond a user's profile.

```yaml
permission_sets:
  # Financial Data Access
  - name: finance_access
    label: Financial Data Access
    description: Grant access to financial fields
    field_permissions:
      "*.budget": [read, update]
      "*.cost": [read, update]
      "*.revenue": [read, update]
  
  # API Integration Access
  - name: api_access
    label: API Access
    description: Allow API access
    api_permissions:
      enabled: true
      rate_limit: 10000
      allowed_operations: [create, read, update]
```

## 9. Action Permissions

Control execution of custom actions.

```yaml
action_permissions:
  # Record Action
  approve_order:
    execute: [manager, admin]
    conditions:
      # Can only approve if order is pending
      - field: status
        operator: "="
        value: pending
      
      # Can only approve orders in their department
      - field: department_id
        operator: "="
        value: $current_user.department_id
  
  # Global Action
  import_data:
    execute: [admin]
    rate_limit:
      requests_per_hour: 10
```

## 10. View Permissions

Control access to specific views.

```yaml
view_permissions:
  # List View
  all_projects:
    access: [admin, manager, developer]
  
  # Kanban View
  project_kanban:
    access: [admin, manager]
  
  # Report View
  financial_dashboard:
    access: [admin, finance_manager]
    field_restrictions:
      profit_margin:
        visible_to: [admin]
```

## 11. Data Security Features

### 11.1 Row-Level Security

Automatically filter queries based on permissions.

```yaml
row_level_security:
  enabled: true
  default_rule:
    # Users only see their own records by default
    field: owner_id
    operator: "="
    value: $current_user.id
  
  exceptions:
    # Admins bypass RLS
    - role: admin
      bypass: true
    
    # Managers see their department
    - role: manager
      condition:
        field: department_id
        operator: "="
        value: $current_user.department_id
```

### 11.2 Field Masking

Mask sensitive data for unauthorized users.

```yaml
field_masking:
  # Credit Card Numbers
  credit_card:
    mask_format: "****-****-****-{last4}"
    visible_to: [admin, finance]
  
  # Email Addresses
  email:
    mask_format: "{first}***@{domain}"
    visible_to: [admin, user_owner]
  
  # Phone Numbers
  phone:
    mask_format: "***-***-{last4}"
    visible_to: [admin, hr]
```

### 11.3 Audit Trail

Track permission changes and access.

```yaml
audit:
  enabled: true
  
  # Log these events
  events:
    - permission_grant
    - permission_revoke
    - access_denied
    - sensitive_field_access
  
  # Retention period
  retention_days: 365
  
  # Alert on suspicious activity
  alerts:
    - event: access_denied
      threshold: 5
      window_minutes: 10
      notify: [security_team]
```

## 12. Implementation

### 12.1 Permission Check API

```typescript
// Check if user can perform operation
const canUpdate = await objectql.checkPermission({
  user: currentUser,
  object: 'projects',
  operation: 'update',
  recordId: 'proj_123'
});

// Check field access
const canViewSalary = await objectql.checkFieldPermission({
  user: currentUser,
  object: 'employees',
  field: 'salary',
  operation: 'read',
  recordId: 'emp_456'
});
```

### 12.2 Permission Context

Hooks and actions receive permission context:

```typescript
// In a hook
beforeUpdate: async ({ user, permissions }) => {
  if (!permissions.canUpdate('budget')) {
    throw new Error('No permission to update budget');
  }
}
```

## 13. Best Practices

1. **Principle of Least Privilege**: Grant minimum necessary permissions
2. **Role Hierarchy**: Use role inheritance to simplify management
3. **Test Permissions**: Validate permission rules with different user roles
4. **Document Rules**: Add clear descriptions to all permission rules
5. **Regular Audits**: Review permissions regularly for compliance
6. **Separation of Duties**: Prevent conflicts of interest with permission design
7. **Default Deny**: Deny access unless explicitly granted

## 14. Security Considerations

1. **SQL Injection**: All permission filters use parameterized queries
2. **Privilege Escalation**: Validate permission changes require admin access
3. **Session Management**: Permissions cached per session, invalidated on role change
4. **API Security**: Rate limiting on permission checks to prevent DoS
5. **Audit Logging**: All permission denials logged for security analysis

## 15. Related Specifications

- [Objects & Fields](./object.md) - Data model definition
- [Actions](./action.md) - Custom operations
- [Views](./view.md) - UI presentation
- [Hooks](./hook.md) - Business logic triggers
