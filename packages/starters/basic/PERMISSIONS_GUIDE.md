# Permission Metadata Guide

This guide demonstrates how to use ObjectQL's permission system to implement comprehensive access control for your applications using Role-Based Access Control (RBAC).

## Overview

ObjectQL provides a complete RBAC permission system that supports:

- **Role-Based Access Control**: Define roles and assign permissions based on roles
- **Object-level permissions**: Control CRUD operations on entire objects
- **Field-level security**: Hide/protect sensitive fields from unauthorized users
- **Record-level rules**: Dynamic filtering based on ownership, sharing, or custom rules
- **Action permissions**: Control who can execute specific actions
- **View permissions**: Restrict access to specific UI views
- **Security Features**: Row-level security, field masking, and audit trails

## File Structure

Permission metadata is defined in `.permission.yml` files:

```
src/
  main.app.yml              # Application definition with system roles
  projects.object.yml       # Object definition
  projects.permission.yml   # Permission rules for projects
  tasks.object.yml         # Object definition
  tasks.permission.yml     # Permission rules for tasks
```

## Role Definition Strategy

**Recommended Approach**: Define roles centrally in your application config:

```yaml
# main.app.yml
name: my_app
label: My Application
permissions:
  roles: [admin, manager, developer, user, viewer]
```

Then reference these roles in permission files:

```yaml
# projects.permission.yml
roles:
  - admin    # References role defined in main.app.yml
  - manager
  - user
```

This ensures consistency across all objects. The `roles` field in permission files serves as:
1. Documentation of which roles apply to this object
2. Validation that only defined roles are used
3. Backward compatibility for standalone usage

## Basic Example: Object-Level Permissions

The simplest permission configuration controls CRUD operations:

```yaml
# projects.permission.yml
name: projects_permission
object: projects
description: "Access control rules for Project object"

# Reference system roles (defined in main.app.yml)
roles:
  - admin
  - manager
  - user

object_permissions:
  create: [admin, manager]     # Who can create projects
  read: [admin, manager, user] # Who can view projects
  update: [admin, manager]     # Who can edit projects
  delete: [admin]              # Who can delete projects
```

## Field-Level Security

Control access to specific fields based on roles:

```yaml
field_permissions:
  budget:
    read: [admin, manager]     # Only managers and admins can see budget
    update: [admin]            # Only admins can change budget
  
  approved_by:
    read: [admin, manager, user]
    update: []                 # System-managed field, nobody can edit
```

## Record-Level Rules

Apply dynamic access control based on record data:

```yaml
record_rules:
  # Rule 1: Owner has full access
  - name: owner_full_access
    priority: 100
    description: Project owner has full access to their projects
    condition:
      type: simple
      field: owner
      operator: "="
      value: $current_user.id  # Special variable for current user
    permissions:
      read: true
      update: true
      delete: true
  
  # Rule 2: Completed projects are read-only
  - name: completed_readonly
    priority: 50
    description: Completed projects cannot be modified
    condition:
      type: simple
      field: status
      operator: "="
      value: completed
    permissions:
      read: true
      update: false
      delete: false
```

### Special Variables

Use these in permission conditions:

- `$current_user.id` - Current user's ID
- `$current_user.roles` - Current user's roles (array)
- `$current_user.department_id` - User's department
- `$current_user.team_id` - User's team
- `$current_date` - Current date
- `$current_timestamp` - Current timestamp

## Complex Conditions

For advanced scenarios, use complex or lookup conditions:

```yaml
record_rules:
  # Lookup condition - check related record
  - name: team_lead_access
    priority: 90
    description: Team leads can access tasks in their projects
    condition:
      type: lookup
      object: projects        # Related object
      via: project            # Field linking to related object
      condition:
        type: simple
        field: owner
        operator: "="
        value: $current_user.id
    permissions:
      read: true
      update: true
      delete: true
```

## Sharing Rules

Allow users to share records with others:

```yaml
sharing_rules:
  # Manual sharing
  - name: manual_share
    type: manual
    description: Users can manually share projects with team members
    enabled: true
    permissions:
      read: true
      update: false
      delete: false
  
  # Criteria-based automatic sharing
  - name: public_projects
    type: criteria
    description: Public projects visible to all
    condition:
      type: simple
      field: visibility
      operator: "="
      value: public
    shared_with:
      type: role
      roles: [user, viewer]
    permissions:
      read: true
      update: false
```

## Action Permissions

Control who can execute custom actions:

```yaml
action_permissions:
  approve:
    execute: [admin, manager]
    conditions:
      # Can only approve if status is in_progress
      - field: status
        operator: "="
        value: in_progress
  
  import_projects:
    execute: [admin]
    rate_limit:
      requests_per_hour: 10  # Prevent abuse
```

## View Permissions

Restrict access to specific views:

```yaml
view_permissions:
  all_projects:
    access: [admin, manager, developer, user, viewer]
    field_restrictions:
      budget:
        visible_to: [admin, manager]  # Hide budget in this view
```

## Row-Level Security

Automatically filter queries based on permissions:

```yaml
row_level_security:
  enabled: true
  default_rule:
    # By default, users only see their own records
    field: owner
    operator: "="
    value: $current_user.id
  exceptions:
    # Admins bypass RLS
    - role: admin
      bypass: true
    
    # Managers see their department's records
    - role: manager
      condition:
        type: simple
        field: department_id
        operator: "="
        value: $current_user.department_id
```

## Field Masking

Mask sensitive data for unauthorized users:

```yaml
field_masking:
  estimated_hours:
    mask_format: "***"
    visible_to: [admin, project_manager, team_lead]
  
  credit_card:
    mask_format: "****-****-****-{last4}"
    visible_to: [admin, finance]
  
  email:
    mask_format: "{first}***@{domain}"
    visible_to: [admin, user_owner]
```

## Audit Trail

Track permission changes and access:

```yaml
audit:
  enabled: true
  events:
    - permission_grant
    - permission_revoke
    - access_denied
    - sensitive_field_access
  retention_days: 365
  alerts:
    - event: access_denied
      threshold: 5           # Alert after 5 denials
      window_minutes: 10     # Within 10 minutes
      notify: [admin]        # Who to notify
```

## Complete Example

See the example files in this directory:

- `projects.permission.yml` - Comprehensive permission rules with all features
- `tasks.permission.yml` - Advanced scenarios with record-level rules and security features

## Best Practices

1. **Principle of Least Privilege**: Grant only the minimum permissions needed
2. **Define Clear Roles**: Create well-defined roles that match your organizational structure
3. **Test Thoroughly**: Validate permissions with different user roles
4. **Document Rules**: Add clear descriptions to all permission rules
5. **Regular Audits**: Review permissions regularly for compliance
6. **Default Deny**: Deny access unless explicitly granted
7. **Use Record Rules**: Leverage dynamic record-level rules for fine-grained control

## TypeScript Type Safety

ObjectQL generates TypeScript types from your permission metadata:

```typescript
import { PermissionConfig } from '@objectql/types';

// Your permission config is fully typed
const config: PermissionConfig = {
  name: 'my_permission',
  object: 'my_object',
  roles: ['admin', 'user'],
  object_permissions: {
    create: ['admin'],
    read: ['admin', 'user']
  }
};
```

## Next Steps

1. Review the specification: `docs/spec/permission.md`
2. Check the example files in this directory
3. Implement permissions for your objects
4. Test with different user roles
5. Enable audit logging for compliance

## Related Documentation

- [Object Definition](./projects.object.yml)
- [Hooks & Actions Guide](./HOOKS_ACTIONS_GUIDE.md)
- [Validation Rules](./projects.validation.yml)
