# @objectql/plugin-security

Security plugin for ObjectQL - Comprehensive RBAC, Field-Level Security, and Row-Level Security enforcement.

## Features

### 🔒 Role-Based Access Control (RBAC)
- Object-level permissions (create, read, update, delete, view_all, modify_all)
- Field-level permissions (read, update)
- Dynamic record-level rules with conditions

### 🎯 Row-Level Security (RLS)
- Automatic query filtering based on user permissions
- AST-level modifications for zero performance overhead
- Support for complex conditions (AND/OR logic)

### 🛡️ Field-Level Security (FLS)
- Automatic field masking for sensitive data
- Configurable mask formats (credit cards, emails, etc.)
- Role-based field visibility

### ⚡ Performance Optimized
- Pre-compilation of permission rules to bitmasks and lookup maps
- In-memory caching of permission checks
- Query trimming at AST level (before SQL generation)

### 📊 Audit Logging
- Track all permission checks and access attempts
- Configurable retention and alert thresholds

## Installation

```bash
pnpm add @objectql/plugin-security
```

## Quick Start

### 1. Define Permission Configuration

```typescript
import { PermissionConfig } from '@objectql/plugin-security';

const projectPermissions: PermissionConfig = {
  name: 'project_permissions',
  object: 'project',
  
  // Object-level permissions
  object_permissions: {
    create: ['admin', 'manager'],
    read: ['admin', 'manager', 'user'],
    update: ['admin', 'manager'],
    delete: ['admin'],
    view_all: ['admin'],
    modify_all: ['admin']
  },
  
  // Field-level security
  field_permissions: {
    budget: {
      read: ['admin', 'manager'],
      update: ['admin']
    },
    internal_notes: {
      read: ['admin'],
      update: ['admin']
    }
  },
  
  // Row-level security
  row_level_security: {
    enabled: true,
    default_rule: {
      field: 'owner_id',
      operator: '=',
      value: '$current_user.id'
    },
    exceptions: [
      {
        role: 'admin',
        bypass: true
      },
      {
        role: 'manager',
        condition: {
          field: 'department_id',
          operator: '=',
          value: '$current_user.department_id'
        }
      }
    ]
  },
  
  // Record-level rules
  record_rules: [
    {
      name: 'owner_can_edit',
      priority: 10,
      condition: {
        field: 'owner_id',
        operator: '=',
        value: '$current_user.id'
      },
      permissions: {
        read: true,
        update: true,
        delete: true
      }
    },
    {
      name: 'team_members_can_read',
      priority: 5,
      condition: {
        field: 'team_id',
        operator: '=',
        value: '$current_user.team_id'
      },
      permissions: {
        read: true
      }
    }
  ],
  
  // Field masking
  field_masking: {
    ssn: {
      mask_format: '***-**-{last4}',
      visible_to: ['admin']
    },
    credit_card: {
      mask_format: '****-****-****-{last4}',
      visible_to: ['admin', 'finance']
    }
  }
};
```

### 2. Register the Plugin

```typescript
import { ObjectQLSecurityPlugin } from '@objectql/plugin-security';
import { createKernel } from '@objectql/runtime';

const kernel = createKernel({
  plugins: [
    new ObjectQLSecurityPlugin({
      enabled: true,
      storageType: 'memory',
      permissions: [
        projectPermissions,
        // ... other permission configurations
      ],
      
      // Exemption list - skip security for these objects
      exemptObjects: ['system_config', 'public_data'],
      
      // Performance options
      precompileRules: true,
      enableCache: true,
      cacheTTL: 60000, // 1 minute
      
      // Behavior options
      throwOnDenied: true,
      enableAudit: true,
      
      // Feature toggles
      enableRowLevelSecurity: true,
      enableFieldLevelSecurity: true
    })
  ]
});
```

### 3. Use with ObjectQL

```typescript
// Security is automatically applied to all queries and mutations
const projects = await kernel.find('project', {
  filters: { status: 'active' }
});
// Results are automatically filtered by RLS and FLS

// Try to create a record
await kernel.create('project', {
  name: 'New Project',
  owner_id: currentUser.id
});
// Permission check is automatically performed
```

## Architecture

### Component Overview

```
┌─────────────────────────────────────────────────┐
│         ObjectQLSecurityPlugin                   │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌────────────────┐  ┌──────────────────┐      │
│  │ PermissionLoader│  │ PermissionGuard  │      │
│  │                 │  │                  │      │
│  │ - Load configs  │  │ - Check perms    │      │
│  │ - Pre-compile   │  │ - Cache results  │      │
│  │ - Bitmasks      │  │ - Audit logs     │      │
│  └────────────────┘  └──────────────────┘      │
│                                                  │
│  ┌────────────────┐  ┌──────────────────┐      │
│  │  QueryTrimmer   │  │   FieldMasker    │      │
│  │                 │  │                  │      │
│  │ - RLS filtering │  │ - FLS masking    │      │
│  │ - AST mods      │  │ - Field removal  │      │
│  │ - Row isolation │  │ - Value masking  │      │
│  └────────────────┘  └──────────────────┘      │
│                                                  │
└─────────────────────────────────────────────────┘
         ▲                    ▲
         │                    │
    beforeQuery          afterQuery
    beforeMutation
```

### Hooks Integration

The plugin registers three hooks:

1. **beforeQuery**: Applies row-level security by modifying query filters
2. **beforeMutation**: Checks permissions before create/update/delete operations
3. **afterQuery**: Applies field-level security to query results

## Advanced Usage

### Custom Permission Storage

```typescript
import { IPermissionStorage } from '@objectql/plugin-security';

class RedisPermissionStorage implements IPermissionStorage {
  async load(objectName: string) {
    // Load from Redis
  }
  
  async loadAll() {
    // Load all from Redis
  }
  
  async reload() {
    // Refresh cache
  }
}

const plugin = new ObjectQLSecurityPlugin({
  storageType: 'custom',
  storage: new RedisPermissionStorage()
});
```

### Complex Conditions

```typescript
const complexRule: RecordRule = {
  name: 'senior_managers_all_projects',
  priority: 20,
  condition: {
    type: 'complex',
    expression: [
      { field: 'status', operator: '=', value: 'active' },
      { field: 'priority', operator: '>=', value: 'high' },
      'and'
    ]
  },
  permissions: {
    read: true,
    update: true
  }
};
```

### Formula-Based Conditions

```typescript
const formulaRule: RecordRule = {
  name: 'custom_access_logic',
  condition: {
    type: 'formula',
    formula: 'record.created_by === user.id || user.roles.includes("admin")'
  },
  permissions: {
    read: true
  }
};
```

## Performance Considerations

### Pre-compilation
Permission rules are pre-compiled at startup into:
- **Bitmasks** for quick permission checks (O(1))
- **Lookup Maps** for role-based access (O(1))
- **Evaluator Functions** for condition matching (optimized)

### Caching
Permission check results are cached in-memory with configurable TTL:
```typescript
{
  enableCache: true,
  cacheTTL: 60000 // 1 minute
}
```

### Query Optimization
The QueryTrimmer operates at the AST level, modifying the query before it's sent to the database. This means:
- No post-filtering overhead
- Database can use indexes efficiently
- Minimal memory usage

## Security Best Practices

1. **Always define permissions explicitly** - Don't rely on defaults
2. **Use exemptObjects sparingly** - Only for truly public data
3. **Enable audit logging in production** - Track permission violations
4. **Regular permission reviews** - Audit who has access to what
5. **Principle of least privilege** - Grant minimum required permissions

## API Reference

See [API Documentation](./docs/api.md) for complete API reference.

## License

MIT
